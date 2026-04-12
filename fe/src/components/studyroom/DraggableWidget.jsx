import React, { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FONT = "'Inter', -apple-system, sans-serif";

export default function DraggableWidget({ 
  id, roomId, title, icon: Icon, children, 
  onClose, defaultPosition = { x: 50, y: 50 }, defaultSize = { width: 360, height: 480 },
  minWidth = 280, minHeight = 200, color = "#6366F1", zIndex = 110, onClick
}) {
  const [minimized, setMinimized] = useState(false);
  const [size, setSize] = useState(defaultSize);
  const [position, setPosition] = useState(defaultPosition);

  // Storage key specific to this widget and room
  const storageKey = `sf_widget_${roomId}_${id}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.size) setSize(parsed.size);
        if (parsed.position) setPosition(parsed.position);
      }
    } catch (err) {
      console.error('Failed to load widget state', err);
    }
  }, [storageKey]);

  const saveState = (newSize, newPos) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ 
        size: newSize || size, 
        position: newPos || position 
      }));
    } catch (e) {}
  };

  return (
    <Rnd
      size={minimized ? { width: 240, height: 48 } : size}
      position={position}
      onDragStop={(e, d) => {
        const newPos = { x: d.x, y: d.y };
        setPosition(newPos);
        saveState(size, newPos);
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        if (minimized) return; // Prevent resizing when minimized
        const newSize = { width: ref.style.width, height: ref.style.height };
        setSize(newSize);
        setPosition(position);
        saveState(newSize, position);
      }}
      minWidth={minimized ? 240 : minWidth}
      minHeight={minimized ? 48 : minHeight}
      bounds="parent"
      dragHandleClassName="drag-handle"
      disableDragging={false}
      style={{
        zIndex,
        display: 'flex',
        flexDirection: 'column',
      }}
      // Ensure we trigger z-index pop-to-top internally if host passes onClick
      onMouseDownCapture={onClick}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        style={{
          width: '100%',
          height: '100%',
          background: 'rgba(15,23,42,0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: `1px solid ${color}40`,
          borderRadius: 16,
          boxShadow: `0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: FONT,
        }}
      >
        {/* Header / Drag Handle */}
        <div
          className="drag-handle"
          style={{
            height: 48,
            minHeight: 48,
            background: `linear-gradient(90deg, ${color}15, transparent)`,
            borderBottom: `1px solid ${color}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            cursor: 'grab',
            userSelect: 'none',
          }}
          onMouseDown={(e) => e.currentTarget.style.cursor = 'grabbing'}
          onMouseUp={(e) => e.currentTarget.style.cursor = 'grab'}
          onDoubleClick={() => setMinimized(!minimized)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {Icon && <Icon size={16} color={color} />}
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f1f5f9', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              {title}
            </span>
          </div>
          
          {/* Controls */}
          <div className="nodrag" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'default' }}>
            <button
              onClick={(e) => { e.stopPropagation(); setMinimized(!minimized); }}
              style={{
                width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
            >
              {minimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              style={{
                width: 24, height: 24, borderRadius: 6, background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence>
          {!minimized && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: '100%' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              className="nodrag"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Rnd>
  );
}
