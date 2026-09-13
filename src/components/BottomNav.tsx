import React from 'react';
import { useApp } from '../context/AppContext';
import { MessageSquare, Gamepad2, User as UserIcon } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, openModal } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d1222]/95 backdrop-blur-md border-t border-indigo-950/80 px-6 py-2 shadow-2xl max-w-md mx-auto">
      <div className="flex items-center justify-around">
        {/* Support Tab */}
        <button
          id="nav-support-btn"
          onClick={() => openModal('support')}
          className={`flex flex-col items-center gap-1 transition-colors relative py-1 px-3 ${
            currentTab === 'home' && false ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium tracking-tight">সাপোর্ট</span>
        </button>

        {/* Play / Game Tab */}
        <button
          id="nav-play-btn"
          onClick={() => setCurrentTab('home')}
          className={`flex flex-col items-center gap-1 transition-colors relative py-1 px-4 ${
            currentTab === 'home' || currentTab === 'block_puzzle'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`w-5 h-5 flex items-center justify-center ${
            currentTab === 'home' || currentTab === 'block_puzzle' ? 'scale-110 text-amber-400' : ''
          }`}>
            <Gamepad2 className="w-5 h-5" />
          </div>
          <span className="text-[11px] tracking-tight">খেলা</span>
          {(currentTab === 'home' || currentTab === 'block_puzzle') && (
            <span className="absolute -bottom-1 w-4 h-0.5 bg-amber-400 rounded-full" />
          )}
        </button>

        {/* Profile Tab */}
        <button
          id="nav-profile-btn"
          onClick={() => setCurrentTab('profile')}
          className={`flex flex-col items-center gap-1 transition-colors relative py-1 px-3 ${
            currentTab === 'profile' || currentTab === 'wallet' || currentTab === 'transactions'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`w-5 h-5 flex items-center justify-center ${
            currentTab === 'profile' || currentTab === 'wallet' || currentTab === 'transactions' ? 'scale-110 text-amber-400' : ''
          }`}>
            <UserIcon className="w-5 h-5" />
          </div>
          <span className="text-[11px] tracking-tight">প্রোফাইল</span>
          {(currentTab === 'profile' || currentTab === 'wallet' || currentTab === 'transactions') && (
            <span className="absolute -bottom-1 w-4 h-0.5 bg-amber-400 rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
};
