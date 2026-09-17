import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { History, Trophy, Swords, Medal, RefreshCw, ArrowLeft, Gamepad2, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { backendApi } from '../services/backendApi';

type Filter = 'ALL' | 'PRO' | 'TOURNAMENT' | 'OTHER';

const money = (n: any) => `৳${Number(n || 0).toFixed(0)}`;

const getOutcome = (m: any) => {
  const status = String(m?.status || '').toUpperCase();
  const outcome = String(m?.outcome || '').toUpperCase();
  if (outcome === 'WON' || outcome === 'WIN') return 'WIN';
  if (outcome === 'LOST' || outcome === 'LOSS') return 'LOSS';
  if (outcome === 'DRAW') return 'DRAW';
  if (status === 'REFUNDED') return 'REFUNDED';
  return '';
};

const getCategory = (m: any): Filter => {
  const gt = String(m?.gameType || '').toLowerCase();
  const type = String(m?.type || '').toUpperCase();
  if (type.includes('TOURNAMENT') || gt.includes('tournament') || m?.tournamentId) return 'TOURNAMENT';
  if (type === 'MATCH' || type === 'PRO_MATCH' || type === 'DUEL' || !gt || gt === 'block_puzzle') return 'PRO';
  return 'OTHER';
};

const gameLabel = (m: any) => {
  const gt = String(m?.gameType || '').toLowerCase();
  if (getCategory(m) === 'TOURNAMENT') return `🏆 ${m?.title || 'Tournament'}`;
  if (gt === 'nut_sort') return '🔩 Nut Sort 1v1';
  if (typeIsArcade(m)) return `🎮 ${m?.title || 'Online Match'}`;
  return `⚔️ ${m?.title || 'Pro Match'}`;
};

const typeIsArcade = (m: any) => {
  const type = String(m?.type || '').toUpperCase();
  return type === 'ARCADE_MATCH';
};

export const HistoryScreen: React.FC = () => {
  const { getMyPendingGames, setCurrentTab } = useApp();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [error, setError] = useState('');
  const [complaintMatch, setComplaintMatch] = useState<any | null>(null);
  const [problemType, setProblemType] = useState('NETWORK');
  const [details, setDetails] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await Promise.race([
        getMyPendingGames(),
        new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error('History request timeout')), 18000)),
      ]);
      const seen = new Map<string, any>();
      for (const item of data || []) {
        const id = String(item?.matchId || item?.id || '');
        if (id) seen.set(id, { ...(seen.get(id) || {}), ...item });
      }
      setItems(Array.from(seen.values()));
    } catch (e) {
      console.warn('History load failed', e);
      setItems([]);
      setError('History লোড করা যাচ্ছে না। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  }, [getMyPendingGames]);

  // AppContext refreshes the user every few seconds. Do not restart the
  // history request every time the context object/function identity changes;
  // doing so kept this screen stuck on the loading spinner on slower APIs.
  useEffect(() => {
    void load();
    // Intentionally run once when the History screen mounts. The refresh
    // button calls load() explicitly when the user wants a fresh result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completed = useMemo(() => {
    const tournamentGroups = new Map<string, any>();
    const regular: any[] = [];

    for (const m of items) {
      const isTournament = getCategory(m) === 'TOURNAMENT';

      if (!isTournament) {
        const status = String(m?.status || '').toUpperCase();
        if (['COMPLETED', 'FINISHED', 'REFUNDED'].includes(status) || Boolean(getOutcome(m))) {
          regular.push(m);
        }
        continue;
      }

      if (String(m?.tournamentStatus || '').toUpperCase() != 'ENDED') continue;
      if (String(m?.tournamentStatus || '').toUpperCase() != 'ENDED') continue;
      const tournamentKey = String(m?.tournamentId || m?.id || '');
      if (!tournamentKey) continue;

      const existing = tournamentGroups.get(tournamentKey);
      if (!existing || Number(m?.score || 0) > Number(existing?.score || 0)) {
        tournamentGroups.set(tournamentKey, m);
      } else if (m?.tournamentStatus === 'ENDED' && existing?.tournamentStatus !== 'ENDED') {
        tournamentGroups.set(tournamentKey, { ...existing, tournamentStatus: 'ENDED' });
      }
    }

    return [...regular, ...Array.from(tournamentGroups.values())]
      .sort((a, b) => {
        const da = Date.parse(a?.completedAt || a?.settledAt || a?.updatedAt || a?.createdAt || '') || 0;
        const db = Date.parse(b?.completedAt || b?.settledAt || b?.updatedAt || b?.createdAt || '') || 0;
        return db - da;
      });
  }, [items]);

  const visible = useMemo(() => {
    if (filter === 'ALL') return completed;
    return completed.filter((m) => getCategory(m) === filter);
  }, [completed, filter]);

  const submitComplaint = async () => {
    if (!complaintMatch || !details.trim()) return;
    setSubmittingComplaint(true);
    try {
      await backendApi.createMatchDispute({ matchId: String(complaintMatch.matchId || complaintMatch.id), problemType, details: details.trim() });
      setComplaintMatch(null);
      setDetails('');
      setProblemType('NETWORK');
      window.alert('আপনার অভিযোগ সফলভাবে জমা হয়েছে। Admin এটি Match record দেখে review করবে।');
    } catch (e:any) {
      window.alert(e?.message || 'অভিযোগ জমা দেওয়া যায়নি।');
    } finally { setSubmittingComplaint(false); }
  };

  const stats = useMemo(() => ({
    total: completed.length,
    wins: completed.filter(m => getOutcome(m) === 'WIN').length,
    losses: completed.filter(m => getOutcome(m) === 'LOSS').length,
    draws: completed.filter(m => getOutcome(m) === 'DRAW').length,
  }), [completed]);

  return (
    <div className="min-h-screen bg-[#0a0e1c] text-white pb-5">
      <div className="sticky top-0 z-30 bg-[#08152c] border-b border-indigo-950/80 px-3 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentTab('home')} className="w-10 h-10 rounded-xl bg-[#151f39] flex items-center justify-center text-slate-200">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-300" />
            <h1 className="text-lg font-black">MATCH HISTORY</h1>
          </div>
          <button onClick={load} disabled={loading} className="w-10 h-10 rounded-xl bg-[#151f39] flex items-center justify-center text-cyan-300 disabled:opacity-50">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-500 mt-1">আপনার সম্পূর্ণ ম্যাচের রেকর্ড</p>
      </div>

      <div className="px-3 pt-3">
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-xl border border-white/5 bg-[#111a31] p-2 text-center"><b className="block text-base">{stats.total}</b><span className="text-[9px] text-slate-500">TOTAL</span></div>
          <div className="rounded-xl border border-emerald-500/10 bg-[#111a31] p-2 text-center"><b className="block text-base text-emerald-400">{stats.wins}</b><span className="text-[9px] text-slate-500">WON</span></div>
          <div className="rounded-xl border border-red-500/10 bg-[#111a31] p-2 text-center"><b className="block text-base text-red-400">{stats.losses}</b><span className="text-[9px] text-slate-500">LOST</span></div>
          <div className="rounded-xl border border-amber-500/10 bg-[#111a31] p-2 text-center"><b className="block text-base text-amber-300">{stats.draws}</b><span className="text-[9px] text-slate-500">DRAW</span></div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1 rounded-xl bg-[#111827] p-1">
          {([
            ['ALL', 'সব'],
            ['PRO', 'Pro Match'],
            ['TOURNAMENT', 'Tournament'],
            ['OTHER', 'অন্যান্য'],
          ] as [Filter, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} className={`rounded-lg py-2 text-[10px] font-black ${filter === key ? 'bg-cyan-400 text-slate-950' : 'text-slate-400'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="px-4 py-16 text-center text-sm text-slate-500">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-cyan-400" />
          <p className="mt-3">History লোড হচ্ছে…</p>
        </div>
      ) : error ? (
        <div className="mx-3 mt-4 rounded-2xl border border-red-900/60 bg-[#111935] px-5 py-14 text-center">
          <RefreshCw className="w-12 h-12 mx-auto text-red-400" />
          <div className="mt-3 font-black text-red-300">{error}</div>
          <button onClick={load} className="mt-4 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950">আবার চেষ্টা করুন</button>
        </div>
      ) : visible.length === 0 ? (
        <div className="mx-3 mt-4 rounded-2xl border border-indigo-900/60 bg-[#111935] px-5 py-14 text-center">
          <Trophy className="w-12 h-12 mx-auto text-slate-600" />
          <div className="mt-3 font-black text-slate-300">কোনো ম্যাচ হিস্টোরি পাওয়া যায়নি</div>
          <div className="mt-1 text-xs text-slate-500">ম্যাচ সম্পূর্ণ হলে এখানে তার ফলাফল দেখা যাবে।</div>
        </div>
      ) : (
        <div className="px-3 py-4 space-y-3">
          {visible.map((m, i) => {
            const result = getOutcome(m);
            const win = result === 'WIN';
            const loss = result === 'LOSS';
            const draw = result === 'DRAW';
            const refunded = result === 'REFUNDED';
            const opponent = m?.opponent?.name || m?.opponentName || 'Opponent';
            const myScore = Number(m?.score ?? m?.userScore ?? 0);
            const oppScore = Number(m?.opponent?.score ?? m?.opponentScore ?? 0);
            const entry = Number(m?.entryFee || 0);
            const prize = Number(m?.prizeAmount ?? m?.prize ?? 0);
            const dateValue = m?.completedAt || m?.updatedAt || m?.createdAt;
            const date = dateValue ? new Date(dateValue).toLocaleString('en-GB') : '—';

            return (
              <div key={String(m?.matchId || m?.id || i)} className="overflow-hidden rounded-2xl border border-indigo-900/70 bg-[#121b36] shadow-lg">
                <div className="px-3 pt-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-[#0a1225] border border-cyan-500/20 flex items-center justify-center shrink-0">
                      {getCategory(m) === 'TOURNAMENT' ? <Medal className="w-6 h-6 text-amber-300" /> : getCategory(m) === 'PRO' ? <Swords className="w-6 h-6 text-cyan-300" /> : <Gamepad2 className="w-6 h-6 text-purple-300" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-cyan-300 truncate">{gameLabel(m)}</div>
                      <div className="font-black text-white truncate">{opponent === 'Opponent' ? 'Match Result' : `VS ${opponent}`}</div>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-lg px-2 py-1 text-[9px] font-black ${win ? 'bg-emerald-400/15 text-emerald-300' : loss ? 'bg-red-400/15 text-red-300' : draw ? 'bg-amber-400/15 text-amber-300' : 'bg-slate-400/10 text-slate-300'}`}>
                    {win
                      ? 'WON'
                      : loss
                        ? 'LOST'
                        : draw
                          ? 'DRAW'
                          : refunded
                            ? 'REFUNDED'
                            : getCategory(m) === 'TOURNAMENT' && String(m?.tournamentStatus || '').toUpperCase() !== 'ENDED'
                              ? 'IN PROGRESS'
                              : 'COMPLETED'}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 px-3">
                  <div className="rounded-xl bg-[#0b1222] p-2 text-center">
                    <span className="block text-[8px] text-slate-500">YOUR SCORE</span>
                    <b className="block mt-1 text-sm text-cyan-300">{myScore}</b>
                  </div>
                  <div className="rounded-xl bg-[#0b1222] p-2 text-center">
                    <span className="block text-[8px] text-slate-500">OPPONENT</span>
                    <b className="block mt-1 text-sm text-slate-200">{oppScore}</b>
                  </div>
                  <div className="rounded-xl bg-[#0b1222] p-2 text-center">
                    <span className="block text-[8px] text-slate-500">PRIZE</span>
                    <b className="block mt-1 text-sm text-amber-300">{prize > 0 ? money(prize) : '—'}</b>
                  </div>
                </div>

                <div className="mt-2 px-3 pb-3 flex items-center justify-between gap-2 text-[9px] text-slate-500">
                  <span>{date}</span>
                  <span>{entry > 0 ? `Entry ${money(entry)}` : 'Completed Match'}</span>
                </div>
                {getCategory(m) === 'PRO' && (m?.status || m?.outcome) && (
                  <div className="px-3 pb-3">
                    <button onClick={() => { setComplaintMatch(m); setProblemType('NETWORK'); setDetails(''); }} className="w-full rounded-xl border border-red-500/20 bg-red-500/10 py-2 text-[10px] font-black text-red-300 flex items-center justify-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Report Match Problem
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {complaintMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-sm rounded-2xl bg-[#121935] border border-red-500/30 p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div><h3 className="font-black text-white">Report Match Problem</h3><p className="text-[10px] text-slate-500 mt-1">Match #{String(complaintMatch.matchId || complaintMatch.id).slice(-8)}</p></div>
              <button onClick={() => setComplaintMatch(null)} className="w-8 h-8 rounded-lg bg-[#0b1022] text-slate-400 flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">সমস্যার ধরন</label>
            <select value={problemType} onChange={e => setProblemType(e.target.value)} className="w-full rounded-xl bg-[#0b1022] border border-indigo-900 px-3 py-2.5 text-xs text-white outline-none">
              <option value="NETWORK">Network / Connection Problem</option>
              <option value="GAME_LOAD">Game did not load</option>
              <option value="AUTO_ABORT">Match automatically aborted</option>
              <option value="SCORE">Score / Result Problem</option>
              <option value="SERVER_ERROR">Server Error</option>
              <option value="OTHER">Other</option>
            </select>
            <label className="block text-[10px] font-bold text-slate-400 mt-3 mb-1">বিস্তারিত</label>
            <textarea value={details} onChange={e => setDetails(e.target.value)} maxLength={1200} rows={5} placeholder="কী সমস্যা হয়েছিল বিস্তারিত লিখুন..." className="w-full rounded-xl bg-[#0b1022] border border-indigo-900 px-3 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none resize-none" />
            <button disabled={submittingComplaint || !details.trim()} onClick={submitComplaint} className="w-full mt-3 rounded-xl bg-red-500 py-2.5 text-xs font-black text-white disabled:opacity-40">{submittingComplaint ? 'Submitting…' : 'Submit Complaint'}</button>
            <p className="text-[9px] text-slate-500 text-center mt-2">Server record ও Match details যাচাই করে Admin সিদ্ধান্ত নেবে।</p>
          </div>
        </div>
      )}

    </div>
  );
};
