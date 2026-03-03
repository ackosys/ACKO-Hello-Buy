'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useJourneyStore } from '../lib/store';
import { useThemeStore } from '../lib/themeStore';
import { useUserProfileStore } from '../lib/userProfileStore';
import { useLanguageStore } from '../lib/languageStore';
import { clearSnapshot } from '../lib/journeyPersist';
import AckoLogo from './AckoLogo';
import { useT } from '../lib/translations';
import { assetPath } from '../lib/assetPath';
import Link from 'next/link';
import type { Language } from '../lib/types';

const MODULE_ORDER = ['entry', 'intent', 'family', 'coverage', 'health', 'customization', 'recommendation', 'review', 'payment', 'health_eval', 'completion'];

const THEME_ICONS: Record<string, React.ReactNode> = {
  dark: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>,
  light: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>,
};
const THEME_LABELS: Record<string, string> = { dark: 'Dark', light: 'Light' };

const LANG_ORDER: Language[] = ['en', 'hi', 'hinglish', 'kn'];
const LANG_LABELS: Record<Language, string> = { en: 'English', hi: 'हिन्दी', hinglish: 'Hinglish', kn: 'ಕನ್ನಡ', ta: 'தமிழ்', ml: 'മലയാളം' };

export default function Header() {
  const t = useT();
  const router = useRouter();
  const { currentModule, updateState, resetJourney } = useJourneyStore();
  const { theme, cycleTheme } = useThemeStore();
  const { language, setLanguage: setGlobalLang } = useLanguageStore();
  const { setLanguage: setJourneyLang } = useJourneyStore();
  const isLight = theme === 'light';
  const currentIndex = MODULE_ORDER.indexOf(currentModule);
  const progress = Math.round((currentIndex / (MODULE_ORDER.length - 1)) * 100);
  const [showMenu, setShowMenu] = useState(false);

  const hasExistingPolicy = useUserProfileStore((s) => s.hasActivePolicyInLob('health'));

  const handleRestart = useCallback(() => {
    setShowMenu(false);
    clearSnapshot('health');
    resetJourney();
  }, [resetJourney]);

  const handleViewPolicy = useCallback(() => {
    setShowMenu(false);
    router.push('/?lob=health');
  }, [router]);

  const handleGoHome = useCallback(() => {
    setShowMenu(false);
    router.push('/');
  }, [router]);

  const handleThemeToggle = useCallback(() => {
    cycleTheme();
  }, [cycleTheme]);

  const handleLanguageCycle = useCallback(() => {
    const idx = LANG_ORDER.indexOf(language as Language);
    const next = LANG_ORDER[(idx + 1) % LANG_ORDER.length];
    setGlobalLang(next);
    setJourneyLang(next);
  }, [language, setGlobalLang, setJourneyLang]);

  return (
    <header className="sticky top-0 z-30" style={{ background: 'var(--app-header-bg)', borderBottom: '1px solid var(--app-border)' }}>
      <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <AckoLogo variant={isLight ? 'color' : 'white'} className="h-5" />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => updateState({ showAIChat: true })}
            className="group relative w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
            title={t.header.aiHelp}
          >
            <svg className="w-4.5 h-4.5 transition-colors" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ color: isLight ? '#7C3AED' : '#D8B4FE' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full" style={{ border: `2px solid var(--app-header-bg)` }} />
          </button>

          <button
            onClick={() => updateState({ showExpertPanel: true })}
            className="group relative flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full transition-all active:scale-95"
            style={{ background: 'var(--app-overlay-bg)', border: '1px solid var(--app-border)' }}
            title={t.header.talkToExpert}
          >
            <div className="w-7 h-7 rounded-full overflow-hidden">
              <img
                src={assetPath('/brand-ambassador.png')}
                alt={t.header.expert}
                className="w-7 h-7 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
              <svg className="hidden w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={{ color: 'var(--app-text)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--app-text)', opacity: 0.9 }}>{t.header.expert}</span>
          </button>

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
              style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
              title="More options"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--app-text)' }}>
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div
                  className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-lg min-w-[180px]"
                  style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
                >
                  <button
                    onClick={handleRestart}
                    className="w-full px-4 py-3 text-left text-sm flex items-center gap-2 transition-colors hover:opacity-80"
                    style={{ color: 'var(--app-text)', borderBottom: '1px solid var(--app-border)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 4v6h6M23 20v-6h-6" />
                      <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                    </svg>
                    Start over
                  </button>
                  {hasExistingPolicy && (
                    <button
                      onClick={handleViewPolicy}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-2 transition-colors hover:opacity-80"
                      style={{ color: isLight ? '#7C3AED' : '#C4B5FD', borderBottom: '1px solid var(--app-border)' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                      View existing policy
                    </button>
                  )}
                  <button
                    onClick={handleGoHome}
                    className="w-full px-4 py-3 text-left text-sm flex items-center gap-2 transition-colors hover:opacity-80"
                    style={{ color: 'var(--app-text)', borderBottom: '1px solid var(--app-border)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      <polyline points="9,22 9,12 15,12 15,22" />
                    </svg>
                    Go to homepage
                  </button>
                  <button
                    onClick={handleThemeToggle}
                    className="w-full px-4 py-3 text-left text-sm flex items-center gap-2 transition-colors hover:opacity-80"
                    style={{ color: 'var(--app-text)', borderBottom: '1px solid var(--app-border)' }}
                  >
                    {THEME_ICONS[theme]}
                    Mode: {THEME_LABELS[theme]}
                  </button>
                  <button
                    onClick={handleLanguageCycle}
                    className="w-full px-4 py-3 text-left text-sm flex items-center gap-2 transition-colors hover:opacity-80"
                    style={{ color: 'var(--app-text)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                    </svg>
                    Lang: {LANG_LABELS[language as Language] || language}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="h-[2px]" style={{ background: 'var(--app-border)' }}>
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{
            width: `${progress}%`,
            background: 'var(--app-progress-gradient)',
            boxShadow: '0 0 8px rgba(168,85,247,0.5)',
          }}
        />
      </div>
    </header>
  );
}
