import React from 'react';
import { 
  Trophy, 
  Frown, 
  Handshake, 
  RotateCcw, 
  Home, 
  History, 
  Sparkles, 
  ShieldCheck, 
  Flame,
  Award,
  Clock,
  CheckCircle2,
  Wallet
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
  mode,
  entryFee,
  prize,
  player,
  opponent,
  isPractice,
  isPending = false,
  outcome = 'WON',
  onPlayAgain,
  onGoHome,
  onViewPendingMatches,
  onViewHistory,
}) => {
  const isWin = outcome === 'WON';
  const isLoss = outcome === 'LOST';
  const isDraw = outcome === 'DRAW';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-[#0e162f] border-2 border-indigo-500/60 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 text-center relative overflow-hidden">
        {/* Glow ambient background */}
        <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full blur-3xl pointer-events-none ${
          isPending ? 'bg-amber-500/25' : isWin ? 'bg-emerald-500/25' : isLoss ? 'bg-red-500/20' : 'bg-blue-500/20'
        }`} />

        {/* Certified Badge */}
        <div className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Server-Authoritative Anti-Cheat Certified</span>
        </div>

        {/* Main Result Icon & Banner */}
        {isPractice ? (
          <div>
            <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl p-0.5 shadow-lg flex items-center justify-center mb-2">
              <div className="w-full h-full bg-[#0d1222] rounded-[14px] flex items-center justify-center text-3xl">
                🎯
              </div>
            </div>
            <h2 className="text-xl font-black text-white">
              প্র্যাকটিস সম্পন্ন হয়েছে!
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              চমৎকার স্কোর করেছেন! এন্ট্রি ফি দিয়ে লাইভ ম্যাচ খেলে আসল টাকা জিতুন।
            </p>
          </div>
        ) : isPending ? (
          <div>
            <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-amber-400 to-yellow-600 rounded-2xl p-0.5 shadow-lg flex items-center justify-center mb-2 animate-pulse">
              <div className="w-full h-full bg-[#0d1222] rounded-[14px] flex items-center justify-center text-3xl">
                ⏳
              </div>
            </div>
            <h2 className="text-xl font-black text-amber-400">
              ম্যাচ পেন্ডিং রয়েছে
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              আপনার স্কোর ({player.score} pts) সাবমিট হয়েছে! অপর প্রান্তে কোনো প্লেয়ার এই এন্ট্রি ফি (৳{entryFee})-তে খেলা শেষ করলেই রেজাল্ট চূড়ান্ত হবে।
            </p>
          </div>
        ) : isWin ? (
          <div>
            <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-amber-400 to-yellow-600 rounded-2xl p-0.5 shadow-lg flex items-center justify-center mb-2 animate-bounce">
              <div className="w-full h-full bg-[#0d1222] rounded-[14px] flex items-center justify-center text-3xl">
                🏆
              </div>
            </div>
            <h2 className="text-2xl font-black text-amber-400 tracking-wide">
              অভিনন্দন! আপনি বিজয়ী!
            </h2>
            <p className="text-xs text-emerald-300 font-bold mt-0.5 flex items-center justify-center gap-1">
              <Wallet className="w-3.5 h-3.5" />
              <span>প্রাইজ ৳{prize} আপনার ওয়ালেটে যোগ হয়েছে!</span>
            </p>
          </div>
        ) : isLoss ? (
          <div>
            <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-red-500 to-rose-700 rounded-2xl p-0.5 shadow-lg flex items-center justify-center mb-2">
              <div className="w-full h-full bg-[#0d1222] rounded-[14px] flex items-center justify-center text-3xl">
                😔
              </div>
            </div>
            <h2 className="text-2xl font-black text-red-400 tracking-wide">
              ম্যাচে পরাজিত হয়েছেন
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              ভালো খেলেছেন! পরের ম্যাচে আবার চেষ্টা করে বিজয় ছিনিয়ে নিন।
            </p>
          </div>
        ) : (
          <div>
            <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl p-0.5 shadow-lg flex items-center justify-center mb-2">
              <div className="w-full h-full bg-[#0d1222] rounded-[14px] flex items-center justify-center text-3xl">
                🤝
              </div>
            </div>
            <h2 className="text-2xl font-black text-blue-400 tracking-wide">
              ম্যাচ ড্র হয়েছে!
            </h2>
            <p className="text-xs text-blue-300 font-semibold mt-0.5">
              দুজনের স্কোর সমান হওয়ায় এন্ট্রি ফি ৳{entryFee} ওয়ালেটে ফেরত দেওয়া হয়েছে।
            </p>
          </div>
        )}

        {/* Scoreboard Comparison Card */}
        <div className="bg-[#080d1e] p-3 rounded-2xl border border-indigo-900/60 space-y-2">
          {!isPractice && opponent ? (
            <div className="grid grid-cols-2 gap-2">
              {/* You */}
              <div className={`p-2.5 rounded-xl border text-center ${
                isWin ? 'bg-amber-500/10 border-amber-400/60' : 'bg-[#121935] border-indigo-950'
              }`}>
                <span className="text-[10px] text-slate-400 font-bold block">
                  {player.name} (You)
                </span>
                <span className="text-xl font-black text-amber-400 font-mono">
                  {player.score}
                </span>
                <span className="text-[9px] text-emerald-400 font-semibold block">
                  {player.linesCleared} Lines
                </span>
              </div>

              {/* Opponent */}
              <div className={`p-2.5 rounded-xl border text-center ${
                isLoss ? 'bg-purple-500/10 border-purple-400/60' : 'bg-[#121935] border-indigo-950'
              }`}>
                <span className="text-[10px] text-slate-400 font-bold block truncate">
                  {opponent.name}
                </span>
                <span className="text-xl font-black text-purple-400 font-mono">
                  {opponent.score}
                </span>
                <span className="text-[9px] text-slate-400 font-semibold block">
                  {opponent.linesCleared ?? 0} Lines
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#121935] p-2 rounded-xl border border-indigo-950 text-center">
                <span className="text-[9px] text-slate-400 block font-bold">SCORE</span>
                <span className="text-base font-black text-amber-400 font-mono">{player.score}</span>
              </div>
              <div className="bg-[#121935] p-2 rounded-xl border border-indigo-950 text-center">
                <span className="text-[9px] text-slate-400 block font-bold">LINES</span>
                <span className="text-base font-black text-emerald-400 font-mono">{player.linesCleared}</span>
              </div>
              <div className="bg-[#121935] p-2 rounded-xl border border-indigo-950 text-center">
                <span className="text-[9px] text-slate-400 block font-bold">COMBO</span>
                <span className="text-base font-black text-cyan-400 font-mono">{player.bestCombo}x</span>
              </div>
            </div>
          )}

          {/* Entry & Prize Details */}
          {entryFee > 0 && (
            <div className="flex items-center justify-between text-xs px-1 text-slate-300 pt-1 border-t border-indigo-950">
              <span>এন্ট্রি ফি: ৳{entryFee}</span>
              <span className="text-amber-400 font-bold">উইন প্রাইজ: ৳{prize}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            id="result-play-again-btn"
            onClick={onPlayAgain}
            className="w-full py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <RotateCcw className="w-4 h-4" />
            <span>আবার খেলুন (PLAY AGAIN)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            {onViewPendingMatches ? (
              <button
                id="result-pending-btn"
                onClick={onViewPendingMatches}
                className="py-2.5 bg-[#141c3c] hover:bg-[#1a2550] border border-indigo-800 text-amber-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>পেন্ডিং ম্যাচ</span>
              </button>
            ) : (
              <button
                id="result-history-btn"
                onClick={onViewHistory}
                className="py-2.5 bg-[#141c3c] hover:bg-[#1a2550] border border-indigo-800 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <History className="w-3.5 h-3.5 text-cyan-400" />
                <span>ম্যাচ হিস্ট্রি</span>
              </button>
            )}

            <button
              id="result-home-btn"
              onClick={onGoHome}
              className="py-2.5 bg-[#141c3c] hover:bg-[#1a2550] border border-indigo-800 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Home className="w-3.5 h-3.5 text-amber-400" />
              <span>লবি (HOME)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
