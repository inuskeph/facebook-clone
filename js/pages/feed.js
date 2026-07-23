// ============================================
// SocialVerse - Feed Page
// ============================================

const FeedPage = {
  render() {
    const p = App.state.profile || {};
    return `<div class="feed-layout">
      <aside class="feed-sidebar-left">
        <div class="sidebar-item" onclick="App.navigate('profile',{userId:'${App.state.user?.id}'})">
          <img src="${avatar(p.avatar_url)}" class="sidebar-avatar"><span>${p.first_name || ''} ${p.last_name || ''}</span>
        </div>
        <div class="sidebar-item" onclick="App.navigate('friends')">👥 Friends</div>
        <div class="sidebar-item" onclick="App.navigate('groups')">👨‍👩‍👧‍👦 Groups</div>
        <div class="sidebar-item" onclick="App.navigate('marketplace')">🏪 Marketplace</div>
        <div class="sidebar-item" onclick="App.navigate('pages')">📄 Pages</div>
        <div class="sidebar-item" onclick="App.navigate('messenger')">💬 Messenger</div>
      </aside>
      <main class="feed-main">
        <div class="stories-bar" id="storiesBar"></div>
        <div class="create-post-box" id="createPostBox">
          <div class="create-post-top">
            <img src="${avatar(p.avatar_url)}" class="avatar-sm">
            <button class="create-post-input" id="openCreatePost">What's on your mind, ${escapeHtml(p.first_name)}?</button>
          </div>
          <div class="create-post-actions">
            <button class="post-action-btn" id="openCreatePostPhoto">📷 Photo/Video</button>
            <button class="post-action-btn" id="openCreatePostFeeling">😊 Feeling/Activity</button>
          </div>
        </div>
        <div class="feed-posts" id="feedPosts"><div class="loading">Loading posts...</div></div>
      </main>
      <aside class="feed-sidebar-right">
        <h4 class="sidebar-heading">Contacts</h4>
        <div id="contactsList"></div>
      </aside>
    </div>`;
  },

  async load() {
    FeedPage.loadStories();
    FeedPage.loadPosts();
    FeedPage.loadContacts();
    FeedPage.attachEvents();
  },

  attachEvents() {
    document.getElementById('openCreatePost')?.addEventListener('click', () => FeedPage.openCreatePostModal());
    document.getElementById('openCreatePostPhoto')?.addEventListener('click', () => FeedPage.openCreatePostModal(true));
  },

  async loadStories() {
    try {
      const stories = await API.getStories();
      const bar = document.getElementById('storiesBar');
      if (!bar) return;

      // Group stories by user
      const groups = {};
      stories.forEach(s => {
        if (!groups[s.user_id]) groups[s.user_id] = { author: s.author, stories: [] };
        groups[s.user_id].stories.push(s);
      });
      const groupArr = Object.values(groups);

      bar.innerHTML = `
        <div class="story-card create-story" onclick="StoriesViewer.openCreateStory()">
          <img src="${avatar(App.state.profile?.avatar_url)}" class="story-bg">
          <div class="story-create-icon">+</div>
          <span class="story-name">Create Story</span>
        </div>
        ${groupArr.map((g, i) => `
          <div class="story-card" onclick="StoriesViewer.openViewer(window._storyGroups, ${i})">
            <img src="${g.stories[0].image_url || avatar(g.author.avatar_url)}" class="story-bg">
            <img src="${avatar(g.author.avatar_url)}" class="story-avatar">
            <span class="story-name">${escapeHtml(g.author.first_name)}</span>
          </div>
        `).join('')}`;

      window._storyGroups = groupArr;
    } catch (e) { console.error('Stories load error:', e); }
  },

  async loadPosts() {
    try {
      const posts = await API.getFeedPosts();
      const container = document.getElementById('feedPosts');
      if (!container) return;
      if (!posts.length) {
        container.innerHTML = '<div class="empty-state">No posts yet. Be the first to share something!</div>';
        return;
      }
      container.innerHTML = posts.map(post => FeedPage.renderPostCard(post)).join('');
    } catch (e) {
      const container = document.getElementById('feedPosts');
      if (container) container.innerHTML = '<div class="error-state">Failed to load posts</div>';
    }
  },

  async loadContacts() {
    try {
      const friends = await API.getFriends(App.state.user.id);
      const el = document.getElementById('contactsList');
      if (!el) return;
      el.innerHTML = friends.slice(0, 15).map(f => `
        <div class="contact-item" onclick="App.navigate('messenger',{friendId:'${f.friend.id}'})">
          <img src="${avatar(f.friend.avatar_url)}" class="avatar-sm">
          <span>${escapeHtml(f.friend.first_name)} ${escapeHtml(f.friend.last_name)}</span>
        </div>
      `).join('');
    } catch (e) { console.error('Contacts error:', e); }
  },

  renderPostCard(post) {
    const author = post.author || {};
    const userId = App.state.user.id;
    const likeCount = (post.likes || []).length;
    const commentCount = (post.comments || []).length;
    const userReaction = (post.reactions || []).find(r => r.user_id === userId);
    const hasLiked = (post.likes || []).some(l => l.user_id === userId);
    const reactionEmojis = { like: '👍', love: '❤️', haha: '😂', wow: '😮', sad: '😢', angry: '😡' };
    const displayReaction = userReaction ? reactionEmojis[userReaction.type] || '👍' : '👍';
    const reactionLabel = userReaction ? userReaction.type.charAt(0).toUpperCase() + userReaction.type.slice(1) : 'Like';

    return `<div class="post-card" id="post-${post.id}">
      <div class="post-header">
        <img src="${avatar(author.avatar_url)}" class="avatar-sm" onclick="App.navigate('profile',{userId:'${author.id}'})">
        <div class="post-info">
          <span class="post-author" onclick="App.navigate('profile',{userId:'${author.id}'})">${escapeHtml(author.first_name)} ${escapeHtml(author.last_name)}</span>
          <span class="post-time">${timeAgo(post.created_at)}</span>
        </div>
        ${post.user_id === userId ? `<button class="post-menu-btn" onclick="FeedPage.deletePost('${post.id}')">🗑️</button>` : ''}
      </div>
      <div class="post-content">${escapeHtml(post.content)}</div>
      ${post.image_url ? `<div class="post-image"><img src="${post.image_url}" alt="Post image"></div>` : ''}
      <div class="post-stats">
        <span>${likeCount > 0 ? `👍 ${formatNumber(likeCount)}` : ''}</span>
        <span>${commentCount > 0 ? `${formatNumber(commentCount)} comments` : ''}</span>
      </div>
      <div class="post-actions">
        <div class="reaction-wrapper">
          <button class="post-action ${hasLiked || userReaction ? 'active' : ''}" onclick="FeedPage.toggleLike('${post.id}')">
            ${displayReaction} ${reactionLabel}
          </button>
          <div class="reaction-popup" id="reactions-${post.id}">
            <button onclick="FeedPage.react('${post.id}','like')">👍</button>
            <button onclick="FeedPage.react('${post.id}','love')">❤️</button>
            <button onclick="FeedPage.react('${post.id}','haha')">😂</button>
            <button onclick="FeedPage.react('${post.id}','wow')">😮</button>
            <button onclick="FeedPage.react('${post.id}','sad')">😢</button>
            <button onclick="FeedPage.react('${post.id}','angry')">😡</button>
          </div>
        </div>
        <button class="post-action" onclick="FeedPage.toggleComments('${post.id}')">💬 Comment</button>
        <button class="post-action" onclick="FeedPage.sharePost('${post.id}')">↗️ Share</button>
      </div>
      <div class="comments-section" id="comments-${post.id}" style="display:none">
        <div class="comments-list" id="commentsList-${post.id}"></div>
        <div class="comment-input-wrapper">
          <img src="${avatar(App.state.profile?.avatar_url)}" class="avatar-xs">
          <input class="comment-input" placeholder="Write a comment..." id="commentInput-${post.id}" onkeydown="if(event.key==='Enter')FeedPage.submitComment('${post.id}')">
        </div>
      </div>
    </div>`;
  },

  async toggleLike(postId) {
    try {
      await API.toggleLike(postId, App.state.user.id);
      FeedPage.loadPosts();
    } catch (e) { UI.toast('Error', 'error'); }
  },

  async react(postId, type) {
    try {
      await API.react(postId, App.state.user.id, type);
      FeedPage.loadPosts();
    } catch (e) { UI.toast('Error', 'error'); }
  },

  async toggleComments(postId) {
    const section = document.getElementById(`comments-${postId}`);
    if (!section) return;
    if (section.style.display === 'none') {
      section.style.display = 'block';
      FeedPage.loadComments(postId);
    } else {
      section.style.display = 'none';
    }
  },

  async loadComments(postId) {
    try {
      const comments = await API.getComments(postId);
      const list = document.getElementById(`commentsList-${postId}`);
      if (!list) return;
      list.innerHTML = comments.map(c => `
        <div class="comment">
          <img src="${avatar(c.author?.avatar_url)}" class="avatar-xs">
          <div class="comment-body">
            <span class="comment-author">${escapeHtml(c.author?.first_name)} ${escapeHtml(c.author?.last_name)}</span>
            <span class="comment-text">${escapeHtml(c.content)}</span>
            <span class="comment-time">${timeAgo(c.created_at)}</span>
          </div>
        </div>
      `).join('');
    } catch (e) { console.error('Comments error:', e); }
  },

  async submitComment(postId) {
    const input = document.getElementById(`commentInput-${postId}`);
    const content = input?.value.trim();
    if (!content) return;
    input.value = '';
    try {
      await API.addComment(postId, App.state.user.id, content);
      FeedPage.loadComments(postId);
      FeedPage.loadPosts();
    } catch (e) { UI.toast('Failed to post comment', 'error'); }
  },

  async deletePost(postId) {
    if (!confirm('Delete this post?')) return;
    try {
      await API.deletePost(postId, App.state.user.id);
      document.getElementById(`post-${postId}`)?.remove();
      UI.toast('Post deleted', 'success');
    } catch (e) { UI.toast('Failed to delete post', 'error'); }
  },

  sharePost(postId) {
    UI.toast('Link copied!', 'success');
  },

  openCreatePostModal(showPhoto = false) {
    const p = App.state.profile || {};
    UI.openModal('Create Post', `
      <div class="create-post-modal">
        <div class="post-author-row">
          <img src="${avatar(p.avatar_url)}" class="avatar-sm">
          <span>${escapeHtml(p.first_name)} ${escapeHtml(p.last_name)}</span>
        </div>
        <textarea id="newPostContent" placeholder="What's on your mind, ${escapeHtml(p.first_name)}?" rows="4"></textarea>
        <div class="image-upload-section">
          <input type="file" id="postImageInput" accept="image/*" style="display:none">
          <button class="btn btn-outline" id="addPhotoBtn">📷 Add Photo</button>
          <div id="imagePreview" style="display:none">
            <img id="previewImg" style="max-width:100%;max-height:200px;border-radius:8px;margin-top:8px;">
            <button class="btn-icon" id="removeImageBtn" style="margin-top:4px;">✕ Remove</button>
          </div>
        </div>
      </div>
    `, `<button class="btn btn-primary btn-block" id="submitPostBtn">Post</button>`);

    if (showPhoto) {
      setTimeout(() => document.getElementById('postImageInput')?.click(), 100);
    }

    let selectedFile = null;

    document.getElementById('addPhotoBtn')?.addEventListener('click', () => {
      document.getElementById('postImageInput')?.click();
    });

    document.getElementById('postImageInput')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      selectedFile = file;
      const reader = new FileReader();
      reader.onload = (ev) => {
        document.getElementById('previewImg').src = ev.target.result;
        document.getElementById('imagePreview').style.display = 'block';
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('removeImageBtn')?.addEventListener('click', () => {
      selectedFile = null;
      document.getElementById('imagePreview').style.display = 'none';
      document.getElementById('postImageInput').value = '';
    });

    document.getElementById('submitPostBtn')?.addEventListener('click', async () => {
      const content = document.getElementById('newPostContent').value.trim();
      if (!content && !selectedFile) return UI.toast('Write something or add a photo', 'error');

      const btn = document.getElementById('submitPostBtn');
      btn.disabled = true;
      btn.textContent = 'Posting...';

      try {
        let imageUrl = null;
        if (selectedFile) {
          const ext = selectedFile.name.split('.').pop();
          const path = `${App.state.user.id}/${Date.now()}.${ext}`;
          imageUrl = await API.uploadImage('posts', path, selectedFile);
        }
        await API.createPost({
          user_id: App.state.user.id,
          content: content,
          image_url: imageUrl
        });
        UI.closeModal();
        UI.toast('Post created!', 'success');
        FeedPage.loadPosts();
      } catch (e) {
        UI.toast(e.message || 'Failed to create post', 'error');
        btn.disabled = false;
        btn.textContent = 'Post';
      }
    });
  }
};
