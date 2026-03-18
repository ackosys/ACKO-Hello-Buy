import { MotorJourneyState, FuelType, NcbPercentage, ExpandedPlanType, PlanCombination } from './types';

/* ═══════════════════════════════════════════════
   ACKO Motor Insurance — Premium Calculation Engine
   Based on realistic Indian motor insurance pricing
   Plan hierarchy per car-planning-logic SKILL.md
   ═══════════════════════════════════════════════ */

export type MotorPlanType = 'comprehensive' | 'zero_dep' | 'third_party' | 'od' | 'od_zd';
export type GarageTier = 'network' | 'all';
export type PlanVariant = 'safe_driver' | 'standard' | 'network' | null;

export interface MotorPlanDetails {
  type: MotorPlanType;
  expandedType: ExpandedPlanType;
  variant: PlanVariant;
  garageTier?: GarageTier;
  name: string;
  tagline: string;
  description: string;
  idv: number;
  odPremium: number;
  tpPremium: number;
  ncbDiscount: number;
  deductible: number;
  deductibleDescription: string;
  basePrice: number;
  gst: number;
  totalPrice: number;
  features: string[];
  notCovered: string[];
  addOnsAvailable: string[];
  badge?: string;
  recommended?: boolean;
  coversOwnCar: boolean;
  coversThirdParty: boolean;
  hasZeroDep: boolean;
}

export interface MotorAddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  mandatory?: boolean;
  popular?: boolean;
  recommended?: boolean;
  category?: 'out_of_pocket' | 'protect_everyone';
  hasVariants?: boolean;
  variants?: {
    id: string;
    name: string;
    price: number;
    recommended?: boolean;
    badge?: string;
    features?: string[];
  }[];
}

/* ── IDV Calculation ──
   IDV = Manufacturer's listed selling price - Depreciation
   Depreciation rates based on vehicle age */

const DEPRECIATION_RATES: Record<number, number> = {
  0: 0.05,   // 0-6 months: 5%
  1: 0.15,   // 6-12 months: 15%
  2: 0.20,   // 1-2 years: 20%
  3: 0.30,   // 2-3 years: 30%
  4: 0.40,   // 3-4 years: 40%
  5: 0.50,   // 4-5 years: 50%
};

export function calculateIDV(
  makePrice: number,
  vehicleAge: number,
  cngKitValue: number = 0
): { min: number; recommended: number; max: number } {
  const depRate = DEPRECIATION_RATES[Math.min(vehicleAge, 5)] || 0.50;
  const baseIDV = makePrice * (1 - depRate);
  
  // IDV range: -10% to +5% of calculated value
  const recommended = Math.round((baseIDV + cngKitValue) / 1000) * 1000;
  const min = Math.round(recommended * 0.90 / 1000) * 1000;
  const max = Math.round(recommended * 1.05 / 1000) * 1000;
  
  return { min, recommended, max };
}

/* ── Third Party Premium ──
   Fixed by IRDAI based on engine capacity (CC) or power (kW) */

const TP_RATES_CAR: Record<string, number> = {
  '0-1000': 2072,
  '1000-1500': 3221,
  '1500+': 7890,
};

const TP_RATES_BIKE: Record<string, number> = {
  '0-75': 482,
  '75-150': 714,
  '150-350': 1366,
  '350+': 2804,
};

export function calculateTPPremium(
  vehicleType: 'car' | 'bike',
  engineCC: number
): number {
  if (vehicleType === 'bike') {
    if (engineCC <= 75) return TP_RATES_BIKE['0-75'];
    if (engineCC <= 150) return TP_RATES_BIKE['75-150'];
    if (engineCC <= 350) return TP_RATES_BIKE['150-350'];
    return TP_RATES_BIKE['350+'];
  } else {
    if (engineCC <= 1000) return TP_RATES_CAR['0-1000'];
    if (engineCC <= 1500) return TP_RATES_CAR['1000-1500'];
    return TP_RATES_CAR['1500+'];
  }
}

/* ── Own Damage Premium ──
   OD Premium = IDV × OD rate × (1 - NCB%) */

const OD_RATES_CAR: Record<string, number> = {
  petrol: 0.031,   // 3.1% of IDV
  diesel: 0.033,   // 3.3% of IDV
  cng: 0.029,      // 2.9% of IDV
  electric: 0.025, // 2.5% of IDV
};

const OD_RATES_BIKE: Record<string, number> = {
  petrol: 0.028,
  diesel: 0.030,
  cng: 0.026,
  electric: 0.022,
};

export function calculateODPremium(
  vehicleType: 'car' | 'bike',
  idv: number,
  fuelType: FuelType,
  ncbPercentage: NcbPercentage,
  garageTier: GarageTier = 'all'
): { odPremium: number; ncbDiscount: number } {
  const rates = vehicleType === 'bike' ? OD_RATES_BIKE : OD_RATES_CAR;
  const odRate = rates[fuelType] || rates.petrol;
  
  const baseOD = idv * odRate;
  const ncbDiscount = baseOD * (ncbPercentage / 100);
  let odPremium = baseOD - ncbDiscount;
  
  // Network garage discount: 10-15% off
  if (garageTier === 'network') {
    odPremium = odPremium * 0.85;
  }
  
  return {
    odPremium: Math.round(odPremium),
    ncbDiscount: Math.round(ncbDiscount),
  };
}

/* ── Zero Dep Premium ──
   Zero Dep = OD Premium × 1.20 (20% markup) */

export function calculateZeroDepPremium(
  odPremium: number,
  vehicleAge: number
): number {
  // Zero dep not available for vehicles > 5 years
  if (vehicleAge > 5) return 0;
  
  // Premium markup: 15-25% based on age
  const markup = vehicleAge <= 2 ? 1.15 : 1.20;
  return Math.round(odPremium * markup);
}

/* ── Determine Plan Combination ──
   Based on vehicle age and eligibility per skill file */

export function determinePlanCombination(state: MotorJourneyState): PlanCombination {
  const vehicleAge = state.vehicleData.registrationYear
    ? new Date().getFullYear() - state.vehicleData.registrationYear
    : 3;

  if (state.hasActiveTpPolicy && vehicleAge >= 1 && vehicleAge <= 3) {
    if (vehicleAge <= 1) return 'OD-3';
    if (vehicleAge <= 2) return 'OD-2';
    return 'OD-1';
  }

  if (vehicleAge <= 1) return 'F';
  if (vehicleAge <= 3) return 'E';
  if (vehicleAge <= 5) return 'D';
  if (vehicleAge <= 8) return 'C';
  return 'C';
}

/* ── Safe Driver deductible calculation ── */
const SAFE_DRIVER_DEDUCTIBLE = 5000;
const NETWORK_GARAGE_DEDUCTIBLE = 5000;

/* ── Plan Details Generator ──
   Now supports the full hierarchy per skill file:
   OD, OD ZD (Safe/Standard), Comp (Network/Standard),
   ZD Comp (Safe/Standard), Third Party */

export function getMotorPlanDetails(
  state: MotorJourneyState,
  planType: MotorPlanType,
  garageTier?: GarageTier,
  idvOverride?: number
): MotorPlanDetails {
  const { vehicleType, vehicleData, previousPolicy } = state;

  const makePrice = 800000;
  const engineCC = vehicleType === 'bike' ? 150 : 1200;
  const vehicleAge = vehicleData.registrationYear ? new Date().getFullYear() - vehicleData.registrationYear : 3;

  const idvData = calculateIDV(makePrice, vehicleAge);
  const idv = idvOverride !== undefined ? idvOverride : idvData.recommended;
  const ncb = previousPolicy.ncbPercentage || 0;

  const tpPremium = calculateTPPremium(vehicleType || 'car', engineCC);
  const commonNotCovered = [
    'Damage due to regular wear and tear',
    'Commercial use of the car',
    'Pre-existing damage',
    'Illegal driving (without valid licence, under influence, etc.)',
  ];
  const commonOdAddons = [
    'engine_protection', 'extra_car_protection', 'consumables_cover',
    'ncb_protect', 'return_to_invoice',
    'personal_accident', 'passenger_protection', 'paid_driver',
    'electrical_accessory', 'non_electrical_accessory',
  ];

  if (planType === 'third_party') {
    return {
      type: 'third_party',
      expandedType: 'third_party',
      variant: null,
      name: 'Third Party',
      tagline: 'Minimum coverage required by law',
      description: 'Covers legal liabilities towards third parties (other people, vehicles, or property) in case of an accident. Does not cover your own car.',
      idv: 0, odPremium: 0, tpPremium, ncbDiscount: 0,
      deductible: 0, deductibleDescription: '',
      basePrice: tpPremium,
      gst: Math.round(tpPremium * 0.18),
      totalPrice: Math.round(tpPremium * 1.18),
      features: ['Third-party liabilities — Covers damage caused to others and their property'],
      notCovered: ['Own car damage — Does not cover any damage to your car', ...commonNotCovered],
      addOnsAvailable: ['personal_accident', 'passenger_protection', 'paid_driver'],
      badge: 'Legal minimum',
      coversOwnCar: false, coversThirdParty: true, hasZeroDep: false,
    };
  }

  const { odPremium, ncbDiscount } = calculateODPremium(
    vehicleType || 'car', idv, vehicleData.fuelType || 'petrol', ncb, garageTier || 'all'
  );

  if (planType === 'od') {
    const basePrice = odPremium;
    return {
      type: 'od', expandedType: 'od', variant: 'standard',
      name: 'Own Damage (OD)',
      tagline: 'Covers damage to your own car',
      description: 'Covers damage to your own car and assets only. Does not cover third-party liabilities. Depreciation applies on parts replaced during claims.',
      idv, odPremium, tpPremium: 0, ncbDiscount,
      deductible: 0, deductibleDescription: '',
      basePrice, gst: Math.round(basePrice * 0.18), totalPrice: Math.round(basePrice * 1.18),
      features: [
        'Accident damage — Covers your car repairs after an accident',
        'Fire, theft and natural calamities',
        'Rat-bite protection',
        'Free car pick up & drop',
      ],
      notCovered: ['Third-party liabilities — Not covered (use your existing active TP policy)', 'Zero depreciation — Not included; depreciation applies on parts', ...commonNotCovered],
      addOnsAvailable: commonOdAddons,
      coversOwnCar: true, coversThirdParty: false, hasZeroDep: false,
    };
  }

  if (planType === 'od_zd') {
    const zeroDepOD = calculateZeroDepPremium(odPremium, vehicleAge);
    const basePrice = zeroDepOD;
    return {
      type: 'od_zd', expandedType: 'od_zd_standard', variant: 'standard',
      name: 'OD Zero Depreciation — Standard',
      tagline: 'Full claim payout, no out-of-pocket cost',
      description: 'Covers damage to your own car with zero depreciation — full cost of parts covered during claims. No deductible.',
      idv, odPremium: zeroDepOD, tpPremium: 0, ncbDiscount,
      deductible: 0, deductibleDescription: 'No deductible',
      basePrice, gst: Math.round(basePrice * 0.18), totalPrice: Math.round(basePrice * 1.18),
      features: [
        'Zero depreciation — Full cost of parts during a claim',
        'Accident damage — Covers your car repairs',
        'Fire, theft and natural calamities',
        'No deductible — No out-of-pocket cost at claim time',
      ],
      notCovered: ['Third-party liabilities — Not covered (use your existing active TP policy)', ...commonNotCovered],
      addOnsAvailable: commonOdAddons,
      coversOwnCar: true, coversThirdParty: false, hasZeroDep: true,
    };
  }

  if (planType === 'comprehensive') {
    const tier = garageTier || 'all';
    const isNetwork = tier === 'network';
    const basePrice = odPremium + tpPremium;
    return {
      type: 'comprehensive',
      expandedType: isNetwork ? 'comprehensive_network' : 'comprehensive_standard',
      variant: isNetwork ? 'network' : 'standard',
      garageTier: tier,
      name: isNetwork ? 'Comprehensive — Network Garage' : 'Comprehensive — Standard',
      tagline: isNetwork ? 'Lower premium, top network garages' : 'Maximum flexibility, any garage',
      description: isNetwork
        ? 'Covers your car and third-party liabilities. Repairs must be done at ACKO network garages. ₹5,000 deductible if repaired outside the network.'
        : 'Covers your car and third-party liabilities. Repair at any garage of your choice with no deductible.',
      idv, odPremium, tpPremium, ncbDiscount,
      deductible: isNetwork ? NETWORK_GARAGE_DEDUCTIBLE : 0,
      deductibleDescription: isNetwork ? '₹5,000 if repaired outside network' : 'No deductible',
      basePrice, gst: Math.round(basePrice * 0.18), totalPrice: Math.round(basePrice * 1.18),
      features: [
        'Accident damage — Covers your car repairs',
        'Fire, theft and natural calamities',
        'Rat-bite protection',
        'Third-party liabilities — Covers damage to others',
        'Free car pick up & drop',
        isNetwork ? 'Cashless claims at 5,400+ ACKO network garages' : 'Cashless claims at any garage',
        'Real-time repair updates',
      ],
      notCovered: ['Zero depreciation — Not included; depreciation applies on parts replaced', ...commonNotCovered],
      addOnsAvailable: commonOdAddons,
      recommended: !isNetwork,
      badge: isNetwork ? 'Lower premium' : 'Recommended',
      coversOwnCar: true, coversThirdParty: true, hasZeroDep: false,
    };
  }

  // zero_dep → ZD Comprehensive (Safe Driver or Standard)
  const zeroDepOD = calculateZeroDepPremium(odPremium, vehicleAge);
  const basePrice = zeroDepOD + tpPremium;
  return {
    type: 'zero_dep',
    expandedType: 'zd_comprehensive_standard',
    variant: 'standard',
    name: 'ZD Comprehensive — Standard',
    tagline: 'Zero depreciation + full flexibility',
    description: 'Covers your car and third-party liabilities with zero depreciation on parts. No deductible.',
    idv, odPremium: zeroDepOD, tpPremium, ncbDiscount,
    deductible: 0, deductibleDescription: 'No deductible',
    basePrice, gst: Math.round(basePrice * 0.18), totalPrice: Math.round(basePrice * 1.18),
    features: [
      'Zero depreciation — Full cost of car parts during a claim',
      'Accident damage — Covers your car repairs',
      'Fire, theft and natural calamities',
      'Third-party liabilities — Covers damage to others',
      'Free car pick up & drop',
      'Cashless claims at any garage',
      'Real-time repair updates',
    ],
    notCovered: commonNotCovered,
    addOnsAvailable: commonOdAddons,
    recommended: true,
    badge: 'Best value',
    coversOwnCar: true, coversThirdParty: true, hasZeroDep: true,
  };
}

/* ── Expanded Plan Generator ──
   Generates plan details for the full expanded type system */

export function getExpandedPlanDetails(
  state: MotorJourneyState,
  expandedType: ExpandedPlanType,
  idvOverride?: number
): MotorPlanDetails {
  const { vehicleType, vehicleData, previousPolicy } = state;
  const makePrice = 800000;
  const engineCC = vehicleType === 'bike' ? 150 : 1200;
  const vehicleAge = vehicleData.registrationYear ? new Date().getFullYear() - vehicleData.registrationYear : 3;
  const idvData = calculateIDV(makePrice, vehicleAge);
  const idv = idvOverride !== undefined ? idvOverride : idvData.recommended;
  const ncb = previousPolicy.ncbPercentage || 0;
  const tpPremium = calculateTPPremium(vehicleType || 'car', engineCC);
  const { odPremium, ncbDiscount } = calculateODPremium(
    vehicleType || 'car', idv, vehicleData.fuelType || 'petrol', ncb, 'all'
  );
  const { odPremium: odPremiumNetwork } = calculateODPremium(
    vehicleType || 'car', idv, vehicleData.fuelType || 'petrol', ncb, 'network'
  );
  const zeroDepOD = calculateZeroDepPremium(odPremium, vehicleAge);
  const safeDriverZdOD = Math.round(zeroDepOD * 0.88);

  const commonNotCovered = [
    'Damage due to regular wear and tear',
    'Commercial use of the car',
    'Pre-existing damage',
    'Illegal driving',
  ];
  const allAddons = [
    'engine_protection', 'extra_car_protection', 'consumables_cover',
    'ncb_protect', 'return_to_invoice',
    'personal_accident', 'passenger_protection', 'paid_driver',
    'electrical_accessory', 'non_electrical_accessory',
  ];

  const base = { idv, ncbDiscount };

  switch (expandedType) {
    case 'od': {
      const bp = odPremium;
      return { ...base, type: 'od', expandedType: 'od', variant: 'standard', name: 'Own Damage', tagline: 'Covers your own car damage', description: 'Covers damage to your own car. Depreciation applies on parts.', odPremium, tpPremium: 0, deductible: 0, deductibleDescription: '', basePrice: bp, gst: Math.round(bp * 0.18), totalPrice: Math.round(bp * 1.18), features: ['Accident damage', 'Fire, theft, natural calamities'], notCovered: ['Third-party liabilities', 'Zero depreciation', ...commonNotCovered], addOnsAvailable: allAddons, coversOwnCar: true, coversThirdParty: false, hasZeroDep: false };
    }
    case 'od_zd_safe': {
      const bp = safeDriverZdOD;
      return { ...base, type: 'od_zd', expandedType: 'od_zd_safe', variant: 'safe_driver', name: 'OD Zero Dep — Safe Driver', tagline: 'Lower premium, ₹5,000 deductible per claim', description: 'OD with zero depreciation. ₹5,000 deductible payable during any claim.', odPremium: safeDriverZdOD, tpPremium: 0, deductible: SAFE_DRIVER_DEDUCTIBLE, deductibleDescription: '₹5,000 payable during any claim', basePrice: bp, gst: Math.round(bp * 0.18), totalPrice: Math.round(bp * 1.18), features: ['Zero depreciation on parts', 'Accident damage', 'Lower premium for safe drivers'], notCovered: ['Third-party liabilities', ...commonNotCovered], addOnsAvailable: allAddons, recommended: true, badge: 'Recommended', coversOwnCar: true, coversThirdParty: false, hasZeroDep: true };
    }
    case 'od_zd_standard': {
      const bp = zeroDepOD;
      return { ...base, type: 'od_zd', expandedType: 'od_zd_standard', variant: 'standard', name: 'OD Zero Dep — Standard', tagline: 'No deductible, full claim payout', description: 'OD with zero depreciation. No deductible — full claim payout.', odPremium: zeroDepOD, tpPremium: 0, deductible: 0, deductibleDescription: 'No deductible', basePrice: bp, gst: Math.round(bp * 0.18), totalPrice: Math.round(bp * 1.18), features: ['Zero depreciation on parts', 'Accident damage', 'No out-of-pocket cost'], notCovered: ['Third-party liabilities', ...commonNotCovered], addOnsAvailable: allAddons, coversOwnCar: true, coversThirdParty: false, hasZeroDep: true };
    }
    case 'comprehensive_network': {
      const bp = odPremiumNetwork + tpPremium;
      return { ...base, type: 'comprehensive', expandedType: 'comprehensive_network', variant: 'network', garageTier: 'network', name: 'Comprehensive — Network Garage', tagline: 'Lower premium, top network garages', description: 'Full coverage. Repairs at ACKO network garages. ₹5,000 deductible if repaired outside.', odPremium: odPremiumNetwork, tpPremium, deductible: NETWORK_GARAGE_DEDUCTIBLE, deductibleDescription: '₹5,000 if repaired outside network', basePrice: bp, gst: Math.round(bp * 0.18), totalPrice: Math.round(bp * 1.18), features: ['Own car damage + third-party', 'Cashless at 5,400+ network garages', 'Lower premium'], notCovered: ['Zero depreciation not included', ...commonNotCovered], addOnsAvailable: allAddons, recommended: true, badge: 'Popular', coversOwnCar: true, coversThirdParty: true, hasZeroDep: false };
    }
    case 'comprehensive_standard': {
      const bp = odPremium + tpPremium;
      return { ...base, type: 'comprehensive', expandedType: 'comprehensive_standard', variant: 'standard', garageTier: 'all', name: 'Comprehensive — Standard', tagline: 'Any garage, no deductible', description: 'Full coverage. Repair at any garage of your choice with no deductible.', odPremium, tpPremium, deductible: 0, deductibleDescription: 'No deductible', basePrice: bp, gst: Math.round(bp * 0.18), totalPrice: Math.round(bp * 1.18), features: ['Own car damage + third-party', 'Any garage of your choice', 'No deductible'], notCovered: ['Zero depreciation not included', ...commonNotCovered], addOnsAvailable: allAddons, coversOwnCar: true, coversThirdParty: true, hasZeroDep: false };
    }
    case 'zd_comprehensive_safe': {
      const safeBp = safeDriverZdOD + tpPremium;
      return { ...base, type: 'zero_dep', expandedType: 'zd_comprehensive_safe', variant: 'safe_driver', name: 'ZD Comprehensive — Safe Driver', tagline: 'Zero dep + lower premium, ₹5,000 deductible', description: 'Full coverage with zero depreciation. ₹5,000 deductible per claim.', odPremium: safeDriverZdOD, tpPremium, deductible: SAFE_DRIVER_DEDUCTIBLE, deductibleDescription: '₹5,000 payable during any claim', basePrice: safeBp, gst: Math.round(safeBp * 0.18), totalPrice: Math.round(safeBp * 1.18), features: ['Zero depreciation on parts', 'Own car + third-party', 'Lower premium for safe drivers'], notCovered: commonNotCovered, addOnsAvailable: allAddons, recommended: true, badge: 'Recommended', coversOwnCar: true, coversThirdParty: true, hasZeroDep: true };
    }
    case 'zd_comprehensive_standard': {
      const bp = zeroDepOD + tpPremium;
      return { ...base, type: 'zero_dep', expandedType: 'zd_comprehensive_standard', variant: 'standard', name: 'ZD Comprehensive — Standard', tagline: 'Zero dep, no deductible, full protection', description: 'Full coverage with zero depreciation. No deductible.', odPremium: zeroDepOD, tpPremium, deductible: 0, deductibleDescription: 'No deductible', basePrice: bp, gst: Math.round(bp * 0.18), totalPrice: Math.round(bp * 1.18), features: ['Zero depreciation on parts', 'Own car + third-party', 'No out-of-pocket cost'], notCovered: commonNotCovered, addOnsAvailable: allAddons, badge: 'Best value', coversOwnCar: true, coversThirdParty: true, hasZeroDep: true };
    }
    case 'third_party': {
      return { ...base, type: 'third_party', expandedType: 'third_party', variant: null, name: 'Third Party', tagline: 'Legal minimum coverage', description: 'Covers legal liabilities towards third parties only.', odPremium: 0, tpPremium, deductible: 0, deductibleDescription: '', basePrice: tpPremium, gst: Math.round(tpPremium * 0.18), totalPrice: Math.round(tpPremium * 1.18), features: ['Third-party liabilities'], notCovered: ['Own car damage', ...commonNotCovered], addOnsAvailable: ['personal_accident', 'passenger_protection', 'paid_driver'], badge: 'Legal minimum', coversOwnCar: false, coversThirdParty: true, hasZeroDep: false };
    }
  }
}

/* ── Get all plans for a combination ── */

export function getPlansForCombination(
  state: MotorJourneyState,
  combination: PlanCombination
): MotorPlanDetails[] {
  const planMap: Record<PlanCombination, ExpandedPlanType[]> = {
    'OD-1': ['od'],
    'OD-2': ['od', 'od_zd_safe'],
    'OD-3': ['od', 'od_zd_safe', 'od_zd_standard'],
    'A': ['third_party'],
    'B': ['comprehensive_standard'],
    'C': ['third_party', 'comprehensive_standard'],
    'D': ['third_party', 'comprehensive_standard', 'comprehensive_network'],
    'E': ['third_party', 'comprehensive_standard', 'comprehensive_network', 'zd_comprehensive_safe'],
    'F': ['third_party', 'comprehensive_standard', 'comprehensive_network', 'zd_comprehensive_safe', 'zd_comprehensive_standard'],
  };
  return (planMap[combination] || []).map(t => getExpandedPlanDetails(state, t));
}

/* ── Recommendation logic per skill file ── */

export function getRecommendedPlanType(state: MotorJourneyState, combination: PlanCombination): {
  step1Rec: 'comprehensive' | 'third_party';
  step2Rec: 'zd' | 'standard';
  variantRec: string;
} {
  const vehicleAge = state.vehicleData.registrationYear
    ? new Date().getFullYear() - state.vehicleData.registrationYear
    : 3;
  const prevPolicyType = state.previousPolicy.policyType;
  const prevHadZd = false; // not tracked yet, default

  const step1Rec = prevPolicyType === 'third_party' ? 'third_party' as const : 'comprehensive' as const;

  let step2Rec: 'zd' | 'standard';
  if (vehicleAge <= 3) {
    step2Rec = 'zd';
  } else if (prevHadZd) {
    step2Rec = 'zd';
  } else {
    step2Rec = 'standard';
  }

  const variantRec = combination.startsWith('OD')
    ? 'safe_driver'
    : step2Rec === 'zd' ? 'safe_driver' : 'network';

  return { step1Rec, step2Rec, variantRec };
}

/* ── Add-on recommendation logic per skill file ── */

export function getRecommendedAddOns(state: MotorJourneyState): string[] {
  const vehicleAge = state.vehicleData.registrationYear
    ? new Date().getFullYear() - state.vehicleData.registrationYear
    : 3;
  const ncb = state.previousPolicy.ncbPercentage || 0;

  const recommended: string[] = [];

  // Base by vehicle age
  if (vehicleAge < 8) {
    recommended.push('engine_protection', 'extra_car_protection', 'personal_accident', 'passenger_protection');
  } else {
    recommended.push('extra_car_protection', 'personal_accident', 'passenger_protection');
  }

  if (vehicleAge <= 3) recommended.push('return_to_invoice');
  if (ncb > 0) recommended.push('ncb_protect');
  if (state.hasPaidDriver) recommended.push('paid_driver');
  if (state.hasAftermarketAccessories) {
    recommended.push('electrical_accessory', 'non_electrical_accessory');
  }

  return recommended;
}

/* ── Add-ons ── */

/* ═══════════════════════════════════════════════
   BIKE-SPECIFIC PLAN ROUTING LOGIC
   Based on bike planning logic documentation
   ═══════════════════════════════════════════════ */

export function getBikePlanEligibility(state: MotorJourneyState): {
  canOfferOD: boolean;
  planTypes: ('comprehensive' | 'third_party' | 'od')[];
  isNewBike: boolean;
} {
  const vehicleAge = state.vehicleData.registrationYear 
    ? new Date().getFullYear() - state.vehicleData.registrationYear 
    : 0;
  
  const isNewBike = state.vehicleEntryType === 'brand_new';
  const hasActiveTpPolicy = state.hasActiveTpPolicy;

  if (isNewBike) {
    // Journey 2: New bike buyers get fixed tenure plans
    return {
      canOfferOD: false,
      planTypes: ['comprehensive', 'third_party'], // Special 5-year TP structure
      isNewBike: true,
    };
  }

  // Journey 1: Existing bike owners
  if (vehicleAge < 5 && hasActiveTpPolicy) {
    // Can offer OD-only since TP is already covered
    return {
      canOfferOD: true,
      planTypes: ['comprehensive', 'od'],
      isNewBike: false,
    };
  }

  // Standard case: offer comprehensive and third party
  return {
    canOfferOD: false,
    planTypes: ['comprehensive', 'third_party'],
    isNewBike: false,
  };
}

export function getBikeAddOns(
  state: MotorJourneyState
): MotorAddOn[] {
  const isNewBike = state.vehicleEntryType === 'brand_new';
  
  // Category 1: Add-ons that protect your family
  const familyAddOns: MotorAddOn[] = [
    {
      id: 'personal_accident_bike',
      name: 'Personal Accident Cover',
      description: 'Pays up to ₹15 lakh if the bike owner is permanently disabled or dies in an accident.',
      price: 399,
      category: 'protect_everyone',
      popular: true,
    },
    {
      id: 'pillion_rider',
      name: 'Pillion Rider Cover',
      description: 'Pays up to ₹2 lakh if your co-passenger is permanently disabled or dies in an accident.',
      price: 199,
      category: 'protect_everyone',
    },
    {
      id: 'helmet_protect',
      name: 'Helmet Protect',
      description: 'Get up to ₹1,000 for helmet damage or theft, if your bike is also involved in the same incident.',
      price: 99,
      category: 'protect_everyone',
    },
  ];

  // Category 2: Add-ons that protect your bike
  const bikeAddOns: MotorAddOn[] = [
    {
      id: 'engine_protect_bike',
      name: 'Engine Protect',
      description: 'Covers damage to your bike\'s engine due to water ingression, oil leakage, or hydrostatic lock — damage not covered under a standard policy.',
      price: 299,
      category: 'out_of_pocket',
      popular: true,
    },
    {
      id: 'consumables_cover_bike',
      name: 'Consumables Cover',
      description: 'Covers the cost of consumables like nuts, bolts, brake oil, engine oil etc. that get replaced during repairs.',
      price: 199,
      category: 'out_of_pocket',
    },
    {
      id: 'zero_depreciation_bike',
      name: 'Zero Depreciation',
      description: 'Pays the full cost of parts replaced during a claim with no depreciation deducted — minimises your out-of-pocket expenses.',
      price: 499,
      category: 'out_of_pocket',
      recommended: true,
    },
  ];

  // Add Return to Invoice for new bikes only
  if (isNewBike) {
    bikeAddOns.push({
      id: 'return_to_invoice_bike',
      name: 'Return to Invoice',
      description: 'Receive the complete invoice value (including registration charges and road tax) or the current on-road price, whichever is lower, if your bike is stolen or damaged beyond repair.',
      price: 599,
      category: 'out_of_pocket',
      recommended: true,
      popular: true,
    });
  }

  return [...familyAddOns, ...bikeAddOns];
}

export function getMotorAddOns(
  vehicleType: 'car' | 'bike' = 'car',
  state?: MotorJourneyState
): MotorAddOn[] {
  // Use bike-specific add-ons for bikes
  if (vehicleType === 'bike' && state) {
    return getBikeAddOns(state);
  }
  
  const ncb = state?.previousPolicy?.ncbPercentage || 0;
  const hasPaidDriver = state?.hasPaidDriver ?? false;
  const hasAccessories = state?.hasAftermarketAccessories ?? false;
  const recommended = state ? getRecommendedAddOns(state) : [];

  const addons: MotorAddOn[] = [
    // Category 1: Add-ons that cover your family
    {
      id: 'personal_accident',
      name: 'Personal Accident Cover',
      description: 'Covers the policyholder against accidental death or permanent disability arising from a car accident.',
      price: 399,
      category: 'protect_everyone',
      mandatory: true,
      recommended: recommended.includes('personal_accident'),
      hasVariants: true,
      variants: [
        { id: '15_lakh', name: '₹15 lakh coverage', price: 399, recommended: true, badge: 'Premium offer', features: ['Full coverage for death or permanent disability', '50% for partial disability'] },
        { id: '50_lakh', name: '₹50 lakh coverage', price: 999, features: ['Full coverage for death or permanent disability', '50% for partial disability', '4 of 5 users prefer this'] },
      ],
    },
    {
      id: 'passenger_protection',
      name: 'Passenger Protect Cover',
      description: 'Extends accident cover to passengers travelling in the car at the time of an accident. Up to ₹1 lakh per passenger.',
      price: 399,
      category: 'protect_everyone',
      recommended: recommended.includes('passenger_protection'),
    },
    // Category 2: Add-ons that cover your car
    {
      id: 'engine_protection',
      name: 'Engine Protect',
      description: 'Covers damage to the car\'s engine and parts due to water ingression, oil leakage, or hydrostatic lock — not covered under a standard policy.',
      price: 399,
      category: 'out_of_pocket',
      recommended: recommended.includes('engine_protection'),
    },
    {
      id: 'return_to_invoice',
      name: 'Return to Invoice (RTI)',
      description: 'In total loss or theft, the insurer pays the original invoice value instead of the depreciated IDV. Bridges the gap between IDV and purchase price.',
      price: 499,
      category: 'out_of_pocket',
      recommended: recommended.includes('return_to_invoice'),
    },
    {
      id: 'extra_car_protection',
      name: 'Extra Car Protect',
      description: 'Bundled add-on: Roadside Assistance + Key Loss Cover + Out-of-Station Accommodation Cover.',
      price: 399,
      category: 'out_of_pocket',
      recommended: recommended.includes('extra_car_protection'),
      hasVariants: true,
      variants: [
        { id: 'lite', name: 'LITE', price: 399, features: ['24x7 roadside assistance up to 40km', 'Key replacement up to ₹7,000', 'Accommodation up to ₹6,500'] },
        { id: 'plus', name: 'PLUS', price: 799, recommended: true, features: ['Unlimited breakdown assistance', 'Key replacement up to ₹25,000', 'Accommodation up to ₹15,000'] },
      ],
    },
    {
      id: 'consumables_cover',
      name: 'Consumables Cover',
      description: 'Covers consumables like nuts, bolts, brake oil, engine oil etc. replaced during repair.',
      price: 399,
      category: 'out_of_pocket',
    },
  ];

  // NCB Protection: only shown if NCB > 0
  if (ncb > 0) {
    addons.push({
      id: 'ncb_protect',
      name: 'NCB Protection',
      description: 'Protects your accumulated NCB even if you make one claim this year.',
      price: 399,
      category: 'out_of_pocket',
      recommended: recommended.includes('ncb_protect'),
    });
  }

  // Paid Driver Cover: only shown if user has a paid driver
  if (hasPaidDriver) {
    addons.push({
      id: 'paid_driver',
      name: 'Paid Driver Cover',
      description: 'Covers a paid/hired driver against accidental death or disability while driving the insured vehicle.',
      price: 399,
      category: 'protect_everyone',
      recommended: recommended.includes('paid_driver'),
    });
  }

  // Accessory covers: only shown if user has accessories
  if (hasAccessories) {
    addons.push(
      {
        id: 'electrical_accessory',
        name: 'Electrical Accessory Cover',
        description: 'Covers electrical accessories fitted after sale (e.g., upgraded audio system, rear camera).',
        price: 299,
        category: 'out_of_pocket',
        recommended: recommended.includes('electrical_accessory'),
      },
      {
        id: 'non_electrical_accessory',
        name: 'Non-Electrical Accessory Cover',
        description: 'Covers non-electrical accessories fitted after sale (e.g., seat covers, alloy wheels, roof rails).',
        price: 299,
        category: 'out_of_pocket',
        recommended: recommended.includes('non_electrical_accessory'),
      },
    );
  }

  return addons;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatIDV(amount: number): string {
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)} Lakh`;
  return `${(amount / 1000).toFixed(0)}K`;
}
