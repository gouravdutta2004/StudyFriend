const { body, param, validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// Session validations
const createSessionValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('subject')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Subject must be between 2 and 100 characters'),
  body('scheduledAt')
    .isISO8601()
    .withMessage('Valid date is required')
    .custom((value) => {
      const date = new Date(value);
      if (date < new Date()) {
        throw new Error('Scheduled date must be in the future');
      }
      return true;
    }),
  body('duration')
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  body('isOnline')
    .isBoolean()
    .withMessage('isOnline must be a boolean'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 2, max: 100 })
    .withMessage('Max participants must be between 2 and 100'),
  body('recurrence')
    .optional()
    .isIn(['NONE', 'WEEKLY'])
    .withMessage('Recurrence must be NONE or WEEKLY'),
  validate
];

const addNoteValidation = [
  body('url')
    .trim()
    .isURL()
    .withMessage('Valid URL is required'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Note name must be between 1 and 200 characters'),
  validate
];

const rsvpValidation = [
  body('status')
    .isIn(['ATTENDING', 'PENDING', 'DECLINED'])
    .withMessage('Status must be ATTENDING, PENDING, or DECLINED'),
  validate
];

const collabNotesValidation = [
  body('content')
    .isString()
    .withMessage('Content must be a string')
    .isLength({ max: 100000 })
    .withMessage('Content too large (max 100KB)'),
  validate
];

// Message validations
const sendMessageValidation = [
  body('receiverId')
    .notEmpty()
    .withMessage('Receiver ID is required')
    .isMongoId()
    .withMessage('Invalid receiver ID'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters'),
  validate
];

const conversationValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  validate
];

module.exports = {
  createSessionValidation,
  addNoteValidation,
  rsvpValidation,
  collabNotesValidation,
  sendMessageValidation,
  conversationValidation,
  validate
};
