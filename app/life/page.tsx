'use client';

/**
 * Life Insurance Journey — Page orchestrator.
 * Flows: entry → chat (with optional expert/AI panels)
 * Landing page removed — USPs are embedded in the conversational intro.
 */

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLifeJourneyStore } from '../../lib/life/store';
import { useLanguageStore } from '../../lib/languageStore';
import { loadSnapshot, type JourneySnapshot } from '../../lib/journeyPersist';
import LifeChatContainer from '../../components/life/LifeChatContainer';
import LifeEntryScreen from '../../components/life/LifeEntryScreen';
import LifeHeader from '../../components/life/LifeHeader';
import { LifeExpertPanel, LifeAIChatPanel } from '../../components/life/LifePanels';
import AckoLogo from '../../components/AckoLogo';

type Screen = 'entry' | 'chat';

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
  const [screen, setScreen] = useState<Screen>('entry');
  const [hydrated, setHydrated] = useState(false);
  const searchParams = useSearchParams();

  // Keep life store language in sync with the global language selection
  useEffect(() => { store.setLanguage(globalLanguage); }, [globalLanguage]);

  useEffect(() => {
    const resume = searchParams.get('resume') === '1';
    const snap = resume ? loadSnapshot('life') : null;

    if (snap) {
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
  }, []);

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
      <AnimatePresence mode="wait">
        {/* Entry Screen — stepper journey overview */}
        {screen === 'entry' && (
          <LifeEntryScreen
            key="entry"
            onBuyJourney={() => setScreen('chat')}
            onJumpToEkyc={() => jumpToStep('life_ekyc')}
            onJumpToFinancial={() => jumpToStep('life_financial')}
            onJumpToMedical={() => jumpToStep('life_medical_eval')}
            onJumpToUnderwriting={() => jumpToStep('life_underwriting')}
          />
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
