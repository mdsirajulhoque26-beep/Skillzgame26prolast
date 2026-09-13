import React from 'react';
import { ArrowLeft, RotateCcw, Trophy, Users } from 'lucide-react';

interface Props {
  tournament: any;
  currentUserId?: string;
  loading?: boolean;
  onBackHome: () => void;
  onPlayAgain: () => void;
}

export const BlockTournamentRankList: React.FC<Props> = ({ tournament, currentUserId, loading, onBackHome, onPlayAgain }) => {
  const entries = Array.isArray(tournament?.entries) ? tournament.entries : [];
  const me = entries.find((e:any) => e.userId === currentUserId);
  const ended = tournament?.status === 'ENDED';
  return (
    <div className="min-h-screen bg-[#070b18] text-white px-3 pt-3 pb-24 max-w-md mx-auto space-y-3">
      <div className="flex items-center justify-between bg-[#0e162f] px-3 py-2.5 rounded-2xl border border-indigo-900/80">
        <button onClick={onBackHome} className="flex items-center gap-1 text-slate-300 text-xs font-bold"><ArrowLeft className="w-4 h-4 text-amber-400"/> Home</button>
        <span className="text-xs font-black text-amber-300">TOURNAMENT RANK</span>
      </div>
      <div className="bg-gradient-to-br from-amber-950/70 via-[#151a39] to-purple-950/70 border border-amber-500/40 rounded-2xl p-4">
        <h2 className="text-lg font-black">🏆 {tournament?.name || 'Tournament'}</h2>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="bg-[#0b1022] rounded-xl p-2"><Users className="w-4 h-4 mx-auto text-cyan-300"/><div className="text-lg font-black">{entries.length}/{tournament?.maxPlayers || 0}</div><div className="text-[9px] text-slate-400">Unique Players</div></div>
          <div className="bg-[#0b1022] rounded-xl p-2"><Trophy className="w-4 h-4 mx-auto text-amber-300"/><div className="text-lg font-black">{me?.rank || '—'}</div><div className="text-[9px] text-slate-400">Your Rank</div></div>
          <div className="bg-[#0b1022] rounded-xl p-2"><div className="text-[11px] text-slate-400">Your Best</div><div className="text-lg font-black text-amber-300">{me?.score || 0}</div><div className="text-[9px] text-slate-400">Points</div></div>
        </div>
        {ended && <div className="mt-3 text-center text-xs font-black text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl py-2">Tournament শেষ — Prize payout সম্পন্ন হয়েছে।</div>}
      </div>
      <div className="bg-[#0e162f] border border-indigo-900/80 rounded-2xl p-3">
        <div className="flex items-center justify-between mb-2"><h3 className="font-black">Rank List</h3><span className="text-[10px] text-slate-400">Entry ৳{Number(tournament?.entryFee||0)}</span></div>
        {loading ? <div className="py-8 text-center text-slate-400 text-xs">Rank List লোড হচ্ছে…</div> : entries.length === 0 ? <div className="py-8 text-center text-slate-400 text-xs">এখনও কোনো Player Submit করেনি।</div> : <div className="space-y-2 max-h-[58vh] overflow-y-auto">{entries.map((e:any)=><div key={e.userId} className={`rounded-xl p-3 border ${e.userId===currentUserId?'border-amber-400/60 bg-amber-500/10':'border-indigo-950 bg-[#0b1022]'}`}><div className="flex items-center gap-2"><div className="w-9 h-9 rounded-full bg-indigo-900/80 flex items-center justify-center font-black text-amber-300">#{e.rank}</div><div className="min-w-0 flex-1"><div className="font-black text-sm truncate">{e.username}{e.userId===currentUserId?' (You)':''}</div><div className="text-[10px] text-slate-400">Attempts: {e.attempts}</div></div><div className="text-right"><div className="font-mono font-black text-amber-300">{e.score}</div><div className="text-[9px] text-slate-400">pts</div></div></div>{Number(e.prize||0)>0&&<div className="mt-2 text-[10px] text-emerald-300">Prize: ৳{Number(e.prize).toFixed(0)}</div>}</div>)}</div>}
      </div>
      {!ended && <button onClick={onPlayAgain} disabled={loading} className="w-full py-3 bg-amber-500 text-slate-950 font-black rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"><RotateCcw className="w-4 h-4"/> PLAY AGAIN — Entry ৳{Number(tournament?.entryFee||0)}</button>}
      <button onClick={onBackHome} className="w-full py-2.5 bg-[#121935] border border-indigo-900 text-slate-300 font-bold rounded-xl">হোমে ফিরুন</button>
    </div>
  );
};
