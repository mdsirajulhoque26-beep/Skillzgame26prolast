import React from 'react';
import {
  Trophy,
  RotateCcw,
  Home,
  History,
  Clock,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { BlockGameMode, BlockPlayerState } from '../../types';

interface BlockResultModalProps {
  mode: BlockGameMode;
  entryFee: number;
  prize: number;
  player: BlockPlayerState;
  opponent?: { name: string; score: number; linesCleared?: number };
  isPractice: boolean;
  isPending?: boolean;
  outcome?: 'WON' | 'LOST' | 'DRAW' | 'PENDING';
  onPlayAgain: () => void;
  onGoHome: () => void;
  onViewPendingMatches?: () => void;
  onViewHistory: () => void;
}

export const BlockResultModal: React.FC<BlockResultModalProps> = ({
  entryFee,
  prize,
  player,
  opponent,
  isPractice,
  isPending = false,
  outcome = 'PENDING',
  onPlayAgain,
  onGoHome,
  onViewPendingMatches,
  onViewHistory,
}) => {
  const isWin = outcome === 'WON';
  const isLoss = outcome === 'LOST';
  const isDraw = outcome === 'DRAW';

  const title = isPractice
    ? 'PRACTICE COMPLETE'
    : isPending
      ? 'MATCH PENDING'
      : isWin
        ? 'YOU WON!'
        : isLoss
          ? 'YOU LOST'
          : 'DRAW';

  const subtitle = isPractice
    ? 'Great job! Keep practicing and improve your score.'
    : isPending
      ? 'Your score has been submitted successfully.'
      : isWin
        ? '🎉 অভিনন্দন! আপনি বিজয়ী! 🎉'
        : isLoss
          ? 'ভালো খেলেছেন! পরের ম্যাচে আবার চেষ্টা করুন।'
          : 'দুজনের ফলাফল সমান হয়েছে।';

  const accent = isPending
    ? 'amber'
    : isWin
      ? 'emerald'
      : isLoss
        ? 'red'
        : 'blue';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border-2 border-indigo-500/50 bg-[#0b1228] shadow-2xl">
          {isWin && !isPractice && (
            <>
              <style>{`
                @keyframes blockWinMoneyFall {
                  0% { transform: translateY(-70px) rotate(0deg); opacity: 0; }
                  10% { opacity: 1; }
                  100% { transform: translateY(520px) rotate(360deg); opacity: 0; }
                }
              `}</style>
              <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <span
                    key={i}
                    className="absolute -top-10 text-3xl font-black"
                    style={{
                      left: `${(i * 19) % 100}%`,
                      animation: `blockWinMoneyFall 2.8s linear ${((i % 7) * 0.22).toFixed(2)}s infinite`,
                    }}
                  >
                    {i % 2 === 0 ? '$' : '💵'}
                  </span>
                ))}
              </div>
            </>
          )}



        {/* Ambient glow */}
        <div
          className={`pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-3xl ${
            accent === 'amber'
              ? 'bg-amber-500/30'
              : accent === 'emerald'
                ? 'bg-emerald-500/30'
                : accent === 'red'
                  ? 'bg-red-500/25'
                  : 'bg-blue-500/25'
          }`}
        />

        <div className="relative p-5 text-center">

          {/* Security badge */}
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            SERVER VERIFIED
          </div>

          {/* Main result icon */}
          <div
            className={`mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-3xl border-2 shadow-xl ${
              isPending
                ? 'border-amber-400/50 bg-amber-500/10'
                : isWin
                  ? 'border-amber-400/60 bg-amber-500/10'
                  : isLoss
                    ? 'border-red-400/50 bg-red-500/10'
                    : 'border-blue-400/50 bg-blue-500/10'
            }`}
          >
            <span className={`text-5xl ${isPending || isWin ? 'animate-pulse' : ''}`}>
              {isPractice ? '🎯' : isPending ? '⏳' : isWin ? '🏆' : isLoss ? '😔' : '🤝'}
            </span>
          </div>

          {/* BIG RESULT */}
          <h2
            className={`${isWin ? 'text-6xl sm:text-7xl' : 'text-4xl'} font-black tracking-tight ${
              isPending
                ? 'text-amber-400'
                : isWin
                  ? 'text-emerald-400'
                  : isLoss
                    ? 'text-red-400'
                    : 'text-blue-400'
            }`}
          >
            {title}
          </h2>

          <p className="mt-2 text-sm font-semibold text-slate-200">
            {subtitle}
          </p>

          {/* Pending information */}
          {isPending && !isPractice && (
            <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
              <div className="text-xs font-bold text-amber-300">
                SCORE SUBMITTED
              </div>
              <div className="mt-1 text-2xl font-black text-white">
                {player.score} <span className="text-sm text-slate-400">PTS</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                প্রতিপক্ষ ম্যাচ শেষ করলে সার্ভার ফলাফল চূড়ান্ত করবে।
              </p>
            </div>
          )}

          {/* Win prize */}
          {isWin && !isPractice && (
            <div className="mt-3 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-3">
              <div className="flex items-center justify-center gap-2 text-emerald-300">
                <Wallet className="h-5 w-5" />
                <span className="text-xs font-bold">PRIZE ADDED</span>
              </div>
              <div className="mt-1 text-3xl font-black text-emerald-400">
                ৳{prize}
              </div>
              <div className="text-[10px] text-slate-300">
                আপনার ওয়ালেটে যোগ হয়েছে
              </div>
            </div>
          )}

          {/* Scoreboard */}
          <div className="mt-4 rounded-2xl border border-indigo-900/70 bg-[#070d1d] p-3">
            {!isPractice && opponent ? (
              <div className="grid grid-cols-2 gap-2">

                <div
                  className={`rounded-xl border p-3 ${
                    isWin
                      ? 'border-emerald-400/60 bg-emerald-500/10'
                      : 'border-indigo-950 bg-[#121935]'
                  }`}
                >
                  <div className="truncate text-[10px] font-bold text-slate-400">
                    YOU
                  </div>
                  <div className="mt-1 text-2xl font-black text-white">
                    {player.score}
                  </div>
                  <div className="text-[9px] text-emerald-400">
                    {player.linesCleared} Lines
                  </div>
                </div>

                <div
                  className={`rounded-xl border p-3 ${
                    isLoss
                      ? 'border-red-400/60 bg-red-500/10'
                      : 'border-indigo-950 bg-[#121935]'
                  }`}
                >
                  <div className="truncate text-[10px] font-bold text-slate-400">
                    {opponent.name}
                  </div>
                  <div className="mt-1 text-2xl font-black text-white">
                    {opponent.score}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {opponent.linesCleared ?? 0} Lines
                  </div>
                </div>

              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-indigo-950 bg-[#121935] p-2">
                  <div className="text-[9px] font-bold text-slate-400">SCORE</div>
                  <div className="text-lg font-black text-amber-400">
                    {player.score}
                  </div>
                </div>

                <div className="rounded-xl border border-indigo-950 bg-[#121935] p-2">
                  <div className="text-[9px] font-bold text-slate-400">LINES</div>
                  <div className="text-lg font-black text-emerald-400">
                    {player.linesCleared}
                  </div>
                </div>

                <div className="rounded-xl border border-indigo-950 bg-[#121935] p-2">
                  <div className="text-[9px] font-bold text-slate-400">COMBO</div>
                  <div className="text-lg font-black text-cyan-400">
                    {player.bestCombo}x
                  </div>
                </div>
              </div>
            )}

            {entryFee > 0 && (
              <div className="mt-3 flex items-center justify-between border-t border-indigo-950 pt-2 text-[11px] text-slate-400">
                <span>Entry: ৳{entryFee}</span>
                <span className="font-bold text-amber-400">
                  Prize: ৳{prize}
                </span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="mt-4 space-y-2">

            <button
              id="result-play-again-btn"
              onClick={onPlayAgain}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 py-3.5 text-sm font-black text-slate-950 shadow-lg transition-transform active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
              আবার খেলুন • PLAY AGAIN
            </button>

            <div className="grid grid-cols-2 gap-2">

              {onViewPendingMatches ? (
                <button
                  id="result-pending-btn"
                  onClick={onViewPendingMatches}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-800 bg-[#141c3c] py-2.5 text-xs font-bold text-amber-300"
                >
                  <Clock className="h-3.5 w-3.5" />
                  Pending Matches
                </button>
              ) : (
                <button
                  id="result-history-btn"
                  onClick={onViewHistory}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-800 bg-[#141c3c] py-2.5 text-xs font-bold text-slate-200"
                >
                  <History className="h-3.5 w-3.5" />
                  History
                </button>
              )}

              <button
                id="result-home-btn"
                onClick={onGoHome}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-800 bg-[#141c3c] py-2.5 text-xs font-bold text-slate-200"
              >
                <Home className="h-3.5 w-3.5 text-amber-400" />
                HOME
              </button>

            </div>
          </div>

          <div className="mt-3 text-[9px] text-slate-500">
            Server-authoritative match result
          </div>

        </div>
      </div>
    </div>
  );
};
