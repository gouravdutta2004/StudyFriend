import React, { useState } from 'react';
import { Box, Typography, Checkbox, LinearProgress, useTheme } from '@mui/material';
import { Target, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const initialQuests = [
  { id: 1, text: "Compile React Components", xp: 50, completed: false, type: "Daily" },
  { id: 2, text: "Focus Session (45m)", xp: 30, completed: true, type: "Daily" },
  { id: 3, text: "Review Pull Requests", xp: 75, completed: false, type: "Weekly" },
];

export default function BountiesWidget() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [quests, setQuests] = useState(initialQuests);

  const toggleQuest = (id) => {
    setQuests(quests.map(q => q.id === id ? { ...q, completed: !q.completed } : q));
  };

  const completedCount = quests.filter(q => q.completed).length;
  const progress = (completedCount / quests.length) * 100;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" fontWeight={900} color={isDark ? "white" : "#0F172A"} display="flex" alignItems="center" gap={1.5}>
          <Target size={20} color="#22D3EE" /> Daily Quests
        </Typography>
        <Typography variant="caption" fontWeight={800} color="#22D3EE">{completedCount}/{quests.length} Done</Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)', '& .MuiLinearProgress-bar': { backgroundColor: '#22D3EE', borderRadius: 3, boxShadow: '0 0 10px rgba(34,211,238,0.5)' } }} />
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)', borderRadius: '4px' } }}>
        <AnimatePresence>
          {quests.map(quest => (
            <motion.div key={quest.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
              <Box sx={{ 
                p: 2, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: 2,
                bgcolor: quest.completed ? 'rgba(34,211,238,0.05)' : (isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)'),
                border: '1px solid', borderColor: quest.completed ? 'rgba(34,211,238,0.2)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                transition: 'all 0.2s ease', '&:hover': { borderColor: 'rgba(34,211,238,0.4)', bgcolor: 'rgba(34,211,238,0.02)' }
              }}>
                <Checkbox 
                  checked={quest.completed} 
                  onChange={() => toggleQuest(quest.id)} 
                  sx={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.3)', '&.Mui-checked': { color: '#22D3EE' } }} 
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={800} color={quest.completed ? (isDark ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.5)") : (isDark ? "white" : "#0F172A")} sx={{ textDecoration: quest.completed ? 'line-through' : 'none' }}>
                    {quest.text}
                  </Typography>
                  <Typography variant="caption" fontWeight={700} color={quest.completed ? "rgba(34,211,238,0.5)" : "#22D3EE"} display="flex" alignItems="center" gap={0.5}>
                    <Trophy size={12} /> +{quest.xp} XP
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>
    </Box>
  );
}
