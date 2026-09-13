import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { AuthScreen } from './components/AuthScreen';
import { HomeScreen } from './components/HomeScreen';
import { WalletScreen } from './components/WalletScreen';
import { TransactionsScreen } from './components/TransactionsScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { BlockPuzzleDuel } from './components/BlockPuzzleDuel';
import { AdminPanel } from './components/AdminPanel';
import { ArcadeOnlineGame } from './components/ArcadeOnlineGame';

// Modals
import { NoticeModal } from './components/modals/NoticeModal';
import { AddMoneyModal } from './components/modals/AddMoneyModal';
import { WithdrawModal } from './components/modals/WithdrawModal';
import { TransferModal } from './components/modals/TransferModal';
import { LeaderboardModal } from './components/modals/LeaderboardModal';
import { ReferModal } from './components/modals/ReferModal';
import { SupportModal } from './components/modals/SupportModal';
import { VideoTutorialModal } from './components/modals/VideoTutorialModal';
import { DailyLimitModal } from './components/modals/DailyLimitModal';

const MainLayout: React.FC = () => {
  const { isLoggedIn, currentTab } = useApp();

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
        {currentTab === 'profile' && <ProfileScreen />}
        {currentTab === 'block_puzzle' && <BlockPuzzleDuel />}
        {currentTab === 'pool' && <ArcadeOnlineGame gameType="pool" />}
        {currentTab === 'carrom' && <ArcadeOnlineGame gameType="carrom" />}
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
      <SupportModal />
      <VideoTutorialModal />
      <DailyLimitModal />
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
