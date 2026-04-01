import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Send, MessageSquare, ArrowLeft, Search, CheckCheck, Check, Paperclip, Reply, Trash2, X, Terminal, MoreHorizontal, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { format, isToday, isYesterday } from 'date-fns';
import io from 'socket.io-client';
import { Box, Typography, Button, IconButton, TextField, Avatar, useTheme, useMediaQuery, InputAdornment, Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_EMOJIS = ['ACK', 'NACK', 'SYNC', 'PING', '👍', '🔥', '🚀', '⚠️'];

function formatMsgDate(date) {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'HH:mm:ss');
  if (isYesterday(d)) return `T-1 ${format(d, 'HH:mm:ss')}`;
  return format(d, 'MM/dd HH:mm:ss');
}

function groupByDate(messages) {
  const groups = [];
  let lastDate = null;
  messages.forEach(msg => {
    const d = new Date(msg.createdAt);
    const label = isToday(d) ? 'CURRENT CYCLE' : isYesterday(d) ? 'PREVIOUS CYCLE' : format(d, 'yyyy.MM.dd');
    if (label !== lastDate) { groups.push({ type: 'date', label }); lastDate = label; }
    groups.push(msg);
  });
  return groups;
}

export default function Messages() {
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [inbox, setInbox] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [reactions, setReactions] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [showEmojiBar, setShowEmojiBar] = useState(false);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
    socketRef.current = io(wsUrl, { withCredentials: true });
    if (user) socketRef.current.emit('setup', user._id);
    socketRef.current.on('user_online', id => setOnlineUsers(p => new Set([...p, id])));
    socketRef.current.on('user_offline', id => setOnlineUsers(p => { const s = new Set(p); s.delete(id); return s; }));
    return () => socketRef.current.disconnect();
  }, [user]);

  useEffect(() => {
    if (location.state?.openUserId) { api.get(`/users/${location.state.openUserId}`).then(r => setActiveUser(r.data)).catch(() => {}); }
    const withId = searchParams.get('with');
    if (withId) api.get(`/users/${withId}`).then(r => setActiveUser(r.data)).catch(() => {});
  }, [location.state, searchParams]);

  useEffect(() => {
    if (!socketRef.current) return;
    const handleReceive = (msg) => {
      if (activeUser && (activeUser._id === msg.sender._id || activeUser._id === msg.sender)) {
        setMessages(p => [...p, msg]); loadInboxQuietly();
      } else {
        toast(`[INCOMING PING] ${msg.sender?.name}: ${msg.content?.slice(0, 40)}`, { duration: 3000, style: { fontFamily: 'monospace', background: '#020617', color: '#0ea5e9', border: '1px solid #0ea5e9' } });
        loadInboxQuietly();
      }
    };
    const handleTyping = (d) => { if (activeUser?._id === d.senderId) setIsTyping(true); };
    const handleStop = (d) => { if (activeUser?._id === d.senderId) setIsTyping(false); };
    socketRef.current.on('message_received', handleReceive);
    socketRef.current.on('typing', handleTyping);
    socketRef.current.on('stop_typing', handleStop);
    return () => { socketRef.current.off('message_received', handleReceive); socketRef.current.off('typing', handleTyping); socketRef.current.off('stop_typing', handleStop); };
  }, [activeUser]);

  useEffect(() => { fetchInboxData(); }, []);
  useEffect(() => { if (activeUser) { setIsTyping(false); setReplyTo(null); fetchConversation(activeUser._id); } }, [activeUser]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const loadInboxQuietly = async () => { try { const r = await api.get('/messages/inbox'); setInbox(r.data); } catch {} };
  const fetchInboxData = async () => { try { const r = await api.get('/messages/inbox'); setInbox(r.data); } catch { toast.error('PINGS_UNREACHABLE'); } };
  const fetchConversation = async (id) => { try { const r = await api.get(`/messages/${id}`); setMessages(r.data); } catch { toast.error('LINK_SEVERED'); } };

  const handleTypingEvent = (e) => {
    setNewMsg(e.target.value);
    if (socketRef.current && activeUser) {
      socketRef.current.emit('typing', { senderId: user._id, receiver: activeUser._id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => { socketRef.current.emit('stop_typing', { senderId: user._id, receiver: activeUser._id }); }, 2000);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault(); if (!newMsg.trim() || !activeUser) return;
    setSending(true); socketRef.current?.emit('stop_typing', { senderId: user._id, receiver: activeUser._id });
    try {
      const content = replyTo ? `> *↩ ${replyTo.content.slice(0, 60)}${replyTo.content.length > 60 ? '…' : ''}*\n\n${newMsg.trim()}` : newMsg.trim();
      const { data } = await api.post('/messages', { receiverId: activeUser._id, content });
      setMessages(p => [...p, data]); socketRef.current?.emit('new_message', data);
      setNewMsg(''); setReplyTo(null); loadInboxQuietly();
    } catch { toast.error('TRANSMIT_FAIL'); } finally { setSending(false); }
  };

  const handleReact = (msgId, emoji) => setReactions(p => ({ ...p, [msgId]: p[msgId] === emoji ? null : emoji }));
  const handleClearChat = () => { if (!window.confirm('PURGE LOCAL LOG?')) return; setMessages([]); toast.success('LOG PURGED', { icon: '🗑️' }); };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    const tid = toast.loading('UPLOADING_PAYLOAD…');
    try {
      const { data } = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const wsUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
      const url = `${wsUrl}${data.url}`;
      const md = file.type.startsWith('image/') ? `![img](${url})` : `[ATTACHMENT: ${file.name}](${url})`;
      setNewMsg(p => p ? `${p}\n${md}` : md); toast.success('PAYLOAD_LOADED', { id: tid });
    } catch { toast.error('PAYLOAD_REJECTED', { id: tid }); } finally { e.target.value = null; }
  };

  const getOtherUser = (msg) => { if (!msg.sender || !msg.receiver) return null; return msg.sender._id === user?._id ? msg.receiver : msg.sender; };
  const filteredInbox = inbox.filter(msg => { const other = getOtherUser(msg); if (!other || other.isAdmin) return false; if (searchFilter && !other.name?.toLowerCase().includes(searchFilter.toLowerCase())) return false; return true; });
  const grouped = groupByDate(messages);

  /* ─────────────── PING STYLES ─────────────── */
  const PING_CYAN = '#0ea5e9';
  const PING_GREEN = '#10b981';
  const PING_DARK = '#020617';
  const PING_LINE = isDark ? 'rgba(14,165,233,0.2)' : 'rgba(14,165,233,0.4)';

  const bubbleMeBg = isDark ? 'rgba(14,165,233,0.1)' : 'rgba(14,165,233,0.05)';
  const bubbleThemBg = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';

  return (
    <Box sx={{ height: 'calc(100vh - 32px)', display: 'flex', alignItems: 'center', justifyContent: 'center', px: { xs: 0, md: 2 }, py: { xs: 0, md: 2 }, bgcolor: isDark ? '#000000' : '#f8fafc', backgroundImage: 'radial-gradient(rgba(14,165,233,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      <Box sx={{ width: '100%', maxWidth: 1280, height: '100%', display: 'flex', borderRadius: { xs: 0, md: '12px' }, overflow: 'hidden', border: '1px solid', borderColor: PING_LINE, boxShadow: `0 0 40px rgba(14,165,233,0.1)`, bgcolor: PING_DARK }}>

        {/* ══ PING LIST (SIDEBAR) ══ */}
        <Box sx={{ width: { xs: '100%', md: 320 }, flexShrink: 0, display: (!activeUser || !isMobile) ? 'flex' : 'none', flexDirection: 'column', borderRight: '1px solid', borderColor: PING_LINE, bgcolor: 'rgba(2,6,23,0.5)' }}>
          <Box sx={{ p: 2, borderBottom: '1px dashed', borderColor: PING_LINE }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Terminal size={18} color={PING_CYAN} />
              <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1rem', color: PING_CYAN, letterSpacing: 2 }}>PINGS // INBOX</Typography>
              {filteredInbox.filter(m => !m.read && (m.receiver?._id || m.receiver) === user?._id).length > 0 && (
                <Box sx={{ ml: 'auto', bgcolor: PING_CYAN, color: '#000', fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 900, px: 1, py: 0.25, borderRadius: '4px' }}>
                  {filteredInbox.filter(m => !m.read && (m.receiver?._id || m.receiver) === user?._id).length} UNREAD
                </Box>
              )}
            </Box>
            <TextField fullWidth size="small" placeholder="QUERY LOGS..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search size={14} color={PING_CYAN} /></InputAdornment>, endAdornment: searchFilter ? <InputAdornment position="end"><IconButton size="small" onClick={() => setSearchFilter('')}><X size={12} color={PING_CYAN} /></IconButton></InputAdornment> : null }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, fontFamily: 'monospace', fontSize: '0.8rem', color: PING_CYAN, '& fieldset': { borderColor: PING_LINE }, '&:hover fieldset': { borderColor: PING_CYAN }, '&.Mui-focused fieldset': { borderColor: PING_CYAN, borderWidth: 1 } }, '& input::placeholder': { color: 'rgba(14,165,233,0.5)', opacity: 1 } }}
            />
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 1, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: PING_LINE } }}>
            {filteredInbox.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, color: 'rgba(14,165,233,0.4)' }}>
                <Activity size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <Typography sx={{ fontFamily: 'monospace', fontWeight: 800 }}>NO SIGNAL DETECTED</Typography>
              </Box>
            ) : filteredInbox.map(msg => {
              const other = getOtherUser(msg); if (!other) return null;
              const isActive = activeUser?._id === other._id; const isUnread = !msg.read && (msg.receiver?._id || msg.receiver) === user?._id; const isOnline = onlineUsers.has(other._id);
              return (
                <Box key={msg._id} onClick={() => setActiveUser(other)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, mb: 0.5, cursor: 'pointer', border: '1px solid', borderColor: isActive ? PING_CYAN : 'transparent', bgcolor: isActive ? 'rgba(14,165,233,0.05)' : 'transparent', transition: 'all 0.1s', '&:hover': { bgcolor: isActive ? undefined : 'rgba(14,165,233,0.02)' } }}>
                  <Box sx={{ position: 'relative', flexShrink: 0 }}>
                    <Avatar src={other.avatar} sx={{ width: 36, height: 36, borderRadius: '4px', bgcolor: 'rgba(14,165,233,0.1)', color: PING_CYAN, fontWeight: 900, fontFamily: 'monospace', border: '1px solid', borderColor: PING_LINE }}>{other.name?.[0]}</Avatar>
                    <Box sx={{ position: 'absolute', bottom: -4, right: -4, width: 8, height: 8, bgcolor: isOnline ? PING_GREEN : 'rgba(255,255,255,0.2)', border: '1px solid #000' }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                      <Typography sx={{ fontFamily: 'monospace', fontWeight: isUnread ? 900 : 700, fontSize: '0.8rem', color: isUnread ? PING_CYAN : 'text.primary' }} noWrap>{other.name.toUpperCase()}</Typography>
                      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'rgba(14,165,233,0.5)', flexShrink: 0 }}>{msg.createdAt ? formatMsgDate(msg.createdAt) : ''}</Typography>
                    </Box>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: isUnread ? 700 : 500, color: isUnread ? 'white' : 'rgba(14,165,233,0.6)' }} noWrap>{msg.sender?._id === user?._id ? 'TX> ' : 'RX> '}{msg.content?.slice(0, 30)}</Typography>
                  </Box>
                  {isUnread && <Box sx={{ width: 6, height: 6, bgcolor: PING_CYAN, flexShrink: 0 }} />}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* ══ TERMINAL (CHAT AREA) ══ */}
        <Box sx={{ flex: 1, display: (!activeUser && isMobile) ? 'none' : 'flex', flexDirection: 'column', position: 'relative' }}>
          {activeUser ? (
            <>
              {/* Terminal Header */}
              <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid', borderColor: PING_LINE, bgcolor: 'rgba(14,165,233,0.03)' }}>
                {isMobile && <IconButton onClick={() => setActiveUser(null)} size="small" sx={{ color: PING_CYAN }}><ArrowLeft size={16} /></IconButton>}
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, color: PING_CYAN, fontSize: '0.85rem' }}>LINK_ESTABLISHED // {activeUser.name.toUpperCase()}</Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: onlineUsers.has(activeUser._id) ? PING_GREEN : 'rgba(14,165,233,0.5)', border: `1px solid ${onlineUsers.has(activeUser._id) ? PING_GREEN : 'rgba(14,165,233,0.3)'}`, px: 0.5 }}>{onlineUsers.has(activeUser._id) ? 'ONLINE' : 'OFFLINE'}</Typography>
                </Box>
                <Tooltip title="PURGE LOG"><IconButton size="small" onClick={handleClearChat} sx={{ color: 'rgba(239,68,68,0.7)', '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.1)' }, borderRadius: '4px' }}><Trash2 size={15} /></IconButton></Tooltip>
              </Box>

              {/* Feed */}
              <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 0.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: PING_LINE } }}>
                <AnimatePresence initial={false}>
                  {grouped.map((item, idx) => {
                    if (item.type === 'date') {
                      return (
                        <Box key={`date-${idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 3 }}>
                          <Box sx={{ flex: 1, height: '1px', borderBottom: '1px dashed', borderColor: PING_LINE }} />
                          <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, color: 'rgba(14,165,233,0.5)', px: 1, fontSize: '0.7rem' }}>[ {item.label} ]</Typography>
                          <Box sx={{ flex: 1, height: '1px', borderBottom: '1px dashed', borderColor: PING_LINE }} />
                        </Box>
                      );
                    }

                    const msg = item; const isMe = (msg.sender?._id || msg.sender) === user?._id;
                    const nextMsg = grouped[idx + 1]; const isLastInGroup = !nextMsg || nextMsg.type === 'date' || (nextMsg.sender?._id || nextMsg.sender) !== (msg.sender?._id || msg.sender);
                    const reaction = reactions[msg._id];

                    return (
                      <Box key={msg._id} component={motion.div} initial={{ opacity: 0, x: isMe ? 10 : -10 }} animate={{ opacity: 1, x: 0 }} sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', mb: isLastInGroup ? 2 : 0.5 }}>
                        <Box sx={{ maxWidth: '75%', position: 'relative' }} className="msg-wrapper">
                          
                          {/* Actions */}
                          <Box className="msg-actions" sx={{ position: 'absolute', top: -16, [isMe ? 'right' : 'left']: 0, zIndex: 10, display: 'none', alignItems: 'center', gap: 0.5, bgcolor: PING_DARK, border: '1px solid', borderColor: PING_CYAN, px: 1, py: 0.2, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', '.msg-bubble:hover ~ &, &:hover': { display: 'flex' } }}>
                            <Tooltip title="REPLY"><Box onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }} sx={{ cursor: 'pointer', display: 'flex', color: PING_CYAN, opacity: 0.7, '&:hover': { opacity: 1 } }}><Reply size={12} /></Box></Tooltip>
                          </Box>

                          <Box className="msg-bubble" sx={{ p: 1.5, border: '1px solid', borderColor: isMe ? PING_CYAN : PING_LINE, borderLeft: isMe ? undefined : `3px solid ${PING_CYAN}`, borderRight: isMe ? `3px solid ${PING_CYAN}` : undefined, bgcolor: isMe ? bubbleMeBg : bubbleThemBg, color: isDark ? 'rgba(255,255,255,0.9)' : '#fff', fontFamily: 'monospace', fontSize: '0.85rem', '& p': { m: 0, mb: '2px', wordBreak: 'break-word' }, '& blockquote': { m: 0, mb: 1, pl: 1, borderLeft: `2px dashed ${PING_CYAN}`, opacity: 0.7, fontSize: '0.75rem' }, '&:hover + .msg-actions, &:hover ~ .msg-actions': { display: 'flex' } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, opacity: 0.5 }}>
                              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }}>{isMe ? 'TX' : 'RX'} // {formatMsgDate(msg.createdAt)}</Typography>
                              {isMe && (msg.read ? <CheckCheck size={10} color={PING_GREEN} /> : <Check size={10} />)}
                            </Box>
                            <ReactMarkdown>{msg.content || ''}</ReactMarkdown>
                          </Box>

                          <AnimatePresence>
                            {reaction && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: 'absolute', bottom: -8, [isMe ? 'right' : 'left']: 4, zIndex: 5 }}>
                                <Box onClick={() => handleReact(msg._id, reaction)} sx={{ bgcolor: PING_DARK, border: '1px solid', borderColor: PING_CYAN, px: 0.5, py: 0.1, fontSize: '0.7rem', fontFamily: 'monospace', cursor: 'pointer', color: PING_CYAN }}>[{reaction}]</Box>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Box>
                      </Box>
                    );
                  })}
                </AnimatePresence>

                {isTyping && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                    <Box sx={{ p: 1.5, border: '1px solid', borderColor: PING_LINE, borderLeft: `3px solid ${PING_CYAN}`, bgcolor: bubbleThemBg, display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: PING_CYAN, animation: 'pulse 1s infinite' }}>RECEIVING_SIGNAL...</Typography>
                    </Box>
                  </Box>
                )}
                <div ref={messagesEndRef} />
              </Box>

              {/* Reply Banner */}
              {replyTo && (
                <Box sx={{ px: 2, py: 1, borderTop: '1px solid', borderColor: PING_LINE, bgcolor: 'rgba(14,165,233,0.05)', display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Reply size={14} color={PING_CYAN} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 900, color: PING_CYAN }}>FWD: PREV_TX</Typography>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }} noWrap>{replyTo.content}</Typography>
                  </Box>
                  <IconButton size="small" onClick={() => setReplyTo(null)} sx={{ color: PING_CYAN }}><X size={14} /></IconButton>
                </Box>
              )}

              {/* Input */}
              <Box sx={{ p: 2, borderTop: '1px solid', borderColor: PING_LINE, bgcolor: PING_DARK }}>
                <Box component="form" onSubmit={handleSend} sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <Tooltip title="ATTACH DATA"><IconButton onClick={() => fileInputRef.current?.click()} sx={{ color: PING_CYAN, borderRadius: '4px', border: '1px solid', borderColor: PING_LINE, p: 1.2, '&:hover': { bgcolor: 'rgba(14,165,233,0.1)' } }}><Paperclip size={16} /></IconButton></Tooltip>
                  <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} />
                  <Tooltip title="STATUS FLAGS"><IconButton onClick={() => setShowEmojiBar(v => !v)} sx={{ color: PING_CYAN, borderRadius: '4px', border: '1px solid', borderColor: PING_LINE, p: 1.2, '&:hover': { bgcolor: 'rgba(14,165,233,0.1)' } }}><Activity size={16} /></IconButton></Tooltip>
                  
                  <TextField fullWidth inputRef={inputRef} placeholder=">> ENTER TRANSMISSION..." value={newMsg} onChange={handleTypingEvent} multiline maxRows={5} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, px: 2, py: 1, fontFamily: 'monospace', fontSize: '0.85rem', color: PING_CYAN, bgcolor: 'rgba(14,165,233,0.02)', '& fieldset': { borderColor: PING_LINE }, '&:hover fieldset': { borderColor: PING_CYAN }, '&.Mui-focused fieldset': { borderColor: PING_CYAN, borderWidth: 1 } }, '& textarea': { lineHeight: 1.5 } }} />

                  <IconButton type="submit" disabled={sending || !newMsg.trim()} sx={{ width: 42, height: 42, bgcolor: PING_CYAN, color: '#000', borderRadius: '4px', flexShrink: 0, '&:hover': { bgcolor: '#38bdf8' }, '&.Mui-disabled': { bgcolor: PING_LINE, color: 'text.disabled' } }}>
                    <Send size={16} />
                  </IconButton>
                </Box>
                {showEmojiBar && (
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                    {QUICK_EMOJIS.map(e => <Button key={e} onClick={() => setNewMsg(p => p + e)} sx={{ minWidth: 0, px: 1, py: 0.2, fontFamily: 'monospace', fontSize: '0.7rem', color: PING_CYAN, border: '1px solid', borderColor: PING_LINE, borderRadius: '4px', '&:hover': { bgcolor: 'rgba(14,165,233,0.1)' } }}>{e}</Button>)}
                  </Box>
                )}
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, color: PING_CYAN }}>
              <Terminal size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
              <Typography sx={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 900, mb: 1, textShadow: `0 0 10px ${PING_CYAN}` }}>AWAITING PROTOCOL LINK</Typography>
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem', opacity: 0.7 }}>SELECT A TERMINAL FROM THE INBOX TO COMMENCE PINGING.</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
