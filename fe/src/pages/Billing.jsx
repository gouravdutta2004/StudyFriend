import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Grid, Button, Chip, Divider,
  CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Paper, useTheme
} from '@mui/material';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Check, X, CreditCard, Sparkles, ShieldCheck, AlertCircle, Clock, RefreshCw, Star, Zap, Infinity, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// ── Tilt Card ───────────────────────────────────────────────
function TiltCard({ children, sx, className }) {
  const x = useMotionValue(0), y = useMotionValue(0);
  const rotateX = useTransform(useSpring(y), [-0.5, 0.5], ['5deg', '-5deg']);
  const rotateY = useTransform(useSpring(x), [-0.5, 0.5], ['-5deg', '5deg']);
  const handleMouseMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  return (
    <motion.div
      style={{ rotateX, rotateY, perspective: 1000, display: 'flex', height: '100%', width: '100%' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      className={className}
    >
      <Box sx={{
        width: '100%', borderRadius: '24px', overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)', ...sx
      }}>
        {children}
      </Box>
    </motion.div>
  );
}

const fade = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 15 } } };
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } };

const PLANS = [
  {
    key: 'basic', name: 'Standard', price: 0, period: 'Free forever',
    desc: 'The essential StudyFriend experience. Perfect for individual public learners.',
    features: ['Up to 3 connections', 'Public squads access', 'Basic study tracking', 'Push notifications'],
    color: '#94a3b8', bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.1)'
  },
  {
    key: 'pro', name: 'Prime', price: 799, period: '/year (Save 40%)',
    desc: 'Unlock your true potential. Gemini AI Tutor, advanced heatmaps, and priority queues.',
    features: ['Everything in Standard', 'Unlimited connections', 'Gemini AI Tutor Integration', 'Private squads access', 'Advanced learning heatmaps', 'Priority support line'],
    color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.05)', border: '#fbbf24', popular: true,
    gradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)'
  },
  {
    key: 'squad', name: 'Enterprise', price: 1599, period: '/year (Organizational)',
    desc: 'The ultimate tool for high-performance cohorts and institutional groups.',
    features: ['Everything in Prime', 'Up to 50 members per squad', 'Unlimited Vault file storage', 'Admin moderation tools', 'Cohort analytics dashboard'],
    color: '#10b981', bg: 'rgba(16, 185, 129, 0.05)', border: '#10b981',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'
  }
];

const COMPARISON_FEATURES = [
  { label: 'Connections Limit', basic: '3 Users', pro: 'Unlimited', squad: 'Unlimited' },
  { label: 'Squad Size', basic: '5 Members', pro: '15 Members', squad: '50 Members' },
  { label: 'Vault Storage', basic: '100 MB', pro: '5 GB', squad: 'Unlimited' },
  { label: 'Gemini AI Tutor', basic: false, pro: true, squad: true },
  { label: 'Private Squads', basic: false, pro: true, squad: true },
  { label: 'Advanced Analytics', basic: false, pro: true, squad: true },
  { label: 'Admin Dashboard', basic: false, pro: false, squad: true },
  { label: 'Priority Matches', basic: false, pro: true, squad: true },
];

export default function Billing() {
  const { user, updateUser } = useAuth();
  const theme = useTheme();
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const currentPlan = status?.plan || user?.subscription?.plan || 'basic';
  const activeUntil = status?.activeUntil;
  const isRealGateway = status?.isRealGateway;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      setStatusLoading(true);
      try {
        const [statusRes, historyRes] = await Promise.all([
          api.get('/billing/status'),
          api.get('/billing/history'),
        ]);
        setStatus(statusRes.data);
        setHistory(historyRes.data || []);
      } catch (e) {
        setStatus({ plan: user?.subscription?.plan || 'basic', activeUntil: user?.subscription?.activeUntil, isRealGateway: false });
      } finally {
        setStatusLoading(false);
      }
    };
    fetchStatus();
  }, [user]);

  const handleUpgrade = async (planKey) => {
    if (planKey === currentPlan) return toast('You are already on this plan', { icon: 'ℹ️' });
    if (planKey === 'basic') return toast.error('Use the cancel button to downgrade to Basic.');
    setLoading(true);
    try {
      const { data } = await api.post('/billing/create-order', { plan: planKey });
      const { orderId, amount, currency, key_id, isMock } = data;

      if (isMock) {
        const verifyRes = await api.post('/billing/verify', {
          razorpay_order_id: orderId,
          razorpay_payment_id: `pay_demo_${Date.now()}`,
          razorpay_signature: 'mock_signature',
          plan: planKey,
          isMock: true,
        });
        toast.success(verifyRes.data.message);
        updateUser({ ...user, subscription: verifyRes.data.subscription });
        setStatus(prev => ({ ...prev, plan: planKey, activeUntil: verifyRes.data.subscription.activeUntil }));
        setLoading(false);
        return;
      }

      const options = {
        key: key_id,
        amount,
        currency,
        name: 'StudyFriend',
        description: `Upgrade to ${planKey.toUpperCase()}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/billing/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planKey,
              isMock: false,
            });
            toast.success(verifyRes.data.message);
            updateUser({ ...user, subscription: verifyRes.data.subscription });
            setStatus(prev => ({ ...prev, plan: planKey, activeUntil: verifyRes.data.subscription.activeUntil }));
            const h = await api.get('/billing/history');
            setHistory(h.data || []);
          } catch (err) {
            toast.error(err?.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: planKey === 'squad' ? '#10b981' : '#fbbf24' },
        modal: { ondismiss: () => setLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (r) => {
        toast.error(r.error?.description || 'Payment failed');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (currentPlan === 'basic') return toast('Already on the free plan.', { icon: 'ℹ️' });
    setCancelling(true);
    try {
      const { data } = await api.post('/billing/cancel');
      toast.success(data.message);
      updateUser({ ...user, subscription: data.subscription });
      setStatus(prev => ({ ...prev, plan: 'basic', activeUntil: null }));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#020617', pb: { xs: 8, md: 12 }, overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── Premium Hero Banner ── */}
      <Box sx={{ 
        width: '100%', minHeight: { xs: '50vh', lg: '60vh' },
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(circle at top, rgba(99,102,241,0.15) 0%, rgba(2,6,23,1) 80%)',
        position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)',
        px: 3, pt: 8, pb: 12
      }}>
        {/* Abstract floating shapes for depth */}
        <Box sx={{ position: 'absolute', top: '10%', right: '15%', width: 300, height: 300, bgcolor: 'rgba(251,191,36,0.08)', filter: 'blur(80px)', borderRadius: '50%', zIndex: 0 }} />
        <Box sx={{ position: 'absolute', bottom: '20%', left: '10%', width: 400, height: 400, bgcolor: 'rgba(16,185,129,0.05)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0 }} />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
          <motion.div initial="hidden" animate="visible" variants={fade}>
            <Box display="flex" justifyContent="center" mb={3}>
              <Chip 
                icon={<Star size={16} fill="#fbbf24" color="#fbbf24" />} 
                label="STUDYFRIEND PRIME" 
                sx={{ bgcolor: 'rgba(251,191,36,0.1)', color: '#fbbf24', fontWeight: 900, px: 2, py: 2.5, fontSize: '0.85rem', letterSpacing: '1px' }} 
              />
            </Box>
            
            <Typography variant="h2" fontWeight={900} color="white" mb={3} sx={{ fontSize: { xs: '2.5rem', md: '4.5rem' }, letterSpacing: '-1.5px', lineHeight: 1.1 }}>
              Unlock Your <br />
              <span style={{ color: '#fbbf24' }}>True Potential</span>
            </Typography>
            
            <Typography variant="h6" color="rgba(255,255,255,0.7)" maxWidth="700px" mx="auto" sx={{ fontWeight: 400, lineHeight: 1.6, fontSize: { xs: '1rem', md: '1.2rem' } }}>
              Join thousands of top-tier students. Access Gemini AI Tutors, unlimited squads, and advanced learning analytics with StudyFriend's premium subscriptions.
            </Typography>

            <Box mt={5} display="flex" justifyContent="center" gap={2} flexWrap="wrap">
               <Chip icon={isRealGateway ? <ShieldCheck size={16} /> : <AlertCircle size={16} />} 
                     label={isRealGateway ? 'Secure Razorpay Payments' : 'Mock Mode (No Real Payment needed)'} 
                     sx={{ bgcolor: isRealGateway ? 'rgba(16,185,129,0.1)' : 'rgba(251,191,36,0.1)', color: isRealGateway ? '#10b981' : '#fbbf24', border: '1px solid currentColor', py: 2, fontSize: '0.85rem', fontWeight: 700 }} />
            </Box>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -8, position: 'relative', zIndex: 20 }}>
        
        {/* ── Active Benefits Dashboard ── */}
        {!statusLoading && currentPlan !== 'basic' && (
          <motion.div initial="hidden" animate="visible" variants={fade}>
            <Box mb={8} p={{ xs: 4, md: 5 }} borderRadius="24px" sx={{ 
              background: 'linear-gradient(145deg, rgba(30,30,40,0.95), rgba(15,15,20,0.95))', 
              backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', 
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 5, alignItems: 'center' 
            }}>
              <Box flex={1} textAlign={{ xs: 'center', md: 'left' }}>
                <Typography variant="h4" color="white" fontWeight={900} display="flex" alignItems="center" justifyContent={{ xs: 'center', md: 'flex-start' }} gap={2} mb={1.5}>
                  <Sparkles color={currentPlan === 'squad' ? '#10b981' : '#fbbf24'} size={32} /> 
                  Active {PLANS.find(p => p.key === currentPlan)?.name} Member
                </Typography>
                <Typography color="rgba(255,255,255,0.6)" variant="body1" mb={3} sx={{ fontSize: '1.05rem' }}>
                  You are currently enjoying all premium benefits. {activeUntil && `Your subscription automatically renews on ${fmt(activeUntil)}.`}
                </Typography>
                
                <Box display="flex" gap={2} flexWrap="wrap" justifyContent={{ xs: 'center', md: 'flex-start' }}>
                  <Chip icon={<CheckCircle2 size={16} color="#10b981"/>} label="AI Tutor Unlocked" sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 800, p: 1, fontSize: '0.9rem' }} />
                  <Chip icon={<CheckCircle2 size={16} color="#6366f1"/>} label={currentPlan === 'squad' ? '50 Member Squads' : 'Unlimited Connections'} sx={{ bgcolor: 'rgba(99,102,241,0.1)', color: '#6366f1', fontWeight: 800, p: 1, fontSize: '0.9rem' }} />
                  <Chip icon={<CheckCircle2 size={16} color="#ec4899"/>} label="Priority Support" sx={{ bgcolor: 'rgba(236,72,153,0.1)', color: '#ec4899', fontWeight: 800, p: 1, fontSize: '0.9rem' }} />
                </Box>
              </Box>

              <Box display="flex" flexDirection="column" gap={2} alignItems="center" justifyContent="center" px={{ xs: 0, md: 5 }} borderLeft={{ xs: 'none', md: '1px solid rgba(255,255,255,0.1)' }}>
                 <Button 
                   variant="outlined" 
                   onClick={handleCancel} 
                   disabled={cancelling}
                   startIcon={cancelling && <CircularProgress size={16} color="inherit" />}
                   sx={{ 
                     color: '#ef4444', borderColor: '#ef4444', fontWeight: 800, borderRadius: '100px', py: 1.5, px: 4,
                     '&:hover': { bgcolor: 'rgba(239,68,68,0.1)', borderColor: '#ef4444' }
                   }}
                 >
                   Cancel Premium
                 </Button>
                 <Typography variant="caption" color="rgba(255,255,255,0.4)" fontWeight={500}>You will lose access to all premium tools.</Typography>
              </Box>
            </Box>
          </motion.div>
        )}

        {/* ── Plans Pricing Grid ── */}
        <Typography variant="h3" fontWeight={900} color="white" textAlign="center" mb={6} sx={{ letterSpacing: '-1px' }}>Choose Your Path</Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mb: 12, alignItems: 'stretch' }}>
          {PLANS.map((plan, idx) => {
            const isActive = currentPlan === plan.key;
            return (
              <Box key={plan.key} sx={{ display: 'flex', flex: 1, width: '100%' }}>
                <motion.div custom={idx} initial="hidden" animate="visible" variants={stagger} style={{ width: '100%', display: 'flex' }}>
                  <TiltCard sx={{
                    background: plan.gradient || plan.bg,
                    border: `1px solid ${isActive ? '#10b981' : plan.border}`,
                    position: 'relative', display: 'flex', flexDirection: 'column', flexGrow: 1
                  }}>
                    {/* Top Ribbons */}
                    {plan.popular && !isActive && (
                      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bgcolor: plan.color, py: 1, textAlign: 'center', boxShadow: '0 4px 15px rgba(251,191,36,0.3)' }}>
                        <Typography variant="caption" fontWeight={900} color="#000" letterSpacing="1.5px">MOST POPULAR</Typography>
                      </Box>
                    )}
                    {isActive && (
                      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bgcolor: '#10b981', py: 1, textAlign: 'center', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>
                        <Typography variant="caption" fontWeight={900} color="#fff" letterSpacing="1.5px">YOUR ACTIVE PLAN</Typography>
                      </Box>
                    )}

                    <Box p={{ xs: 3, md: 5 }} pt={plan.popular || isActive ? 8 : 5} display="flex" flexDirection="column" flexGrow={1}>
                      <Typography variant="h3" fontWeight={900} color={plan.color} mb={1.5} sx={{ letterSpacing: '-1px' }}>{plan.name}</Typography>
                      <Typography variant="body1" color="rgba(255,255,255,0.7)" mb={4} sx={{ minHeight: 60, lineHeight: 1.6 }}>{plan.desc}</Typography>

                      <Box display="flex" alignItems="baseline" gap={0.5} mb={0.5}>
                        {plan.price === 0 ? (
                          <Typography variant="h2" fontWeight={900} color="white">₹0</Typography>
                        ) : (
                          <>
                            <Typography variant="h5" color="rgba(255,255,255,0.5)" fontWeight={700}>₹</Typography>
                            <Typography variant="h1" fontWeight={900} color="white" sx={{ letterSpacing: '-2px' }}>
                              {plan.price.toLocaleString('en-IN')}
                            </Typography>
                          </>
                        )}
                      </Box>
                      <Typography variant="subtitle2" color="rgba(255,255,255,0.5)" fontWeight={600} display="block" mb={5}>
                        {plan.period}
                      </Typography>

                      <Button
                        fullWidth
                        disabled={isActive || loading || statusLoading}
                        onClick={() => handleUpgrade(plan.key)}
                        sx={{
                          py: 2.2, borderRadius: '14px', fontWeight: 900, fontSize: '1.1rem', textTransform: 'none', mb: 5,
                          bgcolor: isActive ? 'rgba(255,255,255,0.1)' : plan.color,
                          color: isActive ? 'rgba(255,255,255,0.5)' : (plan.key === 'pro' ? '#000' : 'white'),
                          boxShadow: isActive ? 'none' : `0 10px 30px ${plan.color}50`,
                          '&:hover': { bgcolor: plan.color, opacity: 0.9 },
                          '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }
                        }}
                      >
                        {loading && !isActive ? <CircularProgress size={24} color="inherit" /> :
                          isActive ? 'Current Plan' :
                          plan.key === 'basic' ? 'Downgrade' :
                          `Upgrade to ${plan.name}`}
                      </Button>

                      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 4 }} />

                      <Box display="flex" flexDirection="column" gap={2.5} mt="auto">
                        <Typography variant="caption" fontWeight={800} color="rgba(255,255,255,0.4)" textTransform="uppercase" letterSpacing="1px">Features included:</Typography>
                        {plan.features.map((f, i) => (
                          <Box key={i} display="flex" alignItems="flex-start" gap={2}>
                            <Check size={20} color={plan.color} strokeWidth={3} style={{ marginTop: 2, flexShrink: 0 }} />
                            <Typography variant="body1" color="rgba(255,255,255,0.85)" fontWeight={500}>{f}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </TiltCard>
                </motion.div>
              </Box>
            );
          })}
        </Box>

        {/* ── Feature Comparison Matrix ── */}
        <Typography variant="h3" fontWeight={900} color="white" textAlign="center" mb={1} mt={16} sx={{ letterSpacing: '-1px' }}>
          Compare All Features
        </Typography>
        <Typography variant="body1" color="rgba(255,255,255,0.5)" textAlign="center" mb={8} sx={{ fontSize: '1.2rem' }}>
          See exactly what you get when you upgrade.
        </Typography>
        
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={fade}>
          <Paper sx={{ borderRadius: '24px', overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', mb: 16 }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 800, fontSize: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', py: 4, pl: 5 }}>Features Overview</TableCell>
                  <TableCell align="center" sx={{ color: '#94a3b8', fontWeight: 800, fontSize: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Standard</TableCell>
                  <TableCell align="center" sx={{ color: '#fbbf24', fontWeight: 900, fontSize: '1.3rem', borderBottom: '1px solid rgba(255,255,255,0.08)', bgcolor: 'rgba(251,191,36,0.05)' }}>
                    <Box display="flex" alignItems="center" justifyContent="center" gap={1}><Star size={24} fill="#fbbf24" /> Prime</Box>
                  </TableCell>
                  <TableCell align="center" sx={{ color: '#10b981', fontWeight: 800, fontSize: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Enterprise</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {COMPARISON_FEATURES.map((row, i) => (
                  <TableRow key={i} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: 'rgba(255,255,255,0.01)' } }}>
                    <TableCell component="th" scope="row" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '1.05rem', borderBottom: '1px solid rgba(255,255,255,0.04)', py: 3, pl: 5 }}>
                      {row.label}
                    </TableCell>
                    
                    <TableCell align="center" sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)', py: 3 }}>
                      {typeof row.basic === 'boolean' 
                        ? (row.basic ? <Check size={24} color="#94a3b8" style={{margin: 'auto'}} strokeWidth={3}/> : <X size={24} color="rgba(255,255,255,0.2)" style={{margin: 'auto'}} strokeWidth={3}/>)
                        : <Typography color="#94a3b8" fontWeight={700} variant="body1">{row.basic}</Typography>}
                    </TableCell>
                    
                    <TableCell align="center" sx={{ bgcolor: 'rgba(251,191,36,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)', py: 3 }}>
                      {typeof row.pro === 'boolean' 
                        ? (row.pro ? <Check size={28} color="#fbbf24" style={{margin: 'auto'}} strokeWidth={4}/> : <X size={24} color="rgba(255,255,255,0.2)" style={{margin: 'auto'}} strokeWidth={3}/>)
                        : <Typography color="#fbbf24" fontWeight={900} variant="body1">{row.pro}</Typography>}
                    </TableCell>
                    
                    <TableCell align="center" sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)', py: 3 }}>
                      {typeof row.squad === 'boolean' 
                        ? (row.squad ? <Check size={24} color="#10b981" style={{margin: 'auto'}} strokeWidth={3}/> : <X size={24} color="rgba(255,255,255,0.2)" style={{margin: 'auto'}} strokeWidth={3}/>)
                        : <Typography color="#10b981" fontWeight={800} variant="body1">{row.squad}</Typography>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </motion.div>

        {/* ── Payment / Invoice History ── */}
        <Box component={motion.div} variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <Typography variant="h4" fontWeight={900} color="white" mb={4} display="flex" alignItems="center" gap={2} sx={{ letterSpacing: '-0.5px' }}>
            <RefreshCw size={28} color="#6366f1" /> Billing History & Invoices
          </Typography>

          {history.length === 0 ? (
            <Box sx={{ p: 8, textAlign: 'center', borderRadius: '24px', bgcolor: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <CreditCard size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 20px' }} />
              <Typography color="white" fontWeight={800} variant="h5" mb={1.5}>No Past Transactions</Typography>
              <Typography color="rgba(255,255,255,0.5)" variant="body1">Your billing history will uniquely appear here once you subscribe to a premium plan.</Typography>
            </Box>
          ) : (
            <Paper sx={{ borderRadius: '20px', overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ '& th': { color: 'rgba(255,255,255,0.5)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.08)', bgcolor: 'rgba(255,255,255,0.02)', py: 3 } }}>
                    <TableCell sx={{ pl: 4 }}>Date</TableCell>
                    <TableCell>Plan Tier</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right" sx={{ pr: 4 }}>Invoice</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id} sx={{ '& td': { color: 'white', borderBottom: '1px solid rgba(255,255,255,0.04)', py: 3 }, '&:last-child td': { borderBottom: 0 }, '&:hover': { bgcolor: 'rgba(255,255,255,0.01)' } }}>
                      <TableCell sx={{ fontWeight: 600, pl: 4 }}>{fmt(item.date)}</TableCell>
                      <TableCell>
                        <Chip label={item.plan?.toUpperCase()} size="small" sx={{ bgcolor: 'rgba(99,102,241,0.15)', color: '#818cf8', fontWeight: 800, borderRadius: '8px', px: 1, py: 2 }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'white', fontSize: '1.05rem' }}>₹{(item.amount || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#10b981', boxShadow: '0 0 12px #10b981' }} />
                          <Typography variant="body1" color="#10b981" fontWeight={700}>Successful</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 4 }}>
                         <Button size="medium" sx={{ color: '#fbbf24', textTransform: 'none', fontWeight: 700 }}>Download</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </Box>

        {/* Footer info */}
        <Box mt={12} pt={6} pb={6} textAlign="center" component={motion.div} variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <Typography variant="body1" color="rgba(255,255,255,0.3)" maxWidth="700px" mx="auto" sx={{ lineHeight: 1.6 }}>
            {isRealGateway 
              ? 'StudyFriend uses global standard Razorpay encryption for all transactions. Your payment details are fully secure and never stored on our servers.' 
              : 'You are viewing the gateway in Demo mode. Upgrade functions are active, but no real money will be charged until live keys are provided.'}
          </Typography>
        </Box>

      </Container>
    </Box>
  );
}
