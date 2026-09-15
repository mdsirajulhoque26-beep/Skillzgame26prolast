import React from 'react';
import { X, Award, Flame, Trophy, Target, Shield, CheckCircle2, Lock } from 'lucide-react';
import { BlockAchievement } from '../../types';

interface BlockProfileModalProps {
  userName: string;
  avatar: string;
  rating: number;
  bestScore: number;
  matchesWon: number;
  matchesLost: number;
  totalLines: number;
  bestCombo: number;
  practiceBestScore: number;
  onClose: () => void;
}

export const BlockProfileModal: React.FC<BlockProfileModalProps> = ({
  userName,
  avatar,
  rating,
  bestScore,
  matchesWon,
  matchesLost,
  totalLines,
  bestCombo,
  practiceBestScore,
  onClose,
}) => {
  const totalMatches = matchesWon + matchesLost;
  const winRate = totalMatches > 0 ? Math.round((matchesWon / totalMatches) * 100) : 0;

  const getTier = (r: number) => {
    if (r >= 2400) return { name: 'Master Tier', color: 'text-rose-400', badge: '👑' };
    if (r >= 2000) return { name: 'Diamond Tier', color: 'text-cyan-300', badge: '💎' };
    if (r >= 1600) return { name: 'Platinum Tier', color: 'text-emerald-300', badge: '🛡️' };
    if (r >= 1200) return { name: 'Gold Tier', color: 'text-amber-300', badge: '🥇' };
    if (r >= 800) return { name: 'Silver Tier', color: 'text-slate-300', badge: '🥈' };
    return { name: 'Bronze Tier', color: 'text-amber-600', badge: '🥉' };
  };

  const tier = getTier(rating);

  const achievements: BlockAchievement[] = [
    { id: 'first_win', title: 'First Win', desc: '১ম ম্যাচ জয় লাভ করুন', icon: '🏆', unlocked: matchesWon >= 1, progress: Math.min(matchesWon, 1), maxProgress: 1, rewardXp: 50 },
    { id: '5_wins', title: '5 Wins Milestone', desc: '৫টি ম্যাচ জিতুন', icon: '⚡', unlocked: matchesWon >= 5, progress: Math.min(matchesWon, 5), maxProgress: 5, rewardXp: 100 },
    { id: '10_wins', title: '10 Wins Veteran', desc: '১০টি ম্যাচ জিতুন', icon: '🎖️', unlocked: matchesWon >= 10, progress: Math.min(matchesWon, 10), maxProgress: 10, rewardXp: 200 },
    { id: '50_wins', title: '50 Wins Champion', desc: '৫০টি ম্যাচ জিতুন', icon: '👑', unlocked: matchesWon >= 50, progress: Math.min(matchesWon, 50), maxProgress: 50, rewardXp: 500 },
    { id: '100_wins', title: '100 Wins Legend', desc: '১০০টি ম্যাচ জয় লাভ করুন', icon: '🌟', unlocked: matchesWon >= 100, progress: Math.min(matchesWon, 100), maxProgress: 100, rewardXp: 1000 },
    { id: '10_combo', title: '10x Combo Master', desc: 'একক ম্যাচে ১০ কম্বো করুন', icon: '🔥', unlocked: bestCombo >= 10, progress: Math.min(bestCombo, 10), maxProgress: 10, rewardXp: 250 },
    { id: '1000_lines', title: '1000 Lines Cleared', desc: 'মোট ১০০০টি লাইন ক্লিয়ার করুন', icon: '🧱', unlocked: totalLines >= 1000, progress: Math.min(totalLines, 1000), maxProgress: 1000, rewardXp: 400 },
    { id: 'practice_master', title: 'Practice Master', desc: 'প্র্যাকটিসে ৫০০+ স্কোর তুলুন', icon: '🎯', unlocked: practiceBestScore >= 500, progress: Math.min(practiceBestScore, 500), maxProgress: 500, rewardXp: 150 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-[#0e162f] border border-indigo-500/60 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-indigo-900/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <h3 className="font-black text-white text-base">PLAYER PROFILE</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#141b38] flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card */}
        <div className="bg-gradient-to-r from-indigo-950 via-[#161d40] to-purple-950 p-3.5 rounded-2xl border border-indigo-500/40 flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-red-500 p-0.5 shadow-lg flex items-center justify-center text-2xl shrink-0">
            <div className="w-full h-full bg-[#0d1222] rounded-[14px] flex items-center justify-center">
              {avatar || '👤'}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-white text-base truncate">{userName}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-base">{tier.badge}</span>
              <span className={`text-xs font-black ${tier.color}`}>{tier.name}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Rating: <b className="text-amber-400 font-bold">{rating}</b>
            </span>
          </div>
        </div>

        {/* Career Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#121935] p-2 rounded-xl border border-indigo-950">
            <span className="text-[9px] text-slate-400 block font-bold">WINS / LOSSES</span>
            <span className="text-xs font-black text-white font-mono">{matchesWon}W / {matchesLost}L</span>
          </div>

          <div className="bg-[#121935] p-2 rounded-xl border border-indigo-950">
            <span className="text-[9px] text-slate-400 block font-bold">WIN RATE</span>
            <span className="text-xs font-black text-emerald-400 font-mono">{winRate}%</span>
          </div>

          <div className="bg-[#121935] p-2 rounded-xl border border-indigo-950">
            <span className="text-[9px] text-slate-400 block font-bold">BEST SCORE</span>
            <span className="text-xs font-black text-amber-400 font-mono">{bestScore}</span>
          </div>

          <div className="bg-[#121935] p-2 rounded-xl border border-indigo-950">
            <span className="text-[9px] text-slate-400 block font-bold">MAX COMBO</span>
            <span className="text-xs font-black text-cyan-400 font-mono">{bestCombo}x</span>
          </div>

          <div className="bg-[#121935] p-2 rounded-xl border border-indigo-950">
            <span className="text-[9px] text-slate-400 block font-bold">TOTAL LINES</span>
            <span className="text-xs font-black text-purple-400 font-mono">{totalLines}</span>
          </div>

          <div className="bg-[#121935] p-2 rounded-xl border border-indigo-950">
            <span className="text-[9px] text-slate-400 block font-bold">PRACTICE BEST</span>
            <span className="text-xs font-black text-yellow-300 font-mono">{practiceBestScore}</span>
          </div>
        </div>

        {/* Achievements List */}
        <div className="space-y-2">
          <span className="text-xs font-black text-slate-300 uppercase tracking-wide block">
            Achievements & Badges ({achievements.filter(a => a.unlocked).length}/{achievements.length})
          </span>

          <div className="space-y-1.5">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  ach.unlocked
                    ? 'bg-gradient-to-r from-amber-500/10 to-indigo-950 border-amber-500/30'
                    : 'bg-[#121832] border-indigo-950 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{ach.icon}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${ach.unlocked ? 'text-amber-300' : 'text-slate-300'}`}>
                        {ach.title}
                      </span>
                      {ach.unlocked ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Lock className="w-3 h-3 text-slate-500" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block">{ach.desc}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] bg-yellow-400/20 text-yellow-300 font-bold px-1.5 py-0.5 rounded block">
                    +{ach.rewardXp} XP
                  </span>
                  <span className="text-[8px] text-slate-500 font-mono mt-0.5 block">
                    {ach.progress}/{ach.maxProgress}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
