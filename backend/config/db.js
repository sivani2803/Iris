const mongoose = require('mongoose');

let memoryServer = null;

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/iris';

  try {
    // Attempt connecting to configured MongoDB (timeout 2.5s for fast fallback)
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[IRIS DB] Connected to MongoDB at: ${uri}`);
  } catch (err) {
    console.warn(`[IRIS DB] Local MongoDB unavailable (${err.message}). Starting in-memory fallback...`);
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
