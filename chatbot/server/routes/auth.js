const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'nexus_ai_chatbot_secret_jwt_key_2026_super_secure';

function generateToken(user) {
  return jwt.sign(
    { id: user.id || user._id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // If guest / demo mode, assign guest user id
    req.user = { id: 'guest_user', username: 'Guest Explorer', isGuest: true };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      req.user = { id: 'guest_user', username: 'Guest Explorer', isGuest: true };
      return next();
    }
    req.user = decoded;
    next();
  });
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existingUser = await db.findUserByUsernameOrEmail(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email is already taken.' });
    }

    const user = await db.createUser({ username, email, password });
    const token = generateToken(user);
    res.status(201).json({
      message: 'Account created successfully',
      user: { id: user.id, username: user.username, email: user.email },
      token,
      isAtlas: db.isAtlasConnected()
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Username/email and password are required.' });
    }

    const user = await db.findUserByUsernameOrEmail(usernameOrEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = generateToken(user);
    res.json({
      message: 'Logged in successfully',
      user: { id: user.id || user._id, username: user.username, email: user.email },
      token,
      isAtlas: db.isAtlasConnected()
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Current User
router.get('/me', authenticateToken, async (req, res) => {
  if (req.user.isGuest) {
    return res.json({ user: req.user, isAtlas: db.isAtlasConnected() });
  }
  const user = await db.findUserById(req.user.id);
  res.json({ user: user || req.user, isAtlas: db.isAtlasConnected() });
});

// Database Status
router.get('/status', (req, res) => {
  res.json({
    connectedToAtlas: db.isAtlasConnected(),
    storageType: db.isAtlasConnected() ? 'MongoDB Atlas Cloud' : 'Local Persistent Store'
  });
});

module.exports = { router, authenticateToken };
