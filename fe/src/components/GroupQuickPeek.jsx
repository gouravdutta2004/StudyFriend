import { useState } from 'react';
import { Box, Typography, Avatar, AvatarGroup, Tooltip, CircularProgress, Button, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { Users, Clock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useTheme as useCustomTheme } from '../context/ThemeContext';

export default function GroupQuickPeek({ groupId, children, placement = "top" }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { theme } = useCustomTheme();
  const muiTheme = useTheme();
  const navigate = useNavigate();
  
  const handleOpen = () => {
    if (!data && !loading && groupId) {
      setLoading(true);
      api.get(`/groups/${groupId}/quick-peek`)
         .then(res => { setData(res.data); })
         .catch(err => { console.error(err); })
         .finally(() => { setLoading(false); });
    }
  };

  const handleQuickJoin = (e) => {
    e.stopPropagation();
    navigate(`/study-room/${groupId}`);
  };

  const Content = () => {
    if (loading || !data) {
      return (
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: 200 }}>
          {loading ? <CircularProgress size={24} color="inherit" /> : <Typography variant="caption">Hover again...</Typography>}
        </Box>
      );
    }

    return (
      <Box sx={{ p: 2, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Header: Name and Subject */}
        <Box>
          <Typography variant="body1" fontWeight={800} color={theme === 'dark' ? '#f8fafc' : '#0f172a'}>
            {data.name}
          </Typography>
          <Typography variant="caption" fontWeight={600} color="primary.main" display="block">
            {data.subject}
          </Typography>
        </Box>
        
        {/* Analytics Row */}
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box>
             <Typography variant="caption" fontWeight={800} color="text.secondary" display="flex" alignItems="center" gap={0.5} mb={0.5}>
               <Users size={12} /> Capacity
             </Typography>
             <Typography variant="body2" fontWeight={700}>
               {data.memberCount} / {data.maxMembers}
             </Typography>
          </Box>
          {data.nextSession && (
             <Box>
               <Typography variant="caption" fontWeight={800} color="text.secondary" display="flex" alignItems="center" gap={0.5} mb={0.5}>
                 <Clock size={12} /> Next Session
               </Typography>
               <Typography variant="body2" fontWeight={700} color="warning.main">
                 {new Date(data.nextSession).toLocaleDateString()}
               </Typography>
             </Box>
          )}
        </Box>
        
        {/* Members Avatar Group */}
        {data.members && data.members.length > 0 && (
          <Box sx={{ bgcolor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', p: 1.5, borderRadius: 2 }}>
             <Typography variant="caption" fontWeight={800} color="text.secondary" mb={1} display="block">Active Network</Typography>
             <AvatarGroup max={5} sx={{ justifyContent: 'flex-start', '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.75rem', borderColor: theme === 'dark' ? '#1e293b' : '#fff' } }}>
               {data.members.map(m => (
                 <Avatar key={m._id} src={m.avatar} alt={m.name}>{m.name?.[0]}</Avatar>
               ))}
             </AvatarGroup>
          </Box>
        )}
        
        {/* Quick Join Button */}
        <Button 
          fullWidth 
          variant="contained" 
          startIcon={<Zap size={16} />}
          onClick={handleQuickJoin}
          sx={{ 
            fontWeight: 800, 
            borderRadius: 2, 
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.39)',
            textTransform: 'none',
            '&&:hover': {
               boxShadow: '0 6px 20px rgba(139, 92, 246, 0.5)',
            }
          }}
        >
          Quick Join Room
        </Button>
      </Box>
    );
  };

  return (
    <Tooltip
      placement={placement}
      onOpen={handleOpen}
      interactive
      enterDelay={400}
      leaveDelay={200}
      componentsProps={{
        tooltip: {
          sx: {
            p: 0,
            bgcolor: theme === 'dark' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid',
            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            boxShadow: theme === 'dark' ? '0 10px 40px rgba(0,0,0,0.6)' : '0 10px 40px rgba(149,157,165,0.4)',
            borderRadius: 4,
            color: 'inherit'
          }
        }
      }}
      title={
        <motion.div
           initial={{ opacity: 0, y: 5 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.2 }}
        >
           <Content />
        </motion.div>
      }
    >
      <Box component="span" sx={{ display: 'inline-flex', cursor: 'pointer', width: '100%' }}>
        {children}
      </Box>
    </Tooltip>
  );
}
