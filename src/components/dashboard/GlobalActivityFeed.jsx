import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Avatar, useTheme } from '@mui/material';
import { Activity } from 'lucide-react';
import api from '../../api/axios';

export default function GlobalActivityFeed() {
  const theme = useTheme();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/activity/global');
        setLogs(res.data);
      } catch (err) {}
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ p: 4, display: 'flex', flex: 1, flexDirection: 'column', height: '100%' }}>
      <Typography variant="h6" fontWeight={900} display="flex" alignItems="center" gap={1.5} mb={3}>
        <Activity size={20} color="#8b5cf6" /> Live Community Link
      </Typography>
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 1.5, 
        pr: 1,
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }
      }}>
        {logs.map(log => (
          <Box key={log._id} sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            p: 2, 
            borderRadius: '20px', 
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', 
            border: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
            '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderColor: 'rgba(139, 92, 246, 0.3)' }
          }}>
            <Avatar src={log.userId?.avatar} sx={{ width: 40, height: 40, bgcolor: '#8b5cf6', fontWeight: 900 }}>
               {log.userId?.name?.[0] || 'U'}
            </Avatar>
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <Typography variant="body2" fontWeight={800} color="inherit" noWrap>{log.description}</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>{new Date(log.createdAt).toLocaleTimeString()}</Typography>
            </Box>
          </Box>
        ))}
        {logs.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4, opacity: 0.5 }}>
            <Typography variant="caption" fontWeight={700}>No recent activity detected.</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
