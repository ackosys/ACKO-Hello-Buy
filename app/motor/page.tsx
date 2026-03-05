'use client';

import { useState, useEffect, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useMotorStore } from '../../lib/motor/store';
import { useThemeStore } from '../../lib/themeStore';
import { useLanguageStore } from '../../lib/languageStore';
import { loadSnapshot } from '../../lib/journeyPersist';
import { useUserProfileStore } from '../../lib/userProfileStore';
import MotorHelloEntry from '../../components/motor/MotorHelloEntry';
import MotorHeader from '../../components/motor/MotorHeader';
import MotorChatContainer from '../../components/motor/MotorChatContainer';
import { MotorExpertPanel, MotorAIChatPanel } from '../../components/motor/MotorPanels';
import { VehicleType, MotorJourneyState, MotorIntent } from '../../lib/motor/types';
import LoginChatFlow from '../../components/LoginChatFlow';
// LoginIntent type is used implicitly via the onSuccess callback

type Screen = 'login' | 'explore' | 'chat';

/* COMMENTED OUT: WelcomeOverlay — temporarily disabled, replaced by explore nav
function WelcomeOverlay({ onDone }: { onDone: () => void }) {
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
              background: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#F472B6'][Math.floor(Math.random() * 5)],
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
          Motor Insurance
        </h1>
        <p className="text-lg text-purple-200 mb-4">
          Quick, simple, and affordable
        </p>
        <div className="flex items-center justify-center gap-3 mb-6">
          <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <svg className="w-8 h-8 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </motion.div>
          <span className="text-2xl text-white/40">&</span>
          <motion.div animate={{ x: [0, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}>
            <svg className="w-8 h-8 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="5.5" cy="17" r="3" />
              <circle cx="18.5" cy="17" r="3" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 6h2l3 8M5.5 17L10 9l3 3h4" />
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
END COMMENTED OUT */

/* ═══════════════════════════════════════════════
   Helper: seed demo state for deep-linking into
   mid-journey or post-payment steps
   ═══════════════════════════════════════════════ */
function seedDemoState(vehicleType: VehicleType) {
  const isCar = vehicleType === 'car';
  const { updateState: storeUpdate } = useMotorStore.getState() as any;
  storeUpdate({
    vehicleType,
    userName: 'Rahul',
    registrationNumber: isCar ? 'DL01XX1234' : 'KA05AB9876',
    vehicleEntryType: 'existing',
    vehicleDataSource: 'auto_fetched',
    autoFetchSuccess: true,
    vehicleData: {
      make: isCar ? 'Maruti' : 'Royal Enfield',
      model: isCar ? 'Swift Dzire' : 'Classic 350',
      variant: isCar ? 'LXI' : 'Dual Channel',
      fuelType: 'petrol',
      registrationYear: 2021,
      registrationMonth: 'March',
      hasCngKit: false,
      isCommercialVehicle: false,
    },
    previousPolicy: {
      insurer: 'TATA AIG',
      expiryDate: '28/06/2024',
      policyType: 'comprehensive',
      ncbPercentage: 35,
      hadClaims: false,
    },
    policyStatus: 'active',
    preQuoteComplete: true,
    selectedPlanType: 'comprehensive',
    selectedGarageTier: 'network',
    selectedPlan: {
      name: 'Comprehensive (Network)',
      type: 'comprehensive',
      garageTier: 'network',
      odPremium: isCar ? 5400 : 1800,
      tpPremium: isCar ? 2094 : 714,
      ncbDiscount: isCar ? 1890 : 630,
      totalPrice: isCar ? 7500 : 2500,
      addOnsAvailable: isCar
        ? ['engine_protection', 'extra_car_protection', 'consumables_cover', 'personal_accident', 'passenger_protection', 'paid_driver']
        : ['engine_protection', 'consumables_cover', 'personal_accident', 'passenger_protection', 'paid_driver'],
      features: [
        'Own Damage cover — Accident, fire, theft, natural calamity',
        'Third-party liability — Mandatory legal coverage',
        'Cashless claims at 5,400+ garages — No upfront payment',
        'Personal Accident cover — ₹15 lakh for owner-driver',
      ],
      notCovered: [
        'Normal wear and tear',
        'Mechanical or electrical breakdown',
        'Driving without valid license',
        'Consequential damage',
      ],
    },
    selectedAddOns: [],
    availablePlans: [],
    idv: isCar ? 750000 : 175000,
    idvMin: isCar ? 675000 : 157500,
    idvMax: isCar ? 787500 : 183750,
    paymentComplete: false,
    totalPremium: isCar ? 7500 : 2500,
  } as Partial<MotorJourneyState>);

}

function seedDemoPolicy(vehicleType: VehicleType) {
  const isCar = vehicleType === 'car';
  const lob = isCar ? 'car' as const : 'bike' as const;
  const ps = useUserProfileStore.getState();
  if (!ps.policies.some((p) => p.lob === lob && p.active)) {
    ps.setProfile({ firstName: 'Rahul', isLoggedIn: true });
    ps.addPolicy({
      id: `${lob}_demo_${Date.now()}`,
      lob,
      policyNumber: `ACKO-M-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      label: `Comprehensive ${isCar ? 'Car' : 'Bike'} Insurance`,
      active: true,
      purchasedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      premium: isCar ? 7500 : 2500,
      premiumFrequency: 'yearly',
      details: `${isCar ? 'Maruti Swift Dzire' : 'Royal Enfield Classic 350'} · ${isCar ? 'DL01XX1234' : 'KA05AB9876'}`,
    });
  }
}

function MotorJourneyInner() {
  const store = useMotorStore();
  const { updateState, resetJourney, setLanguage } = store;
  const userName = store.userName;
  const theme = useThemeStore((s) => s.theme);
  const globalLanguage = useLanguageStore((s) => s.language);
  const searchParams = useSearchParams();
  const { isLoggedIn } = useUserProfileStore();

  const vehicleParam = searchParams.get('vehicle') as VehicleType | null;
  const resumeParam = searchParams.get('resume') === '1';
  const [screen, setScreen] = useState<Screen>('login');
  const [hydrated, setHydrated] = useState(false);

  // Keep motor store language in sync with the global language selection
  useEffect(() => { setLanguage(globalLanguage); }, [globalLanguage, setLanguage]);

  useEffect(() => {
    const product = vehicleParam ?? 'car';
    const snap = resumeParam ? loadSnapshot(product) : null;
    const screenParam = searchParams.get('screen');

    resetJourney();

    // Set vehicleType from URL param immediately so MotorHeader shows the badge
    updateState({ vehicleType: product as VehicleType } as Partial<MotorJourneyState>);

    if (screenParam === 'dashboard') {
      const vt: VehicleType = vehicleParam ?? 'car';
      seedDemoState(vt);
      seedDemoPolicy(vt);
      updateState({ vehicleType: vt, paymentComplete: true, journeyComplete: false, currentStepId: 'db.welcome', currentModule: 'dashboard' } as Partial<MotorJourneyState>);
      setScreen('chat');
    } else if (snap && snap.vehicleType) {
      seedDemoState(snap.vehicleType);
      updateState({
        vehicleType: snap.vehicleType,
        registrationNumber: snap.registrationNumber ?? '',
        ownerName: snap.ownerName ?? '',
        totalPremium: snap.totalPremium ?? 0,
        selectedPlanType: (snap.selectedPlanType as any) ?? null,
        paymentComplete: snap.paymentComplete ?? false,
        ...(snap.vehicleData ? {
          vehicleData: {
            make: snap.vehicleData.make ?? '',
            model: snap.vehicleData.model ?? '',
            variant: snap.vehicleData.variant ?? '',
            fuelType: (snap.vehicleData.fuelType as any) ?? '',
            registrationYear: snap.vehicleData.registrationYear ?? null,
            registrationMonth: '',
            hasCngKit: null,
            isCommercialVehicle: null,
          },
        } : {}),
        currentStepId: snap.currentStepId,
        currentModule: snap.currentStepId.split('.')[0].replace('_', '_') as any,
      } as Partial<MotorJourneyState>);
      setScreen('chat');
    } else {
      // Check if this is Kiran's multi-policy scenario
      try {
        const raw = typeof window !== 'undefined'
          ? localStorage.getItem('acko_kiran_policies')
          : null;
        if (raw) {
          const policies: Record<string, unknown>[] = JSON.parse(raw);
          if (policies.length > 0) {
            updateState({
              vehicleType: vehicleParam ?? 'car',
              dashboardPolicies: policies,
              paymentComplete: true,
              currentStepId: 'db.policy_list',
              currentModule: 'dashboard',
            } as Partial<MotorJourneyState>);
            setScreen('chat');
          }
        }
      } catch { /* noop — stay on explore */ }
    }

    setHydrated(true);

    // Already logged in with no specific journey state → jump to registration chat
    if (isLoggedIn && screen === 'login') {
      const vt: VehicleType = vehicleParam ?? 'car';
      seedDemoState(vt);
      updateState({ vehicleType: vt, currentStepId: 'registration.has_number', currentModule: 'registration' } as Partial<MotorJourneyState>);
      setScreen('chat');
    }
  }, []);

  /* COMMENTED OUT: handleVehicleSelect — was used by MotorEntryScreen
  const handleVehicleSelect = (vehicleType: VehicleType) => {
    updateState({
      vehicleType,
      currentStepId: 'registration.has_number',
      currentModule: 'registration',
    } as Partial<MotorJourneyState>);
    setScreen('chat');
  };
  */

  const handleStartJourney = (vehicleType: VehicleType) => {
    resetJourney();
    updateState({
      vehicleType,
      currentStepId: 'registration.has_number',
      currentModule: 'registration',
    } as Partial<MotorJourneyState>);
    setScreen('chat');
  };

  const handleJumpTo = (stepId: string, vehicleType: VehicleType) => {
    resetJourney();
    const isDashboardStep = stepId.startsWith('db.');
    const needsDemoState = stepId !== 'vehicle_type.select';
    if (needsDemoState) seedDemoState(vehicleType);
    if (isDashboardStep) {
      seedDemoPolicy(vehicleType);
      updateState({ vehicleType, paymentComplete: true, journeyComplete: false, currentStepId: stepId, currentModule: 'dashboard' } as Partial<MotorJourneyState>);
    } else {
      const moduleMap: Record<string, string> = {
        'vehicle_type.select': 'vehicle_type',
        'registration.has_number': 'registration',
        'registration.enter_number': 'registration',
        'manual_entry.congratulations': 'manual_entry',
        'quote.plan_selection': 'quote',
        'addons.out_of_pocket': 'addons',
        'review.premium_breakdown': 'review',
      };
      updateState({ vehicleType, currentStepId: stepId, currentModule: moduleMap[stepId] || 'vehicle_type' } as Partial<MotorJourneyState>);
    }
    setScreen('chat');
  };

  const handleIntentSelected = (intent: MotorIntent) => {
    const vt: VehicleType = (vehicleParam === 'bike' ? 'bike' : 'car');
    if (intent === 'renew') {
      handleJumpTo('registration.enter_number', vt);
    } else if (intent === 'new_car') {
      handleJumpTo('manual_entry.congratulations', vt);
    } else if (intent === 'acko_drive') {
      handleJumpTo('registration.has_number', vt);
    } else if (intent === 'manage') {
      seedDemoState(vt);
      seedDemoPolicy(vt);
      updateState({ vehicleType: vt, paymentComplete: true, journeyComplete: false, currentStepId: 'db.welcome', currentModule: 'dashboard' } as Partial<MotorJourneyState>);
      setScreen('chat');
    }
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <MotorExpertPanel />
      <MotorAIChatPanel />

      {/* COMMENTED OUT: WelcomeOverlay, MotorPrototypeIntro, MotorEntryScreen
      <AnimatePresence>
        {showWelcome && screen === 'entry' && (
          <WelcomeOverlay key="welcome-overlay" onDone={dismissWelcome} />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {screen === 'intro' && (
          <MotorPrototypeIntro key="intro" onDone={() => setScreen('entry')} onJumpTo={handleJumpTo} />
        )}
        {screen === 'entry' && (
          <MotorEntryScreen key="entry" onSelect={handleVehicleSelect} />
        )}
      </AnimatePresence>
      */}

      <AnimatePresence mode="wait">
        {screen === 'login' && (
          <div key="login" className={`motor-${theme} h-screen flex items-stretch overflow-hidden`} style={{ background: 'var(--app-bg)' }}>
            <div className="max-w-[430px] w-full mx-auto flex flex-col overflow-hidden">
              <MotorHeader />
              <LoginChatFlow
                onSuccess={(intent) => {
                  const vt: VehicleType = vehicleParam === 'bike' ? 'bike' : 'car';
                  if (intent === 'insure_new') {
                    handleJumpTo('manual_entry.congratulations', vt);
                  } else if (intent === 'continue_quote') {
                    handleJumpTo('quote.plan_selection', vt);
                  } else {
                    handleJumpTo('registration.has_number', vt);
                  }
                }}
                onBack={() => window.history.back()}
                hideHeader
              />
            </div>
          </div>
        )}
        {screen === 'chat' && (
          <div key="chat" className={`h-screen flex items-stretch overflow-hidden motor-${theme}`} style={{ background: 'var(--motor-bg)' }}>
            <div className="max-w-[430px] w-full mx-auto flex flex-col overflow-hidden">
              <MotorHeader />
              <MotorChatContainer />
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function MotorJourney() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MotorJourneyInner />
    </Suspense>
  );
}
