import React, { useEffect, useState } from 'react';
import { 
  Swords, 
  Target, 
  Trophy, 
  Crown, 
  Zap, 
  Flame, 
  Sparkles, 
  Medal, 
  History, 
  User, 
  HelpCircle, 
  Code2, 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  Play,
  Wallet,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { PracticeDifficulty } from '../../types';

export interface EntryFeeOption {
  fee: number;
  prize: number;
  label: string;
}

const DEFAULT_PRO_MATCH_FEES = [20, 30, 60, 120, 250, 500];
const PRO_MATCH_PRIZES = [35, 50, 100, 200, 420, 850];
export const ENTRY_FEE_OPTIONS: EntryFeeOption[] = DEFAULT_PRO_MATCH_FEES.map((fee, i) => ({ fee, prize: PRO_MATCH_PRIZES[i], label: `৳${fee} (উইন ৳${PRO_MATCH_PRIZES[i]})` }));
export const getProMatchEntryFeeOptions = (fees?: number[]): EntryFeeOption[] => {
  const safeFees = Array.isArray(fees) && fees.length === 6 && fees.every(n => Number.isFinite(Number(n)) && Number(n) > 0) ? fees.map(Number) : DEFAULT_PRO_MATCH_FEES;
  return safeFees.map((fee, i) => ({ fee, prize: PRO_MATCH_PRIZES[i], label: `৳${fee} (উইন ৳${PRO_MATCH_PRIZES[i]})` }));
};

interface BlockLobbyViewProps {
  userRating: number;
  userBestScore: number;
  userWinStreak: number;
  matchesPlayed: number;
  userBalance: number;
  pendingMatchesCount: number;
  proMatchFees?: number[];
  multiplayerProConfig?: { players: number; entryFee: number; prizeAmount: number; name?: string } | null;
  isAdmin?: boolean;
  onStartDuel: (entryFee: number, prize: number) => void | Promise<void>;
  onStartPractice: (difficulty: PracticeDifficulty) => void;
  onOpenPendingMatches: () => void;
  onOpenLeaderboard: () => void;
  onOpenHistory: () => void;
  onOpenProfile: () => void;
  onOpenRules: () => void;
  onOpenAndroidCode: () => void;
  onBackToHome: () => void;
  onGoToWallet: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const BlockLobbyView: React.FC<BlockLobbyViewProps> = ({
  userRating,
  userBestScore,
  userWinStreak,
  matchesPlayed,
  userBalance,
  pendingMatchesCount,
  proMatchFees,
  multiplayerProConfig,
  isAdmin = false,
  onStartDuel,
  onStartPractice,
  onOpenPendingMatches,
  onOpenLeaderboard,
  onOpenHistory,
  onOpenProfile,
  onOpenRules,
  onOpenAndroidCode,
  onBackToHome,
  onGoToWallet,
  isMuted,
  onToggleMute,
}) => {
  const entryFeeOptions = multiplayerProConfig ? [{ fee: Number(multiplayerProConfig.entryFee), prize: Number(multiplayerProConfig.prizeAmount), label: `৳${Number(multiplayerProConfig.entryFee)} (উইন ৳${Number(multiplayerProConfig.prizeAmount)})` }] : getProMatchEntryFeeOptions(proMatchFees);
  const [selectedFee, setSelectedFee] = useState<EntryFeeOption>(entryFeeOptions[0]);
  useEffect(() => { setSelectedFee(prev => entryFeeOptions.find(opt => opt.fee === prev.fee) || entryFeeOptions[0]); }, [proMatchFees, multiplayerProConfig?.entryFee, multiplayerProConfig?.prizeAmount]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<PracticeDifficulty>('normal');
  const [startingMatch, setStartingMatch] = useState(false);

  return (
    <div className="pb-24 pt-2 px-3 max-w-md mx-auto space-y-3.5 select-none">
      {multiplayerProConfig && <div className="rounded-2xl border border-cyan-500/40 bg-cyan-500/10 p-3"><div className="text-[10px] font-black text-cyan-300">MULTIPLAYER PRO MATCH</div><div className="mt-1 text-base font-black text-white">{multiplayerProConfig.name || `${multiplayerProConfig.players} Players Pro Match`}</div><div className="mt-1 text-[10px] text-slate-400">{multiplayerProConfig.players} জন • Entry ৳{multiplayerProConfig.entryFee} • Winner ৳{multiplayerProConfig.prizeAmount}</div></div>}

      {/* Top App Bar */}
      <div className="flex items-center justify-between bg-[#0e162f] px-3.5 py-2.5 rounded-2xl border border-indigo-900/80 shadow-lg">
        <button
          id="block-lobby-back-btn"
          onClick={onBackToHome}
          className="flex items-center gap-1 text-slate-300 hover:text-white text-xs font-bold active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>হোমে ফিরুন</span>
        </button>

        <div className="flex items-center gap-1.5">
          {/* Android Code button ONLY for Admin / Owner (Hidden for regular users as requested) */}
          {isAdmin && (
            <button
              id="block-lobby-code-btn"
              onClick={onOpenAndroidCode}
              className="flex items-center gap-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 px-2 py-1 rounded-lg text-[10px] font-black active:scale-95 transition-all"
              title="Kotlin + Jetpack Compose Android Module"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Android</span>
            </button>
          )}

          <button
            id="block-lobby-mute-btn"
            onClick={onToggleMute}
            className="p-1.5 rounded-lg bg-indigo-900/40 border border-indigo-700/60 text-slate-300 hover:text-white active:scale-95"
            title="সাউন্ড"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          <button
            id="block-lobby-rules-btn"
            onClick={onOpenRules}
            className="p-1.5 rounded-lg bg-indigo-900/40 border border-indigo-700/60 text-slate-300 hover:text-white active:scale-95"
            title="গেমের নিয়ম"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-300" />
          </button>
        </div>
      </div>

      {/* Hero Title & Player Stats Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950 via-[#151c3d] to-purple-950 rounded-2xl border-2 border-indigo-500/40 p-4 shadow-xl">
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl">🧩</span>
              <h2 className="text-lg font-black text-white tracking-wide">
                BLOCK PUZZLE DUEL
              </h2>
            </div>
            <p className="text-[11px] text-amber-300/90 font-medium">
              ৮x৮ গ্রিড পাজল • স্কোর সাবমিট ও লাইভ ম্যাচিং
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="block-hero-profile-btn"
              onClick={onOpenProfile}
              className="p-2 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 text-slate-200 active:scale-95"
              title="প্রোফাইল"
            >
              <User className="w-4 h-4 text-amber-400" />
            </button>
            <button
              id="block-hero-history-btn"
              onClick={onOpenHistory}
              className="p-2 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 text-slate-200 active:scale-95"
              title="ম্যাচ হিস্ট্রি"
            >
              <History className="w-4 h-4 text-cyan-400" />
            </button>
            <button
              id="block-hero-leaderboard-btn"
              onClick={onOpenLeaderboard}
              className="p-2 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 text-slate-200 active:scale-95"
              title="লিডারবোর্ড"
            >
              <Medal className="w-4 h-4 text-yellow-400" />
            </button>
          </div>
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-4 gap-2 bg-[#090e21]/70 p-2.5 rounded-xl border border-indigo-900/60">
          <div className="text-center">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Wallet</span>
            <span className="text-xs font-black text-emerald-400 font-mono block mt-0.5">
              ৳{userBalance.toFixed(0)}
            </span>
            <span className="text-[8px] text-slate-400">Balance</span>
          </div>

          <div className="text-center">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Best Score</span>
            <span className="text-xs font-black text-amber-400 font-mono block mt-0.5">
              {userBestScore}
            </span>
            <span className="text-[8px] text-slate-400">Highscore</span>
          </div>

          <div className="text-center">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Win Streak</span>
            <div className="flex items-center justify-center gap-0.5 mt-0.5">
              <Flame className="w-3 h-3 text-red-400 fill-current" />
              <span className="text-xs font-black text-red-400 font-mono">
                {userWinStreak}
              </span>
            </div>
            <span className="text-[8px] text-slate-400">Current</span>
          </div>

          <div className="text-center">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Played</span>
            <span className="text-xs font-black text-cyan-300 font-mono block mt-0.5">
              {matchesPlayed}
            </span>
            <span className="text-[8px] text-slate-400">Matches</span>
          </div>
        </div>
      </div>

      {/* Pending Matches Alert Banner if any */}
      <button
        id="block-lobby-pending-btn"
        onClick={onOpenPendingMatches}
        className="w-full bg-gradient-to-r from-amber-950/80 via-[#182147] to-indigo-950/80 border border-amber-500/50 hover:border-amber-400 p-2.5 rounded-2xl flex items-center justify-between shadow-md active:scale-[0.99] transition-all"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">পেন্ডিং ও সাবমিটকৃত ম্যাচ</span>
              {pendingMatchesCount > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                  {pendingMatchesCount} Active
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block">
              রেজাল্ট চেক করতে ও প্রাইজ স্ট্যাটাস দেখতে এখানে ট্যাপ করুন
            </span>
          </div>
        </div>

        <div className="text-amber-400 text-xs font-bold px-2 py-1 bg-amber-500/10 rounded-lg">
          View
        </div>
      </button>

      {/* 1. ENTRY FEE TOURNAMENT DUEL (Solo Play -> Submit -> Auto Match Opponent) */}
      <div className="bg-gradient-to-r from-red-950/70 via-[#172045] to-indigo-950/80 border-2 border-amber-500/60 rounded-2xl p-4 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-400 to-red-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0d1222] rounded-[10px] flex items-center justify-center text-xl">
                ⚔️
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-extrabold text-white text-base">
                  এন্ট্রি ফি ম্যাচ (DUEL)
                </h4>
                <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase animate-pulse">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-amber-300 font-bold mt-0.5">
                এন্ট্রি ফি দিন • নিজে খেলুন • স্কোর সাবমিট করুন
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[9px] text-slate-400 block">গেমিং ব্যালেন্স</span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-black text-emerald-400 font-mono">
                ৳{userBalance.toFixed(2)}
              </span>
              <button
                id="block-quick-deposit-btn"
                onClick={onGoToWallet}
                className="p-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded border border-emerald-500/40 active:scale-95"
                title="রিচার্জ / ডিপোজিট করুন"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Step-by-Step Flow Explanation Badge */}
        <div className="bg-[#090e21]/80 p-2.5 rounded-xl border border-indigo-900/60 text-[10.5px] text-slate-300 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>খেলার নিয়ম ও ম্যাচিং পদ্ধতি:</span>
          </div>
          <p className="text-[10px] text-slate-300 leading-relaxed">
            ১. এন্ট্রি ফি সিলেক্ট করে ম্যাচ শুরু করুন।<br />
            ২. ৬০ সেকেন্ডে সর্বোচ্চ স্কোর করুন ও টাইম শেষে স্কোর সাবমিট করুন।<br />
            ৩. অপর প্রান্তের খেলোয়াড়ের সাথে স্কোর তুলনা করে সর্বোচ্চ স্কোরকারী বিজয়ী হবে।
          </p>
        </div>

        {/* Entry Fee Options Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 px-1">
            <span>{multiplayerProConfig ? `${multiplayerProConfig.players} Player Match` : 'এন্ট্রি ফি সিলেক্ট করুন:'}</span>
            <span className="text-amber-400 font-mono">
              উইন প্রাইজ: ৳{selectedFee.prize}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {entryFeeOptions.map((opt) => {
              const isSelected = selectedFee.fee === opt.fee;
              return (
                <button
                  key={opt.fee}
                  id={`entry-fee-btn-${opt.fee}`}
                  onClick={() => setSelectedFee(opt)}
                  className={`p-2.5 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500/20 to-yellow-600/20 border-amber-400 ring-2 ring-amber-400/50 shadow-lg scale-[1.02]'
                      : 'bg-[#121938] border-indigo-900 hover:border-indigo-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">
                      এন্ট্রি ৳{opt.fee}
                    </span>
                    <span className={`text-[10px] font-black ${isSelected ? 'text-amber-300' : 'text-slate-400'}`}>
                      উইন ৳{opt.prize}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    লাভ: ৳{(opt.prize - opt.fee).toFixed(0)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Start Match Button */}
        <button
          id="block-start-duel-btn"
          type="button"
          disabled={startingMatch}
          onClick={async () => {
            if (startingMatch) return;
            setStartingMatch(true);
            try { await onStartDuel(selectedFee.fee, selectedFee.prize); }
            finally { setStartingMatch(false); }
          }}
          className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-70 disabled:cursor-wait text-slate-950 font-black text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform touch-manipulation"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{startingMatch ? 'ম্যাচ শুরু হচ্ছে…' : (multiplayerProConfig ? `${multiplayerProConfig.players} জনের ম্যাচে Join করুন` : `ম্যাচ শুরু করুন (এন্ট্রি ৳${selectedFee.fee} ➔ উইন ৳${selectedFee.prize})`)}</span>
        </button>
      </div>

      {/* 2. PRACTICE MODE (Free Single Player) */}
      <div className="bg-gradient-to-r from-[#121a3a] to-[#0e162e] border border-indigo-500/40 rounded-2xl p-3.5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-sm">
                ONLINE PRACTICE
              </h4>
              <p className="text-[10.5px] text-slate-300">
                আনলিমিটেড ফ্রি প্র্যাকটিস • স্কিল ও কম্বো প্র্যাকটিস করুন
              </p>
            </div>
          </div>

          <span className="text-[9.5px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
            FREE
          </span>
        </div>

        {/* Difficulty Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10.5px] text-slate-300 font-semibold px-1">
            <span>ডিফিকাল্টি সিলেক্ট করুন:</span>
            <span className="text-amber-400 uppercase font-black">{selectedDifficulty}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {(['easy', 'normal', 'hard', 'expert'] as PracticeDifficulty[]).map((diff) => (
              <button
                key={diff}
                id={`practice-diff-${diff}`}
                onClick={() => setSelectedDifficulty(diff)}
                className={`py-1.5 rounded-lg text-[10px] font-extrabold uppercase border transition-all ${
                  selectedDifficulty === diff
                    ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-md scale-105'
                    : 'bg-[#141d3e] text-slate-300 border-indigo-950 hover:border-indigo-700'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        <button
          id="practice-start-btn"
          onClick={() => onStartPractice(selectedDifficulty)}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>প্র্যাকটিস শুরু করুন ({selectedDifficulty.toUpperCase()})</span>
        </button>
      </div>
    </div>
  );
};
