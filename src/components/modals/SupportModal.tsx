import React from 'react';
import { useApp } from '../../context/AppContext';
import { MessageSquare, MessageCircle, Send, X, Phone, Clock, ShieldCheck } from 'lucide-react';

export const SupportModal: React.FC = () => {
  const { activeModal, closeModal, user, paymentSettings } = useApp();

  if (activeModal !== 'support') return null;

  const whatsapp = paymentSettings.whatsappSupport || '';
  const telegram = paymentSettings.telegramLink || '';

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hello Skillzgame Support, my phone is ${user.phone}. I need assistance.`);
    window.open(`https://wa.me/88${whatsapp.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  const handleTelegram = () => {
    window.open(telegram, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div 
        id="support-modal-box"
        className="w-full max-w-sm bg-[#121935] border border-cyan-500/50 rounded-2xl p-5 shadow-2xl relative text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-indigo-900 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Skillzgame সাপোর্ট</h3>
              <p className="text-[10px] text-slate-400">২৪/৭ লাইভ কাস্টমার কেয়ার</p>
            </div>
          </div>
          <button
            id="support-close-btn"
            onClick={closeModal}
            className="w-7 h-7 rounded-full bg-indigo-950 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status card */}
        <div className="bg-[#0b1022] p-3 rounded-xl border border-indigo-900 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-slate-200">সাপোর্ট টিম অনলাইনে রয়েছে</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" /> ২৪ ঘণ্টা
          </span>
        </div>

        {/* Contact buttons */}
        <div className="space-y-3 mb-4">
          {/* WhatsApp */}
          <button
            id="support-whatsapp-cta-btn"
            type="button"
            onClick={handleWhatsApp}
            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold p-3.5 rounded-xl shadow-lg flex items-center justify-between active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 fill-current" />
              </div>
              <div className="text-left">
                <div className="text-xs font-extrabold">WhatsApp সাপোর্ট</div>
                <div className="text-[10.5px] text-emerald-100 font-mono">{whatsapp}</div>
              </div>
            </div>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md font-bold">চ্যাট করুন ›</span>
          </button>

          {/* Telegram */}
          <button
            id="support-telegram-cta-btn"
            type="button"
            onClick={handleTelegram}
            className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold p-3.5 rounded-xl shadow-lg flex items-center justify-between active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-extrabold">টেলিগ্রাম চ্যানেল</div>
                <div className="text-[10.5px] text-sky-100">অফিশিয়াল কমিউনিটি ও আপডেট</div>
              </div>
            </div>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md font-bold">জয়েন করুন ›</span>
          </button>
        </div>

        <button
          onClick={closeModal}
          className="w-full py-2 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-slate-300 font-bold rounded-xl text-xs"
        >
          বন্ধ করুন
        </button>
      </div>
    </div>
  );
};
