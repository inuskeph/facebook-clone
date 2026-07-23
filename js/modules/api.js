// ============================================
// SocialVerse - API / Database Layer
// ============================================

const API = {
  // Auth
  async login(email, password) {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signup(email, password, meta) {
    const { data, error } = await db.auth.signUp({ email, password, options: { data: meta } });
    if (error) throw error;
    return data;
  },

  async logout() {
    await db.auth.signOut();
  },

  async getSession() {
    const { data: { session } } = await db.auth.getSession();
    return session;
  },

  // Profiles
  async getProfile(userId) {
    const { data } = await db.from('profiles').select('*').eq('id', userId).maybeSingle();
    return data;
  },

  async updateProfile(userId, updates) {
    const { data } = await db.from('profiles').update(updates).eq('id', userId).select().maybeSingle();
    return data;
  },

  async searchProfiles(query) {
    const { data } = await db.from('profiles').select('*').or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`).limit(20);
    return data || [];
  },

  // Posts
  async getFeedPosts(limit = 30) {
    const { data } = await db.from('posts').select(`
      *, author:profiles!posts_user_id_fkey(id, first_name, last_name, avatar_url),
      comments(id), likes(user_id), reactions(user_id, type)
    `).order('created_at', { ascending: false }).limit(limit);
    return data || [];
  },

  async getUserPosts(userId) {
    const { data } = await db.from('posts').select(`
      *, author:profiles!posts_user_id_fkey(id, first_name, last_name, avatar_url),
      comments(id), likes(user_id), reactions(user_id, type)
    `).eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
  },

  async createPost(post) {
    const { data } = await db.from('posts').insert(post).select(`
      *, author:profiles!posts_user_id_fkey(id, first_name, last_name, avatar_url),
      comments(id), likes(user_id), reactions(user_id, type)
    `).maybeSingle();
    return data;
  },

  async deletePost(postId, userId) {
    await db.from('posts').delete().eq('id', postId).eq('user_id', userId);
  },

  // Likes & Reactions
  async toggleLike(postId, userId) {
    const { data: existing } = await db.from('likes').select('id').eq('post_id', postId).eq('user_id', userId).maybeSingle();
    if (existing) {
      await db.from('likes').delete().eq('id', existing.id);
      return false;
    } else {
      await db.from('likes').insert({ post_id: postId, user_id: userId });
      return true;
    }
  },

  async getLikeCount(postId) {
    const { count } = await db.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', postId);
    return count || 0;
  },

  async react(postId, userId, type) {
    await db.from('reactions').upsert({ post_id: postId, user_id: userId, type }, { onConflict: 'post_id,user_id' });
  },

  // Comments
  async getComments(postId) {
    const { data } = await db.from('comments').select('*, author:profiles!comments_user_id_fkey(id, first_name, last_name, avatar_url)').eq('post_id', postId).order('created_at');
    return data || [];
  },

  async addComment(postId, userId, content) {
    const { data } = await db.from('comments').insert({ post_id: postId, user_id: userId, content }).select('*, author:profiles!comments_user_id_fkey(id, first_name, last_name, avatar_url)').maybeSingle();
    return data;
  },

  // Friends
  async getFriends(userId) {
    const { data } = await db.from('friends').select('*, friend:profiles!friends_friend_id_fkey(id, first_name, last_name, avatar_url, location)').eq('user_id', userId).eq('status', 'accepted');
    return data || [];
  },

  async getFriendRequests(userId) {
    const { data } = await db.from('friends').select('*, from:profiles!friends_user_id_fkey(id, first_name, last_name, avatar_url)').eq('friend_id', userId).eq('status', 'pending');
    return data || [];
  },

  async sendFriendRequest(fromId, toId) {
    await db.from('friends').insert({ user_id: fromId, friend_id: toId, status: 'pending' });
  },

  async acceptFriendRequest(requestId) {
    const { data: req } = await db.from('friends').update({ status: 'accepted' }).eq('id', requestId).select().maybeSingle();
    // Create reverse friendship
    if (req) {
      await db.from('friends').upsert({ user_id: req.friend_id, friend_id: req.user_id, status: 'accepted' }, { onConflict: 'user_id,friend_id' });
    }
  },

  async declineFriendRequest(requestId) {
    await db.from('friends').delete().eq('id', requestId);
  },

  async getSuggestions(userId) {
    const { data: friends } = await db.from('friends').select('friend_id').eq('user_id', userId);
    const friendIds = (friends || []).map(f => f.friend_id);
    friendIds.push(userId);
    const { data } = await db.from('profiles').select('*').not('id', 'in', `(${friendIds.join(',')})`).limit(12);
    return data || [];
  },

  // Messenger
  async getConversations(userId) {
    const { data } = await db.from('conversations').select(`*,
      participant1:profiles!conversations_user1_id_fkey(id, first_name, last_name, avatar_url),
      participant2:profiles!conversations_user2_id_fkey(id, first_name, last_name, avatar_url)
    `).or(`user1_id.eq.${userId},user2_id.eq.${userId}`).order('updated_at', { ascending: false });
    return data || [];
  },

  async getMessages(conversationId) {
    const { data } = await db.from('messages').select('*').eq('conversation_id', conversationId).order('created_at');
    return data || [];
  },

  async sendMessage(conversationId, senderId, content) {
    const { data } = await db.from('messages').insert({ conversation_id: conversationId, sender_id: senderId, content }).select().maybeSingle();
    await db.from('conversations').update({ last_message: content, updated_at: new Date().toISOString() }).eq('id', conversationId);
    return data;
  },

  async getOrCreateConversation(userId1, userId2) {
    // Check existing
    const { data: existing } = await db.from('conversations')
      .select('*').or(`and(user1_id.eq.${userId1},user2_id.eq.${userId2}),and(user1_id.eq.${userId2},user2_id.eq.${userId1})`).maybeSingle();
    if (existing) return existing;
    const { data } = await db.from('conversations').insert({ user1_id: userId1, user2_id: userId2 }).select().maybeSingle();
    return data;
  },

  // Stories
  async getStories() {
    const { data } = await db.from('stories').select('*, author:profiles!stories_user_id_fkey(id, first_name, last_name, avatar_url)')
      .gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false });
    return data || [];
  },

  async createStory(story) {
    await db.from('stories').insert(story);
  },

  async viewStory(storyId, userId) {
    await db.from('story_views').upsert({ story_id: storyId, user_id: userId }, { onConflict: 'story_id,user_id' });
  },

  // Notifications
  async getNotifications(userId) {
    const { data } = await db.from('notifications').select('*, from_user:profiles!notifications_from_user_id_fkey(id, first_name, last_name, avatar_url)')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(30);
    return data || [];
  },

  async getUnreadCount(userId) {
    const { count } = await db.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('read', false);
    return count || 0;
  },

  async markNotificationsRead(userId) {
    await db.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
  },

  // Groups
  async getGroups() {
    const { data } = await db.from('groups').select('*, members:group_members(user_id)');
    return data || [];
  },

  async createGroup(group) {
    const { data } = await db.from('groups').insert(group).select().maybeSingle();
    return data;
  },

  async joinGroup(groupId, userId) {
    await db.from('group_members').insert({ group_id: groupId, user_id: userId });
  },

  async leaveGroup(groupId, userId) {
    await db.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId);
  },

  // Pages
  async getPages() {
    const { data } = await db.from('pages').select('*, followers:page_likes(user_id)');
    return data || [];
  },

  async createPage(page) {
    await db.from('pages').insert(page);
  },

  async togglePageLike(pageId, userId) {
    const { data: existing } = await db.from('page_likes').select('id').eq('page_id', pageId).eq('user_id', userId).maybeSingle();
    if (existing) await db.from('page_likes').delete().eq('id', existing.id);
    else await db.from('page_likes').insert({ page_id: pageId, user_id: userId });
  },

  // Marketplace
  async getMarketplaceItems(filters = {}) {
    let query = db.from('marketplace_items').select('*, seller:profiles!marketplace_items_seller_id_fkey(id, first_name, last_name, avatar_url, location)').eq('status', 'available').order('created_at', { ascending: false });
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.search) query = query.ilike('title', `%${filters.search}%`);
    const { data } = await query;
    return data || [];
  },

  async createListing(item) {
    await db.from('marketplace_items').insert(item);
  },

  // File Upload
  async uploadImage(bucket, path, file) {
    const { data, error } = await db.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = db.storage.from(bucket).getPublicUrl(data.path);
    return publicUrl;
  },

  // Search
  async search(query, type = 'all') {
    const results = {};
    if (type === 'all' || type === 'people') results.people = await this.searchProfiles(query);
    if (type === 'all' || type === 'posts') {
      const { data } = await db.from('posts').select('*, author:profiles!posts_user_id_fkey(id, first_name, last_name, avatar_url)').ilike('content', `%${query}%`).limit(10);
      results.posts = data || [];
    }
    if (type === 'all' || type === 'groups') {
      const { data } = await db.from('groups').select('*').ilike('name', `%${query}%`).limit(10);
      results.groups = data || [];
    }
    return results;
  }
};
