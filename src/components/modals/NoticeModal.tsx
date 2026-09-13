import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, X } from 'lucide-react';

export const NoticeModal: React.FC = () => {
  const { activeModal, closeModal, paymentSettings } = useApp();

  if (activeModal !== 'notice') return null;

  const title = paymentSettings.popupNoticeTitle || 'Notice 📢';
  const text = paymentSettings.popupNoticeText || 'Skillzgame-এর Block Puzzle গেমে সময়ের মধ্যে সর্বোচ্চ স্কোর করুন। স্কোর সাবমিট করার পর এডমিন যাচাই করে প্রাইজ অনুমোদন করবেন। 🧩🏆';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        id="notice-modal-box"
        className="w-full max-w-sm bg-[#131a33] border border-amber-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden"
      >
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-red-500 to-indigo-500" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-indigo-900/60 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wide">{title}</h3>
          </div>
          <button
            id="notice-modal-close-btn"
            onClick={closeModal}
            className="w-7 h-7 rounded-full bg-indigo-950/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors border border-indigo-800/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice Content */}
        <div className="space-y-3 text-slate-200 text-sm leading-relaxed">
          <div className="bg-[#0b1022] p-4 rounded-xl border border-amber-500/20 text-[13.5px] whitespace-pre-line">
            {text}
          </div>
        </div>

        {/* Dismiss Button */}
        <div className="mt-5">
          <button
            id="notice-modal-ok-btn"
            onClick={closeModal}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-sm"
          >
            ঠিক আছে / বুঝেছি
          </button>
        </div>
      </div>
    </div>
  );
};
