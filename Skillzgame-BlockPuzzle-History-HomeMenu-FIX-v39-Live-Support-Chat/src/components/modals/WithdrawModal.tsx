import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowUpRight, X, AlertCircle, ShieldCheck, Trophy } from 'lucide-react';

export const WithdrawModal: React.FC = () => {
  const { activeModal, closeModal, user, withdrawMoney, paymentSettings } = useApp();
  const [method, setMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Upay' | 'Binance / USDT'>('bKash');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [amount, setAmount] = useState<number>(100);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const methods = [
    ...(paymentSettings?.withdrawBkashEnabled !== false && paymentSettings?.bkash ? ['bKash' as const] : []),
    ...(paymentSettings?.withdrawNagadEnabled !== false && paymentSettings?.nagad ? ['Nagad' as const] : []),
    ...(paymentSettings?.withdrawRocketEnabled !== false && paymentSettings?.rocket ? ['Rocket' as const] : []),
    ...(paymentSettings?.withdrawUpayEnabled !== false && paymentSettings?.upay ? ['Upay' as const] : []),
    ...(paymentSettings?.withdrawBinanceUsdtEnabled !== false && paymentSettings?.binanceUsdtEnabled !== false && paymentSettings?.binanceUsdt ? ['Binance / USDT' as const] : []),
  ];
  React.useEffect(() => { if (methods.length && !methods.includes(method)) setMethod(methods[0]); }, [paymentSettings, method, methods.length]);

  if (activeModal !== 'withdraw') return null;

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const res = await withdrawMoney(method, 'Personal', accountNumber, amount);
    setStatus({ ok: res.success, msg: res.message });

    if (res.success) {
      setTimeout(() => {
        closeModal();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        id="withdraw-modal-box"
        className="w-full max-w-sm bg-[#121935] border border-teal-500/50 rounded-2xl p-5 shadow-2xl relative text-white my-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-indigo-900 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Withdraw (উইথড্রয়াল)</h3>
              <p className="text-[10px] text-slate-400">উইনিং ব্যালেন্স উত্তোলন করুন</p>
            </div>
          </div>
          <button
            id="withdraw-close-btn"
            onClick={closeModal}
            className="w-7 h-7 rounded-full bg-indigo-950 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Winning Balance reminder */}
        <div className="bg-[#0b1022] border border-teal-500/30 rounded-xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-300">বর্তমান উইনিং ব্যালেন্স:</span>
          </div>
          <span className="font-mono text-base font-black text-emerald-400">
            ৳{user.winningBalance.toFixed(2)}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleWithdrawSubmit} className="space-y-3.5">
          {/* Method Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              উইথড্র মেথড সিলেক্ট করুন:
            </label>
            <div className={`grid ${methods.length > 3 ? 'grid-cols-2' : 'grid-cols-3'} gap-1.5`}>
              {methods.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    method === m
                      ? 'bg-teal-600 border-teal-400 text-white font-extrabold shadow-md'
                      : 'bg-[#0b1022] border-indigo-900 text-slate-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {method === 'Binance / USDT' ? 'আপনার Binance / USDT Wallet Address:' : `আপনার ${method} Personal নম্বর:`}
            </label>
            <input
              id="withdraw-account-number"
              type="tel"
              placeholder={method === 'Binance / USDT' ? 'USDT Wallet Address' : '01XXXXXXXXX'}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0b1022] border border-indigo-900 focus:border-teal-400 rounded-xl text-sm font-mono text-white focus:outline-none"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              উইথড্রয়াল পরিমাণ (সর্বনিম্ন ৳১০০):
            </label>
            <input
              id="withdraw-amount-input"
              type="number"
              min={100}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-[#0b1022] border border-indigo-900 focus:border-teal-400 rounded-xl text-sm font-mono text-white focus:outline-none"
              required
            />
          </div>

          {status && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center gap-1.5 border ${
                status.ok ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200' : 'bg-red-500/20 border-red-500/40 text-red-200'
              }`}
            >
              {status.ok ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
              <span>{status.msg}</span>
            </div>
          )}

          <button
            id="withdraw-submit-btn"
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-black text-sm rounded-xl shadow-lg shadow-teal-500/20 active:scale-95 transition-all mt-2 cursor-pointer"
          >
            উইথড্র রিকোয়েস্ট পাঠান
          </button>
        </form>
      </div>
    </div>
  );
};
