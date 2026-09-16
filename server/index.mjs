import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import { loadDb, loadHistoryDb, saveDb, saveDbPartial, submitBlockPuzzleScoreFast, pingDb, id, now, hashPassword, verifyPassword, publicUser, withDbLock } from './store.mjs';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
// Security headers without adding another runtime dependency.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
app.use(cors({ origin: (origin, cb) => { if (!origin || !ALLOWED_ORIGINS.length || ALLOWED_ORIGINS.includes(origin)) return cb(null, true); return cb(new Error('Origin not allowed')); }, credentials: true }));
app.use(express.json({ limit: '2mb', strict: true }));

// Lightweight abuse protection. This is intentionally conservative so normal play is unaffected.
const rateBuckets = new Map();
function rateLimit({ windowMs, max, keyFn = req => req.ip || 'unknown' }) {
  return (req, res, next) => {
    const key = keyFn(req);
    const nowMs = Date.now();
    let b = rateBuckets.get(key);
    if (!b || nowMs - b.started >= windowMs) b = { started: nowMs, count: 0 };
    b.count++;
    rateBuckets.set(key, b);
    if (rateBuckets.size > 5000) for (const [k, v] of rateBuckets) if (nowMs - v.started >= windowMs) rateBuckets.delete(k);
    if (b.count > max) return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    next();
  };
}
const apiRateLimit = rateLimit({ windowMs: 60_000, max: 180, keyFn: req => `${req.ip || 'unknown'}:${req.headers.authorization ? 'auth' : 'anon'}` });
const authRateLimit = rateLimit({ windowMs: 15 * 60_000, max: 12, keyFn: req => `${req.ip || 'unknown'}:${safeText(req.body?.phone, 40)}` });
app.use('/api', apiRateLimit);

const PORT = Number(process.env.PORT || 8787);
const ADMIN_PHONE = process.env.ADMIN_PHONE?.trim() || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
const TOKEN_SECRET = process.env.TOKEN_SECRET?.trim() || '';

function sign(payload) {
  if (!TOKEN_SECRET) throw new Error('TOKEN_SECRET is not configured');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now(), jti: crypto.randomUUID(), exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}
function readToken(token = '') {
  try {
    if (!TOKEN_SECRET || !token) return null;
    const [body, sig] = token.split('.');
    if (!body || !sig) return null;
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
    const a = Buffer.from(sig), b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
}

async function auth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const payload = readToken(token);
    if (!payload?.userId) return res.status(401).json({ message: 'Unauthorized' });
    const db = await loadDb();
    const user = db.users.find(u => u.id === payload.userId);
    if (!user || user.isBanned) return res.status(403).json({ message: 'Account unavailable' });
    req.user = user;
    req.db = db;
    next();
  } catch (err) { next(err); }
}

function admin(req, res, next) {
  if (!req.user?.isAdmin) return res.status(403).json({ message: 'Admin access required' });
  next();
}
function money(n) { return Number(Number(n).toFixed(2)); }
function safeText(v, max = 500) { return String(v ?? '').trim().slice(0, max); }
function makeTransaction(userId, type, amount, title, subtitle, category, extra = {}) {
  return { id: id('txn'), userId, trxNumber: `#${Math.floor(100000 + Math.random() * 900000)}`, type, title, subtitle, amount: money(amount), status: 'COMPLETED', date: now(), category, ...extra };
}

function referralSettings(db) {
  const r = db.referralSettings || {};
  return { enabled: r.enabled !== false, bonusAmount: money(Number(r.bonusAmount ?? 20)), minDeposit: money(Number(r.minDeposit ?? 100)), requireFirstProMatch: r.requireFirstProMatch !== false };
}

function maybeAwardReferralBonus(db, referredUserId) {
  // Referral bonus is NEVER paid automatically. This function only creates a
  // pending approval record once the referral has met the configured criteria.
  const settings = referralSettings(db);
  if (!settings.enabled || settings.bonusAmount <= 0) return null;
  const referred = (db.users || []).find(u => u.id === referredUserId);
  if (!referred || !referred.referredBy) return null;
  const referrer = (db.users || []).find(u => u.id !== referred.id && String(u.referralCode || '').toUpperCase() === String(referred.referredBy || '').trim().toUpperCase());
  if (!referrer) return null;
  db.referrals = db.referrals || [];
  let record = db.referrals.find(r => r.referredUserId === referred.id);
  if (record?.status === 'PAID' || record?.status === 'REJECTED') return record || null;
  const approvedDeposit = (db.depositRequests || []).filter(r => r.userId === referred.id && r.status === 'APPROVED').reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const firstProMatchPlayed = (db.blockPuzzleMatches || []).some(m => m.userId === referred.id && m.submittedAt);
  if (approvedDeposit < settings.minDeposit || (settings.requireFirstProMatch && !firstProMatchPlayed)) return record || null;
  if (!record) {
    record = { id: id('ref'), referrerId: referrer.id, referredUserId: referred.id, referrerName: referrer.name, referredUserName: referred.name, bonusAmount: settings.bonusAmount, status: 'PENDING_APPROVAL', createdAt: now(), qualifyingDeposit: money(approvedDeposit) };
    db.referrals.unshift(record);
  } else if (record.status === 'PENDING') {
    Object.assign(record, { status: 'PENDING_APPROVAL', bonusAmount: settings.bonusAmount, qualifyingDeposit: money(approvedDeposit) });
  }
  return record;
}

app.get('/api/health', async (req, res) => {
  try {
    await pingDb();
    res.json({ ok: true, database: 'mongodb', configured: true, service: 'skillzgame-backend', time: now() });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(503).json({ ok: false, database: 'mongodb', configured: Boolean(process.env.MONGODB_URI?.trim()), message: err?.message || 'MongoDB unavailable', time: now() });
  }
});

app.post('/api/auth/register', authRateLimit, async (req, res) => {
  try {
    const { name, phone, password, refCode = '' } = req.body || {};
    const cleanName = safeText(name, 100), cleanPhone = safeText(phone, 30), cleanPass = String(password ?? '');
    if (!cleanName || !cleanPhone || cleanPass.length < 8) return res.status(400).json({ message: 'Name, phone and password are required. Password must be at least 8 characters.' });
    const db = await loadDb();
    if (db.users.some(u => u.phone === cleanPhone)) return res.status(409).json({ message: 'Phone already registered.' });
    const referralCode = `LX${crypto.randomInt(100000, 999999)}`;
    const user = {
      id: id('usr'), name: cleanName, phone: cleanPhone, ludoKingName: cleanName,
      passwordHash: hashPassword(cleanPass), isAdmin: false, isBanned: false,
      gamingBalance: 0, winningBalance: 0, matchesPlayed: 0, matchesWon: 0, totalWinnings: 0,
      referralCode, referredBy: safeText(refCode, 50).toUpperCase() || undefined, joinedAt: now(), createdAt: now()
    };
    db.users.unshift(user); await saveDb(db);
    res.status(201).json({ token: sign({ userId: user.id }), user: publicUser(user) });
  } catch (err) { console.error('Register error:', err); res.status(503).json({ message: err?.message || 'Database unavailable' }); }
});

app.post('/api/auth/login', authRateLimit, async (req, res) => {
  try {
    const phone = safeText(req.body?.phone, 30), password = String(req.body?.password ?? '');
    const db = await loadDb();
    let user = db.users.find(u => u.phone === phone);
    // The admin credential is server-only. It can create/update only the dedicated admin record.
    if (ADMIN_PHONE && ADMIN_PASSWORD && phone === ADMIN_PHONE && password === ADMIN_PASSWORD) {
      user = db.users.find(u => u.id === 'admin_1');
      if (user && user.phone !== ADMIN_PHONE) user = null;
      if (!user) {
        user = { id: 'admin_1', name: 'Admin', phone: ADMIN_PHONE, ludoKingName: 'Admin', passwordHash: hashPassword(ADMIN_PASSWORD), isAdmin: true, isBanned: false, gamingBalance: 0, winningBalance: 0, matchesPlayed: 0, matchesWon: 0, totalWinnings: 0, referralCode: 'ADMIN', joinedAt: now(), createdAt: now() };
        db.users.unshift(user);
      } else {
        user.phone = ADMIN_PHONE; user.isAdmin = true; user.isBanned = false; user.passwordHash = hashPassword(ADMIN_PASSWORD);
      }
      await saveDb(db);
    }
    if (!user || !verifyPassword(password, user.passwordHash)) return res.status(401).json({ message: 'Invalid phone or password.' });
    if (user.isBanned) return res.status(403).json({ message: 'Account is banned.' });
    res.json({ token: sign({ userId: user.id }), user: publicUser(user) });
  } catch (err) { console.error('Login error:', err); res.status(503).json({ message: err?.message || 'Database unavailable' }); }
});

app.get('/api/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));
app.get('/api/users', auth, admin, (req, res) => res.json({ users: req.db.users.map(publicUser) }));

// Server-backed game catalog: controls Home publication independently from gameplay engines.
function publicGame(game) { return { id: game.id, name: game.name, slug: game.slug, gameType: game.gameType, icon: game.icon || '🎮', imageUrl: game.imageUrl || '', description: game.description || '', entryFee: money(game.entryFee || 0), prizeAmount: money(game.prizeAmount || 0), active: game.active !== false, showOnHome: game.showOnHome !== false, displayOrder: Number(game.displayOrder || 0), createdAt: game.createdAt, updatedAt: game.updatedAt }; }
app.get('/api/games', auth, (req, res) => { const games=(req.db.games||[]).filter(g=>g.active!==false&&g.showOnHome!==false).sort((a,b)=>Number(a.displayOrder||0)-Number(b.displayOrder||0)); res.json({games:games.map(publicGame)}); });
app.get('/api/admin/games', auth, admin, (req, res) => { const games=(req.db.games||[]).slice().sort((a,b)=>Number(a.displayOrder||0)-Number(b.displayOrder||0)); res.json({games:games.map(publicGame)}); });
app.post('/api/admin/games', auth, admin, async (req, res) => { const b=req.body||{}; const name=safeText(b.name,80); const slug=safeText(b.slug||name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),80); const gameType=safeText(b.gameType||'custom',40); if(!name||!slug)return res.status(400).json({message:'Game name and slug are required.'}); if((req.db.games||[]).some(g=>g.slug===slug))return res.status(400).json({message:'এই slug দিয়ে Game আগে থেকেই আছে।'}); const game={id:id('game'),name,slug,gameType,icon:safeText(b.icon||'🎮',8),imageUrl:safeText(b.imageUrl,1000),description:safeText(b.description,300),entryFee:money(Math.max(0,Number(b.entryFee)||0)),prizeAmount:money(Math.max(0,Number(b.prizeAmount)||0)),active:b.active!==false,showOnHome:b.showOnHome!==false,displayOrder:Number.isFinite(Number(b.displayOrder))?Number(b.displayOrder):((req.db.games||[]).length+1),createdAt:now(),updatedAt:now()}; req.db.games=[...(req.db.games||[]),game]; await saveDb(req.db); res.json({game:publicGame(game)}); });
app.patch('/api/admin/games/:id', auth, admin, async (req, res) => { const game=(req.db.games||[]).find(g=>g.id===req.params.id); if(!game)return res.status(404).json({message:'Game not found.'}); const b=req.body||{}; if(b.name!==undefined)game.name=safeText(b.name,80); if(b.slug!==undefined){const slug=safeText(b.slug,80);if(!slug)return res.status(400).json({message:'Invalid slug.'});if((req.db.games||[]).some(g=>g.id!==game.id&&g.slug===slug))return res.status(400).json({message:'এই slug আগে থেকেই আছে।'});game.slug=slug;} if(b.gameType!==undefined)game.gameType=safeText(b.gameType,40); if(b.icon!==undefined)game.icon=safeText(b.icon,8); if(b.imageUrl!==undefined)game.imageUrl=safeText(b.imageUrl,1000); if(b.description!==undefined)game.description=safeText(b.description,300); if(b.entryFee!==undefined)game.entryFee=money(Math.max(0,Number(b.entryFee)||0)); if(b.prizeAmount!==undefined)game.prizeAmount=money(Math.max(0,Number(b.prizeAmount)||0)); if(b.active!==undefined)game.active=Boolean(b.active); if(b.showOnHome!==undefined)game.showOnHome=Boolean(b.showOnHome); if(b.displayOrder!==undefined&&Number.isFinite(Number(b.displayOrder)))game.displayOrder=Number(b.displayOrder); game.updatedAt=now(); await saveDb(req.db); res.json({game:publicGame(game)}); });
app.delete('/api/admin/games/:id', auth, admin, async (req, res) => { const games=req.db.games||[]; const game=games.find(g=>g.id===req.params.id); if(!game)return res.status(404).json({message:'Game not found.'}); if(game.gameType==='block_puzzle')return res.status(400).json({message:'Block Puzzle মূল গেমটি delete করা যাবে না। চাইলে Home থেকে hide/inactive করুন।'}); req.db.games=games.filter(g=>g.id!==req.params.id); await saveDb(req.db); res.json({ok:true}); });
// Complete admin audit for a user. Password/secret fields are never returned.
app.get('/api/admin/users/:id/audit', auth, admin, (req, res) => {
  const db = req.db, user = (db.users || []).find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const uid = user.id;
  const deposits = (db.depositRequests || []).filter(x => x.userId === uid);
  const withdrawals = (db.withdrawRequests || []).filter(x => x.userId === uid);
  const transactions = (db.transactions || []).filter(x => x.userId === uid);
  const proMatches = (db.blockPuzzleMatches || []).filter(x => x.userId === uid);
  const normalMatches = (db.matches || []).filter(x => (x.joinedPlayers || []).some(p => p.userId === uid));
  const results = (db.resultSubmissions || []).filter(x => x.userId === uid);
  const sum = (arr, fn=()=>true) => money(arr.filter(fn).reduce((n,x)=>n+Number(x.amount||0),0));
  const st = x => String(x.status||'').toUpperCase();
  res.json({
    user: publicUser(user),
    summary: {
      currentGamingBalance:money(user.gamingBalance), currentWinningBalance:money(user.winningBalance),
      approvedDeposits:sum(deposits,x=>st(x)==='APPROVED'), depositRequestCount:deposits.length,
      totalWithdrawRequested:sum(withdrawals), totalWithdrawApproved:sum(withdrawals,x=>st(x)==='APPROVED'),
      totalWithdrawRejected:sum(withdrawals,x=>st(x)==='REJECTED'), totalWithdrawPending:sum(withdrawals,x=>st(x)==='PENDING'),
      withdrawalCount:withdrawals.length, matchesPlayed:Number(user.matchesPlayed||0), matchesWon:Number(user.matchesWon||0),
      proMatches:proMatches.length, completedProMatches:proMatches.filter(x=>x.status==='COMPLETED').length,
      proEntryTotal:sum(proMatches), proPrizeTotal:sum(proMatches,x=>x.outcome==='WON'),
      normalMatches:normalMatches.length, normalEntryTotal:sum(normalMatches), transactionCount:transactions.length,
      resultSubmissionCount:results.length
    },
    deposits, withdrawals, transactions,
    proMatches:proMatches.map(x=>({matchId:x.id,duelId:x.duelId||null,status:x.status,entryFee:Number(x.entryFee||0),prizeAmount:Number(x.prizeAmount||0),score:x.score??null,outcome:x.outcome||null,rank:x.groupRank??null,playerCount:x.playerCount??null,createdAt:x.createdAt,submittedAt:x.submittedAt||null,settledAt:x.settledAt||null})),
    normalMatches, resultSubmissions:results
  });
});

app.get('/api/admin/users', auth, admin, (req, res) => res.json({ users: req.db.users.map(publicUser) }));

app.delete('/api/users/:id', auth, admin, async (req, res) => {
  const u = req.db.users.find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ message: 'User not found' });
  if (u.isAdmin || u.id === req.user.id) return res.status(400).json({ message: 'Admin account cannot be deleted.' });
  req.db.users = req.db.users.filter(x => x.id !== req.params.id);
  await saveDb(req.db);
  res.json({ ok: true });
});

app.patch('/api/users/:id/ban', auth, admin, async (req, res) => {
  const u = req.db.users.find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ message: 'User not found' });
  if (u.isAdmin) return res.status(400).json({ message: 'Admin account cannot be banned.' });
  u.isBanned = Boolean(req.body?.banned);
  await saveDb(req.db); res.json({ user: publicUser(u) });
});

app.post('/api/users/:id/password-reset', auth, admin, async (req, res) => {
  const u = req.db.users.find(x => x.id === req.params.id);
  const password = String(req.body?.password ?? '');
  if (!u) return res.status(404).json({ message: 'User not found' });
  if (u.isAdmin) return res.status(400).json({ message: 'Use environment credentials for the admin account.' });
  if (password.length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters.' });
  u.passwordHash = hashPassword(password);
  u.passwordUpdatedAt = now();
  await saveDb(req.db);
  res.json({ ok: true, user: publicUser(u) });
});

app.post('/api/users/:id/balance', auth, admin, async (req, res) => {
  try {
    const result = await withDbLock(async () => {
      const db = await loadDb();
      const u = db.users.find(x => x.id === req.params.id);
      const { balanceType = 'gaming', amount = 0, isAddition = true, note = 'Admin adjustment', adjustmentId = '' } = req.body || {};
      const value = Number(amount);
      const opId = safeText(adjustmentId, 100);
      if (!u) throw Object.assign(new Error('User not found'), { statusCode: 404 });
      if (!['gaming', 'winning'].includes(balanceType) || !Number.isFinite(value) || value <= 0 || value > 10000000) throw Object.assign(new Error('Invalid balance adjustment'), { statusCode: 400 });

      // Idempotency: a double-click/retry with the same adjustmentId is applied only once.
      if (opId) {
        const alreadyApplied = (db.transactions || []).find(t => t.userId === u.id && t.category === 'admin' && t.adjustmentId === opId);
        if (alreadyApplied) return { user: u, duplicate: true };
      }

      const key = balanceType === 'winning' ? 'winningBalance' : 'gamingBalance';
      const delta = isAddition ? value : -value;
      if (Number(u[key] || 0) + delta < 0) throw Object.assign(new Error('Insufficient balance'), { statusCode: 400 });
      u[key] = money(Number(u[key] || 0) + delta);
      db.transactions.unshift(makeTransaction(u.id, isAddition ? 'admin_add' : 'admin_deduct', delta, isAddition ? 'Admin Add' : 'Admin Deduct', `Admin • ${balanceType} • ${safeText(note)}`, 'admin', { balanceType, adjustmentId: opId || null, reversible: isAddition, adjustedBy: req.user.id }));
      await saveDb(db);
      return { user: u, duplicate: false };
    });
    res.json({ user: publicUser(result.user), duplicate: result.duplicate });
  } catch (err) { res.status(err.statusCode || 503).json({ message: err?.message || 'Balance adjustment failed.' }); }
});

app.get('/api/transactions', auth, (req, res) => {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const items = req.db.transactions.filter(t => t.userId === req.user.id && (Date.parse(t.date || '') || 0) >= cutoff).slice(0, 500);
  res.json({ transactions: items });
});

app.get('/api/admin/transactions', auth, admin, (req, res) => res.json({ transactions: req.db.transactions.slice(0, 500) }));

// Server-authoritative Block Puzzle matchmaking. Each paid session is paired only with
// another waiting player at the same entry/prize tier. The server owns settlement/refunds.
const BP_PENDING_MS = 24 * 60 * 60 * 1000;
const BP_GAME_MS = 3 * 60 * 1000;

// Live game protocol: the HTTP API remains responsible for matchmaking/settlement;
// the dedicated live server handles low-latency move/state messages.
const BP_PROTOCOL_VERSION = 1;
const DEFAULT_PRO_MATCH_FEES = [20, 30, 60, 120, 250, 500];
const PRO_MATCH_PRIZES = [35, 50, 100, 200, 420, 850];
const DEFAULT_MULTIPLAYER_PRO_MATCHES = [
  {id:'mp_3', players:3, entryFee:20, prizes:[40], active:false, showOnHome:true, displayOrder:1},
  {id:'mp_5', players:5, entryFee:30, prizes:[80], active:false, showOnHome:true, displayOrder:2},
  {id:'mp_7', players:7, entryFee:60, prizes:[160], active:false, showOnHome:true, displayOrder:3},
  {id:'mp_10', players:10, entryFee:120, prizes:[300], active:false, showOnHome:true, displayOrder:4}
];
const BLOCK_BOARD_SIZE = 10;
function emptyBoard() { return Array.from({ length: BLOCK_BOARD_SIZE }, () => Array(BLOCK_BOARD_SIZE).fill(0)); }
function proMatchFees(db) {
  const fees = Array.isArray(db.paymentSettings?.proMatchFees) ? db.paymentSettings.proMatchFees.map(Number).filter(n => Number.isFinite(n) && n > 0) : [];
  return fees.length === DEFAULT_PRO_MATCH_FEES.length ? fees : DEFAULT_PRO_MATCH_FEES;
}
function multiplayerProMatchConfig(db, playerCount) {
  const rows = Array.isArray(db.paymentSettings?.multiplayerProMatches) ? db.paymentSettings.multiplayerProMatches : DEFAULT_MULTIPLAYER_PRO_MATCHES;
  return rows.find(x => Math.floor(Number(x?.players)) === Number(playerCount)) || null;
}
function multiplayerPrizes(config) {
  const raw = Array.isArray(config?.prizes) ? config.prizes : (config?.prizeAmount ? [config.prizeAmount] : []);
  return raw.map(Number).filter(n => Number.isFinite(n) && n > 0).map(money);
}

function isBlockPuzzleMatchmakingEligibleUser(db, userId) {
  const user = (db.users || []).find(u => String(u.id) === String(userId));
  if (!user) return false;
  if (user.isBanned) return false;
  if (user.deleted === true || user.accountDeleted === true) return false;
  const status = String(user.status || '').toUpperCase();
  if (status === 'DELETED' || status === 'BANNED') return false;
  return true;
}

function blockPuzzlePublicMatch(session, db) {
  if (!session) return null;
  const group = session.duelId ? (db.blockPuzzleMatches || []).filter(m => m.duelId === session.duelId && !m.tournamentId) : [session];
  const opponentSession = session.opponentUserId
    ? group.find(m => String(m.userId) === String(session.opponentUserId))
    : group.find(m => String(m.userId) !== String(session.userId));
  const opponent = opponentSession ? (db.users || []).find(u => String(u.id) === String(opponentSession.userId)) : null;
  const participants = group.map(m => ({ userId:m.userId, name:m.userName, score:m.score ?? null, status:m.status, submitted: Boolean(m.submittedAt) }));
  return {
    id: session.id, gameType: session.gameType || 'block_puzzle', duelId: session.duelId || null, tournamentId: session.tournamentId || null, userId: session.userId, userName: session.userName, playerCount: Number(session.playerCount || 2), playersJoined: participants.length, participants,
    entryFee: session.entryFee, prizeAmount: session.prizeAmount, prizeDistribution: Array.isArray(session.prizeDistribution) ? session.prizeDistribution : (session.prizeAmount ? [session.prizeAmount] : []), status: session.status,
    createdAt: session.createdAt, pendingUntil: session.pendingUntil || null, matchedAt: session.matchedAt || null,
    liveStateVersion: BP_PROTOCOL_VERSION,
    gameSeed: session.gameSeed || null,
    gameStartedAt: session.gameStartedAt || null, submittedAt: session.submittedAt || null,
    paused: Boolean(session.pauseStartedAt || session.paused), pauseStartedAt: session.pauseStartedAt || null,
    score: session.score ?? null, linesCleared: session.linesCleared ?? 0, bestCombo: session.bestCombo ?? 0,
    opponent: opponentSession ? { userId: opponentSession.userId, name: opponentSession.userName || opponent?.name || 'Opponent', score: opponentSession.score == null ? null : Number(opponentSession.score), linesCleared: Number(opponentSession.linesCleared || 0), bestCombo: Number(opponentSession.bestCombo || 0), status: opponentSession.status } : null,
    outcome: session.outcome || null, winnerId: session.winnerId || null, settledAt: session.settledAt || null,
    refunded: Boolean(session.refunded)
  };
}

async function settleBlockPuzzleDuel(db, duelId) {
  const sessions = (db.blockPuzzleMatches || []).filter(m => m.duelId === duelId && !m.tournamentId);
  if (!sessions.length) return false;
  const required = Math.max(2, Number(sessions[0].playerCount || 2));
  if (sessions.length < required) return false;
  if (sessions.some(m => m.settledAt)) return true;
  if (sessions.some(m => m.status !== 'SUBMITTED')) return false;
  const ranked = sessions.slice().sort((a,b) => Number(b.score||0) - Number(a.score||0) || String(a.userId).localeCompare(String(b.userId)));
  const distribution = Array.isArray(sessions[0]?.prizeDistribution) && sessions[0].prizeDistribution.length
    ? sessions[0].prizeDistribution.map(Number).filter(n => Number.isFinite(n) && n > 0).map(money)
    : (Number(sessions[0]?.prizeAmount || 0) > 0 ? [money(Number(sessions[0].prizeAmount))] : []);
  const settled = now();
  for (const session of sessions) {
    session.status = 'COMPLETED';
    session.settledAt = settled;
    session.groupRank = ranked.findIndex(x => x.userId === session.userId) + 1;
    const rankPrize = Number(distribution[session.groupRank - 1] || 0);
    session.winnerId = distribution.length && session.groupRank <= distribution.length ? session.userId : null;
    session.outcome = distribution.length && session.groupRank <= distribution.length ? 'WON' : 'LOST';
    session.awardedPrize = rankPrize;
  }
  for (const session of ranked) {
    const prize = money(Number(distribution[session.groupRank - 1] || 0));
    if (prize <= 0) continue;
    const winner = db.users.find(u => u.id === session.userId);
    if (!winner) continue;
    winner.winningBalance = money(Number(winner.winningBalance || 0) + prize);
    winner.totalWinnings = money(Number(winner.totalWinnings || 0) + prize);
    winner.matchesWon = Number(winner.matchesWon || 0) + 1;
    db.transactions.unshift(makeTransaction(winner.id, 'match_win', prize, 'Multiplayer Pro Match Prize', `Rank #${session.groupRank} • ${required} Players`, 'match', { matchId: duelId, gameType: sessions[0]?.gameType || 'block_puzzle', playerCount: required, rank: session.groupRank }));
  }
  return true;
}

function leaderboardEntries(db, board, freeze = false) {
  if (freeze && Array.isArray(board.finalEntries)) return board.finalEntries;
  const users = new Map((db.users || []).map(u => [u.id, u]));
  const scores = new Map();
  for (const m of (db.blockPuzzleMatches || [])) {
    if (m.status !== 'COMPLETED' || m.outcome !== 'WON' || !m.settledAt) continue;
    const t = Date.parse(m.settledAt);
    if (!Number.isFinite(t) || t < Date.parse(board.startsAt) || t >= Date.parse(board.endsAt)) continue;
    const row = scores.get(m.userId) || { userId: m.userId, wins: 0, points: 0 };
    row.wins += 1;
    row.points += Number(board.winPoints || 0);
    scores.set(m.userId, row);
  }
  const prizes = Array.isArray(board.prizes) ? board.prizes : [];
  return [...scores.values()].sort((a,b) => b.points - a.points || b.wins - a.wins || String(a.userId).localeCompare(String(b.userId)))
    .map((x, i) => ({ rank: i + 1, userId: x.userId, username: users.get(x.userId)?.name || 'Player', wins: x.wins, points: x.points, prize: Number(prizes[i]?.amount || 0) }));
}
function publicLeaderboard(db, board) {
  if (!board) return null;
  const ended = Date.now() >= Date.parse(board.endsAt) || board.status === 'ENDED';
  const entries = leaderboardEntries(db, board, ended);
  return { ...board, entries, status: ended ? 'ENDED' : 'ACTIVE' };
}

// A player gets 3 minutes to play. If nobody joins during that game, the
// finished score remains available for another 24 hours. A later player can then
// join and play their own 3-minute game against that stored score.
async function expireBlockPuzzleMatches(db) {
  let changed = false;
  const nowMs = Date.now();
  for (const session of (db.blockPuzzleMatches || [])) {
    if (session.refunded || session.status === 'COMPLETED') continue;
    // Paused games do not consume the 3-minute gameplay clock. Resume shifts
    // gameStartedAt forward by the paused duration before the clock continues.
    if (session.status === 'PLAYING' && session.pauseStartedAt) continue;

    // Every player has an independent 3-minute attempt. If a player reaches
    // their own deadline, submit that player's current score only. Never end
    // other players' clocks just because one member of the group finished.
    if (session.status === 'PLAYING' && session.gameStartedAt && Date.parse(session.gameStartedAt) + BP_GAME_MS <= nowMs) {
      session.status = 'SUBMITTED';
      session.gameEndedAt = session.gameEndedAt || now();
      session.submittedAt = session.submittedAt || now();
      session.score = Number(session.score || 0);
      changed = true;

      if (session.duelId) {
        const duelSessions = db.blockPuzzleMatches.filter(m => m.duelId === session.duelId);
        const required = Math.max(2, Number(session.playerCount || 2));
        if (duelSessions.length >= required && await settleBlockPuzzleDuel(db, session.duelId)) changed = true;
      } else {
        // No opponent/group yet: keep the completed attempt available for a
        // later opponent to join, and allow Admin review if nobody joins.
        session.pendingUntil = session.pendingUntil || new Date(nowMs + BP_PENDING_MS).toISOString();
      }
    }
  }

  // Solo attempts remain open for 24 hours after their 3-minute game ends.
  // A solo finished attempt is SUBMITTED (not PENDING), so the cleanup must
  // explicitly include SUBMITTED sessions that have no duelId. Never refund a
  // real grouped duel here; those are settled by settleBlockPuzzleDuel().
  const pendingCutoff = nowMs - BP_PENDING_MS;
  for (const session of (db.blockPuzzleMatches || [])) {
    if (session.tournamentId || session.refunded || session.status === 'COMPLETED') continue;
    const isSoloOpen = session.status === 'SUBMITTED' && !session.duelId;
    const isLegacyPending = session.status === 'PENDING';
    if (!isSoloOpen && !isLegacyPending) continue;
    const until = Date.parse(session.pendingUntil || '');
    if (Number.isFinite(until) && until > nowMs) continue;
    const reference = Date.parse(session.pendingUntil || session.gameEndedAt || session.createdAt || '');
    if (!Number.isFinite(reference) || reference > nowMs || (session.pendingUntil == null && reference > pendingCutoff)) continue;
    const u = db.users.find(x => x.id === session.userId);
    if (u) {
      u.gamingBalance = money(Number(u.gamingBalance || 0) + Number(session.entryFee || 0));
      db.transactions.unshift(makeTransaction(u.id, 'refund', Number(session.entryFee || 0), `${session.gameType === 'nut_sort' ? 'Nut Sort' : 'Block Puzzle'} Entry Refund`, `No opponent within 24 hours • Match #${session.id.slice(-6)}`, 'match', { matchId: session.id, gameType: session.gameType || 'block_puzzle' }));
    }
    session.status = 'REFUNDED';
    session.refunded = true;
    session.refundReason = 'No opponent within 24 hours';
    session.refundedAt = now();
    changed = true;
  }
  return changed;
}

function findJoinableBlockPuzzleMatch(db, session, entryFee, prizeAmount, playerCount, gameType = 'block_puzzle') {
  const required = Math.max(2, Number(playerCount || 2));
  const candidates = (db.blockPuzzleMatches || []).filter(m =>
    m.id !== session.id && !m.tournamentId && !m.refunded &&
    String(m.gameType || 'block_puzzle') === gameType && Number(m.entryFee) === entryFee && Number(m.prizeAmount) === prizeAmount &&
    Math.max(2, Number(m.playerCount || 2)) === required && m.userId !== session.userId &&
    isBlockPuzzleMatchmakingEligibleUser(db, m.userId)
  );
  // Prefer an existing OPEN group that is not full. Never use a COMPLETED
  // or refunded member as a matchmaking target: a finished duelId must stay
  // isolated from every new Pro Match.
  const openStatuses = new Set(['PENDING', 'PLAYING', 'SUBMITTED']);
  const grouped = candidates.filter(m =>
    m.duelId && !m.refunded && openStatuses.has(String(m.status || '').toUpperCase())
  ).sort((a,b)=>(Date.parse(a.createdAt||0)||0)-(Date.parse(b.createdAt||0)||0));
  for (const candidate of grouped) {
    const activeMembers = db.blockPuzzleMatches.filter(x =>
      x.duelId === candidate.duelId && !x.refunded && openStatuses.has(String(x.status || '').toUpperCase())
    );
    // Never attach a new player to a group containing a banned/deleted/missing
    // account. Completed historical records are intentionally ignored here.
    if (activeMembers.some(x => !isBlockPuzzleMatchmakingEligibleUser(db, x.userId))) continue;
    const count = activeMembers.length;
    if (count < required) return { target: candidate, kind: 'GROUP', groupCount: count };
  }
  const live = candidates.find(m => !m.duelId && m.status === 'PLAYING' && m.gameStartedAt && Date.parse(m.gameStartedAt) + BP_GAME_MS > Date.now());
  if (live) return { target: live, kind: 'LIVE', groupCount: 1 };
  // A solo player who already submitted is still an open asynchronous
  // matchmaking target until the pending window expires. Do not require a
  // duelId here: the first submitted player may not have been grouped yet.
  const openSolo = candidates.find(m =>
    !m.duelId && openStatuses.has(String(m.status || '').toUpperCase()) &&
    (!m.pendingUntil || Date.parse(m.pendingUntil) > Date.now())
  );
  if (openSolo && isBlockPuzzleMatchmakingEligibleUser(db, openSolo.userId)) {
    return { target: openSolo, kind: String(openSolo.status || '').toUpperCase(), groupCount: 1 };
  }
  return null;
}


function ensureTournamentEntries(db, t) {
  if (!Array.isArray(db.tournamentEntries)) db.tournamentEntries = [];
  const sessions = (db.blockPuzzleMatches || []).filter(m => m.tournamentId === t.id);
  const existing = db.tournamentEntries.filter(e => e.tournamentId === t.id);
  const byUser = new Map(existing.map(e => [e.userId, e]));
  const firstByUser = new Map();
  for (const m of [...sessions].sort((a,b) => Date.parse(a.createdAt||0) - Date.parse(b.createdAt||0))) {
    if (!firstByUser.has(m.userId)) firstByUser.set(m.userId, m);
  }
  let nextNumber = existing.reduce((n,e)=>Math.max(n, Number(e.entryNumber||0)),0) + 1;
  for (const [userId, m] of firstByUser) {
    if (!byUser.has(userId)) {
      const e = { id:id('tentry'), tournamentId:t.id, userId, userName:m.userName, entryNumber:nextNumber++, joinedAt:m.createdAt||now(), entryFee:Number(t.entryFee||0), attempts:0, bestScore:0, bestScoreAt:null, lastMatchId:null };
      db.tournamentEntries.push(e); byUser.set(userId,e);
    }
  }
  for (const e of byUser.values()) {
    const ms=sessions.filter(m=>m.userId===e.userId);
    e.attempts=ms.length;
    const completed=ms.filter(m=>m.status==='COMPLETED');
    const best=completed.reduce((b,m)=>Number(m.score||0)>Number(b?.score||-1)?m:b,null);
    if (best && Number(best.score||0) >= Number(e.bestScore||0)) { e.bestScore=Number(best.score||0); e.bestScoreAt=best.submittedAt||best.createdAt||null; e.lastMatchId=best.id; }
  }
  return [...byUser.values()];
}

function tournamentEndMode(t) {
  return String(t?.endMode || 'PLAYER_LIMIT').toUpperCase() === 'TIME' ? 'TIME' : 'PLAYER_LIMIT';
}

function tournamentHasExpired(t, at=Date.now()) {
  return tournamentEndMode(t) === 'TIME' && t?.status === 'ACTIVE' && Number.isFinite(Date.parse(t.endsAt || '')) && Date.parse(t.endsAt) <= at;
}

async function autoFinalizeExpiredTournaments(db) {
  let changed = false;
  for (const t of (db.tournaments || [])) {
    if (!tournamentHasExpired(t)) continue;
    await finalizeTournamentInternal(db, t);
    changed = true;
  }
  return changed;
}

function publicTournament(db, t, currentUserId=null) {
  if (!t) return null;
  const entries = ensureTournamentEntries(db, t).sort((a,b)=>Number(a.entryNumber||0)-Number(b.entryNumber||0));
  const ranked = [...entries].sort((a,b)=>Number(b.bestScore||0)-Number(a.bestScore||0) || Date.parse(a.bestScoreAt||a.joinedAt||0)-Date.parse(b.bestScoreAt||b.joinedAt||0) || String(a.userId).localeCompare(String(b.userId)))
    .map((e,i)=>{ const u=(db.users||[]).find(x=>x.id===e.userId)||{}; return {rank:i+1,userId:e.userId,username:e.userName,avatarUrl:u.avatarUrl||u.profilePhoto||u.photoUrl||'',avatar:u.avatar||'',score:Number(e.bestScore||0),attempts:Number(e.attempts||0),entryNumber:Number(e.entryNumber||0),bestScoreAt:e.bestScoreAt||null,prize:Number(t.prizes?.[i]||0)}; });
  const joined=entries.some(e=>e.userId===currentUserId);
  const full=entries.length>=Number(t.maxPlayers||0);
  const mode=tournamentEndMode(t);
  const endsAt=t.endsAt || null;
  const timeRemainingMs=mode==='TIME' && endsAt ? Math.max(0, Date.parse(endsAt)-Date.now()) : null;
  const prizeDistribution = (Array.isArray(t.prizes) ? t.prizes : []).map((v,i)=>({rank:i+1,amount:Number(v||0)})).filter(x=>x.amount>0);
  return {...t, endMode:mode, playerCount:entries.length, registeredPlayers:entries.length, full, joined, registrationClosed:full || mode==='TIME' && t.status!=='ACTIVE', endsAt, timeRemainingMs, prizeDistribution, prizeWinnerCount:prizeDistribution.length, entries:ranked};
}

app.get('/api/tournaments', auth, async (req,res) => {
  try {
    const db=await loadDb();
    if (await autoFinalizeExpiredTournaments(db)) await saveDb(db);
    const ts=(db.tournaments||[]).filter(t=>t.status==='ACTIVE' && t.showOnHome!==false).sort((a,b)=>Number(a.displayOrder||0)-Number(b.displayOrder||0));
    res.json({tournaments:ts.map(t=>publicTournament(db,t,req.user.id))});
  } catch(err){res.status(503).json({message:err?.message||'Tournament unavailable.'});}
});
app.get('/api/tournaments/:id', auth, async (req,res) => {
  try {
    const db = await loadDb();
    if (await autoFinalizeExpiredTournaments(db)) await saveDb(db);
    const t = (db.tournaments || []).find(x => x.id === req.params.id);
    if (!t) return res.status(404).json({ message: 'Tournament পাওয়া যায়নি।' });
    res.json({ tournament: publicTournament(db, t, req.user.id) });
  } catch (err) { res.status(503).json({ message: err?.message || 'Tournament unavailable.' }); }
});
app.get('/api/admin/tournaments', auth, admin, async (req,res) => { const db=req.db; if (await autoFinalizeExpiredTournaments(db)) await saveDb(db); res.json({tournaments:(db.tournaments||[]).map(t=>publicTournament(db,t)).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt))}); });
app.post('/api/admin/tournaments', auth, admin, async (req,res) => {
  try {
    const b=req.body||{}; const name=safeText(b.name,100); const entryFee=money(Number(b.entryFee)); const maxPlayers=Math.floor(Number(b.maxPlayers)); const prizePool=money(Number(b.prizePool));
    if(!name||!Number.isFinite(entryFee)||entryFee<0||!Number.isFinite(maxPlayers)||maxPlayers<2||!Number.isFinite(prizePool)||prizePool<0) throw Object.assign(new Error('Tournament তথ্য সঠিক নয়।'),{statusCode:400});
    const prizes=Array.isArray(b.prizes)?b.prizes.map(x=>money(Number(x))).filter(x=>Number.isFinite(x)&&x>=0):[];
    if(prizes.length > maxPlayers) throw Object.assign(new Error('Prize Distribution-এর Rank Max Players-এর বেশি হতে পারবে না।'),{statusCode:400});
    if(prizes.reduce((a,x)=>a+x,0)>prizePool) throw Object.assign(new Error('Prize Distribution-এর মোট টাকা Prize Pool-এর বেশি হতে পারবে না।'),{statusCode:400});
    const endMode=String(b.endMode||'PLAYER_LIMIT').toUpperCase()==='TIME'?'TIME':'PLAYER_LIMIT';
    const durationMinutes=Math.max(1,Math.floor(Number(b.durationMinutes||0)));
    if(endMode==='TIME' && (!Number.isFinite(durationMinutes)||durationMinutes<1)) throw Object.assign(new Error('Time Mode-এর জন্য Duration অন্তত 1 মিনিট হতে হবে।'),{statusCode:400});
    const createdAt=now();
    const status=b.active===false?'INACTIVE':'ACTIVE';
    const startedAt=status==='ACTIVE' ? createdAt : null;
    const endsAt=endMode==='TIME' && startedAt ? new Date(Date.parse(startedAt)+durationMinutes*60000).toISOString() : null;
    const t={id:id('tourn'),name,gameType:'block_puzzle',entryFee,maxPlayers,prizePool,prizes,status,endMode,durationMinutes:endMode==='TIME'?durationMinutes:null,startedAt,endsAt,showOnHome:b.showOnHome!==false,displayOrder:Number(b.displayOrder)||1,createdAt,updatedAt:createdAt,finalEntries:null,payouts:[],payoutStatus:'NOT_READY',registrationClosed:false};
    req.db.tournaments=[...(req.db.tournaments||[]),t]; await saveDb(req.db); res.status(201).json({tournament:publicTournament(req.db,t)});
  } catch(err){res.status(err.statusCode||400).json({message:err?.message||'Tournament তৈরি করা যায়নি।'});}
});
app.patch('/api/admin/tournaments/:id', auth, admin, async (req,res) => {
  const t=(req.db.tournaments||[]).find(x=>x.id===req.params.id); if(!t)return res.status(404).json({message:'Tournament not found.'}); const b=req.body||{};
  // An ENDED tournament can be reused only after all Prize Reviews are complete.
  // Reusing it starts a clean new round so old players/payouts can never be paid twice.
  const wantsActive = b.status!==undefined ? String(b.status).toUpperCase()==='ACTIVE' : b.active===true;
  if(t.status==='ENDED' && wantsActive){
    if(t.payoutStatus==='PENDING_APPROVAL' || (Array.isArray(t.payouts) && t.payouts.some(p=>p.status==='PENDING'))){
      return res.status(400).json({message:'Prize Approval সম্পূর্ণ হওয়ার আগে শেষ হওয়া Tournament আবার Active করা যাবে না।'});
    }
    req.db.tournamentEntries=(req.db.tournamentEntries||[]).filter(e=>e.tournamentId!==t.id);
    t.finalEntries=null; t.payouts=[]; t.payoutStatus='NOT_READY'; t.registrationClosed=false;
    t.startedAt=now(); t.finalizedAt=null;
    t.endsAt=t.endMode==='TIME' ? new Date(Date.parse(t.startedAt)+Number(t.durationMinutes||0)*60000).toISOString() : null;
  }
  const currentEntries=ensureTournamentEntries(req.db,t);
  if(b.name!==undefined)t.name=safeText(b.name,100);
  if(b.entryFee!==undefined)t.entryFee=money(Number(b.entryFee));
  if(b.maxPlayers!==undefined){const n=Math.max(2,Math.floor(Number(b.maxPlayers))); if(n<currentEntries.length)return res.status(400).json({message:`Max Players ${currentEntries.length}-এর কম করা যাবে না।`}); t.maxPlayers=n;}
  if(b.prizePool!==undefined)t.prizePool=money(Number(b.prizePool));
  if(b.prizes!==undefined)t.prizes=Array.isArray(b.prizes)?b.prizes.map(x=>money(Number(x))).filter(x=>Number.isFinite(x)&&x>=0):[];
  if(b.endMode!==undefined){
    const mode=String(b.endMode).toUpperCase()==='TIME'?'TIME':'PLAYER_LIMIT';
    t.endMode=mode;
    if(mode==='TIME'){
      const mins=Math.max(1,Math.floor(Number(b.durationMinutes||t.durationMinutes||0)));
      if(!Number.isFinite(mins)||mins<1)return res.status(400).json({message:'Time Mode-এর জন্য Duration অন্তত 1 মিনিট হতে হবে।'});
      t.durationMinutes=mins;
      if(t.status!=='ENDED') t.endsAt=new Date(Date.parse(t.createdAt||now())+mins*60000).toISOString();
    } else { t.durationMinutes=null; t.endsAt=null; }
  } else if(b.durationMinutes!==undefined && tournamentEndMode(t)==='TIME'){
    const mins=Math.max(1,Math.floor(Number(b.durationMinutes)));
    if(!Number.isFinite(mins)||mins<1)return res.status(400).json({message:'Duration অন্তত 1 মিনিট হতে হবে।'});
    t.durationMinutes=mins;
    if(t.status!=='ENDED') t.endsAt=new Date(Date.parse(t.createdAt||now())+mins*60000).toISOString();
  }
  if((t.prizes||[]).length > Number(t.maxPlayers||0))return res.status(400).json({message:'Prize Distribution-এর Rank Max Players-এর বেশি হতে পারবে না।'});
  if((t.prizes||[]).reduce((a,x)=>a+x,0)>Number(t.prizePool||0))return res.status(400).json({message:'Prize Distribution-এর মোট টাকা Prize Pool-এর বেশি হতে পারবে না।'});
  if(b.status!==undefined){
    const nextStatus=String(b.status).toUpperCase()==='ACTIVE'?'ACTIVE':'INACTIVE';
    if(nextStatus==='ACTIVE' && t.status!=='ACTIVE'){
      t.startedAt=t.startedAt||now();
      if(tournamentEndMode(t)==='TIME') t.endsAt=new Date(Date.parse(t.startedAt)+Number(t.durationMinutes||0)*60000).toISOString();
    }
    t.status=nextStatus;
  }
  if(b.active!==undefined && b.status===undefined){
    const nextStatus=Boolean(b.active)?'ACTIVE':'INACTIVE';
    if(nextStatus==='ACTIVE' && t.status!=='ACTIVE'){
      t.startedAt=t.startedAt||now();
      if(tournamentEndMode(t)==='TIME') t.endsAt=new Date(Date.parse(t.startedAt)+Number(t.durationMinutes||0)*60000).toISOString();
    }
    t.status=nextStatus;
  }
  if(b.showOnHome!==undefined)t.showOnHome=Boolean(b.showOnHome); if(b.displayOrder!==undefined)t.displayOrder=Number(b.displayOrder)||0;
  t.registrationClosed=currentEntries.length>=Number(t.maxPlayers||0); t.updatedAt=now(); await saveDb(req.db); res.json({tournament:publicTournament(req.db,t)});
});
app.delete('/api/admin/tournaments/:id', auth, admin, async (req,res) => {
  const t=(req.db.tournaments||[]).find(x=>x.id===req.params.id); if(!t)return res.status(404).json({message:'Tournament not found.'});
  const pending=Array.isArray(t.payouts)&&t.payouts.some(p=>p.status==='PENDING');
  if(t.status!=='ENDED'){
    const used=(req.db.blockPuzzleMatches||[]).some(m=>m.tournamentId===t.id);
    if(used)return res.status(400).json({message:'যে Tournament-এ player আছে সেটি আগে শেষ করতে হবে।'});
  }
  if(pending || t.payoutStatus==='PENDING_APPROVAL') return res.status(400).json({message:'Prize Approval সম্পূর্ণ হওয়ার আগে Tournament delete করা যাবে না।'});
  req.db.tournaments=(req.db.tournaments||[]).filter(x=>x.id!==t.id); req.db.tournamentEntries=(req.db.tournamentEntries||[]).filter(x=>x.tournamentId!==t.id); await saveDb(req.db); res.json({ok:true});
});

app.post('/api/tournaments/:id/join', auth, async (req,res) => {
  try {
    const result=await withDbLock(async()=>{
      const db=await loadDb(); const t=(db.tournaments||[]).find(x=>x.id===req.params.id);
      if(!t)throw Object.assign(new Error('Tournament পাওয়া যায়নি।'),{statusCode:404});
      if(tournamentHasExpired(t)) { await finalizeTournamentInternal(db,t); await saveDb(db); throw Object.assign(new Error('Tournament-এর নির্ধারিত সময় শেষ হয়ে গেছে।'),{statusCode:400}); }
      if(t.status!=='ACTIVE')throw Object.assign(new Error('Tournament এখন আর Active নেই।'),{statusCode:400});
      const entries=ensureTournamentEntries(db,t);
      let entry=entries.find(e=>e.userId===req.user.id);
      if(!entry){
        if(entries.length>=Number(t.maxPlayers))throw Object.assign(new Error('Tournament Full হয়ে গেছে।'),{statusCode:400});
        entry={id:id('tentry'),tournamentId:t.id,userId:req.user.id,userName:req.user.name,entryNumber:entries.length+1,joinedAt:now(),entryFee:Number(t.entryFee||0),attempts:0,bestScore:0,bestScoreAt:null,lastMatchId:null};
        db.tournamentEntries.push(entry);
      }
      const active=(db.blockPuzzleMatches||[]).find(m=>m.tournamentId===t.id&&m.userId===req.user.id&&m.status==='PLAYING');
      if(active)return {t,session:active,db,charged:false};
      if(Number(req.user.gamingBalance)<Number(t.entryFee))throw Object.assign(new Error('অপর্যাপ্ত গেমিং ব্যালেন্স! দয়া করে ডিপোজিট করুন।'),{statusCode:400});
      const createdAt=now(), startsAt=createdAt;
      const session={id:id('bp'),gameSeed:crypto.randomInt(1,2147483646),moveIndex:0,liveState:null,liveUpdatedAt:null,userId:req.user.id,userName:req.user.name,userPhone:req.user.phone,entryFee:t.entryFee,prizeAmount:0,status:'PLAYING',createdAt,startsAt,gameStartedAt:startsAt,pendingUntil:null,refunded:false,tournamentId:t.id,tournamentEntryId:entry.id};
      req.user.gamingBalance=money(req.user.gamingBalance-t.entryFee); req.user.matchesPlayed=Number(req.user.matchesPlayed||0)+1; db.users=db.users.map(u=>u.id===req.user.id?req.user:u); db.blockPuzzleMatches=[session,...(db.blockPuzzleMatches||[])];
      entry.attempts=Number(entry.attempts||0)+1; entry.lastMatchId=session.id; entry.entryFee=Number(t.entryFee||0);
      t.registrationClosed=db.tournamentEntries.filter(e=>e.tournamentId===t.id).length>=Number(t.maxPlayers); t.updatedAt=now();
      db.transactions.unshift(makeTransaction(req.user.id,'match_loss',-t.entryFee,'Tournament Entry',`${t.name} • Entry #${entry.entryNumber} • Attempt #${entry.attempts}`,'match',{matchId:session.id,tournamentId:t.id,tournamentEntryId:entry.id,gameType:'block_puzzle_tournament'})); await saveDb(db); return {t,session,db,charged:true};
    });
    res.status(201).json({tournament:publicTournament(result.db,result.t,req.user.id),match:blockPuzzlePublicMatch(result.session,result.db),user:publicUser(result.db.users.find(u=>u.id===req.user.id)),charged:result.charged});
  } catch(err){res.status(err.statusCode||503).json({message:err?.message||'Tournament Join করা যায়নি।'});}
});

async function finalizeTournamentInternal(db,t) {
  if(t.status==='ENDED') return t.payouts||[];
  const entries=ensureTournamentEntries(db,t).filter(e=>Number(e.attempts||0)>0);
  const ranked=[...entries].sort((a,b)=>Number(b.bestScore||0)-Number(a.bestScore||0)||Date.parse(a.bestScoreAt||a.joinedAt||0)-Date.parse(b.bestScoreAt||b.joinedAt||0)||String(a.userId).localeCompare(String(b.userId)));
  const finalEntries=ranked.map((e,i)=>({rank:i+1,userId:e.userId,username:e.userName,score:Number(e.bestScore||0),attempts:Number(e.attempts||0),entryNumber:Number(e.entryNumber||0),prize:Number(t.prizes?.[i]||0)}));
  const payouts=finalEntries.filter(e=>e.prize>0).map(e=>({...e,status:'PENDING',approvedAt:null,approvedBy:null}));
  t.finalEntries=finalEntries; t.payouts=payouts; t.status='ENDED'; t.payoutStatus=payouts.length?'PENDING_APPROVAL':'NO_PRIZES'; t.finalizedAt=now(); t.registrationClosed=true; t.updatedAt=now(); return payouts;
}

async function approveTournamentPayoutsInternal(db,t,userIds=null) {
  if(t.status!=='ENDED') throw Object.assign(new Error('Tournament আগে শেষ হতে হবে।'),{statusCode:400});
  const ids=userIds ? new Set(userIds.map(String)) : null;
  const adminId='admin_1';
  const payouts=Array.isArray(t.payouts)?t.payouts:[];
  let approved=0;
  for(const p of payouts){
    if(p.status!=='PENDING') continue;
    if(ids && !ids.has(String(p.userId))) continue;
    if(Number(p.prize||0)<=0){ p.status='HELD'; continue; }
    const u=db.users.find(x=>x.id===p.userId);
    if(!u){ p.status='HELD'; p.holdReason='User not found'; continue; }
    u.winningBalance=money(Number(u.winningBalance||0)+Number(p.prize||0));
    u.totalWinnings=money(Number(u.totalWinnings||0)+Number(p.prize||0));
    p.status='PAID'; p.approvedAt=now(); p.approvedBy=adminId;
    db.transactions.unshift(makeTransaction(u.id,'tournament_win',Number(p.prize||0),'Tournament Prize',`${t.name} • Rank #${p.rank} • Admin Approved`,'tournament',{tournamentId:t.id,rank:p.rank,score:p.score}));
    approved++;
  }
  const pending=payouts.some(p=>p.status==='PENDING');
  const paid=payouts.filter(p=>p.status==='PAID').length;
  const held=payouts.filter(p=>p.status==='HELD').length;
  t.payoutStatus=pending?'PENDING_APPROVAL':(paid||held?'COMPLETED_REVIEW':'NO_PRIZES');
  t.updatedAt=now();
  return {approved,pending,paid,held,payouts};
}

app.post('/api/admin/tournaments/:id/finalize', auth, admin, async (req,res) => {
  try { const result=await withDbLock(async()=>{ const db=await loadDb(); const t=db.tournaments.find(x=>x.id===req.params.id); if(!t)throw Object.assign(new Error('Tournament not found.'),{statusCode:404}); if(t.status==='ENDED')return {t,db,payouts:t.payouts||[]}; const entries=ensureTournamentEntries(db,t); if(tournamentEndMode(t)==='PLAYER_LIMIT' && entries.length<Number(t.maxPlayers))throw Object.assign(new Error('Player Limit Mode-এ Tournament full হওয়ার আগে manual finalize করা যাবে না।'),{statusCode:400}); if(tournamentEndMode(t)==='TIME' && !tournamentHasExpired(t))throw Object.assign(new Error('Time Mode-এর নির্ধারিত সময় শেষ হওয়ার আগে finalize করা যাবে না।'),{statusCode:400}); const payouts=await finalizeTournamentInternal(db,t); await saveDb(db); return {t,db,payouts}; }); res.json({tournament:publicTournament(result.db,result.t),payouts:result.payouts}); }
  catch(err){res.status(err.statusCode||503).json({message:err?.message||'Tournament finalize করা যায়নি।'});}
});

app.post('/api/admin/tournaments/:id/payout-approval', auth, admin, async (req,res) => {
  try {
    const result=await withDbLock(async()=>{ const db=await loadDb(); const t=db.tournaments.find(x=>x.id===req.params.id); if(!t)throw Object.assign(new Error('Tournament not found.'),{statusCode:404}); const raw=req.body?.userIds; const userIds=Array.isArray(raw)?raw.map(String):null; const result=await approveTournamentPayoutsInternal(db,t,userIds); await saveDb(db); return {db,t,result}; });
    res.json({tournament:publicTournament(result.db,result.t),...result.result});
  } catch(err){res.status(err.statusCode||400).json({message:err?.message||'Prize approval করা যায়নি।'});}
});

app.post('/api/admin/tournaments/:id/hold-payout', auth, admin, async (req,res) => {
  try {
    const result=await withDbLock(async()=>{ const db=await loadDb(); const t=db.tournaments.find(x=>x.id===req.params.id); if(!t)throw Object.assign(new Error('Tournament not found.'),{statusCode:404}); const userId=String(req.body?.userId||''); if(!userId)throw Object.assign(new Error('Player নির্বাচন করুন।'),{statusCode:400}); const p=(t.payouts||[]).find(x=>String(x.userId)===userId&&x.status==='PENDING'); if(!p)throw Object.assign(new Error('Pending Prize পাওয়া যায়নি।'),{statusCode:404}); p.status='HELD'; p.holdReason=String(req.body?.reason||'Admin review / cheating suspicion').slice(0,200); p.heldAt=now(); p.heldBy='admin_1'; const pending=(t.payouts||[]).some(x=>x.status==='PENDING'); const paid=(t.payouts||[]).some(x=>x.status==='PAID'); t.payoutStatus=pending?'PENDING_APPROVAL':(paid?'COMPLETED_REVIEW':'COMPLETED_REVIEW'); t.updatedAt=now(); await saveDb(db); return {db,t}; });
    res.json({tournament:publicTournament(result.db,result.t)});
  } catch(err){res.status(err.statusCode||400).json({message:err?.message||'Prize hold করা যায়নি।'});}
});

app.get('/api/block-puzzle/leaderboard/active', auth, async (req, res) => {
  try {
    const db = await loadDb();
    const boards = db.leaderboards || [];
    let board = boards.filter(b => b.status === 'ACTIVE' && Date.parse(b.endsAt) > Date.now()).sort((a,b) => Date.parse(b.startsAt) - Date.parse(a.startsAt))[0];
    if (!board) board = boards.filter(b => Date.parse(b.endsAt) > Date.now()).sort((a,b) => Date.parse(b.startsAt) - Date.parse(a.startsAt))[0] || null;
    res.json({ leaderboard: publicLeaderboard(db, board) });
  } catch (err) { res.status(503).json({ message: err?.message || 'Leaderboard unavailable.' }); }
});

app.get('/api/block-puzzle/matches/active', auth, async (req, res) => {
  try {
    // Read-only endpoint: do not take the global write lock. Expiration is handled
    // by the player's own timer/submit flow and the cleanup job. This prevents a
    // background page refresh from blocking a new Pro Match start.
    const db = await loadDb();
    const match = (db.blockPuzzleMatches || []).find(m => m.userId === req.user.id && ['PENDING','PLAYING','SUBMITTED'].includes(m.status));
    res.json({ match: blockPuzzlePublicMatch(match, db) });
  } catch (err) { res.status(503).json({ message: err?.message || 'Matchmaking unavailable.' }); }
});

app.post('/api/block-puzzle/matches/start', auth, async (req, res) => {
  try {
    const result = await withDbLock(async () => {
      const db = await loadDb();
      await expireBlockPuzzleMatches(db);
      const requestedGameType = safeText(req.body?.gameType || 'block_puzzle', 40).toLowerCase();
      const gameType = requestedGameType === 'nut_sort' ? 'nut_sort' : 'block_puzzle';
      const entryFee = money(Number(req.body?.entryFee));
      const requestedPlayerCount = Math.floor(Number(req.body?.playerCount || 2));
      // 2-player remains the legacy/default duel. Any configured multiplayer count >=3 is allowed.
      const playerCount = requestedPlayerCount >= 3 && requestedPlayerCount <= 1000 ? requestedPlayerCount : 2;
      if (!Number.isFinite(entryFee) || !Number.isInteger(entryFee) || entryFee <= 0) throw Object.assign(new Error('Invalid Block Puzzle entry fee.'), { statusCode: 400 });
      const requestedPrize = money(Math.max(0, Number(req.body?.prizeAmount) || 0));
      const configuredFees = proMatchFees(db);
      const feeIndex = configuredFees.findIndex(fee => Math.abs(fee - entryFee) < 0.000001);
      let prizeAmount;
      let prizeDistribution = [];
      if (gameType === 'nut_sort') {
        const game = (db.games || []).find(g => g.gameType === 'nut_sort');
        if (!game || game.active === false) throw Object.assign(new Error('Nut Sort বর্তমানে Active নয়।'), { statusCode: 409 });
        const gameFee = money(Number(game.entryFee || 0));
        const gamePrize = money(Number(game.prizeAmount || 0));
        if (gameFee <= 0 || Math.abs(gameFee - entryFee) > 0.000001) throw Object.assign(new Error('Nut Sort-এর Entry Fee বর্তমানে Admin সেটিংসের সাথে মিলছে না।'), { statusCode: 400 });
        prizeAmount = gamePrize > 0 ? gamePrize : requestedPrize;
        if (prizeAmount <= 0) throw Object.assign(new Error('Nut Sort Prize সেট করা নেই।'), { statusCode: 400 });
      } else if (playerCount > 2) {
        const config = multiplayerProMatchConfig(db, playerCount);
        if (!config || config.active === false) throw Object.assign(new Error(`${playerCount} Players Pro Match বর্তমানে Active নয়।`), { statusCode: 409 });
        const configuredEntry = money(Number(config.entryFee || 0));
        if (configuredEntry <= 0 || Math.abs(configuredEntry - entryFee) > 0.000001) throw Object.assign(new Error(`${playerCount} Players Pro Match-এর Entry Fee Admin সেটিংসের সাথে মিলছে না।`), { statusCode: 400 });
        prizeDistribution = multiplayerPrizes(config);
        if (!prizeDistribution.length) throw Object.assign(new Error(`${playerCount} Players Pro Match-এর Prize Distribution সেট করা নেই।`), { statusCode: 400 });
        const maxWinners = Math.min(playerCount, prizeDistribution.length);
        if (prizeDistribution.length > playerCount) throw Object.assign(new Error('Prize winners Player Count-এর বেশি হতে পারবে না।'), { statusCode: 400 });
        if (prizeDistribution.reduce((a,x)=>a+x,0) > money(entryFee * playerCount)) throw Object.assign(new Error('Prize Distribution-এর মোট টাকা Match-এর মোট Entry Fee-এর বেশি হতে পারবে না।'), { statusCode: 400 });
        prizeDistribution = prizeDistribution.slice(0, maxWinners);
        prizeAmount = prizeDistribution[0];
      } else {
        prizeAmount = feeIndex >= 0 ? PRO_MATCH_PRIZES[feeIndex] : null;
        prizeDistribution = prizeAmount > 0 ? [prizeAmount] : [];
        if (prizeAmount == null || prizeAmount <= 0) throw Object.assign(new Error('এই Pro Match entry fee বর্তমানে উপলব্ধ নয়।'), { statusCode: 400 });
      }
      if (Number(req.user.gamingBalance) < entryFee) throw Object.assign(new Error('অপর্যাপ্ত গেমিং ব্যালেন্স! দয়া করে ডিপোজিট করুন।'), { statusCode: 400 });

      // Pro Match starts immediately after the entry fee is accepted. The opponent
      // can join later (up to 24 hours) and play the same deterministic game seed
      // against the stored score.
      const createdAt = now();
      const gameStartedAt = createdAt;
      const pendingUntil = new Date(Date.parse(createdAt) + BP_PENDING_MS).toISOString();
      const session = {
        id: id('bp'),
        gameType,
        gameSeed: crypto.randomInt(1, 2147483646),
        moveIndex: 0,
        liveState: null,
        liveUpdatedAt: null,
        userId: req.user.id, userName: req.user.name, userPhone: req.user.phone,
        entryFee, prizeAmount, prizeDistribution, playerCount, status: 'PLAYING', createdAt, startsAt: gameStartedAt, gameStartedAt,
        pendingUntil, refunded: false
      };
      req.user.gamingBalance = money(req.user.gamingBalance - entryFee);
      req.user.matchesPlayed = Number(req.user.matchesPlayed || 0) + 1;
      db.users = db.users.map(u => u.id === req.user.id ? req.user : u);
      db.blockPuzzleMatches = [session, ...(db.blockPuzzleMatches || [])];
      db.transactions.unshift(makeTransaction(req.user.id, 'match_loss', -entryFee, `${gameType === 'nut_sort' ? 'Nut Sort' : 'Block Puzzle'} Entry`, `${gameType === 'nut_sort' ? 'Nut Sort 1v1' : 'Block Puzzle'} • Match #${session.id.slice(-6)}`, 'match', { matchId: session.id, gameType }));

      const join = findJoinableBlockPuzzleMatch(db, session, entryFee, prizeAmount, playerCount, gameType);
      if (join) {
        const target = join.target;
        const groupId = target.duelId || id('bpgroup');
        // Always include the target itself. For a fresh solo target there is no
        // duelId yet, so the old code accidentally created a group containing
        // only the newly-created session and left the real opponent unpaired.
        const existingMembers = target.duelId
          ? db.blockPuzzleMatches.filter(m => m.duelId === groupId && !m.refunded && m.status !== 'COMPLETED')
          : [target];
        const allMembers = [...existingMembers.filter(m => m.id !== session.id), session];
        const sharedSeed = Number(target.gameSeed) || session.gameSeed;
        const full = allMembers.length >= playerCount;
        for (const member of allMembers) {
          member.duelId = groupId;
          member.playerCount = playerCount;
          member.gameSeed = sharedSeed;
          member.matchedAt = member.matchedAt || now();
          member.pendingUntil = member.pendingUntil || new Date(Date.now() + BP_PENDING_MS).toISOString();
        }
        if (full) {
          const sharedStart = now();
          const mergedLive = { players: {}, updatedAt: sharedStart };
          for (const member of allMembers) {
            // A player who already completed their asynchronous attempt stays
            // SUBMITTED; only newly joined players need an active 3-minute run.
            const alreadySubmitted = member.status === 'SUBMITTED' || Boolean(member.submittedAt && Number(member.score || 0) >= 0 && member.gameEndedAt);
            if (!alreadySubmitted) {
              member.status = 'PLAYING';
              // Never restart a player who is already in the middle of their
              // 3-minute attempt. Only a newly joined/unstarted member gets
              // the current match start timestamp.
              member.gameStartedAt = member.gameStartedAt || sharedStart;
              member.startsAt = member.startsAt || member.gameStartedAt;
            }
            member.gameSeed = sharedSeed;
            mergedLive.players[member.userId] = {
              board: emptyBoard(),
              score: Number(member.score || 0),
              linesCleared: Number(member.linesCleared || 0),
              combo: 0,
              streak: 0,
              moveIndex: Number(member.moveIndex || 0)
            };
          }
          for (const member of allMembers) {
            const opponent = allMembers.find(x => x.userId !== member.userId);
            member.opponentUserId = opponent?.userId || null;
            member.liveState = mergedLive;
          }
        } else {
          // Every paid player gets their own 3-minute attempt immediately.
          // The group remains open until the configured player count is filled;
          // already-playing members continue playing, and already-submitted
          // members keep their submitted score. A later player can therefore
          // join this open group without restarting anyone's game.
          for (const member of allMembers) {
            if (member.status !== 'SUBMITTED') {
              member.status = 'PLAYING';
              member.gameStartedAt = member.gameStartedAt || member.createdAt || now();
              member.startsAt = member.startsAt || member.gameStartedAt;
            }
            member.gameSeed = sharedSeed;
            member.liveState = null;
          }
        }
      }
      await saveDb(db);
      return { session, db };
    });
    res.status(201).json({ match: blockPuzzlePublicMatch(result.session, result.db), user: publicUser(result.db.users.find(u => u.id === req.user.id)) });
  } catch (err) { res.status(err.statusCode || 503).json({ message: err?.message || 'ম্যাচ শুরু করা যায়নি।' }); }
});

app.get('/api/cron/expire-pending', async (req, res) => {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const changed = await withDbLock(async () => {
      const db = await loadDb();
      const didChange = await expireBlockPuzzleMatches(db);
      if (didChange) await saveDb(db);
      return didChange;
    });
    res.json({ ok: true, changed });
  } catch (err) {
    res.status(503).json({ message: err?.message || 'Pending match cleanup unavailable.' });
  }
});

app.post('/api/match-disputes', auth, async (req, res) => {
  try {
    const b = req.body || {};
    const matchId = safeText(b.matchId, 120);
    const problemType = safeText(b.problemType, 80);
    const details = safeText(b.details, 1200);
    const allowedTypes = new Set(['NETWORK', 'GAME_LOAD', 'AUTO_ABORT', 'SCORE', 'SERVER_ERROR', 'OTHER']);
    if (!matchId || !allowedTypes.has(problemType)) return res.status(400).json({ message: 'Match ID and problem type are required.' });
    if (!details) return res.status(400).json({ message: 'সমস্যার বিস্তারিত লিখুন।' });
    const match = (req.db.blockPuzzleMatches || []).find(m => String(m.id) === matchId && String(m.userId) === String(req.user.id));
    if (!match) return res.status(404).json({ message: 'Match পাওয়া যায়নি।' });
    const disputes = Array.isArray(req.db.matchDisputes) ? req.db.matchDisputes : [];
    const existing = disputes.find(d => String(d.matchId) === matchId && String(d.userId) === String(req.user.id) && ['OPEN','UNDER_REVIEW'].includes(String(d.status || '').toUpperCase()));
    if (existing) return res.status(409).json({ message: 'এই Match-এর একটি অভিযোগ ইতিমধ্যে খোলা আছে।', dispute: existing });
    const dispute = {
      id: id('dispute'), matchId, userId: req.user.id, userName: req.user.name,
      opponentUserId: match.opponentUserId || null, problemType, details,
      matchStatus: String(match.status || ''), matchScore: match.score == null ? null : Number(match.score),
      entryFee: Number(match.entryFee || 0), createdAt: now(), status: 'OPEN', adminNote: '', resolvedAt: null,
    };
    req.db.matchDisputes = [dispute, ...disputes];
    await saveDbPartial(req.db, ['matchDisputes']);
    res.status(201).json({ dispute });
  } catch (err) { res.status(503).json({ message: err?.message || 'Complaint submit করা যায়নি।' }); }
});

app.get('/api/admin/match-disputes', auth, admin, async (req, res) => {
  try {
    const db = await loadDb();
    const disputes = Array.isArray(db.matchDisputes) ? db.matchDisputes : [];
    const users = Array.isArray(db.users) ? db.users : [];
    const matches = Array.isArray(db.blockPuzzleMatches) ? db.blockPuzzleMatches : [];
    const items = disputes.map(d => {
      const match = matches.find(m => String(m.id) === String(d.matchId));
      const user = users.find(u => String(u.id) === String(d.userId));
      const opp = users.find(u => String(u.id) === String(d.opponentUserId));
      return { ...d, playerName: user?.name || d.userName || 'Player', playerPhone: user?.phone || '', opponentName: opp?.name || 'Opponent', liveMatchStatus: match?.status || d.matchStatus, liveScore: match?.score == null ? d.matchScore : Number(match.score) };
    });
    res.json({ disputes: items });
  } catch (err) { res.status(503).json({ message: err?.message || 'Match disputes unavailable.' }); }
});

app.patch('/api/admin/match-disputes/:id', auth, admin, async (req, res) => {
  try {
    const status = safeText(req.body?.status, 30).toUpperCase();
    if (!['RESOLVED','REJECTED'].includes(status)) return res.status(400).json({ message: 'Invalid dispute status.' });
    const disputes = Array.isArray(req.db.matchDisputes) ? req.db.matchDisputes : [];
    const dispute = disputes.find(d => String(d.id) === String(req.params.id));
    if (!dispute) return res.status(404).json({ message: 'Complaint পাওয়া যায়নি।' });
    dispute.status = status;
    dispute.adminNote = safeText(req.body?.adminNote, 1000);
    dispute.resolvedAt = now();
    dispute.resolvedBy = req.user.id;
    req.db.matchDisputes = disputes;
    await saveDbPartial(req.db, ['matchDisputes']);
    res.json({ dispute });
  } catch (err) { res.status(503).json({ message: err?.message || 'Complaint update করা যায়নি।' }); }
});

app.get('/api/support-chat', auth, async (req, res) => {
  try {
    const chats = Array.isArray(req.db.supportChats) ? req.db.supportChats : [];
    const chat = chats.find(c => String(c.userId) === String(req.user.id)) || null;
    // IMPORTANT: this is a read/poll endpoint. Never persist an unread-counter
    // change here because req.db may be an older snapshot than a concurrent
    // admin reply/user message. Saving that stale snapshot can overwrite newer
    // support messages. Return a copy with the user's unread badge cleared.
    const responseChat = chat ? { ...chat, unreadForUser: 0 } : null;
    res.json({ chat: responseChat });
  } catch (err) { res.status(503).json({ message: err?.message || 'Support chat unavailable.' }); }
});

app.post('/api/support-chat/messages', auth, async (req, res) => {
  try {
    const message = safeText(req.body?.message, 2000);
    if (!message) return res.status(400).json({ message: 'Message লিখুন।' });
    const chats = Array.isArray(req.db.supportChats) ? req.db.supportChats : [];
    let chat = chats.find(c => String(c.userId) === String(req.user.id));
    if (!chat) {
      chat = { id: id('support'), userId: req.user.id, userName: req.user.name, userPhone: req.user.phone, status: 'OPEN', createdAt: now(), updatedAt: now(), unreadForUser: 0, unreadForAdmin: 0, messages: [] };
      chats.unshift(chat);
    }
    chat.status = 'OPEN'; chat.updatedAt = now(); chat.userName = req.user.name; chat.userPhone = req.user.phone;
    chat.messages = Array.isArray(chat.messages) ? chat.messages : [];
    chat.messages.push({ id: id('msg'), senderType: 'USER', senderId: req.user.id, message, createdAt: now() });
    chat.unreadForAdmin = Number(chat.unreadForAdmin || 0) + 1; chat.unreadForUser = 0;
    req.db.supportChats = chats;
    await saveDbPartial(req.db, ['supportChats']);
    res.status(201).json({ chat });
  } catch (err) { res.status(503).json({ message: err?.message || 'Message পাঠানো যায়নি।' }); }
});

app.post('/api/support-chat/close', auth, async (req, res) => {
  try {
    const chats = Array.isArray(req.db.supportChats) ? req.db.supportChats : [];
    const chat = chats.find(c => String(c.userId) === String(req.user.id));
    if (!chat) return res.status(404).json({ message: 'Support chat পাওয়া যায়নি।' });
    chat.status = 'CLOSED'; chat.updatedAt = now();
    req.db.supportChats = chats;
    await saveDbPartial(req.db, ['supportChats']);
    res.json({ chat });
  } catch (err) { res.status(503).json({ message: err?.message || 'Chat বন্ধ করা যায়নি।' }); }
});

app.get('/api/admin/support-chats', auth, admin, async (req, res) => {
  try {
    const db = await loadDb();
    const chats = Array.isArray(db.supportChats) ? db.supportChats : [];
    // IMPORTANT: this is a read/poll endpoint. Do not save unread-counter
    // changes from this GET. A concurrent player/admin message could be written
    // after this snapshot was loaded; persisting the stale snapshot here can
    // make newer messages appear to be deleted.
    const responseChats = chats.map(c => ({
      ...c,
      messages: Array.isArray(c.messages) ? c.messages : [],
      unreadForAdmin: 0,
      unreadForUser: Number(c.unreadForUser || 0)
    })).sort((a,b) => Date.parse(b.updatedAt || b.createdAt || 0) - Date.parse(a.updatedAt || a.createdAt || 0));
    res.json({ chats: responseChats });
  } catch (err) { res.status(503).json({ message: err?.message || 'Support chats unavailable.' }); }
});

app.post('/api/admin/support-chats/:id/messages', auth, admin, async (req, res) => {
  try {
    const message = safeText(req.body?.message, 2000);
    if (!message) return res.status(400).json({ message: 'Reply লিখুন।' });
    const chats = Array.isArray(req.db.supportChats) ? req.db.supportChats : [];
    const chat = chats.find(c => String(c.id) === String(req.params.id));
    if (!chat) return res.status(404).json({ message: 'Support chat পাওয়া যায়নি।' });
    chat.status = 'OPEN'; chat.updatedAt = now(); chat.messages = Array.isArray(chat.messages) ? chat.messages : [];
    chat.messages.push({ id: id('msg'), senderType: 'ADMIN', senderId: req.user.id, senderName: req.user.name, message, createdAt: now() });
    chat.unreadForUser = Number(chat.unreadForUser || 0) + 1; chat.unreadForAdmin = 0;
    req.db.supportChats = chats;
    await saveDbPartial(req.db, ['supportChats']);
    res.status(201).json({ chat });
  } catch (err) { res.status(503).json({ message: err?.message || 'Reply পাঠানো যায়নি।' }); }
});

app.patch('/api/admin/support-chats/:id', auth, admin, async (req, res) => {
  try {
    const status = safeText(req.body?.status, 20).toUpperCase();
    if (!['OPEN','CLOSED'].includes(status)) return res.status(400).json({ message: 'Invalid chat status.' });
    const chats = Array.isArray(req.db.supportChats) ? req.db.supportChats : [];
    const chat = chats.find(c => String(c.id) === String(req.params.id));
    if (!chat) return res.status(404).json({ message: 'Support chat পাওয়া যায়নি।' });
    chat.status = status; chat.updatedAt = now();
    req.db.supportChats = chats;
    await saveDbPartial(req.db, ['supportChats']);
    res.json({ chat });
  } catch (err) { res.status(503).json({ message: err?.message || 'Chat status update করা যায়নি।' }); }
});

app.get('/api/history', async (req, res) => {
  try {
    const authHeader = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const payload = readToken(authHeader);
    if (!payload?.userId) return res.status(401).json({ message: 'Unauthorized' });

    const db = await loadHistoryDb();
    const uid = String(payload.userId);
    const user = (db.users || []).find(u => String(u.id) === uid);
    if (!user) return res.status(403).json({ message: 'Account unavailable' });

    const items = [];
    const matches = Array.isArray(db.blockPuzzleMatches) ? db.blockPuzzleMatches : [];
    const tournaments = Array.isArray(db.tournaments) ? db.tournaments : [];
    const entries = Array.isArray(db.tournamentEntries) ? db.tournamentEntries : [];
    const users = Array.isArray(db.users) ? db.users : [];

    for (const m of matches) {
      if (String(m.userId) !== uid) continue;
      if (m.refunded && String(m.status).toUpperCase() !== 'REFUNDED') continue;
      const tournament = m.tournamentId ? tournaments.find(t => String(t.id) === String(m.tournamentId)) : null;
      let opponentMatch = m.opponentUserId
        ? matches.find(x => String(x.userId) === String(m.opponentUserId) && (!m.duelId || String(x.duelId) === String(m.duelId)) && !x.refunded)
        : null;
      if (!opponentMatch && m.duelId) {
        opponentMatch = matches.find(x => String(x.duelId) === String(m.duelId) && String(x.userId) !== uid && !x.refunded);
      }
      const opponent = opponentMatch ? users.find(u => String(u.id) === String(opponentMatch.userId)) : null;
      items.push({
        id: String(m.id), matchId: String(m.id),
        type: tournament ? 'TOURNAMENT_MATCH' : 'PRO_MATCH',
        gameType: String(m.gameType || 'block_puzzle'),
        title: tournament?.name || (m.gameType === 'nut_sort' ? 'Nut Sort 1v1' : 'Pro Match'),
        status: String(m.status || ''), outcome: m.outcome || null,
        entryFee: Number(m.entryFee || 0), prizeAmount: Number(m.prizeAmount || 0),
        score: m.score == null ? null : Number(m.score),
        linesCleared: Number(m.linesCleared || 0), bestCombo: Number(m.bestCombo || 0),
        playerCount: Number(m.playerCount || 2),
        opponent: opponentMatch ? {
          userId: opponentMatch.userId,
          name: opponentMatch.userName || opponent?.name || 'Opponent',
          score: opponentMatch.score == null ? null : Number(opponentMatch.score),
          linesCleared: Number(opponentMatch.linesCleared || 0),
          bestCombo: Number(opponentMatch.bestCombo || 0),
        } : null,
        createdAt: m.createdAt || null, submittedAt: m.submittedAt || null, settledAt: m.settledAt || null,
        tournamentId: m.tournamentId || null, refunded: Boolean(m.refunded),
      });
    }

    for (const t of tournaments) {
      if (String(t.status).toUpperCase() !== 'ACTIVE') continue;
      const e = entries.find(x => String(x.tournamentId) === String(t.id) && String(x.userId) === uid);
      if (!e) continue;
      const hasSession = matches.some(m => String(m.tournamentId) === String(t.id) && String(m.userId) === uid && ['PENDING','PLAYING','SUBMITTED'].includes(String(m.status).toUpperCase()));
      if (hasSession) continue;
      items.push({
        id: `tournament_${t.id}_${uid}`, matchId: `tournament_${t.id}_${uid}`,
        type: 'TOURNAMENT', gameType: 'block_puzzle_tournament', title: t.name || 'Tournament',
        status: 'PENDING', entryFee: Number(t.entryFee || 0), prizeAmount: Number(t.prizePool || 0),
        score: Number(e.bestScore || 0), attempts: Number(e.attempts || 0),
        createdAt: e.joinedAt || t.createdAt || null, tournamentId: t.id,
      });
    }

    for (const m of (db.matches || [])) {
      const player = (m.joinedPlayers || []).find(p => String(p.userId) === uid);
      if (!player) continue;
      items.push({
        id: String(m.id), matchId: String(m.id), type: 'MATCH', gameType: String(m.category || 'match'),
        title: m.title || `Match #${m.matchNo || m.id}`, status: String(m.status || 'open').toUpperCase(),
        entryFee: Number(m.entryFee || 0), prizeAmount: Number(m.totalPrize || 0), score: Number(player.score || 0),
        createdAt: m.createdAt || null, matchNo: m.matchNo || null,
      });
    }

    for (const m of (db.arcadeMatches || [])) {
      if (!(m.players || []).some(p => String(p.userId) === uid)) continue;
      const mine = (m.players || []).find(p => String(p.userId) === uid);
      const opp = (m.players || []).find(p => String(p.userId) !== uid);
      items.push({
        id: String(m.id), matchId: String(m.id), type: 'ARCADE_MATCH', gameType: String(m.gameType || 'online'),
        title: String(m.gameType || 'Online Match').toUpperCase(), status: String(m.status || '').toUpperCase(),
        entryFee: Number(m.entryFee || 0), prizeAmount: Number(m.prizeAmount || 0), score: Number(mine?.score || 0),
        opponent: opp ? { name: opp.name || 'Opponent', score: Number(opp.score || 0) } : null,
        createdAt: m.createdAt || null,
      });
    }

    items.sort((a, b) => (Date.parse(b.settledAt || b.createdAt || '') || 0) - (Date.parse(a.settledAt || a.createdAt || '') || 0));
    res.json({ items });
  } catch (err) {
    res.status(503).json({ message: err?.message || 'History unavailable.' });
  }
});

app.get('/api/pending-games', auth, async (req, res) => {
  try {
    // Read-only pending list: do not acquire the global write lock here.
    // This endpoint is polled frequently by the frontend; locking it caused
    // unnecessary contention with Pro Match start/submit operations.
    const db = await loadDb();
    const items = [];
    const uid = String(req.user.id);

    // Block Puzzle / Pro Match sessions owned by this player. Keep completed
    // duels in this same history feed so an older pending match does not vanish
    // after the opponent joins and the result is settled.
    for (const m of (db.blockPuzzleMatches || [])) {
      if (String(m.userId) !== uid) continue;
      if (m.refunded || !['PENDING','PLAYING','SUBMITTED','COMPLETED'].includes(String(m.status))) continue;
      const tournament = m.tournamentId ? (db.tournaments || []).find(t => t.id === m.tournamentId) : null;
      let opponent = null;
      if (m.duelId) {
        const opp = (db.blockPuzzleMatches || []).find(x => x.duelId === m.duelId && String(x.userId) !== uid && !x.refunded);
        const oppUser = opp ? (db.users || []).find(u => String(u.id) === String(opp.userId)) : null;
        if (opp) opponent = { name: opp.userName || oppUser?.name || 'Opponent', score: opp.score == null ? null : Number(opp.score || 0), status: String(opp.status || '') };
      }
      items.push({
        id: String(m.id), type: tournament ? 'TOURNAMENT_MATCH' : 'PRO_MATCH',
        gameType: String(m.gameType || 'block_puzzle'), title: tournament?.name || (m.gameType === 'nut_sort' ? 'Nut Sort 1v1' : 'Pro Match'),
        status: String(m.status), outcome: m.outcome || null,
        entryFee: Number(m.entryFee || 0), prizeAmount: Number(m.prizeAmount || 0),
        score: Number(m.score || 0), linesCleared: Number(m.linesCleared || 0), bestCombo: Number(m.bestCombo || 0),
        opponent, createdAt: m.createdAt || null, submittedAt: m.submittedAt || null, settledAt: m.settledAt || null,
        matchId: String(m.id), tournamentId: m.tournamentId || null,
      });
    }

    // Tournament registration itself is also a pending item until the tournament ends.
    for (const t of (db.tournaments || [])) {
      if (t.status !== 'ACTIVE') continue;
      const e = (db.tournamentEntries || []).find(x => x.tournamentId === t.id && String(x.userId) === uid);
      if (!e) continue;
      const hasSession = (db.blockPuzzleMatches || []).some(m => m.tournamentId === t.id && String(m.userId) === uid && ['PENDING','PLAYING','SUBMITTED'].includes(String(m.status)));
      if (hasSession) continue;
      items.push({
        id: `tournament_${t.id}_${uid}`, type: 'TOURNAMENT', gameType: 'block_puzzle_tournament',
        title: t.name, status: 'PENDING', entryFee: Number(t.entryFee || 0), prizeAmount: Number(t.prizePool || 0),
        score: Number(e.bestScore || 0), attempts: Number(e.attempts || 0),
        createdAt: e.joinedAt || t.createdAt || null, tournamentId: t.id,
      });
    }

    // Other scheduled/admin-created matches joined by this player.
    for (const m of (db.matches || [])) {
      const player = (m.joinedPlayers || []).find(p => String(p.userId) === uid);
      if (!player) continue;
      if (['completed','cancelled'].includes(String(m.status).toLowerCase())) continue;
      items.push({
        id: String(m.id), type: 'MATCH', gameType: String(m.category || 'match'),
        title: m.title || `Match #${m.matchNo || m.id}`, status: String(m.status || 'open').toUpperCase(),
        entryFee: Number(m.entryFee || 0), prizeAmount: Number(m.totalPrize || 0),
        score: Number(player.score || 0), opponent: null, createdAt: m.createdAt || null,
        matchId: String(m.id), matchNo: m.matchNo || null,
      });
    }

    // Pool / Carrom online matches.
    for (const m of (db.arcadeMatches || [])) {
      if (!(m.players || []).some(p => String(p.userId) === uid)) continue;
      if (!['WAITING','PLAYING'].includes(String(m.status))) continue;
      const mine = (m.players || []).find(p => String(p.userId) === uid);
      const opp = (m.players || []).find(p => String(p.userId) !== uid);
      items.push({
        id: String(m.id), type: 'ARCADE_MATCH', gameType: String(m.gameType || 'online'),
        title: String(m.gameType || 'Online Match').toUpperCase(), status: String(m.status),
        entryFee: Number(m.entryFee || 0), prizeAmount: Number(m.prizeAmount || 0),
        score: Number(mine?.score || 0), opponent: opp ? { name: opp.name, score: Number(opp.score || 0) } : null,
        createdAt: m.createdAt || null, matchId: String(m.id),
      });
    }

      items.sort((a,b) => (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0));
      return items;
    res.json({ items });
  } catch (err) {
    res.status(503).json({ message: err?.message || 'Pending games unavailable.' });
  }
});

app.get('/api/block-puzzle/matches/mine', auth, async (req, res) => {
  try {
    // Read-only: match history polling must never contend with the write lock.
    const db = await loadDb();
    const matches = (db.blockPuzzleMatches || [])
      .filter(m => m.userId === req.user.id)
      .sort((a, b) => (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0))
      .map(m => blockPuzzlePublicMatch(m, db));
    res.json({ matches });
  } catch (err) { res.status(503).json({ message: err?.message || 'Block Puzzle match history unavailable.' }); }
});

app.get('/api/block-puzzle/matches/:id/status', auth, async (req, res) => {
  try {
    // Read-only polling endpoint. Do not expire/settle or save here; doing so on
    // every 1.5s poll made the legacy global lock a bottleneck on Vercel.
    const db = await loadDb();
    const session = (db.blockPuzzleMatches || []).find(m => m.id === req.params.id && m.userId === req.user.id);
    if (!session) return res.json({ match: null, user: publicUser(db.users.find(u => u.id === req.user.id)) });
    res.json({ match: blockPuzzlePublicMatch(session, db), user: publicUser(db.users.find(u => u.id === req.user.id)) });
  } catch (err) { res.status(503).json({ message: err?.message || 'Match status unavailable.' }); }
});

app.post('/api/block-puzzle/matches/:id/pause', auth, async (req, res) => {
  try {
    const result = await withDbLock(async () => {
      const db = await loadDb();
      const user = req.user || (db.users || []).find(u => u.id === req.authUserId);
      if (!user || user.isBanned) throw Object.assign(new Error('Account unavailable'), { statusCode: 403 });
      req.user = user;
      req.db = db;
      const session = (db.blockPuzzleMatches || []).find(m => m.id === req.params.id && m.userId === user.id);
      if (!session) throw Object.assign(new Error('Block Puzzle match not found.'), { statusCode: 404 });
      if (!['PLAYING'].includes(session.status)) throw Object.assign(new Error('এই ম্যাচটি এখন Pause করা যাবে না।'), { statusCode: 409 });
      if (session.pauseStartedAt) return { match: blockPuzzlePublicMatch(session, db), user: db.users.find(u => u.id === req.user.id) };
      const startedMs = Date.parse(session.gameStartedAt || session.startsAt || session.createdAt || '');
      if (!Number.isFinite(startedMs) || startedMs + BP_GAME_MS <= Date.now()) throw Object.assign(new Error('ম্যাচের সময় শেষ হয়ে গেছে।'), { statusCode: 409 });
      session.pauseStartedAt = now();
      session.paused = true;
      await saveDb(db);
      return { match: blockPuzzlePublicMatch(session, db), user: db.users.find(u => u.id === req.user.id) };
    });
    res.json({ match: result.match, user: publicUser(result.user) });
  } catch (err) { res.status(err.statusCode || 503).json({ message: err?.message || 'ম্যাচ Pause করা যায়নি।' }); }
});

app.post('/api/block-puzzle/matches/:id/resume', auth, async (req, res) => {
  try {
    const result = await withDbLock(async () => {
      const db = await loadDb();
      const session = (db.blockPuzzleMatches || []).find(m => m.id === req.params.id && m.userId === req.user.id);
      if (!session) throw Object.assign(new Error('Block Puzzle match not found.'), { statusCode: 404 });
      if (session.status !== 'PLAYING') throw Object.assign(new Error('এই ম্যাচটি এখন Resume করা যাবে না।'), { statusCode: 409 });
      if (!session.pauseStartedAt) return { match: blockPuzzlePublicMatch(session, db), user: db.users.find(u => u.id === req.user.id) };
      const pausedMs = Math.max(0, Date.now() - Date.parse(session.pauseStartedAt));
      const baseMs = Date.parse(session.gameStartedAt || session.startsAt || session.createdAt || '');
      if (!Number.isFinite(baseMs)) throw Object.assign(new Error('ম্যাচের সময় তথ্য পাওয়া যায়নি।'), { statusCode: 409 });
      // Move the server deadline forward by the exact paused duration. The
      // player therefore keeps the unused portion of the original 3 minutes.
      session.gameStartedAt = new Date(baseMs + pausedMs).toISOString();
      session.startsAt = session.gameStartedAt;
      session.pauseStartedAt = null;
      session.paused = false;
      await saveDb(db);
      return { match: blockPuzzlePublicMatch(session, db), user: db.users.find(u => u.id === req.user.id) };
    });
    res.json({ match: result.match, user: publicUser(result.user) });
  } catch (err) { res.status(err.statusCode || 503).json({ message: err?.message || 'ম্যাচ Resume করা যায়নি।' }); }
});

app.post('/api/block-puzzle/matches/:id/submit', async (req, res) => {
  try {
    // Validate the signed token without doing the old full-database auth read.
    // The score write itself verifies the user atomically against MongoDB.
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const payload = readToken(token);
    if (!payload?.userId) return res.status(401).json({ message: 'Unauthorized' });

    const score = Number(req.body?.score || 0);
    const linesCleared = Number(req.body?.linesCleared || 0);
    const bestCombo = Number(req.body?.bestCombo || 0);
    const fast = await submitBlockPuzzleScoreFast(req.params.id, payload.userId, score, linesCleared, bestCombo);
    if (!fast.ok) return res.status(fast.statusCode || 503).json({ message: fast.message });

    // A normal solo/matchmaking submission is now complete after the atomic
    // score write. Multiplayer/tournament settlement keeps the existing lock
    // and payout logic, but only runs when it is actually required.
    let result;
    if (fast.needsSettlement) {
      result = await withDbLock(async () => {
        const db = await loadDb();
        const session = (db.blockPuzzleMatches || []).find(m => m.id === req.params.id && m.userId === payload.userId);
        if (!session) throw Object.assign(new Error('Block Puzzle match not found.'), { statusCode: 404 });
        if (session.tournamentId) {
          session.status = 'COMPLETED';
          session.outcome = 'TOURNAMENT';
          session.settledAt = session.settledAt || now();
          const t = (db.tournaments || []).find(x => x.id === session.tournamentId);
          if (t && t.status === 'ACTIVE') {
            const entries = ensureTournamentEntries(db, t);
            const entry = entries.find(e => e.userId === session.userId);
            if (entry) {
              entry.attempts = Math.max(Number(entry.attempts || 0), (db.blockPuzzleMatches || []).filter(m => m.tournamentId === t.id && m.userId === session.userId).length);
              if (Number(session.score || 0) >= Number(entry.bestScore || 0)) { entry.bestScore = Number(session.score || 0); entry.bestScoreAt = session.submittedAt || now(); entry.lastMatchId = session.id; }
            }
            const lastPlayer = entries.find(e => Number(e.entryNumber) === Number(t.maxPlayers));
            if (entries.length >= Number(t.maxPlayers) && lastPlayer && lastPlayer.userId === session.userId) await finalizeTournamentInternal(db, t);
          }
        }
        if (session.duelId) await settleBlockPuzzleDuel(db, session.duelId);
        maybeAwardReferralBonus(db, session.userId);
        await saveDbPartial(db, ['blockPuzzleMatches', 'users', 'transactions', 'tournaments', 'tournamentEntries', 'referrals']);
        return { match: blockPuzzlePublicMatch(session, db), user: db.users.find(u => u.id === payload.userId) };
      });
    } else {
      const db = await loadDb();
      const session = (db.blockPuzzleMatches || []).find(m => m.id === req.params.id && m.userId === payload.userId);
      const user = (db.users || []).find(u => u.id === payload.userId);
      if (!session || !user) return res.status(404).json({ message: 'Block Puzzle match not found.' });
      result = { match: blockPuzzlePublicMatch(session, db), user };
    }
    res.json({ match: result.match, user: publicUser(result.user) });
  } catch (err) { res.status(err.statusCode || 503).json({ message: err?.message || 'স্কোর সাবমিট করা যায়নি।' }); }
});
const blockPuzzleCleanup = async (req, res) => {
  const secret = process.env.CRON_SECRET?.trim();
  const authHeader = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!secret || authHeader !== secret) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const changed = await withDbLock(async () => { const db = await loadDb(); const c = await expireBlockPuzzleMatches(db); if (c) await saveDb(db); return c; });
    res.json({ ok: true, changed });
  } catch (err) { res.status(503).json({ message: err?.message || 'Cleanup unavailable.' }); }
};
app.get('/api/block-puzzle/cleanup', blockPuzzleCleanup);
app.post('/api/block-puzzle/cleanup', blockPuzzleCleanup);

app.post('/api/block-puzzle/matches/:id/refund', auth, async (req, res) => {
  try {
    const result = await withDbLock(async () => {
      const db = await loadDb(); const session = (db.blockPuzzleMatches || []).find(m => m.id === req.params.id);
      if (!session) throw Object.assign(new Error('Block Puzzle match not found.'), { statusCode: 404 });
      if (session.userId !== req.user.id) throw Object.assign(new Error('This match does not belong to you.'), { statusCode: 403 });
      if (session.status === 'REFUNDED') return { session, user: db.users.find(u => u.id === req.user.id) };
      if (session.status !== 'PENDING') throw Object.assign(new Error('এই ম্যাচটি এখন আর রিফান্ড করা যাবে না।'), { statusCode: 409 });
      const u = db.users.find(x => x.id === req.user.id); u.gamingBalance = money(Number(u.gamingBalance || 0) + Number(session.entryFee || 0));
      session.status = 'REFUNDED'; session.refunded = true; session.refundReason = safeText(req.body?.reason, 200) || 'Player cancelled matchmaking'; session.refundedAt = now();
      db.transactions.unshift(makeTransaction(u.id, 'refund', Number(session.entryFee), `${session.gameType === 'nut_sort' ? 'Nut Sort' : 'Block Puzzle'} Entry Refund`, `${session.refundReason} • Match #${session.id.slice(-6)}`, 'match', { matchId: session.id, gameType: session.gameType || 'block_puzzle' }));
      await saveDb(db); return { session, user: u };
    });
    res.json({ match: blockPuzzlePublicMatch(result.session, { users: [result.user] }), user: publicUser(result.user) });
  } catch (err) { res.status(err.statusCode || 503).json({ message: err?.message || 'রিফান্ড করা যায়নি।' }); }
});

app.get('/api/admin/block-puzzle/leaderboards', auth, admin, async (req, res) => {
  const db = req.db;
  const leaderboards = (db.leaderboards || []).map(b => publicLeaderboard(db, b)).sort((a,b) => Date.parse(b.startsAt) - Date.parse(a.startsAt));
  res.json({ leaderboards });
});

app.post('/api/admin/block-puzzle/leaderboards', auth, admin, async (req, res) => {
  try {
    const result = await withDbLock(async () => {
      const db = await loadDb();
      const active = (db.leaderboards || []).find(b => b.status === 'ACTIVE' && Date.parse(b.endsAt) > Date.now());
      if (active) throw Object.assign(new Error('একটি Leaderboard এখনও চলছে। আগে সেটি শেষ করুন।'), { statusCode: 409 });
      const name = safeText(req.body?.name, 100) || 'Block Puzzle 3-Day Leaderboard';
      const winPoints = Math.max(1, Math.floor(Number(req.body?.winPoints) || 10));
      const startsAt = new Date().toISOString();
      const endsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const prizes = Array.isArray(req.body?.prizes) ? req.body.prizes.map((x, i) => ({ rank: i + 1, amount: money(Math.max(0, Number(x?.amount) || 0)) })).filter(x => x.amount > 0) : [];
      const board = { id: id('lb'), name, winPoints, startsAt, endsAt, durationDays: 3, prizes, status: 'ACTIVE', createdAt: now(), finalizedAt: null, finalEntries: null, payouts: [] };
      db.leaderboards = [board, ...(db.leaderboards || [])]; await saveDb(db); return board;
    });
    res.status(201).json({ leaderboard: publicLeaderboard((await loadDb()), result) });
  } catch (err) { res.status(err.statusCode || 503).json({ message: err?.message || 'Leaderboard তৈরি করা যায়নি।' }); }
});

app.post('/api/admin/block-puzzle/leaderboards/:id/finalize', auth, admin, async (req, res) => {
  try {
    const result = await withDbLock(async () => {
      const db = await loadDb(); const board = (db.leaderboards || []).find(b => b.id === req.params.id);
      if (!board) throw Object.assign(new Error('Leaderboard পাওয়া যায়নি।'), { statusCode: 404 });
      if (board.finalizedAt) return { board, payouts: board.payouts || [] };
      if (Date.now() < Date.parse(board.endsAt)) throw Object.assign(new Error('৩ দিন পূর্ণ হওয়ার আগে Leaderboard finalize করা যাবে না।'), { statusCode: 409 });
      const entries = leaderboardEntries(db, board, false);
      const payouts = [];
      for (const e of entries) {
        if (!e.prize || e.prize <= 0) continue;
        const u = db.users.find(x => x.id === e.userId); if (!u) continue;
        u.winningBalance = money(Number(u.winningBalance || 0) + e.prize);
        u.totalWinnings = money(Number(u.totalWinnings || 0) + e.prize);
        db.transactions.unshift(makeTransaction(u.id, 'leaderboard_win', e.prize, 'Block Puzzle Leaderboard Prize', `${board.name} • Rank #${e.rank}`, 'leaderboard', { leaderboardId: board.id, gameType: 'block_puzzle', rank: e.rank }));
        payouts.push({ userId: u.id, username: u.name, rank: e.rank, amount: e.prize });
      }
      board.finalEntries = entries; board.status = 'ENDED'; board.finalizedAt = now(); board.payouts = payouts; await saveDb(db); return { board, payouts };
    });
    const db = await loadDb(); res.json({ leaderboard: publicLeaderboard(db, result.board), payouts: result.payouts });
  } catch (err) { res.status(err.statusCode || 503).json({ message: err?.message || 'Leaderboard finalize করা যায়নি।' }); }
});

app.get('/api/admin/block-puzzle/matches', auth, admin, (req, res) => {
  const groups = new Map();
  for (const s of (req.db.blockPuzzleMatches || [])) {
    const key = s.duelId || s.id;
    const item = groups.get(key) || { id: key, duelId: s.duelId || null, status: s.status, entryFee: s.entryFee, prizeAmount: s.prizeAmount, createdAt: s.createdAt, players: [] };
    item.status = s.status === 'COMPLETED' ? 'completed' : s.status.toLowerCase();
    item.players.push({ userId: s.userId, name: s.userName, score: s.score ?? null, outcome: s.outcome || null });
    groups.set(key, item);
  }
  res.json({ matches: [...groups.values()] });
});
app.delete('/api/admin/block-puzzle/matches/:id', auth, admin, async (req, res) => {
  const key = String(req.params.id || '');
  try {
    const result = await withDbLock(async () => {
      // Reload the latest DB state inside the lock so an Admin delete cannot
      // overwrite a newer match/score update from another request.
      const db = await loadDb();
      const items = db.blockPuzzleMatches || [];
      const targets = items.filter(s => String(s.duelId || '') === key || String(s.id || '') === key);
      if (!targets.length) return { statusCode: 404, message: 'Block Puzzle match not found.' };
      const terminal = new Set(['COMPLETED', 'REFUNDED']);
      if (targets.some(s => !terminal.has(String(s.status || '').toUpperCase()))) {
        return { statusCode: 409, message: 'শুধু সম্পন্ন/রিফান্ড হওয়া ম্যাচ ডিলিট করা যাবে।' };
      }
      db.blockPuzzleMatches = items.filter(s => !(String(s.duelId || '') === key || String(s.id || '') === key));
      // Only the match-history collection is persisted here; other app state
      // is intentionally left untouched.
      await saveDbPartial(db, ['blockPuzzleMatches']);
      return { ok: true };
    });
    if (result.statusCode) return res.status(result.statusCode).json({ message: result.message });
    res.json({ ok: true });
  } catch (err) {
    res.status(err.statusCode || 503).json({ message: err?.message || 'Match delete করা যায়নি।' });
  }
});

app.get('/api/matches', auth, (req, res) => res.json({ matches: req.db.matches || [] }));
app.post('/api/matches', auth, admin, async (req, res) => {
  const body = req.body || {};
  const m = {
    id: id('match'), status: 'open', joinedSeats: 0, joinedPlayers: [], createdAt: now(),
    matchNo: safeText(body.matchNo, 50) || String(Date.now()).slice(-6), title: safeText(body.title, 100), subtitle: safeText(body.subtitle, 200),
    category: body.category || 'special', totalPrize: money(body.totalPrize || 0), entryFee: money(body.entryFee || 0), version: safeText(body.version, 50),
    boardType: safeText(body.boardType, 50), totalSeats: Math.max(2, Number(body.totalSeats) || 2), matchTime: safeText(body.matchTime, 100), dailyLimit: safeText(body.dailyLimit, 100), isHot: Boolean(body.isHot), roomCode: safeText(body.roomCode, 100) || undefined
  };
  if (!m.title || m.entryFee < 0 || m.totalPrize < 0) return res.status(400).json({ message: 'Invalid match details.' });
  if (m.roomCode) m.status = 'ready_to_play';
  req.db.matches.unshift(m); await saveDb(req.db); res.status(201).json({ match: m });
});

// Server-authoritative online matchmaking/join: entry fee is deducted and the seat is reserved on the server.
app.post('/api/matches/:id/join', auth, async (req, res) => {
  const m = req.db.matches.find(x => x.id === req.params.id);
  const ludoKingName = safeText(req.body?.ludoKingName, 100) || req.user.ludoKingName || req.user.name;
  if (!m) return res.status(404).json({ message: 'Match not found.' });
  if (m.status === 'cancelled' || m.status === 'completed') return res.status(400).json({ message: 'This match is no longer available.' });
  if ((m.joinedPlayers || []).some(p => p.userId === req.user.id)) return res.status(409).json({ message: 'You already joined this match.' });
  if ((m.joinedPlayers || []).length >= Number(m.totalSeats)) return res.status(409).json({ message: 'Seat Full.' });
  if (Number(req.user.gamingBalance) < Number(m.entryFee)) return res.status(400).json({ message: 'Insufficient gaming balance.' });

  req.user.gamingBalance = money(req.user.gamingBalance - Number(m.entryFee));
  req.user.matchesPlayed = Number(req.user.matchesPlayed || 0) + 1;
  const player = { userId: req.user.id, name: req.user.name, ludoKingName, phone: req.user.phone, joinedAt: now() };
  m.joinedPlayers = [...(m.joinedPlayers || []), player];
  m.joinedSeats = m.joinedPlayers.length;
  m.status = m.joinedSeats >= Number(m.totalSeats) ? (m.roomCode ? 'ready_to_play' : 'waiting_room_id') : 'open';
  req.db.transactions.unshift(makeTransaction(req.user.id, 'match_loss', -Number(m.entryFee), 'Match Entry', `Match #${m.matchNo} • Entry Fee`, 'match', { matchId: m.id }));
  await saveDb(req.db);
  res.json({ match: m, user: publicUser(req.user) });
});

app.patch('/api/matches/:id/room', auth, admin, async (req, res) => {
  const m = req.db.matches.find(x => x.id === req.params.id); if (!m) return res.status(404).json({ message: 'Match not found' });
  m.roomCode = safeText(req.body?.roomCode, 100); if (m.roomCode && m.joinedSeats >= m.totalSeats) m.status = 'ready_to_play';
  await saveDb(req.db); res.json({ match: m });
});

app.post('/api/matches/:id/cancel', auth, admin, async (req, res) => {
  const m = req.db.matches.find(x => x.id === req.params.id); if (!m) return res.status(404).json({ message: 'Match not found' });
  if (m.status === 'completed' || m.status === 'cancelled') return res.status(400).json({ message: 'Match already settled.' });
  const reason = safeText(req.body?.reason, 200) || 'Cancelled by admin';
  for (const p of (m.joinedPlayers || [])) {
    const u = req.db.users.find(x => x.id === p.userId);
    if (u && !m.refundedUserIds?.includes(u.id)) {
      u.gamingBalance = money(u.gamingBalance + Number(m.entryFee));
      req.db.transactions.unshift(makeTransaction(u.id, 'refund', Number(m.entryFee), 'Match Refund', `${reason} • Match #${m.matchNo}`, 'match', { matchId: m.id }));
    }
  }
  m.refundedUserIds = [...new Set([...(m.refundedUserIds || []), ...(m.joinedPlayers || []).map(p => p.userId).filter(Boolean)])];
  m.status = 'cancelled'; m.cancelReason = reason;
  await saveDb(req.db); res.json({ match: m });
});

app.delete('/api/matches/:id', auth, admin, async (req, res) => {
  const m = req.db.matches.find(x => x.id === req.params.id); if (!m) return res.status(404).json({ message: 'Match not found' });
  if ((m.joinedPlayers || []).length) return res.status(400).json({ message: 'Joined matches cannot be deleted. Cancel and refund them instead.' });
  req.db.matches = req.db.matches.filter(x => x.id !== req.params.id); await saveDb(req.db); res.json({ ok: true });
});

app.get('/api/deposit-requests', auth, admin, (req, res) => res.json({ depositRequests: req.db.depositRequests || [] }));
app.get('/api/withdraw-requests', auth, admin, (req, res) => res.json({ withdrawRequests: req.db.withdrawRequests || [] }));
app.get('/api/result-submissions', auth, admin, (req, res) => res.json({ resultSubmissions: req.db.resultSubmissions || [] }));
app.get('/api/my-requests', auth, (req, res) => res.json({
  depositRequests: (req.db.depositRequests || []).filter(x => x.userId === req.user.id),
  withdrawRequests: (req.db.withdrawRequests || []).filter(x => x.userId === req.user.id),
  resultSubmissions: (req.db.resultSubmissions || []).filter(x => x.userId === req.user.id)
}));

app.post('/api/deposit-requests', auth, async (req, res) => {
  const amount = Number(req.body?.amount), rawTrxId = safeText(req.body?.trxId, 100), senderNumber = safeText(req.body?.senderNumber, 30);
  const method = safeText(req.body?.method, 20);
  const trxId = rawTrxId.replace(/\s+/g, '').toUpperCase();
  const ps = req.db.paymentSettings || {};
  const allowedDepositMethods = [];
  if (ps.depositBkashEnabled !== false && ps.bkash) allowedDepositMethods.push('bKash');
  if (ps.depositBkashAgentEnabled !== false && ps.bkashAgentEnabled !== false && ps.bkashAgent) allowedDepositMethods.push('bKash Agent');
  if (ps.depositNagadEnabled !== false && ps.nagad) allowedDepositMethods.push('Nagad');
  if (ps.depositRocketEnabled !== false && ps.rocket) allowedDepositMethods.push('Rocket');
  if (ps.depositUpayEnabled !== false && ps.upay) allowedDepositMethods.push('Upay');
  if (ps.depositBinanceUsdtEnabled !== false && ps.binanceUsdtEnabled !== false && ps.binanceUsdt) allowedDepositMethods.push('Binance / USDT');
  if (!Number.isFinite(amount) || amount <= 0 || !senderNumber || !trxId || !allowedDepositMethods.includes(method)) return res.status(400).json({ message: 'এই Deposit Payment Method বর্তমানে চালু নেই।' });
  try {
    const result = await withDbLock(async () => {
      // Reload inside the lock so two simultaneous submissions cannot reuse one TrxID.
      const db = await loadDb();
      const duplicate = (db.depositRequests || []).find(r => String(r.trxId || '').replace(/\s+/g, '').toUpperCase() === trxId);
      const duplicateTransaction = (db.transactions || []).find(t => String(t.trxId || '').replace(/\s+/g, '').toUpperCase() === trxId && t.category === 'deposit');
      if (duplicate || duplicateTransaction) {
        const statusLabel = duplicate?.status === 'APPROVED' ? 'approved' : duplicate?.status === 'REJECTED' ? 'rejected' : 'already submitted';
        return { duplicate: true, statusLabel };
      }
      const user = db.users.find(u => u.id === req.user.id);
      if (!user) throw Object.assign(new Error('User not found.'), { statusCode: 404 });
      const r = { id: id('dep'), userId: user.id, userName: user.name, userPhone: user.phone, method, amount: money(amount), senderNumber, trxId, timestamp: now(), status: 'PENDING' };
      db.depositRequests = [r, ...(db.depositRequests || [])];
      db.transactions.unshift({ ...makeTransaction(user.id, 'deposit', amount, 'Deposit Request', `via ${method} • Pending`, 'deposit', { trxId: r.trxId, paymentMethod: method }), status: 'PENDING' });
      await saveDb(db);
      return { request: r };
    });
    if (result.duplicate) return res.status(409).json({ message: `এই TrxID আগে ব্যবহার করা হয়েছে (${result.statusLabel})। একই Transaction ID দিয়ে আর নতুন Deposit করা যাবে না।` });
    res.status(201).json({ request: result.request });
  } catch (err) {
    console.error('Deposit request error:', err);
    res.status(err?.statusCode || 503).json({ message: err?.message || 'Deposit unavailable.' });
  }
});

app.patch('/api/deposit-requests/:id', auth, admin, async (req, res) => {
  const status = String(req.body?.status || '').toUpperCase();
  if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ message: 'Invalid status.' });
  try {
    return await withDbLock(async () => {
      // Reload inside the lock so repeated/fast admin clicks cannot approve the same deposit twice.
      const db = await loadDb();
      const r = (db.depositRequests || []).find(x => x.id === req.params.id);
      if (!r) return res.status(404).json({ message: 'Request not found' });
      if (r.status !== 'PENDING') return res.status(409).json({ message: 'Request already settled.' });

      r.status = status;
      r.adminNote = safeText(req.body?.reason || req.body?.note, 300);
      if (status === 'APPROVED') {
        const u = db.users.find(x => x.id === r.userId);
        if (!u) return res.status(404).json({ message: 'User not found' });
        if (r.applied) return res.status(409).json({ message: 'Deposit already applied.' });
        u.gamingBalance = money(Number(u.gamingBalance || 0) + Number(r.amount || 0));
        r.applied = true;
        r.approvedAt = now();
        r.approvedBy = req.user.id;
        maybeAwardReferralBonus(db, u.id);
        db.transactions.unshift(makeTransaction(u.id, 'deposit', Number(r.amount), 'Deposit Approved', `via ${r.method} • Admin Approved`, 'deposit', { trxId: r.trxId, paymentMethod: r.method, depositRequestId: r.id }));
      } else {
        r.rejectedAt = now();
        r.rejectedBy = req.user.id;
        db.transactions.unshift({ ...makeTransaction(r.userId, 'deposit', 0, 'Deposit Rejected', r.adminNote || 'Rejected by Admin', 'deposit', { trxId: r.trxId, depositRequestId: r.id }), status: 'REJECTED' });
      }
      await saveDb(db);
      const user = db.users.find(x => x.id === r.userId);
      return res.json({ request: r, user: user ? publicUser(user) : undefined });
    });
  } catch (err) {
    return res.status(err?.statusCode || 503).json({ message: err?.message || 'Deposit approval service is busy. Please try again.' });
  }
});

app.delete('/api/deposit-requests/:id', auth, admin, async (req,res) => {
  const r = (req.db.depositRequests || []).find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ message: 'Request not found' });
  if (r.status === 'PENDING') return res.status(409).json({ message: 'Pending request delete করা যাবে না। আগে Approve বা Reject করুন।' });
  req.db.depositRequests = (req.db.depositRequests || []).filter(x => x.id !== r.id);
  await saveDb(req.db);
  res.json({ ok:true });
});

app.post('/api/withdraw-requests', auth, async (req, res) => {
  const amount = money(Number(req.body?.amount));
  const accountNumber = safeText(req.body?.accountNumber, 30);
  const accountType = safeText(req.body?.accountType, 20);
  const method = safeText(req.body?.method, 20);
  if (!Number.isFinite(amount) || amount < 100 || !accountNumber || accountType !== 'Personal') {
    return res.status(400).json({ message: 'Withdrawal তথ্য সঠিক নয়।' });
  }

  try {
    return await withDbLock(async () => {
      // Reload inside the lock so two simultaneous withdrawals cannot spend the same balance.
      const db = await loadDb();
      const user = db.users.find(x => x.id === req.user.id);
      if (!user || user.isBanned) return res.status(403).json({ message: 'Account unavailable' });

      const ps = db.paymentSettings || {};
      const allowedWithdrawMethods = [];
      if (ps.withdrawBkashEnabled !== false && ps.bkash) allowedWithdrawMethods.push('bKash');
      if (ps.withdrawNagadEnabled !== false && ps.nagad) allowedWithdrawMethods.push('Nagad');
      if (ps.withdrawRocketEnabled !== false && ps.rocket) allowedWithdrawMethods.push('Rocket');
      if (ps.withdrawUpayEnabled !== false && ps.upay) allowedWithdrawMethods.push('Upay');
      if (ps.withdrawBinanceUsdtEnabled !== false && ps.binanceUsdtEnabled !== false && ps.binanceUsdt) allowedWithdrawMethods.push('Binance / USDT');
      if (!allowedWithdrawMethods.includes(method)) return res.status(400).json({ message: 'এই Withdrawal Payment Method বর্তমানে চালু নেই।' });
      if (Number(user.winningBalance || 0) < amount) return res.status(400).json({ message: 'Insufficient winning balance.' });

      user.winningBalance = money(Number(user.winningBalance || 0) - amount);
      const r = { id: id('wd'), userId: user.id, userName: user.name, userPhone: user.phone, method, accountType, accountNumber, amount, timestamp: now(), status: 'PENDING', refunded: false };
      db.withdrawRequests = db.withdrawRequests || [];
      db.withdrawRequests.unshift(r);
      db.transactions.unshift({ ...makeTransaction(user.id, 'withdraw', -amount, 'Withdraw Request', `via ${method} • Pending`, 'withdraw', { paymentMethod: method, withdrawRequestId: r.id }), status: 'PENDING' });
      await saveDb(db);
      return res.status(201).json({ request: r, user: publicUser(user) });
    });
  } catch (err) {
    return res.status(503).json({ message: err?.message || 'Withdrawal service is busy. Please try again.' });
  }
});

app.post('/api/withdraw-requests/:id/review', auth, admin, async (req, res) => {
  const r = (req.db.withdrawRequests || []).find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ message: 'Request not found' });
  if (r.status !== 'PENDING') return res.status(409).json({ message: 'শুধু pending withdrawal review করা যাবে।' });
  r.reviewedAt = now(); r.reviewedBy = req.user.id;
  r.reviewNote = safeText(req.body?.note, 300) || 'User profile, deposits, matches, scores and withdrawal history reviewed.';
  await saveDb(req.db); res.json({ request: r });
});

app.patch('/api/withdraw-requests/:id', auth, admin, async (req, res) => {
  const status = String(req.body?.status || '').toUpperCase();
  if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ message: 'Invalid status.' });

  try {
    return await withDbLock(async () => {
      // Reload inside the lock so two admin clicks/requests cannot settle the same withdrawal twice.
      const db = await loadDb();
      const r = (db.withdrawRequests || []).find(x => x.id === req.params.id);
      if (!r) return res.status(404).json({ message: 'Request not found' });
      if (r.status !== 'PENDING') return res.status(409).json({ message: 'Request already settled.' });

      r.status = status;
      r.adminTrxId = safeText(req.body?.adminTrxId, 100);
      r.adminNote = safeText(req.body?.reason, 300);

      if (status === 'REJECTED') {
        const u = db.users.find(x => x.id === r.userId);
        // Defense in depth: a rejected request can never refund twice, even if its status is later mishandled.
        if (u && !r.refunded) {
          u.winningBalance = money(Number(u.winningBalance || 0) + Number(r.amount || 0));
          r.refunded = true;
          r.refundedAt = now();
        }
      }

      const txAmount = status === 'APPROVED' ? -Number(r.amount) : Number(r.amount);
      const txTitle = status === 'APPROVED' ? 'Withdraw Paid' : 'Withdraw Refunded';
      const txSubtitle = status === 'APPROVED'
        ? `Paid • ${r.adminTrxId || 'Admin'}`
        : (r.adminNote || 'Rejected by Admin • Amount refunded');
      db.transactions.unshift({
        ...makeTransaction(r.userId, 'withdraw', txAmount, txTitle, txSubtitle, 'withdraw', {
          trxId: r.adminTrxId,
          paymentMethod: r.method,
          withdrawRequestId: r.id,
          refund: status === 'REJECTED'
        }),
        status: status === 'APPROVED' ? 'SUCCESS' : 'REJECTED'
      });

      await saveDb(db);
      const user = db.users.find(x => x.id === r.userId);
      return res.json({ request: r, user: user ? publicUser(user) : undefined });
    });
  } catch (err) {
    return res.status(503).json({ message: err?.message || 'Withdrawal service is busy. Please try again.' });
  }
});

app.delete('/api/withdraw-requests/:id', auth, admin, async (req,res) => {
  const r = (req.db.withdrawRequests || []).find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ message: 'Request not found' });
  if (r.status === 'PENDING') return res.status(409).json({ message: 'Pending request delete করা যাবে না। আগে Approve বা Reject করুন।' });
  req.db.withdrawRequests = (req.db.withdrawRequests || []).filter(x => x.id !== r.id);
  await saveDb(req.db);
  res.json({ ok:true });
});

app.post('/api/result-submissions', auth, async (req, res) => {
  const gameType = safeText(req.body?.gameType, 40);
  const roomCode = safeText(req.body?.roomCode, 100);
  const matchId = safeText(req.body?.matchId, 100);
  const imageUrl = safeText(req.body?.imageUrl, 5_000);

  // Block Puzzle uses an in-app timed session; it does not use Ludo rooms.
  if (gameType === 'block_puzzle') {
    const score = Number(req.body?.score);
    const linesCleared = Math.max(0, Math.floor(Number(req.body?.linesCleared || 0)));
    const bestCombo = Math.max(0, Math.floor(Number(req.body?.bestCombo || 0)));
    if (!Number.isFinite(score) || score < 0) return res.status(400).json({ message: 'Invalid Block Puzzle score.' });
    const session = (req.db.blockPuzzleMatches || []).find(m => m.id === matchId && m.userId === req.user.id);
    if (!session) return res.status(404).json({ message: 'Block Puzzle match not found.' });
    if (session.status !== 'ACTIVE') return res.status(409).json({ message: 'এই Block Puzzle ম্যাচটি আর সাবমিট করা যাবে না।' });
    if ((req.db.resultSubmissions || []).some(s => s.gameType === 'block_puzzle' && s.matchId === session.id && s.userId === req.user.id && s.status === 'PENDING')) return res.status(409).json({ message: 'এই Block Puzzle স্কোরটি ইতিমধ্যে যাচাইয়ের অপেক্ষায় আছে।' });
    session.status = 'SUBMITTED'; session.submittedAt = now(); session.score = Math.floor(score); session.linesCleared = linesCleared; session.bestCombo = bestCombo;
    const r = { id: id('res'), userId: req.user.id, userName: req.user.name, userPhone: req.user.phone, gameType: 'block_puzzle', matchId: session.id, matchNo: undefined, roomCode: undefined, score: Math.floor(score), entryFee: money(session.entryFee), linesCleared, bestCombo, imageUrl: imageUrl || undefined, prizeAmount: money(session.prizeAmount), status: 'PENDING', submittedAt: session.submittedAt };
    req.db.resultSubmissions.unshift(r); await saveDbPartial(req.db, ['resultSubmissions']); return res.status(201).json({ submission: r, match: session });
  }

  if (!roomCode) return res.status(400).json({ message: 'Room ID is required.' });
  const match = req.db.matches.find(m => m.id === matchId || m.roomCode === roomCode || m.matchNo === matchId);
  if (!match) return res.status(404).json({ message: 'Match not found.' });
  if (!(match.joinedPlayers || []).some(p => p.userId === req.user.id)) return res.status(403).json({ message: 'You did not join this match.' });
  if ((req.db.resultSubmissions || []).some(s => s.matchId === match.id && s.userId === req.user.id && s.status === 'PENDING')) return res.status(409).json({ message: 'A result is already pending for this match.' });
  const r = { id: id('res'), userId: req.user.id, userName: req.user.name, userPhone: req.user.phone, ludoKingName: req.user.ludoKingName, matchId: match.id, matchNo: match.matchNo, roomCode, imageUrl: imageUrl || undefined, prizeAmount: money(match.totalPrize), status: 'PENDING', submittedAt: now() };
  req.db.resultSubmissions.unshift(r); await saveDbPartial(req.db, ['resultSubmissions']); res.status(201).json({ submission: r });
});

app.patch('/api/result-submissions/:id', auth, admin, async (req, res) => {
  const r = req.db.resultSubmissions.find(x => x.id === req.params.id); if (!r) return res.status(404).json({ message: 'Submission not found' });
  if (r.status !== 'PENDING') return res.status(409).json({ message: 'Submission already settled.' });
  const status = String(req.body?.status || '').toUpperCase(); if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ message: 'Invalid status.' });
  r.status = status; r.adminNote = safeText(req.body?.reason, 300);
  if (status === 'APPROVED') {
    const u = req.db.users.find(x => x.id === r.userId); if (!u) return res.status(404).json({ message: 'User not found' });
    const match = req.db.matches.find(m => m.id === r.matchId);
    if (match?.winnerId && match.winnerId !== u.id) return res.status(409).json({ message: 'This match already has a different winner.' });
    u.winningBalance = money(u.winningBalance + Number(r.prizeAmount)); u.totalWinnings = money(Number(u.totalWinnings || 0) + Number(r.prizeAmount)); u.matchesWon = Number(u.matchesWon || 0) + 1;
    if (r.gameType === 'block_puzzle') {
      const bp = (req.db.blockPuzzleMatches || []).find(m => m.id === r.matchId && m.userId === u.id);
      if (bp) { bp.status = 'COMPLETED'; bp.completedAt = now(); }
    } else if (match) { match.status = 'completed'; match.winnerId = u.id; match.winnerName = u.name; }
    req.db.transactions.unshift(makeTransaction(u.id, 'match_win', Number(r.prizeAmount), r.gameType === 'block_puzzle' ? 'Block Puzzle Win' : 'Match Win', r.gameType === 'block_puzzle' ? `Score: ${Number(r.score || 0)} • Admin Approved` : `Room ID: ${r.roomCode} • Admin Approved`, 'match', { matchId: r.matchId, roomCode: r.roomCode, score: r.score, gameType: r.gameType }));
  } else if (r.gameType === 'block_puzzle') {
    const bp = (req.db.blockPuzzleMatches || []).find(m => m.id === r.matchId && m.userId === r.userId);
    if (bp && bp.status === 'SUBMITTED' && !bp.refunded) {
      const u = req.db.users.find(x => x.id === r.userId);
      if (u) {
        u.gamingBalance = money(u.gamingBalance + Number(bp.entryFee));
        bp.status = 'REFUNDED'; bp.refunded = true; bp.refundReason = r.adminNote || 'Score rejected'; bp.refundedAt = now();
        req.db.transactions.unshift(makeTransaction(u.id, 'refund', Number(bp.entryFee), 'Block Puzzle Entry Refund', r.adminNote || 'Score rejected by Admin', 'match', { matchId: bp.id, gameType: 'block_puzzle' }));
      }
    }
  }
  await saveDb(req.db); res.json({ submission: r, user: publicUser(req.db.users.find(x => x.id === r.userId)) });
});

app.post('/api/winning/transfer', auth, async (req, res) => {
  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || amount <= 0 || req.user.winningBalance < amount) return res.status(400).json({ message: 'Invalid or insufficient winning balance.' });
  req.user.winningBalance = money(req.user.winningBalance - amount); req.user.gamingBalance = money(req.user.gamingBalance + amount);
  req.db.transactions.unshift(makeTransaction(req.user.id, 'admin_add', amount, 'Balance Transfer', 'Winning to Gaming Balance', 'admin'));
  await saveDb(req.db); res.json({ user: publicUser(req.user) });
});

app.get('/api/referral/summary', auth, async (req, res) => {
  const db = req.db; const settings = referralSettings(db);
  const items = (db.referrals || []).filter(r => r.referrerId === req.user.id);
  const paid = items.filter(r => r.status === 'PAID');
  res.json({ settings, summary: { total: items.length, paid: paid.length, bonusEarned: money(paid.reduce((s, r) => s + Number(r.bonusAmount || 0), 0)) }, referrals: items.slice(0, 100) });
});
app.get('/api/admin/referrals', auth, admin, (req, res) => {
  const items = (req.db.referrals || []).map(r => ({ ...r }));
  res.json({ settings: referralSettings(req.db), referrals: items });
});

app.post('/api/admin/referrals/:id/approve', auth, admin, async (req, res) => {
  try {
    return await withDbLock(async () => {
      const db = await loadDb();
      const record = (db.referrals || []).find(r => r.id === req.params.id);
      if (!record) return res.status(404).json({ message: 'Referral request not found.' });
      if (record.status !== 'PENDING_APPROVAL') return res.status(409).json({ message: 'Referral request already reviewed.' });
      const settings = referralSettings(db);
      const referred = (db.users || []).find(u => u.id === record.referredUserId);
      const referrer = (db.users || []).find(u => u.id === record.referrerId);
      if (!referred || !referrer) return res.status(404).json({ message: 'Referral user not found.' });
      const approvedDeposit = (db.depositRequests || []).filter(r => r.userId === referred.id && r.status === 'APPROVED').reduce((sum, r) => sum + Number(r.amount || 0), 0);
      const firstProMatchPlayed = (db.blockPuzzleMatches || []).some(m => m.userId === referred.id && m.submittedAt);
      if (approvedDeposit < settings.minDeposit || (settings.requireFirstProMatch && !firstProMatchPlayed)) return res.status(409).json({ message: 'Referral এখনো যোগ্য হয়নি।' });
      const bonus = money(Number(record.bonusAmount || settings.bonusAmount));
      referrer.gamingBalance = money(Number(referrer.gamingBalance || 0) + bonus);
      Object.assign(record, { status: 'PAID', bonusAmount: bonus, qualifyingDeposit: money(approvedDeposit), approvedAt: now(), approvedBy: req.user.id });
      db.transactions.unshift(makeTransaction(referrer.id, 'referral_bonus', bonus, 'Referral Bonus Approved', `Gaming Balance • ${referred.name}`, 'referral', { referralId: record.id, referredUserId: referred.id }));
      await saveDb(db);
      return res.json({ referral: record, user: publicUser(referrer) });
    });
  } catch (err) { res.status(err.statusCode || 503).json({ message: err?.message || 'Referral approve করা যায়নি।' }); }
});

app.post('/api/admin/referrals/:id/reject', auth, admin, async (req, res) => {
  try {
    return await withDbLock(async () => {
      const db = await loadDb();
      const record = (db.referrals || []).find(r => r.id === req.params.id);
      if (!record) return res.status(404).json({ message: 'Referral request not found.' });
      if (record.status !== 'PENDING_APPROVAL') return res.status(409).json({ message: 'Referral request already reviewed.' });
      Object.assign(record, { status: 'REJECTED', rejectedAt: now(), rejectedBy: req.user.id, adminNote: safeText(req.body?.reason || req.body?.note, 300) });
      await saveDb(db);
      return res.json({ referral: record });
    });
  } catch (err) { res.status(err.statusCode || 503).json({ message: err?.message || 'Referral reject করা যায়নি।' }); }
});

app.get('/api/settings', auth, (req, res) => res.json({ paymentSettings: req.db.paymentSettings, referralSettings: referralSettings(req.db) }));
app.patch('/api/settings', auth, admin, async (req, res) => {
  const b = req.body || {};
  const paymentPatch = {};
  for (const key of ['bkash','bkashAgent','nagad','rocket','upay','binanceUsdt','bkashAgentEnabled','binanceUsdtEnabled','depositBkashEnabled','depositBkashAgentEnabled','depositNagadEnabled','depositRocketEnabled','depositUpayEnabled','depositBinanceUsdtEnabled','withdrawBkashEnabled','withdrawNagadEnabled','withdrawRocketEnabled','withdrawUpayEnabled','withdrawBinanceUsdtEnabled','whatsappSupport','telegramLink','marqueeNotice','popupNoticeTitle','popupNoticeText']) { if (b[key] !== undefined) paymentPatch[key] = typeof b[key] === 'string' ? safeText(b[key], 5000) : Boolean(b[key]); }
    if (b.multiplayerProMatches !== undefined) {
    if (!Array.isArray(b.multiplayerProMatches)) return res.status(400).json({message:'Multiplayer Pro Match settings invalid.'});
    const rows = b.multiplayerProMatches.map((x,i)=>{
      const players = Math.floor(Number(x?.players));
      const legacyPrize = money(Math.max(0, Number(x?.prizeAmount)||0));
      const prizes = (Array.isArray(x?.prizes) ? x.prizes : (legacyPrize > 0 ? [legacyPrize] : []))
        .map(Number).filter(n => Number.isFinite(n) && n > 0).map(money);
      return {
        id: safeText(x?.id || `mp_${x?.players || i}`, 40), players,
        entryFee: money(Math.max(0, Number(x?.entryFee)||0)), prizeAmount: prizes[0] || 0, prizes,
        active: Boolean(x?.active), showOnHome: x?.showOnHome !== false, displayOrder: Number.isFinite(Number(x?.displayOrder)) ? Number(x.displayOrder) : i+1, name: safeText(x?.name || `Multiplayer Pro Match • ${players} Players`, 100)
      };
    });
    if (rows.length < 1 || rows.some(x=>!Number.isInteger(x.players)||x.players<3||x.players>1000||x.entryFee<=0||!x.prizes.length||x.prizes.length>x.players||x.prizes.reduce((a,v)=>a+v,0)>money(x.entryFee*x.players)) || new Set(rows.map(x=>x.players)).size !== rows.length) return res.status(400).json({message:'প্রতিটি Multiplayer Player Count 3 থেকে 1000-এর মধ্যে আলাদা পূর্ণ সংখ্যা হতে হবে। Entry Fee দিন এবং Prize Distribution-এ 1 থেকে ওই player count পর্যন্ত rank prize দিন। মোট prize মোট entry fee-এর বেশি হতে পারবে না।'});
    paymentPatch.multiplayerProMatches = rows.sort((a,b)=>a.displayOrder-b.displayOrder);
  }
if (b.proMatchFees !== undefined) { const fees = Array.isArray(b.proMatchFees) ? b.proMatchFees.map(Number) : []; if (fees.length !== 6 || fees.some(n => !Number.isFinite(n) || n <= 0) || new Set(fees.map(n => n.toFixed(2))).size !== 6) return res.status(400).json({ message: 'Pro Match entry fee অবশ্যই ৬টি আলাদা positive amount হতে হবে।' }); paymentPatch.proMatchFees = fees.map(n => money(n)); }
  req.db.paymentSettings = { ...req.db.paymentSettings, ...paymentPatch };
  req.db.referralSettings = { ...referralSettings(req.db), enabled: b.referralEnabled !== undefined ? Boolean(b.referralEnabled) : referralSettings(req.db).enabled, bonusAmount: b.referralBonusAmount !== undefined ? money(Math.max(0, Number(b.referralBonusAmount) || 0)) : referralSettings(req.db).bonusAmount, minDeposit: b.referralMinDeposit !== undefined ? money(Math.max(0, Number(b.referralMinDeposit) || 0)) : referralSettings(req.db).minDeposit, requireFirstProMatch: b.referralRequireFirstProMatch !== undefined ? Boolean(b.referralRequireFirstProMatch) : referralSettings(req.db).requireFirstProMatch };
  await saveDb(req.db); res.json({ paymentSettings: req.db.paymentSettings, referralSettings: referralSettings(req.db) });
});

app.use((err, req, res, next) => { console.error(err); res.status(500).json({ message: err?.message || 'Server error' }); });


function publicArcadeMatch(m, db, userId) {
  const me = (m.players || []).find(p => p.userId === userId) || null;
  const opp = (m.players || []).find(p => p.userId !== userId) || null;
  return { id:m.id, gameType:m.gameType, status:m.status, duelId:m.duelId, entryFee:m.entryFee, prizeAmount:m.prizeAmount,
    createdAt:m.createdAt, gameStartedAt:m.gameStartedAt || null, playerNumber:me?.playerNumber || null,
    opponent:opp ? { name:opp.name, userId:opp.userId, playerNumber:opp.playerNumber } : null };
}

app.post('/api/arcade/matches/start', auth, async (req, res) => {
  const gameType = safeText(req.body?.gameType, 20).toLowerCase();
  if (!['pool','carrom'].includes(gameType)) return res.status(400).json({message:'Unsupported online game.'});
  const game = (req.db.games||[]).find(g => g.gameType === gameType && g.active !== false);
  if (!game) return res.status(400).json({message:'এই গেমটি বর্তমানে চালু নেই।'});
  const result = await withDbLock(async () => {
    const db = await loadDb();
    const freshGame=(db.games||[]).find(g=>g.gameType===gameType&&g.active!==false);
    const user=db.users.find(u=>u.id===req.user.id);
    if(!freshGame||!user) throw new Error('GAME_UNAVAILABLE');
    db.arcadeMatches ||= []; db.arcadeQueue ||= [];
    const fee=money(Math.max(0,Number(freshGame.entryFee)||0));
    if(Number(user.gamingBalance||0)<fee) throw new Error('INSUFFICIENT_BALANCE');
    // Reuse a still-waiting queue entry for the same game, never the same user.
    let q=db.arcadeQueue.find(x=>x.gameType===gameType && x.userId!==user.id);
    let match=null;
    if(q){
      match=db.arcadeMatches.find(m=>m.id===q.matchId&&m.status==='WAITING');
      if(match){
        db.arcadeQueue=db.arcadeQueue.filter(x=>x.matchId!==q.matchId);
        user.gamingBalance=money(Number(user.gamingBalance)-fee);
        const opponent=db.users.find(u=>u.id===q.userId);
        match.players=[...(match.players||[]),{userId:user.id,name:user.name,playerNumber:2}];
        match.status='PLAYING'; match.gameStartedAt=now();
        match.duelId=match.id; match.updatedAt=now();
        db.transactions.unshift(makeTransaction(user.id,'game_entry',-fee,`${freshGame.name} Entry Fee`,`Online Match • ${match.id}`,'game',{gameType,matchId:match.id}));
        await saveDb(db); return {db,match,user,opponent,paired:true};
      }
      db.arcadeQueue=db.arcadeQueue.filter(x=>x!==q);
    }
    user.gamingBalance=money(Number(user.gamingBalance)-fee);
    match={id:id(`arcade_${gameType}`),duelId:null,gameType,status:'WAITING',entryFee:fee,prizeAmount:money(Math.max(0,Number(freshGame.prizeAmount)||0)),players:[{userId:user.id,name:user.name,playerNumber:1}],createdAt:now(),updatedAt:now()};
    db.arcadeMatches.unshift(match); db.arcadeQueue.push({matchId:match.id,gameType,userId:user.id,createdAt:now()});
    db.transactions.unshift(makeTransaction(user.id,'game_entry',-fee,`${freshGame.name} Entry Fee`,`Online Match • Waiting`,'game',{gameType,matchId:match.id}));
    await saveDb(db); return {db,match,user,opponent:null,paired:false};
  });
  if(result.match.status==='PLAYING') return res.json({match:publicArcadeMatch(result.match,result.db,result.user.id),paired:true,user:publicUser(result.user)});
  res.json({match:publicArcadeMatch(result.match,result.db,result.user.id),paired:false,user:publicUser(result.user)});
});

app.get('/api/arcade/matches/:id', auth, async (req,res)=>{
  const db=await loadDb(); const m=(db.arcadeMatches||[]).find(x=>x.id===req.params.id);
  if(!m || !(m.players||[]).some(p=>p.userId===req.user.id)) return res.status(404).json({message:'Match not found.'});
  res.json({match:publicArcadeMatch(m,db,req.user.id),user:publicUser(db.users.find(u=>u.id===req.user.id))});
});

app.post('/api/arcade/matches/:id/finish', auth, async (req,res)=>{
  try {
    const winner = safeText(req.body?.winner, 10).toUpperCase();
    if (!['P1','P2','DRAW'].includes(winner)) return res.status(400).json({message:'Invalid match result.'});
    const result = await withDbLock(async () => {
      const db = await loadDb();
      const m = (db.arcadeMatches || []).find(x => x.id === req.params.id);
      if (!m) throw Object.assign(new Error('Match not found.'), { statusCode: 404 });
      const me = (m.players || []).find(p => p.userId === req.user.id);
      if (!me) throw Object.assign(new Error('You are not a player in this match.'), { statusCode: 403 });
      if (m.status === 'COMPLETED') return { db, match: m, alreadyCompleted: true };
      if (m.status !== 'PLAYING') throw Object.assign(new Error('Match is not active.'), { statusCode: 409 });
      // A player may only report their own player slot. The server never accepts an arbitrary user id.
      if (winner !== 'DRAW' && Number(winner.slice(1)) !== Number(me.playerNumber)) {
        throw Object.assign(new Error('You can only submit your own win.'), { statusCode: 403 });
      }
      m.status = 'COMPLETED'; m.winner = winner; m.finishedAt = now(); m.updatedAt = now();
      const winnerPlayer = winner === 'DRAW' ? null : (m.players || []).find(p => p.playerNumber === Number(winner.slice(1)));
      if (winnerPlayer) {
        const u = db.users.find(x => x.id === winnerPlayer.userId);
        const prize = money(Number(m.prizeAmount) || 0);
        if (u && prize > 0) {
          u.winningBalance = money(Number(u.winningBalance || 0) + prize);
          u.totalWinnings = money(Number(u.totalWinnings || 0) + prize);
          db.transactions.unshift(makeTransaction(u.id,'game_win',prize,`${m.gameType==='pool'?'8 Ball Pool':'Carrom'} Prize`,`Online Match • ${m.id}`,'game',{gameType:m.gameType,matchId:m.id}));
        }
      }
      db.arcadeQueue = (db.arcadeQueue || []).filter(q => q.matchId !== m.id);
      await saveDb(db);
      return { db, match: m, alreadyCompleted: false };
    });
    res.json({match: publicArcadeMatch(result.match, result.db, req.user.id), user: publicUser(result.db.users.find(u=>u.id===req.user.id))});
  } catch(e) { res.status(e?.statusCode || 500).json({message:e?.message || 'Could not finish match.'}); }
});
export default app;
if (process.env.VERCEL !== '1' && process.env.LIVE_SERVER !== '1') {
  // Background safety net for Time Mode tournaments. Requests also trigger
  // auto-finalization, so this does not change Player Limit Mode behavior.
  setInterval(async () => {
    try {
      const db = await loadDb();
      if (await autoFinalizeExpiredTournaments(db)) await saveDb(db);
    } catch (err) { console.error('Tournament auto-finalize check failed:', err?.message || err); }
  }, 15000);
  app.listen(PORT, () => console.log(`Skillzgame backend listening on http://localhost:${PORT}`));
}
