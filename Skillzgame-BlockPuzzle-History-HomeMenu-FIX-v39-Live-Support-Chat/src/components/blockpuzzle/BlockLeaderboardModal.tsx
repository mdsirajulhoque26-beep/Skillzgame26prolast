import React, { useEffect, useState } from 'react';
import { X, Trophy, Crown, RefreshCw } from 'lucide-react';
import { backendApi } from '../../services/backendApi';

interface Props { currentUserId: string; onClose: () => void; }

export const BlockLeaderboardModal: React.FC<Props> = ({ currentUserId, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setLoading(true); setData(await backendApi.activeBlockPuzzleLeaderboard()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); const t = window.setInterval(load, 10000); return () => window.clearInterval(t); }, []);
  const board = data?.leaderboard;
  const entries = board?.entries || [];
  const status = board?.status === 'ENDED' ? 'শেষ হয়েছে' : 'চলছে';
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div className="bg-[#0e162f] border border-indigo-500/60 rounded-3xl p-5 max-w-sm w-full shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between border-b border-indigo-900/80 pb-3">
        <div className="flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-400"/><div><h3 className="font-black text-white text-base">LEADERBOARD</h3><p className="text-[10px] text-slate-400">{board?.name || 'বর্তমান ৩ দিনের Leaderboard'}</p></div></div>
        <div className="flex gap-1"><button onClick={load} className="w-8 h-8 rounded-full bg-[#141b38] flex items-center justify-center text-slate-400"><RefreshCw className="w-4 h-4"/></button><button onClick={onClose} className="w-8 h-8 rounded-full bg-[#141b38] flex items-center justify-center text-slate-400"><X className="w-4 h-4"/></button></div>
      </div>
      {loading && !board ? <div className="py-12 text-center text-sm text-slate-400">Leaderboard লোড হচ্ছে...</div> : !board ? <div className="py-12 text-center text-sm text-slate-400">এই মুহূর্তে কোনো Active Leaderboard নেই।</div> : <>
        <div className="mt-3 grid grid-cols-2 gap-2"><div className="bg-[#121935] rounded-xl p-2.5"><div className="text-[10px] text-slate-400">WIN =</div><div className="font-black text-amber-400">{board.winPoints} Points</div></div><div className="bg-[#121935] rounded-xl p-2.5"><div className="text-[10px] text-slate-400">Status</div><div className="font-black text-emerald-400">{status}</div></div></div>
        <div className="mt-3 space-y-1.5">{entries.length === 0 ? <div className="py-10 text-center text-xs text-slate-500">এখনও কোনো WIN নেই।</div> : entries.map((e:any) => <div key={e.userId} className={`p-2.5 rounded-xl border flex items-center justify-between ${e.userId === currentUserId ? 'border-amber-500/60 bg-amber-500/10' : 'border-indigo-950 bg-[#121832]'}`}><div className="flex items-center gap-2.5"><span className="font-black text-xs text-slate-400 w-6 text-center">#{e.rank}</span>{e.rank === 1 && <Crown className="w-4 h-4 text-amber-400"/>}<div><div className="text-xs font-bold text-white truncate max-w-[150px]">{e.username}</div><div className="text-[9px] text-slate-400">{e.wins} WIN</div></div></div><div className="text-right"><div className="text-sm font-black text-amber-400">{e.points} pts</div><div className="text-[9px] text-slate-500">Prize ৳{e.prize || 0}</div></div></div>)}</div>
      </>}
    </div>
  </div>;
};
