const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { uploadMiddleware, uploadFile } = require('../controllers/uploadController');

router.post('/', protect, uploadMiddleware, uploadFile);

module.exports = router;
