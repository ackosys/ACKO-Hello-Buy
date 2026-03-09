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
import { useT } from '../lib/translations';
import {
  loadSnapshot,
  loadProductSnapshots,
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

const LANG_ORDER: Language[] = ['en', 'hi', 'hinglish', 'kn', 'ta', 'ml', 'te'];
const LANG_LABELS: Record<string, string> = { en: 'English', hi: 'हिन्दी', hinglish: 'Hinglish', kn: 'ಕನ್ನಡ', ta: 'தமிழ்', ml: 'മലയാളം', te: 'తెలుగు' };
const THEME_LABELS: Record<string, string> = { midnight: 'Midnight', dark: 'Dark', light: 'Light' };

interface LobOverride {
  journeyId: string;
  lobId: LobId;
  badge: string;
  title: string;
  subtitle: string;
  route: string;
  urgency: 'high' | 'medium' | 'low';
  ctaLabel: string;
  statusInfo?: PolicyStatusInfo | null;
  imageUrl?: string;
}

const PWILO_MODEL_IMAGE: Record<string, string> = {
  'Swift': `${BASE}/car-images/Swift.png`,
  'Swift Dzire': `${BASE}/car-images/Swift.png`,
  'Nexon': `${BASE}/car-images/Nexon.png`,
  'Harrier': `${BASE}/car-images/harrier.png`,
  'Venue': `${BASE}/car-images/Venue.png`,
  'Creta': `${BASE}/car-images/Venue.png`,
  'XUV700': `${BASE}/car-images/XUV700.png`,
  'XUV 700': `${BASE}/car-images/XUV700.png`,
  'Seltos': `${BASE}/car-images/Verna.png`,
  'Verna': `${BASE}/car-images/Verna.png`,
  'Tiago': `${BASE}/car-images/Nexon.png`,
  'Punch': `${BASE}/car-images/Nexon.png`,
  'City': `${BASE}/car-images/Citroen.png`,
  'Carens': `${BASE}/car-images/Verna.png`,
  'Comet': `${BASE}/car-images/MG comet.png`,
  'Splendor': `${BASE}/car-images/Splendor.png`,
  'Activa': `${BASE}/car-images/Activa.png`,
  'Pulsar': `${BASE}/car-images/Pulsar.png`,
  'Classic 350': `${BASE}/car-images/KTM.png`,
};

const PWILO_MAKE_IMAGE: Record<string, string> = {
  'Maruti Suzuki': `${BASE}/car-images/Swift.png`,
  'Maruti': `${BASE}/car-images/Swift.png`,
  'Hyundai': `${BASE}/car-images/Venue.png`,
  'Tata': `${BASE}/car-images/Nexon.png`,
  'Kia': `${BASE}/car-images/Verna.png`,
  'Mahindra': `${BASE}/car-images/XUV700.png`,
  'Toyota': `${BASE}/car-images/Toyota.png`,
  'Honda': `${BASE}/car-images/Citroen.png`,
  'MG': `${BASE}/car-images/MG comet.png`,
  'Hero': `${BASE}/car-images/Splendor.png`,
  'Bajaj': `${BASE}/car-images/Pulsar.png`,
  'TVS': `${BASE}/car-images/CT 100.png`,
  'Royal Enfield': `${BASE}/car-images/KTM.png`,
};

function computeSnapshots(): LobOverride[] {
  const result: LobOverride[] = [];
  for (const lobId of Object.keys(LOB_TO_PRODUCT) as LobId[]) {
    const product = LOB_TO_PRODUCT[lobId];
    const isMotor = lobId === 'car' || lobId === 'bike';
    const snapshots = isMotor
      ? loadProductSnapshots(product)
      : [loadSnapshot(product)].filter(Boolean) as import('../lib/journeyPersist').JourneySnapshot[];

    for (const snap of snapshots) {
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

      let imageUrl: string;
      let title: string;
      let subtitle: string;

      if (isMotor) {
        const vehicleName = [snap.vehicleData?.make, snap.vehicleData?.model].filter(Boolean).join(' ');
        const regNumber = snap.registrationNumber?.toUpperCase() || '';
        const make = snap.vehicleData?.make || '';
        const model = snap.vehicleData?.model || '';
        const vType = snap.vehicleType || 'car';
        const fallback = vType === 'bike' ? `${BASE}/offerings/bike-card.png` : `${BASE}/offerings/car-card.png`;
        imageUrl = PWILO_MODEL_IMAGE[model] || PWILO_MAKE_IMAGE[make] || fallback;
        title = vehicleName || display.title;
        subtitle = regNumber || display.badge;
      } else {
        const lobImage: Record<string, string> = {
          health: `${BASE}/offerings/health-card.png`,
          life: `${BASE}/offerings/life-card.png`,
        };
        imageUrl = lobImage[lobId] || `${BASE}/offerings/health-card.png`;
        title = display.title;
        subtitle = display.subtitle || '';
      }

      let route = display.route;
      if (isMotor && snap.journeyId) {
        route += `&journeyId=${encodeURIComponent(snap.journeyId)}`;
      }

      result.push({
        journeyId: snap.journeyId || '',
        lobId,
        badge: display.badge,
        title,
        subtitle,
        route,
        urgency: display.urgency,
        ctaLabel: display.ctaLabel,
        statusInfo,
        imageUrl,
      });
    }
  }
  return result;
}

function useLobSnapshots() {
  const [entries, setEntries] = useState<LobOverride[]>(() => {
    if (typeof window === 'undefined') return [];
    return computeSnapshots();
  });

  const reload = useCallback(() => setEntries(computeSnapshots()), []);

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

  return entries;
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
  onLogout,
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
  onLogout: () => void;
  langLabel: string;
}) {
  const router = useRouter();
  const t = useT();
  const isLight = theme === 'light';
  const isDark = theme !== 'light';
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  const pillBg = isLight ? '#f5f5f5' : theme === 'midnight' ? '#1C0B47' : '#121212';
  const loginBg = isLight ? '#e0e0e1' : theme === 'midnight' ? 'rgba(255,255,255,0.06)' : '#19191a';
  const loginBorder = isLight ? 'none' : '1px solid #6841e6';

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
          background: pillBg,
          boxShadow: '0 20px 20px rgba(0,0,0,0.02), 0 6px 6px rgba(0,0,0,0.02), 0 2px 4px rgba(0,0,0,0.02)',
        }}
      >
        <AckoLogo variant={isLight ? 'color' : 'white'} className="h-[20px]" />

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <button
              onClick={() => router.push('/profile')}
              className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[15px] font-medium"
              style={{ background: isLight ? '#c4a97d' : '#8B6F47', color: isDark ? 'white' : '#121212' }}
            >
              {initial}
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="h-[36px] px-4 rounded-lg text-[14px] font-medium tracking-[-0.28px]"
              style={{
                background: loginBg,
                color: isLight ? 'black' : '#fefefe',
                border: loginBorder,
              }}
            >
              {t.global.menuLogin}
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
                      background: isLight ? 'white' : theme === 'midnight' ? 'rgba(30,15,70,0.95)' : 'rgba(30,30,30,0.95)',
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
                      {theme === 'light' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
                      ) : theme === 'midnight' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
                      )}
                      {t.global.menuMode} {THEME_LABELS[theme]}
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
                      {t.global.menuLang} {langLabel}
                    </button>
                    {isLoggedIn && (
                      <button
                        onClick={() => { onToggleMenu(); onLogout(); }}
                        className="w-full px-4 py-3 text-left text-sm flex items-center gap-2.5 transition-colors"
                        style={{
                          color: isLight ? '#121212' : 'rgba(255,255,255,0.85)',
                          borderBottom: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                        </svg>
                        {t.global.menuLogout}
                      </button>
                    )}
                    <button
                      onClick={onResetFTU}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-2.5 transition-colors"
                      style={{ color: '#f87171' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 4v6h6M23 20v-6h-6" />
                        <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                      </svg>
                      {t.global.menuResetFtu}
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
  const t = useT();
  return (
    <motion.div
      className="flex flex-col items-center gap-2 px-6 pt-8 pb-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="w-[84px] h-[84px] mb-1" style={{ opacity: process.env.NEXT_PUBLIC_VIDEO_BG === 'true' ? 0 : 1 }}>
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
          {firstName ? t.global.welcomeBack(firstName) : t.global.heroTitle}
        </h1>
        <p
          className="text-[18px] leading-[26px] mt-1 whitespace-pre-line"
          style={{ color: 'var(--app-text-muted)' }}
        >
          {subtitle || t.global.heroSubtitle}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Policies Bottom Sheet — PAUSED ──
function PoliciesBottomSheet(...) { ... }
*/

/* ── Manage My Policies Card — PAUSED ──
function ManagePoliciesCard(...) { ... }
*/

/* ── PWILO Section (Continue where you left off) ── */
function PwiloSection({
  entries,
  onContinue,
  onStartNew,
}: {
  entries: LobOverride[];
  onContinue: (entry: LobOverride) => void;
  onStartNew: (entry: LobOverride) => void;
}) {
  const t = useT();
  if (entries.length === 0) return null;

  const isSingle = entries.length === 1;

  const renderCard = (entry: LobOverride, idx: number) => {
    const card = LOB_CARDS.find(c => c.id === entry.lobId);
    const imgSrc = entry.imageUrl || card?.heroImage || `${BASE}/offerings/car-card.png`;

    return (
      <motion.div
        key={entry.journeyId || entry.lobId}
        initial={{ opacity: 0, x: isSingle ? 0 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: idx * 0.08 }}
        className={`relative overflow-hidden rounded-3xl ${isSingle ? 'w-full' : 'shrink-0 w-[300px] snap-start'}`}
        style={{
          background: 'var(--app-surface)',
          border: '1px solid var(--app-border)',
          padding: '20px',
          minHeight: '150px',
        }}
      >
        <div className="flex flex-col gap-3 pr-[110px]">
          <div>
            <h3
              className="text-[16px] font-semibold leading-[22px]"
              style={{ color: 'var(--app-text)' }}
            >
              {(entry.lobId === 'car' || entry.lobId === 'bike')
                ? t.global.pwiloContinueInsuring(entry.title)
                : entry.title}
            </h3>
            {entry.subtitle && (
              <p
                className="text-[12px] leading-[16px] mt-1"
                style={{ color: 'var(--app-text-muted)' }}
              >
                {entry.subtitle}
              </p>
            )}
          </div>
          <div className="flex gap-2.5 shrink-0">
            <button
              className="h-[32px] px-4 rounded-lg text-[12px] font-medium whitespace-nowrap"
              style={{ background: '#6841e6', color: 'white' }}
              onClick={(e) => { e.stopPropagation(); onContinue(entry); }}
            >
              {t.global.pwiloContinue}
            </button>
            <button
              className="h-[32px] px-4 rounded-lg text-[12px] font-medium whitespace-nowrap"
              style={{
                background: 'var(--app-pwilo-start-bg, #f5f3ff)',
                color: 'var(--app-pwilo-start-text, #582fd2)',
                border: '1px solid var(--app-pwilo-start-border, #bdb8fa)',
              }}
              onClick={(e) => { e.stopPropagation(); onStartNew(entry); }}
            >
              {t.global.pwiloStartNew}
            </button>
          </div>
        </div>

        <div className="absolute top-2 right-2 w-[105px] h-[105px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={entry.title}
            className="w-full h-full object-contain"
            draggable={false}
          />
        </div>
      </motion.div>
    );
  };

  return (
    <div className="px-4 mb-6">
      <p
        className="text-[16px] font-semibold leading-[22px] text-center mb-4"
        style={{ color: 'var(--app-text)' }}
      >
        {t.global.pwiloTitle}
      </p>

      {isSingle ? (
        renderCard(entries[0], 0)
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
          {entries.map((entry, idx) => renderCard(entry, idx))}
        </div>
      )}
    </div>
  );
}

/* ── Bento LOB Grid ── */
function BentoLobGrid({ onCardClick }: { onCardClick: (lobId: LobId) => void }) {
  const t = useT();
  const car = LOB_CARDS.find(c => c.id === 'car')!;
  const bike = LOB_CARDS.find(c => c.id === 'bike')!;
  const health = LOB_CARDS.find(c => c.id === 'health')!;
  const life = LOB_CARDS.find(c => c.id === 'life')!;

  const cardStyle = {
    background: 'var(--app-surface)',
    border: '1px solid var(--app-border)',
  };

  const arrowBtn = (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center"
      style={{ background: 'var(--app-pwilo-start-bg, #f5f3ff)', border: '1px solid var(--app-pwilo-start-border, #bdb8fa)' }}
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path d="M3.33 8h9.34M8.67 4L13 8l-4.33 4" stroke="var(--app-pwilo-start-text, #582fd2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );

  return (
    <div className="px-4">
      <div className="flex gap-2">
        {/* Left column: Car + Bike */}
        <div className="flex-1 flex flex-col gap-2">
          {/* Car */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="relative h-[140px] rounded-2xl overflow-hidden cursor-pointer p-3"
            style={cardStyle}
            onClick={() => onCardClick('car')}
            whileTap={{ scale: 0.98 }}
          >
            <h3 className="text-[16px] font-semibold leading-[20px]" style={{ color: 'var(--app-text)' }}>
              {t.global.carLabel}
            </h3>
            <p className="text-[10px] leading-[12px] mt-1.5 max-w-[90px]" style={{ color: 'var(--app-text-muted)' }}>
              {t.global.carCardDesc}
            </p>
            <div className="absolute left-[11px] bottom-[11px]">{arrowBtn}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={car.heroImage}
              alt={t.global.carLabel}
              className="absolute object-contain pointer-events-none"
              style={{ bottom: -1, right: -1, width: 80, height: 80 }}
              draggable={false}
            />
          </motion.div>

          {/* Bike */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.16 }}
            className="relative h-[140px] rounded-2xl overflow-hidden cursor-pointer p-3"
            style={cardStyle}
            onClick={() => onCardClick('bike')}
            whileTap={{ scale: 0.98 }}
          >
            <h3 className="text-[16px] font-semibold leading-[20px]" style={{ color: 'var(--app-text)' }}>
              {t.global.bikeLabel}
            </h3>
            <p className="text-[10px] leading-[12px] mt-1.5 max-w-[90px]" style={{ color: 'var(--app-text-muted)' }}>
              {t.global.bikeCardDesc}
            </p>
            <div className="absolute left-[11px] bottom-[11px]">{arrowBtn}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bike.heroImage}
              alt={t.global.bikeLabel}
              className="absolute object-contain pointer-events-none"
              style={{ bottom: -1, right: -1, width: 80, height: 80 }}
              draggable={false}
            />
          </motion.div>
        </div>

        {/* Right column: Health (spans full height) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.13 }}
          className="relative flex-1 rounded-2xl overflow-hidden cursor-pointer p-3"
          style={{ ...cardStyle, minHeight: '288px' }}
          onClick={() => onCardClick('health')}
          whileTap={{ scale: 0.98 }}
        >
          <h3 className="text-[16px] font-semibold leading-[20px]" style={{ color: 'var(--app-text)' }}>
            {t.global.healthLabel}
          </h3>
          <p className="text-[10px] leading-[12px] mt-1.5" style={{ color: 'var(--app-text-muted)' }}>
            {t.global.healthCardDesc}
          </p>
          <div
            className="inline-flex items-center px-2 py-1.5 rounded-full mt-1.5"
            style={{
              background: 'linear-gradient(90deg, rgba(153,116,249,0.36) 0%, rgba(236,72,153,0.08) 89%)',
            }}
          >
            <span className="text-[10px] font-medium leading-[12px]" style={{ color: 'var(--app-text)' }}>
              {t.global.healthCardFrom}
            </span>
          </div>
          <div className="absolute left-3 bottom-3">{arrowBtn}</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={health.heroImage}
            alt={t.global.healthLabel}
            className="absolute object-cover pointer-events-none"
            style={{ bottom: -1, right: -1, width: 90, height: 131, transform: 'scaleX(-1)' }}
            draggable={false}
          />
        </motion.div>
      </div>

      {/* Life — full width below */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.22 }}
        className="relative h-[140px] rounded-2xl overflow-hidden cursor-pointer p-3 mt-2"
        style={cardStyle}
        onClick={() => onCardClick('life')}
        whileTap={{ scale: 0.98 }}
      >
        <h3 className="text-[16px] font-semibold leading-[20px]" style={{ color: 'var(--app-text)' }}>
          {t.global.lifeLabel}
        </h3>
        <p className="text-[10px] leading-[12px] mt-1.5 max-w-[200px]" style={{ color: 'var(--app-text-muted)' }}>
          {t.global.lifeCardDesc}
        </p>
        <div className="absolute left-[11px] bottom-[11px]">{arrowBtn}</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={life.heroImage}
          alt={t.global.lifeLabel}
          className="absolute object-contain pointer-events-none"
          style={{ bottom: -1, right: -1, width: 150, height: 120 }}
          draggable={false}
        />
      </motion.div>
    </div>
  );
}

/* ── Why ACKO Section ── */
function WhyAckoSection() {
  const { theme } = useThemeStore();
  const t = useT();
  const isDark = theme !== 'light';

  const WHY_ITEMS = [
    {
      icon: `${BASE}/icons/100%25 digital.svg`,
      title: t.global.prop2Title,
      description: t.global.prop2Desc,
    },
    {
      icon: `${BASE}/icons/24X7 support.svg`,
      title: t.global.supportSub,
      description: t.global.support,
    },
    {
      icon: `${BASE}/icons/Honest pricing.svg`,
      title: t.global.needHelp,
      description: t.global.talkExpert,
    },
    {
      icon: `${BASE}/icons/Claims settled.svg`,
      title: t.global.claimsStat,
      description: t.global.claimsStatSub,
    },
  ];

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex flex-col gap-6">
        {/* Badge + heading */}
        <div className="flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${BASE}/offerings/App-first.svg`}
            alt="India's 1st Insurance App"
            className="w-20 h-20 object-contain"
            draggable={false}
          />
          <div className="flex flex-col items-center gap-2 mt-2">
            <h2
              className="text-[24px] font-semibold leading-[30px] text-center"
              style={{ color: 'var(--app-text)' }}
            >
              {t.global.whyAcko}
            </h2>
            <p
              className="text-[14px] leading-[16px] text-center"
              style={{ color: 'var(--app-text-muted)' }}
            >
              {t.global.whyAckoSub}
            </p>
          </div>
        </div>

        {/* Card list */}
        <div className="flex flex-col gap-3">
          {WHY_ITEMS.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-4 h-[72px] px-3 py-2 rounded-lg"
              style={{ background: isDark ? 'var(--app-surface)' : 'white' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.icon}
                alt=""
                className="w-8 h-8 shrink-0 object-contain"
                style={isDark ? { filter: 'brightness(0) invert(1) brightness(0.85)' } : undefined}
                draggable={false}
              />
              <div className="flex flex-col">
                <p
                  className="text-[14px] font-semibold leading-[22px]"
                  style={{ color: 'var(--app-text)' }}
                >
                  {item.title}
                </p>
                <p
                  className="text-[12px] leading-[18px]"
                  style={{ color: isDark ? 'var(--app-text-muted)' : 'rgba(0,0,0,0.56)' }}
                >
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Footer ── */
function PageFooter() {
  const t = useT();
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
          {t.global.footerCompany}
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
          {t.global.footerCin}
        </p>

        <p className="text-[14px] leading-[20px] mt-5" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {t.global.footerNote1}
        </p>

        <p className="text-[14px] leading-[22px] mt-5" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {t.global.footerDisclaimer}
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
  const t = useT();
  const [screen, setScreen] = useState<Screen>('language');
  const [hydrated, setHydrated] = useState(false);
  const [selectedLobId, setSelectedLobId] = useState<LobId | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  // const [showPoliciesSheet, setShowPoliciesSheet] = useState(false); // PAUSED

  const overrides = useLobSnapshots();
  const { firstName, isLoggedIn } = useUserProfileStore();
  const hasOverrides = overrides.length > 0;

  const handleLanguageCycle = useCallback(() => {
    const idx = LANG_ORDER.indexOf(language as Language);
    const next = LANG_ORDER[(idx + 1) % LANG_ORDER.length];
    setGlobalLang(next);
    setJourneyLang(next);
  }, [language, setGlobalLang, setJourneyLang]);

  const handleLogout = useCallback(() => {
    useUserProfileStore.getState().setProfile({ isLoggedIn: false, firstName: '', phone: '' });
    localStorage.removeItem('acko_user_profile');
    window.location.href = BASE || '/';
  }, []);

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
    const card = LOB_CARDS.find(c => c.id === lobId);
    if (card) router.push(card.route);
  }, [router]);

  const handlePwiloContinue = useCallback((entry: LobOverride) => {
    router.push(entry.route);
  }, [router]);

  const handlePwiloStartNew = useCallback((entry: LobOverride) => {
    const card = LOB_CARDS.find(c => c.id === entry.lobId);
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
            className="min-h-screen relative overflow-hidden"
            style={{ background: 'var(--app-bg)' }}
          >
            {/* Animated video background — newhomepage only */}
            {process.env.NEXT_PUBLIC_VIDEO_BG === 'true' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-0 pointer-events-none max-w-[430px] w-full">
                <video
                  key={theme}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="mx-auto object-cover"
                  style={{ width: 410, height: 300 }}
                  src={`${BASE}/Animated_BG/${theme === 'light' ? 'Light theme-BG' : 'Dark theme-BG'}.mp4`}
                />
                {theme !== 'light' && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 top-0 pointer-events-none"
                    style={{
                      width: 410,
                      height: 300,
                      background: theme === 'midnight'
                        ? 'linear-gradient(180deg, rgba(0, 0, 0, 0.00) 41.25%, #1C0B47 88.12%)'
                        : 'linear-gradient(180deg, rgba(0, 0, 0, 0.00) 41.25%, #0F0F10 88.12%)',
                    }}
                  />
                )}
              </div>
            )}

            {/* Content — always on top */}
            <div className="max-w-[430px] mx-auto pb-4 relative z-10">
              <HeaderPill
                isLoggedIn={isLoggedIn}
                initial={firstName?.[0]?.toUpperCase() || 'R'}
                theme={theme}
                showMenu={showMenu}
                onToggleMenu={() => setShowMenu(!showMenu)}
                onThemeCycle={() => { cycleTheme(); }}
                onLangCycle={handleLanguageCycle}
                onResetFTU={handleResetFTU}
                onLogout={handleLogout}
                langLabel={LANG_LABELS[language as string] || language}
              />

              <HeroGreeting
                firstName={firstName}
                subtitle={hasOverrides ? t.global.heroTitleUser : undefined}
              />

              {/* PWILO Section — continue where you left off */}
              <PwiloSection
                entries={overrides}
                onContinue={handlePwiloContinue}
                onStartNew={handlePwiloStartNew}
              />

              {/* Section divider — only when PWILO cards exist */}
              {hasOverrides && (
                <div className="px-4 pb-8 text-center">
                  <p className="text-[18px] font-semibold leading-[24px]" style={{ color: 'var(--app-text)' }}>
                    {t.global.pwiloExploreTitle}
                  </p>
                  <p className="text-[13px] leading-[18px] mt-0.5" style={{ color: 'var(--app-text-muted)' }}>
                    {t.global.pwiloExploreDesc}
                  </p>
                </div>
              )}

              {/* LOB Bento Grid */}
              <BentoLobGrid onCardClick={handleCardClick} />

              <p
                className="text-[10px] leading-[14px] text-center mt-4"
                style={{ color: 'var(--app-text-muted)' }}
              >
                {t.global.footerTagline}
              </p>

              <div className="h-8" />
              <WhyAckoSection />
            </div>
            <PageFooter />
          </motion.div>
        )}

        {screen === 'policy_action' && selectedLobId && (() => {
          const ov = overrides.find(o => o.lobId === selectedLobId);
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
                  health: '/health', car: '/motor?vehicle=car&screen=dashboard',
                  bike: '/motor?vehicle=bike&screen=dashboard', life: '/life?screen=dashboard',
                };
                router.push(routes[selectedLobId] || card.route);
              }}
              onBack={() => { setSelectedLobId(null); setScreen('home'); }}
            />
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
