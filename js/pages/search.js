// ============================================
// SocialVerse - Search Page
// ============================================

const SearchPage = {
  currentTab: 'all',
  query: '',

  render() {
    SearchPage.query = App.state.pageParams.q || '';
    return `<div class="search-page">
      <div class="page-header">
        <h1>Search Results</h1>
        <form class="search-form-large" id="searchFormLarge">
          <input type="text" id="searchQueryInput" placeholder="Search SocialVerse..." value="${escapeHtml(SearchPage.query)}">
          <button type="submit" class="btn btn-primary">Search</button>
        </form>
        <div class="tabs">
          <button class="tab ${SearchPage.currentTab === 'all' ? 'active' : ''}" onclick="SearchPage.switchTab('all')">All</button>
          <button class="tab ${SearchPage.currentTab === 'people' ? 'active' : ''}" onclick="SearchPage.switchTab('people')">People</button>
          <button class="tab ${SearchPage.currentTab === 'posts' ? 'active' : ''}" onclick="SearchPage.switchTab('posts')">Posts</button>
          <button class="tab ${SearchPage.currentTab === 'groups' ? 'active' : ''}" onclick="SearchPage.switchTab('groups')">Groups</button>
        </div>
      </div>
      <div id="searchResults" class="search-results"><div class="loading">Searching...</div></div>
    </div>`;
  },

  async load() {
    document.getElementById('searchFormLarge')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = document.getElementById('searchQueryInput').value.trim();
      if (q) {
        SearchPage.query = q;
        SearchPage.performSearch();
      }
    });

    if (SearchPage.query) {
      SearchPage.performSearch();
    } else {
      const el = document.getElementById('searchResults');
      if (el) el.innerHTML = '<div class="empty-state">Enter a search term to find people, posts, and groups</div>';
    }
  },

  async performSearch() {
    const el = document.getElementById('searchResults');
    if (!el) return;
    el.innerHTML = '<div class="loading">Searching...</div>';

    try {
      const results = await API.search(SearchPage.query, SearchPage.currentTab);
      let html = '';

      if (SearchPage.currentTab === 'all' || SearchPage.currentTab === 'people') {
        if (results.people && results.people.length) {
          html += `<div class="search-section">
            <h3>People</h3>
            ${results.people.map(p => `
              <div class="search-result-item" onclick="App.navigate('profile',{userId:'${p.id}'})">
                <img src="${avatar(p.avatar_url)}" class="avatar-sm">
                <div>
                  <span class="result-name">${escapeHtml(p.first_name)} ${escapeHtml(p.last_name)}</span>
                  <span class="text-muted">${escapeHtml(p.location || '')}</span>
                </div>
              </div>
            `).join('')}
          </div>`;
        }
      }

      if (SearchPage.currentTab === 'all' || SearchPage.currentTab === 'posts') {
        if (results.posts && results.posts.length) {
          html += `<div class="search-section">
            <h3>Posts</h3>
            ${results.posts.map(post => `
              <div class="search-result-item post-result">
                <img src="${avatar(post.author?.avatar_url)}" class="avatar-sm">
                <div>
                  <span class="result-name">${escapeHtml(post.author?.first_name)} ${escapeHtml(post.author?.last_name)}</span>
                  <p class="result-content">${escapeHtml(post.content?.substring(0, 150))}${post.content?.length > 150 ? '...' : ''}</p>
                  <span class="text-muted">${timeAgo(post.created_at)}</span>
                </div>
              </div>
            `).join('')}
          </div>`;
        }
      }

      if (SearchPage.currentTab === 'all' || SearchPage.currentTab === 'groups') {
        if (results.groups && results.groups.length) {
          html += `<div class="search-section">
            <h3>Groups</h3>
            ${results.groups.map(g => `
              <div class="search-result-item">
                <div class="group-icon">👨‍👩‍👧‍👦</div>
                <div>
                  <span class="result-name">${escapeHtml(g.name)}</span>
                  <span class="text-muted">${escapeHtml(g.description || '')}</span>
                </div>
              </div>
            `).join('')}
          </div>`;
        }
      }

      el.innerHTML = html || '<div class="empty-state">No results found</div>';
    } catch (e) {
      el.innerHTML = '<div class="error-state">Search failed</div>';
    }
  },

  switchTab(tab) {
    SearchPage.currentTab = tab;
    App.navigate('search', { q: SearchPage.query });
  }
};
