import mongoose from 'mongoose';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FALLBACK_MONGO_URI = 'mongodb+srv://sruthinimmalaa206_db_user:sowmya0510@cluster0.qesbnze.mongodb.net/?appName=Cluster0';

function getMongoUri() {
  if (process.env.MONGODB_URI && process.env.MONGODB_URI.trim()) {
    return process.env.MONGODB_URI.trim();
  }
  const candidatePaths = [
    path.resolve(process.cwd(), 'backend', '.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '..', '..', '.env'),
  ];
  for (const envPath of candidatePaths) {
    try {
      if (fs.existsSync(envPath)) {
        const fileContent = fs.readFileSync(envPath, 'utf8');
        const match = fileContent.match(/MONGODB_URI\s*=\s*([^\r\n]+)/);
        if (match && match[1]) {
          return match[1].trim().replace(/^["']|["']$/g, '');
        }
      }
    } catch {}
  }
  return FALLBACK_MONGO_URI;
}

const connectDB = async () => {
  try {
    const uri = getMongoUri();
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    const conn = await mongoose.connect(uri, {
      dbName: 'study_group_finder',
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('========================================');
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('========================================');
    console.error('💡 Troubleshooting tips:');
    console.error('   1. Verify MONGODB_URI username, password, and cluster in backend/.env');
    console.error('   2. On MongoDB Atlas → Security → Database Access: ensure user exists with correct password');
    console.error('   3. On MongoDB Atlas → Network Access: add your current IP (or 0.0.0.0/0 for testing)');
    console.error('   4. Ensure the connection string includes the correct cluster URL');
    console.error('========================================');
    console.warn('⚠️  Server will start WITHOUT database. API calls will fail until DB is fixed.');
    console.warn('    Fix .env then restart the backend to enable full functionality.');
  }
};

export default connectDB;
