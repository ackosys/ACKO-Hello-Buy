'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type FinancialStage =
  | 'intro'
  | 'salaried_methods'
  | 'epfo_mobile' | 'epfo_otp' | 'epfo_verifying' | 'epfo_success' | 'epfo_failure' | 'epfo_timeout'
  | 'aa_consent' | 'aa_bank' | 'aa_verifying' | 'aa_success' | 'aa_failure'
  | 'doc_salaried'
  | 'business_methods' | 'gst_entry' | 'gst_verifying' | 'gst_success' | 'gst_failure' | 'doc_business'
  | 'doc_self'
  | 'verified';

export interface IncomeMessage {
  id: string;
  type: 'bot' | 'user';
  content: string | React.ReactNode;
  timestamp: Date;
}

export interface IncomeFlowState {
  stage: FinancialStage;
  messages: IncomeMessage[];
  mobile: string;
  otp: string[];
  otpTimer: number;
  otpAttempts: number;
  gstNumber: string;
  ownershipPct: string;
  selectedBank: string;
  uploadedDocs: Record<string, boolean>;
}

interface UseIncomeFlowOptions {
  skipIntro?: boolean;
}

export interface UseIncomeFlowReturn {
  state: IncomeFlowState;
  actions: {
    setMobile: (v: string) => void;
    setOtp: (v: string[]) => void;
    setGstNumber: (v: string) => void;
    setOwnershipPct: (v: string) => void;
    setSelectedBank: (v: string) => void;
    toggleDoc: (key: string) => void;
    selectOccupation: (id: 'salaried' | 'business' | 'self') => void;
    selectSalariedMethod: (id: 'epfo' | 'aa' | 'upload') => void;
    selectBusinessMethod: (id: 'gst' | 'upload') => void;
    handleEpfoSendOtp: () => void;
    handleEpfoVerifyOtp: () => void;
    handleEpfoRetry: () => void;
    handleEpfoAlternate: () => void;
    handleEpfoTimeoutContinue: () => void;
    handleAaConsent: () => void;
    handleAaProceed: () => void;
    handleAaRetry: () => void;
    handleAaAlternate: () => void;
    handleGstVerify: () => void;
    handleGstRetry: () => void;
    handleGstAlternate: () => void;
    handleDocSubmit: () => void;
  };
}

const BANKS = [
  { id: 'sbi', name: 'State Bank of India', abbr: 'SBI' },
  { id: 'hdfc', name: 'HDFC Bank', abbr: 'HDFC' },
  { id: 'icici', name: 'ICICI Bank', abbr: 'ICICI' },
  { id: 'axis', name: 'Axis Bank', abbr: 'Axis' },
  { id: 'kotak', name: 'Kotak Mahindra', abbr: 'Kotak' },
  { id: 'other', name: 'Other bank', abbr: '+ More' },
];

export function useIncomeFlow(onComplete: () => void, options?: UseIncomeFlowOptions): UseIncomeFlowReturn {
  const skipIntro = options?.skipIntro ?? false;
  const [stage, setStage] = useState<FinancialStage>(skipIntro ? 'intro' : 'intro');
  const [messages, setMessages] = useState<IncomeMessage[]>([]);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(30);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [gstNumber, setGstNumber] = useState('');
  const [ownershipPct, setOwnershipPct] = useState('100');
  const [selectedBank, setSelectedBank] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});

  const addBotMessage = useCallback((content: string | React.ReactNode) => {
    setMessages((prev) => [...prev, {
      id: `inc-bot-${Date.now()}-${Math.random()}`,
      type: 'bot',
      content,
      timestamp: new Date(),
    }]);
  }, []);

  const addUserMessage = useCallback((content: string) => {
    setMessages((prev) => [...prev, {
      id: `inc-user-${Date.now()}-${Math.random()}`,
      type: 'user',
      content,
      timestamp: new Date(),
    }]);
  }, []);

  const goTo = useCallback((s: FinancialStage) => setStage(s), []);

  // Verifying stages: add bot message, then auto-advance
  useEffect(() => {
    if (stage === 'epfo_verifying') {
      addBotMessage('Checking EPFO records…');
      const t = setTimeout(() => {
        const otpVal = otp.join('');
        if (otpVal === '000000') {
          addBotMessage('Verification failed. Incorrect OTP. Try again or use another method.');
          goTo('epfo_failure');
        } else if (mobile === '9999999999') {
          addBotMessage('EPFO verification is taking longer. We\'ll notify you via Email & WhatsApp once done.');
          goTo('epfo_timeout');
        } else goTo('epfo_success');
      }, 2500);
      return () => clearTimeout(t);
    }
    if (stage === 'aa_verifying') {
      addBotMessage('Connecting to bank…');
      const t = setTimeout(() => goTo('aa_success'), 3000);
      return () => clearTimeout(t);
    }
    if (stage === 'gst_verifying') {
      addBotMessage('Verifying GSTIN…');
      const t = setTimeout(() => {
        if (gstNumber.length < 15) {
          addBotMessage('GSTIN not verified. Check the number and retry, or upload documents instead.');
          goTo('gst_failure');
        } else goTo('gst_success');
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [stage, otp, mobile, gstNumber, addBotMessage, goTo]);

  // Success stages: add bot message card, then auto-advance to verified
  useEffect(() => {
    if (stage === 'epfo_success') {
      addBotMessage(
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-success-subtle)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} style={{ color: 'var(--color-success-text)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">PF Income Verified</p>
              <p className="text-xs" style={{ color: 'var(--color-primary-active)', opacity: 0.7 }}>Successfully verified via EPFO</p>
            </div>
          </div>
          <div className="rounded-xl p-3 space-y-1.5" style={{ background: 'var(--color-success-subtle)', border: '1px solid var(--color-success-border)' }}>
            {[{ label: 'UAN', value: '10012345678' }, { label: 'Employer', value: 'Verified ✓' }, { label: 'Member status', value: 'Active' }].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-xs"><span style={{ color: 'var(--color-primary-active)', opacity: 0.7 }}>{label}</span><span className="text-white">{value}</span></div>
            ))}
          </div>
        </div>
      );
      const t = setTimeout(() => goTo('verified'), 500);
      return () => clearTimeout(t);
    }
    if (stage === 'aa_success') {
      addBotMessage(
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-success-subtle)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} style={{ color: 'var(--color-success-text)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Income Verified</p>
              <p className="text-xs" style={{ color: 'var(--color-primary-active)', opacity: 0.7 }}>Verified via Account Aggregator</p>
            </div>
          </div>
          <div className="rounded-xl p-3 space-y-1.5" style={{ background: 'var(--color-success-subtle)', border: '1px solid var(--color-success-border)' }}>
            {[{ label: 'Method', value: 'Account Aggregator' }, { label: 'Data source', value: 'Bank statements (6 months)' }, { label: 'Status', value: 'Verified ✓' }].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-xs"><span style={{ color: 'var(--color-primary-active)', opacity: 0.7 }}>{label}</span><span className="text-white">{value}</span></div>
            ))}
          </div>
        </div>
      );
      const t = setTimeout(() => goTo('verified'), 500);
      return () => clearTimeout(t);
    }
    if (stage === 'gst_success') {
      addBotMessage(
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-success-subtle)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} style={{ color: 'var(--color-success-text)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">GST Verified</p>
              <p className="text-xs" style={{ color: 'var(--color-primary-active)', opacity: 0.7 }}>Business income verified via GSTIN</p>
            </div>
          </div>
          <div className="rounded-xl p-3 space-y-1.5" style={{ background: 'var(--color-success-subtle)', border: '1px solid var(--color-success-border)' }}>
            {[{ label: 'GSTIN', value: gstNumber }, { label: 'Ownership', value: `${ownershipPct}%` }, { label: 'Status', value: 'Active · Verified ✓' }].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-xs"><span style={{ color: 'var(--color-primary-active)', opacity: 0.7 }}>{label}</span><span className="text-white">{value}</span></div>
            ))}
          </div>
        </div>
      );
      const t = setTimeout(() => goTo('verified'), 500);
      return () => clearTimeout(t);
    }
  }, [stage, gstNumber, ownershipPct, addBotMessage, goTo]);

  // Verified: add final card, then onComplete after 3s
  useEffect(() => {
    if (stage === 'verified') {
      addBotMessage(
        <div className="space-y-4">
          <div className="flex flex-col items-center py-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--color-success-subtle)' }}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} style={{ color: 'var(--color-success-text)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Income verified!</h3>
            <p className="text-sm" style={{ color: 'var(--color-primary-active)', opacity: 0.7 }}>Financial details captured. Next up: medical evaluation.</p>
          </div>
          <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--color-primary-subtle)', border: '1px solid var(--color-info-border)' }}>
            <p className="text-white font-semibold text-sm">What&apos;s next</p>
            {[{ icon: '📹', text: '15–20 min video call with a doctor (VMER)' }, { icon: '📋', text: 'Review and confirm your health responses' }, { icon: '🏠', text: 'Home tests may be requested if applicable' }].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2.5"><span>{icon}</span><p className="text-xs" style={{ color: 'var(--color-primary-active)', opacity: 0.9 }}>{text}</p></div>
            ))}
          </div>
        </div>
      );
      const t = setTimeout(onComplete, 3000);
      return () => clearTimeout(t);
    }
  }, [stage, addBotMessage, onComplete]);

  // OTP timer
  useEffect(() => {
    if (stage !== 'epfo_otp' || otpTimer <= 0) return;
    const t = setInterval(() => setOtpTimer((p) => (p <= 1 ? 0 : p - 1)), 1000);
    return () => clearInterval(t);
  }, [stage, otpTimer]);

  const selectOccupation = (id: 'salaried' | 'business' | 'self') => {
    const labels = { salaried: 'Salaried', business: 'Business owner', self: 'Self-employed / Freelancer' };
    addUserMessage(labels[id]);
    addBotMessage(id === 'salaried' ? '3 ways to verify — pick whichever works best' : id === 'business' ? 'Choose your preferred verification method' : 'Upload financial documents to verify your income.');
    if (id === 'salaried') goTo('salaried_methods');
    else if (id === 'business') goTo('business_methods');
    else goTo('doc_self');
  };

  const selectSalariedMethod = (id: 'epfo' | 'aa' | 'upload') => {
    const labels = { epfo: 'EPFO / Provident Fund', aa: 'Account Aggregator', upload: 'Upload salary slips' };
    addUserMessage(labels[id]);
    if (id === 'epfo') { addBotMessage('Enter your EPFO-registered mobile number.'); goTo('epfo_mobile'); }
    else if (id === 'aa') { addBotMessage('Account Aggregator consent — you control what\'s shared.'); goTo('aa_consent'); }
    else { addBotMessage('Upload last 3 months salary slips.'); goTo('doc_salaried'); }
  };

  const selectBusinessMethod = (id: 'gst' | 'upload') => {
    const labels = { gst: 'GST Verification', upload: 'Upload financial documents' };
    addUserMessage(labels[id]);
    if (id === 'gst') { addBotMessage('Enter your GST details.'); goTo('gst_entry'); }
    else { addBotMessage('Upload ITR, Form 16A, or audited P&L.'); goTo('doc_business'); }
  };

  const handleEpfoSendOtp = () => {
    if (mobile.length < 10) return;
    addUserMessage(`+91 ${mobile}`);
    addBotMessage(`OTP sent to +91 ${mobile.slice(0, 5)}xxxxx`);
    setOtpTimer(30);
    setOtp(['', '', '', '', '', '']);
    goTo('epfo_otp');
  };

  const handleEpfoVerifyOtp = () => {
    const otpVal = otp.join('');
    if (otpVal.length < 6) return;
    addUserMessage('• • • • • •');
    setOtpAttempts((p) => p + 1);
    goTo('epfo_verifying');
  };

  const handleEpfoRetry = () => {
    setOtp(['', '', '', '', '', '']);
    setOtpTimer(30);
    addBotMessage('Enter the OTP again.');
    goTo('epfo_otp');
  };

  const handleEpfoAlternate = () => {
    addUserMessage('Use another method');
    addBotMessage('3 ways to verify — pick whichever works best');
    goTo('salaried_methods');
  };

  const handleEpfoTimeoutContinue = () => {
    addUserMessage('Back to Pending Tasks');
    onComplete();
  };

  const handleAaConsent = () => {
    addUserMessage('I consent — proceed');
    addBotMessage('Select your bank to authenticate.');
    goTo('aa_bank');
  };

  const handleAaProceed = () => {
    if (!selectedBank) return;
    const bank = BANKS.find((b) => b.id === selectedBank);
    addUserMessage(bank?.name ?? selectedBank);
    goTo('aa_verifying');
  };

  const handleAaRetry = () => {
    addBotMessage('Select your bank again.');
    goTo('aa_bank');
  };

  const handleAaAlternate = () => {
    addUserMessage('Use another method');
    addBotMessage('3 ways to verify — pick whichever works best');
    goTo('salaried_methods');
  };

  const handleGstVerify = () => {
    if (gstNumber.length < 5) return;
    addUserMessage(`GSTIN: ${gstNumber}, Ownership: ${ownershipPct}%`);
    goTo('gst_verifying');
  };

  const handleGstRetry = () => {
    addBotMessage('Enter your GST details again.');
    goTo('gst_entry');
  };

  const handleGstAlternate = () => {
    addUserMessage('Upload documents instead');
    addBotMessage('Upload ITR, Form 16A, or audited P&L.');
    goTo('doc_business');
  };

  const handleDocSubmit = () => {
    addUserMessage('Submit for review');
    addBotMessage('Documents submitted. Review typically takes 24–48 hours.');
    goTo('verified');
  };

  const toggleDoc = (key: string) => setUploadedDocs((p) => ({ ...p, [key]: !p[key] }));

  return {
    state: { stage, messages, mobile, otp, otpTimer, otpAttempts, gstNumber, ownershipPct, selectedBank, uploadedDocs },
    actions: {
      setMobile,
      setOtp,
      setGstNumber,
      setOwnershipPct,
      setSelectedBank,
      toggleDoc,
      selectOccupation,
      selectSalariedMethod,
      selectBusinessMethod,
      handleEpfoSendOtp,
      handleEpfoVerifyOtp,
      handleEpfoRetry,
      handleEpfoAlternate,
      handleEpfoTimeoutContinue,
      handleAaConsent,
      handleAaProceed,
      handleAaRetry,
      handleAaAlternate,
      handleGstVerify,
      handleGstRetry,
      handleGstAlternate,
      handleDocSubmit,
    },
  };
}

/* ──────────────────────────────────────────────
   Inline message renderer
   ────────────────────────────────────────────── */
export function IncomeInlineMessages({ messages }: { messages: IncomeMessage[] }) {
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
   Input widget — white bg cards for dark bottom sheet
   ────────────────────────────────────────────── */
const CARD = 'bg-white rounded-xl border border-gray-100 p-4 shadow-sm';
const BTN_PRIMARY = 'w-full py-3.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all';
const BTN_SECONDARY = 'w-full py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 active:scale-[0.98] transition-all';

export function IncomeInputWidget({ state, actions }: UseIncomeFlowReturn) {
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpVal = state.otp.join('');

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...state.otp];
    next[idx] = val.slice(-1);
    actions.setOtp(next);
    if (val && idx < 5) digitRefs.current[idx + 1]?.focus();
    if (!val && idx > 0) digitRefs.current[idx - 1]?.focus();
  };

  // intro
  if (state.stage === 'intro') {
    return (
      <div className={`${CARD} space-y-2`}>
        <p className="text-sm font-semibold text-gray-800 text-center">How are you currently employed?</p>
        {[
          { id: 'salaried' as const, icon: '🏢', label: 'Salaried', desc: 'Working for a company' },
          { id: 'business' as const, icon: '🏪', label: 'Business owner', desc: 'GST registered' },
          { id: 'self' as const, icon: '💼', label: 'Self-employed', desc: 'Freelancer / consultant' },
        ].map(({ id, icon, label, desc }) => (
          <button key={id} onClick={() => actions.selectOccupation(id)} className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-[var(--color-primary-subtle)] text-left transition-all">
            <span className="text-xl">{icon}</span>
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800">{label}</p><p className="text-xs text-gray-400">{desc}</p></div>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
        ))}
      </div>
    );
  }

  // salaried_methods
  if (state.stage === 'salaried_methods') {
    return (
      <div className={`${CARD} space-y-2`}>
        {[
          { id: 'epfo' as const, badge: 'Instant', badgeColor: 'success', icon: '📊', title: 'EPFO / Provident Fund', desc: 'OTP to EPFO-registered mobile' },
          { id: 'aa' as const, badge: 'Instant', badgeColor: 'bg-blue-50 text-blue-600', icon: '🏦', title: 'Account Aggregator', desc: 'Share bank statements via RBI' },
          { id: 'upload' as const, badge: '24–48 hrs', badgeColor: 'warning', icon: '📄', title: 'Upload salary slips', desc: 'Last 3 months' },
        ].map(({ id, badge, badgeColor, icon, title, desc }) => (
          <button key={id} onClick={() => actions.selectSalariedMethod(id)} className="w-full flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-[var(--color-primary-subtle)] text-left transition-all">
            <span className="text-xl">{icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-semibold text-gray-800">{title}</p><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeColor.startsWith('bg-') ? badgeColor : ''}`} style={badgeColor === 'success' ? { background: 'var(--color-success-subtle)', color: 'var(--color-success)' } : badgeColor === 'warning' ? { background: 'var(--color-warning-subtle)', color: 'var(--color-warning)' } : undefined}>{badge}</span></div>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
            <svg className="w-4 h-4 text-gray-300 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
        ))}
      </div>
    );
  }

  // epfo_mobile
  if (state.stage === 'epfo_mobile') {
    return (
      <div className={`${CARD} space-y-3`}>
        <p className="text-sm font-semibold text-gray-800">EPFO-registered mobile</p>
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:border-[var(--color-primary)] focus-within:ring-[var(--color-primary-subtle)]">
          <span className="px-3 py-3 text-sm text-gray-500 border-r border-gray-100 bg-gray-50">+91</span>
          <input type="tel" inputMode="numeric" maxLength={10} value={state.mobile}
            onChange={(e) => actions.setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="10-digit number"
            className="flex-1 px-3 py-3 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-300" />
        </div>
        <p className="text-[10px] text-gray-400">Demo: 9999999999 = timeout</p>
        <button disabled={state.mobile.length < 10} onClick={actions.handleEpfoSendOtp} className={BTN_PRIMARY} style={{ background: 'var(--btn-primary-bg)' }}>Send OTP</button>
      </div>
    );
  }

  // epfo_otp
  if (state.stage === 'epfo_otp') {
    return (
      <div className={`${CARD} space-y-3`}>
        <p className="text-sm font-semibold text-gray-800">Enter OTP</p>
        <p className="text-xs text-gray-500">Sent to +91 {state.mobile.slice(0, 5)}xxxxx</p>
        <div className="flex gap-2 justify-center">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <input key={i} ref={(el) => { digitRefs.current[i] = el; }} type="tel" inputMode="numeric" maxLength={1} value={state.otp[i] || ''}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Backspace' && !state.otp[i] && i > 0) digitRefs.current[i - 1]?.focus(); }}
              className="w-11 h-12 text-center text-lg font-bold text-gray-800 border border-gray-200 rounded-xl focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)] bg-gray-50 outline-none" />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          {state.otpTimer > 0 ? `Resend in ${state.otpTimer}s` : <button onClick={() => { actions.setOtp(['', '', '', '', '', '']); }} className="font-medium" style={{ color: 'var(--color-text-brand)' }}>Resend OTP</button>}
          <span>Attempts: {state.otpAttempts}/3</span>
        </div>
        <p className="text-[10px] text-gray-400 text-center">Demo: 000000 = failure</p>
        <button disabled={otpVal.length < 6} onClick={actions.handleEpfoVerifyOtp} className={BTN_PRIMARY} style={{ background: 'var(--btn-primary-bg)' }}>Verify OTP</button>
      </div>
    );
  }

  // epfo_failure
  if (state.stage === 'epfo_failure') {
    return (
      <div className={`${CARD} space-y-3`}>
        <p className="text-sm font-semibold text-gray-800 text-center">Verification failed</p>
        <p className="text-xs text-gray-500 text-center">{state.otpAttempts >= 3 ? 'Too many attempts.' : 'Incorrect OTP.'}</p>
        <div className="space-y-2">
          {state.otpAttempts < 3 && <button onClick={actions.handleEpfoRetry} className={BTN_PRIMARY} style={{ background: 'var(--btn-primary-bg)' }}>Try again</button>}
          <button onClick={actions.handleEpfoAlternate} className={BTN_SECONDARY}>Use another method</button>
        </div>
      </div>
    );
  }

  // epfo_timeout
  if (state.stage === 'epfo_timeout') {
    return (
      <div className={`${CARD} space-y-3`}>
        <p className="text-sm font-semibold text-gray-800 text-center">Taking a bit longer…</p>
        <p className="text-xs text-gray-500 text-center">We&apos;ll notify you via Email & WhatsApp once done.</p>
        <div className="space-y-2">
          <button onClick={actions.handleEpfoTimeoutContinue} className={BTN_PRIMARY} style={{ background: 'var(--btn-primary-bg)' }}>Back to Pending Tasks</button>
          <button onClick={actions.handleEpfoAlternate} className="text-sm text-gray-400">Try another method</button>
        </div>
      </div>
    );
  }

  // aa_consent
  if (state.stage === 'aa_consent') {
    return (
      <div className={`${CARD} space-y-3`}>
        <p className="text-sm font-semibold text-gray-800">Account Aggregator Consent</p>
        <p className="text-xs text-gray-500">RBI framework. You control what&apos;s shared.</p>
        <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-xs text-gray-600">
          <p>• Bank statements (last 6 months)</p>
          <p>• Read-only — no payment access</p>
        </div>
        <button onClick={actions.handleAaConsent} className={BTN_PRIMARY} style={{ background: 'var(--btn-primary-bg)' }}>I consent — proceed</button>
      </div>
    );
  }

  // aa_bank
  if (state.stage === 'aa_bank') {
    return (
      <div className={`${CARD} space-y-3`}>
        <p className="text-sm font-semibold text-gray-800">Select your bank</p>
        <div className="grid grid-cols-2 gap-2">
          {BANKS.map(({ id, name, abbr }) => (
            <button key={id} onClick={() => actions.setSelectedBank(id)}
              className={`p-3 rounded-xl border text-left transition-all ${state.selectedBank === id ? 'hover:opacity-90' : 'border-gray-100 hover:opacity-80 bg-gray-50'}`}
              style={state.selectedBank === id ? { borderColor: 'var(--color-primary)', background: 'var(--color-primary-subtle)' } : { borderColor: 'var(--color-info-border)' }}>
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mb-1 shadow-sm"><span className="text-[9px] font-bold text-gray-600">{abbr}</span></div>
              <p className="text-[11px] font-medium text-gray-700 leading-tight">{name}</p>
            </button>
          ))}
        </div>
        <button disabled={!state.selectedBank} onClick={actions.handleAaProceed} className={BTN_PRIMARY} style={{ background: 'var(--btn-primary-bg)' }}>Proceed to bank</button>
      </div>
    );
  }

  // aa_failure
  if (state.stage === 'aa_failure') {
    return (
      <div className={`${CARD} space-y-3`}>
        <p className="text-sm font-semibold text-gray-800 text-center">Couldn&apos;t connect to bank</p>
        <div className="space-y-2">
          <button onClick={actions.handleAaRetry} className={BTN_PRIMARY} style={{ background: 'var(--btn-primary-bg)' }}>Try again</button>
          <button onClick={actions.handleAaAlternate} className={BTN_SECONDARY}>Use another method</button>
        </div>
      </div>
    );
  }

  // doc_salaried
  if (state.stage === 'doc_salaried') {
    const months = ['Month 1 (most recent)', 'Month 2', 'Month 3'];
    const allUploaded = months.every((_, i) => state.uploadedDocs[`sal_${i}`]);
    return (
      <div className={`${CARD} space-y-3`}>
        <p className="text-sm font-semibold text-gray-800">Upload salary slips</p>
        <p className="text-xs text-gray-500">Last 3 months. PDF, PNG, JPEG. Max 10 MB each.</p>
        <div className="space-y-2">
          {months.map((m, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${state.uploadedDocs[`sal_${i}`] ? '' : 'border-gray-100 bg-gray-50'}`} style={state.uploadedDocs[`sal_${i}`] ? { borderColor: 'var(--color-success-border)', background: 'var(--color-success-subtle)' } : undefined}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${state.uploadedDocs[`sal_${i}`] ? '' : 'bg-white shadow-sm'}`} style={state.uploadedDocs[`sal_${i}`] ? { background: 'var(--color-success-subtle)' } : undefined}>
                {state.uploadedDocs[`sal_${i}`] ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} style={{ color: 'var(--color-success)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> : <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
              </div>
              <div className="flex-1"><p className="text-xs font-medium text-gray-700">{m}</p><p className="text-[10px] text-gray-400">{state.uploadedDocs[`sal_${i}`] ? 'Uploaded ✓' : 'Not uploaded'}</p></div>
              <button onClick={() => actions.toggleDoc(`sal_${i}`)} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold ${state.uploadedDocs[`sal_${i}`] ? '' : 'text-white'}`} style={state.uploadedDocs[`sal_${i}`] ? { background: 'var(--color-error-subtle)', color: 'var(--color-error-text)' } : { background: 'var(--btn-primary-bg)' }}>{state.uploadedDocs[`sal_${i}`] ? 'Remove' : 'Upload'}</button>
            </div>
          ))}
        </div>
        <button disabled={!allUploaded} onClick={actions.handleDocSubmit} className={BTN_PRIMARY} style={{ background: 'var(--btn-primary-bg)' }}>Submit for review</button>
      </div>
    );
  }

  // business_methods
  if (state.stage === 'business_methods') {
    return (
      <div className={`${CARD} space-y-2`}>
        {[
          { id: 'gst' as const, badge: 'Instant', badgeColor: 'success', icon: '🧾', title: 'GST Verification', desc: 'Auto-verify via GSTIN' },
          { id: 'upload' as const, badge: '24–48 hrs', badgeColor: 'warning', icon: '📂', title: 'Upload documents', desc: 'ITR, Form 16A, or P&L' },
        ].map(({ id, badge, badgeColor, icon, title, desc }) => (
          <button key={id} onClick={() => actions.selectBusinessMethod(id)} className="w-full flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-[var(--color-primary-subtle)] text-left transition-all">
            <span className="text-xl">{icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2"><p className="text-sm font-semibold text-gray-800">{title}</p><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span></div>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
            <svg className="w-4 h-4 text-gray-300 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
        ))}
      </div>
    );
  }

  // gst_entry
  if (state.stage === 'gst_entry') {
    return (
      <div className={`${CARD} space-y-3`}>
        <p className="text-sm font-semibold text-gray-800">Enter GST details</p>
        <div>
          <label className="text-xs text-gray-500 block mb-1">GSTIN (15-digit)</label>
          <input type="text" maxLength={15} value={state.gstNumber} onChange={(e) => actions.setGstNumber(e.target.value.toUpperCase())}
            placeholder="22AAAAA0000A1Z5"
            className="w-full px-3.5 py-3 text-sm text-gray-800 border border-gray-200 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none uppercase font-mono tracking-wider placeholder:text-gray-300" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Ownership %</label>
          <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:border-purple-400">
            <input type="number" min={1} max={100} value={state.ownershipPct} onChange={(e) => actions.setOwnershipPct(e.target.value)}
              className="flex-1 px-3.5 py-3 text-sm text-gray-800 bg-transparent outline-none" />
            <span className="px-3 py-3 text-sm text-gray-500 border-l border-gray-100 bg-gray-50">%</span>
          </div>
        </div>
        <p className="text-[10px] text-gray-400">Demo: 15 chars = success</p>
        <button disabled={state.gstNumber.length < 5} onClick={actions.handleGstVerify} className={BTN_PRIMARY}>Verify GST</button>
      </div>
    );
  }

  // gst_failure
  if (state.stage === 'gst_failure') {
    return (
      <div className={`${CARD} space-y-3`}>
        <p className="text-sm font-semibold text-gray-800 text-center">GSTIN not verified</p>
        <div className="space-y-2">
          <button onClick={actions.handleGstRetry} className={BTN_PRIMARY}>Try again</button>
          <button onClick={actions.handleGstAlternate} className={BTN_SECONDARY}>Upload documents instead</button>
        </div>
      </div>
    );
  }

  // doc_business / doc_self
  if (state.stage === 'doc_business' || state.stage === 'doc_self') {
    const docOptions = [
      { key: 'itr', label: 'Income Tax Returns', sublabel: 'Last 3 years' },
      { key: 'form16', label: 'Form 16A', sublabel: 'Last 3 years' },
      { key: 'pnl', label: 'Audited P&L', sublabel: 'CA-certified' },
    ];
    const anyUploaded = docOptions.some((d) => state.uploadedDocs[d.key]);
    return (
      <div className={`${CARD} space-y-3`}>
        <p className="text-sm font-semibold text-gray-800">Upload financial documents</p>
        <p className="text-xs text-gray-500">Any one: ITR, Form 16A, or P&L. PDF/ZIP. Max 20 MB.</p>
        <div className="space-y-2">
          {docOptions.map(({ key, label, sublabel }) => (
            <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border ${state.uploadedDocs[key] ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-gray-50'}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${state.uploadedDocs[key] ? 'bg-emerald-100' : 'bg-white shadow-sm'}`}>
                {state.uploadedDocs[key] ? <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> : <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
              </div>
              <div className="flex-1"><p className="text-xs font-medium text-gray-700">{label}</p><p className="text-[10px] text-gray-400">{sublabel}</p></div>
              <button onClick={() => actions.toggleDoc(key)} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold ${state.uploadedDocs[key] ? 'bg-red-50 text-red-400' : 'bg-purple-600 text-white'}`}>{state.uploadedDocs[key] ? 'Remove' : 'Upload'}</button>
            </div>
          ))}
        </div>
        <button disabled={!anyUploaded} onClick={actions.handleDocSubmit} className={BTN_PRIMARY}>Submit for review</button>
      </div>
    );
  }

  return null;
}

/* ──────────────────────────────────────────────
   Standalone component
   ────────────────────────────────────────────── */
const WIDGET_STAGES: FinancialStage[] = [
  'intro', 'salaried_methods', 'epfo_mobile', 'epfo_otp', 'epfo_failure', 'epfo_timeout',
  'aa_consent', 'aa_bank', 'aa_failure', 'doc_salaried', 'business_methods', 'gst_entry', 'gst_failure', 'doc_business', 'doc_self',
];

interface IncomeVerificationFlowProps {
  onComplete: () => void;
  skipIntro?: boolean;
}

export default function IncomeVerificationFlow({ onComplete, skipIntro }: IncomeVerificationFlowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const flow = useIncomeFlow(onComplete, { skipIntro });

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current!.scrollHeight, behavior: 'smooth' }), 100);
  }, [flow.state.messages]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-lg mx-auto">
          <IncomeInlineMessages messages={flow.state.messages} />
          <div className="h-4" />
        </div>
      </div>

      <AnimatePresence>
        {WIDGET_STAGES.includes(flow.state.stage) && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="shrink-0 shadow-[0_-4px_40px_rgba(0,0,0,0.3)]"
              style={{ background: 'var(--app-glass-bg, var(--motor-glass-bg))', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid var(--app-border, var(--motor-border))' }}
          >
            <div className="max-w-lg mx-auto px-5 py-5 pb-8">
              <IncomeInputWidget {...flow} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
