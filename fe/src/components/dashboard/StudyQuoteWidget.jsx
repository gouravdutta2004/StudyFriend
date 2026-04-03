import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, IconButton, CircularProgress, useTheme } from '@mui/material';
import { Quote, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FALLBACK_QUOTES = [
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "Success is not final, failure is not fatal — it is the courage to continue that counts.", author: "Winston Churchill" },
];

async function fetchQuote() {
  try {
    // ZenQuotes requires a CORS proxy in browser environments
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent('https://zenquotes.io/api/random')}`;
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(5000) });
    const outer = await res.json();
    const data = JSON.parse(outer.contents);
    if (data && data[0]) {
      return { text: data[0].q, author: data[0].a };
    }
  } catch { /* fall through to fallback */ }
  // On failure, return a random fallback quote
  return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
}

export default function StudyQuoteWidget() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadQuote = useCallback(async () => {
    setLoading(true);
    const q = await fetchQuote();
    setQuote(q);
    setLoading(false);
  }, []);

  useEffect(() => { loadQuote(); }, [loadQuote]);

  return (
    <Box className="glass-card" sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundImage: 'radial-gradient(circle at bottom left, rgba(34,211,238,0.1), transparent 70%)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ bgcolor: isDark ? 'rgba(34,211,238,0.1)' : 'rgba(34,211,238,0.2)', p: 1.5, borderRadius: '16px', color: '#22D3EE' }}>
          <Quote size={24} />
        </Box>
        <IconButton
          onClick={loadQuote}
          disabled={loading}
          sx={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.3)', '&:hover': { color: '#22D3EE', bgcolor: 'rgba(34,211,238,0.1)' } }}
        >
          {loading
            ? <CircularProgress size={18} sx={{ color: '#22D3EE' }} />
            : <RefreshCw size={18} />
          }
        </IconButton>
      </Box>

      <AnimatePresence mode="wait">
        {loading && !quote ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
              <CircularProgress size={28} sx={{ color: '#22D3EE' }} />
            </Box>
          </motion.div>
        ) : quote ? (
          <motion.div key={quote.text} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <Typography variant="h5" fontWeight={900} color={isDark ? "white" : "#0F172A"} mb={2} lineHeight={1.4} sx={{ fontStyle: 'italic' }}>
              "{quote.text}"
            </Typography>
            <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#22D3EE" : "#0284C7"} letterSpacing={1} textTransform="uppercase">
              — {quote.author}
            </Typography>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Box>
  );
}



