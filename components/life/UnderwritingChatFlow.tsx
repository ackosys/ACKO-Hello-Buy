'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLifeJourneyStore } from '../../lib/life/store';
import type { LifeJourneyState } from '../../lib/life/types';

type UWStep =
  | 'intro'
  | 'reviewing'
  | 'choose_outcome'
  | 'checking'
  | 'approved'
  | 'info_needed'
  | 'info_submitted'
  | 'not_approved';

export interface UnderwritingMessage {
  id: string;
  type: 'bot' | 'user';
  content: string | React.ReactNode;
  timestamp: Date;
}

export interface UseUnderwritingFlowReturn {
  state: {
    step: UWStep;
    messages: UnderwritingMessage[];
    demoOutcome: 'approved' | 'info_needed' | 'not_approved';
    uploadedInfo: boolean;
  };
  actions: {
    setDemoOutcome: (o: 'approved' | 'info_needed' | 'not_approved') => void;
    checkStatus: () => void;
    viewTasks: () => void;
    uploadInfo: () => void;
    submitInfo: () => void;
    downloadPolicy: () => void;
    done: () => void;
  };
}

export function useUnderwritingFlow(onComplete: () => void, options?: { skipIntro?: boolean }): UseUnderwritingFlowReturn {
  const skipIntro = options?.skipIntro ?? false;
  const [step, setStep] = useState<UWStep>(skipIntro ? 'reviewing' : 'intro');
  const [messages, setMessages] = useState<UnderwritingMessage[]>([]);
  const [demoOutcome, setDemoOutcome] = useState<'approved' | 'info_needed' | 'not_approved'>('approved');
  const [uploadedInfo, setUploadedInfo] = useState(false);
  const [policyNo] = useState(() => `ACKO-LIFE-${Date.now().toString().slice(-8)}`);

  const storeState = useLifeJourneyStore.getState() as LifeJourneyState;

  const formatCoverage = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(0)}L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  const coverage = formatCoverage(storeState.selectedCoverage || 10000000);
  const premium = `₹${(storeState.quote?.yearlyPremium || 0).toLocaleString('en-IN')}/yr`;

  const addBotMsg = useCallback((content: string | React.ReactNode) => {
    setMessages(prev => [...prev, {
      id: `uw-bot-${Date.now()}-${Math.random()}`,
      type: 'bot', content, timestamp: new Date(),
    }]);
  }, []);

  const addUserMsg = useCallback((content: string) => {
    setMessages(prev => [...prev, {
      id: `uw-user-${Date.now()}-${Math.random()}`,
      type: 'user', content, timestamp: new Date(),
    }]);
  }, []);

  useEffect(() => {
    if (skipIntro) return;
    addBotMsg(
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-sm mb-1">Underwriting Review</h3>
            <p className="text-purple-200/70 text-xs">Your application is being reviewed by our underwriting team</p>
          </div>
        </div>
      </div>
    );

    setTimeout(() => {
      addBotMsg(
        <div className="space-y-3">
          <p className="text-sm text-white/90 font-medium">All verifications complete! Here's a summary:</p>
          <div className="space-y-2">
            {[
              { icon: '✅', label: 'e-KYC Verification', status: 'Completed' },
              { icon: '✅', label: 'Financial Verification', status: 'Completed' },
              { icon: '✅', label: 'Medical Evaluation', status: 'Completed' },
            ].map(({ icon, label, status }) => (
              <div key={label} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{icon}</span>
                  <span className="text-xs text-white/80">{label}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">{status}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }, 800);

    setTimeout(() => {
      addBotMsg(
        <div className="space-y-2">
          <p className="text-sm text-white/90">Your application is now under review. Estimated decision: <span className="font-semibold text-purple-300">3–5 business days</span>.</p>
          <div className="space-y-1.5 mt-2">
            {[
              { icon: '🔍', text: 'Risk assessment — medical, financial & lifestyle data reviewed' },
              { icon: '📩', text: 'You\'ll be notified by Email & WhatsApp when decision is made' },
              { icon: '📄', text: 'Policy document sent digitally on approval' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-2">
                <span className="text-xs">{icon}</span>
                <p className="text-xs text-white/60">{text}</p>
              </div>
            ))}
          </div>
        </div>
      );
      setStep('choose_outcome');
    }, 1800);
  }, []);

  const checkStatus = () => {
    addUserMsg('Check status');
    addBotMsg(
      <div className="flex items-center gap-3 py-2">
        <div className="w-8 h-8 rounded-full border-2 border-purple-400/30 border-t-purple-400 animate-spin" />
        <p className="text-sm text-white/70">Checking with underwriting team...</p>
      </div>
    );
    setStep('checking');

    setTimeout(() => {
      if (demoOutcome === 'approved') {
        const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        addBotMsg(
          <div className="space-y-4">
            <div className="flex flex-col items-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Policy Approved! 🎉</h3>
              <p className="text-emerald-400 text-sm font-medium">Your coverage starts from today</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-400/20 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-purple-400/10">
                <p className="text-white/50 text-[10px] uppercase tracking-widest">ACKO Flexi Life Plan</p>
                <p className="text-white text-xl font-bold mt-0.5">{coverage}</p>
                <p className="text-white/40 text-xs mt-0.5">{storeState.selectedTerm || 30} year term · {premium}</p>
              </div>
              <div className="px-4 py-3 space-y-2">
                {[
                  { l: 'Policy Number', v: policyNo },
                  { l: 'Policyholder', v: storeState.name || 'Policyholder' },
                  { l: 'Start Date', v: today },
                  { l: 'Status', v: '● Active' },
                ].map(({ l, v }) => (
                  <div key={l} className="flex justify-between">
                    <span className="text-xs text-white/40">{l}</span>
                    <span className={`text-xs font-medium ${v === '● Active' ? 'text-emerald-400' : 'text-white/80'}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        setStep('approved');
      } else if (demoOutcome === 'info_needed') {
        addBotMsg(
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
              <span className="text-base mt-0.5">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-amber-300">Additional information needed</p>
                <p className="text-xs text-white/60 mt-0.5">Your application is on hold. Please provide the requested details to proceed.</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { tag: '📋', title: 'Medical history clarification', desc: 'Upload a consultation note regarding your declared condition.' },
                { tag: '📞', title: 'Income verification call', desc: 'A 10-minute call to verify your business income details.' },
              ].map(({ tag, title, desc }) => (
                <div key={title} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="text-sm">{tag}</span>
                    <div>
                      <p className="text-xs font-semibold text-white/80">{title}</p>
                      <p className="text-[11px] text-white/50">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        setStep('info_needed');
      } else {
        addBotMsg(
          <div className="space-y-3">
            <div className="flex flex-col items-center py-4">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white">Application Not Approved</h3>
              <p className="text-xs text-white/50 text-center mt-1 max-w-xs">After careful review, we're unable to offer coverage at this time.</p>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5 flex items-center gap-3">
              <span className="text-lg">💰</span>
              <div>
                <p className="text-xs font-semibold text-emerald-400">100% Premium Refund</p>
                <p className="text-[11px] text-white/50">₹{(storeState.quote?.yearlyPremium || 0).toLocaleString('en-IN')} refunded within 7–10 business days</p>
              </div>
            </div>

            <div className="space-y-1.5">
              {[
                { icon: '🔄', text: 'Re-apply after 6 months' },
                { icon: '💬', text: 'Talk to an advisor for alternative options' },
                { icon: '🏥', text: 'Explore health insurance plans from ₹800/month' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <span className="text-xs">{icon}</span>
                  <p className="text-xs text-white/60">{text}</p>
                </div>
              ))}
            </div>
          </div>
        );
        setStep('not_approved');
      }
    }, 2200);
  };

  const viewTasks = () => {
    addUserMsg('View task breakdown');
    addBotMsg(
      <div className="space-y-2">
        <p className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2">Task Status</p>
        {[
          { label: 'e-KYC Verification', status: 'completed', icon: '🪪' },
          { label: 'Financial Verification', status: 'under_review', icon: '💰' },
          { label: 'Medical Evaluation', status: 'completed', icon: '🏥' },
        ].map(({ label, status, icon }) => (
          <div key={label} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${
            status === 'completed'
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-amber-500/10 border-amber-500/20'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className="text-sm">{icon}</span>
              <span className="text-xs text-white/80">{label}</span>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
              status === 'completed'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}>
              {status === 'completed' ? 'Done' : 'Reviewing'}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const uploadInfo = () => {
    setUploadedInfo(true);
    addUserMsg('Documents uploaded');
    addBotMsg('Thank you! We\'ve received your documents. Submitting for review...');
  };

  const submitInfo = () => {
    addUserMsg('Submit & continue');
    addBotMsg(
      <div className="flex items-center gap-3 py-2">
        <div className="w-8 h-8 rounded-full border-2 border-purple-400/30 border-t-purple-400 animate-spin" />
        <p className="text-sm text-white/70">Re-evaluating your application...</p>
      </div>
    );
    setStep('info_submitted');

    setTimeout(() => {
      const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      addBotMsg(
        <div className="space-y-4">
          <div className="flex flex-col items-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Policy Approved! 🎉</h3>
            <p className="text-emerald-400 text-sm font-medium">Your coverage starts from today</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-400/20 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-purple-400/10">
              <p className="text-white/50 text-[10px] uppercase tracking-widest">ACKO Flexi Life Plan</p>
              <p className="text-white text-xl font-bold mt-0.5">{coverage}</p>
              <p className="text-white/40 text-xs mt-0.5">{storeState.selectedTerm || 30} year term · {premium}</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              {[
                { l: 'Policy Number', v: policyNo },
                { l: 'Policyholder', v: storeState.name || 'Policyholder' },
                { l: 'Start Date', v: today },
                { l: 'Status', v: '● Active' },
              ].map(({ l, v }) => (
                <div key={l} className="flex justify-between">
                  <span className="text-xs text-white/40">{l}</span>
                  <span className={`text-xs font-medium ${v === '● Active' ? 'text-emerald-400' : 'text-white/80'}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      setStep('approved');
    }, 2500);
  };

  const downloadPolicy = () => {
    addUserMsg('Download policy document');
    addBotMsg('Your policy document has been sent to your registered email. You can also download it from the Acko app.');
  };

  const done = () => {
    addUserMsg('Done');
    addBotMsg('Thank you for choosing Acko! Your life insurance is now active. Stay protected. 🛡️');
    setTimeout(() => onComplete(), 1500);
  };

  return {
    state: { step, messages, demoOutcome, uploadedInfo },
    actions: { setDemoOutcome, checkStatus, viewTasks, uploadInfo, submitInfo, downloadPolicy, done },
  };
}


/* ────────────────────────────────────────
   Inline message renderer
   ──────────────────────────────────────── */
export function UnderwritingInlineMessages({ messages }: { messages: UnderwritingMessage[] }) {
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
export function UnderwritingInputWidget({ state, actions }: UseUnderwritingFlowReturn) {
  if (state.step === 'choose_outcome') {
    return (
      <div className="space-y-3">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5 space-y-2">
          <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Demo: simulate outcome</p>
          <div className="flex gap-1.5">
            {([
              { id: 'approved' as const, label: '✅ Approved' },
              { id: 'info_needed' as const, label: '⚠️ Info needed' },
              { id: 'not_approved' as const, label: '❌ Declined' },
            ]).map(({ id, label }) => (
              <button key={id} onClick={() => actions.setDemoOutcome(id)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${
                  state.demoOutcome === id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={actions.checkStatus}
          className="w-full py-3.5 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]">
          Check Status
        </button>
        <button onClick={actions.viewTasks}
          className="w-full py-2.5 text-purple-300 text-xs hover:text-white transition-colors">
          View task breakdown
        </button>
      </div>
    );
  }

  if (state.step === 'approved') {
    return (
      <div className="space-y-2">
        <button onClick={actions.downloadPolicy}
          className="w-full py-3.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-400 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download Policy Document
        </button>
        <button onClick={actions.done}
          className="w-full py-3.5 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]">
          Done
        </button>
      </div>
    );
  }

  if (state.step === 'info_needed') {
    return (
      <div className="space-y-2">
        <button onClick={actions.uploadInfo}
          className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
            state.uploadedInfo
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
          }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          {state.uploadedInfo ? 'Documents uploaded ✓' : 'Upload requested documents'}
        </button>
        <button disabled={!state.uploadedInfo} onClick={actions.submitInfo}
          className="w-full py-3.5 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
          Submit & Continue
        </button>
      </div>
    );
  }

  if (state.step === 'not_approved') {
    return (
      <div className="space-y-2">
        <button className="w-full py-3.5 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]">
          Talk to us · 1800 266 5433
        </button>
        <button onClick={actions.done}
          className="w-full py-2.5 text-purple-300 text-xs hover:text-white transition-colors">
          Close
        </button>
      </div>
    );
  }

  return null;
}
