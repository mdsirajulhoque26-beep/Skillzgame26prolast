import React from 'react';
import { X, History } from 'lucide-react';

export interface BlockHistoryRecord {
  id: string;
  mode: string;
  opponentName?: string;
  userScore: number;
  opponentScore?: number;
  result: 'WIN' | 'LOSS' | 'DRAW' | 'PENDING' | 'REFUNDED' | 'TOURNAMENT';
  lines: number;
  date: string;
}

interface BlockMatchHistoryModalProps {
  matches: BlockHistoryRecord[];
  onClose: () => void;
}

export const BlockMatchHistoryModal: React.FC<BlockMatchHistoryModalProps> = ({ matches, onClose }) => {
  // Always keep pending matches visible at the top of History so an unfinished
  // paid match is never hidden behind completed results.
  const orderedMatches = [...matches].sort((a, b) => {
    const ap = a.result === 'PENDING' ? 0 : 1;
    const bp = b.result === 'PENDING' ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return String(b.date).localeCompare(String(a.date));
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-[#0e162f] border border-indigo-500/60 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-indigo-900/80 pb-2.5">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-black text-white text-base">MATCH HISTORY</h3>
              <p className="text-[10px] text-slate-400">প্রতিটি Block Puzzle ম্যাচের আলাদা ফলাফল</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#141b38] flex items-center justify-center text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {matches.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">এখনও কোনো Block Puzzle ম্যাচ নেই।</div>
          ) : orderedMatches.map((m) => {
            const resultLabel = m.result === 'WIN' ? 'WIN' : m.result === 'LOSS' ? 'LOSS' : m.result === 'DRAW' ? 'DRAW' : m.result === 'TOURNAMENT' ? 'TOURNAMENT' : m.result === 'REFUNDED' ? 'REFUNDED' : 'PENDING';
            const resultClass = m.result === 'WIN' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : m.result === 'LOSS' ? 'text-red-400 bg-red-500/10 border-red-500/30' : m.result === 'DRAW' ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' : m.result === 'TOURNAMENT' ? 'text-purple-300 bg-purple-500/10 border-purple-500/30' : m.result === 'REFUNDED' ? 'text-slate-300 bg-slate-500/10 border-slate-500/30' : 'text-amber-400 bg-amber-500/10 border-amber-500/30';
            return (
              <div key={m.id} className={`p-3 rounded-2xl bg-[#121935] space-y-2 ${m.result === 'PENDING' ? 'border-2 border-amber-500/50 shadow-lg shadow-amber-950/20' : 'border border-indigo-950/80'}`}>
                {m.result === 'PENDING' && (
                  <div className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 px-2.5 py-1.5 text-[10px] font-black text-amber-300">
                    <span className="animate-pulse">⏳</span> PENDING MATCH — রেজাল্ট এখনো চূড়ান্ত হয়নি
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-extrabold text-white">Match #{m.id.slice(-8)}</div>
                    <div className="text-[9px] text-slate-500">{m.date}</div><div className="text-[9px] text-cyan-300">{m.mode}</div>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full border ${resultClass}`}>{resultLabel}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#090e22] p-2">
                  <div>
                    <span className="text-[9px] text-slate-400 block">আপনার স্কোর</span>
                    <span className="font-mono font-black text-amber-400">{m.userScore}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 block">{m.opponentName ? `vs ${m.opponentName}` : 'প্রতিপক্ষ'}</span>
                    <span className="font-mono font-black text-purple-300">{m.opponentScore ?? '—'}</span>
                  </div>
                </div>
                <div className="text-[9px] text-slate-500">Lines: {m.lines}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
