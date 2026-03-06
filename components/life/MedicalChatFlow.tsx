'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

type MedicalStep =
  | 'intro'
  | 'check_availability'
  | 'doctor_available'
  | 'slot_picker'
  | 'scheduled'
  | 'call_active'
  | 'call_ended'
  | 'review_health'
  | 'review_confirm'
  | 'submitting'
  | 'complete'
  | 'vmer_start'
  | 'vmer_connecting'
  | 'vmer_completed'
  | 'vmer_schedule'
  | 'vmer_scheduled';

export interface MedicalMessage {
  id: string;
  type: 'bot' | 'user';
  content: string | React.ReactNode;
  timestamp: Date;
}

export interface UseMedicalFlowReturn {
  state: {
    step: MedicalStep;
    messages: MedicalMessage[];
    joinCountdown: number;
    selectedSlot: string;
    tobaccoAnswer: boolean | null;
    alcoholAnswer: boolean | null;
    conditionsAnswer: string;
    reviewConfirmed: boolean;
  };
  actions: {
    checkAvailability: () => void;
    joinNow: () => void;
    scheduleLater: () => void;
    selectSlot: (slot: string) => void;
    confirmSlot: () => void;
    joinCall: () => void;
    endCall: () => void;
    setTobacco: (val: boolean) => void;
    setAlcohol: (val: boolean) => void;
    setConditions: (val: string) => void;
    setReviewConfirmed: (val: boolean) => void;
    submitReview: () => void;
  };
}

export function useMedicalFlow(onComplete: () => void, options?: { skipIntro?: boolean }): UseMedicalFlowReturn {
  const skipIntro = options?.skipIntro ?? false;
  const [step, setStep] = useState<MedicalStep>(skipIntro ? 'check_availability' : 'intro');
  const [messages, setMessages] = useState<MedicalMessage[]>([]);
  const [joinCountdown, setJoinCountdown] = useState(300);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [tobaccoAnswer, setTobaccoAnswer] = useState<boolean | null>(null);
  const [alcoholAnswer, setAlcoholAnswer] = useState<boolean | null>(null);
  const [conditionsAnswer, setConditionsAnswer] = useState('');
  const [reviewConfirmed, setReviewConfirmed] = useState(false);

  const addBotMsg = useCallback((content: string | React.ReactNode) => {
    setMessages(prev => [...prev, {
      id: `med-bot-${Date.now()}-${Math.random()}`,
      type: 'bot', content, timestamp: new Date(),
    }]);
  }, []);

  const addUserMsg = useCallback((content: string) => {
    setMessages(prev => [...prev, {
      id: `med-user-${Date.now()}-${Math.random()}`,
      type: 'user', content, timestamp: new Date(),
    }]);
  }, []);

  // Intro message
  useEffect(() => {
    if (skipIntro) return;
    addBotMsg(
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-sm mb-1">Medical Evaluation (VMER)</h3>
            <p className="text-purple-200/70 text-xs">Video Medical Evaluation required for policy issuance</p>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { icon: '📹', text: '15–20 min video call with a licensed doctor' },
            { icon: '🔇', text: 'Quiet, private location needed' },
            { icon: '📋', text: 'Health history, lifestyle, medications covered' },
            { icon: '✅', text: 'Post-call review to confirm answers' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-start gap-2.5">
              <span className="text-sm">{icon}</span>
              <p className="text-white/80 text-xs">{text}</p>
            </div>
          ))}
        </div>
      </div>
    );
    setStep('check_availability');
  }, []);

  // Countdown timer
  useEffect(() => {
    if (step !== 'doctor_available' || joinCountdown <= 0) return;
    const t = setInterval(() => setJoinCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [step, joinCountdown]);

  const checkAvailability = () => {
    addUserMsg('Check doctor availability');
    addBotMsg('Checking availability...');
    setTimeout(() => {
      addBotMsg(
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Dr. Meera Krishnan is available</p>
              <p className="text-purple-200/70 text-xs">MBBS, MD — Available now</p>
            </div>
          </div>
          <p className="text-xs text-white/60">Join now or schedule for later. Ensure camera, mic, and a quiet location.</p>
        </div>
      );
      setStep('doctor_available');
    }, 1500);
  };

  const joinNow = () => {
    addUserMsg('Join now');
    addBotMsg('Connecting to Dr. Meera Krishnan...');
    setTimeout(() => {
      addBotMsg(
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
              </svg>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-purple-900" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Dr. Meera Krishnan</p>
            <p className="text-emerald-400 text-xs font-medium">● Connected</p>
          </div>
        </div>
      );
      setStep('call_active');
    }, 2000);
  };

  const scheduleLater = () => {
    addUserMsg('Schedule for later');
    addBotMsg('Select a time slot for your VMER call.');
    setStep('slot_picker');
  };

  const selectSlotFn = (slot: string) => setSelectedSlot(slot);

  const confirmSlot = () => {
    if (!selectedSlot) return;
    addUserMsg(selectedSlot);
    addBotMsg(
      <div className="space-y-2">
        <p className="text-white font-semibold text-sm">Call Scheduled! 📅</p>
        <p className="text-white/80 text-xs">{selectedSlot}</p>
        <p className="text-xs text-white/50">You'll receive a WhatsApp & SMS reminder 1 hour before with your join link.</p>
      </div>
    );
    setStep('scheduled');
  };

  const joinCall = () => {
    addUserMsg('Join call');
    addBotMsg('Connecting to Dr. Meera Krishnan...');
    setTimeout(() => {
      addBotMsg(
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
              </svg>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-purple-900" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Dr. Meera Krishnan</p>
            <p className="text-emerald-400 text-xs font-medium">● Connected</p>
          </div>
        </div>
      );
      setStep('call_active');
    }, 2000);
  };

  const endCall = () => {
    addUserMsg('End call');
    addBotMsg("Call ended. Now let's review your health information. Please confirm the responses discussed with the doctor.");
    setStep('review_health');
  };

  const setTobacco = (val: boolean) => setTobaccoAnswer(val);
  const setAlcohol = (val: boolean) => setAlcoholAnswer(val);
  const setConditions = (val: string) => setConditionsAnswer(val);

  const submitReview = () => {
    addUserMsg('Review submitted');
    addBotMsg('Submitting your responses...');
    setStep('submitting');

    setTimeout(() => {
      addBotMsg(
        <div className="space-y-3">
          <div className="flex flex-col items-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Medical Evaluation Complete!</h3>
            <p className="text-purple-200/70 text-sm text-center">All responses submitted. Your application is now with the underwriting team.</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 space-y-1.5">
            {[
              { label: 'VMER', value: 'Completed ✓' },
              { label: 'Health review', value: 'Submitted ✓' },
              { label: 'Status', value: 'Under review' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-xs text-white/50">{label}</span>
                <span className="text-xs font-medium text-white/80">{value}</span>
              </div>
            ))}
          </div>
        </div>
      );
      setStep('complete');
      setTimeout(() => onComplete(), 2500);
    }, 2000);
  };

  return {
    state: { step, messages, joinCountdown, selectedSlot, tobaccoAnswer, alcoholAnswer, conditionsAnswer, reviewConfirmed },
    actions: {
      checkAvailability, joinNow, scheduleLater,
      selectSlot: selectSlotFn, confirmSlot, joinCall, endCall,
      setTobacco, setAlcohol, setConditions,
      setReviewConfirmed, submitReview,
    },
  };
}


/* ────────────────────────────────────────
   Inline message renderer
   ──────────────────────────────────────── */
export function MedicalInlineMessages({ messages }: { messages: MedicalMessage[] }) {
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
const TIME_SLOTS = [
  { date: 'Today', slots: ['2:00 PM', '3:30 PM', '5:00 PM'] },
  { date: 'Tomorrow', slots: ['10:00 AM', '11:30 AM', '2:00 PM', '4:00 PM'] },
  { date: 'Day after', slots: ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '5:00 PM'] },
];

export function MedicalInputWidget({ state, actions }: UseMedicalFlowReturn) {
  const fmtCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (state.step === 'check_availability') {
    return (
      <button onClick={actions.checkAvailability}
        className="w-full py-3.5 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]">
        Check Doctor Availability
      </button>
    );
  }

  if (state.step === 'doctor_available') {
    return (
      <div className="space-y-2">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center justify-between mb-1">
          <p className="text-xs text-emerald-300 font-medium">Call starts in</p>
          <span className="text-lg font-bold text-emerald-400 tabular-nums">{fmtCountdown(state.joinCountdown)}</span>
        </div>
        <button onClick={actions.joinNow}
          className="w-full py-3.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-400 transition-all active:scale-[0.98]">
          Join Call Now
        </button>
        <button onClick={actions.scheduleLater}
          className="w-full py-2.5 text-purple-300 text-xs hover:text-white transition-colors">
          Schedule for later instead
        </button>
      </div>
    );
  }

  if (state.step === 'slot_picker') {
    return (
      <div className="space-y-3">
        <p className="text-xs text-purple-200/70 text-center">Pick a date and time</p>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {TIME_SLOTS.map(({ date, slots }) => (
            <div key={date}>
              <p className="text-xs font-semibold text-white/60 mb-1.5">{date}</p>
              <div className="flex flex-wrap gap-1.5">
                {slots.map(time => {
                  const slotKey = `${date}, ${time}`;
                  return (
                    <button key={time} onClick={() => actions.selectSlot(slotKey)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        state.selectedSlot === slotKey
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 border border-white/15 text-white/70 hover:bg-white/20'
                      }`}>
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <button disabled={!state.selectedSlot} onClick={actions.confirmSlot}
          className="w-full py-3.5 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
          Confirm Slot
        </button>
      </div>
    );
  }

  if (state.step === 'scheduled') {
    return (
      <div className="space-y-2">
        <button onClick={actions.joinCall}
          className="w-full py-3.5 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]">
          Join Call (Demo)
        </button>
        <button onClick={actions.scheduleLater}
          className="w-full py-2.5 text-purple-300 text-xs hover:text-white transition-colors">
          Reschedule
        </button>
      </div>
    );
  }

  if (state.step === 'call_active') {
    return (
      <button onClick={actions.endCall}
        className="w-full py-3.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-400 transition-all active:scale-[0.98]">
        End Call & Review Answers
      </button>
    );
  }

  if (state.step === 'review_health') {
    return (
      <div className="space-y-3">
        <p className="text-xs text-purple-200/70 text-center mb-1">Confirm your health information</p>

        <div className="space-y-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-white/80">Tobacco use in last year?</p>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button key={String(val)} onClick={() => actions.setTobacco(val)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    state.tobaccoAnswer === val ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}>
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-white/80">Do you consume alcohol?</p>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button key={String(val)} onClick={() => actions.setAlcohol(val)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    state.alcoholAnswer === val ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}>
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-white/80">Any pre-existing conditions?</p>
            <div className="flex flex-wrap gap-1.5">
              {['None', 'Diabetes', 'Hypertension', 'Heart disease', 'Asthma', 'Other'].map(c => (
                <button key={c} onClick={() => actions.setConditions(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    state.conditionsAnswer === c ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer mt-2">
          <input type="checkbox" checked={state.reviewConfirmed}
            onChange={e => actions.setReviewConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-purple-500 rounded flex-shrink-0" />
          <span className="text-[11px] text-white/50 leading-relaxed">
            I confirm all information is true and accurate to the best of my knowledge.
          </span>
        </label>

        <button
          disabled={state.tobaccoAnswer === null || state.alcoholAnswer === null || !state.conditionsAnswer || !state.reviewConfirmed}
          onClick={actions.submitReview}
          className="w-full py-3.5 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
          Submit & Confirm
        </button>
      </div>
    );
  }

  return null;
}
