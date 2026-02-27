'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '../lib/store';
import { useT } from '../lib/translations';
import ChatMessage, { TypingIndicator } from './ChatMessage';
import {
  SelectionCards,
  MultiSelect,
  NumberInput,
  PincodeInput,
  FrequencySelect,
} from './ChatWidgets';
import { ConversationStep, StepScript, ChatMessage as ChatMessageType, JourneyState } from '../lib/types';

/* ═══════════════════════════════════════════════════════
   ConversationalFlow — Reusable chat UI component
   Used by PostPaymentJourney and Dashboard
   Same conversational pattern as ChatContainer
   ═══════════════════════════════════════════════════════ */

interface ConversationalFlowProps {
  getStep: (stepId: string) => ConversationStep | undefined;
  initialStepId: string;
  /** Render custom widgets not handled by the built-in set */
  renderCustomWidget?: (
    widgetType: string,
    step: ConversationStep,
    script: StepScript,
    onResponse: (response: any) => void,
    state: JourneyState,
  ) => React.ReactNode | null;
  /** Return true for widget types that should render inline (not in bottom sheet) */
  isLargeWidget?: (widgetType: string) => boolean;
  /** Optional header component rendered above the chat */
  header?: React.ReactNode;
  /** Optional className for the outer container */
  className?: string;
  /** Called when user responds to a step. Return true to prevent default handling (navigation). */
  onStepResponse?: (stepId: string, response: any) => boolean;
}

let msgCounter = 0;

export default function ConversationalFlow({
  getStep,
  initialStepId,
  renderCustomWidget,
  isLargeWidget: isLargeWidgetFn,
  header,
  className,
  onStepResponse,
}: ConversationalFlowProps) {
  const t = useT();
  const {
    resolvedPersona,
    updateState,
  } = useJourneyStore();

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [currentStepId, setCurrentStepId] = useState(initialStepId);
  const [isTyping, setIsTyping] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [editModal, setEditModal] = useState<{ stepId: string; visible: boolean }>({ stepId: '', visible: false });
  const [editingStepId, setEditingStepId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const processedRef = useRef<Set<string>>(new Set());

  // Scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }, 100);
  }, [messages, isTyping, showWidget]);

  // Helper: add message
  const addMessage = useCallback((msg: Omit<ChatMessageType, 'id' | 'timestamp'>) => {
    const fullMsg: ChatMessageType = {
      ...msg,
      id: `cf-${msg.type}-${++msgCounter}`,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, fullMsg]);
  }, []);

  // Helper: trim and update from step
  const trimFromStep = useCallback((stepId: string, newContent: string) => {
    setMessages(prev => {
      const idx = prev.findIndex(m => m.stepId === stepId && m.type === 'user');
      if (idx === -1) return prev;
      const trimmed = prev.slice(0, idx);
      const updated = { ...prev[idx], content: newContent };
      return [...trimmed, updated];
    });
  }, []);

  // Process current step
  useEffect(() => {
    const step = getStep(currentStepId);
    if (!step) return;

    const currentState = useJourneyStore.getState() as JourneyState;

    // Skip if condition not met
    if (step.condition && !step.condition(currentState)) {
      const nextStepId = step.getNextStep(null, currentState);
      setCurrentStepId(nextStepId);
      return;
    }

    const key = `${currentStepId}-${messages.length}-${currentState.postPaymentScenario}-${currentState.doctorCallComplete}`;
    if (processedRef.current.has(key)) return;
    processedRef.current.add(key);

    const script = step.getScript(resolvedPersona, currentState);

    const addBotMessage = async () => {
      setShowWidget(false);
      setIsTyping(true);

      const mergedContent = script.botMessages.join('\n\n');
      const delay = 600 + Math.min(mergedContent.length * 12, 2000);
      await new Promise(r => setTimeout(r, delay));

      addMessage({
        type: 'bot',
        content: mergedContent,
        stepId: currentStepId,
        module: step.module,
      });
      setIsTyping(false);

      // Auto-advance for 'none' widget types
      if (step.widgetType === 'none') {
        await new Promise(r => setTimeout(r, 400));
        const freshState = useJourneyStore.getState() as JourneyState;
        const nextStepId = step.getNextStep(null, freshState);
        if (nextStepId) {
          setCurrentStepId(nextStepId);
        }
        return;
      }

      setShowWidget(true);
    };

    addBotMessage();
  }, [currentStepId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle edit request
  const handleEditRequest = (stepId: string) => {
    setEditModal({ stepId, visible: true });
  };

  const confirmEdit = () => {
    const { stepId } = editModal;
    setEditModal({ stepId: '', visible: false });
    setEditingStepId(stepId);
  };

  // Handle response from inline edit widget
  const handleEditResponse = useCallback((response: any) => {
    if (!editingStepId) return;
    const step = getStep(editingStepId);
    if (!step) return;

    const currentState = useJourneyStore.getState() as JourneyState;
    const script = step.getScript(resolvedPersona, currentState);

    let userLabel = String(response);
    if (step.widgetType === 'nps_feedback' && response && typeof response === 'object' && response.score) {
      const emojis = ['', '😞', '😕', '😐', '😊', '🤩'];
      userLabel = `${emojis[response.score] || ''} Rated ${response.score}/5`;
    } else if (Array.isArray(response)) {
      userLabel = response.map(r => {
        const opt = script.options?.find(o => o.id === r);
        return opt ? opt.label : r;
      }).join(', ');
    } else if (script.options) {
      const opt = script.options.find(o => o.id === response);
      if (opt) userLabel = opt.label;
    }

    // Trim all messages after this step's user message
    trimFromStep(editingStepId, userLabel);

    // Apply the state update
    const stateUpdate = step.processResponse(response, currentState);
    const mergedState = { ...currentState, ...stateUpdate } as JourneyState;
    updateState(stateUpdate);

    setEditingStepId(null);
    setShowWidget(false);

    // Clear processedRef so new steps can be processed
    processedRef.current.clear();

    // Navigate to next step
    const nextStepId = step.getNextStep(response, mergedState);
    setTimeout(() => {
      setCurrentStepId(nextStepId);
    }, 300);
  }, [editingStepId, resolvedPersona, getStep, trimFromStep, updateState]);

  // Handle response
  const handleResponse = useCallback((response: any) => {
    // Let parent intercept if needed (e.g. for navigation)
    if (onStepResponse && onStepResponse(currentStepId, response)) return;

    const step = getStep(currentStepId);
    if (!step) return;

    const currentState = useJourneyStore.getState() as JourneyState;
    const script = step.getScript(resolvedPersona, currentState);

    let userLabel = String(response);
    if (step.widgetType === 'nps_feedback' && response && typeof response === 'object' && response.score) {
      const emojis = ['', '😞', '😕', '😐', '😊', '🤩'];
      userLabel = `${emojis[response.score] || ''} Rated ${response.score}/5`;
    } else if (Array.isArray(response)) {
      userLabel = response.map(r => {
        const opt = script.options?.find(o => o.id === r);
        return opt ? opt.label : r;
      }).join(', ');
    } else if (script.options) {
      const opt = script.options.find(o => o.id === response);
      if (opt) userLabel = opt.label;
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
    setTimeout(() => {
      setCurrentStepId(nextStepId);
    }, 300);
  }, [currentStepId, resolvedPersona, getStep, addMessage, updateState]);

  // Render widget (standard + custom)
  const renderCurrentWidget = () => {
    const step = getStep(currentStepId);
    if (!step || !showWidget) return null;

    const currentState = useJourneyStore.getState() as JourneyState;
    const script = step.getScript(resolvedPersona, currentState);

    // Try custom widget first
    if (renderCustomWidget) {
      const custom = renderCustomWidget(step.widgetType, step, script, handleResponse, currentState);
      if (custom) return custom;
    }

    // Standard widgets
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
      case 'frequency_select':
        return <FrequencySelect onSelect={handleResponse} />;
      default:
        return null;
    }
  };

  // Render edit widget
  const renderEditWidget = () => {
    if (!editingStepId) return null;
    const step = getStep(editingStepId);
    if (!step) return null;

    const currentState = useJourneyStore.getState() as JourneyState;
    const script = step.getScript(resolvedPersona, currentState);

    // Try custom widget first
    if (renderCustomWidget) {
      const custom = renderCustomWidget(step.widgetType, step, script, handleEditResponse, currentState);
      if (custom) return custom;
    }

    switch (step.widgetType) {
      case 'selection_cards':
        return <SelectionCards options={script.options || []} onSelect={handleEditResponse} />;
      case 'multi_select':
        return <MultiSelect options={script.options || []} onSelect={handleEditResponse} />;
      case 'text_input':
      case 'number_input':
        return <NumberInput placeholder={script.placeholder || ''} subText={script.subText} inputType={script.inputType} min={script.min} max={script.max} onSubmit={handleEditResponse} />;
      default:
        return null;
    }
  };

  // Check if current widget is "large" (renders inline in chat, not in bottom sheet)
  const isLargeWidgetType = () => {
    const step = getStep(currentStepId);
    if (!step) return false;
    // Built-in large widgets
    const builtInLarge = ['celebration', 'policy_celebration', 'app_download_cta', 'nps_feedback', 'health_summary_card', 'premium_update_card',
      'scenario_select', 'voice_call', 'call_schedule_picker', 'test_schedule_picker',
      'dashboard_home', 'hospital_picker', 'claim_form', 'document_list', 'member_form',
      'si_selector', 'coverage_chat', 'cancel_rebuttal'];
    if (builtInLarge.includes(step.widgetType)) return true;
    // Custom check
    return isLargeWidgetFn ? isLargeWidgetFn(step.widgetType) : false;
  };

  return (
    <div className={`flex-1 flex flex-col min-h-0 ${className || ''}`} style={{ background: 'var(--app-chat-gradient, var(--motor-chat-gradient))' }}>
      {header}

      {/* Scrollable chat messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-lg mx-auto">
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => {
              const isLatestBot = msg.type === 'bot' &&
                index === messages.length - 1 &&
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
            {showWidget && isLargeWidgetType() && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mt-2 mb-4"
              >
                {renderCurrentWidget()}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-4" />
        </div>
      </div>

      {/* Sticky bottom widget for input-type widgets */}
      <AnimatePresence>
        {showWidget && !isLargeWidgetType() && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="shrink-0 shadow-[0_-4px_40px_rgba(0,0,0,0.3)]"
              style={{ background: 'var(--app-glass-bg, var(--motor-glass-bg))', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid var(--app-border, var(--motor-border))' }}
          >
            <div className="max-w-lg mx-auto px-5 py-5 pb-8">
              {renderCurrentWidget()}
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
                    {t.common.cancel}
                  </button>
                  <button
                    onClick={confirmEdit}
                    className="flex-1 py-2.5 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-label-md font-medium transition-colors"
                  >
                    {t.chat.editAnswer}
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
