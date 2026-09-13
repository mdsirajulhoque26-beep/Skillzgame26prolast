import React from 'react';
import { X, HelpCircle, Zap, Flame, ShieldCheck, Trophy, Sparkles } from 'lucide-react';

interface BlockRulesModalProps {
  onClose: () => void;
}

export const BlockRulesModal: React.FC<BlockRulesModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-[#0e162f] border border-indigo-500/60 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-indigo-900/80 pb-2.5">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h3 className="font-black text-white text-base">GAME RULES & SCORING</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#141b38] flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Core Rule */}
        <div className="space-y-2">
          <h4 className="text-xs font-black text-amber-300 uppercase tracking-wide flex items-center gap-1">
            <span>🧩</span> গেমের মূল লক্ষ্য
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed bg-[#121935] p-3 rounded-xl border border-indigo-950">
            নিচের ট্রে থেকে ব্লকগুলো ৮x৮ গ্রিডে বসান। যেকোনো অনুভূমিক (Row) বা উল্লম্ব (Column) লাইন সম্পূর্ণ ভরাট হলেই সেই লাইনটি ক্লিয়ার হয়ে পয়েন্ট যোগ হবে।
          </p>
        </div>

        {/* 2. Scoring System */}
        <div className="space-y-2">
          <h4 className="text-xs font-black text-amber-300 uppercase tracking-wide flex items-center gap-1">
            <span>🏆</span> পয়েন্ট ও স্কোরিং সিস্টেম
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#121935] p-2 rounded-xl border border-indigo-950">
              <span className="text-slate-400 block text-[10px]">১টি লাইন ক্লিয়ার:</span>
              <span className="font-bold text-amber-400 font-mono">+১০ পয়েন্ট</span>
            </div>
            <div className="bg-[#121935] p-2 rounded-xl border border-indigo-950">
              <span className="text-slate-400 block text-[10px]">একসাথে ২টি লাইন:</span>
              <span className="font-bold text-amber-400 font-mono">+২৫ পয়েন্ট</span>
            </div>
            <div className="bg-[#121935] p-2 rounded-xl border border-indigo-950">
              <span className="text-slate-400 block text-[10px]">একসাথে ৩টি লাইন:</span>
              <span className="font-bold text-amber-400 font-mono">+৪৫ পয়েন্ট</span>
            </div>
            <div className="bg-[#121935] p-2 rounded-xl border border-indigo-950">
              <span className="text-slate-400 block text-[10px]">একসাথে ৪টি লাইন:</span>
              <span className="font-bold text-amber-400 font-mono">+৭০ পয়েন্ট</span>
            </div>
          </div>
          <div className="bg-[#121935] p-2.5 rounded-xl border border-indigo-950 text-xs text-slate-300">
            <span className="text-amber-400 font-bold">কম্বো ও স্ট্রিক বোনাস:</span> পরপর চালগুলোতে লাইন ক্লিয়ার করতে পারলে অতিরিক্ত কম্বো মাল্টিপ্লায়ার বোনাস যোগ হবে!
          </div>
        </div>

        {/* 3. Special Blocks */}
        <div className="space-y-2">
          <h4 className="text-xs font-black text-amber-300 uppercase tracking-wide flex items-center gap-1">
            <span>⚡</span> স্পেশাল ব্লক পাওয়ার
          </h4>
          <div className="space-y-1.5 text-xs">
            <div className="bg-[#121935] p-2 rounded-xl border border-indigo-950 flex items-center gap-2">
              <span className="text-base">💣</span>
              <div>
                <span className="font-bold text-red-400">Bomb (বোমা):</span>
                <span className="text-slate-300 ml-1">আশেপাশের ৩x৩ এরিয়া সম্পূর্ণ ধ্বংস করে।</span>
              </div>
            </div>
            <div className="bg-[#121935] p-2 rounded-xl border border-indigo-950 flex items-center gap-2">
              <span className="text-base">⚡</span>
              <div>
                <span className="font-bold text-amber-400">Lightning (বজ্রপাত):</span>
                <span className="text-slate-300 ml-1">একটি সম্পূর্ণ রো বা কলাম ফাঁকা করে দেয়।</span>
              </div>
            </div>
            <div className="bg-[#121935] p-2 rounded-xl border border-indigo-950 flex items-center gap-2">
              <span className="text-base">🔨</span>
              <div>
                <span className="font-bold text-cyan-400">Hammer (হাতুড়ি):</span>
                <span className="text-slate-300 ml-1">যেকোনো একটি নির্দিষ্ট ব্লক ভেঙে দেয়।</span>
              </div>
            </div>
            <div className="bg-[#121935] p-2 rounded-xl border border-indigo-950 flex items-center gap-2">
              <span className="text-base">🔄</span>
              <div>
                <span className="font-bold text-emerald-400">Shuffle (সাফল):</span>
                <span className="text-slate-300 ml-1">ট্রে-তে নতুন ৩টি ব্লক নিয়ে আসে।</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Anti-Cheat & Sync */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>সার্ভার অথরিটেটিভ ফেয়ার-প্লে</span>
          </div>
          <p className="text-slate-300 text-[11px]">
            ১v১ মোডে উভয় প্লেয়ার হুবহু একই সিকোয়েন্সের ব্লক পাবেন (Server Synchronized Seed)। ম্যাচের চূড়ান্ত স্কোর ও বিজয়ী ক্লায়েন্ট সাইড নয়, বরং ক্লাউড সার্ভার কর্তৃক যাচাইকৃত।
          </p>
        </div>
      </div>
    </div>
  );
};
