'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT } from '../../lib/translations';

type EkycStep =
  | 'intro'
  | 'aadhaar_input'
  | 'sending_otp'
  | 'otp_input'
  | 'verifying'
  | 'success';

export interface EkycMessage {
  id: string;
  type: 'bot' | 'user';
  content: string | React.ReactNode;
  timestamp: Date;
}

const MAX_OTP_ATTEMPTS = 3;
const DEMO_OTP = '123456';
const OTP_EXPIRY_SECONDS = 60;

export interface EkycFlowState {
  step: EkycStep;
  messages: EkycMessage[];
  aadhaar: string;
  otp: string;
  otpAttempts: number;
  otpExpired: boolean;
  timerSeconds: number;
}

function formatAadhaar(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 12);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

interface UseEkycFlowOptions {
  skipIntro?: boolean;
}

export interface UseEkycFlowReturn {
  state: EkycFlowState;
  actions: {
    setAadhaar: (value: string) => void;
    setOtp: (value: string) => void;
    handleAadhaarSubmit: () => void;
    handleOtpSubmit: () => void;
    handleResendOtp: () => void;
  };
}

export function useEkycFlow(onComplete: () => void, options?: UseEkycFlowOptions): UseEkycFlowReturn {
  const ek = useT().ekycFlow;
  const skipIntro = options?.skipIntro ?? false;
  const [step, setStep] = useState<EkycStep>(skipIntro ? 'aadhaar_input' : 'intro');
  const [messages, setMessages] = useState<EkycMessage[]>([]);
  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpExpired, setOtpExpired] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(OTP_EXPIRY_SECONDS);

  const addBotMessage = useCallback((content: string | React.ReactNode) => {
    const newMessage: EkycMessage = {
      id: `ekyc-bot-${Date.now()}-${Math.random()}`,
      type: 'bot',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  const addUserMessage = useCallback((content: string) => {
    const newMessage: EkycMessage = {
      id: `ekyc-user-${Date.now()}-${Math.random()}`,
      type: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  // Intro messages (only when NOT embedded in Life journey)
  useEffect(() => {
    if (skipIntro) {
      addBotMessage(
        <EkycStepsCard />
      );
      return;
    }

    let mounted = true;
    const addMessages = async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      if (!mounted) return;
      addBotMessage(ek.paymentReceived('₹1.0 Cr'));

      await new Promise(resolve => setTimeout(resolve, 700));
      if (!mounted) return;
      addBotMessage(ek.kycIntroStep1);

      await new Promise(resolve => setTimeout(resolve, 700));
      if (!mounted) return;
      addBotMessage(ek.kycIntroStep2);

      await new Promise(resolve => setTimeout(resolve, 700));
      if (!mounted) return;
      addBotMessage(<EkycStepsCard />);
      if (!mounted) return;
      setStep('aadhaar_input');
    };

    addMessages();
    return () => { mounted = false; };
  }, []);

  // OTP Timer
  useEffect(() => {
    if (step === 'otp_input' && !otpExpired && timerSeconds > 0) {
      const timer = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setOtpExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, otpExpired, timerSeconds]);

  const validateAadhaar = (value: string): string => {
    const digits = value.replace(/\s/g, '');
    if (digits.length < 12) return 'Please enter a valid 12-digit Aadhaar number';
    if (/^0/.test(digits)) return 'Aadhaar number cannot start with 0';
    if (/^1/.test(digits)) return 'Aadhaar number cannot start with 1';
    return '';
  };

  const handleAadhaarSubmit = () => {
    const error = validateAadhaar(aadhaar);
    if (error) {
      addBotMessage(`❌ ${error}`);
      return;
    }

    addUserMessage(aadhaar);
    setStep('sending_otp');

    setTimeout(() => {
      addBotMessage(ek.sendingOtp);
    }, 300);

    setTimeout(() => {
      const maskedMobile = 'XXXX XXXX I 32';
      addBotMessage(ek.otpSentToMobile(maskedMobile));
      setStep('otp_input');
      setTimerSeconds(OTP_EXPIRY_SECONDS);
      setOtpExpired(false);
    }, 2000);
  };

  const handleOtpSubmit = () => {
    const digits = otp.replace(/\D/g, '');

    if (digits.length < 6) {
      addBotMessage(ek.otpIncompleteError);
      return;
    }

    if (otpExpired) {
      addBotMessage(ek.otpExpiredError);
      return;
    }

    addUserMessage(otp.replace(/(\d{1})(\d{1})(\d{1})(\d{1})(\d{1})(\d{1})/, '• • • • • •'));
    setStep('verifying');

    setTimeout(() => {
      addBotMessage(ek.verifyingOtp);
    }, 300);

    setTimeout(() => {
      if (digits === DEMO_OTP) {
        const maskedMobile = 'XXXX XXXX I 32';
        addBotMessage(
          <div className="space-y-4">
            <div className="flex flex-col items-center py-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--color-success-subtle)' }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={{ color: 'var(--color-success-text)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{ek.identityVerified}</h3>
              <p className="text-sm" style={{ color: 'var(--color-primary-active)', opacity: 0.7 }}>{ek.kycCompleted}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'var(--color-success-subtle)', borderColor: 'var(--color-success-border)', borderWidth: 1, borderStyle: 'solid' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-success-subtle)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ color: 'var(--color-success-text)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm mb-0.5">{ek.aadhaarKycComplete}</p>
                  <p className="text-xs" style={{ color: 'var(--color-success-text)', opacity: 0.7 }}>{ek.linkedTo(maskedMobile)}</p>
                </div>
              </div>
            </div>
            <p className="text-center text-sm" style={{ color: 'var(--color-primary-active)', opacity: 0.6 }}>{ek.proceedingNextStep}</p>
          </div>
        );
        setStep('success');
        setTimeout(() => onComplete(), 3000);
      } else {
        const newAttempts = otpAttempts + 1;
        setOtpAttempts(newAttempts);

        if (newAttempts >= MAX_OTP_ATTEMPTS) {
          addBotMessage(ek.otpMaxAttemptsError);
        } else {
          addBotMessage(ek.otpIncorrect(MAX_OTP_ATTEMPTS - newAttempts));
          setOtp('');
          setStep('otp_input');
        }
      }
    }, 2000);
  };

  const handleResendOtp = () => {
    addBotMessage(ek.resendingOtp);
    setOtp('');
    setOtpExpired(false);
    setTimerSeconds(OTP_EXPIRY_SECONDS);
    setTimeout(() => {
      addBotMessage(ek.newOtpSent('XXXX XXXX I 32'));
    }, 1500);
  };

  return {
    state: { step, messages, aadhaar, otp, otpAttempts, otpExpired, timerSeconds },
    actions: { setAadhaar, setOtp, handleAadhaarSubmit, handleOtpSubmit, handleResendOtp },
  };
}


/* ──────────────────────────────────────────────
   Shared: e-KYC steps info card (used inline)
   ────────────────────────────────────────────── */
function EkycStepsCard() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-primary-subtle)' }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ color: 'var(--color-primary-active)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm mb-1">e-KYC Verification</h3>
          <p className="text-xs" style={{ color: 'var(--color-primary-active)', opacity: 0.7 }}>Aadhaar-based identity verification</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {[
          'Enter your 12-digit Aadhaar number',
          'OTP sent to your Aadhaar-linked mobile',
          'Verified instantly – takes under 2 minutes',
        ].map((text, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-xs font-semibold text-white">{i + 1}</div>
            <p className="text-white/90 text-sm pt-0.5">{text}</p>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2 bg-white/5 rounded-xl px-3 py-2.5 border border-white/10">
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ color: 'var(--color-primary-active)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <p className="text-xs text-white/60 leading-relaxed">
          Your Aadhaar data is encrypted and transmitted securely to UIDAI. ACKO does not store your Aadhaar number.
        </p>
      </div>
    </div>
  );
}


/* ──────────────────────────────────────────────
   Inline message renderer (for embedding in a
   parent chat container like LifeChatContainer)
   ────────────────────────────────────────────── */
export function EkycInlineMessages({ messages }: { messages: EkycMessage[] }) {
  return (
    <>
      {messages.map((message) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`mb-4 ${message.type === 'user' ? 'flex justify-end' : 'flex items-start gap-3'}`}
        >
          {message.type === 'bot' && (
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-1">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
          )}
          <div
            className={`rounded-2xl px-4 py-3 ${
              message.type === 'user'
                ? 'bg-white text-gray-900 max-w-[75%]'
                : 'bg-white/10 backdrop-blur-sm border border-white/10 text-white flex-1'
            }`}
          >
            {typeof message.content === 'string' ? (
              <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
            ) : (
              message.content
            )}
          </div>
        </motion.div>
      ))}
    </>
  );
}


/* ──────────────────────────────────────────────
   Bottom input widget (for embedding at bottom
   of parent chat container)
   ────────────────────────────────────────────── */
export function EkycInputWidget({ state, actions }: UseEkycFlowReturn) {
  const maskedMobile = 'XXXX XXXX I 32';

  if (state.step === 'aadhaar_input') {
    return (
      <div className="space-y-3">
        <div className="text-center mb-2">
          <p className="text-xs" style={{ color: 'var(--color-primary-active)', opacity: 0.7 }}>Enter your 12-digit Aadhaar number</p>
        </div>
        <input
          type="tel"
          inputMode="numeric"
          value={state.aadhaar}
          onChange={(e) => actions.setAadhaar(formatAadhaar(e.target.value))}
          onKeyDown={(e) => e.key === 'Enter' && actions.handleAadhaarSubmit()}
          placeholder="1234 5678 9012"
          className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:bg-white/15 transition-colors focus:border-[var(--color-primary)]"
          autoFocus
        />
        <button
          onClick={actions.handleAadhaarSubmit}
          disabled={state.aadhaar.replace(/\s/g, '').length !== 12}
          className="w-full py-3.5 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          style={{ background: 'var(--btn-primary-bg)' }}
        >
          Start e-KYC
        </button>
        <EkycFooterLinks />
      </div>
    );
  }

  if (state.step === 'otp_input') {
    return (
      <div className="space-y-3">
        <div className="text-center mb-3">
          <p className="text-xs mb-2" style={{ color: 'var(--color-primary-active)', opacity: 0.7 }}>OTP sent to {maskedMobile}</p>
          {!state.otpExpired && (
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: 'var(--color-primary)' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-primary-active)' }}>{state.timerSeconds}</span>
              </div>
              <span className="text-xs" style={{ color: 'var(--color-primary-active)' }}>OTP expires in {state.timerSeconds}s</span>
            </div>
          )}
          {state.otpExpired && (
            <p className="text-xs" style={{ color: 'var(--color-error-text)' }}>⚠️ OTP has expired</p>
          )}
        </div>

        <div className="flex gap-2 justify-center">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <input
              key={index}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={state.otp[index] || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value) {
                  const newOtp = state.otp.split('');
                  newOtp[index] = value;
                  actions.setOtp(newOtp.join(''));
                  if (index < 5) {
                    const nextInput = document.querySelector(`input[data-index="${index + 1}"]`) as HTMLInputElement;
                    nextInput?.focus();
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && !state.otp[index] && index > 0) {
                  const prevInput = document.querySelector(`input[data-index="${index - 1}"]`) as HTMLInputElement;
                  prevInput?.focus();
                }
                if (e.key === 'Enter' && state.otp.length === 6) {
                  actions.handleOtpSubmit();
                }
              }}
              data-index={index}
              className="w-12 h-12 text-center bg-white/10 border border-white/20 rounded-xl text-white text-lg font-semibold focus:outline-none focus:bg-white/15 transition-colors focus:border-[var(--color-primary)]"
              autoFocus={index === 0}
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-xs">
          <button
            onClick={actions.handleResendOtp}
            disabled={!state.otpExpired && state.timerSeconds > 0}
            className="hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: 'var(--color-primary-active)' }}
          >
            Resend OTP
          </button>
          <button className="hover:text-white transition-colors" style={{ color: 'var(--color-primary-active)' }}>
            Wrong Aadhaar?
          </button>
        </div>

        <div className="rounded-xl px-3 py-2.5 flex items-start gap-2" style={{ background: 'var(--color-warning-subtle)', borderColor: 'var(--color-warning-border)', borderWidth: 1, borderStyle: 'solid' }}>
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={{ color: 'var(--color-warning-text)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-xs" style={{ color: 'var(--color-warning-text)', opacity: 0.9 }}>
            Demo: Enter <strong>123456</strong> to simulate successful verification
          </p>
        </div>

        <button
          onClick={actions.handleOtpSubmit}
          disabled={state.otp.length !== 6 || state.otpExpired}
          className="w-full py-3.5 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          style={{ background: 'var(--btn-primary-bg)' }}
        >
          Verify OTP
        </button>

        <EkycFooterLinks />
      </div>
    );
  }

  return null;
}


function EkycFooterLinks() {
  return (
    <div className="flex items-center justify-between text-xs">
      <button className="flex items-center gap-1.5 hover:text-white transition-colors" style={{ color: 'var(--color-primary-active)' }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
        KYC Help
      </button>
      <button className="flex items-center gap-1.5 hover:text-white transition-colors" style={{ color: 'var(--color-primary-active)' }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
        1800 266 5433
      </button>
    </div>
  );
}


/* ──────────────────────────────────────────────
   Standalone page component (for /ekyc route)
   ────────────────────────────────────────────── */
interface EkycChatFlowProps {
  onComplete: () => void;
}

export default function EkycChatFlow({ onComplete }: EkycChatFlowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const ekyc = useEkycFlow(onComplete);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  }, [ekyc.state.messages]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-lg mx-auto">
          <EkycInlineMessages messages={ekyc.state.messages} />
          <div className="h-4" />
        </div>
      </div>

      <AnimatePresence>
        {(ekyc.state.step === 'aadhaar_input' || ekyc.state.step === 'otp_input') && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="shrink-0 shadow-[0_-4px_40px_rgba(0,0,0,0.3)]"
              style={{ background: 'var(--app-glass-bg, var(--motor-glass-bg))', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid var(--app-border, var(--motor-border))' }}
          >
            <div className="max-w-lg mx-auto px-5 py-5 pb-8">
              <EkycInputWidget {...ekyc} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
