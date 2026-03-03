'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMotorStore } from '../../lib/motor/store';
import { getMotorStep } from '../../lib/motor/scripts';
import { MotorJourneyState } from '../../lib/motor/types';
import { saveSnapshot, MOTOR_SAVE_STEPS } from '../../lib/journeyPersist';
import { saveRecentVehicle, getBrandLogoUrl } from '../../lib/motorRecentVehicles';
import ChatMessage, { TypingIndicator } from '../ChatMessage';
import { ChatMessage as ChatMessageType } from '@/lib/types';
import {
  MotorSelectionCards,
  VehicleRegInput,
  ProgressiveLoader,
  VehicleDetailsCard,
  BrandSelector,
  ModelSelector,
  VariantSelector,
  YearSelector,
  NcbSelector,
  NcbReward,
  InsurerSelector,
  EditableSummary,
  RejectionScreen,
  PlanCalculator,
  PlanSelector,
  PlanRecommendation,
  OutOfPocketAddons,
  ProtectEveryoneAddons,
  MotorTextInput,
} from './MotorWidgets';
import { PremiumBreakdown, PaymentGateway, MotorCelebration, PolicyTracker, NpsFeedback, AppDownloadCta } from './MotorFinalWidgets';

export default function MotorChatContainer() {
  const {
    currentStepId,
    conversationHistory,
    isTyping,
    addMessage,
    updateState,
    trimAndUpdateFromStep,
  } = useMotorStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const processedRef = useRef<Set<string>>(new Set());
  const [showWidget, setShowWidget] = useState(false);
  const [editModal, setEditModal] = useState<{ stepId: string; visible: boolean }>({ stepId: '', visible: false });
  const [editingStepId, setEditingStepId] = useState<string | null>(null);

  // Save drop-off snapshot at key steps
  useEffect(() => {
    if (!MOTOR_SAVE_STEPS.has(currentStepId)) return;
    const s = useMotorStore.getState();
    saveSnapshot({
      product: s.vehicleType ?? 'car',
      currentStepId,
      savedAt: new Date().toISOString(),
      vehicleType: s.vehicleType,
      vehicleData: {
        make: s.vehicleData.make,
        model: s.vehicleData.model,
        variant: s.vehicleData.variant,
        fuelType: s.vehicleData.fuelType,
        registrationYear: s.vehicleData.registrationYear,
      },
      registrationNumber: s.registrationNumber,
      totalPremium: s.totalPremium,
      selectedPlanType: s.selectedPlanType,
      ownerName: s.ownerName,
      paymentComplete: s.paymentComplete,
    });
  }, [currentStepId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist vehicle to recent list once make+model are confirmed
  useEffect(() => {
    const s = useMotorStore.getState();
    if (!s.vehicleData.make || !s.vehicleData.model) return;
    const confirmationSteps = new Set([
      'vehicle_fetch.found',
      'manual_entry.select_year',
      'brand_new.commercial_check',
      'acko_drive.browse_variant',
    ]);
    if (!confirmationSteps.has(currentStepId)) return;
    saveRecentVehicle({
      make: s.vehicleData.make,
      model: s.vehicleData.model,
      variant: s.vehicleData.variant || undefined,
      vehicleType: s.vehicleType ?? 'car',
      registrationNumber: s.registrationNumber || undefined,
      brandLogoUrl: getBrandLogoUrl(s.vehicleData.make),
    });
  }, [currentStepId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const step = getMotorStep(currentStepId);
    if (!step) return;

    const currentState = useMotorStore.getState() as MotorJourneyState;

    // Skip if condition not met
    if (step.condition && !step.condition(currentState)) {
      const nextStepId = step.getNextStep(null, currentState);
      const nextStep = getMotorStep(nextStepId);
      updateState({
        currentStepId: nextStepId,
        currentModule: nextStep?.module || currentState.currentModule,
      } as Partial<MotorJourneyState>);
      return;
    }

    const key = `${currentStepId}-${currentState.conversationHistory.length}`;
    if (processedRef.current.has(key)) return;
    processedRef.current.add(key);

    const script = step.getScript(currentState);

    const addBotMessage = async () => {
      setShowWidget(false);
      updateState({ isTyping: true } as Partial<MotorJourneyState>);

      const mergedContent = script.botMessages.join('\n\n').trim();

      if (mergedContent) {
        const delay = 600 + Math.min(mergedContent.length * 12, 2000);
        await new Promise(r => setTimeout(r, delay));

        addMessage({
          type: 'bot',
          content: mergedContent,
          stepId: currentStepId,
          module: step.module,
        });
      }
      updateState({ isTyping: false } as Partial<MotorJourneyState>);

      if (step.widgetType === 'none') {
        await new Promise(r => setTimeout(r, 400));
        const freshState = useMotorStore.getState() as MotorJourneyState;
        const nextStepId = step.getNextStep(null, freshState);
        if (nextStepId === currentStepId) return;
        const nextStep = getMotorStep(nextStepId);
        updateState({
          currentStepId: nextStepId,
          currentModule: nextStep?.module || freshState.currentModule,
        } as Partial<MotorJourneyState>);
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
    const step = getMotorStep(editingStepId);
    if (!step) return;

    const currentState = useMotorStore.getState() as MotorJourneyState;
    const script = step.getScript(currentState);

    let userLabel = String(response);
    if (script.options) {
      const opt = script.options.find(o => o.id === response);
      if (opt) userLabel = opt.label;
    }

    // Special labels for motor widgets
    if (step.widgetType === 'plan_selector') {
      userLabel = `Selected: ${response.plan?.name || 'plan'}`;
    }

    // Trim all messages after this step's user message, then re-route
    trimAndUpdateFromStep(editingStepId, userLabel);

    // Apply the state update from the new response
    const stateUpdate = step.processResponse(response, currentState);
    const mergedState = { ...currentState, ...stateUpdate } as MotorJourneyState;
    updateState(stateUpdate as Partial<MotorJourneyState>);

    setEditingStepId(null);
    setShowWidget(false);

    // Clear processedRef so new steps can be processed fresh
    processedRef.current.clear();

    // Navigate to the correct next step based on new response
    const nextStepId = step.getNextStep(response, mergedState);
    const nextStep = getMotorStep(nextStepId);
    setTimeout(() => {
      updateState({
        currentStepId: nextStepId,
        currentModule: nextStep?.module || mergedState.currentModule,
      } as Partial<MotorJourneyState>);
    }, 300);
  }, [editingStepId, trimAndUpdateFromStep]);

  // Render edit widget (for in-place editing)
  const renderEditWidget = () => {
    if (!editingStepId) return null;
    const step = getMotorStep(editingStepId);
    if (!step) return null;

    const currentState = useMotorStore.getState() as MotorJourneyState;
    const script = step.getScript(currentState);

    switch (step.widgetType) {
      case 'selection_cards':
        return <MotorSelectionCards options={script.options || []} onSelect={handleEditResponse} />;
      case 'vehicle_reg_input':
        return <VehicleRegInput placeholder={script.placeholder} onSubmit={handleEditResponse} />;
      case 'text_input': {
        const isPincode = editingStepId?.includes('pincode') && !editingStepId?.includes('mobile');
        return (
          <MotorTextInput
            placeholder={script.placeholder}
            inputType={script.inputType as 'text' | 'number' | 'tel' || 'text'}
            onSubmit={handleEditResponse}
            maxLength={isPincode ? 6 : undefined}
            validate={isPincode ? (v: string) => {
              if (!/^\d{6}$/.test(v)) return 'Please enter a valid 6-digit pincode';
              const first = parseInt(v[0]);
              if (first < 1 || first > 9) return 'Invalid pincode — first digit must be 1-9';
              return null;
            } : undefined}
          />
        );
      }
      case 'number_input':
        return <MotorTextInput placeholder={script.placeholder} inputType="number" onSubmit={handleEditResponse} />;
      case 'brand_selector':
        return <BrandSelector onSelect={handleEditResponse} />;
      case 'model_selector':
        return <ModelSelector onSelect={handleEditResponse} />;
      case 'variant_selector':
        return <VariantSelector onSelect={handleEditResponse} />;
      case 'year_selector':
        return <YearSelector onSelect={handleEditResponse} />;
      case 'ncb_selector':
        return <NcbSelector onSelect={handleEditResponse} />;
      case 'insurer_selector':
        return <InsurerSelector onSelect={handleEditResponse} />;
      case 'plan_selector':
        return <PlanSelector onSelect={handleEditResponse} />;
      case 'out_of_pocket_addons':
        return <OutOfPocketAddons onContinue={(addons) => handleEditResponse({ addons })} />;
      case 'protect_everyone_addons':
        return <ProtectEveryoneAddons onContinue={(addons) => handleEditResponse({ addons })} />;
      default:
        return null;
    }
  };

  // Check if the edit widget requires a full-size overlay (not bottom sheet)
  const isLargeEditWidget = () => {
    if (!editingStepId) return false;
    const step = getMotorStep(editingStepId);
    return ['brand_selector', 'model_selector', 'variant_selector', 'year_selector', 'ncb_selector', 'insurer_selector', 'plan_selector', 'out_of_pocket_addons', 'protect_everyone_addons'].includes(step?.widgetType || '');
  };

  // Handle response
  const handleResponse = useCallback((response: any) => {
    const step = getMotorStep(currentStepId);
    if (!step) return;

    const currentState = useMotorStore.getState() as MotorJourneyState;
    const script = step.getScript(currentState);

    let userLabel = String(response);
    if (script.options) {
      const opt = script.options.find(o => o.id === response);
      if (opt) userLabel = opt.label;
    }

    // Special labels
    if (step.widgetType === 'progressive_loader') {
      userLabel = response === 'success' ? 'Vehicle found!' : 'Details not found';
    } else if (step.widgetType === 'vehicle_details_card') {
      userLabel = response === 'retry' ? 'This is not my vehicle' : 'Confirmed vehicle details';
    } else if (step.widgetType === 'ncb_reward') {
      userLabel = 'NCB reward applied!';
    } else if (step.widgetType === 'editable_summary') {
      userLabel = 'Confirmed — view prices';
    } else if (step.widgetType === 'plan_calculator') {
      // Plan calculator is a loading state - don't show user message
      userLabel = '';
    } else if (step.widgetType === 'plan_selector') {
      if (response === 'help_choose') {
        userLabel = 'Help me choose a plan';
      } else {
        const planName = response.plan?.name || 'plan';
        userLabel = `Selected: ${planName}`;
      }
    } else if (step.widgetType === 'plan_recommendation') {
      if (response === 'back_to_plans') {
        userLabel = 'View all plans';
      } else {
        const planName = response.plan?.name || 'plan';
        userLabel = `Selected: ${planName}`;
      }
    } else if (step.widgetType === 'out_of_pocket_addons') {
      const count = response.addons?.length || 0;
      userLabel = count > 0 ? `Added ${count} add-on${count > 1 ? 's' : ''}` : 'Continue without add-ons';
    } else if (step.widgetType === 'protect_everyone_addons') {
      const count = response.addons?.length || 0;
      userLabel = count > 0 ? `Added ${count} protection cover${count > 1 ? 's' : ''}` : 'Continue without add-ons';
    } else if (step.widgetType === 'premium_breakdown') {
      userLabel = 'Proceed to payment';
    } else if (step.widgetType === 'payment_gateway') {
      userLabel = 'Payment completed';
    } else if (step.widgetType === 'motor_celebration') {
      userLabel = '';
    } else if (step.widgetType === 'policy_tracker') {
      userLabel = '';
    } else if (step.widgetType === 'nps_feedback') {
      const emojis = ['', '😞', '😕', '😐', '😊', '🤩'];
      userLabel = response.score ? `${emojis[response.score] || ''} Rated ${response.score}/5` : '';
    } else if (step.widgetType === 'app_download_cta') {
      userLabel = '';
    }

    // Add user message (skip for loading states)
    if (userLabel) {
      addMessage({
        type: 'user',
        content: userLabel,
        stepId: currentStepId,
        module: step.module,
        editable: true,
      });
    }

    const stateUpdate = step.processResponse(response, useMotorStore.getState() as MotorJourneyState);
    const mergedState = { ...useMotorStore.getState(), ...stateUpdate } as MotorJourneyState;
    updateState(stateUpdate as Partial<MotorJourneyState>);

    // Post-purchase end: navigate away instead of advancing
    if (currentStepId === 'post_purchase.end') {
      setShowWidget(false);
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      if (response === 'home') {
        window.location.href = basePath || '/';
      } else if (response === 'new_vehicle') {
        useMotorStore.getState().resetJourney();
        window.location.href = `${basePath}/motor?vehicle=${mergedState.vehicleType || 'car'}`;
      }
      return;
    }

    setShowWidget(false);
    const nextStepId = step.getNextStep(response, mergedState);
    const nextStep = getMotorStep(nextStepId);
    setTimeout(() => {
      updateState({
        currentStepId: nextStepId,
        currentModule: nextStep?.module || mergedState.currentModule,
      } as Partial<MotorJourneyState>);
    }, 300);
  }, [currentStepId]);

  // Render widget
  const renderWidget = () => {
    const step = getMotorStep(currentStepId);
    if (!step || !showWidget) return null;

    const currentState = useMotorStore.getState() as MotorJourneyState;
    const script = step.getScript(currentState);

    switch (step.widgetType) {
      case 'selection_cards':
        return <MotorSelectionCards options={script.options || []} onSelect={handleResponse} />;
      case 'vehicle_reg_input':
        return <VehicleRegInput placeholder={script.placeholder} onSubmit={handleResponse} />;
      case 'text_input': {
        const isPincode = currentStepId.includes('pincode') && !currentStepId.includes('mobile');
        return (
          <MotorTextInput
            placeholder={script.placeholder}
            inputType={script.inputType as 'text' | 'number' | 'tel' || 'text'}
            onSubmit={handleResponse}
            maxLength={isPincode ? 6 : undefined}
            validate={isPincode ? (v: string) => {
              if (!/^\d{6}$/.test(v)) return 'Please enter a valid 6-digit pincode';
              const first = parseInt(v[0]);
              if (first < 1 || first > 9) return 'Invalid pincode — first digit must be 1-9';
              return null;
            } : undefined}
          />
        );
      }
      case 'number_input':
        return <MotorTextInput placeholder={script.placeholder} inputType="number" onSubmit={handleResponse} />;
      case 'progressive_loader':
        return <ProgressiveLoader onComplete={handleResponse} />;
      case 'vehicle_details_card':
        return (
          <VehicleDetailsCard
            onConfirm={() => handleResponse('confirmed')}
            onRetry={() => handleResponse('retry')}
          />
        );
      case 'brand_selector':
        return <BrandSelector onSelect={handleResponse} />;
      case 'model_selector':
        return <ModelSelector onSelect={handleResponse} />;
      case 'variant_selector':
        return <VariantSelector onSelect={handleResponse} />;
      case 'year_selector':
        return <YearSelector onSelect={handleResponse} />;
      case 'ncb_selector':
        return <NcbSelector onSelect={handleResponse} />;
      case 'ncb_reward':
        return <NcbReward onContinue={() => handleResponse('continue')} />;
      case 'insurer_selector':
        return <InsurerSelector onSelect={handleResponse} />;
      case 'editable_summary': {
        const st = useMotorStore.getState() as MotorJourneyState;
        const brandNew = st.vehicleEntryType === 'brand_new';
        return (
          <EditableSummary
            onConfirm={() => handleResponse('confirmed')}
            isBrandNew={brandNew}
            onEditField={(targetStepId: string) => {
              const cur = useMotorStore.getState() as MotorJourneyState;
              const vd = cur.vehicleData;
              let cleared: Partial<typeof vd> = {};
              if (targetStepId === 'manual_entry.select_brand') {
                cleared = { make: '', model: '', variant: '', fuelType: '' as const };
              } else if (targetStepId === 'manual_entry.select_model') {
                cleared = { model: '', variant: '', fuelType: '' as const };
              } else if (targetStepId === 'manual_entry.select_variant') {
                cleared = { variant: '' };
              }
              trimAndUpdateFromStep(targetStepId, '');
              processedRef.current.clear();
              setShowWidget(false);
              updateState({
                vehicleData: { ...vd, ...cleared },
                currentStepId: targetStepId,
                currentModule: 'manual_entry',
              } as Partial<MotorJourneyState>);
            }}
          />
        );
      }
      case 'rejection_screen':
        return <RejectionScreen />;
      case 'plan_calculator':
        return <PlanCalculator onComplete={handleResponse} />;
      case 'plan_selector':
        return <PlanSelector onSelect={handleResponse} />;
      case 'plan_recommendation':
        return <PlanRecommendation onSelect={handleResponse} />;
      case 'out_of_pocket_addons':
        return <OutOfPocketAddons onContinue={(addons) => handleResponse({ addons })} />;
      case 'protect_everyone_addons':
        return <ProtectEveryoneAddons onContinue={(addons) => handleResponse({ addons })} />;
      case 'premium_breakdown':
        return <PremiumBreakdown onContinue={() => handleResponse({})} />;
      case 'payment_gateway':
        return <PaymentGateway onComplete={() => handleResponse({})} />;
      case 'motor_celebration':
        return <MotorCelebration onContinue={() => handleResponse({})} />;
      case 'policy_tracker':
        return <PolicyTracker onContinue={() => handleResponse({})} />;
      case 'nps_feedback':
        return <NpsFeedback onSubmit={(data) => handleResponse(data)} />;
      case 'app_download_cta':
        return <AppDownloadCta onComplete={() => handleResponse({})} />;
      default:
        return null;
    }
  };

  // Large widgets render inline in chat
  const isLargeWidget = () => {
    const step = getMotorStep(currentStepId);
    if (!step) return false;
    return [
      'progressive_loader', 'vehicle_details_card',
      'ncb_reward', 'editable_summary', 'rejection_screen', 'plan_calculator',
      'plan_selector', 'plan_recommendation', 'out_of_pocket_addons', 'protect_everyone_addons',
      'premium_breakdown', 'payment_gateway', 'motor_celebration', 'policy_tracker', 'app_download_cta',
    ].includes(step.widgetType);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: 'var(--motor-chat-gradient)' }}>
      {/* Scrollable chat messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-lg mx-auto">
          <AnimatePresence initial={false}>
            {conversationHistory.map((msg, index) => {
              const isLatestBot = msg.type === 'bot' &&
                index === conversationHistory.length - 1 &&
                !isTyping;
              return (
                <ChatMessage
                  key={msg.id}
                  message={msg as ChatMessageType}
                  onEdit={handleEditRequest}
                  animate={isLatestBot}
                />
              );
            })}
          </AnimatePresence>

          {isTyping && (
            <div className="mb-4">
              <TypingIndicator />
            </div>
          )}

          {/* Large widgets render inline */}
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
            className="shrink-0 max-h-[45vh] overflow-y-auto"
            style={{
              background: 'var(--motor-glass-bg)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderTop: '1px solid var(--motor-border)',
              boxShadow: '0 -4px 40px var(--motor-shadow)',
            }}
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
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto rounded-2xl shadow-2xl z-50 p-6"
              style={{ background: 'var(--motor-glass-bg)', border: '1px solid var(--motor-border-strong)' }}
            >
              <div className="text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--motor-surface-2)' }}>
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h3 className="text-[16px] font-semibold mb-2" style={{ color: 'var(--motor-text)' }}>Edit this answer?</h3>
                <p className="text-[13px] mb-6" style={{ color: 'var(--motor-text-muted)' }}>
                  The conversation will continue from this point with your updated answer.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditModal({ stepId: '', visible: false })}
                    className="flex-1 py-2.5 rounded-xl text-[14px] font-medium transition-colors"
                    style={{ border: '1px solid var(--motor-border-strong)', color: 'var(--motor-text-muted)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmEdit}
                    className="flex-1 py-2.5 rounded-xl text-[14px] font-medium transition-colors"
                    style={{ background: 'var(--motor-cta-bg)', color: 'var(--motor-cta-text)' }}
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
              className={`fixed inset-x-0 z-50 bg-[#1E0F46] border-t border-white/10 shadow-2xl px-5 py-6 max-w-lg mx-auto ${
                isLargeEditWidget()
                  ? 'bottom-0 top-16 rounded-t-2xl overflow-y-auto pb-10'
                  : 'bottom-0 rounded-t-2xl pb-10 max-h-[45vh] overflow-y-auto'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[14px] font-semibold text-white/80">Update your answer</h4>
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
