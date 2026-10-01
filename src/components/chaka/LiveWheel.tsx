import React, { useEffect, useRef, useState } from 'react';
import { SLOTS_DATA, GameStatus, SlotItem } from './types';
import { soundManager } from './audio';

interface LiveWheelProps {
  gameStatus: GameStatus;
  winningSlot: SlotItem | null;
  targetSlotId: number | null;
  onSpinComplete: () => void;
  lang: 'bn' | 'en';
}

export const LiveWheel: React.FC<LiveWheelProps> = ({
  gameStatus,
  winningSlot,
  targetSlotId,
  onSpinComplete,
  lang,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentSlotUnderPointer, setCurrentSlotUnderPointer] = useState<SlotItem>(SLOTS_DATA[0]);
  const [isSpinningLocal, setIsSpinningLocal] = useState<boolean>(false);

  const rotationRef = useRef<number>(0);
  const pointerDeflectionRef = useRef<number>(0);
  const lastPinIndexRef = useRef<number>(-1);
  const ledPhaseRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);

  const SECTORS_STYLE = [
    { bgDark: '#B45309', bgLight: '#F59E0B', text: '#FEF08A', icon: '👑' },
    { bgDark: '#0E7490', bgLight: '#06B6D4', text: '#CFFAFE', icon: '💎' },
    { bgDark: '#A16207', bgLight: '#EAB308', text: '#FEF9C3', icon: '⚡' },
    { bgDark: '#047857', bgLight: '#10B981', text: '#D1FAE5', icon: '🍀' },
    { bgDark: '#B91C1C', bgLight: '#EF4444', text: '#FEE2E2', icon: '🦁' },
    { bgDark: '#6D28D9', bgLight: '#A855F7', text: '#F3E8FF', icon: '🚀' },
  ];

  const drawWheel = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    rotationDeg: number,
    pointerDeflection: number,
    isSpinning: boolean
  ) => {
    const cx = width / 2;
    const cy = height / 2;
    const outerRadius = Math.min(cx, cy) - 10;
    const wheelRadius = outerRadius - 22;
    const hubRadius = 52;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;

    const rimGrad = ctx.createRadialGradient(cx, cy, wheelRadius, cx, cy, outerRadius);
    rimGrad.addColorStop(0, '#1E293B');
    rimGrad.addColorStop(0.5, '#0F172A');
    rimGrad.addColorStop(0.85, '#D97706');
    rimGrad.addColorStop(0.95, '#F59E0B');
    rimGrad.addColorStop(1, '#78350F');

    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
    ctx.fillStyle = rimGrad;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius - 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = 3;
    ctx.stroke();

    const ledCount = 24;
    const ledRadius = outerRadius - 11;
    const currentPhase = ledPhaseRef.current;

    for (let i = 0; i < ledCount; i++) {
      const angle = (i * (360 / ledCount) - 90) * (Math.PI / 180);
      const lx = cx + ledRadius * Math.cos(angle);
      const ly = cy + ledRadius * Math.sin(angle);

      const isActive = isSpinning
        ? (i + currentPhase) % 3 === 0
        : Math.abs(i - (currentPhase % ledCount)) <= 1;

      ctx.beginPath();
      ctx.arc(lx, ly, isActive ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? '#FEF08A' : '#475569';
      if (isActive) {
        ctx.shadowColor = '#FBBF24';
        ctx.shadowBlur = 8;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotationDeg * Math.PI) / 180);

    const sectorAngle = (360 / 6) * (Math.PI / 180);

    for (let i = 0; i < 6; i++) {
      const startAngle = i * sectorAngle;
      const endAngle = (i + 1) * sectorAngle;
      const midAngle = startAngle + sectorAngle / 2;
      const style = SECTORS_STYLE[i];
      const slot = SLOTS_DATA[i];

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, wheelRadius, startAngle, endAngle);
      ctx.closePath();

      const secGrad = ctx.createRadialGradient(0, 0, hubRadius, 0, 0, wheelRadius);
      secGrad.addColorStop(0, style.bgDark);
      secGrad.addColorStop(1, style.bgLight);
      ctx.fillStyle = secGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(wheelRadius * Math.cos(startAngle), wheelRadius * Math.sin(startAngle));
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.save();
      ctx.rotate(midAngle);

      const textRadius = (wheelRadius + hubRadius) / 2 + 10;

      ctx.font = 'bold 24px "Hind Siliguri", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.lineWidth = 4;
      ctx.strokeText(slot.numberBn, textRadius + 12, 0);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(slot.numberBn, textRadius + 12, 0);

      ctx.font = '22px sans-serif';
      ctx.fillText(style.icon, textRadius - 26, 0);

      ctx.font = 'bold 12px "Hind Siliguri", sans-serif';
      const label = lang === 'bn' ? slot.nameBn : slot.nameEn;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.lineWidth = 3;
      ctx.strokeText(label, textRadius - 48, 0);

      ctx.fillStyle = style.text;
      ctx.fillText(label, textRadius - 48, 0);

      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 3;
    ctx.stroke();

    const pinCount = 24;
    for (let p = 0; p < pinCount; p++) {
      const pAngle = p * (360 / pinCount) * (Math.PI / 180);
      const px = (wheelRadius - 5) * Math.cos(pAngle);
      const py = (wheelRadius - 5) * Math.sin(pAngle);

      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#FEF08A';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 3;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, hubRadius, 0, Math.PI * 2);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 4;

    const hubGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, hubRadius);
    hubGrad.addColorStop(0, '#FEF08A');
    hubGrad.addColorStop(0.35, '#D97706');
    hubGrad.addColorStop(0.8, '#78350F');
    hubGrad.addColorStop(1, '#451A03');
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, hubRadius - 6, 0, Math.PI * 2);
    ctx.fillStyle = '#0F172A';
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👑', cx, cy - 8);

    ctx.font = 'bold 11px "Hind Siliguri", sans-serif';
    ctx.fillStyle = '#FEF08A';
    ctx.fillText(lang === 'bn' ? 'লাইভ চাকা' : 'LIVE WHEEL', cx, cy + 14);

    ctx.save();
    const pointerTopY = cy - outerRadius - 2;
    const pointerLength = 34;

    ctx.translate(cx, pointerTopY);
    ctx.rotate((pointerDeflection * Math.PI) / 180);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    ctx.beginPath();
    ctx.moveTo(0, pointerLength);
    ctx.lineTo(-12, 0);
    ctx.lineTo(12, 0);
    ctx.closePath();

    const pointerGrad = ctx.createLinearGradient(-12, 0, 12, pointerLength);
    pointerGrad.addColorStop(0, '#FEF08A');
    pointerGrad.addColorStop(0.5, '#F59E0B');
    pointerGrad.addColorStop(1, '#B45309');
    ctx.fillStyle = pointerGrad;
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 4, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.restore();
  };

  const getSectorAtPointer = (deg: number): SlotItem => {
    const normalized = ((((270 - deg) % 360) + 360) % 360);
    const sectorIndex = Math.floor(normalized / 60) % 6;
    return SLOTS_DATA[sectorIndex];
  };

  useEffect(() => {
    const ledTimer = setInterval(() => {
      ledPhaseRef.current = (ledPhaseRef.current + 1) % 24;
      if (!isSpinningLocal && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawWheel(
            ctx,
            canvas.width / (window.devicePixelRatio || 1),
            canvas.height / (window.devicePixelRatio || 1),
            rotationRef.current,
            pointerDeflectionRef.current,
            false
          );
        }
      }
    }, 180);
    return () => clearInterval(ledTimer);
  }, [isSpinningLocal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let resizeObserver: ResizeObserver | null = null;

    const renderWheel = () => {
      const rect = canvas.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);

      if (!size || size < 10) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawWheel(
        ctx,
        size,
        size,
        rotationRef.current,
        pointerDeflectionRef.current,
        isSpinningLocal
      );
    };

    renderWheel();

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(renderWheel);
      resizeObserver.observe(canvas);
    } else {
      window.addEventListener('resize', renderWheel);
    }

    const frameId = requestAnimationFrame(renderWheel);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', renderWheel);
    };
  }, [lang, isSpinningLocal]);
  useEffect(() => {
    if (gameStatus === 'SPINNING' && targetSlotId !== null && !isSpinningLocal) {
      setIsSpinningLocal(true);
      soundManager.playSpinStart();

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const displaySize = canvas.width / dpr;

      const winningSlotIndex = targetSlotId - 1;
      const sectorCenter = (winningSlotIndex + 0.5) * 60;
      const targetModulo = (((270 - sectorCenter) % 360) + 360) % 360;

      const naturalJitter = (Math.random() - 0.5) * 24;
      const targetRemainder = (((targetModulo + naturalJitter) % 360) + 360) % 360;

      const fullRotations = 7;
      const startAngle = rotationRef.current;
      const currentMod = ((startAngle % 360) + 360) % 360;
      let forwardDelta = targetRemainder - currentMod;
      if (forwardDelta < 0) {
        forwardDelta += 360;
      }
      const totalDelta = fullRotations * 360 + forwardDelta;
      const finalAngle = startAngle + totalDelta;

      const duration = 8500;
      const startTime = performance.now();
      lastPinIndexRef.current = Math.floor(startAngle / 15);

      const smoothCasinoEasing = (t: number): number => {
        return 1 - Math.pow(1 - t, 4.3);
      };

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = smoothCasinoEasing(progress);

        const currentAngle = startAngle + totalDelta * easedProgress;
        rotationRef.current = currentAngle;

        const currentPinIndex = Math.floor(currentAngle / 15);
        if (currentPinIndex !== lastPinIndexRef.current) {
          lastPinIndexRef.current = currentPinIndex;

          const speedFactor = 1 - progress;
          soundManager.playWheelTick(Math.min(5, Math.floor(speedFactor * 6)));
          pointerDeflectionRef.current = Math.min(14, 4 + speedFactor * 10);
        }

        pointerDeflectionRef.current *= 0.82;

        const underPointer = getSectorAtPointer(currentAngle);
        setCurrentSlotUnderPointer(underPointer);

        drawWheel(
          ctx,
          displaySize,
          displaySize,
          currentAngle,
          pointerDeflectionRef.current,
          true
        );

        if (progress < 1) {
          animFrameIdRef.current = requestAnimationFrame(animate);
        } else {
          rotationRef.current = finalAngle;
          pointerDeflectionRef.current = 0;
          drawWheel(ctx, displaySize, displaySize, finalAngle, 0, false);
          setIsSpinningLocal(false);
          onSpinComplete();
        }
      };

      animFrameIdRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [gameStatus, targetSlotId]);

  return (
    <div className="relative flex flex-col items-center justify-center p-2 sm:p-4 w-full select-none">
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none -z-10" />

      <div className="mb-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-2 shadow-sm">
        <span className="text-amber-400">🎯 {lang === 'bn' ? 'কাঁটা বর্তমানে:' : 'Current Slot:'}</span>
        <div className="flex items-center gap-1.5">
          <span
            className="w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold text-slate-950"
            style={{ backgroundColor: currentSlotUnderPointer.colorHex }}
          >
            {currentSlotUnderPointer.numberBn}
          </span>
          <span className="text-white font-bold">
            {lang === 'bn' ? currentSlotUnderPointer.nameBn : currentSlotUnderPointer.nameEn}
          </span>
        </div>
      </div>

      <div className="relative w-[240px] h-[240px] sm:w-[310px] sm:h-[310px] max-w-[85vw] aspect-square flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full drop-shadow-[0_8px_28px_rgba(0,0,0,0.85)] cursor-pointer"
        />
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs font-medium">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full ${
            gameStatus === 'SPINNING'
              ? 'bg-amber-400 animate-ping'
              : gameStatus === 'ROUND_RESULT'
              ? 'bg-emerald-400'
              : 'bg-emerald-500 animate-pulse'
          }`}
        />
        <span className="text-slate-300">
          {gameStatus === 'BETTING_OPEN'
            ? lang === 'bn' ? 'বাজি খোলা আছে · ঘর বেছে নিন' : 'Bets Open · Choose Your Slot'
            : gameStatus === 'BETTING_CLOSED'
            ? lang === 'bn' ? 'বাজি সমাপ্ত · লাইভ স্পিন শুরু হচ্ছে...' : 'Bets Closed · Spinning Live...'
            : gameStatus === 'SPINNING'
            ? lang === 'bn' ? 'চাকা ঘুরছে... গতি ধীরে কমে আসছে!' : 'Spinning... decelerating smoothly!'
            : gameStatus === 'ROUND_RESULT' && winningSlot
            ? lang === 'bn' ? `বিজয়ী ঘর: ${winningSlot.numberBn} - ${winningSlot.nameBn}` : `Winner: ${winningSlot.nameEn} (#${winningSlot.id})`
            : lang === 'bn' ? 'পরবর্তী রাউন্ড অপেক্ষা করছে' : 'Next Round Soon'}
        </span>
      </div>
    </div>
  );
};
