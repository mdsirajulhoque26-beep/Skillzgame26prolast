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
    <div className="block-tray-reference select-none">
      {pieces.map((piece, idx) => {
        if (!piece) {
          return <div key={`empty-slot-${idx}`} className="block-tray-reference-slot" aria-hidden="true" />;
        }

        const isSelected = selectedPieceIndex === idx;
        const canFit = canPlaceMap[idx] ?? true;

        return (
          <div
            key={piece.id || `slot-${idx}`}
            className={`block-tray-reference-slot ${isSelected ? 'scale-105' : ''} ${canFit ? '' : 'opacity-35 grayscale'}`}
          >
            <div
              id={`piece-slot-btn-${idx}`}
              onPointerDown={(e) => onPiecePointerDown && onPiecePointerDown(idx, e)}
              onPointerMove={onPiecePointerMove}
              onPointerUp={onPiecePointerUp}
              onPointerCancel={onPiecePointerCancel}
              className="flex items-center justify-center touch-none cursor-grab active:cursor-grabbing select-none active:scale-[0.98] transition-transform duration-100"
              aria-label={`Block ${idx + 1}`}
            >
              <div className="flex flex-col items-center justify-center gap-0 pointer-events-none">
                {piece.matrix.map((row, r) => (
                  <div key={r} className="flex items-center gap-0">
                    {row.map((cell, c) => (
                      <div
                        key={c}
                        className={`block-3d-tray-cell w-[42px] h-[42px] sm:w-[44px] sm:h-[44px] ${cell !== 0 ? '' : 'opacity-0'}`}
                        style={{
                          backgroundColor: cell !== 0 ? piece.color : 'transparent',
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
