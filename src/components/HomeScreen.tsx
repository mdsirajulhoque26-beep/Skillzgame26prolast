import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Play, 
  Volume2, 
  Video, 
  Zap,
  Gamepad2,
  Trophy,
  ArrowLeft,
  Share2
} from 'lucide-react';
import { backendApi } from '../services/backendApi';

export const HomeScreen: React.FC = () => {
  const { setCurrentTab, openModal, paymentSettings } = useApp();
  const [games, setGames] = useState<any[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [tournamentLoading, setTournamentLoading] = useState(true);
  const [joiningTournament, setJoiningTournament] = useState<string>('');
  const [selectedTournament, setSelectedTournament] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState<'prizes' | 'rules'>('prizes');

  useEffect(() => {
    let alive = true;
    const loadGames = async () => {
      try { const data = await backendApi.games(); if (alive) setGames(data.games || []); try { const td = await backendApi.tournaments(); if (alive) setTournaments(td.tournaments || []); } catch { if (alive) setTournaments([]); } }
      catch (e) { console.error('Failed to load games:', e); if (alive) setGames([]); }
      finally { if (alive) { setGamesLoading(false); setTournamentLoading(false); } }
    };
    loadGames();
    const timer = window.setInterval(loadGames, 15000);
    return () => { alive = false; window.clearInterval(timer); };
  }, []);


  const joinTournament = async (t:any) => {
    if (joiningTournament) return;
    setJoiningTournament(t.id);
    try {
      const data = await backendApi.joinTournament(t.id);
      sessionStorage.setItem('skillz_tournament_match_id', String(data.match?.id || ''));
      sessionStorage.setItem('skillz_tournament_id', String(t.id));
      setCurrentTab('block_puzzle');
    } catch (e:any) { alert(e?.message || 'Tournament-এ Join করা যায়নি।'); }
    finally { setJoiningTournament(''); }
  };

  return (
    <div className="pb-24 pt-2 px-3 max-w-md mx-auto space-y-4">
      {/* Marquee Notice Bar matching video (00:16, 01:21) */}
      <div className="bg-[#121935] border border-amber-500/30 rounded-xl px-3 py-2 flex items-center gap-2 shadow-md overflow-hidden">
        <div className="flex items-center gap-1 shrink-0 bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-xs font-bold border border-amber-500/30">
          <Volume2 className="w-3.5 h-3.5 animate-pulse" />
          <span>নোটিশঃ</span>
        </div>
        <div className="overflow-hidden whitespace-nowrap w-full text-xs text-slate-200 font-medium">
          <div className="inline-block animate-marquee pl-4">
            {paymentSettings.marqueeNotice || 'Skillzgame — Admin Notice'}
          </div>
        </div>
      </div>

      {/* Admin-managed Multiplayer Pro Matches */}
      {Array.isArray(paymentSettings.multiplayerProMatches) && paymentSettings.multiplayerProMatches.some((m:any)=>m.active!==false && m.showOnHome!==false) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between pt-1"><div className="flex items-center gap-2"><Zap className="w-4 h-4 text-cyan-400"/><h3 className="text-sm font-black text-white">Multiplayer Pro Match</h3></div><span className="text-[10px] text-slate-500">Block Puzzle</span></div>
          {paymentSettings.multiplayerProMatches.filter((m:any)=>m.active!==false && m.showOnHome!==false).sort((a:any,b:any)=>Number(a.displayOrder||0)-Number(b.displayOrder||0)).map((m:any)=>(
            <div key={m.id} onClick={()=>{sessionStorage.setItem('skillz_multiplayer_pro_config', JSON.stringify(m)); setCurrentTab('block_puzzle');}} className="rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/80 via-[#132348] to-indigo-950/90 p-4 cursor-pointer active:scale-[0.99] transition-transform shadow-xl">
              <div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-black tracking-wider text-cyan-300">MULTIPLAYER PRO MATCH</div><h4 className="mt-1 text-lg font-black text-white">{m.name || `${m.players} Players Pro Match`}</h4><p className="mt-1 text-[11px] text-slate-400">{m.players} জন • Full হলে ম্যাচ শুরু হবে</p></div><div className="text-right shrink-0"><div className="text-[10px] text-slate-500">ENTRY</div><b className="text-base text-white">৳{Number(m.entryFee||0).toFixed(0)}</b><div className="text-[10px] text-amber-300">WIN ৳{Number(m.prizeAmount||0).toFixed(0)}</div></div></div>
            </div>
          ))}
        </div>
      )}

      {/* Server-managed Tournaments */}
      {!tournamentLoading && tournaments.length > 0 && <div className="space-y-2">
        <div className="flex items-center justify-between pt-1"><div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400"/><h3 className="text-sm font-black text-white">চলমান Tournament</h3></div><span className="text-[10px] text-slate-500">Block Puzzle</span></div>
        {tournaments.map((t:any)=>{
          const players = Number(t.playerCount || 0);
          const maxPlayers = Number(t.maxPlayers || 0);
          const full = Boolean(t.full) || (maxPlayers > 0 && players >= maxPlayers);
          return (
            <div key={t.id} onClick={() => { setSelectedTournament(t); setDetailTab('prizes'); }} className="overflow-hidden rounded-[24px] border border-white/10 bg-[#111827] shadow-2xl cursor-pointer active:scale-[0.99] transition-transform">
              <div className="relative min-h-[154px] overflow-hidden bg-gradient-to-br from-fuchsia-950 via-purple-950 to-pink-950 p-5">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-fuchsia-400/20 blur-2xl pointer-events-none" />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex rounded-full border border-amber-300/30 bg-black/25 px-2.5 py-1 text-[9px] font-black tracking-wide text-amber-200">🏆 TOURNAMENT</span>
                    <h4 className="mt-2 text-[21px] font-black leading-tight text-white break-words">{t.name}</h4>
                    <p className="mt-1 text-[11px] text-violet-200">Block Puzzle • Daily Challenge</p>
                  </div>
                  <div className="shrink-0 rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-center">
                    <span className="block text-[8px] text-slate-300">PRIZE POOL</span>
                    <b className="text-[17px] text-amber-300">৳{Number(t.prizePool||0).toFixed(0)}</b>
                  </div>
                </div>
              </div>
              <div className="p-3.5">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-[#090f1c] p-2.5 text-center"><span className="block text-[8px] text-slate-500">ENTRY</span><b className="mt-1 block text-[13px] text-white">৳{Number(t.entryFee||0).toFixed(0)}</b></div>
                  <div className="rounded-2xl bg-[#090f1c] p-2.5 text-center"><span className="block text-[8px] text-slate-500">PLAYERS</span><b className="mt-1 block text-[13px] text-white">{players}/{maxPlayers}</b></div>
                  <div className="rounded-2xl bg-[#090f1c] p-2.5 text-center"><span className="block text-[8px] text-slate-500">STATUS</span><b className={`mt-1 block text-[13px] ${full ? 'text-amber-300' : 'text-emerald-400'}`}>{full ? 'FULL' : 'LIVE'}</b></div>
                </div>
                <div className="mt-2.5 flex items-center justify-between rounded-2xl border border-white/10 bg-[#080d18] px-3 py-2.5">
                  <div><b className="block text-[11px] text-white">Limited Players</b><small className="text-[9px] text-slate-500">Admin নির্ধারিত সর্বোচ্চ Player</small></div>
                  <b className="text-[11px] text-slate-200">{players} / {maxPlayers}</b>
                </div>
                <button onClick={(e)=>{ e.stopPropagation(); if (!full || Boolean(t.joined)) joinTournament(t); }} disabled={joiningTournament===t.id || (full && !Boolean(t.joined))} className="mt-2.5 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-sm font-black text-slate-950 shadow-lg disabled:opacity-50">{joiningTournament===t.id?'Joining…':(full&&!t.joined)?'TOURNAMENT FULL':t.joined?'PLAY AGAIN':'PLAY NOW'}</button>
              </div>
            </div>
          );
        })}
      </div>}


      {selectedTournament && (
        <div className="fixed inset-0 z-[90] bg-[#070a12] overflow-y-auto">
          <div className="mx-auto min-h-screen w-full max-w-md px-3 pb-6 pt-3">
            <div className="flex items-center justify-between gap-2">
              <button onClick={()=>setSelectedTournament(null)} className="rounded-xl bg-[#182033] px-3 py-2 text-white"><ArrowLeft className="h-4 w-4" /></button>
              <span className="text-xs font-black text-white">Tournament</span>
              <button onClick={()=>{ try { if (navigator.share) navigator.share({title:selectedTournament.name,text:`${selectedTournament.name} • Block Puzzle Tournament`}); } catch {} }} className="rounded-xl bg-[#182033] p-2 text-white"><Share2 className="h-4 w-4" /></button>
            </div>

            <div className="relative mt-3 overflow-hidden rounded-[22px] bg-gradient-to-br from-purple-950 via-fuchsia-950 to-pink-950 p-5">
              <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-fuchsia-400/20 blur-3xl" />
              <span className="relative inline-flex rounded-full border border-amber-300/30 bg-black/25 px-2.5 py-1 text-[9px] font-black tracking-wide text-amber-200">🏆 TOURNAMENT</span>
              <h1 className="relative mt-3 break-words text-2xl font-black text-white">{selectedTournament.name}</h1>
              <p className="relative mt-1 text-xs text-violet-200">Block Puzzle Daily Challenge</p>
              <div className="relative mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-black/25 p-2 text-center"><small className="block text-[8px] text-slate-300">ENTRY</small><b className="text-sm text-white">৳{Number(selectedTournament.entryFee||0).toFixed(0)}</b></div>
                <div className="rounded-xl bg-black/25 p-2 text-center"><small className="block text-[8px] text-slate-300">PLAYERS</small><b className="text-sm text-white">{Number(selectedTournament.playerCount||0)}/{Number(selectedTournament.maxPlayers||0)}</b></div>
                <div className="rounded-xl bg-black/25 p-2 text-center"><small className="block text-[8px] text-slate-300">PRIZE</small><b className="text-sm text-amber-300">৳{Number(selectedTournament.prizePool||0).toFixed(0)}</b></div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-[#101827] p-1">
              <button onClick={()=>setDetailTab('prizes')} className={`rounded-xl py-2.5 text-xs font-black ${detailTab==='prizes'?'bg-amber-500 text-slate-950':'text-slate-400'}`}>PRIZES</button>
              <button onClick={()=>setDetailTab('rules')} className={`rounded-xl py-2.5 text-xs font-black ${detailTab==='rules'?'bg-amber-500 text-slate-950':'text-slate-400'}`}>RULES</button>
            </div>

            {detailTab==='prizes' ? (
              <div className="mt-3 rounded-[20px] bg-[#111827] p-4">
                <div className="mb-2 text-[10px] font-black tracking-wide text-slate-500">TOURNAMENT PLAYERS</div>
                {Array.from({ length: Math.max(0, Number(selectedTournament.maxPlayers || 0)) }, (_, i) => {
                  const e = (selectedTournament.entries || [])[i];
                  const slot = i + 1;
                  return e ? (
                    <div key={`player-${e.userId || slot}`} className="flex items-center gap-3 border-b border-white/5 py-3 last:border-0">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-purple-900/70 flex items-center justify-center text-sm font-black text-white">
                        {(e.avatarUrl||e.profilePhoto||e.photoUrl) ? <img src={e.avatarUrl||e.profilePhoto||e.photoUrl} className="h-full w-full object-cover" /> : <span>{String(e.username||'P').slice(0,1).toUpperCase()}</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-black text-white truncate">{e.rank===1?'🥇':e.rank===2?'🥈':e.rank===3?'🥉':`${slot}.`} {e.username}</div>
                        <div className="text-[9px] text-slate-500">ID: {e.userId}</div>
                      </div>
                      <div className="text-right"><div className="text-[9px] text-slate-500">PRIZE</div><b className="text-sm text-amber-300">৳{Number(e.prize||0).toFixed(0)}</b></div>
                    </div>
                  ) : (
                    <div key={`empty-${slot}`} className="flex items-center gap-3 border-b border-white/5 py-3 last:border-0">
                      <div className="h-10 w-10 shrink-0 rounded-full border border-dashed border-slate-700 bg-[#0b1220] flex items-center justify-center text-xs font-black text-slate-600">{slot}</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-600">খালি Player Slot</div>
                        <div className="text-[9px] text-slate-700">Player-এর জন্য অপেক্ষা করছে</div>
                      </div>
                      <div className="text-right"><div className="text-[9px] text-slate-700">STATUS</div><b className="text-[10px] text-slate-600">EMPTY</b></div>
                    </div>
                  );
                })}
                {Number(selectedTournament.maxPlayers || 0) === 0 && <div className="py-5 text-center text-xs text-slate-500">Admin এখনো Player Limit সেট করেনি।</div>}
              </div>
            ) : (
              <div className="mt-3 rounded-[20px] bg-[#111827] p-4 text-sm leading-6 text-slate-300">
                <p>• Tournament-এ Admin নির্ধারিত সংখ্যক Player অংশ নিতে পারবে।</p>
                <p>• Entry Fee অনুযায়ী অংশগ্রহণের সময় আপনার Wallet থেকে টাকা কাটা হবে।</p>
                <p>• Tournament পূর্ণ হলে নতুন Player আর Join করতে পারবে না।</p>
                <p>• ফলাফল ও Prize Distribution Tournament-এর নিয়ম অনুযায়ী হবে।</p>
              </div>
            )}

            <button onClick={()=>joinTournament(selectedTournament)} disabled={joiningTournament===selectedTournament.id || (Boolean(selectedTournament.full) && !Boolean(selectedTournament.joined))} className="mt-4 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-sm font-black text-slate-950 shadow-xl disabled:opacity-50">{joiningTournament===selectedTournament.id?'Joining…':(selectedTournament.full&&!selectedTournament.joined)?'TOURNAMENT FULL':selectedTournament.joined?'PLAY AGAIN':`PLAY — ৳${Number(selectedTournament.entryFee||0).toFixed(0)} ENTRY`}</button>
          </div>
        </div>
      )}

      {/* Server-managed Games */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2"><Gamepad2 className="w-4 h-4 text-cyan-400" /><h3 className="text-sm font-black text-white">গেমস</h3></div>
        <span className="text-[10px] text-slate-500">Admin থেকে পরিচালিত</span>
      </div>

      {gamesLoading && (
        <div className="bg-[#121935] border border-indigo-900/60 rounded-2xl p-5 text-center text-xs text-slate-400">গেম লোড হচ্ছে…</div>
      )}

      {!gamesLoading && games.length === 0 && (
        <div className="bg-[#121935] border border-indigo-900/60 rounded-2xl p-6 text-center text-xs text-slate-400">এখন কোনো গেম Home-এ প্রকাশ করা হয়নি।</div>
      )}

      {games.map((game) => {
        const playable = ['block_puzzle','pool','carrom'].includes(game.gameType);
        return (
          <div key={game.id} onClick={() => playable && setCurrentTab(game.gameType === 'pool' ? 'pool' : game.gameType === 'carrom' ? 'carrom' : 'block_puzzle')} className={`bg-gradient-to-r from-blue-950/90 via-[#182352] to-purple-950/90 border-2 rounded-2xl p-4 flex items-center justify-between shadow-2xl relative overflow-hidden ${playable ? 'border-cyan-400/80 cursor-pointer hover:border-cyan-300 active:scale-[0.99]' : 'border-indigo-800/70'}`}>
            <div className="absolute top-0 right-1/4 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3.5 z-10 min-w-0">
              <div className="w-13 h-13 shrink-0 rounded-2xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-500 p-0.5 shadow-lg flex items-center justify-center">
                {game.imageUrl ? <img src={game.imageUrl} alt="" className="w-full h-full object-cover rounded-[14px]" /> : <div className="w-full h-full bg-[#0d1222] rounded-[14px] flex items-center justify-center text-2xl">{game.icon || '🎮'}</div>}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-black text-white text-base truncate">{game.name}</h4>
                  {playable && <span className="bg-cyan-500 text-slate-950 text-[9.5px] font-black px-1.5 py-0.2 rounded-md shadow-sm uppercase tracking-wide flex items-center gap-0.5"><Zap className="w-2.5 h-2.5 fill-current" /> PLAYABLE</span>}
                </div>
                <p className="text-xs text-cyan-300 font-bold mt-0.5">{game.description || 'নতুন গেম'}</p>
                <span className="text-[11px] text-slate-300 block mt-0.5">Entry ৳{Number(game.entryFee || 0).toFixed(0)} • Prize ৳{Number(game.prizeAmount || 0).toFixed(0)}</span>
              </div>
            </div>
            <button disabled={!playable} onClick={(e) => { e.stopPropagation(); if (playable) setCurrentTab(game.gameType === 'pool' ? 'pool' : game.gameType === 'carrom' ? 'carrom' : 'block_puzzle'); }} className={`font-black text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 z-10 ${playable ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950' : 'bg-slate-700/70 text-slate-400 cursor-not-allowed'}`}>
              <Play className="w-4 h-4 fill-current" /> <span>{playable ? 'Play' : 'শীঘ্রই'}</span>
            </button>
          </div>
        );
      })}

      {/* Quick Menu Grid */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          id="quick-wallet-btn"
          onClick={() => setCurrentTab('wallet')}
          className="bg-[#121935] hover:bg-[#182145] border border-indigo-900/60 rounded-xl p-2.5 flex flex-col items-center text-center transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center text-amber-400 mb-1">
            💰
          </div>
          <span className="text-xs font-bold text-white">ওয়ালেট</span>
          <span className="text-[10px] text-slate-400">ডিপোজিট / উইথড্র</span>
        </button>

        <button
          id="quick-transactions-btn"
          onClick={() => setCurrentTab('transactions')}
          className="bg-[#121935] hover:bg-[#182145] border border-indigo-900/60 rounded-xl p-2.5 flex flex-col items-center text-center transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-blue-400/10 flex items-center justify-center text-blue-400 mb-1">
            📜
          </div>
          <span className="text-xs font-bold text-white">লেনদেন</span>
          <span className="text-[10px] text-slate-400">হিস্ট্রি দেখুন</span>
        </button>

        <button
          id="quick-leaderboard-btn"
          onClick={() => openModal('leaderboard')}
          className="bg-[#121935] hover:bg-[#182145] border border-indigo-900/60 rounded-xl p-2.5 flex flex-col items-center text-center transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-purple-400/10 flex items-center justify-center text-purple-400 mb-1">
            👑
          </div>
          <span className="text-xs font-bold text-white">টপ প্লেয়ার</span>
          <span className="text-[10px] text-slate-400">লিডারবোর্ড</span>
        </button>
      </div>

      {/* Rules and Video Tutorial Banner */}
      <div className="bg-[#10162e] border border-indigo-950 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-slate-300">খেলা শিখতে ও ভিডিও দেখতে চান?</span>
        </div>
        <button
          id="home-tutorials-btn"
          onClick={() => openModal('video_tutorials')}
          className="text-xs font-bold text-amber-400 hover:underline"
        >
          ভিডিও দেখুন ›
        </button>
      </div>
    </div>
  );
};
