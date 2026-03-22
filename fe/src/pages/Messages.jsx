import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Send, MessageCircle, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import io from 'socket.io-client';

export default function Messages() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [inbox, setInbox] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001');
    if (user) {
      socketRef.current.emit('setup', user._id);
    }
    return () => socketRef.current.disconnect();
  }, [user]);

  useEffect(() => {
    if (!socketRef.current) return;
    
    const handleReceive = (newMessage) => {
      // Check if we are actively focused on the sender
      const isFocused = activeUser && (activeUser._id === newMessage.sender._id || activeUser._id === newMessage.sender);
      if (isFocused) {
        setMessages(prev => [...prev, newMessage]);
      } else {
        toast.success('New Message Received!');
        api.get('/messages/inbox').then(res => setInbox(res.data)).catch(() => {});
      }
    };

    socketRef.current.on('message_received', handleReceive);
    return () => socketRef.current.off('message_received', handleReceive);
  }, [activeUser]);

  useEffect(() => {
    api.get('/messages/inbox').then(res => setInbox(res.data)).catch(() => {});
    const withId = searchParams.get('with');
    if (withId) {
      api.get(`/users/${withId}`).then(res => setActiveUser(res.data)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (activeUser) {
      api.get(`/messages/${activeUser._id}`).then(res => setMessages(res.data)).catch(() => {});
    }
  }, [activeUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeUser) return;
    setSending(true);
    try {
      const { data } = await api.post('/messages', { receiverId: activeUser._id, content: newMsg.trim() });
      setMessages(prev => [...prev, data]);
      if (socketRef.current) socketRef.current.emit('new_message', data);
      setNewMsg('');
    } catch { toast.error('Failed to send message'); }
    finally { setSending(false); }
  };

  const getOtherUser = (msg) => {
    if (!msg.sender || !msg.receiver) return null;
    return msg.sender._id === user?._id ? msg.receiver : msg.sender;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Messages</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ height: '70vh' }}>
        <div className="flex h-full">
          {/* Inbox */}
          <div className="w-72 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {inbox.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm px-4">
                  <MessageCircle size={32} className="mx-auto mb-2 opacity-40" />
                  No conversations yet
                </div>
              ) : inbox.filter(msg => {
                const other = getOtherUser(msg);
                return other && !other.isAdmin; // HIDDEN SUPPORT OVERRIDES
              }).map(msg => {
                const other = getOtherUser(msg);
                if (!other) return null;
                return (
                  <button key={msg._id} onClick={() => setActiveUser(other)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:bg-gray-900 transition-colors text-left ${activeUser?._id === other._id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                      {other.avatar ? <img src={other.avatar} className="w-10 h-10 rounded-full object-cover" alt="" /> : <User size={18} className="text-blue-600 dark:text-blue-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{other.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{msg.content}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col">
            {activeUser ? (
              <>
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                    <User size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{activeUser.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activeUser.university || activeUser.subjects?.join(', ')}</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map(msg => {
                    const isMe = (msg.sender._id || msg.sender) === user?._id;
                    return (
                      <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm'}`}>
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                            {format(new Date(msg.createdAt), 'p')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSend} className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                  <input className="input flex-1" placeholder="Type a message..." value={newMsg}
                    onChange={e => setNewMsg(e.target.value)} />
                  <button type="submit" className="btn-primary px-4" disabled={sending || !newMsg.trim()}>
                    <Send size={16} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageCircle size={48} className="mx-auto mb-3 opacity-40" />
                  <p>Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
