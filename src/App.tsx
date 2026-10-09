import React, { Suspense, lazy, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { AuthScreen } from './components/AuthScreen';
import { HomeScreen } from './components/HomeScreen';
import { WalletScreen } from './components/WalletScreen';
import { TransactionsScreen } from './components/TransactionsScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { BlockPuzzleDuel } from './components/BlockPuzzleDuel';
const loadTrafficDodgeGame = () => import('./components/TrafficDodgeGame').then(m => ({ default: m.TrafficDodgeGame }));
const TrafficDodgeGame = lazy(loadTrafficDodgeGame);
import { AdminPanel } from './components/AdminPanel';

// Modals
import { NoticeModal } from './components/modals/NoticeModal';
import { AddMoneyModal } from './components/modals/AddMoneyModal';
import { WithdrawModal } from './components/modals/WithdrawModal';
import { TransferModal } from './components/modals/TransferModal';
import { LeaderboardModal } from './components/modals/LeaderboardModal';
import { ReferModal } from './components/modals/ReferModal';
import { VideoTutorialModal } from './components/modals/VideoTutorialModal';
import { DailyLimitModal } from './components/modals/DailyLimitModal';
import { RulesModal } from './components/modals/RulesModal';
import { SupportChatModal } from './components/modals/SupportChatModal';

const MainLayout: React.FC = () => {
  const { isLoggedIn, currentTab } = useApp();

  useEffect(() => {
    if (isLoggedIn) {
      void loadTrafficDodgeGame().catch((error) => {
        console.warn('Traffic Dodge preload failed; it will retry when opened.', error);
      });
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return <AuthScreen />;
  }

  if (currentTab === 'admin') {
    return <AdminPanel />;
  }

  return (
    <div className="min-h-screen bg-[#0a0e1c] text-white flex flex-col justify-between max-w-md mx-auto relative shadow-2xl overflow-x-hidden border-x border-indigo-950/40">
      {/* Top Header */}
      <Header />

      {/* Main Screen Content */}
      <main className="flex-1 w-full">
        {currentTab === 'home' && <HomeScreen />}
        {currentTab === 'wallet' && <WalletScreen />}
        {currentTab === 'transactions' && <TransactionsScreen />}
        {currentTab === 'history' && <HistoryScreen />}
        {currentTab === 'profile' && <ProfileScreen />}
        {currentTab === 'block_puzzle' && (sessionStorage.getItem('skillz_game_type') === 'traffic_dodge' ? <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-amber-400 font-bold">Traffic Dodge loading...</div>}><TrafficDodgeGame /></Suspense> : <BlockPuzzleDuel />)}
      </main>

      {/* Bottom Sticky Navigation */}
      <BottomNav />

      {/* All Popups and Modals */}
      <NoticeModal />
      <AddMoneyModal />
      <WithdrawModal />
      <TransferModal />
      <LeaderboardModal />
      <ReferModal />
      <SupportChatModal />
      <VideoTutorialModal />
      <DailyLimitModal />
      <RulesModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
