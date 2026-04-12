import React, { useState, useEffect, useRef } from 'react';
import { Send, Hash, Smile } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceReactions from './studyroom/VoiceReactions';

const T = {
  bg:      '#0F172A',
  card:    '#1E293B',
  glass:   'rgba(30,41,59,0.6)',
  primary: '#6366F1',
  accent:  '#22C55E',
  border:  'rgba(99,102,241,0.18)',
  bSub:    'rgba(255,255,255,0.06)',
  text:    '#F1F5F9',
  muted:   '#94A3B8',
  dim:     '#475569',
};

const EMOJI_QUICK = ['👍', '🔥', '💡', '😂', '❤️', '🎯'];

export default function StudyRoomChat({ socket, roomId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const endRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    const handleMsg = (msg) => setMessages(prev => [...prev, msg]);
    socket.on('room_message', handleMsg);
    return () => socket.off('room_message', handleMsg);
  }, [socket]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e?.preventDefault();
    if (!input.trim() || !socket) return;
    const newMsg = {
      id: Date.now().toString(),
      sender: user.name,
      senderId: user._id,
      text: input,
      timestamp: new Date(),
    };
    socket.emit('room_message', { roomId, message: newMsg });
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setShowEmoji(false);
  };

  const appendEmoji = (emoji) => {
    setInput(prev => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'rgba(15,23,42,0.5)', borderRadius: 14,
      border: `1px solid ${T.bSub}`, overflow: 'hidden', minHeight: 280,
      position: 'relative', // Ensure nested particles stay within bounds
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${T.bSub}`,
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(99,102,241,0.06)',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Hash size={14} color={T.primary} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>Room Chat</span>
        <div style={{
          marginLeft: 'auto', padding: '2px 8px', borderRadius: 6,
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
          fontSize: 10, fontWeight: 700, color: '#22C55E',
        }}>
          {messages.length} messages
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, padding: '12px', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 6,
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,102,241,0.3) transparent',
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: 0.4, paddingTop: 40,
          }}>
            <Hash size={32} color={T.dim} />
            <p style={{ color: T.muted, fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
              No messages yet.<br />Start the conversation!
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, i) => {
            const isMe = m.senderId === user._id;
            const showHeader = i === 0 || messages[i - 1]?.senderId !== m.senderId;
            const colors = ['#6366F1','#22C55E','#F59E0B','#EC4899','#14B8A6'];
            const avatarColor = isMe ? T.primary : colors[(m.sender?.charCodeAt(0) || 0) % colors.length];

            return (
              <motion.div
                key={m.id || i}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                }}
              >
                {showHeader && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3,
                    flexDirection: isMe ? 'row-reverse' : 'row',
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${avatarColor}aa, ${avatarColor})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 800, color: '#fff',
                      boxShadow: `0 0 6px ${avatarColor}55`,
                    }}>
                      {(m.sender?.[0] || '?').toUpperCase()}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>
                      {isMe ? 'You' : m.sender} · {format(new Date(m.timestamp), 'h:mm a')}
                    </span>
                  </div>
                )}
                <div style={{
                  padding: '8px 12px', maxWidth: '85%',
                  background: isMe
                    ? `linear-gradient(135deg, #6366F1, #818CF8)`
                    : 'rgba(255,255,255,0.07)',
                  border: isMe ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  boxShadow: isMe
                    ? '0 4px 12px rgba(99,102,241,0.3)'
                    : '0 2px 8px rgba(0,0,0,0.2)',
                  wordBreak: 'break-word', fontSize: 13, color: T.text, lineHeight: 1.5,
                }}>
                  {m.text}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Emoji quick-picks */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              display: 'flex', gap: 6, padding: '8px 14px',
              borderTop: `1px solid ${T.bSub}`,
              background: 'rgba(15,23,42,0.5)',
            }}
          >
            {EMOJI_QUICK.map(e => (
              <button
                key={e}
                onClick={() => appendEmoji(e)}
                style={{
                  fontSize: 20, background: 'none', border: 'none',
                  cursor: 'pointer', borderRadius: 8, padding: 4,
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={el => el.currentTarget.style.transform = 'scale(1.3)'}
                onMouseLeave={el => el.currentTarget.style.transform = 'scale(1)'}
              >
                {e}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Reactions Bar (Emojis that fly up) */}
      <div style={{ padding: '0 8px', background: 'rgba(15,23,42,0.5)', zIndex: 10 }}>
        {socket && <VoiceReactions socket={socket} roomId={roomId} />}
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        style={{
          padding: '10px 12px',
          borderTop: `1px solid ${T.bSub}`,
          background: 'rgba(15,23,42,0.6)',
          display: 'flex', gap: 8, alignItems: 'center',
        }}
      >
        <button
          type="button"
          onClick={() => setShowEmoji(v => !v)}
          style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: showEmoji ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${showEmoji ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
            color: showEmoji ? T.primary : T.muted,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          <Smile size={14} />
        </button>

        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(e)}
          placeholder="Message the room…"
          style={{
            flex: 1, background: 'rgba(255,255,255,0.05)',
            border: `1px solid rgba(255,255,255,0.08)`,
            borderRadius: 10, padding: '8px 12px',
            color: T.text, fontSize: 13, outline: 'none',
            transition: 'border-color 0.2s',
            fontFamily: 'inherit',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
        />

        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!input.trim()}
          style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: input.trim()
              ? 'linear-gradient(135deg, #6366F1, #818CF8)'
              : 'rgba(255,255,255,0.05)',
            border: 'none',
            color: input.trim() ? '#fff' : T.dim,
            cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: input.trim() ? '0 4px 12px rgba(99,102,241,0.4)' : 'none',
            transition: 'all 0.3s ease',
          }}
        >
          <Send size={14} />
        </motion.button>
      </form>
    </div>
  );
}
