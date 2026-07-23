// ============================================
// SocialVerse - Marketplace Page
// ============================================

const MarketplacePage = {
  filters: { category: '', search: '' },

  render() {
    return `<div class="marketplace-page">
      <div class="page-header">
        <h1>Marketplace</h1>
        <button class="btn btn-primary" onclick="MarketplacePage.openCreateModal()">+ Create Listing</button>
      </div>
      <div class="marketplace-filters">
        <input type="text" id="marketSearch" placeholder="Search Marketplace" value="${escapeHtml(MarketplacePage.filters.search)}">
        <select id="marketCategory">
          <option value="">All Categories</option>
          <option value="vehicles">Vehicles</option>
          <option value="electronics">Electronics</option>
          <option value="furniture">Furniture</option>
          <option value="clothing">Clothing</option>
          <option value="sports">Sports</option>
          <option value="other">Other</option>
        </select>
        <button class="btn btn-outline" onclick="MarketplacePage.applyFilters()">Filter</button>
      </div>
      <div class="marketplace-grid" id="marketplaceGrid"><div class="loading">Loading items...</div></div>
    </div>`;
  },

  async load() {
    try {
      const items = await API.getMarketplaceItems(MarketplacePage.filters);
      const el = document.getElementById('marketplaceGrid');
      if (!el) return;
      if (!items.length) { el.innerHTML = '<div class="empty-state">No items found</div>'; return; }
      el.innerHTML = items.map(item => `
        <div class="market-item-card" onclick="MarketplacePage.openDetail('${item.id}')">
          <div class="market-item-image">
            <img src="${item.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="${escapeHtml(item.title)}">
          </div>
          <div class="market-item-info">
            <span class="market-price">$${escapeHtml(String(item.price || 0))}</span>
            <h4>${escapeHtml(item.title)}</h4>
            <span class="text-muted">${escapeHtml(item.seller?.location || 'Unknown location')}</span>
          </div>
        </div>
      `).join('');

      // Store items for detail view
      window._marketItems = items;
    } catch (e) {
      const el = document.getElementById('marketplaceGrid');
      if (el) el.innerHTML = '<div class="error-state">Failed to load items</div>';
    }
  },

  applyFilters() {
    MarketplacePage.filters.search = document.getElementById('marketSearch')?.value.trim() || '';
    MarketplacePage.filters.category = document.getElementById('marketCategory')?.value || '';
    MarketplacePage.load();
  },


  openDetail(itemId) {
    const items = window._marketItems || [];
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    UI.openModal(escapeHtml(item.title), `
      <div class="market-detail">
        <img src="${item.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}" class="market-detail-img">
        <div class="market-detail-info">
          <h2 class="market-detail-price">$${escapeHtml(String(item.price || 0))}</h2>
          <p class="market-detail-desc">${escapeHtml(item.description || 'No description')}</p>
          <div class="market-detail-meta">
            <span>📍 ${escapeHtml(item.seller?.location || 'Unknown')}</span>
            <span>📦 ${escapeHtml(item.category || 'Other')}</span>
            <span>🕐 Listed ${timeAgo(item.created_at)}</span>
          </div>
          <div class="market-detail-seller">
            <img src="${avatar(item.seller?.avatar_url)}" class="avatar-sm">
            <span>${escapeHtml(item.seller?.first_name || '')} ${escapeHtml(item.seller?.last_name || '')}</span>
          </div>
          <button class="btn btn-primary btn-block" onclick="App.navigate('messenger',{friendId:'${item.seller?.id}'});UI.closeModal();">Message Seller</button>
        </div>
      </div>
    `);
  },

  openCreateModal() {
    UI.openModal('Create Listing', `
      <form id="createListingForm">
        <label>Title</label>
        <input type="text" id="listingTitle" placeholder="What are you selling?" required>
        <label>Price ($)</label>
        <input type="number" id="listingPrice" placeholder="0" min="0" required>
        <label>Category</label>
        <select id="listingCategory">
          <option value="electronics">Electronics</option>
          <option value="vehicles">Vehicles</option>
          <option value="furniture">Furniture</option>
          <option value="clothing">Clothing</option>
          <option value="sports">Sports</option>
          <option value="other">Other</option>
        </select>
        <label>Description</label>
        <textarea id="listingDesc" rows="3" placeholder="Describe your item"></textarea>
        <label>Photo</label>
        <input type="file" id="listingImage" accept="image/*">
        <div id="listingImgPreview" style="display:none;margin-top:8px;">
          <img id="listingPrevImg" style="max-width:100%;max-height:200px;border-radius:8px;">
        </div>
      </form>
    `, '<button class="btn btn-primary" id="createListingBtn">Publish Listing</button>');

    let listingFile = null;

    document.getElementById('listingImage')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      listingFile = file;
      const reader = new FileReader();
      reader.onload = (ev) => {
        document.getElementById('listingPrevImg').src = ev.target.result;
        document.getElementById('listingImgPreview').style.display = 'block';
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('createListingBtn')?.addEventListener('click', async () => {
      const title = document.getElementById('listingTitle').value.trim();
      const price = parseFloat(document.getElementById('listingPrice').value) || 0;
      const category = document.getElementById('listingCategory').value;
      const description = document.getElementById('listingDesc').value.trim();

      if (!title) return UI.toast('Please enter a title', 'error');

      const btn = document.getElementById('createListingBtn');
      btn.disabled = true;
      btn.textContent = 'Publishing...';

      try {
        let imageUrl = null;
        if (listingFile) {
          const ext = listingFile.name.split('.').pop();
          const path = `${App.state.user.id}/${Date.now()}.${ext}`;
          imageUrl = await API.uploadImage('marketplace', path, listingFile);
        }
        await API.createListing({
          seller_id: App.state.user.id,
          title, price, category, description,
          image_url: imageUrl, status: 'available'
        });
        UI.closeModal();
        UI.toast('Listing created!', 'success');
        MarketplacePage.load();
      } catch (e) {
        UI.toast(e.message || 'Failed to create listing', 'error');
        btn.disabled = false;
        btn.textContent = 'Publish Listing';
      }
    });
  }
};
