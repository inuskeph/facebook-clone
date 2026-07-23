// ============================================
// SocialVerse - Stories Viewer
// ============================================

const StoriesViewer = {
  storyGroups: [],
  currentGroupIndex: 0,
  currentStoryIndex: 0,
  timer: null,
  progressTimer: null,
  DURATION: 5000,

  openViewer(storyGroups, startIndex = 0) {
    if (!storyGroups || !storyGroups.length) return;
    StoriesViewer.storyGroups = storyGroups;
    StoriesViewer.currentGroupIndex = startIndex;
    StoriesViewer.currentStoryIndex = 0;
    StoriesViewer.renderViewer();
  },

  renderViewer() {
    const group = StoriesViewer.storyGroups[StoriesViewer.currentGroupIndex];
    if (!group) { StoriesViewer.closeViewer(); return; }
    const story = group.stories[StoriesViewer.currentStoryIndex];
    if (!story) { StoriesViewer.nextGroup(); return; }

    const root = document.getElementById('modal-root');
    root.innerHTML = `<div class="story-viewer-overlay" id="storyViewer">
      <div class="story-viewer">
        <div class="story-progress-bar">
          ${group.stories.map((_, i) => `
            <div class="story-progress-segment">
              <div class="story-progress-fill ${i < StoriesViewer.currentStoryIndex ? 'complete' : ''}" id="storyProgress-${i}"></div>
            </div>
          `).join('')}
        </div>
        <div class="story-viewer-header">
          <img src="${avatar(group.author.avatar_url)}" class="avatar-sm">
          <span class="story-viewer-name">${escapeHtml(group.author.first_name)} ${escapeHtml(group.author.last_name)}</span>
          <span class="story-viewer-time">${timeAgo(story.created_at)}</span>
          <button class="story-close-btn" onclick="StoriesViewer.closeViewer()">✕</button>
        </div>
        <div class="story-viewer-content" id="storyContent">
          ${story.image_url
            ? `<img src="${story.image_url}" class="story-image">`
            : `<div class="story-text" style="background:${story.bg_color || '#1877f2'}">${escapeHtml(story.content || '')}</div>`
          }
        </div>
        <button class="story-nav story-nav-prev" onclick="StoriesViewer.prev()">‹</button>
        <button class="story-nav story-nav-next" onclick="StoriesViewer.next()">›</button>
      </div>
    </div>`;

    // Mark as viewed
    API.viewStory(story.id, App.state.user.id).catch(() => {});

    // Start auto-advance timer
    StoriesViewer.startTimer();
  },


  startTimer() {
    StoriesViewer.clearTimers();
    const progressEl = document.getElementById(`storyProgress-${StoriesViewer.currentStoryIndex}`);
    if (progressEl) {
      progressEl.style.transition = `width ${StoriesViewer.DURATION}ms linear`;
      progressEl.style.width = '100%';
    }
    StoriesViewer.timer = setTimeout(() => {
      StoriesViewer.next();
    }, StoriesViewer.DURATION);
  },

  clearTimers() {
    if (StoriesViewer.timer) { clearTimeout(StoriesViewer.timer); StoriesViewer.timer = null; }
  },

  next() {
    StoriesViewer.clearTimers();
    const group = StoriesViewer.storyGroups[StoriesViewer.currentGroupIndex];
    if (StoriesViewer.currentStoryIndex < group.stories.length - 1) {
      StoriesViewer.currentStoryIndex++;
      StoriesViewer.renderViewer();
    } else {
      StoriesViewer.nextGroup();
    }
  },

  prev() {
    StoriesViewer.clearTimers();
    if (StoriesViewer.currentStoryIndex > 0) {
      StoriesViewer.currentStoryIndex--;
      StoriesViewer.renderViewer();
    } else {
      StoriesViewer.prevGroup();
    }
  },

  nextGroup() {
    if (StoriesViewer.currentGroupIndex < StoriesViewer.storyGroups.length - 1) {
      StoriesViewer.currentGroupIndex++;
      StoriesViewer.currentStoryIndex = 0;
      StoriesViewer.renderViewer();
    } else {
      StoriesViewer.closeViewer();
    }
  },

  prevGroup() {
    if (StoriesViewer.currentGroupIndex > 0) {
      StoriesViewer.currentGroupIndex--;
      StoriesViewer.currentStoryIndex = 0;
      StoriesViewer.renderViewer();
    }
  },

  closeViewer() {
    StoriesViewer.clearTimers();
    document.getElementById('modal-root').innerHTML = '';
  },

  openCreateStory() {
    UI.openModal('Create Story', `
      <div class="create-story-tabs">
        <button class="tab active" id="storyTextTab" onclick="StoriesViewer.switchCreateTab('text')">Text</button>
        <button class="tab" id="storyPhotoTab" onclick="StoriesViewer.switchCreateTab('photo')">Photo</button>
      </div>
      <div id="storyTextForm">
        <textarea id="storyTextContent" placeholder="Write your story..." rows="4"></textarea>
        <label>Background Color</label>
        <div class="color-picker" id="storyColorPicker">
          <button class="color-swatch active" style="background:#1877f2" data-color="#1877f2"></button>
          <button class="color-swatch" style="background:#42b72a" data-color="#42b72a"></button>
          <button class="color-swatch" style="background:#f02849" data-color="#f02849"></button>
          <button class="color-swatch" style="background:#8b5cf6" data-color="#8b5cf6"></button>
          <button class="color-swatch" style="background:#f59e0b" data-color="#f59e0b"></button>
          <button class="color-swatch" style="background:#1a1a2e" data-color="#1a1a2e"></button>
          <button class="color-swatch" style="background:#e91e63" data-color="#e91e63"></button>
          <button class="color-swatch" style="background:#00bcd4" data-color="#00bcd4"></button>
        </div>
      </div>
      <div id="storyPhotoForm" style="display:none">
        <input type="file" id="storyImageInput" accept="image/*">
        <div id="storyImgPreview" style="display:none;margin-top:12px;">
          <img id="storyPrevImg" style="max-width:100%;max-height:300px;border-radius:8px;">
        </div>
      </div>
    `, '<button class="btn btn-primary btn-block" id="publishStoryBtn">Share to Story</button>');

    let selectedColor = '#1877f2';
    let storyFile = null;
    let createMode = 'text';

    document.querySelectorAll('.color-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedColor = btn.dataset.color;
      });
    });

    document.getElementById('storyImageInput')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      storyFile = file;
      const reader = new FileReader();
      reader.onload = (ev) => {
        document.getElementById('storyPrevImg').src = ev.target.result;
        document.getElementById('storyImgPreview').style.display = 'block';
      };
      reader.readAsDataURL(file);
    });

    window._switchStoryTab = (tab) => {
      createMode = tab;
      document.getElementById('storyTextForm').style.display = tab === 'text' ? 'block' : 'none';
      document.getElementById('storyPhotoForm').style.display = tab === 'photo' ? 'block' : 'none';
      document.getElementById('storyTextTab').classList.toggle('active', tab === 'text');
      document.getElementById('storyPhotoTab').classList.toggle('active', tab === 'photo');
    };

    document.getElementById('publishStoryBtn')?.addEventListener('click', async () => {
      const btn = document.getElementById('publishStoryBtn');
      btn.disabled = true;
      btn.textContent = 'Publishing...';

      try {
        const storyData = {
          user_id: App.state.user.id,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        if (createMode === 'text') {
          const content = document.getElementById('storyTextContent').value.trim();
          if (!content) { UI.toast('Write something for your story', 'error'); btn.disabled = false; btn.textContent = 'Share to Story'; return; }
          storyData.content = content;
          storyData.bg_color = selectedColor;
        } else {
          if (!storyFile) { UI.toast('Select a photo', 'error'); btn.disabled = false; btn.textContent = 'Share to Story'; return; }
          const ext = storyFile.name.split('.').pop();
          const path = `${App.state.user.id}/${Date.now()}.${ext}`;
          storyData.image_url = await API.uploadImage('stories', path, storyFile);
        }

        await API.createStory(storyData);
        UI.closeModal();
        UI.toast('Story published!', 'success');
        if (typeof FeedPage !== 'undefined') FeedPage.loadStories();
      } catch (e) {
        UI.toast(e.message || 'Failed to publish story', 'error');
        btn.disabled = false;
        btn.textContent = 'Share to Story';
      }
    });
  },

  switchCreateTab(tab) {
    if (window._switchStoryTab) window._switchStoryTab(tab);
  }
};
