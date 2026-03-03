/**
 * Life Insurance LOB Types — extends core types with Life-specific fields.
 * Follows the same pattern as Health LOB.
 */

// Import for local use (re-export doesn't create local binding)
import type { BaseJourneyState, PaymentFrequency } from '../core/types';

// Re-export core types
export type {
  Language,
  PaymentFrequency,
  Option,
  StepScript,
  ChatMessage,
  BaseJourneyState,
  BaseJourneyActions,
  ConversationStep,
} from '../core/types';

// Life-specific persona types (psychological states used by personas.ts)
export type LifePersonaType =
  | 'protector'      // Protection-first, security-driven
  | 'growth_seeker'  // Return-first, returns-driven
  | 'passive_aware'; // Avoiding friction, procrastination

// Life journey modules
export type LifeModule = 
  | 'basic_info'              // Name, gender, DOB, contact, smoking
  | 'lifestyle'               // Alcohol, occupation, hobbies, medical
  | 'quote'                   // Coverage recommendation, premium
  | 'addons'                  // Riders selection
  | 'review'                  // Final summary
  | 'payment'                 // Payment processing
  | 'ekyc'                    // e-KYC verification
  | 'financial'               // Financial / income verification
  | 'medical'                 // Medical evaluation
  | 'underwriting'            // Underwriting decision
  | 'completion';             // NPS, app download, end

// Life widget types
export type LifeWidgetType =
  | 'selection_cards'         // Standard option cards
  | 'number_input'            // Age, income, coverage amount
  | 'date_picker'             // Date of birth
  | 'text_input'              // Name, phone, pin
  | 'yes_no'                  // Smoking, alcohol, medical questions
  | 'coverage_slider'         // Coverage amount selector
  | 'term_selector'           // Policy term selector
  | 'rider_toggle'            // Add-on riders with premium impact
  | 'rider_cards'             // NEW: Card-based modular rider selection
  | 'premium_summary'         // Quote display with breakdown
  | 'coverage_input'          // Direct-quote: user enters coverage + term
  | 'coverage_card'           // Coverage breakdown card
  | 'payment_screen'          // Payment CTA
  | 'ekyc_screen'             // e-KYC verification
  | 'financial_screen'        // Financial / income verification
  | 'medical_screen'          // Medical evaluation scheduling
  | 'underwriting_status'     // Underwriting timeline
  | 'nps_feedback'            // NPS emoji rating
  | 'app_download_cta'        // App download card
  | 'life_end';               // End — navigation options

// Smoking status
export type SmokingStatus = 'never' | 'past' | 'current';

// Occupation risk level
export type OccupationRisk = 'low' | 'medium' | 'high';

// Life Insurance Riders
export interface LifeRider {
  id: 'accidental_death' | 'critical_illness' | 'disability';
  name: string;
  description: string;
  coverageMultiplier: number; // e.g., 3x base sum assured for accidental death
  premiumImpact: number;      // Additional premium per ₹1L coverage
  selected: boolean;
  // New fields for card-based UI
  coverageAmount?: number;     // Selected coverage amount for this rider
  premium?: number;            // Premium for this specific rider
  isAccidental?: boolean;      // Whether this is an accidental-related rider (for 30% cap)
  category?: 'accidental' | 'critical_illness'; // Rider category
  maxCoverageMultiplier?: number; // Maximum coverage multiplier allowed
  recommended?: boolean;       // Whether this is recommended
}

// Life Insurance Plan/Quote
export interface LifeQuote {
  sumAssured: number;         // Coverage amount (₹10L - ₹100Cr)
  policyTerm: number;         // 10-40 years
  premiumFrequency: PaymentFrequency;
  basePremium: number;        // Annual premium
  riders: LifeRider[];
  totalPremium: number;       // Base + riders
  monthlyPremium: number;
  yearlyPremium: number;
}

// Life Journey State — extends BaseJourneyState
export interface LifeJourneyState extends BaseJourneyState {
  // Basic Information
  name: string;
  gender: 'male' | 'female' | '';
  dateOfBirth: string;         // YYYY-MM-DD
  age: number;
  phone: string;
  pinCode: string;
  smokingStatus: SmokingStatus;
  annualIncome: number;
  
  // Financial obligations (for coverage calculation)
  outstandingLoans: number;      // Total outstanding loans (home + car + education + personal)
  monthlyExpenses: number;       // Monthly household expenses
  numberOfDependents: number;    // Spouse, children, parents
  dependentTypes: string[];      // Which dependents (spouse, kids, parents, etc.)
  numberOfChildren: number;      // For education fund calculation
  youngestChildAge: number;      // To estimate education timeline
  existingLifeCover: number;     // Any existing term/life insurance
  existingCorpusSavings: number; // EPF + PPF + MF + savings

  // Lifestyle Information
  alcoholConsumption: 'never' | 'occasional' | 'regular';
  occupation: string;
  occupationRisk: OccupationRisk;
  hobbies: string[];           // Hazardous activities
  medicalHistory: string[];    // Pre-existing conditions
  familyMedicalHistory: string[];
  height: number;              // cm
  weight: number;              // kg
  bmi: number;
  
  // Quote & Plan Selection
  recommendedCoverage: number; // Based on HLV/needs-based calc
  coverageBreakdown: CoverageBreakdown | null;
  selectedCoverage: number;
  selectedTerm: number;
  quote: LifeQuote | null;
  
  // Add-ons
  selectedRiders: LifeRider[];
  accidentalRidersPremium: number; // Total premium from accidental riders
  accidentalPremiumLimit: number;  // 30% of base premium
  accidentalLimitUsedPercent: number; // % of accidental limit used
  criticalIllnessPremiumLimit: number; // 100% of base premium
  
  // User path selection
  userPath: 'direct' | 'guided' | '';

  // Journey progress
  currentModule: LifeModule;
  moduleOrder: LifeModule[];
  stepHistory: string[];
  ekycComplete: boolean;
  financialComplete: boolean;
  medicalComplete: boolean;
  
  // Persona
  resolvedPersona: LifePersonaType;
  
  // Psychological state indicators (for persona detection)
  intentSignals?: {
    asksAboutReturns?: boolean;
    asksAboutCoverage?: boolean;
    showsHesitation?: boolean;
    mentionsInvestment?: boolean;
    mayNotNeedTerm?: boolean;
  };

  /* ── Theme ── */
  theme: 'dark' | 'light';
}

// Transparent breakdown of how coverage was calculated
export interface CoverageBreakdown {
  incomeReplacement: number;   // Annual income × remaining working years (inflation-adjusted)
  loanCoverage: number;        // Outstanding loans
  childEducationFund: number;  // ₹25-50L per child (Indian higher education + marriage)
  emergencyBuffer: number;     // 6 months expenses
  totalNeed: number;           // Sum of above
  existingCover: number;       // Existing insurance + corpus
  recommendedCover: number;    // totalNeed - existingCover (capped at ₹100 Cr)
  multiplierUsed: number;      // Effective multiplier for display
}

// Initial state
export const LIFE_INITIAL_STATE: LifeJourneyState = {
  // Base state
  language: 'en',
  userName: '',
  phone: '',
  currentStepId: 'life_intro',
  currentModule: 'basic_info',
  conversationHistory: [],
  isTyping: false,
  showExpertPanel: false,
  showAIChat: false,
  journeyComplete: false,
  paymentComplete: false,
  paymentFrequency: 'yearly',
  resolvedPersona: 'protector',
  
  // Life-specific
  name: '',
  gender: '',
  dateOfBirth: '',
  age: 0,
  pinCode: '',
  smokingStatus: 'never',
  annualIncome: 0,
  
  // Financial obligations
  outstandingLoans: 0,
  monthlyExpenses: 0,
  numberOfDependents: 0,
  dependentTypes: [],
  numberOfChildren: 0,
  youngestChildAge: 0,
  existingLifeCover: 0,
  existingCorpusSavings: 0,
  
  alcoholConsumption: 'never',
  occupation: '',
  occupationRisk: 'low',
  hobbies: [],
  medicalHistory: [],
  familyMedicalHistory: [],
  height: 0,
  weight: 0,
  bmi: 0,
  
  recommendedCoverage: 0,
  coverageBreakdown: null,
  selectedCoverage: 0,
  selectedTerm: 0,
  quote: null,
  
  selectedRiders: [],
  accidentalRidersPremium: 0,
  accidentalPremiumLimit: 0,
  accidentalLimitUsedPercent: 0,
  criticalIllnessPremiumLimit: 0,

  userPath: '',
  
  moduleOrder: ['basic_info', 'lifestyle', 'quote', 'addons', 'review', 'payment', 'ekyc', 'financial', 'medical', 'underwriting'],
  stepHistory: [],
  ekycComplete: false,
  financialComplete: false,
  medicalComplete: false,
  
  intentSignals: {},
  theme: 'dark',
};
