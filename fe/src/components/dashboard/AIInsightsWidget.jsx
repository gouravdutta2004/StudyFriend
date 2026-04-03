import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip, IconButton, Skeleton, useTheme } from '@mui/material';
import { Sparkles, ArrowUpRight, Target, Zap, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';

function buildInsights(data) {
  const insights = [];

  // Insight 1: Peak productivity hour from hoursByDay
  if (data.hoursByDay && data.hoursByDay.length > 0) {
    const best = [...data.hoursByDay].sort((a, b) => b.hours - a.hours)[0];
    if (best && best.hours > 0) {
      const date = new Date(best.date);
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });
      insights.push({
        title: 'Peak Study Day',
        text: `${day} is your strongest day with ${best.hours.toFixed(1)}h logged. Try to schedule important topics then.`,
        icon: <Zap size={16} />,
        color: '#22D3EE',
        bg: 'rgba(34,211,238,0.1)',
      });
    }
  }

  // Insight 2: Top subject from topSubjects
  if (data.topSubjects && data.topSubjects.length >= 2) {
    const [s1, s2] = data.topSubjects;
    insights.push({
      title: 'Subject Focus',
      text: `You study ${s1.name} most (${s1.value} sessions). Pairing it with ${s2.name} can deepen understanding.`,
      icon: <Target size={16} />,
      color: '#8B5CF6',
      bg: 'rgba(139,92,246,0.1)',
    });
  } else if (data.topSubjects && data.topSubjects.length === 1) {
    insights.push({
      title: 'Focus Area',
      text: `${data.topSubjects[0].name} is your primary study subject. Try exploring related topics to build connections.`,
      icon: <Target size={16} />,
      color: '#8B5CF6',
      bg: 'rgba(139,92,246,0.1)',
    });
  }

  // Insight 3: Streak motivation
  if (data.streak > 0 && insights.length < 2) {
    insights.push({
      title: 'Streak Power',
      text: `You're on a ${data.streak}-day streak! Consistency is the #1 predictor of long-term academic success.`,
      icon: <Flame size={16} />,
      color: '#f97316',
      bg: 'rgba(249,115,22,0.1)',
    });
  }

  // Default fallback if no data yet
  if (insights.length === 0) {
    insights.push({
      title: 'Getting Started',
      text: 'Complete your first study sessions to unlock personalized AI insights based on your data.',
      icon: <Sparkles size={16} />,
      color: '#22D3EE',
      bg: 'rgba(34,211,238,0.1)',
    });
  }

  return insights.slice(0, 2);
}

export default function AIInsightsWidget() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/analytics/me')
      .then(res => setInsights(buildInsights(res.data || {})))
      .catch(() => setInsights(buildInsights({})))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={900} color={isDark ? "white" : "#0F172A"} display="flex" alignItems="center" gap={1.5}>
          <Sparkles size={20} color="#8B5CF6" /> AI Smart Insights
        </Typography>
        <Chip label="Personalised" size="small" sx={{ bgcolor: 'rgba(139,92,246,0.1)', color: '#8B5CF6', fontWeight: 800, border: '1px solid rgba(139,92,246,0.2)' }} />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        {loading ? (
          [1, 2].map(i => (
            <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: '20px', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
          ))
        ) : (
          insights.map((item, i) => (
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
          ))
        )}
      </Box>
    </Box>
  );
}

