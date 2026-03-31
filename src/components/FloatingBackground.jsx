import React from 'react';
import { Box } from '@mui/material';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

export default function FloatingBackground() {
  return (
    <Box sx={{ 
      position: 'absolute', 
      top: 0, left: 0, right: 0, bottom: 0, 
      overflow: 'hidden', 
      zIndex: 0, 
      pointerEvents: 'none' 
    }}>
      {/* Abstract Shape 1: Emerald Orb */}
      <motion.div
        animate={{
          y: [0, -40, 0],
          x: [0, 20, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          filter: 'blur(100px)',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          borderRadius: '50%'
        }}
      />
      
      {/* Abstract Shape 2: Indigo Orb */}
      <motion.div
        animate={{
          y: [0, 30, 0],
          x: [0, -30, 0],
          rotate: [0, -10, 10, 0]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '600px',
          height: '600px',
          filter: 'blur(120px)',
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          borderRadius: '50%'
        }}
      />

      {/* Abstract Shape 3: Rose Orb */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5
        }}
        style={{
          position: 'absolute',
          top: '40%',
          left: '30%',
          width: '400px',
          height: '400px',
          filter: 'blur(150px)',
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          borderRadius: '50%'
        }}
      />
    </Box>
  );
}
