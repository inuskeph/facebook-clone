// ============================================
// SocialVerse - Notifications Panel
// ============================================

const NotificationsPanel = {
  isOpen: false,

  toggle() {
    const dropdown = document.getElementById('notifDropdown');
    if (!dropdown) return;
    if (NotificationsPanel.isOpen) {
      dropdown.style.display = 'none';
      NotificationsPanel.isOpen = false;
    } else {
      dropdown.style.display = 'block';
      NotificationsPanel.isOpen = true;
      NotificationsPanel.render();
    }
  },

  async loadBadge() {
    try {
      const count = await API.getUnreadCount(App.state.user.id);
      const badge = document.getElementById('notifBadge');
      if (!badge) return;
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    } catch (e) { /* silent */ }
  },

  async render() {
    const dropdown = document.getElementById('notifDropdown');
    if (!dropdown) return;
    dropdown.innerHTML = '<div class="loading" style="padding:16px;">Loading...</div>';

    try {
      const notifications = await API.getNotifications(App.state.user.id);
      // Mark as read
      API.markNotificationsRead(App.state.user.id).then(() => {
        NotificationsPanel.loadBadge();
      });

      if (!notifications.length) {
        dropdown.innerHTML = `<div class="notif-header"><h3>Notifications</h3></div><div class="empty-state" style="padding:24px;">No notifications yet</div>`;
        return;
      }

      const icons = {
        like: '👍', comment: '💬', friend_request: '👤',
        friend_accept: '✅', mention: '📢', group: '👨‍👩‍👧‍👦'
      };

      dropdown.innerHTML = `
        <div class="notif-header"><h3>Notifications</h3></div>
        <div class="notif-list">
          ${notifications.map(n => `
            <div class="notif-item ${n.read ? '' : 'unread'}" onclick="NotificationsPanel.handleClick('${n.type}','${n.reference_id || ''}','${n.from_user?.id || ''}')">
              <div class="notif-icon">${icons[n.type] || '🔔'}</div>
              <img src="${avatar(n.from_user?.avatar_url)}" class="avatar-xs">
              <div class="notif-body">
                <span class="notif-text"><strong>${escapeHtml(n.from_user?.first_name || '')} ${escapeHtml(n.from_user?.last_name || '')}</strong> ${escapeHtml(n.content || '')}</span>
                <span class="notif-time">${timeAgo(n.created_at)}</span>
              </div>
            </div>
          `).join('')}
        </div>`;
    } catch (e) {
      dropdown.innerHTML = '<div class="error-state" style="padding:16px;">Failed to load notifications</div>';
    }
  },

  handleClick(type, referenceId, fromUserId) {
    const dropdown = document.getElementById('notifDropdown');
    if (dropdown) dropdown.style.display = 'none';
    NotificationsPanel.isOpen = false;

    switch (type) {
      case 'friend_request':
        App.navigate('friends');
        break;
      case 'friend_accept':
        if (fromUserId) App.navigate('profile', { userId: fromUserId });
        break;
      case 'like':
      case 'comment':
        App.navigate('feed');
        break;
      case 'group':
        App.navigate('groups');
        break;
      default:
        if (fromUserId) App.navigate('profile', { userId: fromUserId });
        break;
    }
  }
};
