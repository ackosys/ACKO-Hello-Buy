'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type FinancialStep =
  | 'intro'
  | 'choose_type'
  | 'salaried_methods'
  | 'epfo_mobile' | 'epfo_otp' | 'epfo_verifying' | 'epfo_success' | 'epfo_failure'
  | 'aa_consent' | 'aa_bank' | 'aa_verifying' | 'aa_success'
  | 'aa_redirect_start' | 'aa_redirect_loading' | 'aa_redirect_completed'
  | 'doc_upload'
  | 'business_methods' | 'gst_entry' | 'gst_verifying' | 'gst_success' | 'gst_failure'
  | 'doc_business'
  | 'verified';

export interface FinancialMessage {
  id: string;
  type: 'bot' | 'user';
  content: string | React.ReactNode;
  timestamp: Date;
}

export interface UseFinancialFlowReturn {
  state: {
    step: FinancialStep;
    messages: FinancialMessage[];
    mobile: string;
    otp: string[];
    otpTimer: number;
    gstNumber: string;
    selectedBank: string;
  };
  actions: {
    chooseEmploymentType: (type: string) => void;
    chooseMethod: (method: string) => void;
    setMobile: (val: string) => void;
    setOtpDigit: (idx: number, val: string) => void;
    submitMobile: () => void;
    submitOtp: () => void;
    setGstNumber: (val: string) => void;
    submitGst: () => void;
    setSelectedBank: (bank: string) => void;
    submitBank: () => void;
    consentAA: () => void;
    startAARedirect: () => void;
    completeAARedirect: () => void;
    uploadDocs: () => void;
    continueAfterSuccess: () => void;
    goBack: () => void;
  };
}

export function useFinancialFlow(onComplete: () => void, options?: { skipIntro?: boolean }): UseFinancialFlowReturn {
  const skipIntro = options?.skipIntro ?? false;
  const [step, setStep] = useState<FinancialStep>(skipIntro ? 'choose_type' : 'intro');
  const [messages, setMessages] = useState<FinancialMessage[]>([]);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(30);
  const [gstNumber, setGstNumber] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [history, setHistory] = useState<FinancialStep[]>([skipIntro ? 'choose_type' : 'intro']);

  const addBotMsg = useCallback((content: string | React.ReactNode) => {
    setMessages(prev => [...prev, {
      id: `fin-bot-${Date.now()}-${Math.random()}`,
      type: 'bot', content, timestamp: new Date(),
    }]);
  }, []);

  const addUserMsg = useCallback((content: string) => {
    setMessages(prev => [...prev, {
      id: `fin-user-${Date.now()}-${Math.random()}`,
      type: 'user', content, timestamp: new Date(),
    }]);
  }, []);

  const goTo = (s: FinancialStep) => {
    setHistory(h => [...h, s]);
    setStep(s);
  };

  useEffect(() => {
    if (skipIntro) return;
    addBotMsg(
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-sm mb-1">Income Verification</h3>
            <p className="text-purple-200/70 text-xs">Required to confirm your coverage amount</p>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { icon: '🏢', text: 'Salaried — EPFO, Account Aggregator, or salary slips' },
            { icon: '🏪', text: 'Business — GST verification or financial documents' },
            { icon: '💼', text: 'Self-employed — Upload ITR or P&L statements' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-start gap-2.5">
              <span className="text-sm">{icon}</span>
              <p className="text-white/80 text-xs">{text}</p>
            </div>
          ))}
        </div>
      </div>
    );
    setStep('choose_type');
  }, []);

  // OTP timer
  useEffect(() => {
    if (step !== 'epfo_otp' || otpTimer <= 0) return;
    const t = setTimeout(() => setOtpTimer(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [step, otpTimer]);

  // Auto-advance for verifying stages
  useEffect(() => {
    if (step === 'epfo_verifying') {
      const t = setTimeout(() => {
        const otpVal = otp.join('');
        if (otpVal === '000000') {
          addBotMsg('❌ EPFO verification failed. The OTP was incorrect.');
          goTo('epfo_failure');
        } else {
          addBotMsg(
            <SuccessCard title="PF Income Verified" subtitle="Successfully verified via EPFO" items={[
              { label: 'UAN', value: '10012345678' },
              { label: 'Employer', value: 'Verified ✓' },
              { label: 'Status', value: 'Active' },
            ]} />
          );
          goTo('epfo_success');
        }
      }, 2500);
      return () => clearTimeout(t);
    }
    if (step === 'aa_verifying') {
      const t = setTimeout(() => {
        addBotMsg(
          <SuccessCard title="Income Verified" subtitle="Verified via Account Aggregator" items={[
            { label: 'Method', value: 'Account Aggregator' },
            { label: 'Data source', value: 'Bank statements (6 months)' },
            { label: 'Status', value: 'Verified ✓' },
          ]} />
        );
        goTo('aa_success');
      }, 3000);
      return () => clearTimeout(t);
    }
    if (step === 'gst_verifying') {
      const t = setTimeout(() => {
        if (gstNumber.length < 15) {
          addBotMsg('❌ GSTIN verification failed. Please check the number and try again.');
          goTo('gst_failure');
        } else {
          addBotMsg(
            <SuccessCard title="GST Verified" subtitle="Business income verified via GSTIN" items={[
              { label: 'GSTIN', value: gstNumber },
              { label: 'Status', value: 'Active · Verified ✓' },
            ]} />
          );
          goTo('gst_success');
        }
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [step]);

  const chooseEmploymentType = (type: string) => {
    const labels: Record<string, string> = { salaried: 'Salaried', business: 'Business owner', self: 'Self-employed' };
    addUserMsg(labels[type] || type);

    if (type === 'salaried') {
      addBotMsg("Great! Choose your preferred verification method. We have 3 options for salaried employees.");
      goTo('salaried_methods');
    } else if (type === 'business') {
      addBotMsg("Let's verify your business income. You can use GST verification or upload financial documents.");
      goTo('business_methods');
    } else {
      addBotMsg("Please upload your financial documents for verification. We accept ITR, Form 16A, or audited P&L statements.");
      goTo('doc_business');
    }
  };

  const chooseMethod = (method: string) => {
    const labels: Record<string, string> = {
      epfo: 'EPFO / Provident Fund', aa: 'Account Aggregator', upload: 'Upload salary slips',
      gst: 'GST Verification', doc_upload: 'Upload documents',
    };
    addUserMsg(labels[method] || method);

    if (method === 'epfo') {
      addBotMsg("Enter your EPFO-registered mobile number. We'll send an OTP to verify your PF records.");
      goTo('epfo_mobile');
    } else if (method === 'aa') {
      goTo('aa_redirect_start');
    } else if (method === 'upload') {
      addBotMsg("Please upload your last 3 months' salary slips (PDF, PNG, or JPEG). Max 10 MB each.");
      goTo('doc_upload');
    } else if (method === 'gst') {
      addBotMsg("Enter your 15-digit GSTIN to verify your business income.");
      goTo('gst_entry');
    } else {
      addBotMsg("Please upload your financial documents for verification.");
      goTo('doc_business');
    }
  };

  const submitMobile = () => {
    if (mobile.length < 10) return;
    addUserMsg(`+91 ${mobile}`);
    addBotMsg('Sending OTP to your EPFO-registered mobile...');
    setOtpTimer(30);
    setOtp(['', '', '', '', '', '']);
    goTo('epfo_otp');
    setTimeout(() => {
      addBotMsg(`OTP sent to +91 ${mobile.slice(0, 5)}xxxxx via EPFO`);
    }, 1000);
  };

  const submitOtp = () => {
    const otpVal = otp.join('');
    if (otpVal.length < 6) return;
    addUserMsg('• • • • • •');
    addBotMsg('Verifying with EPFO...');
    goTo('epfo_verifying');
  };

  const setOtpDigit = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
  };

  const submitGst = () => {
    if (gstNumber.length < 5) return;
    addUserMsg(gstNumber);
    addBotMsg('Verifying GSTIN with GST portal...');
    goTo('gst_verifying');
  };

  const submitBank = () => {
    if (!selectedBank) return;
    const bankNames: Record<string, string> = {
      sbi: 'State Bank of India', hdfc: 'HDFC Bank', icici: 'ICICI Bank',
      axis: 'Axis Bank', kotak: 'Kotak Mahindra', other: 'Other bank',
    };
    addUserMsg(bankNames[selectedBank] || selectedBank);
    addBotMsg('Connecting to your bank via Account Aggregator...');
    goTo('aa_verifying');
  };

  const consentAA = () => {
    addUserMsg('I consent');
    addBotMsg('Select your bank to proceed with Account Aggregator verification.');
    goTo('aa_bank');
  };

  const startAARedirect = () => {
    goTo('aa_redirect_loading');
  };

  const completeAARedirect = () => {
    goTo('aa_redirect_completed');
    setTimeout(() => {
      addBotMsg(
        <SuccessCard title="Income Verified" subtitle="Verified via Account Aggregator" items={[
          { label: 'Method', value: 'Account Aggregator' },
          { label: 'Data source', value: 'Bank statements (6 months)' },
          { label: 'Status', value: 'Verified ✓' },
        ]} />
      );
      goTo('aa_success');
    }, 1500);
  };

  const uploadDocs = () => {
    addUserMsg('Documents uploaded');
    addBotMsg(
      <SuccessCard title="Documents Submitted" subtitle="Under review — typically 24–48 hours" items={[
        { label: 'Method', value: 'Document upload' },
        { label: 'Status', value: 'Under review' },
      ]} />
    );
    goTo('verified');
  };

  const continueAfterSuccess = () => {
    if (step !== 'verified' && !['epfo_success', 'aa_success', 'gst_success'].includes(step)) {
      goTo('verified');
      addBotMsg(
        <div className="space-y-3">
          <div className="flex flex-col items-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Income Verified!</h3>
            <p className="text-purple-200/70 text-sm">Next up: medical evaluation</p>
          </div>
        </div>
      );
      setTimeout(() => onComplete(), 2000);
      return;
    }
    addBotMsg(
      <div className="space-y-3">
        <div className="flex flex-col items-center py-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
            <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">Income Verified!</h3>
          <p className="text-purple-200/70 text-sm">Next up: medical evaluation</p>
        </div>
      </div>
    );
    setTimeout(() => onComplete(), 2000);
  };

  const goBack = () => {
    if (history.length > 1) {
      const newHist = history.slice(0, -1);
      setHistory(newHist);
      setStep(newHist[newHist.length - 1]);
    }
  };

  return {
    state: { step, messages, mobile, otp, otpTimer, gstNumber, selectedBank },
    actions: {
      chooseEmploymentType, chooseMethod, setMobile, setOtpDigit,
      submitMobile, submitOtp, setGstNumber, submitGst,
      setSelectedBank, submitBank, consentAA,
      startAARedirect, completeAARedirect,
      uploadDocs, continueAfterSuccess, goBack,
    },
  };
}


function SuccessCard({ title, subtitle, items }: { title: string; subtitle: string; items: { label: string; value: string }[] }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center py-3">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
          <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-white">{title}</h3>
        <p className="text-purple-200/70 text-xs">{subtitle}</p>
      </div>
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 space-y-1.5">
        {items.map(({ label, value }) => (
          <div key={label} className="flex justify-between">
            <span className="text-xs text-white/50">{label}</span>
            <span className="text-xs font-medium text-white/80">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ────────────────────────────────────────
   Inline message renderer
   ──────────────────────────────────────── */
export function FinancialInlineMessages({ messages }: { messages: FinancialMessage[] }) {
  return (
    <>
      {messages.map((msg) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 ${msg.type === 'user' ? 'flex justify-end' : 'flex items-start gap-3'}`}
        >
          {msg.type === 'bot' && (
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-1">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
          )}
          <div className={`rounded-2xl px-4 py-3 ${
            msg.type === 'user'
              ? 'bg-white text-gray-900 max-w-[75%]'
              : 'bg-white/10 backdrop-blur-sm border border-white/10 text-white flex-1'
          }`}>
            {typeof msg.content === 'string' ? (
              <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
            ) : msg.content}
          </div>
        </motion.div>
      ))}
    </>
  );
}


/* ────────────────────────────────────────
   Bottom input widget
   ──────────────────────────────────────── */
export function FinancialInputWidget({ state, actions }: UseFinancialFlowReturn) {
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  if (state.step === 'choose_type') {
    return (
      <div className="space-y-2">
        <p className="text-xs text-purple-200/70 text-center mb-2">How are you currently employed?</p>
        {[
          { id: 'salaried', icon: '🏢', label: 'Salaried' },
          { id: 'business', icon: '🏪', label: 'Business owner' },
          { id: 'self', icon: '💼', label: 'Self-employed' },
        ].map(({ id, icon, label }) => (
          <button key={id} onClick={() => actions.chooseEmploymentType(id)}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 transition-all active:scale-[0.98] text-left">
            <span className="text-lg">{icon}</span>
            <span className="text-sm font-medium text-white">{label}</span>
          </button>
        ))}
      </div>
    );
  }

  if (state.step === 'salaried_methods') {
    return (
      <div className="space-y-2">
        <p className="text-xs text-purple-200/70 text-center mb-2">Choose verification method</p>
        {[
          { id: 'epfo', label: 'EPFO / Provident Fund', badge: 'Instant', icon: '📊' },
          { id: 'aa', label: 'Account Aggregator', badge: 'Instant', icon: '🏦' },
          { id: 'upload', label: 'Upload salary slips', badge: '24-48h', icon: '📄' },
        ].map(({ id, label, badge, icon }) => (
          <button key={id} onClick={() => actions.chooseMethod(id)}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 transition-all active:scale-[0.98] text-left">
            <span className="text-lg">{icon}</span>
            <div className="flex-1">
              <span className="text-sm font-medium text-white">{label}</span>
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">{badge}</span>
            </div>
          </button>
        ))}
      </div>
    );
  }

  if (state.step === 'business_methods') {
    return (
      <div className="space-y-2">
        <p className="text-xs text-purple-200/70 text-center mb-2">Choose verification method</p>
        {[
          { id: 'gst', label: 'GST Verification', badge: 'Instant', icon: '🧾' },
          { id: 'doc_upload', label: 'Upload financial documents', badge: '24-48h', icon: '📂' },
        ].map(({ id, label, badge, icon }) => (
          <button key={id} onClick={() => actions.chooseMethod(id)}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 transition-all active:scale-[0.98] text-left">
            <span className="text-lg">{icon}</span>
            <div className="flex-1">
              <span className="text-sm font-medium text-white">{label}</span>
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">{badge}</span>
            </div>
          </button>
        ))}
      </div>
    );
  }

  if (state.step === 'epfo_mobile') {
    return (
      <div className="space-y-3">
        <p className="text-xs text-purple-200/70 text-center">EPFO-registered mobile number</p>
        <div className="flex items-center bg-white/10 border border-white/20 rounded-xl overflow-hidden focus-within:border-purple-400">
          <span className="px-3 py-3 text-sm text-white/50 border-r border-white/10">+91</span>
          <input type="tel" inputMode="numeric" maxLength={10} value={state.mobile}
            onChange={e => actions.setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="Enter 10-digit number"
            className="flex-1 px-3 py-3 text-sm text-white bg-transparent outline-none placeholder:text-white/30" autoFocus />
        </div>
        <button disabled={state.mobile.length < 10} onClick={actions.submitMobile}
          className="w-full py-3.5 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
          Send OTP
        </button>
      </div>
    );
  }

  if (state.step === 'epfo_otp') {
    return (
      <div className="space-y-3">
        <div className="text-center mb-2">
          <p className="text-xs text-purple-200/70 mb-1">Enter 6-digit OTP</p>
          <p className="text-xs text-purple-300">{state.otpTimer > 0 ? `Resend in ${state.otpTimer}s` : ''}</p>
        </div>
        <div className="flex gap-2 justify-center">
          {state.otp.map((d, i) => (
            <input key={i} ref={el => { digitRefs.current[i] = el; }} type="tel" inputMode="numeric" maxLength={1} value={d}
              onChange={e => {
                actions.setOtpDigit(i, e.target.value);
                if (e.target.value && i < 5) digitRefs.current[i + 1]?.focus();
              }}
              onKeyDown={e => { if (e.key === 'Backspace' && !d && i > 0) digitRefs.current[i - 1]?.focus(); }}
              className="w-11 h-12 text-center bg-white/10 border border-white/20 rounded-xl text-white text-lg font-semibold focus:outline-none focus:border-purple-400 transition-colors"
              autoFocus={i === 0} />
          ))}
        </div>
        <p className="text-[10px] text-center text-purple-200/50">Demo: 000000 = failure, anything else = success</p>
        <button disabled={state.otp.join('').length < 6} onClick={actions.submitOtp}
          className="w-full py-3.5 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
          Verify OTP
        </button>
      </div>
    );
  }

  if (state.step === 'aa_consent') {
    return (
      <div className="space-y-3">
        <button onClick={actions.consentAA}
          className="w-full py-3.5 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]">
          I consent — proceed
        </button>
        <button onClick={actions.goBack}
          className="w-full py-2.5 text-purple-300 text-xs hover:text-white transition-colors">
          Use another method
        </button>
      </div>
    );
  }

  if (state.step === 'aa_bank') {
    return (
      <div className="space-y-3">
        <p className="text-xs text-purple-200/70 text-center mb-1">Select your bank</p>
        <div className="grid grid-cols-3 gap-2">
          {['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'Other'].map(bank => (
            <button key={bank} onClick={() => actions.setSelectedBank(bank.toLowerCase())}
              className={`p-2.5 rounded-xl border text-center transition-all text-xs font-medium ${
                state.selectedBank === bank.toLowerCase()
                  ? 'border-purple-400 bg-purple-500/20 text-white'
                  : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
              }`}>
              {bank}
            </button>
          ))}
        </div>
        <button disabled={!state.selectedBank} onClick={actions.submitBank}
          className="w-full py-3.5 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
          Proceed to bank
        </button>
      </div>
    );
  }

  if (state.step === 'aa_redirect_start') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/15 bg-white/5 p-5 space-y-5">
          <div>
            <h3 className="text-lg font-bold text-white">Verify your income</h3>
            <p className="text-xs text-white/60 mt-1">We will verify your income via your salary account</p>
          </div>

          <div className="space-y-2">
            {[
              { icon: '✓', text: 'Safe way to retrieve financial data with your consent' },
              { icon: '✓', text: 'Revoke data access when required' },
              { icon: '✓', text: 'Licensed by RBI' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2.5">
                <span className="text-emerald-400 text-sm font-bold">{icon}</span>
                <p className="text-xs text-white/70">{text}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {[
              { num: 1, title: 'Give consent', desc: 'Check details and provide consent' },
              { num: 2, title: 'Connect account', desc: 'Connect with account aggregator using your phone number' },
              { num: 3, title: 'Select & verify', desc: 'Using OTP sent by bank' },
            ].map(({ num, title, desc }) => (
              <div key={num} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5">
                <div className="w-7 h-7 rounded-full bg-purple-500/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-purple-300">{num}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-white/50 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-white/40 text-center">Powered by Anumati</p>
        </div>

        <button onClick={actions.startAARedirect}
          className="w-full py-3.5 bg-purple-600 text-white hover:bg-purple-500 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]">
          Proceed to Verify
        </button>
        <button onClick={actions.goBack}
          className="w-full py-2 text-purple-300 text-xs hover:text-white transition-colors text-center">
          Use another method
        </button>
      </div>
    );
  }

  if (state.step === 'aa_redirect_loading') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/15 bg-white/5 p-5 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white">Verify your income</h3>
            <p className="text-xs text-white/60 mt-1">We will verify your income via your salary account</p>
          </div>

          <div className="flex flex-col items-center justify-center py-10 rounded-xl bg-white/5 border border-white/10">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-white/50">Redirecting to Anumati...</p>
          </div>
        </div>

        <button onClick={actions.completeAARedirect}
          className="w-full py-3.5 bg-purple-600 text-white hover:bg-purple-500 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]">
          I&apos;ve Completed
        </button>
      </div>
    );
  }

  if (state.step === 'aa_redirect_completed') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-base font-semibold text-white">Income Verified!</p>
          </div>
        </div>
      </div>
    );
  }

  if (state.step === 'gst_entry') {
    return (
      <div className="space-y-3">
        <p className="text-xs text-purple-200/70 text-center">Enter your 15-digit GSTIN</p>
        <input type="text" maxLength={15} value={state.gstNumber}
          onChange={e => actions.setGstNumber(e.target.value.toUpperCase())}
          placeholder="e.g. 22AAAAA0000A1Z5"
          className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400 transition-colors uppercase font-mono tracking-wider"
          autoFocus />
        <p className="text-[10px] text-center text-purple-200/50">Demo: 15 chars = success, less = failure</p>
        <button disabled={state.gstNumber.length < 5} onClick={actions.submitGst}
          className="w-full py-3.5 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
          Verify GST
        </button>
      </div>
    );
  }

  if (state.step === 'doc_upload' || state.step === 'doc_business') {
    return (
      <div className="space-y-3">
        <p className="text-xs text-purple-200/70 text-center">Upload required documents</p>
        <button onClick={actions.uploadDocs}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-white/20 hover:border-purple-400 transition-colors">
          <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <span className="text-sm text-white/60">Tap to upload documents</span>
        </button>
        <p className="text-[10px] text-center text-purple-200/50">PDF, PNG, JPEG. Max 10 MB each</p>
      </div>
    );
  }

  if (['epfo_success', 'aa_success', 'gst_success', 'verified'].includes(state.step)) {
    return (
      <button onClick={actions.continueAfterSuccess}
        className="w-full py-3.5 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]">
        Continue to medical evaluation →
      </button>
    );
  }

  if (state.step === 'epfo_failure' || state.step === 'gst_failure') {
    return (
      <div className="space-y-2">
        <button onClick={actions.goBack}
          className="w-full py-3.5 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]">
          Try again
        </button>
        <button onClick={() => {
          const parentStep = state.step === 'epfo_failure' ? 'salaried_methods' : 'business_methods';
          actions.chooseMethod(parentStep === 'salaried_methods' ? 'upload' : 'doc_upload');
        }}
          className="w-full py-2.5 text-purple-300 text-xs hover:text-white transition-colors">
          Use another method
        </button>
      </div>
    );
  }

  return null;
}
