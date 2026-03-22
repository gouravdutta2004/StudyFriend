import { Calendar, Clock, Users, Video, MapPin, Trash2, LogIn, LogOut, ExternalLink, CalendarPlus } from 'lucide-react';
import { format, addMinutes } from 'date-fns';
import { Link } from 'react-router-dom';
import { Card, Box, Typography, Chip, Button, IconButton, useTheme, CardActions, CardContent, Tooltip } from '@mui/material';

export default function SessionCard({ session, currentUserId, onJoin, onLeave, onDelete }) {
  const theme = useTheme();
  const isHost = session.host?._id === currentUserId || session.host === currentUserId;
  const isParticipant = session.participants?.some(p => (p._id || p) === currentUserId);
  const isFull = session.participants?.length >= session.maxParticipants;

  const getCalendarUrl = () => {
    const start = new Date(session.scheduledAt);
    const end = addMinutes(start, session.duration || 60);
    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', session.title || 'Study Buddy Session');
    url.searchParams.append('dates', `${formatDate(start)}/${formatDate(end)}`);
    url.searchParams.append('details', session.description || 'Study session with connections');
    url.searchParams.append('location', session.isOnline ? (session.meetingLink || 'Online') : session.location);
    return url.toString();
  };

  return (
    <Card variant="outlined" sx={{ 
      borderRadius: 4, 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      transition: 'box-shadow 0.2s, transform 0.2s',
      '&:hover': {
        boxShadow: theme.shadows[4],
        transform: 'translateY(-2px)'
      }
    }}>
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.3, mb: 1 }}>
              {session.title}
            </Typography>
            <Chip 
              label={session.subject} 
              size="small" 
              color="primary" 
              variant="outlined" 
              sx={{ fontWeight: 700, borderRadius: 1.5 }} 
            />
          </Box>
          <Chip 
            label={session.status} 
            size="small" 
            color={session.status === 'upcoming' ? 'success' : 'default'}
            sx={{ fontWeight: 700, borderRadius: 1.5, textTransform: 'capitalize' }}
          />
        </Box>

        {session.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {session.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 3 }}>
          <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={1}>
            <Calendar size={16} color={theme.palette.text.disabled} /> {format(new Date(session.scheduledAt), 'PPP')}
          </Typography>
          <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={1}>
            <Clock size={16} color={theme.palette.text.disabled} /> {format(new Date(session.scheduledAt), 'p')} · {session.duration} min
          </Typography>
          <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={1}>
            <Users size={16} color={theme.palette.text.disabled} /> {session.participants?.length}/{session.maxParticipants} participants
          </Typography>
          <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={1}>
            {session.isOnline 
              ? <><Video size={16} color={theme.palette.info.main} /> Online</> 
              : <><MapPin size={16} color={theme.palette.error.main} /> {session.location}</>
            }
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0, gap: 1, flexWrap: 'wrap' }}>
        {!isHost && !isParticipant && !isFull && (
          <Button 
            variant="contained" 
            size="small" 
            onClick={() => onJoin(session._id)} 
            startIcon={<LogIn size={16} />}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Join
          </Button>
        )}
        {!isHost && isParticipant && (
          <Button 
            variant="outlined" 
            color="secondary" 
            size="small" 
            onClick={() => onLeave(session._id)} 
            startIcon={<LogOut size={16} />}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Leave
          </Button>
        )}
        {(isHost || isParticipant) && session.isOnline && (
          <Button 
            component={Link} 
            to={`/study-room/${session._id}`} 
            variant="contained" 
            color="success" 
            size="small" 
            startIcon={<ExternalLink size={16} />}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Enter Room
          </Button>
        )}
        {(isHost || isParticipant) && session.status === 'upcoming' && (
          <Button 
            component="a" 
            href={getCalendarUrl()} 
            target="_blank" 
            rel="noreferrer" 
            variant="contained" 
            color="info" 
            size="small" 
            startIcon={<CalendarPlus size={16} />}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Calendar
          </Button>
        )}
        {isHost && (
          <Tooltip title="Delete Session">
            <IconButton onClick={() => onDelete(session._id)} color="error" size="small" sx={{ ml: 'auto' }}>
              <Trash2 size={20} />
            </IconButton>
          </Tooltip>
        )}
        {isFull && !isParticipant && (
          <Typography variant="body2" color="text.disabled" fontWeight={600} sx={{ ml: 'auto', py: 0.5 }}>
            Session Full
          </Typography>
        )}
      </CardActions>
    </Card>
  );
}
