import React from 'react';
import { SLOTS_DATA, SlotItem, GameStatus } from './types';
import { soundManager } from './audio';
import { Crown, Gem, Zap, Clover, Flame, Rocket, Trash2, ArrowUpCircle } from 'lucide-react';

interface BettingGridProps {
  userBets: Record<number, number>;
  livePoolBySlot: Record<number, { amount: number; count: number }>;
  selectedChip: number;
  onSelectChip: (amount: number) => void;
  onPlaceBet: (slotId: number) => void;
  onClearBets: () => void;
  onDoubleBets: () => void;
  gameStatus: GameStatus;
  winningSlotId: number | null;
  userBalance: number;
  lang: 'bn' | 'en';
}

const CHIP_VALUES = [10, 50, 100, 500, 1000, 5000];

export const BettingGrid: React.FC<BettingGridProps> = ({
  userBets,
  livePoolBySlot,
  selectedChip,
  onSelectChip,
  onPlaceBet,
  onClearBets,
  onDoubleBets,
  gameStatus,
  winningSlotId,
  userBalance,
  lang,
}) => {
  const isBettingOpen = gameStatus === 'BETTING_OPEN';

  const renderSlotIcon = (name: string, isWinner: boolean) => {
    const size = 16;
    switch (name) {
      case 'crown':
        return <Crown size={size} className={isWinner ? 'text-amber-300 animate-bounce' : 'text-amber-400'} />;
      case 'diamond':
        return <Gem size={size} className={isWinner ? 'text-cyan-300 animate-bounce' : 'text-cyan-400'} />;
      case 'zap':
        return <Zap size={size} className={isWinner ? 'text-yellow-300 animate-bounce' : 'text-yellow-400'} />;
      case 'clover':
        return <Clover size={size} className={isWinner ? 'text-emerald-300 animate-bounce' : 'text-emerald-400'} />;
      case 'flame':
        return <Flame size={size} className={isWinner ? 'text-red-400 animate-bounce' : 'text-red-400'} />;
      case 'rocket':
        return <Rocket size={size} className={isWinner ? 'text-purple-300 animate-bounce' : 'text-purple-400'} />;
      default:
        return null;
    }
  };

  const handleSlotClick = (slotId: number) => {
    if (!isBettingOpen) return;
    if (userBalance < selectedChip) {
      alert(lang === 'bn' ? 'আপনার ব্যালেন্স কম! অনুগ্রহ করে রিচার্জ করুন।' : 'Insufficient balance! Please recharge.');
      return;
    }
    soundManager.playChipSound();
    onPlaceBet(slotId);
  };

  const totalUserBet = Object.values(userBets).reduce((acc, curr) => acc + curr, 0);

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
        {SLOTS_DATA.map((slot: SlotItem) => {
          const myBet = userBets[slot.id] || 0;
          const poolData = livePoolBySlot[slot.id] || { amount: 0, count: 0 };
          const isWinner = winningSlotId === slot.id && gameStatus === 'ROUND_RESULT';
          const potentialWin = Math.floor(myBet * slot.multiplier);

          return (
            <button
              key={slot.id}
              onClick={() => handleSlotClick(slot.id)}
              disabled={!isBettingOpen}
              className={`relative flex flex-col justify-between p-2 rounded-xl border text-left transition-all duration-150 select-none overflow-hidden h-[62px] sm:h-[68px] ${
                isWinner
                  ? 'border-amber-400 bg-gradient-to-br from-amber-500/30 to-slate-900 ring-2 ring-amber-400 scale-[1.02] shadow-[0_0_16px_rgba(245,158,11,0.6)]'
                  : myBet > 0
                  ? 'border-amber-400/90 bg-slate-900 shadow-[0_0_10px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
                  : 'border-slate-800 bg-slate-900/80 hover:bg-slate-850 hover:border-slate-700'
              } ${!isBettingOpen ? 'cursor-not-allowed opacity-90' : 'cursor-pointer active:scale-95'}`}
            >
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{ backgroundColor: slot.colorHex }}
              />

              <div className="relative z-10 flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs text-slate-950 shadow shrink-0"
                    style={{ backgroundColor: slot.colorHex }}
                  >
                    {slot.numberBn}
                  </span>
                  <div className="flex items-center gap-1 truncate">
                    {renderSlotIcon(slot.iconName, isWinner)}
                    <span className="font-bold text-xs text-white truncate leading-none">
                      {lang === 'bn' ? slot.nameBn : slot.nameEn}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-amber-400 tabular-nums shrink-0 ml-1">
                  5.5x
                </span>
              </div>

              <div className="relative z-10 w-full flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80 mt-auto">
                {myBet > 0 ? (
                  <div className="flex items-center justify-between w-full font-bold">
                    <span className="text-amber-300">
                      {lang === 'bn' ? 'বাজি: ' : 'Bet: '}
                      <span className="text-white font-mono">৳{myBet}</span>
                    </span>
                    <span className="text-emerald-400 font-mono text-[9px]">
                      +৳{potentialWin}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full text-slate-400">
                    <span className="font-mono tabular-nums text-slate-300">
                      ৳{poolData.amount >= 1000 ? `${(poolData.amount / 1000).toFixed(0)}k` : poolData.amount}
                    </span>
                    <span className="text-slate-500 text-[9px]">
                      {isBettingOpen ? (lang === 'bn' ? '+ বাজি' : '+ Bet') : (lang === 'bn' ? 'বন্ধ' : 'Closed')}
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5">
          <span className="text-[11px] font-semibold text-slate-400 hidden xs:inline shrink-0 mr-0.5">
            {lang === 'bn' ? 'চিপ:' : 'Chip:'}
          </span>
          {CHIP_VALUES.map((chipVal) => {
            const isSelected = selectedChip === chipVal;
            const chipThemes: Record<number, { border: string; bg: string; text: string }> = {
              10: { border: 'border-blue-400', bg: 'bg-blue-900/80', text: 'text-blue-200' },
              50: { border: 'border-emerald-400', bg: 'bg-emerald-900/80', text: 'text-emerald-200' },
              100: { border: 'border-amber-400', bg: 'bg-amber-900/80', text: 'text-amber-200' },
              500: { border: 'border-purple-400', bg: 'bg-purple-900/80', text: 'text-purple-200' },
              1000: { border: 'border-rose-400', bg: 'bg-rose-900/80', text: 'text-rose-200' },
              5000: { border: 'border-yellow-300', bg: 'bg-gradient-to-br from-yellow-700 to-amber-900', text: 'text-yellow-100' },
            };
            const theme = chipThemes[chipVal] || chipThemes[100];

            return (
              <button
                key={chipVal}
                onClick={() => {
                  soundManager.playChipSound();
                  onSelectChip(chipVal);
                }}
                className={`relative px-2 py-1 rounded-lg border text-xs font-bold font-mono transition-all flex items-center justify-center shrink-0 ${
                  theme.bg
                } ${theme.border} ${theme.text} ${
                  isSelected
                    ? 'ring-2 ring-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.4)]'
                    : 'opacity-80 hover:opacity-100'
                }`}
              >
                ৳{chipVal >= 1000 ? `${chipVal / 1000}k` : chipVal}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={onDoubleBets}
            disabled={!isBettingOpen || totalUserBet === 0 || userBalance < totalUserBet}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowUpCircle size={12} className="text-amber-400" />
            <span>2x</span>
          </button>

          <button
            onClick={onClearBets}
            disabled={!isBettingOpen || totalUserBet === 0}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={12} />
            <span>{lang === 'bn' ? 'মুছুন' : 'Clear'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};