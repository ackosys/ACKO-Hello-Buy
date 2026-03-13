'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useMotorStore } from '../../lib/motor/store';
import { useThemeStore } from '../../lib/themeStore';
// COMMENTED OUT: Old intro and entry screens
// import AuraMotorEntryScreen from '../../components/motor/aura/AuraMotorEntryScreen';
// import AuraMotorPrototypeIntro from '../../components/motor/aura/AuraMotorPrototypeIntro';
import AuraMotorEntryNav from '../../components/motor/aura/AuraMotorEntryNav';
import AuraMotorHeader from '../../components/motor/aura/AuraMotorHeader';
import AuraMotorChatContainer from '../../components/motor/aura/AuraMotorChatContainer';
import { MotorHelpPanel } from '../../components/motor/MotorPanels';
import AckoLogo from '../../components/AckoLogo';
import { VehicleType, MotorJourneyState } from '../../lib/motor/types';

type Screen = 'explore' | 'chat';

/* COMMENTED OUT: AuraWelcomeOverlay — temporarily disabled, journey starts from home page
function AuraWelcomeOverlay({ onDone }: { onDone: () => void }) {
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
      style={{ background: 'linear-gradient(135deg, #121214 0%, #1E1E22 30%, #2D2D35 60%, #121214 100%)' }}
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
              background: ['#A855F7', '#C084FC', '#7E22CE', '#3B82F6', '#EC4899'][Math.floor(Math.random() * 5)],
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
        <p className="text-lg mb-4" style={{ color: '#C084FC' }}>
          Quick, simple, and affordable
        </p>
        <div className="flex items-center justify-center gap-3 mb-6">
          <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <svg className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.8)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </motion.div>
          <span className="text-2xl" style={{ color: 'rgba(255,255,255,0.3)' }}>&</span>
          <motion.div animate={{ x: [0, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}>
            <svg className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.8)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="5.5" cy="17" r="3" />
              <circle cx="18.5" cy="17" r="3" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 6h2l3 8M5.5 17L10 9l3 3h4" />
            </svg>
          </motion.div>
        </div>
        <div className="w-48 h-1 rounded-full mx-auto overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.5, ease: 'linear' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #A855F7, #C084FC)' }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
END COMMENTED OUT */

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

function MotorV3JourneyInner() {
  const store = useMotorStore();
  const { updateState, resetJourney } = store;
  const theme = useThemeStore(s => s.theme);
  const searchParams = useSearchParams();

  const mode = searchParams.get('mode');
  const vehicleParam = searchParams.get('vehicle') as VehicleType | null;
  const initialScreen: Screen = mode === 'explore' ? 'explore' : 'chat';

  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    resetJourney();
    if (initialScreen === 'chat') {
      const vehicle: VehicleType = vehicleParam === 'bike' ? 'bike' : 'car';
      updateState({
        vehicleType: vehicle,
        currentStepId: 'registration.has_number',
        currentModule: 'registration',
      } as Partial<MotorJourneyState>);
    }
    setHydrated(true);
  }, []);

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
    const needsDemoState = stepId !== 'vehicle_type.select';
    if (needsDemoState) seedDemoState(vehicleType);
    const moduleMap: Record<string, string> = {
      'vehicle_type.select': 'vehicle_type',
      'registration.has_number': 'registration',
      'registration.enter_number': 'registration',
      'manual_entry.congratulations': 'manual_entry',
      'quote.plan_selection': 'quote',
      'addons.out_of_pocket': 'addons',
      'review.premium_breakdown': 'review',
    };
    const isBrandNewEntry = stepId === 'manual_entry.congratulations';
    updateState({
      vehicleType,
      currentStepId: stepId,
      currentModule: moduleMap[stepId] || 'vehicle_type',
      ...(isBrandNewEntry ? { vehicleEntryType: 'brand_new' } : {}),
    } as Partial<MotorJourneyState>);
    setScreen('chat');
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#121214' }}>
        <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#A855F7', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className={theme === 'light' ? 'aura-light' : 'aura-dark'}>
      <MotorHelpPanel />

      <AnimatePresence mode="wait">
        {screen === 'explore' && (
          <AuraMotorEntryNav
            key="explore"
            initialVehicle={vehicleParam === 'bike' ? 'bike' : 'car'}
            onStartJourney={handleStartJourney}
            onJumpTo={handleJumpTo}
          />
        )}
        {screen === 'chat' && (
          <div key="chat" className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--aura-bg)' }}>
            <AuraMotorHeader />
            <AuraMotorChatContainer />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MotorV3Journey() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#121214' }}>
        <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#A855F7', borderTopColor: 'transparent' }} />
      </div>
    }>
      <MotorV3JourneyInner />
    </Suspense>
  );
}
