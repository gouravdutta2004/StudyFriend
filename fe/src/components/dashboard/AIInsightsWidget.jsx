import React from 'react';
import { Box, Typography, Chip, IconButton, useTheme } from '@mui/material';
import { Sparkles, ArrowUpRight, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AIInsightsWidget() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const insights = [
    { title: 'Peak Productivity', text: 'You are 24% more focused between 08:00 - 11:00 AM.', icon: <Zap size={16} />, color: '#22D3EE', bg: 'rgba(34,211,238,0.1)' },
    { title: 'Subject Synergy', text: 'Pairing Mathematics with Physics sessions improves retention by 15%.', icon: <Target size={16} />, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={900} color={isDark ? "white" : "#0F172A"} display="flex" alignItems="center" gap={1.5}>
          <Sparkles size={20} color="#8B5CF6" /> AI Smart Insights
        </Typography>
        <Chip label="Live Sync" size="small" sx={{ bgcolor: 'rgba(139,92,246,0.1)', color: '#8B5CF6', fontWeight: 800, border: '1px solid rgba(139,92,246,0.2)' }} />
       </Box>

       <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
         {insights.map((item, i) => (
           <motion.div key={i} whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <Box sx={{ p: 3, borderRadius: '20px', bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)', border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', display: 'flex', gap: 2, alignItems: 'flex-start', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: item.color, boxShadow: `0 10px 30px ${item.bg}` } }}>
                 <Box sx={{ bgcolor: item.bg, color: item.color, p: 1.5, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   {item.icon}
                 </Box>
                 <Box sx={{ flex: 1 }}>
                   <Typography variant="subtitle2" fontWeight={800} color={isDark ? "white" : "#0F172A"} mb={0.5}>{item.title}</Typography>
                   <Typography variant="body2" color={isDark ? "rgba(255,255,255,0.6)" : "rgba(15,23,42,0.6)"} lineHeight={1.5}>{item.text}</Typography>
                 </Box>
                 <IconButton size="small" sx={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.3)' }}><ArrowUpRight size={16} /></IconButton>
              </Box>
           </motion.div>
         ))}
       </Box>
    </Box>
  );
}
