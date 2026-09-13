import React from 'react';
import { BlockShape } from '../../types';

interface BlockTrayViewProps {
  pieces: (BlockShape | null)[];
  selectedPieceIndex: number | null;
  canPlaceMap: boolean[];
  onPiecePointerDown?: (index: number, e: React.PointerEvent<HTMLDivElement>) => void;
  onPiecePointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPiecePointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPiecePointerCancel?: (e: React.PointerEvent<HTMLDivElement>) => void;
}

export const BlockTrayView: React.FC<BlockTrayViewProps> = ({
  pieces,
  selectedPieceIndex,
  canPlaceMap,
  onPiecePointerDown,
  onPiecePointerMove,
  onPiecePointerUp,
  onPiecePointerCancel,
}) => {
  return (
    <div className="w-full max-w-[390px] mx-auto select-none">
      {/* 3 Slots Container */}
      <div className="bg-[#090e23] p-2.5 rounded-2xl border-2 border-[#1c2754] shadow-xl">
        <div className="grid grid-cols-3 gap-2 min-h-[112px] items-center">
          {pieces.map((piece, idx) => {
            if (!piece) {
              return (
                <div
                  key={`empty-slot-${idx}`}
                  className="h-28 rounded-xl border border-dashed border-[#1a254d]/60 bg-[#050816]/40 flex items-center justify-center text-[10px] text-slate-600 font-medium select-none"
                >
                  Used
                </div>
              );
            }

            const isSelected = selectedPieceIndex === idx;
            const canFit = canPlaceMap[idx] ?? true;

            return (
              <div
                key={piece.id || `slot-${idx}`}
                id={`piece-slot-btn-${idx}`}
                onPointerDown={(e) => onPiecePointerDown && onPiecePointerDown(idx, e)}
                onPointerMove={onPiecePointerMove}
                onPointerUp={onPiecePointerUp}
                onPointerCancel={onPiecePointerCancel}
                className={`h-28 rounded-xl border p-2 flex flex-col items-center justify-center transition-all duration-150 relative overflow-hidden active:scale-[0.98] touch-none cursor-grab active:cursor-grabbing select-none ${
                  isSelected
                    ? 'bg-gradient-to-b from-indigo-900/90 to-purple-950/90 border-cyan-400 ring-2 ring-cyan-400/60 shadow-lg shadow-cyan-500/20 scale-105'
                    : canFit
                    ? 'bg-[#0f1738] border-[#1d2b5c] hover:border-cyan-500/80 hover:bg-[#15204d]'
                    : 'bg-[#0a0f26] border-[#162045] opacity-35 grayscale'
                }`}
              >
                {/* Cannot fit tag */}
                {!canFit && (
                  <span className="absolute bottom-1 bg-red-500/90 text-white font-bold text-[7px] px-1 py-0.2 rounded uppercase tracking-tighter">
                    NO FIT
                  </span>
                )}

                {/* Render Shape Matrix */}
                <div className="flex flex-col items-center justify-center gap-0.5 pointer-events-none">
                  {piece.matrix.map((row, r) => (
                    <div key={r} className="flex items-center gap-0.5">
                      {row.map((cell, c) => (
                        <div
                          key={c}
                          className={`w-[30px] h-[30px] rounded-[6px] ${
                            cell !== 0
                              ? 'border-t border-l border-white/40 border-b border-r border-black/40 shadow-sm'
                              : 'opacity-0'
                          }`}
                          style={{
                            backgroundColor: cell !== 0 ? piece.color : 'transparent',
                            borderColor: cell !== 0 ? piece.accentColor : 'transparent',
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
