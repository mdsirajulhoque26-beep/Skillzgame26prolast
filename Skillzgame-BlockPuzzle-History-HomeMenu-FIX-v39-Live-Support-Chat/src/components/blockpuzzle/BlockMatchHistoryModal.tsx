import React from 'react';
import { X, History, Trophy, Medal } from 'lucide-react';

export interface BlockHistoryRecord {
  id: string;
  mode: string;
  opponentName?: string;
  userScore: number;
  opponentScore?: number;
  result: 'WIN' | 'LOSS' | 'DRAW' | 'PENDING' | 'REFUNDED' | 'TOURNAMENT';
  lines: number;
  date: string;
  // Optional fields are supported when the caller has them, without changing
  // any existing match/history data flow.
  entryFee?: number;
  prize?: number;
  opponentAvatar?: string;
}

interface BlockMatchHistoryModalProps {
  matches: BlockHistoryRecord[];
  onClose: () => void;
}

const avatarFallback = (name?: string) =>
  String(name || 'P').trim().slice(0, 1).toUpperCase() || 'P';

export const BlockMatchHistoryModal: React.FC<BlockMatchHistoryModalProps> = ({ matches, onClose }) => {
  // History is the completed-results screen. Pending matches remain available
  // from the separate Pending Matches screen.
  const completedMatches = [...matches]
    .filter((m) => m.result !== 'PENDING')
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  return (
    <div className="fixed inset-0 z-[70] bg-[#07101f] animate-fade-in select-none">
      <div className="min-h-full w-full max-w-md mx-auto flex flex-col bg-[#07101f] text-white">
        {/* Header — matches the compact mobile History style */}
        <div className="sticky top-0 z-10 bg-[#08152c] border-b border-blue-950/80 px-3 py-3 flex items-center justify-between shadow-xl">
          <button
            onClick={onClose}
            aria-label="Close history"
            className="w-9 h-9 rounded-lg bg-slate-300/80 text-slate-700 flex items-center justify-center shadow"
          >
            <X className="w-6 h-6" strokeWidth={3} />
          </button>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-300" />
            <h2 className="text-[22px] leading-none font-black tracking-tight">COMPLETED MATCHES</h2>
          </div>
          <div className="w-9" />
        </div>

        <div className="flex-1 overflow-y-auto pb-6">
          {completedMatches.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <Trophy className="w-12 h-12 mx-auto text-slate-600" />
              <div className="mt-3 text-base font-black text-slate-300">NO COMPLETED MATCHES</div>
              <div className="mt-1 text-xs text-slate-500">আপনার সম্পূর্ণ ম্যাচগুলো এখানে দেখা যাবে।</div>
            </div>
          ) : (
            <div className="space-y-1.5 p-1.5">
              {completedMatches.map((m) => {
                const won = m.result === 'WIN';
                const lost = m.result === 'LOSS';
                const draw = m.result === 'DRAW';
                const title = won ? 'YOU WON' : lost ? 'YOU LOST' : draw ? 'DRAW' : 'TOURNAMENT';
                const avatar = m.opponentAvatar;
                const prize = Number(m.prize || 0);
                const entryFee = Number(m.entryFee || 0);

                return (
                  <div
                    key={m.id}
                    className="overflow-hidden rounded-[4px] bg-[#dce7f7] text-slate-900 border border-slate-700/70 shadow-md"
                  >
                    <div className="min-h-[122px] px-3 py-2 flex items-center gap-3">
                      {/* Opponent avatar */}
                      <div className="w-[76px] h-[76px] shrink-0 rounded-[2px] overflow-hidden bg-slate-400 border border-slate-500 flex items-center justify-center text-3xl font-black text-white">
                        {avatar ? (
                          <img src={avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{avatarFallback(m.opponentName)}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 self-center">
                        <div className={`text-[31px] leading-[0.95] font-black tracking-tight ${
                          won ? 'text-slate-950' : lost ? 'text-slate-950' : 'text-slate-800'
                        }`}>
                          {title}
                        </div>
                        <div className="mt-2 text-[18px] leading-none truncate text-slate-700">
                          <span className="font-black text-slate-500">VS</span>{' '}
                          {m.opponentName || 'Opponent'}
                        </div>
                        {m.mode && (
                          <div className="mt-1 text-[9px] font-bold text-slate-500 truncate">{m.mode}</div>
                        )}
                      </div>

                      {/* Prize / result indicator */}
                      <div className="shrink-0 self-center text-right min-w-[46px]">
                        {won && prize > 0 ? (
                          <>
                            <div className="text-[27px] leading-none font-black text-sky-700">৳{prize}</div>
                            <div className="mt-1 text-[8px] font-black text-slate-500">PRIZE</div>
                          </>
                        ) : draw ? (
                          <div className="text-[12px] font-black text-blue-700">DRAW</div>
                        ) : m.result === 'TOURNAMENT' ? (
                          <Medal className="ml-auto w-8 h-8 text-purple-700" />
                        ) : null}
                      </div>
                    </div>

                    <div className="border-t border-slate-400/80 px-2.5 py-2 flex items-center justify-between text-[15px] leading-none text-slate-700 bg-[#edf3fb]">
                      <span>Time: {m.date || '—'}</span>
                      <span className="text-right">
                        {entryFee > 0 ? `Entry Fee: ৳${entryFee}` : `Score: ${Number(m.userScore || 0)} pts`}
                      </span>
                    </div>
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
