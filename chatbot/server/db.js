const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

let isMongoConnected = false;
const DATA_DIR = path.join(__dirname, '..', 'data');
const LOCAL_STORE_FILE = path.join(DATA_DIR, 'local_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Local store schema
function readLocalStore() {
  try {
    if (fs.existsSync(LOCAL_STORE_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_STORE_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading local store:', err.message);
  }
  return { users: [], sessions: [], messages: [] };
}

function writeLocalStore(data) {
  try {
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing local store:', err.message);
  }
}

// Mongoose Schemas (Used when connected to MongoDB Atlas)
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const SessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, default: 'New Conversation' },
  model: { type: String, default: 'gpt-4o-mini' },
  activeDocument: {
    filename: String,
    originalname: String,
    pageCount: Number,
    chunkCount: Number,
    uploadedAt: Date
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  citations: [mongoose.Schema.Types.Mixed],
  route: { type: String, default: null },
  hasAudio: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const VectorDocSchema = new mongoose.Schema({
  docId: { type: String, required: true, unique: true },
  title: String,
  category: { type: String, default: 'department_students' },
  filename: String,
  chunks: [{
    index: Number,
    text: String,
    metadata: mongoose.Schema.Types.Mixed,
    embedding: [Number]
  }],
  createdAt: { type: Date, default: Date.now }
});

let UserModel, SessionModel, MessageModel, VectorDocModel;

async function initDB() {
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri && mongoUri.trim().length > 0) {
    try {
      console.log('Connecting to MongoDB Atlas...');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000
      });
      isMongoConnected = true;
      UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
      SessionModel = mongoose.models.Session || mongoose.model('Session', SessionSchema);
      MessageModel = mongoose.models.Message || mongoose.model('Message', MessageSchema);
      VectorDocModel = mongoose.models.VectorDoc || mongoose.model('VectorDoc', VectorDocSchema);
      console.log('Successfully connected to MongoDB Atlas!');
      return { type: 'mongodb', status: 'connected' };
    } catch (err) {
      console.warn('MongoDB Atlas connection failed or timed out. Falling back to local persistent store.', err.message);
      isMongoConnected = false;
    }
  } else {
    console.log('No MONGODB_URI provided in .env. Using seamless local persistent store (data/local_db.json).');
  }
  return { type: 'local', status: 'active' };
}

// Unified Database Adapter Layer
const db = {
  isAtlasConnected: () => isMongoConnected,

  async findUserByUsernameOrEmail(identifier) {
    if (isMongoConnected) {
      return await UserModel.findOne({
        $or: [{ username: identifier }, { email: identifier.toLowerCase() }]
      });
    }
    const store = readLocalStore();
    return store.users.find(u => u.username === identifier || u.email.toLowerCase() === identifier.toLowerCase()) || null;
  },

  async findUserById(id) {
    if (isMongoConnected) {
      return await UserModel.findById(id).select('-password');
    }
    const store = readLocalStore();
    const user = store.users.find(u => u.id === id || u._id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  },

  async createUser({ username, email, password }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    if (isMongoConnected) {
      const user = new UserModel({
        username,
        email: email.toLowerCase(),
        password: hashedPassword
      });
      await user.save();
      return { id: user._id.toString(), username: user.username, email: user.email };
    }

    const store = readLocalStore();
    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    store.users.push(newUser);
    writeLocalStore(store);
    return { id: newUser.id, username: newUser.username, email: newUser.email };
  },

  async getSessions(userId) {
    if (isMongoConnected) {
      return await SessionModel.find({ userId }).sort({ updatedAt: -1 });
    }
    const store = readLocalStore();
    return store.sessions
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  async getSession(sessionId, userId) {
    if (isMongoConnected) {
      return await SessionModel.findOne({ _id: sessionId, userId });
    }
    const store = readLocalStore();
    return store.sessions.find(s => (s.id === sessionId || s._id === sessionId) && s.userId === userId) || null;
  },

  async createSession(userId, title = 'New Conversation', model = 'gpt-4o-mini') {
    if (isMongoConnected) {
      const session = new SessionModel({ userId, title, model });
      await session.save();
      return session;
    }
    const store = readLocalStore();
    const newSession = {
      id: 'ses_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId,
      title,
      model,
      activeDocument: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.sessions.unshift(newSession);
    writeLocalStore(store);
    return newSession;
  },

  async updateSession(sessionId, userId, updates) {
    updates.updatedAt = new Date().toISOString();
    if (isMongoConnected) {
      return await SessionModel.findOneAndUpdate(
        { _id: sessionId, userId },
        { $set: updates },
        { new: true }
      );
    }
    const store = readLocalStore();
    const index = store.sessions.findIndex(s => (s.id === sessionId || s._id === sessionId) && s.userId === userId);
    if (index !== -1) {
      store.sessions[index] = { ...store.sessions[index], ...updates };
      writeLocalStore(store);
      return store.sessions[index];
    }
    return null;
  },

  async deleteSession(sessionId, userId) {
    if (isMongoConnected) {
      await SessionModel.deleteOne({ _id: sessionId, userId });
      await MessageModel.deleteMany({ sessionId });
      return true;
    }
    const store = readLocalStore();
    store.sessions = store.sessions.filter(s => !( (s.id === sessionId || s._id === sessionId) && s.userId === userId ));
    store.messages = store.messages.filter(m => m.sessionId !== sessionId);
    writeLocalStore(store);
    return true;
  },

  async getMessages(sessionId) {
    if (isMongoConnected) {
      return await MessageModel.find({ sessionId }).sort({ createdAt: 1 });
    }
    const store = readLocalStore();
    return store.messages
      .filter(m => m.sessionId === sessionId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  async addMessage({ sessionId, role, content, citations = [], hasAudio = false, route = null }) {
    const timestamp = new Date().toISOString();
    if (isMongoConnected) {
      const msg = new MessageModel({ sessionId, role, content, citations, hasAudio, route, createdAt: timestamp });
      await msg.save();
      return msg;
    }
    const store = readLocalStore();
    const newMsg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      sessionId,
      role,
      content,
      citations,
      hasAudio,
      route,
      createdAt: timestamp
    };
    store.messages.push(newMsg);
    writeLocalStore(store);
    return newMsg;
  },

  async saveVectorDoc({ docId, title, category, filename, chunks }) {
    if (isMongoConnected) {
      return await VectorDocModel.findOneAndUpdate(
        { docId },
        { docId, title, category, filename, chunks, createdAt: new Date() },
        { upsert: true, new: true }
      );
    }
    const store = readLocalStore();
    if (!store.vectorDocs) store.vectorDocs = [];
    const existingIndex = store.vectorDocs.findIndex(d => d.docId === docId);
    const docData = { docId, title, category, filename, chunks, createdAt: new Date().toISOString() };
    if (existingIndex !== -1) {
      store.vectorDocs[existingIndex] = docData;
    } else {
      store.vectorDocs.push(docData);
    }
    writeLocalStore(store);
    return docData;
  },

  async getVectorDocs(category = null) {
    if (isMongoConnected) {
      const query = category ? { category } : {};
      return await VectorDocModel.find(query);
    }
    const store = readLocalStore();
    if (!store.vectorDocs) return [];
    if (category) {
      return store.vectorDocs.filter(d => d.category === category);
    }
    return store.vectorDocs;
  }
};

module.exports = { initDB, db };
