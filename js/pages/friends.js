// ============================================
// SocialVerse - Friends Page
// ============================================

const FriendsPage = {
  currentTab: 'requests',

  render() {
    return `<div class="friends-page">
      <div class="page-header">
        <h1>Friends</h1>
        <div class="tabs">
          <button class="tab ${FriendsPage.currentTab === 'requests' ? 'active' : ''}" onclick="FriendsPage.switchTab('requests')">Requests</button>
          <button class="tab ${FriendsPage.currentTab === 'suggestions' ? 'active' : ''}" onclick="FriendsPage.switchTab('suggestions')">Suggestions</button>
          <button class="tab ${FriendsPage.currentTab === 'all' ? 'active' : ''}" onclick="FriendsPage.switchTab('all')">All Friends</button>
        </div>
      </div>
      <div id="friendsContent" class="friends-content"><div class="loading">Loading...</div></div>
    </div>`;
  },

  async load() {
    const container = document.getElementById('friendsContent');
    if (!container) return;
    const userId = App.state.user.id;

    try {
      switch (FriendsPage.currentTab) {
        case 'requests': {
          const requests = await API.getFriendRequests(userId);
          if (!requests.length) { container.innerHTML = '<div class="empty-state">No pending requests</div>'; return; }
          container.innerHTML = `<div class="friends-grid">${requests.map(r => `
            <div class="friend-request-card">
              <img src="${avatar(r.from.avatar_url)}" onclick="App.navigate('profile',{userId:'${r.from.id}'})">
              <h4>${escapeHtml(r.from.first_name)} ${escapeHtml(r.from.last_name)}</h4>
              <div class="request-actions">
                <button class="btn btn-primary btn-sm" onclick="FriendsPage.accept('${r.id}')">Confirm</button>
                <button class="btn btn-outline btn-sm" onclick="FriendsPage.decline('${r.id}')">Delete</button>
              </div>
            </div>
          `).join('')}</div>`;
          break;
        }
        case 'suggestions': {
          const suggestions = await API.getSuggestions(userId);
          if (!suggestions.length) { container.innerHTML = '<div class="empty-state">No suggestions right now</div>'; return; }
          container.innerHTML = `<div class="friends-grid">${suggestions.map(s => `
            <div class="friend-request-card">
              <img src="${avatar(s.avatar_url)}" onclick="App.navigate('profile',{userId:'${s.id}'})">
              <h4>${escapeHtml(s.first_name)} ${escapeHtml(s.last_name)}</h4>
              <button class="btn btn-primary btn-sm" onclick="FriendsPage.sendRequest('${s.id}')">Add Friend</button>
            </div>
          `).join('')}</div>`;
          break;
        }
        case 'all': {
          const friends = await API.getFriends(userId);
          if (!friends.length) { container.innerHTML = '<div class="empty-state">No friends yet</div>'; return; }
          container.innerHTML = `<div class="friends-grid">${friends.map(f => `
            <div class="friend-card" onclick="App.navigate('profile',{userId:'${f.friend.id}'})">
              <img src="${avatar(f.friend.avatar_url)}">
              <h4>${escapeHtml(f.friend.first_name)} ${escapeHtml(f.friend.last_name)}</h4>
              <span class="text-muted">${escapeHtml(f.friend.location || '')}</span>
            </div>
          `).join('')}</div>`;
          break;
        }
      }
    } catch (e) {
      container.innerHTML = '<div class="error-state">Failed to load friends</div>';
    }
  },

  switchTab(tab) {
    FriendsPage.currentTab = tab;
    App.navigate('friends');
  },

  async accept(requestId) {
    try {
      await API.acceptFriendRequest(requestId);
      UI.toast('Friend request accepted!', 'success');
      FriendsPage.load();
    } catch (e) { UI.toast('Error accepting request', 'error'); }
  },

  async decline(requestId) {
    try {
      await API.declineFriendRequest(requestId);
      UI.toast('Request removed', 'info');
      FriendsPage.load();
    } catch (e) { UI.toast('Error', 'error'); }
  },

  async sendRequest(userId) {
    try {
      await API.sendFriendRequest(App.state.user.id, userId);
      UI.toast('Friend request sent!', 'success');
      FriendsPage.load();
    } catch (e) { UI.toast('Failed to send request', 'error'); }
  }
};
