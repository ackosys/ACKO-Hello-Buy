'use client';

/**
 * Life Insurance Journey — Page orchestrator.
 * Flows: splash → landing → chat (with optional expert/AI panels)
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLifeJourneyStore } from '../../lib/life/store';
import { useThemeStore } from '../../lib/themeStore';
import { useLanguageStore } from '../../lib/languageStore';
import { loadSnapshot, type JourneySnapshot } from '../../lib/journeyPersist';
import LifeChatContainer from '../../components/life/LifeChatContainer';
import LifeEntryScreen from '../../components/life/LifeEntryScreen';
import LifeLandingPage from '../../components/life/LifeLandingPage';
import LifeHeader from '../../components/life/LifeHeader';
import { LifeExpertPanel, LifeAIChatPanel } from '../../components/life/LifePanels';
import AckoLogo from '../../components/AckoLogo';
import LoginChatFlow from '../../components/LoginChatFlow';
import { useUserProfileStore } from '../../lib/userProfileStore';

type Screen = 'login' | 'entry' | 'landing' | 'chat';

/* ═══════════════════════════════════════════════
   Splash Screen — Auto-dismiss on entry
   ═══════════════════════════════════════════════ */
function LifeSplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1a0a3e 0%, #3a1d8e 30%, #6C4DE8 60%, #9b7bf7 100%)' }}
      onClick={onDone}
    >
      {/* Animated particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: [0, 0.6, 0.6, 0], y: [80, -400] }}
            transition={{ duration: 2.5 + Math.random() * 1.5, repeat: Infinity, delay: Math.random() * 1.5, ease: 'easeOut' }}
            className="absolute rounded-full"
            style={{
              left: `${10 + Math.random() * 80}%`,
              bottom: 0,
              width: 4 + Math.random() * 6,
              height: 4 + Math.random() * 6,
              background: ['#A78BFA', '#C4B5FD', '#7C3AED', '#DDD6FE', '#EDE9FE'][Math.floor(Math.random() * 5)],
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="relative z-10 text-center px-6"
      >
        <AckoLogo variant="white" className="h-10 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-white mb-2">
          Life Insurance
        </h1>
        <p className="text-lg text-purple-200 mb-4">
          Simple, transparent, no pressure
        </p>
        <div className="flex items-center justify-center gap-3 mb-6">
          {/* Umbrella icon */}
          <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
            <svg className="w-10 h-10 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M12 2C6.477 2 2 6.477 2 12h4a6 6 0 0 1 12 0h4c0-5.523-4.477-10-10-10Z" fill="currentColor" opacity="0.3" stroke="none" />
              <path d="M12 2C6.477 2 2 6.477 2 12h4a6 6 0 0 1 12 0h4c0-5.523-4.477-10-10-10Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 12v8c0 1.105-.895 2-2 2s-2-.895-2-2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="2" x2="12" y2="4" strokeLinecap="round" />
            </svg>
          </motion.div>
        </div>
        <div className="w-48 h-1 bg-white/20 rounded-full mx-auto overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.5, ease: 'linear' }}
            className="h-full bg-white/60 rounded-full"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function buildResumeMessages(snap: JourneySnapshot) {
  const name = snap.name || '';
  const parts: string[] = [];

  if (name) parts.push(`Name: ${name}`);
  if (snap.gender) parts.push(`Gender: ${snap.gender === 'male' ? 'Male' : 'Female'}`);
  if (snap.dob) parts.push(`Date of birth: ${snap.dob}`);
  if (snap.coverAmount) parts.push(`Coverage: ₹${(snap.coverAmount / 100000).toFixed(0)}L`);
  if (snap.annualPremium) parts.push(`Premium: ₹${snap.annualPremium.toLocaleString('en-IN')}/yr`);

  const greeting = name ? `Welcome back, ${name}!` : 'Welcome back!';
  const summary = parts.length > 0
    ? `${greeting} Here's what we have so far:\n\n${parts.map(p => `• ${p}`).join('\n')}\n\nLet's continue where you left off.`
    : `${greeting} Let's continue where you left off.`;

  return [
    {
      type: 'bot' as const,
      content: summary,
      stepId: 'resume_summary',
      module: 'basic_info',
    },
  ];
}

function LifeJourneyInner() {
  const store = useLifeJourneyStore();
  const { showExpertPanel, showAIChat, journeyComplete, paymentComplete, ekycComplete, financialComplete, medicalComplete } = store as unknown as { showExpertPanel: boolean; showAIChat: boolean; journeyComplete: boolean; paymentComplete: boolean; ekycComplete: boolean; financialComplete: boolean; medicalComplete: boolean };

  const globalLanguage = useLanguageStore((s) => s.language);
  const { isLoggedIn } = useUserProfileStore();
  const [screen, setScreen] = useState<Screen>('entry');
  const [hydrated, setHydrated] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const searchParams = useSearchParams();

  // Keep life store language in sync with the global language selection
  useEffect(() => { store.setLanguage(globalLanguage); }, [globalLanguage]);

  useEffect(() => {
    const resume = searchParams.get('resume') === '1';
    const screenParam = searchParams.get('screen');
    const snap = resume ? loadSnapshot('life') : null;

    if (screenParam === 'dashboard') {
      store.updateState({
        currentStepId: 'life_db.welcome',
        conversationHistory: [],
        stepHistory: ['life_db.welcome'],
        currentModule: 'dashboard',
        journeyComplete: true,
        paymentComplete: true,
      } as any);
      setScreen('chat');
      setShowSplash(false);
    } else if (snap) {
      const resumeMessages = buildResumeMessages(snap);
      const initialHistory = resumeMessages.map((m, i) => ({
        ...m,
        id: `resume-${i}`,
        timestamp: Date.now(),
      }));
      store.updateState({
        currentStepId: snap.currentStepId,
        conversationHistory: initialHistory,
        stepHistory: [snap.currentStepId],
        paymentComplete: snap.paymentComplete ?? false,
        ekycComplete: snap.ekycComplete ?? false,
        financialComplete: snap.financialComplete ?? false,
        medicalComplete: snap.medicalComplete ?? false,
        ...(snap.name ? { name: snap.name } : {}),
        ...(snap.gender ? { gender: snap.gender } : {}),
        ...(snap.dob ? { dob: snap.dob } : {}),
        ...(snap.coverAmount ? { coverAmount: snap.coverAmount } : {}),
        ...(snap.annualPremium ? { annualPremium: snap.annualPremium } : {}),
        ...(snap.monthlyPremium ? { monthlyPremium: snap.monthlyPremium } : {}),
        ...(snap.userPath ? { userPath: snap.userPath } : {}),
        currentModule: 'basic_info',
      } as any);
      setScreen('chat');
      setShowSplash(false);
    } else {
      store.updateState({
        currentStepId: 'life_intro',
        conversationHistory: [],
        stepHistory: [],
        journeyComplete: false,
        paymentComplete: false,
        ekycComplete: false,
        financialComplete: false,
        medicalComplete: false,
        userPath: '',
        currentModule: 'basic_info',
      } as any);
    }

    setHydrated(true);

    // Gate: show login flow first if not logged in
    if (!isLoggedIn) setScreen('login');
  }, []);

  const dismissSplash = useCallback(() => setShowSplash(false), []);

  const handleGetStarted = () => {
    setScreen('chat');
    store.updateState({ currentStepId: 'life_intro' });
  };

  const jumpToStep = (stepId: string) => {
    store.updateState({
      currentStepId: stepId,
      conversationHistory: [],
      paymentComplete: true,
    });
    setScreen('chat');
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a0a3e 0%, #2A1463 50%, #1C0B47 100%)' }}>
        <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <LifeSplashScreen key="splash" onDone={dismissSplash} />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {screen === 'login' && (
          <div key="login" className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--app-bg)' }}>
            <LoginChatFlow
              onSuccess={() => setScreen('entry')}
              onBack={() => window.history.back()}
            />
          </div>
        )}
        {/* Entry Screen — stepper journey overview */}
        {screen === 'entry' && !showSplash && (
          <LifeEntryScreen
            key="entry"
            onBuyJourney={() => setScreen('landing')}
            onJumpToEkyc={() => jumpToStep('life_ekyc')}
            onJumpToFinancial={() => jumpToStep('life_financial')}
            onJumpToMedical={() => jumpToStep('life_medical_eval')}
            onJumpToUnderwriting={() => jumpToStep('life_underwriting')}
            onJumpToDashboard={() => {
              store.updateState({
                currentStepId: 'life_db.welcome',
                conversationHistory: [],
                stepHistory: ['life_db.welcome'],
                currentModule: 'dashboard',
                journeyComplete: true,
                paymentComplete: true,
              } as any);
              setScreen('chat');
            }}
          />
        )}

        {/* Landing Page */}
        {screen === 'landing' && (
          <LifeLandingPage key="landing" onGetStarted={handleGetStarted} />
        )}

        {/* Main Chat Journey */}
        {screen === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-[100dvh] flex flex-col overflow-hidden"
            style={{ background: 'var(--app-chat-gradient)' }}
          >
            <LifeHeader />

            <div className="flex-1 flex relative overflow-hidden min-h-0">
              <div className="flex-1 flex flex-col min-h-0">
                <LifeChatContainer />
              </div>

              <AnimatePresence>
                {showExpertPanel && <LifeExpertPanel key="expert" />}
                {showAIChat && <LifeAIChatPanel key="ai" />}
              </AnimatePresence>
            </div>

            {journeyComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="shrink-0 p-6 text-center border-t border-white/10"
              >
                <AckoLogo variant="white" className="h-5 mx-auto mb-2 opacity-40" />
                <p className="text-[11px] text-white/30">
                  ACKO Life Insurance Ltd. | IRDAI Reg. No. 157
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function LifeJourneyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a0a3e 0%, #2A1463 50%, #1C0B47 100%)' }}>
        <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LifeJourneyInner />
    </Suspense>
  );
}
