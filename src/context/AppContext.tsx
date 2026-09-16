import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  Match, 
  Transaction, 
  TabType, 
  MatchCategory, 
  DepositRequest, 
  WithdrawRequest, 
  ResultSubmission, 
  PaymentSettings 
} from '../types';
const initialUser: User = { id: '', name: '', phone: '', isAdmin: false, ludoKingName: '', gamingBalance: 0, winningBalance: 0, matchesPlayed: 0, totalWinnings: 0, referralCode: '', joinedAt: '' };
const initialPaymentSettings: PaymentSettings = { bkash: '', bkashAgent: '', nagad: '', rocket: '', upay: '', binanceUsdt: '', bkashAgentEnabled: true, binanceUsdtEnabled: true, depositBkashEnabled: true, depositBkashAgentEnabled: true, depositNagadEnabled: true, depositRocketEnabled: true, depositUpayEnabled: true, depositBinanceUsdtEnabled: true, withdrawBkashEnabled: true, withdrawNagadEnabled: true, withdrawRocketEnabled: true, withdrawUpayEnabled: true, withdrawBinanceUsdtEnabled: true, whatsappSupport: '', telegramLink: '', marqueeNotice: '', popupNoticeTitle: '', popupNoticeText: '', proMatchFees: [20, 30, 60, 120, 250, 500], multiplayerProMatches: [{id:'mp_3',players:3,entryFee:20,prizeAmount:40,prizes:[40],active:false,showOnHome:true,displayOrder:1},{id:'mp_5',players:5,entryFee:30,prizeAmount:80,prizes:[80],active:false,showOnHome:true,displayOrder:2},{id:'mp_7',players:7,entryFee:60,prizeAmount:160,prizes:[160],active:false,showOnHome:true,displayOrder:3},{id:'mp_10',players:10,entryFee:120,prizeAmount:300,prizes:[300],active:false,showOnHome:true,displayOrder:4}] };
import confetti from 'canvas-confetti';
import { backendApi } from '../services/backendApi';

interface AppContextType {
  user: User;
  isLoggedIn: boolean;
  login: (phone: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, phone: string, pass: string, refCode?: string) => Promise<{ success: boolean; message?: string }>;
  refreshUsers: () => Promise<void>;
  logout: () => void;
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  matches: Match[];
  matchFilter: MatchCategory;
  setMatchFilter: (cat: MatchCategory) => void;
  transactions: Transaction[];
  activeModal: string | null;
  openModal: (modalName: string, payload?: any) => void;
  closeModal: () => void;
  modalPayload: any;
  joinMatch: (matchId: string, ludoKingName: string) => Promise<{ success: boolean; message: string }> ;
  depositMoney: (method: 'bKash' | 'bKash Agent' | 'Nagad' | 'Rocket' | 'Upay' | 'Binance / USDT', amount: number, senderNumber: string, trxId: string) => Promise<{success:boolean;message:string}>;
  withdrawMoney: (method: 'bKash' | 'bKash Agent' | 'Nagad' | 'Rocket' | 'Binance / USDT', accountType: 'Personal' | 'Agent', accountNumber: string, amount: number) => Promise<{ success: boolean; message: string }> ;
  transferWinningBalance: (amount: number) => Promise<{ success: boolean; message: string }> ;
  submitBlockPuzzleResult: (matchId: string, score: number, prizeAmount: number, image?: string) => Promise<{ success: boolean; message: string; match?: any }> ;
  refreshMatches: () => Promise<void>;
  isRefreshing: boolean;
  startBlockPuzzleMatch: (entryFee: number, prize?: number, playerCount?: number, gameType?: string, gameSeed?: number) => Promise<{ success: boolean; message: string; matchId?: string; gameStartedAt?: string | null; startsAt?: string | null; gameSeed?: number | null; playerCount?: number; match?: any }>;
  finishBlockPuzzleMatch: (matchId: string, entryFee: number, won: boolean, prize: number, score: number, isDraw?: boolean) => void;
  refundBlockPuzzleMatch: (matchId: string, entryFee: number, reason?: string) => Promise<{ success: boolean; message: string }>;
  getActiveBlockPuzzleMatch: () => Promise<any | null>;
  getMyBlockPuzzleMatches: () => Promise<any[]>;
  getMyPendingGames: () => Promise<any[]>;
  getBlockPuzzleMatchStatus: (matchId: string) => Promise<any | null>;
  pauseBlockPuzzleMatch: (matchId: string) => Promise<{ success: boolean; message: string; match?: any }>;
  resumeBlockPuzzleMatch: (matchId: string) => Promise<{ success: boolean; message: string; match?: any }>;
  
  // Admin Context
  isAdminMode: boolean;
  setIsAdminMode: (val: boolean) => void;
  registeredUsers: User[];
  depositRequests: DepositRequest[];
  withdrawRequests: WithdrawRequest[];
  resultSubmissions: ResultSubmission[];
  paymentSettings: PaymentSettings;
  updatePaymentSettings: (settings: Partial<PaymentSettings>) => Promise<boolean>;
  createMatch: (match: Partial<Match>) => Promise<boolean>;
  setMatchRoomCode: (matchId: string, roomCode: string) => Promise<boolean>;
  cancelMatchAndRefund: (matchId: string, reason?: string) => Promise<boolean>;
  deleteMatch: (matchId: string) => Promise<boolean>;
  approveDepositRequest: (requestId: string) => Promise<{ success: boolean; message: string }>;
  rejectDepositRequest: (requestId: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  deleteDepositRequest: (requestId: string) => Promise<{ success: boolean; message: string }>;
  deleteWithdrawRequest: (requestId: string) => Promise<{ success: boolean; message: string }>;
  approveWithdrawRequest: (requestId: string, adminTrxId?: string) => Promise<{ success: boolean; message: string }>;
  rejectWithdrawRequest: (requestId: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  approveResultSubmission: (submissionId: string) => Promise<{ success: boolean; message: string }>;
  rejectResultSubmission: (submissionId: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  adjustUserBalance: (userId: string, balanceType: 'gaming' | 'winning', amount: number, isAddition: boolean, note?: string, adjustmentId?: string) => Promise<boolean>;
  toggleUserBan: (userId: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  resetUserPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('skillz_user_cache');
    const token = localStorage.getItem('skillz_api_token');
    if (saved && token) { try { return JSON.parse(saved); } catch {} }
    return initialUser;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => Boolean(localStorage.getItem('skillz_api_token')));

  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => Boolean(localStorage.getItem('skillz_api_token')) && localStorage.getItem('skillz_admin_mode') === 'true');

  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [matchFilter, setMatchFilter] = useState<MatchCategory>('special');

  const [matches, setMatches] = useState<Match[]>([]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);

  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);

  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);

  const [resultSubmissions, setResultSubmissions] = useState<ResultSubmission[]>([]);

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(initialPaymentSettings);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalPayload, setModalPayload] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('skillz_user_cache', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('skillz_auth', String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('skillz_admin_mode', String(isAdminMode));
  }, [isAdminMode]);








  const mapApiUser = (apiUser: any): User => ({
    id: String(apiUser.id),
    name: String(apiUser.name || ''),
    phone: String(apiUser.phone || ''),
    isAdmin: Boolean(apiUser.isAdmin),
    isBanned: Boolean(apiUser.isBanned),
    ludoKingName: String(apiUser.ludoKingName || apiUser.name || ''),
    gamingBalance: Number(apiUser.gamingBalance || 0),
    winningBalance: Number(apiUser.winningBalance || 0),
    matchesPlayed: Number(apiUser.matchesPlayed || 0),
    totalWinnings: Number(apiUser.totalWinnings ?? apiUser.winningBalance ?? 0),
    referralCode: String(apiUser.referralCode || apiUser.refCode || ''),
    referredBy: apiUser.referredBy || apiUser.refCode || undefined,
    joinedAt: String(apiUser.joinedAt || apiUser.createdAt || ''),
    avatarUrl: apiUser.avatarUrl,
  });

  const applyApiUser = (apiUser: any) => {
    const mapped = mapApiUser(apiUser);
    setUser(mapped);
    setRegisteredUsers(prev => [mapped, ...prev.filter(u => u.id !== mapped.id)]);
    return mapped;
  };
  const refreshUsers = async () => {
    try {
      const [users, deps, wds, results, matchData] = await Promise.all([backendApi.users(), backendApi.depositRequests(), backendApi.withdrawRequests(), backendApi.resultSubmissions(), backendApi.matches()]);
      setRegisteredUsers(users.users.map(mapApiUser));
      setDepositRequests(deps.depositRequests as DepositRequest[]);
      setWithdrawRequests(wds.withdrawRequests as WithdrawRequest[]);
      setResultSubmissions(results.resultSubmissions as ResultSubmission[]);
      setMatches(matchData.matches as Match[]);
    } catch (error) { console.error('Failed to refresh admin data:', error); }
  };
  const refreshBackendState = async (adminMode = Boolean(user.isAdmin)) => {
    const me = await backendApi.me();
    const meUser = applyApiUser(me.user);
    const [matchData, txData, settings, mine] = await Promise.all([backendApi.matches(), backendApi.transactions(), backendApi.settings(), backendApi.myRequests()]);
    setMatches(matchData.matches as Match[]); setTransactions(txData.transactions as Transaction[]); setPaymentSettings({ ...(settings.paymentSettings as PaymentSettings), referralEnabled: settings.referralSettings?.enabled, referralBonusAmount: settings.referralSettings?.bonusAmount, referralMinDeposit: settings.referralSettings?.minDeposit, referralRequireFirstProMatch: settings.referralSettings?.requireFirstProMatch });
    setDepositRequests(mine.depositRequests as DepositRequest[]); setWithdrawRequests(mine.withdrawRequests as WithdrawRequest[]); setResultSubmissions(mine.resultSubmissions as ResultSubmission[]);
    if (adminMode || meUser.isAdmin) {
      const [users, deps, wds, results] = await Promise.all([backendApi.users(), backendApi.depositRequests(), backendApi.withdrawRequests(), backendApi.resultSubmissions()]);
      setRegisteredUsers(users.users.map(mapApiUser)); setDepositRequests(deps.depositRequests as DepositRequest[]); setWithdrawRequests(wds.withdrawRequests as WithdrawRequest[]); setResultSubmissions(results.resultSubmissions as ResultSubmission[]);
    }
  };
  useEffect(() => {
    if (!localStorage.getItem('skillz_api_token')) return;
    refreshBackendState().catch(() => { localStorage.removeItem('skillz_api_token'); setIsLoggedIn(false); setIsAdminMode(false); });
  }, []);

  // Live lobby polling keeps online matchmaking and admin queues synchronized across devices.
  useEffect(() => {
    if (!isLoggedIn || !localStorage.getItem('skillz_api_token')) return;
    const timer = window.setInterval(async () => {
      refreshMatches();
      try {
        const [me, txData, mine] = await Promise.all([backendApi.me(), backendApi.transactions(), backendApi.myRequests()]);
        applyApiUser(me.user);
        setTransactions(txData.transactions as Transaction[]);
        setDepositRequests(mine.depositRequests as DepositRequest[]);
        setWithdrawRequests(mine.withdrawRequests as WithdrawRequest[]);
        setResultSubmissions(mine.resultSubmissions as ResultSubmission[]);
      } catch (e) { console.error('User state refresh failed:', e); }
      if (isAdminMode) refreshUsers();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [isLoggedIn, isAdminMode]);

  const login = async (phone: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    const cleanPhone = phone.trim();
    const cleanPass = pass.trim();
    if (cleanPhone.length < 10) return { success: false, message: 'সঠিক মোবাইল নম্বর দিন (কমপক্ষে ১০ ডিজিট)' };
    if (cleanPass.length < 4) return { success: false, message: 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে' };

    try {
      const data = await backendApi.login(cleanPhone, cleanPass);
      localStorage.setItem('skillz_api_token', data.token);
      const loggedInUser = mapApiUser(data.user);
      setUser(loggedInUser);
      setIsLoggedIn(true);
      setIsAdminMode(Boolean(loggedInUser.isAdmin));
                        setActiveModal(null);
      await refreshBackendState(Boolean(loggedInUser.isAdmin));
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error?.message || 'মোবাইল নম্বর অথবা পাসওয়ার্ড ভুল হয়েছে।' };
    }
  };

  const register = async (name: string, phone: string, pass: string, refCode?: string): Promise<{ success: boolean; message?: string }> => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanPass = pass.trim();
    if (!cleanName) return { success: false, message: 'আপনার পূর্ণ নাম লিখুন' };
    if (cleanPhone.length < 10) return { success: false, message: 'সঠিক মোবাইল নম্বর দিন (কমপক্ষে ১০ ডিজিট)' };
    if (cleanPass.length < 4) return { success: false, message: 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে' };

    try {
      const data = await backendApi.register(cleanName, cleanPhone, cleanPass, refCode || '');
      localStorage.setItem('skillz_api_token', data.token);
      const newUser = mapApiUser(data.user);
      setUser(newUser);
      setRegisteredUsers(prev => [newUser, ...prev.filter(u => u.id !== newUser.id && u.phone !== newUser.phone)]);
      setIsLoggedIn(true);
                  await refreshBackendState(false);
      setActiveModal('notice');
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error?.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।' };
    }
  };

  const logout = () => {
    localStorage.removeItem('skillz_api_token');
    setIsLoggedIn(false);
    setIsAdminMode(false);
    setCurrentTab('home');
  };

  const openModal = (modalName: string, payload: any = null) => {
    setActiveModal(modalName);
    setModalPayload(payload);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalPayload(null);
  };

  const refreshMatches = async () => { setIsRefreshing(true); try { const data = await backendApi.matches(); setMatches(data.matches as Match[]); } catch(e) { console.error(e); } finally { setIsRefreshing(false); } };
  const joinMatch = async (matchId: string, ludoKingName: string): Promise<{success:boolean;message:string}> => { try { const data=await backendApi.joinMatch(matchId,ludoKingName.trim()); applyApiUser(data.user); setMatches(prev=>prev.map(m=>m.id===data.match.id?data.match as Match:m)); const tx=await backendApi.transactions(); setTransactions(tx.transactions as Transaction[]); return {success:true,message:data.match.roomCode?`ম্যাচ #${data.match.matchNo} তে জয়েন সম্পন্ন! রুম কোড: ${data.match.roomCode}`:`ম্যাচ #${data.match.matchNo} তে সফলভাবে জয়েন করেছেন! অন্য প্লেয়ারের অপেক্ষায়।`}; } catch(e:any){return {success:false,message:e?.message||'ম্যাচে জয়েন করা যায়নি।'};} };

  // User submits Deposit Request
  const depositMoney = async (method: 'bKash'|'bKash Agent'|'Nagad'|'Rocket'|'Upay'|'Binance / USDT', amount:number, senderNumber:string, trxId:string):Promise<{success:boolean;message:string}> => { if(amount<=0||!senderNumber.trim()||!trxId.trim()) return {success:false,message:'সঠিক ডিপোজিট তথ্য দিন।'}; try{await backendApi.createDeposit({method,amount,senderNumber:senderNumber.trim(),trxId:trxId.trim().toUpperCase()}); const mine=await backendApi.myRequests(); setDepositRequests(mine.depositRequests as DepositRequest[]); const tx=await backendApi.transactions(); setTransactions(tx.transactions as Transaction[]); return {success:true,message:'ডিপোজিট রিকোয়েস্ট সফলভাবে জমা হয়েছে।'};}catch(e:any){console.error(e);return {success:false,message:e?.message||'ডিপোজিট রিকোয়েস্ট ব্যর্থ হয়েছে।'};} };

  // User submits Withdraw Request
  const withdrawMoney = async (method:'bKash'|'bKash Agent'|'Nagad'|'Rocket'|'Binance / USDT', accountType:'Personal'|'Agent', accountNumber:string, amount:number):Promise<{success:boolean;message:string}> => { if(amount<100)return {success:false,message:'সর্বনিম্ন উইথড্রয়াল পরিমাণ ৳১০০ টাকা।'}; try{const data=await backendApi.createWithdraw({method,accountType,accountNumber:accountNumber.trim(),amount}); applyApiUser(data.user); const mine=await backendApi.myRequests(); setWithdrawRequests(mine.withdrawRequests as WithdrawRequest[]); const tx=await backendApi.transactions(); setTransactions(tx.transactions as Transaction[]); return {success:true,message:`৳${amount} টাকা উইথড্রয়াল রিকোয়েস্ট জমা হয়েছে। এডমিন যাচাই করে টাকা পাঠাবে।`};}catch(e:any){return {success:false,message:e?.message||'উইথড্র রিকোয়েস্ট ব্যর্থ হয়েছে।'};} };

  // Transfer winning to gaming
  const transferWinningBalance = async (amount:number):Promise<{success:boolean;message:string}> => { if(amount<=0)return {success:false,message:'সঠিক পরিমাণ লিখুন।'}; try{const data=await backendApi.transferWinning(amount); applyApiUser(data.user); const tx=await backendApi.transactions(); setTransactions(tx.transactions as Transaction[]); return {success:true,message:`৳${amount} টাকা গেমিং ব্যালেন্সে সফলভাবে ট্রান্সফার করা হয়েছে!`};}catch(e:any){return {success:false,message:e?.message||'ট্রান্সফার ব্যর্থ হয়েছে।'};} };

  // Block Puzzle Duel Match Handlers
  const getActiveBlockPuzzleMatch = async () => {
    try {
      const data = await backendApi.activeBlockPuzzleMatch();
      return data.match || null;
    } catch {
      return null;
    }
  };

  const getMyBlockPuzzleMatches = async () => {
    const data = await backendApi.myBlockPuzzleMatches();
    return data.matches || [];
  };

  const getMyPendingGames = async () => {
    const data = await backendApi.history();
    return data.items || [];
  };

  const getBlockPuzzleMatchStatus = async (matchId: string) => {
    try {
      const data = await backendApi.blockPuzzleMatchStatus(matchId);
      if (data.user) applyApiUser(data.user);
      return data.match || null;
    } catch { return null; }
  };

  const pauseBlockPuzzleMatch = async (matchId: string) => {
    try {
      const data = await backendApi.pauseBlockPuzzleMatch(matchId);
      if (data.user) applyApiUser(data.user);
      return { success: true, message: 'ম্যাচ Pause হয়েছে।', match: data.match };
    } catch (e: any) { return { success: false, message: e?.message || 'ম্যাচ Pause করা যায়নি।' }; }
  };

  const resumeBlockPuzzleMatch = async (matchId: string) => {
    try {
      const data = await backendApi.resumeBlockPuzzleMatch(matchId);
      if (data.user) applyApiUser(data.user);
      return { success: true, message: 'ম্যাচ Resume হয়েছে।', match: data.match };
    } catch (e: any) { return { success: false, message: e?.message || 'ম্যাচ Resume করা যায়নি।' }; }
  };

  const startBlockPuzzleMatch = async (entryFee: number, prize = 0, playerCount = 2, gameType = 'block_puzzle', gameSeed?: number): Promise<{ success: boolean; message: string; matchId?: string; gameStartedAt?: string | null; startsAt?: string | null; gameSeed?: number | null; playerCount?: number; match?: any }> => {
    try {
      const data = await backendApi.startBlockPuzzleMatch(entryFee, prize, playerCount, gameType, gameSeed);
      applyApiUser(data.user);
      // Do not block Pro Match startup on the separate transaction-history
      // request. On a cold/serverless MongoDB connection that read can take
      // several seconds (or hit a connection timeout), even though the paid
      // match itself has already been created successfully. Refresh history
      // in the background so the 3-second game countdown can start immediately.
      backendApi.transactions()
        .then(tx => setTransactions(tx.transactions as Transaction[]))
        .catch(() => {});
      return { success: true, message: 'ম্যাচ শুরু হয়েছে!', match: data.match, matchId: String(data.match.id), gameStartedAt: data.match.gameStartedAt || null, startsAt: data.match.startsAt || data.match.gameStartedAt || null, gameSeed: Number(data.match.gameSeed) || null, playerCount: Number(data.match.playerCount || playerCount) };
    } catch (e: any) {
      return { success: false, message: e?.message || 'ম্যাচ শুরু করা যায়নি।' };
    }
  };

  const finishBlockPuzzleMatch = (
    _matchId: string,
    _entryFee: number,
    won: boolean,
    _prize: number,
    _score: number,
    isDraw = false
  ) => {
    setUser(prev => {
      const updated = {
        ...prev,
        matchesWon: won ? (prev.matchesWon || 0) + 1 : prev.matchesWon,
      };
      setRegisteredUsers(users => users.map(u => u.id === prev.id ? updated : u));
      return updated;
    });
    if (won && !isDraw) confetti({ particleCount: 120, spread: 90, origin: { y: 0.45 } });
  };

  const refundBlockPuzzleMatch = async (matchId: string, _entryFee: number, reason = 'Match Aborted'): Promise<{ success: boolean; message: string }> => {
    try {
      const data = await backendApi.refundBlockPuzzleMatch(matchId, reason);
      applyApiUser(data.user);
      const tx = await backendApi.transactions();
      setTransactions(tx.transactions as Transaction[]);
      return { success: true, message: 'এন্ট্রি ফি রিফান্ড করা হয়েছে।' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'রিফান্ড করা যায়নি।' };
    }
  };

  const submitBlockPuzzleResult = async (matchId: string, score: number, prizeAmount: number, image?: string) => {
    try {
      const data = await backendApi.submitBlockPuzzleMatch(matchId, score, 0, 0);
      if (data.user) applyApiUser(data.user);
      // Do not block the player's result screen on a second transactions request.
      // The score submission response is already authoritative; transaction history
      // can refresh in the background without making the player wait.
      void backendApi.transactions()
        .then(tx => setTransactions(tx.transactions as Transaction[]))
        .catch(() => {});
      return { success: true, message: 'স্কোর সার্ভারে জমা হয়েছে।', match: data.match };
    } catch (e: any) {
      return { success: false, message: e?.message || 'স্কোর জমা দেওয়া যায়নি।' };
    }
  };

  // ================= ADMIN ACTIONS =================
  const createMatch = async (matchData: Partial<Match>) => { try{const data=await backendApi.createMatch(matchData);setMatches(prev=>[data.match as Match,...prev]);return true;}catch(e){console.error(e);return false;} };
  const setMatchRoomCode = async (matchId:string,roomCode:string) => { try{const data=await backendApi.setRoom(matchId,roomCode);setMatches(prev=>prev.map(m=>m.id===matchId?data.match as Match:m));return true;}catch(e){console.error(e);return false;} };
  const cancelMatchAndRefund = async (matchId:string,reason='Admin cancelled match') => { try{const data=await backendApi.cancelMatch(matchId,reason);setMatches(prev=>prev.map(m=>m.id===matchId?data.match as Match:m));await refreshUsers();return true;}catch(e){console.error(e);return false;} };
  const deleteMatch = async (matchId:string) => { try{await backendApi.deleteMatch(matchId);setMatches(prev=>prev.filter(m=>m.id!==matchId));return true;}catch(e){console.error(e);return false;} };
  const approveDepositRequest = async (requestId:string) => { try{const data=await backendApi.updateDeposit(requestId,'APPROVED');setDepositRequests(prev=>prev.map(r=>r.id===requestId?data.request as DepositRequest:r));await refreshUsers();return {success:true,message:`৳${data.request.amount} টাকা ব্যবহারকারীর গেমিং ব্যালেন্সে যোগ হয়েছে!`};}catch(e:any){return {success:false,message:e?.message||'অনুমোদন ব্যর্থ হয়েছে।'};} };
  const rejectDepositRequest = async (requestId:string,reason='ভুল ট্রানজেকশন আইডি') => { try{const data=await backendApi.updateDeposit(requestId,'REJECTED',reason);setDepositRequests(prev=>prev.map(r=>r.id===requestId?data.request as DepositRequest:r));return {success:true,message:'ডিপোজিট রিকোয়েস্ট বাতিল করা হয়েছে।'};}catch(e:any){return {success:false,message:e?.message||'বাতিল করা যায়নি।'};} };
  const approveWithdrawRequest = async (requestId:string,adminTrxId=`ADM${Math.floor(100000+Math.random()*900000)}`) => { try{const data=await backendApi.updateWithdraw(requestId,'APPROVED',adminTrxId);setWithdrawRequests(prev=>prev.map(r=>r.id===requestId?data.request as WithdrawRequest:r));return {success:true,message:`৳${data.request.amount} টাকা উইথড্র পরিশোধ হিসেবে চিহ্নিত করা হয়েছে!`};}catch(e:any){return {success:false,message:e?.message||'অনুমোদন ব্যর্থ হয়েছে।'};} };
  const rejectWithdrawRequest = async (requestId:string,reason='ভুল একাউন্ট নম্বর বা তথ্যে ত্রুটি') => { try{const data=await backendApi.updateWithdraw(requestId,'REJECTED','',reason);setWithdrawRequests(prev=>prev.map(r=>r.id===requestId?data.request as WithdrawRequest:r));if(data.user)applyApiUser(data.user);return {success:true,message:'উইথড্র বাতিল করে ব্যবহারকারীকে টাকা রিফান্ড করা হয়েছে।'};}catch(e:any){return {success:false,message:e?.message||'রিফান্ড ব্যর্থ হয়েছে।'};} };
  const deleteDepositRequest = async (requestId:string) => { try { await backendApi.deleteDeposit(requestId); setDepositRequests(prev=>prev.filter(r=>r.id!==requestId)); return {success:true,message:'Deposit request delete হয়েছে।'}; } catch(e:any) { return {success:false,message:e?.message||'Deposit request delete করা যায়নি।'}; } };
  const deleteWithdrawRequest = async (requestId:string) => { try { await backendApi.deleteWithdraw(requestId); setWithdrawRequests(prev=>prev.filter(r=>r.id!==requestId)); return {success:true,message:'Withdrawal request delete হয়েছে।'}; } catch(e:any) { return {success:false,message:e?.message||'Withdrawal request delete করা যায়নি।'}; } };
  const approveResultSubmission = async (submissionId:string) => { try{const data=await backendApi.updateResult(submissionId,'APPROVED');setResultSubmissions(prev=>prev.map(s=>s.id===submissionId?data.submission as ResultSubmission:s));if(data.user)applyApiUser(data.user);await refreshMatches();return {success:true,message:`🎉 বিজয়ী ${data.submission.userName} কে ৳${data.submission.prizeAmount} টাকা উইনিং ব্যালেন্সে যোগ করে দেওয়া হয়েছে!`};}catch(e:any){return {success:false,message:e?.message||'রেজাল্ট অনুমোদন ব্যর্থ হয়েছে।'};} };
  const rejectResultSubmission = async (submissionId:string,reason='ভুল বা নকল স্ক্রিনশট') => { try{const data=await backendApi.updateResult(submissionId,'REJECTED',reason);setResultSubmissions(prev=>prev.map(s=>s.id===submissionId?data.submission as ResultSubmission:s));return {success:true,message:'রেজাল্ট স্ক্রিনশট বাতিল করা হয়েছে।'};}catch(e:any){return {success:false,message:e?.message||'বাতিল করা যায়নি।'};} };
  const adjustUserBalance = async (userId:string,balanceType:'gaming'|'winning',amount:number,isAddition:boolean,note='Admin adjustment',adjustmentId='') => { try{const data=await backendApi.adjustBalance(userId,balanceType,amount,isAddition,note,adjustmentId);const mapped=mapApiUser(data.user);setRegisteredUsers(prev=>prev.map(u=>u.id===mapped.id?mapped:u));if(user.id===mapped.id)setUser(mapped);return true;}catch(e){console.error(e);return false;} };
  const toggleUserBan = async (userId:string) => { const target=registeredUsers.find(u=>u.id===userId);if(!target)return false;try{const data=await backendApi.toggleBan(userId,!Boolean(target.isBanned));const mapped=mapApiUser(data.user);setRegisteredUsers(prev=>prev.map(u=>u.id===mapped.id?mapped:u));return true;}catch(e){console.error(e);return false;} };
  const deleteUser = async (userId:string) => { try { await backendApi.deleteUser(userId); setRegisteredUsers(prev=>prev.filter(u=>u.id!==userId)); return {success:true,message:'ইউজার একাউন্ট সম্পূর্ণভাবে ডিলিট হয়েছে।'}; } catch(e:any) { console.error(e); return {success:false,message:e?.message||'ইউজার ডিলিট করা যায়নি।'}; } };
  const resetUserPassword = async (userId:string,newPassword:string) => { try{await backendApi.resetPassword(userId,newPassword);return {success:true,message:'ইউজারের পাসওয়ার্ড সফলভাবে রিসেট হয়েছে।'};}catch(e:any){return {success:false,message:e?.message||'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে।'};} };
  const updatePaymentSettings = async (newSettings:Partial<PaymentSettings>) => { try{const data=await backendApi.updateSettings(newSettings);setPaymentSettings({ ...(data.paymentSettings as PaymentSettings), referralEnabled: data.referralSettings?.enabled, referralBonusAmount: data.referralSettings?.bonusAmount, referralMinDeposit: data.referralSettings?.minDeposit, referralRequireFirstProMatch: data.referralSettings?.requireFirstProMatch });return true;}catch(e){console.error(e);return false;} };

  return (
    <AppContext.Provider
      value={{
        user,
        isLoggedIn,
        login,
        register,
        logout,
        currentTab,
        setCurrentTab,
        matches,
        matchFilter,
        setMatchFilter,
        transactions,
        activeModal,
        openModal,
        closeModal,
        modalPayload,
        joinMatch,
        depositMoney,
        withdrawMoney,
        transferWinningBalance,
        submitBlockPuzzleResult,
        refreshMatches,
        isRefreshing,
        startBlockPuzzleMatch,
        finishBlockPuzzleMatch,
        refundBlockPuzzleMatch,
        getActiveBlockPuzzleMatch,
        getMyBlockPuzzleMatches,
        getMyPendingGames,
        getBlockPuzzleMatchStatus,
        pauseBlockPuzzleMatch,
        resumeBlockPuzzleMatch,
        
        // Admin
        isAdminMode,
        setIsAdminMode,
        registeredUsers,
        refreshUsers,
        depositRequests,
        withdrawRequests,
        resultSubmissions,
        paymentSettings,
        updatePaymentSettings,
        createMatch,
        setMatchRoomCode,
        cancelMatchAndRefund,
        deleteMatch,
        approveDepositRequest,
        rejectDepositRequest,
        deleteDepositRequest,
        deleteWithdrawRequest,
        approveWithdrawRequest,
        rejectWithdrawRequest,
        approveResultSubmission,
        rejectResultSubmission,
        adjustUserBalance,
        toggleUserBan,
        deleteUser,
        resetUserPassword,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

