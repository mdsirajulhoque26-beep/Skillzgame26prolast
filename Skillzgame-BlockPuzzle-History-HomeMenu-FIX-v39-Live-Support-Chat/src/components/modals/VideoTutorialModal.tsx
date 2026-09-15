import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Video, X, Play, ShieldCheck, ChevronRight } from 'lucide-react';

export const VideoTutorialModal: React.FC = () => {
  const { activeModal, closeModal } = useApp();
  const [activeVideo, setActiveVideo] = useState<number | null>(null);

  if (activeModal !== 'video_tutorials') return null;

  const tutorials = [
    {
      id: 1,
      title: 'কিভাবে টাকা এড মানি করবেন? (bKash/Nagad Deposit Guide)',
      desc: 'সহজেই ৫ মিনিটে টাকা রিচার্জ করার পুরো নিয়ম জানুন।',
      duration: '02:45',
      steps: [
        '১. ওয়ালেটে গিয়ে "Add Money" বাটনে ক্লিক করুন।',
        '২. bKash বা Nagad নম্বরটি কপি করে আপনার পার্সোনাল অ্যাপ থেকে Send Money করুন।',
        '৩. টাকা পাঠানোর পর TrxID এবং আপনার নম্বর লিখে জমা দিন।',
        '৪. সাথে সাথে গেমিং ব্যালেন্সে টাকা এড হয়ে যাবে।'
      ]
    },
    {
      id: 2,
      title: 'কিভাবে Skillzgame এ Block Puzzle Duel খেলবেন?',
      desc: '১v১ ডুয়েল ম্যাচে জয়েন করে সর্বোচ্চ স্কোর গড়ে প্রাইজ জেতার নিয়ম।',
      duration: '02:30',
      steps: [
        '১. হোম স্ক্রিন থেকে "Block Puzzle Duel" এ ক্লিক করে লবিতে প্রবেশ করুন।',
        '২. আপনার পছন্দের এন্ট্রি ফি ও প্রাইজ পুলের ১v১ ম্যাচ সিলেক্ট করে জয়েন করুন।',
        '৩. নির্দিষ্ট ২ মিনিটের মধ্যে ১০x১০ গ্রিডে কৌশলগতভাবে ব্লক সাজিয়ে লাইন ক্লিয়ার করুন।',
        '৪. ম্যাচ শেষ হওয়ার সাথে সাথে বিজয়ী প্লেয়ারের উইনিং ব্যালেন্সে টাকা যুক্ত হয়ে যাবে।'
      ]
    },
    {
      id: 3,
      title: 'উইনিং ব্যালেন্স থেকে টাকা তোলার নিয়ম (Withdrawal Guide)',
      desc: 'জিতা টাকা আপনার বিকাশ বা নগদ একাউন্টে ক্যাশআউট করার ধাপ।',
      duration: '01:55',
      steps: [
        '১. ওয়ালেটে গিয়ে "Withdraw" বাটনে ক্লিক করুন।',
        '২. bKash বা Nagad সিলেক্ট করে একাউন্ট নম্বর দিন।',
        '৩. টাকার পরিমাণ লিখে সাবমিট করুন (সর্বনিম্ন ৳১০০)।',
        '৪. ১ থেকে ৩ ঘণ্টার মধ্যে টাকা আপনার একাউন্টে চলে আসবে।'
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        id="video-tutorial-modal-box"
        className="w-full max-w-sm bg-[#121935] border border-red-500/40 rounded-2xl p-5 shadow-2xl relative text-white my-6 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-indigo-900 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ভিডিও টিউটোরিয়াল</h3>
              <p className="text-[10px] text-slate-400">খেলার ও লেনদেনের সহজ গাইড</p>
            </div>
          </div>
          <button
            id="video-tutorial-close-btn"
            onClick={closeModal}
            className="w-7 h-7 rounded-full bg-indigo-950 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tutorials List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-none">
          {tutorials.map((item) => (
            <div
              key={item.id}
              className="bg-[#0b1022] border border-indigo-950 rounded-xl p-3.5 space-y-2 hover:border-amber-400/40 transition-colors"
            >
              <div 
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setActiveVideo(activeVideo === item.id ? null : item.id)}
              >
                <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white leading-snug">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-amber-400 font-mono">⏱️ {item.duration}</span>
                    <span className="text-[10px] text-slate-400">ধাপসমূহ দেখুন ›</span>
                  </div>
                </div>
              </div>

              {activeVideo === item.id && (
                <div className="mt-3 pt-3 border-t border-indigo-950 space-y-1.5 text-xs text-slate-300 bg-indigo-950/30 p-3 rounded-lg animate-fade-in">
                  <div className="font-bold text-amber-300 mb-1">ধাপসমূহ:</div>
                  {item.steps.map((st, i) => (
                    <p key={i} className="leading-relaxed">{st}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={closeModal}
          className="w-full mt-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl text-xs"
        >
          ঠিক আছে
        </button>
      </div>
    </div>
  );
};
