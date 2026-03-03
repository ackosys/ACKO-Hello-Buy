'use client';

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useJourneyStore } from '../lib/store';
import LanguageSelector from '../components/LanguageSelector';
import AckoLogo from '../components/AckoLogo';
import PolicyActionScreen, { type PolicyStatusInfo } from '../components/global/PolicyActionScreen';
import { useUserProfileStore, type PolicyLob } from '../lib/userProfileStore';
import { useThemeStore } from '../lib/themeStore';
import { useLanguageStore } from '../lib/languageStore';
import { LobConfig } from '../lib/core/types';
import {
  loadSnapshot,
  getDropOffDisplay,
  clearAllSnapshots,
  type ProductKey,
} from '../lib/journeyPersist';
import type { Language } from '../lib/types';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

const LOBS: LobConfig[] = [
  { id: 'car', label: 'Car Insurance', tagline: '', description: '', icon: 'car', active: true, route: '/motor?vehicle=car' },
  { id: 'bike', label: 'Bike/Scooter Insurance', tagline: '', description: '', icon: 'bike', active: true, route: '/motor?vehicle=bike' },
  { id: 'health', label: 'Health Insurance', tagline: '', description: '', icon: 'health', active: true, route: '/health' },
  { id: 'life', label: 'Life Insurance', tagline: '', description: '', icon: 'life', active: true, route: '/life' },
];

type LobId = 'car' | 'bike' | 'health' | 'life';

interface LobContent {
  tagline: string;
  headline: [string, string];
  highlight: string;
  cta: string;
  taglineColor: string;
  heroImage: string;
}

const LOB_CONTENT: Record<LobId, LobContent> = {
  car: {
    tagline: 'Your ACKO advantage',
    headline: ['Upgrade your drive', 'with the best deals.'],
    highlight: 'Save up to \u20B95,000',
    cta: 'Insure my car now',
    taglineColor: '#82E696',
    heroImage: `${BASE}/offerings/car-hero.png`,
  },
  bike: {
    tagline: 'Quick & hassle-free',
    headline: ['Protect your ride', 'in under 2 minutes.'],
    highlight: 'Instant policy',
    cta: 'Insure my bike now',
    taglineColor: '#82AAFA',
    heroImage: `${BASE}/offerings/bike-hero.png`,
  },
  health: {
    tagline: 'No confusion. No complicated terms',
    headline: ["Let\u2019s find the health plan", ' that fits your needs.'],
    highlight: 'Guided, step by step',
    cta: 'Get your health covered',
    taglineColor: '#d0bdf4',
    heroImage: `${BASE}/offerings/health-hero-illustration.png`,
  },
  life: {
    tagline: 'Simple & transparent',
    headline: ["Secure your family\u2019s", 'future, starting today.'],
    highlight: 'Plans from \u20B9490/mo',
    cta: 'Get life cover',
    taglineColor: '#A78BFA',
    heroImage: `${BASE}/offerings/life-hero.png`,
  },
};

const LOB_ITEMS = ['Car', 'Bike', 'Health', 'Life'] as const;
const LOB_ID_MAP: Record<string, LobId> = { Car: 'car', Bike: 'bike', Health: 'health', Life: 'life' };
const LOB_LABEL_MAP: Record<string, string> = {
  car: 'Car Insurance', bike: 'Bike Insurance',
  health: 'Health Insurance', life: 'Life Insurance',
};

const EASE_OUT_CUBIC = [0.215, 0.61, 0.355, 1] as const;

const THEME_LABELS: Record<string, string> = { dark: 'Dark', light: 'Light' };
const THEME_ICONS: Record<string, React.ReactNode> = {
  dark: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>,
  light: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>,
};
const LANG_ORDER: Language[] = ['en', 'hi', 'hinglish', 'kn'];
const LANG_LABELS: Record<string, string> = { en: 'English', hi: 'हिन्दी', hinglish: 'Hinglish', kn: 'ಕನ್ನಡ' };

type Screen = 'language' | 'home' | 'policy_action';

const URGENCY_COLORS: Record<string, string> = {
  high: '#f87171',
  medium: '#fbbf24',
  low: '#34d399',
};

const URGENCY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

const LOB_TO_PRODUCT: Record<LobId, ProductKey> = {
  car: 'car', bike: 'bike', health: 'health', life: 'life',
};

const PRODUCT_TO_TAB: Record<ProductKey, string> = {
  car: 'Car', bike: 'Bike', health: 'Health', life: 'Life',
};

interface LobOverride {
  content: LobContent;
  route: string;
  urgency: 'high' | 'medium' | 'low';
  statusInfo?: PolicyStatusInfo | null;
}

function splitTitle(title: string): [string, string] {
  const words = title.split(' ');
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

function computeSnapshots(): { overrides: Partial<Record<LobId, LobOverride>>; bestTab: string | null } {
  const result: Partial<Record<LobId, LobOverride>> = {};
  let bestTab: string | null = null;
  let bestRank = 0;
  let bestTime = 0;

  for (const lobId of Object.keys(LOB_TO_PRODUCT) as LobId[]) {
    const product = LOB_TO_PRODUCT[lobId];
    const snap = loadSnapshot(product);
    if (!snap) continue;
    const display = getDropOffDisplay(snap);
    if (!display) continue;

    const base = LOB_CONTENT[lobId];
    let statusInfo: PolicyStatusInfo | null = null;
    const stepId = snap.currentStepId;
    if (stepId === 'life_db.personal_submitted') {
      statusInfo = { badge: 'Update in progress', message: 'Personal info update · Processing in 2-3 days', urgency: 'low' };
    } else if (stepId === 'life_db.nominee_submitted') {
      statusInfo = { badge: 'Update in progress', message: 'Nominee update · Verification in 2-3 days', urgency: 'low' };
    } else if (stepId === 'life_db.coverage_submitted') {
      statusInfo = { badge: 'Under review', message: 'Coverage update · Review in 5-7 days', urgency: 'medium' };
    } else if (stepId === 'db.claim_submitted') {
      const lobLabel = LOB_LABEL_MAP[lobId]?.replace(' Insurance', '') || lobId;
      statusInfo = { badge: 'Claim submitted', message: `${lobLabel} claim request · Processing in 3-5 days`, urgency: 'low' };
    } else if (stepId === 'db.edit_done') {
      const lobLabel = LOB_LABEL_MAP[lobId]?.replace(' Insurance', '') || lobId;
      statusInfo = { badge: 'Update in progress', message: `${lobLabel} policy update · Effective next billing cycle`, urgency: 'low' };
    }
    result[lobId] = {
      content: {
        tagline: display.badge,
        headline: splitTitle(display.title),
        highlight: display.subtitle || '',
        cta: display.ctaLabel,
        taglineColor: URGENCY_COLORS[display.urgency] || '#d0bdf4',
        heroImage: base.heroImage,
      },
      route: display.route,
      urgency: display.urgency,
      statusInfo,
    };

    const rank = URGENCY_RANK[display.urgency] || 0;
    const time = new Date(snap.savedAt).getTime();
    if (rank > bestRank || (rank === bestRank && time > bestTime)) {
      bestRank = rank;
      bestTime = time;
      bestTab = PRODUCT_TO_TAB[product];
    }
  }

  return { overrides: result, bestTab };
}

function useLobSnapshots() {
  const [overrides, setOverrides] = useState<Partial<Record<LobId, LobOverride>>>(() => {
    if (typeof window === 'undefined') return {};
    return computeSnapshots().overrides;
  });
  const [initialTab, setInitialTab] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return computeSnapshots().bestTab;
  });

  const reload = useCallback(() => {
    const { overrides: newOv, bestTab } = computeSnapshots();
    setOverrides(newOv);
    if (bestTab) setInitialTab(bestTab);
  }, []);

  useEffect(() => {
    reload();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') reload();
    };
    const onFocus = () => reload();
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) reload();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [reload]);

  return { overrides, initialTab };
}

/* ── Purple glow behind logo ── */
function PurpleGlow() {
  return (
    <motion.div
      className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none"
    >
      <motion.div
        className="w-[180px] h-[108px] rounded-[32px]"
        style={{
          filter: 'blur(100px)',
          background: 'radial-gradient(circle, rgba(183,168,208,1) 0%, rgba(140,108,214,1) 40%, rgba(118,78,217,1) 65%, rgba(97,48,220,1) 100%)',
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.1, ease: EASE_OUT_CUBIC }}
      />
    </motion.div>
  );
}

/* ── LOB Tabs ── */
function LOBTabs({
  selected,
  onSelect,
  dots,
}: {
  selected: string;
  onSelect: (v: string) => void;
  dots?: Partial<Record<string, 'high' | 'medium' | 'low'>>;
}) {
  return (
    <motion.div
      className="flex gap-[12px] items-center justify-center"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: EASE_OUT_CUBIC }}
    >
      {LOB_ITEMS.map((item) => {
        const isSelected = item === selected;
        const dotUrgency = dots?.[item];
        return (
          <motion.button
            key={item}
            onClick={() => onSelect(item)}
            className="relative flex items-center justify-center px-[20px] py-[8px] rounded-[80px] cursor-pointer border-none outline-none"
            style={{
              background: isSelected ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
              fontWeight: isSelected ? 500 : 400,
              fontSize: '12px',
              lineHeight: '18px',
              color: isSelected ? '#ffffff' : '#a6a6a6',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {item}
            {dotUrgency && (
              <span
                className="absolute -top-0.5 -right-0.5 flex h-[7px] w-[7px]"
              >
                {dotUrgency === 'high' && (
                  <span
                    className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                    style={{ background: URGENCY_COLORS[dotUrgency] }}
                  />
                )}
                <span
                  className="relative inline-flex rounded-full h-[7px] w-[7px]"
                  style={{ background: URGENCY_COLORS[dotUrgency] }}
                />
              </span>
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
}

/* ── Hero Image ── */
function HeroImage({ src }: { src: string }) {
  return (
    <motion.div
      className="relative w-full h-full flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.5, ease: EASE_OUT_CUBIC }}
    >
      <motion.img
        alt=""
        src={src}
        draggable={false}
        style={{
          maxWidth: '90%',
          maxHeight: '100%',
          objectFit: 'contain',
        }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}

/* ── Sub Heading (tagline + headline) ── */
function SubHeading({ tagline, headline, taglineColor }: { tagline: string; headline: [string, string]; taglineColor: string }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-[8px] w-full max-w-[343px] mx-auto text-center"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.7, ease: EASE_OUT_CUBIC }}
    >
      <div
        style={{
          fontWeight: 500,
          fontSize: '10px',
          lineHeight: '14px',
          color: taglineColor,
        }}
      >
        {tagline}
      </div>
      <div
        style={{
          fontWeight: 500,
          fontSize: '22px',
          lineHeight: '34px',
          color: 'rgba(255,255,255,0.96)',
          letterSpacing: '-0.1px',
        }}
      >
        <div>{headline[0]}</div>
        <div>{headline[1]}</div>
      </div>
    </motion.div>
  );
}

/* ── Highlight Line ── */
function HighlightLine({ text }: { text: string }) {
  return (
    <motion.div
      className="w-full flex items-center justify-center relative"
      style={{
        height: '36px',
        background: 'linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,0.04) 50%, rgba(255,255,255,0))',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.9 }}
    >
      <motion.div
        style={{
          fontWeight: 500,
          fontSize: '14px',
          lineHeight: '20px',
          color: 'rgba(255,255,255,0.96)',
          textAlign: 'center',
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.0 }}
      >
        {text}
      </motion.div>
    </motion.div>
  );
}

/* ── CTA Button ── */
function CTAButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <motion.div
      className="w-full flex justify-center"
      style={{ padding: '0 27.5px' }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 1.1, ease: EASE_OUT_CUBIC }}
    >
      <motion.button
        onClick={onClick}
        className="flex gap-[12px] items-center justify-center w-full max-w-[320px] rounded-[16px] border-none outline-none cursor-pointer"
        style={{
          background: '#ffffff',
          padding: '16px 12px',
        }}
        whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(255,255,255,0.15)' }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.2 }}
      >
        <span
          style={{
            fontWeight: 500,
            fontSize: '14px',
            lineHeight: '20px',
            color: '#121212',
            textAlign: 'center',
          }}
        >
          {label}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M1.33337 6.00004H10.6667M10.6667 6.00004L6.00004 1.33337M10.6667 6.00004L6.00004 10.6667"
            stroke="rgba(0,0,0,0.88)"
            strokeWidth="1.33"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.button>
    </motion.div>
  );
}

export default function GlobalHomepage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: 'var(--app-chat-gradient)' }} />}>
      <GlobalHomepageInner />
    </Suspense>
  );
}

const ID_TO_TAB: Record<string, string> = { car: 'Car', bike: 'Bike', health: 'Health', life: 'Life' };

function GlobalHomepageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setLanguage: setJourneyLang } = useJourneyStore();
  const { theme, cycleTheme } = useThemeStore();
  const { language, setLanguage: setGlobalLang } = useLanguageStore();
  const [screen, setScreen] = useState<Screen>('language');
  const [hydrated, setHydrated] = useState(false);
  const [selectedLOB, setSelectedLOB] = useState('Car');
  const [selectedLob, setSelectedLob] = useState<LobConfig | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const swipeDir = useRef(0);
  const SWIPE_THRESHOLD = 50;
  const initialTabApplied = useRef(false);

  const { overrides, initialTab } = useLobSnapshots();

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
      const tab = ID_TO_TAB[lobParam];
      setSelectedLOB(tab);
      const profileStore = useUserProfileStore.getState();
      if (profileStore.hasActivePolicyInLob(lobParam as any)) {
        const lob = LOBS.find(l => l.id === lobParam);
        if (lob) {
          setSelectedLob(lob);
          setScreen('policy_action');
          return;
        }
      }
      setScreen('home');
      return;
    }

    if (langChosen) setScreen('home');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialTab && !initialTabApplied.current) {
      initialTabApplied.current = true;
      setSelectedLOB(initialTab);
    }
  }, [initialTab]);

  const activeLobId = LOB_ID_MAP[selectedLOB] || 'health';
  const override = overrides[activeLobId];
  const content = override?.content ?? LOB_CONTENT[activeLobId];

  const tabDots = useMemo(() => {
    const dots: Partial<Record<string, 'high' | 'medium' | 'low'>> = {};
    for (const [lobId, ov] of Object.entries(overrides)) {
      const tab = PRODUCT_TO_TAB[lobId as ProductKey];
      if (tab && ov) dots[tab] = ov.urgency;
    }
    return dots;
  }, [overrides]);

  const currentIdx = LOB_ITEMS.indexOf(selectedLOB as typeof LOB_ITEMS[number]);

  const goToLOB = useCallback((direction: 1 | -1) => {
    const nextIdx = (currentIdx + direction + LOB_ITEMS.length) % LOB_ITEMS.length;
    swipeDir.current = direction;
    setSelectedLOB(LOB_ITEMS[nextIdx]);
  }, [currentIdx]);

  const handleSwipe = useCallback((_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    if (Math.abs(offset.x) > SWIPE_THRESHOLD || Math.abs(velocity.x) > 300) {
      if (offset.x < 0) goToLOB(1);
      else goToLOB(-1);
    }
  }, [goToLOB]);

  const handleTabSelect = useCallback((tab: string) => {
    const newIdx = LOB_ITEMS.indexOf(tab as typeof LOB_ITEMS[number]);
    swipeDir.current = newIdx > currentIdx ? 1 : -1;
    setSelectedLOB(tab);
  }, [currentIdx]);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 120 : -120, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -120 : 120, opacity: 0 }),
  };

  const handleCTAClick = useCallback(() => {
    const lob = LOBS.find(l => l.id === activeLobId);
    if (!lob) return;
    const lobKey = lob.id as PolicyLob;
    const ps = useUserProfileStore.getState();

    const policyActive = ps.hasActivePolicyInLob(lobKey);
    const snapshotActive = override && override.urgency === 'low';

    if (policyActive || snapshotActive) {
      if (snapshotActive && !policyActive) {
        const snap = loadSnapshot(LOB_TO_PRODUCT[lobKey]);
        if (snap) {
          ps.setProfile({ firstName: snap.name || snap.userName || 'Rahul', isLoggedIn: true });
          if (!ps.policies.some(p => p.lob === lobKey && p.active)) {
            const detailParts = [
              snap.vehicleData?.model || snap.vehicleData?.make,
              snap.registrationNumber?.toUpperCase(),
            ].filter(Boolean);
            ps.addPolicy({
              id: `${lobKey}_snap_${Date.now()}`,
              lob: lobKey,
              policyNumber: `ACKO-M-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
              label: `${snap.selectedPlanType === 'zero_dep' ? 'Zero Dep' : snap.selectedPlanType === 'third_party' ? 'Third Party' : 'Comprehensive'} ${LOB_LABEL_MAP[lobKey] || lobKey}`,
              active: true,
              purchasedAt: snap.savedAt || new Date().toISOString(),
              premium: snap.totalPremium || 0,
              premiumFrequency: 'yearly',
              details: detailParts.length ? detailParts.join(' · ') : undefined,
            });
          }
        }
      }
      setSelectedLob(lob);
      setScreen('policy_action');
      return;
    }

    if (override) {
      router.push(override.route);
      return;
    }

    router.push(lob.route);
  }, [activeLobId, router, override]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#121212' }}>
        <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
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
          className="h-[100dvh] w-full flex justify-center overflow-hidden"
          style={{ background: '#121212' }}
        >
          <div
            className="relative w-full flex flex-col items-center"
            style={{ maxWidth: '375px', height: '100%' }}
          >
            {/* Purple glow at the top */}
            <PurpleGlow />

            {/* More options menu — top right */}
            <div className="absolute top-4 right-4 z-50">
              <motion.button
                onClick={() => setShowMenu(!showMenu)}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.9 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)">
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </motion.button>

              <AnimatePresence>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1.5 z-50 rounded-xl overflow-hidden shadow-2xl min-w-[200px]"
                      style={{ background: 'rgba(30,30,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}
                    >
                      <button
                        onClick={() => { cycleTheme(); }}
                        className="w-full px-4 py-3 text-left text-sm flex items-center gap-2.5 transition-colors hover:bg-white/5"
                        style={{ color: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        {THEME_ICONS[theme]}
                        Mode: {THEME_LABELS[theme]}
                      </button>
                      <button
                        onClick={handleLanguageCycle}
                        className="w-full px-4 py-3 text-left text-sm flex items-center gap-2.5 transition-colors hover:bg-white/5"
                        style={{ color: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                        </svg>
                        Lang: {LANG_LABELS[language as string] || language}
                      </button>
                      <button
                        onClick={handleResetFTU}
                        className="w-full px-4 py-3 text-left text-sm flex items-center gap-2.5 transition-colors hover:bg-white/5"
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

            {/* Logo + Title */}
            <div
              className="flex flex-col items-center w-full gap-[8px] shrink-0"
              style={{ paddingTop: '66px', paddingLeft: '16px', paddingRight: '16px' }}
            >
              <motion.div
                className="flex items-center justify-center w-full"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE_OUT_CUBIC }}
              >
                <AckoLogo variant="full-white" className="h-[25px]" />
              </motion.div>

              <motion.div
                className="w-full text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: EASE_OUT_CUBIC }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '24px',
                    lineHeight: '32px',
                    color: 'rgba(255,255,255,0.88)',
                    letterSpacing: '-0.5px',
                  }}
                >
                  <div>All your insurance</div>
                  <div>in one place</div>
                </div>
              </motion.div>
            </div>

            {/* LOB Tabs */}
            <div className="shrink-0" style={{ marginTop: '24px' }}>
              <LOBTabs selected={selectedLOB} onSelect={handleTabSelect} dots={tabDots} />
            </div>

            {/* Swipeable content area */}
            <motion.div
              className="w-full flex-1 min-h-0 flex flex-col"
              style={{ marginTop: '32px', touchAction: 'pan-y' }}
              onPanEnd={handleSwipe}
            >
              <AnimatePresence mode="wait" custom={swipeDir.current}>
                <motion.div
                  key={selectedLOB}
                  custom={swipeDir.current}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: EASE_OUT_CUBIC }}
                  className="w-full flex-1 min-h-0 flex flex-col"
                >
                  {/* Hero image */}
                  <div className="w-full flex-1 min-h-0">
                    <HeroImage src={content.heroImage} />
                  </div>

                  {/* Sub heading */}
                  <div className="shrink-0 w-full" style={{ marginTop: '16px', padding: '0 16px' }}>
                    <SubHeading
                      tagline={content.tagline}
                      headline={content.headline}
                      taglineColor={content.taglineColor}
                    />
                  </div>

                  {/* Highlight line */}
                  <div className="w-full shrink-0" style={{ marginTop: '16px' }}>
                    <HighlightLine text={content.highlight} />
                  </div>

                  {/* CTA Button */}
                  <div className="w-full shrink-0" style={{ marginTop: '24px', paddingBottom: '40px' }}>
                    <CTAButton label={content.cta} onClick={handleCTAClick} />
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      )}

      {screen === 'policy_action' && selectedLob && (() => {
        const ov = overrides[selectedLob.id as LobId];
        const dropOff = ov && ov.urgency !== 'low' ? {
          badge: ov.content.tagline,
          title: ov.content.headline.join(' '),
          subtitle: ov.content.highlight,
          urgency: ov.urgency,
          route: ov.route,
        } : null;
        return (
          <PolicyActionScreen
            key="policy_action"
            lobId={selectedLob.id}
            lobLabel={LOB_LABEL_MAP[selectedLob.id] || selectedLob.label}
            statusInfo={ov?.statusInfo}
            dropOffInfo={dropOff}
            onContinueJourney={dropOff ? () => router.push(dropOff.route) : undefined}
            onBuyNew={() => router.push(selectedLob.route)}
            onManagePolicy={() => {
              const routes: Record<string, string> = {
                health: '/health?screen=dashboard', car: '/motor?vehicle=car&screen=dashboard',
                bike: '/motor?vehicle=bike&screen=dashboard', life: '/life?screen=dashboard',
              };
              router.push(routes[selectedLob.id] || selectedLob.route);
            }}
            onBack={() => { setSelectedLob(null); setScreen('home'); }}
          />
        );
      })()}
    </AnimatePresence>
  );
}
