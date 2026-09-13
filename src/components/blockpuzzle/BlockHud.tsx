import React from 'react';
import { 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  Pause,
  HelpCircle,
  Trophy,
  Clock,
  Sparkles,
  Zap,
  Flame
} from 'lucide-react';
import { BlockGameMode, BlockPlayerState, PracticeDifficulty } from '../../types';

interface BlockHudProps {
  mode: BlockGameMode;
  difficulty?: PracticeDifficulty;
  entryFee: number;
  prize: number;
  player: BlockPlayerState;
  remainingTime: number; // in seconds (e.g. 180s = 3:00)
  totalTime: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onOpenRules: () => void;
}

export const BlockHud: React.FC<BlockHudProps> = ({
  mode,
  difficulty,
  entryFee,
  prize,
  player,
  remainingTime,
  totalTime,
  isMuted,
  onToggleMute,
  onPause,
  onOpenRules,
}) => {
  // Format MM:SS (e.g. 3:00, 2:59)
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const isLowTime = remainingTime <= 20 && remainingTime > 0;

  return (
    <div className="w-full max-w-[390px] mx-auto select-none space-y-2">
      {/* Top Main Arcade Bar (Matching Skillz Block Blitz Video) */}
      <div className="flex items-center justify-between px-1">
        {/* Left: Timer Pill with Clock Icon */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
          isLowTime 
            ? 'bg-red-500/20 border-red-500/80 text-red-400 animate-pulse' 
            : 'bg-[#101735]/90 border-indigo-500/40 text-slate-100 shadow-md'
        }`}>
          <Clock className={`w-4 h-4 ${isLowTime ? 'text-red-400' : 'text-cyan-400'}`} />
          <span className="font-mono font-black text-sm tracking-wider">
            {formattedTime}
          </span>
        </div>

        {/* Center: Score Pill with Trophy Icon */}
        <div className="flex items-center gap-2 bg-[#101735] px-4 py-1.5 rounded-full border border-amber-400/60 shadow-lg shadow-amber-500/10">
          <Trophy className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="font-mono font-black text-base text-white tracking-wide">
            {player.score.toLocaleString()}
          </span>
        </div>

        {/* Right: Rules / Help '?' Button */}
        <button
          id="block-hud-help-btn"
          type="button"
          onClick={onOpenRules}
          className="w-8 h-8 rounded-full bg-[#101735] hover:bg-[#1a2552] border border-indigo-500/40 flex items-center justify-center text-slate-300 hover:text-white shadow-md active:scale-95 transition-transform"
          title="Game Rules"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Mode / Prize Sub-Banner */}
      <div className="flex items-center justify-between px-2 text-[10.5px]">
        <div className="flex items-center gap-1.5 text-slate-300 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>
            {mode === 'duel' ? `DUEL MATCH (এন্ট্রি ৳${entryFee})` : `PRACTICE (${difficulty?.toUpperCase() || 'NORMAL'})`}
          </span>
        </div>
        {mode === 'duel' && (
          <span className="text-amber-400 font-black tracking-wide">
            WIN PRIZE ৳{prize}
          </span>
        )}
      </div>
    </div>
  );
};
