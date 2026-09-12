// Main Application Controller
const App = {
  activeSessionId: null,
  activeDocument: null,
  isSending: false,
  sessions: [],

  async init() {
    this.setupMarkdown();
    this.setupEventListeners();
    await this.loadSessions();

    // Listen for auth changes
    window.addEventListener('auth:change', async () => {
      await this.loadSessions();
    });
  },

  getAuthHeaders() {
    const token = Auth.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },

  setupMarkdown() {
    if (window.marked) {
      marked.setOptions({
        breaks: true,
        gfm: true,
        highlight: function(code, lang) {
          if (window.hljs) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
          }
          return code;
        }
      });
    }
  },

  setupEventListeners() {
    // New chat button
    document.getElementById('newChatBtn').addEventListener('click', () => this.createNewSession());

    // Send button
    document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage(false));

    // Clear chat button
    document.getElementById('clearChatBtn').addEventListener('click', () => {
      if (confirm('Clear current conversation history?')) {
        this.clearActiveChat();
      }
    });

    // Chat textarea auto-expand & enter-to-send
    const textarea = document.getElementById('chatTextarea');
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
    });

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage(false);
      }
    });

    // File Upload Handler
    const fileInput = document.getElementById('pdfFileInput');
    const attachBtn = document.getElementById('attachFileBtn');

    attachBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.uploadPDF(e.target.files[0]);
      }
    });

    // Remove Document Button
    document.getElementById('removeDocBtn').addEventListener('click', () => this.removeActiveDocument());

    // Edit Title Button
    document.getElementById('editTitleBtn').addEventListener('click', () => this.promptRenameSession());

    // Prompt cards in welcome hero
    document.querySelectorAll('.prompt-card').forEach(card => {
      card.addEventListener('click', () => {
        const prompt = card.getAttribute('data-prompt');
        textarea.value = prompt;
        textarea.dispatchEvent(new Event('input'));
        textarea.focus();
      });
    });

    // Sessions search filter
    document.getElementById('sessionSearchInput').addEventListener('input', (e) => {
      this.filterSessions(e.target.value.toLowerCase());
    });

    // Mobile sidebar toggle
    const sidebar = document.getElementById('sidebar');
    document.getElementById('openSidebarBtn').addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
    document.getElementById('closeSidebarBtn').addEventListener('click', () => {
      sidebar.classList.add('collapsed');
    });

    // Drag and drop PDF upload
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          this.uploadPDF(file);
        }
      }
    });
  },

  async loadSessions() {
    try {
      const res = await fetch('/api/sessions', {
        headers: this.getAuthHeaders()
      });
      const data = await res.json();
      this.sessions = data.sessions || [];
      this.renderSessionsList();

      if (this.sessions.length > 0) {
        // Select the most recent session
        await this.selectSession(this.sessions[0].id || this.sessions[0]._id);
      } else {
        await this.createNewSession();
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  },

  renderSessionsList(listToRender = this.sessions) {
    const listEl = document.getElementById('sessionsList');
    listEl.innerHTML = '';

    if (listToRender.length === 0) {
      listEl.innerHTML = '<div class="sessions-empty">No conversations found</div>';
      return;
    }

    listToRender.forEach(session => {
      const id = session.id || session._id;
      const item = document.createElement('div');
      item.className = `session-item ${id === this.activeSessionId ? 'active' : ''}`;
      item.dataset.id = id;

      item.innerHTML = `
        <div class="session-title-wrapper">
          <i class="fa-regular fa-message"></i>
          <span class="session-title">${this.escapeHTML(session.title || 'New Conversation')}</span>
        </div>
        <div class="session-actions">
          <button class="session-action-btn edit" title="Rename"><i class="fa-solid fa-pen"></i></button>
          <button class="session-action-btn delete" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      `;

      // Click to select
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.session-actions')) {
          this.selectSession(id);
        }
      });

      // Rename button
      item.querySelector('.session-action-btn.edit').addEventListener('click', (e) => {
        e.stopPropagation();
        this.renameSession(id, session.title);
      });

      // Delete button
      item.querySelector('.session-action-btn.delete').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteSession(id);
      });

      listEl.appendChild(item);
    });
  },

  filterSessions(query) {
    if (!query) {
      this.renderSessionsList(this.sessions);
      return;
    }
    const filtered = this.sessions.filter(s => (s.title || '').toLowerCase().includes(query));
    this.renderSessionsList(filtered);
  },

  async createNewSession() {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify({ title: 'New Conversation' })
      });
      const data = await res.json();
      if (data.session) {
        const id = data.session.id || data.session._id;
        this.sessions.unshift(data.session);
        await this.selectSession(id);
        this.renderSessionsList();
      }
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  },

  async selectSession(sessionId) {
    this.activeSessionId = sessionId;
    
    // Update active highlight in sidebar
    document.querySelectorAll('.session-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === sessionId);
    });

    // Clear messages UI
    const stream = document.getElementById('messagesStream');
    stream.innerHTML = '';

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        headers: this.getAuthHeaders()
      });
      const data = await res.json();
      if (data.session) {
        document.getElementById('chatTitleDisplay').textContent = data.session.title || 'New Conversation';
        
        // Update active document state
        this.updateDocumentBadge(data.activeDoc || data.session.activeDocument);

        // Render message history
        const welcomeHero = document.getElementById('welcomeHero');
        if (data.messages && data.messages.length > 0) {
          welcomeHero.classList.add('hidden');
          data.messages.forEach(msg => this.renderMessage(msg));
          this.scrollToBottom();
        } else {
          welcomeHero.classList.remove('hidden');
        }
      }
    } catch (err) {
      console.error('Error fetching session messages:', err);
    }
  },

  async renameSession(sessionId, currentTitle) {
    const newTitle = prompt('Enter new conversation title:', currentTitle || '');
    if (newTitle && newTitle.trim() && newTitle.trim() !== currentTitle) {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders()
          },
          body: JSON.stringify({ title: newTitle.trim() })
        });
        if (res.ok) {
          const session = this.sessions.find(s => (s.id || s._id) === sessionId);
          if (session) session.title = newTitle.trim();
          this.renderSessionsList();
          if (this.activeSessionId === sessionId) {
            document.getElementById('chatTitleDisplay').textContent = newTitle.trim();
          }
        }
      } catch (err) {
        console.error('Failed to rename session:', err);
      }
    }
  },

  promptRenameSession() {
    if (!this.activeSessionId) return;
    const session = this.sessions.find(s => (s.id || s._id) === this.activeSessionId);
    this.renameSession(this.activeSessionId, session ? session.title : '');
  },

  async deleteSession(sessionId) {
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        this.sessions = this.sessions.filter(s => (s.id || s._id) !== sessionId);
        if (this.activeSessionId === sessionId) {
          if (this.sessions.length > 0) {
            await this.selectSession(this.sessions[0].id || this.sessions[0]._id);
          } else {
            await this.createNewSession();
          }
        } else {
          this.renderSessionsList();
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  },

  async clearActiveChat() {
    if (!this.activeSessionId) return;
    await this.deleteSession(this.activeSessionId);
  },

  // PDF Document Upload & RAG
  async uploadPDF(file) {
    if (!file) return;
    if (!this.activeSessionId) {
      await this.createNewSession();
    }

    const progressBanner = document.getElementById('uploadProgressBanner');
    const progressText = document.getElementById('uploadProgressText');
    progressBanner.classList.remove('hidden');
    progressText.textContent = `Analyzing & vectorizing "${file.name}"...`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', this.activeSessionId);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload PDF');

      this.updateDocumentBadge(data.document);
      
      // Inject system-like notice in chat
      this.renderMessage({
        role: 'assistant',
        content: `📄 **Document Attached & Vector Indexed!**\n\n**File**: \`${data.document.filename}\`\n**Pages**: ${data.document.pageCount} | **Vector Chunks**: ${data.document.chunkCount}\n\nYou can now ask questions about this PDF! You can also ask any general questions, coding problems, or brainstorming queries as usual.`
      });
      this.scrollToBottom();

    } catch (err) {
      alert('PDF Upload Error: ' + err.message);
    } finally {
      progressBanner.classList.add('hidden');
      document.getElementById('pdfFileInput').value = '';
    }
  },

  updateDocumentBadge(doc) {
    this.activeDocument = doc;
    const badge = document.getElementById('activeDocBadge');
    if (doc && doc.filename) {
      document.getElementById('docNameDisplay').textContent = doc.filename;
      document.getElementById('docStatsDisplay').textContent = `(${doc.pageCount || 1} pgs)`;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  },

  async removeActiveDocument() {
    if (!this.activeSessionId) return;
    try {
      await fetch(`/api/sessions/${this.activeSessionId}/document`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      this.updateDocumentBadge(null);
    } catch (err) {
      console.error('Error removing document:', err);
    }
  },

  // Send message
  async sendMessage(hasAudio = false) {
    if (this.isSending) return;
    const textarea = document.getElementById('chatTextarea');
    const message = textarea.value.trim();
    if (!message) return;

    if (!this.activeSessionId) {
      await this.createNewSession();
    }

    // Reset textarea
    textarea.value = '';
    textarea.style.height = 'auto';

    // Hide welcome hero
    document.getElementById('welcomeHero').classList.add('hidden');

    // Render user message immediately
    this.renderMessage({
      role: 'user',
      content: message,
      hasAudio: !!hasAudio
    });
    this.scrollToBottom();

    // Show typing indicator
    const typingRow = this.renderTypingIndicator();
    this.scrollToBottom();

    this.isSending = true;
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;

    const selectedModel = document.getElementById('modelSelect').value;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify({
          sessionId: this.activeSessionId,
          message: message,
          hasAudio: !!hasAudio,
          model: selectedModel
        })
      });

      const data = await res.json();
      typingRow.remove();

      if (!res.ok) {
        throw new Error(data.error || 'Server error occurred');
      }

      // If server returned/created a sessionId, sync it
      if (data.sessionId && (!this.activeSessionId || this.activeSessionId !== data.sessionId)) {
        this.activeSessionId = data.sessionId;
      }

      // Render assistant message
      this.renderMessage(data.message);
      this.scrollToBottom();

      // Update sidebar session title if it changed
      const currentSession = this.sessions.find(s => (s.id || s._id) === this.activeSessionId);
      if (currentSession && (!currentSession.title || currentSession.title === 'New Conversation')) {
        currentSession.title = message.slice(0, 30);
        document.getElementById('chatTitleDisplay').textContent = currentSession.title;
        this.renderSessionsList();
      }

    } catch (err) {
      typingRow.remove();
      this.renderMessage({
        role: 'assistant',
        content: `⚠️ **Error**: ${err.message}`
      });
      this.scrollToBottom();
    } finally {
      this.isSending = false;
      sendBtn.disabled = false;
    }
  },

  renderMessage(msg) {
    const stream = document.getElementById('messagesStream');
    const row = document.createElement('div');
    row.className = `message-row ${msg.role}`;

    const isUser = msg.role === 'user';
    const avatarIcon = isUser ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-brain"></i>';

    let contentHTML = '';
    if (isUser) {
      const audioBadge = msg.hasAudio ? `<div class="voice-badge"><i class="fa-solid fa-microphone"></i> Voice Input</div>` : '';
      contentHTML = `${audioBadge}<div>${this.escapeHTML(msg.content)}</div>`;
    } else {
      contentHTML = window.marked ? marked.parse(msg.content) : `<p>${this.escapeHTML(msg.content)}</p>`;
    }

    // Route Indicator Pill (if route present on assistant message)
    let routeBadgeHTML = '';
    if (!isUser && msg.route) {
      if (msg.route === 'HYBRID_BOTH') {
        routeBadgeHTML = `<div class="route-pill hybrid"><i class="fa-solid fa-bolt"></i> Hybrid RAG: Student Database + Live Web Search</div>`;
      } else if (msg.route === 'WEB_SEARCH_ONLY') {
        routeBadgeHTML = `<div class="route-pill web"><i class="fa-solid fa-globe"></i> Live Web Search Grounded</div>`;
      } else if (msg.route === 'VECTOR_DB_ONLY') {
        routeBadgeHTML = `<div class="route-pill student"><i class="fa-solid fa-graduation-cap"></i> CSE Student Database Grounded</div>`;
      }
    }

    // Citations Accordion (if RAG citations present)
    let citationsHTML = '';
    if (!isUser && msg.citations && msg.citations.length > 0) {
      const count = msg.citations.length;
      const hasWeb = msg.citations.some(c => c.type === 'web_source' || c.url);
      const hasStudent = msg.citations.some(c => c.type === 'student_record' || c.roll_no);
      let label = `${count} Knowledge Citation${count > 1 ? 's' : ''}`;
      if (hasWeb && hasStudent) label = `${count} Citations (Student Records + Live Web)`;
      else if (hasWeb) label = `${count} Live Web Source${count > 1 ? 's' : ''}`;
      else if (hasStudent) label = `${count} Student Profile Record${count > 1 ? 's' : ''}`;

      citationsHTML = `
        <div class="rag-citations-container">
          <div class="citations-toggle" onclick="this.nextElementSibling.classList.toggle('hidden')">
            <i class="fa-solid fa-layer-group"></i>
            <span>${label} (Click to inspect)</span>
          </div>
          <div class="citations-list hidden">
            ${msg.citations.map(c => {
              const isWeb = c.type === 'web_source' || !!c.url;
              if (isWeb) {
                return `
                  <div class="citation-card web-citation">
                    <div class="citation-meta">
                      <span class="source-tag web"><i class="fa-solid fa-globe"></i> Web Source</span>
                      <span>Match ${(c.score * 100).toFixed(0)}%</span>
                    </div>
                    <div class="citation-title">
                      <a href="${c.url}" target="_blank" rel="noopener noreferrer">${this.escapeHTML(c.title || 'Web Result')} <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
                    </div>
                    <div class="citation-text">"${this.escapeHTML((c.snippet || c.text || '').slice(0, 260))}..."</div>
                  </div>
                `;
              } else {
                return `
                  <div class="citation-card student-citation">
                    <div class="citation-meta">
                      <span class="source-tag student"><i class="fa-solid fa-user-graduate"></i> ${this.escapeHTML(c.title || 'Student Profile')}</span>
                      <span>Score ${(c.score * 100).toFixed(0)}%</span>
                    </div>
                    <div class="citation-text">"${this.escapeHTML((c.text || '').slice(0, 260))}..."</div>
                  </div>
                `;
              }
            }).join('')}
          </div>
        </div>
      `;
    }

    row.innerHTML = `
      <div class="message-avatar">${avatarIcon}</div>
      <div class="message-bubble">
        ${routeBadgeHTML}
        ${contentHTML}
        ${citationsHTML}
      </div>
    `;

    // Code copy buttons enhancement
    row.querySelectorAll('pre').forEach(pre => {
      const code = pre.querySelector('code');
      const header = document.createElement('div');
      header.className = 'code-header';
      header.innerHTML = `
        <span>Code</span>
        <button class="code-copy-btn"><i class="fa-regular fa-copy"></i> Copy</button>
      `;
      pre.insertBefore(header, code);

      header.querySelector('.code-copy-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(code.innerText).then(() => {
          header.querySelector('.code-copy-btn').innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
          setTimeout(() => {
            header.querySelector('.code-copy-btn').innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
          }, 2000);
        });
      });
    });

    stream.appendChild(row);
    return row;
  },

  renderTypingIndicator() {
    const stream = document.getElementById('messagesStream');
    const row = document.createElement('div');
    row.className = 'message-row assistant';
    row.innerHTML = `
      <div class="message-avatar"><i class="fa-solid fa-brain"></i></div>
      <div class="message-bubble typing-bubble">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    stream.appendChild(row);
    return row;
  },

  scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
  },

  escapeHTML(str) {
    return (str || '').replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
