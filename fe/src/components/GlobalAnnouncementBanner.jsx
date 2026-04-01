import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Megaphone, X } from 'lucide-react';

export default function GlobalAnnouncementBanner({ isAdminPreview = false }) {
  const [bannerConfig, setBannerConfig] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data?.announcementBannerActive && res.data?.announcementBannerText) {
          setBannerConfig(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch global announcement banner');
      }
    };
    fetchConfig();
  }, []);

  if (!bannerConfig || !isVisible) return null;

  if (isAdminPreview) {
    return (
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 shadow-md relative z-50 text-center animate-fade-in flex items-center justify-center gap-3">
        <div className="hidden sm:flex bg-white/20 p-1.5 rounded-full"><Megaphone size={16} /></div>
        <p className="font-medium text-sm sm:text-base leading-tight max-w-4xl">{bannerConfig.announcementBannerText}</p>
        <button onClick={() => setIsVisible(false)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 focus:outline-none hover:bg-white/10 rounded-full transition text-purple-100 hover:text-white" title="Dismiss">
          <X size={18} />
        </button>
      </div>
    );
  }

  // STANDARD USER LOCKOUT (Admin is not Previewing)
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full p-8 md:p-12 text-center shadow-2xl border border-gray-200 dark:border-gray-700 animate-scale-up relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-600 to-indigo-600"></div>
        <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <Megaphone size={40} />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">System Notice</h1>
        <div className="w-16 h-1 bg-gradient-to-r from-purple-600 to-blue-500 mx-auto my-6 rounded-full"></div>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
          {bannerConfig.announcementBannerText}
        </p>
        <div className="mt-10 py-5 px-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl inline-block max-w-[90%] w-full mx-auto">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Regular account access is temporarily paused globally. Please check back later or contact administrative operations.</p>
        </div>
      </div>
    </div>
  );
}
