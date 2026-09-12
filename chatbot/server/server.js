require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db');
const { getAIStatus } = require('./ai_config');
const { router: authRouter, authenticateToken } = require('./routes/auth');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api', authenticateToken, chatRouter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let vectorStatus = { documentsCount: 0, totalStudents: 0, loaded: false };

  try {
    const { getDepartmentStats } = require('./rag');
    vectorStatus = { ...getDepartmentStats(), loaded: true };
  } catch (err) {
    vectorStatus = { documentsCount: 0, totalStudents: 0, loaded: false, error: err.message };
  }

  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Nexus AI Chatbot Server',
    ai: require('./ai_config').getAIStatus(),
    vectorDb: vectorStatus
  });
});

// Single Page App fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Server Initialization
async function start() {
  try {
    const dbStatus = await initDB();
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Nexus AI Chatbot Server running on http://localhost:${PORT}`);
      const aiStatus = getAIStatus();
      console.log(`📦 Database Mode: ${dbStatus.type === 'mongodb' ? 'MongoDB Atlas (Connected)' : 'Local Persistent Storage (Active)'}`);
      console.log(`🤖 AI Status: ${aiStatus.message}`);
      console.log(`✨ PDF RAG & Vector DB Ready`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Fatal Server Startup Error:', err);
    process.exit(1);
  }
}

start();
