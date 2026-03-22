import { useEffect, useState } from 'react';
import api from '../api/axios';
import UserCard from '../components/UserCard';
import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { Container, Typography, Box, Grid, CircularProgress, Button } from '@mui/material';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentReqs, setSentReqs] = useState(new Set());

  useEffect(() => {
    api.get('/users/matches')
      .then(res => setMatches(res.data))
      .catch(() => toast.error('Failed to load matches'))
      .finally(() => setLoading(false));
  }, []);

  const handleConnect = async (userId) => {
    try {
      await api.post(`/users/connect/${userId}`);
      setSentReqs(prev => new Set([...prev, userId]));
      toast.success('Connection request sent!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} color="text.primary" display="flex" alignItems="center" gap={1.5}>
          <Sparkles color="#eab308" size={32} /> Your Matches
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" mt={0.5}>
          People who share your subjects and interests
        </Typography>
      </Box>

      {matches.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
          <Sparkles size={64} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <Typography variant="h6" fontWeight={700} color="text.primary">
            No matches yet
          </Typography>
          <Typography variant="body2" mt={1}>
            Add subjects to your profile to find matches
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {matches.map(u => (
            <Grid item xs={12} md={6} lg={4} key={u._id}>
              <UserCard user={u} actions={
                sentReqs.has(u._id)
                  ? <Typography variant="body2" color="text.secondary" fontWeight={500} px={1}>Request Sent</Typography>
                  : <Button 
                      variant="contained" 
                      onClick={() => handleConnect(u._id)} 
                      size="small" 
                      sx={{ borderRadius: 2, fontWeight: 700 }}
                    >
                      Connect
                    </Button>
              } />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
