import { ConversationStep, PersonaType, JourneyState, StepScript, Option } from './types';
import { getConditionsList, getSiOptions, formatSI } from './plans';
import { getT } from './translations';
import { useUserProfileStore } from './userProfileStore';

/* ═══════════════════════════════════════════════════════════════════
   ACKO Health Insurance — Persona-Driven Conversation Scripts
   ─────────────────────────────────────────────────────────────────
   PRINCIPLES:
   1. Every question explains WHY we're asking — build trust, not friction
   2. Every response is personalized using accumulated user context
   3. Emojis: subtle, on answers/options only, not in bot messages
   4. Bot sends SINGLE merged message (array joined with \n\n)
   5. Conversational acknowledgments between key steps
   ═══════════════════════════════════════════════════════════════════ */

type PersonaScripts = Record<PersonaType, StepScript>;

function userName(state: JourneyState): string {
  return state.userName || 'there';
}

function cityFromPincode(pincode: string): string {
  const map: Record<string, string> = {
    '560': 'Bangalore', '400': 'Mumbai', '110': 'Delhi', '500': 'Hyderabad',
    '600': 'Chennai', '411': 'Pune', '380': 'Ahmedabad', '700': 'Kolkata',
    '302': 'Jaipur', '226': 'Lucknow',
  };
  return map[pincode?.substring(0, 3)] || 'your city';
}

function familySummary(state: JourneyState): string {
  const count = state.members.length;
  if (count === 1) return 'you';
  const others = state.coverageFor.filter(c => c !== 'self').map(c => c.charAt(0).toUpperCase() + c.slice(1));
  if (others.length === 0) return 'you';
  return `you and your ${others.join(', ')}`;
}

/* ═══════════════════════════════════════════════
   MODULE: ENTRY — Welcome + Name
   ═══════════════════════════════════════════════ */

const entryWelcome: ConversationStep = {
  id: 'entry.welcome',
  module: 'entry',
  widgetType: 'none',
  getScript: (persona, state) => {
    const t = getT(state.language);
    const name = state.userName || 'Rahul';

    const crossLobGreeting = useUserProfileStore.getState().getCrossLobGreeting('health');
    if (crossLobGreeting) {
      return { botMessages: [crossLobGreeting, t.scripts.welcomeUsp] };
    }

    if (state.intent === 'check_gaps') {
      return { botMessages: [t.scripts.welcomeGapCheck] };
    }
    if (state.intent === 'switch') {
      return { botMessages: [t.scripts.welcomeSwitch] };
    }
    if (state.isExistingAckoUser) {
      return { botMessages: [t.scripts.welcomeExisting(name), t.scripts.welcomeUsp] };
    }
    return { botMessages: [t.scripts.welcomeNew, t.scripts.welcomeUsp] };
  },
  processResponse: () => ({}),
  getNextStep: (_, state) => {
    const hasCrossLob = useUserProfileStore.getState().getOtherActiveLobs('health').length > 0;
    if (hasCrossLob) return 'entry.ask_name';
    return state.isExistingAckoUser ? 'intent.readiness' : 'entry.ask_name';
  },
};

const entryAskName: ConversationStep = {
  id: 'entry.ask_name',
  module: 'entry',
  widgetType: 'text_input',
  condition: (state) => !state.isExistingAckoUser,
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.askName],
      placeholder: t.scripts.namePlaceholder,
      inputType: 'text',
    };
  },
  processResponse: (response) => ({ userName: response }),
  getNextStep: () => 'entry.name_ack',
};

const entryNameAck: ConversationStep = {
  id: 'entry.name_ack',
  module: 'entry',
  widgetType: 'none',
  getScript: (persona, state) => {
    const t = getT(state.language);
    const name = userName(state);
    if (state.intent === 'check_gaps') {
      return {
        botMessages: [t.scripts.nameAckGap(name)],
      };
    }
    if (state.intent === 'switch') {
      return {
        botMessages: [t.scripts.nameAckSwitch(name)],
      };
    }
    return {
      botMessages: [t.scripts.nameAck(name)],
    };
  },
  processResponse: () => ({}),
  getNextStep: (_, state) => {
    // If coming from landing page with specific intent, skip the intent selection
    if (state.intent === 'check_gaps') return 'gap_analysis.intro';
    if (state.intent === 'switch') return 'gap_analysis.switch_intro';
    return 'intent.readiness';
  },
};

/* ═══════════════════════════════════════════════
   MODULE: INTENT — Where are you in your journey?
   ═══════════════════════════════════════════════ */

const intentReadiness: ConversationStep = {
  id: 'intent.readiness',
  module: 'intent',
  widgetType: 'selection_cards',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.intentQuestion(userName(state))],
      options: [
        { id: 'exploring', label: t.scripts.justExploring, description: t.scripts.justExploringSub, icon: 'search' },
        { id: 'ready_to_buy', label: t.scripts.readyToPurchase, description: t.scripts.readyToPurchaseSub, icon: 'check' },
        { id: 'switch', label: t.scripts.checkGapsSwitch, description: t.scripts.checkGapsSwitchSub, icon: 'switch' },
        { id: 'not_sure', label: t.scripts.notSureWhatToBuy, description: t.scripts.notSureWhatToBuySub, icon: 'help' },
      ],
      secondaryOptions: [
        { id: 'comparing', label: t.scripts.seeHowDifferent },
        { id: 'parents_ped', label: t.scripts.parentsWithPed },
        { id: 'compare_policy', label: t.scripts.compareWithCurrent },
      ],
    };
  },
  processResponse: (response) => {
    const intentMap: Record<string, any> = {
      exploring: 'exploring',
      comparing: 'compare',
      ready_to_buy: 'which_plan',
      switch: 'switch',
      not_sure: 'exploring',
      parents_ped: 'exploring',
      compare_policy: 'switch',
    };
    return {
      intent: intentMap[response] || 'exploring',
      wantsGapAnalysis: response === 'switch' || response === 'compare_policy',
    };
  },
  getNextStep: (response) => {
    if (response === 'switch' || response === 'compare_policy') return 'gap_analysis.switch_intro';
    if (response === 'comparing' || response === 'exploring' || response === 'not_sure') return 'intent.acko_usps';
    if (response === 'parents_ped') return 'family.who_to_cover';
    return 'family.who_to_cover';
  },
};

/* ═══════════════════════════════════════════════
   MODULE: INTENT — ACKO USPs (for "comparing" flow)
   ═══════════════════════════════════════════════ */

const intentAckoUsps: ConversationStep = {
  id: 'intent.acko_usps',
  module: 'intent',
  widgetType: 'usp_cards',
  getScript: (persona, state) => {
    const t = getT(state.language);
    const isExploring = state.intent === 'exploring';
    return {
      botMessages: [
        isExploring ? t.scripts.uspsExploring(userName(state)) : t.scripts.uspsComparing(userName(state)),
      ],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'family.who_to_cover',
};

/* ═══════════════════════════════════════════════
   MODULE: GAP ANALYSIS — Understand coverage gaps
   ═══════════════════════════════════════════════ */

const gapAnalysisIntro: ConversationStep = {
  id: 'gap_analysis.intro',
  module: 'gap_analysis',
  widgetType: 'none',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.gapIntro(userName(state))],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'gap_analysis.method',
};

const gapAnalysisSwitchIntro: ConversationStep = {
  id: 'gap_analysis.switch_intro',
  module: 'gap_analysis',
  widgetType: 'none',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.gapSwitchIntro(userName(state))],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'gap_analysis.method',
};

const gapAnalysisMethod: ConversationStep = {
  id: 'gap_analysis.method',
  module: 'gap_analysis',
  widgetType: 'selection_cards',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.gapMethodQ],
      options: [
        { id: 'upload', label: t.scripts.uploadPdf, description: t.scripts.uploadPdfSub, icon: 'document' },
        { id: 'questions', label: t.scripts.answerQuestions, description: t.scripts.answerQuestionsSub, icon: 'chat_bubble' },
      ],
    };
  },
  processResponse: () => ({}),
  getNextStep: (response) => response === 'upload' ? 'gap_analysis.upload_pdf' : 'gap_analysis.insurer_name',
};

/* ── PDF Upload path ── */

const gapAnalysisUploadPdf: ConversationStep = {
  id: 'gap_analysis.upload_pdf',
  module: 'gap_analysis',
  widgetType: 'pdf_upload',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.pdfUploadMsg],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'gap_analysis.pdf_results',
};

const gapAnalysisPdfResults: ConversationStep = {
  id: 'gap_analysis.pdf_results',
  module: 'gap_analysis',
  widgetType: 'gap_results',
  getScript: (persona, state) => {
    const insurer = state.pdfExtractedData?.insurer || 'your insurer';
    const plan = state.pdfExtractedData?.planName || 'your plan';
    return {
      botMessages: [
        `${userName(state)}, I've analysed your ${plan} from ${insurer}. Here's a side-by-side comparison showing exactly where your current plan falls short — and how ACKO fills those gaps.`,
      ],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'gap_analysis.pdf_next',
};

const gapAnalysisPdfNext: ConversationStep = {
  id: 'gap_analysis.pdf_next',
  module: 'gap_analysis',
  widgetType: 'none',
  getScript: (persona, state) => {
    const t = getT(state.language);
    const extracted = state.pdfExtractedData;
    const memberInfo = extracted?.members?.length
      ? `I can see your policy covers ${extracted.members.join(' and ')}.`
      : '';
    return {
      botMessages: [t.scripts.pdfNextPreFill(memberInfo)],
    };
  },
  processResponse: (_, state) => {
    // Pre-populate family data from PDF extraction
    const extracted = state.pdfExtractedData;
    if (!extracted) return {};
    return {
      coverageFor: ['self', 'spouse'],
      members: [
        { id: 'self', relation: 'self' as const, name: 'You', age: 32, conditions: [] },
        { id: 'spouse', relation: 'spouse' as const, name: 'Spouse', age: 30, conditions: [] },
      ],
      pincode: '560001',
      nearbyHospitals: 42,
    };
  },
  getNextStep: () => 'gap_analysis.confirm_details',
};

const gapAnalysisConfirmDetails: ConversationStep = {
  id: 'gap_analysis.confirm_details',
  module: 'gap_analysis',
  widgetType: 'confirm_details',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.pdfPreFill],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'health.conditions',
};

/* ── Questions path ── */

const gapAnalysisInsurerName: ConversationStep = {
  id: 'gap_analysis.insurer_name',
  module: 'gap_analysis',
  widgetType: 'selection_cards',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.currentInsurerQ],
    options: [
      { id: 'star_health', label: 'Star Health' },
      { id: 'hdfc_ergo', label: 'HDFC ERGO' },
      { id: 'care_health', label: 'Care Health' },
      { id: 'niva_bupa', label: 'Niva Bupa' },
      { id: 'bajaj_allianz', label: 'Bajaj Allianz' },
      { id: 'icici_lombard', label: 'ICICI Lombard' },
      { id: 'employer_gmc', label: 'Employer GMC only' },
      { id: 'other', label: 'Other insurer' },
    ],
    };
  },
  processResponse: (response) => ({ existingInsurer: response }),
  getNextStep: () => 'gap_analysis.current_si',
};

const gapAnalysisCurrentSI: ConversationStep = {
  id: 'gap_analysis.current_si',
  module: 'gap_analysis',
  widgetType: 'selection_cards',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.currentSIQ],
    options: [
      { id: '300000', label: '₹3 Lakhs' },
      { id: '500000', label: '₹5 Lakhs' },
      { id: '1000000', label: '₹10 Lakhs' },
      { id: '2500000', label: '₹25 Lakhs or more' },
      { id: '0', label: 'Not sure' },
    ],
    };
  },
  processResponse: (response) => ({
    totalExistingCover: parseInt(response) || null,
    gmcAmount: parseInt(response) || null,
  }),
  getNextStep: () => 'gap_analysis.plan_features',
};

const gapAnalysisPlanFeatures: ConversationStep = {
  id: 'gap_analysis.plan_features',
  module: 'gap_analysis',
  widgetType: 'multi_select',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.planFeaturesQ],
    options: [
      { id: 'no_room_limit', label: 'No room rent limit', icon: 'hospital' },
      { id: 'consumables', label: 'Consumables covered', icon: 'pill' },
      { id: 'inflation_protect', label: 'Inflation Protect (SI increase)', icon: 'refresh' },
      { id: 'no_copay', label: 'No co-payment', icon: 'shield' },
      { id: 'zero_waiting', label: 'Zero/low waiting period', icon: 'clock' },
      { id: 'not_sure', label: 'Not sure about any of these', icon: 'help' },
    ],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'gap_analysis.questions_results',
};

const gapAnalysisQuestionsResults: ConversationStep = {
  id: 'gap_analysis.questions_results',
  module: 'gap_analysis',
  widgetType: 'gap_results',
  getScript: (persona, state) => {
    const t = getT(state.language);
    const cover = state.totalExistingCover;
    const coverLabel = cover ? `₹${(cover / 100000).toFixed(0)} lakhs` : 'your current cover';
    const insurer = state.existingInsurer?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Your insurer';
    return {
      botMessages: [t.scripts.gapResults(userName(state), coverLabel, insurer)],
    };
  },
  processResponse: () => ({}),
  // The gap_results widget has a built-in CTA "Find the right ACKO plan" — routes to family profiling
  getNextStep: (_, state) => {
    // If we have PDF data, skip some questions since we already know insurer, SI, etc.
    if (state.pdfExtractedData) return 'gap_analysis.pdf_next';
    return 'gap_analysis.proceed';
  },
};

/* ── Common gap analysis post-results ── */

const gapAnalysisProceed: ConversationStep = {
  id: 'gap_analysis.proceed',
  module: 'gap_analysis',
  widgetType: 'none',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.gapProceed],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'family.who_to_cover',
};


/* ═══════════════════════════════════════════════
   MODULE: FAMILY PROFILING
   ═══════════════════════════════════════════════ */

const familyWhoToCover: ConversationStep = {
  id: 'family.who_to_cover',
  module: 'family',
  widgetType: 'multi_select',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.whoToCoverQ],
      options: [
        { id: 'self', label: t.widgets.myself, icon: 'user' },
        { id: 'spouse', label: t.widgets.spouse, icon: 'heart' },
        { id: 'children', label: t.widgets.children, icon: 'child' },
        { id: 'father', label: t.widgets.father, icon: 'father' },
        { id: 'mother', label: t.widgets.mother, icon: 'mother' },
        { id: 'father_in_law', label: t.widgets.fatherInLaw, icon: 'father' },
        { id: 'mother_in_law', label: t.widgets.motherInLaw, icon: 'mother' },
      ],
    };
  },
  processResponse: (response: string[]) => {
    const childrenEntry = response.find((r: string) => r.startsWith('children'));
    const numChildren = childrenEntry?.includes(':') ? parseInt(childrenEntry.split(':')[1]) || 1 : childrenEntry ? 1 : 0;
    const coverageFor = response.map((r: string) => r.startsWith('children:') ? 'children' : r);
    const hasParents = coverageFor.some(c => ['father', 'mother', 'father_in_law', 'mother_in_law'].includes(c));
    return {
      coverageFor,
      numChildren,
      buyingForParents: hasParents && !coverageFor.includes('self'),
    };
  },
  getNextStep: (_response: string[], state: JourneyState) => {
    // If self is not selected, show confirmation before proceeding
    if (!state.coverageFor.includes('self')) return 'family.self_exclusion_confirm';
    return 'family.cover_ack';
  },
};

// Self-exclusion confirmation — shown when user selects members but not themselves
const familySelfExclusionConfirm: ConversationStep = {
  id: 'family.self_exclusion_confirm',
  module: 'family',
  widgetType: 'selection_cards',
  getScript: () => ({
    botMessages: [`You've excluded yourself from coverage. Are you sure you want to continue without adding yourself?`],
    options: [
      { id: 'exclude', label: 'Yes — exclude me', icon: 'check' },
      { id: 'include', label: 'No — include me', icon: 'plus' },
    ],
  }),
  processResponse: (response, state) => {
    if (response === 'include') {
      return {
        coverageFor: ['self', ...state.coverageFor.filter(c => c !== 'self')],
        buyingForParents: false,
      };
    }
    return {};
  },
  getNextStep: () => 'family.cover_ack',
};

const familyCoverAck: ConversationStep = {
  id: 'family.cover_ack',
  module: 'family',
  widgetType: 'none',
  getScript: (persona, state) => {
    const t = getT(state.language);
    const covering = state.coverageFor;
    const count = covering.length;
    const hasParents = covering.includes('father') || covering.includes('mother');
    const hasSpouse = covering.includes('spouse');
    const hasKids = covering.includes('children');
    const onlySelf = count === 1 && covering.includes('self');
    const name = userName(state);

    let message = '';
    if (onlySelf) {
      message = t.scripts.coverAckSelf(name);
    } else if (hasParents && hasSpouse) {
      message = t.scripts.coverAckParentsSpouse(name, count);
    } else if (hasParents && !hasSpouse) {
      message = t.scripts.coverAckParents(name);
    } else if (hasSpouse && hasKids) {
      message = t.scripts.coverAckSpouseKids(name);
    } else if (hasSpouse && !hasParents) {
      message = t.scripts.coverAckSpouse(name);
    } else {
      message = t.scripts.coverAckGeneric(name, count);
    }

    return { botMessages: [message] };
  },
  processResponse: () => ({}),
  getNextStep: (_, state) => {
    // Parents-only (no self): go directly to parents age
    if (!state.coverageFor.includes('self')) {
      return 'family.parents_age';
    }
    // Self + Spouse: ask eldest age (single question)
    if (state.coverageFor.includes('spouse')) {
      return 'family.spouse_age';
    }
    return 'family.your_age';
  },
};

// If self only (no spouse) — ask self age directly
const familyYourAge: ConversationStep = {
  id: 'family.your_age',
  module: 'family',
  widgetType: 'number_input',
  condition: (state) => state.coverageFor.includes('self') && !state.coverageFor.includes('spouse'),
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.ageQ],
      placeholder: t.scripts.agePlaceholder,
      inputType: 'number',
      min: 18,
      max: 99,
    };
  },
  processResponse: (response, state) => {
    const age = parseInt(response);
    const member = { id: 'self', relation: 'self' as const, name: 'You', age, conditions: [] };
    return {
      members: [...state.members.filter(m => m.relation !== 'self'), member],
      hasSenior: age >= 45,
    };
  },
  getNextStep: (_, state) => {
    const hasParents = state.coverageFor.some(c => ['father', 'mother', 'father_in_law', 'mother_in_law'].includes(c));
    if (hasParents) return 'family.parents_age';
    return 'family.age_ack';
  },
};

// Self + Spouse — ask age of the eldest only (single question)
const familySpouseAge: ConversationStep = {
  id: 'family.spouse_age',
  module: 'family',
  widgetType: 'number_input',
  condition: (state) => state.coverageFor.includes('self') && state.coverageFor.includes('spouse'),
  getScript: () => ({
    botMessages: [`What is the age of the eldest between you and your spouse?`],
    placeholder: 'Age of the eldest',
    inputType: 'number',
    min: 18,
    max: 99,
  }),
  processResponse: (response, state) => {
    const eldestAge = parseInt(response);
    // Store eldest as self, approximate spouse as slightly younger
    const selfMember = { id: 'self', relation: 'self' as const, name: 'You', age: eldestAge, conditions: [] };
    const spouseMember = { id: 'spouse', relation: 'spouse' as const, name: 'Spouse', age: Math.max(18, eldestAge - 2), conditions: [] };
    const members = [
      ...state.members.filter(m => m.relation !== 'self' && m.relation !== 'spouse'),
      selfMember,
      spouseMember,
    ];
    // Add children with estimated ages
    if (state.coverageFor.includes('children')) {
      const numKids = state.numChildren || 1;
      for (let i = 0; i < numKids; i++) {
        members.push({
          id: `child_${i + 1}`,
          relation: 'children' as any,
          name: `Child ${i + 1}`,
          age: Math.max(1, eldestAge - 28 + i * 2),
          conditions: [],
        });
      }
    }
    return { members, hasSenior: eldestAge >= 45 };
  },
  getNextStep: (_, state) => {
    const hasParents = state.coverageFor.some(c => ['father', 'mother', 'father_in_law', 'mother_in_law'].includes(c));
    if (hasParents) return 'family.parents_age';
    return 'family.age_ack';
  },
};

/* Parents/in-laws eldest age — asked separately when parents are selected (feedback #15b) */
const familyParentsAge: ConversationStep = {
  id: 'family.parents_age',
  module: 'family',
  widgetType: 'number_input',
  condition: (state) => state.coverageFor.some(c => ['father', 'mother', 'father_in_law', 'mother_in_law'].includes(c)),
  getScript: (persona, state) => {
    const parentMembers = state.coverageFor.filter(c => ['father', 'mother', 'father_in_law', 'mother_in_law'].includes(c));
    const who = parentMembers.length === 1 ? `your ${parentMembers[0].replace(/_/g, '-')}` : 'the eldest parent you\'d like to cover';
    return {
      botMessages: [`How old is ${who}? ${parentMembers.length > 1 ? 'Enter the age of the eldest parent.' : ''}`],
      placeholder: "Eldest parent's age",
      inputType: 'number',
      min: 35,
      max: 99,
    };
  },
  processResponse: (response, state) => {
    const age = parseInt(response);
    const parentRelations = state.coverageFor.filter(c => ['father', 'mother', 'father_in_law', 'mother_in_law'].includes(c));
    const newMembers = parentRelations.map((relation, i) => ({
      id: relation,
      relation: relation as any,
      name: relation.charAt(0).toUpperCase() + relation.slice(1).replace(/_/g, ' '),
      age: i === 0 ? age : Math.max(35, age - 3),
      conditions: [],
    }));
    return {
      members: [...state.members.filter(m => !['father', 'mother', 'father_in_law', 'mother_in_law'].includes(m.relation)), ...newMembers],
      hasSenior: state.hasSenior || age >= 45,
    };
  },
  getNextStep: () => 'family.age_ack',
};

/* Legacy step kept as alias for backward compatibility */
const familyEldestAge: ConversationStep = {
  id: 'family.eldest_age',
  module: 'family',
  widgetType: 'number_input',
  condition: (state) => state.coverageFor.some(c => c !== 'self'),
  getScript: (persona, state) => {
    const t = getT(state.language);
    const others = state.coverageFor.filter(c => c !== 'self');
    const who = others.length === 1 ? `your ${others[0]}` : 'the eldest family member you\'d like to cover';
    return {
      botMessages: [t.scripts.eldestAgeQ(who, others.length > 1)],
      placeholder: t.scripts.eldestAgePlaceholder,
      inputType: 'number',
      min: 1,
      max: 99,
    };
  },
  processResponse: (response, state) => {
    const age = parseInt(response);
    const others = state.coverageFor.filter(c => c !== 'self');
    const newMembers = others.map((relation, i) => ({
      id: relation,
      relation: relation as any,
      name: relation.charAt(0).toUpperCase() + relation.slice(1),
      age: i === 0 ? age : Math.max(1, age - 5 * (i)),
      conditions: [],
    }));
    return {
      members: [...state.members.filter(m => m.relation === 'self'), ...newMembers],
      hasSenior: state.hasSenior || age >= 45,
    };
  },
  getNextStep: () => 'family.age_ack',
};

const familyAgeAck: ConversationStep = {
  id: 'family.age_ack',
  module: 'family',
  widgetType: 'none',
  getScript: (persona, state) => {
    const t = getT(state.language);
    const selfAge = state.members.find(m => m.relation === 'self')?.age || 0;
    const memberCount = state.members.length;
    const eldestAge = Math.max(...state.members.map(m => m.age || 0));
    const name = userName(state);
    const hasParents = state.coverageFor.some(c => ['father', 'mother', 'father_in_law', 'mother_in_law'].includes(c));

    let ageInsight = '';
    if (eldestAge >= 55) {
      ageInsight = hasParents ? t.scripts.ageInsightSeniorParents(name) : t.scripts.ageInsightSeniorOther(name);
    } else if (eldestAge >= 45) {
      ageInsight = hasParents ? t.scripts.ageInsightMidParents(name) : t.scripts.ageInsightMidOther(name);
    } else if (selfAge <= 30 && memberCount === 1) {
      ageInsight = t.scripts.ageInsightYoung(selfAge);
    } else if (selfAge <= 35 && memberCount >= 2 && eldestAge < 40) {
      ageInsight = t.scripts.ageInsightYoungFamily(name);
    } else {
      ageInsight = t.scripts.ageInsightGeneric(name);
    }

    return {
      botMessages: [`${ageInsight}\n\n${t.scripts.ageAckHospitalIntro}`],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'family.pincode',
};

/* ── Pincode ── */
const familyPincode: ConversationStep = {
  id: 'family.pincode',
  module: 'family',
  widgetType: 'pincode_input',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.pincodeQ],
      placeholder: t.scripts.pincodePlaceholder,
      inputType: 'tel',
      min: 100000,
      max: 999999,
    };
  },
  processResponse: (response) => {
    const { getHospitalCount } = require('./plans');
    const count = getHospitalCount(response);
    return { pincode: response, nearbyHospitals: count };
  },
  getNextStep: () => 'family.pincode_result',
};

const familyPincodeResult: ConversationStep = {
  id: 'family.pincode_result',
  module: 'family',
  widgetType: 'hospital_list',
  getScript: (persona, state) => {
    const t = getT(state.language);
    const count = state.nearbyHospitals || 0;
    return {
      botMessages: [t.scripts.hospitalResult(count)],
    };
  },
  processResponse: () => ({}),
  getNextStep: (_, state) => {
    // If user already provided insurance info via gap analysis or PDF, skip asking again
    if (state.pdfExtractedData || (state.intent === 'check_gaps' || state.intent === 'switch')) {
      if (state.totalExistingCover || state.coverageStatus) return 'health.conditions';
    }
    // Parents-only purchasers skip the workplace question
    if (state.buyingForParents && !state.coverageFor.includes('self')) {
      return 'coverage.existing_policy';
    }
    return 'coverage.workplace_insurance';
  },
};

/* ═══════════════════════════════════════════════
   MODULE: EXISTING COVERAGE
   ═══════════════════════════════════════════════ */

// Step 1: Does your workplace offer health insurance?
const coverageWorkplaceInsurance: ConversationStep = {
  id: 'coverage.workplace_insurance',
  module: 'coverage',
  widgetType: 'selection_cards',
  getScript: (_, state) => ({
    botMessages: [`${userName(state)}, does your workplace offer health insurance?`],
    options: [
      { id: 'yes', label: 'Yes, it does', icon: 'building' },
      { id: 'no', label: 'No, it doesn\'t', icon: 'x' },
      { id: 'not_sure', label: 'I\'m not sure', icon: 'help' },
    ],
  }),
  processResponse: (response) => ({
    coverageStatus: response === 'yes' ? 'gmc' : 'none',
  }),
  getNextStep: () => 'coverage.existing_policy',
};

// Step 2: Apart from that, have you or your family bought a health insurance policy?
const coverageExistingPolicy: ConversationStep = {
  id: 'coverage.existing_policy',
  module: 'coverage',
  widgetType: 'selection_cards',
  getScript: (_, state) => ({
    botMessages: [`Apart from that, have you or anyone in your family bought a health insurance policy?`],
    options: [
      { id: 'none', label: 'No', icon: 'x' },
      { id: 'one_policy', label: 'Yes, we have one policy', icon: 'document' },
      { id: 'multiple_policies', label: 'Yes, we have a couple of policies', icon: 'stack' },
      { id: 'not_sure', label: 'I\'m not sure', icon: 'help' },
    ],
  }),
  processResponse: (response, state) => {
    if (response === 'one_policy') {
      return { coverageStatus: state.coverageStatus === 'gmc' ? 'both' : 'individual_policy' };
    }
    return {};
  },
  getNextStep: (response) => {
    if (response === 'multiple_policies') return 'coverage.complex_case';
    if (response === 'one_policy') return 'coverage.total_cover';
    return 'health.conditions';
  },
};

// Complex case — redirect to Talk to Expert
const coverageComplexCase: ConversationStep = {
  id: 'coverage.complex_case',
  module: 'coverage',
  widgetType: 'selection_cards',
  getScript: (_, state) => ({
    botMessages: [
      `${userName(state)}, managing multiple policies can get complicated — especially when it comes to claims, porting, and avoiding overlaps.\n\nI'd recommend speaking with one of our advisors who can review all your policies together and suggest the most efficient path forward.`,
    ],
    options: [
      { id: 'talk_to_expert', label: 'Talk to an Expert', icon: 'phone' },
      { id: 'continue_anyway', label: 'Continue on my own', icon: 'arrow' },
    ],
  }),
  processResponse: () => ({}),
  getNextStep: (response, state) => {
    if (response === 'talk_to_expert') {
      state.showExpertPanel = true;
      return 'coverage.complex_case';
    }
    return 'health.conditions';
  },
};

const coverageCurrentInsurance: ConversationStep = {
  id: 'coverage.current_insurance',
  module: 'coverage',
  widgetType: 'multi_select',
  getScript: (persona, state) => {
    const t = getT(state.language);
    const hasSpouse = state.coverageFor.includes('spouse');
    const question = hasSpouse
      ? `${userName(state)}, do you or your spouse currently have any health insurance? Select all that apply.\n\nThis helps me suggest the right coverage for the family.`
      : t.scripts.currentInsuranceQ(userName(state));
    return {
      botMessages: [question],
      options: [
        { id: 'gmc', label: t.scripts.employerGMC, icon: 'building' },
        { id: 'personal', label: t.scripts.personalPolicy, icon: 'document' },
        { id: 'none', label: t.scripts.noInsurance, icon: 'plus' },
      ],
    };
  },
  processResponse: (response) => {
    const hasGmc = response.includes('gmc');
    const hasPersonal = response.includes('personal');
    let status: any = 'none';
    if (hasGmc && hasPersonal) status = 'both';
    else if (hasGmc) status = 'gmc';
    else if (hasPersonal) status = 'individual_policy';
    return { coverageStatus: status };
  },
  getNextStep: (response) => {
    if (response.includes('none') && response.length === 1) return 'coverage.no_insurance_ack';
    return 'coverage.total_cover';
  },
};

const coverageTotalCover: ConversationStep = {
  id: 'coverage.total_cover',
  module: 'coverage',
  widgetType: 'selection_cards',
  getScript: (persona, state) => {
    const t = getT(state.language);
    const hasGmc = state.coverageStatus === 'gmc' || state.coverageStatus === 'both';
    const hasPersonal = state.coverageStatus === 'individual_policy' || state.coverageStatus === 'both';
    let context = hasGmc && hasPersonal ? t.scripts.totalCoverContextGmcBoth : hasGmc ? t.scripts.totalCoverContextGmc : t.scripts.totalCoverContextPolicy;
    return {
      botMessages: [context + t.scripts.totalCoverSuffix],
      options: [
        { id: '300000', label: '₹3 lakhs' },
        { id: '500000', label: '₹5 lakhs' },
        { id: '1000000', label: '₹10 lakhs' },
        { id: '2500000', label: '₹25 lakhs or more' },
        { id: '0', label: 'Not sure' },
      ],
    };
  },
  processResponse: (response) => ({
    totalExistingCover: parseInt(response) || null,
    gmcAmount: parseInt(response) || null,
  }),
  getNextStep: (_, state) => {
    const hasGmc = state.coverageStatus === 'gmc' || state.coverageStatus === 'both';
    if (hasGmc || state.wantsGapAnalysis) return 'coverage.gap_check';
    if (state.coverageStatus === 'individual_policy') return 'coverage.switch_ack';
    return 'health.conditions';
  },
};

const coverageGapCheck: ConversationStep = {
  id: 'coverage.gap_check',
  module: 'coverage',
  widgetType: 'selection_cards',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.gapCheckQ],
      options: [
        { id: 'yes', label: t.scripts.gapCheckYes, icon: 'search', description: t.scripts.gapCheckYesSub },
        { id: 'skip', label: t.scripts.gapCheckSkip, icon: 'forward' },
      ],
    };
  },
  processResponse: (response) => ({ wantsGapAnalysis: response === 'yes' }),
  getNextStep: (response) => response === 'yes' ? 'coverage.gap_scenario' : 'health.conditions',
};

/* Gap scenario broken into multiple messages for better engagement (feedback #21) */
const coverageGapScenario: ConversationStep = {
  id: 'coverage.gap_scenario',
  module: 'coverage',
  widgetType: 'selection_cards',
  getScript: (persona, state) => {
    const name = userName(state);
    return {
      botMessages: [
        `${name}, let me walk you through a real scenario — this happens to thousands of Indian families every year.`,
      ],
      options: [{ id: 'continue', label: 'Show me', icon: 'arrow' }],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'coverage.gap_scenario_2',
};

const coverageGapScenario2: ConversationStep = {
  id: 'coverage.gap_scenario_2',
  module: 'coverage',
  widgetType: 'selection_cards',
  getScript: (persona, state) => {
    const city = cityFromPincode(state.pincode);
    const spouseText = state.coverageFor.includes('spouse') ? 'you or your spouse' : 'you';
    const nearestHospital = city === 'Bangalore' ? 'Manipal Hospital (5.4 km away)' : 'a leading multi-speciality hospital nearby';
    return {
      botMessages: [
        `**Scenario: Sudden cardiac arrest.**\n\nLet's say ${spouseText} experiences an emergency. Ambulance called, admitted to ${nearestHospital}.\n\nDoctors act fast — ICU, monitoring, surgery prep.`,
      ],
      options: [{ id: 'continue', label: 'What happens next?', icon: 'arrow' }],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'coverage.gap_scenario_3',
};

const coverageGapScenario3: ConversationStep = {
  id: 'coverage.gap_scenario_3',
  module: 'coverage',
  widgetType: 'selection_cards',
  getScript: (persona, state) => {
    return {
      botMessages: [
        `**ICU + surgery.**\n\nDoctors stabilise the condition in ICU — **2 nights at ₹50,000/night**.\n\nSurgery follows — bypass, stent, pacemaker. Total surgical bill: **₹14 lakhs**.\n\nPost-op recovery in a Single-AC room at ₹12,000/night for 5 nights.`,
      ],
      options: [{ id: 'continue', label: 'See what my insurance covers', icon: 'arrow' }],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'coverage.gap_scenario_4',
};

const coverageGapScenario4: ConversationStep = {
  id: 'coverage.gap_scenario_4',
  module: 'coverage',
  widgetType: 'selection_cards',
  getScript: (persona, state) => {
    const cover = state.totalExistingCover;
    const coverLabel = cover ? `₹${(cover / 100000).toFixed(0)}L` : 'your current cover';
    const hasGmc = state.coverageStatus === 'gmc' || state.coverageStatus === 'both';
    const policyType = hasGmc ? 'corporate insurance' : 'current policy';
    return {
      botMessages: [
        `**What your ${policyType} (${coverLabel}) actually covers:**\n\n✓ Surgeon fees, medicines, scans → ₹3.5L covered\n✗ ICU cap at ₹25K/night (actual: ₹50K) → **₹50K from your pocket**\n✗ Consumables not covered → **₹2.5L from your pocket**\n✗ Room rent sub-limit deduction → **₹1.5L from your pocket**\n✗ Ambulance shortfall → **₹5K from your pocket**\n\n**Total gap: ~₹4.5–5 lakhs** on a ₹14 lakh bill.`,
      ],
      options: [{ id: 'continue', label: 'That\'s a big gap — what\'s the fix?', icon: 'arrow' }],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'coverage.gap_scenario_5',
};

const coverageGapScenario5: ConversationStep = {
  id: 'coverage.gap_scenario_5',
  module: 'coverage',
  widgetType: 'none',
  getScript: (persona, state) => {
    const name = userName(state);
    const hasGmc = state.coverageStatus === 'gmc' || state.coverageStatus === 'both';
    const familySize = state.members.length;
    const familyNote = familySize > 2 ? `\n\nAnd don't forget — ${hasGmc ? 'your corporate insurance is a floater' : 'a single policy covers the whole family'}. With ${familySize} members, more than one emergency in a year would stretch it further.` : '';
    return {
      botMessages: [
        `${name}, as you can see — an unexpected emergency doesn't just affect your health, it can **drain your savings**.\n\nThat's why a **comprehensive personal health plan** alongside your ${hasGmc ? 'corporate insurance' : 'existing coverage'} is essential — it fills exactly these gaps.${familyNote}`,
      ],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'coverage.gap_insight',
};

const coverageGapInsight: ConversationStep = {
  id: 'coverage.gap_insight',
  module: 'coverage',
  widgetType: 'none',
  getScript: (persona, state) => {
    const t = getT(state.language);
    const hasGmc = state.coverageStatus === 'gmc' || state.coverageStatus === 'both';
    return {
      botMessages: [hasGmc ? t.scripts.gapInsightGmc : t.scripts.gapInsightOther],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'health.conditions',
};

const coverageNoInsuranceAck: ConversationStep = {
  id: 'coverage.no_insurance_ack',
  module: 'coverage',
  widgetType: 'none',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.noInsuranceAck(userName(state))],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'health.conditions',
};

const coverageSwitchAck: ConversationStep = {
  id: 'coverage.switch_ack',
  module: 'coverage',
  widgetType: 'none',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.switchAck],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'health.conditions',
};

/* ═══════════════════════════════════════════════
   MODULE: HEALTH
   ═══════════════════════════════════════════════ */

const healthConditions: ConversationStep = {
  id: 'health.conditions',
  module: 'health',
  widgetType: 'multi_select',
  getScript: (persona, state) => {
    const t = getT(state.language);
    const conditionsList = getConditionsList(state.language);
    return {
      botMessages: [t.scripts.conditionsQ],
      options: conditionsList.map(c => ({
        id: c.id,
        label: c.label,
        icon: c.id === 'none' ? 'check_circle' : undefined,
      })),
    };
  },
  processResponse: (response) => {
    const hasConditions = !response.includes('none') && response.length > 0;
    const hasHeartCondition = response.includes('heart_disease') || response.includes('stroke');
    const hasSevereCondition = response.includes('cancer') || response.includes('organ_transplant') || hasHeartCondition;
    return { hasConditions, hasHeartCondition, hasSevereCondition, memberConditions: { general: response } };
  },
  getNextStep: (response) => {
    if (response.includes('none') || response.length === 0) return 'health.healthy_ack';
    return 'health.conditions_ack';
  },
};

const healthHealthyAck: ConversationStep = {
  id: 'health.healthy_ack',
  module: 'health',
  widgetType: 'none',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.healthyAck(userName(state), familySummary(state))],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'customization.si_selection',
};

const healthConditionsAck: ConversationStep = {
  id: 'health.conditions_ack',
  module: 'health',
  widgetType: 'selection_cards',
  getScript: (persona, state) => {
    const t = getT(state.language);
    const conditions = Object.values(state.memberConditions).flat();
    const hasDiabetes = conditions.some((c: string) => c.toLowerCase().includes('diabet'));
    let msg = t.scripts.conditionsAck(userName(state));
    if (hasDiabetes) {
      msg += `\n\n**Did you know?** Over 40% of Indian adults are either diabetic or pre-diabetic.\n\nACKO's plans cover diabetes-related hospitalisations — including insulin, dialysis, and related complications. No unfair exclusions, and your cover grows **10% every year** with Inflation Protect.`;
    }
    return {
      botMessages: [msg],
      options: [{ id: 'got_it', label: 'Got it, continue', icon: 'check' }],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'health.conditions_understood',
};

/* Pause for user acknowledgement after PED message before moving to SI (feedback #22) */
const healthConditionsUnderstood: ConversationStep = {
  id: 'health.conditions_understood',
  module: 'health',
  widgetType: 'selection_cards',
  getScript: (persona, state) => {
    return {
      botMessages: ['Got it? Ready to look at coverage options?'],
      options: [
        { id: 'yes', label: 'Yes, show me options', icon: 'check' },
        { id: 'questions', label: 'I have a question first', icon: 'help' },
      ],
    };
  },
  processResponse: () => ({}),
  getNextStep: (response) => {
    if (response === 'questions') return 'health.conditions_understood';
    return 'customization.si_selection';
  },
};

/* ═══════════════════════════════════════════════
   MODULE: SUM INSURED
   ═══════════════════════════════════════════════ */

const customizationSI: ConversationStep = {
  id: 'customization.si_selection',
  module: 'customization',
  widgetType: 'selection_cards',
  getScript: (persona, state) => {
    const t = getT(state.language);
    const siOptions = getSiOptions(state.language);
    const eldestAge = Math.max(...state.members.map(m => m.age || 0), 0);
    const memberCount = state.members.length;
    const city = cityFromPincode(state.pincode);
    let recommendedSI = 2500000;
    let reason = '';

    if (eldestAge >= 50 || state.hasConditions || memberCount >= 3) {
      recommendedSI = 10000000;
      reason = state.hasConditions
        ? `With pre-existing conditions, higher coverage ensures you're protected even during long treatments.`
        : `With ${memberCount} members and age factors, higher coverage gives your family real protection.`;
    } else if (eldestAge >= 35 || memberCount >= 2) {
      recommendedSI = 5000000;
      reason = `For a family of ${memberCount} in the ${eldestAge < 45 ? '30s-40s' : '40s-50s'} range, this balances coverage and affordability well.`;
    } else {
      recommendedSI = 2500000;
      reason = 'For a young, healthy individual this provides solid coverage without overpaying.';
    }

    const existingCover = state.totalExistingCover;
    const gapNote = existingCover && existingCover > 0
      ? `\n\nYou already have ₹${(existingCover / 100000).toFixed(0)}L cover. A top-up or fresh plan at this level protects you for bills your current policy can't handle.`
      : '';

    const recLabel = siOptions.find(s => s.value === recommendedSI)?.label || t.plans.si25L;
    return {
      botMessages: [
        `Based on ${familySummary(state)}'s profile${state.pincode ? ` in ${city}` : ''}, I'd recommend **₹${recLabel}** coverage.\n\n${reason}\n\nFor context — in ${city}, a **bypass surgery** costs ₹8–12 lakhs, and **cancer treatment** can go up to ₹25 lakhs.${gapNote}\n\nBut you can choose what feels right.`
      ],
      options: siOptions.map(si => ({
        id: String(si.value),
        label: '₹' + si.label,
        description: si.description,
        icon: si.value === recommendedSI ? 'star' : undefined,
        badge: si.value === recommendedSI ? t.common.recommended : undefined,
      })),
    };
  },
  processResponse: (response, state) => {
    const si = parseInt(response);
    // Store recommended SI so we can compare for rebuttal
    const eldestAge = Math.max(...state.members.map(m => m.age || 0), 0);
    const memberCount = state.members.length;
    let recommendedSI = 2500000;
    if (eldestAge >= 50 || state.hasConditions || memberCount >= 3) recommendedSI = 10000000;
    else if (eldestAge >= 35 || memberCount >= 2) recommendedSI = 5000000;
    return { sumInsured: si };
  },
  getNextStep: (response, state) => {
    const si = parseInt(response);
    const eldestAge = Math.max(...state.members.map(m => m.age || 0), 0);
    const memberCount = state.members.length;
    let recommendedSI = 2500000;
    if (eldestAge >= 50 || state.hasConditions || memberCount >= 3) recommendedSI = 10000000;
    else if (eldestAge >= 35 || memberCount >= 2) recommendedSI = 5000000;
    // Rebuttal if user picked significantly lower than recommended (feedback #24)
    if (si < recommendedSI) return 'customization.si_rebuttal';
    return 'recommendation.calculating';
  },
};

/* SI Rebuttal — nudge user towards recommended coverage (feedback #24) */
const customizationSIRebuttal: ConversationStep = {
  id: 'customization.si_rebuttal',
  module: 'customization',
  widgetType: 'selection_cards',
  getScript: (persona, state) => {
    const selectedLabel = formatSI(state.sumInsured);
    const eldestAge = Math.max(...state.members.map(m => m.age || 0), 0);
    const memberCount = state.members.length;
    let recommendedSI = 2500000;
    if (eldestAge >= 50 || state.hasConditions || memberCount >= 3) recommendedSI = 10000000;
    else if (eldestAge >= 35 || memberCount >= 2) recommendedSI = 5000000;
    const recLabel = formatSI(recommendedSI);
    return {
      botMessages: [
        `**₹${selectedLabel}** may feel sufficient today — but medical costs in India are rising **14% year-on-year**.\n\nA single ICU stay in a metro can cost ₹8–15 lakhs. Cancer treatment can exceed ₹25 lakhs.\n\nI'd recommend **₹${recLabel}** — and with ACKO's **Inflation Protect**, your cover grows 10% every year automatically, so you're always ahead of medical inflation.`,
      ],
      options: [
        { id: String(recommendedSI), label: `Go with ₹${recLabel}`, icon: 'star', badge: 'Recommended' },
        { id: String(state.sumInsured), label: `Keep ₹${selectedLabel}`, icon: 'check' },
      ],
    };
  },
  processResponse: (response) => ({ sumInsured: parseInt(response) }),
  getNextStep: () => 'recommendation.calculating',
};

/* ═══════════════════════════════════════════════
   MODULE: RECOMMENDATION
   ═══════════════════════════════════════════════ */

const recommendationCalculating: ConversationStep = {
  id: 'recommendation.calculating',
  module: 'recommendation',
  widgetType: 'calculation',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.calculating],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'recommendation.result',
};

const recommendationResult: ConversationStep = {
  id: 'recommendation.result',
  module: 'recommendation',
  widgetType: 'plan_switcher',
  getScript: (persona, state) => {
    const t = getT(state.language);
    const name = userName(state);
    const hasGmc = state.coverageStatus === 'gmc' || state.coverageStatus === 'both';
    const siLabel = formatSI(state.sumInsured);
    const family = familySummary(state);
    const msg = hasGmc ? t.scripts.recommendationGmc(name, family, siLabel) : t.scripts.recommendationStandard(name, family, siLabel);
    return {
      botMessages: [msg],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'review.dob_collection',
};

/* ═══════════════════════════════════════════════
   MODULE: FREQUENCY
   ═══════════════════════════════════════════════ */

const customizationFrequency: ConversationStep = {
  id: 'customization.frequency',
  module: 'customization',
  widgetType: 'frequency_select',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.frequencyQ],
      options: [
        { id: 'monthly', label: t.common.monthly },
        { id: 'yearly', label: t.common.yearly, badge: t.scripts.saveEight },
      ],
    };
  },
  processResponse: (response) => ({ paymentFrequency: response }),
  getNextStep: () => 'review.summary',
};

/* ═══════════════════════════════════════════════
   MODULE: REVIEW
   ═══════════════════════════════════════════════ */

const reviewSummary: ConversationStep = {
  id: 'review.summary',
  module: 'review',
  widgetType: 'review_summary',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.reviewMsg(userName(state))],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'review.consent',
};

const reviewConsent: ConversationStep = {
  id: 'review.consent',
  module: 'review',
  widgetType: 'consent',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.consentMsg],
      links: [
        { label: 'Terms & Conditions', url: 'https://www.acko.com/terms-and-conditions/' },
        { label: 'Customer Information Sheet (CIS)', url: 'https://www.acko.com/health-insurance/cis/' },
      ],
      consentText: 'I acknowledge I have read and understood the Terms & Conditions and Customer Information Sheet.',
    };
  },
  processResponse: () => ({}),
  getNextStep: (_response, state) => {
    // Platinum Lite requires STP medical questions before payment
    if (state.selectedPlan?.tier === 'platinum_lite') return 'stp.medical_questions';
    return 'payment.method_selection';
  },
};

const reviewDobCollection: ConversationStep = {
  id: 'review.dob_collection',
  module: 'review',
  widgetType: 'dob_collection',
  getScript: (persona, state) => {
    const t = getT(state.language);
    const memberCount = state.members.length;
    const hasSelfSpouse = state.coverageFor.includes('self') && state.coverageFor.includes('spouse');
    const hasParents = state.coverageFor.includes('father') || state.coverageFor.includes('mother');
    const buyingForParents = state.buyingForParents;

    let contextMsg: string;
    if (buyingForParents && hasParents) {
      contextMsg = `${userName(state)}, please enter the date of birth for your parent${state.coverageFor.includes('father') && state.coverageFor.includes('mother') ? 's' : ''} — **start with the eldest**. Age determines exact premium pricing.`;
    } else if (hasSelfSpouse && hasParents) {
      contextMsg = `${userName(state)}, I'll need DOBs for all ${memberCount} members.\n\n**Start with the eldest between you and your spouse**, then your parent${state.coverageFor.includes('father') && state.coverageFor.includes('mother') ? 's' : ''}.`;
    } else if (hasSelfSpouse) {
      contextMsg = `Almost there, ${userName(state)}! Please enter DOBs — **start with the elder** between you and your spouse. Age determines pricing down to the day.`;
    } else {
      contextMsg = t.scripts.dobMsg(userName(state), memberCount);
    }

    return {
      botMessages: [contextMsg],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'review.dob_ack',
};

const reviewDobAck: ConversationStep = {
  id: 'review.dob_ack',
  module: 'review',
  widgetType: 'none',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.dobAck],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'customization.frequency',
};

/* ═══════════════════════════════════════════════
   MODULE: PAYMENT
   ═══════════════════════════════════════════════ */

/* TODO: Platinum Lite STP — awaiting 13 medical questions from product team.
   Once questions are provided, replace this placeholder with individual steps. */
const stpMedicalQuestions: ConversationStep = {
  id: 'stp.medical_questions',
  module: 'payment',
  widgetType: 'none',
  getScript: () => ({
    botMessages: [
      `For **ACKO Platinum Lite**, we need to ask a few quick health questions to enable immediate policy issuance.\n\nThis typically takes under 2 minutes — and if all answers are clear, your policy is issued instantly.`,
    ],
  }),
  processResponse: () => ({}),
  getNextStep: () => 'payment.method_selection',
};

const paymentMethodSelection: ConversationStep = {
  id: 'payment.method_selection',
  module: 'payment',
  widgetType: 'selection_cards',
  getScript: (persona, state) => {
    const isMonthly = state.paymentFrequency === 'monthly';
    const options: any[] = [
      { id: 'upi', label: 'UPI', description: 'GPay, PhonePe, Paytm & more', icon: 'upi' },
      { id: 'card', label: 'Credit / Debit Card', description: 'Visa, Mastercard, RuPay', icon: 'card' },
      { id: 'netbanking', label: 'Net Banking', description: 'All major banks supported', icon: 'bank' },
    ];
    if (!isMonthly) {
      options.push({ id: 'emi', label: 'EMI', description: 'No-cost EMI on select cards', icon: 'emi' });
    } else {
      options.push({ id: 'autopay', label: 'Set up AutoPay', description: 'Auto-debit mandate for monthly payments', icon: 'autopay', badge: 'Required for monthly' });
    }
    return {
      botMessages: [`How would you like to pay? Choose your preferred payment method.`],
      options,
    };
  },
  processResponse: (response) => ({ paymentMethod: response }),
  getNextStep: () => 'payment.process',
};

const paymentProcess: ConversationStep = {
  id: 'payment.process',
  module: 'payment',
  widgetType: 'payment_widget',
  getScript: (_, state) => {
    const t = getT(state.language);
    const freq = state.paymentFrequency === 'monthly' ? t.common.monthly.toLowerCase() : 'annual';
    return {
      botMessages: [t.scripts.paymentReady(freq)],
    };
  },
  processResponse: () => ({ paymentComplete: true }),
  getNextStep: () => 'payment.success',
};

const paymentSuccess: ConversationStep = {
  id: 'payment.success',
  module: 'payment',
  widgetType: 'celebration',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.paymentSuccess(userName(state))],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'payment.success', // Stop here — PostPaymentJourney takes over via page.tsx useEffect
};

/* ═══════════════════════════════════════════════
   MODULE: REPROPOSAL
   ═══════════════════════════════════════════════ */

const reproposalMandateUpdate: ConversationStep = {
  id: 'reproposal.mandate_update',
  module: 'payment',
  widgetType: 'selection_cards',
  getScript: (_, state) => {
    const isMonthly = state.paymentFrequency === 'monthly';
    return {
      botMessages: [
        isMonthly
          ? `Due to the revised premium from underwriting, your **monthly payment needs to be updated**.\n\nWe'll set up a new mandate for the revised amount. Your existing mandate will be cancelled automatically.\n\n*Note: If you pay via BASBA (Bank Account Statement Based Assessment), the updated amount will reflect in your next statement.*`
          : `Your premium has been revised by underwriting. The updated annual amount will be reflected at checkout.`,
      ],
      options: [{ id: 'confirm', label: 'Confirm and continue', icon: 'check' }],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'reproposal.explanation',
};

const reproposalOffer: ConversationStep = {
  id: 'reproposal.offer',
  module: 'payment',
  widgetType: 'selection_cards',
  getScript: (_, state) => ({
    botMessages: [
      `Based on the medical review, our underwriting team has made some adjustments to your policy.\n\nMost insurers may exclude or heavily load this condition. **This is the most balanced option available for your profile.**`,
    ],
    options: [
      { id: 'accept', label: 'Accept revised proposal', icon: 'check', badge: 'Recommended' },
      { id: 'decline', label: 'I\'d like to reconsider', icon: 'back' },
    ],
  }),
  processResponse: (response) => ({ wantsGapAnalysis: response === 'accept' } as Partial<JourneyState>),
  getNextStep: (response) => response === 'accept' ? 'reproposal.explanation' : 'recommendation.result',
};

const reproposalExplanation: ConversationStep = {
  id: 'reproposal.explanation',
  module: 'payment',
  widgetType: 'selection_cards',
  getScript: (_, state) => ({
    botMessages: [
      `Here's what changed in the revised proposal:\n\n• **Sum Insured** adjusted based on underwriting guidelines\n• A **small loading** may apply to reflect your health profile\n• All other benefits — No Room Rent Limit, 100% Bills, Inflation Protect — remain unchanged\n\nThis gives you real coverage without leaving your family exposed.`,
    ],
    options: [{ id: 'continue', label: 'Proceed to payment', icon: 'check' }],
  }),
  processResponse: () => ({}),
  getNextStep: (_, state) => {
    // If monthly and loading > 1 month premium diff, show mandate update
    if (state.paymentFrequency === 'monthly' && (state as any).hasLoading) return 'reproposal.mandate_update';
    return 'payment.method_selection';
  },
};

/* ═══════════════════════════════════════════════
   MODULE: TELE-MER (Mock Flow)
   ═══════════════════════════════════════════════ */

const telemerConnectPrompt: ConversationStep = {
  id: 'telemer.connect_prompt',
  module: 'payment',
  widgetType: 'selection_cards',
  getScript: () => ({
    botMessages: [
      `Your plan requires a quick **Tele-Medical Review** with our AI-assisted doctor.\n\nDr. Riya will walk you through a few health questions — typically takes 5–7 minutes.`,
    ],
    options: [
      { id: 'video', label: 'Connect with Dr. Riya now', description: 'Start the tele-consultation', icon: 'video' },
      { id: 'chat', label: 'Switch to chat instead', description: 'Answer questions via text', icon: 'chat' },
    ],
  }),
  processResponse: (response) => ({ telemerMode: response as 'video' | 'chat' }),
  getNextStep: () => 'telemer.call_in_progress',
};

const telemerCallInProgress: ConversationStep = {
  id: 'telemer.call_in_progress',
  module: 'payment',
  widgetType: 'none',
  getScript: (_, state) => ({
    botMessages: [
      state.telemerMode === 'chat'
        ? `Starting your chat session with Dr. Riya...`
        : `Connecting you with Dr. Riya... 📞\n\n*Please stay on the line.*`,
    ],
  }),
  processResponse: () => ({}),
  getNextStep: () => 'telemer.call_complete',
};

const telemerCallComplete: ConversationStep = {
  id: 'telemer.call_complete',
  module: 'payment',
  widgetType: 'none',
  getScript: () => ({
    botMessages: [
      `Call complete. Let me prepare your **Medical Summary** based on the evaluation...`,
    ],
  }),
  processResponse: () => ({}),
  getNextStep: () => 'telemer.medical_summary',
};

const telemerMedicalSummary: ConversationStep = {
  id: 'telemer.medical_summary',
  module: 'payment',
  widgetType: 'health_summary_card',
  getScript: (_, state) => ({
    botMessages: [`Here's your Medical Summary from the evaluation:`],
  }),
  processResponse: () => ({}),
  getNextStep: () => 'telemer.confirm_summary',
};

const telemerConfirmSummary: ConversationStep = {
  id: 'telemer.confirm_summary',
  module: 'payment',
  widgetType: 'selection_cards',
  getScript: () => ({
    botMessages: [`Please confirm this summary is accurate before we proceed.`],
    options: [
      { id: 'confirmed', label: 'Yes, this is correct', icon: 'check' },
      { id: 'incorrect', label: 'Something needs correction', icon: 'edit' },
    ],
  }),
  processResponse: () => ({}),
  getNextStep: (response) => response === 'incorrect' ? 'telemer.connect_prompt' : 'telemer.outcome',
};

const telemerOutcome: ConversationStep = {
  id: 'telemer.outcome',
  module: 'payment',
  widgetType: 'selection_cards',
  getScript: () => ({
    botMessages: [
      `Based on your medical review, your policy can be **issued immediately**.\n\nNo further steps needed — let's complete payment.`,
    ],
    options: [{ id: 'proceed', label: 'Proceed to payment', icon: 'check' }],
  }),
  processResponse: () => ({}),
  getNextStep: () => 'payment.method_selection',
};

const telemerStatusTracker: ConversationStep = {
  id: 'telemer.status_tracker',
  module: 'payment',
  widgetType: 'none',
  getScript: () => ({
    botMessages: [
      `**Underwriting in progress.**\n\nOur team is reviewing your medical details. Expected update in **2–3 working days**.\n\nWe'll notify you via SMS and email once a decision is made.`,
    ],
  }),
  processResponse: () => ({}),
  getNextStep: () => 'payment.success',
};

/* ═══════════════════════════════════════════════
   MODULE: HEALTH EVAL
   ═══════════════════════════════════════════════ */

const healthEvalIntro: ConversationStep = {
  id: 'health_eval.intro',
  module: 'health_eval',
  widgetType: 'none',
  getScript: (persona, state) => {
    const t = getT(state.language);
    const { getHealthEvalType } = require('./plans');
    const evalType = getHealthEvalType(
      state.members,
      Object.values(state.memberConditions).flat(),
      state.selectedPlan?.tier || 'platinum_lite'
    );

    if (evalType.type === 'lab_visit') {
      return { botMessages: [t.scripts.healthEvalLab] };
    }
    if (evalType.type === 'doctor_call') {
      return { botMessages: [t.scripts.healthEvalDoctorCall] };
    }
    return { botMessages: [t.scripts.healthEvalQuestionsOnly] };
  },
  processResponse: () => ({}),
  getNextStep: (_, state) => {
    return (state.hasHeartCondition || state.hasSevereCondition) ? 'health_eval.lab_schedule' : 'health_eval.schedule';
  },
};

const healthEvalLabSchedule: ConversationStep = {
  id: 'health_eval.lab_schedule',
  module: 'health_eval',
  widgetType: 'lab_schedule_widget',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.healthEvalLabSchedule],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'completion.celebration',
};

const healthEvalSchedule: ConversationStep = {
  id: 'health_eval.schedule',
  module: 'health_eval',
  widgetType: 'selection_cards',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.homeVisitQ],
      options: [
        { id: 'morning', label: t.scripts.morning, icon: 'sunrise' },
        { id: 'afternoon', label: t.scripts.afternoon, icon: 'sun' },
        { id: 'evening', label: t.scripts.evening, icon: 'sunset' },
      ],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'completion.celebration',
};

/* ═══════════════════════════════════════════════
   MODULE: COMPLETION
   ═══════════════════════════════════════════════ */

const completionCelebration: ConversationStep = {
  id: 'completion.celebration',
  module: 'completion',
  widgetType: 'celebration',
  getScript: (persona, state) => {
    const t = getT(state.language);
    return {
      botMessages: [t.scripts.completionMsg(userName(state))],
    };
  },
  processResponse: () => ({ journeyComplete: true }),
  getNextStep: () => 'completion.celebration',
};

/* ═══════════════════════════════════════════════
   STEP REGISTRY
   ═══════════════════════════════════════════════ */

export const STEPS: Record<string, ConversationStep> = {
  'entry.welcome': entryWelcome,
  'entry.ask_name': entryAskName,
  'entry.name_ack': entryNameAck,
  'intent.readiness': intentReadiness,
  'intent.acko_usps': intentAckoUsps,

  /* Gap Analysis */
  'gap_analysis.intro': gapAnalysisIntro,
  'gap_analysis.switch_intro': gapAnalysisSwitchIntro,
  'gap_analysis.method': gapAnalysisMethod,
  'gap_analysis.upload_pdf': gapAnalysisUploadPdf,
  'gap_analysis.pdf_results': gapAnalysisPdfResults,
  'gap_analysis.pdf_next': gapAnalysisPdfNext,
  'gap_analysis.confirm_details': gapAnalysisConfirmDetails,
  'gap_analysis.insurer_name': gapAnalysisInsurerName,
  'gap_analysis.current_si': gapAnalysisCurrentSI,
  'gap_analysis.plan_features': gapAnalysisPlanFeatures,
  'gap_analysis.questions_results': gapAnalysisQuestionsResults,
  'gap_analysis.proceed': gapAnalysisProceed,

  /* Family */
  'family.who_to_cover': familyWhoToCover,
  'family.self_exclusion_confirm': familySelfExclusionConfirm,
  'family.cover_ack': familyCoverAck,
  'family.your_age': familyYourAge,
  'family.spouse_age': familySpouseAge,
  'family.parents_age': familyParentsAge,
  'family.eldest_age': familyEldestAge,
  'family.age_ack': familyAgeAck,
  'family.pincode': familyPincode,
  'family.pincode_result': familyPincodeResult,

  /* Coverage */
  'coverage.workplace_insurance': coverageWorkplaceInsurance,
  'coverage.existing_policy': coverageExistingPolicy,
  'coverage.complex_case': coverageComplexCase,
  'coverage.current_insurance': coverageCurrentInsurance,
  'coverage.total_cover': coverageTotalCover,
  'coverage.gap_check': coverageGapCheck,
  'coverage.gap_scenario': coverageGapScenario,
  'coverage.gap_scenario_2': coverageGapScenario2,
  'coverage.gap_scenario_3': coverageGapScenario3,
  'coverage.gap_scenario_4': coverageGapScenario4,
  'coverage.gap_scenario_5': coverageGapScenario5,
  'coverage.gap_insight': coverageGapInsight,
  'coverage.no_insurance_ack': coverageNoInsuranceAck,
  'coverage.switch_ack': coverageSwitchAck,

  /* Health */
  'health.conditions': healthConditions,
  'health.healthy_ack': healthHealthyAck,
  'health.conditions_ack': healthConditionsAck,
  'health.conditions_understood': healthConditionsUnderstood,

  /* Sum Insured */
  'customization.si_selection': customizationSI,
  'customization.si_rebuttal': customizationSIRebuttal,

  /* Recommendation */
  'recommendation.calculating': recommendationCalculating,
  'recommendation.result': recommendationResult,

  /* Frequency */
  'customization.frequency': customizationFrequency,

  /* Review */
  'review.summary': reviewSummary,
  'review.consent': reviewConsent,
  'review.dob_collection': reviewDobCollection,
  'review.dob_ack': reviewDobAck,

  /* STP */
  'stp.medical_questions': stpMedicalQuestions,

  /* Payment */
  'payment.method_selection': paymentMethodSelection,
  'payment.process': paymentProcess,
  'payment.success': paymentSuccess,

  /* Reproposal */
  'reproposal.mandate_update': reproposalMandateUpdate,
  'reproposal.offer': reproposalOffer,
  'reproposal.explanation': reproposalExplanation,

  /* Tele-MER */
  'telemer.connect_prompt': telemerConnectPrompt,
  'telemer.call_in_progress': telemerCallInProgress,
  'telemer.call_complete': telemerCallComplete,
  'telemer.medical_summary': telemerMedicalSummary,
  'telemer.confirm_summary': telemerConfirmSummary,
  'telemer.outcome': telemerOutcome,
  'telemer.status_tracker': telemerStatusTracker,

  /* Health Eval */
  'health_eval.intro': healthEvalIntro,
  'health_eval.lab_schedule': healthEvalLabSchedule,
  'health_eval.schedule': healthEvalSchedule,

  /* Completion */
  'completion.celebration': completionCelebration,
};

export function getStep(stepId: string): ConversationStep | undefined {
  return STEPS[stepId];
}

/** Build a personalised reply label for "who to cover" selection (feedback #13). */
export function getCoverageReplyLabel(coverageFor: string[], numChildren: number, language: string): string {
  const t = getT(language as any);
  const scripts = t.scripts as { coverageReply?: (c: number, p: string) => string; coverageReplyOnlyParents?: string };
  const parts: string[] = [];
  if (coverageFor.includes('self')) parts.push('you');
  if (coverageFor.includes('spouse')) parts.push('your spouse');
  if (coverageFor.includes('children')) {
    parts.push(numChildren === 1 ? 'your child' : `your ${numChildren} children`);
  }
  if (coverageFor.includes('father')) parts.push('your father');
  if (coverageFor.includes('mother')) parts.push('your mother');
  if (parts.length === 0) return scripts.coverageReplyOnlyParents ?? 'Parents only';
  const count = (coverageFor.includes('self') ? 1 : 0) + (coverageFor.includes('spouse') ? 1 : 0)
    + (coverageFor.includes('children') ? Math.max(1, numChildren) : 0)
    + (coverageFor.includes('father') ? 1 : 0) + (coverageFor.includes('mother') ? 1 : 0);
  if (parts.length === 1) return parts[0];
  const last = parts.pop()!;
  const joined = parts.join(', ') + ' and ' + last;
  return scripts.coverageReply ? scripts.coverageReply(count, joined) : `Family of ${count} — ${joined}`;
}
