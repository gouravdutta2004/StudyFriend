import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001', {
            withCredentials: true
        });
        setSocket(newSocket);

        newSocket.emit('setup', user._id);

        newSocket.on('notification', (data) => {
            toast(data.message, {
                icon: '🔔',
                style: { borderRadius: '10px', background: '#333', color: '#fff' },
            });
        });

        newSocket.on('message_received', (message) => {
            if (!window.location.pathname.includes('/messages')) {
                const senderName = message.sender?.name || 'a connection';
                toast(`New message from ${senderName}`, {
                    icon: '💬',
                    style: { borderRadius: '10px', background: '#333', color: '#fff' },
                });
            }
        });

        newSocket.on('quest_completed', (data) => {
            toast.success(`🎉 Quest Completed: ${data.questName}\n+${data.xp} XP!`, {
                duration: 5000,
                style: { borderRadius: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', fontWeight: 'bold', padding: '16px' },
            });
        });

        return () => {
            newSocket.off('notification');
            newSocket.off('message_received');
            newSocket.off('quest_completed');
            newSocket.disconnect();
            setSocket(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
