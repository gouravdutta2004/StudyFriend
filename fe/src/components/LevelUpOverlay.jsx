/**
 * LevelUpOverlay — Global Rank-Up Celebration
 *
 * Usage: import { useLevelUp } from '../context/LevelUpContext'
 *        const { triggerLevelUp } = useLevelUp();
 *        triggerLevelUp(newLevel);
 *
 * Mount <LevelUpOverlay /> once in App.jsx (inside providers).
 */
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Star } from 'lucide-react';

/* ── Context ── */
const LevelUpContext = createContext(null);

export function LevelUpProvider({ children }) {
  const [overlay, setOverlay] = useState(null); // { level }

  const triggerLevelUp = (level) => setOverlay({ level });
  const dismiss        = ()      => setOverlay(null);

  return (
    <LevelUpContext.Provider value={{ triggerLevelUp }}>
      {children}
      <LevelUpOverlay overlay={overlay} onDismiss={dismiss} />
    </LevelUpContext.Provider>
  );
}

export function useLevelUp() {
  const ctx = useContext(LevelUpContext);
  if (!ctx) throw new Error('useLevelUp must be used inside LevelUpProvider');
  return ctx;
}

/* ── Particle ── */
function Particle({ delay, duration, x, y, color, size }) {
  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ x, y, opacity: 0, scale: 0, rotate: Math.random() * 720 - 360 }}
      transition={{ delay, duration, ease: 'easeOut' }}
      style={{
        position: 'absolute', top: '50%', left: '50%',
        width: size, height: size, borderRadius: '50%',
        background: color, pointerEvents: 'none',
      }}
    />
  );
}

const PARTICLE_COLORS = ['#6366f1','#a78bfa','#22d3ee','#10b981','#f59e0b','#f97316','#ec4899','#ffffff'];

function generateParticles(count = 80) {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    delay: Math.random() * 0.3,
    duration: 0.8 + Math.random() * 1.2,
    x: (Math.random() - 0.5) * window.innerWidth * 0.9,
    y: (Math.random() - 0.5) * window.innerHeight * 0.9,
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    size: 4 + Math.random() * 10,
  }));
}

/* ── Level badge ring colours ── */
function getLevelColor(level) {
  if (level >= 16) return { primary: '#f59e0b', glow: '#f59e0b' }; // Gold Legend
  if (level >= 11) return { primary: '#8b5cf6', glow: '#8b5cf6' }; // Purple Elite
  if (level >= 6)  return { primary: '#3b82f6', glow: '#3b82f6' }; // Blue Veteran
  return { primary: '#10b981', glow: '#10b981' };                   // Green Rookie
}

/* ── Main Overlay ── */
function LevelUpOverlay({ overlay, onDismiss }) {
  const particles = useRef([]);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (overlay) {
      particles.current = generateParticles(100);
      setShowParticles(true);
      const t = setTimeout(onDismiss, 5000); // auto-dismiss after 5s
      return () => clearTimeout(t);
    }
  }, [overlay]);

  const { primary, glow } = overlay ? getLevelColor(overlay.level) : {};

  return (
    <AnimatePresence>
      {overlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
          style={{
            position: 'fixed', inset: 0, zIndex: 999999,
            background: 'rgba(5,8,18,0.92)', backdropFilter: 'blur(16px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
            cursor: 'pointer',
          }}
        >
          {/* Particles */}
          {showParticles && particles.current.map(p => <Particle key={p.id} {...p} />)}

          {/* Glow ring */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: [0.4, 1.15, 1], opacity: [0, 1, 1] }}
            transition={{ duration: 0.6, ease: 'backOut' }}
            style={{
              position: 'relative', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 24,
            }}
          >
            {/* Pulsing glow orb */}
            <motion.div
              animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.6, 0.35] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', width: 320, height: 320,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${glow}40 0%, transparent 70%)`,
                pointerEvents: 'none',
              }}
            />

            {/* Hexagon level badge */}
            <motion.div
              animate={{ rotate: [0, 4, -4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ position: 'relative', width: 140, height: 140 }}
            >
              {/* SVG hex */}
              <svg viewBox="0 0 100 115" style={{ position: 'absolute', inset: 0 }}>
                <defs>
                  <filter id="lvlGlow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <polygon
                  points="50,5 95,27.5 95,87.5 50,110 5,87.5 5,27.5"
                  fill={`${primary}22`}
                  stroke={primary}
                  strokeWidth="2.5"
                  filter="url(#lvlGlow)"
                />
                <polygon
                  points="50,14 86,33.5 86,82.5 50,102 14,82.5 14,33.5"
                  fill="none"
                  stroke={`${primary}55`}
                  strokeWidth="1"
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 900, color: primary, letterSpacing: 2, textTransform: 'uppercase' }}>LVL</span>
                <span style={{ fontFamily: 'monospace', fontSize: '2.8rem', fontWeight: 900, color: 'white', lineHeight: 1, textShadow: `0 0 20px ${glow}` }}>
                  {overlay.level}
                </span>
              </div>
            </motion.div>

            {/* RANK UP text */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8,
              }}>
                <Star size={18} color={glow} fill={glow} />
                <span style={{
                  fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 900,
                  color: primary, letterSpacing: 4, textTransform: 'uppercase',
                }}>
                  RANK UP
                </span>
                <Star size={18} color={glow} fill={glow} />
              </div>
              <div style={{
                fontSize: '2.2rem', fontWeight: 900, color: 'white',
                letterSpacing: -1, textShadow: `0 0 30px ${glow}88`,
              }}>
                Level {overlay.level} Unlocked!
              </div>
              <div style={{
                fontSize: '1rem', color: 'rgba(255,255,255,0.55)', fontWeight: 600, marginTop: 8,
              }}>
                Keep studying to reach Level {overlay.level + 1}
              </div>
            </motion.div>

            {/* Icon row */}
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.55 }}
              style={{ display: 'flex', gap: 18, alignItems: 'center' }}
            >
              {[Trophy, Zap, Trophy].map((Icon, i) => (
                <motion.div key={i}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }}
                >
                  <Icon size={24} color={i === 1 ? '#f59e0b' : primary} fill={i === 1 ? '#f59e0b' : `${primary}44`} />
                </motion.div>
              ))}
            </motion.div>

            {/* Tap to continue */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0] }}
              transition={{ delay: 1.5, duration: 1.5, repeat: Infinity }}
              style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase' }}
            >
              TAP ANYWHERE TO CONTINUE
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LevelUpOverlay;
