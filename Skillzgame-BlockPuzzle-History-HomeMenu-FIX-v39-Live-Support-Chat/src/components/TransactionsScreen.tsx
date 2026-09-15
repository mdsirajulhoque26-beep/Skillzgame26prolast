import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, 
  History, 
  XCircle, 
  RotateCcw, 
  Trophy, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  UserCheck, 
  KeyRound,
  Check
} from 'lucide-react';
import { Transaction } from '../types';

export const TransactionsScreen: React.FC = () => {
  const { transactions, setCurrentTab, user, openModal } = useApp();
  const [filter, setFilter] = useState<'all' | 'match' | 'deposit' | 'withdraw' | 'admin'>('all');

  const userTransactions = transactions.filter((t) => {
    if (t.userId && user.id && t.userId !== user.id) return false;
    return true;
  });

  const filteredTransactions = userTransactions.filter((t) => {
    if (filter === 'all') return true;
    return t.category === filter;
  });

  const countAll = userTransactions.length;
  const countMatch = userTransactions.filter(t => t.category === 'match').length;
  const countDeposit = userTransactions.filter(t => t.category === 'deposit').length;
  const countWithdraw = userTransactions.filter(t => t.category === 'withdraw').length;
  const countAdmin = userTransactions.filter(t => t.category === 'admin').length;

  return (
    <div className="pb-24 pt-1 px-3 max-w-md mx-auto space-y-4 text-white min-h-screen">
      {/* Header (01:49) */}
      <div className="sticky top-14 z-30 bg-[#0d1222]/95 backdrop-blur-md py-2.5 flex items-center gap-2 border-b border-indigo-950/60">
        <button
          id="transactions-back-btn"
          onClick={() => setCurrentTab('wallet')}
          className="w-8 h-8 rounded-full bg-indigo-950/80 hover:bg-indigo-900 text-slate-300 flex items-center justify-center border border-indigo-800/40"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-base font-extrabold text-white tracking-wide">
          Transactions
        </h2>
        <span className="ml-auto text-[9px] text-slate-500">শেষ ৩০ দিন</span>
      </div>

      {/* Transaction History Banner (01:49) */}
      <div className="bg-[#121935] border border-indigo-500/30 rounded-2xl p-4 text-center shadow-lg">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2 shadow-inner">
          <History className="w-6 h-6" />
        </div>
        <h3 className="text-base font-extrabold text-white">Transaction History</h3>
        <p className="text-xs text-slate-400 mt-0.5">Track all your financial activities</p>

        {/* Counters Grid (01:49) */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div 
            onClick={() => setFilter('all')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              filter === 'all' ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-[#0b1022] border-indigo-950 text-slate-300'
            }`}
          >
            <div className="text-lg font-black font-mono">{countAll}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ALL</div>
          </div>

          <div 
            onClick={() => setFilter('match')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              filter === 'match' ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-[#0b1022] border-indigo-950 text-slate-300'
            }`}
          >
            <div className="text-lg font-black font-mono">{countMatch}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">MATCH</div>
          </div>

          <div 
            onClick={() => setFilter('deposit')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              filter === 'deposit' ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-[#0b1022] border-indigo-950 text-slate-300'
            }`}
          >
            <div className="text-lg font-black font-mono">{countDeposit}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">DEPOSIT</div>
          </div>

          <div 
            onClick={() => setFilter('withdraw')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              filter === 'withdraw' ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-[#0b1022] border-indigo-950 text-slate-300'
            }`}
          >
            <div className="text-lg font-black font-mono">{countWithdraw}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">WITHDRAW</div>
          </div>

          <div 
            onClick={() => setFilter('admin')}
            className={`col-span-2 p-2.5 rounded-xl border transition-all cursor-pointer ${
              filter === 'admin' ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-[#0b1022] border-indigo-950 text-slate-300'
            }`}
          >
            <div className="text-lg font-black font-mono">{countAdmin}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ADMIN</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs (01:50) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {(['all', 'match', 'deposit', 'withdraw', 'admin'] as const).map((tab) => (
          <button
            key={tab}
            id={`trx-tab-${tab}`}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-all ${
              filter === tab
                ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                : 'bg-[#121935] text-slate-400 hover:text-white border border-indigo-950'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Transaction List Cards (01:51 - 02:13) */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="bg-[#121935] border border-indigo-900/60 rounded-3xl p-8 text-center space-y-3 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950 text-amber-400 flex items-center justify-center mx-auto border border-indigo-800/60">
              <History className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">কোনো লেনদেন হিস্টোরি নেই</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                আপনার একাউন্টে বর্তমানে কোনো লেনদেন নেই। টাকা ডিপোজিট, উইথড্র অথবা ম্যাচ খেলা শুরু করার সাথে সাথেই এখানে লেনদেনের সম্পূর্ণ হিস্টোরি দেখতে পাবেন।
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => openModal('add_money')}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow-lg active:scale-95 transition-all"
              >
                ডিপোজিট করুন
              </button>
              <button
                onClick={() => setCurrentTab('block_puzzle')}
                className="bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs px-4 py-2 rounded-xl border border-indigo-700/60 active:scale-95 transition-all"
              >
                গেম খেলুন
              </button>
            </div>
          </div>
        ) : (
          filteredTransactions.map((trx) => {
            const isNegative = trx.amount < 0;

            return (
              <div
                key={trx.id}
                id={`trx-card-${trx.trxNumber}`}
                className="bg-[#131b38] border border-indigo-500/30 rounded-2xl p-3.5 shadow-lg relative overflow-hidden"
              >
                {/* Top Row: Icon, Title, Amount & Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-inner bg-[#0b1022] border border-indigo-900">
                      {trx.type === 'match_loss' && (
                        <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                          <XCircle className="w-4 h-4" />
                        </div>
                      )}
                      {trx.type === 'match_win' && (
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                          <Trophy className="w-4 h-4" />
                        </div>
                      )}
                      {trx.type === 'refund' && (
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                          <RotateCcw className="w-4 h-4" />
                        </div>
                      )}
                      {trx.type === 'deposit' && (
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <ArrowDownCircle className="w-4 h-4" />
                        </div>
                      )}
                      {trx.type === 'withdraw' && (
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                          <ArrowUpCircle className="w-4 h-4" />
                        </div>
                      )}
                      {(trx.type === 'admin_add' || trx.type === 'admin_deduct') && (
                        <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center">
                          <UserCheck className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-white">
                        {trx.title}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {trx.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Amount & Status Badge */}
                  <div className="text-right">
                    <div
                      className={`text-sm font-black font-mono tracking-tight ${
                        isNegative ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {isNegative ? `-৳${Math.abs(trx.amount).toFixed(2)}` : `+৳${trx.amount.toFixed(2)}`}
                    </div>
                    <span className="inline-flex items-center gap-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9.5px] font-extrabold px-1.5 py-0.2 rounded mt-0.5 uppercase">
                      <Check className="w-2.5 h-2.5" /> {trx.status}
                    </span>
                  </div>
                </div>

                {/* Details Section (01:52 - 02:05) */}
                <div className="mt-3 pt-2.5 border-t border-indigo-900/60 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 font-bold block">TRANSACTION ID</span>
                    <span className="font-mono text-slate-300 font-semibold">{trx.trxNumber}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-bold block">DATE & TIME</span>
                    <span className="text-slate-300 font-medium">{trx.date}</span>
                  </div>

                  {trx.matchId && (
                    <div>
                      <span className="text-slate-500 font-bold block">MATCH ID</span>
                      <span className="font-mono text-slate-300 font-semibold">{trx.matchId}</span>
                    </div>
                  )}

                  {trx.trxId && (
                    <div>
                      <span className="text-slate-500 font-bold block">TRX ID</span>
                      <span className="font-mono text-amber-300 font-semibold">{trx.trxId}</span>
                    </div>
                  )}
                </div>

                {/* Purple Room ID Pill (01:52, 01:54, 01:56, 01:58) */}
                {trx.roomCode && (
                  <div className="mt-2.5 bg-[#1b1942] border border-purple-500/30 text-purple-200 text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-mono font-medium">
                    <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                    <span>Room: {trx.roomCode}</span>
                  </div>
                )}

                {/* Admin adjustment badge */}
                {(trx.type === 'admin_add' || trx.type === 'admin_deduct') && (
                  <div className="mt-2.5 bg-pink-950/40 border border-pink-500/30 text-pink-200 text-xs px-3 py-1 rounded-xl flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-pink-400" />
                    <span>Admin adjustment</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
