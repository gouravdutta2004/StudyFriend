import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, LinearProgress, useTheme } from '@mui/material';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FocusTimerWidget() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('pomodoro'); // pomodoro, shortBreak, longBreak

  const modes = {
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
  };

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(modes[newMode]);
    setIsRunning(false);
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => { setIsRunning(false); setTimeLeft(modes[mode]); };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((modes[mode] - timeLeft) / modes[mode]) * 100;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 3 }}>
        <Typography variant="h6" fontWeight={900} color={isDark ? "white" : "#0F172A"} display="flex" alignItems="center" gap={1.5}>
          <Timer size={20} color="#8B5CF6" /> Engine Room
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ display: 'flex', gap: 1, bgcolor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', p: 0.5, borderRadius: '100px', mb: 4 }}>
        {[
          { id: 'pomodoro', label: 'Hyper Focus' },
          { id: 'shortBreak', label: 'Short Break' },
        ].map(m => (
          <Button 
            key={m.id} 
            onClick={() => switchMode(m.id)}
            sx={{ 
              borderRadius: '100px', 
              px: { xs: 2, sm: 3 }, 
              py: 0.5,
              fontWeight: 800,
              textTransform: 'none',
              bgcolor: mode === m.id ? 'rgba(139,92,246,0.2)' : 'transparent',
              color: mode === m.id ? '#8B5CF6' : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.5)'),
              '&:hover': { bgcolor: mode === m.id ? 'rgba(139,92,246,0.3)' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.05)') }
            }}
          >
            {m.label}
          </Button>
        ))}
      </Box>

      {/* Circular Timer Ring Wrapper (using box shadow approximations for ring) */}
      <Box sx={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
        {/* Glow behind timer */}
        {isRunning && (
           <motion.div 
             animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }} 
             transition={{ duration: 2, repeat: Infinity }} 
             style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)', zIndex: 0 }}
           />
        )}
        <Box sx={{ 
          width: '100%', height: '100%', borderRadius: '50%', border: isDark ? '4px solid rgba(255,255,255,0.05)' : '4px solid rgba(15,23,42,0.05)', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1,
          boxShadow: isRunning ? '0 0 40px rgba(139,92,246,0.4), inset 0 0 40px rgba(139,92,246,0.2)' : (isDark ? 'inset 0 0 20px rgba(0,0,0,0.5)' : 'inset 0 0 20px rgba(15,23,42,0.1)'),
          background: isDark ? 'rgba(15,23,42,0.8)' : 'rgba(241,245,249,0.5)'
        }}>
          <Typography variant="h2" fontWeight={900} sx={{ background: isDark ? 'linear-gradient(180deg, #FFFFFF, rgba(255,255,255,0.7))' : 'linear-gradient(180deg, #0F172A, rgba(15,23,42,0.6))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '2px' }}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </Typography>
          <Typography variant="caption" fontWeight={800} color="#8B5CF6" letterSpacing={2} textTransform="uppercase" mt={1}>
            {mode === 'pomodoro' ? 'FLOW STATE' : 'RECOVERY'}
          </Typography>
        </Box>
      </Box>

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        <IconButton onClick={resetTimer} sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.5)', bgcolor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', width: 48, height: 48, '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.05)', color: isDark ? 'white' : '#0F172A' } }}>
          <RotateCcw size={20} />
        </IconButton>
        <IconButton 
          onClick={toggleTimer} 
          sx={{ 
            color: 'white', 
            bgcolor: isRunning ? '#EF4444' : '#8B5CF6', 
            width: 64, height: 64, 
            boxShadow: isRunning ? '0 0 20px rgba(239, 68, 68, 0.5)' : '0 0 30px rgba(139,92,246,0.5)',
            '&:hover': { bgcolor: isRunning ? '#DC2626' : '#7C3AED', transform: 'scale(1.05)' } 
          }}
        >
          {isRunning ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" style={{ marginLeft: '4px' }} />}
        </IconButton>
      </Box>
      <LinearProgress variant="determinate" value={progress} sx={{ width: '80%', mt: 4, height: 4, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#8B5CF6' } }} />
    </Box>
  );
}
