import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Phone, 
  Lock, 
  User as UserIcon, 
  LogIn, 
  UserPlus, 
  Sparkles, 
  Eye, 
  EyeOff, 
  MessageCircle,
  Gamepad2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { login, register, registeredUsers, paymentSettings } = useApp();
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [refCode, setRefCode] = useState<string>('');

  // Auto-fill the referral code when a player opens the app from a shared
  // referral link such as ?ref=LX123456.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('ref');
    if (code) setRefCode(code.trim().toUpperCase());
  }, []);

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [showForgetModal, setShowForgetModal] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(async () => {
      const cleanPhone = phone.trim();
      const cleanPass = password.trim();

      if (isRegisterMode) {
        if (!name.trim()) {
          setError('আপনার নাম লিখুন');
          setIsLoading(false);
          return;
        }
        if (cleanPhone.length < 10) {
          setError('সঠিক মোবাইল নম্বর দিন (কমপক্ষে ১০ ডিজিট)');
          setIsLoading(false);
          return;
        }
        if (cleanPass.length < 4) {
          setError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে');
          setIsLoading(false);
          return;
        }
        if (cleanPass !== confirmPassword.trim()) {
          setError('পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মেলেনি! একই পাসওয়ার্ড লিখুন।');
          setIsLoading(false);
          return;
        }

        // Duplicate Phone Number validation
        const alreadyExists = registeredUsers.some(u => u.phone === cleanPhone);
        if (alreadyExists) {
          setError('ইতিমধ্যে একটি অ্যাকাউন্ট এই নাম্বারে আছে! অনুগ্রহ করে লগইন করুন।');
          setIsLoading(false);
          return;
        }

        const res = await register(name.trim(), cleanPhone, cleanPass, refCode);
        if (!res.success) {
          setError(res.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।');
        }
      } else {
        if (!cleanPhone || !cleanPass) {
          setError('মোবাইল নম্বর এবং পাসওয়ার্ড দিন');
          setIsLoading(false);
          return;
        }
        const res = await login(cleanPhone, cleanPass);
        if (!res.success) {
          setError(res.message || 'মোবাইল নম্বর অথবা পাসওয়ার্ড ভুল হয়েছে।');
        }
      }
      setIsLoading(false);
    }, 400);
  };

  const handleDemoLogin = () => {
    setIsRegisterMode(false);
    setError('Admin login নিরাপদ রাখতে credentials এখানে সংরক্ষণ করা হয়নি। Vercel Environment Variables-এ ADMIN_PHONE ও ADMIN_PASSWORD সেট করে সেই তথ্য দিয়ে লগইন করুন।');
    setPhone('');
    setPassword('');
  };

  const handleWhatsAppReset = () => {
    const num = paymentSettings.whatsappSupport || '';
    const message = encodeURIComponent(`Hello Admin, I forgot my password for Skill Game account. My Phone Number: ${phone || '...'}`);
    window.open(`https://wa.me/88${num.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e1e] via-[#0f1632] to-[#080b18] flex flex-col justify-center items-center px-4 py-8 max-w-md mx-auto relative overflow-hidden select-none">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand & Logo (Skill Game Branding) */}
      <div className="flex flex-col items-center text-center mb-6 relative z-10">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-emerald-400 to-cyan-500 p-1 shadow-2xl shadow-amber-500/20 mb-3 animate-pulse">
          <div className="w-full h-full bg-[#0d1326] rounded-[22px] flex flex-col items-center justify-center relative overflow-hidden border border-amber-400/30">
            <div className="flex items-center justify-center">
              <span className="text-3xl">🎮</span>
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-black tracking-wider text-white mb-1">
          SKILL GAME
        </h1>
        <p className="text-amber-400 font-semibold text-xs flex items-center gap-1.5 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
          গেম খেলুন এবং টাকা জিতুন 🎮
        </p>
      </div>

      {/* Auth Card */}
      <div className="w-full bg-[#121936]/95 border border-indigo-500/40 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative z-10 space-y-4">
        <div className="flex items-center justify-center gap-2 pb-3 border-b border-indigo-900/60">
          <UserIcon className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white tracking-wide">
            {isRegisterMode ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'অ্যাকাউন্টে লগইন করুন'}
          </h2>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 text-xs px-3.5 py-2.5 rounded-xl text-center font-medium flex items-center justify-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name in Register mode */}
          {isRegisterMode && (
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                আপনার নাম
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="auth-name-input"
                  type="text"
                  placeholder="আপনার পূর্ণ নাম লিখুন"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0a0f22] border border-indigo-900/80 focus:border-amber-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>
          )}

          {/* Phone Number */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              মোবাইল নম্বর
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                id="auth-phone-input"
                type="tel"
                placeholder="০১XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#0a0f22] border border-indigo-900/80 focus:border-amber-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors font-mono"
                required
              />
            </div>
          </div>

          {/* Password with Eye Show/Hide Toggle */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              {isRegisterMode ? 'পাসওয়ার্ড তৈরি করুন' : 'পাসওয়ার্ড'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="auth-password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="পাসওয়ার্ড লিখুন"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 bg-[#0a0f22] border border-indigo-900/80 focus:border-amber-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                required
              />
              <button
                type="button"
                id="auth-toggle-pwd-btn"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-amber-400 transition-colors"
                title={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password with Eye Toggle in Register mode */}
          {isRegisterMode && (
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                কনফার্ম পাসওয়ার্ড
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="auth-confirm-password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-[#0a0f22] border border-indigo-900/80 focus:border-emerald-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  required
                />
                <button
                  type="button"
                  id="auth-toggle-confirm-pwd-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-emerald-400 transition-colors"
                  title={showConfirmPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Referral Code (optional) in Register Mode */}
          {isRegisterMode && (
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <input
                  id="auth-ref-input"
                  type="text"
                  placeholder="রেফার কোড (যদি থাকে)"
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0a0f22] border border-indigo-900/80 focus:border-amber-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Forget Password link */}
          {!isRegisterMode && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                id="auth-forget-pwd-btn"
                onClick={() => setShowForgetModal(true)}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold transition-colors flex items-center gap-1"
              >
                <span>🔑</span> পাসওয়ার্ড ভুলে গেছেন?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black py-3.5 px-4 rounded-xl shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2 text-sm">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                যাচাই করা হচ্ছে...
              </span>
            ) : isRegisterMode ? (
              <>
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                <span>রেজিস্ট্রেশন সম্পন্ন করুন</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>লগইন করুন</span>
              </>
            )}
          </button>
        </form>

        {/* Mode Toggle */}
        <div className="pt-3 border-t border-indigo-900/60 text-center">
          <button
            id="auth-toggle-mode-btn"
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError('');
            }}
            className="text-xs text-slate-300 hover:text-amber-400 font-medium transition-colors"
          >
            {isRegisterMode ? (
              <span>ইতিমধ্যে অ্যাকাউন্ট আছে? <strong className="text-amber-400 underline">লগইন করুন</strong></span>
            ) : (
              <span>নতুন ব্যবহারকারী? <strong className="text-amber-400 underline">রেজিস্ট্রেশন করুন</strong></span>
            )}
          </button>
        </div>
      </div>

      {/* Forget Password Direct WhatsApp Modal */}
      {showForgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#101735] border-2 border-amber-500/50 rounded-3xl p-5 max-w-xs w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center mx-auto">
              <MessageCircle className="w-6 h-6 fill-current" />
            </div>

            <div>
              <h3 className="text-base font-black text-white">পাসওয়ার্ড ভুলে গেছেন?</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                পাসওয়ার্ড রিসেটের জন্য কোনো ওটিপি ঝামেলার প্রয়োজন নেই। সরাসরি আমাদের WhatsApp নম্বরে যোগাযোগ করে ইনস্ট্যান্ট নতুন পাসওয়ার্ড সংগ্রহ করুন।
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleWhatsAppReset}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>WhatsApp এ মেসেজ দিন</span>
              </button>

              <button
                type="button"
                onClick={() => setShowForgetModal(false)}
                className="w-full py-2 bg-indigo-950/70 text-slate-300 text-xs font-bold rounded-xl hover:text-white"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

