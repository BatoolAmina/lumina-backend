const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  const extractedErrors = {};
  errors.array().forEach(err => {
    extractedErrors[err.path] = err.msg;
  });

  return res.status(422).json({
    status: 'fail',
    message: 'Neural Validation Failed',
    errors: extractedErrors,
  });
};

const authValidationRules = () => {
  return [
    body('email')
      .isEmail()
      .withMessage('Enter a valid email address')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Name cannot be empty')
  ];
};

const chatValidationRules = () => {
  return [
    body('content')
      .trim()
      .custom((value, { req }) => {
        const hasFile = req.file || (req.files && req.files.length > 0);
        const isGenerating = req.body.imageAction === 'generate';
        if (!value && !hasFile && !isGenerating) {
          throw new Error('Neural input or content is required');
        }
        return true;
      }),
    body('chatId')
      .optional()
      .isString()
      .withMessage('Chat ID must be a string'),
    body('documentId')
      .optional()
      .isMongoId()
      .withMessage('Invalid Document ID'),
    body('roomId')
      .optional()
      .isMongoId()
      .withMessage('Invalid Room ID'),
    body('imageAction')
      .optional()
      .isIn(['generate', 'analyze', 'none'])
      .withMessage('Invalid image action'),
    body('isCodeRequest')
      .optional()
      .toBoolean()
  ];
};

const roomValidationRules = () => {
  return [
    body('name')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Room name must be 3-50 characters')
      .escape(),
    body('documentId')
      .optional()
      .isMongoId()
      .withMessage('Invalid document ID'),
    body('inviteCode')
      .optional()
      .isString()
      .isLength({ min: 6, max: 6 })
      .withMessage('Invite code must be 6 characters')
  ];
};

module.exports = {
  validate,
  authValidationRules,
  chatValidationRules,
  roomValidationRules
};