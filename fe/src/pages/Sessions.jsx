import { useEffect, useState } from 'react';
import api from '../api/axios';
import SessionCard from '../components/SessionCard';
import { useAuth } from '../context/AuthContext';
import { Calendar as CalendarIcon, Plus, X, Download, List as ListIcon, ChevronLeft, ChevronRight, Clock, MapPin, Video, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import RatingModal from '../components/RatingModal';
import { Container, Typography, Box, Button, Tabs, Tab, Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, FormControlLabel, Switch, CircularProgress, useTheme, ToggleButton, ToggleButtonGroup, Card, CardContent, Chip, Avatar } from '@mui/material';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isPast } from 'date-fns';

const defaultForm = { title: '', description: '', subject: '', scheduledAt: '', duration: 60, isOnline: true, meetingLink: '', location: '', maxParticipants: 5 };

export default function Sessions() {
  const { user } = useAuth();
  const theme = useTheme();
  const [sessions, setSessions] = useState([]);
  const [mySessions, setMySessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [creating, setCreating] = useState(false);
  const [ratingSession, setRatingSession] = useState(null);

  // Calendar State
  const [viewMode, setViewMode] = useState('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarSessionObj, setCalendarSessionObj] = useState(null);

  const fetchSessions = async () => {
    try {
      const [allRes, myRes] = await Promise.all([api.get('/sessions'), api.get('/sessions/my')]);
      setSessions(allRes.data);
      setMySessions(myRes.data);
    } catch { toast.error('Failed to load sessions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/sessions', form);
      toast.success('Session created!');
      setShowForm(false);
      setForm(defaultForm);
      fetchSessions();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCreating(false); }
  };

  const handleJoin = async (id) => {
    try { await api.post(`/sessions/${id}/join`); toast.success('Joined!'); fetchSessions(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleLeave = async (id) => {
    try { 
      const sessionToRate = [...sessions, ...mySessions].find(s => s._id === id);
      await api.post(`/sessions/${id}/leave`); 
      toast.success('Left session');
      fetchSessions();
      if (sessionToRate) setRatingSession(sessionToRate);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this session?')) return;
    try { await api.delete(`/sessions/${id}`); toast.success('Session deleted'); fetchSessions(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/calendar/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'study-sessions.ics');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Calendar exported successfully!');
    } catch(err) {
      toast.error('Failed to export calendar');
    }
  };

  const displaySessions = tabIndex === 0 ? sessions : mySessions;

  // Calendar Engine
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, mb: 10 }}>
      {ratingSession && <RatingModal session={ratingSession} onClose={() => setRatingSession(null)} />}
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 4 }}>
        <Typography variant="h4" fontWeight={800} color="text.primary">
          Study Sessions
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            size="small"
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, p: 0.5,
              '& .MuiToggleButton-root': { border: 'none', borderRadius: 1.5, color: 'text.secondary', px: 2 }, 
              '& .Mui-selected': { bgcolor: '#6366f1 !important', color: 'white !important' } 
            }}
          >
            <ToggleButton value="list"><ListIcon size={18} /></ToggleButton>
            <ToggleButton value="calendar"><CalendarIcon size={18} /></ToggleButton>
          </ToggleButtonGroup>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<Download size={18} />} 
            onClick={handleExport}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Export ICS
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Plus size={18} />} 
            onClick={() => setShowForm(true)}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Create Session
          </Button>
        </Box>
      </Box>

      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, pb: 1 }}>
          Create Study Session
          <IconButton onClick={() => setShowForm(false)} size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="create-session-form" onSubmit={handleCreate} sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField 
              label="Session Title" required fullWidth value={form.title} 
              onChange={e => setForm({ ...form, title: e.target.value })} variant="outlined" size="small" 
            />
            <TextField 
              label="Subject" required fullWidth value={form.subject} 
              onChange={e => setForm({ ...form, subject: e.target.value })} variant="outlined" size="small" 
            />
            <TextField 
              label="Description" fullWidth multiline rows={3} value={form.description} 
              onChange={e => setForm({ ...form, description: e.target.value })} variant="outlined" 
            />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="Date & Time" type="datetime-local" required fullWidth value={form.scheduledAt} 
                  onChange={e => setForm({ ...form, scheduledAt: e.target.value })} 
                  variant="outlined" size="small" InputLabelProps={{ shrink: true }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="Duration (min)" type="number" required fullWidth value={form.duration} 
                  onChange={e => setForm({ ...form, duration: +e.target.value })} 
                  variant="outlined" size="small" inputProps={{ min: 15, max: 480 }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="Max Participants" type="number" required fullWidth value={form.maxParticipants} 
                  onChange={e => setForm({ ...form, maxParticipants: +e.target.value })} 
                  variant="outlined" size="small" inputProps={{ min: 2, max: 50 }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel 
                  control={<Switch checked={form.isOnline} onChange={e => setForm({ ...form, isOnline: e.target.checked })} color="primary" />} 
                  label={<Typography variant="body2" fontWeight={600}>Online Session</Typography>} 
                  sx={{ mt: 0.5, ml: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel 
                  control={<Switch checked={form.recurrence === 'WEEKLY'} onChange={e => setForm({ ...form, recurrence: e.target.checked ? 'WEEKLY' : 'NONE' })} color="secondary" />} 
                  label={<Typography variant="body2" fontWeight={600}>Repeat Weekly (4 Weeks)</Typography>} 
                  sx={{ mt: 0.5, ml: 1 }}
                />
              </Grid>
            </Grid>
            
            {form.isOnline ? (
              <TextField 
                label="Meeting Link (optional)" fullWidth value={form.meetingLink} 
                onChange={e => setForm({ ...form, meetingLink: e.target.value })} variant="outlined" size="small" 
              />
            ) : (
              <TextField 
                label="Location" fullWidth required={!form.isOnline} value={form.location} 
                onChange={e => setForm({ ...form, location: e.target.value })} variant="outlined" size="small" 
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
          <Button onClick={() => setShowForm(false)} variant="outlined" sx={{ fontWeight: 700, borderRadius: 2 }}>
            Cancel
          </Button>
          <Button type="submit" form="create-session-form" variant="contained" disabled={creating} sx={{ fontWeight: 700, borderRadius: 2 }}>
            {creating ? 'Creating...' : 'Create Session'}
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} aria-label="session tabs" sx={{ '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: '1rem' } }}>
          <Tab label="All Sessions" />
          <Tab label="My Sessions" />
        </Tabs>
      </Box>

      {/* Calendar Specific Action Modal */}
      <Dialog open={!!calendarSessionObj} onClose={() => setCalendarSessionObj(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, bgcolor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' } }}>
        {calendarSessionObj && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, pb: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              Session Details
              <IconButton onClick={() => setCalendarSessionObj(null)} size="small" sx={{ color: 'rgba(255,255,255,0.5)' }}><X size={20} /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Typography variant="h5" fontWeight={900} color="white" mb={1}>{calendarSessionObj.title}</Typography>
              <Chip label={calendarSessionObj.subject} size="small" sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', fontWeight: 800, mb: 3 }} />
              
              <Box display="flex" flexDirection="column" gap={2} mb={3}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={16} color="#94a3b8" /></Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>Time & Duration</Typography>
                    <Typography variant="body1" color="white" fontWeight={700}>{format(parseISO(calendarSessionObj.scheduledAt), 'MMM d, yyyy - h:mm a')}</Typography>
                    <Typography variant="caption" color="#818cf8" fontWeight={700}>{calendarSessionObj.duration} Minutes</Typography>
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {calendarSessionObj.isOnline ? <Video size={16} color="#94a3b8" /> : <MapPin size={16} color="#94a3b8" />}
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>Location</Typography>
                    <Typography variant="body1" color="white" fontWeight={700} sx={{ wordBreak: 'break-all' }}>
                      {calendarSessionObj.isOnline ? (calendarSessionObj.meetingLink ? <a href={calendarSessionObj.meetingLink} target="_blank" rel="noreferrer" style={{ color: '#818cf8' }}>{calendarSessionObj.meetingLink}</a> : 'Online Link Pending') : calendarSessionObj.location}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={16} color="#94a3b8" /></Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>Participants</Typography>
                    <Typography variant="body1" color="white" fontWeight={700}>{calendarSessionObj.participants?.length || 0} / {calendarSessionObj.maxParticipants} Joined</Typography>
                  </Box>
                </Box>
              </Box>

              {calendarSessionObj.description && (
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, mb: 2 }}>
                  <Typography variant="body2" color="rgba(255,255,255,0.7)">{calendarSessionObj.description}</Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
              {calendarSessionObj.participants?.some(p => p._id === user?._id || p === user?._id) ? (
                <Button fullWidth variant="outlined" color="error" onClick={() => { handleLeave(calendarSessionObj._id); setCalendarSessionObj(null); }} sx={{ borderRadius: 2, fontWeight: 800 }}>Leave Session</Button>
              ) : calendarSessionObj.host?._id === user?._id ? (
                <Button fullWidth variant="outlined" color="error" onClick={() => { handleDelete(calendarSessionObj._id); setCalendarSessionObj(null); }} sx={{ borderRadius: 2, fontWeight: 800 }}>Cancel Session</Button>
              ) : (
                <Button fullWidth variant="contained" onClick={() => { handleJoin(calendarSessionObj._id); setCalendarSessionObj(null); }} sx={{ bgcolor: '#6366f1', color: 'white', borderRadius: 2, fontWeight: 800, '&:hover': { bgcolor: '#4f46e5' } }}>Join Session</Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {displaySessions.length === 0 && viewMode === 'list' ? (
        <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
          <CalendarIcon size={64} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <Typography variant="h6" fontWeight={700} color="text.primary">
            No sessions found
          </Typography>
          <Typography variant="body2" mt={1}>
            Create a session to get started
          </Typography>
        </Box>
      ) : viewMode === 'list' ? (
        <Grid container spacing={3}>
          {displaySessions.map(s => (
            <Grid item xs={12} md={6} lg={4} key={s._id}>
              <SessionCard session={s} currentUserId={user?._id} onJoin={handleJoin} onLeave={handleLeave} onDelete={handleDelete} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          {/* Calendar Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h5" fontWeight={900} color="text.primary">
              {format(currentMonth, 'MMMM yyyy')}
            </Typography>
            <Box display="flex" gap={1}>
              <IconButton onClick={prevMonth} sx={{ border: '1px solid', borderColor: 'divider' }}><ChevronLeft size={20} /></IconButton>
              <IconButton onClick={nextMonth} sx={{ border: '1px solid', borderColor: 'divider' }}><ChevronRight size={20} /></IconButton>
            </Box>
          </Box>
          
          {/* Calendar Grid Header */}
          <Grid container sx={{ bgcolor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid', borderColor: 'divider' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Grid item xs={12/7} key={day} sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={1}>{day}</Typography>
              </Grid>
            ))}
          </Grid>

          {/* Calendar Grid Body */}
          <Grid container sx={{ '& .MuiGrid-item': { borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider' } }}>
            {calendarDays.map((day, idx) => {
              const dateEvents = displaySessions.filter(s => isSameDay(parseISO(s.scheduledAt), day));
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentMonth);
              
              return (
                <Grid item xs={12/7} key={day.toString()} sx={{ minHeight: 140, p: 1, bgcolor: isCurrentMonth ? 'transparent' : 'rgba(255,255,255,0.01)', opacity: isCurrentMonth ? 1 : 0.4, transition: 'all 0.2s', '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                  <Box display="flex" justifyContent="flex-end" mb={1}>
                    <Box sx={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isToday ? 'primary.main' : 'transparent', color: isToday ? 'white' : 'text.primary', fontWeight: isToday ? 800 : 600 }}>
                      {format(day, 'd')}
                    </Box>
                  </Box>
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    {dateEvents.slice(0, 3).map(event => (
                      <Box 
                        key={event._id} 
                        onClick={() => setCalendarSessionObj(event)}
                        sx={{ 
                          p: 0.75, borderRadius: 1.5, cursor: 'pointer',
                          bgcolor: event.isOnline ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          borderLeft: '3px solid', borderColor: event.isOnline ? '#6366f1' : '#10b981',
                          '&:hover': { bgcolor: event.isOnline ? 'rgba(99, 102, 241, 0.25)' : 'rgba(16, 185, 129, 0.25)' }
                        }}
                      >
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
                          {format(parseISO(event.scheduledAt), 'h:mm a')}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
                          {event.title}
                        </Typography>
                      </Box>
                    ))}
                    {dateEvents.length > 3 && (
                      <Typography variant="caption" color="text.secondary" fontWeight={700} textAlign="center" mt={0.5}>
                        +{dateEvents.length - 3} more
                      </Typography>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
    </Container>
  );
}
