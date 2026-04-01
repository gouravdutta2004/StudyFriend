import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Removed Globe icon
import toast from 'react-hot-toast';
import { Box, Button, Container, TextField, Typography, Link, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Security } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import Logo from '../components/Logo';
import FloatingBackground from '../components/FloatingBackground';
import AuthCharacter from '../components/auth/AuthCharacter';
import MagneticButton from '../components/MagneticButton';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const popIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

const inputStyles = {
  '& .MuiOutlinedInput-root': { 
    bgcolor: 'rgba(255,255,255,0.02)', color: 'white', borderRadius: 4, 
    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
    '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 } 
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#6366f1' }
};

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [charAction, setCharAction] = useState('lean');

  const trackMouse = (e) => {
    setMousePos({ 
      x: (e.clientX / window.innerWidth) * 2 - 1, 
      y: -(e.clientY / window.innerHeight) * 2 + 1 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      if (data.user?.verificationStatus === 'PENDING') {
        toast.error('Your account is pending organizational approval.');
        navigate('/pending');
      } else {
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const data = await googleLogin({ credential: credentialResponse.credential });
      if (data.user?.verificationStatus === 'PENDING') {
        toast.error('Your account is pending organizational approval.');
        navigate('/pending');
      } else {
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google Auth failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box onMouseMove={trackMouse} sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#020617', p: 2, position: 'relative', overflow: 'hidden' }}>
      
      {/* Animated Abstract Background */}
      <FloatingBackground />

      {/* 3D Scrollytelling Character Overlay */}
      <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
        <AuthCharacter action={charAction} mouse={mousePos} style={{ right: '10%', top: '50%', transform: 'translateY(-50%)', width: '400px', height: '60vh' }} />
      </Box>

      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 10 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 120, damping: 20 }}>
          <Box sx={{ 
            p: { xs: 4, sm: 5 }, borderRadius: '32px', backdropFilter: 'blur(24px)', 
            bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 5 }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <Logo size={64} showText={false} />
                </Box>
              </motion.div>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 900, color: 'white', letterSpacing: '-1px', mb: 1 }}>
                Welcome back
              </Typography>
              <Typography variant="body1" color="rgba(255,255,255,0.5)">
                Enter your credentials to access your hubs.
              </Typography>
            </Box>

            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google Sign In failed')}
                theme="filled_black"
                shape="pill"
                size="large"
                text="continue_with"
                width="310"
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.1)' }} />
              <Typography sx={{ mx: 2, color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600 }}>OR</Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.1)' }} />
            </Box>

            <motion.form variants={staggerContainer} initial="hidden" animate="visible" onSubmit={handleSubmit}>

              <motion.div variants={popIn}>
                <TextField
                  margin="normal" required fullWidth id="email" label="Email Address" name="email"
                  autoComplete="email" autoFocus value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Email sx={{ color: 'rgba(255,255,255,0.5)' }} /></InputAdornment>,
                  }}
                  sx={{ ...inputStyles, mb: 2.5 }}
                />
              </motion.div>
              
              <motion.div variants={popIn}>
                <TextField
                  margin="normal" required fullWidth name="password" label="Password"
                  type={showPassword ? 'text' : 'password'} id="password" autoComplete="current-password"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Lock sx={{ color: 'rgba(255,255,255,0.5)' }} /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton aria-label="toggle password visibility" onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{ ...inputStyles, mb: 1 }}
                />
              </motion.div>
              
              <motion.div variants={popIn}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
                  <Link component={RouterLink} to="/forgot-password" variant="body2" sx={{ fontWeight: 600, color: '#818cf8', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    Forgot password?
                  </Link>
                </Box>
              </motion.div>

              <motion.div variants={popIn} onHoverStart={() => setCharAction('nod')} onHoverEnd={() => setCharAction('lean')}>
                <MagneticButton width="100%">
                  <Button
                    type="submit" fullWidth variant="contained" disabled={loading}
                    sx={{ 
                      mb: 4, py: 1.5, fontSize: '1.1rem', textTransform: 'none', fontWeight: 800, borderRadius: '100px',
                      bgcolor: '#6366f1', color: 'white', '&:hover': { bgcolor: '#4f46e5' },
                      '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }
                    }}
                  >
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </Button>
                </MagneticButton>
              </motion.div>
              
              <motion.div variants={popIn}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="rgba(255,255,255,0.5)">
                    Don't have an account?{' '}
                    <Link component={RouterLink} to="/register" sx={{ fontWeight: 700, color: '#10b981', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                      Sign up for free
                    </Link>
                  </Typography>
                </Box>
              </motion.div>
              
              <motion.div variants={popIn}>
                <Box sx={{ textAlign: 'center', mt: 3, pt: 3, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <Typography variant="body2" color="rgba(255,255,255,0.4)">
                    <Security sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5, mb: 0.3 }} />
                    Institution Admin?{' '}
                    <Link component={RouterLink} to="/org-admin-login" sx={{ fontWeight: 600, color: '#f87171', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                      Access Portal
                    </Link>
                  </Typography>
                </Box>
              </motion.div>
            </motion.form>

          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
