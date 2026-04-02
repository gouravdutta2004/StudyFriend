import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Logo({ size = 36, showText = true, textColor }) {
  return (
    <Box component={Link} to="/dashboard" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none' }}>
      {/* Animated Glowing Geometric Logo */}
      <motion.div
        whileHover={{ scale: 1.05, rotate: 3 }}
        whileTap={{ scale: 0.95 }}
        style={{ display: 'flex', cursor: 'pointer' }}
      >
        <img src="/logo.png" alt="StudyFriend Logo" style={{ width: size, height: size, objectFit: 'contain', borderRadius: '25%' }} />
      </motion.div>

      {/* Brand Name Text */}
      {showText && (
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            fontWeight: 900, 
            fontSize: size * 0.6, 
            letterSpacing: '-0.5px', 
            userSelect: 'none',
            color: textColor || 'inherit',
            background: textColor ? 'none' : 'linear-gradient(90deg, #4f46e5 0%, #ec4899 100%)',
            WebkitBackgroundClip: textColor ? 'initial' : 'text',
            WebkitTextFillColor: textColor ? 'initial' : 'transparent',
            display: 'inline-block',
            lineHeight: 1
          }}
        >
          StudyFriend
        </Typography>
      )}
    </Box>
  );
}
