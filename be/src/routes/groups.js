const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getGroups, createGroup, joinGroup, leaveGroup } = require('../controllers/groupController');

router.get('/', protect, getGroups);
router.post('/', protect, createGroup);
router.post('/:id/join', protect, joinGroup);
router.post('/:id/leave', protect, leaveGroup);
router.get('/:id/quick-peek', protect, require('../controllers/groupController').getGroupQuickPeek);

module.exports = router;
