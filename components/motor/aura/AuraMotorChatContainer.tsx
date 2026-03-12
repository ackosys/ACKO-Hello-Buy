'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMotorStore } from '../../../lib/motor/store';
import { getMotorStep } from '../../../lib/motor/scripts';
import { MotorJourneyState } from '../../../lib/motor/types';
import { saveSnapshot, clearSnapshotById, MOTOR_SAVE_STEPS } from '../../../lib/journeyPersist';
import { useUserProfileStore } from '../../../lib/userProfileStore';
import { detectPostLoginState, buildPoliciesForState } from '../../../lib/mockUsers';
import { writeSessionCookie } from '../../../lib/sessionCookie';
import { useT } from '../../../lib/translations';
import AuraChatMessage, { AuraTypingIndicator } from './AuraChatMessage';
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
  DocumentUploadWidget,
} from './AuraMotorWidgets';
import { PremiumBreakdown, PaymentGateway, DashboardCTA, PolicyTracker, NpsFeedback, AppDownloadCta } from './AuraMotorFinalWidgets';
import {
  SafetyConditionPicker,
  DamagePhotoCapture,
  SelfInspectionWidget,
  SurveyorAssigned,
  ClaimHeartbeat,
  SettlementOffer,
  GarageSelectorClaim,
  ReimbursementUpload,
  ClaimClosure,
} from './AuraClaimsWidgets';
import { MotorCelebration as AuraCelebration } from './AuraMotorFinalWidgets';

const VALID_OTP = '0000';

function AuraMotorLoginGate({ onSuccess, onSkip }: { onSuccess: (phone: string) => void; onSkip?: () => void }) {
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
          <div className="w-full flex items-center rounded-xl overflow-hidden bg-white/10 border border-white/20 focus-within:border-purple-400 focus-within:bg-white/15 transition-colors backdrop-blur-sm">
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
          <p className="text-caption text-white/40 mt-1.5 text-center">{t.chat.loginSaveProgress}</p>
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
          <p className="text-caption text-white/40 text-center mb-3">{t.chat.loginOtpSentTo(phone)}</p>
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

export default function AuraMotorChatContainer() {
  const {
    currentStepId,
    conversationHistory,
    isTyping,
    addMessage,
    updateState,
    trimAndUpdateFromStep,
  } = useMotorStore();
  const { setProfile, addPolicy } = useUserProfileStore();
  const t = useT();
  const tWidgets = t.widgets;

  const scrollRef = useRef<HTMLDivElement>(null);
  const processedRef = useRef<Set<string>>(new Set());
  const [showWidget, setShowWidget] = useState(false);
  const [editModal, setEditModal] = useState<{ stepId: string; visible: boolean }>({ stepId: '', visible: false });
  const [editingStepId, setEditingStepId] = useState<string | null>(null);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  }, [conversationHistory, isTyping, showWidget]);

  useEffect(() => {
    if (!MOTOR_SAVE_STEPS.has(currentStepId)) return;
    const s = useMotorStore.getState();
    // Purchase complete — clear PWILO instead of saving a "policy active" card
    if ((currentStepId === 'payment.success' || currentStepId === 'completion.dashboard') && s.paymentComplete) {
      if (s.journeyId) clearSnapshotById(s.journeyId);
      return;
    }
    const id = saveSnapshot({
      journeyId: s.journeyId || undefined,
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
    if (id !== s.journeyId) {
      updateState({ journeyId: id } as any);
    }
  }, [currentStepId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const step = getMotorStep(currentStepId);
    if (!step) return;

    const currentState = useMotorStore.getState() as MotorJourneyState;

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

      const mergedContent = script.botMessages.join('\n\n');
      const delay = 600 + Math.min(mergedContent.length * 12, 2000);
      await new Promise(r => setTimeout(r, delay));

      addMessage({
        type: 'bot',
        content: mergedContent,
        stepId: currentStepId,
        module: step.module,
      });
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

  const handleLoginGateSuccess = useCallback((phone: string) => {
    const stateNow = useMotorStore.getState() as MotorJourneyState;
    const currentStep = stateNow.currentStepId;
    const loginState = detectPostLoginState(phone);
    const firstName = useUserProfileStore.getState().firstName || '';
    setProfile({ firstName, phone: `+91${phone}`, isLoggedIn: true, policies: [] });
    buildPoliciesForState(loginState).forEach(p => addPolicy(p));
    writeSessionCookie({ firstName });

    addMessage({ type: 'user', content: t.chat.phoneVerified, stepId: currentStep, module: 'login' });
    setShowWidget(false);

    setTimeout(() => {
      const step = getMotorStep(currentStep);
      if (step) {
        const freshState = useMotorStore.getState() as MotorJourneyState;
        const nextStepId = step.getNextStep(null, { ...freshState, phone } as MotorJourneyState);
        const nextStep = getMotorStep(nextStepId);
        updateState({
          phone,
          ownerMobile: phone,
          currentStepId: nextStepId,
          currentModule: nextStep?.module || freshState.currentModule,
        } as Partial<MotorJourneyState>);
      } else {
        updateState({
          phone,
          ownerMobile: phone,
          currentStepId: 'owner_details.email',
          currentModule: 'owner_details',
        } as Partial<MotorJourneyState>);
      }
    }, 300);
  }, [setProfile, addPolicy, addMessage, updateState, t]);

  const handleLoginGateSkip = useCallback(() => {
    const stateNow = useMotorStore.getState() as MotorJourneyState;
    const currentStep = stateNow.currentStepId;

    addMessage({ type: 'user', content: t.chat.skippedForNow, stepId: currentStep, module: 'login' });
    setShowWidget(false);

    setTimeout(() => {
      const step = getMotorStep(currentStep);
      if (step) {
        const freshState = useMotorStore.getState() as MotorJourneyState;
        const nextStepId = step.getNextStep(null, freshState);
        const nextStep = getMotorStep(nextStepId);
        updateState({
          currentStepId: nextStepId,
          currentModule: nextStep?.module || freshState.currentModule,
        } as Partial<MotorJourneyState>);
      } else {
        updateState({
          currentStepId: 'owner_details.email',
          currentModule: 'owner_details',
        } as Partial<MotorJourneyState>);
      }
    }, 300);
  }, [addMessage, updateState, t]);

  const handleLoginGateMandatorySuccess = useCallback((phone: string) => {
    const stateNow = useMotorStore.getState() as MotorJourneyState;
    const currentStep = stateNow.currentStepId;
    const loginState = detectPostLoginState(phone);
    const firstName = useUserProfileStore.getState().firstName || '';
    setProfile({ firstName, phone: `+91${phone}`, isLoggedIn: true, policies: [] });
    buildPoliciesForState(loginState).forEach(p => addPolicy(p));
    addMessage({ type: 'user', content: t.chat.phoneVerified, stepId: currentStep, module: 'login' });
    setShowWidget(false);

    setTimeout(() => {
      const step = getMotorStep(currentStep);
      if (step) {
        const freshState = useMotorStore.getState() as MotorJourneyState;
        const nextStepId = step.getNextStep(null, { ...freshState, phone } as MotorJourneyState);
        const nextStep = getMotorStep(nextStepId);
        updateState({
          phone,
          ownerMobile: phone,
          currentStepId: nextStepId,
          currentModule: nextStep?.module || freshState.currentModule,
        } as Partial<MotorJourneyState>);
      } else {
        updateState({
          phone,
          ownerMobile: phone,
          currentStepId: 'review.premium_breakdown',
          currentModule: 'review',
        } as Partial<MotorJourneyState>);
      }
    }, 300);
  }, [setProfile, addPolicy, addMessage, updateState, t]);

  const handleEditRequest = (stepId: string) => {
    setEditModal({ stepId, visible: true });
  };

  const confirmEdit = () => {
    const { stepId } = editModal;
    setEditModal({ stepId: '', visible: false });
    setEditingStepId(stepId);
  };

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

    if (step.widgetType === 'plan_selector') {
      userLabel = `Selected: ${response.plan?.name || 'plan'}`;
    }

    trimAndUpdateFromStep(editingStepId, userLabel);

    const stateUpdate = step.processResponse(response, currentState);
    const mergedState = { ...currentState, ...stateUpdate } as MotorJourneyState;
    updateState(stateUpdate as Partial<MotorJourneyState>);

    setEditingStepId(null);
    setShowWidget(false);
    processedRef.current.clear();

    const nextStepId = step.getNextStep(response, mergedState);
    const nextStep = getMotorStep(nextStepId);
    setTimeout(() => {
      updateState({
        currentStepId: nextStepId,
        currentModule: nextStep?.module || mergedState.currentModule,
      } as Partial<MotorJourneyState>);
    }, 300);
  }, [editingStepId, trimAndUpdateFromStep]);

  const renderEditWidget = () => {
    if (!editingStepId) return null;
    const step = getMotorStep(editingStepId);
    if (!step) return null;

    const currentState = useMotorStore.getState() as MotorJourneyState;
    const script = step.getScript(currentState);

    switch (step.widgetType) {
      case 'selection_cards':
      case 'guided_plan_step':
      case 'plan_variant_selector':
      case 'preliminary_check':
      case 'addon_questions':
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
              if (!/^\d{6}$/.test(v)) return tWidgets.validPincode;
              const first = parseInt(v[0]);
              if (first < 1 || first > 9) return tWidgets.invalidPincodeFirstDigit;
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

  const isLargeEditWidget = () => {
    if (!editingStepId) return false;
    const step = getMotorStep(editingStepId);
    return ['brand_selector', 'model_selector', 'variant_selector', 'year_selector', 'ncb_selector', 'insurer_selector', 'plan_selector', 'out_of_pocket_addons', 'protect_everyone_addons'].includes(step?.widgetType || '');
  };

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

    if (step.widgetType === 'progressive_loader') {
      userLabel = response === 'success' ? 'Vehicle found!' : 'Details not found';
    } else if (step.widgetType === 'vehicle_details_card') {
      userLabel = response === 'retry' ? 'This is not my vehicle' : 'Confirmed vehicle details';
    } else if (step.widgetType === 'ncb_reward') {
      userLabel = 'NCB reward applied!';
    } else if (step.widgetType === 'editable_summary') {
      userLabel = 'Confirmed — view prices';
    } else if (step.widgetType === 'plan_calculator') {
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
    } else if (step.widgetType === 'dashboard_cta') {
      userLabel = response.choice === 'dashboard' ? 'Go to Dashboard' : 'Download Policy';
    } else if (step.widgetType === 'safety_condition_picker') {
      const conditions = (response as string[]);
      userLabel = conditions.length > 0 ? `${conditions.length} safety issue${conditions.length > 1 ? 's' : ''} noted` : 'No specific conditions';
    } else if (step.widgetType === 'damage_photo_capture') {
      userLabel = response?.photosUploaded ? 'Damage photos uploaded' : 'Skipped photo upload';
    } else if (step.widgetType === 'self_inspection') {
      userLabel = 'Self inspection completed';
    } else if (step.widgetType === 'surveyor_assigned') {
      userLabel = 'Surveyor acknowledged';
    } else if (step.widgetType === 'claim_heartbeat') {
      userLabel = '';
    } else if (step.widgetType === 'settlement_offer') {
      userLabel = typeof response === 'number' ? `Accepted ₹${response.toLocaleString('en-IN')}` : 'Declined offer';
    } else if (step.widgetType === 'garage_selector_claim') {
      const GARAGE_NAMES: Record<string, string> = {
        gomechanic: 'GoMechanic, Sector 29',
        carnation: 'Carnation Auto, Cyber City',
        pitstop: 'Pit Stop, MG Road',
        autobahn: 'Autobahn Motors, DLF Phase 3',
        outside_network: 'Other garage',
      };
      userLabel = `Selected: ${GARAGE_NAMES[response as string] || response}`;
    } else if (step.widgetType === 'reimbursement_upload') {
      userLabel = 'Invoice submitted for reimbursement';
    } else if (step.widgetType === 'claim_closure') {
      userLabel = '';
    }

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
        window.location.href = `${basePath}/motor-v3?vehicle=${mergedState.vehicleType || 'car'}`;
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

  const renderWidget = () => {
    const step = getMotorStep(currentStepId);
    if (!step || !showWidget) return null;

    const currentState = useMotorStore.getState() as MotorJourneyState;
    const script = step.getScript(currentState);

    switch (step.widgetType) {
      case 'selection_cards':
      case 'guided_plan_step':
      case 'plan_variant_selector':
      case 'preliminary_check':
      case 'addon_questions':
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
              if (!/^\d{6}$/.test(v)) return tWidgets.validPincode;
              const first = parseInt(v[0]);
              if (first < 1 || first > 9) return tWidgets.invalidPincodeFirstDigit;
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
        return <AuraCelebration onContinue={() => handleResponse({})} />;
      case 'policy_tracker':
        return <PolicyTracker onContinue={() => handleResponse({})} />;
      case 'nps_feedback':
        return <NpsFeedback onSubmit={(data) => handleResponse(data)} />;
      case 'app_download_cta':
        return <AppDownloadCta onComplete={() => handleResponse({})} />;
      case 'dashboard_cta':
        return <DashboardCTA onSelect={(choice) => handleResponse({ choice })} />;
      case 'document_upload':
        return <DocumentUploadWidget onContinue={(result) => handleResponse(result)} />;
      case 'safety_condition_picker':
        return <SafetyConditionPicker onContinue={(conditions) => handleResponse(conditions)} />;
      case 'damage_photo_capture':
        return <DamagePhotoCapture onContinue={(result) => handleResponse(result)} />;
      case 'self_inspection':
        return <SelfInspectionWidget onComplete={(result) => handleResponse(result)} />;
      case 'surveyor_assigned':
        return <SurveyorAssigned onContinue={() => handleResponse('acknowledged')} />;
      case 'claim_heartbeat': {
        const claimState = useMotorStore.getState() as MotorJourneyState;
        const lastClaim = claimState.dashboardSubmittedClaims[claimState.dashboardSubmittedClaims.length - 1];
        return <ClaimHeartbeat claimType={lastClaim?.type} onContinue={() => handleResponse('done')} />;
      }
      case 'settlement_offer':
        return <SettlementOffer onAccept={(amount) => handleResponse(amount)} onDecline={() => handleResponse('declined')} />;
      case 'garage_selector_claim':
        return <GarageSelectorClaim onSelect={(garageId) => handleResponse(garageId)} />;
      case 'reimbursement_upload':
        return <ReimbursementUpload onContinue={(result) => handleResponse(result)} />;
      case 'claim_closure':
        return <ClaimClosure onContinue={() => handleResponse('done')} />;
      case 'login_gate':
        return <AuraMotorLoginGate onSuccess={handleLoginGateSuccess} />;
      case 'login_gate_skippable':
        return <AuraMotorLoginGate onSuccess={handleLoginGateSuccess} onSkip={handleLoginGateSkip} />;
      case 'login_gate_mandatory':
        return <AuraMotorLoginGate onSuccess={handleLoginGateMandatorySuccess} />;
      default:
        return null;
    }
  };

  const isLargeWidget = () => {
    const step = getMotorStep(currentStepId);
    if (!step) return false;
    return [
      'progressive_loader', 'vehicle_details_card',
      'ncb_reward', 'editable_summary', 'rejection_screen', 'plan_calculator',
      'plan_selector', 'plan_recommendation', 'out_of_pocket_addons', 'protect_everyone_addons',
      'premium_breakdown', 'payment_gateway', 'motor_celebration', 'policy_tracker', 'app_download_cta',
      'dashboard_cta', 'document_upload',
      'self_inspection', 'surveyor_assigned', 'claim_heartbeat', 'settlement_offer',
      'claim_closure',
    ].includes(step.widgetType);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 aura-chat-bg">
      {/* Scrollable chat */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-lg mx-auto">
          <AnimatePresence initial={false}>
            {conversationHistory.map((msg, index) => {
              const isLatestBot = msg.type === 'bot' &&
                index === conversationHistory.length - 1 &&
                !isTyping;
              return (
                <AuraChatMessage
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
              <AuraTypingIndicator />
            </div>
          )}

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

      {/* Sticky bottom widget */}
      <AnimatePresence>
        {showWidget && !isLargeWidget() && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="shrink-0 aura-widget-glass max-h-[45vh] overflow-y-auto"
          >
            <div className="max-w-lg mx-auto px-6 py-5 pb-8">
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
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50"
              onClick={() => setEditModal({ stepId: '', visible: false })}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto rounded-2xl shadow-2xl z-50 p-6"
              style={{ background: 'var(--aura-surface)', border: '1px solid var(--aura-border)' }}
            >
              <div className="text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--aura-surface-2)' }}>
                  <svg className="w-6 h-6" style={{ color: '#C084FC' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h3 className="text-[16px] font-semibold mb-2" style={{ color: 'var(--aura-text)' }}>Edit this answer?</h3>
                <p className="text-[13px] mb-6" style={{ color: 'var(--aura-text-subtle)' }}>
                  The conversation will continue from this point with your updated answer.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditModal({ stepId: '', visible: false })}
                    className="flex-1 py-2.5 rounded-xl text-[14px] font-medium transition-colors"
                    style={{ border: '1px solid var(--aura-border-strong)', color: 'var(--aura-text-muted)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmEdit}
                    className="flex-1 py-2.5 rounded-xl text-[14px] font-medium text-white transition-colors"
                    style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
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
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50"
              onClick={() => setEditingStepId(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`fixed inset-x-0 z-50 shadow-2xl px-6 py-6 max-w-lg mx-auto ${
                isLargeEditWidget()
                  ? 'bottom-0 top-16 rounded-t-[32px] overflow-y-auto pb-10'
                  : 'bottom-0 rounded-t-[32px] pb-10 max-h-[45vh] overflow-y-auto'
              }`}
              style={{ background: 'var(--aura-surface)', borderTop: '1px solid var(--aura-border)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[14px] font-semibold" style={{ color: 'var(--aura-text-muted)' }}>Update your answer</h4>
                <button onClick={() => setEditingStepId(null)} className="transition-colors" style={{ color: 'var(--aura-text-subtle)' }}>
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
