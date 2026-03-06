'use client';

/**
 * Life Insurance Chat Container — Full conversational engine for Life journey.
 * Mirrors Health ChatContainer patterns: edit flow, inline/bottom-sheet split,
 * typing indicator, auto-advance, scrolling.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
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
  LifePrePaymentSummary,
  LifeEkycRedirection,
  LifeVmerRedirection,
} from './LifeChatWidgets';
import { LifeRiderCards } from './LifeRiderCards';
import { useFinancialFlow, FinancialInlineMessages, FinancialInputWidget } from './FinancialChatFlow';
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

  const isFinancialStep = currentStepId === 'life_financial';
  const isUnderwritingStep = currentStepId === 'life_underwriting';
  const isChatFlowStep = isFinancialStep || isUnderwritingStep;

  const financial = useFinancialFlow(() => handleResponse('continue'), { skipIntro: true });
  const underwriting = useUnderwritingFlow(() => handleResponse('continue'), { skipIntro: true });

  // Scroll to bottom on new content
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }, 100);
  }, [conversationHistory, isTyping, showWidget, financial.state.messages, underwriting.state.messages]);

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
      userLabel = response === 'skipped' ? "I'll do this later" : 'e-KYC verified ✓';
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
    return ['coverage_card', 'premium_summary', 'rider_cards', 'review_summary', 'post_payment_timeline', 'celebration', 'coverage_input', 'nps_feedback', 'app_download_cta'].includes(step.widgetType);
  };

  const isOverlayWidget = () => {
    const step = getLifeStep(currentStepId);
    if (!step) return false;
    return ['ekyc_screen', 'medical_screen', 'payment_screen'].includes(step.widgetType);
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
      case 'ekyc_screen':
        return <LifeEkycRedirection onComplete={() => handleResponse('continue')} onSkip={() => handleResponse('skipped')} />;
      case 'medical_screen':
        return <LifeVmerRedirection onComplete={() => handleResponse('continue')} />;
      case 'nps_feedback':
        return <LifeNpsFeedback onSubmit={(data) => handleResponse(data)} />;
      case 'app_download_cta':
        return <LifeAppDownloadCta onComplete={() => handleResponse({})} />;
      case 'financial_screen':
      case 'underwriting_status':
        return null;
      default:
        return null;
    }
  };

  const { paymentComplete } = useLifeJourneyStore();

  const POST_PAYMENT_MODULES = new Set(['ekyc', 'financial', 'medical', 'underwriting', 'completion']);

  const paymentMsgIndex = paymentComplete
    ? conversationHistory.findIndex(m => m.type === 'user' && m.content === 'Payment completed ✓')
    : -1;
  const postPaymentMessages = paymentMsgIndex >= 0
    ? conversationHistory.slice(paymentMsgIndex + 1)
    : conversationHistory;
  const showSummary = paymentComplete && paymentMsgIndex >= 0;

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: 'var(--app-chat-gradient, var(--motor-chat-gradient))' }}>
      {/* Scrollable chat messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-lg mx-auto">
          {showSummary && <LifePrePaymentSummary />}

          <AnimatePresence initial={false}>
            {(showSummary ? postPaymentMessages : conversationHistory).map((msg, index, arr) => {
              const isLatestBot = msg.type === 'bot' &&
                index === arr.length - 1 &&
                !isTyping;
              const disableEdit = paymentComplete && !POST_PAYMENT_MODULES.has(msg.module || '');
              return (
                <LifeChatMessage
                  key={msg.id}
                  message={disableEdit ? { ...msg, editable: false } : msg}
                  onEdit={handleEditRequest}
                  animate={isLatestBot}
                />
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
          {showWidget && isUnderwritingStep && (
            <UnderwritingInlineMessages messages={underwriting.state.messages} />
          )}

          <div className="h-4" />
        </div>
      </div>

      {/* Sticky bottom widget for input-type widgets */}
      <AnimatePresence>
        {showWidget && !isLargeWidget() && !isOverlayWidget() && !isChatFlowStep && (
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

      {/* Redirection Widget Bottom Sheet Overlay (KYC, VMER, Financial) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showWidget && (isOverlayWidget() || isFinancialStep) && (
            <LifeRedirectionSheet
              widgetType={getLifeStep(currentStepId)?.widgetType ?? ''}
              onComplete={() => handleResponse('continue')}
              onSkip={() => handleResponse('skipped')}
              financialFlow={isFinancialStep ? financial : undefined}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
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

/* ═══════════════════════════════════════════════════════
   Redirection Bottom Sheet — Motor KYC–style overlay
   for e-KYC, VMER, and Financial verification
   ═══════════════════════════════════════════════════════ */

const SHEET_CONFIG: Record<string, { title: string; subtitle: string; verifySubtitle: string; steps: { step: string; title: string; desc: string }[]; primaryCta: string; secondaryCta?: string; iframeSrc: string; completedLabel: string }> = {
  ekyc_screen: {
    title: 'Complete KYC',
    subtitle: 'HyperVerge, our reliable partner, will handle the KYC process for you with 100% security',
    verifySubtitle: 'Complete the steps below to verify your identity and activate your policy',
    steps: [
      { step: '1', title: 'Verify your identity', desc: 'Upload PAN card or Aadhaar' },
      { step: '2', title: 'Take a quick selfie', desc: 'Face match for security' },
      { step: '3', title: 'Instant confirmation', desc: 'Approved in most cases' },
    ],
    primaryCta: 'Start Verification',
    secondaryCta: "I'll do this later",
    iframeSrc: 'https://example.com',
    completedLabel: "I've Completed Verification",
  },
  medical_screen: {
    title: 'Video Medical Exam',
    subtitle: 'Connect with a doctor for your medical examination via video call',
    verifySubtitle: 'Your video call is being set up. Please wait...',
    steps: [
      { step: '1', title: 'Instant video call', desc: 'Jump on a call with an available doctor now' },
      { step: '2', title: 'Schedule for later', desc: 'Pick a convenient date and time slot' },
    ],
    primaryCta: 'Join Call',
    secondaryCta: 'Schedule for later',
    iframeSrc: 'https://example.com',
    completedLabel: "I've Completed",
  },
};

/* ═══════════════════════════════════════════════════════
   Financial Sheet Content — multi-step income verification
   Employment type → verification method → redirect/upload
   ═══════════════════════════════════════════════════════ */

type FinSubStep = 'choose_type' | 'salaried_methods' | 'business_methods'
  | 'epfo_mobile' | 'epfo_otp' | 'epfo_verifying' | 'epfo_success' | 'epfo_fail'
  | 'aa_info' | 'aa_redirect' | 'aa_success'
  | 'gst_entry' | 'gst_verifying' | 'gst_success' | 'gst_fail'
  | 'doc_upload' | 'doc_submitted'
  | 'verified';

function FinancialSheetContent({ onComplete, onBack, cardStyle, ctaStyle }: {
  onComplete: () => void;
  onBack: () => void;
  cardStyle: React.CSSProperties;
  ctaStyle: React.CSSProperties;
}) {
  const [sub, setSub] = useState<FinSubStep>('choose_type');
  const [history, setHistory] = useState<FinSubStep[]>(['choose_type']);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [gstNumber, setGstNumber] = useState('');
  const [iframeLoading, setIframeLoading] = useState(true);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  const goTo = (s: FinSubStep) => { setHistory(h => [...h, s]); setSub(s); };
  const goBackSub = () => {
    if (history.length > 1) {
      const newH = history.slice(0, -1);
      setHistory(newH);
      setSub(newH[newH.length - 1]);
    } else {
      onBack();
    }
  };

  useEffect(() => {
    if (sub === 'epfo_verifying') {
      const t = setTimeout(() => {
        if (otp.join('') === '000000') goTo('epfo_fail');
        else goTo('epfo_success');
      }, 2500);
      return () => clearTimeout(t);
    }
    if (sub === 'gst_verifying') {
      const t = setTimeout(() => {
        if (gstNumber.length < 15) goTo('gst_fail');
        else goTo('gst_success');
      }, 2500);
      return () => clearTimeout(t);
    }
    if (sub === 'doc_submitted') {
      const t = setTimeout(() => goTo('verified'), 1500);
      return () => clearTimeout(t);
    }
  }, [sub]);

  useEffect(() => {
    if (['epfo_success', 'aa_success', 'gst_success', 'verified'].includes(sub)) {
      const t = setTimeout(() => onComplete(), 2200);
      return () => clearTimeout(t);
    }
  }, [sub]);

  const subtitle = () => {
    switch (sub) {
      case 'choose_type': return 'Select your employment type to begin';
      case 'salaried_methods': return 'Choose how to verify your salaried income';
      case 'business_methods': return 'Choose how to verify your business income';
      case 'epfo_mobile': return 'Enter your EPFO-registered mobile number';
      case 'epfo_otp': return 'Enter OTP sent to your mobile';
      case 'epfo_verifying': case 'gst_verifying': return 'Verifying...';
      case 'aa_info': return 'We will verify your income via your salary account';
      case 'aa_redirect': return 'Complete verification on Anumati';
      case 'gst_entry': return 'Enter your 15-digit GSTIN';
      case 'doc_upload': return 'Upload required documents';
      case 'doc_submitted': return 'Documents are being processed';
      case 'epfo_success': case 'aa_success': case 'gst_success': case 'verified': return 'Income verified successfully';
      case 'epfo_fail': return 'Verification failed — try again or use another method';
      case 'gst_fail': return 'GSTIN verification failed — check the number';
      default: return '';
    }
  };

  const isSuccess = ['epfo_success', 'aa_success', 'gst_success', 'verified', 'doc_submitted'].includes(sub);

  return (
    <>
      <div className="px-5 pt-5 pb-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-[22px] font-bold leading-tight text-white">Verify your income</p>
            <p className="text-[13px] mt-1.5 leading-snug text-white/50">{subtitle()}</p>
          </div>
          <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-white/10">
            <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-2">
        {/* ── Employment Type ── */}
        {sub === 'choose_type' && (
          <div className="space-y-2">
            {[
              { id: 'salaried', icon: '🏢', label: 'Salaried', desc: 'EPFO, Account Aggregator, or salary slips' },
              { id: 'business', icon: '🏪', label: 'Business owner', desc: 'GST verification or financial documents' },
              { id: 'self', icon: '💼', label: 'Self-employed', desc: 'Upload ITR or P&L statements' },
            ].map(({ id, icon, label, desc }) => (
              <button key={id}
                onClick={() => {
                  if (id === 'salaried') goTo('salaried_methods');
                  else if (id === 'business') goTo('business_methods');
                  else goTo('doc_upload');
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-left hover:bg-white/[0.07]"
                style={cardStyle}
              >
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="text-[14px] font-medium text-white">{label}</p>
                  <p className="text-[12px] mt-0.5 text-white/50">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Salaried Methods ── */}
        {sub === 'salaried_methods' && (
          <div className="space-y-2">
            {[
              { id: 'epfo', icon: '📊', label: 'EPFO / Provident Fund', badge: 'Instant' },
              { id: 'aa', icon: '🏦', label: 'Account Aggregator', badge: 'Instant' },
              { id: 'upload', icon: '📄', label: 'Upload salary slips', badge: '24-48h' },
            ].map(({ id, icon, label, badge }) => (
              <button key={id}
                onClick={() => {
                  if (id === 'epfo') goTo('epfo_mobile');
                  else if (id === 'aa') goTo('aa_info');
                  else goTo('doc_upload');
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-left hover:bg-white/[0.07]"
                style={cardStyle}
              >
                <span className="text-xl">{icon}</span>
                <div className="flex-1">
                  <p className="text-[14px] font-medium text-white">{label}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">{badge}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Business Methods ── */}
        {sub === 'business_methods' && (
          <div className="space-y-2">
            {[
              { id: 'gst', icon: '🧾', label: 'GST Verification', badge: 'Instant' },
              { id: 'doc', icon: '📂', label: 'Upload financial documents', badge: '24-48h' },
            ].map(({ id, icon, label, badge }) => (
              <button key={id}
                onClick={() => { if (id === 'gst') goTo('gst_entry'); else goTo('doc_upload'); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-left hover:bg-white/[0.07]"
                style={cardStyle}
              >
                <span className="text-xl">{icon}</span>
                <div className="flex-1">
                  <p className="text-[14px] font-medium text-white">{label}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">{badge}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── EPFO Mobile ── */}
        {sub === 'epfo_mobile' && (
          <div className="space-y-4">
            <div className="flex items-center bg-white/10 border border-white/20 rounded-xl overflow-hidden focus-within:border-purple-400">
              <span className="px-3 py-3 text-sm text-white/50 border-r border-white/10">+91</span>
              <input type="tel" inputMode="numeric" maxLength={10} value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit number"
                className="flex-1 px-3 py-3 text-sm text-white bg-transparent outline-none placeholder:text-white/30" autoFocus />
            </div>
          </div>
        )}

        {/* ── EPFO OTP ── */}
        {sub === 'epfo_otp' && (
          <div className="space-y-4">
            <p className="text-xs text-white/50 text-center">OTP sent to +91 {mobile.slice(0, 5)}xxxxx</p>
            <div className="flex gap-2 justify-center">
              {otp.map((d, i) => (
                <input key={i} ref={el => { digitRefs.current[i] = el; }} type="tel" inputMode="numeric" maxLength={1} value={d}
                  onChange={e => {
                    const next = [...otp]; next[i] = e.target.value.slice(-1).replace(/\D/g, ''); setOtp(next);
                    if (e.target.value && i < 5) digitRefs.current[i + 1]?.focus();
                  }}
                  onKeyDown={e => { if (e.key === 'Backspace' && !d && i > 0) digitRefs.current[i - 1]?.focus(); }}
                  className="w-11 h-12 text-center bg-white/10 border border-white/20 rounded-xl text-white text-lg font-semibold focus:outline-none focus:border-purple-400 transition-colors"
                  autoFocus={i === 0} />
              ))}
            </div>
            <p className="text-[10px] text-center text-white/30">Demo: 000000 = failure, anything else = success</p>
          </div>
        )}

        {/* ── EPFO / GST Verifying ── */}
        {(sub === 'epfo_verifying' || sub === 'gst_verifying') && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: 'rgba(124,58,237,0.4)', borderTopColor: 'transparent' }} />
            <p className="text-sm text-white/50">{sub === 'epfo_verifying' ? 'Verifying with EPFO...' : 'Verifying GSTIN...'}</p>
          </div>
        )}

        {/* ── Account Aggregator Info ── */}
        {sub === 'aa_info' && (
          <div className="space-y-4">
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
            <div className="space-y-2">
              {[
                { num: 1, title: 'Give consent', desc: 'Check details and provide consent' },
                { num: 2, title: 'Connect account', desc: 'Connect with account aggregator using your phone number' },
                { num: 3, title: 'Select & verify', desc: 'Using OTP sent by bank' },
              ].map(({ num, title, desc }) => (
                <div key={num} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl" style={cardStyle}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-500/20 border border-purple-400/30">
                    <span className="text-[12px] font-bold text-purple-300">{num}</span>
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-white">{title}</p>
                    <p className="text-[12px] mt-0.5 text-white/50">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/40 text-center">Powered by Anumati</p>
          </div>
        )}

        {/* ── AA Redirect ── */}
        {sub === 'aa_redirect' && (
          <div className="flex-1 relative overflow-hidden rounded-2xl h-[50vh]" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {iframeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: '#1C1C1F' }}>
                <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(124,58,237,0.4)', borderTopColor: 'transparent' }} />
                <p className="text-[12px] text-white/50">Redirecting to Anumati...</p>
              </div>
            )}
            <iframe src="https://example.com" className="w-full h-full border-0" allow="camera; microphone; geolocation" title="Anumati" onLoad={() => setIframeLoading(false)} />
          </div>
        )}

        {/* ── GST Entry ── */}
        {sub === 'gst_entry' && (
          <div className="space-y-4">
            <input type="text" maxLength={15} value={gstNumber}
              onChange={e => setGstNumber(e.target.value.toUpperCase())}
              placeholder="e.g. 22AAAAA0000A1Z5"
              className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400 transition-colors uppercase font-mono tracking-wider"
              autoFocus />
            <p className="text-[10px] text-center text-white/30">Demo: 15 chars = success, less = failure</p>
          </div>
        )}

        {/* ── Document Upload ── */}
        {sub === 'doc_upload' && (
          <div className="space-y-3">
            <button onClick={() => goTo('doc_submitted')}
              className="w-full flex items-center justify-center gap-2 py-12 rounded-xl border-2 border-dashed border-white/20 hover:border-purple-400 transition-colors">
              <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-sm text-white/60">Tap to upload documents</span>
            </button>
            <p className="text-[10px] text-center text-white/30">PDF, PNG, JPEG. Max 10 MB each</p>
          </div>
        )}

        {/* ── Document Submitted ── */}
        {sub === 'doc_submitted' && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: 'rgba(124,58,237,0.4)', borderTopColor: 'transparent' }} />
            <p className="text-sm text-white/50">Processing documents...</p>
          </div>
        )}

        {/* ── Success States ── */}
        {isSuccess && !['doc_submitted'].includes(sub) && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center pt-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.15 }}
              className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-400/40 flex items-center justify-center mb-5">
              <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-1">Income Verified!</h3>
            <p className="text-sm text-white/50">
              {sub === 'epfo_success' ? 'Verified via EPFO' : sub === 'aa_success' ? 'Verified via Account Aggregator' : sub === 'gst_success' ? 'Verified via GSTIN' : 'Verification complete'}
            </p>
            <div className="mt-5 flex items-center gap-2 text-white/40 text-xs">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" /></svg>
              Setting up your next steps...
            </div>
          </motion.div>
        )}

        {/* ── Failure States ── */}
        {(sub === 'epfo_fail' || sub === 'gst_fail') && (
          <div className="flex flex-col items-center text-center pt-8">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-400/40 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Verification Failed</h3>
            <p className="text-sm text-white/50">{sub === 'epfo_fail' ? 'The OTP was incorrect' : 'GSTIN could not be verified'}</p>
          </div>
        )}
      </div>

      {/* ── Bottom CTAs ── */}
      <div className="px-5 py-4 flex-shrink-0 space-y-2">
        {sub === 'epfo_mobile' && (
          <button disabled={mobile.length < 10} onClick={() => { setOtp(['', '', '', '', '', '']); goTo('epfo_otp'); }}
            className="w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-600/30"
            style={{ background: mobile.length >= 10 ? ctaStyle.background : 'rgba(124,58,237,0.3)', color: '#fff' }}>
            Send OTP
          </button>
        )}
        {sub === 'epfo_otp' && (
          <button disabled={otp.join('').length < 6} onClick={() => goTo('epfo_verifying')}
            className="w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-600/30"
            style={{ background: otp.join('').length >= 6 ? ctaStyle.background : 'rgba(124,58,237,0.3)', color: '#fff' }}>
            Verify OTP
          </button>
        )}
        {sub === 'aa_info' && (
          <button onClick={() => { setIframeLoading(true); goTo('aa_redirect'); }}
            className="w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.97] flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
            style={ctaStyle}>
            Start Verification
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </button>
        )}
        {sub === 'aa_redirect' && (
          <button onClick={() => goTo('aa_success')}
            className="w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.97] shadow-lg shadow-purple-600/30"
            style={ctaStyle}>
            I&apos;ve Completed
          </button>
        )}
        {sub === 'gst_entry' && (
          <button disabled={gstNumber.length < 5} onClick={() => goTo('gst_verifying')}
            className="w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-600/30"
            style={{ background: gstNumber.length >= 5 ? ctaStyle.background : 'rgba(124,58,237,0.3)', color: '#fff' }}>
            Verify GST
          </button>
        )}
        {(sub === 'epfo_fail' || sub === 'gst_fail') && (
          <>
            <button onClick={goBackSub}
              className="w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.97] shadow-lg shadow-purple-600/30"
              style={ctaStyle}>
              Try again
            </button>
            <button onClick={() => goTo(sub === 'epfo_fail' ? 'salaried_methods' : 'business_methods')}
              className="w-full py-2.5 text-[13px] transition-colors text-white/50 hover:text-white/70">
              Use another method
            </button>
          </>
        )}
        {!isSuccess && !['epfo_verifying', 'gst_verifying', 'epfo_fail', 'gst_fail', 'epfo_mobile', 'epfo_otp', 'aa_info', 'aa_redirect', 'gst_entry', 'doc_upload', 'doc_submitted'].includes(sub) && (
          <button onClick={goBackSub} className="w-full py-2.5 text-[13px] transition-colors text-white/50 hover:text-white/70">
            Go back
          </button>
        )}
        {['epfo_mobile', 'epfo_otp', 'aa_info', 'aa_redirect', 'gst_entry', 'doc_upload'].includes(sub) && (
          <button onClick={goBackSub} className="w-full py-2.5 text-[13px] transition-colors text-white/50 hover:text-white/70">
            Go back
          </button>
        )}
      </div>
    </>
  );
}

const VMER_LANGUAGES = ['English', 'Hindi', 'Hinglish', 'Kannada', 'Tamil', 'Malayalam'];
const VMER_TIME_SLOTS = ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM', '6:00 PM'];

function getUpcomingDates(count: number) {
  const dates: { day: string; date: number; month: string; full: string }[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const today = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({ day: dayNames[d.getDay()], date: d.getDate(), month: monthNames[d.getMonth()], full: `${d.getDate()} ${monthNames[d.getMonth()]}` });
  }
  return dates;
}

type SheetStage = 'info' | 'verify' | 'schedule' | 'scheduled' | 'payment_select' | 'payment_processing' | 'payment_success';

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', desc: 'Google Pay, PhonePe, Paytm', icon: (
    <svg className="w-5 h-5 text-purple-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
  )},
  { id: 'card', label: 'Card', desc: 'Visa, Mastercard, RuPay', icon: (
    <svg className="w-5 h-5 text-purple-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
  )},
  { id: 'netbanking', label: 'Net Banking', desc: 'All major banks', icon: (
    <svg className="w-5 h-5 text-purple-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg>
  )},
  { id: 'wallet', label: 'Wallet', desc: 'Paytm, Amazon Pay', icon: (
    <svg className="w-5 h-5 text-purple-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h5.25A2.25 2.25 0 0121 6v6zm0 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V6a2.25 2.25 0 012.25-2.25h13.5" /></svg>
  )},
];

function LifeRedirectionSheet({
  widgetType,
  onComplete,
  onSkip,
  financialFlow,
}: {
  widgetType: string;
  onComplete: () => void;
  onSkip: () => void;
  financialFlow?: ReturnType<typeof useFinancialFlow>;
}) {
  const isPayment = widgetType === 'payment_screen';
  const initialStage: SheetStage = isPayment ? 'payment_select' : 'info';
  const [stage, setStage] = useState<SheetStage>(initialStage);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [selectedLang, setSelectedLang] = useState('English');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const upcomingDates = getUpcomingDates(5);

  const lifeState = useLifeJourneyStore.getState() as LifeJourneyState;
  const formatAmt = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };
  const yearlyPremium = lifeState.quote?.yearlyPremium || 0;

  const config = SHEET_CONFIG[widgetType];
  const isFinancial = !config && !isPayment && financialFlow;
  const isVmer = widgetType === 'medical_screen';

  const handleClose = () => {
    if (stage === 'verify' || stage === 'schedule') {
      setStage(isPayment ? 'payment_select' : 'info');
    } else if (stage === 'scheduled') {
      setStage('info');
    } else if (stage === 'payment_processing' || stage === 'payment_success') {
      return;
    } else {
      onSkip();
    }
  };

  const handlePay = () => {
    if (!selectedPaymentMethod) return;
    setStage('payment_processing');
    setTimeout(() => {
      setStage('payment_success');
      setTimeout(() => onComplete(), 2200);
    }, 2000);
  };

  const headerSubtitle = () => {
    if (stage === 'schedule') return 'Pick a language, date, and time';
    if (stage === 'scheduled') return `${selectedDate} at ${selectedTime}`;
    if (stage === 'verify') return config?.verifySubtitle ?? '';
    if (isPayment) return '';
    return config?.subtitle ?? '';
  };

  const headerTitle = () => {
    if (stage === 'schedule') return 'Schedule VMER Call';
    if (stage === 'scheduled') return 'Call Scheduled';
    if (isPayment) return 'Payment Gateway';
    return config?.title ?? '';
  };

  const cardStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' };
  const ctaStyle = { background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', color: '#fff' };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl flex flex-col"
        style={{ height: '95vh', background: '#1C1C1F', border: '1px solid rgba(255,255,255,0.12)', borderBottom: 'none' }}
      >
        {/* ── Payment Flow ── */}
        {isPayment ? (
          <>
            <div className="px-5 pt-5 pb-3 flex-shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-[13px] text-white/40 font-medium">Payment Gateway</p>
                  {stage !== 'payment_success' && (
                    <p className="text-[11px] mt-0.5 text-white/25">RedirectionFlow &mdash; selection variant with header</p>
                  )}
                </div>
                {stage === 'payment_select' && (
                  <button onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-white/10">
                    <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {stage !== 'payment_success' && (
                <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
                  {/* Merchant header */}
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">ACKO Insurance</p>
                      <p className="text-xs text-white/40">Life Insurance &middot; Term Plan</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-white/40 uppercase">Amount</p>
                      <p className="text-lg font-bold text-white">₹{yearlyPremium.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="px-5 py-4">
                    {stage === 'payment_select' && (
                      <>
                        <h3 className="text-lg font-bold text-white mb-1">Payment Method</h3>
                        <p className="text-xs text-white/40 mb-4">Choose how you&apos;d like to pay</p>
                        <div className="space-y-2.5">
                          {PAYMENT_METHODS.map(method => (
                            <button
                              key={method.id}
                              onClick={() => setSelectedPaymentMethod(method.id)}
                              className="w-full flex items-center gap-3.5 px-4 py-4 rounded-xl transition-all text-left"
                              style={{
                                background: selectedPaymentMethod === method.id ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                                border: selectedPaymentMethod === method.id ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.08)',
                              }}
                            >
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                {method.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white">{method.label}</p>
                                <p className="text-xs text-white/40 mt-0.5">{method.desc}</p>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selectedPaymentMethod === method.id ? 'border-purple-400 bg-purple-500' : 'border-white/20'}`}>
                                {selectedPaymentMethod === method.id && (
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {stage === 'payment_processing' && (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: 'rgba(124,58,237,0.4)', borderTopColor: 'transparent' }} />
                        <p className="text-sm text-white/50">Redirecting to payment gateway...</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {stage === 'payment_success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                >
                  <div className="rounded-2xl overflow-hidden py-10 px-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
                    <div className="flex flex-col items-center text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.15 }}
                        className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-400/40 flex items-center justify-center mb-5"
                      >
                        <motion.svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <motion.path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.3 }} />
                        </motion.svg>
                      </motion.div>
                      <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-xl font-bold text-white mb-1">
                        Payment Successful!
                      </motion.h3>
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="text-white/50 text-sm">
                        {formatAmt(lifeState.selectedCoverage)} coverage secured
                      </motion.p>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-5 flex items-center gap-2 text-white/40 text-xs">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" /></svg>
                        Setting up your next steps...
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {stage === 'payment_select' && (
              <div className="px-5 py-4 flex-shrink-0">
                <button
                  onClick={handlePay}
                  disabled={!selectedPaymentMethod}
                  className="w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-600/30"
                  style={{ background: selectedPaymentMethod ? 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' : 'rgba(124,58,237,0.3)', color: '#fff' }}
                >
                  Pay ₹{yearlyPremium.toLocaleString('en-IN')}
                </button>
                <p className="text-[11px] text-white/30 text-center mt-2">Secure payment &middot; 100% refund if not approved</p>
              </div>
            )}

            {stage === 'payment_processing' && (
              <div className="px-5 py-4 flex-shrink-0">
                <button
                  onClick={onComplete}
                  className="w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.97] shadow-lg shadow-purple-600/30"
                  style={ctaStyle}
                >
                  I&apos;ve Completed
                </button>
              </div>
            )}
          </>
        ) : isFinancial ? (
          <FinancialSheetContent
            onComplete={onComplete}
            onBack={handleClose}
            cardStyle={cardStyle}
            ctaStyle={ctaStyle}
          />
        ) : config ? (
          <>
            {/* Header */}
            <div className="px-5 pt-5 pb-4 flex-shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-[22px] font-bold leading-tight text-white">{headerTitle()}</p>
                  <p className="text-[13px] mt-1.5 leading-snug text-white/50">{headerSubtitle()}</p>
                </div>
                <button onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-white/10">
                  <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {stage === 'info' && (
              <>
                <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-2">
                  {config.steps.map((item) => (
                    <div key={item.step} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl" style={cardStyle}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-500/20 border border-purple-400/30">
                        <span className="text-[12px] font-bold text-purple-300">{item.step}</span>
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-white">{item.title}</p>
                        <p className="text-[12px] mt-0.5 text-white/50">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-4 flex-shrink-0 space-y-2">
                  <button
                    onClick={() => { setStage('verify'); setIframeLoading(true); }}
                    className="w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.97] flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
                    style={ctaStyle}
                  >
                    {config.primaryCta}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                  </button>
                  {isVmer && (
                    <button onClick={() => setStage('schedule')} className="w-full py-2.5 text-[13px] transition-colors text-white/50 hover:text-white/70">
                      Schedule for later
                    </button>
                  )}
                  {!isVmer && config.secondaryCta && (
                    <button onClick={handleClose} className="w-full py-2.5 text-[13px] transition-colors text-white/50 hover:text-white/70">
                      {config.secondaryCta}
                    </button>
                  )}
                </div>
              </>
            )}

            {stage === 'schedule' && (
              <>
                <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-5">
                  <div>
                    <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2.5">Language Preference</p>
                    <div className="flex flex-wrap gap-2">
                      {VMER_LANGUAGES.map(lang => (
                        <button key={lang} onClick={() => setSelectedLang(lang)}
                          className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${selectedLang === lang ? 'bg-purple-500 text-white border border-purple-400' : 'bg-white/5 border border-white/15 text-white/70 hover:bg-white/10'}`}
                        >{lang}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2.5">Pick a Date</p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {upcomingDates.map(d => (
                        <button key={d.full} onClick={() => setSelectedDate(d.full)}
                          className={`flex flex-col items-center px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all shrink-0 min-w-[60px] ${selectedDate === d.full ? 'bg-purple-500 text-white border border-purple-400' : 'bg-white/5 border border-white/15 text-white/70 hover:bg-white/10'}`}
                        >
                          <span className="text-[10px] opacity-60">{d.day}</span>
                          <span className="text-sm font-bold mt-0.5">{d.date} {d.month}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2.5">Pick a Time</p>
                    <div className="flex flex-wrap gap-2">
                      {VMER_TIME_SLOTS.map(time => (
                        <button key={time} onClick={() => setSelectedTime(time)}
                          className={`px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${selectedTime === time ? 'bg-purple-500 text-white border border-purple-400' : 'bg-white/5 border border-white/15 text-white/70 hover:bg-white/10'}`}
                        >{time}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="px-5 py-4 flex-shrink-0">
                  <button
                    disabled={!selectedDate || !selectedTime}
                    onClick={() => setStage('scheduled')}
                    className="w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-600/30"
                    style={{ background: selectedDate && selectedTime ? 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' : 'rgba(124,58,237,0.3)', color: '#fff' }}
                  >
                    Confirm schedule
                  </button>
                </div>
              </>
            )}

            {stage === 'scheduled' && (
              <>
                <div className="flex-1 overflow-y-auto px-5 pb-2">
                  <div className="flex flex-col items-center text-center pt-4 mb-6">
                    <div className="w-14 h-14 rounded-full bg-green-500/20 border-2 border-green-400/40 flex items-center justify-center mb-4">
                      <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Call Scheduled</h3>
                    <p className="text-sm text-white/50">{selectedDate} at {selectedTime}</p>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl mb-4" style={cardStyle}>
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">Language: {selectedLang}</p>
                      <p className="text-xs text-white/40 mt-0.5">You&apos;ll receive a reminder before the call</p>
                    </div>
                  </div>
                </div>
                <div className="px-5 py-4 flex-shrink-0 space-y-2">
                  <button
                    onClick={() => { setStage('verify'); setIframeLoading(true); }}
                    className="w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.97] shadow-lg shadow-purple-600/30"
                    style={ctaStyle}
                  >
                    Join Call
                  </button>
                  <button onClick={() => setStage('schedule')} className="w-full py-2.5 text-[13px] transition-colors text-white/50 hover:text-white/70">
                    Reschedule
                  </button>
                </div>
              </>
            )}

            {stage === 'verify' && (
              <>
                <div className="flex-1 relative overflow-hidden mx-4 rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  {iframeLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: '#1C1C1F' }}>
                      <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'transparent' }} />
                      <p className="text-[12px] text-white/50">Loading…</p>
                    </div>
                  )}
                  <iframe
                    src={config.iframeSrc}
                    className="w-full h-full border-0"
                    allow="camera; microphone; geolocation"
                    title={config.title}
                    onLoad={() => setIframeLoading(false)}
                  />
                </div>
                <div className="px-5 py-4 flex-shrink-0">
                  <button
                    onClick={onComplete}
                    className="w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.97] shadow-lg shadow-purple-600/30"
                    style={ctaStyle}
                  >
                    {config.completedLabel}
                  </button>
                </div>
              </>
            )}
          </>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
