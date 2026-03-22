import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function RatingModal({ session, onClose }) {
  const [targetUserId, setTargetUserId] = useState('');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Participants to rate (excluding self)
  const otherParticipants = session.participants?.filter(p => p._id !== JSON.parse(localStorage.getItem('user'))?._id) || [];
  if (session.host && session.host._id !== JSON.parse(localStorage.getItem('user'))?._id) {
      if (!otherParticipants.find(p => p._id === session.host._id)) {
          otherParticipants.push(session.host);
      }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetUserId || !rating) return toast.error('Please select a user and provide a rating');
    setSubmitting(true);
    try {
      await api.post('/ratings', { sessionId: session._id, targetUserId, rating, review });
      toast.success('Rating submitted!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold dark:text-white">Rate your Buddy</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>
        
        {otherParticipants.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No other participants to rate in this session.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Select Buddy</label>
              <select className="input" value={targetUserId} onChange={e => setTargetUserId(e.target.value)} required>
                <option value="" disabled>Choose a buddy...</option>
                {otherParticipants.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block text-center">Rating</label>
              <div className="flex items-center justify-center gap-1">
                {[...Array(5)].map((star, index) => {
                  index += 1;
                  return (
                    <button
                      type="button"
                      key={index}
                      className={`p-1 bg-transparent transition-colors ${index <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                      onClick={() => setRating(index)}
                      onMouseEnter={() => setHover(index)}
                      onMouseLeave={() => setHover(rating)}
                    >
                      <Star size={32} fill={index <= (hover || rating) ? 'currentColor' : 'none'} />
                    </button>
                  );
                })}
              </div>
            </div>

            <textarea 
               className="input resize-none" rows={3} 
               placeholder="Leave a short review (optional)" 
               value={review} onChange={e => setReview(e.target.value)} 
               maxLength={500}
            />

            <button type="submit" className="btn-primary w-full" disabled={submitting || !rating || !targetUserId}>
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
