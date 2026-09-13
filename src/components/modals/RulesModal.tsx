import React from 'react';
import { useApp } from '../../context/AppContext';
import { BookOpen, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const RulesModal: React.FC = () => {
  const { activeModal, closeModal } = useApp();

  if (activeModal !== 'rules') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        id="rules-modal-box"
        className="w-full max-w-sm bg-[#121935] border border-indigo-500/50 rounded-2xl p-5 shadow-2xl relative text-white my-6 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-indigo-900 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Skillzgame Rules & Guidelines</h3>
              <p className="text-[10px] text-slate-400">খেলার নিয়মাবলী ও নীতিমালা</p>
            </div>
          </div>
          <button
            id="rules-close-btn"
            onClick={closeModal}
            className="w-7 h-7 rounded-full bg-indigo-950 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rules Content */}
        <div className="flex-1 overflow-y-auto space-y-3 text-xs text-slate-300 leading-relaxed pr-1 scrollbar-none">
          <div className="bg-[#0b1022] p-3 rounded-xl border border-indigo-950">
            <h4 className="font-bold text-amber-400 mb-1 flex items-center gap-1">
              <span>১. গেমপ্লে ও স্কিল ম্যাচ (Block Puzzle Duel):</span>
            </h4>
            <p>Skillzgame এ প্রতিটি ম্যাচে নির্দিষ্ট সময়ের (যেমন ২ মিনিট) মধ্যে ১০x১০ গ্রিডে কৌশলগতভাবে ব্লক বসিয়ে লাইন ক্লিয়ার করতে হবে। কম্বো ও একাধিক লাইন একসাথে ক্লিয়ার করলে বেশি পয়েন্ট অর্জিত হয়।</p>
          </div>

          <div className="bg-[#0b1022] p-3 rounded-xl border border-indigo-950">
            <h4 className="font-bold text-amber-400 mb-1 flex items-center gap-1">
              <span>২. ফেয়ার প্লে ও ১v১ ডুয়েল নীতি:</span>
            </h4>
            <p>১v১ ম্যাচে উভয় প্রতিযোগী সম্পূর্ণ সমমানের র‍্যান্ডম ব্লক পিস সেট পান। খেলার ফলাফল সম্পূর্ণ প্লেয়ারের মেধা, দক্ষতা ও দ্রুত সিদ্ধান্তের উপর নির্ভর করে। কোনো অটো-ক্লিকার বা থার্ড পার্টি স্ক্রিপ্ট ব্যবহার সম্পূর্ণ নিষিদ্ধ।</p>
          </div>

          <div className="bg-[#0b1022] p-3 rounded-xl border border-indigo-950">
            <h4 className="font-bold text-amber-400 mb-1 flex items-center gap-1">
              <span>৩. রেজাল্ট ও অটোমেটিক উইনিং সেটেলমেন্ট:</span>
            </h4>
            <p>ম্যাচ সমাপ্ত হওয়ার পর উভয় প্লেয়ারের স্কোর সিস্টেমের সাথে সিঙ্ক হয় এবং সর্বোচ্চ স্কোরকারী প্লেয়ারকে সাথে সাথে বিজয়ী ঘোষণা করে প্রাইজ পুল তার উইনিং ব্যালেন্সে যোগ করা হয়।</p>
          </div>

          <div className="bg-[#0b1022] p-3 rounded-xl border border-red-500/30">
            <h4 className="font-bold text-red-400 mb-1 flex items-center gap-1">
              <span>৪. সততা ও একাউন্ট নিরাপত্তা:</span>
            </h4>
            <p className="text-red-200">কোনো প্রকার হ্যাক, ভুয়া ট্রানজেকশন দাবি বা সিস্টেম প্রতারণার চেষ্টা করলে সংশ্লিষ্ট একাউন্ট স্থায়ীভাবে ব্যান করা হবে এবং বিদ্যমান ব্যালেন্স বাজেয়াপ্ত হবে।</p>
          </div>

          <div className="bg-[#0b1022] p-3 rounded-xl border border-indigo-950">
            <h4 className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
              <span>৫. ইনস্ট্যান্ট ডিপোজিট ও উইথড্রয়াল:</span>
            </h4>
            <p>bKash, Nagad ও Rocket এর মাধ্যমে ২৪ ঘণ্টা ইনস্ট্যান্ট ডিপোজিট সুবিধা রয়েছে। সর্বনিম্ন উইথড্রয়াল ৳১০০ টাকা, যা সরাসরি আপনার পার্সোনাল ওয়ালেটে ক্যাশআউট করা যায়।</p>
          </div>
        </div>

        <button
          onClick={closeModal}
          className="w-full mt-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl text-xs"
        >
          আমি সকল নিয়ম মেনে নিচ্ছি
        </button>
      </div>
    </div>
  );
};
