// ============================================
// SocialVerse - Messenger Page
// ============================================

const MessengerPage = {
  currentConversation: null,
  subscription: null,

  render() {
    return `<div class="messenger-page">
      <div class="messenger-sidebar">
        <div class="messenger-sidebar-header">
          <h2>Chats</h2>
          <button class="btn-icon" onclick="MessengerPage.openNewConversation()" title="New Message">✏️</button>
        </div>
        <div id="conversationsList" class="conversations-list"><div class="loading">Loading...</div></div>
      </div>
      <div class="messenger-main" id="messengerMain">
        <div class="messenger-empty">
          <h3>💬</h3>
          <p>Select a conversation or start a new one</p>
        </div>
      </div>
    </div>`;
  },

  async load() {
    await MessengerPage.loadConversations();
    // If navigated with a friendId param, open that conversation
    if (App.state.pageParams.friendId) {
      await MessengerPage.startConversation(App.state.pageParams.friendId);
    }
  },

  async loadConversations() {
    try {
      const conversations = await API.getConversations(App.state.user.id);
      const el = document.getElementById('conversationsList');
      if (!el) return;
      if (!conversations.length) {
        el.innerHTML = '<div class="empty-state">No conversations yet</div>';
        return;
      }
      el.innerHTML = conversations.map(c => {
        const other = c.user1_id === App.state.user.id ? c.participant2 : c.participant1;
        const isActive = MessengerPage.currentConversation?.id === c.id;
        return `<div class="conversation-item ${isActive ? 'active' : ''}" onclick="MessengerPage.openConversation('${c.id}')">
          <img src="${avatar(other?.avatar_url)}" class="avatar-sm">
          <div class="conv-info">
            <span class="conv-name">${escapeHtml(other?.first_name)} ${escapeHtml(other?.last_name)}</span>
            <span class="conv-last">${escapeHtml(c.last_message || 'No messages yet')}</span>
          </div>
          <span class="conv-time">${timeAgo(c.updated_at)}</span>
        </div>`;
      }).join('');
    } catch (e) { console.error('Conversations error:', e); }
  },


  async openConversation(conversationId) {
    try {
      const conversations = await API.getConversations(App.state.user.id);
      const conv = conversations.find(c => c.id === conversationId);
      if (!conv) return;
      MessengerPage.currentConversation = conv;
      const other = conv.user1_id === App.state.user.id ? conv.participant2 : conv.participant1;
      const messages = await API.getMessages(conversationId);

      const main = document.getElementById('messengerMain');
      if (!main) return;
      main.innerHTML = `
        <div class="messenger-header">
          <img src="${avatar(other?.avatar_url)}" class="avatar-sm">
          <span>${escapeHtml(other?.first_name)} ${escapeHtml(other?.last_name)}</span>
        </div>
        <div class="messages-area" id="messagesArea">
          ${messages.map(m => MessengerPage.renderMessage(m)).join('')}
        </div>
        <div class="message-input-area">
          <input type="text" id="messageInput" placeholder="Type a message..." autocomplete="off">
          <button class="btn btn-primary" id="sendMsgBtn">Send</button>
        </div>`;

      // Scroll to bottom
      const area = document.getElementById('messagesArea');
      if (area) area.scrollTop = area.scrollHeight;

      // Attach send events
      document.getElementById('sendMsgBtn')?.addEventListener('click', () => MessengerPage.sendMessage());
      document.getElementById('messageInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') MessengerPage.sendMessage();
      });

      // Subscribe to realtime
      MessengerPage.subscribeToMessages(conversationId);
      MessengerPage.loadConversations();
    } catch (e) { UI.toast('Failed to open conversation', 'error'); }
  },

  renderMessage(msg) {
    const isOwn = msg.sender_id === App.state.user.id;
    return `<div class="message ${isOwn ? 'message-own' : 'message-other'}">
      <div class="message-bubble">${escapeHtml(msg.content)}</div>
      <span class="message-time">${timeAgo(msg.created_at)}</span>
    </div>`;
  },

  async sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input?.value.trim();
    if (!content || !MessengerPage.currentConversation) return;
    input.value = '';

    try {
      const msg = await API.sendMessage(MessengerPage.currentConversation.id, App.state.user.id, content);
      const area = document.getElementById('messagesArea');
      if (area && msg) {
        area.insertAdjacentHTML('beforeend', MessengerPage.renderMessage(msg));
        area.scrollTop = area.scrollHeight;
      }
      MessengerPage.loadConversations();
    } catch (e) { UI.toast('Failed to send message', 'error'); }
  },

  subscribeToMessages(conversationId) {
    // Unsubscribe from previous
    if (MessengerPage.subscription) {
      MessengerPage.subscription.unsubscribe();
      MessengerPage.subscription = null;
    }

    MessengerPage.subscription = db.channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const msg = payload.new;
        if (msg.sender_id === App.state.user.id) return; // Already displayed
        const area = document.getElementById('messagesArea');
        if (area) {
          area.insertAdjacentHTML('beforeend', MessengerPage.renderMessage(msg));
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
      <p>Select a friend to message:</p>
      <div id="newMsgFriendsList"><div class="loading">Loading friends...</div></div>
    `);

    (async () => {
      try {
        const friends = await API.getFriends(App.state.user.id);
        const el = document.getElementById('newMsgFriendsList');
        if (!el) return;
        el.innerHTML = friends.map(f => `
          <div class="contact-item" onclick="UI.closeModal(); MessengerPage.startConversation('${f.friend.id}')">
            <img src="${avatar(f.friend.avatar_url)}" class="avatar-sm">
            <span>${escapeHtml(f.friend.first_name)} ${escapeHtml(f.friend.last_name)}</span>
          </div>
        `).join('') || '<div class="empty-state">No friends yet</div>';
      } catch (e) {
        document.getElementById('newMsgFriendsList').innerHTML = '<div class="error-state">Failed to load friends</div>';
      }
    })();
  }
};
