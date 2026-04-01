import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function SupportWidget() {
  const [adminId, setAdminId] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user || user.isAdmin) return;
    api.get('/users/support-admin').then(res => setAdminId(res.data._id)).catch(() => {});
  }, [user]);

  if (!adminId || !user || user.isAdmin) return null;
  if (location.pathname.startsWith('/messages')) return null;

  return (
    <button onClick={() => navigate('/support')} title="Need Help? Sys Admin Support"
      className="fixed bottom-6 right-6 p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg transition-transform hover:scale-105 z-50 flex items-center justify-center animate-fade-in group">
      <MessageCircle size={28} />
      <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-semibold">
        Support
      </span>
    </button>
  );
}
