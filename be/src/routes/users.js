const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { searchLimiter, apiLimiter } = require('../middleware/rateLimiters');
const { searchValidation, updateProfileValidation, mongoIdValidation } = require('../middleware/validation');
const {
  getProfile, updateProfile, searchUsers, getMatches, skipMatch,
  sendRequest, acceptRequest, rejectRequest, getConnections, disconnectUser,
  submitFeedback, getPublicSubjects, logStudy, getLeaderboard,
  getSharedStudyHours, getMyProfile
} = require('../controllers/userController');


router.post('/feedback', protect, apiLimiter, submitFeedback);
router.get('/subjects', protect, getPublicSubjects);

router.get('/support-admin', protect, require('../controllers/userController').getSupportAdmin);
router.get('/search', protect, searchLimiter, searchValidation, searchUsers);
router.get('/matches', protect, apiLimiter, getMatches);
router.get('/connections', protect, getConnections);
router.get('/leaderboard', protect, getLeaderboard);

// GPS routes removed — platform now uses Semantic Nebula (subject-based clustering)
// router.get('/nearby', protect, getNearbyUsers);
// router.put('/profile/location', protect, updateLocation);
router.get('/profile', protect, getMyProfile);

router.put('/profile', protect, updateProfileValidation, updateProfile);
router.post('/log-study', protect, apiLimiter, logStudy);
router.post('/sync-github', protect, apiLimiter, require('../controllers/userController').syncGithub);
router.get('/analytics/me', protect, require('../controllers/userController').getMyAnalytics);


router.get('/:id/quick-peek',    protect, mongoIdValidation, require('../controllers/userController').getQuickPeek);
router.get('/:id/shared-study-hours', protect, mongoIdValidation, getSharedStudyHours);
router.get('/:id',               protect, mongoIdValidation, getProfile);

router.post('/matches/:userId/skip', protect, apiLimiter, skipMatch);
router.post('/connect/:userId', protect, apiLimiter, sendRequest);
router.post('/accept/:userId', protect, apiLimiter, acceptRequest);
router.post('/reject/:userId', protect, apiLimiter, rejectRequest);
router.post('/disconnect/:userId', protect, apiLimiter, disconnectUser);

module.exports = router;
