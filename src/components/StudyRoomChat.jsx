import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, IconButton } from '@mui/material';
import { Send, Hash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

export default function StudyRoomChat({ socket, roomId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
    };
    
    socket.on('room_message', handleNewMessage);
    return () => socket.off('room_message', handleNewMessage);
  }, [socket]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    
    const newMsg = {
      id: Date.now().toString(),
      sender: user.name,
      senderId: user._id,
      text: input,
      timestamp: new Date()
    };
    
    socket.emit('room_message', { roomId, message: newMsg });
    setMessages(prev => [...prev, newMsg]);
    setInput('');
  };

  return (
    <Box sx={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      bgcolor: 'rgba(0,0,0,0.2)', 
      borderRadius: 4, 
      overflow: 'hidden', 
      border: '1px solid rgba(255,255,255,0.05)',
      minHeight: 300
    }}>
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Hash size={18} color="#60a5fa" />
        <Typography variant="subtitle2" fontWeight={700}>Room Chat</Typography>
      </Box>
      
      <Box sx={{ flex: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {messages.map((m, i) => {
          const isMe = m.senderId === user._id;
          const showHeader = i === 0 || messages[i-1].senderId !== m.senderId;
          return (
            <Box key={m.id || i} sx={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              {showHeader && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mb: 0.5, ml: 1, display: 'block', textAlign: isMe ? 'right' : 'left' }}>
                  {isMe ? 'You' : m.sender} • {format(new Date(m.timestamp), 'h:mm a')}
                </Typography>
              )}
              <Box sx={{ 
                p: 1.5, 
                px: 2,
                bgcolor: isMe ? 'primary.main' : 'rgba(255,255,255,0.1)', 
                color: 'white',
                borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                wordBreak: 'break-word',
                fontSize: 14
              }}>
                {m.text}
              </Box>
            </Box>
          );
        })}
        <div ref={endRef} />
      </Box>

      <form onSubmit={sendMessage} style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField 
            fullWidth 
            size="small" 
            placeholder="Type a message..." 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.05)',
                borderRadius: 20,
                '& fieldset': { border: 'none' },
              }
            }}
          />
          <IconButton type="submit" color="primary" sx={{ bgcolor: 'rgba(59,130,246,0.1)', '&:hover': { bgcolor: 'rgba(59,130,246,0.2)' } }}>
            <Send size={18} />
          </IconButton>
        </Box>
      </form>
    </Box>
  );
}
