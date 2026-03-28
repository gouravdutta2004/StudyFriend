import React, { useContext } from 'react';
import { Box, Typography } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
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

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{
        bgcolor: 'rgba(15, 23, 42, 0.9)',
        color: 'white',
        p: 1.5,
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
      }}>
        <Typography variant="caption" fontWeight={800} sx={{ display: 'block', mb: 0.5, color: 'rgba(255,255,255,0.6)' }}>
          {label} Focus
        </Typography>
        <Typography variant="body1" fontWeight={900}>
          {payload[0].value} <span style={{ fontSize: '0.8em', opacity: 0.7 }}>hrs</span>
        </Typography>
      </Box>
    );
  }
  return null;
};

const StudyAnalyticsWidget = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Box sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="body1" fontWeight={900} color={isDark ? "white" : "#0f172a"} display="flex" alignItems="center" gap={1.5}>
          <Activity size={20} color="#ec4899" /> Weekly Focus Flow
        </Typography>
        <Box sx={{ bgcolor: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', px: 1.5, py: 0.5, borderRadius: '100px' }}>
          <Typography variant="caption" fontWeight={900}>+14% vs last week</Typography>
        </Box>
      </Box>

      <Typography variant="caption" color={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} fontWeight={600} mb={3}>
        Deep-work velocity engine tracking connected hours.
      </Typography>

      <Box sx={{ flex: 1, minHeight: 150, width: '100%', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={focusData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontSize: 12, fontWeight: 700 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontSize: 12, fontWeight: 700 }} 
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(236, 72, 153, 0.4)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area 
              type="monotone" 
              dataKey="hours" 
              stroke="#ec4899" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorHours)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: '#ec4899' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default StudyAnalyticsWidget;
