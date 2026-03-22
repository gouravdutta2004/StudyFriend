const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const aiController = require('../controllers/aiController');

router.post('/chat', protect, aiController.chat);

module.exports = router;
