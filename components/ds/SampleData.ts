import type { Option } from '../../lib/types';

export const GRID_OPTIONS: Option[] = [
  { id: 'self', label: 'Self', icon: 'user' },
  { id: 'spouse', label: 'Spouse', icon: 'heart' },
  { id: 'children', label: 'Children', icon: 'child' },
  { id: 'parents', label: 'Parents', icon: 'building' },
];

export const LIST_OPTIONS: Option[] = [
  { id: 'cover_enough', label: 'Is my cover enough?', icon: 'shield', description: 'Check if your current coverage is adequate' },
  { id: 'which_plan', label: 'Which plan is best?', icon: 'compare', description: 'Compare plans and find the right fit' },
  { id: 'exploring', label: 'Just exploring', icon: 'search', description: 'Browse options at your pace' },
  { id: 'check_gaps', label: 'Check coverage gaps', icon: 'shield_search', description: 'Find blind spots in your policy' },
  { id: 'switch', label: 'Switch my insurer', icon: 'switch', description: 'Move to a better plan', badge: 'Popular' },
];

export const MULTI_SELECT_OPTIONS: Option[] = [
  { id: 'self', label: 'Self', icon: 'user' },
  { id: 'spouse', label: 'Spouse', icon: 'heart' },
  { id: 'father', label: 'Father', icon: 'father' },
  { id: 'mother', label: 'Mother', icon: 'mother' },
  { id: 'children', label: 'Children', icon: 'child' },
];

export const DISEASE_OPTIONS: Option[] = [
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'hypertension', label: 'Hypertension / High BP' },
  { id: 'thyroid', label: 'Thyroid' },
  { id: 'asthma', label: 'Asthma' },
  { id: 'heart_condition', label: 'Heart condition' },
  { id: 'none', label: 'None of the above' },
];

export const YES_NO_OPTIONS: Option[] = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
];

export const PLAN_TIERS = [
  {
    tier: 'platinum' as const,
    name: 'Platinum',
    tagline: 'Maximum protection for your family',
    sumInsured: 2500000,
    sumInsuredLabel: '₹25 Lakh',
    monthlyPremium: 2499,
    yearlyPremium: 24999,
    features: ['Unlimited restoration', 'No room rent limit', 'All day-care covered', 'No co-pay', 'Consumables covered'],
    exclusions: ['Cosmetic surgery', 'Pre-existing (4yr wait)'],
    waitingPeriod: '30 days',
    healthEval: 'Quick health declaration',
    badge: 'Best Value',
    recommended: true,
  },
  {
    tier: 'platinum_lite' as const,
    name: 'Platinum Lite',
    tagline: 'Great coverage at lower cost',
    sumInsured: 1500000,
    sumInsuredLabel: '₹15 Lakh',
    monthlyPremium: 1499,
    yearlyPremium: 14999,
    features: ['100% restoration', 'Room rent up to ₹10K/day', 'Major day-care covered', '10% co-pay'],
    exclusions: ['Cosmetic surgery', 'Pre-existing (4yr wait)'],
    waitingPeriod: '30 days',
    healthEval: 'Quick health declaration',
  },
  {
    tier: 'super_topup' as const,
    name: 'Super Top-Up',
    tagline: 'Add on to existing cover',
    sumInsured: 1000000,
    sumInsuredLabel: '₹10 Lakh',
    monthlyPremium: 599,
    yearlyPremium: 5999,
    features: ['Works on top of GMC', 'No sub-limits', 'Family floater'],
    exclusions: ['Pre-existing (4yr wait)'],
    waitingPeriod: '30 days',
    healthEval: 'None required',
  },
];

export const USP_OPTIONS: Option[] = [
  { id: 'digital', label: '100% Digital', icon: 'document', description: 'Buy, manage, and claim online' },
  { id: 'support', label: '24×7 Support', icon: 'clock', description: 'Help whenever you need it' },
  { id: 'pricing', label: 'Honest Pricing', icon: 'star', description: 'No hidden charges' },
  { id: 'claims', label: 'Fast Claims', icon: 'forward', description: 'Claims settled in 2 hours' },
];

export const VEHICLE_BRANDS = [
  'Suzuki', 'Hyundai', 'TATA', 'Kia', 'Mahindra', 'Honda',
  'MG', 'Volvo', 'BMW', 'Audi', 'Hero', 'Bajaj',
  'TVS', 'Royal Enfield', 'Ather', 'Revolt',
];

export const VEHICLE_DETAILS = {
  make: 'Hyundai',
  model: 'Creta',
  variant: 'SX(O) 1.5 Diesel AT',
  year: 2023,
  regNumber: 'KA-01-AB-1234',
  fuelType: 'Diesel',
  rto: 'KA-01 (Bengaluru)',
};

export const MOTOR_ADDON_LIST = [
  { id: 'zero_dep', label: 'Zero Depreciation', icon: 'Zero Dep Car.svg', price: '₹1,200/yr', description: 'Full claim amount without depreciation deduction', recommended: true },
  { id: 'engine', label: 'Engine Protection', icon: 'Engine_protect.svg', price: '₹800/yr', description: 'Covers engine damage due to water ingression' },
  { id: 'consumables', label: 'Consumables Cover', icon: 'Consumables_cover.svg', price: '₹400/yr', description: 'Covers nut-bolts, oil, coolant, etc.' },
  { id: 'rsa', label: 'Roadside Assistance', icon: 'Towing.svg', price: '₹500/yr', description: '24/7 roadside help anywhere in India' },
  { id: 'key', label: 'Key Replacement', icon: 'Key.svg', price: '₹300/yr', description: 'Covers cost of replacing lost keys' },
  { id: 'passenger', label: 'Passenger Cover', icon: 'Passenger_cover.svg', price: '₹200/yr', description: 'Coverage for passengers in accident' },
];

export const HOSPITAL_PARTNERS = [
  { id: 'apollo', name: 'Apollo', logo: '/hospitals/apollo.png' },
  { id: 'fortis', name: 'Fortis', logo: '/hospitals/fortis.png' },
  { id: 'max', name: 'Max', logo: '/hospitals/max.png' },
  { id: 'manipal', name: 'Manipal', logo: '/hospitals/manipal.png' },
  { id: 'aiims', name: 'AIIMS', logo: '/hospitals/aiims.png' },
  { id: 'lilavati', name: 'Lilavati', logo: '/hospitals/lilavati.png' },
  { id: 'nimhans', name: 'NIMHANS', logo: '/hospitals/nimhans.png' },
  { id: 'pgimer', name: 'PGIMER', logo: '/hospitals/pgimer.png' },
];

export const CHAT_MESSAGES = [
  { type: 'bot' as const, content: 'Hey there! I\'m your ACKO insurance assistant. Let\'s find the perfect health plan for you.' },
  { type: 'user' as const, content: 'I need health insurance for my family of 4.' },
  { type: 'bot' as const, content: 'Great choice! A family plan covers everyone under one policy. Who all would you like to cover?' },
  { type: 'system' as const, content: 'Family members selected' },
];

export const ICON_SECTIONS = {
  general: ['search', 'compare', 'check', 'check_circle', 'user', 'heart', 'child', 'father', 'mother', 'building', 'document', 'plus', 'forward', 'star'],
  time: ['sunrise', 'sun', 'sunset', 'clock'],
  protection: ['shield', 'shield_search'],
  communication: ['chat_bubble', 'info', 'help'],
  medical: ['pill', 'hospital'],
  actions: ['upload', 'refresh', 'switch'],
};

export const FILE_ICON_SECTIONS: Record<string, string[]> = {
  'Motor & Vehicle': ['Car.svg', 'Bike.svg', 'Scooter.svg', 'New car.svg', 'New Bike.svg', 'Car_front.svg', 'Car and bike.svg', 'Car_accident.svg', 'Bike_Accident.svg'],
  'Protection & Coverage': ['Zero Dep Car.svg', 'Engine_protect.svg', 'Extra_car_protect.svg', 'Consumables_cover.svg', 'Theft_cover.svg', 'Fire Accident Cover.svg', 'Third Party.svg', 'Passenger_cover.svg', 'Driver_Cover_Paid.svg'],
  'Actions': ['Claim.svg', 'Renew.svg', 'Payment.svg', 'Download.svg', 'Edit.svg', 'Delete.svg', 'Share.svg', 'Print.svg', 'Compare.svg', 'Refresh.svg'],
  'Status & Info': ['Tick.svg', 'Covered.svg', 'Notification.svg', 'Alarm.svg', 'Alert.svg', 'Exclamation.svg', 'Info.svg', 'Verify.svg'],
  'Navigation': ['chevron down.svg', 'chevron right.svg', 'chevron up.svg', 'arrow left.svg', 'arrow right.svg', 'arrow up.svg', 'arrow down.svg'],
  'Fuel & Type': ['Fuel.svg', 'Petrol.svg', 'Diesel.svg', 'Flash.svg', 'CNG.svg'],
  'Documents': ['Policy document.svg', 'Policy.svg', 'PDF file.svg', 'Document received.svg', 'Invoice.svg', 'File.svg'],
  'Services': ['Towing.svg', 'Garage.svg', 'Customer service.svg', 'Technician.svg', 'Camera.svg', 'Location.svg', 'Phone.svg'],
  'Finance': ['Payment.svg', 'Discount.svg', 'Money.svg', 'Save money.svg', 'wallet.svg', 'credit-card.svg', 'bank.svg'],
  'Add-ons': ['Engine_protect.svg', 'Extra_car_protect.svg', 'Consumables_cover.svg', 'Zero Dep Car.svg', 'Key.svg', 'Towing.svg', 'pillon_bike_cover.svg', '24px Rat_Bite_Cover.svg', '24px Helemet_cover.svg', 'calamities_cover.svg', 'war_terrorism_cover.svg'],
  'Misc': ['Gift.svg', 'Fastag.svg', 'HSRP.svg', 'Bookmark.svg', 'star.svg', 'bolt.svg', 'lightbulb-3.svg', 'magnifier.svg', 'settings.svg'],
};

export const LOB_CARDS = [
  { id: 'car', label: 'Car Insurance', image: '/offerings/car-card.png', color: '#7C3AED' },
  { id: 'bike', label: 'Bike Insurance', image: '/offerings/bike-card.png', color: '#2563EB' },
  { id: 'health', label: 'Health Insurance', image: '/offerings/health-card.png', color: '#059669' },
  { id: 'life', label: 'Life Insurance', image: '/offerings/life-card.png', color: '#D97706' },
];

export const BRAND_LOGOS_ALL = [
  'Suzuki', 'Hyundai', 'TATA', 'Kia', 'Mahindra', 'Honda', 'MG', 'Volvo',
  'BMW', 'Audi', 'Hero', 'Bajaj', 'TVS', 'Royal Enfield', 'Ather', 'Revolt',
  'Ferrari', 'Porsche', 'Mercedez', 'Jaguar', 'Jeep', 'Renault', 'Mitsubishi',
  'Opel', 'Lexus', 'BYD', 'Bounce', 'Tork', 'ola', 'Isuzu', 'Fiat',
  'Daewoo', 'Eicher', 'Force_1', 'Hero electric', 'Hummer', 'Maserati', 'Maybach',
];

export const VEHICLE_IMAGES = [
  { name: 'Swift', file: 'Swift.png' },
  { name: 'Nexon', file: 'Nexon.png' },
  { name: 'Venue', file: 'Venue.png' },
  { name: 'Verna', file: 'Verna.png' },
  { name: 'XUV700', file: 'XUV700.png' },
  { name: 'Harrier', file: 'harrier.png' },
  { name: 'Activa', file: 'Activa.png' },
  { name: 'Pulsar', file: 'Pulsar.png' },
  { name: 'Splendor', file: 'Splendor.png' },
  { name: 'CT 100', file: 'CT 100.png' },
  { name: 'KTM', file: 'KTM.png' },
  { name: 'Kawasaki', file: 'kawasaki.png' },
  { name: 'Citroen', file: 'Citroen.png' },
  { name: 'MG Comet', file: 'MG comet.png' },
  { name: 'Toyota', file: 'Toyota.png' },
];

export const CHARACTER_IMAGES = [
  { name: 'Brand Ambassador', file: '/brand-ambassador.png' },
  { name: 'Motor Expert', file: '/motor-expert.png' },
  { name: 'Life Expert', file: '/life-expert.png' },
  { name: 'AI Assistant', file: '/ai-assistant.png' },
  { name: 'Indian Family', file: '/indian-family.svg' },
  { name: 'Chatbot Avatar', file: '/chatbot-avatar.png' },
];

export const ACKO_BRAND_LOGOS = [
  { name: 'Master Logo', file: '/brand-logo/acko-master.svg' },
  { name: 'Full White', file: '/brand-logo/acko-full-white.svg' },
  { name: 'Full Black', file: '/brand-logo/acko-full-black.svg' },
  { name: 'White Text', file: '/brand-logo/acko-white-text.svg' },
];

export const OFFERING_IMAGES = [
  { name: 'Car Card', file: '/offerings/car-card.png' },
  { name: 'Bike Card', file: '/offerings/bike-card.png' },
  { name: 'Health Card', file: '/offerings/health-card.png' },
  { name: 'Life Card', file: '/offerings/life-card.png' },
  { name: 'Car Hero', file: '/offerings/car-hero.png' },
  { name: 'Bike Hero', file: '/offerings/bike-hero.png' },
  { name: 'Health Hero', file: '/offerings/health-hero-illustration.png' },
  { name: 'Life Hero', file: '/offerings/life-hero.png' },
  { name: 'App-first', file: '/offerings/App-first.svg' },
  { name: 'Award 1', file: '/offerings/award-1.svg' },
  { name: 'Award 2', file: '/offerings/award-2.svg' },
  { name: 'Travel', file: '/offerings/travel.png' },
  { name: 'Flight', file: '/offerings/flight.png' },
];

export const FOOTER_ICONS = [
  { name: 'Instagram', file: '/footer/instagram.svg' },
  { name: 'LinkedIn', file: '/footer/linkedin.svg' },
  { name: 'Twitter', file: '/footer/twitter.svg' },
  { name: 'YouTube', file: '/footer/youtube.svg' },
  { name: 'Facebook', file: '/footer/facebook.svg' },
  { name: 'IRDAI', file: '/footer/irdai.svg' },
  { name: 'PCI-DSS', file: '/footer/pci-dss.svg' },
  { name: 'FSSAI', file: '/footer/fssai.svg' },
];
