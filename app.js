// ============================================================
// FACEBOOK CLONE - Supabase Edition
// ============================================================
// SETUP: Replace these with your Supabase project credentials
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Check if Supabase SDK loaded and credentials are set
if (!window.supabase) {
  document.getElementById('app').innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;padding:20px;text-align:center"><div><h1 style="color:#1877f2;margin-bottom:16px">Facebook Clone</h1><p style="font-size:18px;color:#65676b;margin-bottom:16px">Supabase SDK failed to load.</p><p>Make sure you are running this from a local server (not file://)<br><code style="background:#f0f2f5;padding:4px 8px;border-radius:4px">python3 -m http.server 3000</code></p></div></div>';
  throw new Error('Supabase SDK not loaded');
}

if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
  document.getElementById('app').innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;padding:20px;text-align:center"><div><h1 style="color:#1877f2;margin-bottom:16px">Facebook Clone</h1><p style="font-size:18px;color:#65676b;margin-bottom:16px">Please configure your Supabase credentials!</p><p style="margin-bottom:12px">Open <code style="background:#f0f2f5;padding:4px 8px;border-radius:4px">app.js</code> and replace:</p><pre style="background:#f0f2f5;padding:16px;border-radius:8px;text-align:left;display:inline-block;font-size:14px">const SUPABASE_URL = \'https://your-project.supabase.co\';\nconst SUPABASE_ANON_KEY = \'your-anon-key\';</pre><p style="margin-top:16px;color:#65676b">Find these in Supabase Dashboard → Settings → API</p></div></div>';
  throw new Error('Supabase not configured');
}

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let state = { user: null, profile: null, currentPage: 'feed', pageParams: {} };

// ===== HELPERS =====
function timeAgo(d) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  if (s < 604800) return Math.floor(s / 86400) + 'd';
  return new Date(d).toLocaleDateString();
}
function escapeHtml(str) { if (!str) return ''; const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
function avatar(url) { return url || 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random()*70); }

// ===== NAVIGATION =====
function navigate(page, params = {}) {
  state.currentPage = page;
  state.pageParams = params;
  render();
  if (state.user) setTimeout(loadPageData, 50);
}

// ===== RENDER =====
function render() {
  const app = document.getElementById('app');
  if (!state.user) {
    app.innerHTML = renderAuth();
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('showRegister')?.addEventListener('click', showRegisterForm);
    return;
  }
  app.innerHTML = renderHeader() + `<div class="main">${renderPage()}</div>`;
  attachEvents();
}

function renderPage() {
  switch (state.currentPage) {
    case 'feed': return renderFeed();
    case 'profile': return renderProfile();
    case 'friends': return renderFriends();
    case 'messenger': return renderMessenger();
    case 'groups': return renderGroups();
    case 'pages': return renderPages();
    case 'marketplace': return renderMarketplace();
    case 'search': return renderSearch();
    default: return renderFeed();
  }
}

function loadPageData() {
  if (!state.user) return;
  const loaders = { feed: loadFeed, profile: loadProfile, friends: loadFriends, messenger: loadMessenger, groups: loadGroups, pages: loadPages, marketplace: loadMarketplace, search: loadSearch };
  loaders[state.currentPage]?.();
}

function attachEvents() {
  document.getElementById('searchForm')?.addEventListener('submit', e => { e.preventDefault(); const q = document.getElementById('searchInput').value; if (q.trim()) navigate('search', { q }); });
  document.getElementById('notifBtn')?.addEventListener('click', toggleNotifications);
  document.getElementById('avatarBtn')?.addEventListener('click', toggleUserMenu);
  document.addEventListener('click', e => {
    if (!e.target.closest('#notifBtn')) { const d = document.getElementById('notifDrop'); if (d) d.style.display = 'none'; }
    if (!e.target.closest('#avatarBtn') && !e.target.closest('#userDrop')) { const d = document.getElementById('userDrop'); if (d) d.style.display = 'none'; }
  });
  loadNotifBadge();
}


// ===== AUTH =====
function renderAuth() {
  return `<div class="auth-page"><div class="auth-container">
    <div class="auth-left"><h1>facebook</h1><p>Connect with friends and the world around you on Facebook.</p></div>
    <div class="auth-right">
      <form class="auth-form" id="loginForm">
        <input name="email" type="email" placeholder="Email address" required>
        <input name="password" type="password" placeholder="Password" required>
        <div id="authError" class="auth-error"></div>
        <button type="submit" class="btn-login">Log In</button>
      </form>
      <div class="divider"></div>
      <button class="btn-create" id="showRegister">Create new account</button>
    </div>
  </div></div>`;
}

async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const { data, error } = await db.auth.signInWithPassword({ email: form.email.value, password: form.password.value });
  if (error) { document.getElementById('authError').textContent = error.message; return; }
  state.user = data.user;
  await loadUserProfile();
  navigate('feed');
}

function showRegisterForm() {
  document.querySelector('.auth-right').innerHTML = `<h2 style="text-align:center;margin-bottom:16px">Create a new account</h2>
    <form class="auth-form" id="registerForm">
      <input name="firstName" placeholder="First name" required>
      <input name="lastName" placeholder="Last name" required>
      <input name="email" type="email" placeholder="Email address" required>
      <input name="password" type="password" placeholder="New password" minlength="6" required>
      <div id="authError" class="auth-error"></div>
      <button type="submit" class="btn-login" style="background:var(--green)">Sign Up</button>
    </form>
    <p class="auth-link" onclick="render()">Already have an account?</p>`;
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
}

async function handleRegister(e) {
  e.preventDefault();
  const f = e.target;
  const { data, error } = await db.auth.signUp({ email: f.email.value, password: f.password.value, options: { data: { first_name: f.firstName.value, last_name: f.lastName.value } } });
  if (error) { document.getElementById('authError').textContent = error.message; return; }
  // Create profile
  if (data.user) {
    await db.from('profiles').insert({ id: data.user.id, first_name: f.firstName.value, last_name: f.lastName.value, email: f.email.value, avatar_url: `https://i.pravatar.cc/150?img=${Math.floor(Math.random()*70)}`, cover_url: `https://picsum.photos/seed/${Date.now()}/1200/400` });
    state.user = data.user;
    await loadUserProfile();
    navigate('feed');
  } else {
    document.getElementById('authError').textContent = 'Check your email to confirm your account!';
    document.getElementById('authError').style.color = 'var(--green)';
  }
}

async function loadUserProfile() {
  if (!state.user) return;
  const { data } = await db.from('profiles').select('*').eq('id', state.user.id).single();
  state.profile = data;
}

async function logout() {
  await db.auth.signOut();
  state.user = null; state.profile = null;
  render();
}


// ===== HEADER =====
function renderHeader() {
  const p = state.profile || {};
  return `<header class="header">
    <div class="header-left">
      <div class="logo" onclick="navigate('feed')">facebook</div>
      <form class="search-box" id="searchForm"><span class="search-icon">🔍</span><input placeholder="Search Facebook" id="searchInput"></form>
    </div>
    <nav class="header-center">
      <div class="nav-item ${state.currentPage==='feed'?'active':''}" onclick="navigate('feed')">🏠</div>
      <div class="nav-item ${state.currentPage==='friends'?'active':''}" onclick="navigate('friends')">👥</div>
      <div class="nav-item ${state.currentPage==='groups'?'active':''}" onclick="navigate('groups')">👨‍👩‍👧‍👦</div>
      <div class="nav-item ${state.currentPage==='marketplace'?'active':''}" onclick="navigate('marketplace')">🏪</div>
      <div class="nav-item ${state.currentPage==='pages'?'active':''}" onclick="navigate('pages')">📄</div>
    </nav>
    <div class="header-right">
      <div class="icon-btn" onclick="navigate('messenger')">💬</div>
      <div class="icon-btn" id="notifBtn" style="position:relative">🔔<span class="badge" id="notifBadge" style="display:none"></span><div class="dropdown" id="notifDrop" style="display:none"></div></div>
      <div style="position:relative"><img src="${avatar(p.avatar_url)}" class="avatar-btn" id="avatarBtn"><div class="dropdown" id="userDrop" style="display:none;width:280px"></div></div>
    </div>
  </header>`;
}

async function loadNotifBadge() {
  const { count } = await db.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', state.user.id).eq('read', false);
  const badge = document.getElementById('notifBadge');
  if (badge && count > 0) { badge.textContent = count; badge.style.display = 'flex'; }
}

async function toggleNotifications() {
  const drop = document.getElementById('notifDrop');
  if (drop.style.display !== 'none') { drop.style.display = 'none'; return; }
  const { data } = await db.from('notifications').select('*, from_user:profiles!notifications_from_user_id_fkey(id, first_name, last_name, avatar_url)').eq('user_id', state.user.id).order('created_at', { ascending: false }).limit(15);
  await db.from('notifications').update({ read: true }).eq('user_id', state.user.id).eq('read', false);
  document.getElementById('notifBadge').style.display = 'none';
  drop.innerHTML = `<h3>Notifications</h3>${!data?.length ? '<p style="padding:16px;text-align:center;color:var(--text2)">No notifications</p>' : data.map(n => `
    <div class="notif-item ${n.read?'':'unread'}">
      <img src="${avatar(n.from_user?.avatar_url)}">
      <div class="notif-content"><p>${escapeHtml(n.content)}</p><span class="n-time">${timeAgo(n.created_at)}</span></div>
    </div>`).join('')}`;
  drop.style.display = 'block';
}

function toggleUserMenu() {
  const drop = document.getElementById('userDrop');
  if (drop.style.display !== 'none') { drop.style.display = 'none'; return; }
  const p = state.profile || {};
  drop.innerHTML = `<div style="padding:8px">
    <div class="sidebar-item" onclick="navigate('profile',{userId:'${state.user.id}'})"><img src="${avatar(p.avatar_url)}"><span>${p.first_name} ${p.last_name}</span></div>
    <div style="border-top:1px solid var(--border);margin:8px 0"></div>
    <div class="sidebar-item" onclick="logout()"><span class="s-icon">🚪</span><span>Log Out</span></div>
  </div>`;
  drop.style.display = 'block';
}


// ===== FEED =====
function renderFeed() {
  const p = state.profile || {};
  return `<div class="feed-layout">
    <aside class="sidebar-left">
      <div class="sidebar-item" onclick="navigate('profile',{userId:'${state.user.id}'})"><img src="${avatar(p.avatar_url)}"><span>${p.first_name||''} ${p.last_name||''}</span></div>
      <div class="sidebar-item" onclick="navigate('friends')"><span class="s-icon">👥</span><span>Friends</span></div>
      <div class="sidebar-item" onclick="navigate('groups')"><span class="s-icon">👨‍👩‍👧‍👦</span><span>Groups</span></div>
      <div class="sidebar-item" onclick="navigate('marketplace')"><span class="s-icon">🏪</span><span>Marketplace</span></div>
      <div class="sidebar-item" onclick="navigate('messenger')"><span class="s-icon">💬</span><span>Messenger</span></div>
      <div class="sidebar-item" onclick="navigate('pages')"><span class="s-icon">📄</span><span>Pages</span></div>
    </aside>
    <main class="feed-center">
      <div id="storiesArea"></div>
      <div class="create-post">
        <div class="create-post-top"><img src="${avatar(p.avatar_url)}"><button onclick="openCreatePost()">What's on your mind, ${p.first_name||''}?</button></div>
        <div class="create-post-actions">
          <button class="cp-action" onclick="openCreatePost()">📹 Live Video</button>
          <button class="cp-action" onclick="openCreatePost()">🖼️ Photo/Video</button>
          <button class="cp-action" onclick="openCreatePost()">😊 Feeling</button>
        </div>
      </div>
      <div id="feedPosts"><div class="loading">Loading posts...</div></div>
    </main>
    <aside class="sidebar-right"><div class="contacts" id="contactsList"><h4>Contacts</h4></div></aside>
  </div>`;
}

async function loadFeed() {
  // Load posts with author profiles, likes count
  const { data: posts } = await db.from('posts').select('*, author:profiles!posts_user_id_fkey(id, first_name, last_name, avatar_url), comments(id), likes(user_id)').order('created_at', { ascending: false }).limit(20);

  if (posts) {
    const html = posts.map(post => renderPostCard({ ...post, likesCount: post.likes?.length || 0, commentsCount: post.comments?.length || 0, isLiked: post.likes?.some(l => l.user_id === state.user.id) })).join('');
    document.getElementById('feedPosts').innerHTML = html || '<div class="loading">No posts yet. Create one!</div>';
  }

  // Load stories
  const { data: stories } = await db.from('stories').select('*, author:profiles!stories_user_id_fkey(id, first_name, last_name, avatar_url)').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false });
  if (stories) {
    const groups = {};
    stories.forEach(s => { if (!groups[s.user_id]) groups[s.user_id] = { user: s.author, stories: [] }; groups[s.user_id].stories.push(s); });
    document.getElementById('storiesArea').innerHTML = renderStories(Object.values(groups));
  }

  // Load friends for contacts
  const { data: friendships } = await db.from('friends').select('*, friend:profiles!friends_friend_id_fkey(id, first_name, last_name, avatar_url)').eq('user_id', state.user.id).eq('status', 'accepted');
  if (friendships) {
    document.getElementById('contactsList').innerHTML = `<h4>Contacts</h4>${friendships.map(f => `
      <div class="contact" onclick="navigate('profile',{userId:'${f.friend.id}'})">
        <div class="contact-av"><img src="${avatar(f.friend.avatar_url)}"><div class="online-dot"></div></div>
        <span>${f.friend.first_name} ${f.friend.last_name}</span>
      </div>`).join('')}`;
  }
}

function renderStories(groups) {
  return `<div class="stories">
    <div class="story-create" onclick="openCreateStory()"><div class="plus">+</div><span style="font-size:12px;font-weight:600">Create Story</span></div>
    ${groups.map(g => `<div class="story" style="background:${g.stories[0]?.type==='image'?`url(${g.stories[0].media_url})`:(g.stories[0]?.bg_color||'#1877f2')};background-size:cover;background-position:center">
      <img src="${avatar(g.user?.avatar_url)}" class="s-avatar">
      ${g.stories[0]?.type==='text'?`<div class="s-text">${escapeHtml(g.stories[0].content)}</div>`:''}
      <div class="s-name">${g.user?.first_name||''}</div>
    </div>`).join('')}
  </div>`;
}

function renderPostCard(post) {
  const imgs = (post.images||[]).length;
  return `<div class="post-card" id="post-${post.id}">
    <div class="post-head">
      <img src="${avatar(post.author?.avatar_url)}" onclick="navigate('profile',{userId:'${post.author?.id}'})">
      <div class="post-head-info">
        <h4 onclick="navigate('profile',{userId:'${post.author?.id}'})">${post.author?.first_name||''} ${post.author?.last_name||''}</h4>
        <p>${timeAgo(post.created_at)}${post.feeling?` · feeling ${post.feeling}`:''}${post.location?` · 📍 ${post.location}`:''} · ${post.privacy==='public'?'🌍':'👥'}</p>
      </div>
      ${post.user_id===state.user.id?`<button class="post-menu" onclick="deletePost('${post.id}')">🗑️</button>`:`<button class="post-menu">⋯</button>`}
    </div>
    ${post.content?`<div class="post-content">${escapeHtml(post.content)}</div>`:''}
    ${imgs>0?`<div class="post-images ${imgs===1?'single':'multi'}">${post.images.map(i=>`<img src="${i}">`).join('')}</div>`:''}
    <div class="post-stats">
      <div class="likes-info">${post.likesCount>0?`<span class="like-icon">👍</span><span>${post.likesCount}</span>`:''}</div>
      <div>${post.commentsCount>0?`<span onclick="toggleComments('${post.id}')" style="cursor:pointer">${post.commentsCount} comment${post.commentsCount!==1?'s':''}</span>`:''}</div>
    </div>
    <div class="post-btns">
      <button class="post-btn ${post.isLiked?'liked':''}" onclick="likePost('${post.id}')">👍 Like</button>
      <button class="post-btn" onclick="toggleComments('${post.id}')">💬 Comment</button>
      <button class="post-btn" onclick="sharePost('${post.id}')">↗️ Share</button>
    </div>
    <div class="comments" id="comments-${post.id}" style="display:none">
      <div id="commentsList-${post.id}"></div>
      <div class="comment-input"><img src="${avatar(state.profile?.avatar_url)}"><input placeholder="Write a comment..." onkeypress="if(event.key==='Enter')submitComment('${post.id}',this)"></div>
    </div>
  </div>`;
}


// ===== POST ACTIONS =====
async function likePost(postId) {
  const { data: existing } = await db.from('likes').select('id').eq('post_id', postId).eq('user_id', state.user.id).single();
  if (existing) {
    await db.from('likes').delete().eq('id', existing.id);
  } else {
    await db.from('likes').insert({ post_id: postId, user_id: state.user.id });
  }
  // Refresh counts
  const { count } = await db.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', postId);
  const btn = document.querySelector(`#post-${postId} .post-btn`);
  if (btn) btn.className = `post-btn ${existing ? '' : 'liked'}`;
  const stats = document.querySelector(`#post-${postId} .likes-info`);
  if (stats) stats.innerHTML = count > 0 ? `<span class="like-icon">👍</span><span>${count}</span>` : '';
}

async function toggleComments(postId) {
  const el = document.getElementById(`comments-${postId}`);
  if (el.style.display === 'none') {
    el.style.display = 'block';
    const { data } = await db.from('comments').select('*, author:profiles!comments_user_id_fkey(id, first_name, last_name, avatar_url)').eq('post_id', postId).order('created_at');
    document.getElementById(`commentsList-${postId}`).innerHTML = (data||[]).map(c => `
      <div class="comment"><img src="${avatar(c.author?.avatar_url)}"><div><div class="comment-bubble"><h5>${c.author?.first_name} ${c.author?.last_name}</h5><p>${escapeHtml(c.content)}</p></div><div class="comment-meta"><span>${timeAgo(c.created_at)}</span></div></div></div>`).join('');
  } else { el.style.display = 'none'; }
}

async function submitComment(postId, input) {
  if (!input.value.trim()) return;
  await db.from('comments').insert({ post_id: postId, user_id: state.user.id, content: input.value.trim() });
  input.value = '';
  // Refresh
  const el = document.getElementById(`comments-${postId}`);
  el.style.display = 'none';
  toggleComments(postId);
}

async function sharePost(postId) { alert('Post shared to your timeline!'); }

async function deletePost(postId) {
  if (!confirm('Delete this post?')) return;
  await db.from('posts').delete().eq('id', postId).eq('user_id', state.user.id);
  document.getElementById(`post-${postId}`)?.remove();
}

function openCreatePost() {
  const p = state.profile || {};
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal">
    <div class="modal-head"><h2>Create Post</h2><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div>
    <div class="modal-body">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <img src="${avatar(p.avatar_url)}" style="width:40px;height:40px;border-radius:50%;object-fit:cover">
        <div><h4>${p.first_name} ${p.last_name}</h4>
          <select id="postPrivacy" style="font-size:12px;padding:2px 8px;border-radius:4px;border:1px solid var(--border)"><option value="public">🌍 Public</option><option value="friends">👥 Friends</option><option value="private">🔒 Only me</option></select>
        </div>
      </div>
      <textarea id="postContent" placeholder="What's on your mind, ${p.first_name}?" style="width:100%;min-height:120px;border:none;font-size:17px;resize:none"></textarea>
      <input id="postFeeling" placeholder="😊 How are you feeling?" class="form-input" style="margin-top:12px">
      <input id="postLocation" placeholder="📍 Location" class="form-input">
    </div>
    <div class="modal-footer"><button class="btn btn-primary" onclick="submitPost()" style="width:100%;padding:12px">Post</button></div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('postContent').focus();
}

async function submitPost() {
  const content = document.getElementById('postContent').value;
  if (!content.trim()) return;
  await db.from('posts').insert({ user_id: state.user.id, content, privacy: document.getElementById('postPrivacy').value, feeling: document.getElementById('postFeeling').value, location: document.getElementById('postLocation').value });
  document.querySelector('.modal-overlay').remove();
  loadFeed();
}

function openCreateStory() {
  const colors = ['#1877f2','#42b72a','#e74c3c','#8e44ad','#f39c12','#1abc9c','#2c3e50'];
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal">
    <div class="modal-head"><h2>Create Story</h2><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div>
    <div class="modal-body">
      <div id="storyPreview" style="background:#1877f2;border-radius:8px;padding:40px 20px;margin-bottom:16px;min-height:200px;display:flex;align-items:center;justify-content:center">
        <textarea id="storyText" placeholder="Start typing..." style="background:none;color:white;text-align:center;font-size:20px;font-weight:600;border:none;resize:none;width:100%"></textarea>
      </div>
      <div style="display:flex;gap:8px">${colors.map(c=>`<button onclick="document.getElementById('storyPreview').style.background='${c}';window._storyBg='${c}'" style="width:32px;height:32px;border-radius:50%;background:${c};border:2px solid #ddd"></button>`).join('')}</div>
    </div>
    <div class="modal-footer"><button class="btn btn-primary" onclick="submitStory()" style="width:100%;padding:12px">Share to Story</button></div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  window._storyBg = '#1877f2';
}

async function submitStory() {
  const text = document.getElementById('storyText').value;
  if (!text.trim()) return;
  await db.from('stories').insert({ user_id: state.user.id, type: 'text', content: text, bg_color: window._storyBg, expires_at: new Date(Date.now() + 86400000).toISOString() });
  document.querySelector('.modal-overlay').remove();
  loadFeed();
}


// ===== PROFILE =====
function renderProfile() { return `<div class="profile-page" id="profileContainer"><div class="loading">Loading profile...</div></div>`; }

async function loadProfile() {
  const userId = state.pageParams?.userId || state.user.id;
  const { data: profile } = await db.from('profiles').select('*').eq('id', userId).single();
  if (!profile) { document.getElementById('profileContainer').innerHTML = '<div class="loading">User not found</div>'; return; }
  const { data: posts } = await db.from('posts').select('*, author:profiles!posts_user_id_fkey(id, first_name, last_name, avatar_url), comments(id), likes(user_id)').eq('user_id', userId).order('created_at', { ascending: false });
  const { data: friendships } = await db.from('friends').select('*, friend:profiles!friends_friend_id_fkey(id, first_name, last_name, avatar_url)').eq('user_id', userId).eq('status', 'accepted');
  const friends = friendships || [];
  const isOwner = userId === state.user.id;

  document.getElementById('profileContainer').innerHTML = `
    <div class="profile-cover"><img src="${profile.cover_url || 'https://picsum.photos/1200/400'}"></div>
    <div class="profile-info">
      <img src="${avatar(profile.avatar_url)}" class="profile-avatar">
      <div class="profile-name"><h1>${profile.first_name} ${profile.last_name}</h1><p>${friends.length} friends</p></div>
      <div class="profile-actions">${isOwner?`<button class="btn btn-secondary" onclick="openEditProfile()">✏️ Edit Profile</button>`:`<button class="btn btn-primary" onclick="sendFriendReq('${userId}',this)">➕ Add Friend</button><button class="btn btn-secondary" onclick="navigate('messenger')">💬 Message</button>`}</div>
    </div>
    <div class="profile-tabs">
      <div class="p-tab active">Posts</div>
      <div class="p-tab" onclick="showProfileAbout()">About</div>
      <div class="p-tab" onclick="showProfileFriends()">Friends</div>
    </div>
    <div class="profile-body" id="profileBody">
      <div class="profile-sidebar">
        <div class="intro-box"><h3>Intro</h3>
          ${profile.bio?`<p style="text-align:center;margin-bottom:12px;color:var(--text2)">${escapeHtml(profile.bio)}</p>`:''}
          ${profile.workplace?`<p class="intro-item">💼 ${escapeHtml(profile.workplace)}</p>`:''}
          ${profile.education?`<p class="intro-item">🎓 ${escapeHtml(profile.education)}</p>`:''}
          ${profile.location?`<p class="intro-item">📍 ${escapeHtml(profile.location)}</p>`:''}
        </div>
        <div class="intro-box"><h3>Friends · ${friends.length}</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px">
            ${friends.slice(0,9).map(f=>`<div onclick="navigate('profile',{userId:'${f.friend.id}'})" style="cursor:pointer;text-align:center"><img src="${avatar(f.friend.avatar_url)}" style="width:100%;height:80px;object-fit:cover;border-radius:8px"><p style="font-size:12px;margin-top:4px">${f.friend.first_name}</p></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="profile-main">
        ${isOwner?`<div class="create-post"><div class="create-post-top"><img src="${avatar(profile.avatar_url)}"><button onclick="openCreatePost()">What's on your mind?</button></div></div>`:''}
        ${(posts||[]).map(post => renderPostCard({ ...post, likesCount: post.likes?.length||0, commentsCount: post.comments?.length||0, isLiked: post.likes?.some(l=>l.user_id===state.user.id) })).join('')}
        ${!posts?.length?'<div class="loading">No posts yet</div>':''}
      </div>
    </div>`;
  window._profileData = { profile, friends };
}

function openEditProfile() {
  const p = window._profileData?.profile || state.profile || {};
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal">
    <div class="modal-head"><h2>Edit Profile</h2><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div>
    <div class="modal-body">
      <input class="form-input" id="editBio" placeholder="Bio" value="${escapeHtml(p.bio||'')}">
      <input class="form-input" id="editLocation" placeholder="Location" value="${escapeHtml(p.location||'')}">
      <input class="form-input" id="editWorkplace" placeholder="Workplace" value="${escapeHtml(p.workplace||'')}">
      <input class="form-input" id="editEducation" placeholder="Education" value="${escapeHtml(p.education||'')}">
    </div>
    <div class="modal-footer"><button class="btn btn-primary" onclick="saveProfile()" style="width:100%;padding:12px">Save Changes</button></div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function saveProfile() {
  await db.from('profiles').update({ bio: document.getElementById('editBio').value, location: document.getElementById('editLocation').value, workplace: document.getElementById('editWorkplace').value, education: document.getElementById('editEducation').value }).eq('id', state.user.id);
  document.querySelector('.modal-overlay').remove();
  await loadUserProfile();
  loadProfile();
}

function showProfileAbout() { const p = window._profileData?.profile||{}; document.getElementById('profileBody').innerHTML = `<div style="flex:1;background:var(--white);border-radius:8px;padding:24px;box-shadow:var(--shadow)"><h3 style="margin-bottom:16px">About</h3><div style="display:grid;gap:12px"><p><strong>Bio:</strong> ${p.bio||'Not set'}</p><p><strong>Location:</strong> ${p.location||'Not set'}</p><p><strong>Workplace:</strong> ${p.workplace||'Not set'}</p><p><strong>Education:</strong> ${p.education||'Not set'}</p><p><strong>Joined:</strong> ${new Date(p.created_at).toLocaleDateString()}</p></div></div>`; }
function showProfileFriends() { const friends = window._profileData?.friends||[]; document.getElementById('profileBody').innerHTML = `<div style="flex:1"><div class="grid">${friends.map(f=>`<div class="card" onclick="navigate('profile',{userId:'${f.friend.id}'})"><img class="card-img" src="${avatar(f.friend.avatar_url)}"><div class="card-body"><h4>${f.friend.first_name} ${f.friend.last_name}</h4></div></div>`).join('')}</div></div>`; }


// ===== FRIENDS =====
function renderFriends() { return `<div class="page-container"><div class="section-header"><h2>Friends</h2></div><div class="tabs"><button class="tab active" onclick="loadFriendsTab('requests',this)">Requests</button><button class="tab" onclick="loadFriendsTab('suggestions',this)">Suggestions</button><button class="tab" onclick="loadFriendsTab('all',this)">All Friends</button></div><div id="friendsContent"><div class="loading">Loading...</div></div></div>`; }

async function loadFriends() { loadFriendsTab('requests'); }

async function loadFriendsTab(tab, btn) {
  if (btn) { document.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); btn.classList.add('active'); }
  const el = document.getElementById('friendsContent');
  if (tab === 'requests') {
    const { data } = await db.from('friends').select('*, from:profiles!friends_user_id_fkey(id, first_name, last_name, avatar_url)').eq('friend_id', state.user.id).eq('status', 'pending');
    el.innerHTML = !data?.length ? '<div class="loading">No pending requests</div>' : `<div class="grid">${data.map(r => `<div class="card"><img class="card-img" src="${avatar(r.from?.avatar_url)}"><div class="card-body"><h4>${r.from?.first_name} ${r.from?.last_name}</h4><div class="card-actions"><button class="btn btn-primary" onclick="acceptFriend('${r.id}')">Confirm</button><button class="btn btn-secondary" onclick="declineFriend('${r.id}')">Delete</button></div></div></div>`).join('')}</div>`;
  } else if (tab === 'suggestions') {
    const { data: friends } = await db.from('friends').select('friend_id').eq('user_id', state.user.id);
    const friendIds = (friends||[]).map(f => f.friend_id);
    friendIds.push(state.user.id);
    const { data } = await db.from('profiles').select('*').not('id', 'in', `(${friendIds.join(',')})`).limit(10);
    el.innerHTML = `<div class="grid">${(data||[]).map(p => `<div class="card"><img class="card-img" src="${avatar(p.avatar_url)}"><div class="card-body"><h4>${p.first_name} ${p.last_name}</h4><p>${p.location||''}</p><div class="card-actions"><button class="btn btn-primary" onclick="sendFriendReq('${p.id}',this)">Add Friend</button></div></div></div>`).join('')}</div>`;
  } else {
    const { data } = await db.from('friends').select('*, friend:profiles!friends_friend_id_fkey(id, first_name, last_name, avatar_url, location)').eq('user_id', state.user.id).eq('status', 'accepted');
    el.innerHTML = `<div class="grid">${(data||[]).map(f => `<div class="card" onclick="navigate('profile',{userId:'${f.friend.id}'})"><img class="card-img" src="${avatar(f.friend.avatar_url)}"><div class="card-body"><h4>${f.friend.first_name} ${f.friend.last_name}</h4><p>${f.friend.location||''}</p></div></div>`).join('')}</div>`;
  }
}

async function acceptFriend(id) { await db.from('friends').update({ status: 'accepted' }).eq('id', id); loadFriendsTab('requests'); }
async function declineFriend(id) { await db.from('friends').delete().eq('id', id); loadFriendsTab('requests'); }
async function sendFriendReq(userId, btn) { await db.from('friends').insert({ user_id: state.user.id, friend_id: userId, status: 'pending' }); if (btn) { btn.textContent = 'Request Sent'; btn.disabled = true; } }

// ===== MESSENGER =====
function renderMessenger() { return `<div class="messenger"><div class="msg-sidebar"><h2>Chats</h2><div id="convList"><div class="loading">Loading...</div></div></div><div class="msg-main" id="msgMain"><div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--text2)">Select a conversation</div></div></div>`; }

async function loadMessenger() {
  const { data } = await db.from('conversations').select('*, participant1:profiles!conversations_user1_id_fkey(id, first_name, last_name, avatar_url), participant2:profiles!conversations_user2_id_fkey(id, first_name, last_name, avatar_url)').or(`user1_id.eq.${state.user.id},user2_id.eq.${state.user.id}`).order('updated_at', { ascending: false });
  document.getElementById('convList').innerHTML = (data||[]).map(c => {
    const other = c.user1_id === state.user.id ? c.participant2 : c.participant1;
    return `<div class="conv-item" onclick="openConversation('${c.id}','${other?.id}')"><div class="conv-avatar"><img src="${avatar(other?.avatar_url)}"></div><div class="conv-info"><h4>${other?.first_name} ${other?.last_name}</h4><p>${c.last_message||'Start chatting'}</p></div><div class="conv-meta"><span class="time">${timeAgo(c.updated_at)}</span></div></div>`;
  }).join('') || '<div class="loading">No conversations yet</div>';
}

async function openConversation(convId, otherId) {
  window._activeConv = convId;
  document.querySelectorAll('.conv-item').forEach(el => el.classList.remove('active'));
  const { data: messages } = await db.from('messages').select('*').eq('conversation_id', convId).order('created_at');
  const { data: other } = await db.from('profiles').select('*').eq('id', otherId).single();
  document.getElementById('msgMain').innerHTML = `
    <div class="msg-header"><img src="${avatar(other?.avatar_url)}"><div><h3>${other?.first_name} ${other?.last_name}</h3></div></div>
    <div class="msg-area" id="msgArea">${(messages||[]).map(m => `<div class="msg-row ${m.sender_id===state.user.id?'mine':'theirs'}"><div class="msg-bubble">${escapeHtml(m.content)}</div></div>`).join('')}</div>
    <form class="msg-input" onsubmit="sendMessage(event)"><input id="msgInput" placeholder="Aa" autocomplete="off"><button type="submit" class="msg-send">➤</button></form>`;
  document.getElementById('msgArea').scrollTop = 99999;
}

async function sendMessage(e) {
  e.preventDefault();
  const input = document.getElementById('msgInput');
  if (!input.value.trim()) return;
  await db.from('messages').insert({ conversation_id: window._activeConv, sender_id: state.user.id, content: input.value });
  await db.from('conversations').update({ last_message: input.value, updated_at: new Date().toISOString() }).eq('id', window._activeConv);
  document.getElementById('msgArea').insertAdjacentHTML('beforeend', `<div class="msg-row mine"><div class="msg-bubble">${escapeHtml(input.value)}</div></div>`);
  input.value = '';
  document.getElementById('msgArea').scrollTop = 99999;
}


// ===== GROUPS =====
function renderGroups() { return `<div class="page-container"><div class="section-header"><h2>Groups</h2><button class="btn btn-primary" onclick="openCreateGroup()">+ Create Group</button></div><div id="groupsContent"><div class="loading">Loading...</div></div></div>`; }

async function loadGroups() {
  const { data } = await db.from('groups').select('*, members:group_members(user_id)');
  document.getElementById('groupsContent').innerHTML = `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">${(data||[]).map(g => {
    const isMember = g.members?.some(m => m.user_id === state.user.id);
    return `<div class="card"><div class="gc-cover" style="background-image:url(${g.cover_url||'https://picsum.photos/seed/g'+g.id+'/1200/400'})"></div><div class="gc-info"><h3>${escapeHtml(g.name)}</h3><p>${escapeHtml((g.description||'').substring(0,100))}</p><div class="gc-stats">${g.privacy==='public'?'🌍 Public':'🔒 Private'} · ${g.members?.length||0} members</div>${isMember?`<button class="btn btn-secondary" style="width:100%" onclick="leaveGroup('${g.id}')">Leave</button>`:`<button class="btn btn-primary" style="width:100%" onclick="joinGroup('${g.id}')">Join</button>`}</div></div>`;
  }).join('')}</div>`;
}

async function joinGroup(id) { await db.from('group_members').insert({ group_id: id, user_id: state.user.id }); loadGroups(); }
async function leaveGroup(id) { await db.from('group_members').delete().eq('group_id', id).eq('user_id', state.user.id); loadGroups(); }

function openCreateGroup() {
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal"><div class="modal-head"><h2>Create Group</h2><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div><div class="modal-body"><input class="form-input" id="groupName" placeholder="Group name"><textarea class="form-input" id="groupDesc" placeholder="Description" style="min-height:80px"></textarea><select class="form-input" id="groupPrivacy"><option value="public">🌍 Public</option><option value="private">🔒 Private</option></select></div><div class="modal-footer"><button class="btn btn-primary" onclick="submitGroup()">Create Group</button></div></div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function submitGroup() {
  const name = document.getElementById('groupName').value; if (!name.trim()) return;
  const { data } = await db.from('groups').insert({ name, description: document.getElementById('groupDesc').value, privacy: document.getElementById('groupPrivacy').value, created_by: state.user.id }).select().single();
  if (data) await db.from('group_members').insert({ group_id: data.id, user_id: state.user.id, role: 'admin' });
  document.querySelector('.modal-overlay').remove(); loadGroups();
}

// ===== PAGES =====
function renderPages() { return `<div class="page-container"><div class="section-header"><h2>Pages</h2><button class="btn btn-primary" onclick="openCreatePage()">+ Create Page</button></div><div id="pagesContent"><div class="loading">Loading...</div></div></div>`; }

async function loadPages() {
  const { data } = await db.from('pages').select('*, followers:page_likes(user_id)');
  document.getElementById('pagesContent').innerHTML = `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">${(data||[]).map(p => {
    const isLiked = p.followers?.some(f => f.user_id === state.user.id);
    return `<div class="card"><div class="pc-cover" style="background-image:url(${p.cover_url||'https://picsum.photos/seed/p'+p.id+'/1200/400'})"><img src="${avatar(p.avatar_url)}" class="pc-avatar"></div><div class="pc-info"><h3>${escapeHtml(p.name)}</h3><p class="cat">${escapeHtml(p.category||'')}</p><p class="stats">${p.followers?.length||0} likes</p><button class="btn ${isLiked?'btn-secondary':'btn-primary'}" style="width:100%" onclick="likePage('${p.id}')">${isLiked?'✓ Liked':'👍 Like'}</button></div></div>`;
  }).join('')}</div>`;
}

async function likePage(id) {
  const { data: existing } = await db.from('page_likes').select('id').eq('page_id', id).eq('user_id', state.user.id).single();
  if (existing) await db.from('page_likes').delete().eq('id', existing.id);
  else await db.from('page_likes').insert({ page_id: id, user_id: state.user.id });
  loadPages();
}

function openCreatePage() {
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal"><div class="modal-head"><h2>Create Page</h2><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div><div class="modal-body"><input class="form-input" id="pageName" placeholder="Page name"><input class="form-input" id="pageCat" placeholder="Category"><textarea class="form-input" id="pageDesc" placeholder="Description" style="min-height:80px"></textarea></div><div class="modal-footer"><button class="btn btn-primary" onclick="submitPage()">Create Page</button></div></div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function submitPage() {
  const name = document.getElementById('pageName').value; if (!name.trim()) return;
  await db.from('pages').insert({ name, category: document.getElementById('pageCat').value, description: document.getElementById('pageDesc').value, created_by: state.user.id });
  document.querySelector('.modal-overlay').remove(); loadPages();
}


// ===== MARKETPLACE =====
function renderMarketplace() { return `<div class="page-container"><div class="section-header"><h2>Marketplace</h2><button class="btn btn-primary" onclick="openCreateListing()">+ Create Listing</button></div><div class="mp-filters"><input placeholder="Search..." id="mpSearch" oninput="filterMarketplace()"><select id="mpCategory" onchange="filterMarketplace()"><option value="">All Categories</option><option>Electronics</option><option>Home & Garden</option><option>Vehicles</option><option>Clothing</option><option>Sports</option><option>Other</option></select></div><div class="mp-grid" id="mpGrid"><div class="loading">Loading...</div></div></div>`; }

async function loadMarketplace() { filterMarketplace(); }

async function filterMarketplace() {
  let query = db.from('marketplace_items').select('*, seller:profiles!marketplace_items_seller_id_fkey(id, first_name, last_name, avatar_url, location)').eq('status', 'available').order('created_at', { ascending: false });
  const cat = document.getElementById('mpCategory')?.value;
  const search = document.getElementById('mpSearch')?.value;
  if (cat) query = query.eq('category', cat);
  if (search) query = query.ilike('title', `%${search}%`);
  const { data } = await query;
  window._mpItems = data || [];
  document.getElementById('mpGrid').innerHTML = (data||[]).map((item, i) => `
    <div class="mp-item" onclick="openItemDetail(${i})">
      <img src="${item.image_url||'https://picsum.photos/seed/mp'+item.id+'/800/600'}">
      <div class="mp-item-info"><div class="price">$${item.price?.toLocaleString()}</div><div class="title">${escapeHtml(item.title)}</div><div class="loc">📍 ${escapeHtml(item.location||item.seller?.location||'')}</div></div>
    </div>`).join('') || '<div class="loading">No items found</div>';
}

function openItemDetail(idx) {
  const item = window._mpItems[idx]; if (!item) return;
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal" style="width:600px"><div class="modal-head"><h2>${escapeHtml(item.title)}</h2><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div><div class="modal-body"><img src="${item.image_url||'https://picsum.photos/800/600'}" style="width:100%;border-radius:8px;margin-bottom:16px"><h3>$${item.price?.toLocaleString()}</h3><p style="color:var(--text2);margin:8px 0">${escapeHtml(item.condition||'')} · ${escapeHtml(item.category||'')}</p><p>${escapeHtml(item.description||'')}</p>${item.seller?`<div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg);border-radius:8px;margin-top:16px"><img src="${avatar(item.seller.avatar_url)}" style="width:48px;height:48px;border-radius:50%;object-fit:cover"><div><h4>${item.seller.first_name} ${item.seller.last_name}</h4><p style="font-size:13px;color:var(--text2)">📍 ${escapeHtml(item.seller.location||'')}</p></div></div>`:''}</div><div class="modal-footer"><button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Message Seller</button></div></div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function openCreateListing() {
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal"><div class="modal-head"><h2>Create Listing</h2><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div><div class="modal-body"><input class="form-input" id="itemTitle" placeholder="Title"><input class="form-input" id="itemPrice" type="number" placeholder="Price ($)"><select class="form-input" id="itemCategory"><option>Electronics</option><option>Home & Garden</option><option>Vehicles</option><option>Clothing</option><option>Sports</option><option>Other</option></select><select class="form-input" id="itemCondition"><option>New</option><option>Like New</option><option>Good</option><option>Fair</option></select><input class="form-input" id="itemLocation" placeholder="Location"><textarea class="form-input" id="itemDesc" placeholder="Description" style="min-height:80px"></textarea></div><div class="modal-footer"><button class="btn btn-primary" onclick="submitListing()">Publish</button></div></div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function submitListing() {
  const title = document.getElementById('itemTitle').value; if (!title.trim()) return;
  await db.from('marketplace_items').insert({ seller_id: state.user.id, title, price: parseFloat(document.getElementById('itemPrice').value)||0, category: document.getElementById('itemCategory').value, condition: document.getElementById('itemCondition').value, location: document.getElementById('itemLocation').value, description: document.getElementById('itemDesc').value, status: 'available' });
  document.querySelector('.modal-overlay').remove(); filterMarketplace();
}


// ===== SEARCH =====
function renderSearch() { return `<div class="page-container"><h2 style="margin-bottom:16px">Search results for "${escapeHtml(state.pageParams?.q||'')}"</h2><div class="tabs"><button class="tab active" onclick="searchTab('all',this)">All</button><button class="tab" onclick="searchTab('people',this)">People</button><button class="tab" onclick="searchTab('posts',this)">Posts</button><button class="tab" onclick="searchTab('groups',this)">Groups</button></div><div id="searchResults"><div class="loading">Searching...</div></div></div>`; }

async function loadSearch() { searchTab('all'); }

async function searchTab(type, btn) {
  if (btn) { document.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); btn.classList.add('active'); }
  const q = state.pageParams?.q || ''; if (!q) return;
  let html = '';

  if (type === 'all' || type === 'people') {
    const { data } = await db.from('profiles').select('*').or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`).limit(5);
    if (data?.length) html += `<div class="search-section"><h3>People</h3>${data.map(u => `<div class="search-item" onclick="navigate('profile',{userId:'${u.id}'})"><img src="${avatar(u.avatar_url)}"><div class="si-info"><h4>${u.first_name} ${u.last_name}</h4><p>${u.location||'Facebook user'}</p></div></div>`).join('')}</div>`;
  }
  if (type === 'all' || type === 'posts') {
    const { data } = await db.from('posts').select('*, author:profiles!posts_user_id_fkey(id, first_name, last_name, avatar_url)').ilike('content', `%${q}%`).limit(5);
    if (data?.length) html += `<div class="search-section"><h3>Posts</h3>${data.map(p => `<div class="search-item" onclick="navigate('profile',{userId:'${p.author?.id}'})"><img src="${avatar(p.author?.avatar_url)}"><div class="si-info"><h4>${p.author?.first_name} ${p.author?.last_name}</h4><p>${escapeHtml(p.content?.substring(0,100))}</p></div></div>`).join('')}</div>`;
  }
  if (type === 'all' || type === 'groups') {
    const { data } = await db.from('groups').select('*').ilike('name', `%${q}%`).limit(5);
    if (data?.length) html += `<div class="search-section"><h3>Groups</h3>${data.map(g => `<div class="search-item" onclick="navigate('groups')"><img src="${g.cover_url||'https://picsum.photos/100/100'}" style="border-radius:8px"><div class="si-info"><h4>${escapeHtml(g.name)}</h4><p>${g.privacy} group</p></div></div>`).join('')}</div>`;
  }

  document.getElementById('searchResults').innerHTML = html || '<div class="loading">No results found</div>';
}

// ===== INIT =====
async function init() {
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    state.user = session.user;
    await loadUserProfile();
  }
  render();
  if (state.user) setTimeout(loadPageData, 100);

  // Listen for auth changes
  db.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') { state.user = null; state.profile = null; render(); }
  });
}

init();
