/* ═══════════════════════════════════════════════════════
   Dashboard Conversational Scripts
   Defines conversation steps for the dashboard:
   - Policy home / overview with key details
   - Raise a claim (cashless & reimbursement)
   - Track requests (claims & policy edits)
   - Get answers (coverage Q&A)
   - Download documents
   - Edit policy (add member, change SI, etc.)
   ═══════════════════════════════════════════════════════ */

import { ConversationStep, JourneyState } from './types';
import { formatCurrency } from './plans';
import { getT } from './translations';

const NETWORK_HOSPITALS = [
  { id: 'fortis', name: 'Fortis Hospital, Gurugram', distance: '2.1 km' },
  { id: 'max', name: 'Max Super Speciality, Saket', distance: '8.3 km' },
  { id: 'apollo', name: 'Apollo Hospital, Jasola', distance: '12.5 km' },
  { id: 'medanta', name: 'Medanta - The Medicity', distance: '5.4 km' },
  { id: 'columbia', name: 'Columbia Asia, Palam Vihar', distance: '3.2 km' },
];

const DOCUMENTS = [
  { id: 'policy', name: 'Policy Document (2.4 MB)' },
  { id: 'health_card', name: 'Health Card (156 KB)' },
  { id: 'tax_cert', name: 'Tax Certificate 80D (312 KB)' },
  { id: 'member_card', name: 'Member ID Cards (890 KB)' },
  { id: 'network_list', name: 'Network Hospital List (1.1 MB)' },
];

const SI_OPTIONS = [
  { id: '10L', label: '₹10L — ₹7,999/yr' },
  { id: '15L', label: '₹15L — ₹9,999/yr' },
  { id: '25L', label: '₹25L — ₹12,999/yr' },
  { id: '50L', label: '₹50L — ₹18,499/yr' },
  { id: '1Cr', label: '₹1 Cr — ₹28,999/yr' },
];

const SI_VALUES: Record<string, number> = {
  '10L': 1_000_000,
  '15L': 1_500_000,
  '25L': 2_500_000,
  '50L': 5_000_000,
  '1Cr': 10_000_000,
};

const SI_LABELS: Record<string, string> = {
  '10L': '₹10 Lakh',
  '15L': '₹15 Lakh',
  '25L': '₹25 Lakh',
  '50L': '₹50 Lakh',
  '1Cr': '₹1 Crore',
};

/* ── Helper: build policy summary string ── */
function buildPolicySummary(state: JourneyState): string {
  const plan = state.selectedPlan;
  const premium = plan
    ? (state.paymentFrequency === 'monthly' ? `${formatCurrency(plan.monthlyPremium)}/mo` : `${formatCurrency(plan.yearlyPremium)}/yr`)
    : '₹12,999/yr';
  const memberNames = state.members.length > 0
    ? state.members.map(m => `${m.name} (${m.age}, ${m.relation})`).join(', ')
    : state.userName || 'Self';
  const si = plan?.sumInsuredLabel || '₹25L';

  return `Plan: ${plan?.name || 'ACKO Platinum'}\nSum Insured: ${si}\nPremium: ${premium}\nMembers: ${memberNames}\nStatus: Active\nPolicy start: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

/* ── Helper: active requests count ── */
function hasActiveRequests(state: JourneyState): boolean {
  return state.dashboardSubmittedClaims.length > 0 || state.dashboardSubmittedEdits.length > 0;
}

/* ── All dashboard conversation steps ── */
const dashboardSteps: ConversationStep[] = [

  /* ═════ Welcome — Policy overview + actions ═════ */
  {
    id: 'db.welcome',
    module: 'dashboard',
    widgetType: 'none',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [
          t.db.welcomeBack((state.userName || 'there').split(' ')[0]),
          buildPolicySummary(state),
        ],
      };
    },
    processResponse: () => ({}),
    getNextStep: () => 'db.actions',
  },

  {
    id: 'db.actions',
    module: 'dashboard',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      const options = [
        { id: 'raise_claim', label: t.db.raiseClaim, icon: 'document', description: t.db.claimDesc },
        { id: 'get_answers', label: t.db.getAnswers, icon: 'help', description: t.db.answersDesc },
        { id: 'download_doc', label: t.db.downloadDocs, icon: 'upload', description: t.db.docsDesc },
        { id: 'edit_policy', label: t.db.editPolicy, icon: 'refresh', description: t.db.editDesc },
      ];
      if (hasActiveRequests(state)) {
        const claimCount = state.dashboardSubmittedClaims.length;
        const editCount = state.dashboardSubmittedEdits.length;
        const totalCount = claimCount + editCount;
        const claimStr = claimCount ? t.db.claimLabel(claimCount) + (editCount ? ', ' : '') : '';
        const editStr = editCount ? t.db.editLabel(editCount) : '';
        options.unshift({
          id: 'track_requests',
          label: t.db.trackRequests(totalCount),
          icon: 'clock',
          description: t.db.trackDesc(claimStr, editStr),
        });
      }
      return {
        botMessages: [t.db.whatToDo],
        options,
      };
    },
    processResponse: () => ({}),
    getNextStep: (response) => {
      switch (response) {
        case 'raise_claim': return 'db.claim_intro';
        case 'get_answers': return 'db.answers_intro';
        case 'download_doc': return 'db.docs_list';
        case 'edit_policy': return 'db.edit_options';
        case 'track_requests': return 'db.track_overview';
        default: return 'db.actions';
      }
    },
  },

  /* ═════ TRACK REQUESTS ═════ */
  {
    id: 'db.track_overview',
    module: 'dashboard',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      const items: { id: string; label: string; description: string; icon?: string }[] = [];

      state.dashboardSubmittedClaims.forEach((c, i) => {
        const age = Math.round((Date.now() - c.submittedAt) / 60000);
        const timeLabel = age < 60 ? `${age}m ago` : `${Math.round(age / 60)}h ago`;
        items.push({
          id: `claim_${i}`,
          label: `Claim ${c.id}`,
          description: `${c.type === 'cashless' ? t.db.cashlessClaim : t.db.reimbursementClaim} · ${c.reason} · ${c.status} · ${timeLabel}`,
          icon: 'document',
        });
      });

      state.dashboardSubmittedEdits.forEach((e, i) => {
        const age = Math.round((Date.now() - e.submittedAt) / 60000);
        const timeLabel = age < 60 ? `${age}m ago` : `${Math.round(age / 60)}h ago`;
        items.push({
          id: `edit_${i}`,
          label: `Edit: ${e.type}`,
          description: `${e.summary} · ${e.status} · ${timeLabel}`,
          icon: 'refresh',
        });
      });

      items.push({ id: 'back', label: t.db.backToDashboard, description: '', icon: 'switch' });

      return {
        botMessages: [
          items.length > 1 ? t.db.activeRequests : t.db.noActiveRequests,
        ],
        options: items,
      };
    },
    processResponse: () => ({}),
    getNextStep: (response) => {
      if (response === 'back') return 'db.actions';
      if (response.startsWith('claim_')) return 'db.track_claim_detail';
      if (response.startsWith('edit_')) return 'db.track_edit_detail';
      return 'db.actions';
    },
  },

  {
    id: 'db.track_claim_detail',
    module: 'dashboard',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      const claim = state.dashboardSubmittedClaims[0];
      if (!claim) return { botMessages: ['No claim found.'], options: [{ id: 'back', label: t.common.back }] };
      const hospital = NETWORK_HOSPITALS.find(h => h.id === claim.hospital)?.name || claim.hospital;
      const memberObj = state.members.find(m => m.id === claim.member);
      const memberName = memberObj ? memberObj.name : state.userName || 'Self';

      return {
        botMessages: [
          `Claim ${claim.id} — ${claim.type === 'cashless' ? t.db.cashlessClaim : t.db.reimbursementClaim}\n\nHospital: ${hospital}\nMember: ${memberName}\nReason: ${claim.reason}\nAmount: ₹${claim.amount}\nDate: ${claim.date}`,
          `Status timeline:\n\n1. Submitted — Done\n2. ${claim.type === 'cashless' ? t.db.preAuthSent : t.db.docsUnderReview} — In progress\n3. ${claim.type === 'cashless' ? 'Hospital confirmation' : 'Verification'} — Pending\n4. ${claim.type === 'cashless' ? 'Cashless approved' : 'Reimbursement processed'} — Pending\n\nCurrent status: ${claim.status}\n${t.db.expectedResolution}`,
        ],
        options: [
          { id: 'track', label: t.db.backToAllRequests, icon: 'clock' },
          { id: 'back', label: t.db.backToDashboard, icon: 'switch' },
        ],
      };
    },
    processResponse: () => ({}),
    getNextStep: (response) => response === 'track' ? 'db.track_overview' : 'db.actions',
  },

  {
    id: 'db.track_edit_detail',
    module: 'dashboard',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      const edit = state.dashboardSubmittedEdits[0];
      if (!edit) return { botMessages: ['No edit request found.'], options: [{ id: 'back', label: t.common.back }] };

      return {
        botMessages: [
          `Edit request: ${edit.type}\n\n${edit.summary}`,
          `Status timeline:\n\n1. Request submitted — Done\n2. Underwriting review — In progress\n3. Premium recalculation — Pending\n4. Policy update — Pending\n\nCurrent status: ${edit.status}\nExpected completion: 2-3 working days`,
        ],
        options: [
          { id: 'track', label: t.db.backToAllRequests, icon: 'clock' },
          { id: 'back', label: t.db.backToDashboard, icon: 'switch' },
        ],
      };
    },
    processResponse: () => ({}),
    getNextStep: (response) => response === 'track' ? 'db.track_overview' : 'db.actions',
  },

  /* ═════ RAISE A CLAIM ═════ */
  {
    id: 'db.claim_intro',
    module: 'claims',
    widgetType: 'none',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [t.db.claimIntro, t.db.claimTypes],
      };
    },
    processResponse: () => ({}),
    getNextStep: () => 'db.claim_type',
  },

  {
    id: 'db.claim_type',
    module: 'claims',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [t.db.whichClaimType],
        options: [
          { id: 'cashless', label: t.db.cashlessClaim, icon: 'hospital', description: t.db.cashlessDesc },
          { id: 'reimbursement', label: t.db.reimbursementClaim, icon: 'document', description: t.db.reimbursementDesc },
        ],
      };
    },
    processResponse: (response) => ({ dashboardClaimType: response as 'cashless' | 'reimbursement' }),
    getNextStep: () => 'db.claim_hospital',
  },

  {
    id: 'db.claim_hospital',
    module: 'claims',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [
          state.dashboardClaimType === 'cashless' ? t.db.networkHospitalsNear : t.db.whichHospital,
        ],
        options: NETWORK_HOSPITALS.map(h => ({ id: h.id, label: h.name, description: h.distance })),
      };
    },
    processResponse: (response) => ({ dashboardClaimHospital: response }),
    getNextStep: () => 'db.claim_member',
  },

  {
    id: 'db.claim_member',
    module: 'claims',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [t.db.whoIsClaimFor],
        options: state.members.length > 0
          ? state.members.map(m => ({ id: m.id, label: `${m.name} (${m.age} yrs, ${m.relation})` }))
          : [{ id: 'self', label: `${state.userName || 'Self'}` }],
      };
    },
    processResponse: (response) => ({ dashboardClaimMember: response }),
    getNextStep: () => 'db.claim_reason',
  },

  {
    id: 'db.claim_reason',
    module: 'claims',
    widgetType: 'text_input',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [t.db.reasonForHospitalization],
        placeholder: t.db.reasonPlaceholder,
        inputType: 'text' as const,
      };
    },
    processResponse: (response) => ({ dashboardClaimReason: response }),
    getNextStep: () => 'db.claim_date',
  },

  {
    id: 'db.claim_date',
    module: 'claims',
    widgetType: 'text_input',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [t.db.admissionDate],
        placeholder: t.db.datePlaceholder,
        inputType: 'text' as const,
      };
    },
    processResponse: (response) => ({ dashboardClaimDate: response }),
    getNextStep: () => 'db.claim_amount',
  },

  {
    id: 'db.claim_amount',
    module: 'claims',
    widgetType: 'number_input',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [t.db.estimatedAmount],
        placeholder: t.db.amountPlaceholder,
        inputType: 'number' as const,
        min: 1000,
        max: 10000000,
      };
    },
    processResponse: (response) => ({ dashboardClaimAmount: String(response) }),
    getNextStep: () => 'db.claim_review',
  },

  {
    id: 'db.claim_review',
    module: 'claims',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      const hospital = NETWORK_HOSPITALS.find(h => h.id === state.dashboardClaimHospital)?.name || state.dashboardClaimHospital;
      const member = state.members.find(m => m.id === state.dashboardClaimMember);
      const memberName = member ? member.name : state.userName || 'Self';
      const typeLabel = state.dashboardClaimType === 'cashless' ? t.db.cashlessClaim : t.db.reimbursementClaim;
      return {
        botMessages: [
          `${t.db.claimSummary}\n\nType: ${typeLabel}\nHospital: ${hospital}\nMember: ${memberName}\nReason: ${state.dashboardClaimReason}\nDate: ${state.dashboardClaimDate}\nAmount: ₹${state.dashboardClaimAmount}`,
          t.db.pleaseConfirm,
        ],
        options: [
          { id: 'confirm', label: t.db.submitClaim },
          { id: 'cancel', label: t.common.cancel },
        ],
      };
    },
    processResponse: () => ({}),
    getNextStep: (response) => response === 'confirm' ? 'db.claim_submitted' : 'db.actions',
  },

  {
    id: 'db.claim_submitted',
    module: 'claims',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      const claimId = `CLM-${Math.floor(100000 + Math.random() * 900000)}`;
      const statusText = state.dashboardClaimType === 'cashless' ? t.db.preAuthSent : t.db.docsUnderReview;
      return {
        botMessages: [
          `${t.db.claimSubmitted}\n\nClaim ID: ${claimId}\nStatus: ${statusText}\n${t.db.expectedResolution}`,
          t.db.updatesViaSms,
        ],
        options: [
          { id: 'track', label: t.db.trackThisRequest, icon: 'clock' },
          { id: 'back', label: t.db.backToDashboard, icon: 'switch' },
        ],
        widgetData: { claimId, statusText },
      };
    },
    processResponse: (response, state) => {
      const claimId = `CLM-${Math.floor(100000 + Math.random() * 900000)}`;
      const hospital = NETWORK_HOSPITALS.find(h => h.id === state.dashboardClaimHospital)?.name || state.dashboardClaimHospital;
      const memberObj = state.members.find(m => m.id === state.dashboardClaimMember);
      const memberName = memberObj ? memberObj.name : state.userName || 'Self';
      return {
        dashboardSubmittedClaims: [
          ...state.dashboardSubmittedClaims,
          {
            id: claimId,
            type: state.dashboardClaimType || 'cashless',
            hospital: state.dashboardClaimHospital,
            member: state.dashboardClaimMember,
            reason: state.dashboardClaimReason,
            amount: state.dashboardClaimAmount,
            date: state.dashboardClaimDate,
            status: state.dashboardClaimType === 'cashless' ? 'Pre-authorization sent' : 'Under review',
            submittedAt: Date.now(),
          },
        ],
        dashboardClaimType: '' as const,
        dashboardClaimHospital: '',
        dashboardClaimMember: '',
        dashboardClaimReason: '',
        dashboardClaimDate: '',
        dashboardClaimAmount: '',
      };
    },
    getNextStep: (response) => response === 'track' ? 'db.track_overview' : 'db.actions',
  },

  /* ═════ GET ANSWERS ═════ */
  {
    id: 'db.answers_intro',
    module: 'dashboard',
    widgetType: 'none',
    getScript: (_p, state) => {
      const t = getT(state.language);
      const plan = state.selectedPlan;
      const planName = plan?.name || 'ACKO';
      const waitingPeriod = plan?.waitingPeriod || '2-4 year';
      const highlights = [
        `Sum Insured: ${plan?.sumInsuredLabel || '₹25L'}`,
        t.db.roomRent,
        t.db.networkHospCount,
        t.db.restoration,
        t.db.dayCoverage,
        t.db.preExistingCoverage(waitingPeriod),
        t.db.maternityCoverage,
        t.db.mentalHealthCov,
        t.db.ayushCov,
      ];
      return {
        botMessages: [
          `${t.db.quickSnapshot(planName)}\n\n${highlights.join('\n')}`,
          t.db.notCoveredList,
        ],
      };
    },
    processResponse: () => ({}),
    getNextStep: () => 'db.answers_topics',
  },

  {
    id: 'db.answers_topics',
    module: 'dashboard',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      const allTopics = [
        { id: 'q_dental', label: t.db.isDentalCovered },
        { id: 'q_maternity', label: t.db.howMaternity },
        { id: 'q_preexisting', label: t.db.preExistingConditions },
        { id: 'q_room', label: t.db.roomRentLimit },
        { id: 'q_cancer', label: t.db.cancerTreatment },
        { id: 'q_mental', label: t.db.mentalHealth },
        { id: 'q_ambulance', label: t.db.ambulanceCharges },
        { id: 'q_ayush', label: t.db.ayushTreatments },
        { id: 'q_waiting', label: t.db.waitingPeriods },
        { id: 'q_claim', label: t.db.howToFileClaim },
        { id: 'q_network', label: t.db.networkHospitals },
      ];
      const shuffled = [...allTopics].sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, 4);
      return {
        botMessages: [t.db.pickQuestion],
        options: [
          ...picked,
          { id: 'ask_custom', label: t.db.askAnything, icon: 'chat_bubble' },
          { id: 'back', label: t.db.backToDashboard, icon: 'switch' },
        ],
      };
    },
    processResponse: () => ({}),
    getNextStep: (response) => {
      const faqMap: Record<string, string> = {
        q_dental: 'db.answers_dental',
        q_maternity: 'db.answers_maternity',
        q_preexisting: 'db.answers_preexisting',
        q_room: 'db.answers_room',
        q_cancer: 'db.answers_cancer',
        q_mental: 'db.answers_mental',
        q_ambulance: 'db.answers_ambulance',
        q_ayush: 'db.answers_ayush',
        q_waiting: 'db.answers_waiting',
        q_claim: 'db.answers_claim',
        q_network: 'db.answers_network',
        ask_custom: 'db.answers_custom',
        back: 'db.actions',
      };
      return faqMap[response] || 'db.answers_topics';
    },
  },

  /* ── FAQ answer steps — one per topic for proper bot messages ── */
  {
    id: 'db.answers_dental',
    module: 'dashboard',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [`Dental treatments are covered only when required due to an accident. Routine dental care (cleanings, fillings, braces) is not covered.`],
        options: [{ id: 'more', label: t.db.askAnotherQuestion }, { id: 'custom', label: t.db.askSomethingElse, icon: 'chat_bubble' }, { id: 'back', label: t.db.backToDashboard, icon: 'switch' }],
      };
    },
    processResponse: () => ({}),
    getNextStep: (r) => r === 'more' ? 'db.answers_topics' : r === 'custom' ? 'db.answers_custom' : 'db.actions',
  },
  {
    id: 'db.answers_maternity',
    module: 'dashboard',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [`Great news! Maternity is covered after a 9-month waiting period, including normal delivery, C-section, and pre/post-natal expenses up to the sum insured.`],
        options: [{ id: 'more', label: t.db.askAnotherQuestion }, { id: 'custom', label: t.db.askSomethingElse, icon: 'chat_bubble' }, { id: 'back', label: t.db.backToDashboard, icon: 'switch' }],
      };
    },
    processResponse: () => ({}),
    getNextStep: (r) => r === 'more' ? 'db.answers_topics' : r === 'custom' ? 'db.answers_custom' : 'db.actions',
  },
  {
    id: 'db.answers_preexisting',
    module: 'dashboard',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [`Pre-existing conditions are covered after the waiting period (typically 2-4 years depending on the condition). After that, full coverage applies — no sub-limits.`],
        options: [{ id: 'more', label: t.db.askAnotherQuestion }, { id: 'custom', label: t.db.askSomethingElse, icon: 'chat_bubble' }, { id: 'back', label: t.db.backToDashboard, icon: 'switch' }],
      };
    },
    processResponse: () => ({}),
    getNextStep: (r) => r === 'more' ? 'db.answers_topics' : r === 'custom' ? 'db.answers_custom' : 'db.actions',
  },
  {
    id: 'db.answers_room',
    module: 'dashboard',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [`Your ACKO Platinum plan has NO room rent cap! You can choose any room category — single, twin sharing, or even a suite — with zero deductions.`],
        options: [{ id: 'more', label: t.db.askAnotherQuestion }, { id: 'custom', label: t.db.askSomethingElse, icon: 'chat_bubble' }, { id: 'back', label: t.db.backToDashboard, icon: 'switch' }],
      };
    },
    processResponse: () => ({}),
    getNextStep: (r) => r === 'more' ? 'db.answers_topics' : r === 'custom' ? 'db.answers_custom' : 'db.actions',
  },
  {
    id: 'db.answers_cancer',
    module: 'dashboard',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [`Yes, cancer treatment is fully covered including chemotherapy, radiation therapy, surgery, and hospitalization — no sub-limits apply.`],
        options: [{ id: 'more', label: t.db.askAnotherQuestion }, { id: 'custom', label: t.db.askSomethingElse, icon: 'chat_bubble' }, { id: 'back', label: t.db.backToDashboard, icon: 'switch' }],
      };
    },
    processResponse: () => ({}),
    getNextStep: (r) => r === 'more' ? 'db.answers_topics' : r === 'custom' ? 'db.answers_custom' : 'db.actions',
  },
  {
    id: 'db.answers_mental',
    module: 'dashboard',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [`Yes, mental health treatments including consultations, therapy, and hospitalization are covered as per IRDAI guidelines. No additional waiting period applies.`],
        options: [{ id: 'more', label: t.db.askAnotherQuestion }, { id: 'custom', label: t.db.askSomethingElse, icon: 'chat_bubble' }, { id: 'back', label: t.db.backToDashboard, icon: 'switch' }],
      };
    },
    processResponse: () => ({}),
    getNextStep: (r) => r === 'more' ? 'db.answers_topics' : r === 'custom' ? 'db.answers_custom' : 'db.actions',
  },
  {
    id: 'db.answers_ambulance',
    module: 'dashboard',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [`Yes! Ambulance charges up to ₹2,000 per hospitalization are covered for emergencies. Both road and air ambulance are included.`],
        options: [{ id: 'more', label: t.db.askAnotherQuestion }, { id: 'custom', label: t.db.askSomethingElse, icon: 'chat_bubble' }, { id: 'back', label: t.db.backToDashboard, icon: 'switch' }],
      };
    },
    processResponse: () => ({}),
    getNextStep: (r) => r === 'more' ? 'db.answers_topics' : r === 'custom' ? 'db.answers_custom' : 'db.actions',
  },
  {
    id: 'db.answers_ayush',
    module: 'dashboard',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [`Yes, AYUSH treatments (Ayurveda, Yoga, Unani, Siddha, Homeopathy) are covered when taken at a government hospital or recognized institute.`],
        options: [{ id: 'more', label: t.db.askAnotherQuestion }, { id: 'custom', label: t.db.askSomethingElse, icon: 'chat_bubble' }, { id: 'back', label: t.db.backToDashboard, icon: 'switch' }],
      };
    },
    processResponse: () => ({}),
    getNextStep: (r) => r === 'more' ? 'db.answers_topics' : r === 'custom' ? 'db.answers_custom' : 'db.actions',
  },
  {
    id: 'db.answers_waiting',
    module: 'dashboard',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [`Waiting periods:\n\n• 30-day initial waiting for general illness\n• 2 years for specific diseases (hernia, cataracts, etc.)\n• 2-4 years for pre-existing conditions\n• 9 months for maternity\n• No waiting for accidents — covered from day 1`],
        options: [{ id: 'more', label: t.db.askAnotherQuestion }, { id: 'custom', label: t.db.askSomethingElse, icon: 'chat_bubble' }, { id: 'back', label: t.db.backToDashboard, icon: 'switch' }],
      };
    },
    processResponse: () => ({}),
    getNextStep: (r) => r === 'more' ? 'db.answers_topics' : r === 'custom' ? 'db.answers_custom' : 'db.actions',
  },
  {
    id: 'db.answers_claim',
    module: 'dashboard',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [`Two ways to claim:\n\nCashless: Visit any of 14,000+ network hospitals, show your health card, and we settle directly. No upfront payment.\n\nReimbursement: Pay the hospital, submit bills via the app or email, and get reimbursed in 3-5 working days.\n\nYou can raise a claim directly from this dashboard!`],
        options: [{ id: 'raise', label: t.db.raiseClaimNow }, { id: 'more', label: t.db.askAnotherQuestion }, { id: 'back', label: t.db.backToDashboard, icon: 'switch' }],
      };
    },
    processResponse: () => ({}),
    getNextStep: (r) => r === 'raise' ? 'db.claim_intro' : r === 'more' ? 'db.answers_topics' : 'db.actions',
  },
  {
    id: 'db.answers_network',
    module: 'dashboard',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [`ACKO has 14,000+ network hospitals across India including Fortis, Max, Apollo, Medanta, Manipal, Narayana Health, and more.\n\nNearby network hospitals:\n• Fortis Hospital, Gurugram — 2.1 km\n• Columbia Asia, Palam Vihar — 3.2 km\n• Medanta - The Medicity — 5.4 km\n• Max Super Speciality, Saket — 8.3 km`],
        options: [{ id: 'more', label: t.db.askAnotherQuestion }, { id: 'custom', label: t.db.askSomethingElse, icon: 'chat_bubble' }, { id: 'back', label: t.db.backToDashboard, icon: 'switch' }],
      };
    },
    processResponse: () => ({}),
    getNextStep: (r) => r === 'more' ? 'db.answers_topics' : r === 'custom' ? 'db.answers_custom' : 'db.actions',
  },

  /* ── Free-text custom question ── */
  {
    id: 'db.answers_custom',
    module: 'dashboard',
    widgetType: 'text_input',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [t.db.typeQuestion],
        placeholder: t.db.questionPlaceholder,
        inputType: 'text' as const,
      };
    },
    processResponse: () => ({}),
    getNextStep: () => 'db.answers_custom_reply',
  },

  {
    id: 'db.answers_custom_reply',
    module: 'dashboard',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [
          `Based on your ACKO Platinum policy, most medical treatments and hospitalization expenses are covered. For specific treatments, coverage depends on the category — surgical procedures, day-care treatments, and emergency hospitalization are generally covered. Cosmetic or experimental treatments are excluded.\n\nFor a definitive answer on a specific treatment, you can also call our helpline at 1800-266-2256 (toll free, 24/7).`,
        ],
        options: [
          { id: 'more_topics', label: t.db.browseMoreTopics },
          { id: 'another', label: t.db.askAnotherQuestion, icon: 'chat_bubble' },
          { id: 'back', label: t.db.backToDashboard, icon: 'switch' },
        ],
      };
    },
    processResponse: () => ({}),
    getNextStep: (r) => r === 'more_topics' ? 'db.answers_topics' : r === 'another' ? 'db.answers_custom' : 'db.actions',
  },

  /* ═════ DOWNLOAD DOCUMENTS ═════ */
  {
    id: 'db.docs_list',
    module: 'dashboard',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [t.db.policyDocuments],
        options: [
          ...DOCUMENTS.map(d => ({ id: d.id, label: d.name, icon: 'document' })),
          { id: 'back', label: t.db.backToDashboard, icon: 'switch' },
        ],
      };
    },
    processResponse: () => ({}),
    getNextStep: (response) => {
      if (response === 'back') return 'db.actions';
      return 'db.doc_downloaded';
    },
  },

  {
    id: 'db.doc_downloaded',
    module: 'dashboard',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [t.db.downloadStarted, t.db.needAnythingElse],
        options: [
          { id: 'more', label: t.db.downloadMore },
          { id: 'back', label: t.db.backToDashboard },
        ],
      };
    },
    processResponse: () => ({}),
    getNextStep: (response) => response === 'more' ? 'db.docs_list' : 'db.actions',
  },

  /* ═════ EDIT POLICY ═════ */
  {
    id: 'db.edit_options',
    module: 'edit_policy',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [t.db.whatToChange],
        options: [
          { id: 'add_member', label: t.db.addMember, description: t.db.addMemberDesc },
          { id: 'remove_member', label: t.db.removeMember, description: t.db.removeMemberDesc },
          { id: 'change_si', label: t.db.changeSI, description: t.db.changeSIDesc },
          { id: 'back', label: t.db.backToDashboard },
        ],
      };
    },
    processResponse: (response) => ({ dashboardEditType: response }),
    getNextStep: (response) => {
      switch (response) {
        case 'add_member': return 'db.add_member_name';
        case 'remove_member': return 'db.remove_member';
        case 'change_si': return 'db.change_si';
        default: return 'db.actions';
      }
    },
  },

  /* ── Add Member ── */
  {
    id: 'db.add_member_name',
    module: 'edit_policy',
    widgetType: 'text_input',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [t.db.addMemberName],
        placeholder: t.db.enterName,
        inputType: 'text' as const,
      };
    },
    processResponse: (response) => ({ dashboardNewMemberName: response }),
    getNextStep: () => 'db.add_member_age',
  },

  {
    id: 'db.add_member_age',
    module: 'edit_policy',
    widgetType: 'number_input',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [t.db.howOld(state.dashboardNewMemberName || 'the new member')],
        placeholder: t.db.enterAge,
        inputType: 'number' as const,
        min: 0,
        max: 100,
      };
    },
    processResponse: (response) => ({ dashboardNewMemberAge: String(response) }),
    getNextStep: () => 'db.add_member_relation',
  },

  {
    id: 'db.add_member_relation',
    module: 'edit_policy',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [t.db.whatRelation(state.dashboardNewMemberName || 'their')],
        options: [
          { id: 'spouse', label: t.db.spouse },
          { id: 'child', label: t.db.child },
          { id: 'father', label: t.db.fatherRel },
          { id: 'mother', label: t.db.motherRel },
          { id: 'father_in_law', label: t.db.fatherInLaw },
          { id: 'mother_in_law', label: t.db.motherInLaw },
        ],
      };
    },
    processResponse: (response) => ({ dashboardNewMemberRelation: response }),
    getNextStep: () => 'db.add_member_confirm',
  },

  {
    id: 'db.add_member_confirm',
    module: 'edit_policy',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      const premDiff = Math.round((state.selectedPlan?.yearlyPremium || 12999) * 0.25);
      const relationLabel = state.dashboardNewMemberRelation === 'spouse' ? t.db.spouse
        : state.dashboardNewMemberRelation === 'child' ? t.db.child
        : state.dashboardNewMemberRelation === 'father' ? t.db.fatherRel
        : state.dashboardNewMemberRelation === 'mother' ? t.db.motherRel
        : state.dashboardNewMemberRelation === 'father_in_law' ? t.db.fatherInLaw
        : state.dashboardNewMemberRelation === 'mother_in_law' ? t.db.motherInLaw
        : state.dashboardNewMemberRelation;
      return {
        botMessages: [
          t.db.confirmAdd(state.dashboardNewMemberName || '', state.dashboardNewMemberAge || '', relationLabel),
          t.db.premiumIncrease(formatCurrency(premDiff)),
          t.db.confirmQ,
        ],
        options: [
          { id: 'confirm', label: t.db.confirmAndAdd },
          { id: 'cancel', label: t.common.cancel },
        ],
      };
    },
    processResponse: () => ({}),
    getNextStep: (response) => response === 'confirm' ? 'db.edit_done' : 'db.edit_options',
  },

  /* ── Remove Member ── */
  {
    id: 'db.remove_member',
    module: 'edit_policy',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [t.db.whichMemberRemove],
        options: state.members
          .filter(m => m.relation !== 'self')
          .map(m => ({ id: m.id, label: `${m.name} (${m.age} yrs, ${m.relation})` }))
          .concat([{ id: 'cancel', label: t.common.cancel }]),
      };
    },
    processResponse: () => ({}),
    getNextStep: (response) => response === 'cancel' ? 'db.edit_options' : 'db.remove_member_confirm',
  },

  {
    id: 'db.remove_member_confirm',
    module: 'edit_policy',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      const totalMembers = state.members.length || 1;
      const yearlyPremium = state.selectedPlan?.yearlyPremium || 12999;
      const monthlyPremium = state.selectedPlan?.monthlyPremium || 1249;
      const perMemberYearly = Math.round(yearlyPremium / totalMembers);
      const perMemberMonthly = Math.round(monthlyPremium / totalMembers);
      const isMonthly = state.paymentFrequency === 'monthly';
      const reduction = isMonthly ? perMemberMonthly : perMemberYearly;
      const newPremium = isMonthly ? monthlyPremium - perMemberMonthly : yearlyPremium - perMemberYearly;
      const freq = isMonthly ? 'mo' : 'yr';
      return {
        botMessages: [
          t.db.premiumReduction(formatCurrency(reduction), freq),
          `New premium: ${formatCurrency(newPremium)}/${freq} (down from ${formatCurrency(isMonthly ? monthlyPremium : yearlyPremium)}/${freq}). The change takes effect from the next billing cycle.`,
          t.db.confirmRemoval,
        ],
        options: [
          { id: 'confirm', label: t.db.confirmRemoval },
          { id: 'cancel', label: t.common.cancel },
        ],
      };
    },
    processResponse: () => ({}),
    getNextStep: (response) => response === 'confirm' ? 'db.edit_done' : 'db.edit_options',
  },

  /* ── Change Sum Insured ── */
  {
    id: 'db.change_si',
    module: 'edit_policy',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      const currentLabel = state.selectedPlan?.sumInsuredLabel || '₹25L';
      return {
        botMessages: [
          t.db.currentSI(currentLabel),
          `Heads up: upgrading to a higher amount will require a brief medical evaluation (IRDAI guideline). Reducing cover takes effect immediately.`,
        ],
        options: SI_OPTIONS.map(o => {
          const isCurrentPlan = SI_VALUES[o.id] === (state.selectedPlan?.sumInsured ?? 2_500_000);
          return {
            id: o.id,
            label: o.label,
            badge: isCurrentPlan ? 'Current' : undefined,
            disabled: isCurrentPlan,
          };
        }),
      };
    },
    processResponse: (response) => ({ dashboardNewSumInsured: response }),
    getNextStep: (response, state) => {
      const newSI = SI_VALUES[response] ?? 0;
      const currentSI = state.selectedPlan?.sumInsured ?? 2_500_000;
      return newSI > currentSI ? 'db.si_medical_required' : 'db.change_si_confirm';
    },
  },

  /* ── SI Upgrade: Medical evaluation required ── */
  {
    id: 'db.si_medical_required',
    module: 'edit_policy',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const currentLabel = state.selectedPlan?.sumInsuredLabel || '₹25L';
      const newLabel = SI_LABELS[state.dashboardNewSumInsured] || state.dashboardNewSumInsured;
      return {
        botMessages: [
          `Great choice! Upgrading your cover from ${currentLabel} → ${newLabel} gives your family much stronger protection.`,
          `Since you're increasing your sum insured, IRDAI guidelines require a brief medical evaluation. It's a simple 20-minute check — blood pressure, BMI, and a few basic tests.\n\nYou can choose a home visit (free sample collection) or visit a nearby diagnostic centre. No special preparation needed.`,
        ],
        options: [
          { id: 'schedule', label: 'Schedule medical evaluation', icon: 'health', description: 'Home visit or lab · Takes 20 mins' },
          { id: 'cancel', label: 'Cancel upgrade', icon: 'switch' },
        ],
      };
    },
    processResponse: () => ({}),
    getNextStep: (response) => response === 'schedule' ? 'db.si_medical_schedule' : 'db.edit_options',
  },

  /* ── SI Upgrade: Schedule the evaluation ── */
  {
    id: 'db.si_medical_schedule',
    module: 'edit_policy',
    widgetType: 'selection_cards',
    getScript: () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      const fmt = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      return {
        botMessages: [
          `When would you like the medical evaluation? Pick a slot that works for you:`,
        ],
        options: [
          { id: 'home_tom_am',  label: `${fmt(tomorrow)}, 8–11 AM`,  description: 'Home visit · Free sample collection' },
          { id: 'home_tom_pm',  label: `${fmt(tomorrow)}, 1–4 PM`,   description: 'Home visit · Free sample collection' },
          { id: 'lab_tom',      label: `${fmt(tomorrow)}, Any time`, description: 'Lab visit · Nearest diagnostic centre' },
          { id: 'home_da_am',   label: `${fmt(dayAfter)}, 8–11 AM`, description: 'Home visit · Free sample collection' },
          { id: 'lab_da',       label: `${fmt(dayAfter)}, Any time`, description: 'Lab visit · Nearest diagnostic centre' },
        ],
      };
    },
    processResponse: (response) => {
      const slotLabels: Record<string, string> = {
        home_tom_am: 'Home visit · Tomorrow 8–11 AM',
        home_tom_pm: 'Home visit · Tomorrow 1–4 PM',
        lab_tom:     'Lab visit · Tomorrow',
        home_da_am:  'Home visit · Day after tomorrow 8–11 AM',
        lab_da:      'Lab visit · Day after tomorrow',
      };
      return { dashboardEditType: `si_eval_${response}__slot:${slotLabels[response] || response}` };
    },
    getNextStep: () => 'db.si_medical_booked',
  },

  /* ── SI Upgrade: Evaluation booked confirmation ── */
  {
    id: 'db.si_medical_booked',
    module: 'edit_policy',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const newLabel = SI_LABELS[state.dashboardNewSumInsured] || state.dashboardNewSumInsured;
      const rawSlot = state.dashboardEditType.split('__slot:')[1] || '';
      const slotStr = rawSlot ? `\nSlot: ${rawSlot}` : '';
      return {
        botMessages: [
          `✓ Medical evaluation scheduled!${slotStr}\n\nA confirmation SMS and email has been sent to you. Our team will reach out 30 mins before your slot.`,
          `Once results are reviewed (usually 2–3 working days), your sum insured will be upgraded to ${newLabel} and we'll send you the revised policy document. The new premium applies from your next renewal.`,
        ],
        options: [
          { id: 'track', label: 'Track this request', icon: 'clock' },
          { id: 'more',  label: 'Make another change', icon: 'refresh' },
          { id: 'back',  label: 'Back to dashboard', icon: 'switch' },
        ],
      };
    },
    processResponse: (response, state) => {
      const newLabel = SI_LABELS[state.dashboardNewSumInsured] || state.dashboardNewSumInsured;
      const rawSlot = state.dashboardEditType.split('__slot:')[1] || '';
      return {
        dashboardSubmittedEdits: [
          ...state.dashboardSubmittedEdits,
          {
            id: `EDT-${Math.floor(100000 + Math.random() * 900000)}`,
            type: 'Change sum insured',
            summary: `Upgrade to ${newLabel}${rawSlot ? ' · ' + rawSlot : ''} · Medical eval scheduled`,
            status: 'Medical eval pending',
            submittedAt: Date.now(),
          },
        ],
        dashboardNewSumInsured: '',
        dashboardEditType: '',
      };
    },
    getNextStep: (response) => {
      if (response === 'track') return 'db.track_overview';
      if (response === 'more') return 'db.edit_options';
      return 'db.actions';
    },
  },

  {
    id: 'db.change_si_confirm',
    module: 'edit_policy',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      return {
        botMessages: [
          t.db.changingSI(state.dashboardNewSumInsured || ''),
          t.db.confirmQ,
        ],
        options: [
          { id: 'confirm', label: t.db.confirmChange },
          { id: 'cancel', label: t.common.cancel },
        ],
      };
    },
    processResponse: () => ({}),
    getNextStep: (response) => response === 'confirm' ? 'db.edit_done' : 'db.edit_options',
  },

  /* ── Edit Done — with track request option ── */
  {
    id: 'db.edit_done',
    module: 'edit_policy',
    widgetType: 'selection_cards',
    getScript: (_p, state) => {
      const t = getT(state.language);
      const editType = state.dashboardEditType;
      let summary = '';
      if (editType === 'add_member') summary = `Add ${state.dashboardNewMemberName} (${state.dashboardNewMemberAge} yrs, ${state.dashboardNewMemberRelation})`;
      else if (editType === 'remove_member') summary = 'Remove member';
      else if (editType === 'change_si') summary = `Change sum insured to ${state.dashboardNewSumInsured}`;
      return {
        botMessages: [t.db.editDone],
        options: [
          { id: 'track', label: t.db.trackThisRequest, icon: 'clock' },
          { id: 'more', label: t.db.makeAnotherChange, icon: 'refresh' },
          { id: 'back', label: t.db.backToDashboard, icon: 'switch' },
        ],
        widgetData: { editType, summary },
      };
    },
    processResponse: (response, state) => {
      const editType = state.dashboardEditType;
      let summary = '';
      if (editType === 'add_member') summary = `Add ${state.dashboardNewMemberName} (${state.dashboardNewMemberAge} yrs, ${state.dashboardNewMemberRelation})`;
      else if (editType === 'remove_member') summary = 'Remove member';
      else if (editType === 'change_si') summary = `Change sum insured to ${state.dashboardNewSumInsured}`;
      const editLabel = editType === 'add_member' ? 'Add member' : editType === 'remove_member' ? 'Remove member' : 'Change sum insured';
      return {
        dashboardSubmittedEdits: [
          ...state.dashboardSubmittedEdits,
          {
            id: `EDT-${Math.floor(100000 + Math.random() * 900000)}`,
            type: editLabel,
            summary,
            status: 'Under review',
            submittedAt: Date.now(),
          },
        ],
        dashboardNewMemberName: '',
        dashboardNewMemberAge: '',
        dashboardNewMemberRelation: '',
        dashboardNewSumInsured: '',
        dashboardEditType: '',
      };
    },
    getNextStep: (response) => {
      if (response === 'track') return 'db.track_overview';
      if (response === 'more') return 'db.edit_options';
      return 'db.actions';
    },
  },
];

/* ── Step lookup ── */
const stepMap = new Map(dashboardSteps.map(s => [s.id, s]));

export function getDashboardStep(stepId: string): ConversationStep | undefined {
  return stepMap.get(stepId);
}
