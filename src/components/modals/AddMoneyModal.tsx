import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Copy, Check, X, ShieldCheck, AlertCircle, PlusCircle, ArrowLeft } from 'lucide-react';

export const AddMoneyModal: React.FC = () => {
  const { activeModal, closeModal, depositMoney, paymentSettings } = useApp();
  const [selectedMethod, setSelectedMethod] = useState<'bKash' | 'bKash Agent' | 'Nagad' | 'Rocket' | 'Upay' | 'Binance / USDT'>('bKash');
  const [showDepositForm, setShowDepositForm] = useState<boolean>(false);
  const [amount, setAmount] = useState<number>(100);
  const [senderNumber, setSenderNumber] = useState<string>('');
  const [trxId, setTrxId] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState<boolean>(false);

  const methods = [
    'bKash' as const,
    'bKash Agent' as const,
    'Nagad' as const,
    'Rocket' as const,
    'Upay' as const,
    'Binance / USDT' as const,
  ];

  const methodMeta: Record<typeof methods[number], { logo: string; subtitle: string; logoClass: string }> = {
    'bKash': { logo: 'bKash', subtitle: 'Send Money', logoClass: 'text-pink-500' },
    'bKash Agent': { logo: 'bKash', subtitle: 'Cash Out', logoClass: 'text-pink-500' },
    'Nagad': { logo: 'Nagad', subtitle: 'Send Money', logoClass: 'text-orange-500' },
    'Rocket': { logo: 'Rocket', subtitle: 'Send Money', logoClass: 'text-purple-500' },
    'Upay': { logo: 'upay', subtitle: 'Send Money', logoClass: 'text-green-600' },
    'Binance / USDT': { logo: '₮ USDT', subtitle: 'Wallet Transfer', logoClass: 'text-emerald-600' },
  };

  const minDepositAmount = Math.max(0, Number(paymentSettings.minDepositAmount ?? 20) || 0);
  const maxDepositAmount = Math.max(0, Number(paymentSettings.maxDepositAmount ?? 0) || 0);
  const effectiveMax = maxDepositAmount > 0 ? Math.max(maxDepositAmount, minDepositAmount) : 0;
  const presetAmounts = Array.from(new Set([
    minDepositAmount,
    100,
    250,
    500,
    1000,
    ...(effectiveMax > 0 ? [effectiveMax] : []),
  ].filter((n) => Number.isFinite(n) && n >= minDepositAmount && (effectiveMax === 0 || n <= effectiveMax)))).sort((a, b) => a - b).slice(0, 6);
  const getTargetNumber = () => {
    switch (selectedMethod) {
      case 'bKash': return paymentSettings.bkash || 'Not configured';
      case 'bKash Agent': return paymentSettings.bkashAgent || 'Not configured';
      case 'Nagad': return paymentSettings.nagad || 'Not configured';
      case 'Rocket': return paymentSettings.rocket || 'Not configured';
      case 'Upay': return paymentSettings.upay || 'Not configured';
      case 'Binance / USDT': return paymentSettings.binanceUsdt || 'Not configured';
    }
  };

  const isMethodAvailable = (method: typeof methods[number]) => {
    switch (method) {
      case 'bKash': return paymentSettings.depositBkashEnabled !== false && !!paymentSettings.bkash;
      case 'bKash Agent': return paymentSettings.depositBkashAgentEnabled !== false && !!paymentSettings.bkashAgent;
      case 'Nagad': return paymentSettings.depositNagadEnabled !== false && !!paymentSettings.nagad;
      case 'Rocket': return paymentSettings.depositRocketEnabled !== false && !!paymentSettings.rocket;
      case 'Upay': return paymentSettings.depositUpayEnabled !== false && !!paymentSettings.upay;
      case 'Binance / USDT': return paymentSettings.depositBinanceUsdtEnabled !== false && paymentSettings.binanceUsdtEnabled !== false && !!paymentSettings.binanceUsdt;
    }
  };

  React.useEffect(() => { if (methods.length && !methods.includes(selectedMethod)) setSelectedMethod(methods[0]); }, [paymentSettings, selectedMethod, methods.length]);

  if (activeModal !== 'add_money') return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(getTargetNumber());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < minDepositAmount) {
      setStatus({ ok: false, msg: `সর্বনিম্ন ডিপোজিট পরিমাণ ৳${minDepositAmount.toFixed(2)}।` });
      return;
    }

    if (maxDepositAmount > 0 && amount > maxDepositAmount) {
      setStatus({ ok: false, msg: `সর্বোচ্চ ডিপোজিট পরিমাণ ৳${maxDepositAmount.toFixed(2)}।` });
      return;
    }
    if (!senderNumber || senderNumber.length < 10) {
      setStatus({ ok: false, msg: 'সঠিক সেন্ডার নম্বর লিখুন।' });
      return;
    }
    if (!trxId || trxId.length < 5) {
      setStatus({ ok: false, msg: 'সঠিক ট্রানজেকশন আইডি (TrxID) লিখুন।' });
      return;
    }

    setIsSubmittingDeposit(true);
    setStatus({ ok: true, msg: 'ডিপোজিট রিকোয়েস্ট জমা হচ্ছে...' });

    try {
      const result = await depositMoney(selectedMethod, amount, senderNumber, trxId);

      if (result.success) {
        setStatus({ ok: true, msg: `৳${amount} টাকা ডিপোজিট রিকোয়েস্ট হিসেবে জমা হয়েছে। এডমিন যাচাই করবেন।` });
        setTimeout(() => {
          closeModal();
          setIsSubmittingDeposit(false);
        }, 700);
      } else {
        setStatus({ ok: false, msg: result.message });
        setIsSubmittingDeposit(false);
      }
    } catch (error: any) {
      setStatus({ ok: false, msg: error?.message || 'ডিপোজিট রিকোয়েস্ট ব্যর্থ হয়েছে।' });
      setIsSubmittingDeposit(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        id="add-money-modal-box"
        className="w-full max-w-sm bg-[#121935] border border-amber-500/50 rounded-2xl p-5 shadow-2xl relative text-white my-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-indigo-900 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add Money (ডিপোজিট)</h3>
              <p className="text-[10px] text-slate-400">ব্যালেন্স রিচার্জ করুন</p>
            </div>
          </div>
          <button
            id="add-money-close-btn"
            onClick={closeModal}
            className="w-7 h-7 rounded-full bg-indigo-950 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Method Selector — card layout like the reference screenshot */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {methods.map((m) => {
            const meta = methodMeta[m];
            const selected = selectedMethod === m;
            return (
              <button
                key={m}
                id={`deposit-method-${m.toLowerCase().replace(/\s+/g, '-')}`}
                type="button"
                onClick={() => {
                  setSelectedMethod(m);
                  setShowDepositForm(true);
                }}
                className={`overflow-hidden rounded-xl border-2 transition-all text-left ${
                  selected
                    ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-lg'
                    : 'border-indigo-900/80 hover:border-sky-500/70'
                }`}
              >
                <div className="h-16 bg-white flex items-center justify-center">
                  <div className={`text-lg font-black tracking-tight ${meta.logoClass}`}>{meta.logo}</div>
                </div>
                <div className={`px-2 py-2 text-center ${selected && showDepositForm ? 'bg-amber-500 text-slate-950' : 'bg-sky-600 text-white'}`}>
                  <div className="text-[11px] font-black leading-tight">{m}</div>
                  <div className="text-[9px] font-semibold opacity-90 mt-0.5">
                    {isMethodAvailable(m) ? meta.subtitle : 'Not configured'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {showDepositForm && (
        <>
        {/* Back to payment methods */}
        <button
          type="button"
          onClick={() => setShowDepositForm(false)}
          className="mb-3 flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Selected method */}
        <div className="mb-3 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2">
          <div>
            <div className="text-[10px] text-slate-400">SELECTED PAYMENT METHOD</div>
            <div className="text-sm font-black text-amber-300">{selectedMethod}</div>
          </div>
          <button
            type="button"
            onClick={() => setShowDepositForm(false)}
            className="text-[10px] font-bold text-slate-400 hover:text-white"
          >
            Change
          </button>
        </div>

        {/* Account Number Copy Box */}
        <div className="bg-[#0b1022] border border-amber-500/30 rounded-xl p-3.5 mb-4 text-center">
          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
            {selectedMethod === 'Binance / USDT'
              ? 'Binance / USDT Wallet Address'
              : selectedMethod === 'bKash Agent'
                ? 'bKash Agent Cash Out Number'
                : `${selectedMethod} Send Money Number`}
          </span>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-base font-black text-amber-400 tracking-wider">
              {getTargetNumber()}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold active:scale-95 transition-all"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'কপি হয়েছে' : 'কপি'}</span>
            </button>
          </div>
          <p className={`text-[10.5px] mt-2 font-semibold ${selectedMethod === 'bKash Agent' ? 'text-amber-300' : 'text-slate-400'}`}>
            {selectedMethod === 'bKash Agent'
              ? '⚠️ bKash Agent নম্বরে টাকা দিতে Cash Out অপশন ব্যবহার করুন। Send Money করবেন না। নম্বর কপি করে Cash Out করার পর TrxID দিন।'
              : selectedMethod === 'Binance / USDT'
                ? 'উপরে দেওয়া Wallet Address-এ টাকা পাঠানোর পর প্রয়োজনীয় Transaction ID/Reference দিন।'
                : `উপরে দেওয়া ${selectedMethod} Personal নম্বরে Send Money করে টাকা পাঠানোর পর প্রয়োজনীয় Transaction ID/Reference দিন।`}
          </p>
        </div>

        {/* Amount Presets */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            ডিপোজিট পরিমাণ সিলেক্ট করুন (৳):
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {presetAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt)}
                className={`py-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                  amount === amt
                    ? 'bg-amber-400 border-amber-300 text-slate-950'
                    : 'bg-[#0d1326] border-indigo-950 text-slate-300 hover:text-white'
                }`}
              >
                ৳{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Deposit Form */}
        <div className="mb-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-[10px] text-cyan-200">
          সর্বনিম্ন: ৳{minDepositAmount.toFixed(2)} • সর্বোচ্চ: {maxDepositAmount > 0 ? `৳${maxDepositAmount.toFixed(2)}` : 'Unlimited'}
        </div>
        <form onSubmit={handleDepositSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              ডিপোজিট পরিমাণ (টাকা):
            </label>
            <input
              id="deposit-amount-input"
              type="number"
              min={minDepositAmount}
              max={maxDepositAmount > 0 ? maxDepositAmount : undefined}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-[#0b1022] border border-indigo-900 focus:border-amber-400 rounded-xl text-sm font-mono text-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              যে নম্বর থেকে টাকা পাঠিয়েছেন (Sender Number):
            </label>
            <input
              id="deposit-sender-input"
              type="tel"
              placeholder="01XXXXXXXXX"
              value={senderNumber}
              onChange={(e) => setSenderNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0b1022] border border-indigo-900 focus:border-amber-400 rounded-xl text-sm font-mono text-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              ট্রানজেকশন আইডি (TrxID):
            </label>
            <input
              id="deposit-trxid-input"
              type="text"
              placeholder="e.g. DHQ8SR8VEA"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0b1022] border border-indigo-900 focus:border-amber-400 rounded-xl text-sm font-mono uppercase text-amber-300 focus:outline-none"
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
            id="deposit-submit-btn"
            type="submit"
            disabled={isSubmittingDeposit}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all mt-2 cursor-pointer"
          >
            {isSubmittingDeposit ? 'জমা হচ্ছে...' : 'ডিপোজিট রিকোয়েস্ট নিশ্চিত করুন'}
          </button>
        </form>
        </>
        )}
      </div>
    </div>
  );
};
