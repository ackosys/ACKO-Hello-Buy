'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  loadSnapshot,
  clearSnapshot,
  getDropOffDisplay,
  type ProductKey,
  type JourneySnapshot,
} from '../../lib/journeyPersist';
import { useThemeStore } from '../../lib/themeStore';
import { useT } from '../../lib/translations';

const PRODUCT_CONFIG: Record<ProductKey, {
  label: string;
  gradient: string;
  accentColor: string;
  illustration: React.ReactNode;
}> = {
  health: {
    label: 'Health',
    gradient: 'linear-gradient(135deg, #0a2a1e 0%, #0d4a30 50%, #1a6b45 100%)',
    accentColor: '#34d399',
    illustration: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <circle cx="40" cy="40" r="36" fill="rgba(52,211,153,0.12)" />
        <circle cx="40" cy="40" r="26" fill="rgba(52,211,153,0.15)" />
        <path d="M28 40h24M40 28v24" stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
        <path d="M30 32c0-5.52 4.48-10 10-10s10 4.48 10 10c0 7-10 18-10 18S30 39 30 32z"
          fill="rgba(52,211,153,0.3)" stroke="#34d399" strokeWidth="1.5" />
      </svg>
    ),
  },
  car: {
    label: 'Car',
    gradient: 'linear-gradient(135deg, #0a1628 0%, #1a2d55 50%, #1e3a7a 100%)',
    accentColor: '#60a5fa',
    illustration: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <circle cx="40" cy="40" r="36" fill="rgba(96,165,250,0.1)" />
        <rect x="16" y="38" width="48" height="18" rx="4" fill="rgba(96,165,250,0.2)" stroke="#60a5fa" strokeWidth="1.5" />
        <path d="M20 38l6-12h28l6 12" stroke="#60a5fa" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="26" cy="57" r="5" fill="rgba(96,165,250,0.3)" stroke="#60a5fa" strokeWidth="1.5" />
        <circle cx="54" cy="57" r="5" fill="rgba(96,165,250,0.3)" stroke="#60a5fa" strokeWidth="1.5" />
        <rect x="28" y="28" width="24" height="10" rx="2" fill="rgba(96,165,250,0.25)" />
      </svg>
    ),
  },
  bike: {
    label: 'Bike',
    gradient: 'linear-gradient(135deg, #1a1205 0%, #3d2a07 50%, #5c3d0a 100%)',
    accentColor: '#fb923c',
    illustration: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <circle cx="40" cy="40" r="36" fill="rgba(251,146,60,0.1)" />
        <circle cx="24" cy="50" r="10" fill="rgba(251,146,60,0.2)" stroke="#fb923c" strokeWidth="1.5" />
        <circle cx="56" cy="50" r="10" fill="rgba(251,146,60,0.2)" stroke="#fb923c" strokeWidth="1.5" />
        <path d="M24 50l12-18h8l12 18" stroke="#fb923c" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M44 32l8-6" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="24" cy="50" r="4" fill="rgba(251,146,60,0.4)" />
        <circle cx="56" cy="50" r="4" fill="rgba(251,146,60,0.4)" />
      </svg>
    ),
  },
  life: {
    label: 'Life',
    gradient: 'linear-gradient(135deg, #1a0a2e 0%, #3a1060 50%, #5a1a8e 100%)',
    accentColor: '#c084fc',
    illustration: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <circle cx="40" cy="40" r="36" fill="rgba(192,132,252,0.1)" />
        <path d="M40 58s-20-12-20-26c0-8 6-14 14-14 3.5 0 6.8 1.3 9.2 3.4A13.9 13.9 0 0154 18c8 0 14 6 14 14C68 46 40 58 40 58z"
          fill="rgba(192,132,252,0.25)" stroke="#c084fc" strokeWidth="1.5" />
        <path d="M34 34l6 6 8-10" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
};

const URGENCY_COLORS: Record<string, string> = {
  high:   'bg-red-500/20 text-red-300 border-red-500/30',
  medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  low:    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

function relativeTime(iso: string, t: ReturnType<typeof useT>): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return t.dropOff.justNow;
  if (mins < 60) return t.dropOff.minsAgo(mins);
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t.dropOff.hoursAgo(hours);
  return t.dropOff.daysAgo(Math.floor(hours / 24));
}

interface CardProps {
  snap: JourneySnapshot;
  onDismiss: (product: ProductKey) => void;
  onClick: (route: string) => void;
  isOnly: boolean;
}

function DropOffCard({ snap, onDismiss, onClick, isOnly }: CardProps) {
  const display = getDropOffDisplay(snap);
  const theme = useThemeStore((s) => s.theme);
  const t = useT();
  if (!display) return null;

  const config = PRODUCT_CONFIG[snap.product];
  const productLabels: Record<ProductKey, string> = {
    health: t.dropOff.healthLabel,
    car: t.dropOff.carLabel,
    bike: t.dropOff.bikeLabel,
    life: t.dropOff.lifeLabel,
  };
  const shadow = theme === 'light'
    ? '0 2px 12px rgba(0,0,0,0.08)'
    : '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, x: -20 }}
      transition={{ duration: 0.3 }}
      className={`relative flex-shrink-0 rounded-2xl overflow-hidden ${isOnly ? 'w-full' : 'w-[85vw] max-w-[320px]'}`}
      style={{
        height: 180,
        background: config.gradient,
        boxShadow: shadow,
      }}
    >
      {/* Dismiss */}
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(snap.product); }}
        className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors"
        style={{ background: 'rgba(255,255,255,0.1)' }}
        aria-label="Dismiss"
      >
        <svg className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.6)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Tap area */}
      <button onClick={() => onClick(display.route)} className="w-full h-full text-left p-4 flex flex-col">
        {/* Top: product + badge + illustration */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: config.accentColor }}>
              {productLabels[snap.product]}
            </span>
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${URGENCY_COLORS[display.urgency]}`}>
              {display.badge}
            </span>
          </div>
          <div className="flex-shrink-0 w-[56px] h-[56px] opacity-60">
            {config.illustration}
          </div>
        </div>

        {/* Middle: title + subtitle */}
        <div className="flex-1 min-w-0 mt-1">
          <p className="font-bold text-[15px] leading-[1.3] line-clamp-2" style={{ color: '#FFFFFF' }}>
            {display.title}
          </p>
          {display.subtitle && (
            <p className="text-[11px] leading-snug mt-1 line-clamp-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{display.subtitle}</p>
          )}
        </div>

        {/* Bottom: CTA + timestamp */}
        <div className="flex items-center gap-2.5 mt-auto pt-2">
          <div
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-transform active:scale-[0.97]"
            style={{ background: config.accentColor, color: '#0a0a0a' }}
          >
            {display.ctaLabel}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{relativeTime(snap.savedAt, t)}</span>
        </div>
      </button>
    </motion.div>
  );
}

const ALL_PRODUCTS: ProductKey[] = ['health', 'life', 'car', 'bike'];

const DEMO_SNAPSHOTS: JourneySnapshot[] = [
  {
    product: 'life',
    currentStepId: 'life_ekyc',
    savedAt: new Date(Date.now() - 120000).toISOString(),
    name: 'Chirag',
    coverAmount: 10000000,
    annualPremium: 8900,
    ekycComplete: false,
  },
  {
    product: 'health',
    currentStepId: 'recommendation.result',
    savedAt: new Date(Date.now() - 3600000).toISOString(),
    userName: 'Chirag',
    members: [{ relation: 'self', age: 28 }, { relation: 'spouse', age: 26 }],
    currentPremium: 890,
    paymentFrequency: 'monthly',
  },
  {
    product: 'car',
    currentStepId: 'quote.plan_selected',
    savedAt: new Date(Date.now() - 7200000).toISOString(),
    vehicleType: 'car',
    vehicleData: { make: 'Hyundai', model: 'Venue' },
    registrationNumber: 'KA01AB1234',
    totalPremium: 12500,
    selectedPlanType: 'comprehensive',
  },
  {
    product: 'bike',
    currentStepId: 'quote.plans_ready',
    savedAt: new Date(Date.now() - 10800000).toISOString(),
    vehicleType: 'bike',
    vehicleData: { make: 'Royal Enfield', model: 'Classic 350' },
    registrationNumber: 'MH02CD5678',
    totalPremium: 4500,
  },
];

export default function DropOffBanner() {
  const router = useRouter();
  const [snapshots, setSnapshots] = useState<JourneySnapshot[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const found: JourneySnapshot[] = [];
    const realProducts = new Set<ProductKey>();

    for (const product of ALL_PRODUCTS) {
      const snap = loadSnapshot(product);
      if (snap && getDropOffDisplay(snap)) {
        found.push(snap);
        realProducts.add(product);
      }
    }

    // Fill in demo snapshots for LOBs that don't have real ones
    for (const demo of DEMO_SNAPSHOTS) {
      if (!realProducts.has(demo.product) && getDropOffDisplay(demo)) {
        found.push(demo);
      }
    }

    found.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    setSnapshots(found);
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || snapshots.length <= 1) return;
    const scrollLeft = el.scrollLeft;
    const cardWidth = el.querySelector('[data-card]')?.clientWidth || 300;
    const gap = 12;
    const idx = Math.round(scrollLeft / (cardWidth + gap));
    setActiveIndex(Math.min(idx, snapshots.length - 1));
  }, [snapshots.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToIndex = (idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelectorAll('[data-card]')[idx] as HTMLElement | undefined;
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
  };

  const handleDismiss = (product: ProductKey) => {
    clearSnapshot(product);
    setSnapshots(prev => {
      const next = prev.filter(s => s.product !== product);
      if (activeIndex >= next.length) setActiveIndex(Math.max(0, next.length - 1));
      return next;
    });
  };

  const handleClick = (route: string) => {
    router.push(route);
  };

  if (snapshots.length === 0) return null;

  const isOnly = snapshots.length === 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        {/* Header */}
        <div className="px-6 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
            </span>
            <p className="text-[11px] font-bold text-white/80 tracking-wider uppercase">
              Continue where you left off
            </p>
          </div>
          <span className="text-[11px] text-white/40 font-medium">{snapshots.length} pending</span>
        </div>

        {/* Horizontal scroll */}
        <div
          ref={scrollRef}
          className="flex gap-3 px-6 overflow-x-auto scrollbar-hide pb-1"
          style={{ scrollSnapType: 'x mandatory', scrollPaddingInlineStart: '24px', WebkitOverflowScrolling: 'touch' }}
        >
          <AnimatePresence mode="popLayout">
            {snapshots.map(snap => (
              <div key={snap.product} data-card style={{ scrollSnapAlign: 'start' }}>
                <DropOffCard
                  snap={snap}
                  onDismiss={handleDismiss}
                  onClick={handleClick}
                  isOnly={isOnly}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>

        {/* Scroll indicators */}
        {snapshots.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {snapshots.map((snap, i) => (
              <button
                key={snap.product}
                onClick={() => scrollToIndex(i)}
                className="h-1.5 rounded-full transition-all duration-300 hover:opacity-80"
                style={{
                  width: i === activeIndex ? '20px' : '6px',
                  background: i === activeIndex
                    ? PRODUCT_CONFIG[snap.product].accentColor
                    : 'var(--app-text-subtle, rgba(255,255,255,0.2))',
                }}
                aria-label={`Scroll to ${PRODUCT_CONFIG[snap.product].label}`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
