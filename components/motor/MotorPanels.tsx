'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useMotorStore } from '../../lib/motor/store';
import { useThemeStore } from '../../lib/themeStore';
import { useUserProfileStore } from '../../lib/userProfileStore';
import { assetPath } from '../../lib/assetPath';
import { MotorModule, MotorJourneyState } from '../../lib/motor/types';

/* ═══════════════════════════════════════════════════════
   Expert data
   ═══════════════════════════════════════════════════════ */

interface MotorExpert {
  name: string;
  role: string;
  experience: string;
  helped: string;
  description: string;
  speciality: string[];
  initials: string;
  color: string;
  img: string;
}

const MOTOR_EXPERTS: MotorExpert[] = [
  {
    name: 'Vikram Desai',
    role: 'Motor Insurance Specialist',
    experience: '8+ years in motor claims',
    helped: '4,200+ customers helped',
    description: 'Expert in comprehensive plans, IDV optimization, and zero depreciation coverage. Specializes in helping first-time car buyers.',
    speciality: ['Comprehensive Plans', 'Zero Dep', 'New Car Insurance'],
    initials: 'VD',
    color: 'bg-purple-500',
    img: 'https://i.pravatar.cc/120?img=68',
  },
  {
    name: 'Meera Krishnan',
    role: 'Claims & Add-ons Advisor',
    experience: '6+ years in motor claims',
    helped: '3,100+ claims resolved',
    description: 'Specialist in motor claims processing, add-on selection, and helping customers maximize their coverage without overpaying.',
    speciality: ['Claims Process', 'Add-on Selection', 'Premium Optimization'],
    initials: 'MK',
    color: 'bg-blue-500',
    img: 'https://i.pravatar.cc/120?img=45',
  },
  {
    name: 'Arjun Nair',
    role: 'Vehicle Policy Consultant',
    experience: '10+ years in auto insurance',
    helped: '5,800+ policies reviewed',
    description: 'Deep expertise in NCB transfers, policy renewals, and switching between insurers. Helps customers make informed plan decisions.',
    speciality: ['NCB & Renewals', 'Policy Switching', 'IDV Calculation'],
    initials: 'AN',
    color: 'bg-teal-500',
    img: 'https://i.pravatar.cc/120?img=53',
  },
];

/* ═══════════════════════════════════════════════════════
   Context-aware content helpers
   ═══════════════════════════════════════════════════════ */

function getConcernsForMotorModule(module: MotorModule | string): string[] {
  switch (module) {
    case 'entry':
    case 'vehicle_type':
      return [
        'I\'m not sure which type of insurance I need',
        'What\'s the difference between car and bike insurance?',
        'Do I really need insurance beyond third-party?',
        'How does ACKO compare to other insurers?',
      ];
    case 'registration':
    case 'vehicle_fetch':
      return [
        'I don\'t have my registration number handy',
        'My vehicle details seem incorrect — what should I do?',
        'I just bought a brand new car, what do I need?',
        'Can I insure a vehicle registered in someone else\'s name?',
      ];
    case 'manual_entry':
      return [
        'My car model isn\'t listed — what do I do?',
        'Does the variant/fuel type affect my premium?',
        'What if I have an aftermarket CNG kit installed?',
        'How do I find my car\'s exact variant?',
      ];
    case 'pre_quote':
      return [
        'What is NCB and how does it affect my premium?',
        'My previous policy expired — do I lose my NCB?',
        'How do I transfer NCB from another insurer?',
        'Why does my policy status matter?',
      ];
    case 'quote':
      return [
        'What is IDV and how is it calculated?',
        'Difference between Comprehensive, Zero Dep, and Third Party?',
        'Why is Zero Dep more expensive than Comprehensive?',
        'Can I change my plan later?',
      ];
    case 'addons':
      return [
        'Is Zero Depreciation worth the extra cost?',
        'What does Engine Protection actually cover?',
        'Do I need Roadside Assistance if I have it from the manufacturer?',
        'Which add-ons are essential vs. nice-to-have?',
      ];
    case 'owner_details':
      return [
        'Where do I find my engine and chassis number?',
        'Why do you need my GST details?',
        'What if I\'ve taken a loan on my car?',
        'Can someone else be the nominee?',
      ];
    case 'review':
    case 'payment':
      return [
        'Is this payment secure?',
        'Can I pay in monthly installments?',
        'When does my coverage start after payment?',
        'What\'s your refund/cancellation policy?',
      ];
    case 'completion':
      return [
        'How do I download my policy document?',
        'When will I receive my policy certificate?',
        'How do I add this to my Digilocker?',
        'What should I do next?',
      ];
    case 'dashboard':
      return [
        'How do I raise a claim?',
        'Where can I find my policy documents?',
        'Can I modify my add-ons mid-term?',
        'How do I renew my policy?',
      ];
    case 'claims':
      return [
        'What documents do I need to file a claim?',
        'How long does claim settlement take?',
        'Can I get my car repaired at any garage?',
        'What if the other driver was at fault?',
      ];
    case 'edit_policy':
      return [
        'Can I add Zero Dep after buying the policy?',
        'Will adding add-ons increase my premium proportionally?',
        'How do I update my nominee details?',
        'Can I change my IDV mid-term?',
      ];
    default:
      return [
        'Help me understand my motor insurance options',
        'What does comprehensive coverage include?',
        'How do I file a claim with ACKO?',
        'I have a specific question about my policy',
      ];
  }
}

function getAIStartersForMotorModule(module: MotorModule | string): string[] {
  switch (module) {
    case 'entry':
    case 'vehicle_type':
      return [
        'What does motor insurance cover?',
        'Is third-party insurance enough for my car?',
        'How is ACKO different from other insurers?',
        'What\'s the minimum insurance I need by law?',
      ];
    case 'registration':
    case 'vehicle_fetch':
      return [
        'Why do you need my registration number?',
        'What if my car details are fetched incorrectly?',
        'Can I insure a car not registered in my name?',
        'I just bought a new car — how does this work?',
      ];
    case 'manual_entry':
      return [
        'Does my car variant affect the premium?',
        'What if I have an aftermarket CNG kit?',
        'Is commercial vehicle insurance different?',
        'How is registration year used in pricing?',
      ];
    case 'pre_quote':
      return [
        'What is NCB and how does it save me money?',
        'Can I transfer NCB from my old insurer?',
        'What happens if my policy has expired?',
        'Does claiming reduce my NCB?',
      ];
    case 'quote':
      return [
        'What is IDV? Should I go for higher IDV?',
        'Comprehensive vs Zero Dep — which is better?',
        'Why is third-party cheaper than comprehensive?',
        'What does "5,400+ network garages" mean?',
      ];
    case 'addons':
      return [
        'Is zero depreciation worth the extra cost?',
        'What does engine protection actually cover?',
        'Do I need roadside assistance?',
        'Which add-ons are essential for a new car?',
      ];
    case 'owner_details':
      return [
        'Where can I find my engine/chassis number?',
        'Why is GST number needed?',
        'Does a car loan affect my insurance?',
        'What happens if I sell my car mid-policy?',
      ];
    case 'review':
    case 'payment':
      return [
        'Is this payment secure?',
        'When does my coverage become active?',
        'Can I cancel and get a refund?',
        'Can I pay in EMIs?',
      ];
    case 'completion':
      return [
        'How do I download my policy?',
        'When will I get my policy certificate?',
        'What should I keep in my car at all times?',
        'How do I add this to Digilocker?',
      ];
    case 'dashboard':
      return [
        'How do I raise a motor claim?',
        'Where can I find the nearest network garage?',
        'Can I add or remove add-ons now?',
        'How do I renew my policy?',
      ];
    case 'claims':
      return [
        'What documents do I need for a claim?',
        'How long does claim settlement take?',
        'Cashless vs reimbursement — what\'s the difference?',
        'What if the accident wasn\'t my fault?',
      ];
    case 'edit_policy':
      return [
        'Can I add Zero Dep mid-term?',
        'How does changing add-ons affect premium?',
        'Can I update my nominee details?',
        'Can I increase my IDV now?',
      ];
    default:
      return [
        'What does comprehensive motor insurance cover?',
        'How do I file a claim with ACKO?',
        'What\'s the difference between plan types?',
        'How is my premium calculated?',
      ];
  }
}

function getMotorAIResponse(question: string): string {
  const q = question.toLowerCase();

  if (q.includes('idv') || q.includes('insured declared value')) {
    return 'IDV (Insured Declared Value) is the maximum amount your insurer will pay if your car is stolen or totally damaged beyond repair.\n\n**How it\'s calculated:**\n• Manufacturer\'s listed selling price minus depreciation based on age\n• A 1-year-old car: ~20% depreciation\n• A 5-year-old car: ~50% depreciation\n\n**Should you go higher?**\n• Higher IDV = higher premium but better payout\n• Lower IDV = lower premium but less coverage\n• ACKO recommends the fair market value — not too high, not too low\n\n**Pro tip:** If your car is new or recently purchased, keep IDV close to the ex-showroom price. As the car ages, let it depreciate naturally.';
  }

  if (q.includes('comprehensive') || q.includes('zero dep') || q.includes('third party') || q.includes('plan') || q.includes('difference')) {
    return 'Here\'s the honest comparison:\n\n**Third Party (mandatory by law)**\n• Covers damage you cause to others (people, property, vehicles)\n• Does NOT cover your own car damage\n• Cheapest option\n• Best for: Old cars with low market value\n\n**Comprehensive (most popular)**\n• Everything in Third Party PLUS own damage coverage\n• Covers accidents, theft, fire, natural disasters, vandalism\n• Choice of network garages (5,400+) or all garages\n• Best for: Most car owners\n\n**Zero Depreciation (best protection)**\n• Everything in Comprehensive PLUS zero deduction on parts\n• No depreciation deducted during claims — get full part value\n• Best for: New cars (under 5 years), expensive cars\n\n**Quick rule:** New car → Zero Dep. Used car → Comprehensive. Very old car → Third Party.';
  }

  if (q.includes('ncb') || q.includes('no claim bonus') || q.includes('no-claim')) {
    return 'NCB (No Claim Bonus) is a reward for not making claims.\n\n**How it works:**\n• 1 year without claim: 20% discount on OD premium\n• 2 years: 25% discount\n• 3 years: 35% discount\n• 4 years: 45% discount\n• 5+ years: 50% discount (maximum)\n\n**Important facts:**\n• NCB belongs to YOU, not the car — it transfers when you sell/change cars\n• NCB can be transferred between insurers when switching\n• Making even one claim resets your NCB to 0%\n• If your policy lapses for more than 90 days, you lose your NCB\n\n**ACKO tip:** Consider paying for small repairs out of pocket to protect your NCB. A 50% NCB on a ₹15,000 OD premium saves you ₹7,500/year — that adds up.';
  }

  if (q.includes('zero dep') || q.includes('depreciation') || q.includes('worth')) {
    return 'Zero Depreciation is one of the most valuable add-ons. Here\'s why:\n\n**Without Zero Dep (standard claim):**\nParts like rubber, plastic, glass, fiber have 30-50% depreciation deducted.\nExample: ₹50,000 bumper replacement → insurer pays only ₹25,000-35,000 → you pay the rest.\n\n**With Zero Dep:**\nNo depreciation deducted on ANY part.\nSame ₹50,000 bumper → insurer pays the full ₹50,000.\n\n**When it\'s worth it:**\n✅ Car is less than 5 years old\n✅ Luxury or expensive car\n✅ You drive frequently\n✅ You live in a high-risk area (flooding, hail)\n\n**When you can skip it:**\n⚡ Car is very old (high depreciation anyway)\n⚡ You barely drive\n⚡ Budget is very tight\n\nOn average, Zero Dep saves ₹8,000-25,000 per claim.';
  }

  if (q.includes('engine protection') || q.includes('engine protect')) {
    return 'Engine Protection covers damage to your engine that standard policies don\'t.\n\n**What it covers:**\n• Water ingression (engine hydrolocking during floods)\n• Oil leakage damage\n• Damage due to starting the car in waterlogged conditions\n\n**Why standard policies reject these:**\nInsurers typically classify water damage as "consequential" damage — your fault for driving into water. Engine protection overrides this.\n\n**Who needs it:**\n✅ If you live in a city prone to flooding (Mumbai, Chennai, Bengaluru)\n✅ If your parking is in a basement or low-lying area\n✅ If you drive during monsoons\n\n**Cost:** Usually ₹500-1,500/year — a fraction of the ₹50,000-2,00,000 engine repair bill.\n\nThis is one of ACKO\'s most recommended add-ons for monsoon-prone areas.';
  }

  if (q.includes('claim') || q.includes('file') || q.includes('accident') || q.includes('process')) {
    return 'Here\'s how motor claims work at ACKO:\n\n**Cashless claim (at network garages):**\n1. Inform ACKO within 24 hours of the incident\n2. Drive to any of 5,400+ network garages\n3. The garage sends a repair estimate to ACKO\n4. We approve it (usually within 2-4 hours)\n5. Car gets repaired — garage settles directly with us\n6. You pick up the car — zero payment\n\n**Reimbursement claim (any garage):**\n1. Inform ACKO within 24 hours\n2. Get your car repaired at any garage\n3. Upload bills and photos via the ACKO app\n4. We verify and reimburse within 5-7 working days\n\n**For theft or total loss:**\n1. File an FIR immediately\n2. Inform ACKO within 24 hours\n3. We initiate investigation\n4. Settlement based on IDV within 15-30 days\n\n**Documents needed:** Policy copy, RC, DL, photos of damage, FIR (if applicable).';
  }

  if (q.includes('add-on') || q.includes('addon') || q.includes('essential')) {
    return 'Here\'s our honest add-on guide:\n\n**Must-have add-ons:**\n• Zero Depreciation — saves ₹8K-25K per claim on part costs\n• Engine Protection — essential if you live in a flood-prone city\n• Personal Accident Cover — mandatory by law for owner-driver\n\n**Nice-to-have:**\n• Roadside Assistance — 24/7 towing, battery jumpstart, flat tire help\n• Return to Invoice — get full invoice value (not depreciated IDV) if car is stolen/totaled\n• Key Replacement — covers lost/stolen key replacement\n\n**Can usually skip:**\n• NCB Protection — only useful if you claim frequently\n• Consumables Cover — minor savings, already covered in some plans\n\n**For new cars (under 3 years):** Zero Dep + Engine Protection + Return to Invoice\n**For used cars (3-7 years):** Zero Dep + Engine Protection\n**For older cars (7+):** Basic comprehensive is usually sufficient';
  }

  if (q.includes('secure') || q.includes('payment') || q.includes('safe')) {
    return 'Your payment with ACKO is completely secure:\n\n• PCI-DSS compliant payment gateway\n• 256-bit SSL encryption\n• RBI-regulated payment partners\n• We don\'t store your card details\n\nPayment options: UPI, credit/debit card, net banking, wallets.\n\nACKO is licensed by IRDAI (Reg. No. 157). We insure 9 crore+ customers and are backed by Amazon, Accel Partners, and Multiples PE.\n\nYour policy becomes active immediately after successful payment.';
  }

  if (q.includes('cancel') || q.includes('refund')) {
    return 'ACKO has a transparent cancellation policy:\n\n**Within 15 days (Free Look Period):**\n• Full refund minus stamp duty and pro-rated risk charges\n• No questions asked\n\n**After 15 days:**\n• Pro-rated refund for the unused policy period\n• Short-rate cancellation table applies\n\n**Important:** Third-party premium is non-refundable once coverage starts (IRDAI regulation). Only the own-damage portion can be refunded pro-rata.';
  }

  if (q.includes('network garage') || q.includes('5400') || q.includes('5,400') || q.includes('garage')) {
    return 'ACKO has a network of 5,400+ partner garages across India.\n\n**Advantages of network garages:**\n• Cashless repairs — no upfront payment\n• Quality-checked mechanics\n• Genuine spare parts guaranteed\n• Faster claim approval (2-4 hours)\n• 6-month warranty on repairs\n\n**Can I go to any garage?**\nYes! You can also go to a non-network garage. The process changes to reimbursement — you pay first, we reimburse within 5-7 working days.\n\n**How to find one nearby:**\nUse the ACKO app → "Find Garage" → enter your pincode → see all network garages sorted by distance.\n\n**Comprehensive plan gives you two options:**\n• Network garages only (lower premium)\n• All garages including non-network (slightly higher premium)';
  }

  return 'Great question! ACKO motor insurance covers your vehicle against accidents, theft, fire, natural disasters, and third-party liability. We offer Comprehensive, Zero Depreciation, and Third Party plans with 5,400+ cashless garages.\n\nThe right plan depends on your car\'s age, value, and how you use it. Would you like me to explain any specific aspect in detail?';
}

/* ═══════════════════════════════════════════════════════
   Unified Motor Help Panel — Chat + Talk tabs
   ═══════════════════════════════════════════════════════ */

export function MotorHelpPanel() {
  const state = useMotorStore() as MotorJourneyState;
  const { showHelpPanel, helpPanelTab = 'chat', currentModule } = state;
  const updateState = useMotorStore((s) => s.updateState);
  const theme = useThemeStore((s) => s.theme);

  /* ── Talk tab state ── */
  const [selectedExpert, setSelectedExpert] = useState<MotorExpert | null>(null);
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [callbackRequested, setCallbackRequested] = useState(false);

  /* ── Call flow state ── */
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [callTimer, setCallTimer] = useState(0);
  const connectingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /* ── Chat tab state ── */
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const dynamicConcerns = useMemo(() => getConcernsForMotorModule(currentModule), [currentModule]);
  const starters = useMemo(() => getAIStartersForMotorModule(currentModule), [currentModule]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-transition from connecting → connected after 3s
  useEffect(() => {
    if (callState === 'connecting') {
      connectingTimeoutRef.current = setTimeout(() => {
        setCallState('connected');
        setCallTimer(0);
      }, 3000);
    }
    return () => {
      if (connectingTimeoutRef.current) {
        clearTimeout(connectingTimeoutRef.current);
        connectingTimeoutRef.current = null;
      }
    };
  }, [callState]);

  // Tick the call timer every second while connected
  useEffect(() => {
    if (callState === 'connected') {
      timerIntervalRef.current = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [callState]);

  const userName = useMemo(() => {
    const profileName = useUserProfileStore.getState().firstName;
    if (profileName) return profileName;
    const ownerName = state.ownerName;
    if (ownerName) return ownerName.split(' ')[0];
    return '';
  }, [state.ownerName]);

  // Mock voice greeting via Web Speech API when connected
  const [isSpeaking, setIsSpeaking] = useState(false);
  useEffect(() => {
    if (callState === 'connected' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      const name = userName || '';
      const greeting = name
        ? `Hi ${name}, how can we help you today?`
        : 'Hi, how can we help you today?';
      const utterance = new SpeechSynthesisUtterance(greeting);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      utterance.volume = 0.8;
      const voices = synth.getVoices();
      const preferred = voices.find(v => /samantha|karen|daniel|google.*female|google.*male/i.test(v.name));
      if (preferred) utterance.voice = preferred;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      const t = setTimeout(() => synth.speak(utterance), 600);
      return () => {
        clearTimeout(t);
        synth.cancel();
        setIsSpeaking(false);
      };
    }
  }, [callState, userName]);

  const resetCallState = useCallback(() => {
    setCallState('idle');
    setCallTimer(0);
    setIsSpeaking(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (connectingTimeoutRef.current) {
      clearTimeout(connectingTimeoutRef.current);
      connectingTimeoutRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const formatCallTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, []);

  const close = useCallback(() => {
    updateState({ showHelpPanel: false } as Partial<MotorJourneyState>);
    setSelectedExpert(null);
    setSelectedConcern(null);
    setShowBooking(false);
    setCallbackRequested(false);
    setSelectedTimeSlot(null);
    resetCallState();
  }, [updateState, resetCallState]);

  const switchTab = useCallback((tab: 'chat' | 'talk') => {
    updateState({ helpPanelTab: tab } as Partial<MotorJourneyState>);
    resetCallState();
    if (tab === 'talk') {
      setShowBooking(false);
      setSelectedExpert(null);
      setSelectedConcern(null);
      setCallbackRequested(false);
    }
  }, [updateState, resetCallState]);

  const handleSend = useCallback((text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', content: getMotorAIResponse(text) }]);
    }, 1200);
  }, []);

  return (
    <AnimatePresence>
      {showHelpPanel && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={close}
          />

          {/* Panel — carries motor-${theme} so all --motor-* CSS vars apply */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`motor-${theme} fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col shadow-2xl`}
            style={{ background: 'var(--motor-bg)' }}
          >
            {/* Header */}
            <div
              className="px-6 pt-12 pb-4"
              style={{ background: 'var(--motor-plan-rec-header-bg)', borderBottom: '1px solid var(--motor-border)' }}
            >
              <button
                onClick={close}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all"
                style={{ background: 'var(--motor-overlay-bg)', border: '1px solid var(--motor-border)', color: 'var(--motor-text-muted)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                  style={{ border: '2px solid var(--motor-border-strong)' }}
                >
                  <img
                    src={assetPath(helpPanelTab === 'chat' ? '/ai-assistant.png' : '/motor-expert.png')}
                    alt="Help"
                    className="w-10 h-10 object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-[18px] font-bold leading-tight" style={{ color: 'var(--motor-text)' }}>Expert Help</h2>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--motor-cta-bg)' }}>
                    {helpPanelTab === 'chat' ? 'Ask our AI anything, instantly' : 'Talk to a motor insurance specialist'}
                  </p>
                </div>
              </div>

              {/* Tab switcher */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--motor-overlay-bg)' }}>
                <button
                  onClick={() => switchTab('chat')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-medium transition-all"
                  style={helpPanelTab === 'chat'
                    ? { background: 'var(--motor-surface)', color: 'var(--motor-text)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                    : { color: 'var(--motor-text-subtle)' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Chat
                </button>
                <button
                  onClick={() => switchTab('talk')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-medium transition-all"
                  style={helpPanelTab === 'talk'
                    ? { background: 'var(--motor-surface)', color: 'var(--motor-text)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                    : { color: 'var(--motor-text-subtle)' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  Talk
                </button>
              </div>
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {helpPanelTab === 'chat' ? (
                /* ── CHAT TAB ── */
                <motion.div
                  key="chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 flex flex-col min-h-0"
                >
                  {/* Messages area */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 && (
                      <div>
                        <div className="flex gap-3 mb-6">
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            <img src={assetPath('/ai-assistant.png')} alt="AI" className="w-8 h-8 object-cover" />
                          </div>
                          <div
                            className="rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]"
                            style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}
                          >
                            <p className="text-sm" style={{ color: 'var(--motor-text)' }}>Hey there! I&apos;m your ACKO motor insurance assistant. Ask me anything — plans, coverage, claims, add-ons, or pricing. I&apos;m here to help you make the best choice for your vehicle.</p>
                          </div>
                        </div>
                        <p className="text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--motor-text-subtle)' }}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                          </svg>
                          Based on where you are in the journey
                        </p>
                        <div className="space-y-2">
                          {starters.map((s, i) => (
                            <button
                              key={i}
                              onClick={() => handleSend(s)}
                              className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                              style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)', color: 'var(--motor-text-muted)' }}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-3'}`}>
                        {msg.role === 'bot' && (
                          <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-1">
                            <img src={assetPath('/ai-assistant.png')} alt="AI" className="w-7 h-7 object-cover" />
                          </div>
                        )}
                        <div
                          className="max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-line"
                          style={msg.role === 'user'
                            ? { background: 'var(--motor-user-bubble-bg)', color: '#FFFFFF', borderRadius: '16px 4px 16px 16px' }
                            : { background: 'var(--motor-surface)', border: '1px solid var(--motor-border)', color: 'var(--motor-text)', borderRadius: '4px 16px 16px 16px' }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Switch to Talk nudge */}
                  <div className="px-6 pb-2">
                    <div
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                      style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}
                    >
                      <img src={assetPath('/motor-expert.png')} alt="Expert" className="w-7 h-7 rounded-full object-cover" />
                      <p className="text-[11px] flex-1" style={{ color: 'var(--motor-text-subtle)' }}>Need to talk to a real person?</p>
                      <button
                        onClick={() => switchTab('talk')}
                        className="text-[11px] font-semibold transition-colors"
                        style={{ color: 'var(--motor-cta-bg)' }}
                      >
                        Switch to Talk
                      </button>
                    </div>
                  </div>

                  {/* Chat input */}
                  <div
                    className="px-6 py-4"
                    style={{ background: 'var(--motor-glass-bg)', borderTop: '1px solid var(--motor-border)', backdropFilter: 'blur(24px)' }}
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend(input)}
                        placeholder="Ask about motor insurance..."
                        className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none placeholder:text-[var(--motor-input-placeholder)]"
                        style={{
                          background: 'var(--motor-input-bg)',
                          border: '1px solid var(--motor-input-border)',
                          color: 'var(--motor-input-text)',
                        }}
                      />
                      <button
                        onClick={() => handleSend(input)}
                        className="px-4 py-3 rounded-xl transition-colors active:scale-[0.97]"
                        style={{ background: 'var(--motor-cta-bg)', color: 'var(--motor-cta-text)' }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* ── TALK TAB ── */
                <motion.div
                  key="talk"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 overflow-y-auto"
                >
                  {callState !== 'idle' && selectedExpert ? (
                    /* ── Call Flow (connecting / connected) ── */
                    <motion.div
                      key="call-flow"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex-1 flex flex-col items-center justify-center px-6 py-10"
                    >
                      <AnimatePresence mode="wait">
                        {callState === 'connecting' ? (
                          <motion.div
                            key="connecting"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center text-center"
                          >
                            {/* Pulsing avatar with ring */}
                            <div className="relative mb-8">
                              <motion.div
                                className="absolute inset-[-12px] rounded-full"
                                style={{ border: '2px solid var(--motor-cta-bg)', opacity: 0.3 }}
                                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                              />
                              <motion.div
                                className="absolute inset-[-6px] rounded-full"
                                style={{ border: '2px solid var(--motor-cta-bg)', opacity: 0.5 }}
                                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                              />
                              <img
                                src={selectedExpert.img}
                                alt={selectedExpert.name}
                                className="w-24 h-24 rounded-full object-cover relative z-10"
                                style={{ border: '3px solid var(--motor-cta-bg)' }}
                              />
                            </div>

                            <p className="text-lg font-semibold mb-1" style={{ color: 'var(--motor-text)' }}>
                              Connecting to {selectedExpert.name}
                            </p>
                            <p className="text-sm mb-2" style={{ color: 'var(--motor-text-subtle)' }}>
                              {selectedExpert.role}
                            </p>

                            {/* Animated dots */}
                            <div className="flex gap-1.5 my-6">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="w-2 h-2 rounded-full"
                                  style={{ background: 'var(--motor-cta-bg)' }}
                                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                />
                              ))}
                            </div>

                            <button
                              onClick={() => { resetCallState(); setSelectedExpert(null); }}
                              className="mt-4 px-8 py-3 rounded-xl text-sm font-medium transition-colors"
                              style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)', color: 'var(--motor-text-muted)' }}
                            >
                              Cancel
                            </button>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="connected"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center text-center w-full"
                          >
                            {/* Expert avatar with green connected dot */}
                            <div className="relative mb-4">
                              <img
                                src={selectedExpert.img}
                                alt={selectedExpert.name}
                                className="w-20 h-20 rounded-full object-cover"
                                style={{ border: '3px solid var(--motor-cta-bg)' }}
                              />
                              <div
                                className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 z-10"
                                style={{ background: '#22c55e', borderColor: 'var(--motor-bg)' }}
                              />
                            </div>

                            <p className="text-base font-semibold" style={{ color: 'var(--motor-text)' }}>
                              {selectedExpert.name}
                            </p>
                            <p className="text-xs mb-1" style={{ color: 'var(--motor-text-subtle)' }}>
                              {selectedExpert.role}
                            </p>

                            {/* Call timer */}
                            <motion.p
                              className="text-2xl font-mono font-bold my-4"
                              style={{ color: 'var(--motor-cta-bg)' }}
                              animate={{ opacity: [1, 0.7, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              {formatCallTime(callTimer)}
                            </motion.p>

                            {/* Expert greeting speech bubble */}
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 }}
                              className="rounded-2xl px-5 py-4 max-w-[280px] mb-4 relative"
                              style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}
                            >
                              <div
                                className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
                                style={{ background: 'var(--motor-surface)', borderLeft: '1px solid var(--motor-border)', borderTop: '1px solid var(--motor-border)' }}
                              />
                              <p className="text-sm relative z-10" style={{ color: 'var(--motor-text)' }}>
                                &ldquo;Hi{userName ? ` ${userName}` : ''}, how can we help you today?&rdquo;
                              </p>
                            </motion.div>

                            {/* Audio waveform indicator */}
                            <AnimatePresence>
                              {isSpeaking && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="flex items-center gap-2 mb-6"
                                >
                                  <div className="flex items-end gap-[3px] h-5">
                                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                                      <motion.div
                                        key={i}
                                        className="w-[3px] rounded-full"
                                        style={{ background: 'var(--motor-cta-bg)' }}
                                        animate={{ height: ['4px', `${10 + Math.random() * 10}px`, '4px'] }}
                                        transition={{ duration: 0.4 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.07 }}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-[11px] font-medium" style={{ color: 'var(--motor-text-subtle)' }}>
                                    Speaking…
                                  </span>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Action buttons */}
                            <div className="flex gap-3 w-full max-w-[280px]">
                              <button
                                onClick={() => { resetCallState(); setSelectedExpert(null); }}
                                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors"
                                style={{ background: '#ef4444', color: '#fff' }}
                              >
                                End Call
                              </button>
                              <button
                                onClick={() => { resetCallState(); setSelectedExpert(null); switchTab('chat'); }}
                                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors"
                                style={{ background: 'var(--motor-cta-bg)', color: 'var(--motor-cta-text)' }}
                              >
                                Switch to Chat
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    <div className="p-6">
                      {/* Context concerns */}
                      <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--motor-text-subtle)' }}>What&apos;s on your mind?</h3>
                      <div className="space-y-2 mb-8">
                        {dynamicConcerns.map((concern, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedConcern(concern)}
                            className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                            style={{ background: selectedConcern === concern ? 'var(--motor-selected-bg)' : 'var(--motor-surface)', border: `1px solid ${selectedConcern === concern ? 'var(--motor-cta-bg)' : 'var(--motor-border)'}`, color: selectedConcern === concern ? 'var(--motor-cta-bg)' : 'var(--motor-text-muted)' }}
                          >
                            {concern}
                          </button>
                        ))}
                      </div>

                      {/* Expert profiles */}
                      <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--motor-text-subtle)' }}>Our Motor Experts</h3>
                      <div className="space-y-3">
                        {MOTOR_EXPERTS.map((expert, i) => (
                          <motion.div
                            key={expert.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="rounded-xl p-4 transition-colors cursor-pointer"
                            style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}
                            onClick={() => { setSelectedExpert(expert); setCallState('connecting'); }}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <img
                                src={expert.img}
                                alt={expert.name}
                                className="w-10 h-10 rounded-full object-cover"
                                style={{ border: '2px solid var(--motor-border-strong)' }}
                              />
                              <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--motor-text)' }}>{expert.name}</p>
                                <p className="text-xs" style={{ color: 'var(--motor-text-subtle)' }}>{expert.role}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mb-2 text-[11px]" style={{ color: 'var(--motor-text-subtle)' }}>
                              <span>{expert.helped}</span>
                              <span className="w-1 h-1 rounded-full" style={{ background: 'var(--motor-text-subtle)' }} />
                              <span>{expert.experience}</span>
                            </div>
                            <p className="text-sm" style={{ color: 'var(--motor-text-muted)' }}>{expert.description}</p>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {expert.speciality.map((s, j) => (
                                <span
                                  key={j}
                                  className="text-[11px] px-2 py-0.5 rounded-full"
                                  style={{ background: 'var(--motor-surface-2)', color: 'var(--motor-text-subtle)', border: '1px solid var(--motor-border)' }}
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Promise */}
                      <div className="mt-8 space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--motor-text-subtle)' }}>We&apos;re with you every step</h3>
                        {[
                          { icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z', title: 'Need help choosing a plan?', desc: 'We\'ll find the right coverage for your vehicle and budget' },
                          { icon: 'M8 17h.01M16 17h.01M3 11l1.5-5A2 2 0 016.4 4.5h11.2a2 2 0 011.9 1.5L21 11m-18 0h18v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z', title: 'Need to file a claim?', desc: 'We\'ll guide you through the entire process step by step' },
                          { icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z', title: 'Have a question?', desc: 'Our experts are available 24/7 to answer anything' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--motor-surface)' }}>
                            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ color: 'var(--motor-cta-bg)' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                            </svg>
                            <div>
                              <p className="text-sm font-medium" style={{ color: 'var(--motor-text)' }}>{item.title}</p>
                              <p className="text-[11px]" style={{ color: 'var(--motor-text-subtle)' }}>{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Legacy exports — kept for any remaining references ─── */
export function MotorExpertPanel() {
  return null;
}

export function MotorAIChatPanel() {
  return null;
}
