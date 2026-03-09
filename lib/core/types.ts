/* ── Core Types for ACKO Conversational Journey Engine ──
   LOB-agnostic types shared across all insurance verticals.
   Each LOB extends BaseJourneyState with its own fields. */

export type Language = 'en' | 'hi' | 'hinglish' | 'kn' | 'ta' | 'ml' | 'te';
export type PaymentFrequency = 'monthly' | 'yearly';

export interface Option {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  logoUrl?: string;
  badge?: string;
  disabled?: boolean;
}

export interface StepScript {
  botMessages: string[];
  subText?: string;
  options?: Option[];
  placeholder?: string;
  followUp?: (response: any, state: any) => string[];
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

/** Generic conversation step — LOBs provide their own state type via TState */
export interface ConversationStep<TState = any> {
  id: string;
  module: string;
  widgetType: string;
  condition?: (state: TState) => boolean;
  getScript: (persona: string, state: TState) => StepScript;
  processResponse: (response: any, state: TState) => Partial<TState>;
  getNextStep: (response: any, state: TState) => string;
}

export interface ChatMessage {
  id: string;
  type: 'bot' | 'user' | 'system';
  content: string;
  timestamp: number;
  widgetType?: string;
  widgetData?: any;
  options?: Option[];
  isTyping?: boolean;
  stepId?: string;
  module?: string;
  editable?: boolean;
}

/** Base state every LOB journey shares */
export interface BaseJourneyState {
  language: Language;
  userName: string;
  phone: string;
  currentStepId: string;
  currentModule: string;
  conversationHistory: ChatMessage[];
  isTyping: boolean;
  showExpertPanel: boolean;
  showAIChat: boolean;
  journeyComplete: boolean;
  paymentComplete: boolean;
  paymentFrequency: PaymentFrequency;
  resolvedPersona: string;
}

/** Base actions every LOB store provides */
export interface BaseJourneyActions<TState extends BaseJourneyState> {
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateState: (partial: Partial<TState>) => void;
  setLanguage: (lang: Language) => void;
  resetJourney: () => void;
  updateUserMessage: (stepId: string, newContent: string) => void;
  trimAndUpdateFromStep: (stepId: string, newContent: string) => void;
}

/** LOB identifier for global routing */
export type LobType = 'health' | 'motor' | 'life' | 'car' | 'bike' | 'travel';

export interface LobConfig {
  id: LobType;
  label: string;
  tagline: string;
  description: string;
  icon: string;
  active: boolean;
  route: string;
}
