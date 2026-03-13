'use client';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Option } from '../../../lib/core/types';
import { assetPath } from '../../../lib/assetPath';
import { useMotorStore } from '../../../lib/motor/store';
import { MotorJourneyState, NcbPercentage } from '../../../lib/motor/types';
import { getMotorAddOns } from '../../../lib/motor/plans';
import Image from 'next/image';
import BaseSelectionCards, { type SelectionTheme } from '../../ds/SelectionCards';
import GradientBadge from '../../ds/GradientBadge';
import BaseTextInput from '../../ds/TextInput';
import type { InputTheme } from '../../ds/NumberInput';

const ADDON_ICONS: Record<string, string> = {
  engine_protection:     'Engine_protect.svg',
  extra_car_protection:  'Extra_car_protect.svg',
  consumables_cover:     'Consumables_cover.svg',
  ncb_protect:           'Discount.svg',
  return_to_invoice:     'Invoice.svg',
  personal_accident:     'Car Accident Cover.svg',
  passenger_protection:  'Passenger_cover.svg',
  paid_driver:           'Driver_Cover_Paid.svg',
  pillion_protection:    'pillon_bike_cover.svg',
  zero_dep:              'Zero Dep Car.svg',
  key_replacement:       'Key.svg',
  tyre_protection:       'Rotation-360.svg',
  rim_damage:            'Rotation-360.svg',
  roadside_assistance:   'Tools.svg',
  calamity_cover:        'calamities_cover.svg',
  war_terrorism:         'war_terrorism_cover.svg',
  rat_bite:              '24px Rat_Bite_Cover.svg',
  helmet_cover:          '24px Helemet_cover.svg',
};

/* ═══════════════════════════════════════════════
   SVG Icons for Motor
   ═══════════════════════════════════════════════ */

/* Maps icon key → public/icons/ filename */
const MOTOR_ICON_FILES: Record<string, string> = {
  car: 'Car.svg',
  bike: 'Bike.svg',
  scooter: 'Scooter.svg',
  shield: 'Car coverage.svg',
  shield_search: 'Third Party.svg',
  document: 'Policy document.svg',
  claim_doc: 'Claim_Document.svg',
  check: 'Tick.svg',
  clock: 'Time.svg',
  star: 'special_car_star.svg',
  new_car: 'New car.svg',
  new_bike: 'New Bike.svg',
  user: 'Profile.svg',
  building: 'industry.svg',
  forward: 'chevron right.svg',
  help: 'Customer service.svg',
  chat_bubble: 'Messages.svg',
  search: 'magnifier.svg',
  switch: 'Transfer policy.svg',
  fuel: 'Fuel.svg',
  petrol: 'Petrol.svg',
  diesel: 'Diesel.svg',
  electric: 'Flash.svg',
  cng: 'CNG.svg',
  upload: 'Document received.svg',
  download: 'Download.svg',
  refresh: 'Refresh.svg',
  map_pin: 'Location.svg',
  phone: 'Phone.svg',
  camera: 'Camera.svg',
  garage: 'Garage.svg',
  towing: 'Towing.svg',
  claim: 'Claim.svg',
  zero_dep: 'Zero Dep Car.svg',
  engine: 'Engine_protect.svg',
  passenger: 'Passenger_Protection.svg',
  theft: 'Theft_cover.svg',
  consumables: 'Consumables_cover.svg',
  police: 'Police.svg',
  renew: 'Renew.svg',
  payment: 'Payment.svg',
  pdf: 'PDF file.svg',
  edit: 'Edit.svg',
  policy: 'Policy.svg',
  add_on: 'add-on.svg',
  compare: 'Compare.svg',
  discount: 'Discount.svg',
  gift: 'Gift.svg',
  key: 'Key.svg',
  mail: 'Mail.svg',
  notification: 'Notification.svg',
  print: 'Print.svg',
  profile: 'Profile.svg',
  settings: 'settings.svg',
  share: 'Share.svg',
  trash: 'Delete.svg',
  wallet: 'wallet.svg',
  accident: 'Car_accident.svg',
  bike_accident: 'Bike_Accident.svg',
  broken_glass: 'Broken Car Glass.svg',
  commercial_car: 'Commercial Use_Taxi_car.svg',
  commercial_bike: 'Commercial Use_Taxi_bike.svg',
  extra_car_protect: 'Extra_car_protect.svg',
  fire: 'Fire Accident Cover.svg',
  used_car: 'Used_car.svg',
  sold_car: 'Sold_car.svg',
  fastag: 'Fastag.svg',
};

function MotorIcon({ icon, className = 'w-6 h-6' }: { icon: string; className?: string }) {
  const file = MOTOR_ICON_FILES[icon];
  if (file) {
    return (
      <img
        src={assetPath(`/icons/${encodeURIComponent(file)}`)}
        alt={icon}
        className={className}
        style={{ filter: 'var(--aura-icon-filter)', opacity: 'var(--aura-icon-opacity)' as any }}
      />
    );
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827m0 0v.75m0-3.75h.008v.008H12v-.008z" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   Selection Cards (Aura version) — DS base
   ═══════════════════════════════════════════════ */

const AURA_THEME: SelectionTheme = {
  surface: 'var(--aura-surface)',
  surfaceSelected: 'var(--aura-surface-2)',
  surface2: 'var(--aura-surface-2)',
  border: 'var(--aura-border)',
  borderSelected: '#A855F7',
  text: 'var(--aura-text)',
  textMuted: 'var(--aura-text-subtle)',
};

function auraRenderIcon(icon: string, className?: string) {
  return <MotorIcon icon={icon} className={`${className || 'w-6 h-6'} text-[#C084FC]`} />;
}

function auraRenderLogo(logoUrl: string, label: string, className?: string) {
  return <img src={assetPath(logoUrl)} alt={label} className={className || 'w-7 h-7 object-contain'} />;
}

export function MotorSelectionCards({ options, onSelect }: { options: Option[]; onSelect: (id: string) => void }) {
  return (
    <BaseSelectionCards
      options={options}
      onSelect={onSelect}
      renderIcon={auraRenderIcon}
      renderLogo={auraRenderLogo}
      theme={AURA_THEME}
    />
  );
}

/* ═══════════════════════════════════════════════
   Vehicle Registration Input
   ═══════════════════════════════════════════════ */

export function VehicleRegInput({ placeholder, onSubmit }: { placeholder?: string; onSubmit: (value: string) => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const formatRegNumber = (raw: string): string => {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    // Format: XX 00 XX 0000
    if (clean.length <= 2) return clean;
    if (clean.length <= 4) return `${clean.slice(0, 2)} ${clean.slice(2)}`;
    if (clean.length <= 6) return `${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4)}`;
    return `${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 6)} ${clean.slice(6, 10)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRegNumber(e.target.value);
    setValue(formatted);
    setError('');
  };

  const handleSubmit = () => {
    const clean = value.replace(/\s/g, '');
    if (clean.length < 5) {
      setError('Please enter a valid registration number');
      return;
    }
    onSubmit(value);
  };

  return (
    <div className="max-w-sm">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-5 bg-blue-600 rounded-sm flex items-center justify-center">
          <span className="text-[var(--aura-text)] text-[8px] font-bold">IND</span>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={placeholder || 'MH 04 EQ 4392'}
          className="w-full pl-16 pr-4 py-4 bg-[var(--aura-surface-2)] border border-[var(--aura-border)] rounded-xl text-[18px] font-semibold text-[var(--aura-text)] placeholder:text-[var(--aura-text-subtle)] focus:outline-none focus:border-[#A855F7] focus:bg-[var(--aura-surface-2)] transition-colors tracking-wider uppercase"
          maxLength={16}
          autoComplete="off"
        />
      </div>
      {error && <p className="text-[12px] text-red-400 mt-1.5">{error}</p>}
      <button
        onClick={handleSubmit}
        style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
        className="mt-4 w-full py-3.5 rounded-xl text-[15px] font-semibold hover:opacity-90 transition-colors active:scale-[0.97]"
      >
        Find my {useMotorStore.getState().vehicleType === 'bike' ? 'bike' : 'car'}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Generic Text / Number Input — DS base
   ═══════════════════════════════════════════════ */

const AURA_INPUT_THEME: InputTheme = {
  inputBg: 'var(--aura-surface-2)',
  inputBorder: 'var(--aura-border)',
  inputBorderFocus: '#A855F7',
  inputText: 'var(--aura-text)',
  buttonBg: 'var(--btn-primary-bg)',
  buttonText: 'var(--btn-primary-text)',
  buttonShadow: 'var(--btn-primary-shadow)',
};

export function MotorTextInput({
  placeholder,
  inputType = 'text',
  onSubmit,
  validate,
  maxLength,
}: {
  placeholder?: string;
  inputType?: 'text' | 'number' | 'tel';
  onSubmit: (value: string) => void;
  validate?: (value: string) => string | null;
  maxLength?: number;
}) {
  return (
    <BaseTextInput
      placeholder={placeholder || 'Type here...'}
      inputType={inputType}
      onSubmit={onSubmit}
      validate={validate}
      maxLength={maxLength}
      theme={AURA_INPUT_THEME}
    />
  );
}

/* ═══════════════════════════════════════════════
   Progressive Loader — Finding your vehicle
   ═══════════════════════════════════════════════ */

const LOADING_STAGES = [
  { message: 'Searching Vaahan portal...', duration: 1500 },
  { message: 'Fetching vehicle details...', duration: 1500 },
  { message: 'Checking registration certificate...', duration: 1200 },
  { message: 'Loading existing policy data...', duration: 1200 },
  { message: 'Almost there...', duration: 800 },
];

export function ProgressiveLoader({ onComplete }: { onComplete: (result: 'success' | 'failed') => void }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [stagesComplete, setStagesComplete] = useState(false);
  const { vehicleType, registrationNumber } = useMotorStore();

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const runStages = async () => {
      for (let i = 0; i < LOADING_STAGES.length; i++) {
        await new Promise<void>((resolve) => {
          timeout = setTimeout(() => {
            setCurrentStage(i + 1);
            resolve();
          }, LOADING_STAGES[i].duration);
        });
      }
      setStagesComplete(true);
      // Simulate: 85% success rate
      setTimeout(() => {
        onComplete(Math.random() > 0.15 ? 'success' : 'failed');
      }, 600);
    };

    runStages();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-sm"
    >
      {/* Vehicle reg plate */}
      <div className="bg-[var(--aura-surface)] border border-[var(--aura-border)] rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#A855F7]/15 flex items-center justify-center">
            <MotorIcon icon={vehicleType === 'bike' ? 'bike' : 'car'} className="w-5 h-5 text-[#C084FC]" />
          </div>
          <div>
            <p className="text-[11px] text-[var(--aura-text-subtle)] uppercase tracking-wider">Registration</p>
            <p className="text-[16px] font-bold text-[var(--aura-text)] tracking-wider">{registrationNumber || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Loading stages */}
      <div className="space-y-3">
        {LOADING_STAGES.map((stage, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: i < currentStage ? 1 : 0.3, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex items-center gap-3"
          >
            {i < currentStage ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0"
              >
                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </motion.div>
            ) : i === currentStage ? (
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-[#A855F7]/30 border-t-[#A855F7] rounded-full"
                />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-[var(--aura-surface)] flex-shrink-0" />
            )}
            <span className={`text-[13px] ${i < currentStage ? 'text-[var(--aura-text-muted)]' : i === currentStage ? 'text-[var(--aura-text)]' : 'text-[var(--aura-text-subtle)]'}`}>
              {stage.message}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1 bg-[var(--aura-surface-2)] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#A855F7] to-[#C084FC] rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: stagesComplete ? '100%' : `${(currentStage / LOADING_STAGES.length) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   Vehicle Details Card — After successful fetch
   ═══════════════════════════════════════════════ */

const VEHICLE_IMAGE_MAP: Record<string, string> = {
  'Maruti Suzuki': `${BASE}/car-images/Swift.png`,
  'Hyundai': `${BASE}/car-images/Venue.png`,
  'Tata': `${BASE}/car-images/Nexon.png`,
  'Kia': `${BASE}/car-images/Verna.png`,
  'Mahindra': `${BASE}/car-images/XUV700.png`,
  'Toyota': `${BASE}/car-images/Toyota.png`,
  'Honda': `${BASE}/car-images/Citroen.png`,
  'MG': `${BASE}/car-images/MG comet.png`,
  'Volkswagen': `${BASE}/car-images/Citroen.png`,
  'Skoda': `${BASE}/car-images/Verna.png`,
  'BMW': `${BASE}/car-images/harrier.png`,
  'Audi': `${BASE}/car-images/harrier.png`,
  'Mercedes-Benz': `${BASE}/car-images/harrier.png`,
  'Jeep': `${BASE}/car-images/XUV700.png`,
  'Renault': `${BASE}/car-images/Citroen.png`,
  'Nissan': `${BASE}/car-images/Venue.png`,
};

const BIKE_IMAGE_MAP: Record<string, string> = {
  'Hero': `${BASE}/car-images/Splendor.png`,
  'Honda': `${BASE}/car-images/Activa.png`,
  'Bajaj': `${BASE}/car-images/Pulsar.png`,
  'TVS': `${BASE}/car-images/CT 100.png`,
  'Royal Enfield': `${BASE}/car-images/KTM.png`,
  'Yamaha': `${BASE}/car-images/Pulsar.png`,
  'Suzuki': `${BASE}/car-images/Activa.png`,
  'KTM': `${BASE}/car-images/KTM.png`,
  'Kawasaki': `${BASE}/car-images/kawasaki.png`,
  'Ola': `${BASE}/car-images/Activa.png`,
  'Ather': `${BASE}/car-images/Activa.png`,
};

function getVehicleImage(make: string, vehicleType: string): string {
  const map = vehicleType === 'bike' ? BIKE_IMAGE_MAP : VEHICLE_IMAGE_MAP;
  return assetPath(map[make] || (vehicleType === 'bike' ? `${BASE}/car-images/Splendor.png` : `${BASE}/car-images/Swift.png`));
}

export function VehicleDetailsCard({ onConfirm, onRetry }: { onConfirm: () => void; onRetry: () => void }) {
  const state = useMotorStore.getState() as MotorJourneyState;
  const v = state.vehicleData;
  const p = state.previousPolicy;
  const [confirmed, setConfirmed] = useState(false);
  const vehicleImg = getVehicleImage(v.make, state.vehicleType || 'car');
  const isLight = state.theme === 'light';

  const formatRegistration = (value: string) => {
    const clean = value.replace(/\s+/g, '').toUpperCase();
    const m = clean.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{1,4})$/);
    return m ? `${m[1]} ${m[2]} ${m[3]} ${m[4]}` : value;
  };

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => onConfirm(), 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-sm"
    >
      <div
        className="rounded-xl overflow-hidden shadow-[0_4px_10px_-2px_rgba(54,53,76,0.08)]"
        style={{
          background: isLight ? '#FFFFFF' : 'var(--aura-surface)',
          border: `1px solid ${isLight ? 'rgba(4,2,34,0.08)' : 'var(--aura-border)'}`,
        }}
      >
        {/* Vehicle Header */}
        <div
          className="px-4 py-4"
          style={{ background: isLight ? '#EFE9FB' : 'var(--aura-surface-2)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-[72px] h-[72px] rounded-xl flex items-center justify-center overflow-hidden p-1"
              style={{ background: '#FFFFFF' }}
            >
              <img src={vehicleImg} alt={`${v.make} ${v.model}`} className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-[18px] font-semibold" style={{ color: isLight ? '#040222' : 'var(--aura-text)' }}>
                {v.make} {v.model}
              </h3>
              <p className="text-[12px] mt-1" style={{ color: isLight ? '#5B5675' : 'var(--aura-text-muted)' }}>
                {v.variant} • {String(v.fuelType || '').toUpperCase()} • {v.registrationYear}
              </p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="px-4 py-4 space-y-4">
          <div>
            <p className="text-[14px]" style={{ color: isLight ? '#5B5675' : 'var(--aura-text-muted)' }}>Registration</p>
            <p className="text-[14px] font-semibold mt-1 tracking-[0.01em]" style={{ color: isLight ? '#040222' : 'var(--aura-text)' }}>
              {formatRegistration(state.registrationNumber)}
            </p>
          </div>
          {p.insurer && (
            <div>
              <p className="text-[14px]" style={{ color: isLight ? '#5B5675' : 'var(--aura-text-muted)' }}>Current Insurance</p>
              <p className="text-[14px] font-semibold mt-1" style={{ color: isLight ? '#040222' : 'var(--aura-text)' }}>{p.insurer}</p>
            </div>
          )}
          {p.expiryDate && (
            <div>
              <p className="text-[14px]" style={{ color: isLight ? '#5B5675' : 'var(--aura-text-muted)' }}>Policy expiry</p>
              <p className="text-[14px] font-semibold mt-1" style={{ color: isLight ? '#040222' : 'var(--aura-text)' }}>{p.expiryDate}</p>
            </div>
          )}
          {p.ncbPercentage > 0 && (
            <div>
              <p className="text-[14px]" style={{ color: isLight ? '#5B5675' : 'var(--aura-text-muted)' }}>NCB (No Claim Bonus)</p>
              <p className="text-[14px] font-semibold mt-1" style={{ color: isLight ? '#040222' : 'var(--aura-text)' }}>{p.ncbPercentage}%</p>
            </div>
          )}

          <div className="pt-1">
            <button
              onClick={handleConfirm}
              disabled={confirmed}
              style={{ background: isLight ? '#0A0A0F' : 'var(--btn-primary-bg)', color: isLight ? '#FFFFFF' : 'var(--btn-primary-text)', boxShadow: isLight ? undefined : 'var(--btn-primary-shadow)' }}
              className="w-full h-12 rounded-lg text-[15px] font-semibold hover:opacity-90 transition-colors active:scale-[0.97] disabled:opacity-60"
            >
              {confirmed ? 'Confirmed' : 'This is correct'}
            </button>

            <button
              onClick={onRetry}
              className="mt-2 w-full h-10 text-[13px] font-medium transition-colors"
              style={{ color: isLight ? '#191919' : 'var(--aura-text-muted)' }}
            >
              This is not my vehicle
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   Brand Selector — Logo grid (bottom sheet)
   ═══════════════════════════════════════════════ */

const CAR_BRANDS = [
  'Maruti Suzuki', 'Hyundai', 'Tata', 'Kia', 'Mahindra', 'Toyota',
  'Honda', 'MG', 'Volkswagen', 'Skoda', 'Renault', 'Nissan',
  'Jeep', 'Mercedes-Benz', 'BMW', 'Audi',
];

const BIKE_BRANDS = [
  'Hero', 'Honda', 'Bajaj', 'TVS', 'Royal Enfield', 'Yamaha',
  'Suzuki', 'KTM', 'Kawasaki', 'Jawa', 'Ola', 'Ather',
  'Revolt', 'Aprilia', 'Benelli', 'BMW Motorrad',
];

const BRAND_LOGO_MAP: Record<string, string> = {
  'Maruti Suzuki': `${BASE}/logos/Suzuki.svg`,
  'Hyundai': `${BASE}/logos/Hyundai.svg`,
  'Tata': `${BASE}/logos/TATA.svg`,
  'Kia': `${BASE}/logos/Kia.svg`,
  'Mahindra': `${BASE}/logos/Mahindra.svg`,
  'Toyota': `${BASE}/logos/TATA.svg`,
  'Honda': `${BASE}/logos/Honda.svg`,
  'MG': `${BASE}/logos/MG.svg`,
  'Volkswagen': `${BASE}/logos/Volvo.svg`,
  'Skoda': `${BASE}/logos/Opel.svg`,
  'Renault': `${BASE}/logos/Renault.svg`,
  'Nissan': `${BASE}/logos/Mitsubishi.svg`,
  'Jeep': `${BASE}/logos/Jeep.svg`,
  'Mercedes-Benz': `${BASE}/logos/Mercedez.svg`,
  'BMW': `${BASE}/logos/BMW.svg`,
  'Audi': `${BASE}/logos/Audi.svg`,
  'Hero': `${BASE}/logos/Hero.svg`,
  'Bajaj': `${BASE}/logos/Bajaj.svg`,
  'TVS': `${BASE}/logos/TVS.svg`,
  'Royal Enfield': `${BASE}/logos/Royal Enfield.svg`,
  'Yamaha': `${BASE}/logos/Suzuki.svg`,
  'Suzuki': `${BASE}/logos/Suzuki.svg`,
  'KTM': `${BASE}/logos/BMW.svg`,
  'Kawasaki': `${BASE}/logos/Honda.svg`,
  'Jawa': `${BASE}/logos/Mahindra.svg`,
  'Ola': `${BASE}/logos/ola.svg`,
  'Ather': `${BASE}/logos/Ather.svg`,
  'Revolt': `${BASE}/logos/Revolt.svg`,
  'Aprilia': `${BASE}/logos/Ferrari.svg`,
  'Benelli': `${BASE}/logos/Ferrari.svg`,
  'BMW Motorrad': `${BASE}/logos/BMW.svg`,
};

export function BrandSelector({ onSelect }: { onSelect: (brand: string) => void }) {
  const vehicleType = useMotorStore.getState().vehicleType;
  const brands = vehicleType === 'bike' ? BIKE_BRANDS : CAR_BRANDS;
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = search
    ? brands.filter(b => b.toLowerCase().includes(search.toLowerCase()))
    : brands;

  const handleSelect = (brand: string) => {
    setSelected(brand);
    setTimeout(() => onSelect(brand), 300);
  };

  return (
    <div>
      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--aura-text-subtle)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${vehicleType === 'bike' ? 'bike' : 'car'} brand`}
          className="w-full pl-9 pr-4 py-2.5 bg-[var(--aura-surface-2)] border border-[var(--aura-border)] rounded-xl text-[14px] text-[var(--aura-text)] placeholder:text-[var(--aura-text-subtle)] focus:outline-none focus:border-[#A855F7]/50 transition-colors"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {filtered.map((brand, i) => (
          <motion.button
            key={brand}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => handleSelect(brand)}
            className={`
              flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border transition-all duration-200 active:scale-[0.95]
              ${selected === brand
                ? 'border-[#A855F7] bg-[#A855F7]/10 ring-1 ring-[#A855F7]/30'
                : 'border-[var(--aura-border)] bg-[var(--aura-surface)] hover:bg-[var(--aura-surface-2)]'
              }
            `}
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--aura-surface-2)] flex items-center justify-center overflow-hidden">
              {BRAND_LOGO_MAP[brand] ? (
                <img src={assetPath(BRAND_LOGO_MAP[brand])} alt={brand} className="w-7 h-7 object-contain" />
              ) : (
                <span className="text-[11px] font-bold text-[var(--aura-text-muted)]">{brand.slice(0, 2)}</span>
              )}
            </div>
            <span className="text-[11px] font-medium text-[var(--aura-text)] text-center leading-tight">{brand}</span>
            {selected === brand && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#A855F7] flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-[var(--aura-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Model Selector — Clean list with radio
   ═══════════════════════════════════════════════ */

const CAR_MODELS: Record<string, string[]> = {
  'Maruti Suzuki': ['Swift', 'Swift Dzire', 'Baleno', 'Brezza', 'WagonR', 'Ertiga', 'Celerio', 'Alto K10', 'Fronx', 'Jimny', 'Grand Vitara', 'XL6', 'Ignis', 'S-Presso', 'Ciaz', 'Invicto'],
  'Hyundai': ['i20', 'Creta', 'Venue', 'i10 Nios', 'Verna', 'Tucson', 'Alcazar', 'Aura', 'Exter', 'Ioniq 5'],
  'Tata': ['Nexon', 'Punch', 'Altroz', 'Harrier', 'Safari', 'Tiago', 'Tigor', 'Nexon EV', 'Punch EV', 'Curvv'],
  'Kia': ['Seltos', 'Sonet', 'Carens', 'EV6', 'Carnival'],
  'Mahindra': ['Thar', 'XUV700', 'Scorpio-N', 'XUV400', 'XUV300', 'Bolero', 'Bolero Neo', 'XUV.e8'],
  'Toyota': ['Innova Crysta', 'Fortuner', 'Urban Cruiser Hyryder', 'Glanza', 'Camry', 'Vellfire', 'Land Cruiser'],
  'Honda': ['City', 'Amaze', 'Elevate', 'WR-V'],
  'MG': ['Hector', 'Astor', 'ZS EV', 'Gloster', 'Comet EV'],
  'Volkswagen': ['Taigun', 'Virtus', 'Tiguan'],
  'Skoda': ['Slavia', 'Kushaq', 'Superb', 'Kodiaq'],
};

const BIKE_MODELS: Record<string, string[]> = {
  'Hero': ['Splendor Plus', 'HF Deluxe', 'Xtreme 160R', 'Xpulse 200', 'Glamour', 'Passion Pro', 'Pleasure Plus', 'Destini 125', 'Mavrick 440'],
  'Honda': ['Activa 6G', 'Shine', 'Unicorn', 'CB350', 'Hornet 2.0', 'CB200X', 'Dio', 'SP 125'],
  'Bajaj': ['Pulsar NS200', 'Pulsar 150', 'Dominar 400', 'Avenger', 'Platina', 'Chetak'],
  'TVS': ['Apache RTR 200', 'Jupiter', 'Raider', 'Ronin', 'Ntorq', 'Star City Plus', 'iQube'],
  'Royal Enfield': ['Classic 350', 'Hunter 350', 'Meteor 350', 'Himalayan', 'Bullet 350', 'Continental GT 650', 'Interceptor 650', 'Super Meteor 650', 'Shotgun 650'],
  'Yamaha': ['MT-15', 'R15', 'FZ-S', 'Ray ZR', 'Fascino', 'Aerox'],
};

export function ModelSelector({ onSelect }: { onSelect: (model: string) => void }) {
  const state = useMotorStore.getState() as MotorJourneyState;
  const brand = state.vehicleData.make;
  const isVehicleBike = state.vehicleType === 'bike';
  const models = (isVehicleBike ? BIKE_MODELS : CAR_MODELS)[brand] || ['Other'];
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = search
    ? models.filter(m => m.toLowerCase().includes(search.toLowerCase()))
    : models;

  const handleSelect = (model: string) => {
    setSelected(model);
    setTimeout(() => onSelect(model), 300);
  };

  return (
    <div>
      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--aura-text-subtle)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${brand} model`}
          className="w-full pl-9 pr-4 py-2.5 bg-[var(--aura-surface-2)] border border-[var(--aura-border)] rounded-xl text-[14px] text-[var(--aura-text)] placeholder:text-[var(--aura-text-subtle)] focus:outline-none focus:border-[#A855F7]/50 transition-colors"
          autoFocus
        />
      </div>
      <div className="space-y-1">
        {filtered.map((model, i) => (
          <motion.button
            key={model}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.025 }}
            onClick={() => handleSelect(model)}
            className={`
              w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 active:scale-[0.98]
              ${selected === model
                ? 'border-[#A855F7] bg-[#A855F7]/8'
                : 'border-transparent hover:bg-[var(--aura-surface-2)]'
              }
            `}
          >
            <span className="text-[14px] font-medium text-[var(--aura-text)]">{model}</span>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
              ${selected === model ? 'border-[#A855F7] bg-[#A855F7]' : 'border-[var(--aura-border-strong)]'}
            `}>
              {selected === model && (
                <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-3 h-3 text-[var(--aura-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </motion.svg>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Variant Selector — Fuel tabs + list
   ═══════════════════════════════════════════════ */

const FUEL_VARIANTS: Record<string, string[]> = {
  'Petrol': ['Smart', 'Smart (O)', 'Pure', 'Pure (O)', 'Pure Plus', 'Pure Plus S', 'Pure Plus AT', 'Pure Plus S Dark'],
  'Diesel': ['Smart', 'Smart (O)', 'Pure', 'Pure (O)', 'Pure Plus', 'Pure Plus S', 'Pure Plus AT'],
  'Electric': ['Prime', 'Prime (O)', 'Creative', 'Creative Pro', 'Empowered', 'Empowered+'],
  'CNG': ['Smart', 'Smart S-CNG', 'Pure', 'Pure S-CNG'],
};

const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'CNG'];

export function VariantSelector({ onSelect }: { onSelect: (variant: string) => void }) {
  const vehicleType = useMotorStore((s) => s.vehicleType);
  const vehicleData = useMotorStore((s) => s.vehicleData);
  const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
  const existingFuel = vehicleData.fuelType ? capitalize(vehicleData.fuelType) : '';
  const existingVariant = vehicleData.variant;
  const [activeFuel, setActiveFuel] = useState<string>(existingFuel || 'Petrol');
  const isBike = vehicleType === 'bike';

  const fuelTypes = isBike ? ['Petrol', 'Electric'] : FUEL_TYPES;
  const variants = FUEL_VARIANTS[activeFuel] || FUEL_VARIANTS['Petrol'];

  const [selected, setSelected] = useState<string | null>(
    existingVariant && variants.includes(existingVariant) ? existingVariant : null
  );

  const handleSelect = (variant: string) => {
    setSelected(variant);
    setTimeout(() => onSelect(variant), 300);
  };

  return (
    <div>
      <div className="flex gap-1.5 mb-3 p-1 bg-[var(--aura-surface)] rounded-xl">
        {fuelTypes.map(fuel => (
          <button
            key={fuel}
            onClick={() => {
              setActiveFuel(fuel);
              const newVariants = FUEL_VARIANTS[fuel] || [];
              setSelected(existingVariant && newVariants.includes(existingVariant) ? existingVariant : null);
            }}
            className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all
              ${activeFuel === fuel
                ? 'bg-white text-[#1C0B47] shadow-sm'
                : 'text-[var(--aura-text-subtle)] hover:text-[var(--aura-text-muted)]'
              }
            `}
          >
            {fuel}
          </button>
        ))}
      </div>
      {!selected && (
        <p className="text-[11px] text-[var(--aura-text-subtle)] mb-2 px-1">Select your {vehicleData.model || 'car'}&apos;s fuel type to see variants</p>
      )}
      <div className="space-y-1">
        {variants.map((variant, i) => (
          <motion.button
            key={variant}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.025 }}
            onClick={() => handleSelect(variant)}
            className={`
              w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 active:scale-[0.98]
              ${selected === variant
                ? 'bg-[#A855F7]/8 border border-[#A855F7]'
                : 'border border-transparent hover:bg-[var(--aura-surface-2)]'
              }
            `}
          >
            <span className="text-[14px] font-medium text-[var(--aura-text)]">{variant}</span>
            <svg className="w-4 h-4 text-[var(--aura-text-subtle)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Year Selector — Month + Year grid
   ═══════════════════════════════════════════════ */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function YearSelector({ onSelect }: { onSelect: (year: string) => void }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
  };

  const handleSubmit = () => {
    if (selectedYear) {
      onSelect(String(selectedYear));
    }
  };

  const availableMonths = selectedYear === currentYear
    ? MONTHS.slice(0, currentMonth + 1)
    : MONTHS;

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <select
            value={selectedYear ?? ''}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full px-3 py-2.5 bg-[var(--aura-surface-2)] border border-[#A855F7]/30 rounded-xl text-[14px] text-[var(--aura-text)] focus:outline-none focus:border-[#A855F7] cursor-pointer pr-8 appearance-none"
            style={{ colorScheme: 'dark' }}
          >
            <option value="" disabled>Year</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--aura-text-muted)] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
        <div className="relative flex-1">
          <select
            value={selectedMonth ?? ''}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2.5 bg-[var(--aura-surface-2)] border border-[#A855F7]/30 rounded-xl text-[14px] text-[var(--aura-text)] focus:outline-none focus:border-[#A855F7] cursor-pointer pr-8 appearance-none"
            style={{ colorScheme: 'dark' }}
          >
            <option value="" disabled>Month</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--aura-text-muted)] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {years.map((year, i) => (
          <motion.button
            key={year}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.012 }}
            onClick={() => handleYearSelect(year)}
            className={`
              py-2.5 rounded-lg text-center transition-all duration-200 active:scale-[0.95]
              ${selectedYear === year
                ? 'bg-[#A855F7] text-white font-bold shadow-lg shadow-[#A855F7]/25'
                : 'bg-[var(--aura-surface)] text-[var(--aura-text-muted)] hover:bg-[var(--aura-surface-2)] border border-[var(--aura-border)]'
              }
            `}
          >
            <span className="text-[13px]">{year}</span>
          </motion.button>
        ))}
      </div>

      {selectedYear && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleSubmit}
          style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
          className="mt-3 w-full py-3 rounded-xl text-[14px] font-semibold hover:opacity-90 transition-colors active:scale-[0.97]"
        >
          Continue with {selectedYear}{selectedMonth ? ` · ${selectedMonth}` : ''}
        </motion.button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   NCB Selector — No Claim Bonus percentage
   ═══════════════════════════════════════════════ */

const NCB_OPTIONS: { value: NcbPercentage; label: string; description: string }[] = [
  { value: 0, label: '0%', description: 'First policy / Made a claim' },
  { value: 20, label: '20%', description: '1 claim-free year' },
  { value: 25, label: '25%', description: '2 claim-free years' },
  { value: 35, label: '35%', description: '3 claim-free years' },
  { value: 45, label: '45%', description: '4 claim-free years' },
  { value: 50, label: '50%', description: '5+ claim-free years' },
];

export function NcbSelector({ onSelect }: { onSelect: (ncb: string) => void }) {
  const [selected, setSelected] = useState<NcbPercentage | null>(null);

  const handleSelect = (ncb: NcbPercentage) => {
    setSelected(ncb);
    setTimeout(() => onSelect(String(ncb)), 300);
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {NCB_OPTIONS.map((opt, i) => (
        <motion.button
          key={opt.value}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.04 }}
          onClick={() => handleSelect(opt.value)}
          className={`
            relative flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border transition-all duration-200 active:scale-[0.95]
            ${selected === opt.value
              ? 'border-[#A855F7] bg-[#A855F7]/20'
              : 'border-[var(--aura-border)] bg-[var(--aura-surface)] hover:bg-[var(--aura-surface-2)]'
            }
          `}
        >
          {selected === opt.value && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#A855F7] flex items-center justify-center"
            >
              <svg className="w-2.5 h-2.5 text-[var(--aura-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </motion.div>
          )}
          <span className={`text-[20px] font-bold leading-none ${selected === opt.value ? 'text-[#C084FC]' : 'text-[var(--aura-text)]'}`}>
            {opt.label}
          </span>
          <span className="text-[10px] text-[var(--aura-text-subtle)] text-center leading-tight">{opt.description}</span>
        </motion.button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   NCB Reward Animation
   ═══════════════════════════════════════════════ */

export function NcbReward({ onContinue }: { onContinue: () => void }) {
  const state = useMotorStore.getState() as MotorJourneyState;
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 300);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-sm"
    >
      <div className="bg-gradient-to-br from-green-500/20 to-green-400/10 border border-green-400/20 rounded-2xl p-5 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={show ? { scale: 1 } : {}}
          transition={{ type: 'spring', damping: 12 }}
          className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3"
        >
          <span className="text-3xl">🎉</span>
        </motion.div>
        <h3 className="text-[18px] font-bold text-[var(--aura-text)] mb-1">NCB Reward Applied!</h3>
        <p className="text-[14px] text-[var(--aura-text-muted)] mb-3">
          {state.newNcbPercentage}% discount on your Own Damage premium
        </p>
        <div className="bg-[var(--aura-surface-2)] rounded-xl p-3">
          <p className="text-[12px] text-[var(--aura-text-subtle)]">For staying claim-free</p>
          <p className="text-[20px] font-bold text-green-400">{state.newNcbPercentage}% OFF</p>
        </div>
      </div>
      <button
        onClick={onContinue}
        style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
        className="mt-4 w-full py-3.5 rounded-xl text-[15px] font-semibold hover:opacity-90 transition-colors active:scale-[0.97]"
      >
        Continue
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   Insurer Selector — Clean list with radio
   ═══════════════════════════════════════════════ */

const INSURERS = [
  'ACKO General Insurance', 'TATA AIG', 'ICICI Lombard', 'Bajaj Allianz',
  'HDFC Ergo', 'New India Assurance', 'United India Insurance',
  'National Insurance', 'Oriental Insurance', 'SBI General',
  'Reliance General', 'Royal Sundaram', 'Digit Insurance', 'Other',
];

export function InsurerSelector({ onSelect }: { onSelect: (insurer: string) => void }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = search
    ? INSURERS.filter(i => i.toLowerCase().includes(search.toLowerCase()))
    : INSURERS;

  const handleSelect = (insurer: string) => {
    setSelected(insurer);
    setTimeout(() => onSelect(insurer), 300);
  };

  return (
    <div>
      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--aura-text-subtle)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search insurer"
          className="w-full pl-9 pr-4 py-2.5 bg-[var(--aura-surface-2)] border border-[var(--aura-border)] rounded-xl text-[14px] text-[var(--aura-text)] placeholder:text-[var(--aura-text-subtle)] focus:outline-none focus:border-[#A855F7]/50 transition-colors"
          autoFocus
        />
      </div>
      <div className="space-y-1">
        {filtered.map((insurer, i) => (
          <motion.button
            key={insurer}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => handleSelect(insurer)}
            className={`
              w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 active:scale-[0.98]
              ${selected === insurer
                ? 'bg-[#A855F7]/8 border border-[#A855F7]'
                : 'border border-transparent hover:bg-[var(--aura-surface-2)]'
              }
            `}
          >
            <span className="text-[14px] font-medium text-[var(--aura-text)]">{insurer}</span>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
              ${selected === insurer ? 'border-[#A855F7] bg-[#A855F7]' : 'border-[var(--aura-border-strong)]'}
            `}>
              {selected === insurer && (
                <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-3 h-3 text-[var(--aura-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </motion.svg>
              )}
            </div>
          </motion.button>
        ))}
      </div>
      <button
        onClick={() => onSelect('skip')}
        className="mt-3 w-full py-2.5 text-[12px] text-[var(--aura-text-subtle)] hover:text-[var(--aura-text-muted)] transition-colors"
      >
        Skip this step
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Editable Summary — Pre-quote review
   ═══════════════════════════════════════════════ */

export function EditableSummary({ onConfirm, onEditField, isBrandNew }: {
  onConfirm: () => void;
  onEditField?: (stepId: string) => void;
  isBrandNew?: boolean;
}) {
  const state = useMotorStore.getState() as MotorJourneyState;
  const v = state.vehicleData;
  const vType = state.vehicleType === 'bike' ? 'Bike' : 'Car';

  const editable = !!onEditField;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-sm"
    >
      <div className="bg-[var(--aura-surface)] border border-[var(--aura-border)] rounded-2xl overflow-hidden">
        <div className="bg-[var(--aura-surface-2)] px-5 py-3 border-b border-[var(--aura-border)]">
          <h3 className="text-[14px] font-semibold text-[var(--aura-text)]">Vehicle Summary</h3>
        </div>
        <div className="px-5 py-4 space-y-3">
          <SummaryRow label="Vehicle Type" value={vType} />
          {v.make && <SummaryRow label="Brand" value={v.make} editable={editable} onEdit={() => onEditField?.('manual_entry.select_brand')} />}
          {v.model && <SummaryRow label="Model" value={v.model} editable={editable} onEdit={() => onEditField?.('manual_entry.select_model')} />}
          {v.variant && <SummaryRow label="Variant" value={v.variant} editable={editable} onEdit={() => onEditField?.('manual_entry.select_variant')} />}
          {v.fuelType && <SummaryRow label="Fuel" value={v.fuelType} editable={editable} onEdit={() => onEditField?.('manual_entry.select_fuel')} />}
          {!isBrandNew && v.registrationYear && <SummaryRow label="Reg. Year" value={String(v.registrationYear)} />}
          {!isBrandNew && state.registrationNumber && <SummaryRow label="Reg. Number" value={state.registrationNumber} />}
          {!isBrandNew && state.policyStatus && <SummaryRow label="Policy Status" value={state.policyStatus === 'active' ? 'Active' : 'Expired'} />}
          {!isBrandNew && state.previousPolicy.ncbPercentage > 0 && <SummaryRow label="NCB" value={`${state.previousPolicy.ncbPercentage}%`} highlight />}
        </div>
      </div>

      <button
        onClick={onConfirm}
        style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
        className="mt-4 w-full py-3.5 rounded-xl text-[15px] font-semibold hover:opacity-90 transition-colors active:scale-[0.97]"
      >
        View prices
      </button>
    </motion.div>
  );
}

const PencilIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
  </svg>
);

function SummaryRow({ label, value, highlight, editable, onEdit }: { label: string; value: string; highlight?: boolean; editable?: boolean; onEdit?: () => void }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[12px] text-[var(--aura-text-subtle)]">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-[13px] font-medium ${highlight ? 'text-green-400' : 'text-[var(--aura-text)]'}`}>{value}</span>
        {editable && onEdit && (
          <button onClick={onEdit} className="opacity-40 hover:opacity-80 transition-opacity p-0.5 text-[var(--aura-text)]">
            <PencilIcon />
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Rejection Screen
   ═══════════════════════════════════════════════ */

export function RejectionScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-sm text-center"
    >
      <div className="bg-red-500/10 border border-red-400/20 rounded-2xl p-6">
        <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="text-[16px] font-bold text-[var(--aura-text)] mb-2">Unable to insure</h3>
        <p className="text-[13px] text-[var(--aura-text-muted)]">
          We're currently unable to offer insurance for commercial vehicles. We'll notify you when this changes.
        </p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   Plan Calculator — Loading state with progress
   ═══════════════════════════════════════════════ */

const CALC_STAGES = [
  { message: 'Analyzing your vehicle details...', duration: 1000 },
  { message: 'Calculating Insured Declared Value...', duration: 1200 },
  { message: 'Fetching OD & TP premiums...', duration: 1000 },
  { message: 'Applying NCB discount...', duration: 800 },
  { message: 'Preparing your personalized plans...', duration: 1000 },
];

export function PlanCalculator({ onComplete }: { onComplete: (result: any) => void }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [stagesComplete, setStagesComplete] = useState(false);
  const { vehicleType, vehicleData, registrationNumber } = useMotorStore();

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const runStages = async () => {
      for (let i = 0; i < CALC_STAGES.length; i++) {
        await new Promise<void>((resolve) => {
          timeout = setTimeout(() => {
            setCurrentStage(i + 1);
            resolve();
          }, CALC_STAGES[i].duration);
        });
      }
      setStagesComplete(true);
      
      // Generate plans (import inline to avoid issues)
      setTimeout(async () => {
        try {
          const { getPlansForCombination, determinePlanCombination, calculateIDV } = await import('../../../lib/motor/plans');
          const state = useMotorStore.getState() as MotorJourneyState;
          
          const makePrice = 800000;
          const vehicleAge = vehicleData.registrationYear 
            ? new Date().getFullYear() - vehicleData.registrationYear 
            : 3;
          const idvData = calculateIDV(makePrice, vehicleAge);
          
          const combo = determinePlanCombination(state);
          const plans = getPlansForCombination(state, combo);
          
          onComplete({
            plans,
            idv: idvData.recommended,
            idvMin: idvData.min,
            idvMax: idvData.max,
          });
        } catch (error) {
          console.error('Error generating plans:', error);
          // Fallback: just complete with empty data
          onComplete({ plans: [], idv: 750000, idvMin: 675000, idvMax: 787500 });
        }
      }, 600);
    };

    runStages();
    return () => clearTimeout(timeout);
  }, [onComplete, vehicleData.registrationYear]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-sm"
    >
      {/* Vehicle card */}
      <div className="bg-[var(--aura-surface)] border border-[var(--aura-border)] rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#A855F7]/15 flex items-center justify-center">
            <MotorIcon icon={vehicleType === 'bike' ? 'bike' : 'car'} className="w-5 h-5 text-[#C084FC]" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[var(--aura-text)]">{vehicleData.make} {vehicleData.model}</p>
            <p className="text-[11px] text-[var(--aura-text-subtle)]">{vehicleData.variant} · {vehicleData.fuelType}</p>
          </div>
        </div>
      </div>

      {/* Calculation stages */}
      <div className="space-y-3">
        {CALC_STAGES.map((stage, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: i < currentStage ? 1 : 0.3, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex items-center gap-3"
          >
            {i < currentStage ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0"
              >
                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </motion.div>
            ) : i === currentStage ? (
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-[#A855F7]/30 border-t-[#A855F7] rounded-full"
                />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-[var(--aura-surface)] flex-shrink-0" />
            )}
            <span className={`text-[13px] ${i < currentStage ? 'text-[var(--aura-text-muted)]' : i === currentStage ? 'text-[var(--aura-text)]' : 'text-[var(--aura-text-subtle)]'}`}>
              {stage.message}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1 bg-[var(--aura-surface-2)] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#A855F7] to-[#C084FC] rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: stagesComplete ? '100%' : `${(currentStage / CALC_STAGES.length) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   Plan Selector — 3 main plan cards
   ═══════════════════════════════════════════════ */

export function PlanSelector({ onSelect }: { onSelect: (selection: any) => void }) {
  const availablePlans = useMotorStore((s) => s.availablePlans) || [];
  const idv = useMotorStore((s) => s.idv);
  const vehicleEntryType = useMotorStore((s) => s.vehicleEntryType);
  const vehicleType = useMotorStore((s) => s.vehicleType);
  const isBrandNew = vehicleEntryType === 'brand_new';
  const vType = vehicleType === 'bike' ? 'bike' : 'car';
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showGarageTier, setShowGarageTier] = useState(false);
  const [showZdVariant, setShowZdVariant] = useState(false);
  const [showOdVariant, setShowOdVariant] = useState(false);

  // Group plans by type
  const comprehensivePlans = availablePlans.filter((p: any) => p.type === 'comprehensive');
  const zeroDepPlans = availablePlans.filter((p: any) => p.type === 'zero_dep');
  const thirdPartyPlan = availablePlans.find((p: any) => p.type === 'third_party');
  const odPlans = availablePlans.filter((p: any) => p.type === 'od' || p.type === 'od_zd');

  const comprehensiveLowest = comprehensivePlans.sort((a: any, b: any) => a.totalPrice - b.totalPrice)[0];
  const zeroDepLowest = zeroDepPlans.sort((a: any, b: any) => a.totalPrice - b.totalPrice)[0];
  const odLowest = odPlans.length > 0 ? odPlans.sort((a: any, b: any) => a.totalPrice - b.totalPrice)[0] : null;

  const formatPrice = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const handlePlanClick = (plan: any) => {
    if (plan.type === 'comprehensive') {
      setSelectedPlan(plan);
      setShowGarageTier(true);
    } else if (plan.type === 'zero_dep' && zeroDepPlans.length > 1) {
      setSelectedPlan(plan);
      setShowZdVariant(true);
    } else if ((plan.type === 'od' || plan.type === 'od_zd') && odPlans.length > 1) {
      setSelectedPlan(plan);
      setShowOdVariant(true);
    } else {
      onSelect({ planType: plan.type, garageTier: null, plan });
    }
  };

  const handleGarageTierSelect = (tier: 'network' | 'all') => {
    if (!selectedPlan) return;
    const finalPlan = availablePlans.find((p: any) => 
      p.type === selectedPlan.type && p.garageTier === tier
    );
    setShowGarageTier(false);
    onSelect({ planType: selectedPlan.type, garageTier: tier, plan: finalPlan });
  };

  const handleVariantSelect = (plan: any) => {
    setShowZdVariant(false);
    setShowOdVariant(false);
    onSelect({ planType: plan.type, garageTier: null, plan });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-sm space-y-3"
    >
      {/* IDV display */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[12px] text-[var(--aura-text-muted)]">Insured value (IDV)</p>
        <p className="text-[14px] font-semibold text-[var(--aura-text)]">
          ₹{(idv / 100000).toFixed(1)} Lakh <button className="text-[#C084FC] text-[12px] ml-1">Edit</button>
        </p>
      </div>

      {/* Zero Depreciation Plan — shown first for brand new */}
      {isBrandNew && zeroDepLowest && (
        <PlanCard
          plan={zeroDepLowest}
          title="Zero Depreciation"
          badge="Recommended"
          price={formatPrice(zeroDepLowest.totalPrice)}
          description="Full bumper-to-bumper coverage with no depreciation charges on part replacements during claims."
          bulletPoints={[
            { text: 'Pays the full cost of parts replaced during a claim — no depreciation deducted', icon: 'check' },
            { text: 'Minimises your out-of-pocket expenses during claims', icon: 'check' },
            { text: 'Covers theft, fire, accidents, and natural disasters', icon: 'check' },
            { text: `Covers damage caused by your ${vType} to others and their property`, icon: 'check' },
            { text: `Free pickup and drop of your ${vType} during a claim`, icon: 'check' },
          ]}
          onSelect={() => handlePlanClick(zeroDepLowest)}
          recommended
        />
      )}

      {/* Comprehensive Plan */}
      {comprehensiveLowest && (
        <PlanCard
          plan={comprehensiveLowest}
          title="Comprehensive"
          subtitle={isBrandNew ? undefined : `${comprehensivePlans.length > 1 ? comprehensivePlans.length + ' options starting from' : 'Starting from'}`}
          badge={`Recommended for your ${vType}`}
          price={formatPrice(comprehensiveLowest.totalPrice)}
          strikePrice={isBrandNew ? undefined : comprehensiveLowest.totalPrice + 1000}
          description={`Complete coverage for your ${vType} and third-party liabilities.`}
          bulletPoints={[
            { text: 'Covers theft, damage from fire, accidents, and natural disasters', icon: 'check' },
            { text: `Covers damage caused by your ${vType} to others and their property`, icon: 'check' },
            { text: 'Cashless repairs at any GST registered garage', icon: 'check' },
            { text: 'Real-time repair updates on the ACKO app', icon: 'check' },
            { text: `Free pickup and drop of your ${vType} during a claim`, icon: 'check' },
          ]}
          onSelect={() => handlePlanClick(comprehensiveLowest)}
          recommended={!isBrandNew || !zeroDepLowest}
        />
      )}

      {/* Zero Depreciation Plan — shown second for existing cars */}
      {!isBrandNew && zeroDepLowest && (
        <PlanCard
          plan={zeroDepLowest}
          title="Zero Depreciation"
          subtitle={`${zeroDepPlans.length > 1 ? zeroDepPlans.length + ' options starting from' : 'Starting from'}`}
          badge="Recommended"
          price={formatPrice(zeroDepLowest.totalPrice)}
          description="No depreciation charges on part replacements — full claim payout with no out-of-pocket cost."
          bulletPoints={[
            { text: 'Pays the full cost of parts replaced during a claim — no depreciation deducted', icon: 'check' },
            { text: 'Minimises your out-of-pocket expenses during claims', icon: 'check' },
            { text: `Free pickup and drop of your ${vType} during a claim`, icon: 'check' },
          ]}
          onSelect={() => handlePlanClick(zeroDepLowest)}
          recommended
        />
      )}

      {/* Third Party Plan */}
      {!isBrandNew && thirdPartyPlan && (
        <PlanCard
          plan={thirdPartyPlan}
          title="Third Party"
          badge="Minimum cover required by law"
          badgeVariant="amber"
          price={`${formatPrice(thirdPartyPlan.totalPrice)}`}
          subtitle="Same price across all insurers"
          description="The minimum coverage required by law to drive on Indian roads."
          bulletPoints={[
            { text: `Covers damage caused by your ${vType} to others and their property`, icon: 'check' },
            { text: `Does not cover any damage caused to your own ${vType}`, icon: 'cross' },
            { text: 'No cashless repair benefit', icon: 'cross' },
          ]}
          onSelect={() => handlePlanClick(thirdPartyPlan)}
        />
      )}

      {/* OD Plans — only when user has active TP policy */}
      {odLowest && (
        <PlanCard
          plan={odLowest}
          title="Own Damage"
          subtitle={odPlans.length > 1 ? `${odPlans.length} options starting from` : undefined}
          badge="For cars with active TP"
          badgeVariant="amber"
          price={formatPrice(odLowest.totalPrice)}
          description={`Your Third Party policy is already active. You only need to renew your Own Damage cover.`}
          bulletPoints={[
            { text: `Covers damage to your own ${vType} — accident, fire, theft, and natural calamities`, icon: 'check' },
            { text: `Free pickup and drop of your ${vType} during a claim`, icon: 'check' },
            { text: 'Real-time repair updates on the ACKO app', icon: 'check' },
          ]}
          onSelect={() => handlePlanClick(odLowest)}
        />
      )}

      {/* Help me choose CTA */}
      <button
        onClick={() => onSelect('help_choose')}
        className="w-full py-3 rounded-xl text-[14px] font-medium transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2"
        style={{ background: 'var(--btn-secondary-bg)', border: '1px solid var(--btn-secondary-border)', color: 'var(--btn-secondary-text)', boxShadow: 'var(--btn-secondary-shadow)' }}
      >
        <svg className="w-4 h-4" style={{ color: '#A855F7' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
        </svg>
        I need help choosing
      </button>

      {/* Garage Tier Bottom Sheet for Comprehensive */}
      <AnimatePresence>
        {showGarageTier && selectedPlan && (() => {
          const networkPlan = availablePlans.find((p: any) => p.type === selectedPlan.type && p.garageTier === 'network');
          const allPlan = availablePlans.find((p: any) => p.type === selectedPlan.type && p.garageTier === 'all');
          const savings = (allPlan?.totalPrice || 0) - (networkPlan?.totalPrice || 0);
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setShowGarageTier(false)}
            >
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md max-h-[70vh] overflow-y-auto bg-[var(--aura-surface)] rounded-t-3xl sm:rounded-3xl shadow-2xl"
              >
                <div className="p-5">
                  <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--aura-border)' }} />
                  <h3 className="text-[18px] font-bold text-[var(--aura-text)] mb-1">Choose the type of Comprehensive plan</h3>
                  <p className="text-[12px] text-[var(--aura-text-muted)] mb-5">We have two types of plans for you to choose from</p>

                  <div className="space-y-3">
                    {/* Network Garage — preferred variant */}
                    <button
                      onClick={() => networkPlan && handleGarageTierSelect('network')}
                      className="w-full p-4 bg-[var(--aura-surface)] border border-[var(--aura-border)] rounded-xl text-left transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-[14px] font-semibold text-[var(--aura-text)]">Comprehensive · Network Garage</h4>
                          <div className="mt-1"><GradientBadge>Recommended · Fully managed</GradientBadge></div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="text-[16px] font-bold text-[var(--aura-text)]">{formatPrice(networkPlan?.totalPrice || 0)}</p>
                          <p className="text-[10px] text-[var(--aura-text-subtle)]">+ 18% GST</p>
                        </div>
                      </div>
                      <div className="space-y-1.5 mt-3 mb-3">
                        {['All Comprehensive plan benefits at a lower premium', 'Fully managed claims at ACKO Trusted Garages', 'Free pickup & drop, real-time updates, and a 1-year warranty on repairs', 'Just hand over the keys — we take care of everything'].map((text, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            <span className="text-[11px] text-[var(--aura-text-muted)]">{text}</span>
                          </div>
                        ))}
                      </div>
                      <div className="p-2.5 rounded-lg mt-2" style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <div className="flex items-start gap-2">
                          <span className="text-[12px] flex-shrink-0">⚡</span>
                          <p className="text-[10px] leading-relaxed text-[var(--aura-text-muted)]">Repairs outside ACKO Trusted Garages attract a ₹5,000 deductible. Not applicable if no trusted garage is available near you.</p>
                        </div>
                      </div>
                      {savings > 0 && (
                        <span className="inline-flex mt-2 text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.25)' }}>
                          Save ₹{savings.toLocaleString('en-IN')} vs Standard
                        </span>
                      )}
                    </button>

                    {/* Standard — greyed out if unavailable */}
                    {allPlan ? (
                      <button
                        onClick={() => handleGarageTierSelect('all')}
                        className="w-full p-4 bg-[var(--aura-surface)] border border-[var(--aura-border)] rounded-xl text-left transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-[14px] font-semibold text-[var(--aura-text)]">Comprehensive · Standard</h4>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="text-[16px] font-bold text-[var(--aura-text)]">{formatPrice(allPlan.totalPrice)}</p>
                            <p className="text-[10px] text-[var(--aura-text-subtle)]">+ 18% GST</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 mt-2">
                          <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          <span className="text-[11px] text-[var(--aura-text-muted)]">Cashless repairs at any GST registered garage — repair wherever you want, no conditions</span>
                        </div>
                      </button>
                    ) : (
                      <div className="w-full p-4 bg-[var(--aura-surface)] border border-[var(--aura-border)] rounded-xl opacity-50">
                        <h4 className="text-[14px] font-semibold text-[var(--aura-text-subtle)] mb-2">Comprehensive · Standard</h4>
                        <div className="flex items-start gap-2">
                          <svg className="w-3.5 h-3.5 text-[var(--aura-text-subtle)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 16v-4m0-4h.01" /></svg>
                          <span className="text-[11px] text-[var(--aura-text-subtle)]">We&apos;re unable to offer this plan for your vehicle at this time.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={() => setShowGarageTier(false)} className="w-full mt-4 py-3 text-[14px] text-[var(--aura-text-muted)] transition-colors">Cancel</button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Zero Dep Variant Bottom Sheet */}
      <AnimatePresence>
        {showZdVariant && selectedPlan && (() => {
          const safeDriverPlan = zeroDepPlans.find((p: any) => p.variant === 'safe_driver' || p.expandedType === 'zd_comprehensive_safe');
          const standardPlan = zeroDepPlans.find((p: any) => p.variant !== 'safe_driver' && p.expandedType !== 'zd_comprehensive_safe');
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setShowZdVariant(false)}
            >
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md max-h-[80vh] overflow-y-auto bg-[var(--aura-surface)] rounded-t-3xl sm:rounded-3xl shadow-2xl"
              >
                <div className="p-5">
                  <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--aura-border)' }} />
                  <h3 className="text-[18px] font-bold text-[var(--aura-text)]">Choose your Zero Dep plan</h3>
                  <p className="text-[12px] mt-1 mb-5 text-[var(--aura-text-muted)]">Both cover 100% of part replacement costs. Pick what suits you.</p>

                  <div className="space-y-3">
                    {safeDriverPlan && (
                      <button onClick={() => handleVariantSelect(safeDriverPlan)} className="w-full p-4 bg-[var(--aura-surface)] border border-[var(--aura-border)] rounded-xl text-left transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-[14px] font-semibold text-[var(--aura-text)]">Zero Dep · Safe Driver</h4>
                            <div className="mt-1"><GradientBadge>Recommended · Best value</GradientBadge></div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="text-[16px] font-bold text-[var(--aura-text)]">{formatPrice(safeDriverPlan.totalPrice)}</p>
                            <p className="text-[10px] text-[var(--aura-text-subtle)]">+ 18% GST</p>
                          </div>
                        </div>
                        <div className="space-y-1.5 mt-3 mb-3">
                          {['Built for responsible car owners who rarely need to claim', 'All Zero Depreciation benefits at a significantly lower premium'].map((t, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                              <span className="text-[11px] text-[var(--aura-text-muted)]">{t}</span>
                            </div>
                          ))}
                        </div>
                        <div className="p-2.5 rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                          <div className="flex items-start gap-2">
                            <span className="text-[12px] flex-shrink-0">⚡</span>
                            <p className="text-[10px] leading-relaxed text-[var(--aura-text-muted)]">You pay ₹5,000 when you make a claim. We cover everything else.</p>
                          </div>
                        </div>
                      </button>
                    )}

                    {standardPlan ? (
                      <button onClick={() => handleVariantSelect(standardPlan)} className="w-full p-4 bg-[var(--aura-surface)] border border-[var(--aura-border)] rounded-xl text-left transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-[14px] font-semibold text-[var(--aura-text)]">Zero Dep · Standard</h4>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="text-[16px] font-bold text-[var(--aura-text)]">{formatPrice(standardPlan.totalPrice)}</p>
                            <p className="text-[10px] text-[var(--aura-text-subtle)]">+ 18% GST</p>
                          </div>
                        </div>
                        <div className="space-y-1.5 mt-2">
                          {['All Zero Depreciation benefits', 'No deductions of any kind during claims', 'Higher premium, zero conditions'].map((t, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                              <span className="text-[11px] text-[var(--aura-text-muted)]">{t}</span>
                            </div>
                          ))}
                        </div>
                      </button>
                    ) : (
                      <div className="w-full p-4 bg-[var(--aura-surface)] border border-[var(--aura-border)] rounded-xl opacity-50">
                        <h4 className="text-[14px] font-semibold text-[var(--aura-text-subtle)] mb-2">Zero Dep · Standard</h4>
                        <div className="flex items-start gap-2">
                          <svg className="w-3.5 h-3.5 text-[var(--aura-text-subtle)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 16v-4m0-4h.01" /></svg>
                          <span className="text-[11px] text-[var(--aura-text-subtle)]">We&apos;re unable to offer this plan for your vehicle at this time.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Compare section */}
                  <div className="mt-4 p-4 rounded-xl bg-[var(--aura-surface)] border border-[var(--aura-border)]">
                    <p className="text-[12px] font-semibold text-[var(--aura-text)] mb-3">See the difference with an example</p>
                    <p className="text-[11px] text-[var(--aura-text-muted)] mb-2">A bumper gets damaged in an accident. Repair cost: ₹15,000</p>
                    <div className="rounded-lg overflow-hidden border border-[var(--aura-border)]">
                      <div className="grid grid-cols-3 text-[10px] font-medium py-2 px-3 bg-[var(--aura-surface-2)] text-[var(--aura-text-subtle)]">
                        <span></span><span className="text-center">Zero Dep</span><span className="text-center">Standard</span>
                      </div>
                      {[['Part cost', '₹15,000', '₹15,000'], ['Depreciation', '₹0', '₹3,000–4,500'], ['You pay', '₹0', '₹3,000–4,500'], ['ACKO pays', '₹15,000', '₹10,500–12,000']].map(([label, zd, std], i) => (
                        <div key={i} className="grid grid-cols-3 text-[10px] py-1.5 px-3 border-t border-[var(--aura-border)]" style={{ color: label === 'You pay' ? 'var(--aura-text)' : 'var(--aura-text-muted)' }}>
                          <span className="font-medium">{label}</span>
                          <span className="text-center" style={{ color: label === 'You pay' ? '#4ade80' : undefined }}>{zd}</span>
                          <span className="text-center" style={{ color: label === 'You pay' ? '#f87171' : undefined }}>{std}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] mt-2 leading-relaxed text-[var(--aura-text-subtle)]">With Zero Depreciation, ACKO pays the full repair bill. With a Standard plan, you pay the depreciated portion out of pocket.</p>
                  </div>

                  <button onClick={() => setShowZdVariant(false)} className="w-full mt-4 py-3 text-[14px] text-[var(--aura-text-muted)] transition-colors">Cancel</button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* OD Variant Bottom Sheet */}
      <AnimatePresence>
        {showOdVariant && selectedPlan && (() => {
          const zdSafe = odPlans.find((p: any) => (p.type === 'od_zd' || p.hasZeroDep) && p.variant === 'safe_driver');
          const zdStd = odPlans.find((p: any) => (p.type === 'od_zd' || p.hasZeroDep) && p.variant !== 'safe_driver');
          const plainOd = odPlans.find((p: any) => p.type === 'od' && !p.hasZeroDep);
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setShowOdVariant(false)}
            >
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md max-h-[80vh] overflow-y-auto bg-[var(--aura-surface)] rounded-t-3xl sm:rounded-3xl shadow-2xl"
              >
                <div className="p-5">
                  <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--aura-border)' }} />
                  <h3 className="text-[18px] font-bold text-[var(--aura-text)]">Choose your OD plan</h3>
                  <p className="text-[12px] mt-1 mb-5 text-[var(--aura-text-muted)]">Your third-party is already active. Pick the right own-damage cover.</p>

                  <div className="space-y-3">
                    {zdSafe && (
                      <button onClick={() => handleVariantSelect(zdSafe)} className="w-full p-4 bg-[var(--aura-surface)] border border-[var(--aura-border)] rounded-xl text-left transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-[14px] font-semibold text-[var(--aura-text)]">OD Zero Dep · Safe Driver</h4>
                            <div className="mt-1"><GradientBadge>Recommended · Best value</GradientBadge></div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="text-[16px] font-bold text-[var(--aura-text)]">{formatPrice(zdSafe.totalPrice)}</p>
                            <p className="text-[10px] text-[var(--aura-text-subtle)]">+ 18% GST</p>
                          </div>
                        </div>
                        <div className="space-y-1.5 mt-3 mb-3">
                          {['All Zero Depreciation benefits at a much lower premium', 'No depreciation charges on part replacements'].map((t, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                              <span className="text-[11px] text-[var(--aura-text-muted)]">{t}</span>
                            </div>
                          ))}
                        </div>
                        <div className="p-2.5 rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                          <div className="flex items-start gap-2">
                            <span className="text-[12px] flex-shrink-0">⚡</span>
                            <p className="text-[10px] leading-relaxed text-[var(--aura-text-muted)]">You pay ₹5,000 when you make a claim. We cover everything else.</p>
                          </div>
                        </div>
                      </button>
                    )}

                    {zdStd ? (
                      <button onClick={() => handleVariantSelect(zdStd)} className="w-full p-4 bg-[var(--aura-surface)] border border-[var(--aura-border)] rounded-xl text-left transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-[14px] font-semibold text-[var(--aura-text)]">OD Zero Dep · Standard</h4>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="text-[16px] font-bold text-[var(--aura-text)]">{formatPrice(zdStd.totalPrice)}</p>
                            <p className="text-[10px] text-[var(--aura-text-subtle)]">+ 18% GST</p>
                          </div>
                        </div>
                        <div className="space-y-1.5 mt-2">
                          {['All Zero Depreciation benefits, no deductions during claims', 'Higher premium, zero conditions'].map((t, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                              <span className="text-[11px] text-[var(--aura-text-muted)]">{t}</span>
                            </div>
                          ))}
                        </div>
                      </button>
                    ) : zdSafe && (
                      <div className="w-full p-4 bg-[var(--aura-surface)] border border-[var(--aura-border)] rounded-xl opacity-50">
                        <h4 className="text-[14px] font-semibold text-[var(--aura-text-subtle)] mb-2">OD Zero Dep · Standard</h4>
                        <div className="flex items-start gap-2">
                          <svg className="w-3.5 h-3.5 text-[var(--aura-text-subtle)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 16v-4m0-4h.01" /></svg>
                          <span className="text-[11px] text-[var(--aura-text-subtle)]">We&apos;re unable to offer this plan for your vehicle at this time.</span>
                        </div>
                      </div>
                    )}

                    {plainOd && (
                      <button onClick={() => handleVariantSelect(plainOd)} className="w-full p-4 bg-[var(--aura-surface)] border border-[var(--aura-border)] rounded-xl text-left transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-[14px] font-semibold text-[var(--aura-text)]">Standard OD</h4>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="text-[16px] font-bold text-[var(--aura-text)]">{formatPrice(plainOd.totalPrice)}</p>
                            <p className="text-[10px] text-[var(--aura-text-subtle)]">+ 18% GST</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 mt-2">
                          <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          <span className="text-[11px] text-[var(--aura-text-muted)]">Standard OD cover — depreciation applies on part replacements</span>
                        </div>
                      </button>
                    )}
                  </div>

                  <button onClick={() => setShowOdVariant(false)} className="w-full mt-4 py-3 text-[14px] text-[var(--aura-text-muted)] transition-colors">Cancel</button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </motion.div>
  );
}

function PlanCard({
  plan,
  title,
  subtitle,
  badge,
  badgeVariant = 'default',
  price,
  strikePrice,
  description,
  bulletPoints,
  claimCondition,
  onSelect,
  recommended,
}: {
  plan: any;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'default' | 'amber';
  price: string;
  strikePrice?: number;
  description: string;
  bulletPoints?: { text: string; icon: 'check' | 'cross' | 'info' }[];
  claimCondition?: string;
  onSelect: () => void;
  recommended?: boolean;
}) {
  const vehicleType = useMotorStore((s) => s.vehicleType);
  const vType = vehicleType === 'bike' ? 'bike' : 'car';
  const isComprehensive = plan?.type === 'comprehensive';
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'covered' | 'not_covered' | 'upgrades'>('covered');
  const [showGarageExplorer, setShowGarageExplorer] = useState(false);

  const formatPrice = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const quickFeatures = bulletPoints
    ? bulletPoints.slice(0, 5)
    : plan.features.slice(0, 3).map((f: string) => ({ text: f.split(' — ')[0], icon: 'check' as const }));

  const BulletIcon = ({ icon }: { icon: 'check' | 'cross' | 'info' }) => {
    if (icon === 'cross') return (
      <svg className="w-4 h-4 text-red-400/70 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
    if (icon === 'info') return (
      <svg className="w-4 h-4 text-[var(--aura-text-subtle)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 16v-4m0-4h.01" />
      </svg>
    );
    return (
      <svg className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          bg-[var(--aura-surface)] border rounded-2xl overflow-hidden transition-all duration-200
          ${recommended ? 'border-[#A855F7]/25 bg-[var(--aura-surface-2)]' : 'border-[var(--aura-border)]'}
        `}
      >
        {/* Header */}
        <div className="p-4">
          <div className="mb-3">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--aura-text)]">{title}</h3>
                {subtitle && <p className="text-[11px] text-[var(--aura-text-subtle)] mt-0.5">{subtitle}</p>}
              </div>
              {badge && (
                badgeVariant === 'amber' ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full whitespace-nowrap text-[10px] font-medium leading-[12px]"
                    style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                    {badge}
                  </span>
                ) : (
                  <GradientBadge>{badge}</GradientBadge>
                )
              )}
            </div>
            <div className="flex items-center gap-2">
              {strikePrice && (
                <p className="text-[14px] font-semibold text-[var(--aura-text-subtle)] line-through">{formatPrice(strikePrice)}</p>
              )}
              <p className="text-[18px] font-bold text-[var(--aura-text)]">{price}</p>
            </div>
            <p className="text-[12px] text-[var(--aura-text-muted)] leading-relaxed mt-1">
              {description}{' '}
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[#C084FC] underline hover:text-[#C084FC] transition-colors"
              >
                Learn more
              </button>
            </p>
          </div>

          {/* Quick features (always visible when collapsed) */}
          {!expanded && (
            <div className="space-y-1.5 mb-4">
              {quickFeatures.map((item: any, i: number) => {
                const text = typeof item === 'string' ? item : item.text;
                const icon = typeof item === 'string' ? 'check' : item.icon;
                const isGarageFeature = text.includes('Cashless');
                return (
                  <div key={i} className="flex items-start gap-2">
                    <BulletIcon icon={icon} />
                    {isGarageFeature ? (
                      <button
                        onClick={() => setShowGarageExplorer(true)}
                        className="text-[12px] text-[var(--aura-text-muted)] hover:text-[#C084FC] transition-colors text-left underline decoration-white/30 hover:decoration-[#C084FC]"
                      >
                        {text}
                      </button>
                    ) : (
                      <span className="text-[12px]" style={{ color: icon === 'cross' ? 'var(--aura-text-subtle)' : 'var(--aura-text-muted)' }}>{text}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Claim condition callout */}
          {!expanded && claimCondition && (
            <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div className="flex items-start gap-2">
                <span className="text-[13px] flex-shrink-0">⚡</span>
                <p className="text-[11px] leading-relaxed text-[var(--aura-text-muted)]">{claimCondition}</p>
              </div>
            </div>
          )}

          {/* CTA - when collapsed */}
          {!expanded && (
            <button
              onClick={onSelect}
              className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all active:scale-[0.98]"
              style={{
                background: 'var(--btn-secondary-bg)',
                color: 'var(--btn-secondary-text)',
                border: '1px solid var(--btn-secondary-border)',
                boxShadow: 'var(--btn-secondary-shadow)',
              }}
            >
              Explore plan
            </button>
          )}
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-[var(--aura-border)]"
            >
              {/* Tabs */}
              <div className="flex border-b border-[var(--aura-border)]">
                <button
                  onClick={() => setActiveTab('covered')}
                  className={`flex-1 py-3 text-[12px] font-medium transition-colors ${
                    activeTab === 'covered'
                      ? 'text-[var(--aura-text)] border-b-2 border-[#A855F7]'
                      : 'text-[var(--aura-text-subtle)] hover:text-[var(--aura-text-muted)]'
                  }`}
                >
                  Covered
                </button>
                <button
                  onClick={() => setActiveTab('not_covered')}
                  className={`flex-1 py-3 text-[12px] font-medium transition-colors ${
                    activeTab === 'not_covered'
                      ? 'text-[var(--aura-text)] border-b-2 border-[#A855F7]'
                      : 'text-[var(--aura-text-subtle)] hover:text-[var(--aura-text-muted)]'
                  }`}
                >
                  Not covered
                </button>
                <button
                  onClick={() => setActiveTab('upgrades')}
                  className={`flex-1 py-3 text-[12px] font-medium transition-colors ${
                    activeTab === 'upgrades'
                      ? 'text-[var(--aura-text)] border-b-2 border-[#A855F7]'
                      : 'text-[var(--aura-text-subtle)] hover:text-[var(--aura-text-muted)]'
                  }`}
                >
                  {plan.type === 'third_party' ? 'Upgrades' : 'Available upgrades'}
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-4 max-h-[300px] overflow-y-auto scrollbar-hide">
                <AnimatePresence mode="wait">
                  {activeTab === 'covered' && (
                    <motion.div
                      key="covered"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-3"
                    >
                      {plan.features.map((feature: string, i: number) => {
                        const [title, ...descParts] = feature.split(' — ');
                        const desc = descParts.join(' — ');
                        const isGarageFeature = title.includes('Cashless claims');
                        return (
                          <div key={i} className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            <div className="flex-1">
                              {isGarageFeature ? (
                                <button
                                  onClick={() => setShowGarageExplorer(true)}
                                  className="text-[12px] font-medium text-[var(--aura-text)] hover:text-[#C084FC] transition-colors underline decoration-white/30 hover:decoration-[#C084FC] text-left"
                                >
                                  {title}
                                </button>
                              ) : (
                                <p className="text-[12px] font-medium text-[var(--aura-text)]">{title}</p>
                              )}
                              {desc && <p className="text-[11px] text-[var(--aura-text-muted)] mt-0.5">{desc}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}

                  {activeTab === 'not_covered' && (
                    <motion.div
                      key="not_covered"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-3"
                    >
                      {plan.notCovered.map((item: string, i: number) => {
                        const [title, ...descParts] = item.split(' — ');
                        const desc = descParts.join(' — ');
                        return (
                          <div key={i} className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-red-400/60 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <div className="flex-1">
                              <p className="text-[12px] font-medium text-[var(--aura-text)]">{title}</p>
                              {desc && <p className="text-[11px] text-[var(--aura-text-muted)] mt-0.5">{desc}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}

                  {activeTab === 'upgrades' && (
                    <motion.div
                      key="upgrades"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                    >
                      <p className="text-[12px] text-[var(--aura-text-muted)] mb-3">
                        Opt for additional covers in the next steps to enhance your {plan.type === 'third_party' ? 'coverage' : `${vType} protection`}
                      </p>
                      <div className="space-y-2">
                        {plan.addOnsAvailable.map((addonId: string, i: number) => {
                          const addonInfo: Record<string, { name: string; desc: string }> = {
                            engine_protection: {
                              name: 'Engine Protection',
                              desc: 'It covers engine damage caused by oil leaks and water penetration. Standard plans only cover engine damage caused in an accident.',
                            },
                            extra_car_protection: {
                              name: `Extra ${vType === 'bike' ? 'Bike' : 'Car'} Protection`,
                              desc: `It offers 24x7 roadside assistance, key repair/replacement, and reimbursement for outstation repairs.`,
                            },
                            consumables_cover: {
                              name: 'Consumables Cover',
                              desc: `It pays for the cost of nuts and bolts, brake oil, engine oil etc. used during ${vType} repairs. Standard plans don't cover this.`,
                            },
                            personal_accident: {
                              name: 'Personal Accident Cover',
                              desc: `It's mandatory to add this cover if you don't have it. It provides coverage of up to ₹15 lakh for accidental death or injury of the ${vType} owner.`,
                            },
                            passenger_protection: {
                              name: 'Passenger Protection',
                              desc: 'It offers coverage of up to ₹1 lakh per passenger for accidental death or injury',
                            },
                            paid_driver: {
                              name: 'Paid Driver Protection',
                              desc: 'It covers your driver for up to ₹1 lakh in the event of serious injuries or death in an accident.',
                            },
                          };
                          const addon = addonInfo[addonId];
                          return (
                            <div key={i} className="py-2.5 px-3 bg-[var(--aura-surface)] rounded-lg border border-[var(--aura-border)]">
                              <div className="flex items-start gap-2">
                                <svg className="w-4 h-4 text-[#C084FC] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                <div>
                                  <p className="text-[12px] font-medium text-[var(--aura-text)]">{addon?.name || addonId}</p>
                                  <p className="text-[11px] text-[var(--aura-text-subtle)] mt-0.5">{addon?.desc || ''}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* CTA in expanded state */}
              <div className="px-4 pb-4 border-t border-[var(--aura-border)] pt-4">
                <button
                  onClick={onSelect}
                  style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
                  className="w-full py-3 rounded-xl text-[14px] font-semibold hover:opacity-90 transition-colors active:scale-[0.97]"
                >
                  Select this plan
                </button>
                <button
                  onClick={() => setExpanded(false)}
                  className="w-full py-2 mt-2 text-[12px] text-[var(--aura-text-muted)] hover:text-[var(--aura-text-muted)] transition-colors"
                >
                  Close details
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Garage Network Explorer Modal */}
      <GarageNetworkExplorer
        visible={showGarageExplorer}
        onClose={() => setShowGarageExplorer(false)}
      />
    </>
  );
}

// Garage Network Explorer Component
function GarageNetworkExplorer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  // Mock garage data
  const garages = [
    { id: 1, name: 'Elite Auto Service', city: 'Mumbai', area: 'Andheri West', rating: 4.5 },
    { id: 2, name: 'City Motors Garage', city: 'Mumbai', area: 'Bandra East', rating: 4.7 },
    { id: 3, name: 'Premium Auto Care', city: 'Delhi', area: 'Connaught Place', rating: 4.6 },
    { id: 4, name: 'Royal Auto Works', city: 'Bangalore', area: 'Koramangala', rating: 4.8 },
    { id: 5, name: 'Swift Service Center', city: 'Mumbai', area: 'Powai', rating: 4.4 },
    { id: 6, name: 'Highway Garage', city: 'Delhi', area: 'Dwarka', rating: 4.3 },
    { id: 7, name: 'Metro Auto Service', city: 'Bangalore', area: 'Whitefield', rating: 4.6 },
    { id: 8, name: 'Grand Auto Care', city: 'Pune', area: 'Hinjewadi', rating: 4.5 },
    { id: 9, name: 'Rapid Repairs', city: 'Mumbai', area: 'Goregaon', rating: 4.2 },
    { id: 10, name: 'Speed Zone Garage', city: 'Delhi', area: 'Rohini', rating: 4.7 },
    { id: 11, name: 'Precision Motors', city: 'Bangalore', area: 'Indiranagar', rating: 4.9 },
    { id: 12, name: 'Central Auto Clinic', city: 'Mumbai', area: 'Kurla', rating: 4.3 },
    { id: 13, name: 'Pro Auto Solutions', city: 'Delhi', area: 'Saket', rating: 4.6 },
    { id: 14, name: 'Prime Service Hub', city: 'Pune', area: 'Viman Nagar', rating: 4.4 },
    { id: 15, name: 'Express Auto Repair', city: 'Bangalore', area: 'BTM Layout', rating: 4.5 },
    { id: 16, name: 'Star Motors Workshop', city: 'Mumbai', area: 'Malad', rating: 4.8 },
    { id: 17, name: 'Capital Garage Services', city: 'Delhi', area: 'Janakpuri', rating: 4.2 },
    { id: 18, name: 'Tech Auto Care', city: 'Bangalore', area: 'Electronic City', rating: 4.7 },
    { id: 19, name: 'Ace Automobile Center', city: 'Pune', area: 'Kharadi', rating: 4.6 },
    { id: 20, name: 'Skyline Auto Service', city: 'Mumbai', area: 'Thane', rating: 4.5 },
    { id: 21, name: 'Max Auto Works', city: 'Delhi', area: 'Vasant Kunj', rating: 4.4 },
    { id: 22, name: 'Urban Motors', city: 'Bangalore', area: 'Marathahalli', rating: 4.9 },
    { id: 23, name: 'Crystal Auto Care', city: 'Pune', area: 'Baner', rating: 4.3 },
    { id: 24, name: 'Victory Garage', city: 'Mumbai', area: 'Borivali', rating: 4.7 },
    { id: 25, name: 'Elite Service Station', city: 'Delhi', area: 'Lajpat Nagar', rating: 4.5 },
    { id: 26, name: 'Smart Auto Solutions', city: 'Bangalore', area: 'Yelahanka', rating: 4.6 },
    { id: 27, name: 'Prestige Auto Clinic', city: 'Pune', area: 'Wakad', rating: 4.8 },
    { id: 28, name: 'Infinity Motors', city: 'Mumbai', area: 'Kandivali', rating: 4.4 },
    { id: 29, name: 'Supreme Auto Hub', city: 'Delhi', area: 'Pitampura', rating: 4.2 },
    { id: 30, name: 'Phoenix Auto Care', city: 'Bangalore', area: 'Jayanagar', rating: 4.7 },
  ];

  const cities = ['all', ...Array.from(new Set(garages.map((g) => g.city)))];

  const filteredGarages = garages.filter((garage) => {
    const matchesSearch =
      garage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      garage.area.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === 'all' || garage.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] bg-[var(--aura-surface)] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--aura-border)]">
          <div>
            <h2 className="text-[18px] font-bold text-[var(--aura-text)]">Cashless Network Garages</h2>
            <p className="text-[12px] text-[var(--aura-text-muted)] mt-0.5">5,400+ garages across India</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--aura-surface-2)] hover:bg-[var(--aura-surface-2)] transition-colors"
          >
            <svg className="w-5 h-5 text-[var(--aura-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="px-5 py-4 space-y-3 border-b border-[var(--aura-border)]">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--aura-text-subtle)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search by garage name or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--aura-surface-2)] border border-[var(--aura-border)] rounded-xl text-[13px] text-[var(--aura-text)] placeholder:text-[var(--aura-text-subtle)] focus:outline-none focus:ring-2 focus:ring-[#A855F7]/50"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-4 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all ${
                  selectedCity === city
                    ? 'bg-[#A855F7] text-white'
                    : 'bg-[var(--aura-surface-2)] text-[var(--aura-text-muted)] hover:bg-[var(--aura-surface-2)]'
                }`}
              >
                {city === 'all' ? 'All Cities' : city}
              </button>
            ))}
          </div>
        </div>

        {/* Garage List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {filteredGarages.length > 0 ? (
            filteredGarages.map((garage) => (
              <motion.div
                key={garage.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-[var(--aura-surface)] rounded-xl border border-[var(--aura-border)] hover:bg-[var(--aura-surface)] hover:border-[var(--aura-border)] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-[14px] font-semibold text-[var(--aura-text)]">{garage.name}</h3>
                    <p className="text-[12px] text-[var(--aura-text-muted)] mt-1">
                      {garage.area}, {garage.city}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-[12px] font-medium text-[var(--aura-text)]">{garage.rating}</span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-12 text-center">
              <svg
                className="w-12 h-12 mx-auto mb-3"
                style={{ color: 'var(--aura-text)', opacity: 0.2 }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <p className="text-[14px] text-[var(--aura-text-muted)]">No garages found</p>
              <p className="text-[12px] text-[var(--aura-text-subtle)] mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-5 py-3 bg-[var(--aura-surface)] border-t border-[var(--aura-border)]">
          <p className="text-[11px] text-[var(--aura-text-subtle)] text-center">
            Showing {filteredGarages.length} of 5,400+ partner garages • Coverage across all major cities
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   Plan Recommendation — result of "Help me choose"
   ═══════════════════════════════════════════════ */

export function PlanRecommendation({ onSelect }: { onSelect: (response: any) => void }) {
  const { availablePlans, recommendedPlanType, vehicleEntryType } = useMotorStore();
  const isBrandNew = vehicleEntryType === 'brand_new';

  const planType = recommendedPlanType || 'comprehensive';
  const planLabel = planType === 'zero_dep' ? 'Zero Depreciation' : planType === 'comprehensive' ? 'Comprehensive' : 'Third-party';

  const matchedPlan = availablePlans.find((p: any) => p.type === planType)
    || availablePlans[0];

  const formatPrice = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  const handleSelect = () => {
    if (matchedPlan?.type === 'comprehensive') {
      onSelect({ planType: matchedPlan.type, garageTier: 'network', plan: matchedPlan });
    } else {
      onSelect({ planType: matchedPlan?.type || planType, garageTier: null, plan: matchedPlan });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm space-y-3">
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--aura-surface)', border: '1px solid var(--aura-border)' }}>
        <div className="px-4 py-3" style={{ background: 'var(--motor-plan-rec-header-bg)' }}>
          <GradientBadge className="mb-1">Recommended for you</GradientBadge>
          <h3 className="text-[18px] font-bold" style={{ color: 'var(--aura-text)' }}>{planLabel} Plan</h3>
          {matchedPlan && (
            <p className="text-[22px] font-bold mt-1" style={{ color: 'var(--aura-text)' }}>
              {formatPrice(matchedPlan.totalPrice)}
              <span className="text-[12px] font-normal ml-1" style={{ color: 'var(--aura-text-muted)' }}>/ year</span>
            </p>
          )}
        </div>

        <div className="px-4 py-3 space-y-2">
          {matchedPlan?.features?.slice(0, 4).map((f: any, i: number) => (
            <div key={i} className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--motor-plan-rec-check)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span className="text-[13px]" style={{ color: 'var(--aura-text)' }}>{f.label || f}</span>
            </div>
          ))}
        </div>

        <div className="px-4 pb-4 space-y-2">
          <button
            onClick={handleSelect}
            className="w-full py-3 rounded-xl text-[14px] font-semibold text-white transition-all active:scale-[0.97]"
            style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
          >
            Select {planLabel} Plan
          </button>
          <button
            onClick={() => onSelect('back_to_plans')}
            className="w-full py-2.5 rounded-xl text-[13px] font-medium transition-all"
            style={{ color: 'var(--aura-text-muted)' }}
          >
            View all plans instead
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Out of Pocket Addons Widget
export function OutOfPocketAddons({ onContinue }: { onContinue: (addons: any[]) => void }) {
  const { updateState, selectedAddOns = [], selectedPlan } = useMotorStore();
  const [selectedItems, setSelectedItems] = useState<Map<string, { id: string; variantId?: string; price: number }>>(new Map());
  const [showVariantModal, setShowVariantModal] = useState<{ addon: any; show: boolean }>({ addon: null, show: false });

  const auraState = useMotorStore.getState() as MotorJourneyState;
  const addons = getMotorAddOns('car', auraState).filter((a: any) => a.category === 'out_of_pocket');

  const isSelected = (addonId: string) => selectedItems.has(addonId);

  const toggleAddon = (addon: any) => {
    if (addon.hasVariants) {
      setShowVariantModal({ addon, show: true });
    } else {
      const newMap = new Map(selectedItems);
      if (newMap.has(addon.id)) {
        newMap.delete(addon.id);
      } else {
        newMap.set(addon.id, { id: addon.id, price: addon.price });
      }
      setSelectedItems(newMap);
    }
  };

  const selectVariant = (addon: any, variant: any) => {
    const newMap = new Map(selectedItems);
    newMap.set(addon.id, { id: addon.id, variantId: variant.id, price: variant.price });
    setSelectedItems(newMap);
    setShowVariantModal({ addon: null, show: false });
  };

  const removeAddon = (addonId: string) => {
    const newMap = new Map(selectedItems);
    newMap.delete(addonId);
    setSelectedItems(newMap);
  };

  const calculateTotal = () => {
    const basePremium = selectedPlan?.totalPrice || 0;
    const addonTotal = Array.from(selectedItems.values()).reduce((sum, item) => sum + item.price, 0);
    const gst = Math.round(addonTotal * 0.18);
    return { basePremium, addonTotal, gst, total: basePremium + addonTotal + gst };
  };

  const handleContinue = () => {
    const addonsList = Array.from(selectedItems.values());
    updateState({ selectedAddOns: addonsList as any });
    onContinue(addonsList);
  };

  const handleSkip = () => {
    updateState({ selectedAddOns: [] });
    onContinue([]);
  };

  const totals = calculateTotal();

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="mb-4">
          <h3 className="text-[16px] font-bold text-[var(--aura-text)] mb-1">Cut down your out-of-pocket expenses</h3>
          <p className="text-[12px] text-[var(--aura-text-muted)]">Recommended for you</p>
        </div>

        {addons.map((addon: any, index: number) => {
          const selected = isSelected(addon.id);
          const selectedItem = selectedItems.get(addon.id);
          const displayPrice = selectedItem?.price || addon.price;
          const variantName = selectedItem?.variantId ? addon.variants?.find((v: any) => v.id === selectedItem.variantId)?.name : null;

          return (
            <motion.div
              key={addon.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0, scale: selected ? 1.02 : 1 }}
              transition={{
                opacity: { delay: index * 0.05, duration: 0.3 },
                y: { delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 },
                scale: { type: 'spring', stiffness: 400, damping: 30 },
              }}
              className={`p-4 rounded-xl border ${selected ? 'bg-[var(--aura-surface-2)] border-[#A855F7]/30' : 'bg-[var(--aura-surface)] border-[var(--aura-border)] hover:border-[var(--aura-border-strong)]'}`}
              style={{ transition: 'background 0.25s ease, border-color 0.25s ease' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {ADDON_ICONS[addon.id] && (
                      <Image
                        src={assetPath(`/icons/${encodeURIComponent(ADDON_ICONS[addon.id])}`)}
                        alt=""
                        width={20}
                        height={20}
                        className="opacity-80 shrink-0"
                        style={{ filter: 'var(--aura-icon-filter)', opacity: 'var(--aura-icon-opacity)' } as React.CSSProperties}
                      />
                    )}
                    <h4 className="text-[14px] font-semibold text-[var(--aura-text)]">{addon.name}</h4>
                    {addon.recommended && <GradientBadge>Recommended</GradientBadge>}
                    {selected && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className="text-[10px] text-green-300 bg-green-500/25 px-2 py-0.5 rounded-full flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        Added
                      </motion.span>
                    )}
                  </div>
                  <p className="text-[12px] text-[var(--aura-text-muted)] leading-relaxed">{addon.description}</p>
                  {selected && variantName && <p className="text-[11px] text-[#C084FC] mt-1">Selected: {variantName}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                  <p className="text-[14px] font-bold text-[var(--aura-text)] whitespace-nowrap">₹{displayPrice}</p>
                  <motion.button
                    onClick={() => selected ? removeAddon(addon.id) : toggleAddon(addon)}
                    whileTap={{ scale: 0.92 }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selected ? 'bg-[#A855F7] text-white hover:bg-[#7E22CE]' : 'bg-[var(--aura-surface-2)] text-[var(--aura-text-muted)] hover:bg-[var(--aura-surface-2)] border border-[var(--aura-border)]'}`}
                  >
                    {selected ? (
                      <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </motion.span>
                    ) : (
                      <span>+</span>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}

        <motion.div
          key={`total-${totals.addonTotal}`}
          initial={{ scale: 0.98, opacity: 0.9 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="mt-6 p-4 bg-[var(--aura-surface)] rounded-xl border border-[var(--aura-border)]"
        >
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between text-[var(--aura-text-muted)]"><span>Base Premium</span><span>₹{totals.basePremium.toLocaleString()}</span></div>
            {totals.addonTotal > 0 && (<><div className="flex justify-between text-[var(--aura-text-muted)]"><span>Add-ons</span><span>₹{totals.addonTotal.toLocaleString()}</span></div><div className="flex justify-between text-[var(--aura-text-muted)]"><span>GST (18%)</span><span>₹{totals.gst.toLocaleString()}</span></div></>)}
            <div className="border-t border-[var(--aura-border)] pt-2 flex justify-between font-bold text-[var(--aura-text)] text-[15px]"><span>Total</span><span>₹{totals.total.toLocaleString()}</span></div>
          </div>
        </motion.div>

        <div className="flex gap-3 mt-4">
          <button onClick={handleSkip} className="flex-1 py-3 px-4 bg-[var(--aura-surface-2)] border border-[var(--aura-border)] rounded-xl text-[14px] font-semibold text-[var(--aura-text)] hover:bg-[var(--aura-surface-2)] transition-colors">Continue without add-ons</button>
          <button onClick={handleContinue} style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }} className="flex-1 py-3 px-4 rounded-xl text-[14px] font-semibold hover:opacity-90 transition-colors active:scale-[0.98]">Continue</button>
        </div>
        <p className="text-[11px] text-[var(--aura-text-subtle)] text-center mt-2">Next: Additional covers to reduce medical expenses</p>
      </motion.div>

      <AnimatePresence>
        {showVariantModal.show && showVariantModal.addon && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowVariantModal({ addon: null, show: false })}>
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md max-h-[45vh] overflow-y-auto bg-[var(--aura-surface)] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[var(--aura-border)]">
              <div className="p-5">
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
                <h3 className="text-[18px] font-bold text-[var(--aura-text)] mb-1">Select {showVariantModal.addon.name} variant</h3>
                <p className="text-[12px] text-[var(--aura-text-muted)] mb-5">{showVariantModal.addon.description}</p>
                <div className="space-y-3">
                  {showVariantModal.addon.variants?.map((variant: any) => (
                    <button key={variant.id} onClick={() => selectVariant(showVariantModal.addon, variant)} className="w-full p-4 bg-[var(--aura-surface)] hover:bg-[var(--aura-surface-2)] border border-[var(--aura-border)] hover:border-[#A855F7]/30 rounded-xl text-left transition-all group">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-[var(--aura-text)]">{variant.name}</span>
                          {variant.recommended && <GradientBadge>Recommended</GradientBadge>}
                          {variant.badge && <GradientBadge>{variant.badge}</GradientBadge>}
                        </div>
                        <span className="text-[16px] font-bold text-[var(--aura-text)]">₹{variant.price}</span>
                      </div>
                      <ul className="space-y-1">
                        {variant.features?.map((feature: string, i: number) => (
                          <li key={i} className="text-[11px] text-[var(--aura-text-muted)] flex items-start gap-2"><span className="text-green-400 mt-0.5">•</span><span>{feature}</span></li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowVariantModal({ addon: null, show: false })} className="w-full mt-4 py-3 text-[14px] text-[var(--aura-text-muted)] hover:text-[var(--aura-text-muted)] transition-colors">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Protect Everyone Addons Widget
export function ProtectEveryoneAddons({ onContinue }: { onContinue: (addons: any[]) => void }) {
  const { updateState, selectedAddOns = [], selectedPlan, vehicleType } = useMotorStore();
  const vType = vehicleType === 'bike' ? 'bike' : 'car';
  const [selectedItems, setSelectedItems] = useState<Map<string, { id: string; variantId?: string; price: number }>>(new Map());
  const [showVariantModal, setShowVariantModal] = useState<{ addon: any; show: boolean }>({ addon: null, show: false });

  const auraState = useMotorStore.getState() as MotorJourneyState;
  const addons = getMotorAddOns(vType as 'car' | 'bike', auraState).filter((a: any) => a.category === 'protect_everyone');

  const isSelected = (addonId: string) => selectedItems.has(addonId);

  const toggleAddon = (addon: any) => {
    if (addon.hasVariants) {
      setShowVariantModal({ addon, show: true });
    } else {
      const newMap = new Map(selectedItems);
      if (newMap.has(addon.id)) {
        newMap.delete(addon.id);
      } else {
        newMap.set(addon.id, { id: addon.id, price: addon.price });
      }
      setSelectedItems(newMap);
    }
  };

  const selectVariant = (addon: any, variant: any) => {
    const newMap = new Map(selectedItems);
    newMap.set(addon.id, { id: addon.id, variantId: variant.id, price: variant.price });
    setSelectedItems(newMap);
    setShowVariantModal({ addon: null, show: false });
  };

  const removeAddon = (addonId: string) => {
    const newMap = new Map(selectedItems);
    newMap.delete(addonId);
    setSelectedItems(newMap);
  };

  const calculateTotal = () => {
    const basePremium = selectedPlan?.totalPrice || 0;
    const previousAddons = (selectedAddOns as any[]).reduce((sum: number, item: any) => sum + (item.price || 0), 0);
    const addonTotal = Array.from(selectedItems.values()).reduce((sum, item) => sum + item.price, 0);
    const totalAddons = previousAddons + addonTotal;
    const gst = Math.round(totalAddons * 0.18);
    return { basePremium, previousAddons, addonTotal, totalAddons, gst, total: basePremium + totalAddons + gst };
  };

  const handleContinue = () => {
    const newAddons = Array.from(selectedItems.values());
    const allAddons = [...(selectedAddOns as any[]), ...newAddons];
    updateState({ selectedAddOns: allAddons as any });
    onContinue(allAddons);
  };

  const handleSkip = () => {
    onContinue(selectedAddOns as any[]);
  };

  const totals = calculateTotal();

  const renderAddonCard = (addon: any, index: number) => {
    const selected = isSelected(addon.id);
    const selectedItem = selectedItems.get(addon.id);
    const displayPrice = selectedItem?.price || addon.price;
    const variantName = selectedItem?.variantId ? addon.variants?.find((v: any) => v.id === selectedItem.variantId)?.name : null;

    return (
      <motion.div
        key={addon.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, scale: selected ? 1.02 : 1 }}
        transition={{
          opacity: { delay: index * 0.05, duration: 0.3 },
          y: { delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 },
          scale: { type: 'spring', stiffness: 400, damping: 30 },
        }}
        className={`p-4 rounded-xl border ${selected ? 'bg-[var(--aura-surface-2)] border-[#A855F7]/30' : 'bg-[var(--aura-surface)] border-[var(--aura-border)] hover:border-[var(--aura-border-strong)]'}`}
        style={{ transition: 'background 0.25s ease, border-color 0.25s ease' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {ADDON_ICONS[addon.id] && (
                <Image
                  src={assetPath(`/icons/${encodeURIComponent(ADDON_ICONS[addon.id])}`)}
                  alt=""
                  width={20}
                  height={20}
                  className="opacity-80 shrink-0"
                  style={{ filter: 'var(--aura-icon-filter)', opacity: 'var(--aura-icon-opacity)' } as React.CSSProperties}
                />
              )}
              <h4 className="text-[14px] font-semibold text-[var(--aura-text)]">{addon.name}</h4>
              {addon.mandatory && <span className="text-[10px] text-orange-300 bg-orange-500/20 px-2 py-0.5 rounded-full">Mandatory by law</span>}
              {selected && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="text-[10px] text-green-300 bg-green-500/25 px-2 py-0.5 rounded-full flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Added
                </motion.span>
              )}
            </div>
            <p className="text-[12px] text-[var(--aura-text-muted)] leading-relaxed">{addon.description}</p>
            {selected && variantName && <p className="text-[11px] text-[#C084FC] mt-1">Selected: {variantName}</p>}
          </div>
          <div className="flex flex-col items-end gap-2 ml-4">
            <p className="text-[14px] font-bold text-[var(--aura-text)] whitespace-nowrap">{addon.hasVariants ? 'from ' : ''}₹{displayPrice}</p>
            <motion.button
              onClick={() => selected ? removeAddon(addon.id) : toggleAddon(addon)}
              whileTap={{ scale: 0.92 }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selected ? 'bg-[#A855F7] text-white hover:bg-[#7E22CE]' : 'bg-[var(--aura-surface-2)] text-[var(--aura-text-muted)] hover:bg-[var(--aura-surface-2)] border border-[var(--aura-border)]'}`}
            >
              {selected ? (
                <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </motion.span>
              ) : (
                <span>+</span>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="mb-4">
          <h3 className="text-[16px] font-bold text-[var(--aura-text)] mb-1">Protect everyone in your {vType}</h3>
        </div>

        <div className="mb-4 space-y-3">
          <p className="text-[13px] font-semibold text-[var(--aura-text-muted)] mb-3">For you</p>
          {addons.filter((a: any) => a.id === 'personal_accident').map((a, i) => renderAddonCard(a, i))}
        </div>

        <div className="mb-4 space-y-3">
          <p className="text-[13px] font-semibold text-[var(--aura-text-muted)] mb-3">For your loved ones</p>
          {addons.filter((a: any) => a.id === 'passenger_protection').map((a, i) => renderAddonCard(a, i))}
        </div>

        <div className="mb-4 space-y-3">
          <p className="text-[13px] font-semibold text-[var(--aura-text-muted)] mb-3">For your driver</p>
          {addons.filter((a: any) => a.id === 'paid_driver').map((a, i) => renderAddonCard(a, i))}
        </div>

        <motion.div
          key={`total-${totals.totalAddons}`}
          initial={{ scale: 0.98, opacity: 0.9 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="mt-6 p-4 bg-[var(--aura-surface)] rounded-xl border border-[var(--aura-border)]"
        >
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between text-[var(--aura-text-muted)]"><span>Base Premium</span><span>₹{totals.basePremium.toLocaleString()}</span></div>
            {totals.totalAddons > 0 && (<><div className="flex justify-between text-[var(--aura-text-muted)]"><span>Add-ons</span><span>₹{totals.totalAddons.toLocaleString()}</span></div><div className="flex justify-between text-[var(--aura-text-muted)]"><span>GST (18%)</span><span>₹{totals.gst.toLocaleString()}</span></div></>)}
            <div className="border-t border-[var(--aura-border)] pt-2 flex justify-between font-bold text-[var(--aura-text)] text-[15px]"><span>Total</span><span>₹{totals.total.toLocaleString()}</span></div>
          </div>
        </motion.div>

        <div className="flex gap-3 mt-4">
          <button onClick={handleSkip} className="flex-1 py-3 px-4 bg-[var(--aura-surface-2)] border border-[var(--aura-border)] rounded-xl text-[14px] font-semibold text-[var(--aura-text)] hover:bg-[var(--aura-surface-2)] transition-colors">Continue without add-ons</button>
          <button onClick={handleContinue} style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }} className="flex-1 py-3 px-4 rounded-xl text-[14px] font-semibold hover:opacity-90 transition-colors active:scale-[0.98]">Continue</button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showVariantModal.show && showVariantModal.addon && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowVariantModal({ addon: null, show: false })}>
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md max-h-[45vh] overflow-y-auto bg-[var(--aura-surface)] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[var(--aura-border)]">
              <div className="p-5">
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
                <h3 className="text-[18px] font-bold text-[var(--aura-text)] mb-1">Select Personal Accident coverage amount</h3>
                <p className="text-[12px] text-[var(--aura-text-muted)] mb-5">Accidents can result in death or permanent disability. A Personal Accident Cover protects the owner-driver in such situations.</p>
                <div className="space-y-3">
                  {showVariantModal.addon.variants?.map((variant: any) => (
                    <button key={variant.id} onClick={() => selectVariant(showVariantModal.addon, variant)} className="w-full p-4 bg-[var(--aura-surface)] hover:bg-[var(--aura-surface-2)] border border-[var(--aura-border)] hover:border-[#A855F7]/30 rounded-xl text-left transition-all group">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-[var(--aura-text)]">{variant.name}</span>
                          {variant.recommended && <GradientBadge>Recommended</GradientBadge>}
                          {variant.badge && <GradientBadge>{variant.badge}</GradientBadge>}
                        </div>
                        <span className="text-[16px] font-bold text-[var(--aura-text)]">₹{variant.price}</span>
                      </div>
                      <ul className="space-y-1">
                        {variant.features?.map((feature: string, i: number) => (
                          <li key={i} className="text-[11px] text-[var(--aura-text-muted)] flex items-start gap-2"><span className="text-green-400 mt-0.5">•</span><span>{feature}</span></li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowVariantModal({ addon: null, show: false })} className="w-full mt-4 py-3 text-[14px] text-[var(--aura-text-muted)] hover:text-[var(--aura-text-muted)] transition-colors">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ═══════════════════════════════════════════════
   Document Upload Widget (Aura)
   ═══════════════════════════════════════════════ */

type DocSource = 'camera' | 'gallery' | 'pdf' | 'digilocker';

interface DocUploadResult {
  rcUploaded: boolean;
  dlUploaded: boolean;
  prevPolicyUploaded: boolean;
}

const DOC_SOURCE_OPTIONS: { id: DocSource; label: string; icon: string }[] = [
  { id: 'camera', label: 'Click photos with camera', icon: '📷' },
  { id: 'gallery', label: 'Upload both sides from gallery', icon: '🖼️' },
  { id: 'pdf', label: 'Upload PDF / Zip file', icon: '📄' },
  { id: 'digilocker', label: 'Fetch from Digilocker', icon: '🔒' },
];

export function DocumentUploadWidget({ onContinue }: { onContinue: (result: DocUploadResult) => void }) {
  const state = useMotorStore() as MotorJourneyState;
  const hasAutoRC = !!(state.registrationNumber && state.vehicleData?.make);

  const [rcUploaded, setRcUploaded] = useState(hasAutoRC);
  const [dlUploaded, setDlUploaded] = useState(false);
  const [prevPolicyUploaded, setPrevPolicyUploaded] = useState(false);
  const [sourceSheet, setSourceSheet] = useState<'rc' | 'dl' | 'prev' | null>(null);
  const [uploadingFor, setUploadingFor] = useState<'rc' | 'dl' | 'prev' | null>(null);

  const ownerName = state.ownerName || 'You';
  const regNo = state.registrationNumber || 'your vehicle';
  const chassisNo = state.chassisNumber || 'XXXXXXXXXXXX';

  const handleSourceSelect = (_source: DocSource) => {
    const target = sourceSheet;
    setSourceSheet(null);
    setUploadingFor(target);
    setTimeout(() => {
      if (target === 'rc') setRcUploaded(true);
      if (target === 'dl') setDlUploaded(true);
      if (target === 'prev') setPrevPolicyUploaded(true);
      setUploadingFor(null);
    }, 900);
  };

  const canProceed = rcUploaded && dlUploaded;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3 w-full max-w-sm"
      >
        <p className="text-[13px] font-semibold text-[var(--aura-text-muted)] uppercase tracking-wide px-1 mb-1">Upload important documents</p>

        {/* RC Card */}
        <div className={`rounded-2xl border transition-all overflow-hidden ${rcUploaded ? 'border-green-500/40 bg-green-500/5' : 'border-[var(--aura-border)] bg-[var(--aura-surface)]'}`}>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${rcUploaded ? 'bg-green-500/20' : 'bg-[var(--aura-surface-2)]'}`}>
                <svg className={`w-5 h-5 ${rcUploaded ? 'text-green-400' : 'text-[var(--aura-text-muted)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[14px] font-semibold text-[var(--aura-text)]">Registration Certificate (RC)</p>
                  {hasAutoRC && rcUploaded && !uploadingFor && (
                    <span className="text-[10px] font-semibold text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full">Auto-fetched ✓</span>
                  )}
                  {!hasAutoRC && rcUploaded && (
                    <span className="text-[10px] font-semibold text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full">Uploaded ✓</span>
                  )}
                </div>
                <p className="text-[12px] text-[var(--aura-text-subtle)]">
                  {hasAutoRC ? 'Fetched from Vahan portal' : `Upload RC for ${regNo}`}
                </p>
              </div>
            </div>

            {hasAutoRC && rcUploaded && (
              <div className="bg-[var(--aura-surface-2)] rounded-xl px-3 py-2.5 mb-3 space-y-1.5">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[var(--aura-text-subtle)]">Registration holder</span>
                  <span className="text-[var(--aura-text)] font-medium">{ownerName}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[var(--aura-text-subtle)]">Vehicle number</span>
                  <span className="text-[var(--aura-text)] font-medium">{regNo}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[var(--aura-text-subtle)]">Chassis no.</span>
                  <span className="text-[var(--aura-text)] font-medium">{chassisNo}</span>
                </div>
              </div>
            )}

            {uploadingFor === 'rc' ? (
              <div className="flex items-center gap-2 py-1">
                <div className="w-4 h-4 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin" />
                <span className="text-[13px] text-[var(--aura-text-subtle)]">Uploading...</span>
              </div>
            ) : (
              <button onClick={() => setSourceSheet('rc')} className="text-[13px] text-[#A855F7] hover:text-[#C084FC] font-medium transition-colors">
                {rcUploaded ? 'Re-upload ↗' : 'Upload file ↑'}
              </button>
            )}
          </div>
        </div>

        {/* DL Card */}
        <div className={`rounded-2xl border transition-all overflow-hidden ${dlUploaded ? 'border-green-500/40 bg-green-500/5' : 'border-[var(--aura-border)] bg-[var(--aura-surface)]'}`}>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${dlUploaded ? 'bg-green-500/20' : 'bg-[var(--aura-surface-2)]'}`}>
                <svg className={`w-5 h-5 ${dlUploaded ? 'text-green-400' : 'text-[var(--aura-text-muted)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-semibold text-[var(--aura-text)]">Driving Licence (DL)</p>
                  {dlUploaded && (
                    <span className="text-[10px] font-semibold text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full">Uploaded ✓</span>
                  )}
                </div>
                <p className="text-[12px] text-[var(--aura-text-subtle)]">Upload DL for {ownerName}</p>
              </div>
            </div>

            {uploadingFor === 'dl' ? (
              <div className="flex items-center gap-2 py-1">
                <div className="w-4 h-4 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin" />
                <span className="text-[13px] text-[var(--aura-text-subtle)]">Uploading...</span>
              </div>
            ) : (
              <button onClick={() => setSourceSheet('dl')} className="text-[13px] text-[#A855F7] hover:text-[#C084FC] font-medium transition-colors">
                {dlUploaded ? 'Re-upload ↗' : 'Upload file ↑'}
              </button>
            )}
          </div>
        </div>

        {/* Previous Year's Policy — optional */}
        <div className={`rounded-2xl border transition-all overflow-hidden ${prevPolicyUploaded ? 'border-green-500/40 bg-green-500/5' : 'border-[var(--aura-border)] bg-[var(--aura-surface)]'}`}>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${prevPolicyUploaded ? 'bg-green-500/20' : 'bg-[var(--aura-surface-2)]'}`}>
                <svg className={`w-5 h-5 ${prevPolicyUploaded ? 'text-green-400' : 'text-[var(--aura-text-muted)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[14px] font-semibold text-[var(--aura-text)]">Previous Year&apos;s Policy</p>
                  {prevPolicyUploaded && (
                    <span className="text-[10px] font-semibold text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full">Uploaded ✓</span>
                  )}
                  <span className="text-[10px] text-[var(--aura-text-subtle)] bg-[var(--aura-surface-2)] px-2 py-0.5 rounded-full">Optional</span>
                </div>
                <p className="text-[12px] text-[var(--aura-text-subtle)]">Helps speed up claim processing</p>
              </div>
            </div>

            {uploadingFor === 'prev' ? (
              <div className="flex items-center gap-2 mt-3">
                <div className="w-4 h-4 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin" />
                <span className="text-[13px] text-[var(--aura-text-subtle)]">Uploading...</span>
              </div>
            ) : (
              <button onClick={() => setSourceSheet('prev')} className="mt-3 text-[13px] text-[#A855F7] hover:text-[#C084FC] font-medium transition-colors">
                {prevPolicyUploaded ? 'Replace ↗' : '+ Add more'}
              </button>
            )}
          </div>
        </div>

        <p className="text-[12px] text-center text-[var(--aura-text-subtle)] py-1">
          Incorrect details?{' '}
          <button className="text-[#A855F7] underline underline-offset-2">Update here</button>
        </p>

        <button
          onClick={() => canProceed && onContinue({ rcUploaded, dlUploaded, prevPolicyUploaded })}
          disabled={!canProceed}
          style={canProceed ? { background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' } : {}}
          className={`w-full py-4 rounded-xl text-[15px] font-bold transition-all ${
            canProceed
              ? 'text-white hover:opacity-90 active:scale-[0.97]'
              : 'bg-[var(--aura-surface-2)] text-[var(--aura-text-subtle)] cursor-not-allowed'
          }`}
        >
          {canProceed ? 'Proceed →' : `Upload ${!rcUploaded ? 'RC' : 'DL'} to continue`}
        </button>

        <button className="w-full py-2 text-[13px] text-[var(--aura-text-subtle)] hover:text-[var(--aura-text-muted)] transition-colors">
          Save and continue later
        </button>
      </motion.div>

      {/* Source selector bottom sheet — same pattern as Garage Tier / variant modals */}
      <AnimatePresence>
        {sourceSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setSourceSheet(null)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md max-h-[45vh] overflow-y-auto bg-[var(--aura-surface)] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[var(--aura-border)]"
            >
              <div className="p-5">
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
                <p className="text-[16px] font-semibold text-[var(--aura-text)] mb-1">Select a source</p>
                <p className="text-[12px] text-[var(--aura-text-subtle)] mb-5">in PNG, JPEG, or PDF format (Max 10 MB)</p>
              <div className="space-y-2">
                {DOC_SOURCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSourceSelect(opt.id)}
                    className="w-full flex items-center gap-4 p-4 bg-[var(--aura-surface-2)] hover:bg-[var(--aura-surface-hover)] border border-[var(--aura-border)] hover:border-[#A855F7]/30 rounded-xl transition-all text-left"
                  >
                    <span className="text-2xl w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[var(--aura-surface-2)]">{opt.icon}</span>
                    <span className="text-[14px] font-medium text-[var(--aura-text)]">{opt.label}</span>
                    <svg className="w-4 h-4 text-[var(--aura-text-subtle)] ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                ))}
              </div>
              <button onClick={() => setSourceSheet(null)} className="w-full mt-4 py-3 text-[14px] text-[var(--aura-text-muted)] hover:text-[var(--aura-text)] transition-colors">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
