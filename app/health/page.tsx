'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '../../lib/store';
import { useThemeStore } from '../../lib/themeStore';
import { loadSnapshot, clearSnapshot } from '../../lib/journeyPersist';
import { useUserProfileStore } from '../../lib/userProfileStore';
import LandingPage from '../../components/LandingPage';
import EntryScreen from '../../components/EntryScreen';
import Header from '../../components/Header';
import ChatContainer from '../../components/ChatContainer';
import { ExpertPanel, AIChatPanel } from '../../components/Panels';
import PostPaymentJourney from '../../components/PostPaymentJourney';
import Dashboard from '../../components/Dashboard';
import AckoLogo from '../../components/AckoLogo';
import LoginChatFlow from '../../components/LoginChatFlow';
import { useT } from '../../lib/translations';
import type { PostPaymentScenario } from '../../lib/types';

type Screen = 'login' | 'entry' | 'landing' | 'chat' | 'post_payment' | 'dashboard';

/* ═══════════════════════════════════════════════════════
   Welcome Overlay — 3s auto-dismiss transition on top of entry
   ═══════════════════════════════════════════════════════ */
function WelcomeOverlay({ onDone }: { onDone: () => void }) {
  const t = useT();
  useEffect(() => {
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1a0a3e 0%, #3a1d8e 30%, #6C4DE8 60%, #9b7bf7 100%)' }}
      onClick={onDone}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 16 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: [0, 0.8, 0.8, 0], y: [80, -500], rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)] }}
            transition={{ duration: 2.5 + Math.random() * 1.5, repeat: Infinity, delay: Math.random() * 1.5, ease: 'easeOut' }}
            className="absolute rounded-full"
            style={{ left: `${10 + Math.random() * 80}%`, bottom: 0, width: 5 + Math.random() * 8, height: 5 + Math.random() * 8, background: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#F472B6', '#60A5FA', '#34D399'][Math.floor(Math.random() * 7)] }}
          />
        ))}
      </div>
      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.08, 0.2, 0.08] }} transition={{ duration: 2.5, repeat: Infinity }} className="absolute w-[400px] h-[400px] rounded-full border-2 border-white/10" />
      <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }} className="relative z-10 text-center px-6">
        <motion.div initial={{ y: -15 }} animate={{ y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
          <AckoLogo variant="white" className="h-10 mx-auto" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
            {t.welcome.line1}<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-200">{t.welcome.line2}</span>
          </h1>
        </motion.div>
        <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-lg text-purple-200 mb-6 max-w-sm mx-auto">{t.welcome.subtitle}</motion.p>
        <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, type: 'spring', stiffness: 300 }} className="flex items-center justify-center gap-2.5 mb-6">
          {['✨', '🎉', '🚀', '💜', '🎯'].map((emoji, i) => (
            <motion.span key={i} animate={{ y: [0, -6, 0] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.12 }} className="text-2xl">{emoji}</motion.span>
          ))}
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
          <div className="w-48 h-1 bg-white/20 rounded-full mx-auto mb-3 overflow-hidden">
            <motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 3, ease: 'linear' }} className="h-full bg-white/60 rounded-full" />
          </div>
          <motion.p animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-purple-300 text-xs">{t.common.tapToSkip}</motion.p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function HealthJourneyInner() {
  const { updateState, resetJourney } = useJourneyStore();
  const paymentComplete = useJourneyStore(s => s.paymentComplete);
  const isExistingUser = useJourneyStore(s => s.isExistingAckoUser);
  const { isLoggedIn } = useUserProfileStore();
  const [screen, setScreen] = useState<Screen>('entry');
  const [showWelcome, setShowWelcome] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const searchParams = useSearchParams();

  const seedDemoState = () => {
    updateState({
      userName: 'Rahul', paymentComplete: true,
      members: [
        { id: 'self-1', name: 'Rahul', age: 32, relation: 'self' as const, conditions: [] },
        { id: 'spouse-1', name: 'Priya', age: 29, relation: 'spouse' as const, conditions: [] },
      ],
      hasConditions: false,
      selectedPlan: { name: 'ACKO Platinum', tier: 'platinum' as const, tagline: 'Complete coverage for your family', sumInsured: 2500000, sumInsuredLabel: '₹25L', monthlyPremium: 1249, yearlyPremium: 12999, features: ['Unlimited restoration', 'No room rent cap', 'Day 1 coverage'], exclusions: [], waitingPeriod: '30 days', healthEval: 'TeleMER', recommended: true },
      paymentFrequency: 'yearly' as const,
    });
  };

  const seedDemoPolicy = () => {
    const ps = useUserProfileStore.getState();
    if (!ps.policies.some((p) => p.lob === 'health' && p.active)) {
      ps.setProfile({ firstName: 'Rahul', isLoggedIn: true });
      ps.addPolicy({
        id: `health_demo_${Date.now()}`,
        lob: 'health',
        policyNumber: `ACKO-H-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
        label: 'ACKO Platinum',
        active: true,
        purchasedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        premium: 12999,
        premiumFrequency: 'yearly',
        details: '₹25L cover · 2 members',
      });
    }
  };

  useEffect(() => {
    const resume = searchParams.get('resume') === '1';
    const snap = resume ? loadSnapshot('health') : null;

    resetJourney();

    const screenParam = searchParams.get('screen');

    if (screenParam === 'dashboard') {
      seedDemoState();
      seedDemoPolicy();
      setScreen('dashboard');
      setShowWelcome(false);
    } else if (snap) {
      updateState({
        userName: snap.userName ?? '',
        members: (snap.members ?? []).map((m, i) => ({
          id: `${m.relation}-${i}`,
          relation: m.relation as any,
          name: m.name ?? '',
          age: m.age,
          conditions: [],
        })),
        pincode: snap.pincode ?? '',
        selectedPlan: snap.selectedPlan as any ?? null,
        paymentComplete: snap.paymentComplete ?? false,
        paymentFrequency: snap.paymentFrequency ?? 'monthly',
        currentPremium: snap.currentPremium ?? 0,
        currentStepId: snap.currentStepId,
        isExistingAckoUser: true,
        ...(snap.testScheduledDate ? { testScheduledDate: snap.testScheduledDate } : {}),
        ...(snap.testScheduledLab ? { testScheduledLab: snap.testScheduledLab } : {}),
        ...(snap.callScheduledDate ? { callScheduledDate: snap.callScheduledDate } : {}),
        ...(snap.postPaymentScenario ? { postPaymentScenario: snap.postPaymentScenario as PostPaymentScenario } : {}),
      });
      if (snap.paymentComplete) {
        if (snap.currentStepId === 'completion.celebration') {
          seedDemoPolicy();
          setScreen('dashboard');
        } else {
          const stepMap: Record<string, string> = {
            'health_eval.schedule': 'resume_call_scheduled',
            'health_eval.call_done': 'scenario_select',
            'health_eval.lab_schedule': 'resume_test_results',
            'health_eval.intro': 'full_flow',
            'payment.success': 'full_flow',
          };
          setPostPaymentInitialPhase((stepMap[snap.currentStepId] || 'full_flow') as any);
          setScreen('post_payment');
        }
      } else {
        setScreen('chat');
      }
      setShowWelcome(false);
    }

    setHydrated(true);

    // Gate: show login flow first if not logged in
    if (!isLoggedIn) setScreen('login');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (paymentComplete && screen === 'chat') {
      const timer = setTimeout(() => setScreen('post_payment'), 2500);
      return () => clearTimeout(timer);
    }
  }, [paymentComplete, screen]);

  const handleEntrySelect = (isExisting: boolean) => {
    updateState({ isExistingAckoUser: isExisting, userName: isExisting ? 'Rahul' : '', currentStepId: 'entry.welcome', currentModule: 'entry' });
    setScreen('landing');
  };

  const handleDashboard = () => setScreen('dashboard');

  const openExpertPanel = (module?: string) => {
    if (module) updateState({ currentModule: module as never });
    updateState({ showExpertPanel: true });
  };

  const [postPaymentInitialPhase, setPostPaymentInitialPhase] = useState<'voice_call' | 'scenario_select' | undefined>(undefined);

  const handleJumpToCall = () => { seedDemoState(); setPostPaymentInitialPhase('voice_call'); setScreen('post_payment'); };
  const handleJumpToPostCallScenarios = () => { seedDemoState(); setPostPaymentInitialPhase('scenario_select'); setScreen('post_payment'); };
  const handleJumpToPostPayment = () => { seedDemoState(); setPostPaymentInitialPhase(undefined); setScreen('post_payment'); };
  const handleJumpToDashboard = () => { seedDemoState(); seedDemoPolicy(); setScreen('dashboard'); };

  const dismissWelcome = useCallback(() => setShowWelcome(false), []);

  if (!hydrated) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <>
      <AnimatePresence>
        {showWelcome && screen === 'entry' && <WelcomeOverlay key="welcome-overlay" onDone={dismissWelcome} />}
      </AnimatePresence>

      <ExpertPanel />
      <AIChatPanel />

      <AnimatePresence mode="wait">
        {screen === 'login' && (
          <div key="login" className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--app-bg)' }}>
            <LoginChatFlow
              onSuccess={() => setScreen('entry')}
              onBack={() => window.history.back()}
            />
          </div>
        )}
        {screen === 'entry' && (
          <EntryScreen key="entry" onSelect={handleEntrySelect} onJumpToPostPayment={handleJumpToPostPayment} onJumpToDashboard={handleJumpToDashboard} onJumpToCall={handleJumpToCall} onJumpToPostCallScenarios={handleJumpToPostCallScenarios} />
        )}
        {screen === 'landing' && (
          <LandingPage key="landing" isExistingUser={isExistingUser ?? undefined} onGetStarted={() => setScreen('chat')} onChat={() => setScreen('chat')} onCall={() => openExpertPanel('entry')} />
        )}
        {screen === 'post_payment' && (
          <motion.div key="post_payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PostPaymentJourney onDashboard={handleDashboard} initialPhase={postPaymentInitialPhase} onTalkToExpert={() => openExpertPanel('post_payment')} />
          </motion.div>
        )}
        {screen === 'dashboard' && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Dashboard onTalkToExpert={(ctx) => openExpertPanel(ctx || 'dashboard')} />
          </motion.div>
        )}
        {screen === 'chat' && (
          <div key="chat" className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--app-chat-gradient)' }}>
            <Header /><ChatContainer />
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function HealthJourney() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <HealthJourneyInner />
    </Suspense>
  );
}
