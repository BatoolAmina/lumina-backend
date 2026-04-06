const express = require('express');
const multer = require('multer');
const documentController = require('../controllers/document.controller');
const { protect } = require('../middleware/protect');
const { apiLimiter } = require('../middleware/rateLimiter');
const AppError = require('../utils/errorHandler');

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 20 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'application/json'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Format not supported. Lumina accepts PDF, TXT, or JSON.', 400), false);
    }
  }
});

router.use(protect);

router.post(
  '/upload',
  apiLimiter,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return next(new AppError(`Multer Limit Exceeded: ${err.message}`, 400));
      } else if (err) {
        return next(err);
      }
      if (!req.file) {
        return next(new AppError('No architecture file detected. Please upload a document.', 400));
      }
      next();
    });
  },
  documentController.uploadDocument
);

router.post('/query', apiLimiter, documentController.queryDocument);

router.get('/list', documentController.getUserDocuments);

router.delete('/:id', documentController.deleteDocument);

module.exports = router;