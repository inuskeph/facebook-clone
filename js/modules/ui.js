// ============================================
// SocialVerse - UI Components (Header, Modal, Toast)
// ============================================

const UI = {
  renderHeader() {
    const p = App.state.profile || {};
    return `<header class="header">
      <div class="header-left">
        <div class="logo" onclick="App.navigate('feed')">🌐 SocialVerse</div>
        <form class="search-box" id="headerSearch">
          <span class="search-icon">🔍</span>
          <input placeholder="Search SocialVerse" id="searchInput" autocomplete="off">
        </form>
      </div>
      <nav class="header-nav">
        <div class="nav-item ${App.state.currentPage==='feed'?'active':''}" onclick="App.navigate('feed')" title="Home">🏠</div>
        <div class="nav-item ${App.state.currentPage==='friends'?'active':''}" onclick="App.navigate('friends')" title="Friends">👥</div>
        <div class="nav-item ${App.state.currentPage==='groups'?'active':''}" onclick="App.navigate('groups')" title="Groups">👨‍👩‍👧‍👦</div>
        <div class="nav-item ${App.state.currentPage==='marketplace'?'active':''}" onclick="App.navigate('marketplace')" title="Marketplace">🏪</div>
        <div class="nav-item ${App.state.currentPage==='pages'?'active':''}" onclick="App.navigate('pages')" title="Pages">📄</div>
      </nav>
      <div class="header-right">
        <button class="icon-btn" onclick="App.navigate('messenger')" title="Messenger">💬</button>
        <button class="icon-btn" id="notifBtn" title="Notifications">🔔<span class="badge" id="notifBadge" style="display:none"></span></button>
        <img src="${avatar(p.avatar_url)}" class="avatar-btn" id="avatarBtn" title="${p.first_name||''} ${p.last_name||''}">
      </div>
    </header>
    <div class="dropdown" id="notifDropdown" style="display:none"></div>
    <div class="dropdown user-menu" id="userDropdown" style="display:none"></div>`;
  },

  attachHeaderEvents() {
    document.getElementById('headerSearch')?.addEventListener('submit', e => {
      e.preventDefault();
      const q = document.getElementById('searchInput').value.trim();
      if (q) App.navigate('search', { q });
    });

    document.getElementById('notifBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      NotificationsPanel.toggle();
    });

    document.getElementById('avatarBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      UI.toggleUserMenu();
    });

    document.addEventListener('click', () => {
      document.getElementById('notifDropdown').style.display = 'none';
      document.getElementById('userDropdown').style.display = 'none';
    });

    // Load notification badge
    NotificationsPanel.loadBadge();
  },

  toggleUserMenu() {
    const drop = document.getElementById('userDropdown');
    if (drop.style.display !== 'none') { drop.style.display = 'none'; return; }
    const p = App.state.profile || {};
    drop.innerHTML = `
      <div class="menu-item" onclick="App.navigate('profile',{userId:'${App.state.user.id}'})">
        <img src="${avatar(p.avatar_url)}"><span>${p.first_name} ${p.last_name}</span>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" onclick="App.navigate('profile',{userId:'${App.state.user.id}'})">
        <span class="menu-icon">👤</span><span>My Profile</span>
      </div>
      <div class="menu-item" onclick="AuthPage.logout()">
        <span class="menu-icon">🚪</span><span>Log Out</span>
      </div>`;
    drop.style.display = 'block';
  },

  // Modal system
  openModal(title, bodyHtml, footerHtml = '') {
    const root = document.getElementById('modal-root');
    root.innerHTML = `<div class="modal-overlay" id="modalOverlay">
      <div class="modal">
        <div class="modal-head"><h2>${title}</h2><button class="modal-close" onclick="UI.closeModal()">✕</button></div>
        <div class="modal-body">${bodyHtml}</div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
      </div>
    </div>`;
    document.getElementById('modalOverlay').addEventListener('click', e => { if (e.target.id === 'modalOverlay') UI.closeModal(); });
  },

  closeModal() {
    document.getElementById('modal-root').innerHTML = '';
  },

  // Toast notifications
  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
  }
};
