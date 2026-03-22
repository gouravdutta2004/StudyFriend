import { User, MapPin, GraduationCap, BookOpen, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, Box, Avatar, Typography, Chip, useTheme, CardActionArea } from '@mui/material';
import UserQuickPeek from './UserQuickPeek';

export default function UserCard({ user, actions }) {
  const theme = useTheme();

  return (
    <Card variant="outlined" sx={{ 
      borderRadius: 4, 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      transition: 'box-shadow 0.2s',
      '&:hover': {
        boxShadow: theme.shadows[4]
      }
    }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1 }}>
        <UserQuickPeek userId={user._id}>
          <Avatar 
            src={user.avatar || undefined} 
            sx={{ 
              width: 56, 
              height: 56, 
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)', 
              color: 'primary.main',
              borderRadius: 3
            }}
          >
            {!user.avatar && <User size={28} />}
          </Avatar>
        </UserQuickPeek>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography 
              component={Link} 
              to={`/user/${user._id}`} 
              variant="subtitle1" 
              fontWeight={800} 
              color="text.primary" 
              sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
            >
              {user.name}
            </Typography>
            {user.matchScore > 0 && (
              <Chip 
                icon={<Sparkles size={12} />} 
                label={`Score: ${user.matchScore}`} 
                size="small" 
                color="success" 
                variant={theme.palette.mode === 'dark' ? 'outlined' : 'filled'}
                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }} 
              />
            )}
          </Box>
          
          {user.university && (
            <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={0.5} mt={0.5}>
              <GraduationCap size={14} /> {user.university}
            </Typography>
          )}
          {user.location && (
            <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={0.5} mt={0.5}>
              <MapPin size={14} /> {user.location}
            </Typography>
          )}
          {user.bio && (
            <Typography variant="body2" color="text.secondary" mt={1.5} sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {user.bio}
            </Typography>
          )}
          
          {user.subjects?.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {user.subjects.slice(0, 4).map(s => (
                <Chip 
                  key={s} 
                  icon={<BookOpen size={12} />} 
                  label={s} 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                  sx={{ borderRadius: 1.5, fontWeight: 600 }} 
                />
              ))}
              {user.subjects.length > 4 && (
                <Chip label={`+${user.subjects.length - 4}`} size="small" variant="filled" sx={{ borderRadius: 1.5, fontWeight: 700 }} />
              )}
            </Box>
          )}
        </Box>
      </Box>
      
      {actions && (
        <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
          {actions}
        </Box>
      )}
    </Card>
  );
}
