require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const socketService = require('./src/services/socket.service');
const { Server } = require('socket.io');

const isProduction = process.env.NODE_ENV === 'production';

if (!process.env.HUGGINGFACE_TOKEN) {
  console.warn('⚠️  WARNING: HUGGINGFACE_TOKEN is missing. AI features offline.');
}

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL, // e.g., https://lumina-frontend.vercel.app
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  pingTimeout: 60000,
  connectTimeout: 60000,
  transports: ['websocket', 'polling']
});

socketService.init(io);

connectDB();

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

const serverInstance = server.listen(PORT, HOST, () => {
  console.log('-----------------------------------------');
  console.log(`🚀 LUMINA PROTOCOL: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`📡 ADDRESS: ${HOST}:${PORT}`);
  console.log(`🔗 HEALTH: http://${HOST}:${PORT}/health`);
  console.log('-----------------------------------------');
});

const handleFatalError = (type, err) => {
  console.error(`❌ ${type}! Protocol Breach:`, err.name, err.message);
  if (!isProduction) console.error(err.stack);
  
  serverInstance.close(() => {
    process.exit(1);
  });
};

process.on('unhandledRejection', (err) => handleFatalError('UNHANDLED REJECTION', err));
process.on('uncaughtException', (err) => handleFatalError('UNCAUGHT EXCEPTION', err));

const gracefulShutdown = (signal) => {
  console.log(`\n👋 ${signal} RECEIVED. Terminating Lumina Protocol...`);
  serverInstance.close(() => {
    console.log('💤 Process terminated.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));