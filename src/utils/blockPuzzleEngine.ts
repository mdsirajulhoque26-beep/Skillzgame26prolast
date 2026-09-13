// Deterministic Block Puzzle Engine for Skillz Base (Block Blitz / 10x10 Pro Duel)
// Handles 10x10 grid math, Seeded PRNG sequence generation, Scoring, and Special blocks

import { BlockShape, SpecialBlockType, PracticeDifficulty } from '../types';

export const BOARD_SIZE = 10;

// All authentic block puzzle shapes with high-contrast arcade color palette (Pink, Green, Yellow, Orange, Purple, Cyan, Red)
export const BLOCK_SHAPES_CATALOG: Omit<BlockShape, 'id'>[] = [
  // Dot (1x1)
  { name: 'Dot', matrix: [[1]], color: '#eab308', accentColor: '#ca8a04' }, // Yellow

  // 2-tile lines
  { name: 'Line 2H', matrix: [[1, 1]], color: '#22c55e', accentColor: '#16a34a' }, // Green
  { name: 'Line 2V', matrix: [[1], [1]], color: '#22c55e', accentColor: '#16a34a' },

  // 3-tile lines
  { name: 'Line 3H', matrix: [[1, 1, 1]], color: '#f43f5e', accentColor: '#e11d48' }, // Pink
  { name: 'Line 3V', matrix: [[1], [1], [1]], color: '#f43f5e', accentColor: '#e11d48' },

  // 4-tile lines
  { name: 'Line 4H', matrix: [[1, 1, 1, 1]], color: '#f97316', accentColor: '#ea580c' }, // Orange
  { name: 'Line 4V', matrix: [[1], [1], [1], [1]], color: '#f97316', accentColor: '#ea580c' },

  // 5-tile lines
  { name: 'Line 5H', matrix: [[1, 1, 1, 1, 1]], color: '#a855f7', accentColor: '#9333ea' }, // Purple
  { name: 'Line 5V', matrix: [[1], [1], [1], [1], [1]], color: '#a855f7', accentColor: '#9333ea' },

  // Squares
  { name: 'Square 2x2', matrix: [[1, 1], [1, 1]], color: '#f97316', accentColor: '#ea580c' }, // Orange
  { name: 'Square 3x3', matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: '#eab308', accentColor: '#ca8a04' }, // Yellow Big

  // Corners 2x2
  { name: 'Corner 2x2 TL', matrix: [[1, 1], [1, 0]], color: '#22c55e', accentColor: '#16a34a' }, // Green
  { name: 'Corner 2x2 TR', matrix: [[1, 1], [0, 1]], color: '#22c55e', accentColor: '#16a34a' },
  { name: 'Corner 2x2 BL', matrix: [[1, 0], [1, 1]], color: '#22c55e', accentColor: '#16a34a' },
  { name: 'Corner 2x2 BR', matrix: [[0, 1], [1, 1]], color: '#22c55e', accentColor: '#16a34a' },

  // Big Corners 3x3
  { name: 'Corner 3x3 TL', matrix: [[1, 1, 1], [1, 0, 0], [1, 0, 0]], color: '#06b6d4', accentColor: '#0891b2' }, // Cyan
  { name: 'Corner 3x3 TR', matrix: [[1, 1, 1], [0, 0, 1], [0, 0, 1]], color: '#06b6d4', accentColor: '#0891b2' },
  { name: 'Corner 3x3 BL', matrix: [[1, 0, 0], [1, 0, 0], [1, 1, 1]], color: '#06b6d4', accentColor: '#0891b2' },
  { name: 'Corner 3x3 BR', matrix: [[0, 0, 1], [0, 0, 1], [1, 1, 1]], color: '#06b6d4', accentColor: '#0891b2' },

  // T-Shapes
  { name: 'T-Shape Up', matrix: [[1, 1, 1], [0, 1, 0]], color: '#f43f5e', accentColor: '#e11d48' }, // Pink
  { name: 'T-Shape Down', matrix: [[0, 1, 0], [1, 1, 1]], color: '#f43f5e', accentColor: '#e11d48' },
  { name: 'T-Shape Left', matrix: [[1, 0], [1, 1], [1, 0]], color: '#f43f5e', accentColor: '#e11d48' },
  { name: 'T-Shape Right', matrix: [[0, 1], [1, 1], [0, 1]], color: '#f43f5e', accentColor: '#e11d48' },

  // L-Shapes 3x2
  { name: 'L-Shape 1', matrix: [[1, 0], [1, 0], [1, 1]], color: '#a855f7', accentColor: '#9333ea' }, // Purple
  { name: 'L-Shape 2', matrix: [[0, 1], [0, 1], [1, 1]], color: '#a855f7', accentColor: '#9333ea' },
  { name: 'L-Shape 3', matrix: [[1, 1], [1, 0], [1, 0]], color: '#a855f7', accentColor: '#9333ea' },
  { name: 'L-Shape 4', matrix: [[1, 1], [0, 1], [0, 1]], color: '#a855f7', accentColor: '#9333ea' },

  // Z-Shapes / S-Shapes
  { name: 'Z-Shape H', matrix: [[1, 1, 0], [0, 1, 1]], color: '#ec4899', accentColor: '#be185d' },
  { name: 'S-Shape H', matrix: [[0, 1, 1], [1, 1, 0]], color: '#ec4899', accentColor: '#be185d' },
  { name: 'Z-Shape V', matrix: [[1, 0], [1, 1], [0, 1]], color: '#ec4899', accentColor: '#be185d' },
  { name: 'S-Shape V', matrix: [[0, 1], [1, 1], [1, 0]], color: '#ec4899', accentColor: '#be185d' },
];

// Special Blocks definition
export const SPECIAL_BLOCKS: Record<SpecialBlockType, Omit<BlockShape, 'id'>> = {
  bomb: {
    name: 'Bomb 💣',
    matrix: [[2]],
    color: '#ef4444',
    accentColor: '#991b1b',
    isSpecial: true,
    specialType: 'bomb',
  },
  lightning: {
    name: 'Lightning ⚡',
    matrix: [[3]],
    color: '#eab308',
    accentColor: '#854d0e',
    isSpecial: true,
    specialType: 'lightning',
  },
  hammer: {
    name: 'Hammer 🔨',
    matrix: [[4]],
    color: '#06b6d4',
    accentColor: '#155e75',
    isSpecial: true,
    specialType: 'hammer',
  },
  shuffle: {
    name: 'Shuffle 🔄',
    matrix: [[5]],
    color: '#10b981',
    accentColor: '#065f46',
    isSpecial: true,
    specialType: 'shuffle',
  },
};

// Linear Congruential Generator for deterministic seeded pseudo-random numbers
export class SeededPRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  public next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(min + this.next() * (max - min + 1));
  }
}

// Generate an empty 10x10 board
export function createEmptyBoard(): number[][] {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
}

// Check if placing a block at row, col is legal
export function canPlaceBlock(
  board: number[][],
  matrix: number[][],
  startRow: number,
  startCol: number
): boolean {
  const rows = matrix.length;
  const cols = matrix[0].length;

  if (startRow < 0 || startCol < 0 || startRow + rows > BOARD_SIZE || startCol + cols > BOARD_SIZE) {
    return false;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (matrix[r][c] !== 0) {
        if (board[startRow + r]?.[startCol + c] !== 0) {
          return false; // Cell is already occupied
        }
      }
    }
  }
  return true;
}

// Place block onto board (returns new board state)
export function placeBlockOnBoard(
  board: number[][],
  matrix: number[][],
  startRow: number,
  startCol: number,
  colorVal: number = 1
): number[][] {
  const newBoard = board.map(row => [...row]);
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[0].length; c++) {
      if (matrix[r][c] !== 0) {
        if (newBoard[startRow + r] && startCol + c < BOARD_SIZE) {
          newBoard[startRow + r][startCol + c] = colorVal;
        }
      }
    }
  }
  return newBoard;
}

// Check for and clear full rows and columns simultaneously
export function checkAndClearLines(board: number[][]): {
  newBoard: number[][];
  clearedRows: number[];
  clearedCols: number[];
  totalLinesCleared: number;
} {
  const clearedRows: number[] = [];
  const clearedCols: number[] = [];

  // Check rows
  for (let r = 0; r < BOARD_SIZE; r++) {
    let full = true;
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 0) {
        full = false;
        break;
      }
    }
    if (full) clearedRows.push(r);
  }

  // Check columns
  for (let c = 0; c < BOARD_SIZE; c++) {
    let full = true;
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (board[r][c] === 0) {
        full = false;
        break;
      }
    }
    if (full) clearedCols.push(c);
  }

  const newBoard = board.map(row => [...row]);

  // Clear rows
  for (const r of clearedRows) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      newBoard[r][c] = 0;
    }
  }

  // Clear columns
  for (const c of clearedCols) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      newBoard[r][c] = 0;
    }
  }

  const totalLinesCleared = clearedRows.length + clearedCols.length;

  return {
    newBoard,
    clearedRows,
    clearedCols,
    totalLinesCleared,
  };
}

// Video-Accurate Score Calculation:
// - Tile points: 10 pts per placed tile (+10 for dot, +20 for 2-tile, +30 for 3-tile, +40 for 4-tile, +50 for 5-tile)
// - 1 Line = +100 pts
// - 2 Lines = +200 pts (triggers POWER BOLT)
// - 3 Lines = +300 pts (triggers FIRE STREAK)
// - 4+ Lines = +500 pts
// - Streak / Combo Bonus: +50, +100, +150, +200, +250 extra!
export function calculateMoveScore(
  linesCleared: number,
  pieceTileCount: number,
  currentCombo: number,
  streak: number
): { pointsEarned: number; newCombo: number; newStreak: number; bannerType: 'POWER_BOLT' | 'FIRE_STREAK' | null } {
  // Tile placement points (10 pts per tile like in the video +10, +20, +30, +40, +50)
  const tilePoints = pieceTileCount * 10;

  let linePoints = 0;
  let bannerType: 'POWER_BOLT' | 'FIRE_STREAK' | null = null;

  if (linesCleared === 1) {
    linePoints = 100;
  } else if (linesCleared === 2) {
    linePoints = 200;
    bannerType = 'POWER_BOLT';
  } else if (linesCleared >= 3) {
    linePoints = linesCleared * 100 + 100;
    bannerType = 'FIRE_STREAK';
  }

  let newCombo = 0;
  let newStreak = streak;

  if (linesCleared > 0) {
    newCombo = currentCombo + 1;
    newStreak = streak + 1;
    if (newCombo >= 2 && !bannerType) {
      bannerType = 'FIRE_STREAK';
    }
  } else {
    newCombo = 0; // Combo resets when no lines are cleared
  }

  const comboBonus = newCombo > 1 ? (newCombo - 1) * 50 : 0;
  const streakBonus = newStreak > 1 ? Math.min(newStreak * 50, 250) : 0;

  const pointsEarned = tilePoints + linePoints + comboBonus + streakBonus;

  return {
    pointsEarned,
    newCombo,
    newStreak,
    bannerType,
  };
}

// Check if any of the available pieces can be placed anywhere on the board
export function hasAnyLegalMove(board: number[][], availablePieces: (BlockShape | null)[]): boolean {
  for (const piece of availablePieces) {
    if (!piece) continue;
    // Special blocks are always placeable/usable
    if (piece.isSpecial) return true;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (canPlaceBlock(board, piece.matrix, r, c)) {
          return true;
        }
      }
    }
  }
  return false;
}

// Count total filled cells in matrix
export function getTileCount(matrix: number[][]): number {
  let count = 0;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[0].length; c++) {
      if (matrix[r][c] !== 0) count++;
    }
  }
  return count;
}

// Color lookup map for shape indices to match video palette
const PALETTE_COLORS = [
  { color: '#f43f5e', accentColor: '#e11d48' }, // Pink
  { color: '#22c55e', accentColor: '#16a34a' }, // Green
  { color: '#eab308', accentColor: '#ca8a04' }, // Yellow
  { color: '#f97316', accentColor: '#ea580c' }, // Orange
  { color: '#a855f7', accentColor: '#9333ea' }, // Purple
  { color: '#06b6d4', accentColor: '#0891b2' }, // Cyan
];

// Generate synchronized 3-block set using seed & turn index
export function generateBlockTrio(
  seed: number,
  trioIndex: number,
  difficulty: PracticeDifficulty = 'normal',
  includeSpecialChance: boolean = false
): BlockShape[] {
  const prng = new SeededPRNG(seed + trioIndex * 997);
  const shapes: BlockShape[] = [];

  let availableCatalog = [...BLOCK_SHAPES_CATALOG];
  if (difficulty === 'easy') {
    availableCatalog = availableCatalog.filter(s => getTileCount(s.matrix) <= 4);
  } else if (difficulty === 'hard') {
    availableCatalog = availableCatalog.filter(s => getTileCount(s.matrix) >= 3);
  } else if (difficulty === 'expert') {
    availableCatalog = availableCatalog.filter(s => getTileCount(s.matrix) >= 4);
  }

  for (let i = 0; i < 3; i++) {
    const isSpecialRoll = includeSpecialChance && prng.next() < 0.05;
    if (isSpecialRoll) {
      const specialTypes: SpecialBlockType[] = ['bomb', 'lightning', 'hammer', 'shuffle'];
      const chosenType = specialTypes[prng.nextInt(0, specialTypes.length - 1)];
      const spec = SPECIAL_BLOCKS[chosenType];
      shapes.push({
        id: `shape_${trioIndex}_${i}_${Date.now()}`,
        ...spec,
      });
    } else {
      const shapeIdx = prng.nextInt(0, availableCatalog.length - 1);
      const chosen = availableCatalog[shapeIdx];
      shapes.push({
        id: `shape_${trioIndex}_${i}_${chosen.name.replace(/\s+/g, '_')}`,
        matrix: chosen.matrix.map(row => [...row]),
        color: chosen.color,
        accentColor: chosen.accentColor,
        name: chosen.name,
      });
    }
  }

  return shapes;
}

// Hash board state for server anti-cheat validation
export function computeBoardHash(board: number[][], score: number, moveCount: number): string {
  let flat = '';
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      flat += board[r][c] > 0 ? '1' : '0';
    }
  }
  let hash = 0;
  const str = `${flat}_s${score}_m${moveCount}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}
