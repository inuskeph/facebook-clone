// ============================================
// SocialVerse - Auth Page
// ============================================

const AuthPage = {
  render() {
    return `<div class="auth-page">
      <div class="auth-container">
        <div class="auth-hero">
          <h1>🌐 SocialVerse</h1>
          <p>Connect with friends and the world around you on SocialVerse.</p>
        </div>
        <div class="auth-form-wrapper">
          <form class="auth-form" id="loginForm">
            <input type="email" id="loginEmail" placeholder="Email address" required>
            <input type="password" id="loginPassword" placeholder="Password" required>
            <button type="submit" class="btn btn-primary btn-block">Log In</button>
            <div class="auth-divider"><span>or</span></div>
            <button type="button" class="btn btn-success btn-block" id="showRegisterBtn">Create New Account</button>
          </form>
        </div>
      </div>
    </div>`;
  },

  attach() {
    document.getElementById('loginForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      AuthPage.handleLogin();
    });
    document.getElementById('showRegisterBtn')?.addEventListener('click', () => {
      AuthPage.showRegisterForm();
    });
  },

  async handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) return UI.toast('Please fill in all fields', 'error');

    try {
      const data = await API.login(email, password);
      App.state.user = data.user;
      App.state.profile = await API.getProfile(data.user.id);
      App.navigate('feed');
      UI.toast('Welcome back!', 'success');
    } catch (err) {
      UI.toast(err.message || 'Login failed', 'error');
    }
  },

  showRegisterForm() {
    UI.openModal('Create a New Account', `
      <p style="color:var(--text-secondary);margin-bottom:16px;">It's quick and easy.</p>
      <form id="registerForm">
        <div class="form-row">
          <input type="text" id="regFirstName" placeholder="First name" required>
          <input type="text" id="regLastName" placeholder="Last name" required>
        </div>
        <input type="email" id="regEmail" placeholder="Email address" required>
        <input type="password" id="regPassword" placeholder="New password" minlength="6" required>
        <button type="submit" class="btn btn-success btn-block" style="margin-top:12px;">Sign Up</button>
      </form>
    `);
    document.getElementById('registerForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      AuthPage.handleRegister();
    });
  },

  async handleRegister() {
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    if (!firstName || !lastName || !email || !password) {
      return UI.toast('Please fill in all fields', 'error');
    }

    try {
      const data = await API.signup(email, password, { first_name: firstName, last_name: lastName });
      UI.closeModal();
      if (data.user) {
        // Create profile
        await db.from('profiles').upsert({
          id: data.user.id,
          first_name: firstName,
          last_name: lastName,
          email: email
        });
        App.state.user = data.user;
        App.state.profile = await API.getProfile(data.user.id);
        App.navigate('feed');
        UI.toast('Welcome to SocialVerse!', 'success');
      } else {
        UI.toast('Check your email to confirm your account', 'info');
      }
    } catch (err) {
      UI.toast(err.message || 'Registration failed', 'error');
    }
  },

  async logout() {
    try {
      await API.logout();
      App.state.user = null;
      App.state.profile = null;
      App.render();
      UI.toast('Logged out', 'info');
    } catch (err) {
      UI.toast('Logout failed', 'error');
    }
  }
};
