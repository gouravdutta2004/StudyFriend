import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, Button, IconButton, useTheme, Avatar, LinearProgress, Grid, Tooltip, Chip } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Users, Calendar, Award, CheckCircle, RefreshCw, Lock, Zap, BookOpen, Clock, Activity, MessageCircle, LockKeyhole, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { initAOS } from '../utils/aosConfig';

import StudyQuoteWidget from '../components/dashboard/StudyQuoteWidget';
import AIInsightsWidget from '../components/dashboard/AIInsightsWidget';
import FocusTimerWidget from '../components/dashboard/FocusTimerWidget';
import MiniCalendarWidget from '../components/dashboard/MiniCalendarWidget';
import StudyAnalyticsWidget from '../components/dashboard/StudyAnalyticsWidget';
import BountiesWidget from '../components/dashboard/BountiesWidget';

const fadeUpSpring = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
};
const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

export default function Dashboard() {
  const { user } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ connections: 0, sessions: 0, pending: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    initAOS();
    const fetchData = async () => {
      setLoading(true);
      try {
        const [connRes, sessRes] = await Promise.all([
          api.get('/users/connections'),
          api.get('/sessions/my')
        ]);
        setStats({
          connections: connRes.data.connections.length,
          sessions: sessRes.data.length,
          pending: connRes.data.pendingRequests.length
        });
        setLastUpdated(new Date());
      } catch {}
      finally { setLoading(false); }
    };
    fetchData();
  }, [user, refreshKey]);

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: isDark ? 'linear-gradient(135deg, #0B0F1A 0%, #0F172A 100%)' : 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)', 
      color: isDark ? 'white' : '#0F172A',
      pb: 10,
      fontFamily: '"SF Pro Display", "Inter", sans-serif'
    }}>
      <style>
        {`
          .glass-card {
            background: ${isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.7)'};
            backdrop-filter: blur(24px);
            border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
            box-shadow: ${isDark ? '0 10px 40px rgba(0, 0, 0, 0.3)' : '0 10px 40px rgba(148, 163, 184, 0.15)'};
            border-radius: 24px;
            transition: all 0.3s ease-in-out;
            position: relative;
            overflow: hidden;
            height: 100%;
          }
          .glass-card:hover {
            border-color: rgba(99, 102, 241, 0.3);
            box-shadow: 0 15px 50px rgba(34, 211, 238, 0.1);
          }
          .glass-card.glow-primary:hover { border-color: rgba(99, 102, 241, 0.4); box-shadow: 0 0 30px rgba(99,102,241,0.2); }
          .glass-card.glow-accent:hover { border-color: rgba(34, 211, 238, 0.4); box-shadow: 0 0 30px rgba(34,211,238,0.2); }
          .glass-card.glow-purple:hover { border-color: rgba(139, 92, 246, 0.4); box-shadow: 0 0 30px rgba(139,92,246,0.2); }
          .glow-text {
            background: linear-gradient(90deg, #6366F1, #22D3EE);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .gradient-border-shimmer {
            position: relative;
          }
          .gradient-border-shimmer::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            padding: 1px;
            background: linear-gradient(45deg, rgba(99,102,241,0.5), rgba(34,211,238,0.5), rgba(99,102,241,0.5));
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            z-index: -1;
            opacity: 0.5;
            transition: opacity 0.3s;
          }
          .glass-card:hover.gradient-border-shimmer::before { opacity: 1; }
        `}
      </style>

      <Box component={motion.div} variants={staggerContainer} initial="hidden" animate="visible" sx={{ p: { xs: 2, md: 4 }, maxWidth: '1440px', mx: 'auto' }}>
        
        {/* Top Navigation Row */}
        <Box component={motion.div} variants={fadeUpSpring} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5, bg: 'transparent' }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Button component={RouterLink} to="/dashboard" variant="contained" sx={{ bgcolor: 'rgba(99,102,241,0.1)', color: '#8B5CF6', borderRadius: '100px', fontWeight: 800, px: 3, py: 1 }}>Dashboard</Button>
                <Button component={RouterLink} to="/sessions" variant="text" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', borderRadius: '100px', fontWeight: 700, px: 3, py: 1 }}>Agenda</Button>
                <Button component={RouterLink} to="/browse" variant="text" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', borderRadius: '100px', fontWeight: 700, px: 3, py: 1 }}>Browse</Button>
                <Button component={RouterLink} to="/groups" variant="text" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', borderRadius: '100px', fontWeight: 700, px: 3, py: 1 }}>Community</Button>
            </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(12, 1fr)' }, gap: 4 }}>
          
          {/* Top Section - Welcome & Quote */}
          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 8' } }}>
            <motion.div variants={fadeUpSpring} style={{ height: '100%' }}>
            <Box className="glass-card gradient-border-shimmer" sx={{ p: 5, display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundImage: 'radial-gradient(circle at top right, rgba(99,102,241,0.15), transparent 60%)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 1 }}>
                <Typography variant="h3" fontWeight={900} letterSpacing="-1px">
                  Welcome back, <span className="glow-text">{user?.name?.split(' ')[0]}</span>
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button 
                    onClick={() => setRefreshKey(k=>k+1)}
                    sx={{ color: '#22D3EE', bgcolor: 'rgba(34,211,238,0.1)', fontWeight: 800, borderRadius: '100px', px: 3, py: 1, '&:hover': { bgcolor: 'rgba(34,211,238,0.2)' } }}
                    startIcon={<RefreshCw size={16} />}
                  >
                    Sync Live
                  </Button>
                </Box>
              </Box>
              <Typography variant="body1" color={isDark ? "rgba(255,255,255,0.6)" : "rgba(15,23,42,0.6)"} mb={4} maxWidth={500} fontSize="1.1rem">
                Your productivity parameters are fully optimized and loaded.
              </Typography>
              {lastUpdated && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                   <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981', boxShadow: '0 0 10px #10B981' }} />
                   <Typography variant="caption" fontWeight={700} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(15,23,42,0.4)"}>
                     System Online • Last Sync: {lastUpdated.toLocaleTimeString()}
                   </Typography>
                </Box>
              )}
            </Box>
            </motion.div>
          </Box>

          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 4' } }}>
             <motion.div variants={fadeUpSpring} style={{ height: '100%' }}>
                <StudyQuoteWidget />
             </motion.div>
          </Box>
          
          {/* Stats Cards Row */}
          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 4' } }}>
            <motion.div variants={fadeUpSpring} style={{ height: '100%' }}>
            <Box onClick={(e) => { if(e.target.closest('button') || e.target.closest('a')) return; navigate('/connections'); }} className="glass-card glow-primary" sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 2.5, cursor: 'pointer' }}>
              <Box sx={{ bgcolor: 'rgba(99,102,241,0.15)', p: 2, borderRadius: '20px', color: '#6366F1' }}>
                <Users size={32} />
              </Box>
              <Box>
                <Typography variant="h3" fontWeight={900} color="#6366F1" mb={0.5} lineHeight={1}>{stats.connections}</Typography>
                <Typography variant="caption" fontWeight={800} color="rgba(255,255,255,0.5)" textTransform="uppercase" letterSpacing={1}>Global Connections</Typography>
              </Box>
            </Box>
            </motion.div>
          </Box>

          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 4' } }}>
            <motion.div variants={fadeUpSpring} style={{ height: '100%' }}>
            <Box onClick={(e) => { if(e.target.closest('button') || e.target.closest('a')) return; navigate('/sessions'); }} className="glass-card glow-purple" sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 2.5, cursor: 'pointer' }}>
              <Box sx={{ bgcolor: 'rgba(139,92,246,0.15)', p: 2, borderRadius: '20px', color: '#8B5CF6' }}>
                <Calendar size={32} />
              </Box>
              <Box>
                <Typography variant="h3" fontWeight={900} color="#8B5CF6" mb={0.5} lineHeight={1}>{stats.sessions}</Typography>
                <Typography variant="caption" fontWeight={800} color="rgba(255,255,255,0.5)" textTransform="uppercase" letterSpacing={1}>Synched Sessions</Typography>
              </Box>
            </Box>
            </motion.div>
          </Box>

          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 4' } }}>
            <motion.div variants={fadeUpSpring} style={{ height: '100%' }}>
            <Box onClick={(e) => { if(e.target.closest('button') || e.target.closest('a')) return; navigate('/connections'); }} className="glass-card glow-accent" sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 2.5, cursor: 'pointer' }}>
              <Box sx={{ bgcolor: 'rgba(34,211,238,0.15)', p: 2, borderRadius: '20px', color: '#22D3EE' }}>
                <Activity size={32} />
              </Box>
              <Box>
                <Typography variant="h3" fontWeight={900} color="#22D3EE" mb={0.5} lineHeight={1}>{stats.pending}</Typography>
                <Typography variant="caption" fontWeight={800} color={isDark ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.5)"} textTransform="uppercase" letterSpacing={1}>Pending Requests</Typography>
              </Box>
            </Box>
            </motion.div>
          </Box>

          {/* Gamification Strip */}
          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 12' } }}>
            <motion.div variants={fadeUpSpring}>
            <Box onClick={(e) => { if(e.target.closest('button') || e.target.closest('a')) return; navigate('/gamification'); }} className="glass-card gradient-border-shimmer" sx={{ p: { xs: 3, md: 4 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, flexWrap: 'wrap', cursor: 'pointer' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1, minWidth: '300px' }}>
                <Box sx={{ position: 'relative' }}>
                  <Box sx={{ 
                    width: 70, height: 70, borderRadius: '35px', border: '3px solid #22D3EE', 
                    boxShadow: '0 0 20px rgba(34,211,238,0.5), inset 0 0 20px rgba(34,211,238,0.2)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isDark ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.8)'
                  }}>
                    <Typography variant="h4" fontWeight={900} color="#22D3EE">{user?.level || 1}</Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                   <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                     <Typography variant="subtitle1" fontWeight={800} color={isDark ? "white" : "#0F172A"}>Level {user?.level || 1} XP Progress</Typography>
                     <Typography variant="subtitle2" fontWeight={800} color="#8B5CF6">{user?.xp || 0} / {((user?.level || 1) * 100)} XP</Typography>
                   </Box>
                   <LinearProgress 
                     variant="determinate" 
                     value={((user?.xp || 0) % 100)} 
                     sx={{ 
                       height: 12, borderRadius: 6, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)', 
                       '& .MuiLinearProgress-bar': { backgroundImage: 'linear-gradient(90deg, #6366F1, #22D3EE)', borderRadius: 6 }
                     }} 
                   />
                </Box>
              </Box>
              <Button component={RouterLink} to="/gamification" sx={{ bgcolor: 'rgba(139,92,246,0.1)', color: '#A78BFA', fontWeight: 800, borderRadius: '100px', px: 4, py: 1.5, '&:hover': { bgcolor: 'rgba(139,92,246,0.2)', boxShadow: '0 0 20px rgba(139,92,246,0.2)' } }}>
                 Weekly Recap
              </Button>
            </Box>
            </motion.div>
          </Box>

          {/* ROW 1: Analytics & Quests */}
          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 8' } }}>
            <motion.div variants={fadeUpSpring} className="glass-card glow-primary" style={{ height: '100%', minHeight: '380px', cursor: 'pointer' }} onClick={(e) => { if(e.target.closest('button') || e.target.closest('a')) return; navigate('/profile'); }}>
              <Box sx={{ p: 4, height: '100%' }}>
                <StudyAnalyticsWidget />
              </Box>
            </motion.div>
          </Box>
          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 4' } }}>
            <motion.div variants={fadeUpSpring} className="glass-card glow-accent" style={{ height: '100%', minHeight: '380px', cursor: 'pointer' }} onClick={(e) => { if(e.target.closest('button') || e.target.closest('a')) return; navigate('/gamification'); }}>
               <Box sx={{ p: 4, height: '100%' }}>
                 <BountiesWidget />
               </Box>
            </motion.div>
          </Box>

          {/* ROW 2: Heatmap & Calendar */}
          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 8' } }}>
            <motion.div variants={fadeUpSpring} className="glass-card" style={{ height: '100%', cursor: 'pointer' }} onClick={(e) => { if(e.target.closest('button') || e.target.closest('a')) return; navigate('/billing'); }}>
              <Box sx={{ p: 5, textAlign: 'center', position: 'relative', height: '100%', minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                 <Typography variant="h6" fontWeight={900} display="flex" alignItems="center" gap={1.5} color={isDark ? "white" : "#0F172A"} mb={3} zIndex={2}>
                    <BookOpen size={20} color="#22D3EE" /> Global Study Heatmap
                 </Typography>
                 <Box sx={{ position: 'absolute', inset: 0, filter: 'blur(24px)', opacity: isDark ? 0.2 : 0.4, background: 'linear-gradient(45deg, #6366F1, #22D3EE)', borderRadius: 'inherit', zIndex: 0 }} />
                 <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ bgcolor: 'rgba(139,92,246,0.15)', p: 2, borderRadius: '50%', mb: 3 }}>
                       <LockKeyhole size={36} color="#8B5CF6" />
                    </Box>
                    <Typography variant="h5" fontWeight={900} mb={1} color={isDark ? 'white' : '#0F172A'}>Heatmap Insights Locked</Typography>
                    <Typography variant="body1" color={isDark ? "rgba(255,255,255,0.6)" : "rgba(15,23,42,0.6)"} mb={4}>Upgrade to PRO to analyze your study patterns globally.</Typography>
                    <Button variant="contained" sx={{ backgroundImage: 'linear-gradient(90deg, #6366F1, #8B5CF6)', color: 'white', fontWeight: 800, borderRadius: '100px', px: 4, py: 1.5, '&:hover': { opacity: 0.9, boxShadow: '0 0 30px rgba(99,102,241,0.5)' } }}>
                      Unlock Premium Analytics
                    </Button>
                 </Box>
              </Box>
            </motion.div>
          </Box>
          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 4' } }}>
            <motion.div variants={fadeUpSpring} className="glass-card glow-primary" style={{ height: '100%', minHeight: '380px', cursor: 'pointer' }} onClick={(e) => { if(e.target.closest('button') || e.target.closest('a')) return; navigate('/sessions'); }}>
               <Box sx={{ p: 4, height: '100%' }}>
                 <MiniCalendarWidget />
               </Box>
            </motion.div>
          </Box>

          {/* ROW 3: AI & Social & Pomodoro */}
          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 8' }, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 4 }}>
              <motion.div variants={fadeUpSpring} style={{ height: '100%' }}>
                  <Box className="glass-card glow-purple" sx={{ p: 4, height: '100%' }}>
                    <AIInsightsWidget />
                  </Box>
              </motion.div>
              
              <motion.div variants={fadeUpSpring} style={{ height: '100%' }}>
                  <Box className="glass-card glow-accent" sx={{ p: 4, height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={(e) => { if(e.target.closest('button') || e.target.closest('a')) return; navigate('/browse'); }}>
                    <Typography variant="h6" fontWeight={900} display="flex" alignItems="center" gap={1.5} color={isDark ? "white" : "#0F172A"} mb={4} width="100%">
                       <MessageCircle size={20} color="#22D3EE" /> Community Sync
                    </Typography>
                    <Box sx={{ bgcolor: 'rgba(34,211,238,0.1)', p: 3, borderRadius: '50%', mb: 3 }}>
                      <CheckCircle size={48} color="#22D3EE" />
                    </Box>
                    <Typography variant="h5" fontWeight={800} mb={1} color={isDark ? 'white' : '#0F172A'}>Inbox Zero</Typography>
                    <Typography variant="body2" color={isDark ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.5)"} mb={3}>All requests have been processed.</Typography>
                    <Button component={RouterLink} to="/browse" variant="outlined" endIcon={<ChevronRight size={16} />} sx={{ borderColor: 'rgba(34,211,238,0.3)', color: '#22D3EE', borderRadius: '100px', fontWeight: 800, '&:hover': { bgcolor: 'rgba(34,211,238,0.1)', borderColor: '#22D3EE' } }}>
                      Find Peers
                    </Button>
                  </Box>
              </motion.div>
          </Box>
          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 4' } }}>
            <motion.div variants={fadeUpSpring} className="glass-card glow-purple" style={{ height: '100%', minHeight: '420px', cursor: 'pointer' }} onClick={(e) => { if(e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return; navigate('/focus'); }}>
               <Box sx={{ p: 4, height: '100%' }}>
                 <FocusTimerWidget />
               </Box>
            </motion.div>
          </Box>

        </Box>
      </Box>
    </Box>
  );
}