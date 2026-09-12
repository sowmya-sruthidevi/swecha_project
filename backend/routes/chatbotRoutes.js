import express from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import {
  sendMessage,
  uploadAndParsePdf,
  getChatSessions,
  getSessionMessages,
  deleteSession,
  clearAllHistory,
} from '../controllers/chatbotController.js';

const router = express.Router();

// Optional JWT authentication: attaches user if token is present and valid, otherwise proceeds
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && token !== 'null' && token !== 'undefined') {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.id) {
          req.user = await User.findById(decoded.id).select('-password');
        }
      }
    }
  } catch (err) {
    // Ignore invalid/expired token and proceed as guest
  }
  next();
};

// Multer memory storage for uploaded PDFs
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024, // 30 MB
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents (.pdf) are supported'), false);
    }
  },
});

// Chat message generation (with Groq API & MongoDB save)
router.post('/chat', optionalAuth, sendMessage);

// PDF upload and text extraction
router.post('/upload-pdf', upload.single('pdf'), uploadAndParsePdf);

// Chat sessions history
router.get('/sessions', optionalAuth, getChatSessions);

// Get messages for a session
router.get('/sessions/:sessionId/messages', optionalAuth, getSessionMessages);

// Delete session
router.delete('/sessions/:sessionId', optionalAuth, deleteSession);

// Clear all history
router.delete('/clear-all', optionalAuth, clearAllHistory);

export default router;
