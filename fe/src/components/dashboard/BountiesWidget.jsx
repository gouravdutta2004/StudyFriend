import React, { useState, useEffect } from 'react';
import { Box, Typography, Checkbox, LinearProgress, Skeleton, useTheme } from '@mui/material';
import { Target, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function BountiesWidget() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/gamification/quests')
      .then(res => setQuests(res.data || []))
      .catch(() => toast.error('Could not load quests'))
      .finally(() => setLoading(false));
  }, []);

  const toggleQuest = async (id, isDone) => {
    if (isDone) return; // already completed
    try {
      await api.put(`/gamification/quests/${id}`);
      setQuests(prev => prev.map(q => q._id === id ? { ...q, isCompleted: true } : q));
      toast.success('Quest completed! +XP earned 🎯', { icon: '✅' });
    } catch {
      toast.error('Failed to complete quest');
    }
  };

  const completedCount = quests.filter(q => q.isCompleted).length;
  const progress = quests.length > 0 ? (completedCount / quests.length) * 100 : 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" fontWeight={900} color={isDark ? "white" : "#0F172A"} display="flex" alignItems="center" gap={1.5}>
          <Target size={20} color="#22D3EE" /> Daily Quests
        </Typography>
        {!loading && (
          <Typography variant="caption" fontWeight={800} color="#22D3EE">{completedCount}/{quests.length} Done</Typography>
        )}
      </Box>

      <Box sx={{ mb: 4 }}>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)', '& .MuiLinearProgress-bar': { backgroundColor: '#22D3EE', borderRadius: 3, boxShadow: '0 0 10px rgba(34,211,238,0.5)' } }} />
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)', borderRadius: '4px' } }}>
        {loading ? (
          [1, 2, 3].map(i => (
            <Skeleton key={i} variant="rectangular" height={56} sx={{ borderRadius: '16px', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
          ))
        ) : quests.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
            <Target size={32} style={{ opacity: 0.2, margin: '0 auto 8px' }} />
            <Typography fontWeight={700} fontSize="0.85rem">No quests available</Typography>
            <Typography variant="caption">Check back tomorrow!</Typography>
          </Box>
        ) : (
          <AnimatePresence>
            {quests.map(quest => (
              <motion.div key={quest._id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
                <Box sx={{
                  p: 2, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: 2,
                  bgcolor: quest.isCompleted ? 'rgba(34,211,238,0.05)' : (isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)'),
                  border: '1px solid', borderColor: quest.isCompleted ? 'rgba(34,211,238,0.2)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                  transition: 'all 0.2s ease',
                  cursor: quest.isCompleted ? 'default' : 'pointer',
                  '&:hover': quest.isCompleted ? {} : { borderColor: 'rgba(34,211,238,0.4)', bgcolor: 'rgba(34,211,238,0.02)' }
                }}
                  onClick={() => toggleQuest(quest._id, quest.isCompleted)}
                >
                  <Checkbox
                    checked={quest.isCompleted}
                    readOnly
                    sx={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.3)', '&.Mui-checked': { color: '#22D3EE' }, pointerEvents: 'none' }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={800}
                      color={quest.isCompleted ? (isDark ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.5)") : (isDark ? "white" : "#0F172A")}
                      sx={{ textDecoration: quest.isCompleted ? 'line-through' : 'none' }}>
                      {quest.task}
                    </Typography>
                    <Typography variant="caption" fontWeight={700} color={quest.isCompleted ? "rgba(34,211,238,0.5)" : "#22D3EE"} display="flex" alignItems="center" gap={0.5}>
                      <Trophy size={12} /> +{quest.xpReward || 50} XP
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </Box>
    </Box>
  );
}

