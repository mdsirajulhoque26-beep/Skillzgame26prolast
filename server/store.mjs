import crypto from 'node:crypto';
import { MongoClient } from 'mongodb';

const getMongoUri = () => process.env.MONGODB_URI?.trim();
const DB_NAME = process.env.MONGODB_DB || 'skillzgame';
const COLLECTION_NAME = process.env.MONGODB_COLLECTION || 'app_state';
const LOCK_COLLECTION_NAME = `${COLLECTION_NAME}_locks`;
const STATE_ID = 'main';

const defaults = {
  users: [], matches: [], blockPuzzleMatches: [], arcadeMatches: [], arcadeQueue: [], leaderboards: [], tournaments: [], tournamentEntries: [], games: [{ id: 'game_block_puzzle', name: 'Block Puzzle Duel', slug: 'block-puzzle', gameType: 'block_puzzle', icon: '🧩', description: '১০x১০ স্মার্ট ব্লক পাজল • Online Duel', entryFee: 100, prizeAmount: 180, active: true, showOnHome: true, displayOrder: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { id: 'game_pool', name: '8 Ball Pool', slug: '8-ball-pool', gameType: 'pool', icon: '🎱', description: 'Smooth Online 1v1 Pool', entryFee: 20, prizeAmount: 36, active: true, showOnHome: true, displayOrder: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { id: 'game_carrom', name: 'Carrom', slug: 'carrom', gameType: 'carrom', icon: '🪙', description: 'Smooth Online 1v1 Carrom', entryFee: 20, prizeAmount: 36, active: true, showOnHome: true, displayOrder: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }], transactions: [], depositRequests: [], withdrawRequests: [], resultSubmissions: [],
  paymentSettings: {
    bkash: '', bkashAgent: '', nagad: '', rocket: '', upay: '', binanceUsdt: '', bkashAgentEnabled: true, binanceUsdtEnabled: true, depositBkashEnabled: true, depositBkashAgentEnabled: true, depositNagadEnabled: true, depositRocketEnabled: true, depositUpayEnabled: true, depositBinanceUsdtEnabled: true, withdrawBkashEnabled: true, withdrawNagadEnabled: true, withdrawRocketEnabled: true, withdrawUpayEnabled: true, withdrawBinanceUsdtEnabled: true, whatsappSupport: '', telegramLink: '',
    marqueeNotice: 'Welcome to Skillzgame', popupNoticeTitle: 'Notice', popupNoticeText: 'Play fairly and have fun.', proMatchFees: [20, 30, 60, 120, 250, 500], multiplayerProMatches: [{id:'mp_3',players:3,entryFee:20,prizeAmount:50,active:false,showOnHome:true,displayOrder:1},{id:'mp_5',players:5,entryFee:30,prizeAmount:80,active:false,showOnHome:true,displayOrder:2},{id:'mp_7',players:7,entryFee:60,prizeAmount:160,active:false,showOnHome:true,displayOrder:3},{id:'mp_10',players:10,entryFee:120,prizeAmount:300,active:false,showOnHome:true,displayOrder:4}]
  }
};

let clientPromise;
let collectionPromise;

function cloneDefaults() {
  return structuredClone(defaults);
}

async function getCollection() {
  const MONGODB_URI = getMongoUri();
  if (!MONGODB_URI) throw new Error('MONGODB_URI is not configured');
  if (!clientPromise) {
    const client = new MongoClient(MONGODB_URI, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000, socketTimeoutMS: 10000 });
    clientPromise = client.connect();
  }
  if (!collectionPromise) {
    collectionPromise = clientPromise.then(client => client.db(DB_NAME).collection(COLLECTION_NAME));
  }
  return collectionPromise;
}

export async function loadDb() {
  const collection = await getCollection();
  const doc = await collection.findOne({ _id: STATE_ID });
  if (doc?.data) { const data = { ...cloneDefaults(), ...doc.data }; if (!Array.isArray(data.games)) data.games = structuredClone(defaults.games); if (!Array.isArray(data.tournamentEntries)) data.tournamentEntries = []; if (!Array.isArray(data.arcadeMatches)) data.arcadeMatches = []; if (!Array.isArray(data.arcadeQueue)) data.arcadeQueue = []; return data; }

  const data = cloneDefaults();
  await collection.updateOne(
    { _id: STATE_ID },
    { $setOnInsert: { _id: STATE_ID, data, updatedAt: new Date() } },
    { upsert: true }
  );
  return data;
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


export async function withDbLock(fn, timeoutMs = 7000) {
  const collection = await getCollection();
  const locks = collection.db.collection(LOCK_COLLECTION_NAME);
  const owner = crypto.randomUUID();
  const deadline = Date.now() + timeoutMs;
  let acquired = false;
  while (Date.now() < deadline) {
    const nowMs = Date.now();
    const result = await locks.findOneAndUpdate(
      { _id: 'block-puzzle', $or: [{ expiresAt: { $lte: new Date(nowMs) } }, { expiresAt: { $exists: false } }] },
      { $set: { owner, expiresAt: new Date(nowMs + 12000) } },
      { upsert: true, returnDocument: 'after' }
    ).catch(() => null);
    if (result?.value?.owner === owner || result?.owner === owner) { acquired = true; break; }
    await new Promise(r => setTimeout(r, 80));
  }
  if (!acquired) throw new Error('Matchmaking server is busy. Please try again.');
  try { return await fn(); }
  finally { await locks.deleteOne({ _id: 'block-puzzle', owner }).catch(() => {}); }
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
