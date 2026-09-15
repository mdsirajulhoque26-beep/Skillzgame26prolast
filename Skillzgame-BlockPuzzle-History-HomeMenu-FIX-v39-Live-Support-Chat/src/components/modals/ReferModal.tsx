import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Gift, X, Copy, Check, Share2, Users, Coins } from 'lucide-react';

export const ReferModal: React.FC = () => {
  const { activeModal, closeModal, user } = useApp();
  const [summary, setSummary] = useState<any>({ total: 0, paid: 0, bonusEarned: 0 });
  const [refSettings, setRefSettings] = useState<any>({ enabled: true, bonusAmount: 20, minDeposit: 100, requireFirstProMatch: true });

  React.useEffect(() => {
    if (activeModal !== 'refer') return;
    import('../../services/backendApi').then(({ backendApi }) => backendApi.referralSummary().then(d => { setSummary(d.summary || {}); setRefSettings(d.settings || {}); }).catch(() => {}));
  }, [activeModal]);
  const [copied, setCopied] = useState<boolean>(false);

  if (activeModal !== 'refer') return null;

  const getReferralLink = () => {
    const code = String(user.referralCode || '').trim();
    return `${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(code)}`;
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('রেফারেল কোড কপি করা যায়নি।');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getReferralLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('রেফারেল লিংক কপি করা যায়নি।');
    }
  };

  const handleShare = async () => {
    const link = getReferralLink();
    const text = `Skill Game-এ যোগ দিন! আমার Referral Code: ${user.referralCode}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Skill Game — Refer & Earn', text, url: link });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${link}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${link}`)}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div 
        id="refer-modal-box"
        className="w-full max-w-sm bg-[#121935] border border-emerald-500/50 rounded-2xl p-5 shadow-2xl relative text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-indigo-900 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Refer & Earn</h3>
              <p className="text-[10px] text-slate-400">বন্ধু রেফার করে আয় করুন</p>
            </div>
          </div>
          <button
            id="refer-close-btn"
            onClick={closeModal}
            className="w-7 h-7 rounded-full bg-indigo-950 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hero Card */}
        <div className="bg-gradient-to-br from-emerald-900/60 to-indigo-950 p-4 rounded-2xl border border-emerald-500/30 text-center mb-4">
          <div className="text-3xl mb-1">🎁</div>
          <h4 className="font-extrabold text-sm text-emerald-300">
            প্রতিটি সফল রেফারে পান ৳{Number(refSettings.bonusAmount || 0).toFixed(0)} বোনাস!
          </h4>
          <p className="text-xs text-slate-300 mt-1">
            আপনার রেফারেল কোড ব্যবহার করে বন্ধু রেজিস্টার করে কমপক্ষে ৳{Number(refSettings.minDeposit || 0).toFixed(0)} ডিপোজিট এবং ১ম Pro ম্যাচ খেললে Referral Approval তৈরি হবে। Admin অনুমোদনের পর বোনাস Gaming Balance-এ যোগ হবে।
          </p>
        </div>

        {/* Code Box */}
        <div className="bg-[#0b1022] border-2 border-dashed border-emerald-500/40 rounded-xl p-4 text-center mb-4">
          <span className="text-[11px] text-slate-400 uppercase font-bold block mb-1">
            আপনার রেফারেল কোড
          </span>
          <div className="text-2xl font-black font-mono tracking-widest text-emerald-400 my-1">
            {user.referralCode}
          </div>
          <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
            <button
              id="copy-refer-code-btn"
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow active:scale-95 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'কপি হয়েছে!' : 'কোড কপি করুন'}</span>
            </button>
            <button
              id="copy-refer-link-btn"
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow active:scale-95 transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>লিংক কপি</span>
            </button>
            <button
              id="share-refer-link-btn"
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow active:scale-95 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>শেয়ার করুন</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-center mb-4">
          <div className="bg-[#0b1022] p-2.5 rounded-xl border border-indigo-950">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">মোট রেফার</span>
            <span className="text-sm font-black font-mono text-white">{summary.paid || 0} জন</span>
          </div>
          <div className="bg-[#0b1022] p-2.5 rounded-xl border border-indigo-950">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">অর্জিত বোনাস</span>
            <span className="text-sm font-black font-mono text-emerald-400">৳{Number(summary.bonusEarned || 0).toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={closeModal}
          className="w-full py-2.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-slate-200 font-bold rounded-xl text-xs"
        >
          ঠিক আছে
        </button>
      </div>
    </div>
  );
};
