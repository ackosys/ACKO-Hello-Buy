/* ── Core Types for ACKO Conversational Journey ── */

export type PersonaType =
  | 'first_timer'
  | 'gap_filler'
  | 'switcher'
  | 'anxious_senior'
  | 'caring_child'
  | 'window_shopper';

export type Intent =
  | 'cover_enough'
  | 'which_plan'
  | 'exploring'
  | 'compare'
  | 'check_gaps'
  | 'switch';

export type CoverageStatus =
  | 'gmc'
  | 'individual_policy'
  | 'both'
  | 'none'
  | null;

export type PlanTier = 'platinum' | 'platinum_lite' | 'super_topup';

export type PaymentFrequency = 'monthly' | 'yearly';

export type Module =
  | 'entry'
  | 'intent'
  | 'family'
  | 'coverage'
  | 'health'
  | 'needs'
  | 'recommendation'
  | 'customization'
  | 'comparison'
  | 'review'
  | 'payment'
  | 'gap_analysis'
  | 'health_eval'
  | 'completion'
  | 'post_payment'
  | 'doctor_call'
  | 'medical_tests'
  | 'dashboard'
  | 'claims'
  | 'edit_policy';

export type WidgetType =
  | 'selection_cards'
  | 'text_input'
  | 'number_input'
  | 'multi_select'
  | 'slider'
  | 'info_bubble'
  | 'plan_card'
  | 'plan_switcher'
  | 'calculation'
  | 'review_summary'
  | 'payment_widget'
  | 'schedule_widget'
  | 'lab_schedule_widget'
  | 'hospital_list'
  | 'celebration'
  | 'consent'
  | 'frequency_select'
  | 'pincode_input'
  | 'pdf_upload'
  | 'gap_results'
  | 'confirm_details'
  | 'dob_collection'
  | 'usp_cards'
  /* ── Post-Payment & Dashboard widget types ── */
  | 'voice_call'
  | 'scenario_select'
  | 'call_schedule_picker'
  | 'test_schedule_picker'
  | 'health_summary_card'
  | 'premium_update_card'
  | 'policy_celebration'
  | 'app_download_cta'
  | 'nps_feedback'
  | 'cancel_rebuttal'
  | 'dashboard_home'
  | 'hospital_picker'
  | 'claim_form'
  | 'document_list'
  | 'member_form'
  | 'si_selector'
  | 'coverage_chat'
  | 'coverage_card'
  | 'none';

export type PostPaymentScenario = 'all_clear' | 'waiting_period' | 'member_rejected' | 'extra_payment' | 'no_test' | 'home_test_only';

export type Language = 'en' | 'hi' | 'hinglish' | 'kn' | 'ta' | 'ml';

export interface FamilyMember {
  id: string;
  relation: 'self' | 'spouse' | 'child' | 'father' | 'mother' | 'father_in_law' | 'mother_in_law';
  name: string;
  age: number;
  dob?: string; // DD/MM/YYYY
  conditions: string[];
  planTier?: PlanTier;
}

export interface Option {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  badge?: string;
  disabled?: boolean;
}

export interface ConversationStep {
  id: string;
  module: Module;
  widgetType: WidgetType;
  condition?: (state: JourneyState) => boolean;
  getScript: (persona: PersonaType, state: JourneyState) => StepScript;
  processResponse: (response: any, state: JourneyState) => Partial<JourneyState>;
  getNextStep: (response: any, state: JourneyState) => string;
}

export interface StepScript {
  botMessages: string[];
  subText?: string;
  options?: Option[];
  placeholder?: string;
  followUp?: (response: any, state: JourneyState) => string[];
  inputType?: 'text' | 'number' | 'tel';
  min?: number;
  max?: number;
  sliderConfig?: {
    min: number;
    max: number;
    step: number;
    labels: Record<number, string>;
  };
  coverageAmount?: string;
  policyTerm?: string;
  coversTillAge?: number;
  breakdownItems?: { label: string; value: string }[];
}

export interface PlanDetails {
  tier: PlanTier;
  name: string;
  tagline: string;
  sumInsured: number;
  sumInsuredLabel: string;
  monthlyPremium: number;
  yearlyPremium: number;
  features: string[];
  exclusions: string[];
  waitingPeriod: string;
  healthEval: string;
  badge?: string;
  recommended?: boolean;
}

export interface JourneyState {
  /* ── Language ── */
  language: Language;

  /* ── Identity ── */
  isExistingAckoUser: boolean | null;
  userName: string;
  phone: string;
  pincode: string;
  nearbyHospitals: number;

  /* ── Persona ── */
  resolvedPersona: PersonaType;

  /* ── Intent ── */
  intent: Intent | null;

  /* ── Family ── */
  coverageFor: string[];
  numChildren: number;
  members: FamilyMember[];
  hasMinor: boolean;
  hasSenior: boolean;
  buyingForParents: boolean;

  /* ── Coverage ── */
  coverageStatus: CoverageStatus;
  gmcAmount: number | null;
  totalExistingCover: number | null;
  wantsGapAnalysis: boolean;
  existingInsurer: string;
  existingPolicyYears: number | null;
  pdfExtractedData: {
    holderName?: string;
    insurer?: string;
    planName?: string;
    sumInsured?: string;
    policyNumber?: string;
    members?: string[];
    renewalDate?: string;
    roomRentLimit?: string;
    waitingPeriod?: string;
    copay?: string;
    consumablesCovered?: boolean;
    restoreBenefit?: boolean;
    noClaimBonus?: string;
  } | null;

  /* ── Health ── */
  hasConditions: boolean;
  hasHeartCondition: boolean;
  hasSevereCondition: boolean;
  memberConditions: Record<string, string[]>;

  /* ── Needs ── */
  priorities: string[];

  /* ── Recommendation ── */
  recommendedPlans: PlanDetails[];
  selectedPlan: PlanDetails | null;
  splitPlans: Record<string, PlanDetails>;

  /* ── Customization ── */
  sumInsured: number;
  paymentFrequency: PaymentFrequency;
  addons: string[];
  deductible: number | null;

  /* ── Pricing ── */
  currentPremium: number;
  basePremium: number;

  /* ── Flow ── */
  currentStepId: string;
  currentModule: Module;
  conversationHistory: ChatMessage[];
  isTyping: boolean;
  showExpertPanel: boolean;
  showAIChat: boolean;
  journeyComplete: boolean;
  paymentComplete: boolean;
  postPaymentPhase: 'tracker' | 'doctor_schedule' | 'voice_call' | 'call_complete' | 'test_schedule' | 'health_summary' | 'updated_premium' | 'policy_issued' | 'dashboard' | null;

  /* ── Post-Payment Conversational State ── */
  postPaymentScenario: PostPaymentScenario;
  doctorCallComplete: boolean;
  testsComplete: boolean;
  callScheduledDate: string;
  callScheduledTime: string;
  callScheduledLang: string;
  testScheduledDate: string;
  testScheduledTime: string;
  testScheduledLab: string;

  /* ── Dashboard Conversational State ── */
  dashboardClaimType: 'cashless' | 'reimbursement' | '';
  dashboardClaimHospital: string;
  dashboardClaimMember: string;
  dashboardClaimReason: string;
  dashboardClaimDate: string;
  dashboardClaimAmount: string;
  dashboardEditType: string;
  dashboardNewMemberName: string;
  dashboardNewMemberAge: string;
  dashboardNewMemberRelation: string;
  dashboardNewSumInsured: string;

  /* ── Dashboard Tracking State ── */
  dashboardSubmittedClaims: { id: string; type: string; hospital: string; member: string; reason: string; amount: string; date: string; status: string; submittedAt: number }[];
  dashboardSubmittedEdits: { id: string; type: string; summary: string; status: string; submittedAt: number }[];
  dashboardClaimSettlementAmount: number;

  /* ── Theme ── */
  theme: 'dark' | 'light';
}

export interface ChatMessage {
  id: string;
  type: 'bot' | 'user' | 'system';
  content: string;
  timestamp: number;
  widgetType?: WidgetType;
  widgetData?: any;
  options?: Option[];
  isTyping?: boolean;
  stepId?: string;
  module?: Module;
  editable?: boolean;
}

export const INITIAL_STATE: JourneyState = {
  language: 'en',
  isExistingAckoUser: null,
  userName: '',
  phone: '',
  pincode: '',
  nearbyHospitals: 0,
  resolvedPersona: 'first_timer',
  intent: null,
  coverageFor: [],
  numChildren: 0,
  members: [],
  hasMinor: false,
  hasSenior: false,
  buyingForParents: false,
  coverageStatus: null,
  gmcAmount: null,
  totalExistingCover: null,
  wantsGapAnalysis: false,
  existingInsurer: '',
  existingPolicyYears: null,
  pdfExtractedData: null,
  hasConditions: false,
  hasHeartCondition: false,
  hasSevereCondition: false,
  memberConditions: {},
  priorities: [],
  recommendedPlans: [],
  selectedPlan: null,
  splitPlans: {},
  sumInsured: 1000000,
  paymentFrequency: 'monthly',
  addons: [],
  deductible: null,
  currentPremium: 0,
  basePremium: 0,
  currentStepId: 'entry.welcome',
  currentModule: 'entry',
  conversationHistory: [],
  isTyping: false,
  showExpertPanel: false,
  showAIChat: false,
  journeyComplete: false,
  paymentComplete: false,
  postPaymentPhase: null,
  postPaymentScenario: 'all_clear',
  doctorCallComplete: false,
  testsComplete: false,
  callScheduledDate: '',
  callScheduledTime: '',
  callScheduledLang: 'english',
  testScheduledDate: '',
  testScheduledTime: '',
  testScheduledLab: '',
  dashboardClaimType: '',
  dashboardClaimHospital: '',
  dashboardClaimMember: '',
  dashboardClaimReason: '',
  dashboardClaimDate: '',
  dashboardClaimAmount: '',
  dashboardEditType: '',
  dashboardNewMemberName: '',
  dashboardNewMemberAge: '',
  dashboardNewMemberRelation: '',
  dashboardNewSumInsured: '',
  dashboardSubmittedClaims: [],
  dashboardSubmittedEdits: [],
  dashboardClaimSettlementAmount: 0,
  theme: 'dark',
};
