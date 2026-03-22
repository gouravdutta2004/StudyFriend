import { useState } from 'react';
import { Box, Typography, Avatar, Chip, Tooltip, CircularProgress, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { Star, BookOpen, Activity } from 'lucide-react';
import api from '../api/axios';
import { useTheme as useCustomTheme } from '../context/ThemeContext';

export default function UserQuickPeek({ userId, children, placement = "top" }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { theme } = useCustomTheme();
  const muiTheme = useTheme();

  const handleOpen = () => {
    if (!data && !loading && userId) {
      setLoading(true);
      api.get(`/users/${userId}/quick-peek`)
         .then(res => { setData(res.data); })
         .catch(err => { console.error(err); })
         .finally(() => { setLoading(false); });
    }
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
      <Box sx={{ p: 2, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* Header: Avatar, Name & Online Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ position: 'relative' }}>
             <Avatar src={data.avatar} sx={{ width: 48, height: 48, border: '2px solid', borderColor: data.isOnline ? '#22c55e' : 'divider' }}>
               {data.name?.[0]}
             </Avatar>
             <Box sx={{ 
               position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: '50%',
               bgcolor: data.isOnline ? '#22c55e' : '#94a3b8', border: '2px solid', borderColor: theme === 'dark' ? '#1e293b' : '#fff'
             }} />
          </Box>
          <Box>
            <Typography variant="body1" fontWeight={800} color={theme === 'dark' ? '#f8fafc' : '#0f172a'}>
              {data.name}
            </Typography>
            <Typography variant="caption" fontWeight={600} color={theme === 'dark' ? '#94a3b8' : '#64748b'} display="flex" alignItems="center" gap={0.5}>
              <Activity size={12} /> {data.isOnline ? 'Online Now' : 'Offline'}
            </Typography>
          </Box>
        </Box>
        
        {/* Stats Row */}
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
           <Typography variant="caption" fontWeight={700} display="flex" alignItems="center" gap={0.5} color={muiTheme.palette.warning.main}>
             <Star size={14} fill={muiTheme.palette.warning.main} /> {data.avgRating}
           </Typography>
           <Typography variant="caption" fontWeight={700} color="primary.main">
             Level {data.level}
           </Typography>
           {!data.isActive && (
              <Chip size="small" label="Banned" color="error" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800 }} />
           )}
        </Box>
        
        {/* Mutual Subjects */}
        {data.mutualSubjects && data.mutualSubjects.length > 0 && (
          <Box sx={{ mt: 1, p: 1.5, borderRadius: 2, bgcolor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
            <Typography variant="caption" fontWeight={800} color="text.secondary" display="flex" alignItems="center" gap={0.5} mb={1}>
              <BookOpen size={12} /> Mutual Subjects
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {data.mutualSubjects.map((s, idx) => (
                <Chip key={idx} size="small" label={s} sx={{ fontSize: '0.65rem', height: 20, bgcolor: 'primary.main', color: '#fff', fontWeight: 600 }} />
              ))}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Tooltip
      placement={placement}
      onOpen={handleOpen}
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
            boxShadow: theme === 'dark' ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(149,157,165,0.3)',
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
      <Box component="span" sx={{ display: 'inline-flex', cursor: 'pointer' }}>
        {children}
      </Box>
    </Tooltip>
  );
}
