import React, { useEffect } from 'react';
import { Clock, Trophy, CheckCircle, XCircle, ArrowRight, ShieldCheck, X } from 'lucide-react';

export interface PendingMatchItem {
  id: string;
  userId: string;
  userName: string;
  entryFee: number;
  prize: number;
  score: number;
  linesCleared: number;
  bestCombo: number;
  date: string;
  status: 'PENDING' | 'WON' | 'LOST' | 'DRAW' | 'TOURNAMENT';
  mode?: string;
  opponentName?: string;
  opponentScore?: number;
}

interface BlockPendingMatchesModalProps {
  pendingMatches: PendingMatchItem[];
  onClose: () => void;
  onRefresh: () => void;
}

export const BlockPendingMatchesModal: React.FC<BlockPendingMatchesModalProps> = ({
  pendingMatches,
  onClose,
  onRefresh,
}) => {
  // Always re-read the server when this modal opens. This prevents an older
  // empty local list from hiding a paid match that is already PENDING/PLAYING.
  useEffect(() => {
    void onRefresh();
  }, [onRefresh]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-[#0e162f] border-2 border-indigo-500/60 rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 text-left relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-indigo-950 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">
                পেন্ডিং ও ম্যাচ হিস্ট্রি
              </h3>
              <p className="text-[11px] text-slate-400">
                আপনার সব গেম, Pro Match ও Tournament-এর pending অংশ
              </p>
            </div>
          </div>

          <button
            id="pending-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-indigo-900/40 border border-indigo-700/60 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Note */}
        <div className="bg-[#080d1e] p-2.5 rounded-xl border border-indigo-900/60 text-[11px] text-slate-300 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            আপনি স্কোর সাবমিট করার পর আপনার স্কোর আগে এডমিন প্যানেলে যাচাই হবে। অনুমোদনের পর প্রাইজ উইনিং ব্যালেন্সে যোগ হবে।
          </span>
        </div>

        {/* Matches List */}
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {pendingMatches.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              এখনও কোনো পেন্ডিং বা সাবমিটকৃত ম্যাচ নেই।
            </div>
          ) : (
            pendingMatches.map((m) => (
              <div
                key={m.id}
                className="bg-[#121935] p-3 rounded-xl border border-indigo-900/80 space-y-2 hover:border-indigo-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">
                      এন্ট্রি ফি: ৳{m.entryFee}
                    </span>
                    <span className="text-[10px] text-amber-300 font-semibold bg-amber-500/10 px-1.5 py-0.2 rounded">
                      প্রাইজ ৳{m.prize}
                    </span>
                  </div>

                  {m.status === 'PENDING' && (
                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[9.5px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                      <Clock className="w-3 h-3" /> পেন্ডিং
                    </span>
                  )}
                  {m.status === 'WON' && (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9.5px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> বিজয়ী (+৳{m.prize})
                    </span>
                  )}
                  {m.status === 'LOST' && (
                    <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[9.5px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> পরাজিত
                    </span>
                  )}
                  {m.status === 'TOURNAMENT' && (
                    <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9.5px] font-black px-2 py-0.5 rounded-full">🏆 Tournament Submit</span>
                  )}
                  {m.status === 'DRAW' && (
                    <span className="bg-blue-500/20 text-blue-400 border border-blue-500/40 text-[9.5px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                      ড্র (রিফান্ড ৳{m.entryFee})
                    </span>
                  )}
                </div>

                {m.mode && <div className="text-[10px] text-cyan-300 font-bold">{m.mode}</div>}
                <div className="text-[10px] text-slate-400">এই তালিকায় শুধু আপনার নিজের pending/active গেম ও Tournament দেখানো হচ্ছে।</div>
                <div className="flex items-center justify-between text-xs text-slate-300 bg-[#090e22] p-2 rounded-lg">
                  <div>
                    <span className="text-[10px] text-slate-400 block">আপনার স্কোর</span>
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {m.score} pts
                    </span>
                  </div>

                  {m.status === 'TOURNAMENT' ? (
                    <div className="text-right text-[10px] text-purple-300 font-bold">Rank List-এ Score জমা আছে</div>
                  ) : m.opponentName ? (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">
                        প্রতিপক্ষ: {m.opponentName}
                      </span>
                      <span className="font-mono font-black text-purple-300 text-sm">
                        {m.opponentScore ?? 0} pts
                      </span>
                    </div>
                  ) : (
                    <div className="text-right text-[10px] text-amber-400/90 font-medium">
                      প্রতিপক্ষের খেলার অপেক্ষায়...
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <span>{m.date}</span>
                  <span>Lines: {m.linesCleared} • Combo: {m.bestCombo}x</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2">
          <button
            id="pending-modal-done-btn"
            onClick={onClose}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow active:scale-95 transition-all text-center"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
