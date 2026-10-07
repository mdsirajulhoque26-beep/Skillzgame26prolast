import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Pause, Play, RotateCcw, Trophy, Coins, Heart, Car, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';

type Mode = 'practice' | 'pro' | 'multiplayer';
type Item = { id:number; x:number; y:number; coin:boolean; el:HTMLDivElement };

const MATCH_MS = 180000;
const MAX_PAUSE_MS = 60000;
const LANES = [25, 50, 75];

function seeded(seed:number) {
  let s = (Math.floor(seed) || 1) >>> 0;
  return () => {
    s += 0x6D2B79F5;
    let t = s;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export const TrafficDodgeGame: React.FC = () => {
  const { user, setCurrentTab, paymentSettings, startBlockPuzzleMatch, getBlockPuzzleMatchStatus, pauseBlockPuzzleMatch, resumeBlockPuzzleMatch, submitBlockPuzzleResult } = useApp();
  const [mode, setMode] = useState<Mode>('practice');
  const [fee, setFee] = useState(Number(paymentSettings.proMatchFees?.[0] || 20));
  const [players, setPlayers] = useState(2);
  const [screen, setScreen] = useState<'lobby'|'countdown'|'playing'|'paused'|'submit'|'result'>('lobby');
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [remaining, setRemaining] = useState(180);
  const [pauseUsed, setPauseUsed] = useState(0);
  const [matchId, setMatchId] = useState('');
  const [matchSeed, setMatchSeed] = useState(1);
  const [opponent, setOpponent] = useState<any>(null);
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
    clearObjects();
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
    livesRef.current -= 1;
    setLives(livesRef.current);
    clearObjects();
    xRef.current = 50; paintCar();
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
    const speed = Math.min(12, 5 + scoreRef.current / 220);
    if (spawnRef.current > 620) { spawnRef.current = 0; spawn(); }

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
    window.setTimeout(() => {
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
    pausedRef.current = false; pauseStartedRef.current = 0; lastRef.current = performance.now();
    setScreen('playing'); rafRef.current = requestAnimationFrame(loop);
  }, [finishLocal, loop, matchId, resumeBlockPuzzleMatch]);

  const submit = useCallback(async () => {
    runningRef.current = false; pausedRef.current = false; cancelAnimationFrame(rafRef.current);
    if (!matchId) { setScreen('result'); setMessage(`Score ${scoreRef.current} • ${coinsRef.current} coins`); return; }
    const r = await submitBlockPuzzleResult(matchId, scoreRef.current, 0);
    if (!r.success) { setMessage(r.message); setScreen('submit'); return; }
    setScreen('result'); setMessage(`Score ${scoreRef.current} submitted successfully.`);
  }, [matchId, submitBlockPuzzleResult]);

  useEffect(() => {
    const raw = sessionStorage.getItem('skillz_multiplayer_pro_config');
    if (raw) {
      try {
        const cfg = JSON.parse(raw);
        if (Number(cfg.players) >= 3) { setMode('multiplayer'); setPlayers(Number(cfg.players)); setFee(Number(cfg.entryFee || fee)); }
      } catch {}
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    if (!matchId || screen === 'lobby' || mode === 'practice') return;
    const timer = window.setInterval(async () => {
      const m = await getBlockPuzzleMatchStatus(matchId);
      if (!m) return;
      if (m.opponent) setOpponent(m.opponent);
      if (m.status === 'COMPLETED') {
        runningRef.current = false;
        setOpponent(m.opponent || null);
        setScreen('result');
        setMessage(m.outcome === 'WON' ? '🏆 You won!' : m.outcome === 'DRAW' ? '🤝 Draw' : 'Result completed');
      }
    }, 2000);
    return () => window.clearInterval(timer);
  }, [getBlockPuzzleMatchStatus, matchId, mode, screen]);

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
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      <div className="max-w-md mx-auto p-3 space-y-3">
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

        {screen !== 'lobby' && (
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
              <div className="absolute inset-0 z-50 grid place-items-center bg-black/75 p-6 text-center">
                <div className="space-y-3"><div className="text-3xl font-black">{screen==='paused'?'⏸ PAUSED':screen==='result'?'🏆 RESULT':'🏁 SUBMIT SCORE'}</div><p className="text-sm text-slate-300">{message || `Score ${score}`}</p>{screen==='paused'&&<p className="text-xs text-amber-300">Pause used: {pauseUsed}s / 60s</p>}{screen==='paused'&&<button onClick={doResume} className="rounded-xl bg-cyan-400 text-slate-950 px-6 py-3 font-black">RESUME</button>}{screen==='submit'&&<button onClick={submit} className="rounded-xl bg-emerald-500 px-6 py-3 font-black">SUBMIT SCORE</button>}{screen==='result'&&<><div className="text-xs text-slate-400">{opponent?.name ? `Opponent: ${opponent.name} • ${opponent.score ?? '?'} pts` : 'Settlement is processing.'}</div><button onClick={resetLobby} className="rounded-xl bg-cyan-400 text-slate-950 px-6 py-3 font-black">PLAY AGAIN</button></>}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

