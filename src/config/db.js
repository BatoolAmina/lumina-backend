const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });

    console.log(`Lumina Database Synced: ${conn.connection.host}`);
    console.log(`Active Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`Lumina Sync Failed: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('connected', () => {
  console.log('Lumina Pipeline: Online');
});

mongoose.connection.on('disconnected', () => {
  console.warn('Lumina Pipeline: Offline. Attempting reconnection...');
});

mongoose.connection.on('error', (err) => {
  console.error(`Lumina Critical Error: ${err}`);
});

// Handle application termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Lumina Database Connection Closed via App Termination');
  process.exit(0);
});

module.exports = connectDB;