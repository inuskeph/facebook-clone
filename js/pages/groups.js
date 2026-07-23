// ============================================
// SocialVerse - Groups Page
// ============================================

const GroupsPage = {
  render() {
    return `<div class="groups-page">
      <div class="page-header">
        <h1>Groups</h1>
        <button class="btn btn-primary" onclick="GroupsPage.openCreateModal()">+ Create Group</button>
      </div>
      <div class="groups-grid" id="groupsGrid"><div class="loading">Loading groups...</div></div>
    </div>`;
  },

  async load() {
    try {
      const groups = await API.getGroups();
      const el = document.getElementById('groupsGrid');
      if (!el) return;
      if (!groups.length) { el.innerHTML = '<div class="empty-state">No groups yet. Create one!</div>'; return; }
      const userId = App.state.user.id;
      el.innerHTML = groups.map(g => {
        const memberCount = (g.members || []).length;
        const isMember = (g.members || []).some(m => m.user_id === userId);
        return `<div class="group-card">
          <div class="group-cover" style="background:${g.cover_url ? `url(${g.cover_url})` : 'linear-gradient(135deg,#1877f2,#42b72a)'};background-size:cover;"></div>
          <div class="group-info">
            <h3>${escapeHtml(g.name)}</h3>
            <p class="text-muted">${escapeHtml(g.description || '')}</p>
            <span class="group-members">${formatNumber(memberCount)} members</span>
            ${isMember
              ? `<button class="btn btn-outline btn-sm" onclick="GroupsPage.leave('${g.id}')">Leave Group</button>`
              : `<button class="btn btn-primary btn-sm" onclick="GroupsPage.join('${g.id}')">Join Group</button>`
            }
          </div>
        </div>`;
      }).join('');
    } catch (e) {
      const el = document.getElementById('groupsGrid');
      if (el) el.innerHTML = '<div class="error-state">Failed to load groups</div>';
    }
  },

  async join(groupId) {
    try {
      await API.joinGroup(groupId, App.state.user.id);
      UI.toast('Joined group!', 'success');
      GroupsPage.load();
    } catch (e) { UI.toast('Failed to join group', 'error'); }
  },

  async leave(groupId) {
    try {
      await API.leaveGroup(groupId, App.state.user.id);
      UI.toast('Left group', 'info');
      GroupsPage.load();
    } catch (e) { UI.toast('Failed to leave group', 'error'); }
  },

  openCreateModal() {
    UI.openModal('Create New Group', `
      <form id="createGroupForm">
        <label>Group Name</label>
        <input type="text" id="groupName" placeholder="Enter group name" required>
        <label>Description</label>
        <textarea id="groupDesc" placeholder="What is this group about?" rows="3"></textarea>
        <label>Privacy</label>
        <select id="groupPrivacy">
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
      </form>
    `, '<button class="btn btn-primary" id="createGroupBtn">Create</button>');

    document.getElementById('createGroupBtn')?.addEventListener('click', async () => {
      const name = document.getElementById('groupName').value.trim();
      const description = document.getElementById('groupDesc').value.trim();
      const privacy = document.getElementById('groupPrivacy').value;
      if (!name) return UI.toast('Please enter a group name', 'error');

      try {
        const group = await API.createGroup({ name, description, privacy, creator_id: App.state.user.id });
        if (group) await API.joinGroup(group.id, App.state.user.id);
        UI.closeModal();
        UI.toast('Group created!', 'success');
        GroupsPage.load();
      } catch (e) { UI.toast(e.message || 'Failed to create group', 'error'); }
    });
  }
};
