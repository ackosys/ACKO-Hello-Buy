'use client';

/**
 * Life Insurance Chat Container — Full conversational engine for Life journey.
 * Mirrors Health ChatContainer patterns: edit flow, inline/bottom-sheet split,
 * typing indicator, auto-advance, scrolling.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLifeJourneyStore } from '../../lib/life/store';
import { getLifeStep } from '../../lib/life/scripts';
import { saveSnapshot, LIFE_SAVE_STEPS } from '../../lib/journeyPersist';
import LifeChatMessage, { LifeTypingIndicator } from './LifeChatMessage';
import {
  LifeSelectionCards,
  LifeMultiSelect,
  LifeNumberInput,
  LifeTextInput,
  LifeDatePicker,
  LifeRiderToggle,
  LifeCoverageCard,
  LifePremiumSummary,
  LifeReviewSummary,
  LifePostPaymentTimeline,
  LifeCelebration,
  LifeCoverageInput,
  LifePaymentScreen,
} from './LifeChatWidgets';
import { LifeRiderCards } from './LifeRiderCards';
import { useEkycFlow, EkycInlineMessages, EkycInputWidget } from '../ekyc/EkycChatFlow';
import { useFinancialFlow, FinancialInlineMessages, FinancialInputWidget } from './FinancialChatFlow';
import { useMedicalFlow, MedicalInlineMessages, MedicalInputWidget } from './MedicalChatFlow';
import { useUnderwritingFlow, UnderwritingInlineMessages, UnderwritingInputWidget } from './UnderwritingChatFlow';
import type { LifeJourneyState } from '../../lib/life/types';

export default function LifeChatContainer() {
  const {
    currentStepId,
    conversationHistory,
    isTyping,
    resolvedPersona,
    addMessage,
    updateState,
    updateUserMessage,
    trimAndUpdateFromStep,
  } = useLifeJourneyStore();

  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const processedRef = useRef<Set<string>>(new Set());
  const [showWidget, setShowWidget] = useState(false);

  // Track step history for back navigation
  useEffect(() => {
    const s = useLifeJourneyStore.getState() as any;
    const history: string[] = s.stepHistory ?? [];
    if (history[history.length - 1] !== currentStepId) {
      updateState({ stepHistory: [...history, currentStepId] } as any);
    }
  }, [currentStepId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save drop-off snapshot at key steps
  useEffect(() => {
    if (!LIFE_SAVE_STEPS.has(currentStepId)) return;
    const s = useLifeJourneyStore.getState();
    const quote = (s as any).quote;
    saveSnapshot({
      product: 'life',
      currentStepId,
      savedAt: new Date().toISOString(),
      name: (s as any).name ?? '',
      gender: (s as any).gender ?? '',
      dob: (s as any).dateOfBirth ?? (s as any).dob ?? '',
      coverAmount: (s as any).selectedCoverage || (s as any).recommendedCoverage || 0,
      annualPremium: quote?.yearlyPremium || quote?.totalPremium || 0,
      monthlyPremium: quote?.monthlyPremium || 0,
      paymentComplete: s.paymentComplete,
      ekycComplete: (s as any).ekycComplete ?? false,
      financialComplete: (s as any).financialComplete ?? false,
      medicalComplete: (s as any).medicalComplete ?? false,
      userPath: (s as any).userPath ?? '',
    });
  }, [currentStepId]); // eslint-disable-line react-hooks/exhaustive-deps
  const [editModal, setEditModal] = useState<{ stepId: string; visible: boolean }>({ stepId: '', visible: false });
  const [editingStepId, setEditingStepId] = useState<string | null>(null);

  const isEkycStep = currentStepId === 'life_ekyc';
  const isFinancialStep = currentStepId === 'life_financial';
  const isMedicalStep = currentStepId === 'life_medical_eval';
  const isUnderwritingStep = currentStepId === 'life_underwriting';
  const isChatFlowStep = isEkycStep || isFinancialStep || isMedicalStep || isUnderwritingStep;

  const ekyc = useEkycFlow(() => handleResponse('continue'), { skipIntro: true });
  const financial = useFinancialFlow(() => handleResponse('continue'));
  const medical = useMedicalFlow(() => handleResponse('continue'));
  const underwriting = useUnderwritingFlow(() => handleResponse('continue'));

  // Scroll to bottom on new content
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }, 100);
  }, [conversationHistory, isTyping, showWidget, ekyc.state.messages, financial.state.messages, medical.state.messages, underwriting.state.messages]);

  // Process current step — bot messages + auto-advance for 'none' widgets
  useEffect(() => {
    const step = getLifeStep(currentStepId);
    if (!step) return;

    const currentState = useLifeJourneyStore.getState() as LifeJourneyState;

    // Skip if condition not met
    if (step.condition && !step.condition(currentState)) {
      const nextStepId = step.getNextStep(null, currentState) ?? currentStepId;
      const nextStep = getLifeStep(nextStepId);
      updateState({
        currentStepId: nextStepId,
        currentModule: (nextStep?.module ?? currentState.currentModule) as LifeJourneyState['currentModule'],
      });
      return;
    }

    const key = `${currentStepId}-${currentState.conversationHistory.length}-${currentState.name}-${currentState.age}`;
    if (processedRef.current.has(key)) return;
    processedRef.current.add(key);

    const script = step.getScript(resolvedPersona, currentState);

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

      // Auto-advance for 'none' widget types (educational / transition steps)
      if (step.widgetType === 'none') {
        await new Promise(r => setTimeout(r, 400));
        const freshState = useLifeJourneyStore.getState() as LifeJourneyState;
        const nextStepId = step.getNextStep(null, freshState) ?? currentStepId;
        const nextStep = getLifeStep(nextStepId);
        updateState({
          currentStepId: nextStepId,
          currentModule: (nextStep?.module ?? freshState.currentModule) as LifeJourneyState['currentModule'],
        });
        return;
      }

      setShowWidget(true);
    };

    addBotMessage();
  }, [currentStepId]);

  // Handle edit request
  const handleEditRequest = (stepId: string) => {
    setEditModal({ stepId, visible: true });
  };

  const confirmEdit = () => {
    const { stepId } = editModal;
    setEditModal({ stepId: '', visible: false });
    setEditingStepId(stepId);
  };

  // Handle edit response
  const handleEditResponse = useCallback((response: any) => {
    if (!editingStepId) return;
    const step = getLifeStep(editingStepId);
    if (!step) return;

    const currentState = useLifeJourneyStore.getState() as LifeJourneyState;
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

    trimAndUpdateFromStep(editingStepId, userLabel);

    const stateUpdate = step.processResponse(response, currentState);
    const mergedState = { ...currentState, ...stateUpdate } as LifeJourneyState;
    updateState(stateUpdate);

    setEditingStepId(null);
    setShowWidget(false);
    processedRef.current.clear();

    const nextStepId = step.getNextStep(response, mergedState) ?? currentStepId;
    const nextStep = getLifeStep(nextStepId);
    setTimeout(() => {
      updateState({
        currentStepId: nextStepId,
        currentModule: (nextStep?.module ?? mergedState.currentModule) as LifeJourneyState['currentModule'],
      });
    }, 300);
  }, [editingStepId, resolvedPersona]);

  // Handle response from user widget interaction
  const handleResponse = useCallback((response: any) => {
    const step = getLifeStep(currentStepId);
    if (!step) return;

    const currentState = useLifeJourneyStore.getState() as LifeJourneyState;
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

    // Friendly labels for special widget types
    if (step.widgetType === 'date_picker') {
      userLabel = `DOB: ${response}`;
    } else if (step.widgetType === 'premium_summary') {
      userLabel = 'Reviewed quote, continuing';
    } else if (step.widgetType === 'coverage_input') {
      userLabel = 'Selected coverage & term';
    } else if (step.widgetType === 'payment_screen') {
      userLabel = 'Payment completed ✓';
    } else if (step.widgetType === 'ekyc_screen') {
      userLabel = 'e-KYC verified ✓';
    } else if (step.widgetType === 'financial_screen') {
      userLabel = 'Income verified ✓';
    } else if (step.widgetType === 'medical_screen') {
      userLabel = 'Medical evaluation scheduled ✓';
    } else if (step.widgetType === 'underwriting_status') {
      userLabel = 'Acknowledged';
    } else if (step.widgetType === 'nps_feedback' && response && typeof response === 'object' && response.score) {
      const emojis = ['', '😞', '😕', '😐', '😊', '🤩'];
      userLabel = `${emojis[response.score] || ''} Rated ${response.score}/5`;
    } else if (step.widgetType === 'app_download_cta') {
      userLabel = 'Got it!';
    }

    addMessage({
      type: 'user',
      content: userLabel,
      stepId: currentStepId,
      module: step.module,
      editable: true,
    });

    // Handle end step navigation
    if (currentStepId === 'life_end') {
      setShowWidget(false);
      if (response === 'home') {
        window.location.href = '/';
      } else if (response === 'dashboard') {
        window.location.href = '/';
      }
      return;
    }

    // Handle LOB navigation from explore step
    if (currentStepId === 'life_explore_other_lobs') {
      setShowWidget(false);
      const routes: Record<string, string> = { health: '/health', motor: '/motor', home: '/' };
      const route = routes[response];
      if (route) {
        setTimeout(() => router.push(route), 400);
        return;
      }
    }

    const stateUpdate = step.processResponse(response, useLifeJourneyStore.getState() as LifeJourneyState);
    const mergedState = { ...useLifeJourneyStore.getState(), ...stateUpdate } as LifeJourneyState;
    updateState(stateUpdate);

    setShowWidget(false);
    const nextStepId = step.getNextStep(response, mergedState) ?? currentStepId;
    const nextStep = getLifeStep(nextStepId);
    setTimeout(() => {
      updateState({
        currentStepId: nextStepId,
        currentModule: (nextStep?.module ?? mergedState.currentModule) as LifeJourneyState['currentModule'],
      });
    }, 300);
  }, [currentStepId, resolvedPersona, router]);

  // Determine if widget is large (renders inline in chat) or small (bottom sheet)
  const isLargeWidget = () => {
    const step = getLifeStep(currentStepId);
    if (!step) return false;
    return ['coverage_card', 'premium_summary', 'rider_cards', 'review_summary', 'post_payment_timeline', 'celebration', 'coverage_input', 'payment_screen', 'nps_feedback', 'app_download_cta'].includes(step.widgetType);
  };

  // Render edit widget
  const renderEditWidget = () => {
    if (!editingStepId) return null;
    const step = getLifeStep(editingStepId);
    if (!step) return null;

    const currentState = useLifeJourneyStore.getState() as LifeJourneyState;
    const script = step.getScript(resolvedPersona, currentState);

    switch (step.widgetType) {
      case 'selection_cards':
      case 'yes_no':
        return <LifeSelectionCards options={script.options || []} onSelect={handleEditResponse} />;
      case 'multi_select':
        return <LifeMultiSelect options={script.options || []} onSelect={handleEditResponse} />;
      case 'number_input':
        return <LifeNumberInput placeholder={script.placeholder || ''} subText={script.subText} inputType={script.inputType} min={script.min} max={script.max} onSubmit={handleEditResponse} />;
      case 'text_input':
        return <LifeTextInput placeholder={script.placeholder || ''} inputType={script.inputType} onSubmit={handleEditResponse} />;
      case 'date_picker':
        return <LifeDatePicker placeholder={script.placeholder} onSubmit={handleEditResponse} />;
      case 'rider_toggle':
        return <LifeRiderToggle options={script.options || []} onSelect={handleEditResponse} />;
      default:
        return null;
    }
  };

  // Render widget based on step's widgetType
  const renderWidget = () => {
    const step = getLifeStep(currentStepId);
    if (!step || !showWidget) return null;

    const currentState = useLifeJourneyStore.getState() as LifeJourneyState;
    const script = step.getScript(resolvedPersona, currentState);

    switch (step.widgetType) {
      case 'selection_cards':
        return <LifeSelectionCards options={script.options || []} onSelect={handleResponse} />;
      case 'multi_select':
        return <LifeMultiSelect options={script.options || []} onSelect={handleResponse} />;
      case 'yes_no':
        return <LifeSelectionCards options={script.options || []} onSelect={handleResponse} />;
      case 'number_input':
        return <LifeNumberInput placeholder={script.placeholder || ''} subText={script.subText} inputType={script.inputType} min={script.min} max={script.max} onSubmit={handleResponse} />;
      case 'text_input':
        return <LifeTextInput placeholder={script.placeholder || ''} inputType={script.inputType} onSubmit={handleResponse} />;
      case 'date_picker':
        return <LifeDatePicker placeholder={script.placeholder} onSubmit={handleResponse} />;
      case 'rider_toggle':
        return <LifeRiderToggle options={script.options || []} onSelect={handleResponse} />;
      case 'rider_cards':
        return <LifeRiderCards onContinue={() => handleResponse('continue')} />;
      case 'coverage_card':
        return <LifeCoverageCard coverageAmount={script.coverageAmount || ''} policyTerm={script.policyTerm || ''} coversTillAge={script.coversTillAge || 0} breakdownItems={script.breakdownItems} onContinue={() => handleResponse('continue')} />;
      case 'premium_summary':
        return <LifePremiumSummary onContinue={() => handleResponse('continue')} />;
      case 'celebration':
        return <LifeCelebration onContinue={() => handleResponse('continue')} />;
      case 'coverage_input':
        return <LifeCoverageInput onContinue={() => handleResponse('continue')} />;
      case 'payment_screen':
        return <LifePaymentScreen onContinue={() => handleResponse('continue')} />;
      case 'nps_feedback':
        return <LifeNpsFeedback onSubmit={(data) => handleResponse(data)} />;
      case 'app_download_cta':
        return <LifeAppDownloadCta onComplete={() => handleResponse({})} />;
      case 'ekyc_screen':
      case 'financial_screen':
      case 'medical_screen':
      case 'underwriting_status':
        return null;
      default:
        return null;
    }
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
                <LifeChatMessage key={msg.id} message={msg} onEdit={handleEditRequest} animate={isLatestBot} />
              );
            })}
          </AnimatePresence>

          {isTyping && (
            <div className="mb-4">
              <LifeTypingIndicator />
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

          {/* Chat flow messages render inline */}
          {showWidget && isEkycStep && (
            <EkycInlineMessages messages={ekyc.state.messages} />
          )}
          {showWidget && isFinancialStep && (
            <FinancialInlineMessages messages={financial.state.messages} />
          )}
          {showWidget && isMedicalStep && (
            <MedicalInlineMessages messages={medical.state.messages} />
          )}
          {showWidget && isUnderwritingStep && (
            <UnderwritingInlineMessages messages={underwriting.state.messages} />
          )}

          <div className="h-4" />
        </div>
      </div>

      {/* Sticky bottom widget for input-type widgets */}
      <AnimatePresence>
        {showWidget && !isLargeWidget() && !isChatFlowStep && (
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

        {/* e-KYC input widget at bottom */}
        {showWidget && isEkycStep && (ekyc.state.step === 'aadhaar_input' || ekyc.state.step === 'otp_input') && (
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

        {/* Financial input widget at bottom */}
        {showWidget && isFinancialStep && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="shrink-0 shadow-[0_-4px_40px_rgba(0,0,0,0.3)]"
              style={{ background: 'var(--app-glass-bg, var(--motor-glass-bg))', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid var(--app-border, var(--motor-border))' }}
          >
            <div className="max-w-lg mx-auto px-5 py-5 pb-8">
              <FinancialInputWidget {...financial} />
            </div>
          </motion.div>
        )}

        {/* Medical input widget at bottom */}
        {showWidget && isMedicalStep && (
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

        {/* Underwriting input widget at bottom */}
        {showWidget && isUnderwritingStep && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="shrink-0 shadow-[0_-4px_40px_rgba(0,0,0,0.3)]"
              style={{ background: 'var(--app-glass-bg, var(--motor-glass-bg))', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid var(--app-border, var(--motor-border))' }}
          >
            <div className="max-w-lg mx-auto px-5 py-5 pb-8">
              <UnderwritingInputWidget {...underwriting} />
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
                  The conversation will continue from this point with your updated answer.
                  Subsequent questions may change based on your new response.
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

      {/* Edit Widget Bottom Sheet */}
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
              className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 shadow-2xl px-5 py-6 max-w-lg mx-auto rounded-t-2xl pb-10"
              style={{ background: 'var(--app-glass-bg, var(--motor-glass-bg))', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-label-md font-semibold text-white/80">Update your answer</h4>
                <button onClick={() => setEditingStepId(null)} className="text-white/40 hover:text-white/70 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
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

/* ── NPS Feedback Widget ── */
function LifeNpsFeedback({ onSubmit }: { onSubmit: (data: { score: number; feedback: string }) => void }) {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const emojis = [
    { value: 1, emoji: '😞', label: 'Poor' },
    { value: 2, emoji: '😕', label: 'Fair' },
    { value: 3, emoji: '😐', label: 'Okay' },
    { value: 4, emoji: '😊', label: 'Good' },
    { value: 5, emoji: '🤩', label: 'Loved it!' },
  ];

  const handleSubmit = () => {
    if (score === null) return;
    setSubmitted(true);
    setTimeout(() => onSubmit({ score, feedback }), 800);
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }} className="text-[40px] mb-3">
          {emojis.find(e => e.value === score)?.emoji}
        </motion.div>
        <p className="text-[14px] font-semibold text-white">Thanks for your feedback!</p>
        <p className="text-[12px] text-white/50 mt-1">This helps us improve the experience</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex justify-center gap-3">
        {emojis.map((e) => (
          <button
            key={e.value}
            onClick={() => setScore(e.value)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${score === e.value ? 'bg-white/15 scale-110 border border-purple-400/40' : 'bg-white/5 border border-transparent hover:bg-white/10'}`}
          >
            <span className="text-[28px]">{e.emoji}</span>
            <span className={`text-[10px] font-medium ${score === e.value ? 'text-white' : 'text-white/40'}`}>{e.label}</span>
          </button>
        ))}
      </div>

      {score !== null && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Any suggestions? (optional)"
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[13px] text-white placeholder:text-white/30 resize-none h-20 focus:outline-none focus:border-purple-400/40"
          />
          <button onClick={handleSubmit} className="w-full py-3 rounded-xl text-[14px] font-semibold text-white transition-colors active:scale-[0.97]" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' }}>
            Submit Feedback
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ── App Download CTA Widget ── */
function LifeAppDownloadCta({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="bg-white/10 border border-white/15 rounded-2xl overflow-hidden">
        <div className="px-5 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-white">Get the ACKO App</p>
              <p className="text-[11px] text-white/50">Track your application in real time</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {[
              'Live application & underwriting status',
              'Upload documents anytime',
              'Policy management & renewals',
              '24/7 support at your fingertips',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400/60" />
                <span className="text-[12px] text-white/60">{feature}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button className="flex-1 py-2.5 bg-white/10 border border-white/15 rounded-xl text-[12px] font-medium text-white/80 hover:bg-white/15 transition-colors">
              App Store
            </button>
            <button className="flex-1 py-2.5 bg-white/10 border border-white/15 rounded-xl text-[12px] font-medium text-white/80 hover:bg-white/15 transition-colors">
              Play Store
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={onComplete}
        className="w-full py-3 rounded-xl text-[14px] font-semibold text-white transition-colors active:scale-[0.97]"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' }}
      >
        Continue
      </button>
    </motion.div>
  );
}
