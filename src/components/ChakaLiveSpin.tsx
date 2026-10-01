import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Volume2, VolumeX, History, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { backendApi } from '../services/backendApi';
import { LiveWheel } from './chaka/LiveWheel';
import { BettingGrid } from './chaka/BettingGrid';
import { SLOTS_DATA, GameStatus } from './chaka/types';
import { soundManager } from './chaka/audio';

const mapStatus = (status?: string): GameStatus => {
  if (status === 'OPEN') return 'BETTING_OPEN';
  if (status === 'SPINNING') return 'SPINNING';
  if (status === 'CLOSED') return 'BETTING_CLOSED';
  if (status === 'RESULT') return 'ROUND_RESULT';
  return 'PAUSED';
};

export const ChakaLiveSpin: React.FC = () => {
  const { user, setCurrentTab, refreshUser } = useApp();

  const [round, setRound] = useState<any>(null);
  const [userBets, setUserBets] = useState<Record<number, number>>({});
  const [livePoolBySlot, setLivePoolBySlot] = useState<Record<number, { amount: number; count: number }>>({});
  const [history, setHistory] = useState<any[]>([]);
  const [selectedChip, setSelectedChip] = useState(100);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [muted, setMuted] = useState(soundManager.getMuted());

  const loadState = useCallback(async () => {
    try {
      const data = await backendApi.chakaState();
      setRound(data.round || null);
      setUserBets(data.userBets || {});
      setLivePoolBySlot(data.livePoolBySlot || {});
      setHistory(data.history || []);
    } catch (e: any) {
      setMessage(e?.message || 'গেম লোড করা যায়নি।');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadState();
    const poll = window.setInterval(() => void loadState(), 1500);
    const clock = window.setInterval(() => setNow(Date.now()), 250);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, [loadState]);

  const gameStatus = mapStatus(round?.status);
  const winningSlotId = Number(round?.winningSlot || 0) || null;
  const winningSlot = useMemo(
    () => SLOTS_DATA.find((slot) => slot.id === winningSlotId) || null,
    [winningSlotId]
  );

  const remainingSeconds = useMemo(() => {
    if (!round?.endsAt || gameStatus !== 'BETTING_OPEN') return 0;
    return Math.max(0, Math.ceil((Number(round.endsAt) - now) / 1000));
  }, [round?.endsAt, gameStatus, now]);

  const placeBet = async (slotId: number) => {
    if (busy || gameStatus !== 'BETTING_OPEN') return;
    if (selectedChip > Number(user?.gamingBalance || 0)) {
      setMessage('আপনার গেমিং ব্যালেন্স কম।');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      const betId = `chaka_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      await backendApi.chakaPlaceBet(slotId, selectedChip, betId);
      await Promise.all([loadState(), refreshUser()]);
      setMessage('বেট সফল হয়েছে।');
    } catch (e: any) {
      setMessage(e?.message || 'বেট করা যায়নি।');
    } finally {
      setBusy(false);
    }
  };

  const clearBets = async () => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const operationId = `clear_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      await backendApi.chakaClearBets(operationId);
      await Promise.all([loadState(), refreshUser()]);
      setMessage('বেট ক্লিয়ার হয়েছে।');
    } catch (e: any) {
      setMessage(e?.message || 'বেট ক্লিয়ার করা যায়নি।');
    } finally {
      setBusy(false);
    }
  };

  const doubleBets = async () => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const operationId = `double_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      await backendApi.chakaDoubleBets(operationId);
      await Promise.all([loadState(), refreshUser()]);
      setMessage('বেট 2x করা হয়েছে।');
    } catch (e: any) {
      setMessage(e?.message || 'বেট 2x করা যায়নি।');
    } finally {
      setBusy(false);
    }
  };

  const toggleSound = () => {
    const next = soundManager.toggleMute();
    setMuted(next);
  };

  if (loading && !round) {
    return (
      <div className="min-h-screen bg-[#070b16] text-white flex items-center justify-center">
        <div className="text-cyan-300 font-bold">চাকা গেম লোড হচ্ছে...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b16] text-white pb-6">
      <div className="max-w-md mx-auto px-3 pt-3">
        <div className="flex items-center justify-between gap-2 mb-3">
          <button
            type="button"
            onClick={() => setCurrentTab('home')}
            className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="text-center flex-1">
            <h1 className="text-lg font-black">🎡 চাকা লাইভ স্পিন</h1>
            <p className="text-[11px] text-slate-400">
              Round #{round?.number ?? '—'}
            </p>
          </div>

          <button
            type="button"
            onClick={toggleSound}
            className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center"
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>

        <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-3 mb-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400">গেমিং ব্যালেন্স</div>
            <div className="text-xl font-black text-emerald-400">
              ৳{Number(user?.gamingBalance || 0).toFixed(2)}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] text-slate-400">
              {gameStatus === 'BETTING_OPEN' ? 'বেটিং বন্ধ হবে' : 'স্ট্যাটাস'}
            </div>
            <div className={`font-black ${gameStatus === 'BETTING_OPEN' ? 'text-amber-300' : 'text-cyan-300'}`}>
              {gameStatus === 'BETTING_OPEN'
                ? `${remainingSeconds}s`
                : gameStatus === 'SPINNING'
                  ? 'SPINNING'
                  : 'WAITING'}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-slate-900 to-black p-2 shadow-2xl">
          <LiveWheel
            gameStatus={gameStatus}
            winningSlot={winningSlot}
            targetSlotId={winningSlotId}
            onSpinComplete={() => void loadState()}
            lang="bn"
          />
        </div>

        <div className="mt-3">
          <BettingGrid
            userBets={userBets}
            livePoolBySlot={livePoolBySlot}
            selectedChip={selectedChip}
            onSelectChip={setSelectedChip}
            onPlaceBet={placeBet}
            onClearBets={clearBets}
            onDoubleBets={doubleBets}
            gameStatus={gameStatus}
            winningSlotId={winningSlotId}
            userBalance={Number(user?.gamingBalance || 0)}
            lang="bn"
          />
        </div>

        {message && (
          <div className="mt-3 rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-3 py-2 text-sm text-cyan-200">
            {message}
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-black flex items-center gap-2">
              <History size={17} /> সাম্প্রতিক ফলাফল
            </h2>
            <button
              type="button"
              onClick={() => void loadState()}
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-slate-500">এখনও কোনো ফলাফল নেই।</p>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {history.slice(0, 10).map((item: any, index: number) => {
                const slot = SLOTS_DATA.find((s) => s.id === Number(item.winningSlotId));
                return (
                  <div
                    key={`${item.roundNumber}-${index}`}
                    className="rounded-xl bg-slate-800/80 border border-slate-700 p-2 text-center"
                  >
                    <div className="text-[9px] text-slate-500">#{item.roundNumber}</div>
                    <div className="text-lg">{slot?.iconName === 'crown' ? '👑' : slot?.iconName === 'diamond' ? '💎' : slot?.iconName === 'zap' ? '⚡' : slot?.iconName === 'clover' ? '🍀' : slot?.iconName === 'flame' ? '🦁' : '🚀'}</div>
                    <div className="text-[10px] font-bold">{slot?.numberBn || '—'}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
