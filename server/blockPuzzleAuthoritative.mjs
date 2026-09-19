const MOD = 2147483647;
const MULT = 16807;

export const BOARD_SIZE = 10;

export class SeededPRNG {
  constructor(seed) {
    this.seed = Number(seed) % MOD;
    if (this.seed <= 0) this.seed += MOD - 1;
  }

  next() {
    this.seed = (this.seed * MULT) % MOD;
    return (this.seed - 1) / (MOD - 1);
  }

  nextInt(min, max) {
    return Math.floor(min + this.next() * (max - min + 1));
  }
}

const CATALOG = [
  [[1]],
  [[1,1]],
  [[1],[1]],
  [[1,1,1]],
  [[1],[1],[1]],
  [[1,1,1,1]],
  [[1],[1],[1],[1]],
  [[1,1,1,1,1]],
  [[1],[1],[1],[1],[1]],
  [[1,1],[1,1]],
  [[1,1,1],[1,1,1],[1,1,1]],
  [[1,1],[1,0]],
  [[1,1],[0,1]],
  [[1,0],[1,1]],
  [[0,1],[1,1]],
  [[1,1,1],[1,0,0],[1,0,0]],
  [[1,1,1],[0,0,1],[0,0,1]],
  [[1,0,0],[1,0,0],[1,1,1]],
  [[0,0,1],[0,0,1],[1,1,1]],
  [[1,1,1],[0,1,0]],
  [[0,1,0],[1,1,1]],
  [[1,0],[1,1],[1,0]],
  [[0,1],[1,1],[0,1]],
  [[1,0],[1,0],[1,1]],
  [[0,1],[0,1],[1,1]],
  [[1,1],[1,0],[1,0]],
  [[1,1],[0,1],[0,1]],
  [[1,1,0],[0,1,1]],
  [[0,1,1],[1,1,0]],
  [[1,0],[1,1],[0,1]],
  [[0,1],[1,1],[1,0]],
];

function tileCount(matrix) {
  return matrix.reduce(
    (n, row) => n + row.reduce((a, v) => a + (Number(v) > 0 ? 1 : 0), 0),
    0
  );
}

function normalizeDifficulty(value) {
  const v = String(value || 'normal').toLowerCase();
  return ['easy', 'normal', 'hard', 'expert'].includes(v) ? v : 'normal';
}

function catalogForDifficulty(difficulty) {
  const d = normalizeDifficulty(difficulty);

  if (d === 'easy') {
    return CATALOG.filter(m => tileCount(m) <= 4);
  }

  if (d === 'hard') {
    return CATALOG.filter(m => tileCount(m) >= 3);
  }

  if (d === 'expert') {
    return CATALOG.filter(m => tileCount(m) >= 4);
  }

  return CATALOG;
}

export function generateBlockTrio(seed, trioIndex, difficulty = 'normal') {
  const prng = new SeededPRNG(Number(seed) + Number(trioIndex) * 997);
  const catalog = catalogForDifficulty(difficulty);

  return [0, 1, 2].map(() => {
    const index = prng.nextInt(0, catalog.length - 1);
    return catalog[index].map(row => [...row]);
  });
}

export function matricesEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;

  for (let r = 0; r < a.length; r++) {
    if (!Array.isArray(a[r]) || !Array.isArray(b[r])) return false;
    if (a[r].length !== b[r].length) return false;

    for (let c = 0; c < a[r].length; c++) {
      if (Number(a[r][c]) !== Number(b[r][c])) return false;
    }
  }

  return true;
}

export function emptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(0)
  );
}

export function validMatrix(matrix) {
  if (!Array.isArray(matrix) || matrix.length < 1 || matrix.length > 5) {
    return false;
  }

  const width = Array.isArray(matrix[0]) ? matrix[0].length : 0;

  if (width < 1 || width > 5) return false;

  let tiles = 0;

  for (const row of matrix) {
    if (!Array.isArray(row) || row.length !== width) return false;

    for (const value of row) {
      if (![0, 1].includes(Number(value))) return false;
      if (Number(value) === 1) tiles++;
    }
  }

  return tiles >= 1 && tiles <= 9;
}

export function canPlace(board, matrix, sr, sc) {
  if (!validMatrix(matrix)) return false;

  if (
    !Number.isInteger(sr) ||
    !Number.isInteger(sc) ||
    sr < 0 ||
    sc < 0 ||
    sr + matrix.length > BOARD_SIZE ||
    sc + matrix[0].length > BOARD_SIZE
  ) {
    return false;
  }

  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (
        Number(matrix[r][c]) > 0 &&
        Number(board[sr + r][sc + c]) !== 0
      ) {
        return false;
      }
    }
  }

  return true;
}

export function applyMove(board, matrix, sr, sc) {
  const next = board.map(row => [...row]);

  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (Number(matrix[r][c]) > 0) {
        next[sr + r][sc + c] = 1;
      }
    }
  }

  const fullRows = [];
  const fullCols = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    if (next[r].every(v => v !== 0)) fullRows.push(r);
  }

  for (let c = 0; c < BOARD_SIZE; c++) {
    let full = true;
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (next[r][c] === 0) {
        full = false;
        break;
      }
    }
    if (full) fullCols.push(c);
  }

  for (const r of fullRows) {
    for (let c = 0; c < BOARD_SIZE; c++) next[r][c] = 0;
  }

  for (const c of fullCols) {
    for (let r = 0; r < BOARD_SIZE; r++) next[r][c] = 0;
  }

  return {
    board: next,
    lines: fullRows.length + fullCols.length
  };
}

export function scoreMove(lines, tiles, combo, streak) {
  const tilePoints = Number(tiles) * 10;

  let linePoints = 0;

  if (lines === 1) linePoints = 100;
  else if (lines === 2) linePoints = 200;
  else if (lines >= 3) linePoints = lines * 100 + 100;

  const newCombo = lines > 0 ? Number(combo || 0) + 1 : 0;
  const newStreak = lines > 0 ? Number(streak || 0) + 1 : 0;

  const comboBonus =
    newCombo > 1 ? (newCombo - 1) * 50 : 0;

  const streakBonus =
    newStreak > 1 ? Math.min(newStreak * 50, 250) : 0;

  return {
    points: tilePoints + linePoints + comboBonus + streakBonus,
    combo: newCombo,
    streak: newStreak
  };
}

/*
 * The client may play the three pieces in ANY order.
 * Therefore the server keeps usedPieceIndexes for the current trio.
 */
export function validateExpectedPiece(state, matrix) {
  const trioIndex = Number(state.trioIndex || 0);
  const used = new Set(
    Array.isArray(state.usedPieceIndexes)
      ? state.usedPieceIndexes.map(Number)
      : []
  );

  const trio = generateBlockTrio(
    state.seed,
    trioIndex,
    state.difficulty
  );

  for (let i = 0; i < trio.length; i++) {
    if (used.has(i)) continue;

    if (matricesEqual(trio[i], matrix)) {
      return {
        ok: true,
        pieceIndex: i,
        trioIndex,
        nextUsedPieceIndexes: [...used, i].sort((a, b) => a - b)
      };
    }
  }

  return {
    ok: false,
    reason: 'UNEXPECTED_PIECE'
  };
}

export function advanceTrioIfNeeded(state, usedIndexes) {
  if (usedIndexes.length < 3) {
    return {
      trioIndex: Number(state.trioIndex || 0),
      usedPieceIndexes: usedIndexes
    };
  }

  return {
    trioIndex: Number(state.trioIndex || 0) + 1,
    usedPieceIndexes: []
  };
}
