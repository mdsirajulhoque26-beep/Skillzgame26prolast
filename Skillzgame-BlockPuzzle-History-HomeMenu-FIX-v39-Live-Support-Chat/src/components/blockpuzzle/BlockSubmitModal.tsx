import React from 'react';
import { Trophy, CheckCircle, Zap, Send, Clock, Sparkles } from 'lucide-react';
import { BlockPlayerState } from '../../types';

interface BlockSubmitModalProps {
  player: BlockPlayerState;
  entryFee: number;
  prize: number;
  bestScore: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  isTournament?: boolean;
}

export const BlockSubmitModal: React.FC<BlockSubmitModalProps> = ({
  player,
  entryFee,
  prize,
  bestScore,
  isSubmitting,
  onSubmit,
  isTournament = false,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-[#0b1028] border-2 border-[#1f2d63] rounded-3xl p-4 sm:p-6 max-w-sm w-full max-h-[calc(100vh-96px)] overflow-y-auto shadow-2xl space-y-4 text-center relative">
        {/* Glow ambient background */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* 3D Game Over Arcade Header (From Video 01:35) */}
        <div className="space-y-2">
          <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-600 rounded-3xl p-0.5 shadow-2xl shadow-amber-500/30 flex items-center justify-center animate-pulse">
            <div className="w-full h-full bg-[#080c1f] rounded-[22px] flex items-center justify-center relative overflow-hidden">
              <div className="grid grid-cols-2 gap-1 p-2">
                <div className="w-4 h-4 rounded-[3px] bg-rose-500 border border-rose-300" />
                <div className="w-4 h-4 rounded-[3px] bg-amber-400 border border-yellow-200" />
                <div className="w-4 h-4 rounded-[3px] bg-emerald-400 border border-emerald-200" />
                <div className="w-4 h-4 rounded-[3px] bg-cyan-400 border border-cyan-200" />
              </div>
              <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300 absolute -bottom-1 -right-1 drop-shadow" />
            </div>
          </div>

          <h2 className="text-3xl font-black text-white tracking-widest uppercase font-mono drop-shadow-md">
            {isTournament ? 'TOURNAMENT ATTEMPT OVER' : 'GAME OVER'}
          </h2>
        </div>

        {/* Score & Best Score Display (Matching Video) */}
        <div className="space-y-2.5">
          {/* Main Score Box */}
          <div className="bg-[#060918] p-4 rounded-2xl border border-[#1b2656] shadow-inner">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest block">
              SCORE
            </span>
            <span className="text-4xl font-black text-amber-400 font-mono tracking-tight block mt-1">
              {player.score.toLocaleString()}
            </span>
          </div>

          {/* Best Score & Lines Details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#0f1738] p-2.5 rounded-xl border border-[#1d2b5c]">
              <span className="text-[9.5px] text-slate-400 block font-bold">BEST SCORE</span>
              <span className="font-mono font-black text-white text-base">
                {Math.max(bestScore, player.score).toLocaleString()}
              </span>
            </div>

            <div className="bg-[#0f1738] p-2.5 rounded-xl border border-[#1d2b5c]">
              <span className="text-[9.5px] text-slate-400 block font-bold">LINES CLEARED</span>
              <span className="font-mono font-black text-emerald-400 text-base">
                {player.linesCleared}
              </span>
            </div>
          </div>

          {entryFee > 0 && (
            <div className="flex items-center justify-between bg-[#11193d] px-3.5 py-2 rounded-xl border border-[#213069] text-xs font-bold">
              <span className="text-slate-300">এন্ট্রি ফি: ৳{entryFee}</span>
              {!isTournament && <span className="text-amber-400 flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> উইন প্রাইজ: ৳{prize}</span>}
              {isTournament && <span className="text-purple-300">Tournament Rank অনুযায়ী Prize</span>}
            </div>
          )}
        </div>

        {/* Large Glowing Green SUBMIT SCORE Button (From Video 01:35) */}
        <div className="pt-1 sticky bottom-0 bg-[#0b1028]/95 backdrop-blur-sm">
          <button
            id="block-score-submit-btn"
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-black text-base uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-600/40 flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5 animate-spin" />
                <span>SUBMITTING SCORE...</span>
              </span>
            ) : (
              <>
                <Send className="w-5 h-5 fill-current" />
                <span>SUBMIT SCORE</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
