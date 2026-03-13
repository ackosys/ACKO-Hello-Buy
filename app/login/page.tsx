'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AckoLogo from '../../components/AckoLogo';
import { useUserProfileStore } from '../../lib/userProfileStore';
import { detectPostLoginState, buildPoliciesForState } from '../../lib/mockUsers';
import { readSessionCookie, writeSessionCookie, clearSessionCookie } from '../../lib/sessionCookie';
import { useThemeStore } from '../../lib/themeStore';
import { useT } from '../../lib/translations';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
const VALID_OTP = '0000';

/* ── Back chevron ── */
function BackChevron() {
  return (
    <svg width="10" height="18" viewBox="0 0 10 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1L1 9l8 8" />
    </svg>
  );
}

/* ── Lightbulb icon ── */
function LightbulbIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6D28D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21h6M12 3a6 6 0 0 1 6 6c0 2.22-1.21 4.16-3 5.2V17a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1v-2.8C7.21 13.16 6 11.22 6 9a6 6 0 0 1 6-6z" />
    </svg>
  );
}

/* ── Success badge ── */
function SuccessBadge() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="flex items-center justify-center"
    >
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="54" fill="#f0f0f0" stroke="#e0e0e0" strokeWidth="2" />
        <circle cx="60" cy="60" r="42" fill="#f8f8f8" />
        <motion.path
          d="M38 60l15 15 29-29"
          stroke="#22c55e"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
      </svg>
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

  useEffect(() => { refs[0].current?.focus(); }, []);

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
      className="flex gap-3 justify-center"
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
          className="w-[72px] h-[56px] text-center text-[22px] font-semibold rounded-xl outline-none transition-all"
          style={{
            background: 'var(--app-surface)',
            border: error ? '2px solid #ef4444' : d ? '2px solid #6D28D9' : '1.5px solid var(--app-border-strong)',
            color: 'var(--app-text)',
          }}
        />
      ))}
    </motion.div>
  );
}

/* ── Logo animation ── */
function LogoAnimation() {
  return (
    <div className="w-[84px] h-[84px]">
      <video
        src={`${BASE}/offerings/logo-animation.webm`}
        autoPlay
        loop
        muted
        playsInline
        style={{ width: 84, height: 84, objectFit: 'contain' }}
      />
    </div>
  );
}

/* ── Main login form content ── */
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRoute = searchParams.get('next') || '/';
  const { setProfile, addPolicy, isLoggedIn } = useUserProfileStore();
  const { theme } = useThemeStore();
  const t = useT();
  const isLight = theme === 'light';

  // step 0 = phone (new) | returning recognition
  // step 1 = OTP
  // step 2 = name (new user only)
  // step 3 = welcome
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpError, setOtpError] = useState(false);
  // Cookie stores name only — phone is always re-entered for security
  const [returningUser, setReturningUser] = useState<{ firstName: string } | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) router.replace(nextRoute);
  }, [isLoggedIn, router, nextRoute]);

  // Check session cookie on mount
  useEffect(() => {
    const session = readSessionCookie();
    if (session) {
      setReturningUser(session);
      setName(session.firstName);
    }
  }, []);

  const handleOtp = (val: string) => {
    if (val === VALID_OTP) {
      setOtpError(false);
      const state = detectPostLoginState(phone);
      if (returningUser) {
        // Returning user: name already known from cookie, skip name step → welcome
        setProfile({ firstName: name.trim(), phone: `+91${phone}`, isLoggedIn: true, policies: [] });
        buildPoliciesForState(state).forEach(p => addPolicy(p));
        writeSessionCookie({ firstName: name.trim() });
        setStep(3);
        setTimeout(() => router.replace(nextRoute), 1200);
      } else {
        // New user: collect name next
        setStep(2);
      }
    } else {
      setOtpError(true);
      setTimeout(() => setOtpError(false), 600);
    }
  };

  const handleNameSubmit = () => {
    if (!name.trim()) return;
    const state = detectPostLoginState(phone);
    setProfile({ firstName: name.trim(), phone: `+91${phone}`, isLoggedIn: true, policies: [] });
    buildPoliciesForState(state).forEach(p => addPolicy(p));
    writeSessionCookie({ firstName: name.trim() });
    setStep(3);
    setTimeout(() => router.replace(nextRoute), 1200);
  };

  const handleNotMe = () => {
    clearSessionCookie();
    setReturningUser(null);
    setName('');
    setPhone('');
    setStep(0);
  };

  // canContinue drives the Continue button visibility
  const canContinue =
    step === 0 && !returningUser ? phone.replace(/\D/g, '').length === 10 :
    step === 0 && returningUser ? false : // returning recognition screen uses its own buttons
    step === 2 ? name.trim().length > 0 :
    false;

  const stepVariants = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -24 },
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--app-bg)' }}>
      <div className="max-w-[430px] mx-auto flex flex-col min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 h-[60px]">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-xl"
            style={{ color: 'var(--app-text)' }}
            aria-label="Back"
          >
            <BackChevron />
          </button>
          <AckoLogo variant={isLight ? 'color' : 'white'} className="h-[20px]" />
          <div className="w-10" />
        </div>

        {/* Step content */}
        <div className="flex-1 flex flex-col px-5 pt-12">
          <AnimatePresence mode="wait">

            {/* ── Returning user recognition ── */}
            {step === 0 && returningUser && (
              <motion.div key="returning" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="flex flex-col items-center gap-6">
                <LogoAnimation />
                <div className="text-center space-y-1">
                  <h1 className="text-[22px] font-semibold leading-[30px] tracking-[-0.2px] whitespace-pre-line" style={{ color: 'var(--app-text)' }}>
                    {t.login.welcomeBack(returningUser.firstName.split(' ')[0])}
                  </h1>
                  <p className="text-[15px] leading-[22px]" style={{ color: 'var(--app-text-muted)' }}>
                    {t.login.welcomeBackSub}
                  </p>
                </div>
                <div className="w-full flex flex-col gap-3">
                  <button
                    onClick={() => {
                      // Keep name, clear recognition screen → show phone input
                      setReturningUser(prev => prev ? { ...prev } : null);
                      setStep(1);
                    }}
                    className="w-full h-[52px] rounded-2xl text-[16px] font-semibold"
                    style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
                  >
                    {t.login.continueAs(returningUser.firstName.split(' ')[0])}
                  </button>
                  <button
                    onClick={handleNotMe}
                    className="w-full h-[44px] rounded-xl text-[14px] font-medium"
                    style={{ color: 'var(--app-text-muted)' }}
                  >
                    {t.login.notMe}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 0: Phone (new user) ── */}
            {step === 0 && !returningUser && (
              <motion.div key="step0" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="flex flex-col items-center gap-6">
                <LogoAnimation />
                <h1 className="text-[22px] font-semibold text-center leading-[30px] tracking-[-0.2px] whitespace-pre-line" style={{ color: 'var(--app-text)' }}>
                  {t.login.mobileTitle}
                </h1>
                <div
                  className="w-full h-[52px] rounded-xl flex items-center overflow-hidden"
                  style={{ border: '1.5px solid var(--app-border-strong)', background: 'var(--app-surface)' }}
                >
                  <span className="pl-4 pr-2 text-[16px] font-medium shrink-0" style={{ color: 'var(--app-text-muted)' }}>+91</span>
                  <div className="w-px h-6 shrink-0" style={{ background: 'var(--app-border-strong)' }} />
                  <input
                    autoFocus
                    type="tel"
                    inputMode="numeric"
                    placeholder={t.login.mobilePlaceholder}
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyDown={e => e.key === 'Enter' && canContinue && setStep(1)}
                    className="flex-1 h-full px-3 text-[16px] outline-none bg-transparent"
                    style={{ color: 'var(--app-text)' }}
                  />
                </div>
                <div
                  className="w-full flex items-start gap-2 px-4 py-3 rounded-xl"
                  style={{ background: isLight ? 'rgba(109,40,217,0.06)' : 'rgba(172,147,255,0.1)' }}
                >
                  <LightbulbIcon />
                  <p className="text-[13px] leading-[18px]" style={{ color: 'var(--app-text-muted)' }}>
                    {t.login.mobileHint}
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Step 1: OTP ── */}
            {step === 1 && (
              <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="flex flex-col items-center gap-6">
                <LogoAnimation />
                <h1 className="text-[22px] font-semibold text-center leading-[30px] tracking-[-0.2px] whitespace-pre-line" style={{ color: 'var(--app-text)' }}>
                  {t.login.otpTitle(phone)}
                </h1>
                <OtpInput onComplete={handleOtp} error={otpError} />
                {otpError && (
                  <p className="text-[13px] text-center" style={{ color: '#ef4444' }}>
                    {t.login.otpError}
                  </p>
                )}
              </motion.div>
            )}

            {/* ── Step 2: Name (new user only) ── */}
            {step === 2 && (
              <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="flex flex-col items-center gap-6">
                <LogoAnimation />
                <h1 className="text-[22px] font-semibold text-center leading-[30px] tracking-[-0.2px] whitespace-pre-line" style={{ color: 'var(--app-text)' }}>
                  {t.login.nameTitle}
                </h1>
                <input
                  autoFocus
                  type="text"
                  placeholder={t.login.namePlaceholder}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && name.trim() && handleNameSubmit()}
                  className="w-full h-[52px] rounded-xl px-4 text-[16px] outline-none"
                  style={{
                    background: 'var(--app-surface)',
                    border: '1.5px solid var(--app-border-strong)',
                    color: 'var(--app-text)',
                  }}
                />
              </motion.div>
            )}

            {/* ── Step 3: Welcome ── */}
            {step === 3 && (
              <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="flex flex-col items-center gap-6">
                <SuccessBadge />
                <p className="text-[18px] font-semibold" style={{ color: 'var(--app-text)' }}>
                  {t.login.welcomeSuccess(name)}
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Continue button */}
        <AnimatePresence>
          {canContinue && (
            <motion.div
              key={`cta-step-${step}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.25, ease: [0.215, 0.61, 0.355, 1] }}
              className="px-5 pb-10 pt-4"
            >
              <button
                onClick={step === 0 ? () => setStep(1) : handleNameSubmit}
                className="w-full h-[52px] rounded-2xl text-[16px] font-semibold"
                style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
              >
              {t.login.continueBtn}
            </button>
            </motion.div>
          )}
        </AnimatePresence>

        {step === 1 && (
          <div className="px-5 pb-10 pt-4">
            <p className="text-center text-[13px]" style={{ color: 'var(--app-text-muted)' }}>
              {t.login.otpHint}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: 'var(--app-bg)' }} />}>
      <LoginContent />
    </Suspense>
  );
}
