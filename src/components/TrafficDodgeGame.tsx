import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Pause, Play, RotateCcw, Trophy, Coins, Heart, Car, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { blockAudio } from '../utils/blockPuzzleAudio';
import { BlockTournamentRankList } from './blockpuzzle/BlockTournamentRankList';

type Mode = 'practice' | 'pro' | 'multiplayer';
type Item = { id:number; x:number; y:number; coin:boolean; el:HTMLDivElement };

const MATCH_MS = 180000;
const MAX_PAUSE_MS = 60000;
const LANES = [25, 50, 75];

function seeded(seed:number) {
  let s = (Math.floor(seed) || 1) >>> 0;
  <style>{`
    @keyframes fall {
      0% { transform: translateY(-60px) rotate(0deg); opacity: 0; }
      10% { opacity: 1; }
      100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
    }
  `}</style>

  const handleTournamentPlayAgain = async () => {
    if (!tournamentId) return;

    setTournamentLoading(true);

    try {
      const data = await (await import('../services/backendApi')).backendApi.joinTournament(tournamentId);
      const m = data?.match;

      sessionStorage.setItem('skillz_tournament_id', String(tournamentId));
      sessionStorage.setItem('skillz_tournament_match_id', String(m?.id || ''));

      setTournamentData(data?.tournament || tournamentData);
      tournamentRef.current = true;
      tournamentStartedRef.current = true;
      setMode('pro');
      setPlayers(2);

      const seed = Number(m?.gameSeed || 0);
      if (!m?.id || !seed) {
        setMessage('Tournament game শুরু করা যায়নি।');
        setScreen('lobby');
        return;
      }

      setMatchId(String(m.id));
      startRun(seed, String(m.id));
    } catch (e:any) {
      setMessage(e?.message || 'Tournament আবার শুরু করা যায়নি।');
      setScreen('lobby');
    } finally {
      setTournamentLoading(false);
    }
  };

  return () => {
    s += 0x6D2B79F5;
    let t = s;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export const TrafficDodgeGame: React.FC = () => {
  const { user, setCurrentTab, paymentSettings, startBlockPuzzleMatch, getBlockPuzzleMatchStatus, pauseBlockPuzzleMatch, resumeBlockPuzzleMatch, submitBlockPuzzleResult, getMyPendingGames } = useApp();
  const [mode, setMode] = useState<Mode>('practice');
  const [fee, setFee] = useState(Number(paymentSettings.proMatchFees?.[0] || 20));
  const [players, setPlayers] = useState(2);
  const [screen, setScreen] = useState<'lobby'|'countdown'|'playing'|'paused'|'submit'|'result'|'tournament_rank'>('lobby');
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [remaining, setRemaining] = useState(180);
  const [pauseUsed, setPauseUsed] = useState(0);
  const [matchId, setMatchId] = useState('');
  const [matchSeed, setMatchSeed] = useState(1);
  const [tournamentId, setTournamentId] = useState('');
  const [tournamentData, setTournamentData] = useState<any>(null);
  const [tournamentLoading, setTournamentLoading] = useState(false);
  const tournamentRef = useRef(false);
  const [opponent, setOpponent] = useState<any>(null);
  const [outcome, setOutcome] = useState<'WON'|'LOST'|'DRAW'|'PENDING'|null>(null);
  const [pendingHistory, setPendingHistory] = useState<any[]>([]);
  const [historyView, setHistoryView] = useState<'pending'|'history'|null>(null);
  const [message, setMessage] = useState('');
  const [starting, setStarting] = useState(false);
 const [bestScore, setBestScore] = useState(() =>
   Number(localStorage.getItem('traffic_dodge_best_score') || 0)
 );

  const rootRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Item[]>([]);
  const rafRef = useRef<number>(0);
  const lastRef = useRef(0);
  const spawnRef = useRef(0);
  const xRef = useRef(50);
  const scoreRef = useRef(0);
  const coinsRef = useRef(0);
  const livesRef = useRef(3);
  const runningRef = useRef(false);
  const pausedRef = useRef(false);
  const pauseStartedRef = useRef(0);
  const pauseUsedRef = useRef(0);
 const pauseLimitTimerRef = useRef<number | null>(null);
  const collisionLockRef = useRef(false);
  const startTimerRef = useRef<number | null>(null);
  const rngRef = useRef(() => Math.random());
  const steerRef = useRef(0);
  const matchStartRef = useRef(0);

  const clearObjects = useCallback(() => {
    itemsRef.current = [];
    const el = rootRef.current;
    if (el) el.querySelectorAll('[data-traffic-item]').forEach(n => n.remove());
  }, []);

  const paintCar = useCallback(() => {
    if (carRef.current) carRef.current.style.left = `${xRef.current}%`;
  }, []);

  const resetGame = useCallback((seed:number) => {
    cancelAnimationFrame(rafRef.current);
    if (startTimerRef.current !== null) {
      window.clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
    clearObjects();
    runningRef.current = false;
    pausedRef.current = false;
    collisionLockRef.current = false;
    scoreRef.current = 0; coinsRef.current = 0; livesRef.current = 3;
    xRef.current = 50; spawnRef.current = 0; pauseUsedRef.current = 0;
   if (pauseLimitTimerRef.current !== null) {
     window.clearTimeout(pauseLimitTimerRef.current);
     pauseLimitTimerRef.current = null;
   }
    setScore(0); setCoins(0); setLives(3); setPauseUsed(0);
    rngRef.current = seeded(seed);
    paintCar();
  }, [clearObjects, paintCar]);

  const overlap = (a:HTMLElement, b:HTMLElement) => {
    const ar = a.getBoundingClientRect(), br = b.getBoundingClientRect();
    return !(ar.right < br.left + 7 || ar.left > br.right - 7 || ar.bottom < br.top + 8 || ar.top > br.bottom - 8);
  };

  const finishLocal = useCallback((text:string) => {
    runningRef.current = false;
    pausedRef.current = false;
    steerRef.current = 0;
    cancelAnimationFrame(rafRef.current);

    if (pauseLimitTimerRef.current !== null) {
      window.clearTimeout(pauseLimitTimerRef.current);
      pauseLimitTimerRef.current = null;
    }

    const finalScore = scoreRef.current;

    if (finalScore > bestScore) {
      setBestScore(finalScore);
      localStorage.setItem(
        'traffic_dodge_best_score',
        String(finalScore)
      );
    }

    setMessage(text);
    setScreen('submit');
  }, [bestScore]);

  const loseLife = useCallback(() => {
    if (collisionLockRef.current) return;

    collisionLockRef.current = true;
    runningRef.current = false;
    pausedRef.current = true;
    cancelAnimationFrame(rafRef.current);

    livesRef.current -= 1;
    setLives(livesRef.current);
    clearObjects();
    xRef.current = 50;
    paintCar();

    if (livesRef.current <= 0) {
      finishLocal('Game Over — 3 lives used.');
      return;
    }
    pausedRef.current = true;
    pauseStartedRef.current = performance.now();
    if (matchId) void pauseBlockPuzzleMatch(matchId);
    setScreen('paused');
    setMessage(`Crash! ${livesRef.current} life${livesRef.current === 1 ? '' : 's'} remaining.`);
  }, [clearObjects, finishLocal, matchId, paintCar, pauseBlockPuzzleMatch]);

  const spawn = useCallback(() => {
    const lane = LANES[Math.floor(rngRef.current() * LANES.length)];
    const coin = rngRef.current() < 0.30;
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.dataset.trafficItem = 'true';
    el.style.left = `${lane}%`;
    el.style.top = '-80px';
    el.style.transform = 'translateX(-50%)';
    el.style.width = coin ? '28px' : '52px';
    el.style.height = coin ? '28px' : '88px';
    el.style.borderRadius = coin ? '50%' : '13px';
    el.style.zIndex = '10';
    el.style.background = coin ? '#ffd21a' : 'linear-gradient(90deg,#0754b8,#198cff,#0754b8)';
    el.style.border = coin ? '4px solid #fff09a' : '0';
    el.style.boxShadow = coin ? '0 0 12px #ffd21a' : '0 4px 10px #000';
    el.textContent = coin ? '★' : '';
    el.style.display = 'flex'; el.style.alignItems = 'center'; el.style.justifyContent = 'center';
    el.style.color = '#9a6500'; el.style.fontWeight = '900';
    rootRef.current?.appendChild(el);
    itemsRef.current.push({ id: Date.now() + Math.random(), x: lane, y: -80, coin, el });
  }, []);

  const loop = useCallback((t:number) => {
    if (!runningRef.current || pausedRef.current) return;
    const dt = Math.min(32, t - lastRef.current || 16);
    lastRef.current = t; spawnRef.current += dt;
    const steer = steerRef.current;
    if (steer) {
      xRef.current = Math.max(17, Math.min(83, xRef.current + steer * 0.075 * dt));
      paintCar();
    }
    const elapsed = Math.max(0, t - matchStartRef.current);
    const speed = Math.min(
      mode === 'practice' ? 10 : 8,
      4.5 + scoreRef.current / 300
    );
    const spawnInterval = mode === 'practice' ? 620 : 720;
    if (spawnRef.current > spawnInterval) {
      spawnRef.current = 0;
      spawn();
    }

    for (const lane of Array.from(rootRef.current?.querySelectorAll('.traffic-lane') || [])) {
      const node = lane as HTMLElement;
      let top = parseFloat(node.style.top || '-120');
      top += speed * dt / 16;
      node.style.top = top > (rootRef.current?.clientHeight || 800) ? '-120px' : `${top}px`;
    }

    for (let i = itemsRef.current.length - 1; i >= 0; i--) {
      const o = itemsRef.current[i];
      o.y += speed * dt / 16;
      o.el.style.top = `${o.y}px`;
      if (carRef.current && overlap(carRef.current, o.el)) {
        if (o.coin) {
          coinsRef.current += 1; scoreRef.current += 25;
          setCoins(coinsRef.current); setScore(scoreRef.current);
          o.el.remove(); itemsRef.current.splice(i,1); continue;
        }
        o.el.remove(); itemsRef.current.splice(i,1); loseLife(); return;
      }
      if (o.y > (rootRef.current?.clientHeight || 800) + 80) {
        if (!o.coin) { scoreRef.current += 5; setScore(scoreRef.current); }
        o.el.remove(); itemsRef.current.splice(i,1);
      }
    }
    const totalPause = pauseUsedRef.current;
    if (mode !== 'practice') {
      const elapsedWithPause = Math.max(0, performance.now() - matchStartRef.current - totalPause);
      const left = Math.max(0, Math.ceil((MATCH_MS - elapsedWithPause) / 1000));
      setRemaining(left);
      if (left <= 0) { finishLocal('Time up — submit your score.'); return; }
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [finishLocal, loseLife, mode, paintCar, spawn]);

  const startRun = useCallback((seed:number, paidMatchId='') => {
    resetGame(seed);
    setMatchId(paidMatchId);
    setMatchSeed(seed);
    setRemaining(180);
    setScreen('countdown');

    if (startTimerRef.current !== null) {
      window.clearTimeout(startTimerRef.current);
    }

    startTimerRef.current = window.setTimeout(() => {
      startTimerRef.current = null;
      cancelAnimationFrame(rafRef.current);
      runningRef.current = true; pausedRef.current = false;
      matchStartRef.current = performance.now();
      lastRef.current = performance.now();
      setScreen('playing');
      rafRef.current = requestAnimationFrame(loop);
    }, 900);
  }, [loop, resetGame]);

  const startPaid = useCallback(async (targetPlayers:number) => {
    if (starting) return;
    setStarting(true); setMessage('');
    try {
      const prizes = Array.isArray(paymentSettings.proMatchPrizes) ? paymentSettings.proMatchPrizes : [];
      const feeIndex = (paymentSettings.proMatchFees || []).findIndex(x => Number(x) === Number(fee));
      const prize = targetPlayers > 2
        ? Number(paymentSettings.multiplayerProMatches?.find(x => Number(x.players) === targetPlayers)?.prizeAmount || 0)
        : Number(prizes[feeIndex] || 0);
      if (!prize) throw new Error('এই Entry Fee-এর Prize Admin সেট করেনি।');
      const seed = Math.floor(Math.random() * 2147483646) + 1;
      const r = await startBlockPuzzleMatch(fee, prize, targetPlayers, 'traffic_dodge', seed);
      if (!r.success || !r.matchId) throw new Error(r.message || 'Traffic Dodge Match শুরু হয়নি।');
      startRun(Number(r.gameSeed || seed), String(r.matchId));
    } catch (e:any) {
      setMessage(e?.message || 'Match শুরু করা যায়নি।'); setScreen('lobby');
    } finally { setStarting(false); }
  }, [fee, paymentSettings, startBlockPuzzleMatch, startRun, starting]);

  const startPractice = () => startRun(Math.floor(Math.random() * 2147483646) + 1, '');

  // Tournament boot: HomeScreen has already joined the tournament and stored
  // the tournament/match IDs. Start Traffic Dodge using the server match seed
  // without charging the entry fee again.
  const tournamentStartedRef = useRef(false);

  useEffect(() => {
    let timer: number | null = null;

    const bootTournament = async () => {
      if (tournamentStartedRef.current) return;

      const tournamentId = sessionStorage.getItem('skillz_tournament_id') || '';
      const storedMatchId = sessionStorage.getItem('skillz_tournament_match_id') || '';

      if (!tournamentId || !storedMatchId) return;

      try {
        const m = await getBlockPuzzleMatchStatus(storedMatchId);
        if (!m) return;

        const serverSeed = Number(
          (m as any).gameSeed ??
          (m as any).match?.gameSeed ??
          0
        );

        if (!Number.isFinite(serverSeed) || serverSeed <= 0) return;

        tournamentStartedRef.current = true;
        tournamentRef.current = true;
        setTournamentId(String(tournamentId));
        setMode('pro');
        setPlayers(2);
        setMatchId(String(storedMatchId));
        setMessage('');
        startRun(serverSeed, String(storedMatchId));
      } catch (error) {
        console.error('Traffic Tournament boot error:', error);
      }
    };

    void bootTournament();

    timer = window.setInterval(() => {
      void bootTournament();
    }, 700);

    return () => {
      if (timer !== null) window.clearInterval(timer);
    };
  }, [getBlockPuzzleMatchStatus, startRun]);

  const doPause = useCallback(async () => {
    if (!runningRef.current) return;
    if (pauseUsedRef.current >= MAX_PAUSE_MS) { setMessage('আপনার 60 সেকেন্ড Pause limit শেষ।'); return; }
    pausedRef.current = true; pauseStartedRef.current = performance.now(); steerRef.current = 0;
    if (matchId) {
      const r = await pauseBlockPuzzleMatch(matchId);
      if (!r.success) { pausedRef.current = false; return; }
    }
    setScreen('paused');
    setPauseUsed(Math.floor(pauseUsedRef.current / 1000));
  }, [matchId, pauseBlockPuzzleMatch]);

  const doResume = useCallback(async () => {
    if (!pausedRef.current) return;
    const spent = Math.max(0, performance.now() - pauseStartedRef.current);
    pauseUsedRef.current = Math.min(MAX_PAUSE_MS, pauseUsedRef.current + spent);
    setPauseUsed(Math.floor(pauseUsedRef.current / 1000));
    if (matchId) {
      const r = await resumeBlockPuzzleMatch(matchId);
      if (!r.success) { setMessage(r.message); return; }
    }
    if (pauseUsedRef.current >= MAX_PAUSE_MS) {
      finishLocal('60-second Pause limit reached — submit your score.');
      return;
    }
    clearObjects();
    collisionLockRef.current = false;
    pausedRef.current = false;
    runningRef.current = true;
    pauseStartedRef.current = 0;
    lastRef.current = performance.now();
    cancelAnimationFrame(rafRef.current);
    setScreen('playing');
    rafRef.current = requestAnimationFrame(loop);
  }, [finishLocal, loop, matchId, resumeBlockPuzzleMatch]);

  const refreshTrafficHistory = useCallback(async () => {
    try {
      const items = await getMyPendingGames();

      const trafficOnly = (items || []).filter((m: any) => {
        const gt = String(m.gameType || '').toLowerCase();
        return gt === 'traffic_dodge';
      });

      setPendingHistory(trafficOnly);
    } catch (error) {
      console.error('Traffic pending/history refresh error:', error);
    }
  }, [getMyPendingGames]);

  useEffect(() => {
    void refreshTrafficHistory();

    const timer = window.setInterval(() => {
      void refreshTrafficHistory();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [refreshTrafficHistory]);


  const submit = useCallback(async () => {
    runningRef.current = false;
    pausedRef.current = false;
    cancelAnimationFrame(rafRef.current);

    if (!matchId) {
      setOutcome(null);
      setScreen('result');
      setMessage(`Score ${scoreRef.current} • ${coinsRef.current} coins`);
      return;
    }

    const r = await submitBlockPuzzleResult(matchId, scoreRef.current, 0);

    if (!r.success) {
      setMessage(r.message);
      setScreen('submit');
      return;
    }

    // Tournament: go directly to Tournament Rank List.
    // Do NOT show the normal Pro Match PENDING/DRAW screen.
    if (tournamentRef.current) {
      const settled: any = r.match || {};
      const id = String(
        settled?.tournamentId ||
        tournamentId ||
        sessionStorage.getItem('skillz_tournament_id') ||
        ''
      );

      if (!id) {
        setMessage('Tournament ID পাওয়া যায়নি।');
        setScreen('lobby');
        return;
      }

      sessionStorage.setItem('skillz_tournament_id', id);
      sessionStorage.setItem(
        'skillz_tournament_match_id',
        String(settled?.id || matchId)
      );

      setTournamentId(id);
      setTournamentLoading(true);

      try {
        const data = await (await import('../services/backendApi')).backendApi.tournament(id);
        if (data?.tournament) {
          setTournamentData(data.tournament);
        }
      } catch (e) {
        console.error('Traffic Tournament rank refresh error:', e);
      } finally {
        setTournamentLoading(false);
        setScreen('tournament_rank');
      }

      return;
    }

    // Normal Pro Match flow remains unchanged.
    setOutcome('PENDING');
    setScreen('result');
    setMessage('Score submitted. Waiting for opponent result.');
    void refreshTrafficHistory();
  }, [
    matchId,
    submitBlockPuzzleResult,
    refreshTrafficHistory,
    tournamentId
  ]);

  useEffect(() => {
    const raw = sessionStorage.getItem('skillz_multiplayer_pro_config');
    if (raw) {
      try {
        const cfg = JSON.parse(raw);
        if (Number(cfg.players) >= 3) { setMode('multiplayer'); setPlayers(Number(cfg.players)); setFee(Number(cfg.entryFee || fee)); }
      } catch {}
    }
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (startTimerRef.current !== null) {
        window.clearTimeout(startTimerRef.current);
        startTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (tournamentRef.current) return;
    if (!matchId || screen === 'lobby' || mode === 'practice') return;

    const timer = window.setInterval(async () => {
      try {
        const m = await getBlockPuzzleMatchStatus(matchId);
        if (!m) return;

        if (m.opponent) {
          setOpponent(m.opponent);
        }

        if (m.status === 'COMPLETED') {
          runningRef.current = false;

          const finalOutcome =
            m.outcome === 'WON'
              ? 'WON'
              : m.outcome === 'LOST'
                ? 'LOST'
                : 'DRAW';

          setOpponent(m.opponent || null);
          setOutcome(finalOutcome);

          if (finalOutcome === 'WON') {
            blockAudio.playWin();
            setMessage('🏆 You won!');
          } else if (finalOutcome === 'LOST') {
            setMessage('You lost');
          } else {
            setMessage('🤝 Draw');
          }

          setScreen('result');
          void refreshTrafficHistory();
        }
      } catch (error) {
        console.error('Traffic match polling error:', error);
      }
    }, 2000);

    return () => window.clearInterval(timer);
  }, [getBlockPuzzleMatchStatus, matchId, mode, screen, refreshTrafficHistory]);

  useEffect(() => {
    const auto = () => { if (document.hidden || !document.hasFocus()) doPause(); };
    document.addEventListener('visibilitychange', auto);
    window.addEventListener('blur', auto);
    return () => { document.removeEventListener('visibilitychange', auto); window.removeEventListener('blur', auto); };
  }, [doPause]);

  useEffect(() => {
    const key = (e:KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); steerRef.current = -1; }
      if (e.key === 'ArrowRight') { e.preventDefault(); steerRef.current = 1; }
      if (e.key === 'Escape' && (screen === 'playing' || screen === 'paused')) (pausedRef.current ? doResume() : doPause());
    };
    const up = (e:KeyboardEvent) => {
      if ((e.key === 'ArrowLeft' && steerRef.current === -1) || (e.key === 'ArrowRight' && steerRef.current === 1)) steerRef.current = 0;
    };
    window.addEventListener('keydown', key); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('keyup', up); };
  }, [doPause, doResume, screen]);

  const trafficSwipeStartX = useRef(0);
 const trafficSwipeStartY = useRef(0);

 const onTouchStart = (e:React.TouchEvent) => {
   if (screen !== 'playing') return;
   const t = e.changedTouches[0];
   trafficSwipeStartX.current = t.clientX;
   trafficSwipeStartY.current = t.clientY;
 };

 const onTouchEnd = (e:React.TouchEvent) => {
   if (screen !== 'playing') return;

   const t = e.changedTouches[0];
   const dx = t.clientX - trafficSwipeStartX.current;
   const dy = t.clientY - trafficSwipeStartY.current;

   if (Math.abs(dx) < 28 || Math.abs(dx) <= Math.abs(dy)) return;

   const direction = dx > 0 ? 1 : -1;
   steerRef.current = direction;

   window.setTimeout(() => {
     if (steerRef.current === direction) {
       steerRef.current = 0;
     }
   }, 180);
 };

 const button = (dir:number) => {
    const press = (e:React.PointerEvent) => { e.preventDefault(); steerRef.current = dir; };
    const release = () => { if (steerRef.current === dir) steerRef.current = 0; };
    return { onPointerDown: press, onPointerUp: release, onPointerCancel: release, onPointerLeave: release };
  };

  const resetLobby = () => {
    cancelAnimationFrame(rafRef.current); runningRef.current = false; pausedRef.current = false;
    clearObjects(); setMatchId(''); setOpponent(null); setMessage(''); setScreen('lobby');
    sessionStorage.removeItem('skillz_multiplayer_pro_config');
   sessionStorage.removeItem('skillz_game_type');
   sessionStorage.removeItem('skillz_tournament_id');
   sessionStorage.removeItem('skillz_tournament_match_id');
  };

  const title = mode === 'multiplayer' ? `${players} Players Multiplayer Pro` : mode === 'pro' ? 'Traffic Dodge Pro Match' : 'Traffic Dodge Practice';

  return (
    <div className={`${screen === 'lobby'
      ? 'min-h-screen bg-slate-950 text-white pb-24'
      : 'fixed inset-0 z-[9999] min-h-screen overflow-hidden bg-slate-950 text-white'
    }`}>
      <div className={`${screen === 'lobby'
        ? 'max-w-md mx-auto p-3 space-y-3'
        : 'w-full h-full p-3'
      }`}>
        <div className="flex items-center justify-between">
          <button onClick={() => { resetLobby(); setCurrentTab('home'); }} className="p-2 rounded-xl bg-slate-800"><ArrowLeft className="w-5 h-5"/></button>
          <div className="text-center"><div className="font-black">{title}</div><div className="text-[10px] text-cyan-300">3 ❤️ • 60s Pause • Same Seed</div></div>
          <div className="w-9"/>
        </div>

        {screen === 'lobby' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <button onClick={()=>setMode('practice')} className={`rounded-xl p-3 font-black text-xs ${mode==='practice'?'bg-cyan-500 text-slate-950':'bg-slate-800'}`}>Practice</button>
              <button onClick={()=>setMode('pro')} className={`rounded-xl p-3 font-black text-xs ${mode==='pro'?'bg-cyan-500 text-slate-950':'bg-slate-800'}`}>Pro Match</button>
              <button onClick={()=>setMode('multiplayer')} className={`rounded-xl p-3 font-black text-xs ${mode==='multiplayer'?'bg-cyan-500 text-slate-950':'bg-slate-800'}`}>Multiplayer</button>
            </div>
            {mode === 'pro' && <select value={fee} onChange={e=>setFee(Number(e.target.value))} className="w-full bg-slate-800 rounded-xl p-3 font-bold">{(paymentSettings.proMatchFees || [20,30,60,120]).map(f=><option key={f} value={f}>Entry ৳{f}</option>)}</select>}
            {mode === 'multiplayer' && (
              <div className="grid grid-cols-4 gap-2">
                {(paymentSettings.multiplayerProMatches || []).filter(x=>x.active!==false).map(x=><button key={x.id} onClick={()=>{setPlayers(Number(x.players));setFee(Number(x.entryFee));}} className={`rounded-xl p-2 text-xs font-black ${players===Number(x.players)?'bg-cyan-500 text-slate-950':'bg-slate-800'}`}>{x.players}P<br/>৳{x.entryFee}</button>)}
              </div>
            )}
            <button disabled={starting} onClick={()=>mode==='practice'?startPractice():startPaid(mode==='multiplayer'?players:2)} className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 p-4 font-black shadow-xl disabled:opacity-50">{starting?'Starting…':mode==='practice'?'START PRACTICE':`PLAY — ৳${fee}`}</button>
            {message && <div className="rounded-xl bg-rose-950/50 border border-rose-500/30 p-3 text-sm">{message}</div>}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 text-xs text-slate-300 space-y-1">
              <div>🚗 Blue traffic = collision danger</div><div>🪙 Coin = +25 score</div><div>❤️ 3 lives</div>
                                              <div>🏆 Best Practice Score: {bestScore}</div><div>⏸️ Manual/auto pause, maximum 60 seconds</div><div>🏁 Paid match = submit once, then settlement uses existing wallet/history</div>
            </div>
          </div>
        )}

        {screen === 'tournament_rank' && (
        <BlockTournamentRankList
          tournament={tournamentData}
          currentUserId={user?.id}
          loading={tournamentLoading}
          onBackHome={() => {
            sessionStorage.removeItem('skillz_tournament_match_id');
            sessionStorage.removeItem('skillz_tournament_id');
            sessionStorage.removeItem('skillz_tournament_immediate');
            tournamentRef.current = false;
            tournamentStartedRef.current = false;
            setTournamentId('');
            setTournamentData(null);
            setMatchId('');
            setCurrentTab('home');
          }}
          onPlayAgain={handleTournamentPlayAgain}
        />
      )}

      {screen !== 'lobby' && screen !== 'tournament_rank' && (
          <div className="relative mx-auto w-full h-[76vh] max-h-[760px] min-h-[560px] overflow-hidden rounded-3xl border border-slate-700 bg-slate-700 touch-none select-none"
                              onTouchStart={onTouchStart}
                              onTouchEnd={onTouchEnd}>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-600 to-slate-900"/>
            <div className="absolute inset-x-[12%] inset-y-0 bg-slate-500/70"/>
            <div className="traffic-lane absolute top-[-120px] left-[34%] w-2 h-28 rounded bg-white/80"/>
            <div className="traffic-lane absolute top-[-260px] left-[66%] w-2 h-28 rounded bg-white/80"/>
            <div className="absolute z-20 top-3 left-3 right-3 flex items-center justify-between rounded-xl bg-black/60 p-2.5 text-sm font-black">
              <span>🏆 {score}</span><span>🪙 {coins}</span><span>❤️ {'❤️'.repeat(lives)}{'🖤'.repeat(Math.max(0,3-lives))}</span>{mode!=='practice'&&<span>⏱️ {remaining}s</span>}
            </div>
            <button onClick={()=>pausedRef.current?doResume():doPause()} className="absolute z-30 top-16 right-3 rounded-xl bg-black/70 px-3 py-2 font-black text-xs">{pausedRef.current?'▶ RESUME':'⏸ PAUSE'}</button>
            <div ref={rootRef} className="absolute inset-0 overflow-hidden">
              <div ref={carRef} className="absolute z-10 bottom-24 -translate-x-1/2 w-[52px] h-[88px] rounded-[13px] bg-gradient-to-r from-red-700 via-red-400 to-red-700 shadow-lg">
                <div className="absolute left-2 right-2 top-3 h-6 rounded bg-sky-200"/>
                <div className="absolute left-1.5 right-1.5 bottom-2.5 h-3 rounded bg-amber-200"/>
              </div>
            </div>
            <div className="absolute z-30 left-0 right-0 bottom-0 h-28 flex items-center justify-around bg-gradient-to-t from-black/80 to-transparent">
              <button {...button(-1)} className="w-28 h-20 rounded-2xl bg-white/10 border border-white/30 text-4xl font-black">←</button>
              <button {...button(1)} className="w-28 h-20 rounded-2xl bg-white/10 border border-white/30 text-4xl font-black">→</button>
            </div>
            {screen === 'countdown' && <div className="absolute inset-0 z-40 grid place-items-center bg-black/70 text-4xl font-black">GO!</div>}
            {(screen === 'paused' || screen === 'submit' || screen === 'result') && (
              <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/80 p-4 text-center">

                {screen === 'result' && outcome === 'WON' && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {[...Array(18)].map((_, i) => (
                      <span
                        key={i}
                        className="absolute -top-12 text-3xl font-black animate-[fall_2.8s_linear_infinite]"
                        style={{
                          left: `${(i * 17) % 100}%`,
                          animationDelay: `${(i % 6) * 0.25}s`
                        }}
                      >
                        {i % 2 === 0 ? '$' : '💵'}
                      </span>
                    ))}
                  </div>
                )}

                <div className="relative w-full max-w-sm rounded-3xl border-2 border-cyan-400/40 bg-[#0b1228] p-6 shadow-2xl">

                  {screen === 'paused' && (
                    <div className="space-y-4">
                      <div className="text-3xl font-black">⏸ PAUSED</div>
                      <p className="text-sm text-slate-300">{message || `Score ${score}`}</p>
                      <p className="text-xs text-amber-300">Pause used: {pauseUsed}s / 60s</p>
                      <button onClick={doResume} className="rounded-xl bg-cyan-400 px-6 py-3 font-black text-slate-950">
                        RESUME
                      </button>
                    </div>
                  )}

                  {screen === 'submit' && (
                    <div className="space-y-4">
                      <div className="text-3xl font-black">🏁 SUBMIT SCORE</div>
                      <div className="text-2xl font-black text-cyan-300">{score} POINTS</div>
                      <button onClick={submit} className="rounded-xl bg-emerald-500 px-8 py-3 font-black">
                        SUBMIT SCORE
                      </button>
                    </div>
                  )}

                  {screen === 'result' && (
                    <div className="space-y-4">

                      {outcome === 'WON' ? (
                        <>
                          <div className="text-6xl font-black tracking-tight text-yellow-300">
                            YOU WON!
                          </div>
                          <div className="text-lg font-black text-emerald-300">
                            🎉 Congratulations! 🎉
                          </div>
                        </>
                      ) : outcome === 'PENDING' ? (
                        <>
                          <div className="text-4xl font-black text-amber-300">
                            MATCH PENDING
                          </div>
                          <div className="text-sm text-slate-300">
                            Your score has been submitted.
                          </div>
                          <div className="text-2xl font-black text-cyan-300">
                            {score} POINTS
                          </div>
                        </>
                      ) : outcome === 'LOST' ? (
                        <>
                          <div className="text-5xl font-black text-red-400">
                            YOU LOST
                          </div>
                          <div className="text-sm text-slate-300">
                            Better luck next time!
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-5xl font-black text-slate-200">
                            🤝 DRAW
                          </div>
                        </>
                      )}

                      <div className="rounded-2xl bg-white/5 p-3 text-sm">
                        <div className="font-bold text-slate-300">
                          Your Score: <span className="text-white">{score}</span>
                        </div>

                        {opponent?.name && (
                          <div className="mt-1 font-bold text-slate-300">
                            Opponent: {opponent.name} • {opponent.score ?? '?'} pts
                          </div>
                        )}

                        <div className="mt-1 text-xs text-slate-400">
                          Entry Fee: {fee} • Prize: {Math.max(0, Number(paymentSettings.proMatchPrize?.[fee] || 0))}
                        </div>
                      </div>

                      {outcome === 'PENDING' && (
                        <button
                          onClick={() => setHistoryView('pending')}
                          className="w-full rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950"
                        >
                          ⏳ PENDING
                        </button>
                      )}

                      <button
                        onClick={() => setHistoryView('history')}
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-black"
                      >
                        📜 HISTORY
                      </button>

                      <button
                        onClick={resetLobby}
                        className="w-full rounded-xl bg-cyan-400 px-6 py-3 font-black text-slate-950"
                      >
                        PLAY AGAIN
                      </button>

                      {historyView && (
                        <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-left">
                          <div className="mb-2 text-lg font-black">
                            {historyView === 'pending' ? '⏳ MATCH PENDING' : '📜 MATCH HISTORY'}
                          </div>

                          <div className="max-h-48 space-y-2 overflow-y-auto text-xs text-slate-300">
                            {pendingHistory.length === 0 ? (
                              <div className="py-4 text-center text-slate-500">
                                No records found.
                              </div>
                            ) : (
                              pendingHistory.map((item: any, index: number) => (
                                <div key={item?.id || index} className="rounded-xl bg-white/5 p-3">
                                  <div className="font-bold">
                                    {item?.opponentName || item?.userName || 'Match'}
                                  </div>
                                  <div>
                                    Score: {item?.score ?? item?.userScore ?? 0}
                                    {item?.opponentScore != null
                                      ? ` • Opponent: ${item.opponentScore}`
                                      : ''}
                                  </div>
                                  <div className="text-slate-500">
                                    {item?.status || item?.result || 'PENDING'}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          <button
                            onClick={() => setHistoryView(null)}
                            className="mt-3 w-full rounded-xl bg-white/10 px-4 py-2 font-bold"
                          >
                            CLOSE
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

