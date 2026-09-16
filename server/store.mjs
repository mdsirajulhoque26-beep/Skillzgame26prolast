import crypto from 'node:crypto';
import { MongoClient } from 'mongodb';

const getMongoUri = () => process.env.MONGODB_URI?.trim();
const DB_NAME = process.env.MONGODB_DB || 'skillzgame';
const COLLECTION_NAME = process.env.MONGODB_COLLECTION || 'app_state';
const LOCK_COLLECTION_NAME = `${COLLECTION_NAME}_locks`;
const STATE_ID = 'main';

const defaults = {
  users: [], matches: [], blockPuzzleMatches: [], arcadeMatches: [], arcadeQueue: [], leaderboards: [], tournaments: [], tournamentEntries: [], games: [{ id: 'game_block_puzzle', name: 'Block Puzzle Duel', slug: 'block-puzzle', gameType: 'block_puzzle', icon: '🧩', description: '১০x১০ স্মার্ট ব্লক পাজল • Online Duel', entryFee: 100, prizeAmount: 180, active: true, showOnHome: true, displayOrder: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { id: 'game_nut_sort', name: 'Nut Sort 1v1', slug: 'nut-sort-1v1', gameType: 'nut_sort', icon: '🔩', description: '৩ মিনিটের 1v1 Nut Sort Pro Match', entryFee: 20, prizeAmount: 35, active: true, showOnHome: true, displayOrder: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { id: 'game_pool', name: '8 Ball Pool', slug: '8-ball-pool', gameType: 'pool', icon: '🎱', description: 'Smooth Online 1v1 Pool', entryFee: 20, prizeAmount: 36, active: true, showOnHome: true, displayOrder: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { id: 'game_carrom', name: 'Carrom', slug: 'carrom', gameType: 'carrom', icon: '🪙', description: 'Smooth Online 1v1 Carrom', entryFee: 20, prizeAmount: 36, active: true, showOnHome: true, displayOrder: 4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }], transactions: [], depositRequests: [], withdrawRequests: [], resultSubmissions: [],
  paymentSettings: {
    bkash: '', bkashAgent: '', nagad: '', rocket: '', upay: '', binanceUsdt: '', bkashAgentEnabled: true, binanceUsdtEnabled: true, depositBkashEnabled: true, depositBkashAgentEnabled: true, depositNagadEnabled: true, depositRocketEnabled: true, depositUpayEnabled: true, depositBinanceUsdtEnabled: true, withdrawBkashEnabled: true, withdrawNagadEnabled: true, withdrawRocketEnabled: true, withdrawUpayEnabled: true, withdrawBinanceUsdtEnabled: true, whatsappSupport: '', telegramLink: '',
    marqueeNotice: 'Welcome to Skillzgame', popupNoticeTitle: 'Notice', popupNoticeText: 'Play fairly and have fun.', proMatchFees: [20, 30, 60, 120, 250, 500], multiplayerProMatches: [{id:'mp_3',players:3,entryFee:20,prizeAmount:40,prizes:[40],active:false,showOnHome:true,displayOrder:1},{id:'mp_5',players:5,entryFee:30,prizeAmount:80,prizes:[80],active:false,showOnHome:true,displayOrder:2},{id:'mp_7',players:7,entryFee:60,prizeAmount:160,prizes:[160],active:false,showOnHome:true,displayOrder:3},{id:'mp_10',players:10,entryFee:120,prizeAmount:300,prizes:[300],active:false,showOnHome:true,displayOrder:4}]
  }
};

let clientPromise = null;
let collectionPromise = null;

function cloneDefaults() {
  return structuredClone(defaults);
}

// Keep the existing single MongoDB connection/pool, but make a transient
// connection timeout recoverable. Previously a rejected clientPromise or
// collectionPromise stayed cached forever inside a warm Vercel instance.
// After one temporary Atlas/network timeout, every later score submission
// could therefore fail until Vercel recycled that instance.
async function getCollection() {
  const MONGODB_URI = getMongoUri();
  if (!MONGODB_URI) throw new Error('MONGODB_URI is not configured');

  if (!clientPromise) {
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 30000,
      maxIdleTimeMS: 30000,
      retryReads: true,
      retryWrites: true,
      // Vercel serverless functions normally use IPv4; explicitly preferring
      // it avoids stalls on deployments where IPv6 routing is unavailable.
      family: 4
    });

    clientPromise = client.connect().catch(async (err) => {
      clientPromise = null;
      collectionPromise = null;
      try { await client.close(); } catch {}
      throw err;
    });
  }

  if (!collectionPromise) {
    collectionPromise = clientPromise
      .then(client => client.db(DB_NAME).collection(COLLECTION_NAME))
      .catch(err => {
        collectionPromise = null;
        throw err;
      });
  }

  return collectionPromise;
}

export async function loadDb() {
  const collection = await getCollection();
  const doc = await collection.findOne({ _id: STATE_ID });
  if (doc?.data) {
    const data = { ...cloneDefaults(), ...doc.data };
    if (!Array.isArray(data.games)) data.games = structuredClone(defaults.games);
    if (!data.games.some(g => g.gameType === 'nut_sort')) {
      const template = defaults.games.find(g => g.gameType === 'nut_sort');
      data.games = [...data.games, structuredClone(template)];
      await collection.updateOne({ _id: STATE_ID }, { $set: { 'data.games': data.games }, $currentDate: { updatedAt: true } });
    }
    if (!Array.isArray(data.tournamentEntries)) data.tournamentEntries = [];
    if (!Array.isArray(data.arcadeMatches)) data.arcadeMatches = [];
    if (!Array.isArray(data.arcadeQueue)) data.arcadeQueue = [];
    return data;
  }

  const data = cloneDefaults();
  await collection.updateOne(
    { _id: STATE_ID },
    { $setOnInsert: { _id: STATE_ID, data, updatedAt: new Date() } },
    { upsert: true }
  );
  return data;
}

export async function loadHistoryDb() {
  const collection = await getCollection();
  const doc = await collection.findOne(
    { _id: STATE_ID },
    { projection: {
      'data.blockPuzzleMatches.id': 1,
      'data.blockPuzzleMatches.userId': 1,
      'data.blockPuzzleMatches.userName': 1,
      'data.blockPuzzleMatches.gameType': 1,
      'data.blockPuzzleMatches.tournamentId': 1,
      'data.blockPuzzleMatches.duelId': 1,
      'data.blockPuzzleMatches.opponentUserId': 1,
      'data.blockPuzzleMatches.playerCount': 1,
      'data.blockPuzzleMatches.entryFee': 1,
      'data.blockPuzzleMatches.prizeAmount': 1,
      'data.blockPuzzleMatches.prizeDistribution': 1,
      'data.blockPuzzleMatches.status': 1,
      'data.blockPuzzleMatches.outcome': 1,
      'data.blockPuzzleMatches.winnerId': 1,
      'data.blockPuzzleMatches.score': 1,
      'data.blockPuzzleMatches.linesCleared': 1,
      'data.blockPuzzleMatches.bestCombo': 1,
      'data.blockPuzzleMatches.createdAt': 1,
      'data.blockPuzzleMatches.submittedAt': 1,
      'data.blockPuzzleMatches.settledAt': 1,
      'data.blockPuzzleMatches.refunded': 1,
      'data.tournaments.id': 1,
      'data.tournaments.name': 1,
      'data.tournaments.status': 1,
      'data.tournaments.entryFee': 1,
      'data.tournaments.prizePool': 1,
      'data.tournaments.createdAt': 1,
      'data.tournamentEntries.tournamentId': 1,
      'data.tournamentEntries.userId': 1,
      'data.tournamentEntries.bestScore': 1,
      'data.tournamentEntries.attempts': 1,
      'data.tournamentEntries.joinedAt': 1,
      'data.matches.id': 1,
      'data.matches.category': 1,
      'data.matches.title': 1,
      'data.matches.status': 1,
      'data.matches.entryFee': 1,
      'data.matches.totalPrize': 1,
      'data.matches.createdAt': 1,
      'data.matches.matchNo': 1,
      'data.matches.joinedPlayers.userId': 1,
      'data.matches.joinedPlayers.score': 1,
      'data.arcadeMatches.id': 1,
      'data.arcadeMatches.gameType': 1,
      'data.arcadeMatches.status': 1,
      'data.arcadeMatches.entryFee': 1,
      'data.arcadeMatches.createdAt': 1,
      'data.arcadeMatches.players.userId': 1,
      'data.arcadeMatches.players.name': 1,
      'data.arcadeMatches.players.score': 1,
      'data.users.id': 1,
      'data.users.name': 1,
    } }
  );
  return doc?.data || { blockPuzzleMatches: [], tournaments: [], tournamentEntries: [], matches: [], arcadeMatches: [], users: [] };
}

export async function pingDb() {
  const collection = await getCollection();
  await collection.findOne({ _id: STATE_ID }, { projection: { _id: 1 } });
  return true;
}

export async function saveDb(db) {
  const collection = await getCollection();
  const data = { ...cloneDefaults(), ...db };
  await collection.updateOne(
    { _id: STATE_ID },
    { $set: { data, updatedAt: new Date() } },
    { upsert: true }
  );
}

// Fast partial persistence for latency-sensitive match actions. The legacy
// store keeps one Mongo document, so rewriting the entire app state on every
// score submission can become slow as history/transactions grow. These updates
// touch only the arrays that the current action changed.
export async function saveDbPartial(db, keys = []) {
  const collection = await getCollection();
  const uniqueKeys = [...new Set((Array.isArray(keys) ? keys : []).filter(Boolean))];
  if (!uniqueKeys.length) return;
  const $set = { updatedAt: new Date() };
  for (const key of uniqueKeys) {
    if (Object.prototype.hasOwnProperty.call(db, key)) $set[`data.${key}`] = db[key];
  }
  await collection.updateOne(
    { _id: STATE_ID },
    { $set },
    { upsert: true }
  );
}


// Fast score write for a player's own Block Puzzle attempt. This updates only
// the matching array element instead of loading/saving the entire application
// state document. Settlement for multiplayer/tournament matches still uses the
// existing locked flow for correctness.
export async function submitBlockPuzzleScoreFast(matchId, userId, score, linesCleared = 0, bestCombo = 0) {
  const collection = await getCollection();
  // MongoDB does not allow $elemMatch projection on fields nested under
  // `data`. Use an aggregation projection instead, which returns only the
  // matching match and user without reading the whole application state into
  // the Node.js process.
  const docs = await collection.aggregate([
    { $match: { _id: STATE_ID } },
    { $project: {
      blockPuzzleMatches: {
        $filter: {
          input: { $ifNull: ['$data.blockPuzzleMatches', []] },
          as: 'm',
          cond: { $and: [
            { $eq: ['$$m.id', String(matchId)] },
            { $eq: ['$$m.userId', String(userId)] }
          ] }
        }
      },
      users: {
        $filter: {
          input: { $ifNull: ['$data.users', []] },
          as: 'u',
          cond: { $eq: ['$$u.id', String(userId)] }
        }
      }
    } },
    { $limit: 1 }
  ]).toArray();
  const before = docs[0] || null;
  const session = before?.blockPuzzleMatches?.[0] || null;
  const user = before?.users?.[0] || null;
  if (!session) return { ok: false, statusCode: 404, message: 'Block Puzzle match not found.' };
  if (!['PLAYING', 'SUBMITTED'].includes(String(session.status))) {
    return { ok: false, statusCode: 409, message: 'এই ম্যাচটি আর সাবমিট করা যাবে না।' };
  }
  if (!user || user.isBanned) return { ok: false, statusCode: 403, message: 'Account unavailable' };
  const nScore = Math.max(0, Math.floor(Number(score || 0)));
  const nLines = Math.max(0, Math.floor(Number(linesCleared || 0)));
  const nCombo = Math.max(0, Math.floor(Number(bestCombo || 0)));
  if (!Number.isFinite(nScore)) return { ok: false, statusCode: 400, message: 'Invalid Block Puzzle score.' };

  const submittedAt = new Date().toISOString();
  const filter = {
    _id: STATE_ID,
    data: { $exists: true },
    'data.blockPuzzleMatches': { $elemMatch: { id: String(matchId), userId: String(userId), status: { $in: ['PLAYING', 'SUBMITTED'] } } }
  };
  const result = await collection.updateOne(filter, {
    $set: {
      'data.blockPuzzleMatches.$[m].status': session.status === 'PLAYING' ? 'SUBMITTED' : session.status,
      'data.blockPuzzleMatches.$[m].submittedAt': session.status === 'PLAYING' ? submittedAt : (session.submittedAt || submittedAt),
      'data.blockPuzzleMatches.$[m].gameEndedAt': session.status === 'PLAYING' ? submittedAt : (session.gameEndedAt || submittedAt),
      'data.blockPuzzleMatches.$[m].score': nScore,
      'data.blockPuzzleMatches.$[m].linesCleared': nLines,
      'data.blockPuzzleMatches.$[m].bestCombo': nCombo,
      updatedAt: new Date()
    }
  }, { arrayFilters: [{ 'm.id': String(matchId), 'm.userId': String(userId), 'm.status': { $in: ['PLAYING', 'SUBMITTED'] } }] });
  if (result.matchedCount !== 1) return { ok: false, statusCode: 409, message: 'এই ম্যাচটি ইতিমধ্যে পরিবর্তিত হয়েছে। আবার চেষ্টা করুন।' };
  return {
    ok: true,
    needsSettlement: Boolean(session.duelId || session.tournamentId),
    duelId: session.duelId || null,
    tournamentId: session.tournamentId || null,
    userId: String(userId),
    matchId: String(matchId),
    // The read above is already enough to answer a normal solo submission.
    // Returning these snapshots avoids a second full app_state read at game end.
    session: { ...session, status: session.status === 'PLAYING' ? 'SUBMITTED' : session.status, submittedAt: session.status === 'PLAYING' ? submittedAt : (session.submittedAt || submittedAt), gameEndedAt: session.status === 'PLAYING' ? submittedAt : (session.gameEndedAt || submittedAt), score: nScore, linesCleared: nLines, bestCombo: nCombo },
    user
  };
}


// A short, robust distributed lock for the legacy single-document store.
// This keeps existing routes/behaviour intact while avoiding false "busy" errors
// caused by MongoDB upsert races between Vercel instances.
export async function withDbLock(fn, timeoutMs = 20000) {
  const collection = await getCollection();
  const locks = collection.db.collection(LOCK_COLLECTION_NAME);
  const owner = crypto.randomUUID();
  const deadline = Date.now() + timeoutMs;
  const leaseMs = 60000;
  let acquired = false;

  while (Date.now() < deadline) {
    const nowMs = Date.now();
    const filter = {
      _id: 'block-puzzle',
      $or: [
        { expiresAt: { $lte: new Date(nowMs) } },
        { expiresAt: { $exists: false } }
      ]
    };

    try {
      // First try to claim an existing/expired lock without upsert. This avoids
      // duplicate-key errors when many serverless instances race for the lock.
      const updated = await locks.updateOne(
        filter,
        { $set: { owner, expiresAt: new Date(nowMs + leaseMs) } }
      );

      if (updated.matchedCount === 1 || updated.modifiedCount === 1) {
        acquired = true;
        break;
      }

      // If the lock document does not exist, exactly one concurrent request can
      // create it. Everyone else simply retries instead of reporting "busy".
      try {
        await locks.insertOne({
          _id: 'block-puzzle',
          owner,
          expiresAt: new Date(nowMs + leaseMs)
        });
        acquired = true;
        break;
      } catch (err) {
        if (err?.code !== 11000) throw err;
      }
    } catch (err) {
      // Do not hide real MongoDB/configuration failures behind a misleading
      // matchmaking message. Only lock contention should reach the retry loop.
      if (err?.code !== 11000) throw err;
    }

    await new Promise(r => setTimeout(r, 100));
  }

  if (!acquired) {
    throw new Error('Matchmaking server is temporarily busy. Please try again in a moment.');
  }

  try {
    return await fn();
  } finally {
    await locks.deleteOne({ _id: 'block-puzzle', owner }).catch(() => {});
  }
}

export function id(prefix='id') { return `${prefix}_${crypto.randomUUID()}`; }
export function now() { return new Date().toISOString(); }
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
export function verifyPassword(password, stored) {
  try {
    const [salt, hex] = stored.split(':');
    const a = Buffer.from(hex, 'hex');
    const b = crypto.scryptSync(password, salt, 64);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch { return false; }
}
export function publicUser(u) {
  if (!u) return null;
  const { passwordHash, password, ...safe } = u;
  return safe;
}
