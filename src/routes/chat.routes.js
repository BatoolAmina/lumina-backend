const express = require('express');
const chatController = require('../controllers/chat.controller');
const { protect } = require('../middleware/protect');
const { apiLimiter } = require('../middleware/rateLimiter');
const { chatValidationRules, validate } = require('../middleware/validator');
const upload = require('../middleware/multer.middleware');

const router = express.Router();

router.use(protect);

router.post(
  '/send',
  apiLimiter,
  upload.array('files', 5),
  chatValidationRules(),
  validate,
  chatController.sendMessage
);

router.get(
  '/history/list', 
  chatController.getChatList
);

router.get(
  '/history/:chatId',
  chatController.getChatHistory
);

router.delete(
  '/history/:chatId',
  chatController.deleteChatHistory
);

router.patch(
  '/history/:chatId', 
  chatController.renameChat
);

router.post(
  '/query',
  apiLimiter,
  chatController.queryDocument
);

module.exports = router;

