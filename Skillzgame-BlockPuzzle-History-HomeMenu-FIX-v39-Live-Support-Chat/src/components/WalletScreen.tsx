import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Plus, 
  ArrowUpRight, 
  ArrowRightLeft, 
  ChevronRight, 
  Play, 
  MessageCircle, 
  Trophy, 
  Gamepad2, 
  Wallet,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const WalletScreen: React.FC = () => {
  const { user, setCurrentTab, openModal, paymentSettings } = useApp();
  const [showBalance, setShowBalance] = useState<boolean>(true);

  const totalBalance = user.gamingBalance + user.winningBalance;

  const handleWhatsApp = () => {
    const num = paymentSettings.whatsappSupport || '';
    const message = encodeURIComponent('Hello Skillzgame Support, I have a query about my wallet/deposit/withdrawal.');
    window.open(`https://wa.me/88${num.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  return (
    <div className="pb-24 pt-1 px-3 max-w-md mx-auto space-y-4 text-white">
      {/* Header (01:35) */}
      <div className="sticky top-14 z-30 bg-[#0d1222]/95 backdrop-blur-md py-2.5 flex items-center justify-between border-b border-indigo-950/60">
        <div className="flex items-center gap-2">
          <button
            id="wallet-back-btn"
            onClick={() => setCurrentTab('home')}
            className="w-8 h-8 rounded-full bg-indigo-950/80 hover:bg-indigo-900 text-slate-300 flex items-center justify-center border border-indigo-800/40"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-base font-extrabold text-white tracking-wide">
            SKILLZGAME WALLET
          </h2>
        </div>

        <button
          id="wallet-to-transactions-header-btn"
          onClick={() => setCurrentTab('transactions')}
          className="text-xs text-amber-400 font-bold hover:underline flex items-center gap-0.5 bg-indigo-950/60 px-2.5 py-1 rounded-md border border-indigo-800/50"
        >
          <span>হিস্ট্রি</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Gradient Total Balance Card (01:36) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0284c7] via-[#2563eb] to-[#7c3aed] p-5 shadow-2xl border border-white/20">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold tracking-widest text-cyan-200 uppercase">
            MY TOTAL BALANCE
          </span>
          <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shadow-inner">
            <Wallet className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-xs text-cyan-100/90 font-medium">AVAILABLE BALANCE</div>
          <div className="flex items-center justify-between mt-1">
            <div className="text-3xl font-black font-mono tracking-tight text-white flex items-center gap-1">
              <span>৳</span>
              <span>{showBalance ? totalBalance.toFixed(2) : '••••••'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                id="wallet-transactions-btn"
                onClick={() => setCurrentTab('transactions')}
                className="bg-black/30 hover:bg-black/40 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-1 backdrop-blur shadow active:scale-95 transition-all"
              >
                <span>লেনদেন</span>
                <ChevronRight className="w-3 h-3" />
              </button>

              <button
                id="wallet-toggle-balance-btn"
                onClick={() => setShowBalance(!showBalance)}
                className="w-8 h-8 rounded-xl bg-black/30 hover:bg-black/40 text-white flex items-center justify-center border border-white/20 backdrop-blur shadow active:scale-95 transition-all"
              >
                {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-[11px] text-cyan-100 font-semibold">
          <span>SKILLZGAME WALLET</span>
          <span className="flex items-center gap-1 text-emerald-300">
            <CheckCircle2 className="w-3 h-3" /> Verified Secure
          </span>
        </div>
      </div>

      {/* Dual Balances Breakdown (01:36, 02:14) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Gaming Balance Card */}
        <div className="bg-[#131b38] border border-indigo-500/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-300">GAMING BALANCE</span>
          </div>
          <div className="text-xl font-black font-mono text-amber-400">
            ৳ {showBalance ? user.gamingBalance.toFixed(2) : '••••'}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">ম্যাচ খেলার জন্য প্রযোজ্য</p>
        </div>

        {/* Winning Balance Card */}
        <div className="bg-[#131b38] border border-indigo-500/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-300">WINNING BALANCE</span>
          </div>
          <div className="text-xl font-black font-mono text-emerald-400">
            ৳ {showBalance ? user.winningBalance.toFixed(2) : '••••'}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">উইথড্র অথবা ট্রান্সফার যোগ্য</p>
        </div>
      </div>

      {/* Action Buttons (01:36 - 01:38) */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Add Money (Deposit) */}
        <button
          id="wallet-add-money-btn"
          onClick={() => openModal('add_money')}
          className="group bg-gradient-to-b from-[#eab308] to-[#ca8a04] hover:from-[#facc15] hover:to-[#eab308] text-slate-950 p-3 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center active:scale-95 transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-black/15 flex items-center justify-center mb-1">
            <Plus className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="text-xs font-extrabold tracking-wide uppercase">ADD MONEY</span>
        </button>

        {/* Withdraw */}
        <button
          id="wallet-withdraw-btn"
          onClick={() => openModal('withdraw')}
          className="group bg-gradient-to-b from-[#14b8a6] to-[#0d9488] hover:from-[#2dd4bf] hover:to-[#14b8a6] text-white p-3 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center active:scale-95 transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-black/15 flex items-center justify-center mb-1">
            <ArrowUpRight className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="text-xs font-extrabold tracking-wide uppercase">WITHDRAW</span>
        </button>

        {/* Transfer */}
        <button
          id="wallet-transfer-btn"
          onClick={() => openModal('transfer')}
          className="group bg-gradient-to-b from-[#ec4899] to-[#db2777] hover:from-[#f472b6] hover:to-[#ec4899] text-white p-3 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center active:scale-95 transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-black/15 flex items-center justify-center mb-1">
            <ArrowRightLeft className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="text-xs font-extrabold tracking-wide uppercase">TRANSFER</span>
        </button>
      </div>

      {/* Video Tutorial Section (01:42) */}
      <div className="bg-[#121935] border border-indigo-500/30 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm text-white">ভিডিও টিউটোরিয়াল</span>
        </div>

        <div className="bg-[#0b1022] border border-indigo-900 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center shrink-0">
            <Play className="w-5 h-5 fill-current" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-xs text-white truncate">
              কিভাবে টাকা যোগ করবেন?
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              জানতে চাইলে এখানে ট্যাপ করে ভিডিও দেখুন!
            </p>
          </div>
        </div>

        <button
          id="wallet-video-tutorials-cta-btn"
          onClick={() => openModal('video_tutorials')}
          className="w-full py-2 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-200 hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>▶ ভিডিও টিউটোরিয়াল দেখুন (৩)</span>
        </button>
      </div>

      {/* 24/7 Live Support Banner (01:43, 02:29) */}
      <div 
        id="wallet-support-banner"
        onClick={handleWhatsApp}
        className="bg-gradient-to-r from-[#065f46] via-[#047857] to-[#064e3b] border border-emerald-500/40 rounded-2xl p-4 shadow-lg flex items-center justify-between cursor-pointer hover:border-emerald-400 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shadow-md">
            <MessageCircle className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h4 className="font-black text-sm text-white flex items-center gap-1.5">
              <span>২৪/৭ লাইভ সাপোর্ট</span>
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            </h4>
            <p className="text-[11px] text-emerald-100 mt-0.5">
              যেকোনো সমস্যা হলে WhatsApp সাপোর্টে যোগাযোগ করুন।
            </p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
