/* ═══════════════════════════════════════════════════════
   Post-Payment Conversational Scripts
   Defines all conversation steps for the post-payment
   (P2I: Payment-to-Issuance) journey.
   Uses the same ConversationStep interface as buy flow.
   ═══════════════════════════════════════════════════════ */

import { ConversationStep, JourneyState, PostPaymentScenario } from './types';
import { formatCurrency } from './plans';
import { getT } from './translations';

function getScenarios(lang: JourneyState['language']) {
  const t = getT(lang);
  return [
    { id: 'all_clear' as PostPaymentScenario, label: t.ppScripts.scenAllClear, description: t.ppScripts.scenAllClearSub },
    { id: 'waiting_period' as PostPaymentScenario, label: t.ppScripts.scenWaiting, description: t.ppScripts.scenWaitingSub },
    { id: 'member_rejected' as PostPaymentScenario, label: t.ppScripts.scenRejected, description: t.ppScripts.scenRejectedSub },
    { id: 'extra_payment' as PostPaymentScenario, label: t.ppScripts.scenExtra, description: t.ppScripts.scenExtraSub },
    { id: 'no_test' as PostPaymentScenario, label: t.ppScripts.scenNoTest, description: t.ppScripts.scenNoTestSub },
    { id: 'home_test_only' as PostPaymentScenario, label: t.ppScripts.scenHomeTest, description: t.ppScripts.scenHomeTestSub },
  ];
}

const SCENARIOS_EN: { id: PostPaymentScenario; label: string; description: string }[] = [
  { id: 'all_clear', label: 'All members covered', description: 'Everyone passes. No conditions. Refund issued.' },
  { id: 'waiting_period', label: 'Waiting period added', description: 'Pre-existing condition found. 2-year waiting period.' },
  { id: 'member_rejected', label: 'One member rejected', description: 'Father (62 yrs) rejected due to cardiac history.' },
  { id: 'extra_payment', label: 'Additional payment needed', description: 'Medical loading applied due to obesity & diabetes.' },
  { id: 'no_test', label: 'No medical test needed', description: 'Young, healthy members under 35. Policy issued directly.' },
  { id: 'home_test_only', label: 'Home test only (no lab)', description: 'No cardiac conditions. Only blood & urine at home.' },
];

const SCENARIOS = SCENARIOS_EN;

/* ── Helper: get scenario-aware members ── */
function getScenarioMembers(state: JourneyState) {
  const { members, userName, postPaymentScenario: scenario } = state;
  if (scenario === 'member_rejected') {
    return [...members, { id: 'father-1', name: 'Ramesh', age: 62, relation: 'father' as const, conditions: ['Cardiac history', 'Previous bypass surgery'] }];
  }
  if (scenario === 'waiting_period') {
    return members.map((m, i) => i === 0 ? { ...m, conditions: ['Type 2 Diabetes (3 years)'] } : m);
  }
  if (scenario === 'no_test') {
    return members.length > 0 ? members.map(m => ({ ...m, age: Math.min(m.age, 28) })) : [{ id: 'self-1', name: userName || 'You', age: 28, relation: 'self' as const, conditions: [] }];
  }
  if (scenario === 'home_test_only') {
    return members.map(m => ({ ...m, conditions: [] }));
  }
  return members;
}

/* ── All post-payment conversation steps ── */
const postPaymentSteps: ConversationStep[] = [
  /* ─── Welcome & Tracker ─── */
  {
    id: 'pp.welcome',
    module: 'post_payment',
    widgetType: 'none',
    getScript: (_p, state) => {
      const t = getT(state.language);
      const planName = state.selectedPlan?.name || 'ACKO';
      return {
        botMessages: [
          t.ppScripts.paymentSuccessful(planName),
          t.ppScripts.whatsNext,
        ],
      };
    },
    processResponse: () => ({}),
    getNextStep: () => 'pp.call_choice',
  },

  /* ─── Call Choice ─── */
  {
    id: 'pp.call_choice',
    module: 'post_payment',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      const count = state.members.length || 1;
      return {
        botMessages: [
          t.ppScripts.callChoiceMsg(count),
          t.ppScripts.callChoiceQ,
        ],
        options: [
          { id: 'call_now', label: t.ppScripts.callNow, icon: 'forward', description: t.ppScripts.callNowSub },
          { id: 'schedule', label: t.ppScripts.scheduleLater, icon: 'clock', description: t.ppScripts.scheduleLaterSub },
        ],
      };
    },
    processResponse: () => ({}),
    getNextStep: (response) => response === 'schedule' ? 'pp.schedule' : 'pp.voice_call',
  },

  /* ─── Schedule Call ─── */
  {
    id: 'pp.schedule',
    module: 'doctor_call',
    widgetType: 'call_schedule_picker',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [t.ppScripts.scheduleMsg],
      };
    },
    processResponse: (_resp, _state) => ({}),
    getNextStep: () => 'pp.schedule_confirm',
  },

  {
    id: 'pp.schedule_confirm',
    module: 'doctor_call',
    widgetType: 'none',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [t.ppScripts.scheduleConfirm(state.callScheduledDate || '', state.callScheduledTime || '')],
      };
    },
    processResponse: () => ({}),
    getNextStep: () => 'pp.voice_call',
  },

  /* ─── Voice Call ─── */
  {
    id: 'pp.voice_call',
    module: 'doctor_call',
    widgetType: 'voice_call',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [t.ppScripts.connectingDr],
      };
    },
    processResponse: () => ({ doctorCallComplete: true }),
    getNextStep: () => 'pp.call_complete',
  },

  /* ─── Call Complete ─── */
  {
    id: 'pp.call_complete',
    module: 'post_payment',
    widgetType: 'none',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [
          t.ppScripts.callCompleteMsg,
          t.ppScripts.scenarioSelectMsg,
        ],
      };
    },
    processResponse: () => ({}),
    getNextStep: () => 'pp.scenario_select',
  },

  /* ─── Scenario Select (Prototype Only) ─── */
  {
    id: 'pp.scenario_select',
    module: 'post_payment',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      const scenarios = getScenarios(state.language);
      return {
        botMessages: [t.ppScripts.pickScenario],
        options: scenarios.map(s => ({ id: s.id, label: s.label, description: s.description })),
      };
    },
    processResponse: (response) => ({ postPaymentScenario: response as PostPaymentScenario }),
    getNextStep: (response) => {
      if (response === 'no_test') return 'pp.no_test_result';
      return 'pp.test_needed';
    },
  },

  /* ─── No Test Needed (fixed branching!) ─── */
  {
    id: 'pp.no_test_result',
    module: 'post_payment',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [
          t.ppScripts.noTestResult,
          t.ppScripts.noTestBody,
        ],
        options: [{ id: 'issue_now', label: t.ppScripts.issueNow }],
      };
    },
    processResponse: () => ({}),
    // Skip directly to policy issued — NO test scheduling!
    getNextStep: () => 'pp.policy_issued',
  },

  /* ─── Test Needed ─── */
  {
    id: 'pp.test_needed',
    module: 'medical_tests',
    widgetType: 'none',
    getScript: (_p, state) => {
      const scenario = state.postPaymentScenario;
      const isHome = scenario === 'home_test_only' || scenario === 'all_clear';
      const scenarioMembers = getScenarioMembers(state);
      const memberList = scenarioMembers.map(m => `${m.name} (${m.age} yrs)`).join(', ');
      return {
        botMessages: [
          isHome
            ? `Based on the evaluation, you'll need home sample collection only — no lab visit needed. A certified technician will visit your home for blood & urine tests.`
            : `Based on the evaluation, a lab visit is required for detailed diagnostics (ECG, Echo, USG) along with blood & urine tests.`,
          `Tests needed for: ${memberList}`,
          `Let's schedule your medical tests.`,
        ],
      };
    },
    processResponse: () => ({}),
    getNextStep: () => 'pp.test_schedule',
  },

  /* ─── Test Schedule ─── */
  {
    id: 'pp.test_schedule',
    module: 'medical_tests',
    widgetType: 'test_schedule_picker',
    getScript: (_p, state) => {
      const isLab = !['home_test_only', 'all_clear', 'no_test'].includes(state.postPaymentScenario);
      return {
        botMessages: [isLab ? `Pick a date, time, and lab for your tests.` : `Pick a date and time for the home visit.`],
      };
    },
    processResponse: () => ({ testsComplete: true }),
    getNextStep: () => 'pp.test_complete',
  },

  /* ─── Tests Complete → Health Summary ─── */
  {
    id: 'pp.test_complete',
    module: 'medical_tests',
    widgetType: 'none',
    getScript: () => ({
      botMessages: [`Tests completed! Your health evaluation results are ready.`],
    }),
    processResponse: () => ({}),
    getNextStep: () => 'pp.health_summary',
  },

  /* ─── Health Summary ─── */
  {
    id: 'pp.health_summary',
    module: 'health_eval',
    widgetType: 'health_summary_card',
    getScript: (_p, state) => {
      const scenario = state.postPaymentScenario;
      const summaryMsg: Record<string, string> = {
        all_clear: `Great news! All family members are eligible for full coverage with no restrictions.`,
        waiting_period: `A 2-year waiting period will apply for diabetes-related claims for ${state.userName || 'self'}. All other conditions are fully covered from day 1.`,
        member_rejected: `Ramesh (Father, 62 yrs) could not be covered due to serious pre-existing cardiac conditions. Coverage continues for the remaining members.`,
        extra_payment: `Due to BMI above normal and diabetes diagnosis, a 15% medical loading has been applied. All conditions will be covered.`,
        home_test_only: `Home test results look great! All members cleared.`,
        no_test: `No tests were needed — all clear!`,
      };
      return {
        botMessages: [
          `Health evaluation complete.`,
          summaryMsg[scenario] || 'Results are ready.',
        ],
      };
    },
    processResponse: () => ({}),
    getNextStep: (_resp, state) => {
      if (state.postPaymentScenario === 'member_rejected') return 'pp.reject_choice';
      return 'pp.premium_update';
    },
  },

  /* ─── Member Rejected Choice ─── */
  {
    id: 'pp.reject_choice',
    module: 'health_eval',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const remaining = state.members.length;
      return {
        botMessages: [`What would you like to do?`],
        options: [
          { id: 'proceed', label: `Proceed without Ramesh`, description: `Continue coverage for ${remaining} members with proportional refund` },
          { id: 'cancel', label: 'Cancel policy & get full refund' },
        ],
      };
    },
    processResponse: () => ({}),
    getNextStep: (response) => response === 'cancel' ? 'pp.cancel_rebuttal' : 'pp.premium_update',
  },

  /* ─── Cancel Rebuttal ─── */
  {
    id: 'pp.cancel_rebuttal',
    module: 'post_payment',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const remaining = state.members.length;
      return {
        botMessages: [
          `Are you sure? You'll lose all progress — doctor call, medical tests, and health evaluation will need to be redone.`,
          `Better alternative: Proceed without Ramesh — the remaining ${remaining} members get instant coverage with a proportional refund.`,
        ],
        options: [
          { id: 'continue', label: `Continue without Ramesh`, description: 'Recommended' },
          { id: 'cancel_confirm', label: 'I still want to cancel' },
        ],
      };
    },
    processResponse: () => ({}),
    getNextStep: (response) => response === 'cancel_confirm' ? 'pp.cancelled' : 'pp.premium_update',
  },

  /* ─── Cancelled ─── */
  {
    id: 'pp.cancelled',
    module: 'post_payment',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const refund = state.selectedPlan ? (state.paymentFrequency === 'monthly' ? state.selectedPlan.monthlyPremium : state.selectedPlan.yearlyPremium) : 12999;
      return {
        botMessages: [
          `Policy cancelled. A full refund of ${formatCurrency(refund)} has been initiated.`,
          `Refund will be credited to your original payment method within 7 working days.`,
          `You can purchase a new policy anytime. Your medical records from this application will not carry forward.`,
        ],
        options: [{ id: 'home', label: 'Go to home' }],
      };
    },
    processResponse: () => ({}),
    getNextStep: () => 'pp.cancelled',
  },

  /* ─── Premium Update ─── */
  {
    id: 'pp.premium_update',
    module: 'post_payment',
    widgetType: 'premium_update_card',
    getScript: (_p, state) => {
      const scenario = state.postPaymentScenario;
      const original = state.selectedPlan ? (state.paymentFrequency === 'monthly' ? state.selectedPlan.monthlyPremium : state.selectedPlan.yearlyPremium) : 12999;
      let change = 0;
      let explanation = '';
      if (scenario === 'all_clear' || scenario === 'home_test_only') { change = -Math.round(original * 0.05); explanation = 'Your health profile is better than estimated. The difference will be refunded.'; }
      else if (scenario === 'waiting_period') { explanation = 'No premium change. The waiting period adjustment doesn\'t affect your premium.'; }
      else if (scenario === 'member_rejected') { change = -Math.round(original * 0.30); explanation = 'Proportional refund for the removed member is being processed.'; }
      else if (scenario === 'extra_payment') { change = Math.round(original * 0.15); explanation = 'A 15% medical loading applies due to pre-existing conditions.'; }
      const newPremium = original + change;
      const freq = state.paymentFrequency === 'monthly' ? 'mo' : 'yr';
      return {
        botMessages: [
          change === 0
            ? `Premium confirmed: ${formatCurrency(original)}/${freq}. No changes from your health evaluation.`
            : change < 0
            ? `Updated premium: ${formatCurrency(newPremium)}/${freq} (refund of ${formatCurrency(Math.abs(change))}). ${explanation}`
            : `Updated premium: ${formatCurrency(newPremium)}/${freq} (additional ${formatCurrency(change)}). ${explanation}`,
        ],
      };
    },
    processResponse: () => ({}),
    getNextStep: () => 'pp.premium_accept',
  },

  {
    id: 'pp.premium_accept',
    module: 'post_payment',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const scenario = state.postPaymentScenario;
      const original = state.selectedPlan ? (state.paymentFrequency === 'monthly' ? state.selectedPlan.monthlyPremium : state.selectedPlan.yearlyPremium) : 12999;
      const change = scenario === 'extra_payment' ? Math.round(original * 0.15) : 0;
      const isRefund = scenario === 'all_clear' || scenario === 'home_test_only' || scenario === 'member_rejected';
      return {
        botMessages: [],
        options: [{
          id: 'accept',
          label: isRefund ? 'Accept & proceed' : change > 0 ? `Pay ${formatCurrency(change)} & proceed` : 'Continue',
        }],
      };
    },
    processResponse: () => ({}),
    getNextStep: (_resp, state) => {
      const scenario = state.postPaymentScenario;
      const isRefund = scenario === 'all_clear' || scenario === 'home_test_only' || scenario === 'member_rejected';
      return isRefund ? 'pp.refund_processing' : 'pp.policy_issued';
    },
  },

  /* ─── Refund Processing Confirmation ─── */
  {
    id: 'pp.refund_processing',
    module: 'post_payment',
    widgetType: 'none',
    getScript: (_p, state) => {
      const scenario = state.postPaymentScenario;
      const original = state.selectedPlan ? (state.paymentFrequency === 'monthly' ? state.selectedPlan.monthlyPremium : state.selectedPlan.yearlyPremium) : 12999;
      let refundAmount = 0;
      if (scenario === 'all_clear' || scenario === 'home_test_only') refundAmount = Math.round(original * 0.05);
      else if (scenario === 'member_rejected') refundAmount = Math.round(original * 0.30);
      return {
        botMessages: [
          `Your refund of ${formatCurrency(refundAmount)} has been initiated and will be credited to your original payment method within 7 working days.`,
        ],
      };
    },
    processResponse: () => ({}),
    getNextStep: () => 'pp.policy_issued',
  },

  /* ─── Policy Issued ─── */
  {
    id: 'pp.policy_issued',
    module: 'completion',
    widgetType: 'policy_celebration',
    getScript: (_p, state) => {
      const t = getT(state.language);
      const name = state.userName || 'there';
      const planName = state.selectedPlan?.name || 'health insurance';
      return {
        botMessages: [t.ppScripts.policyIssuedMsg(name, planName)],
      };
    },
    processResponse: () => ({ journeyComplete: true }),
    getNextStep: () => 'pp.policy_issued',
  },
];

/* ── Step lookup ── */
const stepMap = new Map(postPaymentSteps.map(s => [s.id, s]));

export function getPostPaymentStep(stepId: string): ConversationStep | undefined {
  return stepMap.get(stepId);
}

export { getScenarioMembers, SCENARIOS_EN as SCENARIOS };
