'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUserProfileStore } from '../lib/userProfileStore';
import { detectPostLoginState, buildPoliciesForState } from '../lib/mockUsers';
import type { PostLoginState } from '../lib/mockUsers';
import { readSessionCookie, writeSessionCookie, clearSessionCookie } from '../lib/sessionCookie';
import { useT } from '../lib/translations';

const VALID_OTP = '0000';
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

export type LoginIntent = 'insure_existing' | 'insure_new' | 'continue_quote' | 'insure_another';

interface LoginChatFlowProps {
  onSuccess: (intent?: LoginIntent) => void;
  onBack?: () => void;
  hideHeader?: boolean;
}

interface MockPolicy {
  id: string;
  make: string;
  model: string;
  regNumber: string;
  planType: string;
  validTill: string;
  imageUrl: string;
  lob?: 'car' | 'bike' | 'health' | 'life';
}

// Two vehicle policies (car + bike) — scenario 5
const MOCK_TWO_VEHICLES: MockPolicy[] = [
  {
    id: '1',
    make: 'Tata',
    model: 'Harrier',
    regNumber: 'KA01 AB 1234',
    planType: 'Zero depreciation plan',
    validTill: '31 Aug 2026',
    imageUrl: `${BASE}/car-images/harrier.png`,
    lob: 'car',
  },
  {
    id: '2',
    make: 'Royal Enfield',
    model: 'Classic 350',
    regNumber: 'KA05 AB 9876',
    planType: 'Comprehensive plan',
    validTill: '31 Aug 2026',
    imageUrl: `${BASE}/car-images/Nexon.png`,
    lob: 'bike',
  },
];

// One car policy — scenario 3 / base for policy+pwilo scenarios
const MOCK_ONE_POLICY: MockPolicy[] = [
  {
    id: '1',
    make: 'Tata',
    model: 'Harrier',
    regNumber: 'KA01 AB 1234',
    planType: 'Zero depreciation plan',
    validTill: '31 Aug 2026',
    imageUrl: `${BASE}/car-images/harrier.png`,
    lob: 'car',
  },
];

// Health + car policies — scenario 4
const MOCK_HEALTH_VEHICLE: MockPolicy[] = [
  {
    id: '1',
    make: 'Health',
    model: 'Family Floater',
    regNumber: '₹5L cover · 4 members',
    planType: 'Comprehensive health plan',
    validTill: '31 Aug 2026',
    imageUrl: `${BASE}/offerings/health-card.png`,
    lob: 'health',
  },
  {
    id: '2',
    make: 'Tata',
    model: 'Harrier',
    regNumber: 'KA01 AB 1234',
    planType: 'Zero depreciation plan',
    validTill: '31 Aug 2026',
    imageUrl: `${BASE}/car-images/harrier.png`,
    lob: 'car',
  },
];

// Pwilo mock data
type PwiloLob = 'car' | 'health' | 'life';

interface MockPwilo {
  lob: PwiloLob;
  title: string;
  subtitle: string;
  imageUrl: string;
}

const MOCK_PWILO_CAR: MockPwilo = {
  lob: 'car',
  title: 'Continue insuring your Tata Harrier',
  subtitle: 'KA01 AB 1234',
  imageUrl: `${BASE}/car-images/harrier.png`,
};

const MOCK_PWILO_HEALTH: MockPwilo = {
  lob: 'health',
  title: 'Continue your health plan',
  subtitle: 'Family floater · ₹5L cover',
  imageUrl: `${BASE}/offerings/health-card.png`,
};

const MOCK_PWILO_LIFE: MockPwilo = {
  lob: 'life',
  title: 'Continue your life cover',
  subtitle: 'Term plan · ₹1Cr cover',
  imageUrl: `${BASE}/offerings/life-card.png`,
};

function getPwilo(state: PostLoginState): MockPwilo | null {
  if (state.includes('pwilo_car')) return MOCK_PWILO_CAR;
  if (state.includes('pwilo_health')) return MOCK_PWILO_HEALTH;
  if (state.includes('pwilo_life')) return MOCK_PWILO_LIFE;
  return null;
}

function getPoliciesForState(state: PostLoginState): MockPolicy[] {
  if (state === 'two_policies_vehicles') return MOCK_TWO_VEHICLES;
  if (state === 'two_policies_health_vehicle') return MOCK_HEALTH_VEHICLE;
  if (state === 'one_policy' || state === 'one_policy_pwilo_car' || state === 'one_policy_pwilo_health' || state === 'one_policy_pwilo_life') return MOCK_ONE_POLICY;
  return [];
}

/* ── Bot bubble ── */
function BotBubble({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.215, 0.61, 0.355, 1] }}
      className="flex mb-4"
    >
      <div
        className="max-w-[85%] backdrop-blur-sm px-4 py-3 chat-bubble-bot text-body-md"
        style={{
          background: 'var(--motor-surface, var(--app-surface))',
          border: '1px solid var(--motor-border, var(--app-border))',
          color: 'var(--motor-text, var(--app-text))',
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}

/* ── User bubble ── */
function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.215, 0.61, 0.355, 1] }}
      className="flex justify-end mb-4"
    >
      <div
        className="max-w-[85%] px-4 py-2.5 chat-bubble-user shadow-lg text-body-md font-medium"
        style={{
          background: 'var(--app-user-bubble-bg, var(--motor-user-bubble-bg, #FFFFFF))',
          color: 'var(--app-user-bubble-text, var(--motor-user-bubble-text, #1C0B47))',
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}

/* ── Typing indicator ── */
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex mb-4"
    >
      <div
        className="backdrop-blur-sm px-4 py-3 chat-bubble-bot flex items-center gap-1.5"
        style={{
          background: 'var(--motor-surface, var(--app-surface))',
          border: '1px solid var(--motor-border, var(--app-border))',
        }}
      >
        <span className="w-2 h-2 bg-purple-400 rounded-full animate-typing" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-purple-400 rounded-full animate-typing" style={{ animationDelay: '200ms' }} />
        <span className="w-2 h-2 bg-purple-400 rounded-full animate-typing" style={{ animationDelay: '400ms' }} />
      </div>
    </motion.div>
  );
}

/* ── 4-digit OTP input ── */
function OtpInput({ onComplete, error }: { onComplete: (val: string) => void; error: boolean }) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const refs = [ref0, ref1, ref2, ref3];

  useEffect(() => { setTimeout(() => refs[0].current?.focus(), 100); }, []);

  const handleChange = (i: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 3) refs[i + 1].current?.focus();
    if (next.every(x => x !== '')) onComplete(next.join(''));
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs[i - 1].current?.focus();
  };

  return (
    <motion.div
      className="flex gap-2 justify-center mt-2"
      animate={error ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
    >
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          className="w-[60px] h-[52px] text-center text-[20px] font-semibold rounded-xl outline-none transition-all"
          style={{
            background: 'var(--motor-surface, var(--app-surface))',
            border: error ? '2px solid #ef4444' : d ? '2px solid var(--motor-cta-bg, #6D28D9)' : '1.5px solid var(--motor-border-strong, var(--app-border-strong))',
            color: 'var(--motor-text, var(--app-text))',
          }}
        />
      ))}
    </motion.div>
  );
}

/* ── Active policy card ── */
function PolicyCard({
  policy,
  delay,
  onFileClaim,
  onDownload,
}: {
  policy: MockPolicy;
  delay: number;
  onFileClaim: () => void;
  onDownload: () => void;
}) {
  const t = useT().login;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: [0.215, 0.61, 0.355, 1] }}
      className="relative overflow-hidden mb-3 shrink-0"
      style={{
        width: '100%',
        height: '172px',
        borderRadius: '24px',
        padding: '20px',
        background: 'var(--motor-surface, var(--app-surface))',
        boxShadow: '0 20px 20px -3px rgba(0,0,0,0.02), 0 6px 6px -2px rgba(0,0,0,0.02), 0 3.5px 3.5px -1.5px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)',
      }}
    >
      <div className="flex flex-col gap-1" style={{ width: '204px' }}>
        <p className="text-[18px] font-semibold leading-[22px]" style={{ color: 'var(--motor-text, var(--app-text))' }}>
          {policy.make} {policy.model}
        </p>
        <p className="text-[12px] leading-[16px]" style={{ color: 'var(--motor-text-muted, var(--app-text-muted))' }}>{policy.regNumber}</p>
        <p className="text-[12px] leading-[16px]" style={{ color: 'var(--motor-text-muted, var(--app-text-muted))' }}>{policy.planType}</p>
        <p className="text-[12px] leading-[16px]" style={{ color: 'var(--motor-text-muted, var(--app-text-muted))' }}>{t.chatValidTill(policy.validTill)}</p>
      </div>
      <div className="absolute top-0 right-0 w-[105px] h-[105px] pointer-events-none">
        <Image src={policy.imageUrl} alt={`${policy.make} ${policy.model}`} width={105} height={105} className="object-contain w-full h-full" />
      </div>
      <button
        onClick={onFileClaim}
        className="absolute text-[12px] font-medium leading-[16px] px-4 py-2 rounded-lg transition-all active:opacity-80"
        style={{ bottom: '20px', left: '20px', background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
      >
        File a claim
      </button>
      <button
        onClick={onDownload}
        className="absolute text-[12px] font-medium leading-[16px] px-4 py-2 rounded-lg transition-all active:opacity-80"
        style={{ bottom: '20px', left: '126px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--btn-secondary-border)', color: 'var(--btn-secondary-text)', boxShadow: 'var(--btn-secondary-shadow)' }}
      >
        Download policy
      </button>
    </motion.div>
  );
}

/* ── PWILO (mid-quote) card ── */
function PwiloCard({ delay, pwilo, onContinue }: { delay: number; pwilo: MockPwilo; onContinue: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: [0.215, 0.61, 0.355, 1] }}
      className="rounded-2xl overflow-hidden mb-3"
      style={{
        background: 'var(--motor-surface, var(--app-surface))',
        border: '1px solid var(--motor-border, var(--app-border))',
      }}
    >
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold leading-snug" style={{ color: 'var(--motor-text, var(--app-text))' }}>
            {pwilo.title}
          </p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--motor-text-muted, var(--app-text-muted))' }}>
            {pwilo.subtitle}
          </p>
        </div>
        <div className="shrink-0 w-[100px] h-[64px] flex items-center justify-center">
          <Image src={pwilo.imageUrl} alt={pwilo.title} width={100} height={64} className="object-contain w-full h-full" />
        </div>
      </div>
      <div className="px-4 pb-4">
        <button
          onClick={onContinue}
          className="px-5 py-2.5 rounded-xl text-[14px] font-semibold transition-all active:scale-[0.97]"
          style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
        >
          Continue at quote
        </button>
      </div>
    </motion.div>
  );
}

/* ── Vehicle type cards — 2-col grid with icon, used for any vehicle intent selection ── */
function VehicleCard({
  label,
  sub,
  icon,
  delay,
  onClick,
}: {
  label: string;
  sub: string;
  icon: React.ReactNode;
  delay: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25, ease: 'easeOut' }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="flex flex-col items-center gap-3 rounded-2xl p-5 text-center transition-all active:scale-[0.96]"
      style={{
        background: 'var(--motor-surface, var(--app-surface))',
        border: '1.5px solid var(--motor-border, var(--app-border))',
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--app-surface-2, var(--motor-surface-2, rgba(109,40,217,0.08)))' }}
      >
        {icon}
      </div>
      <span className="flex flex-col gap-0.5">
        <span className="text-[14px] font-semibold leading-[18px]" style={{ color: 'var(--motor-text, var(--app-text))' }}>
          {label}
        </span>
        <span className="text-[11px] leading-[14px]" style={{ color: 'var(--motor-text-muted, var(--app-text-muted))' }}>
          {sub}
        </span>
      </span>
    </motion.button>
  );
}

/* ── SVG icons for vehicle cards ── */
const RenewIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--app-accent, #6D28D9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const NewCarIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--app-accent, #6D28D9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
  </svg>
);

/* ── "Insure another car" section ── */
function InsureAnotherSection({ delay, onClick }: { delay: number; onClick: () => void }) {
  const t = useT().login;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="mt-1 mb-2 flex flex-col gap-3"
    >
      <BotBubble>{t.chatAnotherCar}</BotBubble>
      <button
        onClick={onClick}
        className="w-full h-[52px] rounded-2xl text-[15px] font-semibold transition-all active:scale-[0.97]"
        style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
      >
        {t.chatInsureAnother}
      </button>
    </motion.div>
  );
}

/* ── Main component ── */
export default function LoginChatFlow({ onSuccess, onBack, hideHeader }: LoginChatFlowProps) {
  const t = useT().login;
  const router = useRouter();
  const { setProfile, addPolicy } = useUserProfileStore();

  // 'returning'     — cookie found, show recognition prompt
  // 'q1'            — collect name (new user)
  // 'journey'       — show vehicle type chips after name
  // 'q2'            — collect phone (gated before plans)
  // 'q3'            — collect OTP
  // 'post_login'    — show results
  const [step, setStep] = useState<'returning' | 'q1' | 'journey' | 'q2' | 'q3' | 'post_login'>('q1');
  const [showTyping, setShowTyping] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpError, setOtpError] = useState(false);
  // true when we pre-populated the name from profile (skip the "What should we call you?" message)
  const [nameFromProfile, setNameFromProfile] = useState(false);
  const [nameEchoed, setNameEchoed] = useState(false);
  const [phoneEchoed, setPhoneEchoed] = useState(false);
  const [otpEchoed, setOtpEchoed] = useState(false);
  const [postLoginState, setPostLoginState] = useState<PostLoginState | null>(null);
  const [contentStep, setContentStep] = useState(0);
  // Stored when user taps a vehicle chip in 'journey' step — used to navigate after login
  const [pendingIntent, setPendingIntent] = useState<LoginIntent | null>(null);
  // Set when a valid session cookie is found on mount (name only — phone not stored)
  const [returningUser, setReturningUser] = useState<{ firstName: string } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Check for session cookie on mount; fall back to profile name if known
  useEffect(() => {
    const session = readSessionCookie();
    if (session) {
      setReturningUser(session);
      setName(session.firstName);
      setStep('returning');
    } else {
      const profileName = useUserProfileStore.getState().firstName;
      if (profileName && !useUserProfileStore.getState().isLoggedIn) {
        // Name already collected earlier in this session — skip the name question
        setName(profileName);
        setNameEchoed(true);
        setNameFromProfile(true);
        setStep('journey');
      }
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  }, [step, showTyping, nameEchoed, phoneEchoed, otpEchoed, contentStep]);

  // New user: name → journey (vehicle chips)
  const handleNameSubmit = () => {
    if (!name.trim()) return;
    // Store the name as a partial (pre-login) profile so the motor flow can greet the user by name
    setProfile({ firstName: name.trim(), isLoggedIn: false });
    setNameEchoed(true);
    setShowTyping(true);
    setTimeout(() => { setShowTyping(false); setStep('journey'); }, 900);
  };

  // Vehicle chip selected: navigate to motor journey immediately — phone+OTP gate happens
  // inside the motor flow, right before quotes are shown.
  const handleChipSelect = (intent: LoginIntent) => {
    onSuccess(intent);
  };

  // Phone → OTP
  const handlePhoneSubmit = () => {
    if (phone.replace(/\D/g, '').length < 10) return;
    setPhoneEchoed(true);
    setShowTyping(true);
    setTimeout(() => { setShowTyping(false); setStep('q3'); }, 900);
  };

  // Returning user taps "Yes, continue" — go to phone input (number not stored in cookie)
  const handleReturningContinue = () => {
    setShowTyping(true);
    setTimeout(() => { setShowTyping(false); setStep('q2'); }, 700);
  };

  // "Not me" — clear cookie and start fresh
  const handleNotMe = () => {
    clearSessionCookie();
    setReturningUser(null);
    setName('');
    setPhone('');
    setStep('q1');
  };

  const handleOtp = (val: string) => {
    if (val === VALID_OTP) {
      setOtpError(false);
      const state = detectPostLoginState(phone);
      setProfile({ firstName: name.trim(), phone: `+91${phone}`, isLoggedIn: true, policies: [] });
      buildPoliciesForState(state).forEach(p => addPolicy(p));
      writeSessionCookie({ firstName: name.trim() });

      setOtpEchoed(true);
      setPostLoginState(state);
      setShowTyping(true);

      // New user who tapped a vehicle chip: navigate to plan page after brief delay
      if (pendingIntent && (state === 'new_user' || state.startsWith('new_user_pwilo'))) {
        setTimeout(() => {
          setShowTyping(false);
          onSuccess(pendingIntent);
        }, 900);
        return;
      }

      // Returning customer or new user without a selected intent: show post_login cascade
      setTimeout(() => {
        setShowTyping(false);
        setStep('post_login');
        setContentStep(1);
        setTimeout(() => {
          setShowTyping(true);
          setTimeout(() => {
            setShowTyping(false);
            setContentStep(2);
            setTimeout(() => {
              setContentStep(3);
              if (state !== 'new_user') {
                setTimeout(() => setContentStep(4), 600);
              }
            }, 350);
          }, 750);
        }, 500);
      }, 900);
    } else {
      setOtpError(true);
      setTimeout(() => setOtpError(false), 600);
    }
  };

  const nameCanSubmit = name.trim().length > 0;

  const isNewUser = postLoginState === 'new_user' || postLoginState?.startsWith('new_user_pwilo');
  const welcomeMsg = isNewUser
    ? t.chatWelcomeNew(name.split(' ')[0])
    : t.chatWelcomeReturning(name.split(' ')[0]);

  const contextMsg = (() => {
    if (!postLoginState) return t.chatInsureToday;
    if (postLoginState === 'new_user') return t.chatInsureToday;
    if (postLoginState.startsWith('new_user_pwilo')) return t.chatFoundQuote;
    if (postLoginState === 'one_policy') return t.chatFoundPolicy;
    if (postLoginState === 'two_policies_health_vehicle' || postLoginState === 'two_policies_vehicles') return t.chatFound2Policies;
    if (postLoginState.startsWith('one_policy_pwilo')) return t.chatFoundPolicyAndQuote;
    return t.chatInsureToday;
  })();

  const phoneCanSubmit = phone.replace(/\D/g, '').length === 10;

  return (
    <div className="flex flex-col h-full">
      {!hideHeader && (
        <div
          className="flex items-center justify-between px-4 h-[56px] shrink-0"
          style={{ borderBottom: '1px solid var(--motor-border, var(--app-border))', background: 'var(--motor-bg, var(--app-bg))' }}
        >
          <button
            onClick={onBack || (() => router.push('/'))}
            className="w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ color: 'var(--motor-text, var(--app-text))' }}
            aria-label="Back"
          >
            <svg width="10" height="18" viewBox="0 0 10 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 1L1 9l8 8" />
            </svg>
          </button>
          <div className="w-9" />
        </div>
      )}

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-6 pb-6" style={{ background: 'var(--app-bg)' }}>

        {/* ── Returning user path ── */}
        {returningUser ? (
          <>
            <BotBubble>
              {t.chatReturningGreet(returningUser.firstName.split(' ')[0])}
            </BotBubble>
            <BotBubble>
              {t.chatReturningConfirm(returningUser.firstName.split(' ')[0])}
            </BotBubble>

            <AnimatePresence>
              {(step === 'q2' || step === 'q3' || step === 'post_login') && (
                <BotBubble>
                  {t.chatVerifyMobile}
                </BotBubble>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {phoneEchoed && <UserBubble>+91 {phone}</UserBubble>}
            </AnimatePresence>

            <AnimatePresence>
              {(step === 'q3' || step === 'post_login') && (
                <BotBubble>
                  {t.chatOtpSent(phone)}
                </BotBubble>
              )}
            </AnimatePresence>
          </>
        ) : (
          <>
            {/* ── New user path ── */}
            {nameFromProfile ? (
              // Name already known — greet without asking again
              <BotBubble>{t.chatNiceToMeet(name.split(' ')[0])}</BotBubble>
            ) : (
              <>
                <BotBubble>{t.chatGreet}</BotBubble>
                <AnimatePresence>
                  {nameEchoed && <UserBubble>{name}</UserBubble>}
                </AnimatePresence>
                <AnimatePresence>
                  {(step === 'journey' || step === 'q2' || step === 'q3' || step === 'post_login') && (
                    <BotBubble>{t.chatNiceToMeet(name.split(' ')[0])}</BotBubble>
                  )}
                </AnimatePresence>
              </>
            )}

            <AnimatePresence>
              {phoneEchoed && <UserBubble>+91 {phone}</UserBubble>}
            </AnimatePresence>

            <AnimatePresence>
              {(step === 'q3' || step === 'post_login') && (
                <BotBubble>{t.chatOtpSent(phone)}</BotBubble>
              )}
            </AnimatePresence>
          </>
        )}

        {/* ── OTP input (both paths) ── */}
        <AnimatePresence>
          {step === 'q3' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-2 mb-4"
            >
              <OtpInput onComplete={handleOtp} error={otpError} />
              {otpError ? (
                <p className="text-[12px] text-center" style={{ color: '#ef4444' }}>
                  {t.chatOtpIncorrect('0000')}
                </p>
              ) : (
                <p className="text-[12px] text-center" style={{ color: 'var(--motor-text-muted, var(--app-text-muted))' }}>
                  {t.chatEnterCode('0000')}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {otpEchoed && <UserBubble>{t.chatOtpVerified}</UserBubble>}
        </AnimatePresence>

        {/* ── Post-login cascade ── */}
        <AnimatePresence>
          {contentStep >= 1 && <BotBubble>{welcomeMsg}</BotBubble>}
        </AnimatePresence>

        <AnimatePresence>
          {contentStep >= 2 && <BotBubble>{contextMsg}</BotBubble>}
        </AnimatePresence>

        <AnimatePresence>
          {contentStep >= 3 && postLoginState && getPoliciesForState(postLoginState).length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {getPoliciesForState(postLoginState).map((policy, i) => (
                <PolicyCard
                  key={policy.id}
                  policy={policy}
                  delay={i * 0.12}
                  onFileClaim={() => onSuccess('insure_another')}
                  onDownload={() => onSuccess('insure_another')}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {contentStep >= 3 && postLoginState && getPwilo(postLoginState) && (
            <PwiloCard
              delay={0}
              pwilo={getPwilo(postLoginState)!}
              onContinue={() => onSuccess('continue_quote')}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {contentStep >= 4 && postLoginState && postLoginState !== 'new_user' && (
            <InsureAnotherSection delay={0} onClick={() => onSuccess('insure_another')} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTyping && <TypingIndicator />}
        </AnimatePresence>

        <div className="h-2" />
      </div>

      {/* ── Bottom input bar ── */}
      <AnimatePresence mode="wait">

        {/* Returning user: Continue / Not me */}
        {step === 'returning' && returningUser && (
          <motion.div
            key="returning-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="shrink-0 px-4 pb-8 pt-3 flex flex-col gap-2"
            style={{ borderTop: '1px solid var(--motor-border, var(--app-border))' }}
          >
            <button
              onClick={handleReturningContinue}
              className="w-full h-[52px] rounded-2xl text-[15px] font-semibold transition-colors active:scale-[0.97]"
              style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
            >
              {t.continueAs(returningUser.firstName.split(' ')[0])}
            </button>
            <button
              onClick={handleNotMe}
              className="w-full h-[44px] rounded-2xl text-[14px] font-medium transition-colors active:scale-[0.97]"
              style={{ color: 'var(--motor-text-muted, var(--app-text-muted))' }}
            >
              {t.notMe}
            </button>
          </motion.div>
        )}

        {/* New user: name input */}
        {step === 'q1' && !nameEchoed && (
          <motion.div
            key="input-name"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="shrink-0 px-4 pb-8 pt-3 space-y-2"
            style={{ borderTop: '1px solid var(--motor-border, var(--app-border))' }}
          >
            <input
              autoFocus
              type="text"
              placeholder={t.chatNamePlaceholder}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && nameCanSubmit && handleNameSubmit()}
              className="w-full h-[52px] rounded-2xl px-4 text-[15px] outline-none"
              style={{
                background: 'var(--motor-surface, var(--app-surface))',
                border: '1.5px solid var(--motor-border-strong, var(--app-border-strong))',
                color: 'var(--motor-text, var(--app-text))',
              }}
            />
            <button
              onClick={handleNameSubmit}
              disabled={!nameCanSubmit}
              className="w-full h-[52px] rounded-2xl text-[15px] font-semibold transition-colors active:scale-[0.97] disabled:opacity-40"
              style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
            >
              Continue
            </button>
          </motion.div>
        )}

        {/* Journey: vehicle type cards — 2-col grid */}
        {step === 'journey' && (
          <motion.div
            key="journey-chips"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="shrink-0 px-4 pb-8 pt-3"
            style={{ borderTop: '1px solid var(--motor-border, var(--app-border))' }}
          >
            <div className="grid grid-cols-2 gap-3">
              <VehicleCard
                label={t.chatRenewLabel}
                sub={t.chatRenewSub}
                icon={<RenewIcon />}
                delay={0.05}
                onClick={() => handleChipSelect('insure_existing')}
              />
              <VehicleCard
                label={t.chatInsureNewLabel}
                sub={t.chatInsureNewSub}
                icon={<NewCarIcon />}
                delay={0.12}
                onClick={() => handleChipSelect('insure_new')}
              />
            </div>
          </motion.div>
        )}

        {/* Phone input — shown for returning users at q2 step */}
        {step === 'q2' && !phoneEchoed && (
          <motion.div
            key="input-phone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="shrink-0 px-4 pb-8 pt-3 space-y-2"
            style={{ borderTop: '1px solid var(--motor-border, var(--app-border))' }}
          >
            <div
              className="w-full h-[52px] rounded-2xl flex items-center overflow-hidden"
              style={{
                border: '1.5px solid var(--motor-border-strong, var(--app-border-strong))',
                background: 'var(--motor-surface, var(--app-surface))',
              }}
            >
              <span className="pl-4 pr-2 text-[15px] font-medium shrink-0" style={{ color: 'var(--motor-text-muted, var(--app-text-muted))' }}>+91</span>
              <div className="w-px h-5 shrink-0" style={{ background: 'var(--motor-border-strong, var(--app-border-strong))' }} />
              <input
                autoFocus
                type="tel"
                inputMode="numeric"
                placeholder={t.chatMobilePlaceholder}
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onKeyDown={e => e.key === 'Enter' && phoneCanSubmit && handlePhoneSubmit()}
                className="flex-1 h-full px-3 text-[15px] outline-none bg-transparent"
                style={{ color: 'var(--motor-text, var(--app-text))' }}
              />
            </div>
            <button
              onClick={handlePhoneSubmit}
              disabled={!phoneCanSubmit}
              className="w-full h-[52px] rounded-2xl text-[15px] font-semibold transition-colors active:scale-[0.97] disabled:opacity-40"
              style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
            >
              {t.chatSendOtp}
            </button>
          </motion.div>
        )}

        {/* Post-login cards for new_user who arrived via returning path (no pendingIntent) */}
        {step === 'post_login' && contentStep >= 3 && postLoginState && (postLoginState === 'new_user' || postLoginState.startsWith('new_user_pwilo')) && (
          <motion.div
            key="post-lob-chips"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="shrink-0 px-4 pb-8 pt-3"
            style={{ borderTop: '1px solid var(--motor-border, var(--app-border))' }}
          >
            <div className="grid grid-cols-2 gap-3">
              <VehicleCard
                label={t.chatRenewLabel}
                sub={t.chatRenewSub}
                icon={<RenewIcon />}
                delay={0.05}
                onClick={() => onSuccess('insure_existing')}
              />
              <VehicleCard
                label={t.chatInsureNewLabel}
                sub={t.chatInsureNewSub}
                icon={<NewCarIcon />}
                delay={0.12}
                onClick={() => onSuccess('insure_new')}
              />
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
