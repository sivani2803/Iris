const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');

let memoryServer = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/iris';

  try {
    mongoose.set('strictQuery', false);
    console.log('[IRIS DB] Connecting to Atlas database...');

    // Standard Atlas connection timeout (15-30s)
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });

    console.log(`[IRIS DB] Connected successfully to Atlas at: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`[IRIS DB] MongoDB Atlas unavailable (${err.message}). Starting in-memory fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      await mongoose.connect(memUri);
      console.log(`[IRIS DB] Connected to In-Memory MongoDB at: ${memUri}`);
    } catch (memErr) {
      console.error('[IRIS DB] Failed to start in-memory MongoDB:', memErr.message);
      process.exit(1);
    }
  }

  // Run seed data
  const { seedInitialData } = require('../utils/seed');
  await seedInitialData();
}

module.exports = { connectDB };