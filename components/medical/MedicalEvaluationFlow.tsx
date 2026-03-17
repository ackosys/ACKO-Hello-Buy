'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type MedicalStage =
  | 'intro'
  | 'availability_now'
  | 'availability_none'
  | 'slot_picker'
  | 'slot_conflict'
  | 'scheduled'
  | 'call_active'
  | 'post_call_review'
  | 'review_submitting'
  | 'under_review'
  | 'ppmc_intro'
  | 'ppmc_address'
  | 'ppmc_slot'
  | 'ppmc_confirmed'
  | 'ppmc_offline'
  | 'docs_required'
  | 'docs_confirm'
  | 'docs_submitted'
  | 'complete';

export interface MedicalMessage {
  id: string;
  type: 'bot' | 'user';
  content: string | React.ReactNode;
  timestamp: Date;
}

interface SlotSelection {
  dateLabel: string;
  dateIndex: number;
  time: string;
}

const SLOT_DAYS = Array.from({ length: 3 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return {
    idx: i,
    day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
    date: d.getDate(),
    full: d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
  };
});

const SLOT_TIMES = ['9:00 AM', '11:00 AM', '2:00 PM', '5:00 PM'];
const isConflictSlot = (dayIdx: number, time: string) => dayIdx >= 2 && time === '9:00 AM';

const SAVED_ADDRESSES = [
  { id: 'home', label: 'Home', address: 'Flat 4B, Prestige Lakeside Habitat, Whitefield, Bangalore 560066' },
  { id: 'work', label: 'Office', address: 'ACKO Tower, 3rd Floor, Koramangala 5th Block, Bangalore 560095' },
];

const MEDICAL_CONDITIONS = ['Diabetes', 'Hypertension', 'Heart Disease', 'Asthma / COPD', 'None of the above'];
const CONDITION_DOCS: Record<string, string[]> = {
  Diabetes: ['HbA1c report', 'Blood sugar report'],
  Hypertension: ['BP readings', 'ECG report'],
  'Heart Disease': ['ECG & 2D Echo', 'Cardiologist notes'],
  'Asthma / COPD': ['Spirometry report', 'Prescription summary'],
};

export interface MedicalFlowState {
  stage: MedicalStage;
  messages: MedicalMessage[];
  bookedSlot: SlotSelection | null;
  ppBookedSlot: SlotSelection | null;
  joinCountdown: number;
  tobacco: boolean | null;
  alcohol: boolean | null;
  conditions: string[];
  familyHistory: boolean | null;
  uploadedDocs: Record<string, boolean>;
  selectedAddress: string;
  bookingId: string;
  ppBookingId: string;
}

interface UseMedicalFlowOptions {
  skipIntro?: boolean;
}

export interface UseMedicalFlowReturn {
  state: MedicalFlowState;
  actions: {
    handleCheckAvailability: () => void;
    handleJoinNow: () => void;
    handleScheduleLater: () => void;
    handleSlotSelect: (slot: SlotSelection, isForPpmc?: boolean) => void;
    handleContinueToCall: () => void;
    handleEndCall: () => void;
    setTobacco: (v: boolean | null) => void;
    setAlcohol: (v: boolean | null) => void;
    setConditions: (v: string[] | ((p: string[]) => string[])) => void;
    setFamilyHistory: (v: boolean | null) => void;
    handleSubmitReview: () => void;
    handleScheduleHomeTest: () => void;
    handleSkipPpmc: () => void;
    setSelectedAddress: (v: string) => void;
    handlePpmcAddressContinue: () => void;
    setUploadedDocs: (v: Record<string, boolean> | ((p: Record<string, boolean>) => Record<string, boolean>)) => void;
    handleSubmitDocs: () => void;
  };
}

export function useMedicalFlow(onComplete: () => void, options?: UseMedicalFlowOptions): UseMedicalFlowReturn {
  const skipIntro = options?.skipIntro ?? false;
  const [stage, setStage] = useState<MedicalStage>(skipIntro ? 'intro' : 'intro');
  const [messages, setMessages] = useState<MedicalMessage[]>([]);
  const [bookedSlot, setBookedSlot] = useState<SlotSelection | null>(null);
  const [ppBookedSlot, setPpBookedSlot] = useState<SlotSelection | null>(null);
  const [joinCountdown, setJoinCountdown] = useState(300);
  const [tobacco, setTobacco] = useState<boolean | null>(null);
  const [alcohol, setAlcohol] = useState<boolean | null>(null);
  const [conditions, setConditions] = useState<string[]>([]);
  const [familyHistory, setFamilyHistory] = useState<boolean | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});
  const [selectedAddress, setSelectedAddress] = useState('home');
  const [bookingId] = useState(() => `ACKO-MED-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
  const [ppBookingId] = useState(() => `ACKO-HOME-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);

  const addBotMessage = useCallback((content: string | React.ReactNode) => {
    setMessages((prev) => [
      ...prev,
      { id: `med-bot-${Date.now()}-${Math.random()}`, type: 'bot', content, timestamp: new Date() },
    ]);
  }, []);

  const addUserMessage = useCallback((content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `med-user-${Date.now()}-${Math.random()}`, type: 'user', content, timestamp: new Date() },
    ]);
  }, []);

  const flaggedConditions = conditions.filter((c) => c !== 'None of the above' && CONDITION_DOCS[c]);
  const ppmcNeeded = flaggedConditions.length > 0;

  useEffect(() => {
    if (skipIntro) return;
    let mounted = true;
    const run = async () => {
      await new Promise((r) => setTimeout(r, 300));
      if (!mounted) return;
      addBotMessage(
        "Let's complete your medical evaluation (VMER). It's a 15–20 minute video call with a doctor to assess your health."
      );
      await new Promise((r) => setTimeout(r, 600));
      if (!mounted) return;
      addBotMessage(
        <VMERIntroCard />
      );
    };
    run();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (stage !== 'availability_now') return;
    const t = setInterval(() => setJoinCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'call_active') return;
    const t = setTimeout(() => {
      addBotMessage('Call ended. Please review your answers.');
      setStage('post_call_review');
    }, 5000);
    return () => clearTimeout(t);
  }, [stage]);

  const handleCheckAvailability = () => {
    addUserMessage('Check Doctor Availability');
    addBotMessage('Checking doctor availability...');
    setTimeout(() => {
      if (Math.random() < 0.2) {
        addBotMessage('No doctor available right now. Next slot: Today, 4:00 PM');
        setStage('availability_none');
        setTimeout(() => setStage('slot_picker'), 2000);
      } else {
        addBotMessage('Dr. Meera Krishnan is available now!');
        setStage('availability_now');
      }
    }, 1500);
  };

  const handleJoinNow = () => {
    addUserMessage('Join Call Now');
    setStage('call_active');
  };

  const handleScheduleLater = () => {
    addUserMessage('Schedule for later');
    setStage('slot_picker');
  };

  const handleSlotSelect = (slot: SlotSelection, isForPpmc = false) => {
    if (!isForPpmc && isConflictSlot(slot.dateIndex, slot.time)) {
      setBookedSlot(slot);
      addBotMessage(`Sorry, ${slot.time} on ${slot.dateLabel} was just booked. Please pick another slot.`);
      setStage('slot_conflict');
      setTimeout(() => setStage('slot_picker'), 2500);
      return;
    }
    if (isForPpmc) {
      setPpBookedSlot(slot);
      addUserMessage(`${slot.dateLabel}, ${slot.time}`);
      addBotMessage(<PpmcConfirmedCard slot={slot} ppBookingId={ppBookingId} />);
      setStage('ppmc_confirmed');
      setTimeout(() => {
        if (flaggedConditions.length > 0) setStage('docs_required');
        else {
          addBotMessage(<CompleteCard />);
          setStage('complete');
          setTimeout(onComplete, 3000);
        }
      }, 3000);
    } else {
      setBookedSlot(slot);
      addUserMessage(`${slot.dateLabel}, ${slot.time}`);
      addBotMessage(<ScheduledCard slot={slot} bookingId={bookingId} />);
      setStage('scheduled');
    }
  };

  const handleContinueToCall = () => {
    addUserMessage('Continue to Call');
    setStage('call_active');
  };

  const handleEndCall = () => {
    addUserMessage('End Call');
    addBotMessage('Call ended. Please review your answers.');
    setStage('post_call_review');
  };

  const handleSubmitReview = () => {
    addUserMessage('Submit Review');
    addBotMessage('Submitting responses...');
    setStage('review_submitting');
    setTimeout(() => {
      addBotMessage('Responses submitted. Your medical information is under review.');
      setStage('under_review');
      if (ppmcNeeded) {
        setTimeout(() => setStage('ppmc_intro'), 1500);
      } else {
        setTimeout(() => {
          addBotMessage(<CompleteCard />);
          setStage('complete');
          setTimeout(onComplete, 3000);
        }, 1500);
      }
    }, 2000);
  };

  const handleScheduleHomeTest = () => {
    addUserMessage('Schedule Home Test');
    setStage('ppmc_address');
  };

  const handleSkipPpmc = () => {
    addUserMessage('Skip');
    addBotMessage("We'll reach out within 24 hours to schedule at your convenience.");
    setStage('ppmc_offline');
    setTimeout(() => {
      addBotMessage(<CompleteCard />);
      setStage('complete');
      setTimeout(onComplete, 3000);
    }, 2500);
  };

  const handlePpmcAddressContinue = () => {
    addUserMessage('Continue');
    setStage('ppmc_slot');
  };

  const handleSubmitDocs = () => {
    addUserMessage('Submit Documents');
    addBotMessage('Documents uploaded. We\'ll review in 24–48 hours.');
    setStage('docs_submitted');
    setTimeout(() => {
      addBotMessage(<CompleteCard />);
      setStage('complete');
      setTimeout(onComplete, 3000);
    }, 2500);
  };

  return {
    state: {
      stage,
      messages,
      bookedSlot,
      ppBookedSlot,
      joinCountdown,
      tobacco,
      alcohol,
      conditions,
      familyHistory,
      uploadedDocs,
      selectedAddress,
      bookingId,
      ppBookingId,
    },
    actions: {
      handleCheckAvailability,
      handleJoinNow,
      handleScheduleLater,
      handleSlotSelect,
      handleContinueToCall,
      handleEndCall,
      setTobacco,
      setAlcohol,
      setConditions,
      setFamilyHistory,
      handleSubmitReview,
      handleScheduleHomeTest,
      handleSkipPpmc,
      setSelectedAddress,
      handlePpmcAddressContinue,
      setUploadedDocs,
      handleSubmitDocs,
    },
  };
}

function VMERIntroCard() {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-white/90">What is VMER?</p>
      <p className="text-xs text-white/70 leading-relaxed">
        A 15–20 min video call with a doctor. Topics: health history, lifestyle, medications.
      </p>
      <div className="flex items-center gap-2 text-xs text-white/60">
        <span>📹</span> Video call · <span>🔇</span> Quiet location · <span>✅</span> Post-call review
      </div>
    </div>
  );
}

function ScheduledCard({ slot, bookingId }: { slot: SlotSelection; bookingId: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--color-success-subtle)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={{ color: 'var(--color-success-text)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-white">Call Scheduled!</p>
      </div>
      <div className="rounded-xl p-3 text-xs text-white/90" style={{ background: 'var(--color-success-subtle)', border: '1px solid var(--color-success-border)' }}>
        <p><strong>{slot.dateLabel}</strong> · {slot.time}</p>
        <p className="text-white/60 mt-1">Booking ID: {bookingId}</p>
      </div>
    </div>
  );
}

function PpmcConfirmedCard({ slot, ppBookingId }: { slot: SlotSelection; ppBookingId: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--color-success-subtle)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={{ color: 'var(--color-success-text)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-white">Home Test Booked!</p>
      </div>
      <div className="rounded-xl p-3 text-xs text-white/90" style={{ background: 'var(--color-success-subtle)', border: '1px solid var(--color-success-border)' }}>
        <p><strong>{slot.dateLabel}</strong> · {slot.time}</p>
        <p className="text-white/60 mt-1">Booking ID: {ppBookingId}</p>
      </div>
    </div>
  );
}

function CompleteCard() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-success-subtle)' }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={{ color: 'var(--color-success-text)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-white">Medical Evaluation Complete</p>
          <p className="text-xs text-white/60">Your application moves to underwriting review</p>
        </div>
      </div>
    </div>
  );
}

export function MedicalInlineMessages({ messages }: { messages: MedicalMessage[] }) {
  return (
    <>
      {messages.map((message) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 ${message.type === 'user' ? 'flex justify-end' : 'flex items-start gap-3'}`}
        >
          {message.type === 'bot' && (
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-1">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
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

const INPUT_WIDGET_STAGES: MedicalStage[] = [
  'intro',
  'availability_now',
  'slot_picker',
  'scheduled',
  'call_active',
  'post_call_review',
  'ppmc_intro',
  'ppmc_address',
  'ppmc_slot',
  'docs_required',
];

export function MedicalInputWidget({ state, actions }: UseMedicalFlowReturn) {
  const fmtCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const flaggedConditions = state.conditions.filter((c) => c !== 'None of the above' && CONDITION_DOCS[c]);

  if (!INPUT_WIDGET_STAGES.includes(state.stage)) return null;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-lg text-gray-900">
      {state.stage === 'intro' && (
        <div className="space-y-3">
          <div className="rounded-xl p-3 border" style={{ background: 'var(--color-primary-subtle)', borderColor: 'var(--color-info-border)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--color-primary-muted)' }}>VMER — Video Medical Evaluation</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-primary-muted)' }}>15–20 min video call with a doctor</p>
          </div>
          <button
            onClick={actions.handleCheckAvailability}
            className="w-full py-3 text-white rounded-xl text-sm font-semibold active:scale-[0.98] hover:opacity-90"
            style={{ background: 'var(--btn-primary-bg)' }}
          >
            Check Doctor Availability
          </button>
        </div>
      )}

      {state.stage === 'availability_now' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--color-success-subtle)' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ color: 'var(--color-success)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Dr. Meera Krishnan available</p>
              <p className="text-xs text-gray-500">Call starts in {fmtCountdown(state.joinCountdown)}</p>
            </div>
          </div>
          <button onClick={actions.handleJoinNow} className="w-full py-3 text-white rounded-xl text-sm font-semibold active:scale-[0.98] hover:opacity-90" style={{ background: 'var(--color-success)' }}>
            Join Call Now
          </button>
          <button onClick={actions.handleScheduleLater} className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium">
            Schedule for later
          </button>
        </div>
      )}

      {state.stage === 'slot_picker' && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-700">Pick date & time</p>
          <div className="space-y-2">
            {SLOT_DAYS.map((d) => (
              <div key={d.idx} className="flex gap-1.5">
                <span className="w-12 shrink-0 text-[10px] font-medium text-gray-500 pt-1.5">{d.day}</span>
                <div className="flex-1 grid grid-cols-4 gap-1">
                  {SLOT_TIMES.map((t) => {
                    const conflict = isConflictSlot(d.idx, t);
                    return (
                      <button
                        key={`${d.idx}-${t}`}
                        disabled={conflict}
                        onClick={() => !conflict && actions.handleSlotSelect({ dateLabel: d.full, dateIndex: d.idx, time: t })}
                        className={`py-1.5 rounded-lg text-[10px] font-medium border transition-all ${
                          conflict ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed' : 'border-gray-200 hover:opacity-80 text-gray-700'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.stage === 'scheduled' && state.bookedSlot && (
        <div className="space-y-3">
          <div className="rounded-xl p-3 border" style={{ background: 'var(--color-primary-subtle)', borderColor: 'var(--color-info-border)' }}>
            <p className="text-sm font-bold" style={{ color: 'var(--color-primary-muted)' }}>Call Scheduled</p>
            <p className="text-xs" style={{ color: 'var(--color-primary-muted)' }}>{state.bookedSlot.dateLabel}, {state.bookedSlot.time}</p>
          </div>
          <button onClick={actions.handleContinueToCall} className="w-full py-3 text-white rounded-xl text-sm font-semibold active:scale-[0.98] hover:opacity-90" style={{ background: 'var(--btn-primary-bg)' }}>
            Continue to Call
          </button>
        </div>
      )}

      {state.stage === 'call_active' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--color-primary-subtle)' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ color: 'var(--color-text-brand)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Dr. Meera Krishnan</p>
              <p className="text-xs text-emerald-600 font-medium">● Connected</p>
            </div>
          </div>
          <button onClick={actions.handleEndCall} className="w-full py-3 bg-red-500 text-white rounded-xl text-sm font-semibold active:scale-[0.98]">
            End Call
          </button>
        </div>
      )}

      {state.stage === 'post_call_review' && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-700">Health & lifestyle review</p>
          <YesNoRow label="Tobacco/smoking in last year?" value={state.tobacco} onChange={actions.setTobacco} />
          <YesNoRow label="Consume alcohol?" value={state.alcohol} onChange={actions.setAlcohol} />
          <YesNoRow label="Family history (serious before 60)?" value={state.familyHistory} onChange={actions.setFamilyHistory} />
          <div>
            <p className="text-[10px] font-semibold text-gray-500 mb-1">Pre-existing conditions</p>
            <div className="flex flex-wrap gap-1">
              {MEDICAL_CONDITIONS.map((c) => {
                const sel = state.conditions.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => {
                      if (c === 'None of the above') actions.setConditions(sel ? [] : ['None of the above']);
                      else
                        actions.setConditions((p) =>
                          sel ? p.filter((x) => x !== c) : [...p.filter((x) => x !== 'None of the above'), c]
                        );
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${
                      sel ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            onClick={actions.handleSubmitReview}
            disabled={
              state.tobacco === null ||
              state.alcohol === null ||
              state.familyHistory === null ||
              state.conditions.length === 0
            }
            className="w-full py-3 bg-purple-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 active:scale-[0.98]"
          >
            Submit Review
          </button>
        </div>
      )}

      {state.stage === 'ppmc_intro' && (
        <div className="space-y-3">
          <div className="rounded-xl p-3 border" style={{ background: 'var(--color-warning-subtle)', borderColor: 'var(--color-warning-border)' }}>
            <p className="text-xs font-bold" style={{ color: 'var(--color-warning-text)' }}>Additional home tests needed</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-warning-text)' }}>Technician will visit. Fast 12 hrs before.</p>
          </div>
          <button onClick={actions.handleScheduleHomeTest} className="w-full py-3 text-white rounded-xl text-sm font-semibold active:scale-[0.98] hover:opacity-90" style={{ background: 'var(--btn-primary-bg)' }}>
            Schedule Home Test
          </button>
          <button onClick={actions.handleSkipPpmc} className="w-full py-2 text-center text-xs text-gray-500">
            Can't schedule? We'll call you
          </button>
        </div>
      )}

      {state.stage === 'ppmc_address' && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-700">Where should we come?</p>
          {SAVED_ADDRESSES.map((addr) => (
            <button
              key={addr.id}
              onClick={() => actions.setSelectedAddress(addr.id)}
              className={`w-full flex items-start gap-2 px-3 py-2.5 rounded-xl border text-left ${
                state.selectedAddress === addr.id ? '' : 'border-gray-200'
              }`}
              style={state.selectedAddress === addr.id ? { borderColor: 'var(--color-primary)', background: 'var(--color-primary-subtle)' } : undefined}
            >
              <span className="text-sm">{addr.id === 'home' ? '🏠' : '🏢'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800">{addr.label}</p>
                <p className="text-[10px] text-gray-500 truncate">{addr.address}</p>
              </div>
            </button>
          ))}
          <button
            onClick={actions.handlePpmcAddressContinue}
            className="w-full py-3 text-white rounded-xl text-sm font-semibold active:scale-[0.98] hover:opacity-90"
            style={{ background: 'var(--btn-primary-bg)' }}
          >
            Continue
          </button>
        </div>
      )}

      {state.stage === 'ppmc_slot' && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-700">When should technician visit?</p>
          <div className="space-y-2">
            {SLOT_DAYS.map((d) => (
              <div key={d.idx} className="flex gap-1.5">
                <span className="w-12 shrink-0 text-[10px] font-medium text-gray-500 pt-1.5">{d.day}</span>
                <div className="flex-1 grid grid-cols-4 gap-1">
                  {SLOT_TIMES.map((t) => (
                    <button
                      key={`${d.idx}-${t}`}
                      onClick={() => actions.handleSlotSelect({ dateLabel: d.full, dateIndex: d.idx, time: t }, true)}
                      className="py-1.5 rounded-lg text-[10px] font-medium border border-gray-200 hover:opacity-80 text-gray-700"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.stage === 'docs_required' && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-700">Upload documents for flagged conditions</p>
          {flaggedConditions.map((cond) => (
            <div key={cond} className="border border-gray-200 rounded-xl p-2">
              <p className="text-[10px] font-bold text-gray-800 mb-1">{cond}</p>
              <button
                onClick={() => actions.setUploadedDocs((p) => ({ ...p, [cond]: !p[cond] }))}
                className={`w-full py-2 rounded-lg text-[10px] font-medium border ${
                  state.uploadedDocs[cond]
                    ? ''
                    : 'border-dashed'
                }`}
                style={state.uploadedDocs[cond]
                  ? { borderColor: 'var(--color-success-border)', background: 'var(--color-success-subtle)', color: 'var(--color-success-text)' }
                  : { borderColor: 'var(--color-primary-ring)', color: 'var(--color-text-brand)' }}
              >
                {state.uploadedDocs[cond] ? '✓ Uploaded' : 'Upload (PDF, PNG, JPEG)'}
              </button>
            </div>
          ))}
          <button onClick={actions.handleSubmitDocs} className="w-full py-3 text-white rounded-xl text-sm font-semibold active:scale-[0.98] hover:opacity-90" style={{ background: 'var(--btn-primary-bg)' }}>
            Submit Documents
          </button>
        </div>
      )}
    </div>
  );
}

function YesNoRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-[10px] text-gray-600 flex-1">{label}</p>
      <div className="flex gap-1">
        {([true, false] as const).map((opt) => (
          <button
            key={String(opt)}
            onClick={() => onChange(opt)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border ${
              value === opt ? (opt ? 'text-white' : 'border-gray-500 bg-gray-600 text-white') : 'border-gray-200 text-gray-600'
            }`}
            style={value === opt && opt ? { borderColor: 'var(--color-primary)', background: 'var(--btn-primary-bg)' } : undefined}
          >
            {opt ? 'Yes' : 'No'}
          </button>
        ))}
      </div>
    </div>
  );
}

interface MedicalChatFlowProps {
  onComplete: () => void;
}

export default function MedicalEvaluationFlow({ onComplete }: MedicalChatFlowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const medical = useMedicalFlow(onComplete);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current!.scrollHeight, behavior: 'smooth' }), 100);
  }, [medical.state.messages]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-lg mx-auto">
          <MedicalInlineMessages messages={medical.state.messages} />
          <div className="h-4" />
        </div>
      </div>

      <AnimatePresence>
        {INPUT_WIDGET_STAGES.includes(medical.state.stage) && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="shrink-0 shadow-[0_-4px_40px_rgba(0,0,0,0.3)]"
              style={{ background: 'var(--app-glass-bg, var(--motor-glass-bg))', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid var(--app-border, var(--motor-border))' }}
          >
            <div className="max-w-lg mx-auto px-5 py-5 pb-8">
              <MedicalInputWidget {...medical} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
