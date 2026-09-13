import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  User as UserIcon, 
  Phone, 
  Wallet, 
  Trophy, 
  Gamepad2, 
  Award, 
  BookOpen, 
  Users, 
  Gift, 
  Headphones, 
  Code, 
  LogOut, 
  ChevronRight,
  Coins,
  ShieldAlert,
} from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const androidApkUrl = (import.meta.env.VITE_ANDROID_APK_URL || '').trim();
  const { user, logout, setCurrentTab, openModal, paymentSettings } = useApp();

  const handleAdminSupport = () => {
    const num = paymentSettings.whatsappSupport || '';
    const message = encodeURIComponent(`Hello Admin, I need support for my account: ${user.phone}`);
    window.open(`https://wa.me/88${num.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  const handleDeveloperProfile = () => {
    alert('SKILLZGAME - Smart Block Puzzle Game.\nVersion: 2.4.0 (2026 Edition)');
  };

  const downloadApk = () => { if (androidApkUrl) window.open(androidApkUrl, '_blank', 'noopener,noreferrer'); };
  return (
    <div className="pb-24 pt-1 px-3 max-w-md mx-auto space-y-4 text-white">
      {androidApkUrl && <button onClick={downloadApk} className="w-full mb-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-bold text-cyan-300">📱 Android APK Download</button>}
      {/* User Header Card (01:24) */}
      <div className="bg-[#121935] border border-indigo-500/30 rounded-3xl p-5 shadow-xl text-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 via-indigo-500 to-purple-600 p-1 mx-auto mb-3 shadow-lg shadow-indigo-500/20">
          <div className="w-full h-full bg-[#0d1222] rounded-full flex items-center justify-center text-amber-400">
            <UserIcon className="w-9 h-9 stroke-[2]" />
          </div>
        </div>

        <h3 className="text-lg font-black text-white">{user.name}</h3>
        <p className="text-xs text-amber-400 font-mono font-medium flex items-center justify-center gap-1.5 mt-1 bg-amber-400/10 px-3 py-1 rounded-full w-fit mx-auto border border-amber-400/20">
          <Phone className="w-3 h-3" />
          <span>{user.phone}</span>
        </p>
      </div>

      {/* 4 Metric / Stat Cards (01:24) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Gaming Balance */}
        <div 
          onClick={() => setCurrentTab('wallet')}
          className="bg-[#131b38] border border-indigo-500/30 rounded-2xl p-4 shadow-lg text-center cursor-pointer hover:border-amber-400/50 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center mx-auto mb-1">
            <Coins className="w-4 h-4" />
          </div>
          <div className="text-lg font-black font-mono text-white">
            ৳{user.gamingBalance.toFixed(2)}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            GAMING BALANCE
          </div>
        </div>

        {/* Winning Balance */}
        <div 
          onClick={() => setCurrentTab('wallet')}
          className="bg-[#131b38] border border-indigo-500/30 rounded-2xl p-4 shadow-lg text-center cursor-pointer hover:border-emerald-400/50 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-400/20 text-emerald-400 flex items-center justify-center mx-auto mb-1">
            <Trophy className="w-4 h-4" />
          </div>
          <div className="text-lg font-black font-mono text-white">
            ৳{user.winningBalance.toFixed(2)}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            WINNING BALANCE
          </div>
        </div>

        {/* Games Played */}
        <div 
          onClick={() => setCurrentTab('block_puzzle')}
          className="bg-[#131b38] border border-indigo-500/30 rounded-2xl p-4 shadow-lg text-center cursor-pointer hover:border-blue-400/50 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-blue-400/20 text-blue-400 flex items-center justify-center mx-auto mb-1">
            <Gamepad2 className="w-4 h-4" />
          </div>
          <div className="text-lg font-black font-mono text-white">
            {user.matchesPlayed}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            MATCHES PLAYED
          </div>
        </div>

        {/* Total Winnings */}
        <div 
          onClick={() => setCurrentTab('transactions')}
          className="bg-[#131b38] border border-indigo-500/30 rounded-2xl p-4 shadow-lg text-center cursor-pointer hover:border-pink-400/50 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-pink-400/20 text-pink-400 flex items-center justify-center mx-auto mb-1">
            <Award className="w-4 h-4" />
          </div>
          <div className="text-lg font-black font-mono text-white">
            ৳{user.totalWinnings.toFixed(2)}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            TOTAL WINNINGS
          </div>
        </div>
      </div>

      {/* Profile Menu Items List (01:28 - 01:33) */}
      <div className="bg-[#121935] border border-indigo-500/30 rounded-2xl overflow-hidden shadow-xl divide-y divide-indigo-950/80">
        {/* Admin Panel Control (Visible ONLY to Admin / Owner) */}
        {(user.isAdmin) && (
          <div
            id="menu-admin-panel"
            onClick={() => setCurrentTab('admin')}
            className="p-3.5 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-red-500/10 hover:from-amber-500/20 hover:to-red-500/20 cursor-pointer transition-colors border border-amber-500/30 rounded-xl my-1"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/30 text-amber-300 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-amber-400 block">এডমিন কন্ট্রোল প্যানেল</span>
                <span className="text-[10px] text-slate-400">রুম আইডি প্রদান, রেজাল্ট ও ডিপোজিট ম্যানেজ</span>
              </div>
            </div>
            <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full">
              ADMIN
            </span>
          </div>
        )}

        {/* My Profile */}
        <div
          id="menu-my-profile"
          onClick={() => alert(`ইউজার প্রোফাইল:\nনাম: ${user.name}\nফোন: ${user.phone}\nযোগদানের তারিখ: ${user.joinedAt}`)}
          className="p-3.5 flex items-center justify-between hover:bg-indigo-950/60 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-200">My Profile</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>

        {/* App Rules & Guidelines */}
        <div
          id="menu-rules"
          onClick={() => openModal('rules')}
          className="p-3.5 flex items-center justify-between hover:bg-indigo-950/60 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-200">App Rules & Guidelines</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>

        {/* My Wallet */}
        <div
          id="menu-my-wallet"
          onClick={() => setCurrentTab('wallet')}
          className="p-3.5 flex items-center justify-between hover:bg-indigo-950/60 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-200">My Wallet</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>

        {/* Top Players */}
        <div
          id="menu-top-players"
          onClick={() => openModal('leaderboard')}
          className="p-3.5 flex items-center justify-between hover:bg-indigo-950/60 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-200">Top Players</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>

        {/* Refer And Earn */}
        <div
          id="menu-refer-earn"
          onClick={() => openModal('refer')}
          className="p-3.5 flex items-center justify-between hover:bg-indigo-950/60 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-200">Refer And Earn</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>

        {/* Admin Support */}
        <div
          id="menu-admin-support"
          onClick={handleAdminSupport}
          className="p-3.5 flex items-center justify-between hover:bg-indigo-950/60 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Headphones className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-200">Admin Support</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>

        {/* Developer Profile */}
        <div
          id="menu-developer-profile"
          onClick={handleDeveloperProfile}
          className="p-3.5 flex items-center justify-between hover:bg-indigo-950/60 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Code className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-200">Developer Profile</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>

        {/* Logout */}
        <div
          id="menu-logout"
          onClick={logout}
          className="p-3.5 flex items-center justify-between hover:bg-red-500/20 cursor-pointer transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-red-400 group-hover:text-red-300">Logout</span>
          </div>
          <ChevronRight className="w-4 h-4 text-red-400/50" />
        </div>
      </div>
    </div>
  );
};
