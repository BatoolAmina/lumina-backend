const rateLimit = require('express-rate-limit');
const { SECURITY } = require('../config/constants');

const apiLimiter = rateLimit({
  windowMs: SECURITY?.RATE_LIMIT_WINDOW || 15 * 60 * 1000,
  max: SECURITY?.RATE_LIMIT_MAX_REQUESTS || 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      message: 'Neural Link Congestion: Too many requests. Interface stabilized in 15 minutes.'
    });
  }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      message: 'Security Protocol Active: Too many authentication attempts. Try again in 60 minutes.'
    });
  }
});

const aiGenerationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      message: 'Core Engine Overheated: Image/Complex generation limit reached. Cool down for 10 minutes.'
    });
  }
});

module.exports = { 
  apiLimiter, 
  authLimiter, 
  aiGenerationLimiter 
};