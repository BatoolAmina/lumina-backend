require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const socketService = require('./src/services/socket.service');
const { Server } = require('socket.io');

if (!process.env.HUGGINGFACE_TOKEN) {
  console.warn('⚠️  WARNING: HUGGINGFACE_TOKEN is missing in .env. AI features will fail.');
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://127.0.0.1:3000'
    ],
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  pingTimeout: 60000,
  connectTimeout: 60000
});

socketService.init(io);

connectDB();

const PORT = process.env.PORT || 5001;
const HOST = '0.0.0.0';

const serverInstance = server.listen(PORT, HOST, () => {
  console.log('-----------------------------------------');
  console.log(`🚀 LUMINA PROTOCOL: ONLINE`);
  console.log(`📡 ADDRESS: ${HOST}:${PORT}`);
  console.log(`🔗 HEALTH: http://${HOST}:${PORT}/health`);
  console.log(`🛠️  ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log('-----------------------------------------');
});

process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! Protocol Breach:');
  console.error(err.name, err.message);
  console.error(err.stack);
  
  serverInstance.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! System Failure:');
  console.error(err.name, err.message);
  console.error(err.stack);
  
  serverInstance.close(() => {
    process.exit(1);
  });
});

const gracefulShutdown = (signal) => {
  console.log(`\n👋 ${signal} RECEIVED. Terminating Lumina Protocol gracefully...`);
  serverInstance.close(() => {
    console.log('💤 Process terminated.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));