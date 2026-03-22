import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Calendar, Lightbulb, ChevronRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Onboarding() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [subjects, setSubjects] = useState('');
  const [availability, setAvailability] = useState([]);
  const [studyStyle, setStudyStyle] = useState('Mixed');
  const [preferOnline, setPreferOnline] = useState(true);

  const handleNext = () => setStep(s => s + 1);

  const toggleDay = (day) => {
    if (availability.find(a => a.day === day)) {
      setAvailability(availability.filter(a => a.day !== day));
    } else {
      setAvailability([...availability, { day, startTime: '09:00', endTime: '17:00' }]);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const subjectArray = subjects.split(',').map(s => s.trim()).filter(Boolean);
      const res = await api.put('/users/profile', {
        subjects: subjectArray,
        availability,
        studyStyle,
        preferOnline
      });
      updateUser(res.data);
      toast.success('Profile updated successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to save profile details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-blue-600 p-6 text-white text-center">
          <h2 className="text-2xl font-bold">Welcome to StudyBuddy!</h2>
          <p className="opacity-90 mt-1">Let's set up your profile in 3 simple steps.</p>
        </div>
        
        <div className="p-8">
          {/* Progress Bar */}
          <div className="flex justify-between items-center mb-8 relative">
             <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2 rounded-full"></div>
             <div className="absolute left-0 top-1/2 h-1 bg-blue-600 -z-10 -translate-y-1/2 rounded-full transition-all duration-300" style={{ width: `${(step - 1) * 50}%` }}></div>
             {[1, 2, 3].map(i => (
               <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= i ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                 {step > i ? <CheckCircle size={16} /> : i}
               </div>
             ))}
          </div>

          {step === 1 && (
            <div className="animate-fade-in space-y-4">
              <div className="flex items-center gap-3 text-lg font-bold text-gray-800 mb-4">
                <BookOpen className="text-blue-500" /> What do you study?
              </div>
              <p className="text-sm text-gray-500">Enter your subjects separated by commas. This helps AI match you with the right study buddies.</p>
              <input 
                autoFocus
                className="input w-full p-3 text-lg" 
                placeholder="e.g. Calculus, Physics, Computer Science..." 
                value={subjects} 
                onChange={e => setSubjects(e.target.value)} 
              />
              <button onClick={handleNext} disabled={!subjects.trim()} className="btn-primary w-full mt-4 flex justify-center py-3">
                Continue <ChevronRight size={18} className="ml-1" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in space-y-4">
              <div className="flex items-center gap-3 text-lg font-bold text-gray-800 mb-4">
                <Calendar className="text-green-500" /> When are you available?
              </div>
              <p className="text-sm text-gray-500 mb-2">Select the days you usually study.</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => {
                  const active = availability.some(a => a.day === day);
                  return (
                    <button 
                      key={day} 
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${active ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  );
                })}
              </div>
              
              <p className="text-sm text-gray-500 mt-4 mb-2">Session Preference</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={preferOnline} onChange={() => setPreferOnline(true)} className="w-4 h-4 text-blue-600" />
                  <span>Online</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={!preferOnline} onChange={() => setPreferOnline(false)} className="w-4 h-4 text-blue-600" />
                  <span>In-Person</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setStep(1)} className="btn-secondary w-full py-3">Back</button>
                <button onClick={handleNext} className="btn-primary w-full py-3 flex justify-center">Continue <ChevronRight size={18} className="ml-1" /></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in space-y-4">
              <div className="flex items-center gap-3 text-lg font-bold text-gray-800 mb-4">
                <Lightbulb className="text-yellow-500" /> What is your study style?
              </div>
              <p className="text-sm text-gray-500 mb-4">Select the method that works best for you.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic', 'Mixed'].map(style => (
                  <div 
                    key={style}
                    onClick={() => setStudyStyle(style)}
                    className={`cursor-pointer border p-4 rounded-xl transition-all ${studyStyle === style ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 text-blue-800' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
                  >
                    <div className="font-semibold text-center">{style}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-6">
                 <button onClick={() => setStep(2)} className="btn-secondary w-full py-3">Back</button>
                 <button onClick={handleFinish} disabled={loading} className="btn-primary w-full py-3">
                   {loading ? 'Saving...' : 'Finish Setup'}
                 </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
