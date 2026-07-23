// ============================================
// SocialVerse - Profile Page
// ============================================

const ProfilePage = {
  currentTab: 'posts',

  render() {
    return `<div class="profile-page" id="profilePage">
      <div class="loading">Loading profile...</div>
    </div>`;
  },

  async load() {
    const userId = App.state.pageParams.userId || App.state.user.id;
    try {
      const profile = await API.getProfile(userId);
      if (!profile) { document.getElementById('profilePage').innerHTML = '<div class="error-state">Profile not found</div>'; return; }
      const friends = await API.getFriends(userId);
      const posts = await API.getUserPosts(userId);
      const isOwn = userId === App.state.user.id;


      const el = document.getElementById('profilePage');
      if (!el) return;
      el.innerHTML = ProfilePage.renderProfile(profile, friends, posts, isOwn);
      ProfilePage.attachEvents(profile, friends, posts, isOwn);
    } catch (e) {
      const el = document.getElementById('profilePage');
      if (el) el.innerHTML = '<div class="error-state">Failed to load profile</div>';
    }
  },

  renderProfile(profile, friends, posts, isOwn) {
    return `<div class="profile-cover" style="background-image:url('${profile.cover_url || ''}')">
      ${isOwn ? '<button class="btn btn-sm edit-cover-btn" onclick="ProfilePage.editCover()">📷 Edit Cover</button>' : ''}
    </div>
    <div class="profile-header">
      <div class="profile-avatar-wrapper">
        <img src="${avatar(profile.avatar_url)}" class="profile-avatar">
        ${isOwn ? '<button class="avatar-edit-btn" onclick="ProfilePage.editAvatar()">📷</button>' : ''}
      </div>
      <div class="profile-name-section">
        <h1>${escapeHtml(profile.first_name)} ${escapeHtml(profile.last_name)}</h1>
        <span class="profile-friends-count">${friends.length} friends</span>
      </div>
      <div class="profile-actions">
        ${isOwn ? '<button class="btn btn-primary" onclick="ProfilePage.openEditModal()">✏️ Edit Profile</button>' : `<button class="btn btn-primary" onclick="ProfilePage.addFriend('${profile.id}')">👤+ Add Friend</button><button class="btn btn-outline" onclick="App.navigate(\'messenger\',{friendId:\'${profile.id}\'})">💬 Message</button>`}
      </div>
    </div>
    <div class="profile-tabs">
      <button class="tab ${ProfilePage.currentTab === 'posts' ? 'active' : ''}" onclick="ProfilePage.switchTab('posts')">Posts</button>
      <button class="tab ${ProfilePage.currentTab === 'about' ? 'active' : ''}" onclick="ProfilePage.switchTab('about')">About</button>
      <button class="tab ${ProfilePage.currentTab === 'friends' ? 'active' : ''}" onclick="ProfilePage.switchTab('friends')">Friends</button>
      <button class="tab ${ProfilePage.currentTab === 'photos' ? 'active' : ''}" onclick="ProfilePage.switchTab('photos')">Photos</button>
    </div>
    <div class="profile-body">
      <div class="profile-sidebar">
        <div class="card">
          <h3>Intro</h3>
          ${profile.bio ? `<p>${escapeHtml(profile.bio)}</p>` : ''}
          ${profile.location ? `<p>📍 Lives in ${escapeHtml(profile.location)}</p>` : ''}
          ${profile.workplace ? `<p>💼 Works at ${escapeHtml(profile.workplace)}</p>` : ''}
          ${profile.education ? `<p>🎓 Studied at ${escapeHtml(profile.education)}</p>` : ''}
        </div>
        <div class="card">
          <h3>Friends <span class="count">${friends.length}</span></h3>
          <div class="friends-grid-small">
            ${friends.slice(0, 9).map(f => `
              <div class="friend-thumb" onclick="App.navigate('profile',{userId:'${f.friend.id}'})">
                <img src="${avatar(f.friend.avatar_url)}">
                <span>${escapeHtml(f.friend.first_name)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="profile-content" id="profileContent">
        ${ProfilePage.renderTabContent(profile, friends, posts, isOwn)}
      </div>
    </div>`;
  },


  renderTabContent(profile, friends, posts, isOwn) {
    switch (ProfilePage.currentTab) {
      case 'posts':
        return posts.map(post => FeedPage.renderPostCard(post)).join('') || '<div class="empty-state">No posts yet</div>';
      case 'about':
        return `<div class="card about-card">
          <h3>About</h3>
          <div class="about-item"><span class="about-icon">💼</span><span>Works at ${escapeHtml(profile.workplace || 'Not specified')}</span></div>
          <div class="about-item"><span class="about-icon">🎓</span><span>Studied at ${escapeHtml(profile.education || 'Not specified')}</span></div>
          <div class="about-item"><span class="about-icon">📍</span><span>Lives in ${escapeHtml(profile.location || 'Not specified')}</span></div>
          <div class="about-item"><span class="about-icon">❤️</span><span>${escapeHtml(profile.relationship || 'Not specified')}</span></div>
          <div class="about-item"><span class="about-icon">📧</span><span>${escapeHtml(profile.email || '')}</span></div>
        </div>`;
      case 'friends':
        return `<div class="friends-grid">${friends.map(f => `
          <div class="friend-card" onclick="App.navigate('profile',{userId:'${f.friend.id}'})">
            <img src="${avatar(f.friend.avatar_url)}">
            <h4>${escapeHtml(f.friend.first_name)} ${escapeHtml(f.friend.last_name)}</h4>
            <span class="text-muted">${escapeHtml(f.friend.location || '')}</span>
          </div>
        `).join('')}</div>`;
      case 'photos':
        const photos = posts.filter(p => p.image_url);
        return `<div class="photos-grid">${photos.map(p => `
          <div class="photo-item"><img src="${p.image_url}" alt="Photo"></div>
        `).join('')}</div>` || '<div class="empty-state">No photos yet</div>';
      default:
        return '';
    }
  },

  switchTab(tab) {
    ProfilePage.currentTab = tab;
    ProfilePage.load();
  },

  attachEvents(profile, friends, posts, isOwn) {
    // Events are attached via onclick in the rendered HTML
  },

  async addFriend(userId) {
    try {
      await API.sendFriendRequest(App.state.user.id, userId);
      UI.toast('Friend request sent!', 'success');
    } catch (e) { UI.toast('Failed to send request', 'error'); }
  },

  openEditModal() {
    const p = App.state.profile || {};
    UI.openModal('Edit Profile', `
      <form id="editProfileForm">
        <label>First Name</label>
        <input type="text" id="editFirstName" value="${escapeHtml(p.first_name || '')}">
        <label>Last Name</label>
        <input type="text" id="editLastName" value="${escapeHtml(p.last_name || '')}">
        <label>Bio</label>
        <textarea id="editBio" rows="3">${escapeHtml(p.bio || '')}</textarea>
        <label>Location</label>
        <input type="text" id="editLocation" value="${escapeHtml(p.location || '')}">
        <label>Workplace</label>
        <input type="text" id="editWorkplace" value="${escapeHtml(p.workplace || '')}">
        <label>Education</label>
        <input type="text" id="editEducation" value="${escapeHtml(p.education || '')}">
      </form>
    `, '<button class="btn btn-primary" id="saveProfileBtn">Save Changes</button>');

    document.getElementById('saveProfileBtn')?.addEventListener('click', async () => {
      try {
        const updates = {
          first_name: document.getElementById('editFirstName').value.trim(),
          last_name: document.getElementById('editLastName').value.trim(),
          bio: document.getElementById('editBio').value.trim(),
          location: document.getElementById('editLocation').value.trim(),
          workplace: document.getElementById('editWorkplace').value.trim(),
          education: document.getElementById('editEducation').value.trim()
        };
        const updated = await API.updateProfile(App.state.user.id, updates);
        App.state.profile = updated;
        UI.closeModal();
        UI.toast('Profile updated!', 'success');
        ProfilePage.load();
      } catch (e) { UI.toast('Failed to update profile', 'error'); }
    });
  },

  editAvatar() {
    UI.openModal('Update Profile Picture', `
      <input type="file" id="avatarFileInput" accept="image/*">
      <div id="avatarPreview" style="margin-top:12px;display:none"><img id="avatarPrevImg" style="max-width:200px;border-radius:50%;"></div>
    `, '<button class="btn btn-primary" id="uploadAvatarBtn" disabled>Upload</button>');

    let file = null;
    document.getElementById('avatarFileInput')?.addEventListener('change', (e) => {
      file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          document.getElementById('avatarPrevImg').src = ev.target.result;
          document.getElementById('avatarPreview').style.display = 'block';
          document.getElementById('uploadAvatarBtn').disabled = false;
        };
        reader.readAsDataURL(file);
      }
    });

    document.getElementById('uploadAvatarBtn')?.addEventListener('click', async () => {
      if (!file) return;
      try {
        const ext = file.name.split('.').pop();
        const path = `${App.state.user.id}/avatar.${ext}`;
        const url = await API.uploadImage('avatars', path, file);
        await API.updateProfile(App.state.user.id, { avatar_url: url });
        App.state.profile.avatar_url = url;
        UI.closeModal();
        UI.toast('Avatar updated!', 'success');
        App.render();
        setTimeout(() => App.loadPage(), 50);
      } catch (e) { UI.toast('Upload failed', 'error'); }
    });
  },

  editCover() {
    UI.openModal('Update Cover Photo', `
      <input type="file" id="coverFileInput" accept="image/*">
      <div id="coverPreview" style="margin-top:12px;display:none"><img id="coverPrevImg" style="max-width:100%;border-radius:8px;"></div>
    `, '<button class="btn btn-primary" id="uploadCoverBtn" disabled>Upload</button>');

    let file = null;
    document.getElementById('coverFileInput')?.addEventListener('change', (e) => {
      file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          document.getElementById('coverPrevImg').src = ev.target.result;
          document.getElementById('coverPreview').style.display = 'block';
          document.getElementById('uploadCoverBtn').disabled = false;
        };
        reader.readAsDataURL(file);
      }
    });

    document.getElementById('uploadCoverBtn')?.addEventListener('click', async () => {
      if (!file) return;
      try {
        const ext = file.name.split('.').pop();
        const path = `${App.state.user.id}/cover.${ext}`;
        const url = await API.uploadImage('covers', path, file);
        await API.updateProfile(App.state.user.id, { cover_url: url });
        App.state.profile.cover_url = url;
        UI.closeModal();
        UI.toast('Cover updated!', 'success');
        ProfilePage.load();
      } catch (e) { UI.toast('Upload failed', 'error'); }
    });
  }
};
