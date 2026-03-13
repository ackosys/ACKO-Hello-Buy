/**
 * Life Insurance LOB — Conversation scripts for the Life buy journey.
 * Follows the same pattern as Health scripts with Life-specific questions.
 */

import type { ConversationStep, Option } from '../core/types';
import type { LifeJourneyState, LifeModule, LifePersonaType, LifeRider } from './types';
import { LIFE_PERSONA_CONFIG } from './personas';

// Helper to get user name
function userName(state: LifeJourneyState): string {
  return state.name || state.userName || 'there';
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
function calculatePolicyTerm(age: number): number {
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
  getScript: (persona, state) => {
    const personaConfig = LIFE_PERSONA_CONFIG[persona as LifePersonaType];
    const messages: string[] = [
      `Hi ${userName(state)}! 👋`,
    ];
    
    // Persona-specific intro messaging with ethical hook
    if (persona === 'protector') {
      messages.push(
        `I'm here to help you secure maximum protection for your family at the best price.`,
        `Before we start, let me ask: If your income stopped tomorrow, how long would your family manage?`,
        `This helps us understand your protection needs — no pressure, just reflection.`
      );
    } else if (persona === 'growth_seeker') {
      messages.push(
        `I'm here to help you understand why separating protection from investment gives you better results.`,
        `First, let's think: If your income stopped tomorrow, how long would your family manage?`,
        `Then we'll show you how term insurance + separate investment works better than mixing both.`
      );
    } else { // passive_aware
      messages.push(
        `I'm here to make this simple for you.`,
        `Let's start with a simple question: If your income stopped tomorrow, how long would your family manage?`,
        `Don't worry — we'll help you figure out the right coverage. No overthinking needed.`
      );
    }
    
    return { botMessages: messages };
  },
  processResponse: (_response, _state) => ({}),
  getNextStep: (_response, _state) => 'life_should_buy_check',
};

// NEW: Ethical check — "Should you even buy term?"
const lifeShouldBuyCheck: ConversationStep<LifeJourneyState> = {
  id: 'life_should_buy_check',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (persona, state) => ({
    botMessages: [
      `Before we proceed, let's check if term insurance makes sense for you.`,
      ``,
      `You may not need term insurance if:`,
      `• You have no dependents`,
      `• You have no liabilities (loans, EMIs)`,
      `• You have enough assets to cover your dependents' needs`,
      ``,
      `Do you have dependents or financial obligations?`,
    ],
    options: [
      { id: 'yes', label: 'Yes, I have dependents/obligations', description: 'Continue with term insurance' },
      { id: 'no', label: 'No dependents or obligations', description: 'You may not need term insurance' },
      { id: 'not_sure', label: 'Not sure', description: 'Let\'s discuss' },
    ],
  }),
  processResponse: (response, state) => {
    if (response === 'no') {
      return { intentSignals: { ...state.intentSignals, mayNotNeedTerm: true } };
    }
    return {};
  },
  getNextStep: (response, _state) => {
    if (response === 'no') {
      return 'life_no_need_explanation';
    }
    if (response === 'not_sure') {
      return 'life_need_discussion';
    }
    return 'life_education_what_is';
  },
};

// Explanation if they don't need term — offers meaningful next actions
const lifeNoNeedExplanation: ConversationStep<LifeJourneyState> = {
  id: 'life_no_need_explanation',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (persona, state) => ({
    botMessages: [
      `That's perfectly fine!`,
      `Term insurance is for protecting dependents and financial obligations.`,
      `If you don't have those right now, you can revisit this when your situation changes.`,
      ``,
      `What would you like to do?`,
    ],
    options: [
      { id: 'learn', label: 'Learn about term insurance', description: 'Understand how it works for future planning' },
      { id: 'explore', label: 'Explore other insurance', description: 'Health, Car & Bike insurance' },
    ],
  }),
  processResponse: (_response, _state) => ({}),
  getNextStep: (response, _state) => {
    if (response === 'learn') {
      return 'life_education_what_is';
    }
    return 'life_explore_other_lobs';
  },
};

// Redirect to other LOBs
const lifeExploreOtherLobs: ConversationStep<LifeJourneyState> = {
  id: 'life_explore_other_lobs',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (persona, state) => ({
    botMessages: [
      `No problem! Here are other ways ACKO can help you:`,
    ],
    options: [
      { id: 'health', label: 'Health Insurance', description: 'Cover for hospitalisation, surgeries & more — plans from ₹436/month' },
      { id: 'motor', label: 'Car & Bike Insurance', description: 'Comprehensive cover, instant policy, hassle-free claims' },
      { id: 'home', label: 'Go back to homepage', description: 'Explore all ACKO products' },
    ],
  }),
  processResponse: (_response, _state) => ({}),
  getNextStep: (_response, _state) => 'life_explore_other_lobs',
};

// NEW: Discussion if not sure
const lifeNeedDiscussion: ConversationStep<LifeJourneyState> = {
  id: 'life_need_discussion',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (persona, state) => ({
    botMessages: [
      `Let's think about it together.`,
      ``,
      `Term insurance makes sense if:`,
      `• You have family members who depend on your income`,
      `• You have loans (home loan, car loan, etc.)`,
      `• You want to secure your children's education`,
      `• You want to ensure your spouse's financial security`,
      ``,
      `Does any of this apply to you?`,
    ],
    options: [
      { id: 'yes', label: 'Yes, some apply', description: 'Continue with term insurance' },
      { id: 'no', label: 'No, none apply', description: 'I may not need it' },
    ],
  }),
  processResponse: (_response, _state) => ({}),
  getNextStep: (response, _state) => {
    if (response === 'no') {
      return 'life_no_need_explanation';
    }
    return 'life_education_what_is';
  },
};

// NEW: Education — What life insurance actually is
const lifeEducationWhatIs: ConversationStep<LifeJourneyState> = {
  id: 'life_education_what_is',
  module: 'basic_info',
  widgetType: 'none',
  getScript: (persona, state) => {
    const messages: string[] = [
      `Let me explain what life insurance actually is.`,
      ``,
      `Life insurance = Income replacement`,
      `• Not investment`,
      `• Not savings`,
      `• Not tax product`,
      ``,
      `It's designed to replace your income if something happens to you,`,
      `so your family can maintain their lifestyle and meet financial obligations.`,
    ];
    
    if (persona === 'growth_seeker') {
      messages.push(
        ``,
        `Here's a simple comparison:`,
        ``,
        `Term Insurance:`,
        `• High cover (₹1 Cr+)`,
        `• Low premium (₹5K-10K/year)`,
        `• Pure protection`,
        ``,
        `Investment-Linked Plans:`,
        `• Lower cover for same premium`,
        `• Higher premium`,
        `• Mixed purpose (protection + investment)`,
        ``,
        `We'll show you why separating them works better.`
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
  getScript: (persona, state) => ({
    botMessages: [
      `Let me address a common concern:`,
      ``,
      `Myth: "If I survive the term, my money is wasted."`,
      ``,
      `Reality: Insurance is like a seatbelt.`,
      `You don't regret not crashing — you're grateful you were protected.`,
      ``,
      `Term insurance protects you during your earning years,`,
      `when your family depends on your income most.`,
      ``,
      `Does this make sense?`,
    ],
    options: [
      { id: 'yes', label: 'Yes, I understand', description: 'Continue' },
      { id: 'more', label: 'Tell me more', description: 'Explain further' },
    ],
  }),
  processResponse: (_response, _state) => ({}),
  getNextStep: (response, _state) => {
    if (response === 'more') {
      return 'life_myths_detailed';
    }
    return 'life_basic_name';
  },
};

// NEW: Detailed myths explanation
const lifeMythsDetailed: ConversationStep<LifeJourneyState> = {
  id: 'life_myths_detailed',
  module: 'basic_info',
  widgetType: 'none',
  getScript: (persona, state) => ({
    botMessages: [
      `Here's why term insurance makes sense even if you "don't get money back":`,
      ``,
      `1. Maximum protection at minimum cost`,
      `   ₹5,000/year for ₹1 Cr coverage vs ₹50,000/year for same coverage in mixed plans`,
      ``,
      `2. You can invest the difference separately`,
      `   ₹45,000/year invested in mutual funds typically gives better returns than insurance-linked plans`,
      ``,
      `3. Flexibility`,
      `   You can adjust coverage as life changes (ACKO Flexi)`,
      `   You can stop/change investments anytime`,
      ``,
      `Think of it this way:`,
      `Term insurance = Protection`,
      `Mutual funds = Growth`,
      `Keep them separate for better results.`,
    ],
  }),
  processResponse: (_response, _state) => ({}),
  getNextStep: (_response, _state) => 'life_basic_name',
};

const lifeBasicName: ConversationStep<LifeJourneyState> = {
  id: 'life_basic_name',
  module: 'basic_info',
  widgetType: 'text_input',
  getScript: (persona, state) => ({
    botMessages: [
      `First, what's your name?`,
      `I'll use this to personalize your journey.`,
    ],
    placeholder: 'Enter your name',
    inputType: 'text',
  }),
  processResponse: (response, _state) => ({ name: String(response), userName: String(response) }),
  getNextStep: (_response, _state) => 'life_basic_gender',
};

const lifeBasicGender: ConversationStep<LifeJourneyState> = {
  id: 'life_basic_gender',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (persona, state) => ({
    botMessages: [
      `Nice to meet you, ${userName(state)}! 👋`,
      `What's your gender? This helps us calculate accurate premiums.`,
    ],
    options: [
      { id: 'male', label: 'Male', icon: '👨' },
      { id: 'female', label: 'Female', icon: '👩' },
    ],
  }),
  processResponse: (response, _state) => ({ gender: response as 'male' | 'female' }),
  getNextStep: (_response, _state) => 'life_basic_dob',
};

const lifeBasicDob: ConversationStep<LifeJourneyState> = {
  id: 'life_basic_dob',
  module: 'basic_info',
  widgetType: 'date_picker',
  getScript: (persona, state) => ({
    botMessages: [
      `What's your date of birth?`,
      `Your age affects your premium — the younger you are, the lower your premium.`,
    ],
    placeholder: 'Select date of birth',
  }),
  processResponse: (response, _state) => {
    const age = calculateAge(String(response));
    return { dateOfBirth: response, age };
  },
  getNextStep: (_, state) => {
    if (state.age < 18 || state.age > 65) {
      return 'life_age_ineligible';
    }
    return 'life_basic_phone';
  },
};

const lifeAgeIneligible: ConversationStep<LifeJourneyState> = {
  id: 'life_age_ineligible',
  module: 'basic_info',
  widgetType: 'none',
  getScript: (persona, state) => ({
    botMessages: [
      `I see you're ${state.age} years old.`,
      `ACKO Life Insurance is available for ages 18-65.`,
      state.age < 18
        ? `You'll be eligible once you turn 18. Until then, consider talking to your parents about family coverage.`
        : `For ages above 65, please contact our support team for alternative options.`,
    ],
  }),
  processResponse: (_response, _state) => ({}),
  getNextStep: (_response, _state) => 'life_intro', // Restart journey
};

const lifeBasicPhone: ConversationStep<LifeJourneyState> = {
  id: 'life_basic_phone',
  module: 'basic_info',
  widgetType: 'text_input',
  getScript: (persona, state) => ({
    botMessages: [
      `Great! Now, what's your phone number?`,
      `We'll use this to send you policy updates and quotes.`,
    ],
    placeholder: 'Enter 10-digit mobile number',
    inputType: 'tel',
  }),
  processResponse: (response, _state) => ({ phone: String(response) }),
  getNextStep: (_response, _state) => 'life_basic_pincode',
};

const lifeBasicPincode: ConversationStep<LifeJourneyState> = {
  id: 'life_basic_pincode',
  module: 'basic_info',
  widgetType: 'text_input',
  getScript: (persona, state) => ({
    botMessages: [
      `What's your pin code?`,
      `This helps us provide location-specific information.`,
    ],
    placeholder: 'Enter 6-digit pin code',
    inputType: 'text',
  }),
  processResponse: (response, _state) => ({ pinCode: String(response) }),
  getNextStep: (_response, _state) => 'life_basic_smoking',
};

const lifeBasicSmoking: ConversationStep<LifeJourneyState> = {
  id: 'life_basic_smoking',
  module: 'basic_info',
  widgetType: 'yes_no',
  getScript: (persona, state) => ({
    botMessages: [
      `Have you smoked or used any tobacco products in the past 12 months?`,
      `This includes cigarettes, cigars, e-cigarettes, chewing tobacco, gutka, or paan masala.`,
      `Honest disclosure helps us give you accurate premiums.`,
    ],
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ],
  }),
  processResponse: (response, _state) => ({
    smokingStatus: response === 'yes' ? 'current' : 'never',
  }),
  getNextStep: (_response, _state) => 'life_basic_income',
};

const lifeBasicIncome: ConversationStep<LifeJourneyState> = {
  id: 'life_basic_income',
  module: 'basic_info',
  widgetType: 'number_input',
  getScript: (persona, state) => {
    const personaConfig = LIFE_PERSONA_CONFIG[persona as LifePersonaType];
    const messages: string[] = [
      `What's your annual income?`,
    ];
    
    // Persona-specific income question messaging
    if (persona === 'protector') {
      messages.push(
        `This helps us recommend the right coverage amount for your family's needs.`,
        `Your coverage should ideally be 10-15 times your annual income.`
      );
    } else if (persona === 'growth_seeker') {
      messages.push(
        `This helps us calculate how much coverage you need — and how much you can invest separately.`,
        `We'll show you: coverage cost vs. investment potential.`
      );
    } else { // passive_aware
      messages.push(
        `This helps us recommend the right coverage — we'll do the math for you.`
      );
    }
    
    return {
      botMessages: messages,
      placeholder: 'Enter annual income (₹)',
      inputType: 'number',
      min: 100000,
      max: 100000000,
    };
  },
  processResponse: (response, state) => {
    const income = parseInt(String(response)) || 0;
    return { annualIncome: income };
  },
  getNextStep: (response, state) => {
    const responseStr = String(response).toLowerCase();
    if (responseStr.includes('return') || responseStr.includes('ulip') || responseStr.includes('investment')) {
      return 'life_growth_seeker_education';
    }
    return 'life_financial_dependents';
  },
};

// Education step for Growth Seekers (inserted dynamically)
const lifeGrowthSeekerEducation: ConversationStep<LifeJourneyState> = {
  id: 'life_growth_seeker_education',
  module: 'basic_info',
  widgetType: 'selection_cards',
  condition: (state) => state.resolvedPersona === 'growth_seeker',
  getScript: (persona, state) => ({
    botMessages: [
      `I understand you're thinking about returns. Let me explain why separating protection from investment works better.`,
      ``,
      `When you mix insurance and investment (like ULIPs):`,
      `• Part of your premium goes to mortality charges`,
      `• Part goes to agent commissions`,
      `• Part goes to fund management charges`,
      `• You get lower coverage AND lower returns`,
      ``,
      `With term insurance + separate investment:`,
      `• ₹5,000/year for ₹1 Cr term coverage`,
      `• ₹45,000/year invested separately in mutual funds`,
      `• You get maximum protection + better growth potential`,
      ``,
      `Does this make sense?`,
    ],
    options: [
      { id: 'yes', label: 'Yes, I understand', description: 'Continue with term insurance' },
      { id: 'no', label: 'I still have questions', description: 'Let\'s discuss more' },
    ],
  }),
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
  widgetType: 'selection_cards',
  getScript: (persona, state) => ({
    botMessages: [
      `How many people depend on your income, ${userName(state)}?`,
      `Include spouse, children, parents, or anyone who relies on you financially.`,
    ],
    options: [
      { id: '1', label: '1 dependent', description: 'e.g., Spouse' },
      { id: '2', label: '2 dependents', description: 'e.g., Spouse + 1 parent' },
      { id: '3', label: '3 dependents', description: 'e.g., Spouse + 1 child + 1 parent' },
      { id: '4+', label: '4 or more', description: 'Larger family' },
    ],
  }),
  processResponse: (response, _state) => {
    const count = response === '4+' ? 4 : parseInt(response) || 1;
    return { numberOfDependents: count };
  },
  getNextStep: (_response, _state) => 'life_financial_children',
};

const lifeFinancialChildren: ConversationStep<LifeJourneyState> = {
  id: 'life_financial_children',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (persona, state) => ({
    botMessages: [
      `Do you have children?`,
      `Their education and future needs are a big part of coverage planning in India.`,
      `Average cost for higher education today: ₹15-30L (and rising ~10% yearly).`,
    ],
    options: [
      { id: '0', label: 'No children' },
      { id: '1', label: '1 child' },
      { id: '2', label: '2 children' },
      { id: '3+', label: '3 or more' },
    ],
  }),
  processResponse: (response, _state) => {
    const count = response === '3+' ? 3 : parseInt(response) || 0;
    return { numberOfChildren: count };
  },
  getNextStep: (response, _state) => {
    if (response !== '0') return 'life_financial_youngest_child';
    return 'life_financial_loans';
  },
};

const lifeFinancialYoungestChild: ConversationStep<LifeJourneyState> = {
  id: 'life_financial_youngest_child',
  module: 'basic_info',
  widgetType: 'number_input',
  getScript: (persona, state) => ({
    botMessages: [
      `What's your youngest child's age?`,
      `This helps us estimate when education costs will arise.`,
    ],
    placeholder: 'Age in years',
    inputType: 'number',
    min: 0,
    max: 25,
  }),
  processResponse: (response, _state) => ({
    youngestChildAge: parseInt(String(response)) || 0,
  }),
  getNextStep: (_response, _state) => 'life_financial_loans',
};

const lifeFinancialLoans: ConversationStep<LifeJourneyState> = {
  id: 'life_financial_loans',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (persona, state) => ({
    botMessages: [
      `Do you have any outstanding loans?`,
      `Home loan, car loan, education loan, personal loan — include all.`,
      `Your term cover should at minimum clear these obligations.`,
    ],
    options: [
      { id: '0', label: 'No loans' },
      { id: 'small', label: 'Under ₹25 lakh', description: 'Car/personal/education loan' },
      { id: 'medium', label: '₹25L – ₹75L', description: 'Home loan or multiple loans' },
      { id: 'large', label: '₹75L – ₹1.5 Cr', description: 'Large home loan' },
      { id: 'very_large', label: 'Above ₹1.5 Cr', description: 'Multiple properties or large EMIs' },
    ],
  }),
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
  getScript: (persona, state) => ({
    botMessages: [
      `What are your monthly household expenses?`,
      `Include rent/EMI, groceries, utilities, school fees, etc.`,
      `This helps us add an emergency buffer to your coverage.`,
    ],
    options: [
      { id: '30000', label: '₹20K – ₹40K/month' },
      { id: '60000', label: '₹40K – ₹80K/month' },
      { id: '100000', label: '₹80K – ₹1.2L/month' },
      { id: '150000', label: '₹1.2L – ₹2L/month' },
      { id: '250000', label: 'Above ₹2L/month' },
    ],
  }),
  processResponse: (response, _state) => ({
    monthlyExpenses: parseInt(response) || 50000,
  }),
  getNextStep: (_response, _state) => 'life_financial_existing_cover',
};

const lifeFinancialExistingCover: ConversationStep<LifeJourneyState> = {
  id: 'life_financial_existing_cover',
  module: 'basic_info',
  widgetType: 'selection_cards',
  getScript: (persona, state) => ({
    botMessages: [
      `Do you have any existing life insurance or significant savings?`,
      `This includes term plans, employer group cover, EPF, PPF, or mutual fund corpus.`,
      `We'll subtract this from your coverage need — no point over-insuring.`,
    ],
    options: [
      { id: '0', label: 'None / negligible' },
      { id: '2500000', label: 'Under ₹25L', description: 'Small savings or employer cover' },
      { id: '5000000', label: '₹25L – ₹75L', description: 'EPF + some savings' },
      { id: '10000000', label: '₹75L – ₹1.5 Cr', description: 'Significant corpus' },
      { id: '20000000', label: 'Above ₹1.5 Cr', description: 'Large corpus / existing term plan' },
    ],
  }),
  processResponse: (response, _state) => {
    const total = parseInt(response) || 0;
    return { existingLifeCover: Math.round(total * 0.4), existingCorpusSavings: Math.round(total * 0.6) };
  },
  getNextStep: (_response, _state) => 'life_basic_summary',
};

const lifeBasicSummary: ConversationStep<LifeJourneyState> = {
  id: 'life_basic_summary',
  module: 'basic_info',
  widgetType: 'none',
  getScript: (persona, state) => {
    const { recommended, breakdown } = calculateRecommendedCoverage(state);
    const policyTerm = calculatePolicyTerm(state.age);
    const incomeInL = (state.annualIncome / 100000).toFixed(1);

    const formatAmt = (n: number) => {
      if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
      if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
      return `₹${n.toLocaleString('en-IN')}`;
    };

    const messages: string[] = [
      `Great, ${userName(state)}! I've calculated your recommended coverage.`,
      ``,
      `📊 Coverage breakdown:`,
    ];

    // Show transparent breakdown
    messages.push(`• Income replacement (${INDIA_RETIREMENT_AGE - state.age} working years): ${formatAmt(breakdown.incomeReplacement)}`);

    if (breakdown.loanCoverage > 0) {
      messages.push(`• Outstanding loans: ${formatAmt(breakdown.loanCoverage)}`);
    }
    if (breakdown.childEducationFund > 0) {
      messages.push(`• Children's education + future needs: ${formatAmt(breakdown.childEducationFund)}`);
      messages.push(`  (Adjusted for ~10% education inflation in India)`);
    }
    messages.push(`• Emergency buffer (6 months expenses): ${formatAmt(breakdown.emergencyBuffer)}`);
    messages.push(``, `Total need: ${formatAmt(breakdown.totalNeed)}`);

    if (breakdown.existingCover > 0) {
      messages.push(`Minus existing cover/savings: ${formatAmt(breakdown.existingCover)}`);
    }

    messages.push(
      ``,
      `✅ Recommended coverage: ${formatAmt(recommended)}`,
      `📅 Policy term: ${policyTerm} years (covers you till age ${state.age + policyTerm})`,
      ``,
      `That's roughly ${breakdown.multiplierUsed}x your annual income — aligned with what Indian financial planners recommend (10-15x).`,
    );

    if (persona === 'growth_seeker') {
      messages.push(
        ``,
        `💡 At this coverage, your premium will be a small fraction of income — leaving most of it free for investments.`
      );
    } else if (persona === 'passive_aware') {
      messages.push(
        ``,
        `You can always adjust this later with ACKO Flexi. No need to overthink.`
      );
    }

    messages.push(``, `Now let's understand your lifestyle to finalize your premium.`);

    return { botMessages: messages };
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
  getNextStep: (_response, _state) => 'life_lifestyle_alcohol',
};

/* ═══════════════════════════════════════════════
   MODULE: LIFESTYLE — Alcohol, Occupation, Medical History
   ═══════════════════════════════════════════════ */

const lifeLifestyleAlcohol: ConversationStep<LifeJourneyState> = {
  id: 'life_lifestyle_alcohol',
  module: 'lifestyle',
  widgetType: 'selection_cards',
  getScript: (persona, state) => ({
    botMessages: [
      `Do you consume alcohol?`,
      `This helps us assess risk and calculate accurate premiums.`,
    ],
    options: [
      { id: 'never', label: 'Never', description: 'I don\'t drink' },
      { id: 'occasional', label: 'Occasionally', description: 'Social drinking only' },
      { id: 'regular', label: 'Regularly', description: 'Weekly or more' },
    ],
  }),
  processResponse: (response, _state) => ({ alcoholConsumption: response as 'never' | 'occasional' | 'regular' }),
  getNextStep: (_response, _state) => 'life_lifestyle_occupation',
};

const lifeLifestyleOccupation: ConversationStep<LifeJourneyState> = {
  id: 'life_lifestyle_occupation',
  module: 'lifestyle',
  widgetType: 'text_input',
  getScript: (persona, state) => ({
    botMessages: [
      `What's your occupation?`,
      `Some occupations have higher risk, which may affect premiums.`,
    ],
    placeholder: 'e.g., Software Engineer, Doctor, Business Owner',
    inputType: 'text',
  }),
  processResponse: (response, _state) => {
    // Simple risk assessment based on occupation keywords
    const occupation = String(response).toLowerCase();
    let risk: 'low' | 'medium' | 'high' = 'low';
    if (occupation.includes('pilot') || occupation.includes('firefighter') || occupation.includes('military')) {
      risk = 'high';
    } else if (occupation.includes('construction') || occupation.includes('mining') || occupation.includes('driver')) {
      risk = 'medium';
    }
    return { occupation: String(response), occupationRisk: risk };
  },
  getNextStep: (_response, _state) => 'life_lifestyle_medical',
};

const lifeLifestyleMedical: ConversationStep<LifeJourneyState> = {
  id: 'life_lifestyle_medical',
  module: 'lifestyle',
  widgetType: 'yes_no',
  getScript: (persona, state) => ({
    botMessages: [
      `Do you have any pre-existing medical conditions?`,
      `This includes conditions like diabetes, hypertension, heart disease, or any chronic illnesses.`,
      `Honest disclosure ensures accurate underwriting.`,
    ],
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ],
  }),
  processResponse: (response, _state) => ({
    medicalHistory: response === 'yes' ? ['disclosed'] : [],
  }),
  getNextStep: (_response, _state) => 'life_lifestyle_summary',
};

const lifeLifestyleSummary: ConversationStep<LifeJourneyState> = {
  id: 'life_lifestyle_summary',
  module: 'lifestyle',
  widgetType: 'none',
  getScript: (persona, state) => ({
    botMessages: [
      `Great! I have all the information I need.`,
      `Now let me calculate your personalized premium quote.`,
    ],
  }),
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
function calculateBasePremium(state: LifeJourneyState): {
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
  const gst = Math.round(basePremium * 0.18); // 18% GST
  const totalPremium = basePremium + gst;

  return { basePremium, gst, totalPremium };
}

const lifeQuoteDisplay: ConversationStep<LifeJourneyState> = {
  id: 'life_quote_display',
  module: 'quote',
  widgetType: 'premium_summary',
  getScript: (persona, state) => {
    const sumAssured = state.selectedCoverage || state.recommendedCoverage || 10000000;
    const policyTerm = state.selectedTerm || calculatePolicyTerm(state.age);
    const premium = calculateBasePremium({ ...state, recommendedCoverage: sumAssured, selectedTerm: policyTerm });

    const formatAmt = (n: number) => {
      if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
      if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
      if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
      return `₹${n.toLocaleString('en-IN')}`;
    };

    const dailyCost = Math.round(premium.totalPremium / 365);
    const monthlyCost = Math.round(premium.totalPremium / 12);

    const messages: string[] = [
      `Here's your personalized quote, ${userName(state)}! 🎯`,
      ``,
      `Coverage: ${formatAmt(sumAssured)}`,
      `Policy term: ${policyTerm} years (till age ${state.age + policyTerm})`,
      ``,
      `💰 Premium breakdown:`,
      `• Base premium: ${formatAmt(premium.basePremium)}/year`,
      `• GST (18%): ${formatAmt(premium.gst)}/year`,
      `• Total: ${formatAmt(premium.totalPremium)}/year`,
      ``,
      `That's just ${formatAmt(monthlyCost)}/month or ₹${dailyCost}/day.`,
    ];
    
    if (persona === 'protector') {
      messages.push(
        ``,
        `Every rupee goes toward protecting your family — no mixing, no compromise.`,
        `Pure protection at the best price.`
      );
    } else if (persona === 'growth_seeker') {
      const remainingForInvestment = state.annualIncome - premium.totalPremium;
      const futureValueAt12 = Math.round(remainingForInvestment * ((Math.pow(1.12, policyTerm) - 1) / 0.12));
      messages.push(
        ``,
        `📈 Here's the smart money split:`,
        `• ${formatAmt(premium.totalPremium)}/year → Term insurance (${formatAmt(sumAssured)} protection)`,
        `• ${formatAmt(remainingForInvestment)}/year → Invest separately`,
        ``,
        `If you invest ${formatAmt(remainingForInvestment)}/year at 12% CAGR (equity MF avg):`,
        `In ${policyTerm} years → corpus of ${formatAmt(futureValueAt12)}`,
        ``,
        `You get: Maximum cover + wealth creation. Separately.`
      );
    } else {
      messages.push(
        ``,
        `Simple, straightforward — no hidden charges.`,
        `The 18% GST is standard across all term plans in India.`
      );
    }
    
    return { botMessages: messages };
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
  widgetType: 'none',
  getScript: (persona, state) => {
    const messages: string[] = [
      `Before we finalize, let me explain ACKO Flexi — our flexible coverage feature.`,
      ``,
      `Why Flexi matters:`,
      `• Your income grows over time`,
      `• Your loans change`,
      `• Your family size changes`,
      ``,
      `With ACKO Flexi, you can increase or decrease coverage anytime.`,
      `This means: You don't have to get it perfect today.`,
      ``,
      `Now, would you like to add extra protection with riders?`,
      `Riders enhance your coverage for specific situations.`,
      `You can always add or remove them later.`,
    ];
    
    return { botMessages: messages };
  },
  processResponse: (_response, _state) => ({}),
  getNextStep: (_response, _state) => 'life_addons_accidental_death',
};

const lifeAddonsAccidentalDeath: ConversationStep<LifeJourneyState> = {
  id: 'life_addons_accidental_death',
  module: 'addons',
  widgetType: 'rider_toggle',
  getScript: (persona, state) => ({
    botMessages: [
      `Accidental Death Benefit Rider`,
      `Provides additional payout (up to 3x your base coverage) if death occurs due to an accident.`,
      `Would you like to add this?`,
    ],
    options: [
      { id: 'yes', label: 'Yes, add this rider' },
      { id: 'no', label: 'No, skip' },
    ],
  }),
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
  getScript: (persona, state) => ({
    botMessages: [
      `Critical Illness Benefit Rider`,
      `Pays a lump sum if you're diagnosed with any of 21 critical illnesses (cancer, heart attack, stroke, etc.).`,
      `This helps cover treatment costs without waiting for death benefit.`,
      `Add this rider?`,
    ],
    options: [
      { id: 'yes', label: 'Yes, add this rider' },
      { id: 'no', label: 'No, skip' },
    ],
  }),
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
  getScript: (persona, state) => ({
    botMessages: [
      `Accidental Total Permanent Disability Rider`,
      `Provides financial support if an accident leaves you permanently disabled and unable to work.`,
      `Add this rider?`,
    ],
    options: [
      { id: 'yes', label: 'Yes, add this rider' },
      { id: 'no', label: 'No, skip' },
    ],
  }),
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
  widgetType: 'none',
  getScript: (persona, state) => {
    const formatAmt = (n: number) => {
      if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
      if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
      if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
      return `₹${n.toLocaleString('en-IN')}`;
    };

    const yearlyPremium = state.quote?.yearlyPremium || 0;
    const monthlyPremium = state.quote?.monthlyPremium || 0;

    const messages: string[] = [
      `Here's a summary of your life insurance plan:`,
      ``,
      `• Coverage: ${formatAmt(state.selectedCoverage)}`,
      `• Term: ${state.selectedTerm} years (till age ${state.age + state.selectedTerm})`,
      `• Riders: ${state.selectedRiders.length} selected`,
      `• Premium: ${formatAmt(yearlyPremium)}/year (${formatAmt(monthlyPremium)}/month)`,
      `  (includes 18% GST)`,
      ``,
      `Before you proceed, let me explain what happens after payment:`,
    ];
    
    return { botMessages: messages };
  },
  processResponse: (_response, _state) => ({}),
  getNextStep: (_response, _state) => 'life_post_payment_process',
};

// NEW: Transparent post-payment process explanation
const lifePostPaymentProcess: ConversationStep<LifeJourneyState> = {
  id: 'life_post_payment_process',
  module: 'review',
  widgetType: 'none',
  getScript: (persona, state) => ({
    botMessages: [
      `What happens after payment:`,
      ``,
      `1. Tele-medical call`,
      `   We'll schedule a quick call to understand your health better`,
      ``,
      `2. Possible medical tests`,
      `   Depending on your age and coverage, we may request basic health tests`,
      `   (Usually for coverage above ₹1 Cr or age above 40)`,
      ``,
      `3. Income proof submission`,
      `   We'll need documents to verify your income`,
      ``,
      `4. Underwriting review`,
      `   Our team reviews everything — usually takes 2-3 business days`,
      ``,
      `5. Final approval`,
      `   Once approved, your policy is active!`,
      ``,
      `What could delay approval?`,
      `• Incomplete health information`,
      `• Income mismatch`,
      `• Missing documents`,
      ``,
      `What could lead to modification?`,
      `• Health conditions we discover`,
      `• Lifestyle factors`,
      `• We'll discuss any changes before finalizing`,
      ``,
      `When refund happens:`,
      `If you're not approved, we refund 100% of your premium — no questions asked.`,
      ``,
      `We'd rather insure you correctly than reject later.`,
      `Full disclosure helps us give you the right coverage at the right price.`,
    ],
  }),
  processResponse: (_response, _state) => ({}),
  getNextStep: (_response, _state) => 'life_claims_expectations',
};

// NEW: Set expectations about claims
const lifeClaimsExpectations: ConversationStep<LifeJourneyState> = {
  id: 'life_claims_expectations',
  module: 'review',
  widgetType: 'none',
  getScript: (persona, state) => ({
    botMessages: [
      `About claims:`,
      ``,
      `ACKO has a 99.29% claim settlement ratio.`,
      `But let me be transparent about when claims are rejected:`,
      ``,
      `Claims are rejected when:`,
      `• Income was misdeclared`,
      `• Health conditions were not disclosed`,
      `• Fraud is detected`,
      ``,
      `That's why we encourage full disclosure upfront.`,
      `We'd rather insure you correctly than reject later.`,
      ``,
      `This builds long-term trust — and protects your family.`,
    ],
  }),
  processResponse: (_response, _state) => ({}),
  getNextStep: (_response, _state) => 'life_gentle_urgency',
};

// NEW: Gentle urgency (not fear-based)
const lifeGentleUrgency: ConversationStep<LifeJourneyState> = {
  id: 'life_gentle_urgency',
  module: 'review',
  widgetType: 'selection_cards',
  getScript: (persona, state) => ({
    botMessages: [
      `One thing to know:`,
      ``,
      `Premium depends on:`,
      `• Your age`,
      `• Your health`,
      `• Your lifestyle`,
      ``,
      `So buying earlier locks in lower premium.`,
      `Every year you wait, premiums typically increase by 5-10%.`,
      ``,
      `This is fact-based, not pressure — just good to know.`,
      ``,
      `Ready to proceed with payment?`,
    ],
    options: [
      { id: 'yes', label: 'Yes, proceed', description: 'Continue to payment' },
      { id: 'later', label: 'I\'ll think about it', description: 'No pressure' },
    ],
  }),
  processResponse: (_response, _state) => ({ currentModule: 'review', journeyComplete: true }),
  getNextStep: (response, _state) => {
    if (response === 'later') {
      return 'life_later_message';
    }
    return 'life_gentle_urgency';
  },
};

const lifeLaterMessage: ConversationStep<LifeJourneyState> = {
  id: 'life_later_message',
  module: 'review',
  widgetType: 'none',
  getScript: (persona, state) => ({
    botMessages: [
      `That's perfectly fine!`,
      ``,
      `Take your time to think about it.`,
      `When you're ready, you can come back and continue where you left off.`,
      ``,
      `Remember: Every year you wait, premiums increase slightly.`,
      `But there's no rush — make the decision when you're comfortable.`,
      ``,
      `If you have any questions, feel free to reach out.`,
      `We're here to help, not pressure.`,
    ],
  }),
  processResponse: (_response, _state) => ({ journeyComplete: true }),
  getNextStep: (_response, _state) => 'life_later_message',
};

/* ═══════════════════════════════════════════════
   EXPORT — All Life conversation steps
   ═══════════════════════════════════════════════ */

export const LIFE_STEPS: ConversationStep<LifeJourneyState>[] = [
  // Ethical hook and eligibility check
  lifeIntro,
  lifeShouldBuyCheck,
  lifeNoNeedExplanation,
  lifeExploreOtherLobs,
  lifeNeedDiscussion,
  
  // Education
  lifeEducationWhatIs,
  lifeCommonMyths,
  lifeMythsDetailed,
  
  // Basic information collection
  lifeBasicName,
  lifeBasicGender,
  lifeBasicDob,
  lifeAgeIneligible,
  lifeBasicPhone,
  lifeBasicPincode,
  lifeBasicSmoking,
  lifeBasicIncome,
  lifeGrowthSeekerEducation,
  
  // Financial obligations (for accurate coverage calculation)
  lifeFinancialDependents,
  lifeFinancialChildren,
  lifeFinancialYoungestChild,
  lifeFinancialLoans,
  lifeFinancialMonthlyExpenses,
  lifeFinancialExistingCover,
  lifeBasicSummary,
  
  // Lifestyle information
  lifeLifestyleAlcohol,
  lifeLifestyleOccupation,
  lifeLifestyleMedical,
  lifeLifestyleSummary,
  
  // Quote and add-ons
  lifeQuoteDisplay,
  lifeAddonsIntro,
  lifeAddonsAccidentalDeath,
  lifeAddonsCriticalIllness,
  lifeAddonsDisability,
  
  // Review and transparency
  lifeReview,
  lifePostPaymentProcess,
  lifeClaimsExpectations,
  lifeGentleUrgency,
  lifeLaterMessage,
];

export function getLifeStep(stepId: string): ConversationStep<LifeJourneyState> | undefined {
  return LIFE_STEPS.find((s) => s.id === stepId);
}
