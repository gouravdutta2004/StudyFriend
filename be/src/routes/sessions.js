const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiters');
const { 
  createSessionValidation, 
  addNoteValidation, 
  rsvpValidation, 
  collabNotesValidation 
} = require('../middleware/sessionValidation');
const { createSession, getSessions, getMySessions, getSessionById, joinSession, leaveSession, deleteSession, addNote, rsvpSession, updateCollabNotes, getCollabNotes } = require('../controllers/sessionController');

router.get('/', protect, apiLimiter, getSessions);
router.get('/my', protect, getMySessions);
router.get('/:id', protect, getSessionById);
router.post('/', protect, apiLimiter, createSessionValidation, createSession);
router.post('/:id/join', protect, apiLimiter, joinSession);
router.post('/:id/leave', protect, apiLimiter, leaveSession);
router.post('/:id/rsvp', protect, apiLimiter, rsvpValidation, rsvpSession);
router.post('/:id/notes', protect, apiLimiter, addNoteValidation, addNote);
router.put('/:id/collab-notes', protect, collabNotesValidation, updateCollabNotes);
router.get('/:id/collab-notes', protect, getCollabNotes);
router.delete('/:id', protect, apiLimiter, deleteSession);

module.exports = router;

