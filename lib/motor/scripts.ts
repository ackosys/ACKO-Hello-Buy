import { MotorConversationStep, MotorJourneyState, FetchedDataFlags } from './types';
import { getT, getCurrentLang } from '../translations';
import { useUserProfileStore } from '../userProfileStore';
import { determinePlanCombination, getRecommendedPlanType } from './plans';

/* ═══════════════════════════════════════════════════════════════════
   ACKO Motor Insurance — Conversational Scripts
   ─────────────────────────────────────────────────────────────────
   PRINCIPLES (aligned with Health LOB):
   1. Every question explains WHY we are asking — build trust
   2. Conversational acknowledgments between key steps
   3. No emojis in bot messages — only in option labels
   4. Short, single-purpose messages (one thought per message)
   5. Personalized responses using accumulated user context
   ═══════════════════════════════════════════════════════════════════ */

function vLabel(state: MotorJourneyState): string {
  return state.vehicleType === 'bike' ? 'bike' : 'car';
}

function vLabelCap(state: MotorJourneyState): string {
  return state.vehicleType === 'bike' ? 'Bike' : 'Car';
}

/* ═══════════════════════════════════════════════
   MODULE: VEHICLE TYPE — Car or Bike?
   ═══════════════════════════════════════════════ */

const vehicleTypeSelect: MotorConversationStep = {
  id: 'vehicle_type.select',
  module: 'vehicle_type',
  widgetType: 'selection_cards',
  getScript: () => {
    const t = getT(getCurrentLang()).motorScripts;
    return {
      botMessages: [t.welcomeHi, t.welcomeQuestion],
      options: [
        { id: 'car', label: t.optionCar, description: t.optionCarDesc, icon: 'car' },
        { id: 'bike', label: t.optionBike, description: t.optionBikeDesc, icon: 'scooter' },
      ],
    };
  },
  processResponse: (response) => ({
    vehicleType: response as 'car' | 'bike',
  }),
  getNextStep: () => 'registration.has_number',
};

/* ═══════════════════════════════════════════════
   MODULE: REGISTRATION — Do you have reg number?
   ═══════════════════════════════════════════════ */

const registrationHasNumber: MotorConversationStep = {
  id: 'registration.has_number',
  module: 'registration',
  widgetType: 'selection_cards',
  getScript: (state) => {
    const t = getT(state.language).motorScripts;
    const v = vLabel(state);
    const greeting = t.welcomeHi;
    return {
      botMessages: [greeting, t.renewOrNew(v)],
      options: [
        { id: 'yes', label: t.renewOption, description: t.renewOptionDesc(v), icon: 'renew' },
        { id: 'no', label: t.newOption(v), description: t.newOptionDesc(v), icon: state.vehicleType === 'bike' ? 'new_bike' : 'new_car' },
      ],
    };
  },
  processResponse: (response) => ({
    vehicleEntryType: response === 'yes' ? 'existing' : 'brand_new',
  }),
  getNextStep: (response, state) => {
    if (response === 'yes') return 'registration.enter_number';
    // For new bikes, route to enhanced Journey 2 flow
    if (state.vehicleType === 'bike') return 'new_bike.welcome';
    return 'manual_entry.congratulations';
  },
};

/* ── Enter Registration Number ── */

const registrationEnterNumber: MotorConversationStep = {
  id: 'registration.enter_number',
  module: 'registration',
  widgetType: 'vehicle_reg_input',
  getScript: (state) => {
    const t = getT(state.language).motorScripts;
    return {
      botMessages: [t.enterReg(vLabel(state))],
      subText: t.enterRegSub,
      placeholder: t.regPlaceholder,
      inputType: 'text',
    };
  },
  processResponse: (response) => ({
    registrationNumber: (response as string).toUpperCase().replace(/\s+/g, ''),
  }),
  getNextStep: () => 'vehicle_fetch.loading',
};

/* ═══════════════════════════════════════════════
   MODULE: VEHICLE FETCH — Progressive Loading
   ═══════════════════════════════════════════════ */

const vehicleFetchLoading: MotorConversationStep = {
  id: 'vehicle_fetch.loading',
  module: 'vehicle_fetch',
  widgetType: 'progressive_loader',
  getScript: (state) => ({
    botMessages: [getT(state.language).motorScripts.fetchingReg(state.registrationNumber)],
  }),
  processResponse: (response) => {
    if (response === 'success') {
      /* All-or-Nothing Framework:
         - Car details: all 6 fields or none
         - Policy expiry + type: both or neither
         - NCB: only if policy details present
         - Last claim: only if policy details present */
      const carDetailsFetched = true;
      const policyDetailsFetched = true;
      const ncbFetched = policyDetailsFetched ? true : false;
      const lastClaimFetched = policyDetailsFetched ? false : false;

      return {
        autoFetchSuccess: true,
        vehicleDataSource: 'auto_fetched' as const,
        fetchedDataFlags: {
          carDetailsFetched,
          policyDetailsFetched,
          ncbFetched,
          lastClaimFetched,
        },
        prelimCheckResult: 'clear' as const,
        vehicleData: carDetailsFetched ? {
          make: 'Maruti',
          model: 'Swift Dzire',
          variant: 'LXI',
          fuelType: 'petrol' as const,
          registrationYear: 2022,
          registrationMonth: 'March',
          hasCngKit: null,
          isCommercialVehicle: null,
        } : {
          make: '', model: '', variant: '', fuelType: '' as const,
          registrationYear: null, registrationMonth: '',
          hasCngKit: null, isCommercialVehicle: null,
        },
        previousPolicy: policyDetailsFetched ? {
          insurer: 'TATA AIG',
          expiryDate: '28/06/2025',
          policyType: 'comprehensive' as const,
          ncbPercentage: ncbFetched ? 35 as const : 0 as const,
          hadClaims: lastClaimFetched ? false : null,
        } : {
          insurer: '', expiryDate: '',
          policyType: 'not_sure' as const,
          ncbPercentage: 0 as const,
          hadClaims: null,
        },
      };
    }
    return {
      autoFetchSuccess: false,
      vehicleDataSource: 'manual_entry' as const,
      fetchedDataFlags: {
        carDetailsFetched: false,
        policyDetailsFetched: false,
        ncbFetched: false,
        lastClaimFetched: false,
      },
    };
  },
  getNextStep: (response) => {
    if (response === 'success') return 'prelim.check';
    return 'manual_entry.start';
  },
};

/* ═══════════════════════════════════════════════
   MODULE: PRELIMINARY CHECKS — After reg entry, before verify
   Per car-planning-logic skill file
   ═══════════════════════════════════════════════ */

const prelimCheck: MotorConversationStep = {
  id: 'prelim.check',
  module: 'vehicle_fetch',
  widgetType: 'none',
  getScript: () => ({
    botMessages: [`Checking your vehicle records...`],
  }),
  processResponse: () => {
    // Simulate preliminary checks — in production this would call backend
    // For now, always return 'clear' to proceed normally
    return { prelimCheckResult: 'clear' as const };
  },
  getNextStep: (_, state) => {
    const check = state.prelimCheckResult || 'clear';
    switch (check) {
      case 'insured_same_user': return 'prelim.insured_same_user';
      case 'insured_different_user': return 'prelim.insured_different_user';
      case 'two_wheeler_entered': return 'prelim.two_wheeler_entered';
      case 'payment_pending_steps': return 'prelim.payment_pending';
      default: return 'vehicle_fetch.found';
    }
  },
};

const prelimInsuredSameUser: MotorConversationStep = {
  id: 'prelim.insured_same_user',
  module: 'vehicle_fetch',
  widgetType: 'selection_cards',
  getScript: () => ({
    botMessages: [
      `This vehicle is already insured with ACKO.`,
    ],
    options: [
      { id: 'view_policy', label: 'View my running policy', icon: 'shield' },
      { id: 'edit_reg', label: 'Edit registration number', icon: 'edit' },
    ],
  }),
  processResponse: () => ({}),
  getNextStep: (response) => {
    if (response === 'edit_reg') return 'registration.enter_number';
    return 'post_purchase.end';
  },
};

const prelimInsuredDifferentUser: MotorConversationStep = {
  id: 'prelim.insured_different_user',
  module: 'vehicle_fetch',
  widgetType: 'selection_cards',
  getScript: (state) => ({
    botMessages: [
      `This vehicle is already insured with ACKO. The policy belongs to the account associated with phone number ${state.prelimExistingPolicyPhone || 'xxxx5511'}.`,
    ],
    options: [
      { id: 'buying_car', label: 'I am buying this car and want to check insurance', icon: 'car' },
      { id: 'login_other', label: 'Login with the other phone number', icon: 'phone' },
      { id: 'edit_reg', label: 'Edit registration number', icon: 'edit' },
    ],
  }),
  processResponse: () => ({}),
  getNextStep: (response) => {
    if (response === 'buying_car') return 'vehicle_fetch.found';
    if (response === 'edit_reg') return 'registration.enter_number';
    return 'registration.enter_number';
  },
};

const prelimTwoWheelerEntered: MotorConversationStep = {
  id: 'prelim.two_wheeler_entered',
  module: 'vehicle_fetch',
  widgetType: 'selection_cards',
  getScript: () => ({
    botMessages: [
      `The registration number you entered belongs to a two-wheeler.`,
    ],
    options: [
      { id: 'continue_tw', label: 'Continue insuring this two-wheeler', icon: 'scooter' },
      { id: 'edit_reg', label: 'Edit registration number', icon: 'edit' },
    ],
  }),
  processResponse: (response) => {
    if (response === 'continue_tw') return { vehicleType: 'bike' as const };
    return {};
  },
  getNextStep: (response) => {
    if (response === 'continue_tw') return 'vehicle_fetch.found';
    return 'registration.enter_number';
  },
};

const prelimPaymentPending: MotorConversationStep = {
  id: 'prelim.payment_pending',
  module: 'vehicle_fetch',
  widgetType: 'selection_cards',
  getScript: (state) => ({
    botMessages: [
      `You have already completed payment for insurance on this vehicle. Your policy will be generated once you complete the pending steps.`,
      state.prelimPendingStep ? `Pending: ${state.prelimPendingStep}` : `There are pending verification steps.`,
    ],
    options: [
      { id: 'complete_steps', label: 'Complete the required steps', icon: 'check' },
      { id: 'edit_reg', label: 'Edit registration number', icon: 'edit' },
    ],
  }),
  processResponse: () => ({}),
  getNextStep: (response) => {
    if (response === 'edit_reg') return 'registration.enter_number';
    return 'post_purchase.status_intro';
  },
};

/* ═══════════════════════════════════════════════
   MODULE: VEHICLE FETCH — Verify Card
   Shows only fetched fields per all-or-nothing framework
   ═══════════════════════════════════════════════ */

const vehicleFetchFound: MotorConversationStep = {
  id: 'vehicle_fetch.found',
  module: 'vehicle_fetch',
  widgetType: 'vehicle_details_card',
  getScript: (state) => {
    const t = getT(state.language).motorScripts;
    const flags = state.fetchedDataFlags;
    if (!flags?.carDetailsFetched && !flags?.policyDetailsFetched) {
      return {
        botMessages: [
          `We couldn't find details for this vehicle. Let's enter them manually.`,
        ],
      };
    }
    return {
      botMessages: [t.vehicleFound(vLabel(state)), t.vehicleFoundConfirm],
    };
  },
  processResponse: () => ({}),
  getNextStep: (response, state) => {
    if (response === 'retry') return 'registration.enter_number';
    const flags = state.fetchedDataFlags;
    if (!flags?.carDetailsFetched && !flags?.policyDetailsFetched) {
      return 'manual_entry.start';
    }
    return getNextMissingFieldStep(state);
  },
};

/* ── Helper: determine next question based on what's missing ── */

function getNextMissingFieldStep(state: MotorJourneyState): string {
  const flags = state.fetchedDataFlags || { carDetailsFetched: false, policyDetailsFetched: false, ncbFetched: false, lastClaimFetched: false };

  if (!flags.carDetailsFetched) {
    if (!state.vehicleData.make) return 'manual_entry.select_brand';
    if (!state.vehicleData.model) return 'manual_entry.select_model';
    if (!state.vehicleData.fuelType) return 'manual_entry.select_fuel';
    if (!state.vehicleData.variant && state.vehicleType !== 'bike') return 'manual_entry.select_variant';
    if (!state.vehicleData.registrationYear) return 'manual_entry.select_year';
  }

  if (state.vehicleType !== 'bike' && state.vehicleData.isCommercialVehicle === null) {
    return 'pre_quote.commercial_check';
  }

  if (!flags.policyDetailsFetched) {
    if (!state.previousPolicy.policyType || state.previousPolicy.policyType === 'not_sure') {
      return 'pre_quote.policy_type_ask';
    }
    if (!state.previousPolicy.expiryDate) {
      return 'pre_quote.policy_status';
    }
  }

  if (!state.pincode) return 'pre_quote.pincode_ask';

  if (!useUserProfileStore.getState().isLoggedIn && !state.phone) {
    return 'login.phone_gate_prequote';
  }

  if (flags.policyDetailsFetched && !flags.ncbFetched) {
    return 'pre_quote.ncb_selection';
  }

  if (flags.policyDetailsFetched && !flags.lastClaimFetched && state.previousPolicy.hadClaims === null) {
    return 'pre_quote.last_claim_ask';
  }

  if (state.vehicleType !== 'bike' && state.vehicleData.hasCngKit === null) {
    return 'pre_quote.cng_check';
  }

  return 'pre_quote.summary';
}

/* ═══════════════════════════════════════════════
   MODULE: MANUAL ENTRY — When auto-fetch fails
   ═══════════════════════════════════════════════ */

const manualEntryCongratulations: MotorConversationStep = {
  id: 'manual_entry.congratulations',
  module: 'manual_entry',
  widgetType: 'none',
  getScript: (state) => {
    const t = getT(state.language).motorScripts;
    return {
      botMessages: [t.brandNewExcited(vLabel(state)), t.brandNewSaving(vLabel(state))],
    };
  },
  processResponse: () => ({ vehicleEntryType: 'brand_new' as const }),
  getNextStep: () => 'brand_new.popular_cars',
};

const manualEntryStart: MotorConversationStep = {
  id: 'manual_entry.start',
  module: 'manual_entry',
  widgetType: 'none',
  getScript: (state) => {
    const t = getT(state.language).motorScripts;
    return {
      botMessages: [t.fetchFailed(vLabel(state)), t.fetchFailedSub],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'manual_entry.select_brand',
};

const manualEntrySelectBrand: MotorConversationStep = {
  id: 'manual_entry.select_brand',
  module: 'manual_entry',
  widgetType: 'brand_selector',
  getScript: (state) => {
    const t = getT(state.language).motorScripts;
    return {
      botMessages: [t.whichBrand(vLabel(state))],
      subText: t.whichBrandSub(vLabel(state)),
    };
  },
  processResponse: (response, state) => ({
    vehicleEntryType: state.vehicleEntryType,
    vehicleData: {
      make: response,
      model: '',
      variant: '',
      fuelType: '' as const,
      registrationYear: null,
      registrationMonth: '',
      hasCngKit: null,
      isCommercialVehicle: null,
    },
  }),
  getNextStep: () => 'manual_entry.select_model',
};

const manualEntrySelectModel: MotorConversationStep = {
  id: 'manual_entry.select_model',
  module: 'manual_entry',
  widgetType: 'model_selector',
  getScript: (state) => ({
    botMessages: [getT(state.language).motorScripts.whichModel(state.vehicleData.make)],
  }),
  processResponse: (response, state) => ({
    vehicleEntryType: state.vehicleEntryType,
    vehicleData: { ...state.vehicleData, model: response },
  }),
  getNextStep: () => 'manual_entry.select_fuel',
};

const manualEntrySelectFuel: MotorConversationStep = {
  id: 'manual_entry.select_fuel',
  module: 'manual_entry',
  widgetType: 'selection_cards',
  getScript: (state) => {
    const t = getT(state.language).motorScripts;
    const isBike = state.vehicleType === 'bike';
    const fuelOptions = isBike
      ? [
          { id: 'petrol', label: 'Petrol', icon: 'petrol' },
          { id: 'electric', label: 'Electric', icon: 'electric' },
        ]
      : [
          { id: 'petrol', label: 'Petrol', icon: 'petrol' },
          { id: 'diesel', label: 'Diesel', icon: 'diesel' },
          { id: 'electric', label: 'Electric', icon: 'electric' },
          { id: 'cng', label: 'CNG', icon: 'cng' },
        ];
    return {
      botMessages: [t.whichFuel(state.vehicleData.model)],
      subText: t.whichFuelSub,
      options: fuelOptions,
    };
  },
  processResponse: (response, state) => ({
    vehicleEntryType: state.vehicleEntryType,
    vehicleData: { ...state.vehicleData, fuelType: response },
  }),
  getNextStep: (_, state) => {
    const isBrandNew = state.vehicleEntryType === 'brand_new';
    if (state.vehicleType === 'bike') {
      return isBrandNew ? 'brand_new.pincode' : 'manual_entry.select_year';
    }
    return 'manual_entry.select_variant';
  },
};

const manualEntrySelectVariant: MotorConversationStep = {
  id: 'manual_entry.select_variant',
  module: 'manual_entry',
  condition: (state) => state.vehicleType !== 'bike',
  widgetType: 'variant_selector',
  getScript: (state) => {
    const t = getT(state.language).motorScripts;
    return {
      botMessages: [
        state.vehicleEntryType === 'brand_new'
          ? t.whichVariantNew(state.vehicleData.model)
          : t.whichVariantExisting(state.vehicleData.model),
      ],
    };
  },
  processResponse: (response, state) => ({
    vehicleEntryType: state.vehicleEntryType,
    vehicleData: {
      ...state.vehicleData,
      variant: response,
      ...(state.vehicleEntryType === 'brand_new' ? { registrationYear: new Date().getFullYear() } : {}),
    },
  }),
  getNextStep: (_, state) => {
    if (state.vehicleEntryType === 'brand_new') return 'brand_new.pincode';
    return 'manual_entry.select_year';
  },
};

const manualEntrySelectYear: MotorConversationStep = {
  id: 'manual_entry.select_year',
  module: 'manual_entry',
  condition: (state) => state.vehicleEntryType !== 'brand_new',
  widgetType: 'year_selector',
  getScript: (state) => {
    const t = getT(state.language).motorScripts;
    return {
      botMessages: [
        state.vehicleEntryType === 'brand_new'
          ? t.whichYearNew(vLabel(state))
          : t.whichYearExisting(vLabel(state)),
      ],
    };
  },
  processResponse: (response, state) => ({
    vehicleData: {
      ...state.vehicleData,
      registrationYear: parseInt(response),
    },
  }),
  getNextStep: (_, state) => {
    if (state.vehicleEntryType === 'brand_new') {
      return 'brand_new.pincode';
    }
    return getNextMissingFieldStep(state);
  },
};

/* ═══════════════════════════════════════════════
   MODULE: BRAND NEW VEHICLE — Purchase flow
   (matches ACKO new vehicle buy journey design)
   ═══════════════════════════════════════════════ */

const POPULAR_CARS = [
  { id: 'tata_nexon', label: 'TATA Nexon', logoUrl: '/logos/TATA.svg' },
  { id: 'tata_punch', label: 'TATA Punch', logoUrl: '/logos/TATA.svg' },
  { id: 'mahindra_xuv700', label: 'Mahindra XUV 700', logoUrl: '/logos/Mahindra.svg' },
  { id: 'honda_city', label: 'Honda City', logoUrl: '/logos/Honda.svg' },
  { id: 'kia_carens', label: 'Kia Carens', logoUrl: '/logos/Kia.svg' },
  { id: 'hyundai_creta', label: 'Hyundai Creta', logoUrl: '/logos/Hyundai.svg' },
  { id: 'kia_seltos', label: 'Kia Seltos', logoUrl: '/logos/Kia.svg' },
  { id: 'tata_tiago', label: 'Tata Tiago', logoUrl: '/logos/TATA.svg' },
  { id: 'maruti_swift', label: 'Maruti Swift', logoUrl: '/logos/Suzuki.svg' },
];

const POPULAR_BIKES = [
  { id: 'hero_splendor', label: 'Hero Splendor Plus', description: '100cc Commuter', logoUrl: '/logos/Hero.svg' },
  { id: 'honda_activa', label: 'Honda Activa 6G', description: '110cc Scooter', logoUrl: '/logos/Honda.svg' },
  { id: 'honda_shine', label: 'Honda Shine', description: '125cc Commuter', logoUrl: '/logos/Honda.svg' },
  { id: 'tvs_jupiter', label: 'TVS Jupiter', description: '110cc Scooter', logoUrl: '/logos/TVS.svg' },
  { id: 'bajaj_pulsar', label: 'Bajaj Pulsar 150', description: '150cc Sports', logoUrl: '/logos/Bajaj.svg' },
  { id: 'royal_enfield_classic', label: 'Royal Enfield Classic 350', description: '350cc Cruiser', logoUrl: '/logos/Royal Enfield.svg' },
  { id: 'tvs_apache', label: 'TVS Apache RTR 160', description: '160cc Sports', logoUrl: '/logos/TVS.svg' },
  { id: 'hero_hf_deluxe', label: 'Hero HF Deluxe', description: '100cc Commuter', logoUrl: '/logos/Hero.svg' },
  { id: 'suzuki_access', label: 'Suzuki Access 125', description: '125cc Scooter', logoUrl: '/logos/Suzuki.svg' },
];

/* ═══════════════════════════════════════════════
   NEW BIKE BUYER JOURNEY — Enhanced for bike planning logic
   ═══════════════════════════════════════════════ */

/* Journey 2: New Bike Welcome */
const newBikeWelcome: MotorConversationStep = {
  id: 'new_bike.welcome',
  module: 'manual_entry',
  condition: (state) => state.vehicleType === 'bike' && state.vehicleEntryType === 'brand_new',
  widgetType: 'selection_cards',
  getScript: (state) => {
    const t = getT(state.language).motorScripts;
    return {
      botMessages: [
        `Exciting! A brand new bike! 🏍️`,
        `We can save you up to 75% on bike insurance with our comprehensive coverage.`
      ],
      options: [
        { id: 'continue', label: 'Let\'s get started', icon: 'arrow_right' },
      ],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'new_bike.select_make',
};

/* Journey 2: Select Bike Make */
const newBikeSelectMake: MotorConversationStep = {
  id: 'new_bike.select_make',
  module: 'manual_entry',
  condition: (state) => state.vehicleType === 'bike' && state.vehicleEntryType === 'brand_new',
  widgetType: 'brand_selector',
  getScript: (state) => {
    const t = getT(state.language).motorScripts;
    return {
      botMessages: [`Which make is your bike?`],
      subText: 'Select your bike manufacturer',
    };
  },
  processResponse: (response) => ({
    vehicleData: { make: response as string, model: '', variant: '', fuelType: '', registrationYear: new Date().getFullYear(), registrationMonth: '', hasCngKit: null, isCommercialVehicle: null },
  }),
  getNextStep: () => 'new_bike.select_model',
};

/* Journey 2: Select Bike Model */
const newBikeSelectModel: MotorConversationStep = {
  id: 'new_bike.select_model',
  module: 'manual_entry',
  condition: (state) => state.vehicleType === 'bike' && state.vehicleEntryType === 'brand_new',
  widgetType: 'model_selector',
  getScript: (state) => {
    const t = getT(state.language).motorScripts;
    return {
      botMessages: [`Which model?`],
      subText: `Select your ${state.vehicleData.make} model`,
    };
  },
  processResponse: (response, state) => ({
    vehicleData: { ...state.vehicleData, model: response as string },
  }),
  getNextStep: (_, state) => {
    // Check if user is logged in to determine if we need phone number
    const userProfile = useUserProfileStore.getState();
    return userProfile.phone ? 'quote.calculating' : 'new_bike.phone_number';
  },
};

/* Journey 2: Phone Number (if not logged in) */
const newBikePhoneNumber: MotorConversationStep = {
  id: 'new_bike.phone_number',
  module: 'manual_entry',
  condition: (state) => state.vehicleType === 'bike' && state.vehicleEntryType === 'brand_new',
  widgetType: 'text_input',
  getScript: (state) => {
    return {
      botMessages: [`Your phone number?`],
      subText: 'For quote calculation and policy linking',
      placeholder: '+91 98765 43210',
      inputType: 'tel',
    };
  },
  processResponse: (response) => ({
    ownerMobile: response as string,
  }),
  getNextStep: () => 'quote.calculating',
};

/* Step 1: Popular vehicle suggestions (car or bike) */
const brandNewPopularCars: MotorConversationStep = {
  id: 'brand_new.popular_cars',
  module: 'manual_entry',
  widgetType: 'selection_cards',
  getScript: (state) => {
    const t = getT(state.language).motorScripts;
    const isBike = state.vehicleType === 'bike';
    const popularList = isBike ? POPULAR_BIKES : POPULAR_CARS;
    return {
      botMessages: [t.letsStart, t.whichVehicleBuy(vLabel(state))],
      subText: t.popularSubText,
      options: [
        ...popularList.map(c => ({ ...c, icon: isBike ? 'bike' : 'car', logoUrl: (c as any).logoUrl })),
        { id: 'other', label: t.otherOption, icon: 'search' },
      ],
    };
  },
  processResponse: (response, state) => {
    if (response === 'other') return { vehicleEntryType: 'brand_new' as const };
    const isBike = state.vehicleType === 'bike';
    const popularList = isBike ? POPULAR_BIKES : POPULAR_CARS;
    const vehicle = popularList.find(c => c.id === response);
    if (!vehicle) return { vehicleEntryType: 'brand_new' as const };
    const [make, ...modelParts] = vehicle.label.split(' ');
    return {
      vehicleEntryType: 'brand_new' as const,
      vehicleData: {
        make: make,
        model: modelParts.join(' '),
        variant: '',
        fuelType: '' as const,
        registrationYear: new Date().getFullYear(),
        registrationMonth: '',
        hasCngKit: null,
        isCommercialVehicle: null,
      },
    };
  },
  getNextStep: (response, state) => {
    if (response === 'other') {
      // For new bikes, go to enhanced new bike flow
      if (state.vehicleType === 'bike') return 'new_bike.select_make';
      return 'manual_entry.select_brand';
    }
    return 'manual_entry.select_fuel';
  },
};

/* Step 2: Commercial vehicle check (cars only — bikes skip) */
const brandNewCommercialCheck: MotorConversationStep = {
  id: 'brand_new.commercial_check',
  module: 'manual_entry',
  condition: (state) => state.vehicleType !== 'bike',
  widgetType: 'selection_cards',
  getScript: (state) => {
    const t = getT(state.language).motorScripts;
    return {
      botMessages: [t.commercialCheck],
      subText: t.commercialSub,
      options: [
        { id: 'no', label: t.personalUse, icon: 'user' },
        { id: 'yes', label: t.commercialUse, icon: 'commercial_car' },
      ],
    };
  },
  processResponse: (response, state) => ({
    vehicleData: { ...state.vehicleData, isCommercialVehicle: response === 'yes' },
  }),
  getNextStep: (response) => {
    if (response === 'yes') return 'pre_quote.commercial_rejection';
    return 'brand_new.delivery_date';
  },
};

/* Step 3: Delivery date */
const brandNewDeliveryDate: MotorConversationStep = {
  id: 'brand_new.delivery_date',
  module: 'manual_entry',
  widgetType: 'selection_cards',
  getScript: (state) => {
    const t = getT(state.language).motorScripts;
    return {
      botMessages: [t.gotIt, t.deliveryQuestion(state.vehicleData.make, state.vehicleData.model)],
      subText: t.deliverySub,
      options: [
        { id: 'today_tomorrow', label: t.todayTomorrow, icon: 'check' },
        { id: 'next_1_week', label: t.nextWeek, icon: 'clock' },
        { id: 'next_2_weeks', label: t.nextTwoWeeks, icon: 'clock' },
        { id: 'not_sure', label: t.notSureYet, icon: 'help' },
      ],
    };
  },
  processResponse: (response) => ({ deliveryWindow: response }),
  getNextStep: () => 'brand_new.mobile_pincode',
};

/* Step 4: Mobile number */
const brandNewMobilePincode: MotorConversationStep = {
  id: 'brand_new.mobile_pincode',
  module: 'manual_entry',
  widgetType: 'text_input',
  getScript: (state) => {
    const t = getT(state.language).motorScripts;
    return {
      botMessages: [t.almostDone, t.mobileQuestion],
      subText: t.mobileSub,
      placeholder: t.mobilePlaceholder,
      inputType: 'tel' as const,
    };
  },
  processResponse: (response) => ({ ownerMobile: response, phone: response }),
  getNextStep: () => 'brand_new.pincode',
};

/* Step 5: Pincode */
const brandNewPincode: MotorConversationStep = {
  id: 'brand_new.pincode',
  module: 'manual_entry',
  widgetType: 'text_input',
  getScript: (state) => {
    const t = getT(state.language).motorScripts;
    return {
      botMessages: [t.pincodeQuestion],
      subText: t.pincodeSub,
      placeholder: t.pincodePlaceholder,
      inputType: 'tel' as const,
    };
  },
  processResponse: (response) => ({ pincode: response }),
  getNextStep: () => 'brand_new.summary',
};

/* Step 6: Summary + View plans */
const brandNewSummary: MotorConversationStep = {
  id: 'brand_new.summary',
  module: 'manual_entry',
  widgetType: 'editable_summary',
  getScript: (state) => {
    const t = getT(state.language).motorScripts;
    const v = state.vehicleData;
    const fuelLabel = v.fuelType ? v.fuelType.charAt(0).toUpperCase() + v.fuelType.slice(1) : '';
    return {
      botMessages: [
        t.summaryIntro(vLabel(state)),
        `${v.make} ${v.model} ${v.variant} — ${fuelLabel}`,
      ],
      subText: t.summaryConfirm,
    };
  },
  processResponse: () => ({
    preQuoteComplete: true,
    policyStatus: null,
    vehicleDataSource: 'manual_entry' as const,
  }),
  getNextStep: () => 'brand_new.view_prices',
};

/* Step 7: Calculating plans */
const brandNewViewPrices: MotorConversationStep = {
  id: 'brand_new.view_prices',
  module: 'pre_quote',
  widgetType: 'none',
  getScript: (state) => ({
    botMessages: [getT(state.language).motorScripts.fetchingPlans(state.vehicleData.make, state.vehicleData.model)],
  }),
  processResponse: () => ({}),
  getNextStep: () => 'quote.calculating',
};

/* ═══════════════════════════════════════════════
   MODULE: OWNER DETAILS — Post-addon, pre-payment
   (Brand new vehicle specific — engine/chassis, loan)
   ═══════════════════════════════════════════════ */

const ownerDetailsIntro: MotorConversationStep = {
  id: 'owner_details.intro',
  module: 'owner_details',
  widgetType: 'none',
  getScript: () => ({
    botMessages: [
      `Almost there. We need a few details about the vehicle owner to issue the policy.`,
    ],
  }),
  processResponse: () => ({}),
  getNextStep: () => 'owner_details.name',
};

const ownerDetailsName: MotorConversationStep = {
  id: 'owner_details.name',
  module: 'owner_details',
  widgetType: 'text_input',
  getScript: (state) => {
    const prefill = state.ownerName || useUserProfileStore.getState().firstName || '';
    return {
      botMessages: prefill
        ? [`Does this name look right for the policy?`]
        : [`What is the vehicle owner's full name?`],
      subText: `This should match the name on your RC (Registration Certificate).`,
      placeholder: 'e.g., Bharath Kumar',
      defaultValue: prefill,
      inputType: 'text' as const,
    };
  },
  processResponse: (response) => ({ ownerName: response, userName: response }),
  getNextStep: () => 'login.phone_gate',
};

const ownerDetailsEmail: MotorConversationStep = {
  id: 'owner_details.email',
  module: 'owner_details',
  widgetType: 'text_input',
  getScript: (state) => {
    const prefill = state.ownerEmail || '';
    return {
      botMessages: prefill
        ? [`Is this still the right email address?`]
        : [`And your email address?`],
      subText: `We will send your policy document and updates to this email.`,
      placeholder: 'e.g., name@email.com',
      defaultValue: prefill,
      inputType: 'text' as const,
    };
  },
  processResponse: (response) => ({ ownerEmail: response }),
  getNextStep: (_, state) => {
    if (state.vehicleEntryType === 'brand_new') return 'owner_details.engine_number';
    return 'owner_details.loan_check';
  },
};

const ownerDetailsEngineNumber: MotorConversationStep = {
  id: 'owner_details.engine_number',
  module: 'owner_details',
  widgetType: 'text_input',
  getScript: (state) => ({
    botMessages: [
      `What is your ${vLabel(state)}'s engine number?`,
    ],
    subText: `You can get this from your ${vLabel(state)} dealer or the vehicle invoice.`,
    placeholder: 'e.g., 32IUYRQEWJHEJH',
    inputType: 'text' as const,
  }),
  processResponse: (response) => ({ engineNumber: response }),
  getNextStep: () => 'owner_details.chassis_number',
};

const ownerDetailsChassisNumber: MotorConversationStep = {
  id: 'owner_details.chassis_number',
  module: 'owner_details',
  widgetType: 'text_input',
  getScript: () => ({
    botMessages: [
      `And the chassis number?`,
    ],
    subText: `Both the engine and chassis numbers are available on your vehicle invoice from the dealer.`,
    placeholder: 'e.g., QU983ER3FG63',
    inputType: 'text' as const,
  }),
  processResponse: (response) => ({ chassisNumber: response }),
  getNextStep: () => 'owner_details.gst',
};

const ownerDetailsGst: MotorConversationStep = {
  id: 'owner_details.gst',
  module: 'owner_details',
  widgetType: 'selection_cards',
  getScript: () => ({
    botMessages: [
      `Do you have a GST number?`,
    ],
    subText: `This is optional. If you are GST-registered, you can claim input tax credit on the premium.`,
    options: [
      { id: 'skip', label: 'Skip for now' },
      { id: 'enter', label: 'I have a GST number' },
    ],
  }),
  processResponse: () => ({}),
  getNextStep: (response) => response === 'enter' ? 'owner_details.gst_input' : 'owner_details.loan_check',
};

const ownerDetailsGstInput: MotorConversationStep = {
  id: 'owner_details.gst_input',
  module: 'owner_details',
  widgetType: 'text_input',
  getScript: (state) => {
    const t = getT(state.language || getCurrentLang());
    return {
      botMessages: [t.motorScripts.gstInputQ],
      placeholder: t.motorScripts.gstInputPlaceholder,
      inputType: 'text' as const,
    };
  },
  processResponse: (response) => ({ gstNumber: response }),
  getNextStep: () => 'owner_details.loan_check',
};

const ownerDetailsLoanCheck: MotorConversationStep = {
  id: 'owner_details.loan_check',
  module: 'owner_details',
  widgetType: 'selection_cards',
  getScript: (state) => ({
    botMessages: [
      `Have you taken a ${vLabel(state)} loan for this vehicle?`,
    ],
    subText: `Your lender will be added as a beneficiary on the policy. This is required by most banks and NBFCs.`,
    options: [
      { id: 'no', label: 'I own it outright', icon: 'forward' },
      { id: 'yes', label: 'It\'s financed', icon: 'document' },
    ],
  }),
  processResponse: (response) => ({ hasCarLoan: response === 'yes' }),
  getNextStep: (response) => response === 'yes' ? 'owner_details.loan_provider' : 'login.phone_gate_mandatory',
};

const ownerDetailsLoanProvider: MotorConversationStep = {
  id: 'owner_details.loan_provider',
  module: 'owner_details',
  widgetType: 'text_input',
  getScript: (state) => {
    const t = getT(state.language || getCurrentLang());
    return {
      botMessages: [t.motorScripts.loanProviderQ],
      placeholder: t.motorScripts.loanProviderPlaceholder,
      inputType: 'text' as const,
    };
  },
  processResponse: (response) => ({ loanProvider: response }),
  getNextStep: () => 'login.phone_gate_mandatory',
};

/* ═══════════════════════════════════════════════
   MODULE: PRE-QUOTE — Data collection for pricing
   ═══════════════════════════════════════════════ */

const preQuoteCngCheck: MotorConversationStep = {
  id: 'pre_quote.cng_check',
  module: 'pre_quote',
  condition: (state) => state.vehicleType !== 'bike' && state.vehicleEntryType !== 'brand_new',
  widgetType: 'selection_cards',
  getScript: (state) => ({
    botMessages: [
      `One quick question before we build your quote.`,
      `Does your ${vLabel(state)} have an external CNG kit fitted?`,
    ],
    subText: `An external CNG kit needs to be covered separately in your insurance.`,
    options: [
      { id: 'yes', label: 'CNG kit fitted', icon: 'check' },
      { id: 'no', label: 'No CNG kit', icon: 'forward' },
    ],
  }),
  processResponse: (response, state) => ({
    vehicleData: { ...state.vehicleData, hasCngKit: response === 'yes' },
  }),
  getNextStep: (_, state) => {
    if (state.vehicleEntryType === 'brand_new') return 'brand_new.pincode';
    return getNextMissingFieldStep(state);
  },
};

const preQuoteCommercialCheck: MotorConversationStep = {
  id: 'pre_quote.commercial_check',
  module: 'pre_quote',
  condition: (state) => state.vehicleType !== 'bike' && state.vehicleEntryType !== 'brand_new',
  widgetType: 'selection_cards',
  getScript: (state) => ({
    botMessages: [
      `Is your ${vLabel(state)} used for personal or commercial purposes?`,
    ],
    subText: `Commercial vehicles (taxis, delivery, etc.) have different insurance requirements.`,
    options: [
      { id: 'no', label: 'Personal use', icon: 'user' },
      { id: 'yes', label: 'Commercial / taxi', icon: 'commercial_car' },
    ],
  }),
  processResponse: (response, state) => ({
    vehicleData: { ...state.vehicleData, isCommercialVehicle: response === 'yes' },
  }),
  getNextStep: (response, state) => {
    if (state.vehicleEntryType === 'brand_new') return 'brand_new.pincode';
    if (response === 'yes') return 'pre_quote.commercial_rejection';
    return getNextMissingFieldStep({ ...state, vehicleData: { ...state.vehicleData, isCommercialVehicle: false } } as MotorJourneyState);
  },
};

const preQuoteCommercialRejection: MotorConversationStep = {
  id: 'pre_quote.commercial_rejection',
  module: 'pre_quote',
  widgetType: 'rejection_screen',
  getScript: () => ({
    botMessages: [
      `We are currently unable to cover commercial vehicles.`,
      `We are working to expand our coverage and will notify you when this changes.`,
    ],
  }),
  processResponse: () => ({}),
  getNextStep: () => 'pre_quote.commercial_rejection', // dead end
};

/* ── Pincode (always asked — never auto-fetched) ── */

const preQuotePincodeAsk: MotorConversationStep = {
  id: 'pre_quote.pincode_ask',
  module: 'pre_quote',
  widgetType: 'text_input',
  getScript: (state) => ({
    botMessages: [`What is the pincode where your ${vLabel(state)} is registered?`],
    subText: `Your location helps us find the best plans and pricing for your area.`,
    placeholder: 'e.g., 560001',
    inputType: 'tel' as const,
  }),
  processResponse: (response) => ({ pincode: response }),
  getNextStep: (_, state) => getNextMissingFieldStep({ ...state, pincode: _ } as MotorJourneyState),
};

/* ── Phone Login Gate (pre-quote — during data collection) ── */

const loginPhoneGatePrequote: MotorConversationStep = {
  id: 'login.phone_gate_prequote',
  module: 'login',
  widgetType: 'login_gate_skippable',
  condition: () => !useUserProfileStore.getState().isLoggedIn,
  getScript: (state) => {
    const t = getT(state.language).motorScripts;
    const firstName = (state.ownerName || useUserProfileStore.getState().firstName || '').split(' ')[0];
    return {
      botMessages: [
        firstName
          ? `${firstName}, we need to verify your phone number to show you personalised plans.`
          : `We need to verify your phone number to show you personalised plans.`,
        `This also lets us save your progress so you can pick up later.`,
      ],
    };
  },
  processResponse: () => ({}),
  getNextStep: (_, state) => getNextMissingFieldStep(state),
};

/* ── Policy Type (when not auto-fetched) ── */

const preQuotePolicyTypeAsk: MotorConversationStep = {
  id: 'pre_quote.policy_type_ask',
  module: 'pre_quote',
  widgetType: 'selection_cards',
  getScript: () => ({
    botMessages: [`What type of policy did you have on this vehicle?`],
    subText: `This determines which plans and discounts are available to you.`,
    options: [
      { id: 'comprehensive', label: 'Comprehensive', description: 'Covers own damage + third party', icon: 'shield' },
      { id: 'third_party', label: 'Third Party', description: 'Only covers damage to others', icon: 'shield_search' },
      { id: 'not_sure', label: 'Not sure', icon: 'help' },
    ],
  }),
  processResponse: (response, state) => ({
    previousPolicy: { ...state.previousPolicy, policyType: response as any },
  }),
  getNextStep: (_, state) => 'pre_quote.policy_status',
};

/* ── Last Year Claim (when policy details present but claim not fetched) ── */

const preQuoteLastClaimAsk: MotorConversationStep = {
  id: 'pre_quote.last_claim_ask',
  module: 'pre_quote',
  widgetType: 'selection_cards',
  getScript: () => ({
    botMessages: [`Did you make a claim in your previous policy year?`],
    subText: `Your claim history affects your No Claim Bonus discount.`,
    options: [
      { id: 'no', label: 'No claims made', icon: 'check' },
      { id: 'yes', label: 'I made a claim', icon: 'document' },
    ],
  }),
  processResponse: (response, state) => ({
    previousPolicy: { ...state.previousPolicy, hadClaims: response === 'yes' },
  }),
  getNextStep: (_, state) => getNextMissingFieldStep({ ...state, previousPolicy: { ...state.previousPolicy, hadClaims: _ === 'yes' } } as MotorJourneyState),
};

/* ── Policy Status ── */

const preQuotePolicyStatus: MotorConversationStep = {
  id: 'pre_quote.policy_status',
  module: 'pre_quote',
  widgetType: 'selection_cards',
  getScript: (state) => ({
    botMessages: [
      `What is the current status of your ${vLabel(state)} insurance?`,
    ],
    subText: `This determines which plans and No Claim Bonus discounts are available to you.`,
    options: [
      { id: 'no', label: 'Still active', icon: 'shield' },
      { id: 'yes', label: 'Expired', icon: 'policy' },
      { id: 'not_sure', label: 'Not sure', icon: 'help' },
    ],
  }),
  processResponse: (response) => ({
    policyStatus: response as 'active' | 'expired' | 'not_sure',
  }),
  getNextStep: (response) => {
    if (response === 'no') return 'pre_quote.claim_history';
    return 'pre_quote.expired_policy_type';
  },
};

/* ── Active Policy Path ── */

const preQuoteClaimHistory: MotorConversationStep = {
  id: 'pre_quote.claim_history',
  module: 'pre_quote',
  widgetType: 'selection_cards',
  getScript: (state) => {
    const insurer = state.previousPolicy.insurer || 'your insurer';
    const expiry = state.previousPolicy.expiryDate || '';
    const msgs: string[] = [`Good, your policy is still active.`];
    if (expiry) {
      msgs.push(`Your ${insurer} policy expires on ${expiry}.`);
    }
    msgs.push(`Have you made any claims in your current policy?`);
    return {
      botMessages: msgs,
      subText: `Your claim history affects the No Claim Bonus discount on your new policy.`,
      options: [
        { id: 'no', label: 'No claims made', icon: 'check' },
        { id: 'yes', label: 'I made a claim', icon: 'document' },
      ],
    };
  },
  processResponse: (response, state) => ({
    previousPolicy: { ...state.previousPolicy, hadClaims: response === 'yes' },
  }),
  getNextStep: () => 'pre_quote.ncb_selection',
};

const preQuoteNcbSelection: MotorConversationStep = {
  id: 'pre_quote.ncb_selection',
  module: 'pre_quote',
  widgetType: 'ncb_selector',
  getScript: () => ({
    botMessages: [
      `What is your current No Claim Bonus (NCB) percentage?`,
    ],
    subText: `NCB is a discount you earn for each claim-free year. You can find this on your existing policy document. Incorrect NCB details may be adjusted during claims.`,
  }),
  processResponse: (response, state) => {
    const ncb = parseInt(response) as 0 | 20 | 25 | 35 | 45 | 50;
    const oldNcb = state.previousPolicy.ncbPercentage;
    return {
      previousPolicy: { ...state.previousPolicy, ncbPercentage: ncb },
      newNcbPercentage: ncb,
      ncbIncreased: ncb > oldNcb,
    };
  },
  getNextStep: (response, state) => {
    const ncb = parseInt(response) as number;
    const oldNcb = state.previousPolicy.ncbPercentage;
    if (ncb > oldNcb) return 'pre_quote.ncb_reward';
    return getNextMissingFieldStep({ ...state, newNcbPercentage: ncb } as MotorJourneyState);
  },
};

const preQuoteNcbReward: MotorConversationStep = {
  id: 'pre_quote.ncb_reward',
  module: 'pre_quote',
  widgetType: 'ncb_reward',
  getScript: (state) => ({
    botMessages: [
      `Great news — your NCB has increased.`,
      `We have applied a ${state.newNcbPercentage}% discount on your new premium as a reward for staying claim-free.`,
    ],
  }),
  processResponse: () => ({}),
  getNextStep: (_, state) => getNextMissingFieldStep(state),
};

/* ── Expired Policy Path ── */

const preQuoteExpiredPolicyType: MotorConversationStep = {
  id: 'pre_quote.expired_policy_type',
  module: 'pre_quote',
  widgetType: 'selection_cards',
  getScript: () => ({
    botMessages: [
      `Understood, your policy has expired.`,
      `What type of policy did you have before?`,
    ],
    subText: `This helps us determine your renewal options and any applicable discounts.`,
    options: [
      { id: 'comprehensive', label: 'Comprehensive', description: 'Covers own damage + third party', icon: 'shield' },
      { id: 'third_party', label: 'Third Party', description: 'Only covers damage to others', icon: 'shield_search' },
      { id: 'not_sure', label: 'Not sure', icon: 'help' },

    ],
  }),
  processResponse: (response, state) => ({
    expiredPolicyData: { ...state.expiredPolicyData, previousPolicyType: response },
  }),
  getNextStep: () => 'pre_quote.expiry_window',
};

const preQuoteExpiryWindow: MotorConversationStep = {
  id: 'pre_quote.expiry_window',
  module: 'pre_quote',
  widgetType: 'selection_cards',
  getScript: () => ({
    botMessages: [
      `Approximately when did your policy expire?`,
    ],
    subText: `If your policy expired more than 90 days ago, a vehicle inspection may be required.`,
    options: [
      { id: 'within_10_days', label: 'Within last 10 days', icon: 'clock' },
      { id: '10_to_90_days', label: '10–90 days ago', icon: 'clock' },
      { id: 'over_90_days', label: 'More than 90 days ago', icon: 'clock' },
    ],
  }),
  processResponse: (response, state) => ({
    expiredPolicyData: {
      ...state.expiredPolicyData,
      expiryWindow: response,
      requiresInspection: response === 'over_90_days',
      ncbAtRisk: response === 'over_90_days',
    },
  }),
  getNextStep: () => 'pre_quote.expired_claim_history',
};

const preQuoteExpiredClaimHistory: MotorConversationStep = {
  id: 'pre_quote.expired_claim_history',
  module: 'pre_quote',
  widgetType: 'selection_cards',
  getScript: () => ({
    botMessages: [
      `Did you make any claims during your previous policy period?`,
    ],
    subText: `Your claim history determines your No Claim Bonus eligibility.`,
    options: [
      { id: 'no', label: 'No claims made', icon: 'check' },
      { id: 'yes', label: 'I made a claim', icon: 'document' },
    ],
  }),
  processResponse: (response, state) => ({
    expiredPolicyData: { ...state.expiredPolicyData, hadClaims: response === 'yes' },
  }),
  getNextStep: () => 'pre_quote.expired_insurer',
};

const preQuoteExpiredInsurer: MotorConversationStep = {
  id: 'pre_quote.expired_insurer',
  module: 'pre_quote',
  widgetType: 'insurer_selector',
  getScript: () => ({
    botMessages: [
      `Who was your previous insurer?`,
    ],
    subText: `This is optional, but helps us process your policy transfer faster.`,
    placeholder: 'Select or skip',
  }),
  processResponse: (response, state) => ({
    expiredPolicyData: { ...state.expiredPolicyData, previousInsurer: response || '' },
  }),
  getNextStep: () => 'pre_quote.summary',
};

/* ── Summary ── */

const preQuoteSummary: MotorConversationStep = {
  id: 'pre_quote.summary',
  module: 'pre_quote',
  widgetType: 'editable_summary',
  getScript: (state) => {
    return {
      botMessages: [
        `Here is a summary of your ${vLabel(state)} details.`,
        `Please review and confirm to see your insurance options.`,
      ],
    };
  },
  processResponse: () => ({
    preQuoteComplete: true,
  }),
  getNextStep: () => 'pre_quote.view_prices',
};

const preQuoteViewPrices: MotorConversationStep = {
  id: 'pre_quote.view_prices',
  module: 'pre_quote',
  widgetType: 'none',
  getScript: (state) => {
    const v = state.vehicleData;
    return {
      botMessages: [
        `Fetching the best insurance plans for your ${v.make} ${v.model}...`,
      ],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => {
    if (!useUserProfileStore.getState().isLoggedIn) {
      return 'login.phone_gate_before_plans';
    }
    return 'quote.calculating';
  },
};

const loginPhoneGateBeforePlans: MotorConversationStep = {
  id: 'login.phone_gate_before_plans',
  module: 'login',
  widgetType: 'login_gate_mandatory',
  condition: () => !useUserProfileStore.getState().isLoggedIn,
  getScript: (state) => {
    const t = getT(state.language).motorScripts;
    const firstName = (state.ownerName || useUserProfileStore.getState().firstName || '').split(' ')[0];
    return {
      botMessages: [
        firstName
          ? `${firstName}, we need your phone number to show your plans.`
          : `We need your phone number to continue.`,
        `Please verify your number to proceed.`,
      ],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'quote.calculating',
};

/* ═══════════════════════════════════════════════
   MODULE: LOGIN GATE — Phone+OTP before showing plans
   Shown only when the user has not logged in yet.
   The widget itself is handled in MotorChatContainer.
   ═══════════════════════════════════════════════ */

const loginPhoneGate: MotorConversationStep = {
  id: 'login.phone_gate',
  module: 'login',
  widgetType: 'login_gate_skippable',
  condition: () => !useUserProfileStore.getState().isLoggedIn,
  getScript: (state) => {
    const t = getT(state.language).motorScripts;
    const firstName = (state.ownerName || useUserProfileStore.getState().firstName || '').split(' ')[0];
    return {
      botMessages: [
        t.loginEarlyGreeting(firstName),
        t.loginEarlyVerify,
      ],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'owner_details.email',
};

/* Mandatory phone gate — shown only if the user skipped the early gate.
   Must be completed before we show the final plan review. */
const loginPhoneGateMandatory: MotorConversationStep = {
  id: 'login.phone_gate_mandatory',
  module: 'login',
  widgetType: 'login_gate_mandatory',
  condition: () => !useUserProfileStore.getState().isLoggedIn,
  getScript: (state) => {
    const t = getT(state.language).motorScripts;
    const firstName = (state.ownerName || useUserProfileStore.getState().firstName || '').split(' ')[0];
    return {
      botMessages: [
        t.loginMandatoryGreeting(firstName),
        t.loginMandatoryVerify,
      ],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'review.premium_breakdown',
};

/* ═══════════════════════════════════════════════
   MODULE: QUOTE — Plan calculation & selection
   ═══════════════════════════════════════════════ */

const quoteCalculating: MotorConversationStep = {
  id: 'quote.calculating',
  module: 'quote',
  widgetType: 'plan_calculator',
  getScript: () => ({
    botMessages: [`Fetching your personalized quotes...`],
  }),
  processResponse: (response, state) => {
    const combo = determinePlanCombination(state);
    return {
      calculatingPlans: false,
      availablePlans: response.plans || [],
      planCombination: combo,
      idv: response.idv || 0,
      idvMin: response.idvMin || 0,
      idvMax: response.idvMax || 0,
    };
  },
  getNextStep: () => 'quote.plans_ready',
};

const quotePlansReady: MotorConversationStep = {
  id: 'quote.plans_ready',
  module: 'quote',
  widgetType: 'none',
  getScript: (state) => {
    const v = state.vehicleData;
    return {
      botMessages: [`We found the best plans for your ${v.make} ${v.model}.`],
    };
  },
  processResponse: () => ({}),
  getNextStep: (_, state) => {
    if (state.vehicleType === 'bike') return 'bike_plan.select';
    return 'quote.plan_selection';
  },
};

/* ═══════════════════════════════════════════════
   BIKE PLAN SELECTION — Per bike planning logic
   Comprehensive / OD / Third Party with tenure
   ═══════════════════════════════════════════════ */

const bikePlanSelect: MotorConversationStep = {
  id: 'bike_plan.select',
  module: 'quote',
  widgetType: 'plan_selector',
  getScript: (state) => {
    const isNewBike = state.vehicleEntryType === 'brand_new';
    return {
      botMessages: [isNewBike
        ? `Choose a plan for your new bike.`
        : `Choose a plan that fits your needs.`],
      subText: isNewBike
        ? 'New bikes come with bundled multi-year Third Party coverage as required by law.'
        : 'All plans include Own Damage and Third Party coverage. Add more protection with add-ons next.',
    };
  },
  processResponse: (response) => {
    if (response === 'help_choose') return {};
    return {
      selectedPlanType: response.planType,
      selectedGarageTier: response.garageTier,
      selectedPlan: response.plan,
    };
  },
  getNextStep: (response) => {
    if (response === 'help_choose') return 'help.usage_pattern';
    return 'quote.plan_selected';
  },
};


/* ═══════════════════════════════════════════════
   GUIDED PLAN SELECTION — Step by step per skill file (CAR)
   ═══════════════════════════════════════════════ */

/* Case 0: Active TP policy — OD renewal only */
const guidedOdTpActive: MotorConversationStep = {
  id: 'guided.od_tp_active',
  module: 'quote',
  widgetType: 'selection_cards',
  getScript: (state) => ({
    botMessages: [
      `Your Third Party policy is already active till ${state.activeTpExpiryDate || 'its expiry date'}. You only need to renew your Own Damage (OD) policy right now.`,
    ],
    options: [
      { id: 'okay', label: 'Okay, got it', icon: 'check' },
    ],
  }),
  processResponse: () => ({}),
  getNextStep: (_, state) => {
    const combo = state.planCombination;
    if (combo === 'OD-1') return 'guided.od_only_info';
    return 'guided.od_zd_vs_standard';
  },
};

const guidedOdOnlyInfo: MotorConversationStep = {
  id: 'guided.od_only_info',
  module: 'quote',
  widgetType: 'none',
  getScript: () => ({
    botMessages: [
      `Only the standard Own Damage plan is available for your vehicle. Let's customise it with add-ons.`,
    ],
  }),
  processResponse: (_, state) => ({
    selectedPlanType: 'od' as any,
    guidedPlanChoice: null,
    guidedZdChoice: null,
  }),
  getNextStep: () => 'guided.plan_confirmed',
};

const guidedOdZdVsStandard: MotorConversationStep = {
  id: 'guided.od_zd_vs_standard',
  module: 'quote',
  widgetType: 'guided_plan_step',
  getScript: () => ({
    botMessages: [
      `Do you want Zero Depreciation cover or a Standard OD plan?`,
    ],
    subText: `Zero Depreciation means no out-of-pocket cost for parts replaced during claims.`,
    options: [
      { id: 'zd', label: 'OD Zero Depreciation', description: 'No depreciation charges — full claim payout', icon: 'shield' },
      { id: 'standard', label: 'Standard OD', description: 'Depreciation applies — you pay the difference', icon: 'document' },
    ],
  }),
  processResponse: (response) => ({
    guidedZdChoice: response as 'zd' | 'standard',
  }),
  getNextStep: (response, state) => {
    if (response === 'standard') {
      return 'guided.plan_confirmed';
    }
    if (state.planCombination === 'OD-3') return 'guided.od_zd_variant';
    return 'guided.plan_confirmed';
  },
};

const guidedOdZdVariant: MotorConversationStep = {
  id: 'guided.od_zd_variant',
  module: 'quote',
  widgetType: 'guided_plan_step',
  getScript: () => ({
    botMessages: [`Choose your OD Zero Depreciation variant.`],
    options: [
      { id: 'safe_driver', label: 'Safe Driver', description: 'Lower premium. ₹5,000 deductible per claim.', icon: 'user' },
      { id: 'standard', label: 'Standard', description: 'Higher premium. No deductible.', icon: 'shield' },
    ],
  }),
  processResponse: (response) => ({
    guidedVariantChoice: response,
    selectedPlanType: response === 'safe_driver' ? 'od_zd_safe' as any : 'od_zd_standard' as any,
  }),
  getNextStep: () => 'guided.plan_confirmed',
};

/* Case 1 & 2: Comprehensive vs Third Party */
const guidedCompVsTp: MotorConversationStep = {
  id: 'guided.comp_vs_tp',
  module: 'quote',
  widgetType: 'guided_plan_step',
  getScript: (state) => {
    const rec = getRecommendedPlanType(state, state.planCombination || 'C');
    return {
      botMessages: [`Do you want a Comprehensive plan or a Third Party plan?`],
      subText: `Comprehensive covers your own car damage plus third-party liabilities. Third Party covers only liabilities towards others.`,
      options: [
        { id: 'comprehensive', label: 'Comprehensive', description: 'Covers your car + others', icon: 'shield' },
        { id: 'third_party', label: 'Third Party', description: 'Legal minimum — covers others only', icon: 'document' },
      ],
    };
  },
  processResponse: (response) => ({
    guidedPlanChoice: response as 'comprehensive' | 'third_party',
  }),
  getNextStep: (response, state) => {
    if (response === 'third_party') return 'guided.plan_confirmed';
    const combo = state.planCombination;
    if (combo === 'E' || combo === 'F') return 'guided.zd_vs_standard_comp';
    return 'guided.comp_variant';
  },
};

/* ZD Comp vs Standard Comp */
const guidedZdVsStandardComp: MotorConversationStep = {
  id: 'guided.zd_vs_standard_comp',
  module: 'quote',
  widgetType: 'guided_plan_step',
  getScript: (state) => {
    const rec = getRecommendedPlanType(state, state.planCombination || 'E');
    const recLabel = rec.step2Rec === 'zd' ? 'Recommended' : '';
    return {
      botMessages: [`Do you want Zero Depreciation cover or a Standard Comprehensive plan?`],
      subText: `Zero Depreciation means no out-of-pocket cost for parts replaced during claims. Standard Comprehensive means you pay depreciation.`,
      options: [
        { id: 'zd', label: 'Zero Depreciation', description: recLabel ? `${recLabel} — Full claim payout` : 'Full claim payout, no depreciation charges', icon: 'shield' },
        { id: 'standard', label: 'Standard Comprehensive', description: 'Depreciation applies on parts replaced', icon: 'document' },
      ],
    };
  },
  processResponse: (response) => ({
    guidedZdChoice: response as 'zd' | 'standard',
  }),
  getNextStep: (response, state) => {
    if (response === 'standard') return 'guided.comp_variant';
    return 'guided.zd_comp_variant';
  },
};

/* Comprehensive variant selection (Network vs Standard) */
const guidedCompVariant: MotorConversationStep = {
  id: 'guided.comp_variant',
  module: 'quote',
  widgetType: 'guided_plan_step',
  getScript: (state) => {
    const combo = state.planCombination;
    const hasNetwork = combo === 'D' || combo === 'E' || combo === 'F';
    if (!hasNetwork) {
      return {
        botMessages: [`Only the Standard Comprehensive plan is available for your vehicle.`],
        options: [
          { id: 'standard', label: 'Comprehensive — Standard', description: 'Repair at any garage, no deductible', icon: 'shield' },
        ],
      };
    }
    return {
      botMessages: [`Choose your Comprehensive plan variant.`],
      options: [
        { id: 'network', label: 'Network Garage', description: 'Lower premium. Repairs at ACKO network garages. ₹5,000 deductible outside network.', icon: 'garage' },
        { id: 'standard', label: 'Standard', description: 'Any garage, no deductible.', icon: 'shield' },
      ],
    };
  },
  processResponse: (response) => {
    const expanded = response === 'network' ? 'comprehensive_network' : 'comprehensive_standard';
    return {
      guidedVariantChoice: response,
      selectedPlanType: expanded as any,
      selectedGarageTier: response === 'network' ? 'network' : 'all',
    };
  },
  getNextStep: () => 'guided.plan_confirmed',
};

/* ZD Comprehensive variant selection (Safe Driver vs Standard) */
const guidedZdCompVariant: MotorConversationStep = {
  id: 'guided.zd_comp_variant',
  module: 'quote',
  widgetType: 'guided_plan_step',
  getScript: (state) => {
    const combo = state.planCombination;
    const hasBoth = combo === 'F';
    if (!hasBoth) {
      return {
        botMessages: [`Only the Safe Driver variant of ZD Comprehensive is available.`],
        subText: `₹5,000 deductible payable during any claim.`,
        options: [
          { id: 'safe_driver', label: 'ZD Comprehensive — Safe Driver', description: 'Lower premium, ₹5,000 deductible per claim', icon: 'user' },
        ],
      };
    }
    return {
      botMessages: [`Choose your ZD Comprehensive variant.`],
      options: [
        { id: 'safe_driver', label: 'Safe Driver', description: 'Lower premium. ₹5,000 deductible per claim.', icon: 'user' },
        { id: 'standard', label: 'Standard', description: 'Higher premium. No deductible.', icon: 'shield' },
      ],
    };
  },
  processResponse: (response) => {
    const expanded = response === 'safe_driver' ? 'zd_comprehensive_safe' : 'zd_comprehensive_standard';
    return {
      guidedVariantChoice: response,
      selectedPlanType: expanded as any,
    };
  },
  getNextStep: () => 'guided.plan_confirmed',
};

/* Case 3: Single plan only (A = TP only, B = Comp Standard only) */
const guidedSinglePlan: MotorConversationStep = {
  id: 'guided.single_plan',
  module: 'quote',
  widgetType: 'selection_cards',
  getScript: (state) => {
    const isTp = state.planCombination === 'A';
    return {
      botMessages: [
        `We are only able to offer you one plan at this time.`,
        isTp
          ? `Third Party — covers legal liabilities towards third parties. Does not cover your own car.`
          : `Comprehensive Standard — covers your own car damage and third-party liabilities.`,
      ],
      options: [
        { id: 'proceed', label: 'Proceed with this plan', icon: 'check' },
      ],
    };
  },
  processResponse: (_, state) => {
    const isTp = state.planCombination === 'A';
    return {
      selectedPlanType: (isTp ? 'third_party' : 'comprehensive_standard') as any,
      guidedPlanChoice: isTp ? 'third_party' : 'comprehensive',
    };
  },
  getNextStep: () => 'guided.plan_confirmed',
};

/* Plan confirmed → proceed to add-on questions */
const guidedPlanConfirmed: MotorConversationStep = {
  id: 'guided.plan_confirmed',
  module: 'quote',
  widgetType: 'none',
  getScript: (state) => {
    const planName = state.selectedPlan?.name || state.selectedPlanType || 'your plan';
    return {
      botMessages: [
        `Great choice. Now let us personalise your add-ons.`,
      ],
    };
  },
  processResponse: () => ({}),
  getNextStep: (_, state) => {
    if (state.vehicleType === 'bike') {
      if (state.selectedPlanType === 'third_party') return 'addons.protect_everyone';
      return 'addons.out_of_pocket';
    }
    return 'addons.paid_driver_question';
  },
};

/* Still support the old plan selector for backward compat / "Help me choose" */
const quotePlanSelection: MotorConversationStep = {
  id: 'quote.plan_selection',
  module: 'quote',
  widgetType: 'plan_selector',
  getScript: () => ({
    botMessages: [`Choose a plan that fits your needs.`],
    subText: `All plans include 1 year Own Damage and 3 years Third-party coverage. You can add more protection with add-ons in the next step.`,
  }),
  processResponse: (response) => {
    if (response === 'help_choose') return {};
    return {
      selectedPlanType: response.planType,
      selectedGarageTier: response.garageTier,
      selectedPlan: response.plan,
    };
  },
  getNextStep: (response) => {
    if (response === 'help_choose') return 'help.usage_pattern';
    return 'quote.plan_selected';
  },
};

/* ═══════════════════════════════════════════════
   "Help Me Choose" — Guided plan recommendation
   ═══════════════════════════════════════════════ */

const helpUsagePattern: MotorConversationStep = {
  id: 'help.usage_pattern',
  module: 'quote',
  widgetType: 'selection_cards',
  getScript: (state) => {
    const v = state.vehicleType === 'bike' ? 'bike' : 'car';
    return {
      botMessages: [
        `Let me help you pick the right plan! A few quick questions.`,
        `How do you primarily use your ${v}?`,
      ],
      options: [
        { id: 'daily_commute', label: 'Daily commute', description: 'Office, school, errands' },
        { id: 'weekend_only', label: 'Weekends & trips', description: 'Occasional drives and road trips' },
        { id: 'commercial', label: 'Business / commercial', description: 'Deliveries, rideshare, etc.' },
      ],
    };
  },
  processResponse: (response) => ({
    helpAnswers: { usage: response },
  }),
  getNextStep: () => 'help.vehicle_age',
};

const helpVehicleAge: MotorConversationStep = {
  id: 'help.vehicle_age',
  module: 'quote',
  widgetType: 'selection_cards',
  getScript: (state) => {
    const v = state.vehicleType === 'bike' ? 'bike' : 'car';
    return {
      botMessages: [
        `How old is your ${v}?`,
      ],
      options: [
        { id: 'new', label: 'Brand new / under 1 year' },
        { id: 'young', label: '1 – 3 years old' },
        { id: 'mid', label: '3 – 5 years old' },
        { id: 'old', label: 'More than 5 years' },
      ],
    };
  },
  processResponse: (response, state) => ({
    helpAnswers: { ...state.helpAnswers, vehicleAge: response },
  }),
  getNextStep: () => 'help.budget_priority',
};

const helpBudgetPriority: MotorConversationStep = {
  id: 'help.budget_priority',
  module: 'quote',
  widgetType: 'selection_cards',
  getScript: () => ({
    botMessages: [
      `What matters most to you?`,
    ],
    options: [
      { id: 'full_coverage', label: 'Maximum coverage', description: 'I want the best protection, cost is secondary' },
      { id: 'balanced', label: 'Balanced', description: 'Good coverage at a reasonable price' },
      { id: 'budget', label: 'Keep it affordable', description: 'Basic protection within budget' },
    ],
  }),
  processResponse: (response, state) => ({
    helpAnswers: { ...state.helpAnswers, priority: response },
  }),
  getNextStep: () => 'help.repair_preference',
};

const helpRepairPreference: MotorConversationStep = {
  id: 'help.repair_preference',
  module: 'quote',
  widgetType: 'selection_cards',
  getScript: (state) => {
    const v = state.vehicleType === 'bike' ? 'bike' : 'car';
    return {
      botMessages: [
        `If your ${v} needs repairs after an accident, which matters more?`,
      ],
      options: [
        { id: 'full_parts', label: 'Full cost of new parts', description: 'No depreciation deductions on parts' },
        { id: 'any_garage', label: 'Freedom to pick any garage', description: 'Not limited to network garages' },
        { id: 'low_premium', label: 'Lower premium is fine', description: 'Okay with some out-of-pocket costs' },
      ],
    };
  },
  processResponse: (response, state) => ({
    helpAnswers: { ...state.helpAnswers, repair: response },
  }),
  getNextStep: () => 'help.recommendation',
};

function deriveRecommendation(answers: Record<string, string>, isBrandNew: boolean): {
  planType: 'zero_dep' | 'comprehensive' | 'third_party';
  reason: string;
} {
  const { usage, vehicleAge, priority, repair } = answers;
  let score = 0; // higher = more coverage needed

  if (usage === 'daily_commute') score += 3;
  else if (usage === 'commercial') score += 3;
  else score += 1;

  if (vehicleAge === 'new') score += 3;
  else if (vehicleAge === 'young') score += 2;
  else if (vehicleAge === 'mid') score += 1;
  else score += 0;

  if (priority === 'full_coverage') score += 3;
  else if (priority === 'balanced') score += 2;
  else score += 0;

  if (repair === 'full_parts') score += 3;
  else if (repair === 'any_garage') score += 1;
  else score += 0;

  if (isBrandNew) score += 2;

  if (score >= 8) {
    return {
      planType: 'zero_dep',
      reason: 'Based on your usage and preferences, Zero Depreciation gives you the best protection — you won\'t pay for part depreciation during claims, which saves significantly on newer vehicles.',
    };
  } else if (score >= 4) {
    return {
      planType: 'comprehensive',
      reason: 'A Comprehensive plan gives you solid all-round coverage for damage, theft, and third-party liability at a balanced price point.',
    };
  } else {
    return {
      planType: 'third_party',
      reason: 'Given your preferences and vehicle age, a Third-party plan covers the legal essentials at the most affordable price.',
    };
  }
}

const helpRecommendation: MotorConversationStep = {
  id: 'help.recommendation',
  module: 'quote',
  widgetType: 'plan_recommendation',
  getScript: (state) => {
    const isBrandNew = state.vehicleEntryType === 'brand_new';
    const { planType, reason } = deriveRecommendation(state.helpAnswers, isBrandNew);
    const planLabel = planType === 'zero_dep' ? 'Zero Depreciation' : planType === 'comprehensive' ? 'Comprehensive' : 'Third-party';
    return {
      botMessages: [
        `Based on your answers, I'd recommend the **${planLabel}** plan for you.`,
        reason,
      ],
    };
  },
  processResponse: (response, state) => {
    if (response === 'back_to_plans') return {};
    const isBrandNew = state.vehicleEntryType === 'brand_new';
    const { planType, reason } = deriveRecommendation(state.helpAnswers, isBrandNew);
    return {
      recommendedPlanType: planType,
      recommendedPlanReason: reason,
      selectedPlanType: response.planType || planType,
      selectedGarageTier: response.garageTier || null,
      selectedPlan: response.plan || null,
    };
  },
  getNextStep: (response) => {
    if (response === 'back_to_plans') return 'quote.plan_selection';
    return 'quote.plan_selected';
  },
};

const quotePlanSelected: MotorConversationStep = {
  id: 'quote.plan_selected',
  module: 'quote',
  widgetType: 'none',
  getScript: (state) => {
    const planName = state.selectedPlan?.name || 'plan';
    return {
      botMessages: [
        `${planName} — good choice.`,
        `Now let's add some extra protection.`,
      ],
    };
  },
  processResponse: () => ({}),
  getNextStep: (_, state) => {
    if (state.vehicleType === 'bike') {
      if (state.selectedPlanType === 'third_party') return 'addons.protect_everyone';
      return 'addons.out_of_pocket';
    }
    return 'addons.paid_driver_question';
  },
};

/* ═══════════════════════════════════════════════
   ADD-ON PERSONALIZATION QUESTIONS
   Per skill file: asked before displaying add-ons
   ═══════════════════════════════════════════════ */

const addonsPaidDriverQuestion: MotorConversationStep = {
  id: 'addons.paid_driver_question',
  module: 'addons',
  widgetType: 'selection_cards',
  getScript: (state) => ({
    botMessages: [
      `A couple of quick questions to personalise your add-ons.`,
      `Do you have a paid or hired driver for this ${vLabel(state)}?`,
    ],
    options: [
      { id: 'yes', label: 'Yes', icon: 'user' },
      { id: 'no', label: 'No', icon: 'forward' },
    ],
  }),
  processResponse: (response) => ({
    hasPaidDriver: response === 'yes',
  }),
  getNextStep: () => 'addons.accessories_question',
};

const addonsAccessoriesQuestion: MotorConversationStep = {
  id: 'addons.accessories_question',
  module: 'addons',
  widgetType: 'selection_cards',
  getScript: () => ({
    botMessages: [
      `Do you have any electrical or non-electrical accessories fitted to your car after purchase?`,
    ],
    subText: `For example: new AC unit, bass boosters, alloy wheels, seat covers.`,
    options: [
      { id: 'yes', label: 'Yes, I have accessories', icon: 'check' },
      { id: 'no', label: 'No accessories', icon: 'forward' },
    ],
  }),
  processResponse: (response) => ({
    hasAftermarketAccessories: response === 'yes',
  }),
  getNextStep: (_, state) => {
    if (state.selectedPlanType === 'third_party') {
      return 'addons.protect_everyone';
    }
    return 'addons.out_of_pocket';
  },
};

const addonsOutOfPocket: MotorConversationStep = {
  id: 'addons.out_of_pocket',
  module: 'addons',
  widgetType: 'out_of_pocket_addons',
  getScript: () => ({
    botMessages: [
      `Here are the add-ons that protect your car. Recommended add-ons are highlighted based on your vehicle profile.`,
    ],
    subText: `Select the ones that matter to you. You can add multiple.`,
  }),
  processResponse: (response) => ({
    selectedAddOns: response.addons || [],
  }),
  getNextStep: () => 'addons.protect_everyone',
};

const addonsProtectEveryone: MotorConversationStep = {
  id: 'addons.protect_everyone',
  module: 'addons',
  widgetType: 'protect_everyone_addons',
  getScript: () => ({
    botMessages: [],
  }),
  processResponse: (response, state) => {
    // The widget already merged addons, just pass through what it gives us
    return {
      selectedAddOns: response.addons || state.selectedAddOns || [],
    };
  },
  getNextStep: () => 'addons.complete',
};

const addonsComplete: MotorConversationStep = {
  id: 'addons.complete',
  module: 'addons',
  widgetType: 'none',
  getScript: (state) => {
    const totalAddons = (state.selectedAddOns as any[])?.length || 0;
    if (totalAddons > 0) {
      return {
        botMessages: [
          `You have selected ${totalAddons} add-on${totalAddons > 1 ? 's' : ''}.`,
          `Let us put together your final premium.`,
        ],
      };
    }
    return {
      botMessages: [
        `No add-ons selected — your base plan already provides solid coverage.`,
      ],
    };
  },
  processResponse: () => ({}),
  getNextStep: (_, state) => {
    if (state.vehicleType === 'bike') return 'confirm_details.intro';
    return 'owner_details.intro';
  },
};

const reviewPremiumBreakdown: MotorConversationStep = {
  id: 'review.premium_breakdown',
  module: 'review',
  widgetType: 'premium_breakdown',
  getScript: (state) => ({
    botMessages: [
      `Here is the complete breakdown of your ${state.selectedPlan?.name || 'insurance plan'}.`,
    ],
  }),
  processResponse: () => ({}),
  getNextStep: () => 'payment.process',
};

const paymentProcess: MotorConversationStep = {
  id: 'payment.process',
  module: 'payment',
  widgetType: 'payment_gateway',
  getScript: () => ({
    botMessages: [
      `Let's complete your payment securely. Choose a payment method below.`,
    ],
  }),
  processResponse: () => ({ paymentComplete: true }),
  getNextStep: () => 'payment.success',
};

const paymentSuccess: MotorConversationStep = {
  id: 'payment.success',
  module: 'payment',
  widgetType: 'motor_celebration',
  getScript: (state) => {
    const vehicleName = `${state.vehicleData.make} ${state.vehicleData.model}`;
    return {
      botMessages: [
        `Congratulations! Your ${vehicleName} is now insured with ACKO.`,
        `Your policy is active and you are fully covered on the road.`,
      ],
    };
  },
  processResponse: () => {
    const policyNum = `ACKO-M-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    return { paymentComplete: true, policyNumber: policyNum };
  },
  getNextStep: () => 'post_purchase.status_intro',
};

/* ═══════════════════════════════════════════════
   MODULE: POST PURCHASE — Conversational post-buy
   ═══════════════════════════════════════════════ */

const postPurchaseStatusIntro: MotorConversationStep = {
  id: 'post_purchase.status_intro',
  module: 'post_purchase',
  widgetType: 'none',
  getScript: (state) => {
    const vehicleName = `${state.vehicleData.make} ${state.vehicleData.model}`;
    return {
      botMessages: [
        `Your ${vehicleName} policy is being prepared. Here is where things stand right now.`,
      ],
    };
  },
  processResponse: () => ({}),
  getNextStep: () => 'post_purchase.policy_tracker',
};

const postPurchasePolicyTracker: MotorConversationStep = {
  id: 'post_purchase.policy_tracker',
  module: 'post_purchase',
  widgetType: 'policy_tracker',
  getScript: () => ({
    botMessages: [],
  }),
  processResponse: () => ({}),
  getNextStep: () => 'post_purchase.kyc_prompt',
};

const postPurchaseKycPrompt: MotorConversationStep = {
  id: 'post_purchase.kyc_prompt',
  module: 'post_purchase',
  widgetType: 'selection_cards',
  getScript: () => ({
    botMessages: [
      `One quick thing — you will need to complete KYC within 4 days to activate your policy. Want to start now?`,
    ],
    options: [
      { id: 'start_kyc', label: 'Start KYC now', description: 'Takes about 2 minutes' },
      { id: 'later', label: "I'll do it later", description: 'Complete within 4 days' },
    ],
  }),
  processResponse: () => ({}),
  getNextStep: () => 'post_purchase.nps',
};

const postPurchaseNps: MotorConversationStep = {
  id: 'post_purchase.nps',
  module: 'post_purchase',
  widgetType: 'nps_feedback',
  getScript: () => ({
    botMessages: [
      `Quick question — how was your experience buying insurance through this conversation?`,
    ],
  }),
  processResponse: (response) => ({
    npsScore: response.score ?? null,
    npsFeedback: response.feedback ?? '',
  }),
  getNextStep: () => 'post_purchase.app_download',
};

const postPurchaseAppDownload: MotorConversationStep = {
  id: 'post_purchase.app_download',
  module: 'post_purchase',
  widgetType: 'app_download_cta',
  getScript: () => ({
    botMessages: [
      `Thanks for the feedback! Download the ACKO app to manage your policy, file claims instantly, and get roadside assistance anytime.`,
    ],
  }),
  processResponse: () => ({}),
  getNextStep: () => 'post_purchase.end',
};

const postPurchaseEnd: MotorConversationStep = {
  id: 'post_purchase.end',
  module: 'post_purchase',
  widgetType: 'selection_cards',
  getScript: (state) => {
    const v = state.vehicleType === 'bike' ? 'Ride' : 'Drive';
    const vLabel = state.vehicleType === 'bike' ? 'bike' : 'car';
    return {
      botMessages: [
        `${v} safe — you are all set! What would you like to do next?`,
      ],
      options: [
        { id: 'home', label: 'Go to Home', description: 'Back to the main page' },
        { id: 'new_vehicle', label: `Insure another ${vLabel}`, description: `Start a new ${vLabel} insurance journey` },
      ],
    };
  },
  processResponse: () => ({ journeyComplete: true }),
  getNextStep: () => 'post_purchase.end',
};

/* ═══════════════════════════════════════════════
   MODULE: ACKO DRIVE — Inline car browsing
   ═══════════════════════════════════════════════ */

const ackoDriveBrowseMake: MotorConversationStep = {
  id: 'acko_drive.browse_make',
  module: 'manual_entry',
  widgetType: 'brand_selector',
  getScript: (state) => {
    const t = getT(state.language).motorEntry;
    return { botMessages: [t.driveIntro, t.drivePickMake] };
  },
  processResponse: (response, state) => ({
    vehicleData: { ...state.vehicleData, make: response as string },
  }),
  getNextStep: () => 'acko_drive.browse_model',
};

const ackoDriveBrowseModel: MotorConversationStep = {
  id: 'acko_drive.browse_model',
  module: 'manual_entry',
  widgetType: 'model_selector',
  getScript: (state) => {
    const t = getT(state.language).motorEntry;
    return { botMessages: [t.drivePickModel(state.vehicleData.make || 'it')] };
  },
  processResponse: (response, state) => ({
    vehicleData: { ...state.vehicleData, model: response as string },
  }),
  getNextStep: () => 'acko_drive.browse_variant',
};

const ackoDriveBrowseVariant: MotorConversationStep = {
  id: 'acko_drive.browse_variant',
  module: 'manual_entry',
  widgetType: 'variant_selector',
  getScript: (state) => {
    const t = getT(state.language).motorEntry;
    return { botMessages: [t.drivePickVariant(state.vehicleData.model || 'it')] };
  },
  processResponse: (response, state) => ({
    vehicleData: { ...state.vehicleData, variant: response as string },
    vehicleType: 'car',
    vehicleEntryType: 'brand_new',
    ackoDriveSelectedCar: {
      make: state.vehicleData.make,
      model: state.vehicleData.model,
      variant: response as string,
    },
  }),
  getNextStep: () => 'brand_new.pincode',
};

/* ═══════════════════════════════════════════════
   STEP REGISTRY
   ═══════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════
   BIKE-SPECIFIC ADD-ON STEPS
   Following bike planning logic with proper categorization  
   ═══════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════
   BIKE-SPECIFIC CONFIRM DETAILS STEPS
   Following bike planning logic patterns
   ═══════════════════════════════════════════════ */

/* Bike: Confirm Details Introduction */
const bikeConfirmDetailsIntro: MotorConversationStep = {
  id: 'confirm_details.intro',
  module: 'owner_details',
  condition: (state) => state.vehicleType === 'bike',
  widgetType: 'selection_cards',
  getScript: (state) => {
    return {
      botMessages: [
        `Almost there. A few details to finalize your policy.`
      ],
      options: [
        { id: 'continue', label: 'Let\'s do it', icon: 'arrow_right' },
      ],
    };
  },
  processResponse: () => ({}),
  getNextStep: (_, state) => {
    // Journey 1 (existing bike) needs policy expiry date
    if (state.vehicleEntryType === 'existing') {
      return 'confirm_details.policy_expiry';
    }
    // Journey 2 (new bike) skips policy questions
    return 'confirm_details.name';
  },
};

/* Bike: Policy Expiry Date (Journey 1 only) */
const bikeConfirmPolicyExpiry: MotorConversationStep = {
  id: 'confirm_details.policy_expiry',
  module: 'owner_details',
  condition: (state) => state.vehicleType === 'bike' && state.vehicleEntryType === 'existing',
  widgetType: 'text_input',
  getScript: (state) => {
    return {
      botMessages: [
        `When does your previous policy expire?`,
        `We need your previous policy's expiry date to start your new policy on time and ensure your bike has continued coverage without any gap.`
      ],
      placeholder: 'DD/MM/YYYY',
      inputType: 'text',
    };
  },
  processResponse: (response) => ({
    previousPolicy: { expiryDate: response as string, insurer: '', policyType: 'not_sure', ncbPercentage: 0, hadClaims: null },
  }),
  getNextStep: () => 'confirm_details.policy_type',
};

/* Bike: Previous Policy Type (Journey 1 only) */
const bikeConfirmPolicyType: MotorConversationStep = {
  id: 'confirm_details.policy_type',
  module: 'owner_details',
  condition: (state) => state.vehicleType === 'bike' && state.vehicleEntryType === 'existing',
  widgetType: 'selection_cards',
  getScript: (state) => {
    return {
      botMessages: [`What type of plan did you have previously?`],
      subText: 'This helps determine coverage continuity',
      options: [
        { id: 'comprehensive', label: 'Comprehensive', description: 'Own damage + third party', icon: 'comprehensive' },
        { id: 'third_party', label: 'Third Party', description: 'Legal minimum coverage', icon: 'third_party' },
      ],
    };
  },
  processResponse: (response, state) => ({
    previousPolicy: { ...state.previousPolicy, policyType: response as any },
  }),
  getNextStep: () => 'confirm_details.name',
};

/* Bike: Full Name */
const bikeConfirmName: MotorConversationStep = {
  id: 'confirm_details.name',
  module: 'owner_details',
  condition: (state) => state.vehicleType === 'bike',
  widgetType: 'text_input',
  getScript: (state) => {
    const userProfile = useUserProfileStore.getState();
    return {
      botMessages: [`Your full name?`],
      subText: 'Policyholder name as per official documents',
      placeholder: 'Full Name',
      defaultValue: userProfile.name || '',
      inputType: 'text',
    };
  },
  processResponse: (response) => ({
    ownerName: response as string,
  }),
  getNextStep: () => 'confirm_details.email',
};

/* Bike: Email Address */
const bikeConfirmEmail: MotorConversationStep = {
  id: 'confirm_details.email',
  module: 'owner_details',
  condition: (state) => state.vehicleType === 'bike',
  widgetType: 'text_input',
  getScript: (state) => {
    const userProfile = useUserProfileStore.getState();
    return {
      botMessages: [`Your email address?`],
      subText: 'Policy documents and claim updates will be sent here',
      placeholder: 'you@email.com',
      defaultValue: userProfile.email || '',
      inputType: 'text',
    };
  },
  processResponse: (response) => ({
    ownerEmail: response as string,
  }),
  getNextStep: () => 'confirm_details.pincode',
};

/* Bike: Pincode */
const bikeConfirmPincode: MotorConversationStep = {
  id: 'confirm_details.pincode',
  module: 'owner_details',
  condition: (state) => state.vehicleType === 'bike',
  widgetType: 'text_input',
  getScript: (state) => {
    return {
      botMessages: [`Your pincode?`],
      subText: 'For pricing and zone-based underwriting',
      placeholder: '560001',
      inputType: 'tel',
    };
  },
  processResponse: (response) => ({
    pincode: response as string,
  }),
  getNextStep: (_, state) => {
    // Check if user is logged in
    const userProfile = useUserProfileStore.getState();
    return userProfile.phone ? 'review.premium_breakdown' : 'confirm_details.phone';
  },
};

/* Bike: Phone Number (if not logged in) */
const bikeConfirmPhone: MotorConversationStep = {
  id: 'confirm_details.phone',
  module: 'owner_details',
  condition: (state) => state.vehicleType === 'bike',
  widgetType: 'text_input',
  getScript: (state) => {
    return {
      botMessages: [`Your phone number?`],
      subText: 'Policy will be linked to this number',
      placeholder: '+91 98765 43210',
      inputType: 'tel',
    };
  },
  processResponse: (response) => ({
    ownerMobile: response as string,
  }),
  getNextStep: () => 'review.premium_breakdown',
};

const MOTOR_STEPS: Record<string, MotorConversationStep> = {
  'vehicle_type.select': vehicleTypeSelect,
  'registration.has_number': registrationHasNumber,
  'registration.enter_number': registrationEnterNumber,
  'vehicle_fetch.loading': vehicleFetchLoading,
  // Preliminary checks
  'prelim.check': prelimCheck,
  'prelim.insured_same_user': prelimInsuredSameUser,
  'prelim.insured_different_user': prelimInsuredDifferentUser,
  'prelim.two_wheeler_entered': prelimTwoWheelerEntered,
  'prelim.payment_pending': prelimPaymentPending,
  'vehicle_fetch.found': vehicleFetchFound,
  'manual_entry.congratulations': manualEntryCongratulations,
  'manual_entry.start': manualEntryStart,
  'manual_entry.select_brand': manualEntrySelectBrand,
  'manual_entry.select_model': manualEntrySelectModel,
  'manual_entry.select_fuel': manualEntrySelectFuel,
  'manual_entry.select_variant': manualEntrySelectVariant,
  'manual_entry.select_year': manualEntrySelectYear,
  // New bike journey (Journey 2)
  'new_bike.welcome': newBikeWelcome,
  'new_bike.select_make': newBikeSelectMake,
  'new_bike.select_model': newBikeSelectModel,
  'new_bike.phone_number': newBikePhoneNumber,
  // Brand new cars (existing)
  'brand_new.popular_cars': brandNewPopularCars,
  'brand_new.commercial_check': brandNewCommercialCheck,
  'brand_new.delivery_date': brandNewDeliveryDate,
  'brand_new.mobile_pincode': brandNewMobilePincode,
  'brand_new.pincode': brandNewPincode,
  'brand_new.summary': brandNewSummary,
  'brand_new.view_prices': brandNewViewPrices,
  // Bike-specific confirm details
  'confirm_details.intro': bikeConfirmDetailsIntro,
  'confirm_details.policy_expiry': bikeConfirmPolicyExpiry,
  'confirm_details.policy_type': bikeConfirmPolicyType,
  'confirm_details.name': bikeConfirmName,
  'confirm_details.email': bikeConfirmEmail,
  'confirm_details.pincode': bikeConfirmPincode,
  'confirm_details.phone': bikeConfirmPhone,
  'login.phone_gate': loginPhoneGate,
  'login.phone_gate_prequote': loginPhoneGatePrequote,
  'login.phone_gate_before_plans': loginPhoneGateBeforePlans,
  'login.phone_gate_mandatory': loginPhoneGateMandatory,
  'owner_details.intro': ownerDetailsIntro,
  'owner_details.name': ownerDetailsName,
  'owner_details.email': ownerDetailsEmail,
  'owner_details.engine_number': ownerDetailsEngineNumber,
  'owner_details.chassis_number': ownerDetailsChassisNumber,
  'owner_details.gst': ownerDetailsGst,
  'owner_details.gst_input': ownerDetailsGstInput,
  'owner_details.loan_check': ownerDetailsLoanCheck,
  'owner_details.loan_provider': ownerDetailsLoanProvider,
  // Data collection (dynamic per all-or-nothing)
  'pre_quote.pincode_ask': preQuotePincodeAsk,
  'pre_quote.policy_type_ask': preQuotePolicyTypeAsk,
  'pre_quote.last_claim_ask': preQuoteLastClaimAsk,
  'pre_quote.cng_check': preQuoteCngCheck,
  'pre_quote.commercial_check': preQuoteCommercialCheck,
  'pre_quote.commercial_rejection': preQuoteCommercialRejection,
  'pre_quote.policy_status': preQuotePolicyStatus,
  'pre_quote.claim_history': preQuoteClaimHistory,
  'pre_quote.ncb_selection': preQuoteNcbSelection,
  'pre_quote.ncb_reward': preQuoteNcbReward,
  'pre_quote.expired_policy_type': preQuoteExpiredPolicyType,
  'pre_quote.expiry_window': preQuoteExpiryWindow,
  'pre_quote.expired_claim_history': preQuoteExpiredClaimHistory,
  'pre_quote.expired_insurer': preQuoteExpiredInsurer,
  'pre_quote.summary': preQuoteSummary,
  'pre_quote.view_prices': preQuoteViewPrices,
  'quote.calculating': quoteCalculating,
  'quote.plans_ready': quotePlansReady,
  // Bike plan selection
  'bike_plan.select': bikePlanSelect,
  // Guided plan selection (car)
  'guided.od_tp_active': guidedOdTpActive,
  'guided.od_only_info': guidedOdOnlyInfo,
  'guided.od_zd_vs_standard': guidedOdZdVsStandard,
  'guided.od_zd_variant': guidedOdZdVariant,
  'guided.comp_vs_tp': guidedCompVsTp,
  'guided.zd_vs_standard_comp': guidedZdVsStandardComp,
  'guided.comp_variant': guidedCompVariant,
  'guided.zd_comp_variant': guidedZdCompVariant,
  'guided.single_plan': guidedSinglePlan,
  'guided.plan_confirmed': guidedPlanConfirmed,
  'quote.plan_selection': quotePlanSelection,
  'help.usage_pattern': helpUsagePattern,
  'help.vehicle_age': helpVehicleAge,
  'help.budget_priority': helpBudgetPriority,
  'help.repair_preference': helpRepairPreference,
  'help.recommendation': helpRecommendation,
  'quote.plan_selected': quotePlanSelected,
  // Add-on personalization
  'addons.paid_driver_question': addonsPaidDriverQuestion,
  'addons.accessories_question': addonsAccessoriesQuestion,
  'addons.out_of_pocket': addonsOutOfPocket,
  'addons.protect_everyone': addonsProtectEveryone,
  'addons.complete': addonsComplete,
  'review.premium_breakdown': reviewPremiumBreakdown,
  'payment.process': paymentProcess,
  'payment.success': paymentSuccess,
  'post_purchase.status_intro': postPurchaseStatusIntro,
  'post_purchase.policy_tracker': postPurchasePolicyTracker,
  'post_purchase.kyc_prompt': postPurchaseKycPrompt,
  'post_purchase.nps': postPurchaseNps,
  'post_purchase.app_download': postPurchaseAppDownload,
  'post_purchase.end': postPurchaseEnd,
  'acko_drive.browse_make': ackoDriveBrowseMake,
  'acko_drive.browse_model': ackoDriveBrowseModel,
  'acko_drive.browse_variant': ackoDriveBrowseVariant,
};

export function getMotorStep(stepId: string): MotorConversationStep | undefined {
  return MOTOR_STEPS[stepId];
}
