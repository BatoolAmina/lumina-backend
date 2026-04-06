const express = require('express');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/protect');
const { authValidationRules, validate } = require('../middleware/validator');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post(
  '/signup', 
  authLimiter, 
  authValidationRules(), 
  validate, 
  authController.signup
);

router.post(
  '/login', 
  authLimiter, 
  validate, 
  authController.login
);

router.post(
  '/external-login', 
  authController.externalLogin
);

router.get(
  '/me', 
  protect, 
  authController.getMe
);

router.get(
  '/logout', 
  authController.logout
);

module.exports = router;