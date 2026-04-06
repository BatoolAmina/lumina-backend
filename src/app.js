const express = require('express'); 
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const cors = require('cors');
const helmet = require('helmet');

const authRouter = require('./routes/auth.routes');
const chatRouter = require('./routes/chat.routes');
const documentRouter = require('./routes/document.routes');
const roomRouter = require('./routes/room.routes');
const { globalErrorHandler, AppError } = require('./utils/errorHandler');

const app = express();

app.use(helmet()); 

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: This origin is not allowed.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.use((req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  const sanitizeObject = (obj) => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        let targetKey = key;
        if (key.startsWith('$') || key.includes('.')) {
          const sanitizedValue = obj[key];
          delete obj[key];
          targetKey = key.replace(/\$/g, '').replace(/\./g, '_');
          obj[targetKey] = sanitizedValue;
        }

        if (typeof obj[targetKey] === 'string') {
          obj[targetKey] = sanitizeValue(obj[targetKey]);
        } else if (obj[targetKey] && typeof obj[targetKey] === 'object') {
          sanitizeObject(obj[targetKey]);
        }
      });
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  if (req.query) sanitizeObject(req.query); 
  next();
});

app.use(hpp());

app.get('/', (req, res) => {
  res.status(200).json({
    status: "online",
    system: "Lumina Neural Engine",
    version: "3.0",
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Lumina Protocol: Online',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/documents', documentRouter);
app.use('/api/v1/rooms', roomRouter);

app.use((req, res, next) => {
  const error = new AppError(`Cannot find ${req.originalUrl} on this server`, 404);
  next(error);
});

app.use(globalErrorHandler);

module.exports = app;