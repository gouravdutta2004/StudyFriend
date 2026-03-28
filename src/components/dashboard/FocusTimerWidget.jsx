import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, IconButton, Button, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, BrainCircuit, Coffee, BatteryCharging } from 'lucide-react';

const MODES = {
  focus: { id: 'focus', label: 'Pomodoro', minutes: 25, color: '#8b5cf6', rgb: '139, 92, 246', icon: BrainCircuit },
  short: { id: 'short', label: 'Short Break', minutes: 5, color: '#10b981', rgb: '16, 185, 129', icon: Coffee },
  long: { id: 'long', label: 'Long Break', minutes: 15, color: '#3b82f6', rgb: '59, 130, 246', icon: BatteryCharging },
};

export default function FocusTimerWidget() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  const [activeMode, setActiveMode] = useState(MODES.focus);
  const [timeLeft, setTimeLeft] = useState(MODES.focus.minutes * 60);
  const [isActive, setIsActive] = useState(false);

  const playAlarm = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      const playTone = (freq, startTime, duration) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(freq, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioCtx.currentTime;
      playTone(523.25, now, 0.4);       // C5
      playTone(659.25, now + 0.15, 0.4); // E5
      playTone(783.99, now + 0.3, 0.8);  // G5
      playTone(1046.50, now + 0.45, 1.2); // C6
    } catch (e) {
      console.error("Audio API not supported", e);
    }
  }, []);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            playAlarm();
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, playAlarm]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(activeMode.minutes * 60);
  };

  const switchMode = (modeKey) => {
    const mode = MODES[modeKey];
    setActiveMode(mode);
    setIsActive(false);
    setTimeLeft(mode.minutes * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((activeMode.minutes * 60 - timeLeft) / (activeMode.minutes * 60)) * 100;

  const ActiveIcon = activeMode.icon;

  return (
    <Box sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden', minHeight: '280px', transition: 'all 0.5s ease' }}>
      {/* Background decoration */}
      <Box sx={{ position: 'absolute', top: -30, right: -30, opacity: isDark ? 0.05 : 0.03, transform: 'rotate(15deg)', transition: 'color 0.5s ease' }}>
        <ActiveIcon size={180} color={activeMode.color} />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 1, zIndex: 1 }}>
        <Typography variant="h6" fontWeight={900} display="flex" alignItems="center" gap={1.5} color={isDark ? "white" : "#0f172a"} sx={{ transition: 'color 0.5s ease' }}>
          <ActiveIcon size={20} color={activeMode.color} /> {activeMode.label}
        </Typography>
        <Typography variant="caption" fontWeight={800} sx={{ bgcolor: `rgba(${activeMode.rgb}, 0.1)`, color: activeMode.color, px: 1.5, py: 0.5, borderRadius: 2, transition: 'all 0.5s ease' }}>
          {activeMode.minutes}m Focus
        </Typography>
      </Box>

      {/* Mode selectors */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, zIndex: 1, bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', p: 0.5, borderRadius: '100px' }}>
        {Object.entries(MODES).map(([key, mode]) => (
          <Button
            key={key}
            onClick={() => switchMode(key)}
            size="small"
            sx={{
              minWidth: 0,
              px: { xs: 1.5, sm: 2 },
              py: 0.5,
              borderRadius: '100px',
              textTransform: 'none',
              fontWeight: 800,
              fontSize: '0.75rem',
              color: activeMode.id === key ? (isDark ? '#000' : '#fff') : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'),
              bgcolor: activeMode.id === key ? mode.color : 'transparent',
              '&:hover': {
                bgcolor: activeMode.id === key ? mode.color : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {mode.label.split(' ')[0]}
          </Button>
        ))}
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1, width: '100%' }}>
        
        {/* Circular Progress mimicking a glowing ring */}
        <Box sx={{ position: 'relative', width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
          <svg width="150" height="150" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
            <circle cx="75" cy="75" r="65" fill="transparent" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} strokeWidth="8" />
            <motion.circle 
              cx="75" cy="75" r="65" fill="transparent" stroke={activeMode.color} strokeWidth="8" strokeDasharray={408.4}
              strokeDashoffset={408.4 - (408.4 * progress / 100)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
              filter={`drop-shadow(0px 0px 8px rgba(${activeMode.rgb}, 0.5))`}
            />
          </svg>
          <Box sx={{ textAlign: 'center' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${minutes}-${seconds}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <Typography variant="h3" fontWeight={900} color={isDark ? "white" : "#0f172a"} sx={{ letterSpacing: '-2px', fontFamily: '"Inter", sans-serif' }}>
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </Typography>
              </motion.div>
            </AnimatePresence>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <IconButton onClick={resetTimer} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? 'white' : '#0f172a', width: 44, height: 44, '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' } }}>
              <RotateCcw size={20} />
            </IconButton>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <IconButton onClick={toggleTimer} sx={{ bgcolor: activeMode.color, color: 'white', width: 52, height: 52, boxShadow: `0 8px 16px rgba(${activeMode.rgb}, 0.4)`, '&:hover': { bgcolor: activeMode.color, boxShadow: `0 8px 20px rgba(${activeMode.rgb}, 0.6)`, filter: 'brightness(1.1)' }, transition: 'all 0.3s ease' }}>
              {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" style={{ marginLeft: 3 }} />}
            </IconButton>
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
}
