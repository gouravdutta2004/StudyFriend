import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, Button, useTheme, Card } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, Flame, Trophy, RefreshCw, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const PROMPTS = [
  "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The beautiful thing about learning is that nobody can take it away from you.",
  "Focus on the journey, not the destination. Joy is found not in finishing an activity but in doing it.",
  "Intelligence is the ability to adapt to change. Learning never exhausts the mind."
];

export default function TypingRacer() {
  const { user, setUser } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [prompt, setPrompt] = useState("");
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [xpAwarded, setXpAwarded] = useState(false);
  
  const inputRef = useRef(null);

  const initGame = () => {
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    setInput("");
    setTimeLeft(30);
    setIsPlaying(false);
    setHasFinished(false);
    setWpm(0);
    setAccuracy(100);
    setXpAwarded(false);
  };

  useEffect(() => {
    initGame();
  },[]);

  useEffect(() => {
    let timer = null;
    if (isPlaying && timeLeft > 0 && !hasFinished) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      endGame();
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, hasFinished]);

  useEffect(() => {
    if (prompt && input === prompt) {
      endGame(); // finished the string
    }
  }, [input, prompt]);

  const handleInput = (e) => {
    const val = e.target.value;
    if (!isPlaying && val.length === 1) {
      setIsPlaying(true);
    }
    setInput(val);

    // Calc Accuracy inline
    let correctChars = 0;
    for (let i = 0; i < val.length; i++) {
       if (val[i] === prompt[i]) correctChars++;
    }
    const acc = val.length > 0 ? Math.round((correctChars / val.length) * 100) : 100;
    setAccuracy(acc);
  };

  const endGame = () => {
    setIsPlaying(false);
    setHasFinished(true);

    const wordsTyped = input.trim().split(/\s+/).length;
    let finalWPM = 0;
    
    // time elapsed
    const elapsed = 30 - timeLeft;
    if (elapsed > 0) {
      finalWPM = Math.round((wordsTyped / elapsed) * 60);
    } else {
       finalWPM = wordsTyped * 60; // Instant
    }

    setWpm(finalWPM);

    // XP Dispatch
    if (finalWPM > 40 && accuracy > 90) {
      awardXp(finalWPM);
    }
  };

  const awardXp = async (finalWPM) => {
    if (xpAwarded) return;
    const xpReward = finalWPM > 80 ? 50 : 25;
    try {
      const res = await api.post('/gamification/reward', { xp: xpReward, game: 'TypingRacer' });
      setUser({ ...user, xp: res.data.xp, level: res.data.level });
      toast.success(`${res.data.message}! +${xpReward} XP`, { icon: '⌨️' });
      setXpAwarded(true);
    } catch {
      toast.error('Failed to sync XP with engine.');
    }
  };

  const getCharColor = (char, index) => {
     if (index >= input.length) return isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)';
     if (char === input[index]) return isDark ? '#10b981' : '#059669';
     return '#ef4444';
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 700, mx: 'auto', p: { xs: 3, md: 5 }, bgcolor: isDark ? 'rgba(15,23,42,0.6)' : 'white', borderRadius: 4, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
      
      {/* Header Panel */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight={900} color={isDark ? 'white' : 'text.primary'} display="flex" alignItems="center" gap={1}>
            <Keyboard color="#6366f1" /> Type Racer
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>Test your cognitive velocity.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 3, textAlign: 'right' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">WPM</Typography>
            <Typography variant="h6" fontWeight={800} color={isDark ? 'white' : 'black'}>{isPlaying ? '---' : wpm}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">ACCURACY</Typography>
            <Typography variant="h6" fontWeight={800} color={isDark ? 'white' : 'black'}>{accuracy}%</Typography>
          </Box>
          <Box sx={{ minWidth: 60 }}>
            <Typography variant="caption" color="text.secondary" display="block">TIMER</Typography>
            <Typography variant="h6" fontWeight={800} color={timeLeft <= 5 ? '#ef4444' : (isDark ? 'white' : 'black')}>0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</Typography>
          </Box>
        </Box>
      </Box>

      {hasFinished ? (
        <Box component={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} sx={{ textAlign: 'center', py: 6, bgcolor: isDark ? 'rgba(0,0,0,0.3)' : '#f8fafc', borderRadius: 4 }}>
          <Trophy size={64} color="#f59e0b" style={{ margin: '0 auto', marginBottom: 16 }} />
          <Typography variant="h3" fontWeight={900} mb={1}>{wpm} WPM</Typography>
          <Typography variant="subtitle1" fontWeight={600} color="text.secondary" mb={4}>{accuracy}% Accuracy Score</Typography>
          <Button onClick={initGame} variant="contained" size="large" py={1.5} sx={{ borderRadius: 10, px: 6, fontWeight: 800, textTransform: 'none' }}>Race Again</Button>
        </Box>
      ) : (
        <Box>
          <Box sx={{ 
            p: 3, bgcolor: isDark ? '#1e293b' : '#f1f5f9', borderRadius: 3, mb: 4, 
            fontFamily: '"Fira Code", monospace', fontSize: '1.25rem', lineHeight: 1.8, 
            minHeight: 140, boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.05)'
          }}>
             {prompt.split('').map((char, i) => (
                <span key={i} style={{ color: getCharColor(char, i), backgroundColor: (i === input.length && isPlaying) ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)') : 'transparent', textDecoration: (char !== input[i] && i < input.length) ? 'line-through' : 'none' }}>
                  {char}
                </span>
             ))}
          </Box>
          <TextField 
             inputRef={inputRef}
             fullWidth 
             autoComplete="off"
             autoFocus
             placeholder="Start typing to begin..." 
             value={input} 
             onChange={handleInput} 
             disabled={hasFinished}
             sx={{ 
               '& .MuiInputBase-root': { fontSize: '1.2rem', fontFamily: '"Fira Code", monospace', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'white', borderRadius: 3 },
               '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderWidth: '2px !important' },
               '&:hover fieldset': { borderColor: '#6366f1 !important' },
               '&.Mui-focused fieldset': { borderColor: '#6366f1 !important' }
             }} 
          />
        </Box>
      )}

    </Box>
  );
}
