import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Trash2, Shield, ShieldOff, CheckCircle, XCircle, Pencil, UserPlus, X, Users, Link2, Ban, Check, Activity, BarChart2, MessageSquare, MessageCircle, BookOpen, Sliders, Search, Sun, Moon, Mail, RefreshCw, Cpu, Database, Menu as MenuIcon, LogOut, Flame, Trophy, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import EditProfile from './EditProfile';
import Messages from './Messages';
import GlobalAnnouncementBanner from '../components/GlobalAnnouncementBanner';
import UserQuickPeek from '../components/UserQuickPeek';
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Container, Grid, Card, CardContent, TextField, Button, Avatar, Chip, Dialog, DialogTitle, DialogContent, DialogActions, 
  Switch, FormControlLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, Tooltip, 
  Select, MenuItem, InputAdornment, useTheme, BottomNavigation, BottomNavigationAction, Tabs, Tab
} from '@mui/material';

const drawerWidth = 260;

export default function AdminPanel() {
  const { theme, toggleTheme } = useCustomTheme();
  const muiTheme = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.adminRole || 'Super Admin';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [activeUserTab, setActiveUserTab] = useState('regular');
  const [activeModerationTab, setActiveModerationTab] = useState('reports');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userFilter, setUserFilter] = useState('all');
  
  const [users, setUsers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [siteConfig, setSiteConfig] = useState({ welcomeTitle: 'Welcome back, {name}! 👋', welcomeSubtitle: 'Find your perfect study buddy and achieve your goals together.', showQuickActions: true, showSuggestedMatches: true, showStatCards: true, showProfileIncompleteBanner: true, announcementBannerActive: false, announcementBannerText: '', emailTemplateWelcome: '', emailTemplateReset: '', emailTemplateBroadcast: '' });
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', isAdmin: false, isActive: true });
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ subject: '', message: '', targetUsers: 'all' });
  const [newSubject, setNewSubject] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [dashboardStats, setDashboardStats] = useState({ totalUsers: 0, activeSessions: 0, reports: 0, dau: 0, dropOffs: 0 });
  const [growthData, setGrowthData] = useState([]);
  const [sessionStats, setSessionStats] = useState({ popularSubjects: [], peakHours: [] });
  const [systemHealth, setSystemHealth] = useState({ status: 'healthy', uptime: 0, dbState: 1, cpuUsage: 0, memoryUsage: 0, totalMem: 0 });
  const [auditLogs, setAuditLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [openBadgeDialog, setOpenBadgeDialog] = useState(false);
  const [badgeInput, setBadgeInput] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, connRes, subRes, confRes, dashRes, growthRes, sessRes, healthRes, reportsRes, auditRes, flaggedRes, lbRes] = await Promise.all([
        api.get('/admin/users'), api.get('/admin/connections'), api.get('/admin/subjects'), api.get('/settings').catch(() => ({ data: {} })),
        api.get('/admin/analytics/dashboard').catch(() => ({ data: {} })), api.get('/admin/analytics/growth').catch(() => ({ data: [] })),
        api.get('/admin/analytics/sessions').catch(() => ({ data: [] })), api.get('/admin/health').catch(() => ({ data: {} })),
        api.get('/admin/reports').catch(() => ({ data: [] })), api.get('/admin/audit-logs').catch(() => ({ data: [] })),
        api.get('/admin/content-scan').catch(() => ({ data: [] })),
        api.get('/admin/gamification/leaderboard').catch(() => ({ data: [] }))
      ]);
      setUsers(userRes.data); setConnections(connRes.data); setSubjects(subRes.data);
      if (confRes.data && Object.keys(confRes.data).length > 0) setSiteConfig(confRes.data);
      if (dashRes.data && Object.keys(dashRes.data).length > 0) setDashboardStats(dashRes.data);
      setGrowthData(growthRes.data); setSessionStats(sessRes.data);
      if (healthRes.data && Object.keys(healthRes.data).length > 0) setSystemHealth(healthRes.data);
      setReports(reportsRes.data); setAuditLogs(auditRes.data); setFlaggedContent(flaggedRes.data);
      setLeaderboard(lbRes.data);
    } catch { toast.error('Failed to load dashboard metrics'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDrawerToggle = () => { setMobileOpen(!mobileOpen); };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleAdmin = async (id, currentStatus, email) => {
    if (email === 'admin@test.com') return toast.error('Cannot revoke Super Admin privileges');
    try { await api.put(`/admin/users/${id}`, { isAdmin: !currentStatus }); toast.success(`User admin privileges updated`); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  const toggleBlock = async (id, currentStatus, email) => {
    if (email === 'admin@test.com') return toast.error('Cannot block Super Admin');
    try { await api.put(`/admin/users/${id}`, { isActive: !currentStatus }); toast.success(`User access updated`); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Block action failed'); }
  };

  const deleteUser = async (id) => {
    // if (!window.confirm('Permanently delete this user?')) return;
    try { await api.delete(`/admin/users/${id}`); toast.success('User deleted'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.post('/admin/users', form); toast.success('User created'); setShowModal(false); setForm({ name: '', email: '', password: '', isAdmin: false, isActive: true }); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to create user'); }
    finally { setSaving(false); }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.post('/admin/broadcast', broadcastForm); toast.success('Mass Email Dispatched!'); setShowBroadcastModal(false); setBroadcastForm({ subject: '', message: '', targetUsers: 'all' }); }
    catch (err) { toast.error(err.response?.data?.message || 'Email broadcast failed.'); }
    finally { setSaving(false); }
  };

  const handleBulkAction = async (action) => {
    if (!selectedUserIds.length || !window.confirm(`Bulk ${action} ${selectedUserIds.length} users?`)) return;
    setSaving(true);
    try { await api.post('/admin/users/bulk', { userIds: selectedUserIds, action }); toast.success(`Executed bulk ${action}`); setSelectedUserIds([]); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Bulk action failed'); }
    finally { setSaving(false); }
  };

  const severConnection = async (userA, userB) => {
    if (!window.confirm('Sever this connection?')) return;
    try { await api.delete(`/admin/connections/${userA}/${userB}`); toast.success('Connection severed'); fetchData(); }
    catch (err) { toast.error('Failed to sever connection'); }
  };

  const updateFeedback = async (id, newStatus) => {
    try { await api.put(`/admin/reports/${id}`, { status: newStatus }); toast.success(`Report marked ${newStatus}`); fetchData(); }
    catch (err) { toast.error('Update failed'); }
  };

  const handleModerationAction = async (userId, action) => {
    try {
      if (action === 'warn') { await api.post('/admin/broadcast', { targetUsers: [userId], subject: 'Official Warning', message: 'Violation detected. Please adjust behavior.' }); toast.success('Warning dispatched'); }
      else if (action === 'block') { await api.put(`/admin/users/${userId}`, { isActive: false }); toast.success('Account suspended'); fetchData(); }
    } catch (err) { toast.error('Moderation action failed'); }
  };

  const updateFlaggedItem = async (id, newStatus, userId, action) => {
    try { if (action) await handleModerationAction(userId, action); await api.put(`/admin/flagged-items/${id}`, { status: newStatus }); toast.success(`Resolved.`); fetchData(); }
    catch (err) { toast.error('Resolution failed'); }
  };

  const createSubject = async (e) => {
    e.preventDefault();
    try { await api.post('/admin/subjects', { name: newSubject }); toast.success('Global Subject created'); setNewSubject(''); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to add subject'); }
  };

  const deleteSubject = async (id) => {
    if (role !== 'Super Admin') return toast.error('Access Denied');
    if (!window.confirm('Delete Subject?')) return;
    try { await api.delete(`/admin/subjects/${id}`); toast.success('Subject erased'); fetchData(); }
    catch (err) { toast.error('Deletion failed'); }
  };

  const updateSiteConfig = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.put('/settings', siteConfig); toast.success('Config synchronized globally'); }
    catch { toast.error('Failed to sync configs'); }
    finally { setSaving(false); }
  };

  const exportUsersCSV = () => {
    const headers = ['Database ID', 'Name', 'Email', 'Active Status', 'Subjects', 'Study Style', 'Location', 'Member Since'];
    const csvContent = [headers.join(','), ...filteredRegularUsers.map(u => [`"${u._id}"`, `"${u.name}"`, `"${u.email}"`, u.isActive ? 'Active' : 'Banned', `"${(u.subjects || []).join('; ')}"`, `"${u.studyStyle || 'N/A'}"`, `"${u.location || 'N/A'}"`, `"${new Date(u.createdAt).toLocaleDateString()}"`].join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'studybuddy_users.csv'; anchor.click(); URL.revokeObjectURL(url);
    toast.success('Exported CSV');
  };

  const admins = users.filter(u => u.isAdmin);
  let regularUsers = users.filter(u => !u.isAdmin);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  if (userFilter === 'dau') {
    regularUsers = regularUsers.filter(u => new Date(u.lastStudyDate) >= startOfToday);
  } else if (userFilter === 'dropoffs') {
    regularUsers = regularUsers.filter(u => !u.subjects?.length || !u.studyStyle);
  }

  const getValuesDeep = (obj) => {
    if (typeof obj === 'string') return obj.toLowerCase() + ' ';
    if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj).toLowerCase() + ' ';
    if (Array.isArray(obj)) return obj.map(getValuesDeep).join('');
    if (typeof obj === 'object' && obj !== null) return Object.values(obj).map(getValuesDeep).join('');
    return '';
  };
  const deepSearch = (obj, term) => !term || getValuesDeep(obj).includes(term.toLowerCase());

  const filteredAdmins = admins.filter(u => deepSearch(u, searchQuery));
  const filteredRegularUsers = regularUsers.filter(u => deepSearch(u, searchQuery));
  const filteredConnections = connections.filter(conn => deepSearch(conn, searchQuery));
  const filteredSubjects = subjects.filter(s => deepSearch(s, searchQuery));

  const statCards = [
    { label: 'Total Accounts', value: dashboardStats.totalUsers || regularUsers.length, icon: Users, color: muiTheme.palette.primary.main, bg: muiTheme.palette.primary.light },
    { label: 'Daily Active (DAU)', value: dashboardStats.dau || 0, icon: Sun, color: muiTheme.palette.warning.main, bg: muiTheme.palette.warning.light },
    { label: 'Onboarding Drops', value: dashboardStats.dropOffs || 0, icon: XCircle, color: muiTheme.palette.error.main, bg: muiTheme.palette.error.light },
    { label: 'Pending Reports', value: reports.filter(r => r.status === 'pending').length || dashboardStats.reports || 0, icon: MessageSquare, color: muiTheme.palette.secondary.main, bg: muiTheme.palette.secondary.light },
  ];

  const handleStatClick = (label) => {
    switch (label) {
      case 'Total Accounts': setActiveTab('users'); setActiveUserTab('regular'); setUserFilter('all'); break;
      case 'Daily Active (DAU)': setActiveTab('users'); setActiveUserTab('regular'); setUserFilter('dau'); break;
      case 'Onboarding Drops': setActiveTab('users'); setActiveUserTab('regular'); setUserFilter('dropoffs'); break;
      case 'Pending Reports': setActiveTab('feedback'); setActiveModerationTab('reports'); break;
      default: break;
    }
  };

  const pieData = (sessionStats.popularSubjects || []).map(s => ({ name: s._id || 'Unsorted', value: s.count }));
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const barData = growthData.map(g => ({ name: (g._id || '').substring(5), total: g.users }));
  const peakHoursData = (sessionStats.peakHours || []).map(s => ({ hour: `${s._id}:00`, sessions: s.count })).reverse();

  const menuItems = [
    { id: 'dashboard', icon: BarChart2, label: 'Analytics', roles: ['Super Admin', 'Moderator'] },
    { id: 'gamification', icon: Trophy, label: 'Leaderboards', roles: ['Super Admin', 'Moderator'] },
    { id: 'users', icon: Users, label: 'Manage Entities', roles: ['Super Admin', 'Moderator'] },
    { id: 'feedback', icon: MessageSquare, label: 'Moderation Hub', roles: ['Super Admin', 'Moderator', 'Support Agent'] },
    { id: 'subjects', icon: BookOpen, label: 'Topics', roles: ['Super Admin', 'Moderator'] },
    { id: 'messages', icon: MessageCircle, label: 'Support Chat', roles: ['Super Admin', 'Support Agent'] },
    { id: 'audit', icon: Shield, label: 'Audit Trail', roles: ['Super Admin', 'Moderator', 'Support Agent'] },
    { id: 'communication', icon: Mail, label: 'Communications', roles: ['Super Admin'] }
  ].filter(t => t.roles.includes(role));

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Toolbar sx={{ px: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Activity color={muiTheme.palette.primary.main} size={28} />
        <Typography variant="h6" fontWeight={800} color="primary">Admin Matrix</Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1, px: 2, py: 2, gap: 1, display: 'flex', flexDirection: 'column' }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton 
              selected={activeTab === item.id} 
              onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
              sx={{ borderRadius: 2, mb: 0.5, '&.Mui-selected': { bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' }, '& .MuiListItemIcon-root': { color: 'inherit' } } }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: activeTab === item.id ? 'inherit' : 'text.secondary' }}>
                <item.icon size={20} />
              </ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: activeTab === item.id ? 700 : 500 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List sx={{ px: 2, pb: 2 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={toggleTheme} sx={{ borderRadius: 2 }}>
            <ListItemIcon sx={{ minWidth: 40 }}><Moon size={20} /></ListItemIcon>
            <ListItemText primary="Toggle Theme" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, color: 'error.main', '&:hover': { bgcolor: 'error.light', color: 'error.dark' }, '& .MuiListItemIcon-root': { color: 'inherit' } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><LogOut size={20} /></ListItemIcon>
            <ListItemText primary="Logout System" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );



  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <GlobalAnnouncementBanner isAdminPreview={true} />
      
      {/* App Bar */}
      <AppBar position="fixed" elevation={0} sx={{ width: { md: `calc(100% - ${drawerWidth}px)` }, ml: { md: `${drawerWidth}px` }, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { md: 'none' }, color: 'text.primary' }}>
            <MenuIcon />
          </IconButton>
          <TextField
            size="small" placeholder="Deep System Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment>, endAdornment: searchQuery ? <InputAdornment position="end"><IconButton size="small" onClick={() => setSearchQuery('')}><X size={16}/></IconButton></InputAdornment> : null, sx: { borderRadius: 4, bgcolor: 'action.hover' } }}
            sx={{ width: { xs: '100%', sm: 300 } }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={() => fetchData()} color="primary" sx={{ mr: 1 }}><RefreshCw size={20} className={loading ? 'animate-spin' : ''}/></IconButton>
          {activeTab === 'users' && role === 'Super Admin' && (
            <Button variant="contained" color="primary" startIcon={<UserPlus size={18}/>} onClick={() => setShowModal(true)} sx={{ borderRadius: 4, fontWeight: 700 }}>
               Add User
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}>
          {drawerContent}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }} open>
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, width: { md: `calc(100% - ${drawerWidth}px)` }, mt: 8 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><RefreshCw className="animate-spin text-blue-500" size={40} /></Box>
        ) : (
          <Box sx={{ animation: 'fadeIn 0.5s ease-in-out' }}>
            
            {/* Analytics Dashboard Matrix Layout */}
            {activeTab === 'dashboard' && (
              <Grid container spacing={3}>
                {/* ================= LEFT MAIN COLUMN (Analytics & Health) ================= */}
                <Grid size={{ xs: 12, lg: 8 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    
                    {/* System Metrics & Health Profile */}
                    <Card sx={{ borderRadius: 3, p: 3 }}>
                      <Typography variant="h6" fontWeight={700} mb={2} display="flex" alignItems="center" gap={1}>
                        <Activity color={muiTheme.palette.success.main} /> System Metrics & Health Profile
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary">Container Uptime</Typography>
                            <Typography variant="h6" fontWeight={800}>{(systemHealth.uptime / 3600).toFixed(2)}h</Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                           <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" display="flex" alignItems="center" gap={0.5}><Cpu size={14}/> CPU Load</Typography>
                            <Typography variant="h6" fontWeight={800} color="warning.main">{systemHealth.cpuUsage}%</Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                           <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" display="flex" alignItems="center" gap={0.5}><Database size={14}/> RAM Allocation</Typography>
                            <Typography variant="h6" fontWeight={800} color="info.main">{systemHealth.memoryUsage}%</Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                           <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary">API Environment</Typography>
                            <Typography variant="h6" fontWeight={800} sx={{ textTransform: 'capitalize' }}>{systemHealth.status}</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Card>

                    {/* Premium Data Visualization Grid */}
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ 
                          borderRadius: 4, p: 3, height: 380, boxShadow: theme === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 24px rgba(149,157,165,0.2)',
                          background: theme === 'dark' ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' : '#ffffff',
                          border: '1px solid', borderColor: 'divider', transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                          '&:hover': { transform: 'translateY(-4px)', boxShadow: theme === 'dark' ? '0 12px 40px rgba(0,0,0,0.5)' : '0 12px 32px rgba(149,157,165,0.3)' }
                        }}>
                          <Typography variant="h6" fontWeight={800} mb={3} display="flex" alignItems="center" gap={1.5}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.dark', display: 'flex' }}><BookOpen size={20} /></Box>
                            Subject Ecosystem Target
                          </Typography>
                          <ResponsiveContainer width="100%" height="80%">
                            <PieChart>
                              <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                              </Pie>
                              <RechartsTooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', color: theme === 'dark' ? '#f8fafc' : '#0f172a', fontWeight: 700 }}
                                itemStyle={{ fontWeight: 800 }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </Card>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ 
                          borderRadius: 4, p: 3, height: 380, boxShadow: theme === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 24px rgba(149,157,165,0.2)',
                          background: theme === 'dark' ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' : '#ffffff',
                          border: '1px solid', borderColor: 'divider', transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                          '&:hover': { transform: 'translateY(-4px)', boxShadow: theme === 'dark' ? '0 12px 40px rgba(0,0,0,0.5)' : '0 12px 32px rgba(149,157,165,0.3)' }
                        }}>
                          <Typography variant="h6" fontWeight={800} mb={3} display="flex" alignItems="center" gap={1.5}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'success.light', color: 'success.dark', display: 'flex' }}><Activity size={20} /></Box>
                            Network Growth Velocity
                          </Typography>
                          <ResponsiveContainer width="100%" height="80%">
                            <AreaChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={muiTheme.palette.success.main} stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor={muiTheme.palette.success.main} stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                              <XAxis dataKey="name" stroke={theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} fontSize={12} tickLine={false} axisLine={false} dy={10} />
                              <YAxis stroke={theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} fontSize={12} tickLine={false} axisLine={false} />
                              <RechartsTooltip 
                                cursor={{ stroke: muiTheme.palette.success.main, strokeWidth: 2, strokeDasharray: '5 5', fill: 'transparent' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', color: theme === 'dark' ? '#f8fafc' : '#0f172a', fontWeight: 700 }}
                              />
                              <Area type="monotone" dataKey="total" stroke={muiTheme.palette.success.main} strokeWidth={4} fillOpacity={1} fill="url(#colorGrowth)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </Card>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                {/* ================= RIGHT SIDEBAR COLUMN (Stat Cards) ================= */}
                <Grid size={{ xs: 12, lg: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {statCards.map((stat, i) => (
                      <Card key={i} sx={{ 
                        borderRadius: 4, boxShadow: theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.2)' : 2, height: '100%', cursor: 'pointer',
                        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s',
                        bgcolor: theme === 'dark' ? '#1e293b' : 'background.paper',
                        border: '1px solid', borderColor: 'divider',
                        '&:hover': { transform: 'translateY(-4px)', boxShadow: theme === 'dark' ? '0 12px 28px rgba(0,0,0,0.6)' : 6 }
                      }} onClick={() => handleStatClick(stat.label)}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                          <Avatar sx={{ bgcolor: stat.bg, color: stat.color, width: 56, height: 56 }}><stat.icon size={28} /></Avatar>
                          <Box>
                            <Typography variant="h4" fontWeight={800}>{stat.value}</Typography>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase' }}>{stat.label}</Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Grid>

              </Grid>
            )}

            {/* Gamification Engine */}
            {activeTab === 'gamification' && (
              <Box>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h5" fontWeight={800} display="flex" alignItems="center" gap={1.5}>
                    <Trophy size={28} color={muiTheme.palette.warning.main} /> Global Leaderboard & Economy
                  </Typography>
                </Box>
                <Card sx={{ borderRadius: 3 }}>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><b>Rank</b></TableCell>
                          <TableCell><b>User Matrix</b></TableCell>
                          <TableCell align="center"><b>Level</b></TableCell>
                          <TableCell align="center"><b>Total XP</b></TableCell>
                          <TableCell align="center"><b>Streak</b></TableCell>
                          <TableCell><b>Badges Earned</b></TableCell>
                          <TableCell align="right"><b>Admin Controls</b></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {leaderboard.map((u, index) => (
                          <TableRow key={u._id} hover>
                            <TableCell><Typography variant="h6" fontWeight={800} color={index < 3 ? 'warning.main' : 'text.primary'}>#{index + 1}</Typography></TableCell>
                            <TableCell>
                               <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <UserQuickPeek userId={u._id}>
                                    <Avatar src={u.avatar} sx={{ width: 36, height: 36 }}>{u.name[0]}</Avatar>
                                  </UserQuickPeek>
                                  <Box>
                                    <Typography variant="body2" fontWeight={700}>{u.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                                  </Box>
                                </Box>
                            </TableCell>
                            <TableCell align="center"><Chip label={`Lvl ${u.level || 1}`} size="small" color="primary" sx={{ fontWeight: 800, borderRadius: 2 }} /></TableCell>
                            <TableCell align="center"><Typography variant="body2" fontWeight={700}>{u.xp || 0} XP</Typography></TableCell>
                            <TableCell align="center"><Typography variant="body2" fontWeight={700} display="flex" alignItems="center" justifyContent="center" gap={0.5}><Flame size={16} color="#ea580c"/>{u.streak || 0}</Typography></TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                   {(u.badges || []).map((b, i) => <Chip key={i} label={b} size="small" sx={{ fontSize: '0.65rem' }} />)}
                                </Box>
                            </TableCell>
                            <TableCell align="right">
                               <Button size="small" variant="outlined" color="secondary" onClick={() => {
                                  setSelectedUser(u);
                                  setOpenBadgeDialog(true);
                               }}>Award Badge</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </Box>
            )}

    {/* Users / Entities Management */}
            {activeTab === 'users' && (
              <Box>
                <Tabs value={activeUserTab} onChange={(e, val) => setActiveUserTab(val)} sx={{ mb: 3 }}>
                  <Tab label="Standard Users" value="regular" />
                  <Tab label="System Administrators" value="admins" />
                  <Tab label="Global Connections" value="connections" />
                </Tabs>

                {(activeUserTab === 'regular' || activeUserTab === 'admins') && (
                  <Card sx={{ borderRadius: 3 }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
                      <Typography variant="subtitle1" fontWeight={700} display="flex" alignItems="center" gap={1}>
                        <Users size={20} color={muiTheme.palette.primary.main} /> 
                        {activeUserTab === 'admins' ? 'System Administrators' : 'Standard Users'}
                        {userFilter !== 'all' && activeUserTab === 'regular' && (
                          <Chip size="small" label={userFilter === 'dau' ? 'Filter: Daily Active' : 'Filter: Onboarding Drops'} color="primary" onDelete={() => setUserFilter('all')} sx={{ ml: 2, fontWeight: 700 }} />
                        )}
                      </Typography>
                      {activeUserTab === 'regular' && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {selectedUserIds.length > 0 && role === 'Super Admin' && (
                            <>
                              <Button size="small" variant="contained" color="error" startIcon={<Trash2 size={16}/>} onClick={() => handleBulkAction('delete')}>Delete ({selectedUserIds.length})</Button>
                              <Button size="small" variant="outlined" color="warning" startIcon={<Ban size={16}/>} onClick={() => handleBulkAction('block')}>Block</Button>
                              <Button size="small" variant="contained" color="secondary" startIcon={<Mail size={16}/>} onClick={() => { setBroadcastForm({...broadcastForm, targetUsers: selectedUserIds}); setShowBroadcastModal(true); }}>Email</Button>
                            </>
                          )}

                          <Button size="small" variant="outlined" onClick={exportUsersCSV}>Export CSV</Button>
                        </Box>
                      )}
                    </Box>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            {activeUserTab === 'regular' && (
                              <TableCell padding="checkbox">
                                <Checkbox 
                                  checked={filteredRegularUsers.length > 0 && selectedUserIds.length === filteredRegularUsers.length}
                                  onChange={e => setSelectedUserIds(e.target.checked ? filteredRegularUsers.map(u => u._id) : [])}
                                />
                              </TableCell>
                            )}
                            <TableCell><b>Identity</b></TableCell>
                            <TableCell align="center"><b>Status</b></TableCell>
                            <TableCell align="right"><b>Actions</b></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(activeUserTab === 'admins' ? filteredAdmins : filteredRegularUsers).map(u => (
                            <TableRow key={u._id} hover selected={selectedUserIds.includes(u._id)}>
                              {activeUserTab === 'regular' && (
                                <TableCell padding="checkbox">
                                  <Checkbox checked={selectedUserIds.includes(u._id)} onChange={e => {
                                      if (e.target.checked) setSelectedUserIds([...selectedUserIds, u._id]);
                                      else setSelectedUserIds(selectedUserIds.filter(id => id !== u._id));
                                    }}/>
                                </TableCell>
                              )}
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <UserQuickPeek userId={u._id}>
                                    <Avatar src={u.avatar}>{u.name[0]}</Avatar>
                                  </UserQuickPeek>
                                  <Box>
                                    <Typography variant="body2" fontWeight={700} color={u.isActive ? 'text.primary' : 'error'}>{u.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Chip size="small" label={u.isActive ? "Active" : "Banned"} color={u.isActive ? "success" : "error"} variant="outlined" />
                              </TableCell>
                              <TableCell align="right">
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                  <Tooltip title="Edit Data"><IconButton size="small" color="primary" onClick={() => { setSelectedUserId(u._id); setActiveUserTab('edit-user'); }}><Pencil size={18}/></IconButton></Tooltip>
                                  <Tooltip title="Ban/Unban"><IconButton size="small" color="warning" onClick={() => toggleBlock(u._id, u.isActive, u.email)}><Ban size={18}/></IconButton></Tooltip>
                                  {role === 'Super Admin' && activeUserTab === 'regular' && <Tooltip title="Promote"><IconButton size="small" color="secondary" onClick={() => toggleAdmin(u._id, u.isAdmin, u.email)}><Shield size={18}/></IconButton></Tooltip>}
                                  {role === 'Super Admin' && activeUserTab === 'admins' && <Tooltip title="Demote"><IconButton size="small" color="secondary" onClick={() => toggleAdmin(u._id, u.isAdmin, u.email)}><ShieldOff size={18}/></IconButton></Tooltip>}
                                  {role === 'Super Admin' && <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => deleteUser(u._id)} disabled={u.email === 'admin@test.com'}><Trash2 size={18}/></IconButton></Tooltip>}
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                )}

                {activeUserTab === 'connections' && (
                  <Card sx={{ borderRadius: 3 }}>
                    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
                      <Typography variant="subtitle1" fontWeight={700} display="flex" alignItems="center" gap={1}><Link2 size={20} color={muiTheme.palette.success.main} /> Global Connections</Typography>
                    </Box>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell><b>Initiator</b></TableCell>
                            <TableCell align="center"><b>Link</b></TableCell>
                            <TableCell><b>Receiver</b></TableCell>
                            <TableCell align="right"><b>Actions</b></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredConnections.map((conn, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{conn.userA?.name}</TableCell>
                              <TableCell align="center"><Link2 size={16} color="disabled"/></TableCell>
                              <TableCell>{conn.userB?.name}</TableCell>
                              <TableCell align="right">
                                <Button size="small" color="error" startIcon={<Trash2 size={16}/>} onClick={() => severConnection(conn.userA?._id, conn.userB?._id)}>Sever Link</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                )}

                {activeUserTab === 'edit-user' && selectedUserId && (
                  <Card sx={{ borderRadius: 3 }}>
                    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" fontWeight={700}>Administrative Editing Panel</Typography>
                      <Button size="small" startIcon={<X size={16}/>} onClick={() => { setActiveUserTab('regular'); setSelectedUserId(null); }}>Close Panel</Button>
                    </Box>
                    <CardContent>
                      <EditProfile userId={selectedUserId} onComplete={() => { setActiveUserTab('regular'); setSelectedUserId(null); fetchData(); }} />
                    </CardContent>
                  </Card>
                )}
              </Box>
            )}

            {/* Moderation Hub */}
            {activeTab === 'feedback' && (
              <Box>
                <Tabs value={activeModerationTab} onChange={(e, val) => setActiveModerationTab(val)} sx={{ mb: 3 }}>
                  <Tab label="Reported Users Queue" value="reports" />
                  <Tab label={`Automated Content Flags (${flaggedContent.length})`} value="content" />
                </Tabs>

                {activeModerationTab === 'reports' && (
                  <Card sx={{ borderRadius: 3 }}>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell><b>Users</b></TableCell>
                            <TableCell><b>Violation Thread</b></TableCell>
                            <TableCell><b>Status</b></TableCell>
                            <TableCell align="right"><b>Actions</b></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reports.map(r => (
                            <TableRow key={r._id}>
                              <TableCell>
                                <Typography variant="caption" color="text.secondary" display="block">By: {r.reporter?.name}</Typography>
                                <Typography variant="body2" color="error" fontWeight="bold">Target: {r.reportedUser?.name}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={700} sx={{ textTransform: 'capitalize' }}>{r.reason}</Typography>
                                <Typography variant="caption" color="text.secondary" fontStyle="italic">"{r.details || 'None'}"</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip size="small" label={r.status} color={r.status === 'pending' ? 'warning' : r.status === 'reviewed' ? 'secondary' : 'default'} />
                              </TableCell>
                              <TableCell align="right">
                                {r.status === 'pending' && (
                                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap', maxWidth: 200, ml: 'auto' }}>
                                    <Button size="small" variant="outlined" onClick={() => updateFeedback(r._id, 'dismissed')}>Dismiss</Button>
                                    <Button size="small" variant="outlined" color="warning" onClick={() => { handleModerationAction(r.reportedUser?._id, 'warn'); updateFeedback(r._id, 'reviewed'); }}>Warn</Button>
                                    <Button size="small" variant="contained" color="error" onClick={() => { handleModerationAction(r.reportedUser?._id, 'block'); updateFeedback(r._id, 'reviewed'); }}>Suspend</Button>
                                  </Box>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                )}

                {activeModerationTab === 'content' && (
                  <Card sx={{ borderRadius: 3, borderLeft: 6, borderColor: 'error.main' }}>
                    <Box sx={{ p: 2, bgcolor: 'error.50', color: 'error.main' }}>
                      <Typography variant="subtitle1" fontWeight={700} display="flex" alignItems="center" gap={1}><Shield size={20}/> Auto-Flagged Profiles & Chats</Typography>
                    </Box>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell><b>Offender</b></TableCell>
                            <TableCell><b>Intercepted String</b></TableCell>
                            <TableCell align="right"><b>Countermeasures</b></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {flaggedContent.map(f => (
                            <TableRow key={f._id}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold">{f.author?.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{f.author?.email}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="error" fontFamily="monospace">"{f.originalText}"</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>{f.source} {f.recipient && `→ ${f.recipient.name}`}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                  <Button size="small" variant="outlined" onClick={() => updateFlaggedItem(f._id, 'dismissed', null, null)}>Dismiss</Button>
                                  <Button size="small" variant="outlined" color="warning" onClick={() => updateFlaggedItem(f._id, 'reviewed', f.author?._id, 'warn')}>Warn</Button>
                                  <Button size="small" variant="contained" color="error" onClick={() => updateFlaggedItem(f._id, 'reviewed', f.author?._id, 'block')}>Ban</Button>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                )}
              </Box>
            )}

            {/* Support Chat */}
            {activeTab === 'messages' && <Messages />}

            {/* Subjects Management */}
            {activeTab === 'subjects' && (
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ borderRadius: 3, p: 3, position: 'sticky', top: 100 }}>
                    <Typography variant="h6" fontWeight={700} mb={2}>Add Subject Node</Typography>
                    <form onSubmit={createSubject}>
                      <TextField fullWidth label="Subject Name" size="small" value={newSubject} onChange={e => setNewSubject(e.target.value)} required sx={{ mb: 2 }} />
                      <Button fullWidth variant="contained" type="submit">Create Node</Button>
                    </form>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Card sx={{ borderRadius: 3 }}>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell><b>Subject Mapped Path</b></TableCell>
                            <TableCell><b>Architect</b></TableCell>
                            <TableCell align="right"><b>Actions</b></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredSubjects.map(s => (
                            <TableRow key={s._id}>
                              <TableCell>{s.name}</TableCell>
                              <TableCell><Typography variant="caption" color="text.secondary">{s.createdBy?.name || 'System'}</Typography></TableCell>
                              <TableCell align="right">
                                <IconButton color="error" onClick={() => deleteSubject(s._id)}><Trash2 size={18}/></IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Audit Trail */}
            {activeTab === 'audit' && (
              <Card sx={{ borderRadius: 3 }}>
                <Box sx={{ p: 2, bgcolor: 'action.hover', borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" fontWeight={700} display="flex" alignItems="center" gap={1}><Shield size={20}/> Immutable Audit Log</Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><b>Timestamp</b></TableCell>
                        <TableCell><b>Admin</b></TableCell>
                        <TableCell><b>Action</b></TableCell>
                        <TableCell><b>Target</b></TableCell>
                        <TableCell><b>Matrix Payload</b></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {auditLogs.map(log => (
                        <TableRow key={log._id}>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>{new Date(log.createdAt).toLocaleString()}</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{log.admin?.name || log.adminId || 'System'}</TableCell>
                          <TableCell><Chip size="small" label={log.action} color={log.action === 'delete' ? 'error' : log.action === 'block' ? 'warning' : 'info'} sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}/></TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{log.targetUser?.name || log.targetId || 'Global'}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.disabled' }}>{JSON.stringify(log.details || {})}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}
            
            {/* Communications */}
            {activeTab === 'communication' && (
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ borderRadius: 3, p: 4, height: '100%' }}>
                    <Typography variant="h6" fontWeight={800} mb={1} display="flex" alignItems="center" gap={1}><MessageCircle color={muiTheme.palette.secondary.main}/> Global Banner Matrix</Typography>
                    <form onSubmit={updateSiteConfig} style={{ marginTop: 24 }}>
                      <FormControlLabel control={<Switch checked={siteConfig.announcementBannerActive || false} onChange={e => setSiteConfig({...siteConfig, announcementBannerActive: e.target.checked})} color="secondary" />} label="Enable Site-Wide Alert Banner" sx={{ mb: 2 }} />
                      <TextField fullWidth multiline rows={4} label="Banner Markdown Config" value={siteConfig.announcementBannerText || ''} onChange={e => setSiteConfig({...siteConfig, announcementBannerText: e.target.value})} sx={{ mb: 3 }} />
                      <Button fullWidth type="submit" variant="contained" color="secondary" disabled={saving}>{saving ? 'Wait...' : 'Set Banner Status'}</Button>
                    </form>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ borderRadius: 3, p: 4 }}>
                    <Typography variant="h6" fontWeight={800} mb={1} display="flex" alignItems="center" gap={1}><Mail color={muiTheme.palette.warning.main}/> Email HTML Encoders</Typography>
                    <form onSubmit={updateSiteConfig} style={{ marginTop: 24 }}>
                      <TextField fullWidth multiline rows={2} label="Welcome (HTML)" value={siteConfig.emailTemplateWelcome || ''} onChange={e => setSiteConfig({...siteConfig, emailTemplateWelcome: e.target.value})} sx={{ mb: 2 }} InputProps={{ sx: { fontFamily: 'monospace', fontSize: 12 } }} />
                      <TextField fullWidth multiline rows={2} label="Pass Reset (HTML)" value={siteConfig.emailTemplateReset || ''} onChange={e => setSiteConfig({...siteConfig, emailTemplateReset: e.target.value})} sx={{ mb: 2 }} InputProps={{ sx: { fontFamily: 'monospace', fontSize: 12 } }} />
                      <TextField fullWidth multiline rows={3} label="Mass Blast Template" value={siteConfig.emailTemplateBroadcast || ''} onChange={e => setSiteConfig({...siteConfig, emailTemplateBroadcast: e.target.value})} sx={{ mb: 3 }} InputProps={{ sx: { fontFamily: 'monospace', fontSize: 12 } }} />
                      <Button fullWidth type="submit" variant="contained" color="warning" disabled={saving}>{saving ? 'Wait...' : 'Inject Email Code'}</Button>
                    </form>
                  </Card>
                </Grid>
              </Grid>
            )}

          </Box>
        )}
      </Box>

      {/* Broadcast Modal */}
      <Dialog open={showBroadcastModal} onClose={() => setShowBroadcastModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Dispatch Mass Broadcast</DialogTitle>
        <DialogContent dividers>
          <form id="broadcast-form" onSubmit={handleBroadcast}>
            <Box mb={2}>
              <Typography variant="caption" fontWeight="bold">Target Audience</Typography>
              <Select fullWidth size="small" value={broadcastForm.targetUsers} onChange={e => setBroadcastForm({...broadcastForm, targetUsers: e.target.value})}>
                <MenuItem value="all">ALL Active System Users</MenuItem>
                <MenuItem value="admins" disabled>Administrators Only</MenuItem>
              </Select>
            </Box>
            <TextField fullWidth label="Subject Header" required value={broadcastForm.subject} onChange={e => setBroadcastForm({...broadcastForm, subject: e.target.value})} sx={{ mb: 2 }} />
            <TextField fullWidth multiline rows={5} label="Markdown Payload Body" required value={broadcastForm.message} onChange={e => setBroadcastForm({...broadcastForm, message: e.target.value})} />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBroadcastModal(false)}>Abort</Button>
          <Button type="submit" form="broadcast-form" variant="contained" color="warning" disabled={saving}>{saving ? 'Transmitting' : 'Fire Payload'}</Button>
        </DialogActions>
      </Dialog>

      {/* Create User Modal */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create New Identity</DialogTitle>
        <DialogContent dividers>
          <form id="create-user-form" onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
             <TextField label="Full Name" required fullWidth value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
             <TextField label="Email Address" type="email" required fullWidth value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
             <TextField label="Password" type="password" inputProps={{ minLength: 6 }} required fullWidth value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
             <FormControlLabel control={<Switch checked={form.isAdmin} onChange={e => setForm({...form, isAdmin: e.target.checked})} color="secondary" />} label="Grant Administrative Privilege" />
             <FormControlLabel control={<Switch checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} color="success" />} label="Account Active" />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModal(false)}>Cancel</Button>
          <Button type="submit" form="create-user-form" variant="contained" disabled={saving}>{saving ? 'Processing' : 'Create Account'}</Button>
        </DialogActions>
      </Dialog>

      {/* Gamification Badge Dialog */}
      <Dialog open={openBadgeDialog} onClose={() => setOpenBadgeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Award Custom Badge</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Typography variant="body2" color="text.secondary" mb={2}>
              Awarding a badge to <b>{selectedUser.name}</b>. Earning an admin badge Grants +500 XP.
            </Typography>
          )}
          <TextField
            fullWidth
            margin="dense"
            label="Badge Name"
            placeholder="e.g. Tutor of the Month"
            value={badgeInput}
            onChange={(e) => setBadgeInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenBadgeDialog(false)} color="inherit" sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => {
              if (selectedUser && badgeInput) {
                api.post('/admin/gamification/badge', { userId: selectedUser._id, badge: badgeInput })
                  .then(() => {
                    toast.success(`Badge ${badgeInput} awarded!`);
                    setOpenBadgeDialog(false);
                    setBadgeInput('');
                    fetchData();
                  })
                  .catch((err) => toast.error(err.response?.data?.message || 'Failed to award badge'));
              }
            }} 
            sx={{ fontWeight: 700 }}
          >
            Award Badge
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
