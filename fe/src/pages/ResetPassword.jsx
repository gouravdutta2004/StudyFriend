import { useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import api from '../api/axios';
import { KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { Box, Button, Container, TextField, Typography, Paper, Link, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff, Lock } from '@mui/icons-material';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      await api.put(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      toast.success('Password has been reset successfully');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: (theme) => theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' : 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)', p: 2 }}>
      <Container maxWidth="xs">
        <Paper elevation={24} sx={{ p: { xs: 4, sm: 5 }, borderRadius: 4, backdropFilter: 'blur(10px)', backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box sx={{ bgcolor: 'secondary.main', p: 1.5, borderRadius: 3, mb: 2, boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)' }}>
              <KeyRound size={32} color="white" />
            </Box>
            <Typography component="h1" variant="h3" sx={{ fontSize: '1.75rem', color: 'text.primary', mb: 0.5 }}>
              Reset Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your new password below to reset it.
            </Typography>
          </Box>

          {!success ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="dense"
                required
                fullWidth
                name="password"
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton aria-label="toggle password visibility" onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                margin="dense"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton aria-label="toggle password visibility" onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ mb: 2, py: 1.5, fontSize: '1rem', textTransform: 'none', fontWeight: 600 }}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', mb: 2, mt: 2 }}>
              <Typography variant="body1" color="secondary.main" sx={{ mb: 3, fontWeight: 500 }}>
                Your password has been reset successfully! You can now log in with your new password.
              </Typography>
              <Button
                component={RouterLink}
                to="/login"
                fullWidth
                variant="contained"
                sx={{ py: 1.5, fontSize: '1rem', textTransform: 'none', fontWeight: 600 }}
              >
                Go to Login
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
