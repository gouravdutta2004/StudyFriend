import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Button, Chip, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { Check, BookOpen, ShieldCheck, AlertCircle, Clock, FileText, Download } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const PLANS = [
  { key: 'basic', name: 'PUBLIC INDEX', price: 0, period: 'PERPETUAL', desc: 'Core matching and public registry access.', features: ['3 Active Connections', 'Public Squads Only', 'Basic Ledger', 'Standard Support'], color: '#4b5563' },
  { key: 'pro', name: 'PRO LEDGER', price: 799, period: 'MONTHLY / BILLED ANNUALLY', desc: 'Advanced analytics and private vault access.', features: ['Unlimited Connections', 'Private Squads', 'Full History Sync', 'Priority Node Access'], color: '#0ea5e9', popular: true },
  { key: 'squad', name: 'GUILD CHARTER', price: 1599, period: 'MONTHLY / BILLED ANNUALLY', desc: 'For high-frequency groups and institutions.', features: ['Everything in Pro Ledger', '50 Nodes per Squad', 'Advanced Admin Tooling', 'Immutable Vault Storage'], color: '#10b981' }
];

export default function Billing() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user, updateUser } = useAuth();
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const currentPlan = status?.plan || user?.subscription?.plan || 'basic';
  const activeUntil = status?.activeUntil;
  const isRealGateway = status?.isRealGateway;

  useEffect(() => {
    const script = document.createElement('script'); script.src = 'https://checkout.razorpay.com/v1/checkout.js'; script.async = true; document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      setStatusLoading(true);
      try {
        const [statusRes, historyRes] = await Promise.all([api.get('/billing/status'), api.get('/billing/history')]);
        setStatus(statusRes.data); setHistory(historyRes.data || []);
      } catch (e) { setStatus({ plan: user?.subscription?.plan || 'basic', activeUntil: user?.subscription?.activeUntil }); }
      finally { setStatusLoading(false); }
    };
    fetchStatus();
  }, [user?.subscription]);

  const handleUpgrade = async (planKey) => {
    if (planKey === currentPlan) return toast('Already indexed to this tier', { icon: 'ℹ️', style: {fontFamily: 'monospace'} });
    if (planKey === 'basic') return toast.error('Use CANCEL to return to base tier.');
    setLoading(true);
    try {
      const { data } = await api.post('/billing/create-order', { plan: planKey });
      const { orderId, amount, currency, key_id, isMock } = data;

      if (isMock) {
        const verifyRes = await api.post('/billing/verify', { razorpay_order_id: orderId, razorpay_payment_id: `demo_${Date.now()}`, razorpay_signature: 'mock_sig', plan: planKey, isMock: true });
        toast.success('TRANSACTION VERIFIED', { style: {fontFamily: 'monospace'} });
        updateUser({ ...user, subscription: verifyRes.data.subscription });
        setStatus(prev => ({ ...prev, plan: planKey, activeUntil: verifyRes.data.subscription.activeUntil }));
        setLoading(false); return;
      }

      const options = {
        key: key_id, amount, currency, name: 'SBF Ledger', description: `UPGRADE: ${planKey.toUpperCase()}`, order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/billing/verify', { razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature, plan: planKey, isMock: false });
            toast.success('TRANSACTION VERIFIED', { style: {fontFamily: 'monospace'} });
            updateUser({ ...user, subscription: verifyRes.data.subscription });
            setStatus(prev => ({ ...prev, plan: planKey, activeUntil: verifyRes.data.subscription.activeUntil }));
            const h = await api.get('/billing/history'); setHistory(h.data || []);
          } catch (err) { toast.error('VERIFICATION FAILED', { style: {fontFamily: 'monospace'} }); }
        },
        prefill: { name: user?.name, email: user?.email }, theme: { color: isDark ? '#ffffff' : '#000000' }, modal: { ondismiss: () => setLoading(false) },
      };

      const rzp = new window.Razorpay(options); rzp.on('payment.failed', (r) => { toast.error('TX DROPPED', { style: {fontFamily: 'monospace'} }); setLoading(false); }); rzp.open();
    } catch (err) { toast.error('COULD NOT INITIALIZE', { style: {fontFamily: 'monospace'} }); } finally { setLoading(false); }
  };

  const handleCancel = async () => {
    if (currentPlan === 'basic') return toast('Base tier active.', { icon: 'ℹ️' });
    setCancelling(true);
    try {
      const { data } = await api.post('/billing/cancel'); toast.success('CONTRACT ANNULLED', { style: {fontFamily: 'monospace'} });
      updateUser({ ...user, subscription: data.subscription }); setStatus(prev => ({ ...prev, plan: 'basic', activeUntil: null }));
    } catch (err) { toast.error('FAILED TO CANCEL'); } finally { setCancelling(false); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '00/00/0000';

  const BORDERCOLOR = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  const BG = isDark ? '#050505' : '#fcfcfc';
  const TEXT = isDark ? '#e5e5e5' : '#171717';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: BG, py: { xs: 6, md: 10 }, color: TEXT, fontFamily: 'monospace' }}>
      <Container maxWidth="lg">
        
        {/* Ledger Header */}
        <Box sx={{ borderBottom: `2px solid ${TEXT}`, pb: 2, mb: 6, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'flex-end' } }}>
          <Box>
            <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '2.5rem', letterSpacing: -1, display: 'flex', alignItems: 'center', gap: 2 }}>
              <BookOpen size={36} /> MASTER LEDGER
            </Typography>
            <Typography sx={{ fontFamily: 'monospace', fontWeight: 600, opacity: 0.6 }}>REGISTRATION_ID: {user?._id?.slice(-8).toUpperCase()}</Typography>
          </Box>
          <Box sx={{ textAlign: { sm: 'right' }, mt: { xs: 2, sm: 0 } }}>
            <Typography sx={{ fontFamily: 'monospace', fontWeight: 600, opacity: 0.6 }}>DATE: {fmt(new Date())}</Typography>
            {!statusLoading && (
              <Chip icon={isRealGateway ? <ShieldCheck size={12}/> : <AlertCircle size={12}/>} label={isRealGateway ? 'NODE: LIVE' : 'NODE: DEMO'} size="small" sx={{ mt: 1, borderRadius: 0, fontFamily: 'monospace', fontWeight: 900, border: `1px solid ${TEXT}`, bgcolor: 'transparent', color: TEXT }} />
            )}
          </Box>
        </Box>

        {/* Active Contract */}
        {!statusLoading && currentPlan !== 'basic' && (
          <Box sx={{ mb: 6, p: 3, border: `1px solid ${TEXT}`, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.2rem' }}>ACTIVE_CONTRACT: [{currentPlan.toUpperCase()}]</Typography>
              {activeUntil && <Typography sx={{ fontFamily: 'monospace', opacity: 0.7, display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}><Clock size={14} /> EXPIRES: {fmt(activeUntil)}</Typography>}
            </Box>
            <Button size="small" variant="outlined" onClick={handleCancel} disabled={cancelling} sx={{ borderRadius: 0, fontFamily: 'monospace', fontWeight: 900, borderColor: TEXT, color: TEXT, '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} }}>
              TERMINATE_CONTRACT
            </Button>
          </Box>
        )}

        {/* Tiers / Manifest */}
        <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.2rem', mb: 2, borderBottom: `1px dashed ${BORDERCOLOR}`, pb: 1 }}>// SUBSCRIPTION_MANIFEST</Typography>
        <Grid container spacing={3} sx={{ mb: 8 }}>
          {PLANS.map((plan) => {
            const isActive = currentPlan === plan.key;
            return (
              <Grid item xs={12} md={4} key={plan.key}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: `1px solid ${isActive ? plan.color : BORDERCOLOR}`, bgcolor: isActive ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)') : 'transparent', position: 'relative' }}>
                  
                  {/* Ledger Tab */}
                  <Box sx={{ borderBottom: `1px solid ${isActive ? plan.color : BORDERCOLOR}`, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: isActive ? plan.color : 'transparent', color: isActive ? '#fff' : TEXT }}>
                    <Typography sx={{ fontFamily: 'monospace', fontWeight: 900 }}>{plan.name}</Typography>
                    {plan.popular && !isActive && <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 800, bgcolor: TEXT, color: BG, px: 1 }}>STANDARD</Typography>}
                    {isActive && <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 800, border: '1px solid #fff', px: 1 }}>ACTIVE</Typography>}
                  </Box>

                  <Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                      {plan.price === 0 ? <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '2rem' }}>$0.00</Typography> : (
                        <>
                          <Typography sx={{ fontFamily: 'monospace', fontSize: '1.2rem' }}>INR</Typography>
                          <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '2.5rem' }}>{plan.price.toLocaleString('en-IN')}</Typography>
                        </>
                      )}
                    </Box>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', opacity: 0.6, mb: 3 }}>REF: {plan.period}</Typography>
                    
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem', mb: 3, minHeight: 40 }}>{plan.desc}</Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 4, flex: 1 }}>
                      {plan.features.map(f => (
                        <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px dotted ${BORDERCOLOR}`, pb: 0.5 }}>
                          <Check size={14} color={isActive ? plan.color : TEXT} />
                          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{f}</Typography>
                        </Box>
                      ))}
                    </Box>

                    <Button fullWidth disabled={isActive || loading || statusLoading} onClick={() => handleUpgrade(plan.key)}
                      sx={{ borderRadius: 0, py: 1.5, fontFamily: 'monospace', fontWeight: 900, border: `1px solid ${isActive ? 'transparent' : TEXT}`, bgcolor: isActive ? 'transparent' : TEXT, color: isActive ? TEXT : BG, '&.Mui-disabled': { opacity: 0.5, color: TEXT, border: `1px solid ${TEXT}`, bgcolor: 'transparent' }, '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' } }}>
                      {loading && !isActive ? 'PROCESSING...' : isActive ? '[ CURRENT_TIER ]' : plan.key === 'basic' ? 'DOWNGRADE' : 'AUTHORIZE_UPGRADE'}
                    </Button>
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>

        {/* Transaction History / Ledger Entries */}
        <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.2rem', mb: 2, borderBottom: `1px dashed ${BORDERCOLOR}`, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FileText size={20} /> // LEDGER_ENTRIES
        </Typography>

        {history.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', border: `1px solid ${BORDERCOLOR}` }}>
            <Typography sx={{ fontFamily: 'monospace', opacity: 0.6 }}>NO_ENTRIES_FOUND. LEDGER IS EMPTY.</Typography>
          </Box>
        ) : (
          <Box sx={{ border: `1px solid ${TEXT}`, overflowX: 'auto' }}>
            <Table size="small">
              <TableHead sx={{ borderBottom: `2px solid ${TEXT}` }}>
                <TableRow>
                  {['DATE', 'REF_ID', 'TIER_ID', 'AMOUNT', 'STATUS', 'RECEIPT'].map(h => (
                    <TableCell key={h} sx={{ fontFamily: 'monospace', fontWeight: 900, color: TEXT, borderBottom: 'none' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((item, idx) => (
                  <TableRow key={item.id} sx={{ '& td': { color: TEXT, borderColor: BORDERCOLOR, fontFamily: 'monospace', fontSize: '0.85rem' } }}>
                    <TableCell>{fmt(item.date)}</TableCell>
                    <TableCell>TXN_{item.id.slice(0,8).toUpperCase()}</TableCell>
                    <TableCell>{item.plan?.toUpperCase()}</TableCell>
                    <TableCell fontWeight={700}>INR {item.amount?.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 6, height: 6, bgcolor: '#10b981', borderRadius: '50%' }} /> SETTLED
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Button size="small" sx={{ minWidth: 0, p: 0.5, color: TEXT }}>
                        <Download size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

      </Container>
    </Box>
  );
}
