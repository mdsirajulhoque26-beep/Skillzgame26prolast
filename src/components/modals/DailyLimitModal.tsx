import React from 'react';
import { useApp } from '../../context/AppContext';
import { HelpCircle, X, Tv, Sparkles, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export const DailyLimitModal: React.FC = () => {
  const { activeModal, closeModal } = useApp();

  if (activeModal !== 'daily_limit') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div 
        id="daily-limit-modal-box"
        className="w-full max-w-sm bg-[#121935] border border-blue-500/50 rounded-3xl p-5 shadow-2xl relative text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-indigo-900/80 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">দৈনিক লিমিট তথ্য (Daily Limit)</h3>
              <p className="text-[10.5px] text-amber-400 font-medium">Block Puzzle গেম লিমিট ও নিয়ম</p>
            </div>
          </div>
          <button
            id="daily-limit-close-btn"
            onClick={closeModal}
            className="w-7 h-7 rounded-full bg-indigo-950 text-slate-400 hover:text-white flex items-center justify-center border border-indigo-800/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Box */}
        <div className="space-y-3 text-xs bg-[#0b1022] p-4 rounded-2xl border border-indigo-950/80 leading-relaxed mb-4 text-slate-200">
          {/* Rule 1: 3 match limit */}
          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl">
            <div className="flex items-center gap-1.5 text-amber-400 font-black text-xs mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Block Puzzle খেলার নিয়ম:</span>
            </div>
            <p className="text-[11.5px] text-slate-300">
              গেমে নির্ধারিত সময়ের মধ্যে যত বেশি সম্ভব বৈধ ব্লক বসিয়ে স্কোর বাড়ান।
            </p>
          </div>

          {/* Rule 2: How to increase limit by watching Ads */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl">
            <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xs mb-1">
              <Tv className="w-3.5 h-3.5" />
              <span>Ads দেখলে লিমিট আবার বাড়ে!</span>
            </div>
            <p className="text-[11.5px] text-slate-300">
              স্কোর সাবমিট করার আগে আপনার গেম শেষ হয়েছে কিনা এবং স্কোর সঠিক কিনা নিশ্চিত করুন।
            </p>
          </div>

          {/* Step by step */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>সহজ ৩টি ধাপ:</span>
            </div>
            <div className="grid gap-1.5 text-[11px] text-slate-300">
              <div className="flex items-start gap-1.5 bg-indigo-950/40 p-2 rounded-lg border border-indigo-900/40">
                <span className="bg-indigo-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">১</span>
                <span>গেমের সময় শেষ হলে স্কোর সাবমিট করুন।</span>
              </div>
              <div className="flex items-start gap-1.5 bg-indigo-950/40 p-2 rounded-lg border border-indigo-900/40">
                <span className="bg-indigo-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">২</span>
                <span>১০-১৫ সেকেন্ডের ছোট বিজ্ঞাপনটি সম্পূর্ণ দেখুন।</span>
              </div>
              <div className="flex items-start gap-1.5 bg-indigo-950/40 p-2 rounded-lg border border-indigo-900/40">
                <span className="bg-emerald-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">৩</span>
                <span>প্রয়োজনে আবার Block Puzzle গেম শুরু করতে Play বাটনে চাপুন।</span>
              </div>
            </div>
          </div>
        </div>

        <button
          id="daily-limit-got-it-btn"
          onClick={closeModal}
          className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
        >
          বুঝেছি, ধন্যবাদ
        </button>
      </div>
    </div>
  );
};
