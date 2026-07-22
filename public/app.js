// Facebook Clone - Single Page Application
const API = '';
let state = { user: null, token: localStorage.getItem('fb_token'), currentPage: 'feed' };

// ===== API HELPER =====
async function api(endpoint, options = {}) {
  const config = { headers: { 'Content-Type': 'application/json', ...(state.token && { Authorization: `Bearer ${state.token}` }), ...options.headers }, ...options };
  const res = await fetch(`${API}${endpoint}`, config);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error');
  return data;
}

function timeAgo(dateStr) {
  const s = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  if (s < 604800) return Math.floor(s / 86400) + 'd';
  return new Date(dateStr).toLocaleDateString();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== ROUTER =====
function navigate(page, params = {}) {
  state.currentPage = page;
  state.pageParams = params;
  render();
}

// ===== RENDER =====
function render() {
  const app = document.getElementById('app');
  if (!state.user) {
    app.innerHTML = renderAuth();
    // Attach auth event listeners
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('showRegister')?.addEventListener('click', showRegisterForm);
    return;
  }
  app.innerHTML = renderHeader() + `<div class="main">${renderPage()}</div>`;
  attachHeaderEvents();
  attachPageEvents();
}


// ===== AUTH =====
function renderAuth() {
  return `<div class="auth-page"><div class="auth-container">
    <div class="auth-left"><h1>facebook</h1><p>Connect with friends and the world around you on Facebook.</p></div>
    <div class="auth-right">
      <form class="auth-form" id="loginForm">
        <input name="email" type="email" placeholder="Email address" value="john@example.com">
        <input name="password" type="password" placeholder="Password" value="password123">
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
  try {
    const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: form.email.value, password: form.password.value }) });
    state.token = data.token; state.user = data.user;
    localStorage.setItem('fb_token', data.token);
    navigate('feed');
  } catch (err) { document.getElementById('authError').textContent = err.message; }
}

// ===== HEADER =====
function renderHeader() {
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
      <div style="position:relative"><img src="${state.user?.profilePicture}" class="avatar-btn" id="avatarBtn"><div class="dropdown" id="userDrop" style="display:none;width:280px"></div></div>
    </div>
  </header>`;
}

function attachHeaderEvents() {
  document.getElementById('searchForm')?.addEventListener('submit', e => { e.preventDefault(); const q = document.getElementById('searchInput').value; if (q.trim()) navigate('search', { q }); });
  document.getElementById('notifBtn')?.addEventListener('click', toggleNotifications);
  document.getElementById('avatarBtn')?.addEventListener('click', toggleUserMenu);
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('showRegister')?.addEventListener('click', showRegisterForm);
}


async function toggleNotifications() {
  const drop = document.getElementById('notifDrop');
  if (drop.style.display !== 'none') { drop.style.display = 'none'; return; }
  try {
    const data = await api('/api/notifications');
    await api('/api/notifications/read-all', { method: 'PUT' });
    const badge = document.getElementById('notifBadge'); if (badge) badge.style.display = 'none';
    drop.innerHTML = `<h3>Notifications</h3>${data.notifications.length === 0 ? '<p style="padding:16px;text-align:center;color:var(--text2)">No notifications</p>' : data.notifications.slice(0,10).map(n => `
      <div class="notif-item ${n.read?'':'unread'}">
        ${n.fromUser ? `<img src="${n.fromUser.profilePicture}">` : ''}
        <div class="notif-content"><p>${escapeHtml(n.content)}</p><span class="n-time">${timeAgo(n.createdAt)}</span></div>
      </div>`).join('')}`;
    drop.style.display = 'block';
  } catch(e) {}
}

function toggleUserMenu() {
  const drop = document.getElementById('userDrop');
  if (drop.style.display !== 'none') { drop.style.display = 'none'; return; }
  drop.innerHTML = `<div style="padding:8px">
    <div class="sidebar-item" onclick="navigate('profile',{userId:'${state.user.id}'})"><img src="${state.user.profilePicture}"><span>${state.user.firstName} ${state.user.lastName}</span></div>
    <div style="border-top:1px solid var(--border);margin:8px 0"></div>
    <div class="sidebar-item" onclick="logout()"><span class="s-icon">🚪</span><span>Log Out</span></div>
  </div>`;
  drop.style.display = 'block';
}

function logout() { state.user = null; state.token = null; localStorage.removeItem('fb_token'); render(); }

function showRegisterForm() {
  const right = document.querySelector('.auth-right');
  right.innerHTML = `<h2 style="text-align:center;margin-bottom:16px">Create a new account</h2>
    <form class="auth-form" id="registerForm">
      <input name="firstName" placeholder="First name" required>
      <input name="lastName" placeholder="Last name" required>
      <input name="email" type="email" placeholder="Email address" required>
      <input name="password" type="password" placeholder="New password" required>
      <div id="authError" class="auth-error"></div>
      <button type="submit" class="btn-login" style="background:var(--green)">Sign Up</button>
    </form>
    <p class="auth-link" onclick="render()">Already have an account?</p>`;
  document.getElementById('registerForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    try {
      const data = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ firstName: f.firstName.value, lastName: f.lastName.value, email: f.email.value, password: f.password.value }) });
      state.token = data.token; state.user = data.user; localStorage.setItem('fb_token', data.token); navigate('feed');
    } catch (err) { document.getElementById('authError').textContent = err.message; }
  });
}


// ===== PAGE ROUTER =====
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

function attachPageEvents() {
  // Close dropdowns on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('#notifBtn')) { const d = document.getElementById('notifDrop'); if (d) d.style.display = 'none'; }
    if (!e.target.closest('#avatarBtn') && !e.target.closest('#userDrop')) { const d = document.getElementById('userDrop'); if (d) d.style.display = 'none'; }
  });
}

// ===== FEED PAGE =====
function renderFeed() {
  return `<div class="feed-layout">
    <aside class="sidebar-left">
      <div class="sidebar-item" onclick="navigate('profile',{userId:'${state.user.id}'})"><img src="${state.user.profilePicture}"><span>${state.user.firstName} ${state.user.lastName}</span></div>
      <div class="sidebar-item" onclick="navigate('friends')"><span class="s-icon">👥</span><span>Friends</span></div>
      <div class="sidebar-item" onclick="navigate('groups')"><span class="s-icon">👨‍👩‍👧‍👦</span><span>Groups</span></div>
      <div class="sidebar-item" onclick="navigate('marketplace')"><span class="s-icon">🏪</span><span>Marketplace</span></div>
      <div class="sidebar-item" onclick="navigate('messenger')"><span class="s-icon">💬</span><span>Messenger</span></div>
      <div class="sidebar-item" onclick="navigate('pages')"><span class="s-icon">📄</span><span>Pages</span></div>
      <div class="sidebar-item"><span class="s-icon">📺</span><span>Watch</span></div>
      <div class="sidebar-item"><span class="s-icon">🎮</span><span>Gaming</span></div>
      <div class="sidebar-item"><span class="s-icon">📅</span><span>Events</span></div>
      <div class="sidebar-item"><span class="s-icon">💾</span><span>Saved</span></div>
    </aside>
    <main class="feed-center">
      <div id="storiesContainer"></div>
      <div class="create-post">
        <div class="create-post-top"><img src="${state.user.profilePicture}"><button onclick="openCreatePost()">What's on your mind, ${state.user.firstName}?</button></div>
        <div class="create-post-actions">
          <button class="cp-action" onclick="openCreatePost()">📹 Live Video</button>
          <button class="cp-action" onclick="openCreatePost()">🖼️ Photo/Video</button>
          <button class="cp-action" onclick="openCreatePost()">😊 Feeling</button>
        </div>
      </div>
      <div id="feedPosts"><p style="text-align:center;padding:40px;color:var(--text2)">Loading posts...</p></div>
    </main>
    <aside class="sidebar-right"><div class="contacts" id="contactsList"><h4>Contacts</h4></div></aside>
  </div>`;
}


async function loadFeed() {
  if (!state.user) return;
  try {
    const [feedData, stories, friends] = await Promise.all([
      api('/api/posts/feed'), api('/api/stories/feed'), api(`/api/users/${state.user.id}/friends`)
    ]);
    document.getElementById('feedPosts').innerHTML = feedData.posts.map(renderPostCard).join('');
    document.getElementById('storiesContainer').innerHTML = renderStories(stories);
    document.getElementById('contactsList').innerHTML = `<h4>Contacts</h4>${friends.map(f => `
      <div class="contact" onclick="navigate('profile',{userId:'${f.id}'})">
        <div class="contact-av"><img src="${f.profilePicture}">${f.isOnline?'<div class="online-dot"></div>':''}</div>
        <span>${f.firstName} ${f.lastName}</span>
      </div>`).join('')}`;
  } catch(e) { console.error(e); }
}

function renderStories(groups) {
  return `<div class="stories">
    <div class="story-create" onclick="openCreateStory()"><div class="plus">+</div><span style="font-size:12px;font-weight:600">Create Story</span></div>
    ${groups.map(g => `<div class="story" style="background:${g.stories[0]?.type==='image'?`url(${g.stories[0].content})`:g.stories[0]?.backgroundColor||'#1877f2'};background-size:cover;background-position:center">
      <img src="${g.user?.profilePicture}" class="s-avatar" style="border-color:${g.hasUnviewed?'var(--blue)':'#ccc'}">
      ${g.stories[0]?.type==='text'?`<div class="s-text">${escapeHtml(g.stories[0].text)}</div>`:''}
      <div class="s-name">${g.user?.firstName}</div>
    </div>`).join('')}
  </div>`;
}

function renderPostCard(post) {
  const imgs = (post.images||[]).length;
  return `<div class="post-card" id="post-${post.id}">
    <div class="post-head">
      <img src="${post.author?.profilePicture}" onclick="navigate('profile',{userId:'${post.author?.id}'})">
      <div class="post-head-info">
        <h4 onclick="navigate('profile',{userId:'${post.author?.id}'})">${post.author?.firstName} ${post.author?.lastName}</h4>
        <p>${timeAgo(post.createdAt)}${post.feeling?` · feeling ${post.feeling}`:''}${post.location?` · 📍 ${post.location}`:''} · ${post.privacy==='public'?'🌍':'👥'}</p>
      </div>
      <button class="post-menu">⋯</button>
    </div>
    ${post.content?`<div class="post-content">${escapeHtml(post.content)}</div>`:''}
    ${imgs>0?`<div class="post-images ${imgs===1?'single':'multi'}">${post.images.map(i=>`<img src="${i}">`).join('')}</div>`:''}
    <div class="post-stats">
      <div class="likes-info">${post.likesCount>0?`<span class="like-icon">👍</span><span>${post.likesCount}</span>`:''}</div>
      <div>${post.commentsCount>0?`<span onclick="toggleComments('${post.id}')" style="cursor:pointer">${post.commentsCount} comment${post.commentsCount!==1?'s':''}</span>`:''}${post.sharesCount>0?` · ${post.sharesCount} share${post.sharesCount!==1?'s':''}`:''}</div>
    </div>
    <div class="post-btns">
      <button class="post-btn ${post.isLiked?'liked':''}" onclick="likePost('${post.id}')">👍 Like</button>
      <button class="post-btn" onclick="toggleComments('${post.id}')">💬 Comment</button>
      <button class="post-btn" onclick="sharePost('${post.id}')">↗️ Share</button>
    </div>
    <div class="comments" id="comments-${post.id}" style="display:none">
      ${(post.comments||[]).map(c => `<div class="comment"><img src="${c.author?.profilePicture}"><div><div class="comment-bubble"><h5>${c.author?.firstName} ${c.author?.lastName}</h5><p>${escapeHtml(c.content)}</p></div><div class="comment-meta"><span>${timeAgo(c.createdAt)}</span></div></div></div>`).join('')}
      <div class="comment-input"><img src="${state.user.profilePicture}"><input placeholder="Write a comment..." onkeypress="if(event.key==='Enter')submitComment('${post.id}',this)"></div>
    </div>
  </div>`;
}


async function likePost(postId) {
  try {
    const data = await api(`/api/posts/${postId}/like`, { method: 'PUT' });
    const btn = document.querySelector(`#post-${postId} .post-btn`);
    btn.className = `post-btn ${data.isLiked ? 'liked' : ''}`;
    const stats = document.querySelector(`#post-${postId} .likes-info`);
    stats.innerHTML = data.likesCount > 0 ? `<span class="like-icon">👍</span><span>${data.likesCount}</span>` : '';
  } catch(e) {}
}

function toggleComments(postId) {
  const el = document.getElementById(`comments-${postId}`);
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

async function submitComment(postId, input) {
  if (!input.value.trim()) return;
  try {
    const comment = await api(`/api/posts/${postId}/comment`, { method: 'POST', body: JSON.stringify({ content: input.value }) });
    const commentsEl = document.getElementById(`comments-${postId}`);
    const inputDiv = commentsEl.querySelector('.comment-input');
    const html = `<div class="comment"><img src="${comment.author?.profilePicture}"><div><div class="comment-bubble"><h5>${comment.author?.firstName} ${comment.author?.lastName}</h5><p>${escapeHtml(comment.content)}</p></div><div class="comment-meta"><span>Just now</span></div></div></div>`;
    inputDiv.insertAdjacentHTML('beforebegin', html);
    input.value = '';
  } catch(e) {}
}

async function sharePost(postId) {
  try { await api(`/api/posts/${postId}/share`, { method: 'POST', body: JSON.stringify({}) }); alert('Post shared!'); } catch(e) {}
}

function openCreatePost() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal">
    <div class="modal-head"><h2>Create Post</h2><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div>
    <div class="modal-body">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <img src="${state.user.profilePicture}" style="width:40px;height:40px;border-radius:50%;object-fit:cover">
        <div><h4 style="font-size:15px">${state.user.firstName} ${state.user.lastName}</h4>
          <select id="postPrivacy" style="font-size:12px;padding:2px 8px;border-radius:4px;border:1px solid var(--border)"><option value="public">🌍 Public</option><option value="friends">👥 Friends</option><option value="private">🔒 Only me</option></select>
        </div>
      </div>
      <textarea id="postContent" placeholder="What's on your mind, ${state.user.firstName}?" style="width:100%;min-height:120px;border:none;font-size:17px;resize:none"></textarea>
      <input id="postFeeling" placeholder="😊 How are you feeling?" class="form-input" style="margin-top:12px">
    </div>
    <div class="modal-footer"><button class="btn btn-primary" onclick="submitPost()" style="width:100%;padding:12px">Post</button></div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('postContent').focus();
}

async function submitPost() {
  const content = document.getElementById('postContent').value;
  const feeling = document.getElementById('postFeeling').value;
  const privacy = document.getElementById('postPrivacy').value;
  if (!content.trim()) return;
  try {
    const post = await api('/api/posts', { method: 'POST', body: JSON.stringify({ content, feeling, privacy }) });
    document.querySelector('.modal-overlay').remove();
    const container = document.getElementById('feedPosts');
    container.insertAdjacentHTML('afterbegin', renderPostCard(post));
  } catch(e) {}
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
      <div style="display:flex;gap:8px;margin-bottom:16px">${colors.map(c=>`<button onclick="document.getElementById('storyPreview').style.background='${c}';window._storyBg='${c}'" style="width:32px;height:32px;border-radius:50%;background:${c};border:2px solid #ddd"></button>`).join('')}</div>
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
  try {
    await api('/api/stories', { method: 'POST', body: JSON.stringify({ type: 'text', text, backgroundColor: window._storyBg }) });
    document.querySelector('.modal-overlay').remove();
    if (state.currentPage === 'feed') { const stories = await api('/api/stories/feed'); document.getElementById('storiesContainer').innerHTML = renderStories(stories); }
  } catch(e) {}
}


// ===== PROFILE PAGE =====
function renderProfile() {
  return `<div class="profile-page" id="profileContainer"><p style="text-align:center;padding:40px;color:var(--text2)">Loading profile...</p></div>`;
}

async function loadProfile() {
  const userId = state.pageParams?.userId || state.user.id;
  try {
    const [profile, posts, friends] = await Promise.all([
      api(`/api/users/${userId}`), api(`/api/posts/user/${userId}`), api(`/api/users/${userId}/friends`)
    ]);
    const isOwner = userId === state.user.id;
    document.getElementById('profileContainer').innerHTML = `
      <div class="profile-cover"><img src="${profile.coverPhoto}"></div>
      <div class="profile-info">
        <img src="${profile.profilePicture}" class="profile-avatar">
        <div class="profile-name"><h1>${profile.firstName} ${profile.lastName}</h1><p>${friends.length} friends</p></div>
        <div class="profile-actions">${isOwner ? `<button class="btn btn-secondary" onclick="openEditProfile()">✏️ Edit Profile</button>` : `<button class="btn btn-primary">➕ Add Friend</button><button class="btn btn-secondary" onclick="navigate('messenger')">💬 Message</button>`}</div>
      </div>
      <div class="profile-tabs">
        <div class="p-tab active" onclick="showProfileTab('posts')">Posts</div>
        <div class="p-tab" onclick="showProfileTab('about')">About</div>
        <div class="p-tab" onclick="showProfileTab('friends')">Friends</div>
        <div class="p-tab" onclick="showProfileTab('photos')">Photos</div>
      </div>
      <div class="profile-body" id="profileBody">
        <div class="profile-sidebar">
          <div class="intro-box"><h3>Intro</h3>
            ${profile.bio?`<p style="text-align:center;margin-bottom:12px;color:var(--text2)">${escapeHtml(profile.bio)}</p>`:''}
            ${profile.workplace?`<p class="intro-item">💼 Works at <strong>${escapeHtml(profile.workplace)}</strong></p>`:''}
            ${profile.education?`<p class="intro-item">🎓 Studied at <strong>${escapeHtml(profile.education)}</strong></p>`:''}
            ${profile.location?`<p class="intro-item">📍 Lives in <strong>${escapeHtml(profile.location)}</strong></p>`:''}
            ${profile.relationship?`<p class="intro-item">❤️ ${escapeHtml(profile.relationship)}</p>`:''}
            ${profile.website?`<p class="intro-item">🔗 ${escapeHtml(profile.website)}</p>`:''}
          </div>
          <div class="intro-box"><h3>Friends · ${friends.length}</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px">
              ${friends.slice(0,9).map(f=>`<div onclick="navigate('profile',{userId:'${f.id}'})" style="cursor:pointer;text-align:center"><img src="${f.profilePicture}" style="width:100%;height:80px;object-fit:cover;border-radius:8px"><p style="font-size:12px;font-weight:500;margin-top:4px">${f.firstName}</p></div>`).join('')}
            </div>
          </div>
        </div>
        <div class="profile-main">
          ${isOwner?`<div class="create-post"><div class="create-post-top"><img src="${state.user.profilePicture}"><button onclick="openCreatePost()">What's on your mind?</button></div></div>`:''}
          ${posts.map(renderPostCard).join('')}
          ${posts.length===0?'<p style="text-align:center;padding:40px;color:var(--text2)">No posts yet</p>':''}
        </div>
      </div>`;
    window._profileData = { profile, posts, friends };
  } catch(e) { document.getElementById('profileContainer').innerHTML = '<p style="text-align:center;padding:40px">Error loading profile</p>'; }
}

function openEditProfile() {
  const p = window._profileData?.profile || state.user;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal">
    <div class="modal-head"><h2>Edit Profile</h2><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div>
    <div class="modal-body">
      <input class="form-input" id="editBio" placeholder="Bio" value="${escapeHtml(p.bio||'')}">
      <input class="form-input" id="editLocation" placeholder="Location" value="${escapeHtml(p.location||'')}">
      <input class="form-input" id="editWorkplace" placeholder="Workplace" value="${escapeHtml(p.workplace||'')}">
      <input class="form-input" id="editEducation" placeholder="Education" value="${escapeHtml(p.education||'')}">
      <input class="form-input" id="editRelationship" placeholder="Relationship" value="${escapeHtml(p.relationship||'')}">
      <input class="form-input" id="editWebsite" placeholder="Website" value="${escapeHtml(p.website||'')}">
    </div>
    <div class="modal-footer"><button class="btn btn-primary" onclick="saveProfile()" style="width:100%;padding:12px">Save Changes</button></div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function saveProfile() {
  try {
    const data = { bio: document.getElementById('editBio').value, location: document.getElementById('editLocation').value, workplace: document.getElementById('editWorkplace').value, education: document.getElementById('editEducation').value, relationship: document.getElementById('editRelationship').value, website: document.getElementById('editWebsite').value };
    const updated = await api('/api/users/profile', { method: 'PUT', body: JSON.stringify(data) });
    state.user = { ...state.user, ...updated };
    document.querySelector('.modal-overlay').remove();
    loadProfile();
  } catch(e) {}
}


// ===== FRIENDS PAGE =====
function renderFriends() {
  return `<div class="friends-page">
    <div class="section-header"><h2>Friends</h2></div>
    <div class="tabs">
      <button class="tab active" onclick="loadFriendsTab('requests',this)">Friend Requests</button>
      <button class="tab" onclick="loadFriendsTab('suggestions',this)">Suggestions</button>
      <button class="tab" onclick="loadFriendsTab('all',this)">All Friends</button>
    </div>
    <div id="friendsContent"><p style="text-align:center;padding:40px;color:var(--text2)">Loading...</p></div>
  </div>`;
}

async function loadFriends() { loadFriendsTab('requests'); }

async function loadFriendsTab(tab, btn) {
  if (btn) { document.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); btn.classList.add('active'); }
  const container = document.getElementById('friendsContent');
  try {
    if (tab === 'requests') {
      const data = await api('/api/friends/requests');
      container.innerHTML = data.length === 0 ? '<p style="color:var(--text2);padding:24px">No pending requests</p>' :
        `<div class="grid">${data.map(r => `<div class="card"><img class="card-img" src="${r.fromUser?.profilePicture}"><div class="card-body"><h4>${r.fromUser?.firstName} ${r.fromUser?.lastName}</h4><p>${r.fromUser?.mutualFriends||0} mutual friends</p><div class="card-actions"><button class="btn btn-primary" onclick="acceptFriend('${r.id}')">Confirm</button><button class="btn btn-secondary" onclick="declineFriend('${r.id}')">Delete</button></div></div></div>`).join('')}</div>`;
    } else if (tab === 'suggestions') {
      const data = await api('/api/users/suggestions/people');
      container.innerHTML = `<div class="grid">${data.map(p => `<div class="card"><img class="card-img" src="${p.profilePicture}"><div class="card-body"><h4>${p.firstName} ${p.lastName}</h4><p>${p.mutualFriends||0} mutual friends</p><div class="card-actions"><button class="btn btn-primary" onclick="sendFriendReq('${p.id}',this)">Add Friend</button></div></div></div>`).join('')}</div>`;
    } else {
      const data = await api(`/api/users/${state.user.id}/friends`);
      container.innerHTML = `<div class="grid">${data.map(f => `<div class="card" onclick="navigate('profile',{userId:'${f.id}'})"><img class="card-img" src="${f.profilePicture}"><div class="card-body"><h4>${f.firstName} ${f.lastName}</h4><p>${f.location||''}</p></div></div>`).join('')}</div>`;
    }
  } catch(e) { container.innerHTML = '<p>Error loading</p>'; }
}

async function acceptFriend(reqId) { try { await api(`/api/friends/accept/${reqId}`, { method: 'PUT' }); loadFriendsTab('requests'); } catch(e) {} }
async function declineFriend(reqId) { try { await api(`/api/friends/decline/${reqId}`, { method: 'PUT' }); loadFriendsTab('requests'); } catch(e) {} }
async function sendFriendReq(userId, btn) { try { await api(`/api/friends/request/${userId}`, { method: 'POST' }); btn.textContent = 'Request Sent'; btn.disabled = true; } catch(e) {} }

// ===== MESSENGER PAGE =====
function renderMessenger() {
  return `<div class="messenger">
    <div class="msg-sidebar"><h2>Chats</h2><div id="convList"></div></div>
    <div class="msg-main" id="msgMain"><div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--text2)">Select a conversation</div></div>
  </div>`;
}

async function loadMessenger() {
  try {
    const convs = await api('/api/messages/conversations');
    document.getElementById('convList').innerHTML = convs.map(c => `
      <div class="conv-item" onclick="openConversation('${c.id}')">
        <div class="conv-avatar"><img src="${c.otherUser?.profilePicture}">${c.otherUser?.isOnline?'<div class="online-dot"></div>':''}</div>
        <div class="conv-info"><h4>${c.otherUser?.firstName} ${c.otherUser?.lastName}</h4><p>${c.lastMessage?.content||'Start chatting'}</p></div>
        <div class="conv-meta">${c.lastMessage?`<span class="time">${timeAgo(c.lastMessage.createdAt)}</span>`:''}${c.unreadCount>0?`<span class="unread-badge">${c.unreadCount}</span>`:''}</div>
      </div>`).join('');
    if (convs.length > 0) openConversation(convs[0].id);
  } catch(e) {}
}

async function openConversation(convId) {
  window._activeConv = convId;
  document.querySelectorAll('.conv-item').forEach(el => el.classList.remove('active'));
  try {
    const data = await api(`/api/messages/conversations/${convId}`);
    const main = document.getElementById('msgMain');
    main.innerHTML = `
      <div class="msg-header"><img src="${data.otherUser?.profilePicture}"><div><h3>${data.otherUser?.firstName} ${data.otherUser?.lastName}</h3><p>${data.otherUser?.isOnline?'Active now':`Active ${timeAgo(data.otherUser?.lastSeen)}`}</p></div></div>
      <div class="msg-area" id="msgArea">${data.messages.map(m => `<div class="msg-row ${m.senderId===state.user.id?'mine':'theirs'}"><div class="msg-bubble">${escapeHtml(m.content)}</div></div>`).join('')}</div>
      <form class="msg-input" onsubmit="sendMessage(event)"><input id="msgInput" placeholder="Aa" autocomplete="off"><button type="submit" class="msg-send">➤</button></form>`;
    const area = document.getElementById('msgArea');
    area.scrollTop = area.scrollHeight;
  } catch(e) {}
}

async function sendMessage(e) {
  e.preventDefault();
  const input = document.getElementById('msgInput');
  if (!input.value.trim()) return;
  try {
    const msg = await api('/api/messages/send', { method: 'POST', body: JSON.stringify({ conversationId: window._activeConv, content: input.value }) });
    const area = document.getElementById('msgArea');
    area.insertAdjacentHTML('beforeend', `<div class="msg-row mine"><div class="msg-bubble">${escapeHtml(msg.content)}</div></div>`);
    input.value = '';
    area.scrollTop = area.scrollHeight;
  } catch(e) {}
}


// ===== GROUPS PAGE =====
function renderGroups() {
  return `<div class="groups-page">
    <div class="section-header"><h2>Groups</h2><button class="btn btn-primary" onclick="openCreateGroup()">+ Create New Group</button></div>
    <div class="tabs">
      <button class="tab active" onclick="loadGroupsTab('all',this)">All Groups</button>
      <button class="tab" onclick="loadGroupsTab('my',this)">Your Groups</button>
    </div>
    <div id="groupsContent" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px"></div>
  </div>`;
}

async function loadGroups() { loadGroupsTab('all'); }

async function loadGroupsTab(tab, btn) {
  if (btn) { document.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); btn.classList.add('active'); }
  try {
    const data = await api(tab === 'my' ? '/api/groups/my-groups' : '/api/groups');
    document.getElementById('groupsContent').innerHTML = data.map(g => `
      <div class="group-card">
        <div class="gc-cover" style="background-image:url(${g.coverPhoto})"></div>
        <div class="gc-info">
          <h3>${escapeHtml(g.name)}</h3>
          <p>${escapeHtml((g.description||'').substring(0,100))}</p>
          <div class="gc-stats">${g.privacy==='public'?'🌍 Public':'🔒 Private'} · ${g.membersCount} members</div>
          ${g.isMember ? `<button class="btn btn-secondary" style="width:100%" onclick="leaveGroup('${g.id}')">Leave Group</button>` : `<button class="btn btn-primary" style="width:100%" onclick="joinGroup('${g.id}')">Join Group</button>`}
        </div>
      </div>`).join('');
  } catch(e) {}
}

async function joinGroup(id) { try { await api(`/api/groups/${id}/join`, { method: 'POST' }); loadGroupsTab('all'); } catch(e) {} }
async function leaveGroup(id) { try { await api(`/api/groups/${id}/leave`, { method: 'POST' }); loadGroupsTab('all'); } catch(e) {} }

function openCreateGroup() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal">
    <div class="modal-head"><h2>Create Group</h2><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div>
    <div class="modal-body">
      <input class="form-input" id="groupName" placeholder="Group name">
      <textarea class="form-input" id="groupDesc" placeholder="Description" style="min-height:80px;resize:vertical"></textarea>
      <select class="form-input" id="groupPrivacy"><option value="public">🌍 Public</option><option value="private">🔒 Private</option></select>
    </div>
    <div class="modal-footer"><button class="btn btn-primary" onclick="submitGroup()" style="width:100%;padding:12px">Create Group</button></div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function submitGroup() {
  const name = document.getElementById('groupName').value;
  if (!name.trim()) return;
  try {
    await api('/api/groups', { method: 'POST', body: JSON.stringify({ name, description: document.getElementById('groupDesc').value, privacy: document.getElementById('groupPrivacy').value }) });
    document.querySelector('.modal-overlay').remove();
    loadGroupsTab('all');
  } catch(e) {}
}

// ===== PAGES =====
function renderPages() {
  return `<div class="pages-page">
    <div class="section-header"><h2>Pages</h2><button class="btn btn-primary" onclick="openCreatePage()">+ Create New Page</button></div>
    <div id="pagesContent" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px"></div>
  </div>`;
}

async function loadPages() {
  try {
    const data = await api('/api/pages');
    document.getElementById('pagesContent').innerHTML = data.map(p => `
      <div class="page-card">
        <div class="pc-cover" style="background-image:url(${p.coverPhoto})"><img src="${p.profilePicture}" class="pc-avatar"></div>
        <div class="pc-info">
          <h3>${escapeHtml(p.name)}</h3>
          <p class="cat">${escapeHtml(p.category)}</p>
          <p class="stats">${p.likesCount} likes · ${p.followersCount} followers</p>
          <button class="btn ${p.isLiked?'btn-secondary':'btn-primary'}" style="width:100%" onclick="likePage('${p.id}')">${p.isLiked?'✓ Liked':'👍 Like Page'}</button>
        </div>
      </div>`).join('');
  } catch(e) {}
}

async function likePage(id) { try { await api(`/api/pages/${id}/like`, { method: 'PUT' }); loadPages(); } catch(e) {} }

function openCreatePage() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal">
    <div class="modal-head"><h2>Create a Page</h2><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div>
    <div class="modal-body">
      <input class="form-input" id="pageName" placeholder="Page name">
      <input class="form-input" id="pageCategory" placeholder="Category (e.g., Restaurant, Technology)">
      <textarea class="form-input" id="pageDesc" placeholder="Description" style="min-height:80px;resize:vertical"></textarea>
    </div>
    <div class="modal-footer"><button class="btn btn-primary" onclick="submitPage()" style="width:100%;padding:12px">Create Page</button></div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function submitPage() {
  const name = document.getElementById('pageName').value;
  if (!name.trim()) return;
  try {
    await api('/api/pages', { method: 'POST', body: JSON.stringify({ name, category: document.getElementById('pageCategory').value, description: document.getElementById('pageDesc').value }) });
    document.querySelector('.modal-overlay').remove();
    loadPages();
  } catch(e) {}
}


// ===== MARKETPLACE =====
function renderMarketplace() {
  return `<div class="marketplace-page">
    <div class="section-header"><h2>Marketplace</h2><button class="btn btn-primary" onclick="openCreateListing()">+ Create Listing</button></div>
    <div class="mp-filters">
      <input placeholder="Search marketplace..." id="mpSearch" oninput="filterMarketplace()">
      <select id="mpCategory" onchange="filterMarketplace()"><option value="">All Categories</option><option>Electronics</option><option>Home & Garden</option><option>Vehicles</option><option>Clothing</option><option>Sports</option><option>Other</option></select>
    </div>
    <div class="mp-grid" id="mpGrid"></div>
  </div>`;
}

async function loadMarketplace() { filterMarketplace(); }

async function filterMarketplace() {
  const search = document.getElementById('mpSearch')?.value || '';
  const category = document.getElementById('mpCategory')?.value || '';
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  try {
    const data = await api(`/api/marketplace?${params.toString()}`);
    document.getElementById('mpGrid').innerHTML = data.map(item => `
      <div class="mp-item" onclick="openItemDetail(${JSON.stringify(item).replace(/"/g,'&quot;')})">
        <img src="${item.images?.[0] || 'https://picsum.photos/400/300'}">
        <div class="mp-item-info">
          <div class="price">$${item.price.toLocaleString()}</div>
          <div class="title">${escapeHtml(item.title)}</div>
          <div class="loc">📍 ${escapeHtml(item.location)}</div>
        </div>
      </div>`).join('');
  } catch(e) {}
}

function openItemDetail(item) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal" style="width:600px">
    <div class="modal-head"><h2>${escapeHtml(item.title)}</h2><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div>
    <div class="modal-body">
      <img src="${item.images?.[0]}" style="width:100%;border-radius:8px;margin-bottom:16px">
      <h3 style="font-size:24px;margin-bottom:8px">$${item.price.toLocaleString()}</h3>
      <p style="margin-bottom:8px;color:var(--text2)">${escapeHtml(item.condition)} · ${escapeHtml(item.category)}</p>
      <p style="margin-bottom:16px">${escapeHtml(item.description)}</p>
      ${item.seller?`<div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg);border-radius:8px">
        <img src="${item.seller.profilePicture}" style="width:48px;height:48px;border-radius:50%;object-fit:cover">
        <div><h4>${item.seller.firstName} ${item.seller.lastName}</h4><p style="font-size:13px;color:var(--text2)">📍 ${escapeHtml(item.seller.location||'')}</p></div>
      </div>`:''}
    </div>
    <div class="modal-footer"><button class="btn btn-primary" style="width:100%;padding:12px" onclick="navigate('messenger');this.closest('.modal-overlay').remove()">Message Seller</button></div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function openCreateListing() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal">
    <div class="modal-head"><h2>Create Listing</h2><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div>
    <div class="modal-body">
      <input class="form-input" id="itemTitle" placeholder="Title">
      <input class="form-input" id="itemPrice" type="number" placeholder="Price ($)">
      <select class="form-input" id="itemCategory"><option>Electronics</option><option>Home & Garden</option><option>Vehicles</option><option>Clothing</option><option>Sports</option><option>Other</option></select>
      <select class="form-input" id="itemCondition"><option>New</option><option>Like New</option><option>Good</option><option>Fair</option></select>
      <input class="form-input" id="itemLocation" placeholder="Location">
      <textarea class="form-input" id="itemDesc" placeholder="Description" style="min-height:80px;resize:vertical"></textarea>
    </div>
    <div class="modal-footer"><button class="btn btn-primary" onclick="submitListing()" style="width:100%;padding:12px">Publish Listing</button></div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function submitListing() {
  const title = document.getElementById('itemTitle').value;
  const price = document.getElementById('itemPrice').value;
  if (!title.trim() || !price) return;
  try {
    await api('/api/marketplace', { method: 'POST', body: JSON.stringify({ title, price, category: document.getElementById('itemCategory').value, condition: document.getElementById('itemCondition').value, location: document.getElementById('itemLocation').value, description: document.getElementById('itemDesc').value }) });
    document.querySelector('.modal-overlay').remove();
    filterMarketplace();
  } catch(e) {}
}


// ===== SEARCH PAGE =====
function renderSearch() {
  return `<div class="search-page">
    <h2 style="margin-bottom:16px">Search results for "${escapeHtml(state.pageParams?.q||'')}"</h2>
    <div class="tabs">
      <button class="tab active" onclick="searchTab('all',this)">All</button>
      <button class="tab" onclick="searchTab('people',this)">People</button>
      <button class="tab" onclick="searchTab('posts',this)">Posts</button>
      <button class="tab" onclick="searchTab('groups',this)">Groups</button>
      <button class="tab" onclick="searchTab('pages',this)">Pages</button>
      <button class="tab" onclick="searchTab('marketplace',this)">Marketplace</button>
    </div>
    <div id="searchResults"></div>
  </div>`;
}

async function loadSearch() { searchTab('all'); }

async function searchTab(type, btn) {
  if (btn) { document.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); btn.classList.add('active'); }
  const q = state.pageParams?.q || '';
  if (!q) return;
  try {
    const results = await api(`/api/search?q=${encodeURIComponent(q)}&type=${type}`);
    let html = '';
    if (results.users?.length) {
      html += `<div class="search-section"><h3>People</h3>${results.users.map(u => `<div class="search-item" onclick="navigate('profile',{userId:'${u.id}'})"><img src="${u.profilePicture}"><div class="si-info"><h4>${u.firstName} ${u.lastName}</h4><p>${u.bio||u.location||'Facebook user'}</p></div></div>`).join('')}</div>`;
    }
    if (results.posts?.length) {
      html += `<div class="search-section"><h3>Posts</h3>${results.posts.map(renderPostCard).join('')}</div>`;
    }
    if (results.groups?.length) {
      html += `<div class="search-section"><h3>Groups</h3>${results.groups.map(g => `<div class="search-item" onclick="navigate('groups')"><img src="${g.coverPhoto}" style="border-radius:8px"><div class="si-info"><h4>${escapeHtml(g.name)}</h4><p>${g.privacy==='public'?'🌍 Public':'🔒 Private'} · ${g.membersCount} members</p></div></div>`).join('')}</div>`;
    }
    if (results.pages?.length) {
      html += `<div class="search-section"><h3>Pages</h3>${results.pages.map(p => `<div class="search-item" onclick="navigate('pages')"><img src="${p.profilePicture}"><div class="si-info"><h4>${escapeHtml(p.name)}</h4><p>${p.category} · ${p.likesCount} likes</p></div></div>`).join('')}</div>`;
    }
    if (results.marketplace?.length) {
      html += `<div class="search-section"><h3>Marketplace</h3>${results.marketplace.map(i => `<div class="search-item" onclick="navigate('marketplace')"><img src="${i.images?.[0]}" style="border-radius:8px"><div class="si-info"><h4>${escapeHtml(i.title)}</h4><p>$${i.price} · ${i.location}</p></div></div>`).join('')}</div>`;
    }
    if (!html) html = '<p style="text-align:center;padding:40px;color:var(--text2)">No results found</p>';
    document.getElementById('searchResults').innerHTML = html;
  } catch(e) {}
}

// ===== INITIALIZATION =====
async function init() {
  if (state.token) {
    try {
      state.user = await api('/api/auth/me');
    } catch(e) {
      state.token = null; state.user = null;
      localStorage.removeItem('fb_token');
    }
  }
  render();
  // Load page-specific data after render only if logged in
  if (state.user) {
    setTimeout(loadPageData, 100);
  }
}

function loadPageData() {
  if (!state.user) return;
  switch(state.currentPage) {
    case 'feed': loadFeed(); break;
    case 'profile': loadProfile(); break;
    case 'friends': loadFriends(); break;
    case 'messenger': loadMessenger(); break;
    case 'groups': loadGroups(); break;
    case 'pages': loadPages(); break;
    case 'marketplace': loadMarketplace(); break;
    case 'search': loadSearch(); break;
  }
}

// Override navigate to also load data
const _origNavigate = navigate;
navigate = function(page, params = {}) {
  state.currentPage = page;
  state.pageParams = params;
  render();
  if (state.user) {
    setTimeout(loadPageData, 50);
  }
};

// Start the app
init();
