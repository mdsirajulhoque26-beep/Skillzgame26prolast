export interface SlotItem {
  id: number;
  numberBn: string;
  nameBn: string;
  nameEn: string;
  iconName: 'crown' | 'diamond' | 'zap' | 'clover' | 'flame' | 'rocket';
  colorHex: string;
  textColor: string;
  bgGradient: string;
  borderColor: string;
  glowColor: string;
  multiplier: number;
}

export type GameStatus = 'BETTING_OPEN' | 'BETTING_CLOSED' | 'SPINNING' | 'ROUND_RESULT' | 'PAUSED';

export interface UserBet {
  slotId: number;
  amount: number;
}

export interface LiveAudienceBet {
  id: string;
  userName: string;
  userAvatar: string;
  location: string;
  slotId: number;
  amount: number;
  timestamp: number;
}

export interface RoundHistoryItem {
  roundNumber: number;
  winningSlotId: number;
  totalPool: number;
  totalBetsCount: number;
  userBet: number;
  userWon: number;
  timestamp: string;
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  avatar: string;
  location: string;
  totalWinnings: number;
  winRate: string;
  badge: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  isLoggedIn: boolean;
  avatarColor: string;
  joinedDate: string;
}

export interface AdminSettings {
  roundDurationSeconds: number;
  minBet: number;
  maxBet: number;
  houseCommissionPercent: number;
  outcomeMode: 'FAIR_RNG' | 'ADMIN_OVERRIDE';
  forcedSlotId: number | null;
  autoSpinEnabled: boolean;
  broadcastBanner: string;
  totalHouseEarnings: number;
}

export const SLOTS_DATA: SlotItem[] = [
  {
    id: 1,
    numberBn: '১',
    nameBn: 'রাজমুকুট',
    nameEn: 'Royal Crown',
    iconName: 'crown',
    colorHex: '#F59E0B',
    textColor: 'text-amber-400',
    bgGradient: 'from-amber-600/40 via-amber-950/60 to-slate-950',
    borderColor: 'border-amber-500/50',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    multiplier: 5.5,
  },
  {
    id: 2,
    numberBn: '২',
    nameBn: 'নীল হীরা',
    nameEn: 'Blue Diamond',
    iconName: 'diamond',
    colorHex: '#06B6D4',
    textColor: 'text-cyan-400',
    bgGradient: 'from-cyan-600/40 via-cyan-950/60 to-slate-950',
    borderColor: 'border-cyan-500/50',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    multiplier: 5.5,
  },
  {
    id: 3,
    numberBn: '৩',
    nameBn: 'বজ্রপাত',
    nameEn: 'Thunder Bolt',
    iconName: 'zap',
    colorHex: '#EAB308',
    textColor: 'text-yellow-300',
    bgGradient: 'from-yellow-600/40 via-yellow-950/60 to-slate-950',
    borderColor: 'border-yellow-500/50',
    glowColor: 'rgba(234, 179, 8, 0.4)',
    multiplier: 5.5,
  },
  {
    id: 4,
    numberBn: '৪',
    nameBn: 'লাকি ক্লোভার',
    nameEn: 'Lucky Clover',
    iconName: 'clover',
    colorHex: '#10B981',
    textColor: 'text-emerald-400',
    bgGradient: 'from-emerald-600/40 via-emerald-950/60 to-slate-950',
    borderColor: 'border-emerald-500/50',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    multiplier: 5.5,
  },
  {
    id: 5,
    numberBn: '৫',
    nameBn: 'রয়েল লায়ন',
    nameEn: 'Royal Lion',
    iconName: 'flame',
    colorHex: '#EF4444',
    textColor: 'text-red-400',
    bgGradient: 'from-red-600/40 via-red-950/60 to-slate-950',
    borderColor: 'border-red-500/50',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    multiplier: 5.5,
  },
  {
    id: 6,
    numberBn: '৬',
    nameBn: 'মেগা রকেট',
    nameEn: 'Mega Rocket',
    iconName: 'rocket',
    colorHex: '#A855F7',
    textColor: 'text-purple-400',
    bgGradient: 'from-purple-600/40 via-purple-950/60 to-slate-950',
    borderColor: 'border-purple-500/50',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    multiplier: 5.5,
  },
];