import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Users, Calendar, BookOpen, MessageCircle, TrendingUp, UserPlus, RefreshCw, Clock, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import GamificationDashboard from '../components/GamificationDashboard';
import UserQuickPeek from '../components/UserQuickPeek';
import { motion } from 'framer-motion';
import { Box, Container, Typography, Grid, Card, CardContent, Button, Avatar, Chip, IconButton, CircularProgress, Alert, AlertTitle, Skeleton, useTheme } from '@mui/material';

export default function Dashboard() {
  const { user } = useAuth();
  const theme = useTheme();
  const [stats, setStats] = useState({ connections: 0, sessions: 0, pending: 0 });
  const [recentMatches, setRecentMatches] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    welcomeTitle: "Welcome back, {name}!",
    welcomeSubtitle: "Find your perfect study buddy and achieve your goals together.",
    showQuickActions: true,
    showSuggestedMatches: true,
    showStatCards: true,
    showProfileIncompleteBanner: true
  });

  useEffect(() => {
    if (user?.isAdmin) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [connRes, sessRes, matchRes, setRes] = await Promise.all([
          api.get('/users/connections'),
          api.get('/sessions/my'),
          api.get('/users/matches'),
          api.get('/settings').catch(() => ({ data: settings }))
        ]);
        setStats({
          connections: connRes.data.connections.length,
          sessions: sessRes.data.length,
          pending: connRes.data.pendingRequests.length
        });
        setRecentMatches(matchRes.data.slice(0, 3));
        const now = new Date().getTime();
        setUpcomingSessions(sessRes.data.filter(s => {
          const sessionEnd = new Date(s.startTime).getTime() + (s.duration * 60000);
          return sessionEnd > now;
        }).slice(0, 3));
        setPendingRequests(connRes.data.pendingRequests.slice(0, 3));
        if (setRes.data && Object.keys(setRes.data).length > 0) setSettings(setRes.data);
      } catch {}
      finally { setLoading(false); }
    };
    fetchData();
  }, [user, refreshKey]);

  const navigate = useNavigate();

  const handleAccept = async (userId) => {
    try {
      await api.post(`/users/accept/${userId}`);
      toast.success('Connection accepted!');
      setRefreshKey(prev => prev + 1);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleReject = async (userId) => {
    try {
      await api.post(`/users/reject/${userId}`);
      toast.success('Request rejected');
      setRefreshKey(prev => prev + 1);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const statCards = [
    { label: 'Connections', value: stats.connections, icon: Users, color: theme.palette.primary.main, link: '/connections' },
    { label: 'My Sessions', value: stats.sessions, icon: Calendar, color: theme.palette.success.main, link: '/sessions' },
    { label: 'Pending Requests', value: stats.pending, icon: UserPlus, color: theme.palette.warning.main, link: '/connections' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 4, mb: 3 }} />
            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 4, mb: 3 }} />
            <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 4, mb: 3 }} />
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 4, mb: 3 }} />
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 4, mb: 3 }} />
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  return (
    <Container component={motion.div} variants={containerVariants} initial="hidden" animate="visible" maxWidth="xl" sx={{ py: 3 }}>
      <style>
        {`
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <Grid container spacing={3}>
        {/* ================= LEFT MAIN COLUMN ================= */}
        <Grid size={{ xs: 12, lg: 8 }}>
          
          {/* Hero Section */}
          <Box component={motion.div} variants={itemVariants} sx={{
            mb: 3,
            position: 'relative',
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: theme.shadows[10],
            background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)',
          }}>
            <Box sx={{
              position: 'absolute', inset: 0, opacity: 0.2, mixBlendMode: 'overlay',
              backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")'
            }} />
            <Box sx={{
              p: { xs: 3, sm: 4 },
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 3,
            }}>
              <Box>
                <Typography variant="h3" component="h1" fontWeight={900} color="white" gutterBottom sx={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                  {settings.welcomeTitle.replace('{name}', user?.name?.split(' ')[0] || '')} 👋
                </Typography>
                <Typography variant="h6" color="rgba(255,255,255,0.9)" fontWeight={500} maxWidth={600}>
                  {settings.welcomeSubtitle}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                onClick={() => {
                  setRefreshKey(prev => prev + 1);
                  toast.success('Dashboard Resynced!');
                }}
                disabled={loading}
                startIcon={<RefreshCw size={20} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />}
                sx={{
                  color: 'white', borderColor: 'rgba(255,255,255,0.5)', bgcolor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)', fontWeight: 700, px: 3, py: 1.5, borderRadius: 3,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)', borderColor: 'white' }
                }}
              >
                Sync Live
              </Button>
            </Box>
          </Box>

          {/* Alert Banner */}
          {(settings.showProfileIncompleteBanner !== false) && user?.subjects?.length === 0 && (
            <Box component={motion.div} variants={itemVariants}>
            <Alert
              severity="warning"
              icon={<TrendingUp size={28} />}
              sx={{ mb: 3, borderRadius: 3, alignItems: 'center', boxShadow: theme.shadows[2], '.MuiAlert-message': { width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 } }}
            >
              <Box>
                <AlertTitle sx={{ fontWeight: 800, fontSize: '1.1rem', mb: 0.25 }}>System Offline: Profile Incomplete</AlertTitle>
                <Typography variant="body2" fontWeight={500}>Inject your subjects and metadata to activate the Recommendation Engine!</Typography>
              </Box>
              <Button component={RouterLink} to="/profile/edit" variant="contained" color="warning" sx={{ borderRadius: 2, fontWeight: 700 }}>
                Initialize Profile
              </Button>
            </Alert>
            </Box>
          )}

          {/* Quick Operations Matrix (Dense horizontal list) */}
          {settings.showQuickActions && (
            <Box component={motion.div} variants={itemVariants} sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                {[
                  { to: '/browse', icon: Users, label: 'Browse Matrix', color: '#3b82f6' },
                  { to: '/sessions', icon: Calendar, label: 'Study Sessions', color: '#10b981' },
                  { to: '/messages', icon: MessageCircle, label: 'Comms Link', color: '#8b5cf6' },
                  { to: '/profile/edit', icon: BookOpen, label: 'System Loadout', color: '#f59e0b' },
                ].map(({ to, icon: Icon, label, color }) => (
                  <Grid size={{ xs: 6, sm: 3 }} key={to}>
                    <Button component={RouterLink} to={to} variant="outlined" fullWidth sx={{
                      p: 2, display: 'flex', flexDirection: 'column', gap: 1, borderRadius: 3, borderColor: 'divider', color: 'text.primary',
                      '&:hover': { borderColor: color, bgcolor: `${color}10` }
                    }}>
                      <Icon size={28} color={color} />
                      <Typography variant="caption" fontWeight={800} pt={0.5}>{label}</Typography>
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Gamification Dashboard */}
          <Box component={motion.div} variants={itemVariants} sx={{ mb: 3 }}>
            <GamificationDashboard />
          </Box>

          {/* Upcoming Sessions (Now full width of left column) */}
          <Box component={motion.div} variants={itemVariants}>
            <Card sx={{ height: '100%', borderRadius: 4 }}>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight={800} display="flex" alignItems="center" gap={1}>
                    <Clock size={22} color={theme.palette.success.main} /> Next Sessions
                  </Typography>
                  <Button component={RouterLink} to="/sessions" size="small" variant="text" sx={{ fontWeight: 700 }}>Agenda</Button>
                </Box>

                {upcomingSessions.length === 0 ? (
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 3, color: 'text.secondary' }}>
                    <Avatar sx={{ bgcolor: 'action.hover', width: 64, height: 64, mb: 2 }}>
                      <Calendar size={32} color={theme.palette.text.disabled} />
                    </Avatar>
                    <Typography variant="body2" fontWeight={600}>No upcoming sessions.</Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {upcomingSessions.map(session => {
                      const isOngoing = new Date(session.startTime).getTime() <= new Date().getTime();
                      return (
                      <Grid size={{ xs: 12, sm: 6 }} key={session._id}>
                        <Box sx={{
                          display: 'flex', alignItems: 'flex-start', gap: 2, p: 2,
                          borderRadius: 3, bgcolor: 'background.default', border: 1, borderColor: 'divider',
                          transition: 'border-color 0.2s', '&:hover': { borderColor: 'success.main' }
                        }}>
                          <Box sx={{ bgcolor: 'success.light', color: 'success.dark', px: 1.5, py: 1, borderRadius: 2, textAlign: 'center', minWidth: 60 }}>
                            <Typography variant="caption" fontWeight={800} display="block" sx={{ textTransform: 'uppercase' }}>
                              {new Date(session.startTime).toLocaleDateString('en-US', { month: 'short' })}
                            </Typography>
                            <Typography variant="h6" fontWeight={900} display="block" sx={{ lineHeight: 1 }}>
                              {new Date(session.startTime).getDate()}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight={800} color="text.primary" noWrap>{session.title}</Typography>
                            <Chip size="small" label={session.subject} sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, mt: 0.5 }} />
                          </Box>
                          <Button component={RouterLink} to={`/study-room/${session._id}`} variant={isOngoing ? "contained" : "outlined"} color={isOngoing ? "error" : "success"} size="small" sx={{ borderRadius: 2, fontWeight: 700 }}>
                            {isOngoing ? 'Enter Live' : 'Join'}
                          </Button>
                        </Box>
                      </Grid>
                    )})}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Box>

        </Grid>

        {/* ================= RIGHT SIDEBAR COLUMN ================= */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Stats Cards (Stacked Vertically) */}
            {settings.showStatCards && (
              <Box component={motion.div} variants={itemVariants}>
                <Grid container spacing={2}>
                  {statCards.map(({ label, value, icon: Icon, color, link }) => (
                    <Grid size={{ xs: 12, sm: 4, lg: 12 }} key={label}>
                      <Card component={RouterLink} to={link} sx={{
                        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2, p: 2,
                        borderRadius: 3, transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.shadows[4] }
                      }}>
                        <Box sx={{ bgcolor: `${color}15`, p: 1.5, borderRadius: 2, color: color, display: 'flex' }}>
                          <Icon size={24} />
                        </Box>
                        <Box>
                          <Typography variant="h5" fontWeight={900} color="text.primary" lineHeight={1.2}>{value}</Typography>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">{label}</Typography>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Suggested Matches */}
            {settings.showSuggestedMatches && (
              <Box component={motion.div} variants={itemVariants}>
                <Card sx={{ borderRadius: 4 }}>
                  <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight={800} display="flex" alignItems="center" gap={1}>
                        <TrendingUp size={20} color={theme.palette.primary.main} /> Suggestions
                      </Typography>
                      <Button component={RouterLink} to="/matches" size="small" variant="text" sx={{ fontWeight: 700 }}>Expand</Button>
                    </Box>
                    
                    {recentMatches.length === 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, color: 'text.secondary' }}>
                        <Avatar sx={{ bgcolor: 'action.hover', width: 48, height: 48, mb: 1 }}>
                          <Users size={24} color={theme.palette.text.disabled} />
                        </Avatar>
                        <Typography variant="caption" fontWeight={600}>Matrix requires more data.</Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {recentMatches.map(match => (
                          <Box key={match._id} sx={{
                            display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                            borderRadius: 3, bgcolor: 'background.default', border: 1, borderColor: 'divider',
                            transition: 'border-color 0.2s', '&:hover': { borderColor: 'primary.main' }
                          }}>
                            <UserQuickPeek userId={match._id}>
                              <Avatar src={match.avatar} sx={{ width: 40, height: 40, bgcolor: 'primary.light', fontWeight: 'bold' }}>
                                {match.name[0]}
                              </Avatar>
                            </UserQuickPeek>
                            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                              <Typography variant="subtitle2" fontWeight={700} color="text.primary" noWrap>{match.name}</Typography>
                              <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap>
                                {match.subjects?.slice(0, 2).join(', ')}
                              </Typography>
                            </Box>
                            <Button component={RouterLink} to={`/user/${match._id}`} variant="outlined" size="small" sx={{ borderRadius: 2, fontWeight: 700, px: 1, minWidth: 0 }}>
                              Trgt
                            </Button>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* Pending Requests */}
            <Box component={motion.div} variants={itemVariants}>
              <Card sx={{ borderRadius: 4 }}>
                <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight={800} display="flex" alignItems="center" gap={1}>
                      <UserPlus size={20} color={theme.palette.warning.main} /> Comm Links
                    </Typography>
                    <Button component={RouterLink} to="/connections" size="small" variant="text" sx={{ fontWeight: 700 }}>Review</Button>
                  </Box>
                  
                  {pendingRequests.length === 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, color: 'text.secondary' }}>
                      <Avatar sx={{ bgcolor: 'action.hover', width: 48, height: 48, mb: 1 }}>
                        <Check size={24} color={theme.palette.text.disabled} />
                      </Avatar>
                      <Typography variant="caption" fontWeight={600}>All requests cleared!</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {pendingRequests.map(req => (
                        <Box key={req._id} sx={{
                          display: 'flex', alignItems: 'center', gap: 1, p: 1.5,
                          borderRadius: 3, bgcolor: 'background.default', border: 1, borderColor: 'divider'
                        }}>
                          <UserQuickPeek userId={req._id}>
                            <Avatar src={req.avatar} sx={{ width: 40, height: 40, bgcolor: 'warning.light', color: 'warning.main', fontWeight: 'bold' }}>
                              {req.name?.[0]}
                            </Avatar>
                          </UserQuickPeek>
                          <Box sx={{ flex: 1, overflow: 'hidden' }}>
                            <Typography variant="subtitle2" fontWeight={700} color="text.primary" noWrap>{req.name}</Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap>Sync request pending</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton onClick={() => handleAccept(req._id)} size="small" sx={{ p: 0.5, bgcolor: 'success.light', color: 'success.main', '&:hover': { bgcolor: 'success.main', color: 'white' } }}>
                              <Check size={16} />
                            </IconButton>
                            <IconButton onClick={() => handleReject(req._id)} size="small" sx={{ p: 0.5, bgcolor: 'error.light', color: 'error.main', '&:hover': { bgcolor: 'error.main', color: 'white' } }}>
                              <X size={16} />
                            </IconButton>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>

          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}