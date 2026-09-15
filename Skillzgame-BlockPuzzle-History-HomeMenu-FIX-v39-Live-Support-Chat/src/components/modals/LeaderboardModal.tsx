import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Trophy, X, Crown, RefreshCw } from 'lucide-react';
import { backendApi } from '../../services/backendApi';

export const LeaderboardModal: React.FC = () => {
  const { activeModal, closeModal, user } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const load = async () => { try { setLoading(true); setData(await backendApi.activeBlockPuzzleLeaderboard()); } catch (e) { console.error(e); setData({ leaderboard: null }); } finally { setLoading(false); } };
  useEffect(() => { if (activeModal !== 'leaderboard') return; load(); const t = window.setInterval(load, 10000); return () => window.clearInterval(t); }, [activeModal]);
  if (activeModal !== 'leaderboard') return null;
  const board = data?.leaderboard; const entries = board?.entries || [];
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
    <div id="leaderboard-modal-box" className="w-full max-w-sm bg-[#121935] border border-amber-500/50 rounded-2xl p-5 shadow-2xl relative text-white my-6 max-h-[85vh] flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-indigo-900 mb-4">
        <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400"><Trophy className="w-4 h-4" /></div><div><h3 className="text-base font-bold text-white">Top Players</h3><p className="text-[10px] text-slate-400">{board?.name || '৩ দিনের Leaderboard'}</p></div></div>
        <div className="flex gap-1"><button onClick={load} className="w-7 h-7 rounded-full bg-indigo-950 text-slate-400 flex items-center justify-center"><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /></button><button id="leaderboard-close-btn" onClick={closeModal} className="w-7 h-7 rounded-full bg-indigo-950 text-slate-400 hover:text-white flex items-center justify-center"><X className="w-4 h-4" /></button></div>
      </div>
      {!board ? <div className="py-12 text-center text-sm text-slate-400">এই মুহূর্তে কোনো Active Leaderboard নেই।</div> : <>
        <div className="grid grid-cols-2 gap-2 mb-4"><div className="bg-[#0b1022] rounded-xl p-2.5"><div className="text-[10px] text-slate-400">প্রতি WIN</div><div className="font-black text-amber-400">{board.winPoints} Points</div></div><div className="bg-[#0b1022] rounded-xl p-2.5"><div className="text-[10px] text-slate-400">শেষ হবে</div><div className="font-bold text-emerald-400 text-[11px]">{new Date(board.endsAt).toLocaleString('bn-BD')}</div></div></div>
        {entries.length === 0 ? <div className="py-12 text-center text-xs text-slate-500">এখনও কোনো WIN নেই।</div> : <div className="flex-1 overflow-y-auto space-y-2">{entries.map((e:any)=><div key={e.userId} className={`bg-[#0b1022] border rounded-xl p-3 flex items-center justify-between ${e.userId === user?.id ? 'border-amber-500/70' : 'border-indigo-950'}`}><div className="flex items-center gap-3"><span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${e.rank===1?'bg-amber-400 text-slate-950':e.rank===2?'bg-slate-300 text-slate-950':e.rank===3?'bg-amber-700 text-white':'bg-indigo-950 text-slate-300'}`}>#{e.rank}</span>{e.rank===1&&<Crown className="w-4 h-4 text-amber-400"/>}<div><h4 className="text-xs font-bold text-white">{e.username}{e.userId===user?.id?' (আপনি)':''}</h4><p className="text-[10px] text-slate-400">{e.wins} WIN • {e.points} Points</p></div></div><div className="text-right"><div className="text-xs font-black text-amber-400">{e.points} pts</div><div className="text-[10px] text-emerald-400">Prize ৳{e.prize || 0}</div></div></div>)}</div>}
      </>}
    </div>
  </div>;
};
