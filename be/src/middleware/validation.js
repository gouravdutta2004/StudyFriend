const { body, param, query, validationResult } = require('express-validator');

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

// Auth validations
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  validate
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

const passwordResetValidation = [
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  validate
];

const emailValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  validate
];

// User profile validations
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Bio must not exceed 300 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  validate
];

// Search validations
const searchValidation = [
  query('subject')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Subject must not exceed 100 characters'),
  query('name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Name must not exceed 50 characters'),
  query('_limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  validate
];

// Report validations
const reportValidation = [
  body('reportedUserId')
    .notEmpty()
    .withMessage('Reported user ID is required')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isIn(['HARASSMENT', 'NSFW', 'SPAM', 'OFF_TOPIC'])
    .withMessage('Invalid reason'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  validate
];

// MongoDB ID validation
const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  passwordResetValidation,
  emailValidation,
  updateProfileValidation,
  searchValidation,
  reportValidation,
  mongoIdValidation,
};
