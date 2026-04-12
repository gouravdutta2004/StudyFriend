const router = require('express').Router();
const { register, login, getMe, forgotPassword, resetPassword, changePassword, googleAuth } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter, googleAuthLimiter, passwordResetLimiter } = require('../middleware/rateLimiters');
const { registerValidation, loginValidation, emailValidation, passwordResetValidation } = require('../middleware/validation');

router.post('/register', authLimiter, registerValidation, register);
router.get('/organizations', require('../controllers/authController').getOrganizations);
router.post('/login', authLimiter, loginValidation, login);
router.post('/google', googleAuthLimiter, googleAuth);
router.get('/me', protect, getMe);
router.post('/forgot-password', passwordResetLimiter, emailValidation, forgotPassword);
router.put('/reset-password/:token', passwordResetValidation, resetPassword);
router.put('/password', protect, changePassword);

module.exports = router;
