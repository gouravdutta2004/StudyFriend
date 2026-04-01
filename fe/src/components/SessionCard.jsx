import { useState, useEffect } from 'react';
import { Clock, Users, Video, MapPin, Trash2, LogIn, LogOut, ExternalLink, CalendarPlus, X, CheckCircle, Clock3, XCircle, Zap, Timer } from 'lucide-react';
import { format, addMinutes, differenceInSeconds } from 'date-fns';
import { Link } from 'react-router-dom';
import { Box, Typography, Button, IconButton, useTheme, Avatar, AvatarGroup } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import toast from 'react-hot-toast';

/* ── Sprint Card ── */
export default function SessionCard({ session, currentUserId, onJoin, onLeave, onDelete }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(null);
  
  const isHost = session.host?._id === currentUserId || session.host === currentUserId;
  const isParticipant = session.participants?.some(p => (p._id || p) === currentUserId);
  const isFull = session.participants?.length >= session.maxParticipants;
  const myRsvp = session.rsvps?.find(r => r.userId === currentUserId)?.status || 'PENDING';

  useEffect(() => {
    const timer = setInterval(() => {
      const start = new Date(session.scheduledAt);
      const now = new Date();
      if (start > now && differenceInSeconds(start, now) <= 900) {
        const m = Math.floor(differenceInSeconds(start, now) / 60);
        const s = differenceInSeconds(start, now) % 60;
        setCountdown(`${m}m ${s}s`);
      } else { setCountdown(null); }
    }, 1000);
    return () => clearInterval(timer);
  }, [session.scheduledAt]);

  const handleRsvp = async (status) => {
    try { await api.post(`/sessions/${session._id}/rsvp`, { status }); toast.success(`RSVP set to ${status}`); }
    catch { toast.error('Failed to RSVP'); }
  };

  const getCalendarUrl = () => {
    const start = new Date(session.scheduledAt);
    const end = addMinutes(start, session.duration || 60);
    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', session.title || 'Study Sprint');
    url.searchParams.append('dates', `${formatDate(start)}/${formatDate(end)}`);
    url.searchParams.append('location', session.isOnline ? (session.meetingLink || 'Online') : session.location);
    return url.toString();
  };

  return (
    <>
      <motion.div layoutId={`card-${session._id}`} onClick={() => !isOpen && setIsOpen(true)}
        whileHover={{ y: -4, scale: 1.02 }} style={{ height: '100%', cursor: 'pointer' }}>
        <Box sx={{
          p: 2.5, height: '100%', borderRadius: '16px', display: 'flex', flexDirection: 'column',
          bgcolor: isDark ? '#0d1117' : '#ffffff',
          border: '2px solid', borderColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.3)',
          boxShadow: `0 4px 0 ${isDark ? '#6366f1' : '#4f46e5'}`,
          position: 'relative', overflow: 'hidden', transition: 'all 0.2s',
          '&:active': { transform: 'translateY(4px)', boxShadow: '0 0 0 transparent' } // physical button press
        }}>
          {countdown && (
            <motion.div initial={{ x: -100 }} animate={{ x: 0 }} style={{ position: 'absolute', top: 0, left: 0, background: '#ef4444', color: 'white', padding: '4px 12px', borderBottomRightRadius: '12px', fontWeight: 900, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4, letterSpacing: 1 }}>
              <Zap size={12} fill="white" /> T-MINUS {countdown}
            </motion.div>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, mt: countdown ? 2 : 0 }}>
            <Box>
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 900, color: '#6366f1', letterSpacing: 2 }}>{session.subject?.toUpperCase()}</Typography>
              <Typography sx={{ fontWeight: 900, fontSize: '1.25rem', color: isDark ? 'white' : '#0f172a', lineHeight: 1.1, mt: 0.5, fontStyle: 'italic', letterSpacing: -0.5 }}>{session.title}</Typography>
            </Box>
            <Box sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', px: 1.5, py: 0.5, borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 800, color: isDark ? 'white' : '#0f172a' }}>
              {session.duration}M
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 'auto', borderTop: '2px dashed', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', pt: 2 }}>
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.82rem', fontWeight: 700, color: 'text.secondary', fontFamily: 'monospace' }}>
              <Timer size={14} color="#f59e0b" /> {format(new Date(session.scheduledAt), 'HH:mm')} SPRINT START
            </Typography>
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.82rem', fontWeight: 700, color: 'text.secondary', fontFamily: 'monospace' }}>
              <Users size={14} color="#3b82f6" /> {session.participants?.length}/{session.maxParticipants} CREW
            </Typography>
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.82rem', fontWeight: 700, color: 'text.secondary', fontFamily: 'monospace' }}>
              {session.isOnline ? <Video size={14} color="#10b981" /> : <MapPin size={14} color="#ef4444" />}
              {session.isOnline ? 'DIGITAL RELAY' : session.location?.toUpperCase()}
            </Typography>
          </Box>
        </Box>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <Box sx={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }} />
            
            <motion.div layoutId={`card-${session._id}`} style={{ background: isDark ? '#0d1117' : '#ffffff', border: '3px solid #6366f1', borderRadius: '24px', width: '100%', maxWidth: 500, zIndex: 1301, overflow: 'hidden', boxShadow: '0 0 40px rgba(99,102,241,0.4)', position: 'relative' }}>
              {/* Sprint Striping Background */}
              <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(99,102,241,0.03) 10px, rgba(99,102,241,0.03) 20px)', pointerEvents: 'none' }} />

              <Box sx={{ bgcolor: '#6366f1', p: 4, position: 'relative', color: 'white', borderBottom: '4px solid #4f46e5' }}>
                <IconButton onClick={() => setIsOpen(false)} sx={{ position: 'absolute', top: 12, right: 12, color: 'white', bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.4)' } }}><X size={20} /></IconButton>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 900, letterSpacing: 3, mb: 1, color: 'rgba(255,255,255,0.7)' }}>{session.subject?.toUpperCase()} SPRINT</Typography>
                <Typography sx={{ fontSize: '2rem', fontWeight: 900, fontStyle: 'italic', lineHeight: 1.1, letterSpacing: -1 }}>{session.title}</Typography>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 800, mt: 1, color: '#a5b4fc' }}>T-0: {format(new Date(session.scheduledAt), 'HH:mm')} | {format(new Date(session.scheduledAt), 'yyyy.MM.dd')}</Typography>
              </Box>

              <Box sx={{ p: 4, position: 'relative' }}>
                <Typography sx={{ fontSize: '0.9rem', color: isDark ? 'rgba(255,255,255,0.8)' : '#333', mb: 4, fontWeight: 500 }}>{session.description || 'No sprint briefing provided.'}</Typography>

                <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
                  <Box>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 900, color: '#f59e0b', letterSpacing: 1 }}>SPRINT LEAD</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1 }}>
                      <Avatar src={session.host?.avatar} sx={{ width: 36, height: 36, border: '2px solid #f59e0b' }} />
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 800 }}>{session.host?.name}</Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 900, color: '#3b82f6', letterSpacing: 1 }}>CREW ({session.participants?.length}/{session.maxParticipants})</Typography>
                    <AvatarGroup max={4} sx={{ mt: 1, '& .MuiAvatar-root': { width: 36, height: 36, border: '2px solid #3b82f6', fontSize: '0.8rem', fontWeight: 800 } }}>
                      {session.participants?.map(p => <Avatar key={p._id || p} src={p.avatar} />)}
                    </AvatarGroup>
                  </Box>
                </Box>

                {/* RSVP */}
                {(isHost || isParticipant) && (
                  <Box sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: '2px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', p: 2, borderRadius: '12px', mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 800 }}>RSVP STATUS</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size="small" sx={{ color: myRsvp === 'ATTENDING' ? '#22c55e' : 'text.disabled', bgcolor: myRsvp === 'ATTENDING' ? 'rgba(34,197,94,0.1)' : 'transparent' }} onClick={() => handleRsvp('ATTENDING')}><CheckCircle size={20} /></IconButton>
                      <IconButton size="small" sx={{ color: myRsvp === 'PENDING' ? '#f59e0b' : 'text.disabled', bgcolor: myRsvp === 'PENDING' ? 'rgba(245,158,11,0.1)' : 'transparent' }} onClick={() => handleRsvp('PENDING')}><Clock3 size={20} /></IconButton>
                      <IconButton size="small" sx={{ color: myRsvp === 'DECLINED' ? '#ef4444' : 'text.disabled', bgcolor: myRsvp === 'DECLINED' ? 'rgba(239,68,68,0.1)' : 'transparent' }} onClick={() => handleRsvp('DECLINED')}><XCircle size={20} /></IconButton>
                    </Box>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {!isHost && !isParticipant && !isFull && (
                    <Button variant="contained" fullWidth onClick={() => onJoin(session._id)} startIcon={<LogIn size={18} />} sx={{ fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: 1, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, borderRadius: '8px' }}>Join Sprint</Button>
                  )}
                  {isParticipant && !isHost && (
                    <Button variant="outlined" color="error" fullWidth onClick={() => onLeave(session._id)} startIcon={<LogOut size={18} />} sx={{ fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: 1, border: '2px solid', borderRadius: '8px' }}>Abort Sprint</Button>
                  )}
                  {(isHost || isParticipant) && session.isOnline && (
                    <Button component={Link} to={`/study-room/${session._id}`} variant="contained" fullWidth startIcon={<Zap size={18} />} sx={{ fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: 1, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: '8px' }}>
                      Enter Neural Link
                    </Button>
                  )}
                  {(isHost || isParticipant) && (
                    <Button component="a" href={getCalendarUrl()} target="_blank" fullWidth startIcon={<CalendarPlus size={18} />} sx={{ fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: 1, color: isDark ? 'white' : 'black', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: '8px', border: '2px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                      Log to Calendar
                    </Button>
                  )}
                  {isHost && (
                    <Button color="error" fullWidth onClick={() => onDelete(session._id)} startIcon={<Trash2 size={18} />} sx={{ fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: 1, border: '2px solid', borderRadius: '8px' }}>
                      Scuttle Sprint
                    </Button>
                  )}
                </Box>
              </Box>

            </motion.div>
          </Box>
        )}
      </AnimatePresence>
    </>
  );
}
