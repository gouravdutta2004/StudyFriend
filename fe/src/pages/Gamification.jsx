import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Avatar, IconButton, useTheme, LinearProgress, Chip, CircularProgress, Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Shield, Flame, Trophy, Star, Target, CheckCircle2, Circle } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

// Shared Glassmorphic Tilt Card
function GlassCard({ children, sx, className = '' }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Box className={className} sx={{
      bgcolor: isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.6)',
      backdropFilter: 'blur(20px)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
      borderRadius: '24px',
      boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.2)' : '0 10px 40px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      p: 3,
      ...sx
    }}>
      {children}
    </Box>
  );
}

export default function Gamification() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, questsRes] = await Promise.all([
        api.get('/users/profile'),
        api.get('/gamification/quests')
      ]);
      setProfile(profileRes.data);
      setQuests(questsRes.data);
    } catch (err) {
      toast.error('Failed to load gamification matrix.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteQuest = async (id, isCompleted) => {
    if (isCompleted) return;
    try {
      await api.put(`/gamification/quests/${id}`);
      setQuests(prev => prev.map(q => q._id === id ? { ...q, isCompleted: true } : q));
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#818cf8', '#c084fc']
      });
      toast.success('Quest Completed! +XP Earned', { icon: '🎯' });
      
      // Refresh profile to hopefully get updated XP if backend synced it (backend doesn't currently add XP on quest complete natively, but we refresh anyway)
      api.get('/users/profile').then(res => setProfile(res.data));
    } catch (err) {
      toast.error('Failed to complete quest.');
    }
  };

  if (loading || !profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={60} thickness={4} sx={{ color: '#8b5cf6' }} />
      </Box>
    );
  }

  // Math for Level Progress
  const currentXP = profile.xp || 0;
  const currentLevel = profile.level || 1;
  const xpBaseForCurrentLevel = (currentLevel - 1) * 1000;
  const xpIntoLevel = currentXP - xpBaseForCurrentLevel;
  const xpProgressPct = Math.min((xpIntoLevel / 1000) * 100, 100);

  const BADGE_ICONS = {
    'Bronze Scholar': <Shield color="#ca8a04" size={32} />,
    'Silver Scholar': <Shield color="#94a3b8" size={32} />,
    '7-Day Star': <Star color="#fbbf24" size={32} />,
  };

  return (
    <Box sx={{ minHeight: '100vh', py: 4, px: { xs: 2, md: 4 }, position: 'relative' }}>
      {/* Background Ambience */}
      <Box sx={{ position: 'absolute', top: 0, left: '20%', width: 600, height: 600, bgcolor: 'rgba(139, 92, 246, 0.05)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: 0, right: '10%', width: 500, height: 500, bgcolor: 'rgba(56, 189, 248, 0.05)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />

      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1200, mx: 'auto' }}>
        
        {/* Header Hero */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Box sx={{ p: 2, borderRadius: '16px', bgcolor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <Gamepad2 size={32} />
          </Box>
          <Box>
            <Typography variant="h3" fontWeight={900} color={isDark ? 'white' : 'text.primary'} sx={{ letterSpacing: '-1px' }}>
              Gamification Hub
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" fontWeight={500}>
              Level up your real-world study habits through digital progression.
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={4}>
          {/* Main XP Status Card */}
          <Grid item xs={12} md={8}>
            <GlassCard sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Avatar src={profile.avatar} sx={{ width: 80, height: 80, border: '4px solid #8b5cf6', boxShadow: '0 0 20px rgba(139,92,246,0.5)' }} />
                  <Box>
                    <Typography variant="h4" fontWeight={900} color={isDark ? 'white' : 'text.primary'}>{profile.name}</Typography>
                    <Chip 
                      icon={<Flame size={16} />} 
                      label={`${profile.streak || 0} Day Streak`} 
                      sx={{ mt: 1, bgcolor: 'rgba(249, 115, 22, 0.1)', color: '#f97316', fontWeight: 800 }} 
                    />
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h2" fontWeight={900} color="#8b5cf6" sx={{ lineHeight: 1 }}>{currentLevel}</Typography>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: 2 }}>Current Level</Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 'auto', pt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="text.primary">XP Progression</Typography>
                  <Typography variant="subtitle2" fontWeight={800} color="#8b5cf6">{xpIntoLevel} / 1000 XP</Typography>
                </Box>
                <Box sx={{ position: 'relative', height: 16, borderRadius: 8, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgressPct}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    style={{
                      position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: 8,
                      background: 'linear-gradient(90deg, #8b5cf6, #38bdf8)',
                      boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)'
                    }}
                  />
                </Box>
              </Box>
            </GlassCard>
          </Grid>

          {/* Side Stats */}
          <Grid item xs={12} md={4}>
            <GlassCard sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6" fontWeight={800} color={isDark ? 'white' : 'text.primary'} display="flex" alignItems="center" gap={1}>
                <Trophy size={20} color="#ca8a04" /> Matrix Stats
              </Typography>
              
              <Box sx={{ p: 2, borderRadius: '16px', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">Total XP Farmed</Typography>
                  <Typography variant="h5" fontWeight={900} color={isDark ? 'white' : 'text.primary'}>{currentXP.toLocaleString()}</Typography>
                </Box>
                <Star color="#eab308" size={32} opacity={0.2} />
              </Box>

              <Box sx={{ p: 2, borderRadius: '16px', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">Total Focus Hours</Typography>
                  <Typography variant="h5" fontWeight={900} color={isDark ? 'white' : 'text.primary'}>{(profile.studyHours || 0).toFixed(1)}h</Typography>
                </Box>
                <Target color="#38bdf8" size={32} opacity={0.2} />
              </Box>
            </GlassCard>
          </Grid>

          {/* Daily Quests Layout */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 6 }}>
              <Typography variant="h5" fontWeight={900} color={isDark ? 'white' : 'text.primary'} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Target size={24} color="#ec4899" /> Daily Quests
              </Typography>
              <Grid container spacing={2}>
                <AnimatePresence>
                  {quests.map((quest) => (
                    <Grid item xs={12} key={quest._id}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <Box
                          onClick={() => handleCompleteQuest(quest._id, quest.isCompleted)}
                          sx={{
                            p: 3, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: 2, cursor: quest.isCompleted ? 'default' : 'pointer',
                            bgcolor: quest.isCompleted ? (isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)') : (isDark ? 'rgba(255,255,255,0.03)' : 'white'),
                            border: `1px solid ${quest.isCompleted ? 'rgba(34, 197, 94, 0.2)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')}`,
                            transition: 'all 0.2s ease',
                            '&:hover': { transform: quest.isCompleted ? 'none' : 'translateY(-2px)', boxShadow: quest.isCompleted ? 'none' : '0 10px 20px rgba(0,0,0,0.1)' }
                          }}
                        >
                          {quest.isCompleted ? <CheckCircle2 size={28} color="#22c55e" /> : <Circle size={28} color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} />}
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" fontWeight={700} color={quest.isCompleted ? '#22c55e' : (isDark ? 'white' : 'text.primary')} sx={{ textDecoration: quest.isCompleted ? 'line-through' : 'none' }}>
                              {quest.task}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                              {quest.isCompleted ? 'Quest Completed - Rewards Claimed' : 'Click to claim completion (+XP)'}
                            </Typography>
                          </Box>
                        </Box>
                      </motion.div>
                    </Grid>
                  ))}
                  {quests.length === 0 && (
                    <Grid item xs={12}>
                      <GlassCard sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                        <Target size={48} opacity={0.2} style={{ margin: '0 auto 16px' }} />
                        <Typography fontWeight={700}>No active quests generated today.</Typography>
                      </GlassCard>
                    </Grid>
                  )}
                </AnimatePresence>
              </Grid>
            </Box>
          </Grid>

          {/* Badges Showroom */}
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h5" fontWeight={900} color={isDark ? 'white' : 'text.primary'} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Shield size={24} color="#eab308" /> Badges Showroom
              </Typography>
              <GlassCard>
                {(!profile.badges || profile.badges.length === 0) ? (
                  <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                    <Shield size={48} opacity={0.2} style={{ margin: '0 auto 16px' }} />
                    <Typography fontWeight={700}>No badges unlocked yet.</Typography>
                    <Typography variant="body2" mt={0.5}>Keep completing sessions to earn badges!</Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {profile.badges.map((badge, i) => (
                      <Grid item xs={4} key={i}>
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
                          <Tooltip title="Achievement Unlocked" arrow placement="top">
                            <Box sx={{
                              p: 2,
                              borderRadius: '16px',
                              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                              border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 1,
                              textAlign: 'center',
                              aspectRatio: '1',
                              transition: '0.2s',
                              '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', transform: 'translateY(-4px)' }
                            }}>
                              {BADGE_ICONS[badge] || <Trophy color="#8b5cf6" size={32} />}
                              <Typography variant="caption" fontWeight={800} color={isDark ? 'white' : 'text.primary'} sx={{ lineHeight: 1.2 }}>
                                {badge}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </GlassCard>
            </Box>
          </Grid>

        </Grid>
      </Box>
    </Box>
  );
}
