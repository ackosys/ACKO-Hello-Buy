'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useJourneyStore } from '../lib/store';
import LanguageSelector from '../components/LanguageSelector';
import AckoLogo from '../components/AckoLogo';
import PolicyActionScreen, { type PolicyStatusInfo } from '../components/global/PolicyActionScreen';
import { useUserProfileStore, type PolicyLob } from '../lib/userProfileStore';
import { useThemeStore } from '../lib/themeStore';
import { useLanguageStore } from '../lib/languageStore';
import {
  loadSnapshot,
  getDropOffDisplay,
  clearAllSnapshots,
  type ProductKey,
} from '../lib/journeyPersist';
import type { Language } from '../lib/types';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

type LobId = 'car' | 'bike' | 'health' | 'life';

interface LobCardData {
  id: LobId;
  title: string;
  tagline: string;
  heroImage: string;
  route: string;
}

const LOB_CARDS: LobCardData[] = [
  { id: 'car', title: 'Car insurance', tagline: 'Cashless claims at any preferred garage', heroImage: `${BASE}/offerings/car-card.png`, route: '/motor?vehicle=car' },
  { id: 'bike', title: 'Bike & Scooter', tagline: 'Get your policy in just 2 mins', heroImage: `${BASE}/offerings/bike-card.png`, route: '/motor?vehicle=bike' },
  { id: 'health', title: 'Health insurance', tagline: '100% hospital bill payments. No surprises.', heroImage: `${BASE}/offerings/health-card.png`, route: '/health' },
  { id: 'life', title: 'Life insurance', tagline: 'Secure your loved ones with term life insurance', heroImage: `${BASE}/offerings/life-card.png`, route: '/life' },
];

const LOB_LABEL_MAP: Record<string, string> = {
  car: 'Car Insurance', bike: 'Bike Insurance',
  health: 'Health Insurance', life: 'Life Insurance',
};

const LOB_TO_PRODUCT: Record<LobId, ProductKey> = {
  car: 'car', bike: 'bike', health: 'health', life: 'life',
};

const LANG_ORDER: Language[] = ['en', 'hi', 'hinglish', 'kn'];
const LANG_LABELS: Record<string, string> = { en: 'English', hi: 'हिन्दी', hinglish: 'Hinglish', kn: 'ಕನ್ನಡ' };
const THEME_LABELS: Record<string, string> = { dark: 'Dark', light: 'Light' };

interface LobOverride {
  badge: string;
  title: string;
  subtitle: string;
  route: string;
  urgency: 'high' | 'medium' | 'low';
  ctaLabel: string;
  statusInfo?: PolicyStatusInfo | null;
}

function computeSnapshots(): Partial<Record<LobId, LobOverride>> {
  const result: Partial<Record<LobId, LobOverride>> = {};
  for (const lobId of Object.keys(LOB_TO_PRODUCT) as LobId[]) {
    const product = LOB_TO_PRODUCT[lobId];
    const snap = loadSnapshot(product);
    if (!snap) continue;
    const display = getDropOffDisplay(snap);
    if (!display) continue;

    let statusInfo: PolicyStatusInfo | null = null;
    const stepId = snap.currentStepId;
    if (stepId === 'life_db.personal_submitted') statusInfo = { badge: 'Update in progress', message: 'Personal info update · Processing in 2-3 days', urgency: 'low' };
    else if (stepId === 'life_db.nominee_submitted') statusInfo = { badge: 'Update in progress', message: 'Nominee update · Verification in 2-3 days', urgency: 'low' };
    else if (stepId === 'life_db.coverage_submitted') statusInfo = { badge: 'Under review', message: 'Coverage update · Review in 5-7 days', urgency: 'medium' };
    else if (stepId === 'db.claim_submitted') {
      const l = LOB_LABEL_MAP[lobId]?.replace(' Insurance', '') || lobId;
      statusInfo = { badge: 'Claim submitted', message: `${l} claim request · Processing in 3-5 days`, urgency: 'low' };
    } else if (stepId === 'db.edit_done') {
      const l = LOB_LABEL_MAP[lobId]?.replace(' Insurance', '') || lobId;
      statusInfo = { badge: 'Update in progress', message: `${l} policy update · Effective next billing cycle`, urgency: 'low' };
    }

    const vehicleName = [snap.vehicleData?.make, snap.vehicleData?.model].filter(Boolean).join(' ');
    const regNumber = snap.registrationNumber?.toUpperCase() || '';

    result[lobId] = {
      badge: display.badge,
      title: vehicleName || display.title,
      subtitle: regNumber || display.subtitle || '',
      route: display.route,
      urgency: display.urgency,
      ctaLabel: display.ctaLabel,
      statusInfo,
    };
  }
  return result;
}

function useLobSnapshots() {
  const [overrides, setOverrides] = useState<Partial<Record<LobId, LobOverride>>>(() => {
    if (typeof window === 'undefined') return {};
    return computeSnapshots();
  });

  const reload = useCallback(() => setOverrides(computeSnapshots()), []);

  useEffect(() => {
    reload();
    const onVis = () => { if (document.visibilityState === 'visible') reload(); };
    const onFocus = () => reload();
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) reload(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [reload]);

  return overrides;
}

/* ── Floating Header Pill ── */
function HeaderPill({
  isLoggedIn,
  initial,
  theme,
  showMenu,
  onToggleMenu,
  onThemeCycle,
  onLangCycle,
  onResetFTU,
  langLabel,
}: {
  isLoggedIn: boolean;
  initial: string;
  theme: string;
  showMenu: boolean;
  onToggleMenu: () => void;
  onThemeCycle: () => void;
  onLangCycle: () => void;
  onResetFTU: () => void;
  langLabel: string;
}) {
  const router = useRouter();
  const isLight = theme === 'light';
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 60) { setHeaderVisible(true); }
      else if (y < lastScrollY.current) { setHeaderVisible(true); }
      else if (y > lastScrollY.current + 5) { setHeaderVisible(false); }
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.div
      className="sticky top-0 z-50 pt-3 px-4"
      animate={{ y: headerVisible ? 0 : -80 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
    >
      <div
        className="flex items-center justify-between px-3 h-[56px] rounded-2xl"
        style={{
          background: isLight ? '#f5f5f5' : '#121212',
          boxShadow: '0 20px 20px rgba(0,0,0,0.02), 0 6px 6px rgba(0,0,0,0.02), 0 2px 4px rgba(0,0,0,0.02)',
        }}
      >
        <AckoLogo variant={isLight ? 'color' : 'white'} className="h-[20px]" />

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <button
              onClick={() => router.push('/profile')}
              className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[15px] font-medium"
              style={{ background: isLight ? '#c4a97d' : '#8B6F47', color: isLight ? '#121212' : 'white' }}
            >
              {initial}
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="h-[36px] px-4 rounded-lg text-[14px] font-medium tracking-[-0.28px]"
              style={{
                background: isLight ? '#e0e0e1' : '#19191a',
                color: isLight ? 'black' : '#fefefe',
                border: isLight ? 'none' : '1px solid #6841e6',
              }}
            >
              Login
            </button>
          )}

          {/* Hamburger */}
          <div className="relative">
            <button
              onClick={onToggleMenu}
              className="w-8 h-8 flex items-center justify-center"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isLight ? '#121212' : 'white'} strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={onToggleMenu} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 z-50 rounded-xl overflow-hidden shadow-2xl min-w-[200px]"
                    style={{
                      background: isLight ? 'white' : 'rgba(30,30,30,0.95)',
                      border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(20px)',
                    }}
                  >
                    <button
                      onClick={onThemeCycle}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-2.5 transition-colors"
                      style={{
                        color: isLight ? '#121212' : 'rgba(255,255,255,0.85)',
                        borderBottom: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {theme === 'dark' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
                      )}
                      Mode: {THEME_LABELS[theme]}
                    </button>
                    <button
                      onClick={onLangCycle}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-2.5 transition-colors"
                      style={{
                        color: isLight ? '#121212' : 'rgba(255,255,255,0.85)',
                        borderBottom: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                      </svg>
                      Lang: {langLabel}
                    </button>
                    <button
                      onClick={onResetFTU}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-2.5 transition-colors"
                      style={{ color: '#f87171' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 4v6h6M23 20v-6h-6" />
                        <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                      </svg>
                      Reset to FTU
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Hero Greeting with transparent-bg webm logo ── */
function HeroGreeting({ firstName, subtitle }: { firstName: string; subtitle?: string }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-2 px-6 pt-8 pb-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="w-[84px] h-[84px] mb-1">
        <video
          src={`${BASE}/offerings/logo-animation.webm`}
          autoPlay
          loop
          muted
          playsInline
          style={{ width: 84, height: 84, objectFit: 'contain' }}
        />
      </div>
      <div className="text-center">
        <h1
          className="text-[24px] font-semibold tracking-[-0.3px] leading-[32px]"
          style={{ color: 'var(--app-text)' }}
        >
          {firstName ? `Hello ${firstName}` : 'Hello'}
        </h1>
        <p
          className="text-[18px] leading-[26px] mt-1 whitespace-pre-line"
          style={{ color: 'var(--app-text-muted)' }}
        >
          {subtitle || 'What insurance are you interested in?'}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Policies Bottom Sheet ── */
function PoliciesBottomSheet({ isOpen, onClose, theme, onViewProfile }: {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  onViewProfile: () => void;
}) {
  const { policies } = useUserProfileStore();
  const activePolicies = policies.filter(p => p.active);

  const LOB_LABELS: Record<string, string> = {
    car: 'Car Insurance', bike: 'Bike Insurance',
    health: 'Health Insurance', life: 'Life Insurance',
  };
  const LOB_ICON: Record<string, string> = {
    car: `${BASE}/icons/vehicles.svg`, bike: `${BASE}/icons/vehicles.svg`,
    health: `${BASE}/icons/family.svg`, life: `${BASE}/icons/life.svg`,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`app-${theme} fixed inset-0 z-[9998]`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {/* Backdrop */}
          <motion.div
            key="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            key="sheet-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-[1] rounded-t-3xl"
            style={{ background: 'var(--app-surface)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--app-border-strong)' }} />
            </div>

            {/* Header */}
            <div className="px-5 pt-1 pb-4 shrink-0">
              <h2 className="text-[20px] font-semibold leading-[28px]" style={{ color: 'var(--app-text)' }}>
                My policies
              </h2>
              <p className="text-[13px] leading-[18px] mt-0.5" style={{ color: 'var(--app-text-muted)' }}>
                {activePolicies.length} active {activePolicies.length === 1 ? 'policy' : 'policies'}
              </p>
            </div>

            <div className="w-full h-px shrink-0" style={{ background: 'var(--app-border)' }} />

            {/* Policy list */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
              {activePolicies.map((policy, idx) => (
                <motion.div
                  key={policy.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--app-surface)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={LOB_ICON[policy.lob] || LOB_ICON.car} alt={policy.lob} width={20} height={20} style={{ opacity: 0.7 }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold leading-[20px] truncate" style={{ color: 'var(--app-text)' }}>
                      {policy.label}
                    </p>
                    {policy.details && (
                      <p className="text-[12px] leading-[16px] mt-0.5 truncate" style={{ color: 'var(--app-text-muted)' }}>
                        {policy.details}
                      </p>
                    )}
                    <p className="text-[11px] leading-[14px] mt-0.5" style={{ color: 'var(--app-text-subtle)' }}>
                      {LOB_LABELS[policy.lob] || policy.lob}
                    </p>
                  </div>

                  {policy.urgent && (
                    <div className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{ background: 'rgba(216,61,55,0.1)', color: '#D83D37' }}>
                      Renew
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Footer CTA */}
            <div className="px-5 pb-8 pt-3 shrink-0" style={{ borderTop: '1px solid var(--app-border)' }}>
              <button
                onClick={() => { onClose(); onViewProfile(); }}
                className="w-full h-[52px] rounded-2xl text-[15px] font-semibold"
                style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
              >
                View all in profile
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── Manage My Policies Card ── */
function ManagePoliciesCard({ onClick }: { onClick: () => void }) {
  const { policies } = useUserProfileStore();
  const activePolicies = policies.filter(p => p.active);

  const vehicleCount = activePolicies.some(p => p.lob === 'car' || p.lob === 'bike');
  const healthCount = activePolicies.some(p => p.lob === 'health');
  const lifeCount = activePolicies.some(p => p.lob === 'life');

  const vehicleUrgent = activePolicies.some(p => (p.lob === 'car' || p.lob === 'bike') && p.urgent);
  const healthUrgent = activePolicies.some(p => p.lob === 'health' && p.urgent);
  const lifeUrgent = activePolicies.some(p => p.lob === 'life' && p.urgent);

  const pills = [
    healthCount && { label: 'Health', urgent: healthUrgent, iconSrc: `${BASE}/icons/family.svg` },
    lifeCount && { label: 'Life', urgent: lifeUrgent, iconSrc: `${BASE}/icons/life.svg` },
    vehicleCount && { label: 'Vehicles', urgent: vehicleUrgent, iconSrc: `${BASE}/icons/vehicles.svg` },
  ].filter(Boolean) as { label: string; urgent: boolean; iconSrc: string }[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="relative overflow-hidden rounded-3xl cursor-pointer"
      style={{
        background: 'var(--app-surface)',
        border: '1px solid var(--app-border)',
        padding: '20px',
      }}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
    >
      {/* Header */}
      <div className="flex flex-col gap-1 mb-4">
        <h3 className="text-[18px] font-semibold leading-[22px]" style={{ color: 'var(--app-text)' }}>
          Manage my policies
        </h3>
        <p className="text-[12px] leading-[16px]" style={{ color: 'var(--app-text-muted)' }}>
          View, renew, claim, download docs
        </p>
      </div>

      {/* Category pills — red dot only for renewal/urgent */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {pills.map(pill => (
          <div key={pill.label} className="relative flex items-center gap-1 px-2 py-1 rounded-[32px]"
            style={{ background: 'var(--app-surface-2)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pill.iconSrc} alt={pill.label} width={16} height={16} style={{ opacity: 0.7 }} />
            <span className="text-[10px] leading-[14px]" style={{ color: 'var(--app-text-muted)' }}>{pill.label}</span>
            {pill.urgent && (
              <div className="absolute w-2 h-2 rounded-full" style={{ background: '#D83D37', top: '-1px', right: '-1px' }} />
            )}
          </div>
        ))}
      </div>

      {/* Circle arrow — 24×24px */}
      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--circle-arrow-bg)' }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M3.33 8h9.34M8.67 4L13 8l-4.33 4" stroke="var(--circle-arrow-icon)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Policies illustration — anchored to bottom-right corner */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${BASE}/offerings/policies-card.svg`}
        alt=""
        draggable={false}
        className="pointer-events-none"
        style={{ position: 'absolute', bottom: 0, right: 0, width: 100, height: 100, objectFit: 'contain', objectPosition: 'bottom right' }}
      />
    </motion.div>
  );
}

/* ── LOB Card ── */
function LobCard({
  card,
  override,
  index,
  onClick,
  onStartNew,
}: {
  card: LobCardData;
  override?: LobOverride;
  index: number;
  onClick: () => void;
  onStartNew?: () => void;
}) {
  const isPwilo = !!override;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.12 + index * 0.06 }}
      className="relative overflow-hidden rounded-2xl cursor-pointer"
      style={{
        background: 'var(--app-surface)',
        border: '1px solid var(--app-border)',
      }}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-stretch min-h-[130px]">
        <div className="flex-1 min-w-0 p-4 flex flex-col justify-between">
          {isPwilo ? (
            <>
              <div>
                <h3
                  className="text-[14px] font-semibold leading-[20px]"
                  style={{ color: 'var(--app-text)' }}
                >
                  Continue insuring your {override.title}
                </h3>
                {override.subtitle && (
                  <p
                    className="text-[12px] leading-[18px] mt-0.5"
                    style={{ color: 'var(--app-text-muted)' }}
                  >
                    {override.subtitle}
                  </p>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  className="h-[32px] px-4 rounded-lg text-[12px] font-medium"
                  style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
                  onClick={(e) => { e.stopPropagation(); onClick(); }}
                >
                  Continue
                </button>
                {onStartNew && (
                  <button
                    className="h-[32px] px-4 rounded-lg text-[12px] font-medium"
                    style={{
                      background: 'transparent',
                      color: 'var(--app-text)',
                      border: '1px solid var(--app-border-strong)',
                    }}
                    onClick={(e) => { e.stopPropagation(); onStartNew(); }}
                  >
                    Start new
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div>
                <h3
                  className="text-[14px] font-semibold leading-[20px]"
                  style={{ color: 'var(--app-text)' }}
                >
                  {card.title}
                </h3>
                <p
                  className="text-[12px] leading-[18px] mt-0.5 max-w-[160px]"
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  {card.tagline}
                </p>
              </div>
              {/* Circle arrow */}
              <div
                className="mt-2 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: 'var(--circle-arrow-bg)' }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3.33 8h9.34M8.67 4L13 8l-4.33 4" stroke="var(--circle-arrow-icon)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </>
          )}
        </div>

        <div className="w-[130px] relative shrink-0 self-stretch flex items-center justify-end overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.heroImage}
            alt={card.title}
            className="h-[110%] w-auto object-contain"
            style={{ marginRight: '-8px' }}
            draggable={false}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Why ACKO Section ── */
function WhyAckoSection() {
  const WHY_CARDS = [
    {
      icon: `${BASE}/icons/why-acko/icon-digital.svg`,
      title: '100% Digital',
      description: 'Buy, manage and claim - all online',
    },
    {
      icon: `${BASE}/icons/why-acko/icon-claim.svg`,
      title: '98.8%',
      description: 'Claims settled in 1 week',
    },
    {
      icon: `${BASE}/icons/why-acko/icon-support.svg`,
      title: '24x7',
      description: 'Instant claims support',
    },
    {
      icon: `${BASE}/icons/why-acko/icon-pricing.svg`,
      title: 'Honest Pricing',
      description: 'No middle men & no hidden costs',
    },
  ];

  return (
    <div className="px-4 py-8">
      <div className="flex flex-col gap-4">
        {/* Heading */}
        <div className="text-center mb-1">
          <h2
            className="text-[24px] font-semibold leading-[30px]"
            style={{ color: 'var(--app-text)' }}
          >
            Why ACKO ?
          </h2>
          <p
            className="text-[14px] leading-[16px] mt-1"
            style={{ color: 'var(--app-text-muted)' }}
          >
            Insurance that actually makes sense
          </p>
        </div>

        {/* Award banner */}
        <div
          className="flex items-center justify-center h-[88px] rounded-3xl overflow-hidden"
          style={{ background: 'var(--app-surface-2)' }}
        >
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${BASE}/icons/why-acko/award-laurel-left.svg`} alt="" className="h-12 w-auto" draggable={false} />
            <div className="text-center leading-[19px]">
              <p className="text-[14px] font-medium" style={{ color: '#FFAB00' }}>
                India&apos;s #1*
              </p>
              <p className="text-[14px] font-medium" style={{ color: '#FFAB00' }}>
                insurance app
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${BASE}/icons/why-acko/award-laurel-right.svg`} alt="" className="h-12 w-auto" draggable={false} />
          </div>
        </div>

        {/* 2×2 bento grid */}
        <div className="grid grid-cols-2 gap-4">
          {WHY_CARDS.map((card) => (
            <div
              key={card.title}
              className="flex flex-col gap-1.5 h-[154px] rounded-3xl overflow-hidden p-5"
              style={{ background: 'var(--app-surface-2)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.icon} alt="" className="w-10 h-10 object-contain" draggable={false} />
              <p
                className="text-[16px] font-semibold leading-[22px] mt-1"
                style={{ color: 'var(--app-text)' }}
              >
                {card.title}
              </p>
              <p
                className="text-[14px] leading-[16px]"
                style={{ color: 'var(--app-text-muted)' }}
              >
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Footer ── */
function PageFooter() {
  const socialLinks = [
    { name: 'Instagram', icon: `${BASE}/footer/instagram.svg` },
    { name: 'LinkedIn', icon: `${BASE}/footer/linkedin.svg` },
    { name: 'X', icon: `${BASE}/footer/twitter.svg` },
    { name: 'YouTube', icon: `${BASE}/footer/youtube.svg` },
    { name: 'Facebook', icon: `${BASE}/footer/facebook.svg` },
  ];

  return (
    <div
      className="w-full mt-6 pt-10 pb-10"
      style={{
        background: 'radial-gradient(ellipse at top right, #242324, #0F0F10)',
      }}
    >
      <div className="max-w-[430px] mx-auto px-5">
        <AckoLogo variant="white" className="h-[22px]" />

        <p className="text-[16px] leading-[24px] font-medium mt-6" style={{ color: 'white' }}>
          ACKO Technology &amp; Services Private Limited
        </p>

        <div className="flex items-center gap-4 mt-6">
          {socialLinks.map((s) => (
            <button key={s.name} className="block" aria-label={s.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.icon} alt={s.name} className="w-[48px] h-[48px]" draggable={false} />
            </button>
          ))}
        </div>

        <p className="text-[14px] leading-[20px] mt-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
          CIN: U74110KA2016PTC120161
        </p>

        <p className="text-[14px] leading-[20px] mt-5" style={{ color: 'rgba(255,255,255,0.6)' }}>
          *Listed #1 for &ldquo;insurance&rdquo; on the Apple App Store
        </p>

        <p className="text-[14px] leading-[22px] mt-5" style={{ color: 'rgba(255,255,255,0.6)' }}>
          The use of images and brands are only for the purpose of indication and illustration. ACKO claims no rights on the IP rights of any third parties.
        </p>

        <div className="flex items-center gap-4 mt-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${BASE}/footer/pci-dss.svg`} alt="PCI DSS Compliant" className="h-[44px] w-auto" draggable={false} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${BASE}/footer/fssai.svg`} alt="FSSAI" className="h-[44px] w-auto" draggable={false} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${BASE}/footer/irdai.svg`} alt="IRDAI" className="h-[44px] w-auto" draggable={false} />
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
type Screen = 'language' | 'home' | 'policy_action';

const ID_TO_TAB: Record<string, LobId> = { car: 'car', bike: 'bike', health: 'health', life: 'life' };

export default function GlobalHomepage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: 'var(--app-bg)' }} />}>
      <GlobalHomepageInner />
    </Suspense>
  );
}

function GlobalHomepageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setLanguage: setJourneyLang } = useJourneyStore();
  const { theme, cycleTheme } = useThemeStore();
  const { language, setLanguage: setGlobalLang } = useLanguageStore();
  const [screen, setScreen] = useState<Screen>('language');
  const [hydrated, setHydrated] = useState(false);
  const [selectedLobId, setSelectedLobId] = useState<LobId | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showPoliciesSheet, setShowPoliciesSheet] = useState(false);

  const overrides = useLobSnapshots();
  const { firstName, isLoggedIn, policies } = useUserProfileStore();
  const hasActivePolicies = policies.some(p => p.active);

  const handleLanguageCycle = useCallback(() => {
    const idx = LANG_ORDER.indexOf(language as Language);
    const next = LANG_ORDER[(idx + 1) % LANG_ORDER.length];
    setGlobalLang(next);
    setJourneyLang(next);
  }, [language, setGlobalLang, setJourneyLang]);

  const handleResetFTU = useCallback(() => {
    setShowMenu(false);
    clearAllSnapshots();
    localStorage.removeItem('acko_user_profile');
    localStorage.removeItem('acko_lang_chosen');
    window.location.href = BASE || '/';
  }, []);

  useEffect(() => {
    setHydrated(true);
    const langChosen = !!localStorage.getItem('acko_lang_chosen');

    const lobParam = searchParams.get('lob');
    if (lobParam && ID_TO_TAB[lobParam] && langChosen) {
      const lobId = ID_TO_TAB[lobParam];
      const profileStore = useUserProfileStore.getState();
      if (profileStore.hasActivePolicyInLob(lobId as PolicyLob)) {
        setSelectedLobId(lobId);
        setScreen('policy_action');
        return;
      }
      setScreen('home');
      return;
    }

    if (langChosen) setScreen('home');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCardClick = useCallback((lobId: LobId) => {
    const override = overrides[lobId];
    const ps = useUserProfileStore.getState();
    const policyActive = ps.hasActivePolicyInLob(lobId as PolicyLob);
    const snapshotActive = override && override.urgency === 'low';

    if (policyActive || snapshotActive) {
      if (snapshotActive && !policyActive) {
        const snap = loadSnapshot(LOB_TO_PRODUCT[lobId]);
        if (snap) {
          ps.setProfile({ firstName: snap.name || snap.userName || 'Rahul', isLoggedIn: true });
          if (!ps.policies.some(p => p.lob === lobId && p.active)) {
            const detailParts = [
              snap.vehicleData?.model || snap.vehicleData?.make,
              snap.registrationNumber?.toUpperCase(),
            ].filter(Boolean);
            ps.addPolicy({
              id: `${lobId}_snap_${Date.now()}`,
              lob: lobId as PolicyLob,
              policyNumber: `ACKO-M-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
              label: `${snap.selectedPlanType === 'zero_dep' ? 'Zero Dep' : snap.selectedPlanType === 'third_party' ? 'Third Party' : 'Comprehensive'} ${LOB_LABEL_MAP[lobId] || lobId}`,
              active: true,
              purchasedAt: snap.savedAt || new Date().toISOString(),
              premium: snap.totalPremium || 0,
              premiumFrequency: 'yearly',
              details: detailParts.length ? detailParts.join(' · ') : undefined,
            });
          }
        }
      }
      setSelectedLobId(lobId);
      setScreen('policy_action');
      return;
    }

    if (override) {
      router.push(override.route);
      return;
    }

    const card = LOB_CARDS.find(c => c.id === lobId);
    if (card) router.push(card.route);
  }, [overrides, router]);

  const handleStartNew = useCallback((lobId: LobId) => {
    const card = LOB_CARDS.find(c => c.id === lobId);
    if (card) router.push(card.route);
  }, [router]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--app-bg)' }}>
        <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`app-${theme}`}>
      <AnimatePresence mode="wait">
        {screen === 'language' && (
          <LanguageSelector key="lang" onSelect={() => {
            localStorage.setItem('acko_lang_chosen', 'true');
            setScreen('home');
          }} />
        )}

        {screen === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen"
            style={{ background: 'var(--app-bg)' }}
          >
            <div className="max-w-[430px] mx-auto pb-4">
              <HeaderPill
                isLoggedIn={isLoggedIn}
                initial={firstName?.[0]?.toUpperCase() || 'R'}
                theme={theme}
                showMenu={showMenu}
                onToggleMenu={() => setShowMenu(!showMenu)}
                onThemeCycle={() => { cycleTheme(); }}
                onLangCycle={handleLanguageCycle}
                onResetFTU={handleResetFTU}
                langLabel={LANG_LABELS[language as string] || language}
              />

              <HeroGreeting
                firstName={firstName}
                subtitle={isLoggedIn && hasActivePolicies ? 'Good to see you again.\nWhat would you like to do?' : undefined}
              />

              {/* Manage my policies — only for logged-in users with policies */}
              {isLoggedIn && hasActivePolicies && (
                <div className="px-4 mb-10">
                  <ManagePoliciesCard onClick={() => setShowPoliciesSheet(true)} />
                </div>
              )}

              {/* Section divider — only when manage card is shown */}
              {isLoggedIn && hasActivePolicies && (
                <div className="px-4 pb-8 text-center">
                  <p className="text-[18px] font-semibold leading-[24px]" style={{ color: 'var(--app-text)' }}>
                    Explore another insurance
                  </p>
                  <p className="text-[13px] leading-[18px] mt-0.5" style={{ color: 'var(--app-text-muted)' }}>
                    Find the right cover for your needs
                  </p>
                </div>
              )}

              {/* LOB Cards */}
              <div className="px-4 space-y-3">
                {LOB_CARDS.map((card, i) => (
                  <LobCard
                    key={card.id}
                    card={card}
                    override={overrides[card.id]}
                    index={i}
                    onClick={() => handleCardClick(card.id)}
                    onStartNew={overrides[card.id] ? () => handleStartNew(card.id) : undefined}
                  />
                ))}
              </div>

              <WhyAckoSection />
            </div>
            <PageFooter />
          </motion.div>
        )}

        {screen === 'policy_action' && selectedLobId && (() => {
          const ov = overrides[selectedLobId];
          const card = LOB_CARDS.find(c => c.id === selectedLobId)!;
          const dropOff = ov && ov.urgency !== 'low' ? {
            badge: ov.badge,
            title: ov.title,
            subtitle: ov.subtitle,
            urgency: ov.urgency,
            route: ov.route,
          } : null;
          return (
            <PolicyActionScreen
              key="policy_action"
              lobId={selectedLobId}
              lobLabel={LOB_LABEL_MAP[selectedLobId] || card.title}
              statusInfo={ov?.statusInfo}
              dropOffInfo={dropOff}
              onContinueJourney={dropOff ? () => router.push(dropOff.route) : undefined}
              onBuyNew={() => router.push(card.route)}
              onManagePolicy={() => {
                const routes: Record<string, string> = {
                  health: '/health?screen=dashboard', car: '/motor?vehicle=car&screen=dashboard',
                  bike: '/motor?vehicle=bike&screen=dashboard', life: '/life?screen=dashboard',
                };
                router.push(routes[selectedLobId] || card.route);
              }}
              onBack={() => { setSelectedLobId(null); setScreen('home'); }}
            />
          );
        })()}
      </AnimatePresence>

      {/* Policies bottom sheet — outside AnimatePresence so it layers on top */}
      <PoliciesBottomSheet
        isOpen={showPoliciesSheet}
        onClose={() => setShowPoliciesSheet(false)}
        theme={theme}
        onViewProfile={() => router.push('/profile')}
      />
    </div>
  );
}
