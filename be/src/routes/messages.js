const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiters');
const { sendMessageValidation, conversationValidation } = require('../middleware/sessionValidation');
const { sendMessage, getConversation, getInbox } = require('../controllers/messageController');

router.get('/inbox', protect, getInbox);
router.get('/:userId', protect, conversationValidation, getConversation);
router.post('/', protect, apiLimiter, sendMessageValidation, sendMessage);

module.exports = router;
