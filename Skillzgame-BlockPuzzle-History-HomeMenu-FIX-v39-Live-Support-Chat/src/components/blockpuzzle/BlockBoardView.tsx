import React from 'react';
import { BlockShape } from '../../types';
import { BOARD_SIZE } from '../../utils/blockPuzzleEngine';

export interface FloatingScoreItem {
  id: string;
  text: string;
  x: number;
  y: number;
  color?: string;
  banner?: 'POWER_BOLT' | 'FIRE_STREAK' | null;
}

interface BlockBoardViewProps {
  board: number[][];
  previewPlacement: { matrix: number[][]; startRow: number; startCol: number; isValid: boolean } | null;
  clearingRows: number[];
  clearingCols: number[];
  selectedPiece: BlockShape | null;
  floatingScores: FloatingScoreItem[];
  bannerAlert: { text: string; subText?: string; type: 'info' | 'bolt' | 'fire' | 'warning' } | null;
  isOutOfMoves: boolean;
  onCellHover: (row: number, col: number) => void;
  onMouseLeave: () => void;
  gridRef?: React.RefObject<HTMLDivElement>;
}

// 3D Beveled Arcade Tile Colors
const TILE_STYLES: Record<number, { bg: string; border: string; glow: string; topGloss: string }> = {
  1: { 
    bg: 'from-[#06b6d4] to-[#0284c7]', 
    border: 'border-[#38bdf8]', 
    glow: 'rgba(6,182,212,0.5)',
    topGloss: 'bg-white/30'
  },
  2: { 
    bg: 'from-[#f43f5e] to-[#e11d48]', 
    border: 'border-[#fb7185]', 
    glow: 'rgba(244,63,94,0.6)',
    topGloss: 'bg-white/35'
  }, // Pink
  3: { 
    bg: 'from-[#22c55e] to-[#16a34a]', 
    border: 'border-[#4ade80]', 
    glow: 'rgba(34,197,94,0.5)',
    topGloss: 'bg-white/30'
  }, // Green
  4: { 
    bg: 'from-[#eab308] to-[#ca8a04]', 
    border: 'border-[#fde047]', 
    glow: 'rgba(234,179,8,0.6)',
    topGloss: 'bg-white/35'
  }, // Yellow
  5: { 
    bg: 'from-[#f97316] to-[#ea580c]', 
    border: 'border-[#fb923c]', 
    glow: 'rgba(249,115,22,0.6)',
    topGloss: 'bg-white/30'
  }, // Orange
  6: { 
    bg: 'from-[#a855f7] to-[#9333ea]', 
    border: 'border-[#c084fc]', 
    glow: 'rgba(168,85,247,0.6)',
    topGloss: 'bg-white/30'
  }, // Purple
};

export const BlockBoardView: React.FC<BlockBoardViewProps> = ({
  board,
  previewPlacement,
  clearingRows,
  clearingCols,
  selectedPiece,
  floatingScores,
  bannerAlert,
  isOutOfMoves,
  onCellHover,
  onMouseLeave,
  gridRef,
}) => {
  return (
    <div className="block-board-shell relative w-full max-w-none mx-auto select-none flex flex-col min-h-0">
      {/* Outer Gaming Frame with Midnight Navy and subtle Indigo outline */}
      <div className="block-board-frame relative w-full bg-[#090e23] p-2 rounded-2xl border-2 border-[#1c2754] shadow-2xl shadow-black/80 flex items-center justify-center min-h-0">
        
        {/* Banner Alert Center Pulse (e.g., "3 MINUTES LEFT", "POWER BOLT", "FIRE STREAK") */}
        {bannerAlert && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center justify-center pointer-events-none animate-bounce">
            <div className={`px-6 py-2 rounded-2xl border shadow-2xl backdrop-blur-md text-center transform scale-105 transition-all ${
              bannerAlert.type === 'bolt'
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-cyan-500/50'
                : bannerAlert.type === 'fire'
                ? 'bg-amber-950/90 border-amber-400 text-amber-300 shadow-orange-500/50'
                : bannerAlert.type === 'warning'
                ? 'bg-red-950/90 border-red-500 text-red-300 shadow-red-500/50'
                : 'bg-slate-900/90 border-indigo-400 text-white shadow-indigo-500/40'
            }`}>
              <span className="text-lg font-black tracking-widest uppercase font-mono block drop-shadow-md">
                {bannerAlert.text}
              </span>
              {bannerAlert.subText && (
                <span className="text-[11px] font-bold text-slate-200 block">
                  {bannerAlert.subText}
                </span>
              )}
            </div>
          </div>
        )}

        {/* 10x10 Grid Container */}
        <div
          ref={gridRef}
          id="block-puzzle-grid"
          className="block-puzzle-grid grid grid-cols-10 gap-1.5 aspect-square bg-[#050816] p-1.5 rounded-xl border border-[#141d40] touch-none relative overflow-hidden"
          onMouseLeave={onMouseLeave}
        >
          {/* Row Clearing Power Bolt / Lightning Glow Line Overlays */}
          {clearingRows.map((r) => (
            <div
              key={`clear-row-${r}`}
              className="absolute left-0 right-0 z-20 h-[10%] bg-gradient-to-r from-transparent via-cyan-300 to-transparent animate-pulse pointer-events-none opacity-90 shadow-lg shadow-cyan-400"
              style={{ top: `${r * 10}%` }}
            />
          ))}

          {/* Col Clearing Power Bolt / Lightning Glow Line Overlays */}
          {clearingCols.map((c) => (
            <div
              key={`clear-col-${c}`}
              className="absolute top-0 bottom-0 z-20 w-[10%] bg-gradient-to-b from-transparent via-cyan-300 to-transparent animate-pulse pointer-events-none opacity-90 shadow-lg shadow-cyan-400"
              style={{ left: `${c * 10}%` }}
            />
          ))}

          {board.map((row, r) =>
            row.map((cellVal, c) => {
              const isClearing = clearingRows.includes(r) || clearingCols.includes(c);

              // Check if cell is in active preview
              let isPreviewCell = false;
              let isPreviewValid = false;
              if (previewPlacement) {
                const { matrix, startRow, startCol, isValid } = previewPlacement;
                const pr = r - startRow;
                const pc = c - startCol;
                if (pr >= 0 && pr < matrix.length && pc >= 0 && pc < matrix[0].length) {
                  if (matrix[pr][pc] !== 0) {
                    isPreviewCell = true;
                    isPreviewValid = isValid;
                  }
                }
              }

              const hasBlock = cellVal > 0;
              const styleIdx = ((cellVal - 1) % 6) + 1;
              const tileStyle = TILE_STYLES[styleIdx] || TILE_STYLES[1];

              return (
                <div
                  key={`${r}-${c}`}
                  id={`board-cell-${r}-${c}`}
                  data-row={r}
                  data-col={c}
                  onMouseEnter={() => onCellHover(r, c)}
                  className={`relative rounded-[6px] flex items-center justify-center cursor-pointer overflow-hidden select-none ${
                    hasBlock
                      ? `bg-gradient-to-b ${tileStyle.bg} border-t border-l ${tileStyle.border} border-b-2 border-r-2 border-black/40 shadow-sm`
                      : 'bg-[#0e1533]/80 hover:bg-[#15204d] border border-[#162045]/60'
                  } ${
                    isClearing
                      ? 'scale-110 brightness-200 bg-white border-white animate-ping'
                      : ''
                  } ${
                    isPreviewCell
                      ? isPreviewValid
                        ? 'ring-2 ring-emerald-400 bg-emerald-500/60 border-emerald-300'
                        : 'ring-2 ring-red-500 bg-red-500/50 border-red-400'
                      : ''
                  } ${
                    isOutOfMoves && hasBlock
                      ? 'animate-pulse brightness-125 saturate-150'
                      : ''
                  }`}
                  style={{
                    boxShadow: hasBlock ? `0 1px 4px ${tileStyle.glow}` : undefined,
                  }}
                >
                  {/* Glossy 3D Highlight on Top Edge of block */}
                  {hasBlock && !isClearing && (
                    <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/25 rounded-t-[4px] pointer-events-none" />
                  )}

                  {/* Ghost preview dot */}
                  {!hasBlock && isPreviewCell && isPreviewValid && (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-ping pointer-events-none" />
                  )}

                  {/* Empty cell subtle center dot */}
                  {!hasBlock && !isPreviewCell && (
                    <div className="w-1 h-1 rounded-full bg-[#1c2956]/50 pointer-events-none" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Floating Scores Container */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
          {floatingScores.map((score) => (
            <div
              key={score.id}
              className="absolute font-black text-sm drop-shadow-lg animate-fade-out-up font-mono"
              style={{
                left: `${score.x}px`,
                top: `${score.y}px`,
                color: score.color || '#fde047',
              }}
            >
              {score.text}
            </div>
          ))}
        </div>
      </div>

      {/* Out of Moves Warning Banner (01:31 in video) */}
      {isOutOfMoves && (
        <div className="mt-2 text-center animate-bounce">
          <span className="text-xs font-black text-red-400 bg-red-500/20 px-3 py-1 rounded-full border border-red-500/40 tracking-wider uppercase font-mono shadow-lg">
            YOU ARE OUT OF MOVES
          </span>
        </div>
      )}
    </div>
  );
};
