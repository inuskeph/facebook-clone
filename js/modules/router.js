// ============================================
// SocialVerse - Router & State
// ============================================

const App = {
  state: {
    user: null,
    profile: null,
    currentPage: 'feed',
    pageParams: {}
  },

  navigate(page, params = {}) {
    App.state.currentPage = page;
    App.state.pageParams = params;
    App.render();
    if (App.state.user) setTimeout(() => App.loadPage(), 50);
  },

  render() {
    const app = document.getElementById('app');
    if (!App.state.user) {
      app.innerHTML = AuthPage.render();
      AuthPage.attach();
      return;
    }
    app.innerHTML = UI.renderHeader() + `<div class="main">${App.renderCurrentPage()}</div>`;
    UI.attachHeaderEvents();
  },

  renderCurrentPage() {
    const pages = {
      feed: FeedPage,
      profile: ProfilePage,
      friends: FriendsPage,
      messenger: MessengerPage,
      groups: GroupsPage,
      pages: PagesPage,
      marketplace: MarketplacePage,
      search: SearchPage,
    };
    return (pages[App.state.currentPage] || FeedPage).render();
  },

  loadPage() {
    if (!App.state.user) return;
    const loaders = {
      feed: FeedPage.load,
      profile: ProfilePage.load,
      friends: FriendsPage.load,
      messenger: MessengerPage.load,
      groups: GroupsPage.load,
      pages: PagesPage.load,
      marketplace: MarketplacePage.load,
      search: SearchPage.load,
    };
    (loaders[App.state.currentPage] || FeedPage.load)();
  },

  async init() {
    const session = await API.getSession();
    if (session) {
      App.state.user = session.user;
      App.state.profile = await API.getProfile(session.user.id);
    }
    App.render();
    if (App.state.user) setTimeout(() => App.loadPage(), 100);

    db.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        App.state.user = null;
        App.state.profile = null;
        App.render();
      }
    });
  }
};
