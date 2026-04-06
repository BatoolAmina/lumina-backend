const mongoose = require('mongoose');
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
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
  console.log('Lumina Pipeline: Offline. Attempting reconnection...');
});
mongoose.connection.on('error', (err) => {
  console.error(`Lumina Critical Error: ${err}`);
});
module.exports = connectDB;