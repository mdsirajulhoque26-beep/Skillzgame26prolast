import http from 'node:http';
import crypto from 'node:crypto';
import { WebSocketServer } from 'ws';
import app from './index.mjs';
import { loadDb, saveDb, withDbLock, now } from './store.mjs';

const PORT = Number(process.env.LIVE_PORT || process.env.PORT || 8787);
const TOKEN_SECRET = process.env.TOKEN_SECRET?.trim() || '';
const BP_GAME_MS = 3 * 60 * 1000;
const BOARD_SIZE = 10;

function readToken(token = '') {
  try {
    if (!TOKEN_SECRET || !token) return null;
    const [body, sig] = token.split('.');
    if (!body || !sig) return null;
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
    const a = Buffer.from(sig), b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return payload.exp > Date.now() ? payload : null;
  } catch { return null; }
}

const connections = new Map();
const socketRate = new WeakMap();
function allowSocketMessage(ws, maxPerSecond = 40) { const now = Date.now(); const b = socketRate.get(ws); if (!b || now - b.started >= 1000) { socketRate.set(ws, { started: now, count: 1 }); return true; } b.count++; return b.count <= maxPerSecond; } // duelId -> Set<WebSocket>

function emptyBoard() { return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0)); }
function cloneBoard(b) { return b.map(r => [...r]); }
function normalizeBoard(b) {
  if (!Array.isArray(b) || b.length !== BOARD_SIZE || b.some(r => !Array.isArray(r) || r.length !== BOARD_SIZE)) return null;
  return b.map(r => r.map(v => Number(v) > 0 ? 1 : 0));
}
function matrixKey(m) { return JSON.stringify(m); }
function validMatrix(m) {
  if (!Array.isArray(m) || !m.length || m.length > 5 || !Array.isArray(m[0]) || !m[0].length || m[0].length > 5) return false;
  const w = m[0].length;
  let tiles = 0;
  for (const row of m) {
    if (!Array.isArray(row) || row.length !== w) return false;
    for (const v of row) if (Number(v) !== 0) tiles++;
  }
  return tiles >= 1 && tiles <= 9;
}
function canPlace(board, m, sr, sc) {
  if (sr < 0 || sc < 0 || sr + m.length > BOARD_SIZE || sc + m[0].length > BOARD_SIZE) return false;
  for (let r = 0; r < m.length; r++) for (let c = 0; c < m[0].length; c++) {
    if (Number(m[r][c]) !== 0 && board[sr+r][sc+c] !== 0) return false;
  }
  return true;
}
function applyMove(board, m, sr, sc) {
  const out = cloneBoard(board);
  for (let r = 0; r < m.length; r++) for (let c = 0; c < m[0].length; c++) if (Number(m[r][c]) !== 0) out[sr+r][sc+c] = 1;
  const rows = [], cols = [];
  for (let r = 0; r < BOARD_SIZE; r++) if (out[r].every(Boolean)) rows.push(r);
  for (let c = 0; c < BOARD_SIZE; c++) { let full = true; for (let r=0;r<BOARD_SIZE;r++) if (!out[r][c]) { full=false; break; } if (full) cols.push(c); }
  for (const r of rows) for (let c=0;c<BOARD_SIZE;c++) out[r][c]=0;
  for (const c of cols) for (let r=0;r<BOARD_SIZE;r++) out[r][c]=0;
  return { board: out, rows, cols, lines: rows.length + cols.length };
}
function tileCount(m) { return m.flat().filter(v => Number(v)!==0).length; }
function scoreMove(lines, tiles, combo, streak) {
  const tilePoints = tiles * 10;
  let linePoints = lines === 1 ? 100 : lines === 2 ? 200 : lines >= 3 ? lines * 100 + 100 : 0;
  const newCombo = lines > 0 ? combo + 1 : 0;
  const newStreak = lines > 0 ? streak + 1 : streak;
  const comboBonus = newCombo > 1 ? (newCombo - 1) * 50 : 0;
  const streakBonus = newStreak > 1 ? Math.min(newStreak * 50, 250) : 0;
  return { points: tilePoints + linePoints + comboBonus + streakBonus, combo: newCombo, streak: newStreak };
}
function stateFor(session, userId) {
  const ls = session.liveState || {};
  const mine = ls.players?.[userId] || { board: emptyBoard(), score: 0, linesCleared: 0, combo: 0, streak: 0, moveIndex: 0 };
  const opponentId = session.opponentUserId;
  const opp = opponentId ? (ls.players?.[opponentId] || null) : null;
  return {
    type: 'STATE', version: 1, matchId: session.id, duelId: session.duelId || null,
    serverTime: Date.now(), gameStartedAt: session.gameStartedAt || session.startsAt || null,
    remainingMs: Math.max(0, (Date.parse(session.gameStartedAt || session.startsAt || '') + BP_GAME_MS) - Date.now()),
    self: mine, opponent: opp ? { ...opp, userId: opponentId } : null
  };
}
function broadcast(duelId, message) {
  const set = connections.get(duelId); if (!set) return;
  const raw = JSON.stringify(message);
  for (const ws of set) if (ws.readyState === 1) ws.send(raw);
}

async function handleMessage(ws, session, user, msg) {
  if (!msg || msg.type !== 'MOVE') return;
  if (session.status !== 'PLAYING' || !session.duelId) return ws.send(JSON.stringify({ type:'ERROR', code:'MATCH_NOT_LIVE' }));
  const result = await withDbLock(async () => {
    const db = await loadDb();
    const current = (db.blockPuzzleMatches || []).find(m => m.id === session.id && m.userId === user.id);
    if (!current || !current.duelId || current.status !== 'PLAYING') throw new Error('MATCH_NOT_LIVE');
    const started = Date.parse(current.gameStartedAt || current.startsAt || '');
    if (!started || started + BP_GAME_MS <= Date.now()) throw new Error('MATCH_ENDED');
    const matrix = msg.matrix;
    const row = Math.floor(Number(msg.row)), col = Math.floor(Number(msg.col));
    if (!validMatrix(matrix) || !Number.isInteger(row) || !Number.isInteger(col)) throw new Error('INVALID_MOVE');
    current.liveState ||= { players: {}, updatedAt: now() };
    current.liveState.players ||= {};
    current.liveState.players[user.id] ||= { board: emptyBoard(), score: 0, linesCleared: 0, combo: 0, streak: 0, moveIndex: 0 };
    const p = current.liveState.players[user.id];
    const moveIndex = Number(msg.moveIndex);
    if (!Number.isInteger(moveIndex) || moveIndex !== Number(p.moveIndex || 0)) throw new Error('OUT_OF_ORDER');
    if (!canPlace(p.board, matrix, row, col)) throw new Error('ILLEGAL_PLACEMENT');
    const placed = applyMove(p.board, matrix, row, col);
    const scored = scoreMove(placed.lines, tileCount(matrix), Number(p.combo||0), Number(p.streak||0));
    p.board = placed.board;
    p.score = Number(p.score||0) + scored.points;
    p.linesCleared = Number(p.linesCleared||0) + placed.lines;
    p.combo = scored.combo; p.streak = scored.streak; p.moveIndex++;
    p.lastActionAt = Date.now();
    current.moveIndex = Math.max(Number(current.moveIndex||0), p.moveIndex);
    current.liveUpdatedAt = now();
    await saveDb(db);
    return { db, current, p, placed, scored };
  });
  // Send the mover's authoritative state to both players. The client that receives
  // this event can update the opponent board using `state.self` for the mover.
  const message = {
    type: 'MOVE_ACCEPTED',
    userId: user.id,
    moveIndex: result.p.moveIndex - 1,
    pointsEarned: result.scored.points,
    linesCleared: result.placed.lines,
    score: result.p.score,
    moverState: { ...result.p, userId: user.id }
  };
  broadcast(result.current.duelId, message);
}

const server = http.createServer((req,res) => app(req,res));
const wss = new WebSocketServer({ server, path:'/live' });

wss.on('connection', async (ws, req) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token') || '';
    const matchId = url.searchParams.get('matchId') || '';
    const payload = readToken(token);
    if (!payload?.userId || !matchId) return ws.close(1008, 'Unauthorized');
    const db = await loadDb();
    const session = (db.blockPuzzleMatches || []).find(m => m.id === matchId && m.userId === payload.userId);
    const arcade = (db.arcadeMatches || []).find(m => m.id === matchId && (m.players || []).some(p => p.userId === payload.userId));
    if (arcade) {
      if (arcade.status !== 'PLAYING' || !arcade.duelId) return ws.close(1008, 'Match not ready');
      const user = db.users.find(u => u.id === payload.userId);
      if (!user || user.isBanned) return ws.close(1008, 'Account unavailable');
      const set = connections.get(arcade.duelId) || new Set(); set.add(ws); connections.set(arcade.duelId, set);
      ws.userId = user.id; ws.duelId = arcade.duelId; ws.arcade = true;
      const me=(arcade.players||[]).find(p=>p.userId===user.id);
      ws.send(JSON.stringify({type:'ARCADE_READY',matchId:arcade.id,gameType:arcade.gameType,playerNumber:me?.playerNumber||1,serverTime:Date.now()}));
      broadcast(arcade.duelId,{type:'ARCADE_PRESENCE',userId:user.id,connected:true});
      ws.on('message',async raw=>{
        try {
          if (raw.length > 128 * 1024 || !allowSocketMessage(ws)) return ws.send(JSON.stringify({type:'ERROR',code:'RATE_LIMITED'}));
          const msg=JSON.parse(raw.toString());
          if(!['ARCADE_SHOT','ARCADE_STATE','ARCADE_FINISH'].includes(msg.type)) return;
          if(msg.type==='ARCADE_FINISH') {
            // The HTTP finish endpoint performs the balance/payout transaction; WS only informs the opponent.
            broadcast(arcade.duelId,{...msg,userId:user.id}); return;
          }
          broadcast(arcade.duelId,{...msg,userId:user.id});
        } catch(e) { ws.send(JSON.stringify({type:'ERROR',code:'ARCADE_MESSAGE_ERROR'})); }
      });
      ws.on('close',()=>{set.delete(ws);if(!set.size)connections.delete(arcade.duelId);broadcast(arcade.duelId,{type:'ARCADE_PRESENCE',userId:user.id,connected:false});});
      return;
    }
    if (!session?.duelId || !session.opponentUserId) return ws.close(1008, 'Match not ready');
    const user = db.users.find(u => u.id === payload.userId);
    if (!user || user.isBanned) return ws.close(1008, 'Account unavailable');
    const set = connections.get(session.duelId) || new Set(); set.add(ws); connections.set(session.duelId, set);
    ws.userId = user.id; ws.duelId = session.duelId;
    ws.send(JSON.stringify(stateFor(session, user.id)));
    broadcast(session.duelId, { type:'PRESENCE', userId:user.id, connected:true });
    ws.on('message', async raw => {
      try { if (raw.length > 128 * 1024 || !allowSocketMessage(ws)) return ws.send(JSON.stringify({type:'ERROR',code:'RATE_LIMITED'})); await handleMessage(ws, session, user, JSON.parse(raw.toString())); }
      catch (e) { ws.send(JSON.stringify({ type:'ERROR', code:e?.message || 'LIVE_ERROR' })); }
    });
    ws.on('close', () => {
      set.delete(ws); if (!set.size) connections.delete(session.duelId);
      broadcast(session.duelId, { type:'PRESENCE', userId:user.id, connected:false });
    });
  } catch (e) { try { ws.close(1011, 'Server error'); } catch {} }
});

server.listen(PORT, () => console.log(`Skillzgame live server listening on http://localhost:${PORT} (WebSocket /live)`));
