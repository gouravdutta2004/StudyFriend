import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Flame, Star, Target, Plus, CheckCircle, Circle, X as XIcon, Zap, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { Box, Card, CardContent, Typography, Grid, Button, TextField, LinearProgress, IconButton, useTheme, Chip, Stack } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import WeeklyRecapModal from './profile/WeeklyRecapModal';
import FloatingTooltip from './FloatingTooltip';
import ActionDropdown from './ActionDropdown';
import { initAOS } from '../utils/aosConfig';

export default function GamificationDashboard() {
  const { user, setUser } = useAuth();
  const theme = useTheme();
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [isAddingGoal, setIsAddingGoal] = useState(false);

  const streak = user?.streak || 0;
  const badges = user?.badges || [];
  const goals = user?.weeklyGoals || [];
  const xp = user?.xp || 0;
  const level = user?.level || 1;
  const xpProgress = xp % 100; 

  const analyticsData = [
    { day: 'Mon', hours: Math.round(Math.max(1, (user?.studyHours || 5) * 0.1)) },
    { day: 'Tue', hours: Math.round(Math.max(1.5, (user?.studyHours || 5) * 0.15)) },
    { day: 'Wed', hours: Math.round(Math.max(2, (user?.studyHours || 5) * 0.2)) },
    { day: 'Thu', hours: Math.round(Math.max(1.5, (user?.studyHours || 5) * 0.15)) },
    { day: 'Fri', hours: Math.round(Math.max(3, (user?.studyHours || 5) * 0.3)) },
    { day: 'Sat', hours: Math.round(Math.max(4, (user?.studyHours || 5) * 0.4)) },
    { day: 'Sun', hours: Math.round((user?.studyHours || 5) * 0.5) },
  ];

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoalTitle || !newGoalTarget) return toast.error('Please fill all fields');
    try {
      const res = await api.post('/gamification/goals', { title: newGoalTitle, targetHours: Number(newGoalTarget) });
      setUser({ ...user, weeklyGoals: res.data });
      setIsAddingGoal(false);
      setNewGoalTitle('');
      setNewGoalTarget('');
      toast.success('Goal added!');
    } catch (err) { toast.error('Failed to add goal'); }
  };

  const handleAddProgress = async (goalId) => {
    try {
      const res = await api.put(`/gamification/goals/${goalId}`, { addedHours: 1 });
      setUser({ ...user, weeklyGoals: res.data });
      toast.success('Logged 1 hour of study!');
    } catch (err) { toast.error('Failed to update progress'); }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      const res = await api.delete(`/gamification/goals/${goalId}`);
      setUser({ ...user, weeklyGoals: res.data });
      toast.success('Goal deleted');
    } catch (err) { toast.error('Failed to delete goal'); }
  };

  const [quests, setQuests] = useState([]);
  const [recapOpen, setRecapOpen] = useState(false);

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const res = await api.get('/gamification/quests');
        setQuests(res.data);
      } catch (err) { console.error('Failed to load quests', err); }
    };
    fetchQuests();
    initAOS();
  }, []);

  const handleCompleteQuest = async (questId) => {
    try {
      const res = await api.put(`/gamification/quests/${questId}`);
      setQuests(q => q.map(x => x._id === questId ? res.data : x));
      toast.success('Quest completed! +50 XP');
      const newXp = (user.xp || 0) + 50;
      setUser({ ...user, xp: newXp, level: Math.floor(newXp / 100) + 1 });
    } catch (err) { toast.error('Failed to complete quest'); }
  };

  return (
    <Box className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <WeeklyRecapModal open={recapOpen} onClose={() => setRecapOpen(false)} />
      
      {/* Asymmetric 12-Column Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-8">
        
        {/* Hero Banner: Level & XP - Full Width */}
        <div className="md:col-span-6 lg:col-span-12" data-aos="fade-up" data-aos-delay="100">
          <Card 
            component={motion.div} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl md:rounded-3xl border border-white/10"
            sx={{ 
              background: 'linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(124,58,237,0.1) 100%)', 
              backdropFilter: 'blur(20px)'
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={2} sx={{ textAlign: 'center' }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <Box sx={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid', borderColor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper', boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}>
                      <Typography variant="h4" fontWeight={900} color="primary.main">{level}</Typography>
                    </Box>
                  </Box>
                  <Typography variant="subtitle2" fontWeight={800} mt={1} color="text.secondary" textTransform="uppercase">Current Level</Typography>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="h6" fontWeight={800} display="flex" alignItems="center" gap={1}><Zap size={20} color={theme.palette.warning.main} /> {xp} XP Total</Typography>
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary">{100 - (xp % 100)} XP to Next Level</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={xpProgress} sx={{ height: 14, borderRadius: 7, bgcolor: 'rgba(0,0,0,0.1)', '& .MuiLinearProgress-bar': { borderRadius: 7, backgroundImage: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)' } }} />
                </Grid>
                <Grid item xs={12} md={2} sx={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Button variant="contained" color="secondary" onClick={() => setRecapOpen(true)} sx={{ borderRadius: '100px', fontWeight: 800, textTransform: 'none', boxShadow: theme.shadows[10], p: 1.5 }}>
                      Weekly Recap
                   </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </div>

        {/* Study Analytics Chart - Large Feature (7 cols) */}
        <div className="md:col-span-4 lg:col-span-7" data-aos="fade-right" data-aos-delay="200">
          <Card className="h-full rounded-2xl md:rounded-3xl border border-white/10">
            <CardContent sx={{ p: { xs: 2.5, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={800} display="flex" alignItems="center" gap={1.5}>
                  <TrendingUp size={24} color={theme.palette.primary.main} /> Study Velocity
                </Typography>
                <FloatingTooltip content="14% increase from last week" placement="left">
                  <Chip 
                    icon={<TrendingUp size={16} />} 
                    label="+14% Flow" 
                    sx={{ bgcolor: 'rgba(59,130,246,0.1)', color: theme.palette.primary.main, fontWeight: 800, borderRadius: 2 }} 
                  />
                </FloatingTooltip>
              </Box>
              <Box sx={{ flex: 1, minHeight: 250, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8fafc', p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                    <XAxis dataKey="day" stroke={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      cursor={{ stroke: theme.palette.primary.main, strokeWidth: 2, strokeDasharray: '5 5', fill: 'transparent' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff', color: theme.palette.text.primary, fontWeight: 700 }}
                    />
                    <Area type="monotone" dataKey="hours" stroke={theme.palette.primary.main} strokeWidth={4} fillOpacity={1} fill="url(#colorHours)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </div>

        {/* Achievements & Badges - Compact Sidebar (5 cols) */}
        <div className="md:col-span-2 lg:col-span-5" data-aos="fade-left" data-aos-delay="250">
          <Card className="h-full rounded-2xl md:rounded-3xl border border-white/10">
            <CardContent sx={{ p: { xs: 2.5, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={800} display="flex" alignItems="center" gap={1.5}>
                  <Flame size={24} color={theme.palette.warning.main} /> Achievements
                </Typography>
                <FloatingTooltip content="Your current study streak" placement="left">
                  <Chip 
                    icon={<Flame size={16} color="#ea580c"/>} 
                    label={`${streak} Day Streak`} 
                    sx={{ bgcolor: 'rgba(249,115,22,0.1)', color: '#ea580c', fontWeight: 800, borderRadius: 2 }} 
                  />
                </FloatingTooltip>
              </Box>

              <Box sx={{ flex: 1, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8fafc', p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" fontWeight={800} color="text.secondary" display="block" mb={2} textTransform="uppercase">Unlocked Badges ({badges.length})</Typography>
                <Stack direction="row" flexWrap="wrap" gap={1.5}>
                  {badges.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">No badges earned yet. Complete sessions to unlock!</Typography>
                  ) : (
                    badges.map((badge, idx) => (
                      <Box key={idx} sx={{ 
                        p: 1.5, px: 2, display: 'flex', alignItems: 'center', gap: 1, borderRadius: 3,
                        background: theme.palette.mode === 'dark' ? 'rgba(30,41,59,0.7)' : 'white', 
                        backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)', transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-2px)' }
                      }}>
                        <Star size={18} color="#eab308" style={{ fill: '#fef08a' }} />
                        <Typography variant="subtitle2" fontWeight={700} color="text.primary">{badge}</Typography>
                      </Box>
                    ))
                  )}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </div>

        {/* Daily Quests - Tall Priority Card (5 cols) */}
        <div className="md:col-span-3 lg:col-span-5" data-aos="zoom-in" data-aos-delay="300">
          <Card className="h-full rounded-2xl md:rounded-3xl border border-white/10" sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.02)' }}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" fontWeight={800} display="flex" alignItems="center" gap={1.5}>
                  <Target size={24} color={theme.palette.primary.main} /> Daily Quests
                </Typography>
                <FloatingTooltip content="Complete quests to earn XP" placement="left">
                  <Chip 
                    label={`${quests.filter(q => q.isCompleted).length}/${quests.length} Completed`} 
                    color="primary" 
                    sx={{ fontWeight: 800, borderRadius: 2 }} 
                  />
                </FloatingTooltip>
              </Box>

              <Grid container spacing={2}>
                {quests.map((quest) => (
                  <Grid item xs={12} key={quest._id}>
                    <Box sx={{
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'white',
                      p: 2, borderRadius: 3, border: 1, borderColor: quest.isCompleted ? 'success.main' : 'divider',
                      display: 'flex', alignItems: 'center', gap: 2, transition: 'all 0.2s',
                    }}>
                      <IconButton 
                        onClick={() => !quest.isCompleted && handleCompleteQuest(quest._id)}
                        sx={{ bgcolor: quest.isCompleted ? 'success.light' : 'action.hover', color: quest.isCompleted ? 'success.dark' : 'text.disabled' }}
                        disabled={quest.isCompleted}
                      >
                        {quest.isCompleted ? <CheckCircle size={24} /> : <Circle size={24} />}
                      </IconButton>
                      <Box flex={1}>
                        <Typography variant="subtitle2" fontWeight={700} color={quest.isCompleted ? 'text.secondary' : 'text.primary'} sx={{ textDecoration: quest.isCompleted ? 'line-through' : 'none' }}>
                          {quest.task}
                        </Typography>
                        <Typography variant="caption" color="primary" fontWeight={800}>+50 XP</Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Goals - Wide Card (7 cols) */}
        <div className="md:col-span-3 lg:col-span-7" data-aos="fade-up" data-aos-delay="350">
          <Card className="h-full rounded-2xl md:rounded-3xl border border-white/10">
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" fontWeight={800} display="flex" alignItems="center" gap={1.5}>
                  <Target size={24} color={theme.palette.success.main} /> Weekly Objectives
                </Typography>
                <Button onClick={() => setIsAddingGoal(!isAddingGoal)} variant="outlined" color="primary" size="small" startIcon={<Plus size={16} />} sx={{ fontWeight: 700, borderRadius: 2 }}>
                  Set Objective
                </Button>
              </Box>

              {isAddingGoal && (
                <Box component="form" onSubmit={handleAddGoal} sx={{ mb: 4, bgcolor: 'background.default', p: 3, borderRadius: 3, border: 1, borderColor: 'divider' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" placeholder="Goal Title (e.g. Master Calculus)" value={newGoalTitle} onChange={e => setNewGoalTitle(e.target.value)} />
                    </Grid>
                    <Grid item xs={8} sm={9}>
                      <TextField fullWidth size="small" type="number" placeholder="Target Hrs/Wk" inputProps={{ min: 1 }} value={newGoalTarget} onChange={e => setNewGoalTarget(e.target.value)} />
                    </Grid>
                    <Grid item xs={4} sm={3}>
                      <Button type="submit" variant="contained" fullWidth sx={{ height: '100%', fontWeight: 700 }}>Commit</Button>
                    </Grid>
                  </Grid>
                </Box>
              )}

              <Grid container spacing={2}>
                {goals.length === 0 ? (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" fontStyle="italic" textAlign="center" py={2}>No active objectives. Discipline begins with a target!</Typography>
                  </Grid>
                ) : (
                  goals.map((goal) => (
                    <Grid item xs={12} key={goal._id}>
                      <Box sx={{
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                        p: 2.5, borderRadius: 3, border: 1, borderColor: goal.isCompleted ? 'success.main' : 'divider',
                        position: 'relative', transition: 'all 0.2s', 
                        '&:hover': { borderColor: 'primary.main' }
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {goal.isCompleted ? <CheckCircle size={20} color={theme.palette.success.main} /> : <Circle size={20} color={theme.palette.text.disabled} />}
                            <Typography variant="subtitle1" fontWeight={700} sx={{ textDecoration: goal.isCompleted ? 'line-through' : 'none', color: goal.isCompleted ? 'text.secondary' : 'text.primary' }}>
                              {goal.title}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label={`${goal.currentHours} / ${goal.targetHours}h`} size="small" sx={{ fontWeight: 800, borderRadius: 1, bgcolor: goal.isCompleted ? 'success.light' : 'primary.light', color: goal.isCompleted ? 'success.dark' : 'primary.dark' }} />
                            <ActionDropdown 
                              options={[
                                {
                                  label: 'Delete Goal',
                                  icon: <XIcon size={16} />,
                                  onClick: () => handleDeleteGoal(goal._id),
                                  danger: true
                                }
                              ]}
                            />
                          </Box>
                        </Box>
                        <Box sx={{ mb: goal.isCompleted ? 0 : 2 }}>
                           <LinearProgress variant="determinate" value={Math.min((goal.currentHours / goal.targetHours) * 100, 100)} color={goal.isCompleted ? 'success' : 'primary'} sx={{ height: 8, borderRadius: 4 }} />
                        </Box>
                        {!goal.isCompleted && (
                          <Button fullWidth onClick={() => handleAddProgress(goal._id)} variant="outlined" color="primary" size="small" sx={{ fontWeight: 700, borderRadius: 2 }}>+ Log 1 Hour</Button>
                        )}
                      </Box>
                    </Grid>
                  ))
                )}
              </Grid>
            </CardContent>
          </Card>
        </div>

      </div>
    </Box>
  );
}
