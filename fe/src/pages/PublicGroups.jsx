import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, Button, TextField, Grid, Chip, Avatar, CircularProgress, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Switch, Select, MenuItem, FormControl, InputLabel, IconButton, useTheme, Tooltip } from '@mui/material';
import { Users, Plus, X, Search, ChevronRight, LogOut, Globe, Lock, Crown, Shield, Scroll, Swords } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const SUBJECT_OPTIONS = ['CS','Math','Physics','Chemistry','Biology','History','Economics','Literature','Engineering','Psychology','Other'];
const SERIF = '"Georgia", "Times New Roman", serif';

function GuildCard({ group, isMember, isFull, onJoin, onLeave, navigate }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} whileHover={{ y: -4, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} style={{ height: '100%' }}>
      <Box sx={{
        p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 2.5, position: 'relative', overflow: 'hidden',
        bgcolor: isDark ? '#1a1614' : '#faf9f6',
        border: '2px solid', borderColor: isDark ? '#d9770644' : '#d9770688',
        boxShadow: isDark ? 'inset 0 0 40px rgba(0,0,0,0.8), 0 8px 24px rgba(0,0,0,0.6)' : 'inset 0 0 40px rgba(255,255,255,0.5), 0 8px 24px rgba(0,0,0,0.1)',
        borderRadius: '8px', borderTopLeftRadius: '24px', borderBottomRightRadius: '24px'
      }}>
        {/* Banner accent */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #991b1b, #dc2626, #991b1b)' }} />
        {/* Parchment texture overlay */}
        <Box sx={{ position: 'absolute', inset: 0, opacity: isDark ? 0.05 : 0.4, backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")', pointerEvents: 'none' }} />

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, position: 'relative', zIndex: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              {!group.isPublic ? <Lock size={14} color="#d97706" /> : <Globe size={14} color="#047857" />}
              <Typography sx={{ fontFamily: SERIF, fontWeight: 900, fontSize: '1.25rem', color: isDark ? '#fcd34d' : '#92400e', letterSpacing: 0.5, lineHeight: 1.1 }} noWrap>
                {group.name}
              </Typography>
            </Box>
            {group.createdBy?.name && (
              <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: isDark ? '#9ca3af' : '#78350f', fontWeight: 700 }}>
                FOUNDER: {group.createdBy.name.toUpperCase()}
              </Typography>
            )}
          </Box>
          <Box sx={{ bgcolor: isDark ? 'rgba(153,27,27,0.2)' : 'rgba(153,27,27,0.1)', border: '1px solid #991b1b', px: 1.5, py: 0.5, borderRadius: '4px', flexShrink: 0 }}>
            <Typography sx={{ fontFamily: 'monospace', color: isDark ? '#fca5a5' : '#991b1b', fontWeight: 900, fontSize: '0.65rem', letterSpacing: 1 }}>{group.subject.toUpperCase()}</Typography>
          </Box>
        </Box>

        {/* Description */}
        <Box sx={{ position: 'relative', zIndex: 1, flex: 1 }}>
          <Typography sx={{ fontFamily: SERIF, fontSize: '0.95rem', color: isDark ? '#d1d5db' : '#451a03', fontStyle: 'italic', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            "{group.description}"
          </Typography>
        </Box>

        {/* Guild Capacity */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: isDark ? '#9ca3af' : '#78350f', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Shield size={12} /> GUILDMATES
            </Typography>
            <Typography sx={{ fontFamily: SERIF, fontWeight: 900, color: isFull ? '#dc2626' : '#d97706', fontSize: '1rem' }}>
              {group.members.length} / {group.maxMembers}
            </Typography>
          </Box>
          <Box sx={{ height: 6, borderRadius: '0px', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)', overflow: 'hidden', border: `1px solid ${isDark ? '#3f3f46' : '#d4d4d8'}` }}>
            <Box sx={{ height: '100%', width: `${Math.min((group.members.length / group.maxMembers) * 100, 100)}%`, background: isFull ? 'linear-gradient(90deg, #7f1d1d, #dc2626)' : 'linear-gradient(90deg, #78350f, #d97706)', transition: 'width 0.5s ease' }} />
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1.5, mt: 'auto', position: 'relative', zIndex: 1 }}>
          {isMember ? (
            <>
              <Button fullWidth onClick={() => navigate(`/groups/${group._id}`)} endIcon={<Swords size={16} />} sx={{ borderRadius: '4px', textTransform: 'uppercase', fontFamily: SERIF, fontWeight: 900, letterSpacing: 1, color: '#fef3c7', background: 'linear-gradient(180deg, #b45309 0%, #78350f 100%)', border: '1px solid #d97706', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.5)', '&:hover': { background: 'linear-gradient(180deg, #d97706 0%, #92400e 100%)' }, '&:active': { transform: 'translateY(2px)', boxShadow: 'none' } }}>
                Enter Hall
              </Button>
              <Tooltip title="Abandon Guild">
                <IconButton onClick={() => onLeave(group._id)} sx={{ borderRadius: '4px', bgcolor: 'rgba(153,27,27,0.1)', border: '1px solid #991b1b', color: '#ef4444', '&:hover': { bgcolor: 'rgba(153,27,27,0.2)' } }}>
                  <LogOut size={18} />
                </IconButton>
              </Tooltip>
            </>
          ) : isFull ? (
            <Box sx={{ flex: 1, textAlign: 'center', py: 1, border: '1px dashed #dc2626', borderRadius: '4px', bgcolor: 'rgba(220,38,38,0.05)' }}>
              <Typography sx={{ fontFamily: SERIF, fontWeight: 900, color: '#dc2626' }}>Guild Full</Typography>
            </Box>
          ) : (
            <Button fullWidth onClick={() => onJoin(group._id)} startIcon={<Scroll size={16} />} sx={{ borderRadius: '4px', textTransform: 'uppercase', fontFamily: SERIF, fontWeight: 900, letterSpacing: 1, color: '#ecfdf5', background: 'linear-gradient(180deg, #059669 0%, #064e3b 100%)', border: '1px solid #10b981', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.5)', '&:hover': { background: 'linear-gradient(180deg, #10b981 0%, #065f46 100%)' }, '&:active': { transform: 'translateY(2px)', boxShadow: 'none' } }}>
              Enlist
            </Button>
          )}
        </Box>
      </Box>
    </motion.div>
  );
}

export default function PublicGroups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '', subject: '', maxMembers: 10, isPublic: true });
  const [creating, setCreating] = useState(false);

  const plan = user?.subscription?.plan || 'basic';
  const maxAllowedMembers = plan === 'squad' ? 50 : plan === 'pro' ? 20 : 10;

  const fetchGroups = async () => {
    try { const res = await api.get(`/groups?search=${search}`); setGroups(res.data); }
    catch { toast.error('Failed to summon guilds'); } finally { setLoading(false); }
  };
  useEffect(() => { const timer = setTimeout(fetchGroups, 400); return () => clearTimeout(timer); }, [search]); // eslint-disable-line

  const handleCreate = async (e) => {
    e.preventDefault(); setCreating(true);
    try {
      await api.post('/groups', { ...form, maxMembers: Math.min(form.maxMembers, maxAllowedMembers) });
      toast.success('Guild Found!', { icon: '🏰' }); setShowForm(false);
      setForm({ name: '', description: '', subject: '', maxMembers: maxAllowedMembers, isPublic: true }); fetchGroups();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to found guild'); } finally { setCreating(false); }
  };
  const handleJoin = async (id) => { try { await api.post(`/groups/${id}/join`); toast.success('Enlisted!', { icon: '⚔️' }); fetchGroups(); } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } };
  const handleLeave = async (id) => { try { await api.post(`/groups/${id}/leave`); toast.success('Abandoned guild'); fetchGroups(); } catch (err) { toast.error('Failed'); } };

  const inputSx = {
    '& .MuiOutlinedInput-root': { borderRadius: '4px', fontFamily: SERIF, bgcolor: isDark ? 'rgba(0,0,0,0.5)' : 'white', '& fieldset': { borderColor: isDark ? '#78350f' : '#b45309' }, '&:hover fieldset': { borderColor: '#d97706' }, '&.Mui-focused fieldset': { borderColor: '#f59e0b', borderWidth: 2 } },
    '& .MuiInputLabel-root': { fontFamily: SERIF, color: isDark ? '#d1d5db' : '#78350f', fontWeight: 600 }, '& .MuiInputLabel-root.Mui-focused': { color: '#f59e0b' },
    '& input, & textarea, & .MuiSelect-select': { color: isDark ? '#fef3c7' : '#451a03', fontWeight: 500 }
  };

  return (
    <Box sx={{ minHeight: '100vh', py: 4, px: { xs: 2, md: 4 }, backgroundImage: `url('https://www.transparenttextures.com/patterns/dark-matter.png')`, bgcolor: isDark ? '#0c0a09' : '#f5f5f4' }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 6, flexWrap: 'wrap', gap: 3, borderBottom: '2px solid', borderColor: isDark ? '#78350f' : '#b45309', pb: 3 }}>
          <Box>
            <Typography sx={{ fontFamily: SERIF, fontSize: { xs: '2.5rem', md: '3.5rem' }, fontWeight: 900, color: isDark ? '#fcd34d' : '#92400e', letterSpacing: 1, textShadow: isDark ? '0 2px 4px rgba(0,0,0,0.8)' : '0 1px 2px rgba(255,255,255,0.5)', lineHeight: 1 }}>
              Guild Halls
            </Typography>
            <Typography sx={{ fontFamily: SERIF, fontSize: '1.1rem', color: isDark ? '#d1d5db' : '#78350f', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Shield size={18} /> Seek glory in collaborative scholarship.
            </Typography>
          </Box>
          <Button onClick={() => setShowForm(true)} startIcon={<Crown size={18} />} sx={{ borderRadius: '4px', textTransform: 'uppercase', fontFamily: SERIF, fontWeight: 900, letterSpacing: 1.5, px: 4, py: 1.5, color: '#fef3c7', background: 'linear-gradient(180deg, #b45309 0%, #78350f 100%)', border: '1px solid #d97706', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(0,0,0,0.6)', '&:hover': { background: 'linear-gradient(180deg, #d97706 0%, #92400e 100%)' }, '&:active': { transform: 'translateY(2px)', boxShadow: 'none' } }}>
            Found a Guild
          </Button>
        </Box>

        {/* Search */}
        <TextField fullWidth placeholder="Search the archives by name or subject..." value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={20} color="#d97706" /></InputAdornment> }}
          sx={{ mb: 6, ...inputSx, '& .MuiOutlinedInput-root': { ...inputSx['& .MuiOutlinedInput-root'], py: 1 } }}
        />

        {/* Guilds Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress size={60} sx={{ color: '#d97706' }} /></Box>
        ) : groups.length === 0 ? (
          <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ textAlign: 'center', py: 12, borderRadius: '8px', bgcolor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)', border: '2px dashed', borderColor: isDark ? '#78350f' : '#b45309' }}>
            <Scroll size={64} color="#d97706" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <Typography sx={{ fontFamily: SERIF, fontWeight: 900, fontSize: '1.5rem', color: isDark ? '#fcd34d' : '#92400e', mb: 1 }}>No Guilds Found</Typography>
            <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', color: isDark ? '#9ca3af' : '#78350f' }}>The halls are empty. Be the first to establish a house of learning.</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <AnimatePresence mode="popLayout">
              {groups.map(g => (
                <Grid item xs={12} sm={6} lg={4} key={g._id}>
                  <GuildCard group={g} isMember={g.members.includes(user?._id)} isFull={g.members.length >= g.maxMembers} onJoin={handleJoin} onLeave={handleLeave} navigate={navigate} />
                </Grid>
              ))}
            </AnimatePresence>
          </Grid>
        )}
      </Box>

      {/* Found Guild Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '8px', bgcolor: isDark ? '#1c1917' : '#fafaf9', border: '2px solid #b45309', backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
          <Box>
            <Typography sx={{ fontFamily: SERIF, fontWeight: 900, fontSize: '1.75rem', color: isDark ? '#fcd34d' : '#92400e' }}>Establish Guild</Typography>
            <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', color: isDark ? '#d1d5db' : '#78350f', mt: 0.5 }}>Draft the charter for your new house of study.</Typography>
          </Box>
          <IconButton onClick={() => setShowForm(false)} sx={{ color: '#d97706', alignSelf: 'flex-start' }}><X size={24} /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 4, pt: 4, pb: 2 }}>
          <Box component="form" id="create-guild-form" onSubmit={handleCreate} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField label="Guild Name" required fullWidth value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Knights of Calculus" sx={inputSx} />
            <FormControl fullWidth sx={inputSx}>
              <InputLabel>Primary Discipline *</InputLabel>
              <Select label="Primary Discipline *" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
                {SUBJECT_OPTIONS.map(s => <MenuItem key={s} value={s} sx={{ fontFamily: SERIF }}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Charter Description" required fullWidth multiline rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="State the goals and requirements for prospective members." sx={inputSx} />

            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap', bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', p: 2, border: '1px solid', borderColor: isDark ? '#78350f' : '#b45309', borderRadius: '4px' }}>
              <TextField label="Capacity" type="number" size="small" value={form.maxMembers} onChange={e => setForm({ ...form, maxMembers: Math.min(Math.max(2, +e.target.value), maxAllowedMembers) })} InputProps={{ inputProps: { min: 2, max: maxAllowedMembers } }} sx={{ width: 100, ...inputSx }} />
              <Box sx={{ flex: 1 }}>
                <FormControlLabel
                  control={<Switch checked={form.isPublic} onChange={e => setForm({ ...form, isPublic: e.target.checked })} color="warning" />}
                  label={<Typography sx={{ fontFamily: SERIF, fontWeight: 800, color: isDark ? '#fcd34d' : '#92400e' }}>
                    {form.isPublic ? 'Open Registry (Public)' : 'Invite Only (Private)'}
                  </Typography>}
                />
              </Box>
              {plan === 'basic' && <Chip icon={<Crown size={14} color="#b45309" />} label={`Max ${maxAllowedMembers} (Peasant Tier)`} size="small" sx={{ fontFamily: SERIF, fontWeight: 900, bgcolor: 'rgba(217,119,6,0.1)', color: '#d97706', border: '1px solid #d97706' }} />}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 4, pb: 4, mt: 1, gap: 2 }}>
          <Button onClick={() => setShowForm(false)} fullWidth variant="outlined" sx={{ borderRadius: '4px', fontFamily: SERIF, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#fca5a5' : '#991b1b', borderColor: isDark ? '#991b1b' : '#dc2626' }}>
            Abandon
          </Button>
          <Button type="submit" form="create-guild-form" fullWidth variant="contained" disabled={creating} sx={{ borderRadius: '4px', fontFamily: SERIF, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: '#fef3c7', background: 'linear-gradient(180deg, #b45309 0%, #78350f 100%)', border: '1px solid #d97706', '&:hover': { background: 'linear-gradient(180deg, #d97706 0%, #92400e 100%)' } }}>
            {creating ? 'Sealing Charter...' : 'Seal Charter'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
