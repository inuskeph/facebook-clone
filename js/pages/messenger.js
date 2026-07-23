// ============================================
// SocialVerse - Messenger (Facebook Messenger style)
// ============================================

const MessengerPage = {
  currentConversation: null,
  subscription: null,

  render() {
    return `<div class="msger">
      <div class="msger-sidebar">
        <div class="msger-sidebar-top">
          <h2>Chats</h2>
          <button class="msger-new-btn" onclick="MessengerPage.openNewConversation()" title="New Message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </button>
        </div>
        <div class="msger-search">
          <input type="text" placeholder="Search Messenger" id="msgerSearch" oninput="MessengerPage.filterConversations(this.value)">
        </div>
        <div class="msger-conv-list" id="conversationsList">
          <div class="loading">Loading...</div>
        </div>
      </div>
      <div class="msger-main" id="messengerMain">
        <div class="msger-empty">
          <div class="msger-empty-icon">💬</div>
          <h3>Your Messages</h3>
          <p>Send private messages to a friend</p>
          <button class="btn btn-primary" onclick="MessengerPage.openNewConversation()">Send Message</button>
        </div>
      </div>
    </div>`;
  },

  async load() {
    await MessengerPage.loadConversations();
    if (App.state.pageParams.friendId) {
      await MessengerPage.startConversation(App.state.pageParams.friendId);
    }
  },

  async loadConversations() {
    try {
      const conversations = await API.getConversations(App.state.user.id);
      window._conversations = conversations;
      const el = document.getElementById('conversationsList');
      if (!el) return;
      if (!conversations.length) {
        el.innerHTML = '<div class="msger-no-convos"><p>No conversations yet</p><p class="sub">Start messaging your friends!</p></div>';
        return;
      }
      MessengerPage.renderConversationList(conversations);
    } catch (e) { console.error('Conversations error:', e); }
  },

  renderConversationList(conversations) {
    const el = document.getElementById('conversationsList');
    if (!el) return;
    el.innerHTML = conversations.map(c => {
      const other = c.user1_id === App.state.user.id ? c.participant2 : c.participant1;
      const isActive = MessengerPage.currentConversation?.id === c.id;
      return `<div class="msger-conv ${isActive ? 'active' : ''}" onclick="MessengerPage.openConversation('${c.id}')">
        <div class="msger-conv-avatar">
          <img src="${avatar(other?.avatar_url)}">
          <span class="msger-online"></span>
        </div>
        <div class="msger-conv-info">
          <h4>${escapeHtml(other?.first_name)} ${escapeHtml(other?.last_name)}</h4>
          <p>${escapeHtml((c.last_message || 'Start chatting').substring(0, 35))}${c.last_message?.length > 35 ? '...' : ''} · <span class="msger-time">${timeAgo(c.updated_at)}</span></p>
        </div>
      </div>`;
    }).join('');
  },

  filterConversations(query) {
    const convs = window._conversations || [];
    if (!query.trim()) { MessengerPage.renderConversationList(convs); return; }
    const q = query.toLowerCase();
    const filtered = convs.filter(c => {
      const other = c.user1_id === App.state.user.id ? c.participant2 : c.participant1;
      return `${other?.first_name} ${other?.last_name}`.toLowerCase().includes(q);
    });
    MessengerPage.renderConversationList(filtered);
  },

  async openConversation(conversationId) {
    try {
      const conversations = window._conversations || await API.getConversations(App.state.user.id);
      const conv = conversations.find(c => c.id === conversationId);
      if (!conv) return;
      MessengerPage.currentConversation = conv;
      const other = conv.user1_id === App.state.user.id ? conv.participant2 : conv.participant1;
      const messages = await API.getMessages(conversationId);

      const main = document.getElementById('messengerMain');
      if (!main) return;
      main.innerHTML = `
        <div class="msger-chat-header">
          <div class="msger-chat-user" onclick="App.navigate('profile',{userId:'${other?.id}'})">
            <img src="${avatar(other?.avatar_url)}">
            <div>
              <h4>${escapeHtml(other?.first_name)} ${escapeHtml(other?.last_name)}</h4>
              <span class="msger-status">Active now</span>
            </div>
          </div>
          <div class="msger-chat-actions">
            <button class="msger-action-btn" title="Audio call">📞</button>
            <button class="msger-action-btn" title="Video call">📹</button>
            <button class="msger-action-btn" title="Info">ℹ️</button>
          </div>
        </div>
        <div class="msger-chat-body" id="messagesArea">
          <div class="msger-chat-start">
            <img src="${avatar(other?.avatar_url)}" class="msger-chat-start-avatar">
            <h4>${escapeHtml(other?.first_name)} ${escapeHtml(other?.last_name)}</h4>
            <p>You're friends on SocialVerse</p>
          </div>
          ${messages.map(m => MessengerPage.renderMessage(m, other)).join('')}
        </div>
        <div class="msger-chat-input">
          <button class="msger-input-btn" title="Attach">📎</button>
          <button class="msger-input-btn" title="Image">🖼️</button>
          <div class="msger-input-wrapper">
            <input type="text" id="messageInput" placeholder="Aa" autocomplete="off">
            <button class="msger-emoji-btn" title="Emoji">😊</button>
          </div>
          <button class="msger-send-btn" id="sendMsgBtn" title="Send">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>`;

      // Scroll to bottom
      const area = document.getElementById('messagesArea');
      if (area) area.scrollTop = area.scrollHeight;

      // Attach events
      document.getElementById('sendMsgBtn')?.addEventListener('click', () => MessengerPage.sendMessage());
      document.getElementById('messageInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); MessengerPage.sendMessage(); }
      });

      // Highlight active conversation
      document.querySelectorAll('.msger-conv').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.msger-conv').forEach(el => {
        if (el.getAttribute('onclick')?.includes(conversationId)) el.classList.add('active');
      });

      // Subscribe to realtime
      MessengerPage.subscribeToMessages(conversationId);
    } catch (e) { UI.toast('Failed to open conversation', 'error'); }
  },

  renderMessage(msg, other) {
    const isOwn = msg.sender_id === App.state.user.id;
    return `<div class="msger-msg ${isOwn ? 'msger-msg-own' : 'msger-msg-other'}">
      ${!isOwn ? `<img src="${avatar(other?.avatar_url)}" class="msger-msg-avatar">` : ''}
      <div class="msger-msg-content">
        <div class="msger-msg-bubble">${escapeHtml(msg.content)}</div>
        <span class="msger-msg-time">${timeAgo(msg.created_at)}</span>
      </div>
    </div>`;
  },

  async sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input?.value.trim();
    if (!content || !MessengerPage.currentConversation) return;
    input.value = '';

    try {
      const conv = MessengerPage.currentConversation;
      const other = conv.user1_id === App.state.user.id ? conv.participant2 : conv.participant1;
      const msg = await API.sendMessage(conv.id, App.state.user.id, content);
      const area = document.getElementById('messagesArea');
      if (area && msg) {
        area.insertAdjacentHTML('beforeend', MessengerPage.renderMessage(msg, other));
        area.scrollTop = area.scrollHeight;
      }
      MessengerPage.loadConversations();
    } catch (e) { UI.toast('Failed to send message', 'error'); }
  },

  subscribeToMessages(conversationId) {
    if (MessengerPage.subscription) {
      MessengerPage.subscription.unsubscribe();
      MessengerPage.subscription = null;
    }

    MessengerPage.subscription = db.channel(`msg-${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const msg = payload.new;
        if (msg.sender_id === App.state.user.id) return;
        const conv = MessengerPage.currentConversation;
        const other = conv.user1_id === App.state.user.id ? conv.participant2 : conv.participant1;
        const area = document.getElementById('messagesArea');
        if (area) {
          area.insertAdjacentHTML('beforeend', MessengerPage.renderMessage(msg, other));
          area.scrollTop = area.scrollHeight;
        }
        MessengerPage.loadConversations();
      })
      .subscribe();
  },

  async startConversation(friendId) {
    try {
      const conv = await API.getOrCreateConversation(App.state.user.id, friendId);
      if (conv) {
        await MessengerPage.loadConversations();
        await MessengerPage.openConversation(conv.id);
      }
    } catch (e) { UI.toast('Failed to start conversation', 'error'); }
  },

  openNewConversation() {
    UI.openModal('New Message', `
      <div class="msger-new-msg-search">
        <label>To:</label>
        <input type="text" id="newMsgSearch" placeholder="Search friends..." oninput="MessengerPage.searchNewMsg(this.value)">
      </div>
      <div id="newMsgFriendsList" class="msger-friend-list"><div class="loading">Loading friends...</div></div>
    `);

    (async () => {
      try {
        const friends = await API.getFriends(App.state.user.id);
        window._msgFriends = friends;
        MessengerPage.renderNewMsgFriends(friends);
      } catch (e) {
        document.getElementById('newMsgFriendsList').innerHTML = '<div class="msger-no-convos">Failed to load friends</div>';
      }
    })();
  },

  searchNewMsg(query) {
    const friends = window._msgFriends || [];
    if (!query.trim()) { MessengerPage.renderNewMsgFriends(friends); return; }
    const q = query.toLowerCase();
    const filtered = friends.filter(f => `${f.friend.first_name} ${f.friend.last_name}`.toLowerCase().includes(q));
    MessengerPage.renderNewMsgFriends(filtered);
  },

  renderNewMsgFriends(friends) {
    const el = document.getElementById('newMsgFriendsList');
    if (!el) return;
    el.innerHTML = friends.map(f => `
      <div class="msger-friend-item" onclick="UI.closeModal(); MessengerPage.startConversation('${f.friend.id}')">
        <img src="${avatar(f.friend.avatar_url)}">
        <span>${escapeHtml(f.friend.first_name)} ${escapeHtml(f.friend.last_name)}</span>
      </div>
    `).join('') || '<div class="msger-no-convos">No friends found</div>';
  }
};
