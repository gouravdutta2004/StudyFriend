import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Users, Calendar, MessageCircle, Search, LogOut, User, Menu as MenuIcon, Sun, Moon, Bell, BellRing, Globe, Trophy } from 'lucide-react';
import api from '../api/axios';
import { AppBar, Toolbar, Typography, Button, IconButton, Badge, Avatar, Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Menu, MenuItem, Divider, useTheme, useMediaQuery } from '@mui/material';

const navLinks = [
  { to: '/dashboard', icon: BookOpen, label: 'Dashboard' },
  { to: '/browse', icon: Search, label: 'Browse' },
  { to: '/matches', icon: Users, label: 'Matches' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/sessions', icon: Calendar, label: 'Sessions' },
  { to: '/groups', icon: Globe, label: 'Groups' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/connections', icon: Users, label: 'Connections' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme: currentThemeMode, toggleTheme } = useCustomTheme();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [anchorElNotif, setAnchorElNotif] = useState(null);

  useEffect(() => {
    if (user && !user.isAdmin) {
      api.get('/notifications').then(res => setNotifications(res.data)).catch(() => {});
    }
  }, [user]);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (e) {}
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleOpenNotifMenu = (event) => setAnchorElNotif(event.currentTarget);
  const handleCloseNotifMenu = () => setAnchorElNotif(null);

  const drawer = (
    <Box onClick={() => setMobileOpen(false)} sx={{ width: 250, bgcolor: 'background.paper', height: '100%' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" color="primary.main" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BookOpen size={20} /> StudyBuddy
        </Typography>
      </Box>
      <Divider />
      <List>
        {!user?.isAdmin && navLinks.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <ListItem button component={RouterLink} to={to} key={to} sx={{ bgcolor: isActive ? 'action.selected' : 'transparent', color: isActive ? 'primary.main' : 'text.primary' }}>
              <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'text.secondary', minWidth: 40 }}>
                <Icon size={20} />
              </ListItemIcon>
              <ListItemText primary={label} primaryTypographyProps={{ fontWeight: isActive ? 600 : 400 }} />
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={toggleTheme}>
          <ListItemIcon sx={{ minWidth: 40 }}>{currentThemeMode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</ListItemIcon>
          <ListItemText primary="Toggle Theme" />
        </ListItem>
        <ListItem button onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main', minWidth: 40 }}><LogOut size={20} /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="sticky" color="inherit" elevation={currentThemeMode === 'dark' ? 2 : 1} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64 }}>
          <Typography component={RouterLink} to="/dashboard" variant="h6" color="primary.main" sx={{ fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 1 }}>
            <BookOpen size={24} /> StudyBuddy
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {!user?.isAdmin && navLinks.map(({ to, icon: Icon, label }) => {
                const isActive = location.pathname === to;
                return (
                  <Button
                    key={to}
                    component={RouterLink}
                    to={to}
                    startIcon={<Icon size={16} />}
                    sx={{
                      textTransform: 'none',
                      color: isActive ? 'primary.main' : 'text.secondary',
                      bgcolor: isActive ? (currentThemeMode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'primary.50') : 'transparent',
                      fontWeight: isActive ? 600 : 500,
                      px: 2,
                      py: 0.75,
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: isActive ? (currentThemeMode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'primary.100') : 'action.hover',
                      }
                    }}
                  >
                    {label}
                  </Button>
                );
              })}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
            {!isMobile && (
              <Button component={RouterLink} to="/profile" sx={{ textTransform: 'none', color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar src={user?.avatar || ''} alt={user?.name} sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                  {!user?.avatar && <User size={18} color="white" />}
                </Avatar>
                <Typography variant="body2" fontWeight={600}>{user?.name}</Typography>
              </Button>
            )}

            <IconButton onClick={handleOpenNotifMenu} color="inherit">
              <Badge badgeContent={unreadCount} color="error" overlap="circular">
                {unreadCount > 0 ? <BellRing size={20} className="text-blue-500" /> : <Bell size={20} />}
              </Badge>
            </IconButton>

            <Menu
              anchorEl={anchorElNotif}
              open={Boolean(anchorElNotif)}
              onClose={handleCloseNotifMenu}
              PaperProps={{ sx: { width: 320, maxHeight: 400, mt: 1.5, borderRadius: 3, boxShadow: muiTheme.shadows[8] } }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight={700}>Notifications ({unreadCount})</Typography>
              </Box>
              {notifications.length === 0 ? (
                <MenuItem disabled sx={{ py: 2, justifyContent: 'center' }}>No notifications</MenuItem>
              ) : (
                notifications.map(n => (
                  <MenuItem key={n._id} onClick={() => markRead(n._id)} sx={{ borderBottom: 1, borderColor: 'divider', py: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', bgcolor: n.read ? 'transparent' : 'action.hover', opacity: n.read ? 0.7 : 1 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'normal', color: 'text.primary', fontWeight: n.read ? 400 : 500 }}>{n.message}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>{new Date(n.createdAt).toLocaleDateString()}</Typography>
                  </MenuItem>
                ))
              )}
            </Menu>

            {!isMobile && (
              <>
                <IconButton onClick={toggleTheme} color="inherit" sx={{ color: 'text.secondary' }}>
                  {currentThemeMode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </IconButton>
                <IconButton onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <LogOut size={20} />
                </IconButton>
              </>
            )}

            {isMobile && (
              <IconButton edge="end" color="inherit" onClick={() => setMobileOpen(true)} sx={{ ml: 1 }}>
                <MenuIcon size={24} />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        {drawer}
      </Drawer>
    </>
  );
}
