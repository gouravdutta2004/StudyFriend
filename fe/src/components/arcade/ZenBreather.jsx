import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, useTheme, IconButton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, Play, Square, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const CYCLE_TIME = 19; // Inhale 4 + Hold 7 + Exhale 8
const GOAL_MINUTES = 2; // Required duration to earn XP 
const GOAL_SECONDS = GOAL_MINUTES * 60;

export default function ZenBreather({ onBack }) {
  const { user, setUser } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [isActive, setIsActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0); 
  const [phase, setPhase] = useState('Idle'); 
  const [xpAwarded, setXpAwarded] = useState(false);

  // Core Animation Loop Driver
  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSessionTime((prev) => {
          const next = prev + 1;
          const currentCycleSecond = next % CYCLE_TIME;

          if (currentCycleSecond < 4) {
            setPhase('Inhale');
          } else if (currentCycleSecond >= 4 && currentCycleSecond < 11) {
            setPhase('Hold');
          } else {
            setPhase('Exhale');
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  // Check XP Condition Unlocked
  useEffect(() => {
    if (sessionTime >= GOAL_SECONDS && !xpAwarded) {
      handleCompleteSession();
    }
  }, [sessionTime, xpAwarded]);

  const handleCompleteSession = async () => {
    try {
      const res = await api.post('/gamification/reward', { xp: 15, game: 'ZenithBreather' });
      setUser({ ...user, xp: res.data.xp, level: res.data.level });
      toast.success('Inner peace achieved! +15 XP', { icon: '🧘' });
      setXpAwarded(true);
    } catch (err) {
      console.error('XP Sync fail');
    }
  };

  const toggleSession = () => {
    if (isActive) {
      setIsActive(false);
      setPhase('Paused');
    } else {
      setIsActive(true);
      if (phase === 'Idle' || phase === 'Paused') {
        setPhase('Inhale'); 
        if (sessionTime === 0 && xpAwarded) setXpAwarded(false); // Reset sequence
      }
    }
  };

  // UI States
  const getScale = () => {
    if (!isActive) return 1;
    if (phase === 'Inhale') return 1.6;
    if (phase === 'Hold') return 1.6;
    if (phase === 'Exhale') return 1;
    return 1;
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', p: { xs: 3, md: 6 }, bgcolor: isDark ? 'transparent' : 'white', borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* HUD Header */}
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 8 }}>
         <IconButton onClick={onBack} sx={{ color: isDark ? 'white' : 'black' }}>
            <ChevronLeft size={28} />
         </IconButton>
         <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ letterSpacing: '2px', textTransform: 'uppercase', color: 'text.secondary', fontWeight: 700 }}>Clarity Routine</Typography>
            <Typography variant="h5" fontWeight={900} color={isDark ? 'white' : 'text.primary'} display="flex" alignItems="center" gap={1}>
              <Wind size={20} /> Zenith Breather
            </Typography>
         </Box>
         <Box sx={{ width: 40 }} /> {/* Spacer */}
      </Box>

      {/* Primary Visualizer Ring */}
      <Box sx={{ position: 'relative', width: 280, height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 8 }}>
        
        {/* Dynamic Expanding Aura */}
        <Box 
          component={motion.div}
          animate={{ scale: getScale() }}
          transition={{ duration: phase === 'Inhale' ? 4 : (phase === 'Exhale' ? 8 : 1), ease: 'easeInOut' }}
          sx={{ 
            position: 'absolute', width: '100%', height: '100%', 
            borderRadius: '50%', border: `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`, 
            bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
            boxShadow: isActive ? (isDark ? '0 0 60px rgba(255,255,255,0.05)' : '0 0 60px rgba(0,0,0,0.03)') : 'none'
          }}
        />

        {/* Text Hub */}
        <Box sx={{ zIndex: 10, textAlign: 'center' }}>
          <AnimatePresence mode="popLayout">
            <motion.div key={phase} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
               <Typography variant="h3" fontWeight={900} color={isDark ? 'white' : 'text.primary'} sx={{ letterSpacing: '-1px' }}>
                 {phase}
               </Typography>
            </motion.div>
          </AnimatePresence>
          {isActive && (
            <Typography variant="subtitle1" color="text.secondary" fontWeight={500} mt={1}>
              {Math.floor((GOAL_SECONDS - sessionTime) / 60)}:{(GOAL_SECONDS - sessionTime) % 60 < 10 ? '0' : ''}{(GOAL_SECONDS - sessionTime) % 60} Remaining
            </Typography>
          )}
        </Box>
      </Box>

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        <Button 
          variant="contained" 
          onClick={toggleSession}
          startIcon={isActive ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          sx={{ 
            px: 6, py: 1.5, borderRadius: 10, fontWeight: 800, textTransform: 'none', fontSize: '1rem',
            bgcolor: isDark ? 'white' : 'black', color: isDark ? 'black' : 'white',
            '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }
          }}
        >
          {isActive ? 'Pause Reflection' : (sessionTime > 0 ? 'Resume' : 'Begin 4-7-8 Sequence')}
        </Button>
      </Box>

      {xpAwarded && (
        <Typography variant="body2" color="#10b981" fontWeight={700} mt={4} component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          +15 XP Awarded! You may continue breathing or return to the lobby.
        </Typography>
      )}
    </Box>
  );
}
