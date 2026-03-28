import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Send, Shield, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import io from 'socket.io-client';

export default function Support() {
  const { user } = useAuth();
  const [adminId, setAdminId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    api.get('/users/support-admin').then(res => setAdminId(res.data._id)).catch(() => toast.error('Support offline'));
  }, []);

  useEffect(() => {
    if (!adminId) return;
    api.get(`/messages/${adminId}`).then(res => setMessages(res.data)).catch(() => {});
  }, [adminId]);

  useEffect(() => {
    if (!user) return;
    socketRef.current = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001');
    socketRef.current.emit('setup', user._id);
    return () => socketRef.current.disconnect();
  }, [user]);

  useEffect(() => {
    if (!socketRef.current || !adminId) return;
    const handleReceive = (newMessage) => {
      const isFromAdmin = (newMessage.sender._id || newMessage.sender) === adminId;
      if (isFromAdmin) {
        setMessages(prev => [...prev, newMessage]);
      }
    };
    socketRef.current.on('message_received', handleReceive);
    return () => socketRef.current.off('message_received', handleReceive);
  }, [adminId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !adminId) return;
    setSending(true);
    try {
      const isPremium = user?.subscription?.plan !== 'basic' && user?.subscription?.plan;
      const content = isPremium ? `[PRIORITY] ${newMsg.trim()}` : newMsg.trim();
      const { data } = await api.post('/messages', { receiverId: adminId, content });
      setMessages(prev => [...prev, data]);
      if (socketRef.current) socketRef.current.emit('new_message', data);
      setNewMsg('');
    } catch { toast.error('Failed to send message'); }
    finally { setSending(false); }
  };
  
  const isPremium = user?.subscription?.plan === 'pro' || user?.subscription?.plan === 'squad';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col" style={{ height: '70vh' }}>
        <div className="p-4 bg-orange-600 border-b border-orange-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shadow-inner">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            {isPremium ? (
              <>
                <p className="font-bold text-white tracking-wide flex items-center gap-2">
                  Priority Support <span className="bg-yellow-400 text-yellow-900 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">VIP</span>
                </p>
                <p className="text-xs text-orange-100 font-medium flex items-center gap-1 mt-0.5">
                  <Sparkles size={12} /> High-priority queue enabled
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-white tracking-wide">System Administrator Support</p>
                <p className="text-xs text-orange-100 font-medium mt-0.5">Usually replies within 24 hours</p>
              </>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          {messages.length === 0 ? (
            <div className="text-center py-10 text-gray-400 font-medium">Send a message to our support team. We're here to help!</div>
          ) : messages.map(msg => {
            const isMe = (msg.sender._id || msg.sender) === user?._id;
            return (
              <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-orange-600 text-white rounded-br-sm' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-sm'}`}>
                  <p className="leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1.5 font-medium ${isMe ? 'text-orange-200' : 'text-gray-400'}`}>
                    {format(new Date(msg.createdAt), 'p')}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSend} className="p-4 bg-white dark:bg-gray-800 flex gap-3">
          <input className="input flex-1 bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 transition-colors focus:border-orange-500 focus:ring-orange-500" placeholder="Describe your issue..." value={newMsg} onChange={e => setNewMsg(e.target.value)} />
          <button type="submit" className="btn-primary bg-orange-600 hover:bg-orange-700 border-none px-6 shadow-md transition-transform hover:-translate-y-0.5 active:translate-y-0" disabled={sending || !newMsg.trim()}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
