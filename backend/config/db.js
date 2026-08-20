import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
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
