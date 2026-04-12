const Session = require('../models/Session');
const { checkAndCompleteQuest } = require('../utils/questEngine');

// Sanitize error messages
const sanitizeError = (err) => {
  console.error('Session controller error:', err.message);
  return 'An error occurred';
};

// Safe regex with timeout protection
const createSafeRegex = (str) => {
  if (!str || typeof str !== 'string') return null;
  const escaped = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Limit length to prevent ReDoS
  if (escaped.length > 100) return null;
  try {
    return new RegExp(escaped, 'i');
  } catch (e) {
    return null;
  }
};

const createSession = async (req, res) => {
  try {
    const { title, description, subject, scheduledAt, duration, isOnline, meetingLink, location, maxParticipants, recurrence } = req.body;

    // Check for schedule conflicts for the host
    const userSessions = await Session.find({
      participants: req.user._id,
      status: { $in: ['upcoming', 'ongoing'] }
    });

    const sessionStart = new Date(scheduledAt);
    const sessionEnd = new Date(sessionStart.getTime() + (duration || 60) * 60000);

    const conflict = userSessions.find(s => {
      const sStart = new Date(s.scheduledAt);
      const sEnd = new Date(sStart.getTime() + (s.duration || 60) * 60000);
      return (sessionStart < sEnd && sessionEnd > sStart);
    });

    if (conflict) {
      return res.status(400).json({
        message: `Schedule Conflict: You already have a session at this time.`,
        conflict: conflict.title
      });
    }

    const session = await Session.create({
      title, description, subject, scheduledAt, duration, isOnline, meetingLink, location, maxParticipants, recurrence: recurrence || 'NONE',
      host: req.user._id,
      participants: [req.user._id]
    });
    await session.populate('host', 'name avatar');
    
    // Auto-complete quest
    const io = req.app.get('io');
    checkAndCompleteQuest(req.user._id, 'CREATE_SESSION', io).catch(() => {});
    
    if (recurrence === 'WEEKLY') {
      const clonedSessions = [];
      const baseDate = new Date(scheduledAt);
      for (let i = 1; i <= 4; i++) {
        const nextDate = new Date(baseDate.getTime() + (i * 7 * 24 * 60 * 60 * 1000));
        clonedSessions.push({
          title, description, subject, scheduledAt: nextDate, duration, isOnline, meetingLink, location, maxParticipants, recurrence: 'WEEKLY',
          host: req.user._id,
          participants: [req.user._id]
        });
      }
      await Session.insertMany(clonedSessions);
    }
    
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: sanitizeError(err) });
  }
};

const getSessions = async (req, res) => {
  try {
    const { subject, status } = req.query;
    const query = { status: status || 'upcoming' };
    
    if (subject) {
      const regex = createSafeRegex(subject);
      if (regex) query.subject = regex;
    }
    
    const sessions = await Session.find(query)
      .populate('host', 'name avatar university')
      .populate('participants', 'name avatar')
      .sort({ scheduledAt: 1 })
      .limit(100); // Prevent excessive data return
      
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: sanitizeError(err) });
  }
};

const getMySessions = async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [{ host: req.user._id }, { participants: req.user._id }]
    })
      .populate('host', 'name avatar')
      .populate('participants', 'name avatar')
      .sort({ scheduledAt: 1 })
      .limit(200);
      
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: sanitizeError(err) });
  }
};

const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('host', 'name avatar')
      .populate('participants', 'name avatar');
      
    if (!session) return res.status(404).json({ message: 'Session not found' });
    
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: sanitizeError(err) });
  }
};

const joinSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Check for schedule conflicts
    const userSessions = await Session.find({
      _id: { $ne: session._id },
      participants: req.user._id,
      status: { $in: ['upcoming', 'ongoing'] }
    });

    const sessionStart = new Date(session.scheduledAt);
    const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60000);

    const conflict = userSessions.find(s => {
      const sStart = new Date(s.scheduledAt);
      const sEnd = new Date(sStart.getTime() + s.duration * 60000);
      return (sessionStart < sEnd && sessionEnd > sStart);
    });

    if (conflict) {
      return res.status(400).json({
        message: `Schedule Conflict: You are already in a session at this time.`,
        conflict: conflict.title
      });
    }

    // Already a participant
    if (session.participants.map(p => p.toString()).includes(req.user._id.toString())) {
      return res.json({ message: 'Already joined', alreadyMember: true });
    }
    
    if (session.participants.length >= session.maxParticipants) {
      return res.status(400).json({ message: 'Session is full' });
    }
    
    session.participants.push(req.user._id);
    await session.save();
    
    // Auto-complete quest & notify host via socket
    const io = req.app.get('io');
    checkAndCompleteQuest(req.user._id, 'JOIN_SESSION', io).catch(() => {});
    
    if (io && session.host.toString() !== req.user._id.toString()) {
      io.to(session.host.toString()).emit('notification', { 
        message: `${req.user.name} joined your session` 
      });
    }

    res.json({ message: 'Joined session successfully' });
  } catch (err) {
    res.status(500).json({ message: sanitizeError(err) });
  }
};

const leaveSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    
    // Authorization check
    if (!session.participants.map(p => p.toString()).includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Not a participant of this session' });
    }
    
    session.participants = session.participants.filter(p => p.toString() !== req.user._id.toString());
    await session.save();
    
    res.json({ message: 'Left session' });
  } catch (err) {
    res.status(500).json({ message: sanitizeError(err) });
  }
};

const deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    
    // Authorization: Only host can delete
    if (session.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Prevent deletion of ongoing or completed sessions
    if (session.status === 'ongoing') {
      return res.status(400).json({ message: 'Cannot delete an ongoing session' });
    }
    
    await session.deleteOne();
    res.json({ message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ message: sanitizeError(err) });
  }
};

const addNote = async (req, res) => {
  try {
    const { url, name } = req.body;
    
    // Validate input
    if (!url || !name) {
      return res.status(400).json({ message: 'URL and name are required' });
    }
    
    // Limit note name length
    if (name.length > 200) {
      return res.status(400).json({ message: 'Note name too long' });
    }
    
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    
    // Authorization check
    const isParticipant = session.participants.map(p => p.toString()).includes(req.user._id.toString());
    const isHost = session.host.toString() === req.user._id.toString();
    
    if (!isParticipant && !isHost) {
      return res.status(403).json({ message: 'Not authorized to add notes to this session' });
    }
    
    session.notes.push({
      url,
      name,
      uploadedBy: req.user.name
    });
    
    await session.save();
    res.json(session.notes);
  } catch (err) {
    res.status(500).json({ message: sanitizeError(err) });
  }
};

const rsvpSession = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['ATTENDING', 'PENDING', 'DECLINED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid RSVP status' });
    }
    
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    
    // Remove existing RSVP for this user
    session.rsvps = session.rsvps.filter(r => r.userId.toString() !== req.user._id.toString());
    session.rsvps.push({ userId: req.user._id, status });
    await session.save();
    
    res.json({ message: `RSVP updated to ${status}` });
  } catch (err) {
    res.status(500).json({ message: sanitizeError(err) });
  }
};

const updateCollabNotes = async (req, res) => {
  try {
    const { content } = req.body;
    
    if (content === undefined) {
      return res.status(400).json({ message: 'content is required' });
    }
    
    // Limit content length to prevent abuse
    if (content.length > 100000) {
      return res.status(400).json({ message: 'Content too large (max 100KB)' });
    }
    
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    
    // Authorization check
    const isParticipant = session.participants.map(p => p.toString()).includes(req.user._id.toString());
    const isHost = session.host.toString() === req.user._id.toString();
    
    if (!isParticipant && !isHost) {
      return res.status(403).json({ message: 'Not authorized to edit notes for this session' });
    }
    
    session.collabNotes = content;
    await session.save();
    
    res.json({ message: 'Collab notes saved', collabNotes: session.collabNotes });
  } catch (err) {
    res.status(500).json({ message: sanitizeError(err) });
  }
};

const getCollabNotes = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).select('collabNotes host participants');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    
    // Authorization check
    const isParticipant = session.participants.some(p => p.toString() === req.user._id.toString());
    const isHost = session.host.toString() === req.user._id.toString();
    
    if (!isParticipant && !isHost) {
      return res.status(403).json({ message: 'Not authorized to view notes for this session' });
    }
    
    res.json({ collabNotes: session.collabNotes || '' });
  } catch (err) {
    res.status(500).json({ message: sanitizeError(err) });
  }
};

module.exports = { createSession, getSessions, getMySessions, getSessionById, joinSession, leaveSession, deleteSession, addNote, rsvpSession, updateCollabNotes, getCollabNotes };
