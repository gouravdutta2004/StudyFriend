import React, { useState } from 'react';
import { Box, Typography, IconButton, useTheme } from '@mui/material';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';

export default function MiniCalendarWidget() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={900} display="flex" alignItems="center" gap={1.5} color={isDark ? "white" : "#0F172A"}>
          <CalendarIcon size={20} color="#6366F1" /> Overview
        </Typography>
        <Box display="flex" alignItems="center" gap={1} bgcolor={isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.15)"} borderRadius="100px" p={0.5} border={isDark ? "1px solid rgba(99,102,241,0.2)" : "1px solid rgba(99,102,241,0.3)"}>
          <IconButton onClick={prevMonth} size="small" sx={{ p: 0.5, color: '#6366F1' }}><ChevronLeft size={16} /></IconButton>
          <Typography variant="caption" fontWeight={800} width={60} sx={{ textAlign: 'center', color: isDark ? 'white' : '#0F172A' }}>{format(currentMonth, 'MMM yyyy')}</Typography>
          <IconButton onClick={nextMonth} size="small" sx={{ p: 0.5, color: '#6366F1' }}><ChevronRight size={16} /></IconButton>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 2 }}>
        {weekDays.map((day, i) => (
          <Typography key={i} variant="caption" fontWeight={800} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(15,23,42,0.4)"} textAlign="center">
            {day}
          </Typography>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, flex: 1 }}>
        {days.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);
          
          return (
            <Box 
              key={i} 
              sx={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                color: isCurrentDay ? 'white' : (isCurrentMonth ? (isDark ? 'rgba(255,255,255,0.8)' : 'rgba(15,23,42,0.8)') : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.3)')),
                bgcolor: isCurrentDay ? '#6366F1' : 'transparent',
                fontWeight: isCurrentDay ? 900 : 700,
                boxShadow: isCurrentDay ? '0 0 15px rgba(99,102,241,0.6)' : 'none',
                minHeight: '36px',
                '&:hover': { bgcolor: isCurrentDay ? '#8B5CF6' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.05)') }
              }}
            >
              <Typography variant="body2">{format(day, 'd')}</Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
