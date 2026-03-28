import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import api from '../api/axios';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { Box, Button, Container, TextField, Typography, Paper, Link, InputAdornment } from '@mui/material';
import { Email } from '@mui/icons-material';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Password reset link sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: (theme) => theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' : 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)', p: 2 }}>
      <Container maxWidth="xs">
        <Paper elevation={24} sx={{ p: { xs: 4, sm: 5 }, borderRadius: 4, backdropFilter: 'blur(10px)', backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Box sx={{ bgcolor: 'primary.main', p: 1.5, borderRadius: 3, mb: 2, boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)' }}>
              <Mail size={32} color="white" />
            </Box>
            <Typography component="h1" variant="h4" sx={{ fontSize: '1.5rem', fontWeight: 800, color: 'text.primary', mb: 1 }}>
              Forgot Password
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Enter your email and we'll send you a link to reset your password.
            </Typography>
          </Box>

          {!sent ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ mb: 3, py: 1.5, fontSize: '1rem', textTransform: 'none', fontWeight: 600 }}
              >
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </Button>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Check your console or email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
              </Typography>
              <Button onClick={() => setSent(false)} color="primary" sx={{ textTransform: 'none', fontWeight: 600 }}>
                Try another email
              </Button>
            </Box>
          )}
          
          <Box sx={{ textAlign: 'center' }}>
            <Link component={RouterLink} to="/login" variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
              Back to Login
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
