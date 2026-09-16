import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BlockGameMode, 
  PracticeDifficulty, 
  BlockShape, 
  BlockPlayerState, 
  SpecialBlockType
} from '../types';
import { 
  BOARD_SIZE, 
  createEmptyBoard, 
  canPlaceBlock, 
  placeBlockOnBoard, 
  checkAndClearLines, 
  calculateMoveScore, 
  generateBlockTrio, 
  hasAnyLegalMove, 
  getTileCount,
  computeBoardHash,
  SPECIAL_BLOCKS
} from '../utils/blockPuzzleEngine';
import { blockAudio } from '../utils/blockPuzzleAudio';

// Components
import { BlockLobbyView, ENTRY_FEE_OPTIONS } from './blockpuzzle/BlockLobbyView';
import { BlockHud } from './blockpuzzle/BlockHud';
import { BlockBoardView, FloatingScoreItem } from './blockpuzzle/BlockBoardView';
import { BlockTrayView } from './blockpuzzle/BlockTrayView';
import { BlockSubmitModal } from './blockpuzzle/BlockSubmitModal';
import { BlockResultModal } from './blockpuzzle/BlockResultModal';
import { BlockPendingMatchesModal, PendingMatchItem } from './blockpuzzle/BlockPendingMatchesModal';
import { BlockProfileModal } from './blockpuzzle/BlockProfileModal';
import { BlockLeaderboardModal } from './blockpuzzle/BlockLeaderboardModal';
import { BlockMatchHistoryModal } from './blockpuzzle/BlockMatchHistoryModal';
import { BlockRulesModal } from './blockpuzzle/BlockRulesModal';
import { BlockTournamentRankList } from './blockpuzzle/BlockTournamentRankList';
import { AndroidCodeViewerModal } from './blockpuzzle/AndroidCodeViewerModal';
import { 
  Sparkles, 
  Swords, 
  Timer, 
  ShieldCheck, 
  Pause, 
  Play, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Zap, 
  Flame, 
  ArrowLeft,
  Clock,
  RotateCcw
} from 'lucide-react';

type ScreenState = 'lobby' | 'matchmaking' | 'countdown' | 'playing' | 'submit' | 'result' | 'tournament_rank';

export const BlockPuzzleDuel: React.FC = () => {
  const { 
    user, 
    setCurrentTab, 
    startBlockPuzzleMatch, 
    refundBlockPuzzleMatch,
    getActiveBlockPuzzleMatch,
    getMyBlockPuzzleMatches,
    getMyPendingGames,
    getBlockPuzzleMatchStatus,
    pauseBlockPuzzleMatch,
    resumeBlockPuzzleMatch,
    submitBlockPuzzleResult,
    resultSubmissions,
    paymentSettings

  } = useApp();

  // Screen State
  const [screenState, setScreenState] = useState<ScreenState>('lobby');
  const screenStateRef = useRef<ScreenState>('lobby');
  useEffect(() => { screenStateRef.current = screenState; }, [screenState]);
  const [gameMode, setGameMode] = useState<BlockGameMode>('duel');
  const [difficulty, setDifficulty] = useState<PracticeDifficulty>('normal');
  const [entryFee, setEntryFee] = useState<number>(20);
  const [prize, setPrize] = useState<number>(35);
  const [activeMatchId, setActiveMatchId] = useState<string>('');
  const [serverGameStartedAt, setServerGameStartedAt] = useState<string | null>(null);
  const [tournamentId, setTournamentId] = useState<string>('');
  const [tournamentData, setTournamentData] = useState<any | null>(null);
  const [tournamentLoading, setTournamentLoading] = useState(false);
  const [multiplayerProConfig, setMultiplayerProConfig] = useState<any | null>(null);

  // Prevent the initial active-match restore from racing with a brand-new Pro Match.
  // Without this guard, a slow boot request can finish after the user clicks Pro Match
  // and re-run initMatch(), which looks like the game randomly restarted.
  const freshProMatchRef = useRef<string>('');
  const initializedMatchRef = useRef<string>('');
  const countdownMatchRef = useRef<string>('');
  const startDuelInProgressRef = useRef<boolean>(false);
  const proStartPromiseRef = useRef<Promise<any> | null>(null);
  const proStartFailedRef = useRef<boolean>(false);
  const moveCountRef = useRef<number>(0);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist the live paid-match state so a React remount/tab restore cannot
  // rebuild the board from zero and later submit a zero score. This is a client
  // continuity layer only; the server remains authoritative for money/settlement.
  const LIVE_SNAPSHOT_PREFIX = 'skillz_block_puzzle_live_';
  const LIVE_SNAPSHOT_PENDING = 'skillz_block_puzzle_live_pending';
  const LIVE_SNAPSHOT_MAX_AGE_MS = TOTAL_MATCH_TIME * 1000 + 30000;

  const clearLiveSnapshot = useCallback((matchId?: string) => {
    try {
      sessionStorage.removeItem(LIVE_SNAPSHOT_PENDING);
      if (matchId) sessionStorage.removeItem(`${LIVE_SNAPSHOT_PREFIX}${String(matchId)}`);
    } catch {}
  }, []);

  const saveLiveSnapshot = useCallback((matchId: string, seed: number, state: any, currentBoard: number[][], currentPieces: (BlockShape | null)[], currentTrioIndex: number, currentRemainingTime: number) => {
    try {
      const payload = {
        version: 1,
        matchId: String(matchId || ''),
        seed: Number(seed) || Date.now(),
        savedAt: Date.now(),
        board: currentBoard,
        pieces: currentPieces,
        trioIndex: Number(currentTrioIndex || 0),
        remainingTime: Number(currentRemainingTime || 0),
        playerState: state,
      };
      const raw = JSON.stringify(payload);
      sessionStorage.setItem(`${LIVE_SNAPSHOT_PREFIX}${String(matchId || 'pending')}`, raw);
      sessionStorage.setItem(LIVE_SNAPSHOT_PENDING, raw);
    } catch {}
  }, []);


  // Modals
  const [showPendingModal, setShowPendingModal] = useState<boolean>(false);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showAndroidCode, setShowAndroidCode] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Audio / Haptic
  const [isMuted, setIsMuted] = useState<boolean>(blockAudio.isMuted);
  const [isHaptic, setIsHaptic] = useState<boolean>(blockAudio.isHapticEnabled);

  // Match Outcome and Opponent data
  const [isSubmittingScore, setIsSubmittingScore] = useState<boolean>(false);
  const [matchOutcome, setMatchOutcome] = useState<'WON' | 'LOST' | 'DRAW' | 'PENDING'>('WON');
  const [matchedOpponent, setMatchedOpponent] = useState<{ name: string; score: number; linesCleared?: number } | undefined>();
  const announcedWinMatchRef = useRef<string>('');
  const [liveConnected, setLiveConnected] = useState(false);
  const liveSocketRef = useRef<WebSocket | null>(null);
  const liveMoveIndexRef = useRef(0);
  const pendingLiveMovesRef = useRef<any[]>([]);

  // Career stats are derived from server-backed match history.
  // No demo values or persistent localStorage business stats are used.
  const [rating, setRating] = useState<number>(() => Number((user as any)?.rating) || 0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [practiceBestScore, setPracticeBestScore] = useState<number>(0);
  const [winStreak, setWinStreak] = useState<number>(0);
  const [matchesPlayed, setMatchesPlayed] = useState<number>(0);
  const [matchesWon, setMatchesWon] = useState<number>(0);
  const [matchesLost, setMatchesLost] = useState<number>(0);
  const [totalLines, setTotalLines] = useState<number>(0);

  // Block Puzzle sessions are authoritative on the server. Keep every session
  // separate so multiple pending/completed matches never overwrite each other.
  const [pendingMatches, setPendingMatches] = useState<PendingMatchItem[]>([]);

  const mapServerPendingGames = useCallback((items: any[]): PendingMatchItem[] => {
    return (items || []).map((m: any): PendingMatchItem => {
      const rawStatus = String(m.status || '').toUpperCase();
      const outcome = m.outcome === 'WON' ? 'WON' : m.outcome === 'LOST' ? 'LOST' : m.outcome === 'DRAW' ? 'DRAW' : 'PENDING';
      const isTournament = m.type === 'TOURNAMENT' || m.type === 'TOURNAMENT_MATCH' || m.gameType === 'block_puzzle_tournament';
      return {
        id: String(m.id), userId: String(user?.id || ''), userName: String(user?.name || ''),
        entryFee: Number(m.entryFee || 0), prize: Number(m.prizeAmount || 0), score: Number(m.score || 0),
        linesCleared: Number(m.linesCleared || 0), bestCombo: Number(m.bestCombo || 0),
        date: m.createdAt ? new Date(m.createdAt).toLocaleString('en-GB') : '',
        status: rawStatus === 'COMPLETED' ? outcome : isTournament ? 'TOURNAMENT' : 'PENDING',
        mode: isTournament ? `🏆 Tournament • ${m.title || ''}` : m.gameType === 'nut_sort' ? '🔩 Nut Sort 1v1' : m.type === 'ARCADE_MATCH' ? `🎮 ${m.title || 'Online Match'}` : m.type === 'MATCH' ? `🎯 ${m.title || 'Match'}` : '⚔️ Pro Match',
        opponentName: m.opponent?.name || undefined, opponentScore: m.opponent?.score ?? undefined,
      };
    });
  }, [user?.id, user?.name]);

  const refreshBlockPuzzleMatches = useCallback(async () => {
    const items = await getMyPendingGames();
    // Block Puzzle owns its own Pending/History section. Keep Nut Sort 1v1
    // records out of this screen while retaining legacy Block Puzzle and
    // Tournament records.
    const blockOnly = (items || []).filter((m: any) => {
      const gt = String(m.gameType || '').toLowerCase();
      return !gt || gt === 'block_puzzle' || gt === 'block_puzzle_tournament';
    });
    setPendingMatches(mapServerPendingGames(blockOnly));
  }, [getMyPendingGames, mapServerPendingGames]);

  useEffect(() => {
    refreshBlockPuzzleMatches();
    const timer = window.setInterval(refreshBlockPuzzleMatches, 5000);
    return () => window.clearInterval(timer);
  }, [refreshBlockPuzzleMatches]);

  // Home Quick Menu can open the shared completed-match History screen directly.
  useEffect(() => {
    if (sessionStorage.getItem('skillz_open_block_history') !== '1') return;
    sessionStorage.removeItem('skillz_open_block_history');
    let cancelled = false;
    (async () => {
      try { await refreshBlockPuzzleMatches(); } catch {}
      if (!cancelled) setShowHistory(true);
    })();
    return () => { cancelled = true; };
  }, [refreshBlockPuzzleMatches]);

  useEffect(() => {
    const completed = pendingMatches.filter((m: any) => m.status === 'WON' || m.status === 'LOST' || m.status === 'DRAW' || m.status === 'TOURNAMENT');
    const won = completed.filter((m: any) => m.status === 'WON');
    const lost = completed.filter((m: any) => m.status === 'LOST');
    const best = completed.reduce((n: number, m: any) => Math.max(n, Number(m.score || 0)), 0);
    const lines = completed.reduce((n: number, m: any) => n + Number(m.linesCleared || 0), 0);
    let streak = 0;
    for (const m of [...completed]) {
      if (m.status === 'WON') streak += 1;
      else break;
    }
    setMatchesPlayed(completed.length);
    setMatchesWon(won.length);
    setMatchesLost(lost.length);
    setBestScore(best);
    setTotalLines(lines);
    setWinStreak(streak);
    setPracticeBestScore(0);
  }, [pendingMatches]);

  useEffect(() => {
    if (screenState === 'result' && gameMode === 'duel' && matchOutcome === 'WON' && activeMatchId && announcedWinMatchRef.current !== activeMatchId) {
      announcedWinMatchRef.current = activeMatchId;
      blockAudio.playWin();
      blockAudio.triggerHaptic([40, 60, 80, 120]);
    }
  }, [screenState, gameMode, matchOutcome, activeMatchId]);

  const activePendingCount = pendingMatches.filter(m => m.status === 'PENDING').length;

  // Save after every meaningful gameplay state change. This is deliberately
  // sessionStorage (not the server) so it cannot interfere with score settlement.
  useEffect(() => {
    if (!['duel', 'tournament'].includes(gameMode) || screenState !== 'playing') return;
    const id = String(activeMatchId || 'pending');
    saveLiveSnapshot(id, matchSeed, playerState, board, pieces, trioIndex, remainingTime);
  }, [gameMode, screenState, activeMatchId, matchSeed, playerState, board, pieces, trioIndex, remainingTime, saveLiveSnapshot]);

  useEffect(() => {
    let alive = true;
    try { const raw = sessionStorage.getItem('skillz_multiplayer_pro_config'); if (raw) setMultiplayerProConfig(JSON.parse(raw)); } catch {}
    const boot = async () => {
      // Never let the initial restore request rehydrate an old match while a
      // new Pro Match is being created. This request can be slow on mobile/
      // serverless deployments and used to restart the board a few seconds
      // after a fresh match began.
      if (startDuelInProgressRef.current) return;
      const storedTournamentId = sessionStorage.getItem('skillz_tournament_id') || '';
      const storedMatchId = sessionStorage.getItem('skillz_tournament_match_id') || '';
      if (storedTournamentId && storedMatchId) {
        const match = await getBlockPuzzleMatchStatus(storedMatchId);
        if (!alive) return;
        if (match?.tournamentId === storedTournamentId) {
          setTournamentId(storedTournamentId);
          setGameMode('tournament');
          setActiveMatchId(String(match.id));
          setEntryFee(Number(match.entryFee || 0));
          setPrize(0);
          setServerGameStartedAt(match.gameStartedAt || match.startsAt || null);
          setMatchSeed(Number(match.gameSeed) || Date.now());
          if (match.status === 'PLAYING') initMatch('tournament', difficulty, match.gameStartedAt || match.startsAt || undefined, Number(match.gameSeed) || null);
          else if (match.status === 'COMPLETED' || match.status === 'SUBMITTED') await openTournamentRankList(storedTournamentId);
          return;
        }
      }
      const match = await getActiveBlockPuzzleMatch();
      if (!alive || !match) return;
      // If the user has already started a fresh Pro Match while boot was waiting,
      // never restore the older active-match response over the new game.
      if (freshProMatchRef.current && String(match.id) !== freshProMatchRef.current) return;
      if (freshProMatchRef.current && String(match.id) === freshProMatchRef.current) return;
      setActiveMatchId(String(match.id));
      setGameMode(match.tournamentId ? 'tournament' : 'duel');
      setEntryFee(Number(match.entryFee || 0));
      setPrize(Number(match.prizeAmount || 0));
      setServerGameStartedAt(match.gameStartedAt || match.startsAt || null);
      if (match.tournamentId) {
        setTournamentId(String(match.tournamentId));
        sessionStorage.setItem('skillz_tournament_id', String(match.tournamentId));
        sessionStorage.setItem('skillz_tournament_match_id', String(match.id));
        if (match.status === 'PLAYING') initMatch('tournament', difficulty, match.gameStartedAt || match.startsAt || undefined, Number(match.gameSeed) || null);
        else if (match.status === 'COMPLETED' || match.status === 'SUBMITTED') await openTournamentRankList(String(match.tournamentId));
      } else if (match.status === 'PLAYING' || match.status === 'MATCHED') {
        // Resume only a genuinely active Pro Match. If the old session already
        // passed its 3-minute deadline, do not rehydrate it: the server will
        // finalize that stale session on the next write, while this screen must
        // remain a clean entry-fee lobby. This prevents an old 0-point match
        // from auto-submitting the moment the user opens Pro Match.
        const startAt = match.gameStartedAt || match.startsAt || '';
        const startMs = Date.parse(startAt);
        const expired = Number.isFinite(startMs) && startMs + TOTAL_MATCH_TIME * 1000 <= Date.now();
        if (expired) {
          clearLiveSnapshot(String(match.id));
          setActiveMatchId('');
          setMatchedOpponent(undefined);
          setMatchOutcome('PENDING');
          setScreenState('lobby');
          return;
        }
        const matchId = String(match.id);
        let restored = false;
        try {
          const raw = sessionStorage.getItem(`${LIVE_SNAPSHOT_PREFIX}${matchId}`) || sessionStorage.getItem(LIVE_SNAPSHOT_PENDING);
          const snap = raw ? JSON.parse(raw) : null;
          const age = snap?.savedAt ? Date.now() - Number(snap.savedAt) : Infinity;
          const snapBoardOk = Array.isArray(snap?.board) && snap.board.length === BOARD_SIZE;
          const snapPiecesOk = Array.isArray(snap?.pieces) && snap.pieces.length === 3;
          if (snap && age >= 0 && age <= LIVE_SNAPSHOT_MAX_AGE_MS && snapBoardOk && snapPiecesOk) {
            initializedMatchRef.current = matchId;
            setMatchSeed(Number(snap.seed) || Number(match.gameSeed) || Date.now());
            setTrioIndex(Number(snap.trioIndex || 0));
            setBoard(snap.board);
            setPieces(snap.pieces);
            setSelectedPieceIndex(null);
            setClearingRows([]);
            setClearingCols([]);
            setHoveredCell(null);
            setDragPointer(null);
            setIsOutOfMoves(false);
            setIsPaused(Boolean(match.paused));
            const liveStartMs = Date.parse(startAt);
            const remaining = Number.isFinite(liveStartMs)
              ? Math.max(0, Math.ceil((liveStartMs + TOTAL_MATCH_TIME * 1000 - Date.now()) / 1000))
              : Number(snap.remainingTime || TOTAL_MATCH_TIME);
            setRemainingTime(remaining);
            setPlayerState({ ...(snap.playerState || {}), playerId: user?.id || snap.playerState?.playerId || 'player_1', name: user?.name || snap.playerState?.name || 'Player', remainingTime: remaining, connected: true, ready: true });
            setScreenState('playing');
            restored = true;
          }
        } catch {}
        if (!restored) initMatch('duel', difficulty, startAt || undefined, Number(match.gameSeed) || null);
        if (match.opponent) setMatchedOpponent({ name: match.opponent.name, score: Number(match.opponent.score || 0), linesCleared: Number(match.opponent.linesCleared || 0) });
      } else {
        // Submitted/completed/refunded history belongs in Pending & History.
        // Opening the Pro Match tab must always show the entry-fee lobby instead
        // of auto-opening an old 0-point result.
        setActiveMatchId('');
        setMatchedOpponent(undefined);
        setMatchOutcome('PENDING');
        setScreenState('lobby');
      }
    };
    boot();
    return () => { alive = false; };
  }, []);

  // Server-side matchmaking: the client only waits/polls. When two players are paired
  // the server marks the same duel and both clients automatically enter the countdown.
  useEffect(() => {
    if (gameMode !== 'duel' || !activeMatchId || !['matchmaking','playing','submit','result'].includes(screenState)) return;
    let alive = true;
    let busy = false;
    const poll = async () => {
      if (!alive || busy) return;
      busy = true;
      const match = await getBlockPuzzleMatchStatus(activeMatchId);
      busy = false;
      if (!alive || !match) return;
      setEntryFee(Number(match.entryFee || entryFee));
      setPrize(Number(match.prizeAmount || prize));
      if (match.opponent) setMatchedOpponent({ name: match.opponent.name, score: Number(match.opponent.score || 0), linesCleared: Number(match.opponent.linesCleared || 0) });
      if (match.gameStartedAt || match.startsAt) setServerGameStartedAt(match.gameStartedAt || match.startsAt || null);
      if (Number.isFinite(Number(match.gameSeed))) setMatchSeed(Number(match.gameSeed));
      if ((match.status === 'PLAYING' || match.status === 'MATCHED') && (screenState === 'matchmaking' || screenState === 'countdown')) {
        const isFreshLocalMatch = freshProMatchRef.current === String(match.id) && initializedMatchRef.current === String(match.id);
        if (!isFreshLocalMatch && countdownMatchRef.current !== String(match.id)) {
          countdownMatchRef.current = String(match.id);
          startCountdown('duel', match.gameStartedAt || match.startsAt || undefined, Number(match.gameSeed) || null);
        }
      } else if (match.status === 'COMPLETED' && match.outcome) {
        setMatchOutcome(match.outcome);
        setIsSubmittingScore(false);
        setScreenState('result');
      } else if (match.status === 'REFUNDED') {
        setMatchOutcome('DRAW');
        setIsSubmittingScore(false);
        setScreenState('result');
      }
    };
    poll();
    const timer = window.setInterval(poll, 1500);
    return () => { alive = false; window.clearInterval(timer); };
  }, [gameMode, activeMatchId, screenState, getBlockPuzzleMatchStatus]);


  // Active Match State (10x10 Board)
  const [matchSeed, setMatchSeed] = useState<number>(Date.now());
  const [trioIndex, setTrioIndex] = useState<number>(0);
  const [board, setBoard] = useState<number[][]>(createEmptyBoard);
  const [pieces, setPieces] = useState<(BlockShape | null)[]>([]);
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null);
  
  // Placement preview & drag handling
  const gridRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);
  const [clearingRows, setClearingRows] = useState<number[]>([]);
  const [clearingCols, setClearingCols] = useState<number[]>([]);
  const [floatingScores, setFloatingScores] = useState<FloatingScoreItem[]>([]);
  const [bannerAlert, setBannerAlert] = useState<{ text: string; subText?: string; type: 'info' | 'bolt' | 'fire' | 'warning' } | null>(null);
  const [isOutOfMoves, setIsOutOfMoves] = useState<boolean>(false);

  // Drag floating piece coordinate state
  const [dragPointer, setDragPointer] = useState<{ x: number; y: number } | null>(null);
  const dragRafRef = useRef<number | null>(null);
  const dragLatestRef = useRef<{ x: number; y: number } | null>(null);

  // Timer & Countdown (180s = 3:00 Minutes like Skillz Block Blitz in Video)
  const TOTAL_MATCH_TIME = 180;
  const [countdown, setCountdown] = useState<number>(3);
  const [remainingTime, setRemainingTime] = useState<number>(TOTAL_MATCH_TIME);

  // Player State
  const [playerState, setPlayerState] = useState<BlockPlayerState>({
    playerId: user?.id || 'player_1',
    name: user?.name || 'Player 70lol70',
    avatar: '😎',
    ready: true,
    connected: true,
    score: 0,
    linesCleared: 0,
    combo: 0,
    bestCombo: 0,
    streak: 0,
    boardState: createEmptyBoard(),
    remainingTime: TOTAL_MATCH_TIME,
    lastActionTimestamp: Date.now(),
  });

  const matchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Toggle Mute / Haptic
  const handleToggleMute = () => {
    const val = blockAudio.toggleMute();
    setIsMuted(val);
  };

  const handleToggleHaptic = () => {
    const val = blockAudio.toggleHaptic();
    setIsHaptic(val);
  };

  // Trigger floating text
  const triggerFloatingScore = (text: string, x: number, y: number, color?: string, banner?: 'POWER_BOLT' | 'FIRE_STREAK' | null) => {
    const id = `fs_${Date.now()}_${Math.random()}`;
    setFloatingScores((prev) => [...prev, { id, text, x, y, color, banner }]);
    setTimeout(() => {
      setFloatingScores((prev) => prev.filter((item) => item.id !== id));
    }, 1200);
  };

  // Show center arcade banner
  const triggerBanner = (text: string, subText?: string, type: 'info' | 'bolt' | 'fire' | 'warning' = 'info', duration: number = 1600) => {
    setBannerAlert({ text, subText, type });
    setTimeout(() => {
      setBannerAlert(null);
    }, duration);
  };

  // Real-time duel transport. HTTP remains the source of truth for matchmaking and settlement;
  // WebSocket carries low-latency board/move state between the two players.
  useEffect(() => {
    if (gameMode !== 'duel' || !activeMatchId || !matchedOpponent || !user?.id || screenState !== 'playing') return;
    const token = localStorage.getItem('skillz_api_token') || '';
    if (!token) return;

    const configured = (import.meta.env.VITE_LIVE_WS_URL || '').replace(/\/+$/, '').replace(/\/live$/, '');
    const base = configured || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
    let stopped = false;
    let reconnectTimer: number | null = null;
    let ws: WebSocket | null = null;

    const connect = () => {
      if (stopped) return;
      const socket = new WebSocket(`${base}/live?matchId=${encodeURIComponent(activeMatchId)}&token=${encodeURIComponent(token)}`);
      ws = socket;
      liveSocketRef.current = socket;

      socket.onopen = () => {
        if (stopped) return;
        setLiveConnected(true);
        const queued = pendingLiveMovesRef.current.splice(0);
        queued.forEach(move => socket.send(JSON.stringify(move)));
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'STATE') {
            // V56: live opponent score/board is intentionally never exposed to the client.
            // The socket remains available for authoritative move transport only.
            if (msg.self) liveMoveIndexRef.current = Number(msg.self.moveIndex || 0);
          } else if (msg.type === 'MOVE_ACCEPTED' && msg.userId !== user.id) {
            // Do not read or render opponent score/board from live transport.
          }
        } catch {}
      };

      socket.onclose = () => {
        setLiveConnected(false);
        if (liveSocketRef.current === socket) liveSocketRef.current = null;
        if (!stopped) reconnectTimer = window.setTimeout(connect, 1500);
      };
      socket.onerror = () => setLiveConnected(false);
    };

    connect();
    return () => {
      stopped = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      try { ws?.close(); } catch {}
      if (liveSocketRef.current === ws) liveSocketRef.current = null;
      setLiveConnected(false);
    };
  }, [gameMode, activeMatchId, matchedOpponent?.name, screenState, user?.id]);

  const sendLiveMove = (matrix: number[][], row: number, col: number) => {
    const move = { type: 'MOVE', moveIndex: liveMoveIndexRef.current, matrix, row, col };
    liveMoveIndexRef.current += 1;
    const ws = liveSocketRef.current;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(move));
    else pendingLiveMovesRef.current.push(move);
  };

  const openTournamentRankList = async (id: string) => {
    setTournamentLoading(true);
    try {
      const data = await (await import('../services/backendApi')).backendApi.tournament(id);
      setTournamentData(data.tournament || null);
      setTournamentId(id);
      setGameMode('tournament');
      setScreenState('tournament_rank');
    } catch (e:any) { alert(e?.message || 'Tournament Rank List লোড করা যায়নি।'); }
    finally { setTournamentLoading(false); }
  };

  const handleTournamentPlayAgain = async () => {
    if (!tournamentId) return;
    setTournamentLoading(true);
    try {
      const data = await (await import('../services/backendApi')).backendApi.joinTournament(tournamentId);
      const match = data.match;
      sessionStorage.setItem('skillz_tournament_match_id', String(match?.id || ''));
      sessionStorage.setItem('skillz_tournament_id', String(tournamentId));
      setTournamentData(data.tournament || tournamentData);
      setActiveMatchId(String(match?.id || ''));
      setEntryFee(Number(match?.entryFee || tournamentData?.entryFee || 0));
      setPrize(0);
      setServerGameStartedAt(match?.gameStartedAt || match?.startsAt || null);
      setMatchSeed(Number(match?.gameSeed) || Date.now());
      setGameMode('tournament');
      initMatch('tournament', difficulty, match?.gameStartedAt || match?.startsAt || undefined, Number(match?.gameSeed) || null);
    } catch(e:any) { alert(e?.message || 'Tournament আবার শুরু করা যায়নি।'); }
    finally { setTournamentLoading(false); }
  };

  // Start Entry Fee Duel Match
  // The paid-game board opens immediately. The secure server start (entry-fee
  // validation, balance debit, match creation and matchmaking) runs in parallel.
  // If the server is slower than the player, final submission waits only for that
  // already-running request; it never starts a second paid match.
  const handleStartDuel = (fee: number, winPrize: number) => {
    blockAudio.playClick();
    startDuelInProgressRef.current = true;
    proStartFailedRef.current = false;
    moveCountRef.current = 0;
    setEntryFee(fee);
    setPrize(winPrize);
    setGameMode('duel');
    setMatchedOpponent(undefined);
    setServerGameStartedAt(null);
    setActiveMatchId('');
    setMatchOutcome('PENDING');
    setIsSubmittingScore(false);
    setScreenState('lobby');

    // Start rendering the real 3-minute board immediately, without waiting for
    // MongoDB/network. The provisional seed is sent to the server so a fresh
    // match keeps the same deterministic board seed.
    const localSeed = Math.floor(Math.random() * 2147483646) + 1;
    try { sessionStorage.setItem(LIVE_SNAPSHOT_PENDING, JSON.stringify({ version: 1, matchId: '', seed: localSeed, savedAt: Date.now() })); } catch {}
    setMatchSeed(localSeed);
    initMatch('duel', difficulty, undefined, localSeed);

    const cfg = multiplayerProConfig;
    const startPromise = startBlockPuzzleMatch(
      cfg ? Number(cfg.entryFee) : fee,
      cfg ? Number(cfg.prizeAmount) : winPrize,
      cfg ? Number(cfg.players) : 2,
      'block_puzzle',
      localSeed
    );
    proStartPromiseRef.current = startPromise;

    void startPromise.then((res: any) => {
      startDuelInProgressRef.current = false;
      if (!res?.success) {
        proStartFailedRef.current = true;
        if (screenStateRef.current === 'playing' || screenStateRef.current === 'submit') {
          clearLiveSnapshot();
          alert(res?.message || 'ম্যাচ শুরু করা যায়নি।');
          setScreenState('lobby');
        }
        return;
      }
      const createdMatch = res.match || {};
      const createdMatchId = String(createdMatch?.id || res.matchId || '');
      if (!createdMatchId) {
        proStartFailedRef.current = true;
        clearLiveSnapshot();
        alert('ম্যাচ আইডি পাওয়া যায়নি।');
        setScreenState('lobby');
        return;
      }
      setActiveMatchId(createdMatchId);
      try {
        const pending = sessionStorage.getItem(LIVE_SNAPSHOT_PENDING);
        if (pending) sessionStorage.setItem(`${LIVE_SNAPSHOT_PREFIX}${createdMatchId}`, pending);
      } catch {}
      refreshBlockPuzzleMatches().catch(() => {});
      const createdStart = createdMatch?.gameStartedAt || createdMatch?.startsAt || res.gameStartedAt || res.startsAt || null;
      setServerGameStartedAt(createdStart);
      if (createdMatch?.opponent) setMatchedOpponent({ name: createdMatch.opponent.name, score: Number(createdMatch.opponent.score || 0), linesCleared: Number(createdMatch.opponent.linesCleared || 0) });
      const serverSeed = Number(createdMatch?.gameSeed ?? res.gameSeed);
      if (Number.isFinite(serverSeed) && serverSeed > 0 && serverSeed !== localSeed && moveCountRef.current === 0) {
        // This only happens when the new player was paired with an older open
        // match. Re-sync the untouched board to the shared server seed.
        setMatchSeed(serverSeed);
        setBoard(createEmptyBoard());
        setTrioIndex(0);
        setPieces(generateBlockTrio(serverSeed, 0, difficulty, false));
        setPlayerState(prev => ({ ...prev, boardState: createEmptyBoard(), score: 0, linesCleared: 0, combo: 0, bestCombo: 0, streak: 0 }));
      }
    }).catch((e: any) => {
      startDuelInProgressRef.current = false;
      proStartFailedRef.current = true;
      if (screenStateRef.current === 'playing' || screenStateRef.current === 'submit') {
        clearLiveSnapshot();
        alert(e?.message || 'ম্যাচ শুরু করা যায়নি।');
        setScreenState('lobby');
      }
    });
  };

  // Start Practice Mode (Free)
  const handleStartPractice = (diff: PracticeDifficulty) => {
    blockAudio.playClick();
    setGameMode('practice');
    setDifficulty(diff);
    setEntryFee(0);
    setPrize(0);
    startCountdown('practice');
  };

  // 3-second Countdown before match
  const startCountdown = (mode: BlockGameMode, serverStartAt?: string, serverSeed?: number | null) => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    const startMs = serverStartAt ? Date.parse(serverStartAt) : NaN;
    const secondsUntilStart = Number.isFinite(startMs) ? Math.max(0, Math.ceil((startMs - Date.now()) / 1000)) : 3;
    if (secondsUntilStart <= 0) {
      initMatch(mode, difficulty, serverStartAt, serverSeed);
      return;
    }
    setScreenState('countdown');
    setCountdown(secondsUntilStart);

    let count = secondsUntilStart;
    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      blockAudio.playClick();

      if (count <= 0) {
        clearInterval(interval);
        if (countdownIntervalRef.current === interval) countdownIntervalRef.current = null;
        initMatch(mode, difficulty, serverStartAt, serverSeed);
      }
    }, 1000);
    countdownIntervalRef.current = interval;
  };

  // Initialize 10x10 Match
  const initMatch = (mode: BlockGameMode, diff: PracticeDifficulty = 'normal', serverStartAt?: string, serverSeed?: number | null) => {
    // V56: a paid match is initialized at most once for the same server match id.
    // This prevents slow restore/poll responses from rebuilding the board mid-match.
    if ((mode === 'duel' || mode === 'tournament') && activeMatchId && initializedMatchRef.current === String(activeMatchId) && screenStateRef.current === 'playing') {
      return;
    }
    // Paid duels use the server's shared seed; practice remains locally random.
    if ((mode === 'duel' || mode === 'tournament') && activeMatchId) {
      initializedMatchRef.current = String(activeMatchId);
    }
    const seed = (mode === 'duel' || mode === 'tournament') && Number.isFinite(Number(serverSeed)) ? Number(serverSeed) : Date.now();
    setMatchSeed(seed);
    setTrioIndex(0);
    setBoard(createEmptyBoard());
    setClearingRows([]);
    setClearingCols([]);
    setSelectedPieceIndex(null);
    setHoveredCell(null);
    setDragPointer(null);
    setIsOutOfMoves(false);
    setIsPaused(false);
    // For a fresh client game always start from the full 3-minute local clock.
    // Rehydrated/tournament matches may still use their server start timestamp.
    const startMs = serverStartAt ? Date.parse(serverStartAt) : Date.now();
    const initialRemaining = mode === 'duel' && !serverStartAt
      ? TOTAL_MATCH_TIME
      : ((mode === 'duel' || mode === 'tournament') && Number.isFinite(startMs)
        ? Math.max(0, Math.ceil((startMs + TOTAL_MATCH_TIME * 1000 - Date.now()) / 1000))
        : TOTAL_MATCH_TIME);
    setRemainingTime(initialRemaining);
    // Keep an already matched opponent visible when a paired match starts.
    liveMoveIndexRef.current = 0;
    pendingLiveMovesRef.current = [];

    const initialPieces = generateBlockTrio(seed, 0, diff, false);
    setPieces(initialPieces);

    setPlayerState({
      playerId: user?.id || 'player_1',
      name: user?.name || 'Player 70lol70',
      avatar: '😎',
      ready: true,
      connected: true,
      score: 0,
      linesCleared: 0,
      combo: 0,
      bestCombo: 0,
      streak: 0,
      boardState: createEmptyBoard(),
      remainingTime: initialRemaining,
      lastActionTimestamp: Date.now(),
    });

    setScreenState('playing');

    // Video 00:02: Display "3 MINUTES LEFT" banner at game start
    setTimeout(() => {
      triggerBanner('3 MINUTES LEFT', 'Fill rows & columns to score!', 'info', 1800);
    }, 400);
  };

  // Main Match Timer (180s = 3:00 Minutes)
  useEffect(() => {
    if (screenState !== 'playing' || isPaused) {
      if (matchTimerRef.current) clearInterval(matchTimerRef.current);
      return;
    }

    matchTimerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        const next = prev - 1;

        // Periodic minute announcements (Video 00:02)
        if (next === 120) {
          triggerBanner('2 MINUTES LEFT', undefined, 'info', 1500);
        } else if (next === 60) {
          triggerBanner('1 MINUTE LEFT', 'Hurry up!', 'warning', 1500);
        } else if (next === 30) {
          triggerBanner('30 SECONDS LEFT', undefined, 'warning', 1500);
        }

        if (next <= 0) {
          if (matchTimerRef.current) clearInterval(matchTimerRef.current);
          handleTimeUp();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (matchTimerRef.current) clearInterval(matchTimerRef.current);
    };
  }, [screenState, isPaused]);

  // When Time is up or no moves remain
  const handleTimeUp = useCallback(() => {
    if (matchTimerRef.current) clearInterval(matchTimerRef.current);
    blockAudio.playClick();

    if (gameMode === 'practice') {
      // In practice, show result directly
      const newPracticeBest = Math.max(practiceBestScore, playerState.score);
      setPracticeBestScore(newPracticeBest);
      try {
      } catch {}
      setScreenState('result');
    } else {
      // Paid duel: submit automatically to the server so settlement can be immediate.
      setScreenState('submit');
    }
  }, [gameMode, playerState.score, practiceBestScore]);

  // Submit score: the server owns the match/session. No local cross-account matchmaking.
  const handleSubmitScore = async () => {
    if (isSubmittingScore) return;
    setIsSubmittingScore(true);

    // If the player finished while the paid-start request was still in flight,
    // wait for that same request and use its returned match id. Never create a
    // second match just because the first response was slow.
    let submitMatchId = activeMatchId;
    if (!submitMatchId && proStartPromiseRef.current) {
      try {
        const started: any = await proStartPromiseRef.current;
        submitMatchId = String(started?.match?.id || started?.matchId || '');
        if (submitMatchId) setActiveMatchId(submitMatchId);
      } catch {}
    }
    if (!submitMatchId) {
      setIsSubmittingScore(false);
      if (proStartFailedRef.current) { alert('ম্যাচটি সার্ভারে তৈরি হয়নি।'); setScreenState('lobby'); }
      return;
    }

    const serverSubmit = await submitBlockPuzzleResult(submitMatchId, playerState.score, prize);
    setIsSubmittingScore(false);
    if (!serverSubmit.success) {
      alert(serverSubmit.message);
      return;
    }

    const settled = serverSubmit.match;
    clearLiveSnapshot(submitMatchId);
    // Refresh the server-backed pending/history list immediately after submit.
    // The game result remains visible without waiting for the 5-second poll.
    void refreshBlockPuzzleMatches();
    if (gameMode === 'tournament' || settled?.tournamentId) {
      const id = String(settled?.tournamentId || tournamentId || sessionStorage.getItem('skillz_tournament_id') || '');
      if (id) {
        sessionStorage.setItem('skillz_tournament_id', id);
        sessionStorage.setItem('skillz_tournament_match_id', String(settled?.id || activeMatchId));
        await openTournamentRankList(id);
      } else {
        alert('Tournament ID পাওয়া যায়নি।');
        setScreenState('lobby');
      }
      return;
    }
    if (settled?.status === 'COMPLETED' && settled.outcome) {
      setMatchOutcome(settled.outcome);
      if (settled.opponent) setMatchedOpponent({ name: settled.opponent.name, score: Number(settled.opponent.score || 0), linesCleared: Number(settled.opponent.linesCleared || 0) });
      setScreenState('result');
    } else {
      // Never show an opponent's in-progress/pending score. Final opponent score
      // is only populated after the server has completed the duel.
      setMatchedOpponent(undefined);
      setMatchOutcome('PENDING');
      setScreenState('result');
    }

    try {
    } catch {}
  };

  // Paid matches submit automatically when the 3-minute timer ends.
  useEffect(() => {
    if (screenState === 'submit' && gameMode === 'duel' && !isSubmittingScore) {
      handleSubmitScore();
    }
  }, [screenState, gameMode, activeMatchId, isSubmittingScore]);

  // Drag-and-drop only: a piece must be pressed and physically dragged to the board.
  // We use Pointer Events + pointer capture so Android touch dragging cannot lose the
  // first move between React renders (the old window-listener approach could do that).
  const dragSessionRef = useRef<{ index: number; pointerId: number; grabX: number; grabY: number } | null>(null);
  const hoveredCellRef = useRef<{ r: number; c: number } | null>(null);

  const updateDragFromPointer = (index: number, clientX: number, clientY: number) => {
    const piece = pieces[index];
    if (!piece || !gridRef.current) return;

    // The lifted block is visually centered about 75px above the finger.
    // Placement is calculated from that SAME visual center, not from the finger,
    // so the block lands exactly where the player sees it.
    const ghostX = clientX;
    const ghostY = clientY - 75;
    setDragPointer({ x: ghostX, y: ghostY });

    const rect = gridRef.current.getBoundingClientRect();
    const firstCell = gridRef.current.querySelector<HTMLElement>('[data-row="0"][data-col="0"]');
    const secondCell = gridRef.current.querySelector<HTMLElement>('[data-row="0"][data-col="1"]');
    const rowOneCell = gridRef.current.querySelector<HTMLElement>('[data-row="1"][data-col="0"]');
    const firstRect = firstCell?.getBoundingClientRect();
    const secondRect = secondCell?.getBoundingClientRect();
    const rowOneRect = rowOneCell?.getBoundingClientRect();

    // Match the proven test-file placement math exactly: use REAL cell centers
    // and REAL grid pitch (including CSS gap/padding). This prevents the block
    // from drifting left/right or up/down on release.
    const cellW = firstRect?.width || rect.width / BOARD_SIZE;
    const cellH = firstRect?.height || rect.height / BOARD_SIZE;
    const pitchX = secondRect && firstRect ? secondRect.left - firstRect.left : cellW;
    const pitchY = rowOneRect && firstRect ? rowOneRect.top - firstRect.top : cellH;
    const firstCenterX = firstRect ? firstRect.left + firstRect.width / 2 : rect.left + cellW / 2;
    const firstCenterY = firstRect ? firstRect.top + firstRect.height / 2 : rect.top + cellH / 2;

    const blockH = piece.matrix.length;
    const blockW = piece.matrix[0]?.length || 1;
    const centerOffsetX = (ghostX - firstCenterX) / pitchX;
    const centerOffsetY = (ghostY - firstCenterY) / pitchY;
    const startCol = Math.round(centerOffsetX - (blockW - 1) / 2);
    const startRow = Math.round(centerOffsetY - (blockH - 1) / 2);

    const next = { r: startRow, c: startCol };
    hoveredCellRef.current = next;
    setHoveredCell(next);
  };

  const handlePiecePointerDown = (index: number, e: React.PointerEvent<HTMLDivElement>) => {
    const piece = pieces[index];
    if (!piece || screenState !== 'playing') return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const grabX = e.clientX - rect.left;
    const grabY = e.clientY - rect.top;
    dragSessionRef.current = { index, pointerId: e.pointerId, grabX, grabY };
    hoveredCellRef.current = null;
    setSelectedPieceIndex(index);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    updateDragFromPointer(index, e.clientX, e.clientY);
  };

  const handlePiecePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== e.pointerId) return;
    e.preventDefault();

    dragLatestRef.current = { x: e.clientX, y: e.clientY };
    if (dragRafRef.current === null) {
      dragRafRef.current = window.requestAnimationFrame(() => {
        dragRafRef.current = null;
        const latest = dragLatestRef.current;
        const current = dragSessionRef.current;
        if (latest && current) updateDragFromPointer(current.index, latest.x, latest.y);
      });
    }
  };

  const finishPieceDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== e.pointerId) return;
    e.preventDefault();

    if (dragRafRef.current !== null) {
      window.cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
    if (dragLatestRef.current) {
      updateDragFromPointer(session.index, dragLatestRef.current.x, dragLatestRef.current.y);
    } else {
      updateDragFromPointer(session.index, e.clientX, e.clientY);
    }

    const drop = hoveredCellRef.current;
    const piece = pieces[session.index];
    if (drop && piece && canPlaceBlock(board, piece.matrix, drop.r, drop.c)) {
      handleCellClick(drop.r, drop.c, session.index);
    } else {
      blockAudio.triggerHaptic(25);
    }

    try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch {}
    dragSessionRef.current = null;
    dragLatestRef.current = null;
    hoveredCellRef.current = null;
    setDragPointer(null);
    setHoveredCell(null);
  };

  const handlePiecePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== e.pointerId) return;
    dragSessionRef.current = null;
    dragLatestRef.current = null;
    hoveredCellRef.current = null;
    setDragPointer(null);
    setHoveredCell(null);
  };

  // Preview placement computation
  const activePiece = selectedPieceIndex !== null ? pieces[selectedPieceIndex] : null;
  const previewPlacement = null;

  // Placement is called only by a completed drag. Board taps never place pieces.
  const handleCellClick = (r: number, c: number, pieceIndex: number | null = selectedPieceIndex) => {
    if (pieceIndex === null) return;
    const pieceToPlace = pieces[pieceIndex];
    if (!pieceToPlace) return;

    const placeR = r;
    const placeC = c;

    // Exact placement only: never move a player's drop to another cell.
    if (placeR < 0 || placeC < 0 ||
        placeR + pieceToPlace.matrix.length > BOARD_SIZE ||
        placeC + pieceToPlace.matrix[0].length > BOARD_SIZE ||
        !canPlaceBlock(board, pieceToPlace.matrix, placeR, placeC)) {
      blockAudio.triggerHaptic(25);
      return;
    }

    // Place block on board (using color code)
    moveCountRef.current += 1;
    blockAudio.playPlace();
    const styleVal = ((pieceIndex + 1) % 6) + 1;
    const placedBoard = placeBlockOnBoard(board, pieceToPlace.matrix, placeR, placeC, styleVal);
    
    // Check line clears
    const { newBoard, clearedRows, clearedCols, totalLinesCleared } = checkAndClearLines(placedBoard);

    // Calculate score
    const tileCount = getTileCount(pieceToPlace.matrix);
    const { pointsEarned, newCombo, newStreak, bannerType } = calculateMoveScore(
      totalLinesCleared,
      tileCount,
      playerState.combo,
      playerState.streak
    );

    // Visual score popup at placement location
    if (gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      const cellW = rect.width / BOARD_SIZE;
      const cellH = rect.height / BOARD_SIZE;
      const popupX = placeC * cellW + cellW / 2;
      const popupY = placeR * cellH + cellH / 2;
      
      triggerFloatingScore(`+${pointsEarned}`, popupX, popupY, totalLinesCleared > 0 ? '#38bdf8' : '#fde047', bannerType);
    }

    if (totalLinesCleared > 0) {
      setClearingRows(clearedRows);
      setClearingCols(clearedCols);
      blockAudio.playLineClear(playerState.combo + 1);

      if (bannerType === 'POWER_BOLT') {
        blockAudio.playLightning();
        triggerBanner('POWER BOLT', '+200 PTS', 'bolt', 1400);
      } else if (bannerType === 'FIRE_STREAK') {
        blockAudio.playWin();
        triggerBanner('FIRE STREAK', `+${pointsEarned} PTS BONUS`, 'fire', 1600);
      }

      setTimeout(() => {
        setClearingRows([]);
        setClearingCols([]);
        setBoard(newBoard);
      }, 200);
    } else {
      setBoard(placedBoard);
    }

    if (gameMode === 'duel' && activeMatchId) {
      sendLiveMove(pieceToPlace.matrix.map(row => [...row]), placeR, placeC);
    }
    consumePiece(pieceIndex, pointsEarned, totalLinesCleared, newCombo, newStreak, totalLinesCleared > 0 ? newBoard : placedBoard);
  };

  // Consume used piece & check if tray is empty
  const consumePiece = (
    pieceIdx: number, 
    pts: number, 
    linesCount: number, 
    newCombo: number = 0, 
    newStreak: number = 0, 
    currentBoard: number[][] = board
  ) => {
    const updatedPieces = [...pieces];
    updatedPieces[pieceIdx] = null;
    setSelectedPieceIndex(null);
    setPieces(updatedPieces);

    // Update Player State
    setPlayerState((prev) => {
      const newScore = prev.score + pts;
      const newLines = prev.linesCleared + linesCount;
      const newBestCombo = Math.max(prev.bestCombo, newCombo);

      return {
        ...prev,
        score: newScore,
        linesCleared: newLines,
        combo: newCombo,
        bestCombo: newBestCombo,
        streak: newStreak,
        lastActionTimestamp: Date.now(),
      };
    });

    // If all 3 pieces are consumed, generate next trio
    const allConsumed = updatedPieces.every((p) => p === null);
    let nextPieces = updatedPieces;

    if (allConsumed) {
      const nextTrioIdx = trioIndex + 1;
      setTrioIndex(nextTrioIdx);
      nextPieces = generateBlockTrio(matchSeed, nextTrioIdx, difficulty, false);
      setPieces(nextPieces);
    }

    // Check if any legal move remains on 10x10 board
    const hasMove = hasAnyLegalMove(currentBoard, nextPieces);
    if (!hasMove) {
      setIsOutOfMoves(true);
      triggerBanner('YOU ARE OUT OF MOVES', 'No shapes fit on board', 'warning', 2000);
      blockAudio.triggerHaptic([40, 50, 60]);

      setTimeout(() => {
        handleTimeUp();
      }, 1600);
    }
  };

  // Can place map for tray feedback
  const canPlaceMap = pieces.map((p) => {
    if (!p) return false;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (canPlaceBlock(board, p.matrix, r, c)) return true;
      }
    }
    return false;
  });

  const isPlayingScreen = screenState === 'playing';

  return (
    <div className={`${isPlayingScreen ? 'block-gameplay-locked' : 'min-h-screen pb-24'} bg-[#070b18] text-white flex flex-col justify-between max-w-md mx-auto relative select-none`}>
      {screenState === 'tournament_rank' && (
        <BlockTournamentRankList
          tournament={tournamentData}
          currentUserId={user?.id}
          loading={tournamentLoading}
          onBackHome={() => { sessionStorage.removeItem('skillz_tournament_match_id'); sessionStorage.removeItem('skillz_tournament_id'); setTournamentId(''); setTournamentData(null); setActiveMatchId(''); setCurrentTab('home'); }}
          onPlayAgain={handleTournamentPlayAgain}
        />
      )}

      {screenState === 'tournament_rank' ? null : <>
      {/* 1. LOBBY VIEW */}
      {screenState === 'lobby' && (
        <BlockLobbyView
          userRating={rating}
          userBestScore={bestScore}
          userWinStreak={winStreak}
          matchesPlayed={matchesPlayed}
          userBalance={user?.gamingBalance || 0}
          pendingMatchesCount={activePendingCount}
          proMatchFees={paymentSettings.proMatchFees}
          multiplayerProConfig={multiplayerProConfig}
          isAdmin={Boolean(user?.isAdmin)}
          onStartDuel={handleStartDuel}
          onStartPractice={handleStartPractice}
          onOpenPendingMatches={() => setShowPendingModal(true)}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenHistory={async () => { await refreshBlockPuzzleMatches(); setShowHistory(true); }}
          onOpenProfile={() => setShowProfile(true)}
          onOpenRules={() => setShowRules(true)}
          onOpenAndroidCode={() => setShowAndroidCode(true)}
          onBackToHome={() => { sessionStorage.removeItem('skillz_multiplayer_pro_config'); setMultiplayerProConfig(null); setCurrentTab('home'); }}
          onGoToWallet={() => setCurrentTab('wallet')}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 2. MATCHMAKING SCREEN (From Video 00:00 - Finding Opponent / VS Card) */}
      {screenState === 'matchmaking' && (
        <div className="flex-1 flex flex-col justify-between p-5 text-center relative overflow-hidden animate-fade-in">
          {/* Ambient Lightning Backdrop */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b1230] via-[#070b1a] to-[#04060e] -z-10" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl -z-10" />

          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={async () => {
                const refunded = await refundBlockPuzzleMatch(activeMatchId, entryFee, 'Player cancelled matchmaking');
                if (!refunded.success) { alert(refunded.message); return; }
                clearLiveSnapshot(activeMatchId);
                setActiveMatchId('');
                setScreenState('lobby');
              }}
              className="p-2 rounded-xl bg-[#101738] border border-indigo-900/60 text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
              MATCHMAKING
            </span>
            <div className="w-8" />
          </div>

          {/* Player VS Opponent Cards */}
          <div className="space-y-6 my-auto">
            {/* Player Card */}
            <div className="bg-[#0e1635] p-4 rounded-3xl border-2 border-indigo-500/60 shadow-2xl flex items-center justify-between max-w-xs mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-600 p-0.5 shadow-lg">
                  <div className="w-full h-full bg-[#0d1226] rounded-[14px] flex items-center justify-center text-2xl">
                    😎
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-bold text-amber-400 uppercase bg-amber-400/10 px-1.5 py-0.5 rounded">
                    Novice • 🇧🇩 BD
                  </span>
                  <h3 className="text-base font-black text-white mt-0.5">
                    {user?.name || '70lol70'}
                  </h3>
                  <span className="text-[11px] text-slate-300 font-semibold">
                    Best: {bestScore} pts
                  </span>
                </div>
              </div>
            </div>

            {/* VS Badge */}
            <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-r from-red-500 to-amber-500 p-0.5 shadow-xl flex items-center justify-center animate-pulse">
              <div className="w-full h-full bg-[#080d20] rounded-full flex items-center justify-center font-black text-sm text-amber-300">
                VS
              </div>
            </div>

            {matchedOpponent ? (
              <div className="bg-emerald-500/10 p-4 rounded-3xl border-2 border-emerald-500/50 max-w-xs mx-auto text-center space-y-1">
                <div className="text-[10px] font-black tracking-widest text-emerald-300 uppercase">MATCH FOUND</div>
                <div className="text-xl font-black text-white">{matchedOpponent.name}</div>
                <div className="text-[11px] font-bold text-cyan-300">আপনার প্রতিপক্ষ</div>
              </div>
            ) : (
            /* Finding Opponent / waiting card */
            <div className="bg-[#0b1028]/80 p-4 rounded-3xl border border-indigo-900/60 border-dashed max-w-xs mx-auto text-center space-y-1">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#101735] flex items-center justify-center text-xl text-slate-500">
                ❓
              </div>
              <p className="text-xs font-bold text-slate-300">
                আপনার গেম এখনই শুরু হবে — প্রতিপক্ষ পরে এলেও ম্যাচটি চলবে।
              </p>
              <span className="text-[10px] text-slate-300">
                Entry fee কাটা হয়েছে • গেম শেষ হলে স্কোর Submit করুন
              </span>
            </div>
            )}
          </div>

          {/* Paid player starts immediately; opponent matching happens independently. */}
          <div className="space-y-3 max-w-xs mx-auto w-full">
            <div className="bg-[#0c122a] px-4 py-3 rounded-xl border border-indigo-900/60 flex items-center justify-between text-xs">
              <span className="text-slate-300">GUARANTEED PRIZE</span>
              <span className="text-amber-400 font-black text-sm">৳{prize}</span>
            </div>
            <div className="text-[11px] text-cyan-300 font-bold animate-pulse">আপনার গেম শুরু হচ্ছে… প্রতিপক্ষ পরে যোগ দিলে এই ম্যাচের সাথেই যুক্ত হবে।</div>
          </div>
        </div>
      )}

      {/* 3. 3-SECOND COUNTDOWN OVERLAY */}
      {screenState === 'countdown' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 animate-fade-in">
          <span className="text-sm font-black text-cyan-400 uppercase tracking-widest">
            GET READY!
          </span>
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-cyan-400 to-indigo-600 p-1 shadow-2xl shadow-cyan-500/30 flex items-center justify-center animate-pulse">
            <div className="w-full h-full bg-[#080d20] rounded-[22px] flex items-center justify-center">
              <span className="text-6xl font-black text-white font-mono">
                {countdown}
              </span>
            </div>
          </div>
          {gameMode === 'duel' && matchedOpponent && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-2xl px-4 py-2 text-center">
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-300">MATCH FOUND • VS</div>
              <div className="text-lg font-black text-white">{matchedOpponent.name}</div>
            </div>
          )}
          <span className="text-xs text-slate-300 font-semibold">
            {gameMode === 'duel' ? `এন্ট্রি ফি: ৳${entryFee} • ৩ মিনিটে সর্বোচ্চ স্কোর করুন!` : 'প্র্যাকটিস মোড চালু হচ্ছে...'}
          </span>
        </div>
      )}

      {/* 4. ACTIVE PLAYING GAMEPLAY SCREEN (Skillz Block Blitz Video UI) */}
      {screenState === 'playing' && (
        <div className="block-gameplay-stage px-3 py-2 space-y-2 relative flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Top HUD: 3:00 Clock on Left, Center Trophy Score Pill, Help on Right */}
          <BlockHud
            mode={gameMode}
            difficulty={difficulty}
            entryFee={entryFee}
            prize={prize}
            player={playerState}
            remainingTime={remainingTime}
            totalTime={TOTAL_MATCH_TIME}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onPause={() => setIsPaused(true)}
            onOpenRules={() => setShowRules(true)}
          />

          {/* 10x10 Board Grid */}
          <div className="block-gameplay-board-slot flex-1 min-h-0 w-full flex items-center justify-center">
          <BlockBoardView
            board={board}
            previewPlacement={previewPlacement}
            clearingRows={clearingRows}
            clearingCols={clearingCols}
            selectedPiece={activePiece}
            floatingScores={floatingScores}
            bannerAlert={bannerAlert}
            isOutOfMoves={isOutOfMoves}
            onCellHover={(r, c) => setHoveredCell({ r, c })}
            onMouseLeave={() => setHoveredCell(null)}
            gridRef={gridRef}
          />
          </div>

          {/* 3-Block Tray */}
          <div className="block-gameplay-tray flex-none w-full">
          <BlockTrayView
            pieces={pieces}
            selectedPieceIndex={selectedPieceIndex}
            canPlaceMap={canPlaceMap}
            onPiecePointerDown={handlePiecePointerDown}
            onPiecePointerMove={handlePiecePointerMove}
            onPiecePointerUp={finishPieceDrag}
            onPiecePointerCancel={handlePiecePointerCancel}
          />
          </div>

          {/* Bottom Controls: kept in normal document flow so they never cover the block tray.
              The app navigation is fixed separately; the gameplay container has bottom clearance. */}
          <div className="block-gameplay-controls relative z-30 flex-none w-full max-w-[390px] mx-auto px-3 py-1.5 bg-[#070b18]/95 backdrop-blur-md rounded-2xl border border-indigo-900/70 shadow-2xl flex items-center justify-between gap-2">
            <button
              id="block-bottom-exit-btn"
              type="button"
              onClick={async () => {
                if (matchTimerRef.current) clearInterval(matchTimerRef.current);
                if (gameMode === 'duel' && activeMatchId && entryFee > 0) {
                  const refunded = await refundBlockPuzzleMatch(activeMatchId, entryFee, 'Player exited the game');
                  if (!refunded.success) { alert(refunded.message); return; }
                }
                clearLiveSnapshot(activeMatchId);
                setActiveMatchId('');
                setIsPaused(false);
                setScreenState('lobby');
              }}
              className="h-10 px-3 rounded-2xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 flex items-center justify-center gap-1.5 text-red-300 font-black text-[10px] shadow-lg active:scale-95 transition-transform"
              title="Exit Game"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>EXIT</span>
            </button>

            <button
              id="block-bottom-pause-btn"
              type="button"
              onClick={async () => {
                if (isPaused) return;
                // Practice Mode pauses instantly; Pro Match does the same locally
                // and synchronizes the server clock in the background.
                setIsPaused(true);
                if (!activeMatchId || gameMode === 'practice') return;
                try {
                  const paused = await pauseBlockPuzzleMatch(activeMatchId);
                  if (!paused.success) setIsPaused(false);
                } catch {
                  setIsPaused(false);
                }
              }}
              className="w-10 h-10 rounded-2xl bg-[#0f1738] hover:bg-[#15204d] border border-[#1d2b5c] flex items-center justify-center text-slate-300 hover:text-white shadow-lg active:scale-95 transition-transform"
              title="Pause Game"
            >
              <Pause className="w-5 h-5 fill-current" />
            </button>

            {gameMode === 'duel' && activeMatchId && (
              <button
                id="block-bottom-submit-btn"
                type="button"
                disabled={isSubmittingScore}
                onClick={() => {
                  if (matchTimerRef.current) clearInterval(matchTimerRef.current);
                  setIsPaused(false);
                  setScreenState('submit');
                }}
                className="h-10 px-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 flex items-center justify-center gap-1.5 text-emerald-300 font-black text-[10px] shadow-lg active:scale-95 transition-transform disabled:opacity-50"
                title="Submit Score Now"
              >
                <span>SUBMIT</span>
              </button>
            )}

            <button
              id="block-bottom-sound-btn"
              type="button"
              onClick={handleToggleMute}
              className="w-10 h-10 rounded-2xl bg-[#0f1738] hover:bg-[#15204d] border border-[#1d2b5c] flex items-center justify-center text-slate-300 hover:text-white shadow-lg active:scale-95 transition-transform"
              title="Toggle Sound"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
            </button>
          </div>

          {/* Floating Drag Piece above touch pointer */}
          {dragPointer && activePiece && (
            <div
              className="fixed pointer-events-none z-50 opacity-95 scale-110 drop-shadow-2xl"
              style={{
                left: `${dragPointer.x}px`,
                top: `${dragPointer.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="flex flex-col items-center justify-center gap-1 bg-[#090e24]/90 p-2 rounded-xl border border-cyan-400/80 shadow-2xl">
                {activePiece.matrix.map((row, r) => (
                  <div key={r} className="flex items-center gap-1">
                    {row.map((cell, c) => (
                      <div
                        key={c}
                        className={`w-6 h-6 rounded-[4px] border-t border-l border-white/50 border-b-2 border-r-2 border-black/50 ${
                          cell !== 0 ? '' : 'opacity-0'
                        }`}
                        style={{
                          backgroundColor: cell !== 0 ? activePiece.color : 'transparent',
                          borderColor: cell !== 0 ? activePiece.accentColor : 'transparent',
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. PAUSE MODAL */}
      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
          <div className="bg-[#0b1028] border-2 border-[#1f2d63] rounded-3xl p-6 max-w-xs w-full shadow-2xl space-y-4 text-center">
            <h3 className="text-xl font-black text-white uppercase tracking-wider font-mono">
              GAME PAUSED
            </h3>

            <div className="space-y-2 pt-2">
              <button
                onClick={async () => {
                  if (!activeMatchId || gameMode === 'practice') { setIsPaused(false); return; }
                  // Resume immediately like Practice Mode, then sync the server
                  // deadline without showing an account error to the player.
                  setIsPaused(false);
                  try {
                    const resumed = await resumeBlockPuzzleMatch(activeMatchId);
                    if (resumed.success && resumed.match?.gameStartedAt) setServerGameStartedAt(resumed.match.gameStartedAt);
                    if (!resumed.success) setIsPaused(true);
                  } catch {
                    setIsPaused(true);
                  }
                }}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-sm uppercase rounded-xl flex items-center justify-center gap-2 active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>RESUME MATCH</span>
              </button>

              <button
                onClick={() => {
                  setShowRules(true);
                }}
                className="w-full py-2.5 bg-[#12193d] border border-[#213069] text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:text-white active:scale-95"
              >
                <HelpCircle className="w-4 h-4" />
                <span>HOW TO PLAY</span>
              </button>

              <button
                onClick={() => {
                  setIsPaused(false);
                  handleTimeUp();
                }}
                className="w-full py-2.5 bg-red-500/20 border border-red-500/40 text-red-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95"
              >
                <span>FORFEIT & SUBMIT</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. SUBMIT SCORE MODAL (From Video 01:35 - Game Over & Submit) */}
      {screenState === 'submit' && (
        <BlockSubmitModal
          player={playerState}
          entryFee={entryFee}
          prize={prize}
          bestScore={bestScore}
          isSubmitting={isSubmittingScore}
          onSubmit={handleSubmitScore}
          isTournament={gameMode === 'tournament'}
        />
      )}

      {/* 7. RESULT MODAL */}
      {screenState === 'result' && (
        <BlockResultModal
          mode={gameMode}
          entryFee={entryFee}
          prize={prize}
          player={playerState}
          opponent={matchedOpponent}
          isPractice={gameMode === 'practice'}
          isPending={matchOutcome === 'PENDING'}
          outcome={matchOutcome}
          onPlayAgain={() => {
            if (gameMode === 'practice') {
              handleStartPractice(difficulty);
            } else {
              handleStartDuel(entryFee, prize);
            }
          }}
          onGoHome={() => setScreenState('lobby')}
          onViewPendingMatches={() => {
            setScreenState('lobby');
            setShowPendingModal(true);
          }}
          onViewHistory={() => {
            setShowHistory(true);
          }}
        />
      )}

      {/* MODALS */}
      {showPendingModal && (
        <BlockPendingMatchesModal
          pendingMatches={pendingMatches}
          onClose={() => setShowPendingModal(false)}
          onRefresh={refreshBlockPuzzleMatches}
        />
      )}

      {showProfile && (
        <BlockProfileModal
          userName={user?.name || 'Player 70lol70'}
          avatar="😎"
          rating={rating}
          bestScore={bestScore}
          matchesWon={matchesWon}
          matchesLost={matchesLost}
          totalLines={totalLines}
          bestCombo={playerState.bestCombo || 4}
          practiceBestScore={practiceBestScore}
          onClose={() => setShowProfile(false)}
        />
      )}

      {showLeaderboard && (
        <BlockLeaderboardModal
          currentUserId={user?.id || 'player_1'}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {showHistory && (
        <BlockMatchHistoryModal
          matches={pendingMatches.map((m) => ({
            id: m.id,
            mode: m.mode || 'Online Duel 1v1',
            opponentName: m.opponentName,
            userScore: m.score,
            opponentScore: m.opponentScore,
            result: m.status === 'WON' ? 'WIN' : m.status === 'LOST' ? 'LOSS' : m.status === 'DRAW' ? 'DRAW' : m.status === 'TOURNAMENT' ? 'TOURNAMENT' : 'PENDING',
            lines: m.linesCleared,
            date: m.date,
          }))}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showRules && (
        <BlockRulesModal onClose={() => setShowRules(false)} />
      )}

      {showAndroidCode && (
        <AndroidCodeViewerModal onClose={() => setShowAndroidCode(false)} />
      )}
      </>}
    </div>
  );
};
