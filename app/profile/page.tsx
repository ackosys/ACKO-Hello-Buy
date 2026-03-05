'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useUserProfileStore } from '../../lib/userProfileStore';
import { useThemeStore } from '../../lib/themeStore';
import { useLanguageStore } from '../../lib/languageStore';
import { useJourneyStore } from '../../lib/store';
import type { Language } from '../../lib/types';

const PROFILE_POLICIES = [
  {
    id: '1',
    make: 'Tata',
    model: 'Harrier',
    regNumber: 'KA01 AB 1234',
    planType: 'Zero depreciation plan',
    validTill: '31 Aug 2026',
    imageUrl: '/car-images/harrier.png',
  },
  {
    id: '2',
    make: 'Tata',
    model: 'Nexon',
    regNumber: 'KA01 AB 3243',
    planType: 'Comprehensive plan',
    validTill: '31 Aug 2026',
    imageUrl: '/car-images/Nexon.png',
  },
];

const LANGUAGES: { id: Language; label: string; sublabel: string }[] = [
  { id: 'en', label: 'English', sublabel: 'Continue in English' },
  { id: 'hi', label: 'हिन्दी', sublabel: 'हिंदी में जारी रखें' },
  { id: 'hinglish', label: 'Hinglish', sublabel: 'Hindi in English script' },
  { id: 'kn', label: 'ಕನ್ನಡ', sublabel: 'ಕನ್ನಡದಲ್ಲಿ ಮುಂದುವರಿಸಿ' },
];

const LANG_LABELS: Record<string, string> = { en: 'English', hi: 'हिन्दी', hinglish: 'Hinglish', kn: 'ಕನ್ನಡ' };

/* ── Back Arrow SVG ── */
function BackArrow() {
  return (
    <svg width="10" height="18" viewBox="0 0 10 18" fill="none" stroke="var(--app-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1L1 9l8 8" />
    </svg>
  );
}

/* ── Chevron Right SVG ── */
function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--app-text-subtle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

/* ── Translate Icon ── */
function TranslateIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--app-text)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04M18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12m-2.62 7l1.62-4.33L19.12 17h-3.24z" />
    </svg>
  );
}

/* ── Theme Icon ── */
function ThemeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--app-text)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 009 9 9 9 0 11-9-9z" />
    </svg>
  );
}

/* ── Info Icon ── */
function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--app-text)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

/* ── Privacy Icon ── */
function PrivacyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--app-text)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

/* ── Terms Icon ── */
function TermsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--app-text)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

/* ── Logout Icon ── */
function LogoutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--app-text)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

/* ── Language Bottom Sheet ── */
function LanguageSheet({
  isOpen,
  onClose,
  theme,
}: {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
}) {
  const { setLanguage } = useLanguageStore();
  const { setLanguage: setJourneyLang } = useJourneyStore();
  const { language } = useLanguageStore();

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    setJourneyLang(lang);
    onClose();
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className={`app-${theme}`}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998]"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] rounded-t-2xl pb-8"
            style={{ background: 'var(--app-surface)', maxHeight: '80vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-4">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--app-border-strong)' }} />
            </div>

            <div className="px-5 pb-2">
              <h2 className="text-[20px] font-semibold" style={{ color: 'var(--app-text)' }}>
                Choose language
              </h2>
            </div>

            <div className="px-5 space-y-2 overflow-y-auto">
              {LANGUAGES.map((lang) => {
                const isActive = language === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => handleSelect(lang.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl transition-all"
                    style={{
                      background: isActive ? 'var(--app-accent)' : 'var(--app-overlay-bg)',
                      color: isActive ? 'white' : 'var(--app-text)',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-[16px] font-semibold shrink-0"
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--app-surface-2)',
                        color: isActive ? 'white' : 'var(--app-text)',
                      }}
                    >
                      {lang.id === 'en' ? 'A' : lang.id === 'hi' ? 'अ' : lang.id === 'hinglish' ? 'Hi' : 'ಅ'}
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-[15px] font-medium leading-[20px]">{lang.label}</div>
                      <div
                        className="text-[12px] leading-[16px] mt-0.5"
                        style={{ opacity: isActive ? 0.8 : 0.6 }}
                      >
                        {lang.sublabel}
                      </div>
                    </div>
                    {isActive && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ── Settings Row ── */
function SettingsRow({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
}) {
  return (
    <button
      className="w-full flex items-center justify-between transition-colors"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="flex items-center gap-4">
        {icon}
        <span className="text-[14px] font-medium leading-[20px]" style={{ color: 'var(--app-text)' }}>
          {label}
          {value && <span style={{ color: 'var(--app-text-muted)' }}>: {value}</span>}
        </span>
      </div>
      <ChevronRight />
    </button>
  );
}

/* ── Profile Page ── */
export default function ProfilePage() {
  const router = useRouter();
  const { firstName, phone, isLoggedIn, policies, setProfile } = useUserProfileStore();
  const { theme, cycleTheme } = useThemeStore();
  const { language } = useLanguageStore();
  const [showLangSheet, setShowLangSheet] = useState(false);
  const isLight = theme === 'light';

  // Auth guard — redirect to /login if not logged in
  useEffect(() => {
    if (!isLoggedIn) router.replace('/login');
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  const handleLogout = useCallback(() => {
    setProfile({ isLoggedIn: false, firstName: '', phone: '' });
    window.location.href = '/';
  }, [setProfile]);

  return (
    <div className={`app-${theme} min-h-screen`} style={{ background: isLight ? '#ebebeb' : 'var(--app-bg)' }}>
      <div className="max-w-[430px] mx-auto">
        {/* Nav Bar */}
        <div className="flex items-center px-5 py-3.5">
          <button onClick={() => router.back()} className="p-1">
            <BackArrow />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pt-2 flex flex-col gap-8">
          {/* Profile Card */}
          <div className="flex flex-col gap-2">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center pt-8 pb-6 px-6 rounded-2xl"
              style={{
                background: isLight ? '#fbfbfb' : 'var(--app-surface)',
                border: isLight ? '1px solid white' : '1px solid var(--app-border)',
                boxShadow: isLight
                  ? '0 2px 4px rgba(0,0,0,0.04), inset 0 1px 4px white'
                  : '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-[28px] font-semibold"
                style={{
                  background: '#8B6F47',
                  color: 'white',
                }}
              >
                {(firstName?.[0] || 'R').toUpperCase()}
              </div>

              {/* Name */}
              <h2
                className="text-[24px] font-semibold tracking-[-0.1px] leading-[32px] text-center mt-4"
                style={{ color: isLight ? '#040222' : 'var(--app-text)' }}
              >
                {firstName || 'Guest User'}
              </h2>

              {/* Phone */}
              <div className="flex items-center gap-1 mt-1">
                <span
                  className="text-[16px] leading-[24px]"
                  style={{ color: isLight ? '#5b5675' : 'var(--app-text-muted)' }}
                >
                  {phone || '—'}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isLight ? '#1B73E8' : 'var(--app-link)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
            </motion.div>

          </div>

        {/* Your ACKO Policies — horizontal carousel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="flex flex-col gap-4"
        >
          <h2 className="text-[20px] font-semibold tracking-[-0.1px] leading-[28px]" style={{ color: 'var(--app-text)' }}>
            Your ACKO policies
          </h2>
          {/* Carousel — negative margin to bleed past px-4 container */}
          <div
            className="flex gap-3 overflow-x-auto pb-2"
            style={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {PROFILE_POLICIES.map((policy) => (
              <div
                key={policy.id}
                className="relative shrink-0 overflow-hidden"
                style={{
                  width: '310px',
                  height: '172px',
                  borderRadius: '24px',
                  padding: '20px',
                  background: 'var(--app-surface)',
                  scrollSnapAlign: 'start',
                  boxShadow: '0 20px 20px -3px rgba(0,0,0,0.02), 0 6px 6px -2px rgba(0,0,0,0.02), 0 3.5px 3.5px -1.5px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)',
                }}
              >
                {/* Text info */}
                <div className="flex flex-col gap-1" style={{ width: '204px' }}>
                  <p className="text-[18px] font-semibold leading-[22px]" style={{ color: 'var(--app-text)' }}>
                    {policy.make} {policy.model}
                  </p>
                  <p className="text-[12px] leading-[16px]" style={{ color: 'var(--app-text-muted)' }}>{policy.regNumber}</p>
                  <p className="text-[12px] leading-[16px]" style={{ color: 'var(--app-text-muted)' }}>{policy.planType}</p>
                  <p className="text-[12px] leading-[16px]" style={{ color: 'var(--app-text-muted)' }}>Valid till {policy.validTill}</p>
                </div>

                {/* Car image — top right, overlapping */}
                <div className="absolute top-0 right-0 w-[105px] h-[105px] pointer-events-none">
                  <Image src={policy.imageUrl} alt={`${policy.make} ${policy.model}`} width={105} height={105} className="object-contain w-full h-full" />
                </div>

                {/* Primary: File a claim */}
                <button
                  className="absolute text-[12px] font-medium leading-[16px] px-4 py-2 rounded-lg transition-all active:opacity-80"
                  style={{ bottom: '20px', left: '20px', background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
                >
                  File a claim
                </button>

                {/* Secondary: Download policy */}
                <button
                  className="absolute text-[12px] font-medium leading-[16px] px-4 py-2 rounded-lg transition-all active:opacity-80"
                  style={{ bottom: '20px', left: '126px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--btn-secondary-border)', color: 'var(--btn-secondary-text)', boxShadow: 'var(--btn-secondary-shadow)' }}
                >
                  Download policy
                </button>
              </div>
            ))}
          </div>
        </motion.div>

          {/* Settings List */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="flex flex-col gap-6"
          >
            <SettingsRow
              icon={<TranslateIcon />}
              label="Language"
              value={LANG_LABELS[language] || language}
              onClick={() => setShowLangSheet(true)}
            />
            <SettingsRow
              icon={<ThemeIcon />}
              label="Theme"
              value={theme === 'light' ? 'Light' : 'Dark'}
              onClick={cycleTheme}
            />
            <SettingsRow icon={<InfoIcon />} label="About us" />
            <SettingsRow icon={<PrivacyIcon />} label="Privacy policy" />
            <SettingsRow icon={<TermsIcon />} label="Terms & conditions" />
            <SettingsRow
              icon={<LogoutIcon />}
              label="Log out"
              onClick={handleLogout}
            />
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center gap-4 mt-12 pb-8"
        >
          <div
            className="mx-4 p-3 rounded-xl text-center"
            style={{ background: isLight ? '#efe9fb' : 'rgba(124,58,237,0.12)' }}
          >
            <p className="text-[12px] leading-[18px]" style={{ color: isLight ? '#4b4b4b' : 'var(--app-text-muted)' }}>
              All the non-insurance services listed on this app are facilitated by ACKO Tech.{' '}
              <span className="font-medium" style={{ color: isLight ? '#121212' : 'var(--app-text)' }}>Read more</span>
            </p>
          </div>
          <p className="text-[12px] leading-[18px]" style={{ color: isLight ? '#4b4b4b' : 'var(--app-text-muted)' }}>
            Version 4.0.2 &nbsp;|&nbsp; Last visited: {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}, {new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
          </p>
        </motion.div>
      </div>

      {/* Language Bottom Sheet */}
      <LanguageSheet
        isOpen={showLangSheet}
        onClose={() => setShowLangSheet(false)}
        theme={theme}
      />
    </div>
  );
}
