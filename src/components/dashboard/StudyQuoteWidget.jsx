import { useState, useEffect } from 'react';
import { Box, Typography, Skeleton, useTheme, IconButton } from '@mui/material';
import { RefreshCw, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function StudyQuoteWidget() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fallbackQuotes = [
    { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { quote: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
    { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { quote: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
    { quote: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
    { quote: "Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.", author: "Richard Feynman" }
  ];

  const useFallbackQuote = () => {
    const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    setQuote(randomQuote);
    setError(false);
  };

  const fetchQuote = async () => {
    const apiKey = import.meta.env.VITE_RAPID_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_RAPID_API_KEY_HERE') {
      useFallbackQuote();
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    
    try {
      const options = {
        method: 'GET',
        url: 'https://quotes-inspirational-quotes-motivational-quotes.p.rapidapi.com/quote',
        params: { token: 'ipworld.info' },
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'quotes-inspirational-quotes-motivational-quotes.p.rapidapi.com',
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.request(options);
      const data = response.data;
      
      let quoteText = '';
      let quoteAuthor = 'Unknown';

      if (Array.isArray(data) && data.length > 0) {
        quoteText = data[0].text || data[0].quote;
        quoteAuthor = data[0].author || 'Unknown';
      } else if (data) {
        quoteText = data.text || data.quote;
        quoteAuthor = data.author || 'Unknown';
      }

      if (quoteText) {
        setQuote({ quote: quoteText, author: quoteAuthor });
      } else {
        throw new Error('No quote received or format unrecognizable');
      }
    } catch (err) {
      console.error("RapidAPI Error:", err);
      useFallbackQuote();
      // Silently failover to local quotes without toasting an error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  return (
    <Box sx={{
      p: 3, 
      height: '100%',
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center',
      position: 'relative'
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={800} display="flex" alignItems="center" gap={1}>
          <Quote size={20} color="#6366f1" /> Daily Inspiration
        </Typography>
        <IconButton 
          size="small" 
          onClick={fetchQuote} 
          disabled={loading}
          sx={{ 
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            '&:hover': { color: '#6366f1', bgcolor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.1)' }
          }}
        >
          <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </IconButton>
      </Box>

      {error ? (
        <Box sx={{ 
          p: 2, 
          borderRadius: 3, 
          bgcolor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
          border: '1px dashed',
          borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.3)',
          textAlign: 'center'
        }}>
          <Typography variant="body2" color={isDark ? '#f87171' : '#ef4444'} fontWeight={600}>
            RapidAPI Key missing or invalid.
          </Typography>
          <Typography variant="caption" color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'} display="block" mt={1}>
            Add VITE_RAPID_API_KEY to fe/.env to unlock live quotes!
          </Typography>
        </Box>
      ) : loading ? (
        <Box>
          <Skeleton variant="text" sx={{ fontSize: '1.2rem', bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} />
          <Skeleton variant="text" sx={{ fontSize: '1.2rem', width: '80%', bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} />
          <Skeleton variant="text" sx={{ fontSize: '0.9rem', width: '40%', mt: 2, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} />
        </Box>
      ) : quote ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
          <Typography variant="body1" sx={{ 
            fontStyle: 'italic', 
            fontWeight: 500,
            color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
            mb: 2,
            lineHeight: 1.6
          }}>
            "{quote.quote}"
          </Typography>
          <Typography variant="caption" fontWeight={800} sx={{ 
            color: '#6366f1',
            textTransform: 'uppercase',
            letterSpacing: 1
          }}>
            — {quote.author}
          </Typography>
        </motion.div>
      ) : null}
    </Box>
  );
}
