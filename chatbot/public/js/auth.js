// Authentication & User Management Module
const Auth = {
  tokenKey: 'nexus_auth_token',
  userKey: 'nexus_user_data',

  getToken() {
    return localStorage.getItem(this.tokenKey);
  },

  getUser() {
    try {
      const data = localStorage.getItem(this.userKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setAuth(token, user) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.updateUserUI();
  },

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.updateUserUI();
    window.location.reload();
  },

  async checkStatus() {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      const dot = document.querySelector('.status-dot');
      const text = document.getElementById('statusText');
      const atlasDesc = document.getElementById('atlasInfoDesc');

      if (data.connectedToAtlas) {
        dot.classList.add('connected');
        text.textContent = 'MongoDB Atlas Cloud';
        if (atlasDesc) {
          atlasDesc.innerHTML = `<span style="color: #10b981;">● Connected to MongoDB Atlas Cloud.</span> All chats & sessions are synced securely.`;
        }
      } else {
        dot.classList.remove('connected');
        text.textContent = 'Local DB Mode';
        if (atlasDesc) {
          atlasDesc.innerHTML = `Running with local file storage. To switch to MongoDB Atlas Cloud, specify <code>MONGODB_URI</code> in your <code>.env</code>.`;
        }
      }
    } catch (err) {
      console.warn('Status check notice:', err);
    }
  },

  async fetchCurrentUser() {
    const token = this.getToken();
    if (!token) {
      this.updateUserUI();
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user && !data.user.isGuest) {
          localStorage.setItem(this.userKey, JSON.stringify(data.user));
        }
      } else {
        // Expired token
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
      }
    } catch (err) {
      console.warn('Error fetching user:', err);
    }
    this.updateUserUI();
  },

  updateUserUI() {
    const user = this.getUser();
    const avatar = document.getElementById('userAvatar');
    const nameDisplay = document.getElementById('userNameDisplay');
    const emailDisplay = document.getElementById('userEmailDisplay');
    const authBtnIcon = document.getElementById('authBtnIcon');
    const authToggleBtn = document.getElementById('authToggleBtn');

    if (user && user.username && !user.isGuest) {
      avatar.textContent = user.username.charAt(0).toUpperCase();
      nameDisplay.textContent = user.username;
      emailDisplay.textContent = user.email || 'Authenticated User';
      authBtnIcon.className = 'fa-solid fa-right-from-bracket';
      authToggleBtn.title = 'Logout';
    } else {
      avatar.textContent = 'G';
      nameDisplay.textContent = 'Guest Explorer';
      emailDisplay.textContent = 'Sign in to save to MongoDB';
      authBtnIcon.className = 'fa-solid fa-right-to-bracket';
      authToggleBtn.title = 'Sign In / Register';
    }
  },

  init() {
    this.checkStatus();
    this.fetchCurrentUser();
    this.setupListeners();
  },

  setupListeners() {
    const modal = document.getElementById('authModal');
    const authToggleBtn = document.getElementById('authToggleBtn');
    const userProfileCard = document.getElementById('userProfileCard');
    const closeBtn = document.getElementById('closeAuthModalBtn');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginError = document.getElementById('loginError');
    const regError = document.getElementById('regError');

    // Open/Logout button
    authToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const user = this.getUser();
      if (user && user.username && !user.isGuest) {
        if (confirm('Are you sure you want to log out?')) {
          this.logout();
        }
      } else {
        modal.classList.remove('hidden');
      }
    });

    userProfileCard.addEventListener('click', () => {
      const user = this.getUser();
      if (!user || user.isGuest) {
        modal.classList.remove('hidden');
      }
    });

    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });

    // Tab switching
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
      loginError.classList.add('hidden');
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      registerForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
      regError.classList.add('hidden');
    });

    // Login submit
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginError.classList.add('hidden');
      const submitBtn = document.getElementById('loginSubmitBtn');
      const usernameOrEmail = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="spinner-small"></div> Signing in...';

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usernameOrEmail, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');

        this.setAuth(data.token, data.user);
        modal.classList.add('hidden');
        loginForm.reset();
        // Trigger session reload
        window.dispatchEvent(new CustomEvent('auth:change'));
      } catch (err) {
        loginError.textContent = err.message;
        loginError.classList.remove('hidden');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Sign In</span> <i class="fa-solid fa-arrow-right"></i>';
      }
    });

    // Register submit
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      regError.classList.add('hidden');
      const submitBtn = document.getElementById('regSubmitBtn');
      const username = document.getElementById('regUsername').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="spinner-small"></div> Creating account...';

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');

        this.setAuth(data.token, data.user);
        modal.classList.add('hidden');
        registerForm.reset();
        window.dispatchEvent(new CustomEvent('auth:change'));
      } catch (err) {
        regError.textContent = err.message;
        regError.classList.remove('hidden');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Create Account</span> <i class="fa-solid fa-user-plus"></i>';
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => Auth.init());
