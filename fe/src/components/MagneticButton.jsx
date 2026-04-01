import React, { useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function MagneticButton({ children, width = 'auto', className = '', ...props }) {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Spring configuration for raw snappy rubber-band physics
  const springConfig = { stiffness: 150, damping: 15, mass: 0.1 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    // Move the button 30% of the distance from its center to cursor
    x.set(middleX * 0.3);
    y.set(middleY * 0.3);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{ x, y, width, display: width === '100%' ? 'block' : 'inline-block' }}
      className={className}
    >
      <motion.div
         style={{ width: '100%' }}
         animate={{ scale: isHovered ? 1.05 : 1 }}
         whileTap={{ scale: 0.95 }}
         transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {React.cloneElement(children, { ...props })}
      </motion.div>
    </motion.div>
  );
}
