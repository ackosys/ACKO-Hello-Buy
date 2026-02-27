/**
 * Journey Persistence — saves in-progress journey state to localStorage so
 * the DropOffBanner can show real "continue where you left off" cards.
 *
 * Only serialisable, meaningful fields are stored (no functions, no history).
 */
import { getT, getCurrentLang } from './translations';

export type ProductKey = 'health' | 'car' | 'bike' | 'life';

// ── Snapshot shape ────────────────────────────────────────────────────────────

export interface JourneySnapshot {
  product: ProductKey;
  currentStepId: string;
  savedAt: string; // ISO

  /* Health */
  userName?: string;
  members?: { relation: string; age: number; name?: string }[];
  pincode?: string;
  selectedPlan?: { name?: string; monthlyPremium?: number; yearlyPremium?: number; sumInsured?: number; tier?: string } | null;
  paymentComplete?: boolean;
  paymentFrequency?: 'monthly' | 'yearly';
  currentPremium?: number;
  callScheduledDate?: string;
  testScheduledDate?: string;
  testScheduledLab?: string;
  postPaymentPhase?: string | null;
  postPaymentScenario?: string;

  /* Life */
  name?: string;           // life store uses `name` not `userName`
  gender?: string;
  dob?: string;
  coverAmount?: number;
  annualPremium?: number;
  monthlyPremium?: number;
  ekycComplete?: boolean;
  financialComplete?: boolean;
  medicalComplete?: boolean;
  userPath?: string;       // 'guided' | 'direct_quote'

  /* Motor */
  vehicleType?: 'car' | 'bike' | null;
  vehicleData?: {
    make?: string;
    model?: string;
    variant?: string;
    fuelType?: string;
    registrationYear?: number | null;
  };
  registrationNumber?: string;
  totalPremium?: number;
  selectedPlanType?: string | null;
  ownerName?: string;
}

// ── localStorage helpers ──────────────────────────────────────────────────────

const STORAGE_KEY = 'acko_journey_snapshots';

function loadAll(): Partial<Record<ProductKey, JourneySnapshot>> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveAll(data: Partial<Record<ProductKey, JourneySnapshot>>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function saveSnapshot(snapshot: JourneySnapshot): void {
  const all = loadAll();
  all[snapshot.product] = snapshot;
  saveAll(all);
}

export function loadSnapshot(product: ProductKey): JourneySnapshot | null {
  return loadAll()[product] ?? null;
}

export function clearSnapshot(product: ProductKey): void {
  const all = loadAll();
  delete all[product];
  saveAll(all);
}

export function clearAllSnapshots(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// ── Which steps are "significant" (worth saving) ──────────────────────────────

export const HEALTH_SAVE_STEPS = new Set([
  'entry.name_ack',
  'family.who_to_cover',
  'family.cover_ack',
  'family.age_ack',
  'family.pincode_result',
  'coverage.current_insurance',
  'health.conditions',
  'health.healthy_ack',
  'health.conditions_ack',
  'customization.si_selection',
  'recommendation.calculating',
  'recommendation.result',
  'customization.frequency',
  'review.summary',
  'review.consent',
  'review.dob_collection',
  'review.dob_ack',
  'payment.success',
  'health_eval.intro',
  'health_eval.call_done',
  'health_eval.lab_schedule',
  'health_eval.schedule',
  'completion.celebration',
  'db.claim_submitted',
  'db.edit_done',
]);

export const LIFE_SAVE_STEPS = new Set([
  'life_basic_dob',
  'life_basic_income',
  'life_basic_summary',
  'life_lifestyle_summary',
  'life_dq_habits',
  'life_basic_habits',
  'life_dq_income',
  'life_dq_coverage_input',
  'life_quote_display',
  'life_addons_intro',
  'life_review',
  'life_payment',
  'life_ekyc',
  'life_financial',
  'life_medical_eval',
  'life_underwriting',
  'life_db.personal_submitted',
  'life_db.nominee_submitted',
  'life_db.coverage_submitted',
]);

export const MOTOR_SAVE_STEPS = new Set([
  'vehicle_fetch.found',
  'manual_entry.select_brand',
  'brand_new.popular_cars',
  'owner_details.name',
  'pre_quote.summary',
  'pre_quote.view_prices',
  'quote.plans_ready',
  'quote.plan_selection',
  'quote.plan_selected',
  'addons.out_of_pocket',
  'addons.protect_everyone',
  'addons.complete',
  'review.premium_breakdown',
  'payment.success',
  'completion.dashboard',
  'db.claim_submitted',
  'db.edit_done',
]);

// ── Step → DropOff display info ───────────────────────────────────────────────

export interface DropOffDisplay {
  title: string;
  subtitle: string;
  ctaLabel: string;
  /** resume URL (relative, no origin) */
  route: string;
  urgency: 'high' | 'medium' | 'low';
  badge: string;
}

function fmt(n: number | undefined, freq: string = 'monthly'): string {
  if (!n) return '';
  return `₹${n.toLocaleString('en-IN')}${freq === 'monthly' ? '/mo' : '/yr'}`;
}

function vehicleLabel(snap: JourneySnapshot): string {
  const v = snap.vehicleData;
  if (!v?.make) return snap.vehicleType === 'bike' ? 'Bike' : 'Car';
  return [v.make, v.model].filter(Boolean).join(' ');
}

export function getDropOffDisplay(snap: JourneySnapshot): DropOffDisplay | null {
  const { product, currentStepId } = snap;
  const t = getT(getCurrentLang()).dropOff;

  /* ── HEALTH ─────────────────────────────────────────────── */
  if (product === 'health') {
    const memberCount = snap.members?.length ?? 0;
    const memberStr = memberCount > 0 ? `${memberCount} member${memberCount > 1 ? 's' : ''}` : '';
    const premStr = fmt(snap.currentPremium, snap.paymentFrequency);
    const nameStr = snap.userName || '';

    if (currentStepId === 'entry.name_ack') {
      return {
        title: nameStr ? `${nameStr}, let's find your plan` : "Let's find your health plan",
        subtitle: 'Plans starting at ₹399/mo',
        ctaLabel: 'Continue journey',
        route: '/health?resume=1',
        urgency: 'medium',
        badge: 'In progress',
      };
    }
    if (['family.who_to_cover', 'family.cover_ack'].includes(currentStepId)) {
      return {
        title: nameStr ? `${nameStr}, tell us who to cover` : 'Select members to cover',
        subtitle: memberStr ? `${memberStr} added so far` : 'Add family members to get covered',
        ctaLabel: 'Continue journey',
        route: '/health?resume=1',
        urgency: 'medium',
        badge: 'In progress',
      };
    }
    if (currentStepId === 'family.age_ack') {
      return {
        title: nameStr ? `${nameStr}, we're building your plan` : "We're building your health plan",
        subtitle: `${memberStr} · Age details collected`,
        ctaLabel: 'Continue journey',
        route: '/health?resume=1',
        urgency: 'medium',
        badge: 'In progress',
      };
    }
    if (currentStepId === 'family.pincode_result') {
      return {
        title: nameStr ? `${nameStr}, almost there` : 'Almost there',
        subtitle: `${memberStr} · Quote almost ready`,
        ctaLabel: 'Continue journey',
        route: '/health?resume=1',
        urgency: 'medium',
        badge: 'Almost there',
      };
    }
    if (['coverage.current_insurance', 'health.conditions', 'health.healthy_ack', 'health.conditions_ack'].includes(currentStepId)) {
      return {
        title: nameStr ? `${nameStr}, your quote is almost ready` : 'Your quote is almost ready',
        subtitle: 'Just a few health details needed',
        ctaLabel: 'Get my quote',
        route: '/health?resume=1',
        urgency: 'medium',
        badge: 'Almost there',
      };
    }
    if (['customization.si_selection', 'recommendation.calculating', 'customization.frequency'].includes(currentStepId)) {
      return {
        title: nameStr ? `${nameStr}, customize your plan` : 'Customize your health plan',
        subtitle: `Choose sum insured & payment frequency`,
        ctaLabel: 'Continue',
        route: '/health?resume=1',
        urgency: 'high',
        badge: 'Customizing',
      };
    }
    if (currentStepId === 'recommendation.result') {
      return {
        title: t.quoteReady(t.healthLabel),
        subtitle: `${memberStr} · Compare plans & pick the best fit`,
        ctaLabel: 'View plans',
        route: '/health?resume=1',
        urgency: 'high',
        badge: t.quoteReadyBadge,
      };
    }
    if (['review.summary', 'review.consent', 'review.dob_collection', 'review.dob_ack'].includes(currentStepId)) {
      return {
        title: 'Complete your health insurance',
        subtitle: premStr ? `${premStr} · ${memberStr}` : memberStr,
        ctaLabel: t.completePurchase,
        route: '/health?resume=1',
        urgency: 'high',
        badge: 'Action needed',
      };
    }
    if (currentStepId === 'payment.success' || currentStepId === 'health_eval.intro') {
      return {
        title: 'Schedule your call with doctor',
        subtitle: `Payment done · Health evaluation pending`,
        ctaLabel: 'Schedule now',
        route: '/health?resume=1',
        urgency: 'high',
        badge: 'Action needed',
      };
    }
    if (currentStepId === 'health_eval.call_done') {
      return {
        title: 'Schedule your medical tests',
        subtitle: `Doctor call done · Book home or lab test`,
        ctaLabel: 'Book tests',
        route: '/health?resume=1',
        urgency: 'high',
        badge: 'Action needed',
      };
    }
    if (currentStepId === 'health_eval.schedule') {
      const dateStr = snap.callScheduledDate || '';
      return {
        title: 'Doctor call scheduled',
        subtitle: dateStr ? `Call on ${dateStr}` : 'Awaiting doctor call',
        ctaLabel: 'View details',
        route: '/health?resume=1',
        urgency: 'medium',
        badge: 'Scheduled',
      };
    }
    if (currentStepId === 'health_eval.lab_schedule') {
      const labStr = snap.testScheduledLab || '';
      const dateStr = snap.testScheduledDate || '';
      return {
        title: 'Your health tests are scheduled',
        subtitle: [dateStr, labStr].filter(Boolean).join(' · ') || 'Tests booked',
        ctaLabel: 'View details',
        route: '/health?resume=1',
        urgency: 'medium',
        badge: 'Tests booked',
      };
    }
    if (currentStepId === 'completion.celebration') {
      return {
        title: 'Your health policy is active!',
        subtitle: `${premStr ? premStr + ' · ' : ''}${memberStr}`,
        ctaLabel: 'View dashboard',
        route: '/health?screen=dashboard',
        urgency: 'low',
        badge: 'Policy active',
      };
    }
    if (currentStepId === 'db.claim_submitted') {
      return {
        title: nameStr ? `${nameStr}, claim submitted` : 'Health claim submitted',
        subtitle: `Processing in 3-5 days`,
        ctaLabel: 'Track claim',
        route: '/health?screen=dashboard',
        urgency: 'low',
        badge: 'Claim submitted',
      };
    }
    if (currentStepId === 'db.edit_done') {
      return {
        title: nameStr ? `${nameStr}, policy update requested` : 'Policy update requested',
        subtitle: `Effective from next billing cycle`,
        ctaLabel: 'View policy',
        route: '/health?screen=dashboard',
        urgency: 'low',
        badge: 'Update in progress',
      };
    }
  }

  /* ── LIFE ────────────────────────────────────────────────── */
  if (product === 'life') {
    const displayName = snap.name ? snap.name : '';
    const coverStr = snap.coverAmount ? `₹${(snap.coverAmount / 10000000).toFixed(0)} Cr cover` : '';
    const premStr = snap.annualPremium ? `₹${snap.annualPremium.toLocaleString('en-IN')}/yr` : (snap.monthlyPremium ? `₹${snap.monthlyPremium.toLocaleString('en-IN')}/mo` : '');

    if (['life_basic_dob', 'life_basic_income', 'life_basic_summary', 'life_basic_habits', 'life_dq_habits', 'life_dq_income', 'life_dq_coverage_input'].includes(currentStepId)) {
      const nameStr = displayName ? `${displayName}, we're ` : "We're ";
      return {
        title: `${nameStr}building your life plan`,
        subtitle: 'Continue where you left off',
        ctaLabel: 'Continue journey',
        route: '/life?resume=1',
        urgency: 'medium',
        badge: 'In progress',
      };
    }
    if (currentStepId === 'life_lifestyle_summary') {
      return {
        title: displayName ? `${displayName}, your quote is almost ready` : 'Your quote is almost ready',
        subtitle: 'Just a few more details needed',
        ctaLabel: 'Get my quote',
        route: '/life?resume=1',
        urgency: 'medium',
        badge: 'Almost there',
      };
    }
    if (currentStepId === 'life_quote_display' || currentStepId === 'life_addons_intro') {
      return {
        title: `${displayName ? displayName + ', your' : 'Your'} life quote is ready`,
        subtitle: [premStr, coverStr].filter(Boolean).join(' · '),
        ctaLabel: 'Review & buy',
        route: '/life?resume=1',
        urgency: 'high',
        badge: 'Quote ready',
      };
    }
    if (currentStepId === 'life_review' || currentStepId === 'life_payment') {
      return {
        title: 'Complete your life insurance purchase',
        subtitle: [premStr, coverStr].filter(Boolean).join(' · '),
        ctaLabel: 'Complete now',
        route: '/life?resume=1',
        urgency: 'high',
        badge: 'Action needed',
      };
    }
    if (currentStepId === 'life_ekyc') {
      return {
        title: 'Complete eKYC to activate your policy',
        subtitle: `Payment done · eKYC pending${coverStr ? ' · ' + coverStr : ''}`,
        ctaLabel: 'Complete eKYC',
        route: '/life?resume=1',
        urgency: 'high',
        badge: 'Action needed',
      };
    }
    if (currentStepId === 'life_financial') {
      return {
        title: 'Submit your income documents',
        subtitle: `eKYC done · Financial docs pending`,
        ctaLabel: 'Upload now',
        route: '/life?resume=1',
        urgency: 'medium',
        badge: 'Step pending',
      };
    }
    if (currentStepId === 'life_medical_eval') {
      return {
        title: 'Medical evaluation in progress',
        subtitle: `Results expected in 2–3 days${coverStr ? ' · ' + coverStr : ''}`,
        ctaLabel: 'Track status',
        route: '/life?resume=1',
        urgency: 'medium',
        badge: 'In progress',
      };
    }
    if (currentStepId === 'life_underwriting') {
      return {
        title: 'Your policy is being processed',
        subtitle: `Underwriting in progress${coverStr ? ' · ' + coverStr : ''}`,
        ctaLabel: 'Track status',
        route: '/life?resume=1',
        urgency: 'low',
        badge: 'Processing',
      };
    }
    if (currentStepId === 'life_db.personal_submitted') {
      const sub = [premStr, coverStr].filter(Boolean).join(' · ') || 'Term Life Plan · Active';
      return {
        title: displayName ? `${displayName}, personal info update requested` : 'Personal info update requested',
        subtitle: `Processing in 2-3 days · ${sub}`,
        ctaLabel: 'View policy',
        route: '/life?screen=dashboard',
        urgency: 'low',
        badge: 'Update in progress',
      };
    }
    if (currentStepId === 'life_db.nominee_submitted') {
      const sub = [premStr, coverStr].filter(Boolean).join(' · ') || 'Term Life Plan · Active';
      return {
        title: displayName ? `${displayName}, nominee update requested` : 'Nominee update requested',
        subtitle: `Verification in 2-3 days · ${sub}`,
        ctaLabel: 'View policy',
        route: '/life?screen=dashboard',
        urgency: 'low',
        badge: 'Update in progress',
      };
    }
    if (currentStepId === 'life_db.coverage_submitted') {
      const sub = [premStr, coverStr].filter(Boolean).join(' · ') || 'Term Life Plan · Active';
      return {
        title: displayName ? `${displayName}, coverage update under review` : 'Coverage update under review',
        subtitle: `Review in 5-7 days · ${sub}`,
        ctaLabel: 'View policy',
        route: '/life?screen=dashboard',
        urgency: 'low',
        badge: 'Under review',
      };
    }
  }

  /* ── CAR / BIKE ──────────────────────────────────────────── */
  if (product === 'car' || product === 'bike') {
    const vLabel = vehicleLabel(snap);
    const regStr = snap.registrationNumber ? ` · ${snap.registrationNumber.toUpperCase()}` : '';
    const premStr = snap.totalPremium ? `₹${snap.totalPremium.toLocaleString('en-IN')}/yr` : '';
    const planStr = snap.selectedPlanType === 'zero_dep' ? 'Zero Dep' : snap.selectedPlanType === 'third_party' ? 'Third Party' : snap.selectedPlanType === 'comprehensive' ? 'Comprehensive' : '';
    const route = `/motor?vehicle=${product}&resume=1`;

    const productLabel = product === 'car' ? t.carLabel : t.bikeLabel;

    if (['vehicle_fetch.found', 'manual_entry.select_brand', 'brand_new.popular_cars'].includes(currentStepId)) {
      return {
        title: `Let's insure your ${productLabel.toLowerCase()}`,
        subtitle: vLabel !== productLabel ? `${vLabel}${regStr}` : `Vehicle details in progress`,
        ctaLabel: 'Continue',
        route,
        urgency: 'medium',
        badge: 'In progress',
      };
    }
    if (['owner_details.name', 'pre_quote.summary', 'pre_quote.view_prices'].includes(currentStepId)) {
      return {
        title: `Almost there, ${productLabel.toLowerCase()} details ready`,
        subtitle: `${vLabel}${regStr}`,
        ctaLabel: 'Get quote',
        route,
        urgency: 'high',
        badge: 'Details ready',
      };
    }
    if (['quote.plans_ready', 'quote.plan_selection'].includes(currentStepId)) {
      return {
        title: t.quoteReady(productLabel),
        subtitle: `${vLabel}${regStr}`,
        ctaLabel: 'View plans',
        route,
        urgency: 'high',
        badge: t.quoteReadyBadge,
      };
    }
    if (currentStepId === 'quote.plan_selected') {
      return {
        title: `${planStr} selected, customize add-ons`,
        subtitle: `${vLabel}${regStr}`,
        ctaLabel: 'Add protections',
        route,
        urgency: 'high',
        badge: 'Plan selected',
      };
    }
    if (currentStepId === 'addons.out_of_pocket' || currentStepId === 'addons.protect_everyone') {
      return {
        title: `Finish selecting add-ons`,
        subtitle: `Starting at ₹300/yr`,
        ctaLabel: 'Pick add-ons',
        route,
        urgency: 'high',
        badge: 'Customizing',
      };
    }
    if (currentStepId === 'addons.complete') {
      return {
        title: `Review your ${vLabel} plan`,
        subtitle: `${planStr} · Add-ons done${premStr ? ' · ' + premStr : ''}`,
        ctaLabel: 'Review & pay',
        route,
        urgency: 'high',
        badge: 'Almost done',
      };
    }
    if (currentStepId === 'review.premium_breakdown') {
      return {
        title: `Complete payment for ${vLabel}`,
        subtitle: `${planStr}${premStr ? ' · ' + premStr : ''}`,
        ctaLabel: 'Pay now',
        route,
        urgency: 'high',
        badge: 'Payment pending',
      };
    }
    if (currentStepId === 'payment.success' || currentStepId === 'completion.dashboard') {
      return {
        title: `Your ${productLabel} policy is active`,
        subtitle: [planStr, `${vLabel}${regStr}`].filter(Boolean).join(' · '),
        ctaLabel: 'View policy',
        route: `/motor?vehicle=${product}&screen=dashboard`,
        urgency: 'low',
        badge: 'Policy active',
      };
    }
    if (currentStepId === 'db.claim_submitted') {
      return {
        title: `Your ${productLabel} claim has been submitted`,
        subtitle: `Processing in 3-5 days · ${vLabel}${regStr}`,
        ctaLabel: 'Track claim',
        route: `/motor?vehicle=${product}&screen=dashboard`,
        urgency: 'low',
        badge: 'Claim submitted',
      };
    }
    if (currentStepId === 'db.edit_done') {
      return {
        title: `${productLabel} policy update in progress`,
        subtitle: `Changes in 2-3 days · ${vLabel}${regStr}`,
        ctaLabel: 'View policy',
        route: `/motor?vehicle=${product}&screen=dashboard`,
        urgency: 'low',
        badge: 'Update in progress',
      };
    }
  }

  return null;
}
