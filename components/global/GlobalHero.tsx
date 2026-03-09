'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../../lib/themeStore';
import { useJourneyStore } from '../../lib/store';
import { useLanguageStore } from '../../lib/languageStore';
import { useT } from '../../lib/translations';
import { Language } from '../../lib/types';
import { seedRecentVehicles, getBrandLogoUrl } from '../../lib/motorRecentVehicles';
import { clearSnapshot } from '../../lib/journeyPersist';
import AckoLogo from '../AckoLogo';
import Link from 'next/link';

interface GlobalHeroProps {
  userName?: string;
  hideHeadline?: boolean;
}

const THEME_ICONS: Record<string, React.ReactNode> = {
  light: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  ),
  dark: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
  ),
  aura: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
    </svg>
  ),
};

const LANGUAGES: { id: Language; label: string; nativeLabel: string; glyph: string }[] = [
  { id: 'en',       label: 'English',   nativeLabel: 'English',   glyph: 'A'  },
  { id: 'hi',       label: 'Hindi',     nativeLabel: 'हिन्दी',    glyph: 'अ' },
  { id: 'hinglish', label: 'Hinglish',  nativeLabel: 'Hinglish',  glyph: 'Hi' },
  { id: 'kn',       label: 'Kannada',   nativeLabel: 'ಕನ್ನಡ',    glyph: 'ಅ' },
  { id: 'ta',       label: 'Tamil',     nativeLabel: 'தமிழ்',     glyph: 'த' },
  { id: 'ml',       label: 'Malayalam', nativeLabel: 'മലയാളം',   glyph: 'മ' },
];

interface UserProfile {
  id: string;
  userName: string;
  isExistingAckoUser: boolean | null;
  labelKey: 'menuGuest' | 'menuUser1' | 'menuUser2' | 'menuUser3' | 'menuUser4';
  subKey:   'menuGuestSub' | 'menuUser1Sub' | 'menuUser2Sub' | 'menuUser3Sub' | 'menuUser4Sub';
  initials: string;
  motorScenario?: 'renewal_pending';
}

const USER_PROFILES: UserProfile[] = [
  { id: 'guest', userName: '',        isExistingAckoUser: null,  labelKey: 'menuGuest',  subKey: 'menuGuestSub',  initials: '?' },
  { id: 'u1',    userName: 'Rahul',   isExistingAckoUser: true,  labelKey: 'menuUser1',  subKey: 'menuUser1Sub',  initials: 'RS' },
  { id: 'u2',    userName: 'Priya',   isExistingAckoUser: false, labelKey: 'menuUser2',  subKey: 'menuUser2Sub',  initials: 'PM' },
  { id: 'u3',    userName: 'Arjun',   isExistingAckoUser: true,  labelKey: 'menuUser3',  subKey: 'menuUser3Sub',  initials: 'AN' },
  {
    id: 'u4', userName: 'Kiran', isExistingAckoUser: true,
    labelKey: 'menuUser4', subKey: 'menuUser4Sub', initials: 'KS',
    motorScenario: 'renewal_pending',
  },
];

export default function GlobalHero({ userName, hideHeadline }: GlobalHeroProps) {
  const { theme, cycleTheme } = useThemeStore();
  const { language, setLanguage: setJourneyLanguage, updateState } = useJourneyStore();
  const { setLanguage } = useLanguageStore();
  const t = useT();
  const isLight = theme === 'light';
  const [menuOpen, setMenuOpen] = useState(false);

  const currentUserId = USER_PROFILES.find(p => p.userName === (userName || ''))?.id ?? 'guest';

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setJourneyLanguage(lang);
    localStorage.setItem('acko_lang_chosen', 'true');
  };

  const handleProfileSelect = (profile: UserProfile) => {
    updateState({ userName: profile.userName, isExistingAckoUser: profile.isExistingAckoUser });

    if (profile.motorScenario === 'renewal_pending') {
      // Kiran has 2 policies:
      // · Swift KA01AB1234 — expiring in 24 days (urgent)
      // · Honda City MH02EF5678 — renewed 2 months ago, ~10 months left
      const swiftExpiry = new Date(Date.now() + 24 * 86_400_000).toISOString();
      const hondaExpiry = new Date(Date.now() + 305 * 86_400_000).toISOString();

      seedRecentVehicles([
        {
          make: 'Maruti', model: 'Swift', variant: 'VXI', vehicleType: 'car',
          registrationNumber: 'KA01AB1234', brandLogoUrl: getBrandLogoUrl('maruti'),
          expiryDate: swiftExpiry, savedAt: new Date().toISOString(),
        },
        {
          make: 'Honda', model: 'City', variant: 'ZX CVT', vehicleType: 'car',
          registrationNumber: 'MH02EF5678', brandLogoUrl: getBrandLogoUrl('honda'),
          expiryDate: hondaExpiry,
          savedAt: new Date(Date.now() - 60 * 86_400_000).toISOString(),
        },
      ]);

      // Save full policy data for the in-chat dashboard widget
      if (typeof window !== 'undefined') {
        const policies = [
          {
            id: 'p1', vehicleType: 'car', make: 'Maruti', model: 'Swift',
            variant: 'VXI', registrationNumber: 'KA01AB1234',
            policyNumber: 'ACKO-MV-2024-0091',
            plan: 'Comprehensive', planType: 'comprehensive',
            premium: 8499, idv: 520000, expiryDate: swiftExpiry,
            ncbPercentage: 35, addOns: ['engine_protection', 'zero_dep'],
          },
          {
            id: 'p2', vehicleType: 'car', make: 'Honda', model: 'City',
            variant: 'ZX CVT', registrationNumber: 'MH02EF5678',
            policyNumber: 'ACKO-MV-2023-5512',
            plan: 'Zero Dep Comprehensive', planType: 'zero_dep',
            premium: 12999, idv: 850000, expiryDate: hondaExpiry,
            ncbPercentage: 50, addOns: ['engine_protection', 'zero_dep', 'personal_accident'],
          },
        ];
        localStorage.setItem('acko_kiran_policies', JSON.stringify(policies));
      }

      clearSnapshot('car');
    } else {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('acko_motor_recent_vehicles');
        if (raw) {
          try {
            const vehicles = JSON.parse(raw);
            if (vehicles.some((v: { registrationNumber?: string }) => v.registrationNumber === 'KA01AB1234')) {
              localStorage.removeItem('acko_motor_recent_vehicles');
              localStorage.removeItem('acko_kiran_policies');
            }
          } catch { /* noop */ }
        }
      }
    }

    setMenuOpen(false);
  };

  const menuBg   = isLight ? '#FFFFFF' : 'var(--app-surface)';
  const menuBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)';
  const sectionLabel = isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)';

  return (
    <div className={`px-5 pt-6 ${hideHeadline ? 'pb-2' : 'pb-5'}`}>
      {/* Top bar */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
        className={`flex items-center justify-between ${hideHeadline ? 'mb-0' : 'mb-8'}`}
      >
        <Link href="/">
          <AckoLogo
            variant={isLight ? 'color' : 'white'}
            className="h-8"
          />
        </Link>

        <div className="flex items-center gap-3">
          {/* Theme switcher */}
          <button
            onClick={cycleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{
              background: 'var(--app-surface, rgba(255,255,255,0.1))',
              border: '1px solid var(--app-border, rgba(255,255,255,0.15))',
              color: 'var(--app-text-muted)',
            }}
            aria-label={`Switch theme (current: ${theme})`}
            title={`Theme: ${theme}`}
          >
            {THEME_ICONS[theme] ?? THEME_ICONS.light}
          </button>

          {/* Hamburger menu */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{
              background: menuOpen
                ? 'var(--app-accent, #7C3AED)'
                : 'var(--app-surface, rgba(255,255,255,0.1))',
              border: '1px solid var(--app-border, rgba(255,255,255,0.15))',
              color: menuOpen ? '#fff' : 'var(--app-text)',
            }}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              }
            </svg>
          </button>
        </div>
      </motion.div>

      {/* Hero headline — hidden when embedded in pages with their own title */}
      {!hideHeadline && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          {userName ? (
            <>
              <p className="text-sm mb-2" style={{ color: 'var(--app-text-muted)' }}>
                {t.global.welcomeBack(userName)}
              </p>
              <h1
                className="text-[32px] font-black leading-[1.1] tracking-tight mb-3 whitespace-pre-line"
                style={{ color: 'var(--app-text)' }}
              >
                {t.global.heroTitleUser}
              </h1>
            </>
          ) : (
            <>
              <h1
                className="text-[32px] font-black leading-[1.1] tracking-tight mb-2 whitespace-pre-line"
                style={{ color: 'var(--app-text)' }}
              >
                {t.global.heroTitle}
              </h1>
              <p
                className="text-[15px] leading-[1.5]"
                style={{ color: 'var(--app-text-muted)' }}
              >
                {t.global.heroSubtitle}
              </p>
            </>
          )}
        </motion.div>
      )}

      {/* ── Hamburger Drawer ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
              onClick={() => setMenuOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[80vw] max-w-[320px] overflow-y-auto"
              style={{
                background: menuBg,
                borderLeft: `1px solid ${menuBorder}`,
                boxShadow: '-8px 0 32px rgba(0,0,0,0.25)',
              }}
            >
              {/* Drawer header */}
              <div
                className="flex items-center justify-between px-5 py-5 border-b"
                style={{ borderColor: menuBorder }}
              >
                <Link href="/">
                  <AckoLogo
                    variant={isLight ? 'color' : 'white'}
                    className="h-6"
                  />
                </Link>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95"
                  style={{
                    background: 'var(--app-surface, rgba(0,0,0,0.06))',
                    color: 'var(--app-text-muted)',
                  }}
                  aria-label={t.global.menuClose}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-5 py-4 space-y-6">
                {/* ── Language section ── */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: sectionLabel }}>
                    {t.global.menuLanguage}
                  </p>
                  <div className="space-y-2">
                    {LANGUAGES.map((lang) => {
                      const active = language === lang.id;
                      return (
                        <button
                          key={lang.id}
                          onClick={() => handleLanguageSelect(lang.id)}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all active:scale-[0.98]"
                          style={{
                            background: active
                              ? (isLight ? 'rgba(124,58,237,0.1)' : 'rgba(167,139,250,0.15)')
                              : 'transparent',
                            border: `1.5px solid ${active
                              ? (isLight ? '#7C3AED' : '#A78BFA')
                              : menuBorder}`,
                          }}
                        >
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                            style={{
                              background: active
                                ? (isLight ? '#7C3AED' : '#A78BFA')
                                : 'var(--app-surface, rgba(0,0,0,0.06))',
                              color: active ? '#fff' : 'var(--app-text-muted)',
                            }}
                          >
                            {lang.glyph}
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--app-text)' }}>
                              {lang.nativeLabel}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--app-text-muted)' }}>
                              {lang.label}
                            </p>
                          </div>
                          {active && (
                            <svg className="w-4 h-4 shrink-0" style={{ color: isLight ? '#7C3AED' : '#A78BFA' }} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px" style={{ background: menuBorder }} />

                {/* ── Profile section ── */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: sectionLabel }}>
                    {t.global.menuProfile}
                  </p>
                  <div className="space-y-2">
                    {USER_PROFILES.map((profile) => {
                      const active = currentUserId === profile.id;
                      return (
                        <button
                          key={profile.id}
                          onClick={() => handleProfileSelect(profile)}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all active:scale-[0.98]"
                          style={{
                            background: active
                              ? (isLight ? 'rgba(124,58,237,0.1)' : 'rgba(167,139,250,0.15)')
                              : 'transparent',
                            border: `1.5px solid ${active
                              ? (isLight ? '#7C3AED' : '#A78BFA')
                              : menuBorder}`,
                          }}
                        >
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{
                              background: active
                                ? (isLight ? '#7C3AED' : '#A78BFA')
                                : 'var(--app-surface, rgba(0,0,0,0.06))',
                              color: active ? '#fff' : 'var(--app-text-muted)',
                            }}
                          >
                            {profile.initials}
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--app-text)' }}>
                                {t.global[profile.labelKey]}
                              </p>
                              {profile.motorScenario && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                                  style={{ background: 'rgba(234,88,12,0.15)', color: '#EA580C' }}>
                                  test
                                </span>
                              )}
                            </div>
                            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--app-text-muted)' }}>
                              {t.global[profile.subKey]}
                            </p>
                          </div>
                          {active && (
                            <svg className="w-4 h-4 shrink-0" style={{ color: isLight ? '#7C3AED' : '#A78BFA' }} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
