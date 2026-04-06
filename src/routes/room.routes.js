const express = require('express');
const roomController = require('../controllers/room.controller');
const { protect } = require('../middleware/protect');
const { apiLimiter } = require('../middleware/rateLimiter');
const { roomValidationRules, validate } = require('../middleware/validator');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  apiLimiter,
  roomValidationRules(),
  validate,
  roomController.createRoom
);

router.post(
  '/join',
  apiLimiter,
  roomController.joinRoom
);

router.get(
  '/my-rooms',
  roomController.getMyRooms
);

router.get(
  '/:id',
  roomController.getRoomDetails
);

module.exports = router;