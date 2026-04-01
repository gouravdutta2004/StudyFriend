import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Box, Paper, Typography, Button, IconButton, useTheme, Stack } from '@mui/material';

export default function PomodoroTimer() {
  const theme = useTheme();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      setIsBreak(!isBreak);
      setTimeLeft(isBreak ? 25 * 60 : 5 * 60);
      new Audio('/notification.mp3').play().catch(() => {});
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isBreak]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
  };

  const setMode = (breakMode) => {
    setIsBreak(breakMode);
    setIsActive(false);
    setTimeLeft(breakMode ? 5 * 60 : 25 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <Paper elevation={theme.palette.mode === 'dark' ? 4 : 1} sx={{ p: 4, borderRadius: 4, textAlign: 'center' }}>
      <Typography variant="h6" fontWeight={800} mb={3} color="text.primary">
        Pomodoro Timer
      </Typography>
      
      <Stack direction="row" justifyContent="center" gap={1} mb={4}>
        <Button 
          variant={!isBreak ? 'contained' : 'outlined'} 
          color="primary"
          onClick={() => setMode(false)}
          sx={{ borderRadius: 4, px: 3, fontWeight: 700 }}
        >
          Work
        </Button>
        <Button 
          variant={isBreak ? 'contained' : 'outlined'} 
          color="success"
          onClick={() => setMode(true)}
          sx={{ borderRadius: 4, px: 3, fontWeight: 700 }}
        >
          Break
        </Button>
      </Stack>

      <Typography variant="h2" fontWeight={900} fontFamily="monospace" color="text.primary" mb={4} sx={{ letterSpacing: 2 }}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </Typography>

      <Stack direction="row" justifyContent="center" gap={2}>
        <IconButton
          onClick={toggleTimer}
          sx={{
            bgcolor: isActive ? theme.palette.warning.main : theme.palette.primary.main,
            color: 'white',
            width: 64,
            height: 64,
            '&:hover': { bgcolor: isActive ? theme.palette.warning.dark : theme.palette.primary.dark },
            boxShadow: theme.shadows[4]
          }}
        >
          {isActive ? <Pause size={32} /> : <Play size={32} style={{ marginLeft: 4 }} />}
        </IconButton>
        <IconButton
          onClick={resetTimer}
          sx={{
            bgcolor: 'background.default',
            color: 'text.secondary',
            width: 64,
            height: 64,
            border: 1,
            borderColor: 'divider',
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          <RotateCcw size={28} />
        </IconButton>
      </Stack>
    </Paper>
  );
}
