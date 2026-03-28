import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, MessageSquare, Columns, Folder, Video, TerminalSquare } from 'lucide-react';
import { Box, Typography, Button, CircularProgress, Grid, Avatar } from '@mui/material';
import SquadKanban from '../components/squad/SquadKanban';
import SquadVault from '../components/squad/SquadVault';
import SquadStudyRoom from '../components/squad/SquadStudyRoom';
import SquadChat from '../components/squad/SquadChat';

export default function GroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await api.get('/groups');
        const found = res.data.find(g => g._id === id);
        if (found) setGroup(found);
        
        try {
          const peekRes = await api.get(`/groups/${id}/quick-peek`);
          setMembers(peekRes.data.members || []);
        } catch(e) {}
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>;
  if (!group) return <Typography align="center" sx={{ mt: 8 }}>Squad not found.</Typography>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: 4, pb: 8 }}>
      <Box sx={{ maxWidth: '1400px', mx: 'auto', px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Button onClick={() => navigate('/groups')} startIcon={<ArrowLeft />} color="inherit">Back to Groups</Button>
          <Typography variant="h4" fontWeight="bold">{group.name} Squad</Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={9}>
            {/* Tab Navigation */}
            <Box sx={{ display: 'flex', gap: 1, mb: 4, borderBottom: '1px solid', borderColor: 'divider', pb: 1, overflowX: 'auto' }}>
              <Button variant={activeTab === 'chat' ? 'contained' : 'text'} onClick={() => setActiveTab('chat')} startIcon={<MessageSquare size={18} />} sx={{ borderRadius: 8, px: 3 }}>Squad Chat & AI</Button>
              <Button variant={activeTab === 'kanban' ? 'contained' : 'text'} onClick={() => setActiveTab('kanban')} startIcon={<Columns size={18} />} sx={{ borderRadius: 8, px: 3 }}>Kanban Board</Button>
              <Button variant={activeTab === 'vault' ? 'contained' : 'text'} onClick={() => setActiveTab('vault')} startIcon={<Folder size={18} />} sx={{ borderRadius: 8, px: 3 }}>Resource Vault</Button>
              <Button variant={activeTab === 'room' ? 'contained' : 'text'} onClick={() => setActiveTab('room')} startIcon={<Video size={18} />} sx={{ borderRadius: 8, px: 3 }}>Instant Study Room</Button>
            </Box>

            {/* Tab Content */}
            <Box sx={{ bgcolor: 'background.paper', borderRadius: 4, minHeight: 600, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              {activeTab === 'chat' && <SquadChat groupId={id} subject={group.subject} name={group.name} />}
              {activeTab === 'kanban' && <SquadKanban groupId={id} initialTasks={group.kanbanTasks || []} />}
              {activeTab === 'vault' && <SquadVault groupId={id} initialResources={group.resources || []} />}
              {activeTab === 'room' && <SquadStudyRoom groupId={id} name={group.name} />}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={3}>
            {/* Glassmorphic Sidebar */}
            <Box sx={{ 
              p: 3, borderRadius: '24px', 
              bgcolor: 'rgba(255, 255, 255, 0.03)', 
              backdropFilter: 'blur(24px)', 
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              position: 'sticky', top: 24, minHeight: 400
            }}>
              <Typography variant="h6" fontWeight="900" sx={{ mb: 3 }}>Squad Roster</Typography>
              {members.length > 0 ? members.map(m => (
                <Box key={m._id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar src={m.avatar || ''} alt={m.name} sx={{ width: 44, height: 44, border: '2px solid rgba(255,255,255,0.1)' }} />
                  <Typography variant="body1" fontWeight="600">{m.name}</Typography>
                </Box>
              )) : (
                <Typography variant="body2" color="text.secondary">Loading roster...</Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
