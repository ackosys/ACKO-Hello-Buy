'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '../lib/store';
import { getStep, getCoverageReplyLabel } from '../lib/scripts';
import { saveSnapshot, HEALTH_SAVE_STEPS } from '../lib/journeyPersist';
import ChatMessage, { TypingIndicator } from './ChatMessage';
import {
  SelectionCards,
  MultiSelect,
  NumberInput,
  PincodeInput,
  CalculationTheater,
  PlanSwitcher,
  FrequencySelect,
  ReviewSummary,
  ConsentWidget,
  HealthSummaryCard,
  PaymentWidget,
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

export default function ChatContainer() {
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
      content: `✏️ Updated: ${userLabel}`,
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
      userLabel = 'Date of birth submitted for all members';
    } else if (step.widgetType === 'usp_cards') {
      userLabel = 'Got it, let\'s find a plan';
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
      case 'number_input':
        return <NumberInput placeholder={script.placeholder || ''} subText={script.subText} inputType={script.inputType} min={script.min} max={script.max} onSubmit={handleEditResponse} />;
      case 'pincode_input':
        return <PincodeInput placeholder={script.placeholder || 'Enter pincode'} onSubmit={handleEditResponse} />;
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
      case 'number_input':
        return <NumberInput placeholder={script.placeholder || ''} subText={script.subText} inputType={script.inputType} min={script.min} max={script.max} onSubmit={handleResponse} />;
      case 'pincode_input':
        return <PincodeInput placeholder={script.placeholder || 'Enter pincode'} onSubmit={handleResponse} />;
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
      case 'payment_widget':
        return <PaymentWidget onSuccess={() => handleResponse('paid')} />;
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
      default:
        return null;
    }
  };

  // Check if current widget is a large/complex widget that should be inline
  const isLargeWidget = () => {
    const step = getStep(currentStepId);
    if (!step) return false;
    return ['plan_switcher', 'review_summary', 'payment_widget', 'lab_schedule_widget', 'celebration', 'calculation', 'pdf_upload', 'gap_results', 'confirm_details', 'usp_cards'].includes(step.widgetType);
  };

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
                className="mt-2 mb-4"
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
        {showWidget && !isLargeWidget() && (
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
                <h3 className="text-heading-sm text-white mb-2">Edit this answer?</h3>
                <p className="text-body-sm text-white/50 mb-6">
                  The conversation will continue from this point with your updated answer. Subsequent questions may change based on your new response.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditModal({ stepId: '', visible: false })}
                    className="flex-1 py-2.5 border border-white/20 text-white/70 rounded-xl text-label-md font-medium hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmEdit}
                    className="flex-1 py-2.5 bg-purple-700 text-white rounded-xl text-label-md font-medium hover:bg-purple-600 transition-colors"
                  >
                    Edit answer
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
                <h4 className="text-label-md font-semibold text-white/80">Update your answer</h4>
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
