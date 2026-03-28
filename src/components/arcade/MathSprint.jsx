import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, Button, useTheme, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { Hash, Trophy, ChevronLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function MathSprint({ onBack }) {
  const { user, setUser } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [equation, setEquation] = useState({ q: '', a: 0 });
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(false);

  const inputRef = useRef(null);

  const generateEquation = () => {
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let n1, n2, ans;

    if (op === '+') {
      n1 = Math.floor(Math.random() * 50) + 10;
      n2 = Math.floor(Math.random() * 50) + 10;
      ans = n1 + n2;
    } else if (op === '-') {
      n1 = Math.floor(Math.random() * 50) + 20;
      n2 = Math.floor(Math.random() * n1);
      ans = n1 - n2;
    } else {
      n1 = Math.floor(Math.random() * 12) + 2;
      n2 = Math.floor(Math.random() * 12) + 2;
      ans = n1 * n2;
    }

    setEquation({ q: `${n1} ${op} ${n2}`, a: ans });
    setInput('');
  };

  const initGame = () => {
    setScore(0);
    setTimeLeft(60);
    setIsPlaying(true);
    setHasFinished(false);
    setXpAwarded(false);
    generateEquation();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  useEffect(() => {
    let timer = null;
    if (isPlaying && timeLeft > 0 && !hasFinished) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      endGame();
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, hasFinished]);

  const handleInput = (e) => {
    const val = e.target.value;
    setInput(val);

    // Auto-check if correct
    if (parseInt(val) === equation.a) {
      setScore(s => s + 1);
      generateEquation();
    }
  };

  const endGame = () => {
    setIsPlaying(false);
    setHasFinished(true);
    if (score >= 10) {
      awardXp(score);
    }
  };

  const awardXp = async (finalScore) => {
    if (xpAwarded) return;
    const xpReward = finalScore >= 20 ? 60 : 40;
    try {
      const res = await api.post('/gamification/reward', { xp: xpReward, game: 'MathSprint' });
      setUser({ ...user, xp: res.data.xp, level: res.data.level });
      toast.success(`${res.data.message}! +${xpReward} XP`, { icon: '🧮' });
      setXpAwarded(true);
    } catch {
      toast.error('Failed to sync XP with engine.');
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', p: { xs: 3, md: 6 }, bgcolor: isDark ? 'transparent' : 'white', borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Header */}
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
         <IconButton onClick={onBack} sx={{ color: isDark ? 'white' : 'black' }}>
            <ChevronLeft size={28} />
         </IconButton>
         <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ letterSpacing: '2px', textTransform: 'uppercase', color: 'text.secondary', fontWeight: 700 }}>Mental Agility</Typography>
            <Typography variant="h5" fontWeight={900} color={isDark ? 'white' : 'text.primary'} display="flex" alignItems="center" gap={1}>
              <Hash size={20} /> Math Sprint
            </Typography>
         </Box>
         <IconButton onClick={initGame} sx={{ color: isDark ? 'white' : 'black' }}>
            <RefreshCw size={24} />
         </IconButton>
      </Box>

      {/* Main HUD */}
      {!isPlaying && !hasFinished ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="body1" color="text.secondary" mb={4} fontWeight={500}>Solve as many equations as possible in 60 seconds.</Typography>
          <Button variant="contained" size="large" onClick={initGame} sx={{ borderRadius: 10, px: 6, py: 1.5, fontSize: '1.2rem', fontWeight: 800, textTransform: 'none', bgcolor: isDark ? 'white' : 'black', color: isDark ? 'black' : 'white', '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' } }}>
            Start Sprint
          </Button>
        </Box>
      ) : hasFinished ? (
        <Box component={motion.div} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} sx={{ textAlign: 'center', py: 6, width: '100%' }}>
          <Trophy size={64} color="#f59e0b" style={{ margin: '0 auto', marginBottom: 16 }} />
          <Typography variant="h3" fontWeight={900} mb={1}>{score} Solved</Typography>
          <Typography variant="subtitle1" fontWeight={600} color="text.secondary" mb={4}>Accuracy maintained for 60 seconds</Typography>
          <Button onClick={initGame} variant="outlined" size="large" sx={{ borderRadius: 10, px: 6, fontWeight: 800, textTransform: 'none', border: `2px solid ${isDark ? 'white' : 'black'}`, color: isDark ? 'white' : 'black' }}>Play Again</Button>
        </Box>
      ) : (
        <Box sx={{ width: '100%', textAlign: 'center' }}>
          
          {/* Metrics Row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 6, px: 4 }}>
             <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>TIME</Typography>
                <Typography variant="h4" fontWeight={900} color={timeLeft <= 10 ? '#ef4444' : (isDark ? 'white' : 'black')}>{timeLeft}s</Typography>
             </Box>
             <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>SCORE</Typography>
                <Typography variant="h4" fontWeight={900} color="#10b981">{score}</Typography>
             </Box>
          </Box>

          {/* Equation Display */}
          <Typography variant="h2" fontWeight={900} mb={6} sx={{ letterSpacing: '2px', fontFamily: '"Fira Code", monospace' }}>
             {equation.q} = ?
          </Typography>

          <TextField 
             inputRef={inputRef}
             type="number"
             autoComplete="off"
             autoFocus
             placeholder="Answer..." 
             value={input} 
             onChange={handleInput} 
             sx={{ 
               width: 200, mx: 'auto',
               '& .MuiInputBase-root': { fontSize: '2rem', textAlign: 'center', fontWeight: 800, fontFamily: '"Fira Code", monospace', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: 4 },
               '& input': { textAlign: 'center' },
               '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderWidth: '2px !important' },
               '&:hover fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3) !important' },
               '&.Mui-focused fieldset': { borderColor: isDark ? 'white !important' : 'black !important' }
             }} 
          />
        </Box>
      )}

    </Box>
  );
}
