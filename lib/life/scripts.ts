/**
 * Life Insurance LOB — Conversation scripts for the Life buy journey.
 * Follows the same pattern as Health scripts with Life-specific questions.
 */

import type { ConversationStep, Option } from '../core/types';
import type { LifeJourneyState, LifeModule, LifePersonaType, LifeRider, MaritalStatus, ResidentialStatus, EducationLevel, BuyingIntent } from './types';
import { LIFE_PERSONA_CONFIG } from './personas';
import { getT } from '../translations';
import { useUserProfileStore } from '../userProfileStore';

function userName(state: LifeJourneyState): string {
  return state.name || state.userName || '';
}

function greet(state: LifeJourneyState): string {
  const n = userName(state);
  return n ? n.split(' ')[0] : '';
}

// Helper to calculate age from DOB
function calculateAge(dateOfBirth: string): number {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Indian inflation rate for future value calculations
const INDIA_INFLATION_RATE = 0.06; // 6% avg CPI inflation
const INDIA_EDUCATION_INFLATION = 0.10; // ~10% education cost inflation
const INDIA_RETIREMENT_AGE = 60;
const PER_CHILD_EDUCATION_FUND = 2500000; // ₹25L base for higher education per child
const PER_CHILD_MARRIAGE_FUND = 1500000; // ₹15L base for marriage expenses per child

// Calculate recommended policy term based on age (cover till 60, min 10 years, max 40)
export function calculatePolicyTerm(age: number): number {
  const tillRetirement = INDIA_RETIREMENT_AGE - age;
  return Math.min(Math.max(tillRetirement, 10), 40);
}

// Needs-based coverage calculation with Indian context
function calculateRecommendedCoverage(state: LifeJourneyState): {
  recommended: number;
  breakdown: import('./types').CoverageBreakdown;
} {
  const {
    annualIncome, age,
    outstandingLoans, monthlyExpenses,
    numberOfChildren, youngestChildAge,
    existingLifeCover, existingCorpusSavings,
  } = state;
  if (!annualIncome || annualIncome === 0) return {
    recommended: 0,
    breakdown: { incomeReplacement: 0, loanCoverage: 0, childEducationFund: 0, emergencyBuffer: 0, totalNeed: 0, existingCover: 0, recommendedCover: 0, multiplierUsed: 0 },
  };
  
  const workingYearsLeft = Math.max(INDIA_RETIREMENT_AGE - age, 10);

  // 1. Income replacement — present value of future income (discounted by inflation)
  //    Using simplified formula: income × years × inflation factor
  //    In India, financial planners recommend 10-15x annual income as a rule of thumb.
  //    We use a more precise approach: PV of income stream with 6% inflation, 8% discount rate
  const realDiscountRate = 0.02; // ~8% return - 6% inflation
  let incomeReplacement = 0;
  for (let y = 1; y <= workingYearsLeft; y++) {
    incomeReplacement += annualIncome / Math.pow(1 + realDiscountRate, y);
  }
  incomeReplacement = Math.round(incomeReplacement);

  // 2. Loan coverage — pay off all outstanding loans immediately
  const loanCoverage = outstandingLoans || 0;

  // 3. Children's education + marriage fund (inflation-adjusted to future value)
  let childEducationFund = 0;
  if (numberOfChildren > 0) {
    for (let c = 0; c < numberOfChildren; c++) {
      const childAge = youngestChildAge + c * 2; // approximate age spread
      const yearsToCollege = Math.max(18 - childAge, 0);
      const yearsToMarriage = Math.max(25 - childAge, 0);

      // Future value of education cost (10% education inflation in India)
      const futureEduCost = PER_CHILD_EDUCATION_FUND * Math.pow(1 + INDIA_EDUCATION_INFLATION, yearsToCollege);
      // Future value of marriage cost (6% general inflation)
      const futureMarriageCost = PER_CHILD_MARRIAGE_FUND * Math.pow(1 + INDIA_INFLATION_RATE, yearsToMarriage);

      childEducationFund += Math.round(futureEduCost + futureMarriageCost);
    }
  }

  // 4. Emergency buffer — 6 months of household expenses
  const emergencyBuffer = (monthlyExpenses || Math.round(annualIncome * 0.5 / 12)) * 6;

  // 5. Total need
  const totalNeed = incomeReplacement + loanCoverage + childEducationFund + emergencyBuffer;

  // 6. Subtract existing cover
  const existingCover = (existingLifeCover || 0) + (existingCorpusSavings || 0);

  // 7. Final recommended cover (min ₹25L, max ₹100 Cr, rounded to nearest ₹5L)
  let recommendedCover = Math.max(totalNeed - existingCover, 2500000);
  recommendedCover = Math.min(recommendedCover, 1000000000); // ₹100 Cr cap
  recommendedCover = Math.round(recommendedCover / 500000) * 500000; // Round to nearest ₹5L

  const multiplierUsed = annualIncome > 0 ? Math.round((recommendedCover / annualIncome) * 10) / 10 : 0;

  return {
    recommended: recommendedCover,
    breakdown: {
      incomeReplacement,
      loanCoverage,
      childEducationFund,
      emergencyBuffer,
      totalNeed,
      existingCover,
      recommendedCover,
      multiplierUsed,
    },
  };
}

/* ═══════════════════════════════════════════════
   MODULE: BASIC INFO — Name, Gender, DOB, Contact, Smoking
   ═══════════════════════════════════════════════ */

const lifeIntro: ConversationStep<LifeJourneyState> = {
  id: 'life_intro',
  module: 'basic_info',
  widgetType: 'none',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    const messages: string[] = [];

    const crossLobGreeting = useUserProfileStore.getState().getCrossLobGreeting('life');
    if (crossLobGreeting) {
      messages.push(crossLobGreeting);
    } else {
      messages.push(t.hiGreeting);
    }

    messages.push(
      t.introUsp,
      t.introUspDetails,
    );

    return { botMessages: messages };
  },
  processResponse: (_response, _state) => ({}),
  getNextStep: (_response, _state) => 'life_ask_name',
};

const lifeAskName: ConversationStep<LifeJourneyState> = {
  id: 'life_ask_name',
  module: 'basic_info',
  widgetType: 'text_input',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.askNameQ],
      placeholder: t.namePlaceholder,
      inputType: 'text',
    };
  },
  processResponse: (response, _state) => {
    const value = String(response).trim();
    return { name: value, userName: value };
  },
  getNextStep: (_response, _state) => 'life_name_ack',
};

const lifeNameAck: ConversationStep<LifeJourneyState> = {
  id: 'life_name_ack',
  module: 'basic_info',
  widgetType: 'none',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    const name = greet(state);
    return {
      botMessages: [t.nameAck(name)],
    };
  },
  processResponse: (_response, _state) => ({}),
  getNextStep: (_response, _state) => 'life_login_gate',
};

// Path choice — "I know my coverage" vs "Help me decide"
const lifePathChoice: ConversationStep<LifeJourneyState> = {
  id: 'life_path_choice',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.howProceed],
      options: [
        { id: 'direct', label: t.pathDirect, description: t.pathDirectSub },
        { id: 'guided', label: t.pathGuided, description: t.pathGuidedSub },
      ],
    };
  },
  processResponse: (response, _state) => ({
    userPath: response as 'direct' | 'guided',
  }),
  getNextStep: (response, _state) => {
    if (response === 'direct') {
      return 'life_dq_gender';
    }
    return 'life_should_buy_check';
  },
};

// Ethical check — "Should you even buy term?"
const lifeShouldBuyCheck: ConversationStep<LifeJourneyState> = {
  id: 'life_should_buy_check',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [
        t.beforeProceed, ``,
        t.needInsuranceIf,
        t.needsHasDependents, t.needsHasLiabilities, t.needsSecureFamily, ``,
        t.hasDependentsQ,
      ],
      options: [
        { id: 'yes', label: t.optYesDependents, description: t.optYesDependentsSub },
        { id: 'no', label: t.optNoDependents, description: t.optNoDependentsSub },
        { id: 'not_sure', label: t.optNotSure, description: t.optNotSureSub },
      ],
    };
  },
  processResponse: (response, state) => {
    if (response === 'no') {
      return { intentSignals: { ...state.intentSignals, mayNotNeedTerm: true } };
    }
    return {};
  },
  getNextStep: (response, _state) => {
    if (response === 'no') {
      return 'life_no_dependents_age_check';
    }
    if (response === 'not_sure') {
      return 'life_need_discussion';
    }
    return 'life_basic_gender';
  },
};

// Ask age when user says no dependents
const lifeNoDependentsAgeCheck: ConversationStep<LifeJourneyState> = {
  id: 'life_no_dependents_age_check',
  module: 'basic_info',
  widgetType: 'number_input',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.askAge, t.askAgeSub],
      inputConfig: {
        placeholder: t.agePlaceholder,
        min: 18,
        max: 65,
        suffix: 'years',
      },
    };
  },
  processResponse: (response, _state) => {
    const age = parseInt(response);
    return { age };
  },
  getNextStep: (response, _state) => {
    const age = parseInt(response);
    if (age <= 35) {
      return 'life_young_recommendation';
    }
    return 'life_no_need_explanation';
  },
};

// Recommend term insurance for young users — premiums are cheaper
const lifeYoungRecommendation: ConversationStep<LifeJourneyState> = {
  id: 'life_young_recommendation',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [
        t.youngRecommend(state.age), ``,
        t.youngBullet1, t.youngBullet2, t.youngBullet3, ``,
        t.youngCrore(state.age), ``,
        t.youngCallToAction,
      ],
      options: [
        { id: 'yes', label: t.optShowQuote, description: t.optShowQuoteSub },
        { id: 'learn', label: t.optLearnFlexi, description: t.optLearnFlexiSub },
        { id: 'skip', label: t.optMaybeLater, description: t.optMaybeLaterSub },
      ],
    };
  },
  processResponse: (_response, _state) => ({}),
  getNextStep: (response, _state) => {
    if (response === 'yes') {
      return 'life_basic_gender';
    }
    if (response === 'learn') {
      return 'life_flexi_cover_explanation';
    }
    return 'life_explore_other_lobs';
  },
};

// Flexi Cover explanation
const lifeFlexiCoverExplanation: ConversationStep<LifeJourneyState> = {
  id: 'life_flexi_cover_explanation',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [
        t.flexiIntro, ``,
        t.flexiHowItWorks,
        t.flexiBullet1, t.flexiBullet2, t.flexiBullet3, t.flexiBullet4, ``,
        t.flexiClose,
      ],
      options: [
        { id: 'yes', label: t.optGreatQuote, description: t.optGreatQuoteSub },
        { id: 'skip', label: t.optMaybeLater, description: t.flexiMaybeLaterSub },
      ],
    };
  },
  processResponse: (_response, _state) => ({}),
  getNextStep: (response, _state) => {
    if (response === 'yes') {
      return 'life_basic_gender';
    }
    return 'life_explore_other_lobs';
  },
};

// Explanation if they don't need term (older users with no dependents)
const lifeNoNeedExplanation: ConversationStep<LifeJourneyState> = {
  id: 'life_no_need_explanation',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [
        t.noNeedTitle,
        t.noNeedSub,
        t.noNeedFuture,
        ``,
        t.noNeedWhatNext,
      ],
      options: [
        { id: 'learn', label: t.noNeedLearn, description: t.noNeedLearnSub },
        { id: 'explore', label: t.noNeedExplore, description: t.noNeedExploreSub },
      ],
    };
  },
  processResponse: (_response, _state) => ({}),
  getNextStep: (response, _state) => {
    if (response === 'learn') {
      return 'life_basic_gender';
    }
    return 'life_explore_other_lobs';
  },
};

// Redirect to other LOBs
const lifeExploreOtherLobs: ConversationStep<LifeJourneyState> = {
  id: 'life_explore_other_lobs',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.exploreOtherIntro],
      options: [
        { id: 'health', label: t.exploreHealth, description: t.exploreHealthSub },
        { id: 'motor', label: t.exploreMotor, description: t.exploreMotorSub },
        { id: 'home', label: t.exploreHome, description: t.exploreHomeSub },
      ],
    };
  },
  processResponse: (_response, _state) => ({}),
  getNextStep: (_response, _state) => 'life_explore_other_lobs',
};

// NEW: Discussion if not sure
const lifeNeedDiscussion: ConversationStep<LifeJourneyState> = {
  id: 'life_need_discussion',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [
        t.needDiscIntro,
        ``,
        t.needDiscTermMakesSense,
        t.needDiscBullet1, t.needDiscBullet2, t.needDiscBullet3, t.needDiscBullet4,
        ``,
        t.needDiscQ,
      ],
      options: [
        { id: 'yes', label: t.needDiscYes, description: t.needDiscYesSub },
        { id: 'no', label: t.needDiscNo, description: t.needDiscNoSub },
      ],
    };
  },
  processResponse: (_response, _state) => ({}),
  getNextStep: (response, _state) => {
    if (response === 'no') {
      return 'life_no_need_explanation';
    }
    return 'life_basic_gender';
  },
};

// NEW: Education — What life insurance actually is
const lifeEducationWhatIs: ConversationStep<LifeJourneyState> = {
  id: 'life_education_what_is',
  module: 'basic_info',
  widgetType: 'none',
  getScript: (persona, state) => {
    const t = getT(state.language).lifeScripts;
    const messages: string[] = [
      t.eduWhatIs,
      ``,
      t.eduIncome,
      t.eduNotInvestment,
      t.eduNotSavings,
      t.eduNotTax,
      ``,
      t.eduDesigned,
      t.eduSoFamily,
    ];
    
    if (persona === 'growth_seeker') {
      messages.push(
        ``,
        t.eduComparison,
        ``,
        t.eduTermTitle,
        t.eduTermCover,
        t.eduTermPremium,
        t.eduTermProtection,
        ``,
        t.eduInvestTitle,
        t.eduInvestCover,
        t.eduInvestPremium,
        t.eduInvestMixed,
        ``,
        t.eduGrowthClose
      );
    }
    
    return { botMessages: messages };
  },
  processResponse: (_response, _state) => ({}),
  getNextStep: (_response, _state) => 'life_common_myths',
};

// NEW: Common myths section (especially for Growth Seekers)
const lifeCommonMyths: ConversationStep<LifeJourneyState> = {
  id: 'life_common_myths',
  module: 'basic_info',
  widgetType: 'selection_cards',
  condition: (state) => state.resolvedPersona === 'growth_seeker' || state.resolvedPersona === 'passive_aware',
  getScript: (persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [
        t.mythsIntro,
        ``,
        t.mythStatement,
        ``,
        t.mythRealityTitle,
        t.mythRealitySub,
        ``,
        t.mythTermProtects,
        t.mythWhenDepends,
        ``,
        t.mythQ,
      ],
      options: [
        { id: 'yes', label: t.mythYes, description: t.mythYesSub },
        { id: 'more', label: t.mythMore, description: t.mythMoreSub },
      ],
    };
  },
  processResponse: (_response, _state) => ({}),
  getNextStep: (response, _state) => {
    if (response === 'more') {
      return 'life_myths_detailed';
    }
    return 'life_basic_gender';
  },
};

// NEW: Detailed myths explanation
const lifeMythsDetailed: ConversationStep<LifeJourneyState> = {
  id: 'life_myths_detailed',
  module: 'basic_info',
  widgetType: 'none',
  getScript: (persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [
        t.growthMythIntro,
        ``,
        t.growthMythDetail1Title,
        t.growthMythDetail1Sub,
        ``,
        t.growthMythDetail2Title,
        t.growthMythDetail2Sub,
        ``,
        t.growthMythDetail3Title,
        t.growthMythDetail3Sub1,
        t.growthMythDetail3Sub2,
        ``,
        t.growthMythThinkOf,
        t.growthMythTerm,
        t.growthMythMF,
        t.growthMythSeparate,
      ],
    };
  },
  processResponse: (_response, _state) => ({}),
  getNextStep: (_response, _state) => 'life_basic_gender',
};

/* ═══════════════════════════════════════════════
   DIRECT QUOTE PATH — Streamlined for users who know their coverage
   ═══════════════════════════════════════════════ */

const lifeDqGender: ConversationStep<LifeJourneyState> = {
  id: 'life_dq_gender',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.genderQ],
      options: [
        { id: 'male', label: t.optMale },
        { id: 'female', label: t.optFemale },
      ],
    };
  },
  processResponse: (response, _state) => ({ gender: response as 'male' | 'female' }),
  getNextStep: (_response, _state) => 'life_dq_dob',
};

const lifeDqDob: ConversationStep<LifeJourneyState> = {
  id: 'life_dq_dob',
  module: 'basic_info',
  widgetType: 'date_picker',
  getScript: (_persona, state) => ({
    botMessages: [getT(state.language).lifeScripts.dobQ],
    placeholder: getT(state.language).lifeScripts.dobPlaceholder,
  }),
  processResponse: (response, _state) => {
    const age = calculateAge(String(response));
    return { dateOfBirth: response, age };
  },
  getNextStep: (_, state) => {
    if (state.age < 18 || state.age > 65) {
      return 'life_age_ineligible';
    }
    return 'life_dq_pincode';
  },
};

const lifeDqPincode: ConversationStep<LifeJourneyState> = {
  id: 'life_dq_pincode',
  module: 'basic_info',
  widgetType: 'text_input',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.pincodeQ],
      placeholder: t.pincodePlaceholder,
      inputType: 'text',
    };
  },
  processResponse: (response, _state) => ({ pinCode: String(response) }),
  getNextStep: (_response, _state) => 'life_dq_habits',
};

const lifeDqHabits: ConversationStep<LifeJourneyState> = {
  id: 'life_dq_habits',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.lifestyleQ, t.lifestyleSub],
      options: [
        { id: 'none', label: t.lifestyleNone },
        { id: 'smoke_only', label: t.lifestyleSmoke },
        { id: 'drink_only', label: t.lifestyleDrink },
        { id: 'both', label: t.lifestyleBoth },
      ],
    };
  },
  processResponse: (response, _state) => ({
    smokingStatus: (response === 'smoke_only' || response === 'both') ? 'current' as const : 'never' as const,
    alcoholConsumption: (response === 'drink_only' || response === 'both') ? 'occasional' as const : 'never' as const,
  }),
  getNextStep: (_response, _state) => 'life_dq_income',
};

/* ═══════════════════════════════════════════════
   MODULE: LOGIN GATE — Phone+OTP at the start of the life journey
   Shown right after name collection, before any personal questions.
   Skipped if the user is already logged in.
   ═══════════════════════════════════════════════ */

const lifeLoginGate: ConversationStep<LifeJourneyState> = {
  id: 'life_login_gate',
  module: 'basic_info',
  widgetType: 'login_gate_skippable',
  condition: () => !useUserProfileStore.getState().isLoggedIn,
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    const name = greet(state) || (useUserProfileStore.getState().firstName || '').split(' ')[0];
    return {
      botMessages: [
        t.lifeLoginGreeting(name),
        t.lifeLoginVerify,
      ],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'life_basic_gender',
};

const lifeDqIncome: ConversationStep<LifeJourneyState> = {
  id: 'life_dq_income',
  module: 'basic_info',
  widgetType: 'number_input',
  getScript: (_persona, state) => ({
    botMessages: [getT(state.language).lifeScripts.incomeQ],
    placeholder: getT(state.language).lifeScripts.incomePlaceholder,
    inputType: 'number',
    min: 100000,
    max: 100000000,
  }),
  processResponse: (response, _state) => ({
    annualIncome: parseInt(String(response)) || 0,
  }),
  getNextStep: (_response, _state) => 'life_dq_occupation',
};

const lifeDqOccupation: ConversationStep<LifeJourneyState> = {
  id: 'life_dq_occupation',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.occupationQ],
      options: [
        { id: 'salaried', label: t.occupationSalaried, description: t.occupationSalariedSub },
        { id: 'self_employed', label: t.occupationSelfEmployed, description: t.occupationSelfEmployedSub },
        { id: 'business_owner', label: t.occupationBusiness, description: t.occupationBusinessSub },
        { id: 'not_earning', label: t.occupationNotEarning, description: t.occupationNotEarningSub },
      ],
    };
  },
  processResponse: (response, _state) => {
    const risk: 'low' | 'medium' | 'high' = 'low';
    return { occupation: String(response), occupationRisk: risk };
  },
  getNextStep: (_response, _state) => 'life_quote_display',
};

const lifeDqCoverageInput: ConversationStep<LifeJourneyState> = {
  id: 'life_dq_coverage_input',
  module: 'basic_info',
  widgetType: 'coverage_input',
  getScript: (_persona, state) => ({
    botMessages: [getT(state.language).lifeScripts.coverageSelectQ],
  }),
  processResponse: (_response, state) => {
    return { currentModule: 'quote' as LifeModule };
  },
  getNextStep: (_response, _state) => 'life_quote_display',
};

/* ═══════════════════════════════════════════════
   GUIDED PATH — Thorough recommendation flow
   ═══════════════════════════════════════════════ */

const lifeBasicGender: ConversationStep<LifeJourneyState> = {
  id: 'life_basic_gender',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    const name = greet(state);
    return {
      botMessages: [
        t.genderPersonalQ(name),
        t.genderPremiumNote,
      ],
      options: [
        { id: 'male', label: t.genderMale },
        { id: 'female', label: t.genderFemale },
      ],
    };
  },
  processResponse: (response, _state) => ({ gender: response as 'male' | 'female' }),
  getNextStep: (response, _state) => {
    if (response === 'female') {
      return 'life_female_nudge';
    }
    return 'life_basic_dob';
  },
};

const lifeFemaleNudge: ConversationStep<LifeJourneyState> = {
  id: 'life_female_nudge',
  module: 'basic_info',
  widgetType: 'none',
  getScript: (_persona, state) => ({
    botMessages: [getT(state.language).lifeScripts.genderWomenNote],
  }),
  processResponse: (_response, _state) => ({}),
  getNextStep: (_response, _state) => 'life_basic_dob',
};

const lifeBasicDob: ConversationStep<LifeJourneyState> = {
  id: 'life_basic_dob',
  module: 'basic_info',
  widgetType: 'date_picker',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.dobAskQ, t.dobAgeFactor],
      placeholder: t.dobPlaceholder,
    };
  },
  processResponse: (response, _state) => {
    const age = calculateAge(String(response));
    return { dateOfBirth: response, age };
  },
  getNextStep: (_, state) => {
    if (state.age < 18 || state.age > 65) {
      return 'life_age_ineligible';
    }
    return 'life_marital_status';
  },
};

const lifeAgeIneligible: ConversationStep<LifeJourneyState> = {
  id: 'life_age_ineligible',
  module: 'basic_info',
  widgetType: 'none',
  getScript: (persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [
        t.ageIneligibleMsg(state.age),
        t.ageNotEligible,
        state.age < 18 ? t.ageTooYoung : t.ageTooOld,
      ],
    };
  },
  processResponse: (_response, _state) => ({}),
  getNextStep: (_response, _state) => 'life_intro', // Restart journey
};

/* ── New steps per spec: Marital Status, Residential Status, Name+Phone ── */

const lifeMaritalStatus: ConversationStep<LifeJourneyState> = {
  id: 'life_marital_status',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.maritalStatusQ, t.maritalStatusSub],
      options: [
        { id: 'married', label: t.maritalMarried },
        { id: 'single', label: t.maritalSingle },
        { id: 'separated_divorced', label: t.maritalSeparated },
        { id: 'widowed', label: t.maritalWidowed },
      ],
    };
  },
  processResponse: (response, _state) => ({
    maritalStatus: response as MaritalStatus,
  }),
  getNextStep: (_response, _state) => 'life_financial_dependents',
};

const lifeResidentialStatus: ConversationStep<LifeJourneyState> = {
  id: 'life_residential_status',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.residentialStatusQ, t.residentialStatusSub],
      options: [
        { id: 'resident', label: t.residentialYes },
        { id: 'nri', label: t.residentialNo },
      ],
    };
  },
  processResponse: (response, _state) => ({
    residentialStatus: response as ResidentialStatus,
  }),
  getNextStep: (_response, _state) => 'life_basic_pincode',
};

const lifeBasicPincode: ConversationStep<LifeJourneyState> = {
  id: 'life_basic_pincode',
  module: 'basic_info',
  widgetType: 'text_input',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.basicPincodeQ, t.basicPincodeSub],
      placeholder: t.basicPincodePlaceholder,
      inputType: 'text',
    };
  },
  processResponse: (response, _state) => ({ pinCode: String(response) }),
  getNextStep: (_response, _state) => 'life_education',
};

const lifeNamePhone: ConversationStep<LifeJourneyState> = {
  id: 'life_name_phone',
  module: 'basic_info',
  widgetType: 'text_input',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.nameCheckQ],
      placeholder: t.nameCheckPlaceholder,
      inputType: 'text',
    };
  },
  processResponse: (response, _state) => {
    const value = String(response);
    return { name: value, userName: value };
  },
  getNextStep: (_response, _state) => 'life_education',
};

const lifeBasicHabits: ConversationStep<LifeJourneyState> = {
  id: 'life_basic_habits',
  module: 'lifestyle',
  widgetType: 'selection_cards',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.habitsQ, t.habitsSub],
      options: [
        { id: 'no', label: t.habitsNo },
        { id: 'yes', label: t.habitsYes },
      ],
    };
  },
  processResponse: (response, _state) => ({
    smokingStatus: response === 'yes' ? 'current' as const : 'never' as const,
  }),
  getNextStep: (_response, _state) => 'life_need_recommendation',
};

/* ── Stage 4: Need Assessment — Recommendation + Buying Intent ── */

const lifeNeedRecommendation: ConversationStep<LifeJourneyState> = {
  id: 'life_need_recommendation',
  module: 'quote',
  widgetType: 'coverage_card',
  getScript: (_persona, state) => {
    const { recommended, breakdown } = calculateRecommendedCoverage(state);
    const policyTerm = calculatePolicyTerm(state.age);
    const coversTill = state.age + policyTerm;

    const formatAmt = (n: number) => {
      if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
      if (n >= 100000) return `₹${(n / 100000).toFixed(0)}L`;
      return `₹${n.toLocaleString('en-IN')}`;
    };

    const rangeMin = Math.round(recommended * 0.8 / 2500000) * 2500000;
    const rangeMax = Math.min(Math.round(recommended * 1.2 / 2500000) * 2500000, 1000000000);
    const multiplierUsed = breakdown.multiplierUsed || 12;

    const tl = getT(state.language).lifeScripts;
    const breakdownItems: { label: string; value: string }[] = [
      { label: tl.breakdownIncome, value: formatAmt(breakdown.incomeReplacement) },
    ];
    if (breakdown.loanCoverage > 0) {
      breakdownItems.push({ label: tl.breakdownLoans, value: formatAmt(breakdown.loanCoverage) });
    }
    if (breakdown.childEducationFund > 0) {
      breakdownItems.push({ label: tl.breakdownChildren, value: formatAmt(breakdown.childEducationFund) });
    }
    breakdownItems.push({ label: tl.breakdownBuffer, value: formatAmt(breakdown.emergencyBuffer) });
    if (breakdown.existingCover > 0) {
      breakdownItems.push({ label: tl.breakdownExisting, value: `-${formatAmt(breakdown.existingCover)}` });
    }

    const name = greet(state);
    return {
      botMessages: [
        tl.needRecWithName(name),
        tl.needRecMultiplier(Math.round(multiplierUsed), Math.round(multiplierUsed + 5)),
        tl.needRecFlexible,
        tl.needRecCoversTill(coversTill),
      ],
      coverageAmount: `${formatAmt(rangeMin)} – ${formatAmt(rangeMax)}`,
      policyTerm: `${policyTerm} years`,
      coversTillAge: coversTill,
      breakdownItems,
    };
  },
  processResponse: (_response, state) => {
    const { recommended, breakdown } = calculateRecommendedCoverage(state);
    const policyTerm = calculatePolicyTerm(state.age);
    return {
      currentModule: 'quote' as LifeModule,
      recommendedCoverage: recommended,
      selectedCoverage: recommended,
      coverageBreakdown: breakdown,
      selectedTerm: policyTerm,
    };
  },
  getNextStep: (_response, _state) => 'life_quote_display',
};

const lifeBuyingIntent: ConversationStep<LifeJourneyState> = {
  id: 'life_buying_intent',
  module: 'quote',
  widgetType: 'selection_cards',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    const name = state.name || state.userName || '';
    return {
      botMessages: [
        name
          ? t.buyingIntentWithName(name.split(' ')[0])
          : t.buyingIntentQ,
      ],
      options: [
        { id: 'exploring', label: t.buyingExploring },
        { id: 'few_months', label: t.buyingFewMonths },
        { id: 'very_soon', label: t.buyingVerySoon },
      ],
    };
  },
  processResponse: (response, _state) => ({
    buyingIntent: response as BuyingIntent,
  }),
  getNextStep: (_response, _state) => 'life_quote_display',
};

const lifeBasicIncome: ConversationStep<LifeJourneyState> = {
  id: 'life_basic_income',
  module: 'lifestyle',
  widgetType: 'number_input',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.monthlyIncomeQ, t.monthlyIncomeSub],
      placeholder: t.monthlyIncomePlaceholder,
      inputType: 'number',
      min: 10000,
      max: 10000000,
    };
  },
  processResponse: (response, _state) => {
    const monthlyIncome = parseInt(String(response)) || 0;
    return { annualIncome: monthlyIncome * 12 };
  },
  getNextStep: (_response, _state) => 'life_basic_habits',
};

// Education step for Growth Seekers (inserted dynamically)
const lifeGrowthSeekerEducation: ConversationStep<LifeJourneyState> = {
  id: 'life_growth_seeker_education',
  module: 'basic_info',
  widgetType: 'selection_cards',
  condition: (state) => state.resolvedPersona === 'growth_seeker',
  getScript: (persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [
        t.growthEduIntro,
        ``,
        t.growthEduMixTitle,
        t.growthEduMixBullet1,
        t.growthEduMixBullet2,
        t.growthEduMixBullet3,
        t.growthEduMixBullet4,
        ``,
        t.growthEduTermTitle,
        t.growthEduTermBullet1,
        t.growthEduTermBullet2,
        t.growthEduTermBullet3,
        ``,
        t.growthEduConclusion,
      ],
      options: [
        { id: 'yes', label: t.growthEduYes, description: t.growthEduYesSub },
        { id: 'no', label: t.growthEduNo, description: t.growthEduNoSub },
      ],
    };
  },
  processResponse: (_response, _state) => ({}),
  getNextStep: (response, _state) => {
    if (response === 'no') {
      return 'life_growth_seeker_education';
    }
    return 'life_financial_dependents';
  },
};

/* ── Financial obligations collection (for accurate coverage calc) ── */

const lifeFinancialDependents: ConversationStep<LifeJourneyState> = {
  id: 'life_financial_dependents',
  module: 'basic_info',
  widgetType: 'multi_select',
  getScript: (_persona, state) => {
    const ms = state.maritalStatus;
    const isMarried = ms === 'married';
    const wasPreviouslyMarried = ms === 'separated_divorced' || ms === 'widowed';

    const t = getT(state.language).lifeScripts;
    const options: { id: string; label: string }[] = [];
    if (isMarried) options.push({ id: 'spouse', label: t.depSpouse });
    if (isMarried || wasPreviouslyMarried) options.push({ id: 'kids', label: t.depKids });
    options.push({ id: 'parents', label: t.depParents });
    if (isMarried) options.push({ id: 'parents_in_law', label: t.depParentsInLaw });
    options.push({ id: 'extended_family', label: t.depExtended });
    options.push({ id: 'none', label: t.depNone });

    return {
      botMessages: [
        t.financialDependentsQ,
        t.depCoreSub,
      ],
      options,
    };
  },
  processResponse: (response, _state) => {
    const selected = String(response).split(',').filter(Boolean);
    const hasNone = selected.includes('none');
    const count = hasNone ? 0 : selected.length;
    return { numberOfDependents: count, dependentTypes: selected };
  },
  getNextStep: (response, _state) => {
    const selected = String(response).split(',').filter(Boolean);
    if (selected.includes('kids')) {
      return 'life_financial_children';
    }
    return 'life_residential_status';
  },
};

const lifeFinancialChildren: ConversationStep<LifeJourneyState> = {
  id: 'life_financial_children',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [
        t.childrenQ,
        t.childrenSub,
      ],
      options: [
        { id: '1', label: t.child1 },
        { id: '2', label: t.child2 },
        { id: '3+', label: t.child3Plus },
      ],
    };
  },
  processResponse: (response, _state) => {
    const count = response === '3+' ? 3 : parseInt(response) || 1;
    return { numberOfChildren: count };
  },
  getNextStep: (_response, _state) => 'life_residential_status',
};

const lifeFinancialYoungestChild: ConversationStep<LifeJourneyState> = {
  id: 'life_financial_youngest_child',
  module: 'basic_info',
  widgetType: 'number_input',
  getScript: (persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.youngChildQ, t.youngChildSub],
      placeholder: t.youngChildPlaceholder,
      inputType: 'number',
      min: 0,
      max: 25,
    };
  },
  processResponse: (response, _state) => ({
    youngestChildAge: parseInt(String(response)) || 0,
  }),
  getNextStep: (_response, _state) => 'life_residential_status',
};

const lifeFinancialLoans: ConversationStep<LifeJourneyState> = {
  id: 'life_financial_loans',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.loansQ, t.loansSub, t.loansNote],
      options: [
        { id: '0', label: t.loansNone },
        { id: 'small', label: t.loansSmall, description: t.loansSmallDesc },
        { id: 'medium', label: t.loansMedium, description: t.loansMediumDesc },
        { id: 'large', label: t.loansLarge, description: t.loansLargeDesc },
        { id: 'very_large', label: t.loansVeryLarge, description: t.loansVeryLargeDesc },
      ],
    };
  },
  processResponse: (response, _state) => {
    const loanMap: Record<string, number> = {
      '0': 0,
      'small': 1500000,
      'medium': 5000000,
      'large': 11000000,
      'very_large': 20000000,
    };
    return { outstandingLoans: loanMap[response] || 0 };
  },
  getNextStep: (_response, _state) => 'life_financial_monthly_expenses',
};

const lifeFinancialMonthlyExpenses: ConversationStep<LifeJourneyState> = {
  id: 'life_financial_monthly_expenses',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.expensesQ, t.expensesSub, t.expensesNote],
      options: [
        { id: '30000', label: t.expensesRange1 },
        { id: '60000', label: t.expensesRange2 },
        { id: '100000', label: t.expensesRange3 },
        { id: '150000', label: t.expensesRange4 },
        { id: '250000', label: t.expensesRange5 },
      ],
    };
  },
  processResponse: (response, _state) => ({
    monthlyExpenses: parseInt(response) || 50000,
  }),
  getNextStep: (_response, _state) => 'life_financial_existing_cover',
};

const lifeFinancialExistingCover: ConversationStep<LifeJourneyState> = {
  id: 'life_financial_existing_cover',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.existingCoverQ, t.existingCoverSub, t.existingCoverNote],
      options: [
        { id: '0', label: t.existingCoverNone },
        { id: '2500000', label: t.existingCoverSmall, description: t.existingCoverSmallDesc },
        { id: '5000000', label: t.existingCoverMedium, description: t.existingCoverMediumDesc },
        { id: '10000000', label: t.existingCoverLarge, description: t.existingCoverLargeDesc },
        { id: '20000000', label: t.existingCoverVeryLarge, description: t.existingCoverVeryLargeDesc },
      ],
    };
  },
  processResponse: (response, _state) => {
    const total = parseInt(response) || 0;
    return { existingLifeCover: Math.round(total * 0.4), existingCorpusSavings: Math.round(total * 0.6) };
  },
  getNextStep: (_response, _state) => 'life_basic_summary',
};

const lifeBasicSummary: ConversationStep<LifeJourneyState> = {
  id: 'life_basic_summary',
  module: 'basic_info',
  widgetType: 'coverage_card',
  getScript: (persona, state) => {
    const { recommended, breakdown } = calculateRecommendedCoverage(state);
    const policyTerm = calculatePolicyTerm(state.age);

    const formatAmt = (n: number) => {
      if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
      if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
      return `₹${n.toLocaleString('en-IN')}`;
    };

    const tl = getT(state.language).lifeScripts;
    const breakdownItems: { label: string; value: string }[] = [
      { label: tl.breakdownIncome, value: formatAmt(breakdown.incomeReplacement) },
    ];
    if (breakdown.loanCoverage > 0) {
      breakdownItems.push({ label: tl.breakdownLoans, value: formatAmt(breakdown.loanCoverage) });
    }
    if (breakdown.childEducationFund > 0) {
      breakdownItems.push({ label: tl.breakdownChildren, value: formatAmt(breakdown.childEducationFund) });
    }
    breakdownItems.push({ label: tl.breakdownBuffer, value: formatAmt(breakdown.emergencyBuffer) });
    if (breakdown.existingCover > 0) {
      breakdownItems.push({ label: tl.breakdownExisting, value: `-${formatAmt(breakdown.existingCover)}` });
    }

    return {
      botMessages: [tl.needRecTitle],
      coverageAmount: formatAmt(recommended),
      policyTerm: `${policyTerm} years`,
      coversTillAge: state.age + policyTerm,
      breakdownItems,
    };
  },
  processResponse: (_response, state) => {
    const { recommended, breakdown } = calculateRecommendedCoverage(state);
    const policyTerm = calculatePolicyTerm(state.age);
    return {
      currentModule: 'lifestyle' as LifeModule,
      recommendedCoverage: recommended,
      selectedCoverage: recommended,
      coverageBreakdown: breakdown,
      selectedTerm: policyTerm,
    };
  },
  getNextStep: (_response, _state) => 'life_lifestyle_occupation',
};

/* ═══════════════════════════════════════════════
   MODULE: LIFESTYLE — Occupation, Medical History
   ═══════════════════════════════════════════════ */

const lifeEducation: ConversationStep<LifeJourneyState> = {
  id: 'life_education',
  module: 'lifestyle',
  widgetType: 'selection_cards',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.educationQ, t.educationSub],
      options: [
        { id: 'below_10th', label: t.eduBelow10 },
        { id: 'ssc_10th', label: t.eduSSC },
        { id: 'hsc_12th', label: t.eduHSC },
        { id: 'diploma_graduate', label: t.eduGraduate },
      ],
    };
  },
  processResponse: (response, _state) => ({
    educationLevel: response as EducationLevel,
  }),
  getNextStep: (_response, _state) => 'life_lifestyle_occupation',
};

const lifeLifestyleOccupation: ConversationStep<LifeJourneyState> = {
  id: 'life_lifestyle_occupation',
  module: 'lifestyle',
  widgetType: 'selection_cards',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [
        t.occupationBasicQ,
        t.occupationRiskSub,
      ],
      options: [
        { id: 'salaried', label: t.occupationSalaried, description: t.occupationSalariedSub },
        { id: 'self_employed', label: t.occupationSelfEmployed, description: t.occupationSelfEmployedSub },
        { id: 'business_owner', label: t.occupationBusiness, description: t.occupationBusinessSub },
        { id: 'not_earning', label: t.occupationNotEarning, description: t.occupationNotEarningSub },
      ],
    };
  },
  processResponse: (response, _state) => {
    const risk: 'low' | 'medium' | 'high' = 'low';
    return { occupation: String(response), occupationRisk: risk };
  },
  getNextStep: (_response, _state) => 'life_basic_income',
};

const lifeLifestyleMedical: ConversationStep<LifeJourneyState> = {
  id: 'life_lifestyle_medical',
  module: 'lifestyle',
  widgetType: 'yes_no',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.medicalQ, t.medicalSub],
      options: [
        { id: 'yes', label: getT(state.language).common.yes },
        { id: 'no', label: getT(state.language).common.no },
      ],
    };
  },
  processResponse: (response, _state) => ({
    medicalHistory: response === 'yes' ? ['disclosed'] : [],
  }),
  getNextStep: (_response, _state) => 'life_lifestyle_summary',
};

const lifeLifestyleSummary: ConversationStep<LifeJourneyState> = {
  id: 'life_lifestyle_summary',
  module: 'lifestyle',
  widgetType: 'none',
  getScript: (persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.lifestyleSummaryIntro, t.lifestyleSummarySub],
    };
  },
  processResponse: (_response, _state) => ({ currentModule: 'quote' }),
  getNextStep: (_response, _state) => 'life_quote_display',
};

/* ═══════════════════════════════════════════════
   MODULE: QUOTE — Coverage & Premium Calculation
   ═══════════════════════════════════════════════ */

/**
 * Premium calculation based on Indian term insurance market rates (2024-25).
 * Reference: ACKO Life, HDFC Life, ICICI Pru, Max Life rate cards.
 *
 * Base rates per ₹1L sum assured per year (non-smoker male):
 *   Age 20-24: ₹4-5     Age 25-29: ₹5-7     Age 30-34: ₹7-10
 *   Age 35-39: ₹11-16   Age 40-44: ₹18-28   Age 45-49: ₹32-50
 *   Age 50-54: ₹55-85   Age 55-59: ₹95-150  Age 60-65: ₹160-250
 *
 * Loadings: Smoker +70-80%, Female discount -15-20%, High-risk occupation +25-30%
 * GST: 18% on premium (mandatory in India)
 */
export function calculateBasePremium(state: LifeJourneyState): {
  basePremium: number;
  gst: number;
  totalPremium: number;
} {
  const { age, gender, smokingStatus, occupationRisk } = state;
  const sumAssured = state.recommendedCoverage || state.selectedCoverage || 10000000;
  const policyTerm = state.selectedTerm || calculatePolicyTerm(age);

  // Base rate per ₹1L sum assured (non-smoker male, low-risk occupation)
  let ratePerLakh: number;
  if (age <= 24) ratePerLakh = 4.5;
  else if (age <= 29) ratePerLakh = 6;
  else if (age <= 34) ratePerLakh = 9;
  else if (age <= 39) ratePerLakh = 14;
  else if (age <= 44) ratePerLakh = 23;
  else if (age <= 49) ratePerLakh = 40;
  else if (age <= 54) ratePerLakh = 70;
  else if (age <= 59) ratePerLakh = 120;
  else ratePerLakh = 200;

  // Longer policy terms cost slightly more per year
  if (policyTerm > 30) ratePerLakh *= 1.08;
  else if (policyTerm > 20) ratePerLakh *= 1.0;
  else if (policyTerm > 10) ratePerLakh *= 0.95;
  else ratePerLakh *= 0.88;

  // Female discount: women live longer on average, ~15-20% lower premium
  if (gender === 'female') ratePerLakh *= 0.82;

  // Smoker/tobacco loading: +75% (Indian market standard)
  if (smokingStatus === 'current') ratePerLakh *= 1.75;
  else if (smokingStatus === 'past') ratePerLakh *= 1.25;

  // Occupation risk loading
  if (occupationRisk === 'high') ratePerLakh *= 1.30;
  else if (occupationRisk === 'medium') ratePerLakh *= 1.12;

  // Volume discount for higher sum assured (common in India)
  const sumAssuredInCr = sumAssured / 10000000;
  if (sumAssuredInCr >= 5) ratePerLakh *= 0.85;
  else if (sumAssuredInCr >= 2) ratePerLakh *= 0.90;
  else if (sumAssuredInCr >= 1) ratePerLakh *= 0.95;

  const basePremium = Math.round((sumAssured / 100000) * ratePerLakh);
  const gst = 0;
  const totalPremium = basePremium;

  return { basePremium, gst, totalPremium };
}

const lifeQuoteDisplay: ConversationStep<LifeJourneyState> = {
  id: 'life_quote_display',
  module: 'quote',
  widgetType: 'premium_summary',
  getScript: (persona, state) => {
    const t = getT(state.language).lifeScripts;
    if (state.userPath === 'direct') {
      return {
        botMessages: [t.quoteDisplayIntro, t.quoteDisplaySub],
      };
    }
    return { botMessages: [] };
  },
  processResponse: (response, state) => {
    const sumAssured = state.selectedCoverage || state.recommendedCoverage || 10000000;
    const policyTerm = state.selectedTerm || calculatePolicyTerm(state.age);
    const premium = calculateBasePremium({ ...state, recommendedCoverage: sumAssured, selectedTerm: policyTerm });
    const quote = {
      sumAssured,
      policyTerm,
      premiumFrequency: 'yearly' as const,
      basePremium: premium.basePremium,
      riders: [],
      totalPremium: premium.totalPremium,
      monthlyPremium: Math.round(premium.totalPremium / 12),
      yearlyPremium: premium.totalPremium,
    };
    return { quote, selectedCoverage: sumAssured, selectedTerm: policyTerm };
  },
  getNextStep: (_response, _state) => 'life_addons_intro',
};

/* ═══════════════════════════════════════════════
   MODULE: ADD-ONS — Riders Selection
   ═══════════════════════════════════════════════ */

const lifeAddonsIntro: ConversationStep<LifeJourneyState> = {
  id: 'life_addons_intro',
  module: 'addons',
  widgetType: 'rider_cards',
  getScript: (persona, state) => {
    const t = getT(state.language).lifeScripts;
    const messages: string[] = [
      t.addonsIntroQ,
      ``,
      t.addonsAccidentBullet,
      t.addonsCriticalBullet,
      ``,
      t.addonsNote,
    ];
    
    return { botMessages: messages };
  },
  processResponse: (_response, _state) => ({}),
  getNextStep: (_response, _state) => 'life_review',
};

const lifeAddonsAccidentalDeath: ConversationStep<LifeJourneyState> = {
  id: 'life_addons_accidental_death',
  module: 'addons',
  widgetType: 'rider_toggle',
  getScript: (persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [
        t.accidentRiderTitle,
        t.accidentRiderDesc,
        t.accidentRiderAddQ,
      ],
      options: [
        { id: 'yes', label: t.riderYes },
        { id: 'no', label: t.riderNo },
      ],
    };
  },
  processResponse: (response, _state) => {
    const riders: LifeRider[] = response === 'yes'
      ? [{ id: 'accidental_death', name: 'Accidental Death Benefit', description: '3x coverage for accidental death', coverageMultiplier: 3, premiumImpact: 50, selected: true }]
      : [];
    return { selectedRiders: riders };
  },
  getNextStep: (_response, _state) => 'life_addons_critical_illness',
};

const lifeAddonsCriticalIllness: ConversationStep<LifeJourneyState> = {
  id: 'life_addons_critical_illness',
  module: 'addons',
  widgetType: 'rider_toggle',
  getScript: (persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [
        t.criticalRiderTitle,
        t.criticalRiderDesc,
        t.criticalRiderNote,
        t.riderAddQ,
      ],
      options: [
        { id: 'yes', label: t.riderYes },
        { id: 'no', label: t.riderNo },
      ],
    };
  },
  processResponse: (response, state) => {
    const existingRiders = state.selectedRiders || [];
    if (response === 'yes') {
      const newRider: LifeRider = {
        id: 'critical_illness',
        name: 'Critical Illness Benefit',
        description: 'Coverage for 21 critical illnesses',
        coverageMultiplier: 1,
        premiumImpact: 100,
        selected: true,
      };
      return { selectedRiders: [...existingRiders, newRider] };
    }
    return { selectedRiders: existingRiders };
  },
  getNextStep: (_response, _state) => 'life_addons_disability',
};

const lifeAddonsDisability: ConversationStep<LifeJourneyState> = {
  id: 'life_addons_disability',
  module: 'addons',
  widgetType: 'rider_toggle',
  getScript: (persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [
        t.disabilityRiderTitle,
        t.disabilityRiderDesc,
        t.riderAddQ,
      ],
      options: [
        { id: 'yes', label: t.riderYes },
        { id: 'no', label: t.riderNo },
      ],
    };
  },
  processResponse: (response, state) => {
    const existingRiders = state.selectedRiders || [];
    if (response === 'yes') {
      const newRider: LifeRider = {
        id: 'disability',
        name: 'Accidental Total Permanent Disability',
        description: 'Coverage for permanent disability',
        coverageMultiplier: 1,
        premiumImpact: 75,
        selected: true,
      };
      return { selectedRiders: [...existingRiders, newRider] };
    }
    return { selectedRiders: existingRiders };
  },
  getNextStep: (_response, _state) => 'life_review',
};

/* ═══════════════════════════════════════════════
   MODULE: REVIEW — Final Summary
   ═══════════════════════════════════════════════ */

const lifeReview: ConversationStep<LifeJourneyState> = {
  id: 'life_review',
  module: 'review',
  widgetType: 'selection_cards',
  getScript: (_persona, state) => {
    const formatAmt = (n: number) => {
      if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
      if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
      if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
      return `₹${n.toLocaleString('en-IN')}`;
    };

    const yearlyPremium = state.quote?.yearlyPremium || 0;
    const monthlyPremium = state.quote?.monthlyPremium || 0;

    const t = getT(state.language).lifeScripts;
    const messages: string[] = [
      t.reviewSummaryIntro,
      ``,
      t.reviewCoverageLabel(formatAmt(state.selectedCoverage)),
      t.reviewTermLabel(state.selectedTerm, state.age + state.selectedTerm),
      t.reviewRidersLabel(state.selectedRiders.length),
      t.reviewPremiumLabel(formatAmt(yearlyPremium), formatAmt(monthlyPremium)),
      ``,
      t.reviewReadyQ,
    ];
    
    return {
      botMessages: messages,
      options: [
        { id: 'pay', label: t.reviewPayBtn(yearlyPremium.toLocaleString('en-IN')) },
      ],
    };
  },
  processResponse: (_response, _state) => ({}),
  getNextStep: (_response, _state) => 'life_payment',
};

/* ═══════════════════════════════════════════════
   MODULE: PAYMENT — Secure payment
   ═══════════════════════════════════════════════ */

const lifePayment: ConversationStep<LifeJourneyState> = {
  id: 'life_payment',
  module: 'payment',
  widgetType: 'payment_screen',
  getScript: (_persona, state) => {
    const formatAmt = (n: number) => {
      if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
      if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
      return `₹${n.toLocaleString('en-IN')}`;
    };
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [
        t.paymentReadyMsg,
        t.paymentDetailsMsg(formatAmt(state.selectedCoverage), (state.quote?.yearlyPremium || 0).toLocaleString('en-IN')),
      ],
    };
  },
  processResponse: (_response, _state) => ({
    paymentComplete: true,
    currentModule: 'ekyc' as LifeModule,
  }),
  getNextStep: (_response, _state) => 'life_ekyc',
};

/* ═══════════════════════════════════════════════
   MODULE: E-KYC — HyperVerge redirection flow
   ═══════════════════════════════════════════════ */

const lifeEkyc: ConversationStep<LifeJourneyState> = {
  id: 'life_ekyc',
  module: 'ekyc',
  widgetType: 'ekyc_screen',
  getScript: (_persona, state) => ({
    botMessages: [getT(state.language).lifeScripts.ekycIntro],
  }),
  processResponse: (response, _state) => {
    if (response === 'skipped') return { currentModule: 'financial' as LifeModule };
    return { ekycComplete: true, currentModule: 'financial' as LifeModule };
  },
  getNextStep: (response, state) => {
    if (response === 'skipped') return 'life_ekyc_skipped';
    if (state.financialComplete || state.medicalComplete) return 'life_pending_verifications';
    return 'life_financial';
  },
};

const lifeEkycSkipped: ConversationStep<LifeJourneyState> = {
  id: 'life_ekyc_skipped',
  module: 'ekyc',
  widgetType: 'action_buttons',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.ekycSkippedNote],
      options: [
        { id: 'reopen', label: 'Complete e-KYC now' },
        { id: 'skip', label: 'Skip for now' },
      ],
    };
  },
  processResponse: (_response, _state) => ({}),
  getNextStep: (response, _state) => {
    if (response === 'reopen') return 'life_ekyc';
    return 'life_financial';
  },
};

/* ═══════════════════════════════════════════════
   MODULE: FINANCIAL — Income verification
   ═══════════════════════════════════════════════ */

const lifeFinancial: ConversationStep<LifeJourneyState> = {
  id: 'life_financial',
  module: 'financial',
  widgetType: 'financial_screen',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    const botMessages: string[] = [];
    if (state.ekycComplete) {
      botMessages.push(t.ekycVerified);
    }
    botMessages.push(t.financialVerifyIntro);
    return { botMessages };
  },
  processResponse: (response, _state) => {
    if (response === 'skipped') return { currentModule: 'medical' as LifeModule };
    return { financialComplete: true, currentModule: 'medical' as LifeModule };
  },
  getNextStep: (response, state) => {
    if (response === 'skipped') return 'life_financial_skipped';
    if (state.medicalComplete) return 'life_pending_verifications';
    return 'life_medical_eval';
  },
};

const lifeFinancialSkipped: ConversationStep<LifeJourneyState> = {
  id: 'life_financial_skipped',
  module: 'financial',
  widgetType: 'action_buttons',
  getScript: (_persona, _state) => ({
    botMessages: [
      `This is a mandatory step — we need to verify your income to process your policy for underwriting. Please make sure you complete it within 5–7 days of payment.`,
    ],
    options: [
      { id: 'reopen', label: 'Verify income now' },
      { id: 'skip', label: 'Skip for now' },
    ],
  }),
  processResponse: (_response, _state) => ({}),
  getNextStep: (response, _state) => {
    if (response === 'reopen') return 'life_financial';
    return 'life_medical_eval';
  },
};

/* ═══════════════════════════════════════════════
   MODULE: MEDICAL — Tele-medical & health tests
   ═══════════════════════════════════════════════ */

const lifeMedicalEval: ConversationStep<LifeJourneyState> = {
  id: 'life_medical_eval',
  module: 'medical',
  widgetType: 'medical_screen',
  getScript: (_persona, state) => ({
    botMessages: [getT(state.language).lifeScripts.medicalEvalIntro],
  }),
  processResponse: (response, _state) => {
    if (response === 'skipped') return { currentModule: 'underwriting' as LifeModule };
    return { medicalComplete: true, currentModule: 'underwriting' as LifeModule };
  },
  getNextStep: (response, _state) => {
    if (response === 'skipped') return 'life_medical_skipped';
    return 'life_pending_verifications';
  },
};

const lifeMedicalSkipped: ConversationStep<LifeJourneyState> = {
  id: 'life_medical_skipped',
  module: 'medical',
  widgetType: 'action_buttons',
  getScript: (_persona, _state) => ({
    botMessages: [
      `This is a mandatory step — we need your medical evaluation to process your policy for underwriting. Please make sure you complete it within 5–7 days of payment.`,
    ],
    options: [
      { id: 'reopen', label: 'Start medical evaluation' },
      { id: 'skip', label: 'Skip for now' },
    ],
  }),
  processResponse: (_response, _state) => ({}),
  getNextStep: (response, _state) => {
    if (response === 'reopen') return 'life_medical_eval';
    return 'life_pending_verifications';
  },
};

/* ═══════════════════════════════════════════════
   MODULE: PENDING VERIFICATIONS — Gate before underwriting
   ═══════════════════════════════════════════════ */

const lifePendingVerifications: ConversationStep<LifeJourneyState> = {
  id: 'life_pending_verifications',
  module: 'underwriting',
  widgetType: 'action_buttons',
  condition: (state) => !state.ekycComplete || !state.financialComplete || !state.medicalComplete,
  getScript: (_persona, state) => {
    const pending: string[] = [];
    if (!state.ekycComplete) pending.push('e-KYC verification');
    if (!state.financialComplete) pending.push('Income verification');
    if (!state.medicalComplete) pending.push('Medical evaluation');

    const list = pending.map(p => `• ${p}`).join('\n');
    const firstPendingId = !state.ekycComplete ? 'ekyc' : !state.financialComplete ? 'financial' : 'medical';

    return {
      botMessages: [
        `We can't process your policy for underwriting until all mandatory steps are completed.\n\n**Pending:**\n${list}\n\nPlease complete these within 5–7 days of payment.`,
      ],
      options: [
        { id: firstPendingId, label: `Complete ${pending[0]}` },
        ...(pending.length > 1 ? [{ id: 'skip_all', label: `I'll do it later` }] : []),
      ],
    };
  },
  processResponse: (_response, _state) => ({}),
  getNextStep: (response, state) => {
    if (response === 'ekyc') return 'life_ekyc';
    if (response === 'financial') return 'life_financial';
    if (response === 'medical') return 'life_medical_eval';
    if (state.ekycComplete && state.financialComplete && state.medicalComplete) return 'life_underwriting';
    return 'life_nps';
  },
};

/* ═══════════════════════════════════════════════
   MODULE: UNDERWRITING — Review & approval
   ═══════════════════════════════════════════════ */

const lifeUnderwriting: ConversationStep<LifeJourneyState> = {
  id: 'life_underwriting',
  module: 'underwriting',
  widgetType: 'underwriting_status',
  getScript: (_persona, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.underwritingDone, t.underwritingTimeline],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'life_nps',
};

/* ═══════════════════════════════════════════════
   MODULE: COMPLETION — NPS, App Download, End
   ═══════════════════════════════════════════════ */

const lifeNps: ConversationStep<LifeJourneyState> = {
  id: 'life_nps',
  module: 'completion',
  widgetType: 'nps_feedback',
  getScript: (_, state) => ({
    botMessages: [getT(state.language).lifeScripts.npsQ],
  }),
  processResponse: () => ({}),
  getNextStep: () => 'life_app_download',
};

const lifeAppDownload: ConversationStep<LifeJourneyState> = {
  id: 'life_app_download',
  module: 'completion',
  widgetType: 'app_download_cta',
  getScript: (_, state) => ({
    botMessages: [getT(state.language).lifeScripts.appDownloadThankYou],
  }),
  processResponse: () => ({}),
  getNextStep: () => 'life_end',
};

const lifeEnd: ConversationStep<LifeJourneyState> = {
  id: 'life_end',
  module: 'completion',
  widgetType: 'selection_cards',
  getScript: (_, state) => {
    const t = getT(state.language).lifeScripts;
    return {
      botMessages: [t.journeyEndMsg],
      options: [
        { id: 'home', label: t.journeyEndHome, description: t.journeyEndHomeDesc },
        { id: 'dashboard', label: t.journeyEndTrack, description: t.journeyEndTrackDesc },
      ],
    };
  },
  processResponse: () => ({ journeyComplete: true }),
  getNextStep: () => 'life_end',
};

/* ═══════════════════════════════════════════════
   EXPORT — All Life conversation steps
   ═══════════════════════════════════════════════ */

export const LIFE_STEPS: ConversationStep<LifeJourneyState>[] = [
  // Stage 1 entry
  lifeIntro,

  // Legacy / alternate paths (kept for backward compat / saved sessions)
  lifePathChoice,
  lifeShouldBuyCheck,
  lifeNoDependentsAgeCheck,
  lifeYoungRecommendation,
  lifeFlexiCoverExplanation,
  lifeNoNeedExplanation,
  lifeExploreOtherLobs,
  lifeNeedDiscussion,
  lifeEducationWhatIs,
  lifeCommonMyths,
  lifeMythsDetailed,

  // Login gate (shared between DQ and guided paths)
  lifeLoginGate,

  // Direct quote path (legacy)
  lifeDqGender,
  lifeDqDob,
  lifeDqPincode,
  lifeDqHabits,
  lifeDqIncome,
  lifeDqOccupation,
  lifeDqCoverageInput,

  // Name collection (upfront)
  lifeAskName,
  lifeNameAck,

  // Stage 2 — Basic Information (spec flow)
  lifeBasicGender,
  lifeFemaleNudge,
  lifeBasicDob,
  lifeAgeIneligible,
  lifeMaritalStatus,
  lifeFinancialDependents,
  lifeFinancialChildren,
  lifeFinancialYoungestChild,
  lifeResidentialStatus,
  lifeBasicPincode,
  lifeNamePhone,

  // Stage 3 — Lifestyle (spec flow)
  lifeEducation,
  lifeLifestyleOccupation,
  lifeBasicIncome,
  lifeBasicHabits,

  // Stage 4 — Need Assessment (spec flow)
  lifeNeedRecommendation,

  // Legacy financial obligations (kept for backward compat)
  lifeFinancialLoans,
  lifeFinancialMonthlyExpenses,
  lifeFinancialExistingCover,
  lifeBasicSummary,
  lifeGrowthSeekerEducation,
  lifeLifestyleMedical,
  lifeLifestyleSummary,

  // Stage 5 — Quote
  lifeQuoteDisplay,

  // Stage 6 — Add-ons
  lifeAddonsIntro,
  lifeAddonsAccidentalDeath,
  lifeAddonsCriticalIllness,
  lifeAddonsDisability,

  // Stage 7 — Review & Payment
  lifeReview,
  lifePayment,
  lifeEkyc,
  lifeEkycSkipped,
  lifeFinancial,
  lifeFinancialSkipped,
  lifeMedicalEval,
  lifeMedicalSkipped,
  lifePendingVerifications,
  lifeUnderwriting,

  // Completion: NPS, app download, end
  lifeNps,
  lifeAppDownload,
  lifeEnd,
];

export function getLifeStep(stepId: string): ConversationStep<LifeJourneyState> | undefined {
  return LIFE_STEPS.find((s) => s.id === stepId);
}
