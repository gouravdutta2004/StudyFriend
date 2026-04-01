import React, { useState } from 'react';
import { Box, Typography, IconButton, useTheme } from '@mui/material';
import { Quote, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const quotes = [
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" }
];

export default function StudyQuoteWidget() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [index, setIndex] = useState(0);
  
  const generateNewQuote = () => setIndex((prev) => (prev + 1) % quotes.length);

  return (
    <Box className="glass-card" sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundImage: 'radial-gradient(circle at bottom left, rgba(34,211,238,0.1), transparent 70%)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ bgcolor: isDark ? 'rgba(34,211,238,0.1)' : 'rgba(34,211,238,0.2)', p: 1.5, borderRadius: '16px', color: '#22D3EE' }}>
          <Quote size={24} />
        </Box>
        <IconButton onClick={generateNewQuote} sx={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.3)', '&:hover': { color: '#22D3EE', bgcolor: 'rgba(34,211,238,0.1)' } }}>
          <RefreshCw size={18} />
        </IconButton>
      </Box>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <Typography variant="h5" fontWeight={900} color={isDark ? "white" : "#0F172A"} mb={2} lineHeight={1.4} sx={{ fontStyle: 'italic' }}>
            "{quotes[index].text}"
          </Typography>
          <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#22D3EE" : "#0284C7"} letterSpacing={1} textTransform="uppercase">
            — {quotes[index].author}
          </Typography>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
}
