import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

const focusData = [
  { day: 'Mon', hours: 2.5 },
  { day: 'Tue', hours: 3.8 },
  { day: 'Wed', hours: 1.5 },
  { day: 'Thu', hours: 4.2 },
  { day: 'Fri', hours: 5.0 },
  { day: 'Sat', hours: 1.2 },
  { day: 'Sun', hours: 6.5 },
];

const CustomTooltip = ({ active, payload, label, isDark }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        color: isDark ? 'white' : '#0F172A',
        p: 2,
        borderRadius: '16px',
        border: '1px solid rgba(99,102,241,0.3)',
        backdropFilter: 'blur(12px)',
        boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(15,23,42,0.1)'
      }}>
        <Typography variant="caption" fontWeight={800} sx={{ display: 'block', mb: 0.5, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)' }}>
          {label} Snapshot
        </Typography>
        <Typography variant="h6" fontWeight={900} color="#22D3EE">
          {payload[0].value} <span style={{ fontSize: '0.6em', opacity: 0.7, color: isDark ? 'white' : '#0F172A' }}>hrs</span>
        </Typography>
      </Box>
    );
  }
  return null;
};

const StudyAnalyticsWidget = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" fontWeight={900} color={isDark ? "white" : "#0F172A"} display="flex" alignItems="center" gap={1.5}>
          <Activity size={20} color="#6366F1" /> Study Velocity
        </Typography>
        <Box sx={{ bgcolor: 'rgba(34, 211, 238, 0.1)', color: '#22D3EE', px: 2, py: 0.5, borderRadius: '100px', border: '1px solid rgba(34,211,238,0.2)' }}>
          <Typography variant="caption" fontWeight={900}>+14% Acceleration</Typography>
        </Box>
      </Box>

      <Typography variant="caption" color={isDark ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.5)"} fontWeight={600} mb={4}>
        Real-time deep-work velocity tracking across all matrices.
      </Typography>

      <Box sx={{ flex: 1, minHeight: 220, width: '100%', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={focusData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.6)', fontSize: 13, fontWeight: 700 }} 
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.6)', fontSize: 13, fontWeight: 700 }} 
            />
            <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ stroke: 'rgba(34, 211, 238, 0.4)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area 
              type="monotone" 
              dataKey="hours" 
              stroke="#22D3EE" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorVelocity)" 
              activeDot={{ r: 8, strokeWidth: 0, fill: '#6366F1', style: { filter: 'drop-shadow(0px 0px 8px rgba(34,211,238,0.8))' } }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default StudyAnalyticsWidget;
