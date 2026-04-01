import { useEffect, useState } from 'react';
import api from '../api/axios';
import UserCard from '../components/UserCard';
import { Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Literature', 'Economics', 'Psychology', 'Engineering'];
const LEVELS = ['High School', 'Undergraduate', 'Graduate', 'PhD', 'Self-Learner', 'Other'];
const STYLES = ['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic', 'Mixed'];

export default function Browse() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ name: '', subject: '', location: '', educationLevel: '', studyStyle: '' });
  const [sentReqs, setSentReqs] = useState(new Set());

  const search = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const { data } = await api.get('/users/search', { params });
      setUsers(data);
    } catch { toast.error('Search failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    search(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user?.sentRequests) setSentReqs(new Set(user.sentRequests.map(r => r._id || r)));
  }, [user]);

  const handleConnect = async (userId) => {
    try {
      await api.post(`/users/connect/${userId}`);
      setSentReqs(prev => new Set([...prev, userId]));
      toast.success('Connection request sent!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Browse Study Buddies</h1>

      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search by name..." value={filters.name}
              onChange={e => setFilters({ ...filters, name: e.target.value })} />
          </div>
          <input className="input" placeholder="Subject (e.g. Math)" value={filters.subject}
            onChange={e => setFilters({ ...filters, subject: e.target.value })} />
          <input className="input" placeholder="Location" value={filters.location}
            onChange={e => setFilters({ ...filters, location: e.target.value })} />
          <select className="input" value={filters.educationLevel}
            onChange={e => setFilters({ ...filters, educationLevel: e.target.value })}>
            <option value="">All Education Levels</option>
            {LEVELS.map(l => <option key={l}>{l}</option>)}
          </select>
          <select className="input" value={filters.studyStyle}
            onChange={e => setFilters({ ...filters, studyStyle: e.target.value })}>
            <option value="">All Study Styles</option>
            {STYLES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={search} className="btn-primary flex items-center justify-center gap-2">
            <Filter size={16} /> Search
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400"></div></div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Search size={48} className="mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No users found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(u => (
            <UserCard key={u._id} user={u} actions={
              sentReqs.has(u._id) || user?.connections?.includes(u._id)
                ? <span className="text-sm text-gray-500 dark:text-gray-400">Request Sent</span>
                : <button onClick={() => handleConnect(u._id)} className="btn-primary text-sm py-1.5">Connect</button>
            } />
          ))}
        </div>
      )}
    </div>
  );
}
