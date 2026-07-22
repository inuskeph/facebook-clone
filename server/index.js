const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ===== IN-MEMORY DATABASE =====
const db = {
  users: [],
  posts: [],
  comments: [],
  messages: [],
  conversations: [],
  notifications: [],
  groups: [],
  pages: [],
  stories: [],
  marketplaceItems: [],
  friendRequests: [],
};

const generateId = () => crypto.randomBytes(8).toString('hex');
const JWT_SECRET = 'facebook-clone-secret-2024';

// Simple JWT implementation
function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  try {
    const [header, body, signature] = token.split('.');
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

// Simple password hashing
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + JWT_SECRET).digest('hex');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}


// ===== SEED DATABASE =====
function seedDatabase() {
  const hashedPw = hashPassword('password123');

  const users = [
    { id: generateId(), firstName: 'John', lastName: 'Doe', email: 'john@example.com', password: hashedPw, profilePicture: 'https://i.pravatar.cc/150?img=1', coverPhoto: 'https://picsum.photos/seed/cover1/1200/400', bio: 'Software developer | Tech enthusiast | Coffee lover', location: 'San Francisco, CA', workplace: 'Tech Corp Inc.', education: 'Stanford University', relationship: 'Single', website: 'https://johndoe.dev', friends: [], createdAt: '2023-01-15T00:00:00Z', isOnline: true, lastSeen: new Date().toISOString() },
    { id: generateId(), firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', password: hashedPw, profilePicture: 'https://i.pravatar.cc/150?img=5', coverPhoto: 'https://picsum.photos/seed/cover2/1200/400', bio: 'Designer & Artist | Creating beautiful things daily', location: 'New York, NY', workplace: 'Creative Studios', education: 'Parsons School of Design', relationship: 'In a relationship', website: 'https://janesmith.art', friends: [], createdAt: '2023-02-20T00:00:00Z', isOnline: true, lastSeen: new Date().toISOString() },
    { id: generateId(), firstName: 'Mike', lastName: 'Johnson', email: 'mike@example.com', password: hashedPw, profilePicture: 'https://i.pravatar.cc/150?img=3', coverPhoto: 'https://picsum.photos/seed/cover3/1200/400', bio: 'Photographer | Traveler | Mountain lover', location: 'Denver, CO', workplace: 'Freelance Photography', education: 'Colorado State University', relationship: 'Married', website: '', friends: [], createdAt: '2023-03-10T00:00:00Z', isOnline: false, lastSeen: new Date(Date.now() - 3600000).toISOString() },
    { id: generateId(), firstName: 'Sarah', lastName: 'Williams', email: 'sarah@example.com', password: hashedPw, profilePicture: 'https://i.pravatar.cc/150?img=9', coverPhoto: 'https://picsum.photos/seed/cover4/1200/400', bio: 'Marketing Manager | Foodie | Dog mom', location: 'Austin, TX', workplace: 'Digital Marketing Pro', education: 'UT Austin', relationship: 'Single', website: '', friends: [], createdAt: '2023-04-05T00:00:00Z', isOnline: true, lastSeen: new Date().toISOString() },
    { id: generateId(), firstName: 'Alex', lastName: 'Chen', email: 'alex@example.com', password: hashedPw, profilePicture: 'https://i.pravatar.cc/150?img=7', coverPhoto: 'https://picsum.photos/seed/cover5/1200/400', bio: 'Full-stack developer | Open source contributor | Gamer', location: 'Seattle, WA', workplace: 'StartupXYZ', education: 'MIT', relationship: 'In a relationship', website: 'https://alexchen.io', friends: [], createdAt: '2023-05-12T00:00:00Z', isOnline: false, lastSeen: new Date(Date.now() - 7200000).toISOString() },
  ];

  users[0].friends = [users[1].id, users[2].id, users[3].id];
  users[1].friends = [users[0].id, users[2].id, users[4].id];
  users[2].friends = [users[0].id, users[1].id, users[3].id, users[4].id];
  users[3].friends = [users[0].id, users[2].id];
  users[4].friends = [users[1].id, users[2].id];
  db.users.push(...users);

  // Posts
  const posts = [
    { id: generateId(), userId: users[0].id, content: 'Just finished building an amazing new project! The power of modern web tech never ceases to amaze me. Who else is building cool stuff this weekend? 🚀💻', images: ['https://picsum.photos/seed/post1/800/600'], likes: [users[1].id, users[2].id, users[3].id, users[4].id], shares: [users[1].id], privacy: 'public', feeling: 'excited', location: 'San Francisco, CA', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: generateId(), userId: users[1].id, content: 'New artwork completed! Spent 3 weeks on this digital painting. Art is not what you see, but what you make others see. 🎨✨', images: ['https://picsum.photos/seed/post2/800/800', 'https://picsum.photos/seed/post2b/800/600'], likes: [users[0].id, users[2].id, users[4].id], shares: [], privacy: 'public', feeling: 'accomplished', location: 'New York, NY', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: generateId(), userId: users[2].id, content: 'Captured this incredible sunset at Rocky Mountain National Park today. Nature never disappoints! 🌅🏔️', images: ['https://picsum.photos/seed/post3/1200/800'], likes: [users[0].id, users[1].id, users[3].id, users[4].id], shares: [users[0].id, users[3].id], privacy: 'public', feeling: 'blessed', location: 'Rocky Mountain National Park', createdAt: new Date(Date.now() - 14400000).toISOString() },
    { id: generateId(), userId: users[3].id, content: 'Best tacos in Austin! If you haven\'t tried this place, you\'re missing out. 10/10 recommend! 🌮🔥\n\nWho wants to join me next time?', images: ['https://picsum.photos/seed/post4/800/600'], likes: [users[0].id, users[2].id], shares: [], privacy: 'friends', feeling: 'happy', location: 'Austin, TX', createdAt: new Date(Date.now() - 28800000).toISOString() },
    { id: generateId(), userId: users[4].id, content: 'Just shipped a major feature at work! After months of hard work, it feels great to see it live. Teamwork makes the dream work! 🎉👨‍💻', images: [], likes: [users[0].id, users[1].id, users[2].id], shares: [users[0].id], privacy: 'public', feeling: 'proud', location: 'Seattle, WA', createdAt: new Date(Date.now() - 43200000).toISOString() },
    { id: generateId(), userId: users[0].id, content: 'Morning coffee and code. There\'s nothing like the sound of a keyboard at 6 AM. ☕💻\n\n#developer #morningroutine #coding', images: ['https://picsum.photos/seed/post5/600/600'], likes: [users[4].id, users[2].id], shares: [], privacy: 'public', feeling: 'motivated', location: '', createdAt: new Date(Date.now() - 86400000).toISOString() },
  ];
  db.posts.push(...posts);

  // Comments
  db.comments.push(
    { id: generateId(), postId: posts[0].id, userId: users[1].id, content: 'This looks amazing! Would love to see a demo 👏', likes: [users[0].id], createdAt: new Date(Date.now() - 3000000).toISOString() },
    { id: generateId(), postId: posts[0].id, userId: users[2].id, content: 'Keep it up! Modern web dev is awesome 🙌', likes: [users[0].id], createdAt: new Date(Date.now() - 2400000).toISOString() },
    { id: generateId(), postId: posts[1].id, userId: users[0].id, content: 'Wow this is stunning! You\'re incredibly talented! 🎨', likes: [users[1].id, users[4].id], createdAt: new Date(Date.now() - 6000000).toISOString() },
    { id: generateId(), postId: posts[2].id, userId: users[3].id, content: 'Gorgeous shot! I need to visit soon 😍', likes: [users[2].id], createdAt: new Date(Date.now() - 12000000).toISOString() },
  );


  // Conversations & Messages
  const conv1 = { id: generateId(), participants: [users[0].id, users[1].id], lastMessage: null, createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date().toISOString() };
  const conv2 = { id: generateId(), participants: [users[0].id, users[2].id], lastMessage: null, createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() };
  db.conversations.push(conv1, conv2);

  const msgs = [
    { id: generateId(), conversationId: conv1.id, senderId: users[0].id, content: 'Hey Jane! How\'s your new project going?', read: true, createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: generateId(), conversationId: conv1.id, senderId: users[1].id, content: 'Hi John! It\'s going great, almost done with the design phase!', read: true, createdAt: new Date(Date.now() - 6800000).toISOString() },
    { id: generateId(), conversationId: conv1.id, senderId: users[0].id, content: 'That\'s awesome! Can\'t wait to see the final result 🎉', read: true, createdAt: new Date(Date.now() - 6400000).toISOString() },
    { id: generateId(), conversationId: conv1.id, senderId: users[1].id, content: 'Thanks! Are you free this weekend for coffee?', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: generateId(), conversationId: conv2.id, senderId: users[2].id, content: 'John! Check out this sunset photo I took!', read: true, createdAt: new Date(Date.now() - 43200000).toISOString() },
    { id: generateId(), conversationId: conv2.id, senderId: users[0].id, content: 'That\'s incredible Mike! Where was this?', read: true, createdAt: new Date(Date.now() - 42000000).toISOString() },
  ];
  db.messages.push(...msgs);
  conv1.lastMessage = msgs[3].id;
  conv2.lastMessage = msgs[5].id;

  // Notifications
  db.notifications.push(
    { id: generateId(), userId: users[0].id, type: 'like', fromUserId: users[1].id, postId: posts[0].id, content: 'Jane Smith liked your post', read: false, createdAt: new Date(Date.now() - 1800000).toISOString() },
    { id: generateId(), userId: users[0].id, type: 'comment', fromUserId: users[2].id, postId: posts[0].id, content: 'Mike Johnson commented on your post', read: false, createdAt: new Date(Date.now() - 2400000).toISOString() },
    { id: generateId(), userId: users[0].id, type: 'friend_request', fromUserId: users[4].id, content: 'Alex Chen sent you a friend request', read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: generateId(), userId: users[0].id, type: 'share', fromUserId: users[3].id, postId: posts[5].id, content: 'Sarah Williams shared your post', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  );

  // Stories
  db.stories.push(
    { id: generateId(), userId: users[1].id, type: 'image', content: 'https://picsum.photos/seed/story1/1080/1920', text: 'Working on something new! 🎨', backgroundColor: '#1877f2', viewers: [users[0].id], createdAt: new Date(Date.now() - 3600000).toISOString(), expiresAt: new Date(Date.now() + 72000000).toISOString() },
    { id: generateId(), userId: users[2].id, type: 'image', content: 'https://picsum.photos/seed/story2/1080/1920', text: 'Mountain views 🏔️', backgroundColor: '#42b72a', viewers: [], createdAt: new Date(Date.now() - 7200000).toISOString(), expiresAt: new Date(Date.now() + 64800000).toISOString() },
    { id: generateId(), userId: users[3].id, type: 'text', content: '', text: 'Having the best day ever! ☀️🎉', backgroundColor: '#e74c3c', viewers: [users[0].id, users[2].id], createdAt: new Date(Date.now() - 14400000).toISOString(), expiresAt: new Date(Date.now() + 57600000).toISOString() },
    { id: generateId(), userId: users[4].id, type: 'image', content: 'https://picsum.photos/seed/story3/1080/1920', text: 'Code & Coffee ☕', backgroundColor: '#8e44ad', viewers: [users[0].id, users[1].id], createdAt: new Date(Date.now() - 18000000).toISOString(), expiresAt: new Date(Date.now() + 54000000).toISOString() },
  );

  // Groups
  db.groups.push(
    { id: generateId(), name: 'React Developers Community', description: 'A community for React developers to share knowledge and projects.', coverPhoto: 'https://picsum.photos/seed/group1/1200/400', privacy: 'public', adminIds: [users[0].id], memberIds: [users[0].id, users[1].id, users[2].id, users[4].id], posts: [], createdAt: '2023-06-01T00:00:00Z' },
    { id: generateId(), name: 'Photography Enthusiasts', description: 'Share your best shots and learn photography tips.', coverPhoto: 'https://picsum.photos/seed/group2/1200/400', privacy: 'public', adminIds: [users[2].id], memberIds: [users[0].id, users[1].id, users[2].id, users[3].id], posts: [], createdAt: '2023-07-15T00:00:00Z' },
    { id: generateId(), name: 'Austin Food Scene', description: 'Discover the best restaurants and food trucks in Austin!', coverPhoto: 'https://picsum.photos/seed/group3/1200/400', privacy: 'private', adminIds: [users[3].id], memberIds: [users[0].id, users[3].id], posts: [], createdAt: '2023-08-20T00:00:00Z' },
  );

  // Pages
  db.pages.push(
    { id: generateId(), name: 'TechCorp Official', category: 'Technology Company', description: 'Building the future of technology.', profilePicture: 'https://i.pravatar.cc/150?img=50', coverPhoto: 'https://picsum.photos/seed/page1/1200/400', adminIds: [users[0].id], followers: [users[0].id, users[1].id, users[4].id], likes: [users[0].id, users[1].id, users[2].id, users[4].id], createdAt: '2023-03-01T00:00:00Z' },
    { id: generateId(), name: 'Creative Studios Gallery', category: 'Art Gallery', description: 'Showcasing digital and traditional art.', profilePicture: 'https://i.pravatar.cc/150?img=51', coverPhoto: 'https://picsum.photos/seed/page2/1200/400', adminIds: [users[1].id], followers: [users[0].id, users[1].id, users[2].id, users[3].id], likes: [users[0].id, users[1].id, users[2].id, users[3].id, users[4].id], createdAt: '2023-04-15T00:00:00Z' },
  );

  // Marketplace
  db.marketplaceItems.push(
    { id: generateId(), sellerId: users[2].id, title: 'Canon EOS R5 Camera', description: 'Excellent condition, barely used. Comes with original box.', price: 2800, category: 'Electronics', condition: 'Like New', location: 'Denver, CO', images: ['https://picsum.photos/seed/item1/800/600'], status: 'available', createdAt: new Date(Date.now() - 172800000).toISOString() },
    { id: generateId(), sellerId: users[3].id, title: 'Vintage Coffee Table', description: 'Beautiful walnut coffee table from the 1960s.', price: 450, category: 'Home & Garden', condition: 'Good', location: 'Austin, TX', images: ['https://picsum.photos/seed/item2/800/600'], status: 'available', createdAt: new Date(Date.now() - 259200000).toISOString() },
    { id: generateId(), sellerId: users[4].id, title: 'Gaming PC - RTX 4080', description: 'Custom built gaming PC. RTX 4080, i9-13900K, 64GB RAM.', price: 2200, category: 'Electronics', condition: 'Like New', location: 'Seattle, WA', images: ['https://picsum.photos/seed/item3/800/600'], status: 'available', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: generateId(), sellerId: users[1].id, title: 'Wacom Cintiq 22" Drawing Tablet', description: 'Professional drawing tablet, includes pen and stand.', price: 800, category: 'Electronics', condition: 'Good', location: 'New York, NY', images: ['https://picsum.photos/seed/item4/800/600'], status: 'available', createdAt: new Date(Date.now() - 345600000).toISOString() },
    { id: generateId(), sellerId: users[0].id, title: 'Standing Desk - Uplift V2', description: 'Electric standing desk, 60x30 bamboo top.', price: 350, category: 'Home & Garden', condition: 'Good', location: 'San Francisco, CA', images: ['https://picsum.photos/seed/item5/800/600'], status: 'available', createdAt: new Date(Date.now() - 432000000).toISOString() },
  );

  // Friend requests
  db.friendRequests.push(
    { id: generateId(), fromUserId: users[4].id, toUserId: users[0].id, status: 'pending', createdAt: new Date(Date.now() - 86400000).toISOString() },
  );
}


// ===== API ROUTER =====
function getAuth(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const payload = verifyToken(auth.slice(7));
  return payload ? payload.userId : null;
}

function getUserSafe(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

function enrichPost(post, userId) {
  const author = db.users.find(u => u.id === post.userId);
  const comments = db.comments.filter(c => c.postId === post.id).map(c => {
    const cAuthor = db.users.find(u => u.id === c.userId);
    return { ...c, author: cAuthor ? { id: cAuthor.id, firstName: cAuthor.firstName, lastName: cAuthor.lastName, profilePicture: cAuthor.profilePicture } : null };
  });
  return {
    ...post,
    author: author ? { id: author.id, firstName: author.firstName, lastName: author.lastName, profilePicture: author.profilePicture } : null,
    comments,
    likesCount: post.likes.length,
    commentsCount: comments.length,
    sharesCount: post.shares.length,
    isLiked: post.likes.includes(userId),
  };
}

async function handleAPI(req, res, pathname, body) {
  const method = req.method;
  const userId = getAuth(req);

  // Auth routes
  if (pathname === '/api/auth/login' && method === 'POST') {
    const user = db.users.find(u => u.email === body.email);
    if (!user || !verifyPassword(body.password, user.password)) return send(res, 400, { message: 'Invalid credentials' });
    user.isOnline = true; user.lastSeen = new Date().toISOString();
    return send(res, 200, { token: createToken({ userId: user.id }), user: getUserSafe(user) });
  }

  if (pathname === '/api/auth/register' && method === 'POST') {
    if (db.users.find(u => u.email === body.email)) return send(res, 400, { message: 'Email already registered' });
    const newUser = { id: generateId(), firstName: body.firstName, lastName: body.lastName, email: body.email, password: hashPassword(body.password), profilePicture: `https://i.pravatar.cc/150?img=${Math.floor(Math.random()*70)}`, coverPhoto: `https://picsum.photos/seed/${Date.now()}/1200/400`, bio: '', location: '', workplace: '', education: '', relationship: '', website: '', friends: [], createdAt: new Date().toISOString(), isOnline: true, lastSeen: new Date().toISOString() };
    db.users.push(newUser);
    return send(res, 201, { token: createToken({ userId: newUser.id }), user: getUserSafe(newUser) });
  }

  if (pathname === '/api/auth/me' && method === 'GET') {
    if (!userId) return send(res, 401, { message: 'Unauthorized' });
    const user = db.users.find(u => u.id === userId);
    return send(res, 200, getUserSafe(user));
  }

  // All other routes require auth
  if (!userId) return send(res, 401, { message: 'Unauthorized' });
  const currentUser = db.users.find(u => u.id === userId);


  // Posts
  if (pathname === '/api/posts/feed' && method === 'GET') {
    const relevantIds = [...currentUser.friends, userId];
    const feedPosts = db.posts
      .filter(p => p.userId === userId || p.privacy === 'public' || (p.privacy === 'friends' && relevantIds.includes(p.userId)))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20)
      .map(p => enrichPost(p, userId));
    return send(res, 200, { posts: feedPosts });
  }

  const postUserMatch = pathname.match(/^\/api\/posts\/user\/(.+)$/);
  if (postUserMatch && method === 'GET') {
    const posts = db.posts.filter(p => p.userId === postUserMatch[1]).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(p => enrichPost(p, userId));
    return send(res, 200, posts);
  }

  if (pathname === '/api/posts' && method === 'POST') {
    const newPost = { id: generateId(), userId, content: body.content || '', images: body.images || [], likes: [], shares: [], privacy: body.privacy || 'public', feeling: body.feeling || '', location: body.location || '', createdAt: new Date().toISOString() };
    db.posts.unshift(newPost);
    return send(res, 201, enrichPost(newPost, userId));
  }

  const likeMatch = pathname.match(/^\/api\/posts\/(.+)\/like$/);
  if (likeMatch && method === 'PUT') {
    const post = db.posts.find(p => p.id === likeMatch[1]);
    if (!post) return send(res, 404, { message: 'Not found' });
    const idx = post.likes.indexOf(userId);
    if (idx === -1) { post.likes.push(userId); } else { post.likes.splice(idx, 1); }
    return send(res, 200, { likesCount: post.likes.length, isLiked: post.likes.includes(userId) });
  }

  const commentMatch = pathname.match(/^\/api\/posts\/(.+)\/comment$/);
  if (commentMatch && method === 'POST') {
    const post = db.posts.find(p => p.id === commentMatch[1]);
    if (!post) return send(res, 404, { message: 'Not found' });
    const comment = { id: generateId(), postId: commentMatch[1], userId, content: body.content, likes: [], createdAt: new Date().toISOString() };
    db.comments.push(comment);
    const author = db.users.find(u => u.id === userId);
    return send(res, 201, { ...comment, author: { id: author.id, firstName: author.firstName, lastName: author.lastName, profilePicture: author.profilePicture } });
  }

  const shareMatch = pathname.match(/^\/api\/posts\/(.+)\/share$/);
  if (shareMatch && method === 'POST') {
    const post = db.posts.find(p => p.id === shareMatch[1]);
    if (!post) return send(res, 404, { message: 'Not found' });
    if (!post.shares.includes(userId)) post.shares.push(userId);
    return send(res, 200, { sharesCount: post.shares.length });
  }

  // Users
  const userMatch = pathname.match(/^\/api\/users\/(.+)\/friends$/);
  if (userMatch && method === 'GET') {
    const u = db.users.find(x => x.id === userMatch[1]);
    if (!u) return send(res, 404, { message: 'Not found' });
    const friends = u.friends.map(fid => db.users.find(x => x.id === fid)).filter(Boolean).map(getUserSafe);
    return send(res, 200, friends);
  }

  if (pathname === '/api/users/suggestions/people' && method === 'GET') {
    const suggestions = db.users.filter(u => u.id !== userId && !currentUser.friends.includes(u.id)).map(u => {
      const mutual = u.friends.filter(f => currentUser.friends.includes(f)).length;
      return { ...getUserSafe(u), mutualFriends: mutual };
    }).sort((a, b) => b.mutualFriends - a.mutualFriends).slice(0, 10);
    return send(res, 200, suggestions);
  }

  const userProfileMatch = pathname.match(/^\/api\/users\/([^/]+)$/);
  if (userProfileMatch && method === 'GET') {
    const u = db.users.find(x => x.id === userProfileMatch[1]);
    if (!u) return send(res, 404, { message: 'Not found' });
    return send(res, 200, getUserSafe(u));
  }

  if (pathname === '/api/users/profile' && method === 'PUT') {
    const fields = ['firstName','lastName','bio','location','workplace','education','relationship','website','profilePicture','coverPhoto'];
    fields.forEach(f => { if (body[f] !== undefined) currentUser[f] = body[f]; });
    return send(res, 200, getUserSafe(currentUser));
  }


  // Friends
  if (pathname === '/api/friends/requests' && method === 'GET') {
    const requests = db.friendRequests.filter(r => r.toUserId === userId && r.status === 'pending').map(r => {
      const from = db.users.find(u => u.id === r.fromUserId);
      const mutual = from ? from.friends.filter(f => currentUser.friends.includes(f)).length : 0;
      return { ...r, fromUser: from ? { id: from.id, firstName: from.firstName, lastName: from.lastName, profilePicture: from.profilePicture, mutualFriends: mutual } : null };
    });
    return send(res, 200, requests);
  }

  const friendReqMatch = pathname.match(/^\/api\/friends\/request\/(.+)$/);
  if (friendReqMatch && method === 'POST') {
    const targetId = friendReqMatch[1];
    if (currentUser.friends.includes(targetId)) return send(res, 400, { message: 'Already friends' });
    const req2 = { id: generateId(), fromUserId: userId, toUserId: targetId, status: 'pending', createdAt: new Date().toISOString() };
    db.friendRequests.push(req2);
    return send(res, 201, req2);
  }

  const acceptMatch = pathname.match(/^\/api\/friends\/accept\/(.+)$/);
  if (acceptMatch && method === 'PUT') {
    const r = db.friendRequests.find(x => x.id === acceptMatch[1] && x.toUserId === userId && x.status === 'pending');
    if (!r) return send(res, 404, { message: 'Not found' });
    r.status = 'accepted';
    const other = db.users.find(u => u.id === r.fromUserId);
    if (!currentUser.friends.includes(other.id)) currentUser.friends.push(other.id);
    if (!other.friends.includes(userId)) other.friends.push(userId);
    return send(res, 200, { message: 'Accepted' });
  }

  const declineMatch = pathname.match(/^\/api\/friends\/decline\/(.+)$/);
  if (declineMatch && method === 'PUT') {
    const r = db.friendRequests.find(x => x.id === declineMatch[1] && x.toUserId === userId);
    if (r) r.status = 'declined';
    return send(res, 200, { message: 'Declined' });
  }

  // Messages
  if (pathname === '/api/messages/conversations' && method === 'GET') {
    const convs = db.conversations.filter(c => c.participants.includes(userId)).map(c => {
      const otherId = c.participants.find(p => p !== userId);
      const other = db.users.find(u => u.id === otherId);
      const lastMsg = db.messages.find(m => m.id === c.lastMessage);
      const unread = db.messages.filter(m => m.conversationId === c.id && m.senderId !== userId && !m.read).length;
      return { ...c, otherUser: other ? { id: other.id, firstName: other.firstName, lastName: other.lastName, profilePicture: other.profilePicture, isOnline: other.isOnline, lastSeen: other.lastSeen } : null, lastMessage: lastMsg, unreadCount: unread };
    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return send(res, 200, convs);
  }

  const convMatch = pathname.match(/^\/api\/messages\/conversations\/(.+)$/);
  if (convMatch && method === 'GET') {
    const conv = db.conversations.find(c => c.id === convMatch[1] && c.participants.includes(userId));
    if (!conv) return send(res, 404, { message: 'Not found' });
    const msgs = db.messages.filter(m => m.conversationId === convMatch[1]).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    msgs.forEach(m => { if (m.senderId !== userId) m.read = true; });
    const otherId = conv.participants.find(p => p !== userId);
    const other = db.users.find(u => u.id === otherId);
    return send(res, 200, { conversation: conv, messages: msgs, otherUser: other ? { id: other.id, firstName: other.firstName, lastName: other.lastName, profilePicture: other.profilePicture, isOnline: other.isOnline, lastSeen: other.lastSeen } : null });
  }

  if (pathname === '/api/messages/send' && method === 'POST') {
    let conv;
    if (body.conversationId) { conv = db.conversations.find(c => c.id === body.conversationId); }
    else {
      conv = db.conversations.find(c => c.participants.includes(userId) && c.participants.includes(body.recipientId));
      if (!conv) { conv = { id: generateId(), participants: [userId, body.recipientId], lastMessage: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; db.conversations.push(conv); }
    }
    const msg = { id: generateId(), conversationId: conv.id, senderId: userId, content: body.content, read: false, createdAt: new Date().toISOString() };
    db.messages.push(msg);
    conv.lastMessage = msg.id; conv.updatedAt = new Date().toISOString();
    return send(res, 201, msg);
  }


  // Notifications
  if (pathname === '/api/notifications' && method === 'GET') {
    const notifs = db.notifications.filter(n => n.userId === userId).map(n => {
      const from = db.users.find(u => u.id === n.fromUserId);
      return { ...n, fromUser: from ? { id: from.id, firstName: from.firstName, lastName: from.lastName, profilePicture: from.profilePicture } : null };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return send(res, 200, { notifications: notifs, unreadCount: notifs.filter(n => !n.read).length });
  }

  if (pathname === '/api/notifications/read-all' && method === 'PUT') {
    db.notifications.filter(n => n.userId === userId).forEach(n => n.read = true);
    return send(res, 200, { message: 'Done' });
  }

  // Stories
  if (pathname === '/api/stories/feed' && method === 'GET') {
    const now = new Date();
    const relevant = [...currentUser.friends, userId];
    const active = db.stories.filter(s => relevant.includes(s.userId) && new Date(s.expiresAt) > now);
    const groups = {};
    active.forEach(s => {
      if (!groups[s.userId]) { const u = db.users.find(x => x.id === s.userId); groups[s.userId] = { userId: s.userId, user: u ? { id: u.id, firstName: u.firstName, lastName: u.lastName, profilePicture: u.profilePicture } : null, stories: [], hasUnviewed: false }; }
      groups[s.userId].stories.push({ ...s, isViewed: s.viewers.includes(userId) });
      if (!s.viewers.includes(userId)) groups[s.userId].hasUnviewed = true;
    });
    const sorted = Object.values(groups).sort((a, b) => { if (a.userId === userId) return -1; if (b.userId === userId) return 1; return (b.hasUnviewed ? 1 : 0) - (a.hasUnviewed ? 1 : 0); });
    return send(res, 200, sorted);
  }

  if (pathname === '/api/stories' && method === 'POST') {
    const story = { id: generateId(), userId, type: body.type || 'text', content: body.content || '', text: body.text || '', backgroundColor: body.backgroundColor || '#1877f2', viewers: [], createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString() };
    db.stories.push(story);
    return send(res, 201, story);
  }

  // Groups
  if (pathname === '/api/groups' && method === 'GET') {
    return send(res, 200, db.groups.map(g => ({ ...g, membersCount: g.memberIds.length, isMember: g.memberIds.includes(userId), isAdmin: g.adminIds.includes(userId) })));
  }
  if (pathname === '/api/groups/my-groups' && method === 'GET') {
    return send(res, 200, db.groups.filter(g => g.memberIds.includes(userId)).map(g => ({ ...g, membersCount: g.memberIds.length, isMember: true, isAdmin: g.adminIds.includes(userId) })));
  }
  if (pathname === '/api/groups' && method === 'POST') {
    const g = { id: generateId(), name: body.name, description: body.description || '', coverPhoto: `https://picsum.photos/seed/${Date.now()}/1200/400`, privacy: body.privacy || 'public', adminIds: [userId], memberIds: [userId], posts: [], createdAt: new Date().toISOString() };
    db.groups.push(g);
    return send(res, 201, { ...g, membersCount: 1, isMember: true, isAdmin: true });
  }
  const groupJoinMatch = pathname.match(/^\/api\/groups\/(.+)\/join$/);
  if (groupJoinMatch && method === 'POST') {
    const g = db.groups.find(x => x.id === groupJoinMatch[1]);
    if (!g) return send(res, 404, { message: 'Not found' });
    if (!g.memberIds.includes(userId)) g.memberIds.push(userId);
    return send(res, 200, { membersCount: g.memberIds.length });
  }
  const groupLeaveMatch = pathname.match(/^\/api\/groups\/(.+)\/leave$/);
  if (groupLeaveMatch && method === 'POST') {
    const g = db.groups.find(x => x.id === groupLeaveMatch[1]);
    if (g) { g.memberIds = g.memberIds.filter(id => id !== userId); g.adminIds = g.adminIds.filter(id => id !== userId); }
    return send(res, 200, { message: 'Left' });
  }


  // Pages
  if (pathname === '/api/pages' && method === 'GET') {
    return send(res, 200, db.pages.map(p => ({ ...p, followersCount: p.followers.length, likesCount: p.likes.length, isFollowing: p.followers.includes(userId), isLiked: p.likes.includes(userId), isAdmin: p.adminIds.includes(userId) })));
  }
  if (pathname === '/api/pages' && method === 'POST') {
    const p = { id: generateId(), name: body.name, category: body.category || 'Business', description: body.description || '', profilePicture: `https://i.pravatar.cc/150?img=${Math.floor(Math.random()*70)}`, coverPhoto: `https://picsum.photos/seed/${Date.now()}/1200/400`, adminIds: [userId], followers: [userId], likes: [userId], createdAt: new Date().toISOString() };
    db.pages.push(p);
    return send(res, 201, { ...p, followersCount: 1, likesCount: 1, isFollowing: true, isLiked: true, isAdmin: true });
  }
  const pageLikeMatch = pathname.match(/^\/api\/pages\/(.+)\/like$/);
  if (pageLikeMatch && method === 'PUT') {
    const p = db.pages.find(x => x.id === pageLikeMatch[1]);
    if (!p) return send(res, 404, { message: 'Not found' });
    const idx = p.likes.indexOf(userId);
    if (idx === -1) { p.likes.push(userId); if (!p.followers.includes(userId)) p.followers.push(userId); }
    else { p.likes.splice(idx, 1); p.followers = p.followers.filter(f => f !== userId); }
    return send(res, 200, { likesCount: p.likes.length, followersCount: p.followers.length, isLiked: p.likes.includes(userId), isFollowing: p.followers.includes(userId) });
  }

  // Marketplace
  if (pathname === '/api/marketplace' && method === 'GET') {
    const url = new URL(req.url, `http://localhost`);
    const cat = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    let items = db.marketplaceItems.filter(i => i.status === 'available');
    if (cat) items = items.filter(i => i.category === cat);
    if (search) { const q = search.toLowerCase(); items = items.filter(i => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)); }
    const enriched = items.map(i => { const s = db.users.find(u => u.id === i.sellerId); return { ...i, seller: s ? { id: s.id, firstName: s.firstName, lastName: s.lastName, profilePicture: s.profilePicture, location: s.location } : null }; }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return send(res, 200, enriched);
  }
  if (pathname === '/api/marketplace' && method === 'POST') {
    const item = { id: generateId(), sellerId: userId, title: body.title, description: body.description || '', price: parseFloat(body.price) || 0, category: body.category || 'Other', condition: body.condition || 'Good', location: body.location || '', images: body.images || [`https://picsum.photos/seed/${Date.now()}/800/600`], status: 'available', createdAt: new Date().toISOString() };
    db.marketplaceItems.push(item);
    const seller = db.users.find(u => u.id === userId);
    return send(res, 201, { ...item, seller: { id: seller.id, firstName: seller.firstName, lastName: seller.lastName, profilePicture: seller.profilePicture, location: seller.location } });
  }

  // Search
  if (pathname === '/api/search' && method === 'GET') {
    const url = new URL(req.url, `http://localhost`);
    const q = (url.searchParams.get('q') || '').toLowerCase();
    const type = url.searchParams.get('type') || 'all';
    const results = {};
    if (!q) return send(res, 200, results);
    if (type === 'all' || type === 'people') results.users = db.users.filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)).map(getUserSafe).slice(0, 10);
    if (type === 'all' || type === 'posts') results.posts = db.posts.filter(p => p.content.toLowerCase().includes(q)).map(p => enrichPost(p, userId)).slice(0, 10);
    if (type === 'all' || type === 'groups') results.groups = db.groups.filter(g => g.name.toLowerCase().includes(q)).map(g => ({ ...g, membersCount: g.memberIds.length, isMember: g.memberIds.includes(userId) })).slice(0, 10);
    if (type === 'all' || type === 'pages') results.pages = db.pages.filter(p => p.name.toLowerCase().includes(q)).map(p => ({ ...p, likesCount: p.likes.length, followersCount: p.followers.length })).slice(0, 10);
    if (type === 'all' || type === 'marketplace') results.marketplace = db.marketplaceItems.filter(i => i.title.toLowerCase().includes(q)).slice(0, 10);
    return send(res, 200, results);
  }

  return send(res, 404, { message: 'Not found' });
}


// ===== HTTP SERVER =====
function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS' });
  res.end(JSON.stringify(data));
}

function serveStatic(res, filepath) {
  const ext = path.extname(filepath);
  const mimeTypes = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
  const contentType = mimeTypes[ext] || 'text/plain';
  
  fs.readFile(filepath, (err, data) => {
    if (err) {
      // Serve index.html for SPA routes
      fs.readFile(path.join(__dirname, '../public/index.html'), (err2, html) => {
        if (err2) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS' });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;

  // API routes
  if (pathname.startsWith('/api/')) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let parsed = {};
      try { parsed = body ? JSON.parse(body) : {}; } catch(e) {}
      req.url = parsedUrl.pathname + parsedUrl.search;
      handleAPI(req, res, pathname, parsed).catch(err => {
        console.error(err);
        send(res, 500, { message: 'Internal server error' });
      });
    });
    return;
  }

  // Static files
  const publicDir = path.join(__dirname, '../public');
  let filepath = path.join(publicDir, pathname === '/' ? 'index.html' : pathname);
  serveStatic(res, filepath);
});

const PORT = 3000;
seedDatabase();
server.listen(PORT, () => {
  console.log(`Facebook Clone running at http://localhost:${PORT}`);
  console.log(`Login: john@example.com / password123`);
});
