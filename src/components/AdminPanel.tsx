import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Gamepad2, 
  CheckCircle2, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Users, 
  Settings, 
  Plus, 
  RotateCcw, 
  Trash2, 
  ExternalLink, 
  KeyRound, 
  ShieldAlert, 
  Check, 
  X, 
  Eye, 
  Phone, 
  Copy, 
  Search, 
  AlertTriangle,
  ArrowRight,
  Sparkles,
  DollarSign,
  Lock,
  Radio,
  Image as ImageIcon,
  Trophy
} from 'lucide-react';
import { Match, MatchCategory } from '../types';
import { backendApi } from '../services/backendApi';

export const AdminPanel: React.FC = () => {
  const {
    setCurrentTab,
    matches,
    createMatch,
    setMatchRoomCode,
    cancelMatchAndRefund,
    deleteMatch,
    depositRequests,
    approveDepositRequest,
    rejectDepositRequest,
    deleteDepositRequest,
    deleteWithdrawRequest,
    withdrawRequests,
    approveWithdrawRequest,
    rejectWithdrawRequest,
    resultSubmissions,
    approveResultSubmission,
    rejectResultSubmission,
    registeredUsers,
    refreshUsers,
    adjustUserBalance,
    toggleUserBan,
    deleteUser,
    resetUserPassword,
    paymentSettings,
    updatePaymentSettings,
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<
    'dashboard' | 'matches' | 'games' | 'tournaments' | 'leaderboard' | 'results' | 'deposits' | 'withdraws' | 'users' | 'referrals' | 'settings'
  >('dashboard');
  const [blockPuzzleMatches, setBlockPuzzleMatches] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [showGameModal, setShowGameModal] = useState(false);
  const [editingGame, setEditingGame] = useState<any | null>(null);
  const emptyGame = { name: '', slug: '', gameType: 'custom', icon: '🎮', imageUrl: '', description: '', entryFee: 0, prizeAmount: 0, active: true, showOnHome: true, displayOrder: 2 };
  const [gameForm, setGameForm] = useState<any>(emptyGame);
  const [leaderboards, setLeaderboards] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedAdminTournament, setSelectedAdminTournament] = useState<any | null>(null);
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState<any|null>(null);
  const emptyTournament = { name:'Block Puzzle Tournament', entryFee:100, maxPlayers:50, prizePool:4000, prizes:[2000,1200,800], endMode:'PLAYER_LIMIT', durationMinutes:180, active:true, showOnHome:true, displayOrder:1 };
  const [tournamentForm, setTournamentForm] = useState<any>(emptyTournament);
  const [lbName, setLbName] = useState('Block Puzzle 3-Day Leaderboard');
  const [lbWinPoints, setLbWinPoints] = useState(10);
  const [lbPrizes, setLbPrizes] = useState([500, 300, 200]);
  const [referrals, setReferrals] = useState<any[]>([]);

  useEffect(() => {
    refreshUsers();
  }, []);

  const refreshBlockPuzzleMatches = async () => {
    try { const data = await backendApi.adminBlockPuzzleMatches(); setBlockPuzzleMatches(data.matches || []); }
    catch (e) { console.error('Failed to load Block Puzzle matches:', e); }
  };

  useEffect(() => {
    if (activeAdminTab === 'matches') refreshBlockPuzzleMatches();
    if (activeAdminTab === 'games') refreshGames();
    if (activeAdminTab === 'leaderboard') refreshLeaderboards();
    if (activeAdminTab === 'tournaments') refreshTournaments();
    if (activeAdminTab === 'referrals') refreshReferrals();
  }, [activeAdminTab]);

  const refreshGames = async () => {
    try { const data = await backendApi.adminGames(); setGames((data.games || []).filter((g:any) => g.gameType !== 'pool' && g.gameType !== 'carrom')); } catch (e) { console.error('Failed to load games:', e); }
  };
  const openNewGame = () => { setEditingGame(null); setGameForm({ ...emptyGame, displayOrder: games.length + 1 }); setShowGameModal(true); };
  const openEditGame = (game:any) => { setEditingGame(game); setGameForm({ ...emptyGame, ...game }); setShowGameModal(true); };
  const saveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGame) await backendApi.updateGame(editingGame.id, gameForm);
      else await backendApi.createGame(gameForm);
      setShowGameModal(false); await refreshGames(); showToast(editingGame ? 'Game আপডেট হয়েছে।' : 'নতুন Game তৈরি হয়েছে।');
    } catch (e:any) { showToast(e?.message || 'Game save করা যায়নি।', 'error'); }
  };
  const toggleGame = async (game:any, field:'active'|'showOnHome') => { try { await backendApi.updateGame(game.id, { [field]: !game[field] }); await refreshGames(); } catch (e:any) { showToast(e?.message || 'Game update করা যায়নি।', 'error'); } };
  const removeGame = async (game:any) => { if (!window.confirm(`“${game.name}” Game delete করবেন?`)) return; try { await backendApi.deleteGame(game.id); await refreshGames(); showToast('Game delete হয়েছে।'); } catch (e:any) { showToast(e?.message || 'Game delete করা যায়নি।', 'error'); } };

  const refreshTournaments = async () => { try { const data=await backendApi.adminTournaments(); setTournaments(data.tournaments||[]); } catch(e){ console.error('Failed to load tournaments:',e); } };
  const refreshReferrals = async () => { try { const data = await backendApi.adminReferrals(); setReferrals(data.referrals || []); } catch (e) { console.error('Failed to load referrals:', e); } };
  const approveReferral = async (r:any) => { try { await backendApi.approveAdminReferral(r.id); await refreshReferrals(); showToast('Referral bonus অনুমোদন হয়েছে।'); } catch (e:any) { showToast(e?.message || 'Referral approve করা যায়নি।', 'error'); } };
  const rejectReferral = async (r:any) => { const reason = window.prompt('Reject করার কারণ (ঐচ্ছিক):', '') ?? ''; try { await backendApi.rejectAdminReferral(r.id, reason); await refreshReferrals(); showToast('Referral reject করা হয়েছে।'); } catch (e:any) { showToast(e?.message || 'Referral reject করা যায়নি।', 'error'); } };
  const openNewTournament = () => { setEditingTournament(null); setTournamentForm({...emptyTournament}); setShowTournamentModal(true); };
  const openEditTournament = (t:any) => { setEditingTournament(t); setTournamentForm({...emptyTournament,...t,active:t.status==='ACTIVE'}); setShowTournamentModal(true); };
  const addTournamentPrize = () => setTournamentForm((f:any) => ({...f, prizes:[...(f.prizes||[]), 0]}));
  const removeTournamentPrize = (index:number) => setTournamentForm((f:any) => ({...f, prizes:(f.prizes||[]).filter((_:number,i:number)=>i!==index)}));
  const addLeaderboardPrize = () => setLbPrizes(prev => [...prev, 0]);
  const removeLeaderboardPrize = (index:number) => setLbPrizes(prev => prev.filter((_,i)=>i!==index));

  const saveTournament = async (e:React.FormEvent) => { e.preventDefault(); try { const payload={...tournamentForm,prizes:(tournamentForm.prizes||[]).map((x:number)=>Number(x))}; if(editingTournament) await backendApi.updateTournament(editingTournament.id,payload); else await backendApi.createTournament(payload); setShowTournamentModal(false); await refreshTournaments(); showToast(editingTournament?'Tournament আপডেট হয়েছে।':'Tournament তৈরি হয়েছে।'); } catch(e:any){showToast(e?.message||'Tournament save করা যায়নি।','error');} };
  const toggleTournament = async (t:any) => { const restarting=t.status==='ENDED'; if(restarting && !window.confirm(`“${t.name}” আবার Active করলে এটি নতুন Tournament Round হিসেবে শুরু হবে।\n\nআগের Player/Prize Review নতুন Round-এ থাকবে না। আবার Active করবেন?`)) return; try { await backendApi.updateTournament(t.id,{status:t.status==='ACTIVE'?'INACTIVE':'ACTIVE'}); await refreshTournaments(); showToast(restarting?'Tournament নতুন Round হিসেবে Active হয়েছে।':'Tournament status আপডেট হয়েছে।'); } catch(e:any){showToast(e?.message||'Tournament update করা যায়নি।','error');} };
  const removeTournament = async (t:any) => { const ended=t.status==='ENDED'; if (!window.confirm(`“${t.name}” Tournament delete করবেন?\n\n${ended?'এটি সম্পূর্ণ শেষ হওয়া Tournament। Delete করলে Tournamentটি Admin তালিকা থেকে স্থায়ীভাবে চলে যাবে।':'Player/Match চলমান থাকলে delete করা যাবে না।'}`)) return; try { await backendApi.deleteTournament(t.id); if (selectedAdminTournament?.id === t.id) setSelectedAdminTournament(null); await refreshTournaments(); showToast('Tournament delete হয়েছে।'); } catch(e:any){showToast(e?.message||'Tournament delete করা যায়নি।','error');} };
  const finalizeTournament = async (id:string) => { try { await backendApi.finalizeTournament(id); await refreshTournaments(); showToast('Tournament শেষ হয়েছে। এখন Prize Approval প্রয়োজন।'); } catch(e:any){showToast(e?.message||'Tournament finalize করা যায়নি।','error');} };
  const approveTournamentPayouts = async (id:string, userIds?:string[]) => { try { const d=await backendApi.approveTournamentPayouts(id,userIds); await refreshTournaments(); setSelectedAdminTournament(d.tournament); showToast(`${d.approved||0} জনের Prize Admin Approved হয়েছে।`); } catch(e:any){showToast(e?.message||'Prize approval করা যায়নি।','error');} };
  const holdTournamentPayout = async (id:string,userId:string) => { if(!window.confirm('এই Player-এর Prize Hold করবেন?')) return; try { const d=await backendApi.holdTournamentPayout(id,userId,'Admin review / cheating suspicion'); await refreshTournaments(); setSelectedAdminTournament(d.tournament); showToast('Player-এর Prize Hold করা হয়েছে।'); } catch(e:any){showToast(e?.message||'Prize hold করা যায়নি।','error');} };

  const refreshLeaderboards = async () => {
    try { const data = await backendApi.adminBlockPuzzleLeaderboards(); setLeaderboards(data.leaderboards || []); } catch (e) { console.error('Failed to load leaderboards:', e); }
  };
  const createLeaderboard = async () => {
    try { await backendApi.createBlockPuzzleLeaderboard({ name: lbName, winPoints: Number(lbWinPoints), prizes: lbPrizes.map(amount => ({ amount })) }); await refreshLeaderboards(); showToast('নতুন ৩ দিনের Leaderboard তৈরি হয়েছে।'); } catch (e:any) { showToast(e?.message || 'Leaderboard তৈরি করা যায়নি।', 'error'); }
  };
  const finalizeLeaderboard = async (id:string) => {
    try { const data = await backendApi.finalizeBlockPuzzleLeaderboard(id); await refreshLeaderboards(); showToast(`Leaderboard শেষ হয়েছে এবং ${data.payouts?.length || 0} জনকে Prize দেওয়া হয়েছে।`); } catch (e:any) { showToast(e?.message || 'Leaderboard finalize করা যায়নি।', 'error'); }
  };

  // Match creation state
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [newMatchTitle, setNewMatchTitle] = useState('🔥 SPECIAL MATCH 🔥');
  const [newMatchSubtitle, setNewMatchSubtitle] = useState('২ জন জয়েন হলেই স্টার্ট দেওয়া হবে।');
  const [newMatchCategory, setNewMatchCategory] = useState<MatchCategory>('special');
  const [newMatchEntry, setNewMatchEntry] = useState(220);
  const [newMatchPrize, setNewMatchPrize] = useState(400);
  const [newMatchSeats, setNewMatchSeats] = useState(2);
  const [newMatchBoard, setNewMatchBoard] = useState('Ludo King');
  const [newMatchVersion, setNewMatchVersion] = useState('Mobile');
  const [newMatchRoomCode, setNewMatchRoomCode] = useState('');

  // Editing Room Code inline
  const [editingRoomMatchId, setEditingRoomMatchId] = useState<string | null>(null);
  const [roomCodeInput, setRoomCodeInput] = useState('');

  // Image preview modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // User balance adjustment modal
  const [adjustingUser, setAdjustingUser] = useState<any | null>(null);
  const [adjustBalanceType, setAdjustBalanceType] = useState<'gaming' | 'winning'>('gaming');
  const [adjustAmount, setAdjustAmount] = useState<number>(100);
  const [adjustIsAdd, setAdjustIsAdd] = useState<boolean>(true);
  const [adjustNote, setAdjustNote] = useState<string>('এডমিন রিচার্জ');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustmentId, setAdjustmentId] = useState('');
  const newAdjustmentId = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `adj_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  // Custom in-app Action Dialogs (Replaces blocked window.prompt / window.confirm)
  const [withdrawModal, setWithdrawModal] = useState<{
    action: 'approve' | 'reject';
    req: any;
    trxId: string;
    reason: string;
  } | null>(null);

  const [depositModal, setDepositModal] = useState<{
    action: 'approve' | 'reject';
    req: any;
    reason: string;
  } | null>(null);

  const [resultModal, setResultModal] = useState<{
    action: 'approve' | 'reject';
    sub: any;
    reason: string;
  } | null>(null);

  const [matchModal, setMatchModal] = useState<{
    action: 'cancel' | 'delete';
    match: Match;
  } | null>(null);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // User Search
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [auditUser, setAuditUser] = useState<any | null>(null);
  const [auditData, setAuditData] = useState<any | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const openUserAudit = async (userId: string) => {
    setAuditLoading(true);
    try {
      const data = await backendApi.adminUserAudit(userId);
      setAuditUser(data.user); setAuditData(data);
    } catch (e: any) { showToast(e?.message || 'User audit data পাওয়া যায়নি।', 'error'); }
    finally { setAuditLoading(false); }
  };


  // Editable settings form
  const [settingsForm, setSettingsForm] = useState(paymentSettings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    setSettingsForm(paymentSettings);
  }, [paymentSettings]);

  // Stats calculation
  const pendingDepositsCount = depositRequests.filter(r => r.status === 'PENDING').length;
  const pendingWithdrawsCount = withdrawRequests.filter(r => r.status === 'PENDING').length;
  const pendingResultsCount = resultSubmissions.filter(s => s.status === 'PENDING').length;
  const waitingRoomCodeMatchesCount = matches.filter(m => m.joinedSeats >= m.totalSeats && !m.roomCode).length;

  const totalGamingBalance = registeredUsers.reduce((sum, u) => sum + (u.gamingBalance || 0), 0);
  const totalWinningBalance = registeredUsers.reduce((sum, u) => sum + (u.winningBalance || 0), 0);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await updatePaymentSettings(settingsForm);
    setSettingsSaved(ok);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const handleCreateMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await createMatch({
      title: newMatchTitle,
      subtitle: newMatchSubtitle,
      category: newMatchCategory,
      entryFee: Number(newMatchEntry),
      totalPrize: Number(newMatchPrize),
      totalSeats: Number(newMatchSeats),
      boardType: newMatchBoard,
      version: newMatchVersion,
      roomCode: newMatchRoomCode,
    });
    if (!ok) return;
    setShowCreateMatchModal(false);
    setNewMatchRoomCode('');
  };

  const handleSaveRoomCode = async (matchId: string) => {
    if (!roomCodeInput.trim()) return;
    const ok = await setMatchRoomCode(matchId, roomCodeInput.trim());
    if (!ok) return;
    setEditingRoomMatchId(null);
    setRoomCodeInput('');
  };

  const handleAdjustBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUser || adjustAmount <= 0 || adjustSubmitting) return;
    const opId = adjustmentId || newAdjustmentId();
    setAdjustmentId(opId);
    setAdjustSubmitting(true);
    try {
      const ok = await adjustUserBalance(adjustingUser.id, adjustBalanceType, Number(adjustAmount), adjustIsAdd, adjustNote, opId);
      if (ok) { setAdjustingUser(null); setAdjustmentId(''); }
    } finally { setAdjustSubmitting(false); }
  };

  const filteredUsers = registeredUsers.filter(u => 
    u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    u.phone.includes(userSearchTerm) ||
    u.ludoKingName.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#090d1a] text-slate-100 pb-24">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-40 bg-[#0e1428]/95 backdrop-blur border-b border-indigo-900/60 px-4 py-3 shadow-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-red-500 to-indigo-600 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-[#0d1222] rounded-[10px] flex items-center justify-center">
                <span className="text-amber-400 font-black text-sm">LX</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-wide text-white">
                  SKILLZGAME Admin Panel
                </h1>
                <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-400">Block Puzzle স্কোর যাচাই, ইউজার, ওয়ালেট ও সাইট ম্যানেজমেন্ট</p>
            </div>
          </div>

          <button
            id="admin-exit-btn"
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-1.5 bg-indigo-900/60 hover:bg-indigo-800 text-slate-200 border border-indigo-700/50 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow active:scale-95"
          >
            <span>ব্যবহারকারী ভিউ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Navigation Sub-bar */}
      <div className="bg-[#111833] border-b border-indigo-950 px-4 py-2 sticky top-[61px] z-30 overflow-x-auto scrollbar-none">
        <div className="max-w-6xl mx-auto flex items-center gap-1.5 min-w-max">
          <button
            id="admin-tab-dashboard"
            onClick={() => setActiveAdminTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeAdminTab === 'dashboard'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-indigo-950/50'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>ড্যাশবোর্ড</span>
          </button>

          <button
            id="admin-tab-matches"
            onClick={() => setActiveAdminTab('matches')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeAdminTab === 'matches'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-indigo-950/50'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>ব্লক পাজল ম্যাচ</span>
          </button>

          <button
            id="admin-tab-games"
            onClick={() => setActiveAdminTab('games')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeAdminTab === 'games' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-indigo-950/50'}`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Games</span>
          </button>

          <button onClick={() => setActiveAdminTab('tournaments')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeAdminTab === 'tournaments' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-indigo-950/50'}`}><Trophy className="w-3.5 h-3.5"/><span>Tournaments</span></button>

          <button
            id="admin-tab-leaderboard"
            onClick={() => setActiveAdminTab('leaderboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeAdminTab === 'leaderboard' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-indigo-950/50'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Leaderboard</span>
          </button>

          {false && <button
            id="admin-tab-results"
            onClick={() => setActiveAdminTab('results')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
              activeAdminTab === 'results'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-indigo-950/50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>রেজাল্ট যাচাই</span>
            {pendingResultsCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {pendingResultsCount}
              </span>
            )}
          </button>}

          <button
            id="admin-tab-deposits"
            onClick={() => setActiveAdminTab('deposits')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
              activeAdminTab === 'deposits'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-indigo-950/50'
            }`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            <span>ডিপোজিট রিকোয়েস্ট</span>
            {pendingDepositsCount > 0 && (
              <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {pendingDepositsCount}
              </span>
            )}
          </button>

          <button
            id="admin-tab-withdraws"
            onClick={() => setActiveAdminTab('withdraws')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
              activeAdminTab === 'withdraws'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-indigo-950/50'
            }`}
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span>উইথড্র রিকোয়েস্ট</span>
            {pendingWithdrawsCount > 0 && (
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {pendingWithdrawsCount}
              </span>
            )}
          </button>

          <button
            id="admin-tab-users"
            onClick={() => setActiveAdminTab('users')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeAdminTab === 'users'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-indigo-950/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>ইউজার তালিকা</span>
          </button>

          <button
            id="admin-tab-referrals"
            onClick={() => setActiveAdminTab('referrals')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
              activeAdminTab === 'referrals' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-indigo-950/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>রেফারেল</span>
            {referrals.filter(r => r.status === 'PENDING_APPROVAL').length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {referrals.filter(r => r.status === 'PENDING_APPROVAL').length}
              </span>
            )}
          </button>

          <button
            id="admin-tab-settings"
            onClick={() => setActiveAdminTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeAdminTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-indigo-950/50'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>সেটিংস ও নোটিশ</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        
        {/* ================= 1. DASHBOARD TAB ================= */}
        {activeAdminTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Urgent Action Alerts */}
            {(pendingResultsCount > 0 || pendingDepositsCount > 0) && (
              <div className="bg-gradient-to-r from-red-950/80 to-amber-950/60 border border-red-500/40 rounded-2xl p-4 shadow-lg animate-pulse">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>জরুরি পেন্ডিং অ্যাকশন প্রয়োজন:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {pendingResultsCount > 0 && (
                    <button
                      onClick={() => setActiveAdminTab('results')}
                      className="bg-amber-900/60 hover:bg-amber-800/80 border border-amber-700/60 p-2.5 rounded-xl text-left text-xs"
                    >
                      <p className="font-bold text-white">📸 {pendingResultsCount}টি রেজাল্ট স্ক্রিনশট যাচাই বাকি</p>
                      <p className="text-[11px] text-amber-200">যাচাই করে প্রাইজ উইনিং ব্যালেন্সে দিন</p>
                    </button>
                  )}
                  {pendingDepositsCount > 0 && (
                    <button
                      onClick={() => setActiveAdminTab('deposits')}
                      className="bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-700/60 p-2.5 rounded-xl text-left text-xs"
                    >
                      <p className="font-bold text-white">💳 {pendingDepositsCount}টি নতুন ডিপোজিট রিকোয়েস্ট</p>
                      <p className="text-[11px] text-emerald-200">TrxID যাচাই করে অনুমোদন করুন</p>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#121935] border border-indigo-900/60 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>মোট ইউজার</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-white">{registeredUsers.length} জন</div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-1">সব একাউন্ট সক্রিয়</div>
              </div>

              <div className="bg-[#121935] border border-indigo-900/60 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>গেমিং ব্যালেন্স (সার্কুলেশন)</span>
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400">৳{totalGamingBalance.toFixed(0)}</div>
                <div className="text-[10px] text-slate-400 mt-1">ইউজার ওয়ালেটে মোট জমা</div>
              </div>

              <div className="bg-[#121935] border border-indigo-900/60 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>উইনিং ব্যালেন্স (প্রাইজ)</span>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400">৳{totalWinningBalance.toFixed(0)}</div>
                <div className="text-[10px] text-slate-400 mt-1">উইথড্র যোগ্য ব্যালেন্স</div>
              </div>
            </div>

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Right Column: Pending Results Preview */}
              <div className="bg-[#121935] border border-indigo-900/60 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>সর্বশেষ রেজাল্ট সাবমিশন</span>
                  </h3>
                  <button
                    onClick={() => setActiveAdminTab('results')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    সব যাচাই করুন &rarr;
                  </button>
                </div>

                <div className="space-y-2">
                  {resultSubmissions.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">কোনো সাবমিশন জমা নেই।</p>
                  ) : (
                    resultSubmissions.slice(0, 4).map(sub => (
                      <div key={sub.id} className="bg-[#0b1022] p-3 rounded-xl border border-indigo-950 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div 
                            onClick={() => sub.imageUrl && setPreviewImageUrl(sub.imageUrl)}
                            className="w-10 h-10 rounded-lg bg-indigo-950 overflow-hidden cursor-pointer border border-indigo-800 flex items-center justify-center text-slate-400 hover:opacity-80"
                          >
                            {sub.imageUrl ? (
                              <img src={sub.imageUrl} alt="Result" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white">{sub.userName}</div>
                            <div className="text-[11px] text-slate-400">Block Puzzle • স্কোর: {sub.score ?? 0} • ৳{sub.prizeAmount}</div>
                          </div>
                        </div>

                        <div>
                          {sub.status === 'PENDING' ? (
                            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              পেন্ডিং
                            </span>
                          ) : sub.status === 'APPROVED' ? (
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              অনুমোদিত
                            </span>
                          ) : (
                            <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              বাতিল
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= 2. BLOCK PUZZLE MATCH LIST ================= */}
        {activeAdminTab === 'matches' && (
          <div className="space-y-4">
            <div className="bg-[#121935] p-4 rounded-2xl border border-indigo-900/60">
              <h2 className="text-base font-bold text-white flex items-center gap-2"><Gamepad2 className="w-5 h-5 text-amber-400" /> Block Puzzle Match List</h2>
              <p className="text-xs text-slate-400 mt-1">স্বয়ংক্রিয় matchmaking-এর ম্যাচ। এখানে শুধু দেখুন এবং সম্পন্ন/রিফান্ড হওয়া ম্যাচ মুছুন।</p>
            </div>
            {blockPuzzleMatches.length === 0 ? (
              <div className="bg-[#121935] p-8 rounded-2xl border border-indigo-900/60 text-center text-sm text-slate-500">কোনো Block Puzzle ম্যাচ নেই।</div>
            ) : blockPuzzleMatches.map(m => (
              <div key={m.id} className="bg-[#121935] p-4 rounded-2xl border border-indigo-900/60 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-black text-amber-400 text-sm">Match #{String(m.id).slice(-6)}</div>
                    <div className="text-[11px] text-slate-400">Entry ৳{m.entryFee} • Prize ৳{m.prizeAmount} • {m.status}</div>
                  </div>
                  {['completed','refunded'].includes(String(m.status).toLowerCase()) && (
                    <button onClick={async () => { await backendApi.deleteAdminBlockPuzzleMatch(m.id); await refreshBlockPuzzleMatches(); }} className="px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-black"><Trash2 className="w-4 h-4 inline mr-1" />মুছুন</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(m.players || []).map((pl:any) => <div key={pl.userId} className="bg-[#0b1022] rounded-xl p-2.5 border border-indigo-950"><div className="text-xs font-bold text-white truncate">{pl.name}</div><div className="text-[11px] text-slate-400">Score: {pl.score ?? '—'} • {pl.outcome || 'waiting'}</div></div>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= 3. LEGACY LUDO MATCH TAB (kept disabled) ================= */}
        {false && activeAdminTab === 'matches' && (
          <div className="space-y-5">
            {/* Header + Add Match Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121935] p-4 rounded-2xl border border-indigo-900/60">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-amber-400" />
                  <span>ম্যাচ ও রুম আইডি কন্ট্রোল</span>
                </h2>
                <p className="text-xs text-slate-400">
                  প্লেয়ার জয়েন হলে পুরোনো ম্যাচ কন্ট্রোল নিষ্ক্রিয় করা হয়েছে।
                </p>
              </div>

              <button
                id="admin-create-match-btn"
                onClick={() => setShowCreateMatchModal(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-lg active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>নতুন ম্যাচ তৈরি করুন</span>
              </button>
            </div>

            {/* Matches List */}
            <div className="space-y-3.5">
              {matches.map(m => {
                const isFull = m.joinedSeats >= m.totalSeats;
                const isEditingRoom = editingRoomMatchId === m.id;

                return (
                  <div
                    key={m.id}
                    className="bg-[#121935] rounded-2xl border border-indigo-900/60 p-4 shadow-xl transition-all"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-indigo-950 pb-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-amber-400 text-sm">Match #{m.matchNo}</span>
                          <span className="text-xs font-bold text-white bg-indigo-950 px-2 py-0.5 rounded-md border border-indigo-800">
                            {m.title}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                            m.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : m.status === 'cancelled'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                              : isFull && !m.roomCode
                              ? 'bg-red-500 text-white animate-pulse'
                              : isFull
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          }`}>
                            {m.status === 'completed' ? 'ম্যাচ সমাপ্ত' : m.status === 'cancelled' ? 'বাতিলকৃত' : isFull && !m.roomCode ? 'রুম আইডি দিন (অপেক্ষায়)' : isFull ? 'খেলছে (Ready)' : 'ওপেন (জয়েন চলছে)'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{m.subtitle}</p>
                      </div>

                      {/* Fee and Prize */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className="bg-[#0b1022] px-3 py-1.5 rounded-xl border border-indigo-950">
                          <span className="text-slate-400">এন্ট্রি ফি: </span>
                          <span className="font-bold text-white">৳{m.entryFee}</span>
                        </div>
                        <div className="bg-[#0b1022] px-3 py-1.5 rounded-xl border border-indigo-950">
                          <span className="text-slate-400">প্রাইজ: </span>
                          <span className="font-bold text-amber-400">৳{m.totalPrize}</span>
                        </div>
                      </div>
                    </div>

                    {/* Joined Players */}
                    <div className="mb-3 bg-[#0b1022] p-3 rounded-xl border border-indigo-950/80">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
                        <span>জয়েনকৃত প্লেয়ার ({m.joinedSeats}/{m.totalSeats})</span>
                        <span>Player Name</span>
                      </div>

                      {m.joinedPlayers.length === 0 ? (
                        <p className="text-xs text-slate-600 italic">এখনো কোনো প্লেয়ার জয়েন করেনি।</p>
                      ) : (
                        <div className="space-y-1.5">
                          {m.joinedPlayers.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs text-slate-300 bg-indigo-950/40 px-2.5 py-1.5 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-indigo-800 flex items-center justify-center text-[10px] font-bold text-white">
                                  {idx + 1}
                                </span>
                                <div>
                                  <span className="font-bold text-white">{p.name}</span>
                                  {p.phone && <span className="text-[10px] text-slate-400 ml-1.5">({p.phone})</span>}
                                </div>
                              </div>
                              <div className="font-mono text-amber-400 font-bold bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                                {p.name || 'Unknown'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Room ID Section */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-indigo-950">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-semibold">Ludo King Room ID:</span>
                        {isEditingRoom ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={roomCodeInput}
                              onChange={(e) => setRoomCodeInput(e.target.value)}
                              placeholder="e.g. 06447612"
                              className="bg-[#0b1022] border border-amber-500/60 rounded-lg px-2.5 py-1 text-xs text-amber-400 font-mono font-bold w-32 focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveRoomCode(m.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold"
                            >
                              সেভ
                            </button>
                            <button
                              onClick={() => setEditingRoomMatchId(null)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg text-xs"
                            >
                              বাতিল
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg text-xs tracking-wider">
                              {m.roomCode || 'রুম আইডি দেওয়া হয়নি'}
                            </span>
                            <button
                              onClick={() => {
                                setEditingRoomMatchId(m.id);
                                setRoomCodeInput(m.roomCode || '');
                              }}
                              className="bg-indigo-900 hover:bg-indigo-800 text-slate-200 border border-indigo-700/60 px-2.5 py-1 rounded-lg text-xs font-bold"
                            >
                              {m.roomCode ? 'পরিবর্তন' : '+ রুম কোড দিন'}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Admin Actions for match */}
                      <div className="flex items-center gap-2">
                        {m.status !== 'cancelled' && m.status !== 'completed' && m.joinedSeats > 0 && (
                          <button
                            onClick={() => setMatchModal({ action: 'cancel', match: m })}
                            className="bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/60 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors active:scale-95"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>বাতিল ও রিফান্ড</span>
                          </button>
                        )}

                        <button
                          onClick={() => setMatchModal({ action: 'delete', match: m })}
                          className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-800 px-2 py-1 rounded-lg text-xs active:scale-95"
                          title="Delete Match"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= 3. RESULT VERIFICATION TAB ================= */}
        {activeAdminTab === 'games' && (
          <div className="space-y-5 max-w-5xl">
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="text-lg font-black text-white">Game Management</h2><p className="text-xs text-slate-400 mt-1">এখান থেকে Home Page-এ কোন Game দেখাবে তা server থেকে নিয়ন্ত্রণ করুন।</p></div>
              <button onClick={openNewGame} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2"><Plus className="w-4 h-4"/> নতুন Game</button>
            </div>
            <div className="grid gap-3">
              {games.length === 0 ? <div className="bg-[#121935] border border-indigo-900/60 rounded-2xl p-8 text-center text-sm text-slate-500">কোনো Game নেই।</div> : games.map((g:any) => (
                <div key={g.id} className="bg-[#121935] border border-indigo-900/60 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-[#0b1022] border border-indigo-800 flex items-center justify-center text-2xl shrink-0">{g.icon || '🎮'}</div>
                      <div className="min-w-0"><h3 className="font-black text-white truncate">{g.name}</h3><p className="text-[11px] text-slate-400">Type: {g.gameType} • Slug: {g.slug}</p><p className="text-xs text-slate-300 mt-1">Entry ৳{Number(g.entryFee||0).toFixed(0)} • Prize ৳{Number(g.prizeAmount||0).toFixed(0)} • Order {g.displayOrder}</p></div>
                    </div>
                    <div className="flex gap-1.5 shrink-0"><button onClick={()=>openEditGame(g)} className="p-2 rounded-lg bg-indigo-900/60 text-cyan-300" title="Edit"><Settings className="w-4 h-4"/></button>{g.gameType!=='block_puzzle' && <button onClick={()=>removeGame(g)} className="p-2 rounded-lg bg-red-950/60 text-red-300" title="Delete"><Trash2 className="w-4 h-4"/></button>}</div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={()=>toggleGame(g,'active')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${g.active?'bg-emerald-500/15 text-emerald-400 border border-emerald-700/50':'bg-slate-700/40 text-slate-400 border border-slate-700'}`}>{g.active?'✓ Active':'Inactive'}</button>
                    <button onClick={()=>toggleGame(g,'showOnHome')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${g.showOnHome?'bg-cyan-500/15 text-cyan-300 border border-cyan-700/50':'bg-slate-700/40 text-slate-400 border border-slate-700'}`}>{g.showOnHome?'⌂ Home-এ দেখাচ্ছে':'Home-এ Hidden'}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeAdminTab === 'tournaments' && (<div className="space-y-4 max-w-5xl"><div className="flex items-center justify-between"><div><h2 className="text-lg font-black text-white">Block Puzzle Tournament</h2><p className="text-xs text-slate-400 mt-1">একই Block Puzzle game ব্যবহার করে Tournament পরিচালনা করুন।</p><p className="text-[11px] text-emerald-400 mt-1 font-bold">মোট {tournaments.length}টি Tournament • কোনো Tournament সংখ্যা সীমা নেই</p></div><button onClick={openNewTournament} className="bg-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2"><Plus className="w-4 h-4"/> নতুন Tournament</button></div>{tournaments.map((t:any)=><div key={t.id} className="bg-[#121935] border border-indigo-900/60 rounded-2xl p-4"><div className="flex items-start justify-between gap-3"><button onClick={()=>setSelectedAdminTournament(t)} className="min-w-0 text-left"><h3 className="font-black text-white">🏆 {t.name}</h3><p className="text-xs text-slate-300 mt-1">Entry ৳{t.entryFee} • Max {t.maxPlayers} • Prize Pool ৳{t.prizePool}</p><p className="text-[11px] text-cyan-300 mt-1">শেষের নিয়ম: {t.endMode==='TIME' ? `সময় অনুযায়ী • ${t.durationMinutes||0} মিনিট` : 'Player সংখ্যা অনুযায়ী • Full হলে শেষ'}</p><p className="text-[11px] text-slate-400 mt-1">Tournament-এ ঢুকে Player ও Prize Review করতে tap করুন</p><p className="text-xs text-cyan-300 mt-1">Unique Registered: {t.playerCount}/{t.maxPlayers} • {t.status==='ENDED'?'ENDED':t.full?'FULL — Last Player Submit অপেক্ষায়':'ACTIVE'}</p></button><div className="flex gap-1.5 shrink-0"><button onClick={()=>openEditTournament(t)} className="p-2 rounded-lg bg-indigo-900/60 text-cyan-300"><Settings className="w-4 h-4"/></button><button onClick={()=>toggleTournament(t)} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black ${t.status==='ACTIVE'?'bg-emerald-500/15 text-emerald-400':t.status==='ENDED'?'bg-amber-500/15 text-amber-300':'bg-slate-700 text-slate-300'}`}>{t.status==='ACTIVE'?'ACTIVE':t.status==='ENDED'?'RESTART':'INACTIVE'}</button><button onClick={()=>removeTournament(t)} className="p-2 rounded-lg bg-red-950/60 text-red-300" title="Delete Tournament"><Trash2 className="w-4 h-4"/></button></div></div><div className="mt-3 flex gap-2 flex-wrap">{(t.prizes||[]).map((p:number,i:number)=><span key={i} className="text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-lg px-2 py-1">#{i+1} ৳{p}</span>)}{t.status==='ENDED' && <span className={`text-[11px] rounded-lg px-2 py-1 border ${t.payoutStatus==='PENDING_APPROVAL'?'bg-amber-500/10 text-amber-300 border-amber-500/20':'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'}`}>{t.payoutStatus==='PENDING_APPROVAL'?'Prize Approval Pending':'Prize Review Complete'}</span>}</div></div>)}{tournaments.length===0&&<div className="bg-[#121935] p-8 rounded-2xl border border-indigo-900/60 text-center text-sm text-slate-500">কোনো Tournament নেই।</div>}</div>)}

        {activeAdminTab === 'leaderboard' && (
          <div className="space-y-4">
            <div className="bg-[#121935] p-4 rounded-2xl border border-indigo-900/60">
              <div className="flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-400"/><h2 className="text-base font-black text-white">৩ দিনের Block Puzzle Leaderboard</h2></div>
              <p className="text-xs text-slate-400 mt-1">প্রতিটি WIN-এর জন্য নির্ধারিত Point যোগ হবে। ৩ দিন শেষে Finalize করলে নির্ধারিত Prize winning balance-এ যাবে।</p>
            </div>
            <div className="bg-[#121935] p-4 rounded-2xl border border-indigo-900/60 space-y-3">
              <input value={lbName} onChange={e=>setLbName(e.target.value)} className="w-full bg-[#0b1022] border border-indigo-900 rounded-xl px-3 py-2 text-sm text-white" placeholder="Leaderboard নাম" />
              <div><label className="text-xs text-slate-400">প্রতি WIN Point</label><input type="number" min="1" value={lbWinPoints} onChange={e=>setLbWinPoints(Number(e.target.value))} className="mt-1 w-full bg-[#0b1022] border border-indigo-900 rounded-xl px-3 py-2 text-sm text-white" /></div>
              <div><div className="flex items-center justify-between"><label className="text-xs text-slate-400">Prize (Rank অনুযায়ী)</label><button type="button" onClick={addLeaderboardPrize} className="text-[11px] font-black text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2 py-1">+ Rank Prize</button></div><div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">{lbPrizes.map((v,i)=><div key={i} className="flex gap-1"><input type="number" min="0" value={v} onChange={e=>setLbPrizes(prev=>prev.map((x,j)=>j===i?Number(e.target.value):x))} className="min-w-0 flex-1 bg-[#0b1022] border border-indigo-900 rounded-xl px-3 py-2 text-sm text-white" placeholder={`#${i+1}`} /><button type="button" onClick={()=>removeLeaderboardPrize(i)} disabled={lbPrizes.length<=1} className="px-2 rounded-xl border border-red-900/60 text-red-300 disabled:opacity-30">×</button></div>)}</div></div>
              <button onClick={createLeaderboard} className="w-full bg-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-sm">নতুন Leaderboard তৈরি করুন (৩ দিন)</button>
            </div>
            <div className="space-y-3">{leaderboards.length===0 ? <div className="bg-[#121935] p-8 rounded-2xl border border-indigo-900/60 text-center text-sm text-slate-500">কোনো Leaderboard নেই।</div> : leaderboards.map((b:any)=><div key={b.id} className="bg-[#121935] p-4 rounded-2xl border border-indigo-900/60"><div className="flex items-start justify-between gap-3"><div><div className="font-black text-white">{b.name}</div><div className="text-[11px] text-slate-400 mt-1">WIN = {b.winPoints} pts • শেষ: {new Date(b.endsAt).toLocaleString('en-GB')}</div></div><span className={`text-[10px] font-black px-2 py-1 rounded-full ${b.status==='ENDED'?'bg-slate-500/20 text-slate-300':'bg-emerald-500/20 text-emerald-400'}`}>{b.status==='ENDED'?'শেষ':'চলছে'}</span></div><div className="mt-3 space-y-1">{(b.entries||[]).slice(0,10).map((e:any)=><div key={e.userId} className="flex justify-between bg-[#0b1022] rounded-lg px-2.5 py-2 text-xs"><span>#{e.rank} {e.username}</span><span className="text-amber-400 font-black">{e.points} pts</span></div>)}</div>{b.status!=='ENDED' && Date.now()>=Date.parse(b.endsAt) && <button onClick={()=>finalizeLeaderboard(b.id)} className="mt-3 w-full bg-emerald-600 text-white font-black px-4 py-2 rounded-xl text-xs">৩ দিন শেষ — Prize Finalize & Pay</button>}</div>)}</div>
          </div>
        )}

        {false && activeAdminTab === 'results' && (
          <div className="space-y-4">
            <div className="bg-[#121935] p-4 rounded-2xl border border-indigo-900/60 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>রেজাল্ট ও স্ক্রিনশট যাচাইকরণ</span>
                </h2>
                <p className="text-xs text-slate-400">
                  পুরোনো স্ক্রিনশট-ভিত্তিক রেজাল্ট সিস্টেম নিষ্ক্রিয় করা হয়েছে।
                </p>
              </div>
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-bold px-3 py-1 rounded-full">
                পেন্ডিং: {pendingResultsCount} টি
              </span>
            </div>

            <div className="space-y-3.5">
              {resultSubmissions.length === 0 ? (
                <div className="bg-[#121935] border border-indigo-950 rounded-2xl p-8 text-center text-slate-500 text-sm">
                  বর্তমানে কোনো রেজাল্ট সাবমিশন জমা নেই।
                </div>
              ) : (
                resultSubmissions.map(sub => (
                  <div
                    key={sub.id}
                    className={`bg-[#121935] border rounded-2xl p-4 shadow-lg ${
                      sub.status === 'PENDING'
                        ? 'border-amber-500/40'
                        : sub.status === 'APPROVED'
                        ? 'border-emerald-500/30 opacity-90'
                        : 'border-red-500/30 opacity-80'
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      {/* Submitter & Match details */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{sub.userName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">({sub.userPhone})</span>
                        </div>
                        <p className="text-xs text-slate-300">Player ID: <span className="text-amber-400 font-bold">{sub.ludoKingName || sub.userName}</span></p>
                        <p className="text-xs text-slate-300">Score: <span className="font-mono text-white font-bold bg-indigo-950 px-1.5 py-0.5 rounded">{sub.score ?? 0}</span></p>
                        <p className="text-[11px] text-slate-500">{sub.submittedAt}</p>
                      </div>

                      {/* Screenshot thumbnail */}
                      <div className="flex items-center gap-3">
                        {sub.imageUrl ? (
                          <div 
                            onClick={() => setPreviewImageUrl(sub.imageUrl!)}
                            className="relative group cursor-pointer w-24 h-24 rounded-xl overflow-hidden border-2 border-indigo-700/60 bg-black flex-shrink-0"
                          >
                            <img src={sub.imageUrl} alt="Result Screenshot" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-slate-500 text-xs">
                            স্ক্রিনশট নেই
                          </div>
                        )}
                        <div>
                          <span className="text-xs text-slate-400 block mb-0.5">প্রাইজ পরিমাণ:</span>
                          <span className="text-xl font-extrabold text-amber-400">৳{sub.prizeAmount}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2 justify-center">
                        {sub.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => setResultModal({ action: 'approve', sub, reason: '' })}
                              className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                              <span>বিজয়ী অনুমোদন ও ৳{sub.prizeAmount} প্রদান</span>
                            </button>

                            <button
                              onClick={() => setResultModal({ action: 'reject', sub, reason: 'নকল বা ভুল স্ক্রিনশট' })}
                              className="w-full py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 font-semibold rounded-xl text-xs transition-colors active:scale-95"
                            >
                              বাতিল করুন
                            </button>
                          </>
                        ) : sub.status === 'APPROVED' ? (
                          <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-2 rounded-xl text-center text-xs font-bold">
                            ✅ বিজয়ী অনুমোদিত ও প্রাইজ পেইড!
                          </div>
                        ) : (
                          <div className="bg-red-950/40 border border-red-500/40 text-red-300 p-2 rounded-xl text-center text-xs font-bold">
                            ❌ বাতিলকৃত ({sub.adminNote || 'ভুল স্ক্রিনশট'})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= 4. DEPOSIT REQUESTS TAB ================= */}
        {activeAdminTab === 'deposits' && (
          <div className="space-y-4">
            <div className="bg-[#121935] p-4 rounded-2xl border border-indigo-900/60 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
                  <span>ডিপোজিট রিকোয়েস্ট ম্যানেজমেন্ট</span>
                </h2>
                <p className="text-xs text-slate-400">
                  ব্যবহারকারীর TrxID যাচাই করে অনুমোদন করলে সাথে সাথে গেমিং ব্যালেন্স যোগ হবে।
                </p>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold px-3 py-1 rounded-full">
                পেন্ডিং: {pendingDepositsCount} টি
              </span>
            </div>

            <div className="space-y-3">
              {depositRequests.length === 0 ? (
                <div className="bg-[#121935] border border-indigo-950 rounded-2xl p-8 text-center text-slate-500 text-sm">
                  কোনো ডিপোজিট রিকোয়েস্ট নেই।
                </div>
              ) : (
                depositRequests.map(req => (
                  <div
                    key={req.id}
                    className={`bg-[#121935] border rounded-2xl p-4 shadow-lg flex flex-nowrap items-center justify-between gap-4 overflow-x-auto ${
                      req.status === 'PENDING'
                        ? 'border-emerald-500/40'
                        : req.status === 'APPROVED'
                        ? 'border-indigo-900/60 opacity-80'
                        : 'border-red-500/30 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{req.userName}</span>
                        <span className="text-xs text-slate-400 font-mono">({req.userPhone})</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-900 text-amber-300">
                          {req.method}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                        <span>সেন্ডার নম্বর: <b className="font-mono text-white">{req.senderNumber}</b></span>
                        <span>TrxID: <b className="font-mono text-amber-400 bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-800">{req.trxId}</b></span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{req.timestamp}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">পরিমাণ</span>
                        <span className="text-xl font-extrabold text-emerald-400">৳{req.amount}</span>
                      </div>

                      {req.status === 'PENDING' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDepositModal({ action: 'approve', req, reason: '' })}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow active:scale-95 transition-all"
                          >
                            অনুমোদন করুন
                          </button>
                          <button
                            onClick={() => setDepositModal({ action: 'reject', req, reason: 'ভুল ট্রানজেকশন আইডি' })}
                            className="bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 text-xs px-2.5 py-2 rounded-xl transition-colors active:scale-95"
                          >
                            বাতিল
                          </button>
                        </div>
                      ) : req.status === 'APPROVED' ? (
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold px-3 py-1 rounded-full">✅ অনুমোদিত</span>
                          <button onClick={async()=>{const r=await deleteDepositRequest(req.id); showToast(r.message,r.success?'success':'error');}} className="bg-red-950/80 text-red-300 border border-red-800 text-xs font-bold px-2.5 py-1.5 rounded-xl">Delete</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-bold px-3 py-1 rounded-full">❌ বাতিলকৃত</span>
                          <button onClick={async()=>{const r=await deleteDepositRequest(req.id); showToast(r.message,r.success?'success':'error');}} className="bg-red-950/80 text-red-300 border border-red-800 text-xs font-bold px-2.5 py-1.5 rounded-xl">Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= 5. WITHDRAW REQUESTS TAB ================= */}
        {activeAdminTab === 'withdraws' && (
          <div className="space-y-4">
            <div className="bg-[#121935] p-4 rounded-2xl border border-indigo-900/60 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ArrowUpCircle className="w-5 h-5 text-amber-400" />
                  <span>উইথড্র রিকোয়েস্ট ম্যানেজমেন্ট</span>
                </h2>
                <p className="text-xs text-slate-400">
                  ব্যবহারকারীর নাম্বারে টাকা পাঠিয়ে 'পরিশোধ সম্পন্ন' ক্লিক করুন অথবা বাতিল ও রিফান্ড করুন।
                </p>
              </div>
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-bold px-3 py-1 rounded-full">
                পেন্ডিং: {pendingWithdrawsCount} টি
              </span>
            </div>

            <div className="space-y-3">
              {withdrawRequests.length === 0 ? (
                <div className="bg-[#121935] border border-indigo-950 rounded-2xl p-8 text-center text-slate-500 text-sm">
                  কোনো উইথড্র রিকোয়েস্ট নেই।
                </div>
              ) : (
                withdrawRequests.map(req => (
                  <div
                    key={req.id}
                    className={`bg-[#121935] border rounded-2xl p-4 shadow-lg flex flex-nowrap items-center justify-between gap-4 overflow-x-auto ${
                      req.status === 'PENDING'
                        ? 'border-amber-500/40'
                        : req.status === 'APPROVED'
                        ? 'border-indigo-900/60 opacity-80'
                        : 'border-red-500/30 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{req.userName}</span>
                        <span className="text-xs text-slate-400 font-mono">({req.userPhone})</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-900 text-amber-300">
                          {req.method} ({req.accountType})
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 mt-1">
                        টাকা পাঠানোর নাম্বার: <b className="font-mono text-amber-400 text-sm">{req.accountNumber}</b>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{req.timestamp}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">উইথড্র পরিমাণ</span>
                        <span className="text-xl font-extrabold text-amber-400">৳{req.amount}</span>
                      </div>

                      {req.status === 'PENDING' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setWithdrawModal({
                              action: 'approve',
                              req,
                              trxId: `ADM${Math.floor(100000 + Math.random() * 900000)}`,
                              reason: ''
                            })}
                            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black px-3.5 py-2 rounded-xl shadow active:scale-95 transition-all"
                          >
                            পরিশোধ সম্পন্ন
                          </button>
                          <button
                            onClick={() => setWithdrawModal({
                              action: 'reject',
                              req,
                              trxId: '',
                              reason: 'ভুল একাউন্ট নম্বর'
                            })}
                            className="bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 text-xs px-2.5 py-2 rounded-xl transition-colors active:scale-95"
                          >
                            বাতিল ও রিফান্ড
                          </button>
                        </div>
                      ) : req.status === 'APPROVED' ? (
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold px-3 py-1 rounded-full">✅ পরিশোধিত ({req.adminTrxId || 'PAID'})</span>
                          <button onClick={async()=>{const r=await deleteWithdrawRequest(req.id); showToast(r.message,r.success?'success':'error');}} className="bg-red-950/80 text-red-300 border border-red-800 text-xs font-bold px-2.5 py-1.5 rounded-xl">Delete</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-bold px-3 py-1 rounded-full">❌ বাতিলকৃত ({req.adminNote || 'রিফান্ড সম্পন্ন'})</span>
                          <button onClick={async()=>{const r=await deleteWithdrawRequest(req.id); showToast(r.message,r.success?'success':'error');}} className="bg-red-950/80 text-red-300 border border-red-800 text-xs font-bold px-2.5 py-1.5 rounded-xl">Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= 6. USERS MANAGEMENT TAB ================= */}
        {activeAdminTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-[#121935] p-4 rounded-2xl border border-indigo-900/60 flex flex-wrap items-center justify-between gap-3 sticky top-[105px] z-20 shadow-xl">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span>রেজিস্টার্ড ব্যবহারকারী তালিকা</span>
                </h2>
                <p className="text-xs text-slate-400">
                  ব্যালেন্স যোগ/কর্তন, পাসওয়ার্ড রিসেট, ব্যান এবং প্রয়োজন হলে পুরোনো একাউন্ট সম্পূর্ণ ডিলিট করুন।
                </p>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  placeholder="নাম বা ফোন নাম্বার দিয়ে খুঁজুন..."
                  className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="space-y-3">
              {filteredUsers.map(u => (
                <div
                  key={u.id}
                  className={`bg-[#121935] border rounded-2xl p-4 shadow-lg flex flex-nowrap items-center justify-between gap-4 overflow-x-auto ${
                    u.isBanned ? 'border-red-600/50 bg-red-950/20' : 'border-indigo-900/60'
                  }`}
                >
                  <div className="space-y-1 min-w-[230px] shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openUserAudit(u.id)}
                        className="font-bold text-white text-sm hover:text-cyan-300 underline decoration-dotted underline-offset-2 text-left"
                        title="এই ব্যবহারকারীর সম্পূর্ণ বিস্তারিত দেখুন"
                      >
                        {u.name}
                      </button>
                      <span className="text-xs text-slate-400 font-mono">({u.phone})</span>
                      {u.isBanned && (
                        <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                          BANNED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300">Player Name: <span className="text-amber-400 font-bold">{u.name}</span></p>
                    <p className="text-[11px] text-slate-500">ম্যাচ খেলেছেন: {u.matchesPlayed || 0} টি • যুক্ত হয়েছেন: {u.joinedAt}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">
                        গেমিং: <b className="text-amber-400 font-mono font-bold">৳{u.gamingBalance.toFixed(0)}</b>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        উইনিং: <b className="text-emerald-400 font-mono font-bold">৳{u.winningBalance.toFixed(0)}</b>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setAdjustingUser(u);
                          setAdjustAmount(100);
                          setAdjustmentId(newAdjustmentId());
                          setAdjustSubmitting(false);
                        }}
                        className="bg-indigo-900 hover:bg-indigo-800 text-white border border-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold"
                      >
                        ব্যালেন্স এডিট
                      </button>

                      <button
                        onClick={async () => {
                          const newPassword = window.prompt(`নতুন পাসওয়ার্ড দিন (${u.name})`, '');
                          if (!newPassword) return;
                          if (newPassword.length < 6) { showToast('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।', 'error'); return; }
                          const res = await resetUserPassword(u.id, newPassword);
                          showToast(res.message, res.success ? 'success' : 'error');
                        }}
                        className="bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 px-3 py-1.5 rounded-xl text-xs font-bold"
                      >
                        পাসওয়ার্ড রিসেট
                      </button>

                      <button
                        onClick={async () => {
                          await toggleUserBan(u.id);
                        }}
                        className={`text-xs px-2.5 py-1.5 rounded-xl font-bold ${
                          u.isBanned
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : 'bg-red-950 text-red-300 border border-red-800'
                        }`}
                      >
                        {u.isBanned ? 'আনব্যান' : 'ব্যান'}
                      </button>

                      {!u.isAdmin && (
                        <button
                          onClick={async () => {
                            if (!window.confirm(`“${u.name}” (${u.phone}) একাউন্টটি সম্পূর্ণভাবে ডিলিট করবেন?\n\nএই কাজটি আর Undo করা যাবে না।`)) return;
                            const res = await deleteUser(u.id);
                            showToast(res.message, res.success ? 'success' : 'error');
                          }}
                          className="bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 px-3 py-1.5 rounded-xl text-xs font-bold"
                        >
                          ডিলিট
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= REFERRAL APPROVAL TAB ================= */}
        {activeAdminTab === 'referrals' && (
          <div className="space-y-4 max-w-5xl">
            <div className="bg-[#121935] p-4 rounded-2xl border border-amber-500/30">
              <h2 className="text-base font-black text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-400" /> রেফারেল বোনাস অনুমোদন</h2>
              <p className="text-xs text-slate-400 mt-1">যোগ্য Referral এখানে তালিকায় আসবে। Admin অনুমোদন না করা পর্যন্ত কোনো বোনাস Gaming Balance-এ যোগ হবে না।</p>
            </div>
            <div className="space-y-3">
              {referrals.map((r:any) => {
                const pending = r.status === 'PENDING_APPROVAL';
                return (
                  <div key={r.id} className="bg-[#0f1732] border border-indigo-900/70 rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-black text-white text-sm">{r.referrerName} <span className="text-slate-500">→</span> {r.referredUserName}</div>
                        <div className="text-[11px] text-slate-400 mt-1">Bonus ৳{Number(r.bonusAmount || 0)} • Qualified Deposit ৳{Number(r.qualifyingDeposit || 0)}</div>
                        <div className="text-[10px] text-slate-500 mt-1">Created: {r.createdAt ? new Date(r.createdAt).toLocaleString('bn-BD') : '—'}</div>
                      </div>
                      <span className={`shrink-0 text-[10px] font-black px-2 py-1 rounded-lg border ${pending ? 'text-amber-300 bg-amber-500/10 border-amber-500/30' : r.status === 'PAID' ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' : 'text-red-300 bg-red-500/10 border-red-500/30'}`}>{pending ? 'PENDING APPROVAL' : r.status}</span>
                    </div>
                    {pending && <div className="mt-3 flex gap-2"><button type="button" onClick={() => approveReferral(r)} className="flex-1 bg-emerald-500 text-slate-950 font-black px-3 py-2 rounded-xl text-xs">অনুমোদন করুন</button><button type="button" onClick={() => rejectReferral(r)} className="flex-1 bg-red-950 text-red-300 border border-red-800 font-black px-3 py-2 rounded-xl text-xs">রিজেক্ট</button></div>}
                  </div>
                );
              })}
              {referrals.length === 0 && <div className="bg-[#121935] p-8 rounded-2xl border border-indigo-900/60 text-center text-sm text-slate-500">এখনো কোনো যোগ্য Referral Approval Request নেই।</div>}
            </div>
          </div>
        )}

        {/* ================= 7. SETTINGS & NOTICES TAB ================= */}
        {activeAdminTab === 'settings' && (
          <div className="space-y-6 max-w-3xl">
            <div className="bg-[#121935] p-4 rounded-2xl border border-indigo-900/60">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <span>পেমেন্ট নম্বর ও সাইট সেটিংস</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                এখানে আপনার বিকাশ, নগদ, রকেট এবং সাপোর্ট নম্বর পরিবর্তন করতে পারেন।
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="bg-[#121935] p-6 rounded-2xl border border-indigo-900/60 space-y-4">
              <h3 className="text-sm font-bold text-amber-400 border-b border-indigo-950 pb-2">
                পেমেন্ট ডিপোজিট নম্বরসমূহ (Personal)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">bKash নম্বর (Personal)</label>
                  <input
                    type="text"
                    value={settingsForm.bkash}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bkash: e.target.value })}
                    className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">Nagad নম্বর (Personal)</label>
                  <input
                    type="text"
                    value={settingsForm.nagad}
                    onChange={(e) => setSettingsForm({ ...settingsForm, nagad: e.target.value })}
                    className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">Rocket নম্বর (Personal)</label>
                  <input
                    type="text"
                    value={settingsForm.rocket}
                    onChange={(e) => setSettingsForm({ ...settingsForm, rocket: e.target.value })}
                    className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">Upay নম্বর (Personal)</label>
                  <input
                    type="text"
                    value={settingsForm.upay}
                    onChange={(e) => setSettingsForm({ ...settingsForm, upay: e.target.value })}
                    className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <h3 className="text-sm font-bold text-amber-400 border-b border-indigo-950 pb-2 pt-2">
                bKash Agent ও Binance / USDT
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">bKash Agent নম্বর</label>
                  <input type="text" value={settingsForm.bkashAgent || ''} onChange={e=>setSettingsForm({...settingsForm,bkashAgent:e.target.value})} className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white font-mono" placeholder="01XXXXXXXXX" />
                  <label className="flex items-center gap-2 text-[11px] text-slate-300 mt-2"><input type="checkbox" checked={settingsForm.bkashAgentEnabled !== false} onChange={e=>setSettingsForm({...settingsForm,bkashAgentEnabled:e.target.checked})}/> bKash Agent চালু</label>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">Binance / USDT Wallet</label>
                  <input type="text" value={settingsForm.binanceUsdt || ''} onChange={e=>setSettingsForm({...settingsForm,binanceUsdt:e.target.value})} className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white font-mono" placeholder="USDT wallet address" />
                  <label className="flex items-center gap-2 text-[11px] text-slate-300 mt-2"><input type="checkbox" checked={settingsForm.binanceUsdtEnabled !== false} onChange={e=>setSettingsForm({...settingsForm,binanceUsdtEnabled:e.target.checked})}/> Binance / USDT চালু</label>
                </div>
              </div>

              <h3 className="text-sm font-bold text-amber-400 border-b border-indigo-950 pb-2 pt-2">
                Deposit Payment Methods — ON / OFF
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  ['depositBkashEnabled', 'bKash Personal'],
                  ['depositBkashAgentEnabled', 'bKash Agent'],
                  ['depositNagadEnabled', 'Nagad Personal'],
                  ['depositRocketEnabled', 'Rocket Personal'],
                  ['depositUpayEnabled', 'Upay Personal'],
                  ['depositBinanceUsdtEnabled', 'Binance / USDT'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between gap-3 bg-[#0b1022] border border-indigo-900 rounded-xl px-3 py-2.5 text-xs text-slate-200">
                    <span>{label}</span>
                    <input type="checkbox" checked={settingsForm[key as keyof typeof settingsForm] !== false} onChange={e => setSettingsForm({...settingsForm, [key]: e.target.checked})} className="w-5 h-5 accent-amber-500" />
                  </label>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">OFF করলে Player-এর Deposit screen এবং server—দুই জায়গাতেই ওই method বন্ধ থাকবে।</p>

              <h3 className="text-sm font-bold text-teal-400 border-b border-indigo-950 pb-2 pt-2">
                Withdraw Payment Methods — ON / OFF (Personal)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  ['withdrawBkashEnabled', 'bKash Personal'],
                  ['withdrawNagadEnabled', 'Nagad Personal'],
                  ['withdrawRocketEnabled', 'Rocket Personal'],
                  ['withdrawUpayEnabled', 'Upay Personal'],
                  ['withdrawBinanceUsdtEnabled', 'Binance / USDT'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between gap-3 bg-[#0b1022] border border-indigo-900 rounded-xl px-3 py-2.5 text-xs text-slate-200">
                    <span>{label}</span>
                    <input type="checkbox" checked={settingsForm[key as keyof typeof settingsForm] !== false} onChange={e => setSettingsForm({...settingsForm, [key]: e.target.checked})} className="w-5 h-5 accent-teal-500" />
                  </label>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">Withdraw screen-এ শুধু Personal methods দেখাবে। Agent withdrawal আলাদা করে চালু করা হয়নি।</p>

              <h3 className="text-sm font-bold text-amber-400 border-b border-indigo-950 pb-2 pt-2">
                সাপোর্ট ও যোগাযোগ
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">WhatsApp হেল্পলাইন নম্বর</label>
                  <input
                    type="text"
                    value={settingsForm.whatsappSupport}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsappSupport: e.target.value })}
                    className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">Telegram চ্যানেল লিংক</label>
                  <input
                    type="text"
                    value={settingsForm.telegramLink}
                    onChange={(e) => setSettingsForm({ ...settingsForm, telegramLink: e.target.value })}
                    className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <h3 className="text-sm font-bold text-amber-400 border-b border-indigo-950 pb-2 pt-2">
                Pro Match Entry Fee সেটিংস
              </h3>
              <div className="bg-[#0b1022] border border-indigo-900 rounded-xl p-3">
                <p className="text-[10px] text-slate-500 mb-2">Pro Match-এর ৬টি Entry Fee আপনি এখান থেকে যেকোনো positive amount দিতে পারবেন। Prize payout আগের মতোই থাকবে।</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(settingsForm.proMatchFees || [20,30,60,120,250,500]).map((fee:number, i:number) => (
                    <div key={i}>
                      <label className="block text-[10px] text-slate-400 mb-1">Option #{i+1} Entry Fee ৳</label>
                      <input type="number" min="0.01" step="0.01" value={fee} onChange={e => { const fees = [...(settingsForm.proMatchFees || [20,30,60,120,250,500])]; fees[i] = Number(e.target.value); setSettingsForm({...settingsForm, proMatchFees: fees}); }} className="w-full bg-[#080d1b] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white" />
                    </div>
                  ))}
                </div>
              </div>

              <h3 className="text-sm font-bold text-cyan-400 border-b border-indigo-950 pb-2 pt-2">
                Multiplayer Pro Match — Player Count
              </h3>
              <div className="bg-[#0b1022] border border-cyan-900/70 rounded-xl p-3 space-y-2">
                <p className="text-[10px] text-slate-500">3, 5, 7 অথবা 10 জনের Pro Match আলাদাভাবে Active/Inactive করুন। প্রতিটির Entry Fee, কতজন Prize পাবেন এবং 1st/2nd/3rd... rank-এর Prize আপনি নিজে সেট করতে পারবেন। Active + Home ON হলে শুধু সেই Match Home Screen-এ দেখাবে।</p>
                <div className="space-y-2">
                  {(settingsForm.multiplayerProMatches || [{id:'mp_3',players:3,entryFee:20,prizeAmount:40,prizes:[40],active:false,showOnHome:true,displayOrder:1},{id:'mp_5',players:5,entryFee:30,prizeAmount:80,prizes:[80],active:false,showOnHome:true,displayOrder:2},{id:'mp_7',players:7,entryFee:60,prizeAmount:160,prizes:[160],active:false,showOnHome:true,displayOrder:3},{id:'mp_10',players:10,entryFee:120,prizeAmount:300,prizes:[300],active:false,showOnHome:true,displayOrder:4}]).map((m:any, i:number) => {
                    const prizes = Array.isArray(m.prizes) && m.prizes.length ? m.prizes : [Number(m.prizeAmount||0)];
                    const rows = settingsForm.multiplayerProMatches || [];
                    const update = (patch:any) => { const next=[...rows]; next[i]={...m,...patch}; setSettingsForm({...settingsForm,multiplayerProMatches:next}); };
                    const setWinnerCount = (count:number) => { const n=Math.max(1,Math.min(Number(m.players)||1,Math.floor(count||1))); const nextPrizes=prizes.slice(0,n); while(nextPrizes.length<n) nextPrizes.push(0); update({prizes:nextPrizes,prizeAmount:Number(nextPrizes[0]||0)}); };
                    return (
                    <div key={m.id || i} className="rounded-xl border border-indigo-900 bg-[#080d1b] p-2.5 space-y-2">
                      <div className="flex items-center justify-between"><b className="text-xs text-white">{m.players} Players</b><label className="flex items-center gap-2 text-[10px] text-slate-300"><input type="checkbox" checked={m.active === true} onChange={e=>update({active:e.target.checked})} className="w-4 h-4 accent-cyan-500"/> Active</label></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="block text-[10px] text-slate-500 mb-1">Entry Fee ৳</label><input type="number" min="1" value={m.entryFee} onChange={e=>update({entryFee:Number(e.target.value)})} className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white"/></div>
                        <div><label className="block text-[10px] text-slate-500 mb-1">কতজন Prize পাবেন?</label><input type="number" min="1" max={m.players} value={prizes.length} onChange={e=>setWinnerCount(Number(e.target.value))} className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white"/></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {prizes.map((amount:number, pi:number)=><div key={pi}><label className="block text-[10px] text-amber-300 mb-1">#{pi+1} Prize ৳</label><input type="number" min="1" value={amount} onChange={e=>{const nextPrizes=[...prizes]; nextPrizes[pi]=Number(e.target.value); update({prizes:nextPrizes,prizeAmount:Number(nextPrizes[0]||0)});}} className="w-full bg-[#0b1022] border border-amber-900/60 rounded-xl px-3 py-2 text-xs text-white"/></div>)}
                      </div>
                      <div className="flex items-center justify-between gap-2"><span className="text-[10px] text-slate-500">মোট Prize: ৳{prizes.reduce((a:number,v:number)=>a+Number(v||0),0)}</span><label className="flex items-center gap-2 text-[10px] text-slate-300"><input type="checkbox" checked={m.showOnHome !== false} onChange={e=>update({showOnHome:e.target.checked})} className="w-4 h-4 accent-amber-500"/> Home Screen-এ দেখান</label></div>
                    </div>
                    );
                  })}
                </div>
              </div>

              <h3 className="text-sm font-bold text-amber-400 border-b border-indigo-950 pb-2 pt-2">
                রেফার বোনাস সেটিংস
              </h3>
              <p className="text-[11px] text-slate-400">যোগ্য Referral আগে Approval তালিকায় যাবে; Admin অনুমোদন করলে তবেই Referrer-এর Gaming Balance-এ Bonus যোগ হবে।</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">Referral Bonus (৳ Gaming Balance)</label>
                  <input type="number" min="0" value={settingsForm.referralBonusAmount ?? 20} onChange={(e) => setSettingsForm({ ...settingsForm, referralBonusAmount: Number(e.target.value) })} className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white font-mono" />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">ন্যূনতম Approved Deposit (৳)</label>
                  <input type="number" min="0" value={settingsForm.referralMinDeposit ?? 100} onChange={(e) => setSettingsForm({ ...settingsForm, referralMinDeposit: Number(e.target.value) })} className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white font-mono" />
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-200 sm:col-span-2">
                  <input type="checkbox" checked={settingsForm.referralEnabled !== false} onChange={(e) => setSettingsForm({ ...settingsForm, referralEnabled: e.target.checked })} /> Referral Bonus চালু রাখুন
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-200 sm:col-span-2">
                  <input type="checkbox" checked={settingsForm.referralRequireFirstProMatch !== false} onChange={(e) => setSettingsForm({ ...settingsForm, referralRequireFirstProMatch: e.target.checked })} /> Bonus-এর আগে নতুন user-এর ১ম Pro Match সম্পন্ন/খেলা বাধ্যতামূলক
                </label>
              </div>

              <h3 className="text-sm font-bold text-amber-400 border-b border-indigo-950 pb-2 pt-2">
                হেডার নোটিশ ও পপ-আপ মেসেজ
              </h3>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">হেডার রানিং স্ক্রল নোটিশ (Marquee)</label>
                <input
                  type="text"
                  value={settingsForm.marqueeNotice}
                  onChange={(e) => setSettingsForm({ ...settingsForm, marqueeNotice: e.target.value })}
                  className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">পপ-আপ নোটিশ বার্তা (Popup Notice)</label>
                <textarea
                  rows={2}
                  value={settingsForm.popupNoticeText}
                  onChange={(e) => setSettingsForm({ ...settingsForm, popupNoticeText: e.target.value })}
                  className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs shadow-lg active:scale-95 transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>সেটিংস সেভ করুন</span>
                </button>
                {settingsSaved && (
                  <p className="text-xs text-emerald-400 font-bold mt-2 animate-fade-in">
                    ✅ সেটিংস সফলভাবে আপডেট ও সংরক্ষিত হয়েছে!
                  </p>
                )}
              </div>
            </form>
          </div>
        )}
      {selectedAdminTournament && <div className="fixed inset-0 z-[86] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"><div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0e1428] border border-indigo-800 rounded-2xl p-5 shadow-2xl"><div className="flex items-center justify-between gap-3"><div><h3 className="font-black text-white">🏆 {selectedAdminTournament.name}</h3><p className="text-xs text-slate-400 mt-1">Players: {selectedAdminTournament.playerCount}/{selectedAdminTournament.maxPlayers}</p></div><button onClick={()=>setSelectedAdminTournament(null)} className="p-2 text-slate-400"><X className="w-5 h-5"/></button></div>{selectedAdminTournament.status!=='ENDED' && ((selectedAdminTournament.endMode==='TIME' && Number(selectedAdminTournament.timeRemainingMs||1)<=0) || (selectedAdminTournament.endMode!=='TIME' && selectedAdminTournament.full)) && <button onClick={()=>finalizeTournament(selectedAdminTournament.id)} className="mt-4 w-full bg-amber-500 text-slate-950 font-black py-2.5 rounded-xl text-xs">Tournament শেষ করুন → Prize Review</button>}{selectedAdminTournament.status==='ENDED' && <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">Tournament শেষ। কোনো Prize Admin Approval ছাড়া Player balance-এ যোগ হবে না।</div>}<div className="mt-4 space-y-2">{(selectedAdminTournament.entries||[]).map((e:any)=>{const payout=(selectedAdminTournament.payouts||[]).find((p:any)=>String(p.userId)===String(e.userId)); const status=payout?.status||'NO_PRIZE'; const avatar=e.avatarUrl||e.profilePhoto||e.photoUrl||''; return <div key={e.userId} className="flex items-center gap-3 rounded-xl bg-[#0b1022] border border-indigo-900/60 p-2.5"><div className="h-10 w-10 rounded-full overflow-hidden bg-indigo-900 flex items-center justify-center text-sm font-black text-white shrink-0">{avatar?<img src={avatar} className="h-full w-full object-cover"/>:<span>{String(e.username||'P').slice(0,1).toUpperCase()}</span>}</div><div className="min-w-0 flex-1"><div className="text-xs font-black text-white truncate">#{e.rank} {e.username}</div><div className="text-[10px] text-slate-500">ID: {e.userId} • Score: {e.score}</div></div><div className="text-right shrink-0"><div className="text-xs font-black text-amber-300">৳{e.prize||0}</div>{selectedAdminTournament.status==='ENDED' && e.prize>0 && <div className="mt-1 flex gap-1">{status==='PENDING' ? <><button onClick={()=>approveTournamentPayouts(selectedAdminTournament.id,[e.userId])} className="rounded-lg bg-emerald-600 px-2 py-1 text-[9px] font-black text-white">Approve</button><button onClick={()=>holdTournamentPayout(selectedAdminTournament.id,e.userId)} className="rounded-lg bg-red-600/80 px-2 py-1 text-[9px] font-black text-white">Hold</button></> : <span className={`text-[9px] font-black ${status==='PAID'?'text-emerald-400':'text-red-300'}`}>{status==='PAID'?'PAID':'HELD'}</span>}</div>}</div></div>})}</div>{selectedAdminTournament.status==='ENDED' && (selectedAdminTournament.payouts||[]).some((p:any)=>p.status==='PENDING') && <button onClick={()=>approveTournamentPayouts(selectedAdminTournament.id)} className="mt-4 w-full bg-emerald-600 text-white font-black py-3 rounded-xl text-xs">সব বৈধ Prize Approve করুন</button>}</div></div>}

      {showTournamentModal && <div className="fixed inset-0 z-[85] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"><form onSubmit={saveTournament} className="w-full max-w-lg bg-[#0e1428] border border-indigo-800 rounded-2xl p-5 space-y-3 shadow-2xl max-h-[90vh] overflow-y-auto"><div className="flex items-center justify-between"><h3 className="font-black text-white">{editingTournament?'Tournament Edit':'নতুন Tournament'}</h3><button type="button" onClick={()=>setShowTournamentModal(false)} className="p-2 text-slate-400"><X className="w-5 h-5"/></button></div><input required value={tournamentForm.name} onChange={e=>setTournamentForm({...tournamentForm,name:e.target.value})} placeholder="Tournament Name" className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white"/><div className="grid grid-cols-2 gap-3"><input type="number" min="0" value={tournamentForm.entryFee} onChange={e=>setTournamentForm({...tournamentForm,entryFee:Number(e.target.value)})} placeholder="Entry Fee" className="bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white"/><input type="number" min="2" value={tournamentForm.maxPlayers} onChange={e=>setTournamentForm({...tournamentForm,maxPlayers:Number(e.target.value)})} placeholder="Max Players" className="bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white"/></div><div className="grid grid-cols-2 gap-3"><div><label className="block text-[11px] text-slate-400 mb-1">Tournament শেষ হবে</label><select value={tournamentForm.endMode||'PLAYER_LIMIT'} onChange={e=>setTournamentForm({...tournamentForm,endMode:e.target.value})} className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white"><option value="PLAYER_LIMIT">Player সংখ্যা অনুযায়ী</option><option value="TIME">সময় অনুযায়ী</option></select></div>{(tournamentForm.endMode||'PLAYER_LIMIT')==='TIME' ? <div><label className="block text-[11px] text-slate-400 mb-1">Duration (মিনিট)</label><input type="number" min="1" value={tournamentForm.durationMinutes||''} onChange={e=>setTournamentForm({...tournamentForm,durationMinutes:Number(e.target.value)})} placeholder="যেমন 180 = 3 ঘণ্টা" className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white"/></div> : <div className="flex items-end text-[10px] text-slate-500 pb-2">Max Players পূর্ণ হলেই Tournament শেষ হবে</div>}</div><input type="number" min="0" value={tournamentForm.prizePool} onChange={e=>setTournamentForm({...tournamentForm,prizePool:Number(e.target.value)})} placeholder="Prize Pool" className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white"/><div><div className="flex items-center justify-between"><label className="text-[11px] text-slate-400">Prize Distribution</label><button type="button" onClick={addTournamentPrize} disabled={(tournamentForm.prizes||[]).length>=Number(tournamentForm.maxPlayers||0)} className="text-[11px] font-black text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2 py-1 disabled:opacity-40">+ Rank Prize</button></div><div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">{(tournamentForm.prizes||[]).map((v:number,i:number)=><div key={i} className="flex gap-1"><input type="number" min="0" value={v} onChange={e=>setTournamentForm({...tournamentForm,prizes:(tournamentForm.prizes||[]).map((x:number,j:number)=>j===i?Number(e.target.value):x)})} className="min-w-0 flex-1 bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white" placeholder={`#${i+1}`}/><button type="button" onClick={()=>removeTournamentPrize(i)} disabled={(tournamentForm.prizes||[]).length<=1} className="px-2 rounded-xl border border-red-900/60 text-red-300 disabled:opacity-30">×</button></div>)}</div></div><label className="flex items-center gap-2 text-xs text-slate-200"><input type="checkbox" checked={tournamentForm.active!==false} onChange={e=>setTournamentForm({...tournamentForm,active:e.target.checked})}/> Active</label><label className="flex items-center gap-2 text-xs text-slate-200"><input type="checkbox" checked={tournamentForm.showOnHome!==false} onChange={e=>setTournamentForm({...tournamentForm,showOnHome:e.target.checked})}/> Home Page-এ দেখান</label><button className="w-full bg-amber-500 text-slate-950 font-black py-2.5 rounded-xl text-xs">{editingTournament?'Update Tournament':'Create Tournament'}</button></form></div>}

      {showGameModal && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={saveGame} className="w-full max-w-lg bg-[#0e1428] border border-indigo-800 rounded-2xl p-5 space-y-3 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between"><h3 className="text-base font-black text-white">{editingGame?'Game Edit':'নতুন Game তৈরি'}</h3><button type="button" onClick={()=>setShowGameModal(false)} className="p-2 text-slate-400"><X className="w-5 h-5"/></button></div>
            {[['name','Game Name'],['slug','Slug'],['icon','Icon / Emoji'],['imageUrl','Image URL (optional)'],['description','Description']].map(([key,label])=><div key={key}><label className="block text-xs text-slate-300 font-semibold mb-1">{label}</label><input value={gameForm[key]||''} onChange={e=>setGameForm({...gameForm,[key]:e.target.value})} className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white" /></div>)}
            <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs text-slate-300 font-semibold mb-1">Game Type</label><select value={gameForm.gameType} onChange={e=>setGameForm({...gameForm,gameType:e.target.value})} className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white"><option value="custom">Custom / Future Game</option><option value="block_puzzle">Block Puzzle</option><option value="nut_sort">Nut Sort 1v1</option></select></div><div><label className="block text-xs text-slate-300 font-semibold mb-1">Display Order</label><input type="number" value={gameForm.displayOrder} onChange={e=>setGameForm({...gameForm,displayOrder:Number(e.target.value)})} className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white"/></div></div>
            <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs text-slate-300 font-semibold mb-1">Entry Fee ৳ (যেকোনো Amount)</label><input type="number" min="0" step="0.01" inputMode="decimal" value={gameForm.entryFee} onChange={e=>setGameForm({...gameForm,entryFee:e.target.value === '' ? 0 : Number(e.target.value)})} placeholder="যেমন 10, 25, 99.50" className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white"/></div><div><label className="block text-xs text-slate-300 font-semibold mb-1">Prize ৳</label><input type="number" min="0" value={gameForm.prizeAmount} onChange={e=>setGameForm({...gameForm,prizeAmount:Number(e.target.value)})} className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white"/></div></div>
            <label className="flex items-center gap-2 text-xs text-slate-200"><input type="checkbox" checked={gameForm.active!==false} onChange={e=>setGameForm({...gameForm,active:e.target.checked})}/> Active রাখুন</label>
            <label className="flex items-center gap-2 text-xs text-slate-200"><input type="checkbox" checked={gameForm.showOnHome!==false} onChange={e=>setGameForm({...gameForm,showOnHome:e.target.checked})}/> Home Page-এ দেখান</label>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-200">Game Management-এর Entry Fee এখন Admin যেকোনো Amount (প্রয়োজনে দশমিকসহ) সেট করতে পারবেন। এটি এই Game-এর server-side configuration/Card-এর Entry Fee; Pro Match-এর আলাদা fee options অপরিবর্তিত রাখা হয়েছে। Custom / Future Game তৈরি করলে শুধু Game Card/Home listing তৈরি হবে। Built-in games-এর code অপরিবর্তিত থাকে। Nut Sort 1v1-এ Active ও Home Page আলাদাভাবে নিয়ন্ত্রণ করা যাবে।</div>
            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs">{editingGame?'Update Game':'Create Game'}</button>
          </form>
        </div>
      )}

      </main>

      {/* ================= MODAL: CREATE MATCH ================= */}
      {false && showCreateMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#121935] border border-indigo-500/50 rounded-2xl p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-indigo-950 pb-3 mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2 text-amber-400">
                <Plus className="w-4 h-4" />
                <span>নতুন লুডো ম্যাচ তৈরি করুন</span>
              </h3>
              <button
                onClick={() => setShowCreateMatchModal(false)}
                className="w-7 h-7 rounded-full bg-indigo-950 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMatchSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">ম্যাচ শিরোনাম (Title)</label>
                <input
                  type="text"
                  value={newMatchTitle}
                  onChange={(e) => setNewMatchTitle(e.target.value)}
                  className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">সাবটাইটেল / শর্ত</label>
                <input
                  type="text"
                  value={newMatchSubtitle}
                  onChange={(e) => setNewMatchSubtitle(e.target.value)}
                  className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">এন্ট্রি ফি (৳)</label>
                  <input
                    type="number"
                    value={newMatchEntry}
                    onChange={(e) => setNewMatchEntry(Number(e.target.value))}
                    className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">মোট প্রাইজ (৳)</label>
                  <input
                    type="number"
                    value={newMatchPrize}
                    onChange={(e) => setNewMatchPrize(Number(e.target.value))}
                    className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">ক্যাটাগরি</label>
                  <select
                    value={newMatchCategory}
                    onChange={(e) => setNewMatchCategory(e.target.value as MatchCategory)}
                    className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="special">স্পেশাল ম্যাচ (Special)</option>
                    <option value="time">টাইম ম্যাচ (Time Match)</option>
                    <option value="one_player">১ জন জয়েন (1 Player)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">প্লেয়ার আসন (Seats)</label>
                  <select
                    value={newMatchSeats}
                    onChange={(e) => setNewMatchSeats(Number(e.target.value))}
                    className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value={2}>২ জন (1 VS 1)</option>
                    <option value={4}>৪ জন (1 VS 3)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">Block Puzzle Match ID (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={newMatchRoomCode}
                  onChange={(e) => setNewMatchRoomCode(e.target.value)}
                  placeholder="খালি রাখতে পারেন, প্লেয়ার জয়েনের পরও দেওয়া যাবে"
                  className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-lg active:scale-95 transition-all"
                >
                  ম্যাচ তৈরি সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: BALANCE ADJUSTMENT ================= */}
      {adjustingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-[#121935] border border-indigo-500/50 rounded-2xl p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-indigo-950 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">ব্যালেন্স এডজাস্টমেন্ট</h3>
                <p className="text-[11px] text-amber-400 font-bold">{adjustingUser.name} ({adjustingUser.phone})</p>
              </div>
              <button
                onClick={() => { if (!adjustSubmitting) { setAdjustingUser(null); setAdjustmentId(''); } }}
                className="w-7 h-7 rounded-full bg-indigo-950 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustBalanceSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">অ্যাকশন টাইপ</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustIsAdd(true)}
                    className={`py-1.5 rounded-lg text-xs font-bold ${
                      adjustIsAdd ? 'bg-emerald-600 text-white' : 'bg-[#0b1022] text-slate-400 border border-indigo-900'
                    }`}
                  >
                    + যোগ করুন (Add)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustIsAdd(false)}
                    className={`py-1.5 rounded-lg text-xs font-bold ${
                      !adjustIsAdd ? 'bg-red-600 text-white' : 'bg-[#0b1022] text-slate-400 border border-indigo-900'
                    }`}
                  >
                    - কর্তন করুন (Deduct)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">কোন ব্যালেন্স?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustBalanceType('gaming')}
                    className={`py-1.5 rounded-lg text-xs font-bold ${
                      adjustBalanceType === 'gaming' ? 'bg-amber-500 text-slate-950' : 'bg-[#0b1022] text-slate-400 border border-indigo-900'
                    }`}
                  >
                    গেমিং ব্যালেন্স (৳{adjustingUser.gamingBalance})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustBalanceType('winning')}
                    className={`py-1.5 rounded-lg text-xs font-bold ${
                      adjustBalanceType === 'winning' ? 'bg-emerald-500 text-slate-950' : 'bg-[#0b1022] text-slate-400 border border-indigo-900'
                    }`}
                  >
                    উইনিং ব্যালেন্স (৳{adjustingUser.winningBalance})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">টাকার পরিমাণ (৳)</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">নোট / কারণ</label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {adjustSubmitting ? 'প্রসেস হচ্ছে...' : (adjustIsAdd ? 'টাকা যোগ করুন' : 'টাকা কর্তন করুন')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: IMAGE PREVIEW ================= */}
      {previewImageUrl && (
        <div 
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md animate-fade-in cursor-pointer"
        >
          <div className="relative max-w-xl max-h-[85vh] bg-[#121935] p-2 rounded-2xl border border-indigo-500/50">
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/80 text-white flex items-center justify-center border border-white/20"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewImageUrl} alt="Full Preview" className="max-h-[80vh] w-auto rounded-xl object-contain" />
          </div>
        </div>
      )}

      {/* ================= MODAL: COMPLETE USER AUDIT ================= */}
      {auditUser && auditData && (
        <div className="fixed inset-0 z-[120] bg-black/80 flex items-center justify-center p-3">
          <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-[#0d142d] border border-cyan-800 rounded-2xl p-4">
            <div className="flex justify-between items-start mb-4"><div><h3 className="text-lg font-black text-white">USER AUDIT — {auditUser.name}</h3><p className="text-xs text-slate-400">{auditUser.phone} • সম্পূর্ণ হিস্ট্রি</p></div><button onClick={()=>{setAuditUser(null);setAuditData(null)}} className="bg-red-950 text-red-300 border border-red-800 px-3 py-1.5 rounded-lg text-xs font-bold">বন্ধ করুন</button></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">{[['Deposit Approved',`৳${auditData.summary.approvedDeposits}`],['Withdraw Approved',`৳${auditData.summary.totalWithdrawApproved}`],['Withdraw Pending',`৳${auditData.summary.totalWithdrawPending}`],['Withdraw Rejected',`৳${auditData.summary.totalWithdrawRejected}`],['Matches Played',auditData.summary.matchesPlayed],['Matches Won',auditData.summary.matchesWon],['Pro Matches',auditData.summary.proMatches],['Transactions',auditData.summary.transactionCount]].map(([l,v])=><div key={String(l)} className="bg-[#121b38] border border-indigo-900 rounded-xl p-3"><div className="text-[10px] text-slate-400">{l}</div><div className="text-sm font-black text-white mt-1">{v}</div></div>)}</div>
            <div className="bg-[#121b38] border border-indigo-900 rounded-xl p-3 mb-4 text-xs text-slate-200 flex flex-wrap gap-5">Gaming: <b className="text-amber-400">৳{auditData.summary.currentGamingBalance}</b> Winning: <b className="text-emerald-400">৳{auditData.summary.currentWinningBalance}</b> Pro Entry: <b>৳{auditData.summary.proEntryTotal}</b> Pro Prize: <b className="text-emerald-300">৳{auditData.summary.proPrizeTotal}</b></div>
            <div className="bg-[#121b38] border border-indigo-900 rounded-xl p-3 mb-4 overflow-x-auto"><h4 className="text-sm font-black text-amber-300 mb-2">Pro Match + Score History</h4><table className="w-full text-[11px]"><thead><tr className="text-slate-400"><th className="text-left p-2">Date</th><th className="text-left p-2">Match</th><th className="text-left p-2">Entry</th><th className="text-left p-2">Score</th><th className="text-left p-2">Result</th><th className="text-left p-2">Status</th></tr></thead><tbody>{(auditData.proMatches||[]).map((m:any)=><tr key={m.matchId} className="border-t border-indigo-950"><td className="p-2">{m.createdAt?new Date(m.createdAt).toLocaleString():'-'}</td><td className="p-2 font-mono">{String(m.matchId).slice(-8)}</td><td className="p-2">৳{m.entryFee}</td><td className="p-2 font-black">{m.score??'-'}</td><td className={`p-2 font-black ${m.outcome==='WON'?'text-emerald-400':m.outcome==='LOST'?'text-red-400':''}`}>{m.outcome||'-'}</td><td className="p-2">{m.status}</td></tr>)}</tbody></table></div>
            <div className="grid md:grid-cols-2 gap-4"><div className="bg-[#121b38] border border-indigo-900 rounded-xl p-3 overflow-x-auto"><h4 className="text-sm font-black text-emerald-300 mb-2">Deposit History</h4>{(auditData.deposits||[]).map((d:any)=><div key={d.id} className="text-[11px] border-t border-indigo-950 py-2">৳{d.amount} • {d.status} • {d.trxId||'-'} • {d.timestamp||d.createdAt||'-'}</div>)}</div><div className="bg-[#121b38] border border-indigo-900 rounded-xl p-3 overflow-x-auto"><h4 className="text-sm font-black text-red-300 mb-2">Withdrawal History</h4>{(auditData.withdrawals||[]).map((w:any)=><div key={w.id} className="text-[11px] border-t border-indigo-950 py-2">৳{w.amount} • {w.status} • {w.method||'-'} • {w.timestamp||'-'}</div>)}</div></div>
            <div className="bg-[#121b38] border border-indigo-900 rounded-xl p-3 mt-4 overflow-x-auto"><h4 className="text-sm font-black text-purple-300 mb-2">Complete Transaction Ledger</h4>{(auditData.transactions||[]).map((t:any)=><div key={t.id} className="text-[11px] border-t border-indigo-950 py-2">{t.date?new Date(t.date).toLocaleString():'-'} • {t.title||'-'} • <b className={Number(t.amount)>=0?'text-emerald-400':'text-red-400'}>{Number(t.amount)>=0?'+':''}৳{t.amount}</b> • {t.category||'-'} • {t.status||'-'}</div>)}</div>
            {auditLoading && <div className="text-center text-cyan-300 text-xs mt-3">Loading...</div>}
          </div>
        </div>
      )}

      {/* ================= MODAL: WITHDRAW ACTION ================= */}
      {withdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121935] border border-indigo-500/40 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-900/60 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {withdrawModal.action === 'approve' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>উইথড্র পেমেন্ট পরিশোধ নিশ্চিতকরণ</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span>উইথড্র বাতিল ও রিফান্ড</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setWithdrawModal(null)}
                className="w-7 h-7 rounded-lg bg-indigo-950 text-slate-400 hover:text-white flex items-center justify-center border border-indigo-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Request info summary card */}
            <div className="bg-[#0b1022] p-3.5 rounded-xl border border-indigo-900/60 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>গ্রাহক নাম:</span>
                <span className="font-bold text-white">{withdrawModal.req.userName} ({withdrawModal.req.userPhone})</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>মেথড ও টাইপ:</span>
                <span className="font-bold text-amber-400 uppercase">{withdrawModal.req.method} ({withdrawModal.req.accountType})</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>টাকা পাঠানোর নাম্বার:</span>
                <span className="font-mono font-black text-white text-sm bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">{withdrawModal.req.accountNumber}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-indigo-900/50">
                <span>উইথড্র পরিমাণ:</span>
                <span className="font-black text-emerald-400 text-base">৳{withdrawModal.req.amount}</span>
              </div>
            </div>

            {withdrawModal.action === 'approve' ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  আপনি কি গ্রাহকের নাম্বারে <b>৳{withdrawModal.req.amount}</b> টাকা পাঠিয়েছেন? নিচে TrxID লিখে পরিশোধ সম্পন্ন করুন।
                </p>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">বিকাশ / নগদ TrxID (ঐচ্ছিক):</label>
                  <input
                    type="text"
                    value={withdrawModal.trxId}
                    onChange={(e) => setWithdrawModal({ ...withdrawModal, trxId: e.target.value })}
                    placeholder="e.g. ADM782391"
                    className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 outline-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawModal(null)}
                    className="flex-1 py-2 bg-indigo-950 hover:bg-indigo-900 text-slate-300 font-bold rounded-xl text-xs border border-indigo-800"
                  >
                    ফিরে যান
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await approveWithdrawRequest(withdrawModal.req.id, withdrawModal.trxId.trim() || 'PAID');
                      showToast(res.message, res.success ? 'success' : 'error');
                      if (res.success) setWithdrawModal(null);
                    }}
                    className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-lg active:scale-95"
                  >
                    ✅ পরিশোধ সম্পন্ন করুন
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-red-950/40 border border-red-800/60 p-2.5 rounded-xl text-red-200 text-xs">
                  ⚠️ বাতিল করলে গ্রাহকের <b>৳{withdrawModal.req.amount}</b> টাকা সাথে সাথে তার <b>উইনিং ব্যালেন্সে</b> ফেরত চলে যাবে।
                </div>

                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1.5">বাতিলের কারণ সিলেক্ট করুন বা লিখুন:</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {['ভুল একাউন্ট নম্বর', 'নাম্বার সার্ভিস বন্ধ', 'ব্যক্তিগত তথ্য অসম্পূর্ণ', 'সন্দেহজনক কার্যক্রম'].map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setWithdrawModal({ ...withdrawModal, reason })}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                          withdrawModal.reason === reason
                            ? 'bg-red-900/80 border-red-500 text-white font-bold'
                            : 'bg-[#0b1022] border-indigo-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={withdrawModal.reason}
                    onChange={(e) => setWithdrawModal({ ...withdrawModal, reason: e.target.value })}
                    placeholder="কাস্টম কারণ লিখুন..."
                    className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white focus:border-red-400 outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawModal(null)}
                    className="flex-1 py-2 bg-indigo-950 hover:bg-indigo-900 text-slate-300 font-bold rounded-xl text-xs border border-indigo-800"
                  >
                    ফিরে যান
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await rejectWithdrawRequest(withdrawModal.req.id, withdrawModal.reason.trim() || 'ভুল একাউন্ট তথ্য');
                      showToast(`উইথড্র বাতিল করা হয়েছে এবং ৳${withdrawModal.req.amount} রিফান্ড করা হয়েছে!`, 'info');
                      setWithdrawModal(null);
                    }}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg active:scale-95"
                  >
                    ❌ বাতিল ও ব্যালেন্স রিফান্ড
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: DEPOSIT ACTION ================= */}
      {depositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121935] border border-indigo-500/40 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-900/60 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {depositModal.action === 'approve' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>ডিপোজিট অনুমোদন</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span>ডিপোজিট বাতিল</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setDepositModal(null)}
                className="w-7 h-7 rounded-lg bg-indigo-950 text-slate-400 hover:text-white flex items-center justify-center border border-indigo-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Request info */}
            <div className="bg-[#0b1022] p-3.5 rounded-xl border border-indigo-900/60 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>গ্রাহক নাম:</span>
                <span className="font-bold text-white">{depositModal.req.userName} ({depositModal.req.userPhone})</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>পেমেন্ট মেথড:</span>
                <span className="font-bold text-amber-400 uppercase">{depositModal.req.method}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>সেন্ডার নম্বর:</span>
                <span className="font-mono text-white font-bold">{depositModal.req.senderNumber}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>গ্রাহকের TrxID:</span>
                <span className="font-mono text-amber-400 font-bold bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">{depositModal.req.trxId}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-indigo-900/50">
                <span>ডিপোজিট পরিমাণ:</span>
                <span className="font-black text-emerald-400 text-base">৳{depositModal.req.amount}</span>
              </div>
            </div>

            {depositModal.action === 'approve' ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  অনুমোদন করলে ব্যবহারকারীর একাউন্টে সাথে সাথে <b>৳{depositModal.req.amount}</b> গেমিং ব্যালেন্স যোগ হবে।
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDepositModal(null)}
                    className="flex-1 py-2 bg-indigo-950 hover:bg-indigo-900 text-slate-300 font-bold rounded-xl text-xs border border-indigo-800"
                  >
                    ফিরে যান
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await approveDepositRequest(depositModal.req.id);
                      showToast(res.message, res.success ? 'success' : 'error');
                      setDepositModal(null);
                    }}
                    className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg active:scale-95"
                  >
                    ✅ অনুমোদন করুন
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1.5">বাতিলের কারণ সিলেক্ট করুন বা লিখুন:</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {['ভুল ট্রানজেকশন আইডি', 'টাকা জমা পাওয়া যায়নি', 'টাকার পরিমাণ মিল নেই', 'ভুল সেন্ডার নম্বর'].map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setDepositModal({ ...depositModal, reason })}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                          depositModal.reason === reason
                            ? 'bg-red-900/80 border-red-500 text-white font-bold'
                            : 'bg-[#0b1022] border-indigo-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={depositModal.reason}
                    onChange={(e) => setDepositModal({ ...depositModal, reason: e.target.value })}
                    placeholder="কাস্টম কারণ লিখুন..."
                    className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white focus:border-red-400 outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDepositModal(null)}
                    className="flex-1 py-2 bg-indigo-950 hover:bg-indigo-900 text-slate-300 font-bold rounded-xl text-xs border border-indigo-800"
                  >
                    ফিরে যান
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await rejectDepositRequest(depositModal.req.id, depositModal.reason.trim() || 'ভুল ট্রানজেকশন তথ্য');
                      showToast('ডিপোজিট রিকোয়েস্ট বাতিল করা হয়েছে!', 'info');
                      setDepositModal(null);
                    }}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg active:scale-95"
                  >
                    ❌ ডিপোজিট বাতিল করুন
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: RESULT ACTION ================= */}
      {resultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121935] border border-indigo-500/40 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-900/60 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {resultModal.action === 'approve' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>বিজয়ী অনুমোদন ও প্রাইজ মানি প্রদান</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span>স্ক্রিনশট সাবমিশন বাতিল</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setResultModal(null)}
                className="w-7 h-7 rounded-lg bg-indigo-950 text-slate-400 hover:text-white flex items-center justify-center border border-indigo-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#0b1022] p-3.5 rounded-xl border border-indigo-900/60 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>প্লেয়ার নাম:</span>
                <span className="font-bold text-white">{resultModal.sub.userName} ({resultModal.sub.userPhone})</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Player ID:</span>
                <span className="font-bold text-amber-400">{resultModal.sub.userName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>রুম কোড:</span>
                <span className="font-mono text-white font-bold bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">{resultModal.sub.roomCode}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-indigo-900/50">
                <span>প্রাইজ পরিমাণ:</span>
                <span className="font-black text-amber-400 text-base">৳{resultModal.sub.prizeAmount}</span>
              </div>
            </div>

            {resultModal.action === 'approve' ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  অনুমোদন করলে <b>{resultModal.sub.userName}</b> এর উইনিং ব্যালেন্সে <b>৳{resultModal.sub.prizeAmount}</b> যোগ হবে এবং ম্যাচটি সম্পন্ন হবে।
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResultModal(null)}
                    className="flex-1 py-2 bg-indigo-950 hover:bg-indigo-900 text-slate-300 font-bold rounded-xl text-xs border border-indigo-800"
                  >
                    ফিরে যান
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await approveResultSubmission(resultModal.sub.id);
                      showToast(res.message, res.success ? 'success' : 'error');
                      setResultModal(null);
                    }}
                    className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg active:scale-95"
                  >
                    🏆 বিজয়ী অনুমোদন ও প্রাইজ দিন
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1.5">বাতিলের কারণ সিলেক্ট করুন বা লিখুন:</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {['নকল বা এডিটেড স্ক্রিনশট', 'ভুল রুম আইডি', 'পরাজয়ের স্ক্রিনশট', 'স্পষ্ট নয় এমন ছবি'].map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setResultModal({ ...resultModal, reason })}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                          resultModal.reason === reason
                            ? 'bg-red-900/80 border-red-500 text-white font-bold'
                            : 'bg-[#0b1022] border-indigo-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={resultModal.reason}
                    onChange={(e) => setResultModal({ ...resultModal, reason: e.target.value })}
                    placeholder="কাস্টম কারণ লিখুন..."
                    className="w-full bg-[#0b1022] border border-indigo-800 rounded-xl px-3 py-2 text-xs text-white focus:border-red-400 outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResultModal(null)}
                    className="flex-1 py-2 bg-indigo-950 hover:bg-indigo-900 text-slate-300 font-bold rounded-xl text-xs border border-indigo-800"
                  >
                    ফিরে যান
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await rejectResultSubmission(resultModal.sub.id, resultModal.reason.trim() || 'ভুল বা নকল স্ক্রিনশট');
                      showToast('রেজাল্ট সাবমিশন বাতিল করা হয়েছে!', 'info');
                      setResultModal(null);
                    }}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg active:scale-95"
                  >
                    ❌ সাবমিশন বাতিল করুন
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: MATCH ACTION ================= */}
      {matchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121935] border border-indigo-500/40 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-900/60 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {matchModal.action === 'cancel' ? (
                  <>
                    <RotateCcw className="w-5 h-5 text-amber-400" />
                    <span>ম্যাচ বাতিল ও ফি রিফান্ড</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5 text-red-400" />
                    <span>ম্যাচ ডিলিট নিশ্চিতকরণ</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setMatchModal(null)}
                className="w-7 h-7 rounded-lg bg-indigo-950 text-slate-400 hover:text-white flex items-center justify-center border border-indigo-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#0b1022] p-3.5 rounded-xl border border-indigo-900/60 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>ম্যাচ নং:</span>
                <span className="font-bold text-amber-400">#{matchModal.match.matchNo} ({matchModal.match.title})</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>এন্ট্রি ফি:</span>
                <span className="font-bold text-white">৳{matchModal.match.entryFee}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>মোট পুরস্কার:</span>
                <span className="font-bold text-emerald-400">৳{matchModal.match.totalPrize}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>জয়েনকৃত প্লেয়ার:</span>
                <span className="font-bold text-white">{matchModal.match.joinedSeats} / {matchModal.match.totalSeats} জন</span>
              </div>
            </div>

            {matchModal.action === 'cancel' ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  ম্যাচটি বাতিল করলে জয়েনকৃত সকল ({matchModal.match.joinedSeats} জন) প্লেয়ারকে তাদের এন্ট্রি ফি <b>৳{matchModal.match.entryFee}</b> সাথে সাথে <b>গেমিং ব্যালেন্সে রিফান্ড</b> করে দেওয়া হবে।
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMatchModal(null)}
                    className="flex-1 py-2 bg-indigo-950 hover:bg-indigo-900 text-slate-300 font-bold rounded-xl text-xs border border-indigo-800"
                  >
                    ফিরে যান
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await cancelMatchAndRefund(matchModal.match.id);
                      showToast(`ম্যাচ #${matchModal.match.matchNo} বাতিল ও এন্ট্রি ফি রিফান্ড করা হয়েছে!`, 'info');
                      setMatchModal(null);
                    }}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-lg active:scale-95"
                  >
                    ✅ হ্যাঁ, বাতিল ও রিফান্ড করুন
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-red-300">
                  আপনি কি নিশ্চিত যে ম্যাচ <b>#{matchModal.match.matchNo}</b> সম্পূর্ণভাবে তালিকা থেকে মুছে ফেলতে চান?
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMatchModal(null)}
                    className="flex-1 py-2 bg-indigo-950 hover:bg-indigo-900 text-slate-300 font-bold rounded-xl text-xs border border-indigo-800"
                  >
                    না, রাখুন
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteMatch(matchModal.match.id);
                      showToast(`ম্যাচ #${matchModal.match.matchNo} ডিলিট করা হয়েছে!`, 'info');
                      setMatchModal(null);
                    }}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg active:scale-95"
                  >
                    🗑️ ডিলিট করুন
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= IN-APP TOAST NOTIFICATION ================= */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className={`px-4 py-2.5 rounded-2xl shadow-2xl border flex items-center gap-2 text-xs font-bold ${
            toast.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-500/60 shadow-emerald-950/80'
              : toast.type === 'error'
              ? 'bg-red-950 text-red-200 border-red-500/60 shadow-red-950/80'
              : 'bg-indigo-950 text-amber-200 border-amber-500/60 shadow-indigo-950/80'
          }`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
