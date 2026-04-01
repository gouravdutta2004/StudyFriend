import { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Tooltip, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio } from 'lucide-react';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function LiveCampusDock() {
  const [peers, setPeers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // 1. Initial Load from REST
  useEffect(() => {
    if (!user?.organization) {
      setLoading(false);
      return;
    }

    const fetchPeers = async () => {
      try {
        const { data } = await api.get('/campus/peers');
        setPeers(data);
      } catch (err) {
        console.error('Failed to load campus peers', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPeers();
  }, [user]);

  // 2. Real-Time WebSockets Sync
  useEffect(() => {
    if (!socket || !user?.organization) return;

    // Join Walled Garden Room
    socket.emit('join_campus', { userId: user._id, organizationId: user.organization });

    // Listen to real-time status pulses
    const handleStatusChange = ({ userId, status }) => {
      setPeers(prev => {
        const updated = prev.map(p => p._id === userId ? { ...p, isOnline: status === 'online' } : p);
        // Resort to float online users to the top dynamically
        return updated.sort((a, b) => b.isOnline - a.isOnline);
      });
    };

    socket.on('user_status_change', handleStatusChange);

    return () => {
      socket.off('user_status_change', handleStatusChange);
    };
  }, [socket, user]);

  if (!user?.organization) {
    // Global Users don't get the Campus Dock
    return null;
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={900} color={isDark ? "white" : "#0f172a"} display="flex" alignItems="center" gap={1.5}>
          <Radio size={20} color="#10b981" /> Live Campus Dock
        </Typography>
        <Typography variant="caption" fontWeight={800} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}>
          {peers.filter(p => p.isOnline).length} ONLINE
        </Typography>
      </Box>

      {loading ? (
        <Typography variant="caption" color="text.secondary">Scanning campus frequencies...</Typography>
      ) : peers.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="caption" color="text.secondary">No peers in your organization yet.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 300, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: '4px' } }}>
          <AnimatePresence>
            {peers.map(peer => (
              <motion.div key={peer._id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <Box component={Link} to={`/user/${peer._id}`} sx={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: '16px', transition: 'background 0.2s', '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' } }}>
                  
                  {/* Avatar with Status Indicator */}
                  <Box sx={{ position: 'relative' }}>
                    <Avatar src={peer.avatar} sx={{ width: 44, height: 44, bgcolor: peer.isOnline ? '#10b981' : '#64748b', fontWeight: 900, fontSize: '1rem' }}>
                      {peer.name?.[0] || 'U'}
                    </Avatar>
                    
                    {/* The glowing/hollow dot */}
                    <Box sx={{
                      position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: '50%',
                      bgcolor: peer.isOnline ? '#10b981' : isDark ? '#1e293b' : 'white',
                      border: peer.isOnline ? '2px solid transparent' : isDark ? '2px solid #64748b' : '2px solid #cbd5e1',
                      boxShadow: peer.isOnline ? '0 0 8px rgba(16, 185, 129, 0.8), inset 0 0 0 2px rgba(255,255,255,0.2)' : 'none',
                      transition: 'all 0.3s ease'
                    }} />
                  </Box>

                  <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    <Typography variant="body2" fontWeight={800} color={isDark ? "white" : "#0f172a"} noWrap>{peer.name}</Typography>
                    <Typography variant="caption" color={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} fontWeight={600} noWrap>
                      {peer.isOnline ? 'Online now' : 'Offline'}
                    </Typography>
                  </Box>
                  
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      )}
    </Box>
  );
}
