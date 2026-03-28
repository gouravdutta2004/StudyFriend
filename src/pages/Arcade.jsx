import React, { useState } from 'react';
import { Box, Typography, Button, useTheme, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Trophy, Hash, Wind, BrainCircuit, Keyboard } from 'lucide-react';
import MemoryMatch from '../components/arcade/MemoryMatch';
import TypingRacer from '../components/arcade/TypingRacer';
import ZenBreather from '../components/arcade/ZenBreather';
import MathSprint from '../components/arcade/MathSprint';

const GAMES = [
  {
    id: 'memory',
    title: 'Synapse Match',
    description: 'A classic test of working memory. Match academic endpoints rapidly.',
    icon: BrainCircuit,
    component: MemoryMatch
  },
  {
    id: 'typing',
    title: 'Type Racer',
    description: 'Track semantic velocity and precision through academic transcription.',
    icon: Keyboard,
    component: TypingRacer
  },
  {
    id: 'math',
    title: 'Math Sprint',
    description: 'Engage logical sequencing with 60 seconds of rapid interval arithmetic.',
    icon: Hash,
    component: MathSprint
  },
  {
    id: 'zen',
    title: 'Zenith Breather',
    description: 'Restore cognitive bandwidth through a mapped 4-7-8 parasympathetic rhythm.',
    icon: Wind,
    component: ZenBreather
  }
];

export default function Arcade() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';
  const [activeGame, setActiveGame] = useState(null);

  const ActiveComponent = activeGame ? GAMES.find(g => g.id === activeGame)?.component : null;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', p: { xs: 3, md: 8 } }}>
      
      <Box sx={{ maxWidth: 1000, width: '100%', mx: 'auto' }}>
        
        {/* Minimalist Header */}
        {!activeGame && (
          <Box component={motion.div} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} sx={{ mb: 8 }}>
            <Typography variant="h2" fontWeight={900} color="text.primary" sx={{ letterSpacing: '-2px', mb: 2 }}>
              Arcade.
            </Typography>
            <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ maxWidth: 600, lineHeight: 1.6 }}>
              A collection of minimal cognitive modules designed to maintain focus, track velocity, and restore mental bandwidth during extended study blocks.
            </Typography>
          </Box>
        )}

        <AnimatePresence mode="wait">
          {!activeGame ? (
            <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
              
              <Grid container spacing={3}>
                {GAMES.map((game) => (
                  <Grid item xs={12} sm={6} key={game.id}>
                    <Box 
                      component={motion.div}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveGame(game.id)}
                      sx={{ 
                        p: 4, height: '100%', cursor: 'pointer',
                        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa', 
                        border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        borderRadius: 4, transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6', 
                          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      <game.icon size={28} style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '24px' }} />
                      <Typography variant="h5" fontWeight={800} mb={1}>{game.title}</Typography>
                      <Typography variant="body1" color="text.secondary" fontWeight={400} sx={{ lineHeight: 1.6 }}>
                        {game.description}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* Minimal Leaderboard Hook */}
              <Box sx={{ mt: 8, pt: 6, borderTop: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 3 }}>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                     <Trophy size={20} style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                     <Typography variant="body1" color="text.secondary" fontWeight={500}>XP harvested here is tracked globally.</Typography>
                   </Box>
                   <Button variant="text" onClick={() => navigate('/leaderboard')} sx={{ fontWeight: 700, px: 3, py: 1, borderRadius: 10, color: 'text.primary', border: '1px solid', borderColor: 'divider' }}>
                     Leaderboard Standings
                   </Button>
              </Box>

            </motion.div>
          ) : (
            <motion.div key="game" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
               {ActiveComponent && <ActiveComponent onBack={() => setActiveGame(null)} />}
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
}
