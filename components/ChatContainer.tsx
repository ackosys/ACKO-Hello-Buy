'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '../lib/store';
import { getStep, getCoverageReplyLabel } from '../lib/scripts';
import { saveSnapshot, HEALTH_SAVE_STEPS } from '../lib/journeyPersist';
import { useT } from '../lib/translations';
import ChatMessage, { TypingIndicator } from './ChatMessage';
import {
  SelectionCards,
  MultiSelect,
  NumberInput,
  TextInput,
  PincodeInput,
  CalculationTheater,
  PlanSwitcher,
  FrequencySelect,
  ReviewSummary,
  ConsentWidget,
  HealthSummaryCard,
  HealthPaymentSheet,
  LabScheduleWidget,
  HospitalList,
  Celebration,
  PdfUpload,
  GapResultsWidget,
  ConfirmDetailsWidget,
  DobCollectionWidget,
  UspCards,
} from './ChatWidgets';
import { JourneyState } from '../lib/types';
import { useUserProfileStore } from '../lib/userProfileStore';
import { detectPostLoginState, buildPoliciesForState } from '../lib/mockUsers';
import { writeSessionCookie } from '../lib/sessionCookie';

const VALID_OTP = '0000';

function HealthLoginGate({ onSuccess, onSkip }: { onSuccess: (phone: string) => void; onSkip?: () => void }) {
  const t = useT();
  const [gateStep, setGateStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [digits, setDigits] = useState(['', '', '', '']);
  const [otpError, setOtpError] = useState(false);
  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const otpRefs = [ref0, ref1, ref2, ref3];

  const phoneCanSubmit = phone.replace(/\D/g, '').length === 10;

  const handlePhoneSubmit = () => {
    if (!phoneCanSubmit) return;
    setGateStep('otp');
    setTimeout(() => otpRefs[0].current?.focus(), 150);
  };

  const handleOtpChange = (i: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 3) otpRefs[i + 1].current?.focus();
    if (next.every(x => x !== '')) {
      const otp = next.join('');
      if (otp === VALID_OTP) {
        setOtpError(false);
        onSuccess(phone);
      } else {
        setOtpError(true);
        setTimeout(() => { setOtpError(false); setDigits(['', '', '', '']); }, 600);
        setTimeout(() => otpRefs[0].current?.focus(), 650);
      }
    }
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) otpRefs[i - 1].current?.focus();
  };

  return (
    <div className="max-w-sm">
      {gateStep === 'phone' ? (
        <>
          <div
            className="w-full flex items-center rounded-xl overflow-hidden bg-white/10 border border-white/20 focus-within:border-purple-400 focus-within:bg-white/15 transition-colors backdrop-blur-sm"
          >
            <span className="pl-4 pr-2 text-[15px] font-medium shrink-0 text-white/50">+91</span>
            <div className="w-px h-5 shrink-0 bg-white/20" />
            <input
              autoFocus
              type="tel"
              inputMode="numeric"
              placeholder={t.chat.loginPhonePlaceholder}
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              onKeyDown={e => e.key === 'Enter' && phoneCanSubmit && handlePhoneSubmit()}
              className="flex-1 px-3 py-3.5 text-body-md text-white placeholder:text-white/30 outline-none bg-transparent"
            />
          </div>
          <p className="text-caption text-white/40 mt-1.5 text-center">
            {t.chat.loginSaveProgress}
          </p>
          <button
            onClick={handlePhoneSubmit}
            disabled={!phoneCanSubmit}
            className="mt-3 w-full py-3 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-label-lg font-semibold transition-colors active:scale-[0.97] disabled:opacity-40"
          >
            {t.chat.loginSendOtp}
          </button>
          {onSkip && (
            <button
              onClick={onSkip}
              className="mt-2 w-full py-2 text-white/40 hover:text-white/60 text-caption font-medium transition-colors"
            >
              {t.chat.loginSkipForNow}
            </button>
          )}
        </>
      ) : (
        <>
          <p className="text-caption text-white/40 text-center mb-3">
            {t.chat.loginOtpSentTo(phone)}
          </p>
          <motion.div
            className="flex gap-2 justify-center"
            animate={otpError ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {digits.map((d, i) => (
              <input
                key={i}
                ref={otpRefs[i]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                className="w-[60px] h-[52px] text-center text-[20px] font-semibold rounded-xl outline-none transition-all backdrop-blur-sm"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: otpError ? '2px solid #ef4444' : d ? '2px solid #7c3aed' : '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                }}
              />
            ))}
          </motion.div>
          {otpError ? (
            <p className="text-caption text-center mt-2" style={{ color: '#ef4444' }}>{t.chat.loginOtpIncorrect}</p>
          ) : (
            <p className="text-caption text-white/40 text-center mt-2">{t.chat.loginOtpHint}</p>
          )}
        </>
      )}
    </div>
  );
}

export default function ChatContainer() {
  const t = useT();
  const {
    currentStepId,
    conversationHistory,
    isTyping,
    resolvedPersona,
    addMessage,
    updateState,
    updateUserMessage,
    trimAndUpdateFromStep,
  } = useJourneyStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const processedRef = useRef<Set<string>>(new Set());
  const [showWidget, setShowWidget] = useState(false);

  // Save drop-off snapshot at key steps
  useEffect(() => {
    if (!HEALTH_SAVE_STEPS.has(currentStepId)) return;
    const s = useJourneyStore.getState();
    saveSnapshot({
      product: 'health',
      currentStepId,
      savedAt: new Date().toISOString(),
      userName: s.userName,
      members: s.members.map(m => ({ relation: m.relation, age: m.age, name: m.name })),
      pincode: s.pincode,
      selectedPlan: s.selectedPlan ? { name: s.selectedPlan.name, monthlyPremium: s.selectedPlan.monthlyPremium, yearlyPremium: s.selectedPlan.yearlyPremium, sumInsured: s.selectedPlan.sumInsured, tier: s.selectedPlan.tier } : null,
      paymentComplete: s.paymentComplete,
      paymentFrequency: s.paymentFrequency,
      currentPremium: s.currentPremium,
      testScheduledDate: s.testScheduledDate,
      testScheduledLab: s.testScheduledLab,
      postPaymentPhase: s.postPaymentPhase,
    });
  }, [currentStepId]); // eslint-disable-line react-hooks/exhaustive-deps
  const [editModal, setEditModal] = useState<{ stepId: string; visible: boolean }>({ stepId: '', visible: false });
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const editFromReviewRef = useRef(false);

  // Scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }, 100);
  }, [conversationHistory, isTyping, showWidget]);

  // Process current step
  useEffect(() => {
    const step = getStep(currentStepId);
    if (!step) return;

    const currentState = useJourneyStore.getState() as JourneyState;

    // Skip if condition not met
    if (step.condition && !step.condition(currentState)) {
      const nextStepId = step.getNextStep(null, currentState);
      const nextStep = getStep(nextStepId);
      updateState({
        currentStepId: nextStepId,
        currentModule: nextStep?.module || currentState.currentModule,
      });
      return;
    }

    // Use stepId only as the key — prevents duplicate bot messages when React re-renders (e.g. triple DOB ack)
    const key = currentStepId;
    if (processedRef.current.has(key)) return;
    processedRef.current.add(key);

    const script = step.getScript(resolvedPersona, currentState);

    // Add bot messages as SINGLE merged message
    const addBotMessage = async () => {
      setShowWidget(false);
      updateState({ isTyping: true });

      const mergedContent = script.botMessages.join('\n\n');
      const delay = 600 + Math.min(mergedContent.length * 12, 2000);
      await new Promise(r => setTimeout(r, delay));

      addMessage({
        type: 'bot',
        content: mergedContent,
        stepId: currentStepId,
        module: step.module,
      });
      updateState({ isTyping: false });

      // Auto-advance for 'none' widget types
      if (step.widgetType === 'none') {
        await new Promise(r => setTimeout(r, 400));
        const freshState = useJourneyStore.getState() as JourneyState;
        const nextStepId = step.getNextStep(null, freshState);
        const nextStep = getStep(nextStepId);
        updateState({
          currentStepId: nextStepId,
          currentModule: nextStep?.module || freshState.currentModule,
        });
        return;
      }

      setShowWidget(true);
    };

    addBotMessage();
  }, [currentStepId]);

  // Handle edit
  const handleEditRequest = (stepId: string) => {
    setEditModal({ stepId, visible: true });
  };

  const confirmEdit = () => {
    const { stepId } = editModal;
    setEditModal({ stepId: '', visible: false });
    setEditingStepId(stepId);
  };

  // Handle response from the inline edit widget
  const handleEditResponse = useCallback((response: any) => {
    if (!editingStepId) return;
    const step = getStep(editingStepId);
    if (!step) return;

    const currentState = useJourneyStore.getState() as JourneyState;
    const script = step.getScript(resolvedPersona, currentState);

    let userLabel = String(response);
    if (Array.isArray(response)) {
      userLabel = response.map(r => {
        const opt = script.options?.find(o => o.id === r);
        return opt ? opt.label : r;
      }).join(', ');
    } else if (script.options) {
      const opt = script.options.find(o => o.id === response);
      if (opt) userLabel = opt.label;
    }

    // Personalised reply for "who to cover" (feedback #13)
    if (step.id === 'family.who_to_cover' && Array.isArray(response)) {
      const stateUpdate = step.processResponse(response, currentState);
      const merged = { ...currentState, ...stateUpdate } as JourneyState;
      userLabel = getCoverageReplyLabel(merged.coverageFor || [], merged.numChildren ?? 0, merged.language || 'en');
    }

    // Plan switcher: PlanSwitcher already updates store.selectedPlan internally
    if (step.widgetType === 'plan_switcher') {
      const tierLabels: Record<string, string> = { platinum: 'Platinum', platinum_lite: 'Platinum Lite', super_topup: 'Super Top-up' };
      userLabel = tierLabels[response] || response;
    }

    // Preserve full chat history — append an "Updated" user message instead of trimming
    addMessage({
      type: 'user',
      content: t.chat.updatedPrefix(userLabel),
      stepId: editingStepId,
    });

    // Apply the state update from the new response
    const stateUpdate = step.processResponse(response, currentState);
    const mergedState = { ...currentState, ...stateUpdate } as JourneyState;
    updateState(stateUpdate);

    setEditingStepId(null);
    setShowWidget(false);

    // Clear processedRef so new steps can be processed fresh from this point
    processedRef.current.clear();

    // Navigate to the correct next step based on new response
    const nextStepId = step.getNextStep(response, mergedState);
    const nextStep = getStep(nextStepId);
    setTimeout(() => {
      updateState({
        currentStepId: nextStepId,
        currentModule: nextStep?.module || mergedState.currentModule,
      });
    }, 300);
  }, [editingStepId, resolvedPersona, addMessage]);

  // Handle response
  const handleResponse = useCallback((response: any) => {
    const step = getStep(currentStepId);
    if (!step) return;

    const currentState = useJourneyStore.getState() as JourneyState;
    const script = step.getScript(resolvedPersona, currentState);

    let userLabel = String(response);
    if (Array.isArray(response)) {
      userLabel = response.map(r => {
        const opt = script.options?.find(o => o.id === r);
        return opt ? opt.label : r;
      }).join(', ');
    } else if (script.options) {
      const opt = script.options.find(o => o.id === response);
      if (opt) userLabel = opt.label;
    }

    // Personalised reply for "who to cover" (feedback #13)
    if (step.id === 'family.who_to_cover' && Array.isArray(response)) {
      const stateUpdate = step.processResponse(response, currentState);
      const merged = { ...currentState, ...stateUpdate } as JourneyState;
      userLabel = getCoverageReplyLabel(merged.coverageFor || [], merged.numChildren ?? 0, merged.language || 'en');
    }

    // Friendly labels for special widget types
    if (step.widgetType === 'plan_switcher') {
      const tierLabels: Record<string, string> = { platinum: 'Platinum', platinum_lite: 'Platinum Lite', super_topup: 'Super Top-up' };
      userLabel = tierLabels[response] || response;
    } else if (step.widgetType === 'dob_collection') {
      userLabel = t.chat.dobSubmitted;
    } else if (step.widgetType === 'usp_cards') {
      userLabel = t.chat.gotItFindPlan;
    }

    addMessage({
      type: 'user',
      content: userLabel,
      stepId: currentStepId,
      module: step.module,
      editable: true,
    });

    const stateUpdate = step.processResponse(response, useJourneyStore.getState() as JourneyState);
    const mergedState = { ...useJourneyStore.getState(), ...stateUpdate } as JourneyState;
    updateState(stateUpdate);

    setShowWidget(false);
    const nextStepId = step.getNextStep(response, mergedState);
    const nextStep = getStep(nextStepId);
    setTimeout(() => {
      updateState({
        currentStepId: nextStepId,
        currentModule: nextStep?.module || mergedState.currentModule,
      });
    }, 300);
  }, [currentStepId, resolvedPersona]);

  const { setProfile, addPolicy } = useUserProfileStore();

  const handleLoginGateSuccess = useCallback((phone: string) => {
    const state = detectPostLoginState(phone);
    const firstName = useUserProfileStore.getState().firstName || '';
    setProfile({ firstName, phone: `+91${phone}`, isLoggedIn: true, policies: [] });
    buildPoliciesForState(state).forEach(p => addPolicy(p));
    writeSessionCookie({ firstName });

    addMessage({ type: 'user', content: t.chat.phoneVerified, stepId: 'login.phone_gate', module: 'recommendation' });
    setShowWidget(false);

    setTimeout(() => {
      updateState({
        currentStepId: 'recommendation.result',
        currentModule: 'recommendation',
      });
    }, 300);
  }, [setProfile, addPolicy, addMessage, updateState]);

  const handleEarlyLoginSuccess = useCallback((phone: string) => {
    const state = detectPostLoginState(phone);
    const firstName = useUserProfileStore.getState().firstName || '';
    setProfile({ firstName, phone: `+91${phone}`, isLoggedIn: true, policies: [] });
    buildPoliciesForState(state).forEach(p => addPolicy(p));
    writeSessionCookie({ firstName });

    addMessage({ type: 'user', content: t.chat.phoneVerified, stepId: 'login.early_gate', module: 'entry' });
    setShowWidget(false);

    const currentState = useJourneyStore.getState() as JourneyState;
    const step = getStep('login.early_gate');
    const nextStepId = step?.getNextStep('verified', currentState) || 'intent.readiness';
    const nextStep = getStep(nextStepId);

    setTimeout(() => {
      updateState({
        currentStepId: nextStepId,
        currentModule: nextStep?.module || 'intent',
      });
    }, 300);
  }, [setProfile, addPolicy, addMessage, updateState]);

  const handleEarlyLoginSkip = useCallback(() => {
    addMessage({ type: 'user', content: t.chat.skippedForNow, stepId: 'login.early_gate', module: 'entry' });
    setShowWidget(false);

    const currentState = useJourneyStore.getState() as JourneyState;
    const step = getStep('login.early_gate');
    const nextStepId = step?.getNextStep('skipped', currentState) || 'intent.readiness';
    const nextStep = getStep(nextStepId);

    setTimeout(() => {
      updateState({
        currentStepId: nextStepId,
        currentModule: nextStep?.module || 'intent',
      });
    }, 300);
  }, [addMessage, updateState]);

  // Render edit widget (for in-place editing)
  const renderEditWidget = () => {
    if (!editingStepId) return null;
    const step = getStep(editingStepId);
    if (!step) return null;

    const currentState = useJourneyStore.getState() as JourneyState;
    const script = step.getScript(resolvedPersona, currentState);

    switch (step.widgetType) {
      case 'selection_cards':
        return <SelectionCards options={script.options || []} onSelect={handleEditResponse} />;
      case 'multi_select':
        return <MultiSelect options={script.options || []} onSelect={handleEditResponse} />;
      case 'text_input':
        return <TextInput placeholder={script.placeholder || ''} inputType={script.inputType} onSubmit={handleEditResponse} />;
      case 'number_input':
        return <NumberInput placeholder={script.placeholder || ''} subText={script.subText} inputType={script.inputType} min={script.min} max={script.max} onSubmit={handleEditResponse} />;
      case 'pincode_input':
        return <PincodeInput placeholder={script.placeholder || t.widgets.enterPincode} onSubmit={handleEditResponse} />;
      case 'frequency_select':
        return <FrequencySelect onSelect={handleEditResponse} />;
      case 'plan_switcher':
        return <PlanSwitcher onSelect={handleEditResponse} />;
      default:
        return null;
    }
  };

  // Check if the edit widget requires a full-size overlay (not bottom sheet)
  const isLargeEditWidget = () => {
    if (!editingStepId) return false;
    const step = getStep(editingStepId);
    return step?.widgetType === 'plan_switcher';
  };

  // Render widget
  const renderWidget = () => {
    const step = getStep(currentStepId);
    if (!step || !showWidget) return null;

    const currentState = useJourneyStore.getState() as JourneyState;
    const script = step.getScript(resolvedPersona, currentState);

    switch (step.widgetType) {
      case 'selection_cards':
        return <SelectionCards options={script.options || []} onSelect={handleResponse} />;
      case 'multi_select':
        return <MultiSelect options={script.options || []} onSelect={handleResponse} />;
      case 'text_input':
        return <TextInput placeholder={script.placeholder || ''} inputType={script.inputType} onSubmit={handleResponse} />;
      case 'number_input':
        return <NumberInput placeholder={script.placeholder || ''} subText={script.subText} inputType={script.inputType} min={script.min} max={script.max} onSubmit={handleResponse} />;
      case 'pincode_input':
        return <PincodeInput placeholder={script.placeholder || t.widgets.enterPincode} onSubmit={handleResponse} />;
      case 'calculation':
        return <CalculationTheater onComplete={() => handleResponse('done')} />;
      case 'plan_switcher':
        return <PlanSwitcher onSelect={handleResponse} />;
      case 'frequency_select':
        return <FrequencySelect onSelect={handleResponse} />;
      case 'review_summary':
        return <ReviewSummary onConfirm={() => handleResponse('confirmed')} onEditField={(stepId) => handleEditRequest(stepId)} />;
      case 'health_summary_card':
        return <HealthSummaryCard onConfirm={() => handleResponse('confirmed')} />;
      case 'consent':
        return <ConsentWidget onConfirm={() => handleResponse('agreed')} links={script.links} consentText={script.consentText} />;
      case 'dob_collection':
        return <DobCollectionWidget onConfirm={(resp: string) => handleResponse(resp)} />;
      case 'usp_cards':
        return <UspCards onContinue={() => handleResponse('seen_usps')} />;
      case 'lab_schedule_widget':
        return <LabScheduleWidget onComplete={() => handleResponse('scheduled')} />;
      case 'hospital_list':
        return <HospitalList onContinue={() => handleResponse('seen')} />;
      case 'pdf_upload':
        return <PdfUpload onUpload={() => handleResponse('uploaded')} />;
      case 'gap_results':
        return <GapResultsWidget onContinue={() => handleResponse('continue')} />;
      case 'confirm_details':
        return <ConfirmDetailsWidget onConfirm={() => handleResponse('confirmed')} />;
      case 'celebration':
        return <Celebration />;
      case 'login_gate':
        return <HealthLoginGate onSuccess={handleLoginGateSuccess} />;
      case 'login_gate_skippable':
        return <HealthLoginGate onSuccess={handleEarlyLoginSuccess} onSkip={handleEarlyLoginSkip} />;
      default:
        return null;
    }
  };

  // Check if current widget is a large/complex widget that should be inline
  const isLargeWidget = () => {
    const step = getStep(currentStepId);
    if (!step) return false;
    return ['plan_switcher', 'review_summary', 'lab_schedule_widget', 'celebration', 'calculation', 'pdf_upload', 'gap_results', 'confirm_details', 'usp_cards'].includes(step.widgetType);
  };

  const isOverlayWidget = () => false;

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: 'var(--app-chat-gradient, var(--motor-chat-gradient))' }}>
      {/* Scrollable chat messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-lg mx-auto">
          <AnimatePresence initial={false}>
            {conversationHistory.map((msg, index) => {
              const isLatestBot = msg.type === 'bot' &&
                index === conversationHistory.length - 1 &&
                !isTyping;
              return (
                <ChatMessage key={msg.id} message={msg} onEdit={handleEditRequest} animate={isLatestBot} />
              );
            })}
          </AnimatePresence>

          {isTyping && (
            <div className="mb-4">
              <TypingIndicator />
            </div>
          )}

          {/* Large widgets render inline in the chat */}
          <AnimatePresence>
            {showWidget && isLargeWidget() && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mt-2 mb-4 ml-11"
              >
                {renderWidget()}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-4" />
        </div>
      </div>

      {/* Sticky bottom widget for input-type widgets */}
      <AnimatePresence>
        {showWidget && !isLargeWidget() && !isOverlayWidget() && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="shrink-0 shadow-[0_-4px_40px_rgba(0,0,0,0.3)]"
              style={{ background: 'var(--app-glass-bg, var(--motor-glass-bg))', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid var(--app-border, var(--motor-border))' }}
          >
            <div className="max-w-lg mx-auto px-5 py-5 pb-8">
              {renderWidget()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Confirmation Modal */}
      <AnimatePresence>
        {editModal.visible && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50"
              onClick={() => setEditModal({ stepId: '', visible: false })}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto border border-white/15 rounded-2xl shadow-2xl z-50 p-6"
              style={{ background: 'var(--app-glass-bg, var(--motor-glass-bg))', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h3 className="text-heading-sm text-white mb-2">{t.chat.editThisAnswer}</h3>
                <p className="text-body-sm text-white/50 mb-6">
                  {t.chat.editWarning}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditModal({ stepId: '', visible: false })}
                    className="flex-1 py-2.5 border border-white/20 text-white/70 rounded-xl text-label-md font-medium hover:bg-white/10 transition-colors"
                  >
                    {t.chat.cancel}
                  </button>
                  <button
                    onClick={confirmEdit}
                    className="flex-1 py-2.5 bg-purple-700 text-white rounded-xl text-label-md font-medium hover:bg-purple-600 transition-colors"
                  >
                    {t.chat.editAnswer}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Payment Bottom Sheet Overlay */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showWidget && isOverlayWidget() && (
            <HealthPaymentSheet
              onComplete={() => handleResponse('paid')}
              onSkip={() => handleResponse('paid')}
            />
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Edit Widget Bottom Sheet / Full Overlay */}
      <AnimatePresence>
        {editingStepId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50"
              onClick={() => setEditingStepId(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`fixed inset-x-0 z-50 border-t border-white/10 shadow-2xl px-5 py-6 max-w-lg mx-auto ${
                isLargeEditWidget()
                  ? 'bottom-0 top-16 rounded-t-2xl overflow-y-auto pb-10'
                  : 'bottom-0 rounded-t-2xl pb-10'
              }`}
              style={{ background: 'var(--app-glass-bg, var(--motor-glass-bg))', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-label-md font-semibold text-white/80">{t.chat.updateAnswer}</h4>
                <button onClick={() => setEditingStepId(null)} className="text-white/40 hover:text-white/70 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              {renderEditWidget()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
