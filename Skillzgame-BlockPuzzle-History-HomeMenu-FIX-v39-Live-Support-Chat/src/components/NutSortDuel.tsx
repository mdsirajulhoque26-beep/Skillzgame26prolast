import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Clock3, RotateCcw, Undo2, Swords, Wallet, Send, History, Trophy, ShieldCheck, Plus, HelpCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BlockPendingMatchesModal, PendingMatchItem } from './blockpuzzle/BlockPendingMatchesModal';
import { BlockMatchHistoryModal } from './blockpuzzle/BlockMatchHistoryModal';

type Color = 'red' | 'blue' | 'yellow' | 'green';
type Tube = Color[];
const COLORS: Color[] = ['red','blue','yellow','green'];
const COLOR_HEX: Record<Color,string> = { red:'#ef4444', blue:'#3b82f6', yellow:'#facc15', green:'#22c55e' };
const MATCH_SECONDS = 180;

function seededShuffle<T>(items:T[], seed:number) {
  const a=[...items]; let x=(Number(seed)||1234567)>>>0;
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
  const { user, setCurrentTab, startBlockPuzzleMatch, submitBlockPuzzleResult, getBlockPuzzleMatchStatus, refundBlockPuzzleMatch, getMyPendingGames } = useApp();
  const [entryFee,setEntryFee]=useState(20); const [prize,setPrize]=useState(35);
  const [balance,setBalance]=useState(Number(user.gamingBalance||0));
  const [matchId,setMatchId]=useState(''); const [seed,setSeed]=useState(0); const [startedAt,setStartedAt]=useState<string|null>(null);
  const [timeLeft,setTimeLeft]=useState(MATCH_SECONDS); const [tubes,setTubes]=useState<Tube[]>(()=>makeBoard(1234567));
  const [selected,setSelected]=useState<number|null>(null); const [score,setScore]=useState(0); const [moves,setMoves]=useState(0);
  const [undoLeft,setUndoLeft]=useState(2); const [history,setHistory]=useState<Tube[][][]>([]);
  const [status,setStatus]=useState<'lobby'|'playing'|'submitted'|'result'>('lobby');
  const [message,setMessage]=useState(''); const [outcome,setOutcome]=useState<'WON'|'LOST'|'DRAW'|'PENDING'|null>(null);
  const [opponentScore,setOpponentScore]=useState<number|null>(null);
  const [pendingMatches,setPendingMatches]=useState<PendingMatchItem[]>([]);
  const [showPending,setShowPending]=useState(false); const [showHistory,setShowHistory]=useState(false);
  const autoSubmitted=useRef(false);

  useEffect(()=>setBalance(Number(user.gamingBalance||0)),[user.gamingBalance]);
  const loadGameConfig=useCallback(async()=>{
    try { const r=await fetch('/api/games',{headers:{Authorization:`Bearer ${localStorage.getItem('skillz_api_token')||''}`}}); if(!r.ok)return;
      const d=await r.json(); const g=(d.games||[]).find((x:any)=>x.gameType==='nut_sort');
      if(g){setEntryFee(Number(g.entryFee||20));setPrize(Number(g.prizeAmount||35));}
    } catch {}
  },[]);
  useEffect(()=>{void loadGameConfig();},[loadGameConfig]);

  const mapPending=useCallback((items:any[]):PendingMatchItem[] => (items||[]).map((m:any)=>{
    const raw=String(m.status||'').toUpperCase();
    const st=raw==='COMPLETED' ? (m.outcome==='WON'?'WON':m.outcome==='LOST'?'LOST':m.outcome==='DRAW'?'DRAW':'PENDING') : (raw==='TOURNAMENT'?'TOURNAMENT':'PENDING');
    return { id:String(m.id), userId:String(user?.id||''), userName:String(user?.name||''), entryFee:Number(m.entryFee||0), prize:Number(m.prizeAmount||0), score:Number(m.score||0), linesCleared:Number(m.linesCleared||0), bestCombo:Number(m.bestCombo||0), date:m.createdAt?new Date(m.createdAt).toLocaleString('en-GB'):'', status:st as any, mode:m.gameType==='nut_sort'?'🔩 Nut Sort 1v1':m.type==='TOURNAMENT_MATCH'?'🏆 Tournament':'⚔️ Pro Match', opponentName:m.opponent?.name||undefined, opponentScore:m.opponent?.score==null?undefined:Number(m.opponent.score) };
  }),[user?.id,user?.name]);
  const refreshMatches=useCallback(async()=>{
    try {
      const items=await getMyPendingGames();
      // Nut Sort has its own Pending/History section. Only show Nut Sort
      // sessions here, never Block Puzzle or other game records.
      const nutOnly=(items||[]).filter((m:any)=>String(m.gameType||'').toLowerCase()==='nut_sort');
      setPendingMatches(mapPending(nutOnly));
    } catch {}
  },[getMyPendingGames,mapPending]);
  useEffect(()=>{void refreshMatches(); const t=window.setInterval(()=>void refreshMatches(),5000); return()=>window.clearInterval(t);},[refreshMatches]);

  const stats={
    completed:pendingMatches.filter(m=>['WON','LOST','DRAW'].includes(m.status)).length,
    wins:pendingMatches.filter(m=>m.status==='WON').length,
    losses:pendingMatches.filter(m=>m.status==='LOST').length,
    best:pendingMatches.reduce((n,m)=>Math.max(n,Number(m.score||0)),0),
    streak:0,
  };
  let streak=0; for(const m of pendingMatches.filter(m=>['WON','LOST','DRAW'].includes(m.status))){if(m.status==='WON')streak++;else break;} stats.streak=streak;

  const start=async()=>{
    setMessage('');
    if(balance<entryFee){setMessage('অপর্যাপ্ত গেমিং ব্যালেন্স। আগে Wallet থেকে Deposit করুন।');return;}
    const r=await startBlockPuzzleMatch(entryFee,prize,2,'nut_sort');
    if(!r.success){setMessage(r.message);return;}
    const id=String(r.matchId||''); const s=Number(r.gameSeed||Date.now());
    setMatchId(id);setSeed(s);setStartedAt(r.gameStartedAt||r.startsAt||new Date().toISOString());setTubes(makeBoard(s));
    setSelected(null);setScore(0);setMoves(0);setUndoLeft(2);setHistory([]);setOutcome(null);setOpponentScore(null);setStatus('playing');setTimeLeft(MATCH_SECONDS);autoSubmitted.current=false;
  };

  const doSubmit=useCallback(async()=>{
    if(!matchId || autoSubmitted.current || status!=='playing')return;
    autoSubmitted.current=true;
    const r=await submitBlockPuzzleResult(matchId,score,prize);
    if(!r.success){autoSubmitted.current=false;setMessage(r.message);return;}
    const m=r.match; setOutcome(m?.status==='COMPLETED' ? (m.outcome||'PENDING') : 'PENDING');
    setOpponentScore(m?.opponent?.score==null?null:Number(m.opponent.score));
    setStatus(m?.status==='COMPLETED'?'result':'submitted'); setMessage(m?.status==='COMPLETED'?'':'স্কোর জমা হয়েছে। প্রতিপক্ষের স্কোরের জন্য অপেক্ষা করুন।');
    void refreshMatches();
  },[matchId,score,prize,status,submitBlockPuzzleResult,refreshMatches]);

  useEffect(()=>{if(status!=='playing'||!startedAt)return; const id=window.setInterval(()=>{const rem=Math.max(0,Math.ceil((Date.parse(startedAt)+MATCH_SECONDS*1000-Date.now())/1000));setTimeLeft(rem);if(rem<=0)void doSubmit();},250);return()=>window.clearInterval(id);},[status,startedAt,doSubmit]);
  useEffect(()=>{if(!matchId||(status!=='submitted'&&status!=='playing'))return; const id=window.setInterval(async()=>{try{const m=await getBlockPuzzleMatchStatus(matchId);if(!m)return;if(m.status==='COMPLETED'){setOutcome(m.outcome||'PENDING');setOpponentScore(m.opponent?.score==null?null:Number(m.opponent.score));setStatus('result');setMessage('');void refreshMatches();}else if(m.status==='SUBMITTED'){setOutcome('PENDING');setOpponentScore(m.opponent?.score==null?null:Number(m.opponent.score));setStatus('submitted');void refreshMatches();}}catch{}},1500);return()=>window.clearInterval(id);},[matchId,status,getBlockPuzzleMatchStatus,refreshMatches]);

  const tap=(i:number)=>{
    if(status!=='playing')return;
    if(selected===null){if(tubes[i].length)setSelected(i);return;}
    if(selected===i){setSelected(null);return;}
    const from=tubes[selected],to=tubes[i]; const color=from[from.length-1];
    if(to.length>=3 || (to.length&&to[to.length-1]!==color)){setSelected(i);return;}
    const next=tubes.map(t=>[...t]);
    while(next[selected].length&&next[selected][next[selected].length-1]===color&&next[i].length<3)next[i].push(next[selected].pop() as Color);
    setHistory(h=>[...h,tubes.map(t=>[...t])].slice(-10));setTubes(next);setMoves(v=>v+1);setScore(v=>v+25);setSelected(null);
    if(solved(next))window.setTimeout(()=>void doSubmit(),250);
  };
  const undo=()=>{if(undoLeft<=0||!history.length||status!=='playing')return;const prev=history[history.length-1];setTubes(prev.map(t=>[...t]));setHistory(h=>h.slice(0,-1));setUndoLeft(v=>v-1);setMoves(v=>Math.max(0,v-1));setScore(v=>Math.max(0,v-25));setSelected(null);};
  const reset=()=>{if(status!=='playing')return;setTubes(makeBoard(seed));setSelected(null);setHistory([]);setScore(0);setMoves(0);setUndoLeft(2);};
  const cancel=async()=>{if(matchId&&status==='playing'){const r=await refundBlockPuzzleMatch(matchId,entryFee,'Player cancelled Nut Sort match');if(!r.success){setMessage(r.message);return;}}setMatchId('');setStatus('lobby');setOutcome(null);setMessage('');void refreshMatches();};
  const back=async()=>{if(status==='playing')await cancel();setCurrentTab('home');};
  const historyRows=pendingMatches.map(m=>({id:m.id,mode:m.mode||'🔩 Nut Sort 1v1',opponentName:m.opponentName,userScore:m.score,opponentScore:m.opponentScore,result:m.status==='WON'?'WIN':m.status==='LOST'?'LOSS':m.status==='DRAW'?'DRAW':m.status==='TOURNAMENT'?'TOURNAMENT':'PENDING',lines:m.linesCleared,date:m.date} as any));
  const activePending=pendingMatches.filter(m=>m.status==='PENDING').length;

  if(status==='lobby') return <div className="min-h-screen bg-[#070b18] text-white pb-24 px-3 py-2"><div className="max-w-md mx-auto space-y-3.5">
    <div className="flex items-center justify-between bg-[#0e162f] px-3.5 py-2.5 rounded-2xl border border-indigo-900/80"><button onClick={()=>setCurrentTab('home')} className="flex items-center gap-1 text-slate-300 text-xs font-bold"><ArrowLeft className="w-4 h-4 text-amber-400"/>হোমে ফিরুন</button><div className="flex items-center gap-2"><button onClick={()=>alert('Nut Sort 1v1: Entry fee কেটে ম্যাচ শুরু হবে। ৩ মিনিটে যত বেশি valid move/score করবেন, তত ভালো। Submit/সময় শেষ হলে score lock হবে। দুইজনের score-এর মধ্যে বেশি score জয়ী।')} className="p-1.5 rounded-lg bg-indigo-900/40 border border-indigo-700/60"><HelpCircle className="w-4 h-4 text-indigo-300"/></button></div></div>
    <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950 via-[#151c3d] to-purple-950 rounded-2xl border-2 border-indigo-500/40 p-4 shadow-xl"><div className="flex items-center justify-between"><div><div className="flex items-center gap-1.5"><span className="text-2xl">🔩</span><h2 className="text-lg font-black">NUT SORT 1v1</h2></div><p className="text-[11px] text-amber-300 font-medium">৩ মিনিট • Score vs Opponent • Level নেই</p></div><button onClick={()=>setShowHistory(true)} className="p-2 rounded-xl bg-indigo-900/60 border border-indigo-700/60"><History className="w-4 h-4 text-cyan-400"/></button></div><div className="grid grid-cols-4 gap-2 bg-[#090e21]/70 p-2.5 rounded-xl border border-indigo-900/60 mt-3"><div className="text-center"><span className="text-[9px] text-slate-400 block">WALLET</span><b className="text-xs text-emerald-400">৳{balance.toFixed(0)}</b></div><div className="text-center"><span className="text-[9px] text-slate-400 block">BEST</span><b className="text-xs text-amber-400">{stats.best}</b></div><div className="text-center"><span className="text-[9px] text-slate-400 block">WIN STREAK</span><b className="text-xs text-red-400">{stats.streak}</b></div><div className="text-center"><span className="text-[9px] text-slate-400 block">PLAYED</span><b className="text-xs text-cyan-300">{stats.completed}</b></div></div></div>
    <button onClick={()=>setShowPending(true)} className="w-full bg-gradient-to-r from-amber-950/80 via-[#182147] to-indigo-950/80 border border-amber-500/50 p-2.5 rounded-2xl flex items-center justify-between"><div className="flex items-center gap-2"><Clock3 className="w-5 h-5 text-amber-400"/><div className="text-left"><div className="text-xs font-bold">Nut Sort • পেন্ডিং ও হিস্ট্রি {activePending>0&&<span className="ml-1 bg-amber-500 text-slate-950 px-1.5 rounded-full">{activePending}</span>}</div><span className="text-[10px] text-slate-400">স্কোর ও ফলাফল দেখতে এখানে ট্যাপ করুন</span></div></div><span className="text-amber-400 text-xs font-bold">View</span></button>
    <div className="bg-gradient-to-r from-red-950/70 via-[#172045] to-indigo-950/80 border-2 border-amber-500/60 rounded-2xl p-4 shadow-xl space-y-3.5"><div className="flex items-center justify-between"><div><div className="flex items-center gap-2"><span className="text-xl">⚔️</span><h3 className="text-base font-black">এন্ট্রি ফি ম্যাচ</h3></div><p className="text-[11px] text-amber-300 font-bold">এন্ট্রি ফি দিন • Play চাপলেই গেম শুরু</p></div><button onClick={()=>setCurrentTab('wallet')} className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40"><Plus className="w-4 h-4 text-emerald-400"/></button></div><div className="bg-[#090e21]/80 p-3 rounded-xl border border-indigo-900/60 text-[10.5px] text-slate-300"><div className="flex items-center gap-1.5 text-amber-300 font-bold"><ShieldCheck className="w-3.5 h-3.5"/> ম্যাচ ফ্লো</div><p className="mt-1 leading-relaxed">১. Entry Fee দেখুন → ২. PLAY NOW চাপুন → ৩. টাকা কেটে সঙ্গে সঙ্গে Nut Sort শুরু → ৪. ৩ মিনিটে score করুন → ৫. Submit/সময় শেষ → ৬. Opponent-এর score-এর সাথে ফলাফল।</p></div><div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-[#090e21] p-3 text-center"><span className="text-[9px] text-slate-400 block">ENTRY FEE</span><b className="text-2xl text-white">৳{entryFee}</b></div><div className="rounded-xl bg-[#090e21] p-3 text-center"><span className="text-[9px] text-slate-400 block">WIN PRIZE</span><b className="text-2xl text-amber-300">৳{prize}</b></div></div>{message&&<div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-3">{message}</div>}<button onClick={start} className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 active:scale-95"><Swords className="w-5 h-5"/>PLAY NOW — ENTRY ৳{entryFee}</button></div>
  </div></div>;

  return <div className="min-h-screen bg-[#070b18] text-white px-2 py-2 pb-24 select-none"><div className="max-w-md mx-auto"><div className="flex items-center justify-between px-1"><button onClick={back} className="w-10 h-10 rounded-xl bg-blue-700 grid place-items-center"><ArrowLeft className="w-5 h-5"/></button><div className="text-center"><div className="text-[9px] text-cyan-300 font-black">1v1 PRO MATCH</div><div className="text-sm font-black">🔩 NUT SORT</div></div><div className="px-3 py-2 rounded-xl bg-[#17142f] border border-indigo-500/60 font-black tabular-nums flex items-center gap-1"><Clock3 className="w-4 h-4 text-cyan-300"/>{String(Math.floor(timeLeft/60)).padStart(2,'0')}:{String(timeLeft%60).padStart(2,'0')}</div></div><div className="mt-2 flex items-center justify-center gap-5 text-xs"><span>Score <b className="text-amber-300">{score}</b></span><span>Moves <b className="text-cyan-300">{moves}</b></span></div><div className="mt-4 grid grid-cols-3 gap-x-2 gap-y-5 px-3 items-end">{tubes.map((tube,i)=><button type="button" key={i} onClick={()=>tap(i)} className={`relative h-36 rounded-[22px] border-4 ${selected===i?'border-cyan-300 -translate-y-1':'border-slate-400'} bg-gradient-to-r from-slate-600 via-slate-200 to-slate-500 shadow-[inset_0_4px_8px_#fff8,inset_0_-10px_12px_#0008,0_8px_12px_#0008] flex flex-col-reverse items-center py-2 cursor-pointer touch-manipulation`}>{tube.map((c,j)=><div key={j} className="w-[64px] h-7 my-[2px] rounded-lg border-2 border-slate-700 shadow-[inset_0_4px_4px_#fff8,inset_0_-5px_6px_#0007,0_3px_4px_#0008]" style={{background:`linear-gradient(#ffffff77,#0002),${COLOR_HEX[c]}`}}><div className="mx-auto mt-[5px] w-10 h-2 rounded-full bg-slate-900 shadow-inner"/></div>)}{!tube.length&&<div className="absolute top-3 w-12 h-5 rounded-full border-2 border-dashed border-slate-500/70"/>}</button>)}</div><div className="mt-5 flex justify-center gap-4"><button onClick={reset} className="w-16 h-14 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-800 border border-blue-300/40 shadow-lg"><RotateCcw className="mx-auto"/></button><button onClick={undo} className="relative w-16 h-14 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-800 border border-blue-300/40 shadow-lg"><Undo2 className="mx-auto"/><span className="absolute -right-1 -top-2 bg-emerald-500 text-slate-950 rounded-lg px-2 text-[10px] font-black">{undoLeft}</span></button></div><button onClick={()=>void doSubmit()} disabled={status!=='playing'} className="mt-5 w-full rounded-2xl py-3 bg-emerald-500 text-slate-950 font-black flex items-center justify-center gap-2 disabled:opacity-40"><Send className="w-4 h-4"/>SUBMIT SCORE</button>{message&&status==='playing'&&<div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-3 text-center">{message}</div>}{status==='submitted'&&<div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-center text-xs text-amber-200">স্কোর জমা হয়েছে। প্রতিপক্ষের score-এর জন্য অপেক্ষা করুন। {opponentScore!==null&&<b>Opponent: {opponentScore}</b>}</div>}{status==='result'&&<div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"><div className="w-full max-w-sm rounded-3xl bg-[#10152e] border border-indigo-500 p-6 text-center"><div className="text-5xl">{outcome==='WON'?'🏆':outcome==='LOST'?'❌':'🤝'}</div><h2 className="mt-2 text-4xl font-black">{outcome==='WON'?'VICTORY':outcome==='LOST'?'DEFEAT':'DRAW'}</h2><div className="mt-3 text-sm text-slate-300">Your Score <b className="text-amber-300">{score}</b></div>{opponentScore!==null&&<div className="text-sm text-slate-300">Opponent <b className="text-cyan-300">{opponentScore}</b></div>}<button onClick={()=>{setMatchId('');setStatus('lobby');setOutcome(null);setMessage('');void loadGameConfig();void refreshMatches();}} className="mt-5 w-full py-3 rounded-2xl bg-blue-600 font-black">PLAY AGAIN</button></div></div>}</div>
  {showPending&&<BlockPendingMatchesModal pendingMatches={pendingMatches} onClose={()=>setShowPending(false)} onRefresh={refreshMatches}/>} {showHistory&&<BlockMatchHistoryModal matches={historyRows} onClose={()=>setShowHistory(false)}/>}</div>;
};
