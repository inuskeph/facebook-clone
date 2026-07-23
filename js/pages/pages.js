// ============================================
// SocialVerse - Pages Page
// ============================================

const PagesPage = {
  render() {
    return `<div class="pages-page">
      <div class="page-header">
        <h1>Pages</h1>
        <button class="btn btn-primary" onclick="PagesPage.openCreateModal()">+ Create Page</button>
      </div>
      <div class="pages-grid" id="pagesGrid"><div class="loading">Loading pages...</div></div>
    </div>`;
  },

  async load() {
    try {
      const pages = await API.getPages();
      const el = document.getElementById('pagesGrid');
      if (!el) return;
      if (!pages.length) { el.innerHTML = '<div class="empty-state">No pages yet. Create one!</div>'; return; }
      const userId = App.state.user.id;
      el.innerHTML = pages.map(p => {
        const followerCount = (p.followers || []).length;
        const isLiked = (p.followers || []).some(f => f.user_id === userId);
        return `<div class="page-card">
          <div class="page-cover" style="background:${p.cover_url ? `url(${p.cover_url})` : 'linear-gradient(135deg,#6c5ce7,#a29bfe)'};background-size:cover;"></div>
          <div class="page-info">
            <h3>${escapeHtml(p.name)}</h3>
            <p class="text-muted">${escapeHtml(p.category || 'Page')}</p>
            <span class="page-likes">${formatNumber(followerCount)} likes</span>
            ${isLiked
              ? `<button class="btn btn-outline btn-sm" onclick="PagesPage.toggleLike('${p.id}')">👎 Unlike</button>`
              : `<button class="btn btn-primary btn-sm" onclick="PagesPage.toggleLike('${p.id}')">👍 Like</button>`
            }
          </div>
        </div>`;
      }).join('');
    } catch (e) {
      const el = document.getElementById('pagesGrid');
      if (el) el.innerHTML = '<div class="error-state">Failed to load pages</div>';
    }
  },

  async toggleLike(pageId) {
    try {
      await API.togglePageLike(pageId, App.state.user.id);
      PagesPage.load();
    } catch (e) { UI.toast('Error', 'error'); }
  },

  openCreateModal() {
    UI.openModal('Create New Page', `
      <form id="createPageForm">
        <label>Page Name</label>
        <input type="text" id="pageName" placeholder="Enter page name" required>
        <label>Category</label>
        <select id="pageCategory">
          <option value="Business">Business</option>
          <option value="Community">Community</option>
          <option value="Entertainment">Entertainment</option>
          <option value="Education">Education</option>
          <option value="Brand">Brand</option>
          <option value="Public Figure">Public Figure</option>
        </select>
        <label>Description</label>
        <textarea id="pageDesc" placeholder="Describe your page" rows="3"></textarea>
      </form>
    `, '<button class="btn btn-primary" id="createPageBtn">Create Page</button>');

    document.getElementById('createPageBtn')?.addEventListener('click', async () => {
      const name = document.getElementById('pageName').value.trim();
      const category = document.getElementById('pageCategory').value;
      const description = document.getElementById('pageDesc').value.trim();
      if (!name) return UI.toast('Please enter a page name', 'error');

      try {
        await API.createPage({ name, category, description, creator_id: App.state.user.id });
        UI.closeModal();
        UI.toast('Page created!', 'success');
        PagesPage.load();
      } catch (e) { UI.toast(e.message || 'Failed to create page', 'error'); }
    });
  }
};
