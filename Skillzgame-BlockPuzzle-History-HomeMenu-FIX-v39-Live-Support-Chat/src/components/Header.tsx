import React from 'react';
import { useApp } from '../context/AppContext';
import { MessageCircle, Wallet, ShieldAlert } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, setCurrentTab, openModal, paymentSettings } = useApp();

  const handleWhatsApp = () => {
    const num = paymentSettings.whatsappSupport || '';
    const message = encodeURIComponent('Hello Skillzgame Support, I need help with my account.');
    window.open(`https://wa.me/88${num.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0d1222]/95 backdrop-blur border-b border-indigo-950/60 px-4 py-2.5 flex items-center justify-between shadow-md">
      {/* Brand */}
      <div 
        id="app-header-brand"
        onClick={() => setCurrentTab('home')}
        className="flex items-center gap-2 cursor-pointer select-none group"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
          <div className="w-full h-full bg-[#0d1222] rounded-[10px] flex items-center justify-center">
            <span className="text-cyan-400 font-extrabold text-xs tracking-wider">SK</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1">
            <span className="font-extrabold tracking-wider text-base text-white">SKILLZGAME</span>
          </div>
          <p className="text-[10px] text-amber-400/90 font-medium">খেলুন এবং টাকা জিতুন 🎮</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Admin Quick Switch (Visible ONLY to Admin/Owner, hidden for regular users) */}
        {(user.isAdmin) && (
          <button
            id="header-admin-quick-btn"
            onClick={() => setCurrentTab('admin')}
            className="flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-400 px-2 py-1 rounded-full text-[10px] font-black active:scale-95 transition-all"
            title="এডমিন প্যানেল"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>ADMIN</span>
          </button>
        )}

        {/* WhatsApp Support button */}
        <button
          id="header-whatsapp-btn"
          onClick={handleWhatsApp}
          className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/25 active:scale-95 transition-all shadow-sm"
          title="WhatsApp Support"
        >
          <MessageCircle className="w-4 h-4 fill-emerald-400/30" />
        </button>

        {/* Balance badge */}
        <button
          id="header-balance-btn"
          onClick={() => setCurrentTab('wallet')}
          className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-900/80 to-[#1e2746] border border-indigo-500/30 hover:border-amber-500/50 px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-inner active:scale-95 transition-all"
        >
          <div className="w-4 h-4 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400">
            <Wallet className="w-2.5 h-2.5" />
          </div>
          <span className="text-amber-400">৳</span>
          <span className="font-mono text-sm tracking-tight">{user.gamingBalance.toFixed(0)}</span>
        </button>
      </div>
    </header>
  );
};
