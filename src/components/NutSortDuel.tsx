import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Clock3, RotateCcw, Undo2, Plus, Swords, Wallet, Send, Trophy, XCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

type Color = 'red' | 'blue' | 'yellow' | 'green';
type Tube = Color[];

const COLORS: Color[] = ['red','blue','yellow','green'];
const COLOR_HEX: Record<Color,string> = { red:'#ef4444', blue:'#3b82f6', yellow:'#facc15', green:'#22c55e' };

function seededShuffle<T>(items:T[], seed:number) {
  const a=[...items];
  let x=(Number(seed)||1234567)>>>0;
  const rnd=()=>{ x=(1664525*x+1013904223)>>>0; return x/4294967296; };
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function makeBoard(seed:number): Tube[] {
  const nuts=seededShuffle(COLORS.flatMap(c=>[c,c,c]), seed);
  return [nuts.slice(0,3),nuts.slice(3,6),nuts.slice(6,9),nuts.slice(9,12),[],[],[]];
}
function solved(tubes:Tube[]) {
  const non=tubes.filter(t=>t.length);
  return non.length===4 && non.every(t=>t.length===3 && t.every(c=>c===t[0]));
}

export const NutSortDuel: React.FC = () => {
  const { user, setCurrentTab, startBlockPuzzleMatch, submitBlockPuzzleResult, getBlockPuzzleMatchStatus, refundBlockPuzzleMatch } = useApp();
  const [entryFee,setEntryFee]=useState(20);
  const [prize,setPrize]=useState(35);
  const [balance,setBalance]=useState(Number(user.gamingBalance||0));
  const [matchId,setMatchId]=useState('');
  const [seed,setSeed]=useState(0);
  const [startedAt,setStartedAt]=useState<string|null>(null);
  const [timeLeft,setTimeLeft]=useState(180);
  const [tubes,setTubes]=useState<Tube[]>(()=>makeBoard(1234567));
  const [selected,setSelected]=useState<number|null>(null);
  const [score,setScore]=useState(0);
  const [moves,setMoves]=useState(0);
  const [undoLeft,setUndoLeft]=useState(2);
  const [history,setHistory]=useState<Tube[][][]>([]);
  const [status,setStatus]=useState<'lobby'|'playing'|'submitted'|'result'>('lobby');
  const [message,setMessage]=useState('');
  const [outcome,setOutcome]=useState<'WON'|'LOST'|'DRAW'|'PENDING'|null>(null);
  const [opponentScore,setOpponentScore]=useState<number|null>(null);
  const autoSubmitted=useRef(false);

  useEffect(()=>{ setBalance(Number(user.gamingBalance||0)); },[user.gamingBalance]);

  const loadGameConfig=useCallback(async()=>{
    try {
      const r=await fetch('/api/games',{headers:{Authorization:`Bearer ${localStorage.getItem('skillz_api_token')||''}`}});
      if(!r.ok) return;
      const d=await r.json(); const g=(d.games||[]).find((x:any)=>x.gameType==='nut_sort');
      if(g){setEntryFee(Number(g.entryFee||20));setPrize(Number(g.prizeAmount||35));}
    } catch {}
  },[]);
  useEffect(()=>{loadGameConfig();},[loadGameConfig]);

  const start=async()=>{
    setMessage('');
    const r=await startBlockPuzzleMatch(entryFee,prize,2,'nut_sort');
    if(!r.success){setMessage(r.message);return;}
    setMatchId(String(r.matchId||'')); setSeed(Number(r.gameSeed||Date.now())); setStartedAt(r.gameStartedAt||r.startsAt||new Date().toISOString());
    setTubes(makeBoard(Number(r.gameSeed||Date.now()))); setSelected(null); setScore(0); setMoves(0); setUndoLeft(2); setHistory([]); setStatus('playing'); setTimeLeft(180); autoSubmitted.current=false;
  };

  const doSubmit=useCallback(async()=>{
    if(!matchId || autoSubmitted.current) return;
    autoSubmitted.current=true;
    const r=await submitBlockPuzzleResult(matchId,score,prize);
    if(!r.success){autoSubmitted.current=false;setMessage(r.message);return;}
    const m=r.match;
    setStatus(m?.status==='COMPLETED'?'result':'submitted');
    setOutcome(m?.outcome||'PENDING');
    setOpponentScore(m?.opponent?.score ?? null);
    setMessage(m?.status==='COMPLETED' ? '' : 'স্কোর জমা হয়েছে। Opponent-এর score-এর জন্য অপেক্ষা করুন।');
  },[matchId,score,prize,submitBlockPuzzleResult]);

  useEffect(()=>{
    if(status!=='playing' || !startedAt) return;
    const id=window.setInterval(()=>{
      const remaining=Math.max(0,Math.ceil((Date.parse(startedAt)+180000-Date.now())/1000));
      setTimeLeft(remaining);
      if(remaining<=0) doSubmit();
    },250);
    return()=>window.clearInterval(id);
  },[status,startedAt,doSubmit]);

  useEffect(()=>{
    if(!matchId || (status!=='submitted' && status!=='playing')) return;
    const id=window.setInterval(async()=>{
      try{
        const m=await getBlockPuzzleMatchStatus(matchId);
        if(!m)return;
        if(m.status==='COMPLETED'){
          setOutcome(m.outcome||'PENDING');setOpponentScore(m.opponent?.score??null);setStatus('result');setMessage('');
        } else if(m.status==='SUBMITTED'){
          setOutcome('PENDING');setOpponentScore(m.opponent?.score??null);setStatus('submitted');
        }
      }catch{}
    },1500);
    return()=>window.clearInterval(id);
  },[matchId,status,getBlockPuzzleMatchStatus]);

  const tap=(i:number)=>{
    if(status!=='playing')return;
    if(selected===null){ if(tubes[i].length) setSelected(i); return; }
    if(selected===i){setSelected(null);return;}
    const from=tubes[selected], to=tubes[i];
    const color=from[from.length-1];
    if(to.length>=3 || (to.length && to[to.length-1]!==color)){setSelected(i);return;}
    const next=tubes.map(t=>[...t]); const moved=next[selected].pop() as Color;
    next[i].push(moved);
    // Move the whole top color run when possible.
    while(next[selected].length && next[selected][next[selected].length-1]===color && next[i].length<3) next[i].push(next[selected].pop() as Color);
    setHistory(h=>[...h,tubes.map(t=>[...t])].slice(-10)); setTubes(next); setMoves(v=>v+1); setScore(v=>v+25); setSelected(null);
    if(solved(next)) setTimeout(doSubmit,250);
  };

  const undo=()=>{
    if(undoLeft<=0 || !history.length || status!=='playing')return;
    const prev=history[history.length-1]; setTubes(prev.map(t=>[...t])); setHistory(h=>h.slice(0,-1));setUndoLeft(v=>v-1);setMoves(v=>Math.max(0,v-1));setScore(v=>Math.max(0,v-25));setSelected(null);
  };
  const resetBoard=()=>{ if(status==='playing'){setTubes(makeBoard(seed));setSelected(null);setHistory([]);setScore(0);setMoves(0);setUndoLeft(2);} };

  const cancel=async()=>{ if(matchId && status==='playing'){const r=await refundBlockPuzzleMatch(matchId,entryFee,'Player cancelled Nut Sort test'); if(!r.success){setMessage(r.message);return;}} setMatchId('');setStatus('lobby');setOutcome(null);setMessage(''); };
  const back=async()=>{ if(status==='playing'){await cancel();} setCurrentTab('home'); };

  const resultTitle=outcome==='WON'?'VICTORY':outcome==='LOST'?'DEFEAT':outcome==='DRAW'?'DRAW':'SCORE SUBMITTED';

  if(status==='lobby') return <div className="min-h-screen bg-[radial-gradient(circle_at_50%_20%,#34205f,#15102d_72%)] px-3 py-4 pb-24">
    <div className="max-w-md mx-auto space-y-4">
      <div className="flex items-center justify-between"><button onClick={()=>setCurrentTab('home')} className="p-2 rounded-xl bg-blue-700 text-white"><ArrowLeft className="w-5 h-5"/></button><div className="text-center"><div className="text-[10px] text-cyan-300 font-black">1v1 PRO MATCH</div><h1 className="text-xl font-black">🔩 NUT SORT</h1></div><div className="w-9"/></div>
      <div className="rounded-3xl border border-indigo-500/40 bg-[#0d1430]/90 p-5 shadow-2xl">
        <div className="text-center"><Swords className="mx-auto w-9 h-9 text-amber-400"/><h2 className="mt-2 text-lg font-black">Nut Sort 1v1</h2><p className="text-xs text-slate-400 mt-1">Level নেই • ৩ মিনিট • Score বনাম Opponent</p></div>
        <div className="grid grid-cols-2 gap-3 mt-5"><div className="rounded-2xl bg-[#080d20] p-3 text-center"><span className="text-[10px] text-slate-500">ENTRY</span><b className="block text-xl text-white">৳{entryFee}</b></div><div className="rounded-2xl bg-[#080d20] p-3 text-center"><span className="text-[10px] text-slate-500">WIN PRIZE</span><b className="block text-xl text-amber-300">৳{prize}</b></div></div>
        <div className="mt-3 text-center text-xs text-slate-400">Gaming Balance: <b className="text-white">৳{balance.toFixed(2)}</b></div>
        {message && <div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-3">{message}</div>}
        <button onClick={start} className="mt-5 w-full rounded-2xl py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-slate-950 font-black flex items-center justify-center gap-2"><Swords className="w-5 h-5"/> START 1v1 MATCH</button>
      </div>
    </div>
  </div>;

  return <div className="min-h-screen bg-[radial-gradient(circle_at_50%_20%,#34205f,#15102d_72%)] text-white px-2 py-3 pb-24 select-none">
    <div className="max-w-md mx-auto">
      <div className="flex items-center justify-between px-1"><button onClick={back} className="w-10 h-10 rounded-xl bg-blue-700 grid place-items-center"><ArrowLeft className="w-5 h-5"/></button><div className="text-center"><div className="text-[9px] text-cyan-300 font-black">1v1 PRO MATCH</div><div className="text-sm font-black">🔩 NUT SORT</div></div><div className="px-3 py-2 rounded-xl bg-[#17142f] border border-indigo-500/60 font-black tabular-nums flex items-center gap-1"><Clock3 className="w-4 h-4 text-cyan-300"/>{String(Math.floor(timeLeft/60)).padStart(2,'0')}:{String(timeLeft%60).padStart(2,'0')}</div></div>
      <div className="mt-2 flex items-center justify-center gap-5 text-xs"><span>Score <b className="text-amber-300">{score}</b></span><span>Moves <b className="text-cyan-300">{moves}</b></span></div>
      <div className="mt-4 grid grid-cols-3 gap-x-2 gap-y-5 px-3 items-end">
        {tubes.map((tube,i)=><div key={i} onClick={()=>tap(i)} className={`relative h-36 rounded-[22px] border-4 ${selected===i?'border-cyan-300 -translate-y-1':'border-slate-400'} bg-gradient-to-r from-slate-600 via-slate-200 to-slate-500 shadow-[inset_0_4px_8px_#fff8,inset_0_-10px_12px_#0008,0_8px_12px_#0008] flex flex-col-reverse items-center py-2 cursor-pointer`}>
          {tube.map((c,j)=><div key={j} className="w-[64px] h-7 my-[2px] rounded-lg border-2 border-slate-700 shadow-[inset_0_4px_4px_#fff8,inset_0_-5px_6px_#0007,0_3px_4px_#0008]" style={{background:`linear-gradient(#ffffff77,#0002),${COLOR_HEX[c]}`}}><div className="mx-auto mt-[5px] w-10 h-2 rounded-full bg-slate-900 shadow-inner"/></div>)}
          {!tube.length && <div className="absolute top-3 w-12 h-5 rounded-full border-2 border-dashed border-slate-500/70"/>}
        </div>)}
      </div>
      <div className="mt-5 flex justify-center gap-4"><button onClick={resetBoard} className="w-16 h-14 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-800 border border-blue-300/40 shadow-lg"><RotateCcw className="mx-auto"/></button><button onClick={undo} className="relative w-16 h-14 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-800 border border-blue-300/40 shadow-lg"><Undo2 className="mx-auto"/><span className="absolute -right-1 -top-2 bg-emerald-500 text-slate-950 rounded-lg px-2 text-[10px] font-black">{undoLeft}</span></button><button onClick={()=>setScore(v=>v+50)} className="relative w-16 h-14 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-800 border border-blue-300/40 shadow-lg"><Plus className="mx-auto"/><span className="absolute -right-1 -top-2 bg-emerald-500 text-slate-950 rounded-lg px-2 text-[10px] font-black">1</span></button></div>
      <button onClick={doSubmit} disabled={status!=='playing'} className="mt-5 w-full rounded-2xl py-3 bg-emerald-500 text-slate-950 font-black flex items-center justify-center gap-2 disabled:opacity-40"><Send className="w-4 h-4"/> SUBMIT SCORE</button>
      {status==='submitted' && <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-center text-xs text-amber-200">স্কোর জমা হয়েছে। Opponent-এর score আসলে result হবে। {opponentScore!==null && <b>Opponent: {opponentScore}</b>}</div>}
      {status==='result' && <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"><div className="w-full max-w-sm rounded-3xl bg-[#10152e] border border-indigo-500 p-6 text-center"><div className="text-5xl">{outcome==='WON'?'🏆':outcome==='LOST'?'❌':'🤝'}</div><h2 className="mt-2 text-4xl font-black">{resultTitle}</h2><div className="mt-3 text-sm text-slate-300">Your Score <b className="text-amber-300">{score}</b></div>{opponentScore!==null&&<div className="text-sm text-slate-300">Opponent <b className="text-cyan-300">{opponentScore}</b></div>}<button onClick={()=>{setMatchId('');setStatus('lobby');setOutcome(null);setMessage('');loadGameConfig();}} className="mt-5 w-full py-3 rounded-2xl bg-blue-600 font-black">PLAY AGAIN</button></div></div>}
    </div>
  </div>;
};
