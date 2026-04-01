import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, useTheme, Card } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, Target, Zap, Clock, Trophy, RefreshCw, Star, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const CARD_PAIRS = [
  { id: 1, icon: BookOpen, bgColor: '#3b82f6', color: 'white' },
  { id: 2, icon: Sparkles, bgColor: '#8b5cf6', color: 'white' },
  { id: 3, icon: Target, bgColor: '#10b981', color: 'white' },
  { id: 4, icon: Zap, bgColor: '#eab308', color: 'white' },
  { id: 5, icon: Clock, bgColor: '#ef4444', color: 'white' },
  { id: 6, icon: Trophy, bgColor: '#f97316', color: 'white' }
];

export default function MemoryMatch() {
  const { user, setUser } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [cards, setCards] = useState([]);
  const [flippedIndex, setFlippedIndex] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);

  // Shuffle and Initialize
  const initializeGame = () => {
    const deck = [...CARD_PAIRS, ...CARD_PAIRS]
      .sort(() => Math.random() - 0.5)
      .map((card, idx) => ({ ...card, uniqueId: idx }));
    setCards(deck);
    setFlippedIndex([]);
    setMatchedPairs([]);
    setMoves(0);
    setTime(0);
    setHasWon(false);
    setXpAwarded(false);
    setIsPlaying(true);
  };

  // Timer
  useEffect(() => {
    let interval = null;
    if (isPlaying && !hasWon) {
      interval = setInterval(() => setTime(t => t + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, hasWon]);

  // Handle Flip Logic
  const handleCardClick = (index) => {
    if (!isPlaying || flippedIndex.length === 2 || flippedIndex.includes(index) || matchedPairs.includes(cards[index].id)) {
      return;
    }

    const newFlipped = [...flippedIndex, index];
    setFlippedIndex(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const firstCard = cards[newFlipped[0]];
      const secondCard = cards[newFlipped[1]];

      if (firstCard.id === secondCard.id) {
        const newMatches = [...matchedPairs, firstCard.id];
        setMatchedPairs(newMatches);
        setFlippedIndex([]);
        
        // Win State
        if (newMatches.length === CARD_PAIRS.length) {
          setHasWon(true);
          awardXp(time);
        }
      } else {
        setTimeout(() => setFlippedIndex([]), 1000); // flip back via timeout
      }
    }
  };

  const awardXp = async (finalTime) => {
    if (xpAwarded) return;
    
    // Logic: Baseline +20XP. If done <30s, +30XP bonus.
    const xpReward = finalTime < 40 ? 50 : 20;

    try {
      const res = await api.post('/gamification/reward', { xp: xpReward, game: 'MemoryMatch' });
      setUser({ ...user, xp: res.data.xp, level: res.data.level });
      toast.success(`${res.data.message}! +${xpReward} XP`, { icon: '🎮' });
      setXpAwarded(true);
    } catch (err) {
      toast.error('Failed to sync XP with engine.');
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 500, mx: 'auto', p: 3, bgcolor: isDark ? 'rgba(15,23,42,0.6)' : 'white', borderRadius: 4, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
      
      {/* Header Panel */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight={900} color={isDark ? 'white' : 'text.primary'} display="flex" alignItems="center" gap={1}>
            <Star color="#8b5cf6" /> Synapse Match
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>Flip to map pathways.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, textAlign: 'right' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">MOVES</Typography>
            <Typography variant="h6" fontWeight={800} color={isDark ? 'white' : 'black'}>{moves}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">TIME</Typography>
            <Typography variant="h6" fontWeight={800} color={isDark ? 'white' : 'black'}>{time}s</Typography>
          </Box>
          <IconButton onClick={initializeGame} color="primary" sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.2)' }, width: 40, height: 40, mt: 0.5 }}>
            <RefreshCw size={20} />
          </IconButton>
        </Box>
      </Box>

      {/* Grid */}
      {!isPlaying && !hasWon ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Button variant="contained" size="large" onClick={initializeGame} sx={{ borderRadius: 10, px: 6, py: 1.5, fontSize: '1.2rem', fontWeight: 800, textTransform: 'none', background: 'linear-gradient(45deg, #8b5cf6, #ec4899)' }}>
            Start Memory Test
          </Button>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, position: 'relative' }}>
            {cards.map((card, index) => {
              const isFlipped = flippedIndex.includes(index) || matchedPairs.includes(card.id);
              const isMatched = matchedPairs.includes(card.id);
              const Icon = card.icon;

              return (
                <Box
                  key={card.uniqueId}
                  onClick={() => handleCardClick(index)}
                  component={motion.div}
                  animate={{ rotateY: isFlipped ? 180 : 0, scale: isMatched ? 0.95 : 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  sx={{
                    aspectRatio: '1', cursor: isFlipped ? 'default' : 'pointer', perspective: 1000,
                    transformStyle: 'preserve-3d', position: 'relative'
                  }}
                >
                  {/* Front/Hidden */}
                  <Box sx={{
                    position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', 
                    bgcolor: isDark ? '#1e293b' : '#cbd5e1', borderRadius: '16px', border: '2px solid', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.1)'
                  }}>
                     <Star size={24} color={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                  </Box>

                  {/* Back/Revealed */}
                  <Box sx={{
                    position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', 
                    bgcolor: card.bgColor, color: card.color, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transform: 'rotateY(180deg)', boxShadow: `0 8px 20px ${card.bgColor}40`,
                    border: '2px solid rgba(255,255,255,0.2)'
                  }}>
                    <Icon size={32} />
                  </Box>
                </Box>
              );
            })}

            {hasWon && (
              <Box component={motion.div} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} sx={{ 
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                bgcolor: isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', 
                zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' 
              }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.5 }}><Trophy size={64} color="#f59e0b" /></motion.div>
                <Typography variant="h4" fontWeight={900} mt={2}>Memory Perfected</Typography>
                <Typography variant="body1" fontWeight={600} color="text.secondary">Solved in {time}s with {moves} moves!</Typography>
                <Button onClick={initializeGame} variant="contained" sx={{ mt: 3, borderRadius: 10, px: 4, py: 1, fontWeight: 800 }}>Play Again</Button>
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}
