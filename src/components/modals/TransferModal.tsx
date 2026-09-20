import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowRightLeft,
  X,
  AlertCircle,
  ShieldCheck,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const TransferModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    user,
    transferWinningBalance,
  } = useApp();

  const [amount, setAmount] = useState<number>(user.winningBalance || 50);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (activeModal !== 'transfer') return null;

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    // Already processing হলে আবার submit হবে না
    if (isSubmitting) return;

    setStatus(null);
    setIsSubmitting(true);

    try {
      const res = await transferWinningBalance(amount);

      setStatus({
        ok: res.success,
        msg: res.message,
      });

      if (res.success) {
        setTimeout(() => {
          closeModal();
        }, 1800);
      }
    } catch (err: any) {
      setStatus({
        ok: false,
        msg:
          err?.message ||
          'ট্রান্সফার সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div
        id="transfer-modal-box"
        className="w-full max-w-sm bg-[#121935] border border-pink-500/50 rounded-2xl p-5 shadow-2xl relative text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-indigo-900 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400">
              <ArrowRightLeft className="w-4 h-4" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                Transfer Balance
              </h3>
              <p className="text-[10px] text-slate-400">
                উইনিং ব্যালেন্স গেমিং এ রূপান্তর
              </p>
            </div>
          </div>

          <button
            id="transfer-close-btn"
            onClick={closeModal}
            disabled={isSubmitting}
            className="w-7 h-7 rounded-full bg-indigo-950 text-slate-400 hover:text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dual balance showcase */}
        <div className="grid grid-cols-2 gap-2 bg-[#0b1022] p-3 rounded-xl border border-indigo-900/60 mb-4 text-center">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              উইনিং ব্যালেন্স
            </span>

            <span className="text-sm font-black font-mono text-emerald-400">
              ৳{user.winningBalance.toFixed(2)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              গেমিং ব্যালেন্স
            </span>

            <span className="text-sm font-black font-mono text-amber-400">
              ৳{user.gamingBalance.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleTransfer} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              ট্রান্সফার পরিমাণ (টাকা):
            </label>

            <input
              id="transfer-amount-input"
              type="number"
              min={1}
              max={user.winningBalance}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-[#0b1022] border border-indigo-900 focus:border-pink-400 rounded-xl text-sm font-mono text-white focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              required
            />
          </div>

          {/* Quick amount buttons */}
          <div className="flex gap-1.5">
            {[25, 50, 100, 200].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(v)}
                disabled={isSubmitting}
                className="flex-1 py-1 bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-800 rounded-lg text-xs font-mono text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ৳{v}
              </button>
            ))}
          </div>

          {/* Status message */}
          {status && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center gap-1.5 border ${
                status.ok
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                  : 'bg-red-500/20 border-red-500/40 text-red-200'
              }`}
            >
              {status.ok ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}

              <span>{status.msg}</span>
            </div>
          )}

          {/* Transfer button */}
          <button
            id="transfer-submit-btn"
            type="submit"
            disabled={
              isSubmitting ||
              user.winningBalance <= 0 ||
              !!status?.ok
            }
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-400 hover:to-pink-500 text-white font-black text-sm rounded-xl shadow-lg shadow-pink-500/20 active:scale-95 transition-all mt-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                ট্রান্সফার হচ্ছে...
              </>
            ) : status?.ok ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                ট্রান্সফার সফল হয়েছে
              </>
            ) : (
              'ইনস্ট্যান্ট ট্রান্সফার করুন'
            )}
          </button>

          {/* Processing hint */}
          <p className="text-[10px] text-center text-slate-500">
            ক্লিক করার পর কয়েক সেকেন্ড অপেক্ষা করুন—সফল হলে ব্যালেন্স আপডেট হবে।
          </p>
        </form>
      </div>
    </div>
  );
};
