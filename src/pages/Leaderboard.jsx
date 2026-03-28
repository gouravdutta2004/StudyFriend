import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Trophy, Medal, Flame, Star, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Container, Typography, Box, CircularProgress, Paper, List, ListItem, ListItemAvatar, Avatar, Chip, useTheme, Divider, Tooltip } from '@mui/material';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    api.get('/users/leaderboard')
      .then(res => setLeaders(res.data))
      .catch((err) => toast.error('Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Box sx={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          p: 3, 
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)', 
          borderRadius: '50%', 
          mb: 3,
          boxShadow: theme.shadows[2]
        }}>
          <Trophy size={56} color="#8b5cf6" />
        </Box>
        <Typography variant="h3" fontWeight={900} color="text.primary" gutterBottom>
          Global Matrix Rankings
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Ranked by total XP. Complete Quests and focus sessions to climb the ranks!
        </Typography>
      </Box>

      <Paper elevation={theme.palette.mode === 'dark' ? 4 : 2} sx={{ borderRadius: 4, overflow: 'hidden', border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
        <List disablePadding>
          {leaders.map((leader, idx) => {
            const isMe = user?._id === leader._id;
            let rankBadge = null;
            if (idx === 0) rankBadge = <Medal size={32} color="#eab308" />;
            else if (idx === 1) rankBadge = <Medal size={28} color="#9ca3af" />;
            else if (idx === 2) rankBadge = <Medal size={28} color="#d97706" />;
            else rankBadge = <Typography variant="h6" fontWeight={800} color="text.secondary" sx={{ width: 28, textAlign: 'center' }}>{idx + 1}</Typography>;

            return (
              <React.Fragment key={leader._id}>
                {idx > 0 && <Divider component="li" />}
                <ListItem 
                  sx={{ 
                    p: 3, 
                    transition: 'background-color 0.2s',
                    bgcolor: isMe ? (theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)') : 'transparent',
                    '&:hover': {
                      bgcolor: isMe ? undefined : 'action.hover'
                    }
                  }}
                >
                  <Box sx={{ mr: 3, display: 'flex', justifyContent: 'center', width: 40, flexShrink: 0 }}>
                    {rankBadge}
                  </Box>

                  <ListItemAvatar sx={{ mr: 2 }}>
                    <Avatar 
                      src={leader.avatar || undefined} 
                      sx={{ 
                        width: 56, 
                        height: 56, 
                        border: idx === 0 ? '3px solid #eab308' : 'none',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
                        color: '#8b5cf6',
                        fontSize: '1.5rem',
                        fontWeight: 700
                      }}
                    >
                      {!leader.avatar && leader.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', pr: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                      <Typography variant="h6" fontWeight={800} color="text.primary" noWrap>
                        {leader.name}
                      </Typography>
                      {isMe && (
                        <Chip label="You" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#8b5cf6', color: 'white' }} />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                      <Chip 
                        size="small" 
                        label={`LVL ${leader.level || 1}`} 
                        sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800, bgcolor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }} 
                      />
                      {leader.badges && leader.badges.slice(-2).map((b, i) => (
                         <Tooltip key={i} title={b}>
                           <Chip size="small" icon={<Star size={10} />} label={b.split(' ')[0]} sx={{ height: 20, fontSize: '0.65rem' }} />
                         </Tooltip>
                      ))}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 4 }, ml: 'auto', flexShrink: 0 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Typography variant="subtitle1" fontWeight={800} sx={{ color: theme.palette.mode === 'dark' ? '#fb923c' : '#f97316', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Flame size={18} /> {leader.streak || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 600 }}>
                        Day Streak
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Typography variant="subtitle1" fontWeight={900} color="#8b5cf6" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Target size={16} /> {(leader.xp || 0).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 600 }}>
                        Total XP
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
              </React.Fragment>
            );
          })}
          {leaders.length === 0 && (
            <ListItem sx={{ py: 8, justifyContent: 'center' }}>
              <Typography variant="body1" color="text.secondary" fontStyle="italic">
                No active players in the matrix yet.
              </Typography>
            </ListItem>
          )}
        </List>
      </Paper>
    </Container>
  );
}
