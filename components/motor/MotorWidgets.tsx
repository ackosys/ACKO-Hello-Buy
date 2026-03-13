'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
import { Option } from '../../lib/core/types';
import { assetPath } from '../../lib/assetPath';
import { useMotorStore } from '../../lib/motor/store';
import { useThemeStore } from '../../lib/themeStore';
import { MotorJourneyState, NcbPercentage } from '../../lib/motor/types';
import { getMotorAddOns } from '../../lib/motor/plans';
import Image from 'next/image';
import { useT } from '../../lib/translations';
import GradientBadge from '../ds/GradientBadge';
import BaseSelectionCards, { type SelectionTheme } from '../ds/SelectionCards';
import BaseTextInput from '../ds/TextInput';
import type { InputTheme } from '../ds/NumberInput';

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
        style={{ filter: 'var(--motor-icon-filter, brightness(0) invert(1))', opacity: 'var(--motor-icon-opacity, 0.85)' as unknown as number }}
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
   Selection Cards (Motor version) — DS base + KYC sheet
   ═══════════════════════════════════════════════ */

const MOTOR_THEME: SelectionTheme = {
  surface: 'var(--motor-surface)',
  surfaceSelected: 'var(--motor-selected-bg)',
  surface2: 'var(--motor-surface-2)',
  border: 'var(--motor-border)',
  borderSelected: 'rgb(192,132,252)',
  text: 'var(--motor-text)',
  textMuted: 'var(--motor-text-subtle)',
};

function motorRenderIcon(icon: string, className?: string) {
  return <MotorIcon icon={icon} className={`${className || 'w-6 h-6'} text-purple-300`} />;
}

function motorRenderLogo(logoUrl: string, label: string, className?: string) {
  return <img src={assetPath(logoUrl)} alt={label} className={className || 'w-7 h-7 object-contain'} />;
}

export function MotorSelectionCards({ options, onSelect }: { options: Option[]; onSelect: (id: string) => void }) {
  const tw = useT().motorWidgets;
  const [showKycSheet, setShowKycSheet] = useState(false);
  const theme = useThemeStore((s) => s.theme);
  const [kycStage, setKycStage] = useState<'info' | 'verify'>('info');
  const [kycIframeLoading, setKycIframeLoading] = useState(true);

  const handleSelect = (id: string) => {
    if (id === 'start_kyc') {
      setShowKycSheet(true);
      return;
    }
    onSelect(id);
  };

  const handleKycComplete = () => {
    setShowKycSheet(false);
    setKycStage('info');
    setKycIframeLoading(true);
    onSelect('start_kyc');
  };

  return (
    <>
      <BaseSelectionCards
        options={options}
        onSelect={handleSelect}
        renderIcon={motorRenderIcon}
        renderLogo={motorRenderLogo}
        theme={MOTOR_THEME}
      />

      {typeof document !== 'undefined' && createPortal(
        <div className={`motor-${theme}`}>
        <AnimatePresence>
          {showKycSheet && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setShowKycSheet(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-t-3xl flex flex-col"
                style={{
                  height: '95vh',
                  background: 'var(--motor-glass-bg)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid var(--motor-border-strong)',
                  borderBottom: 'none',
                }}
              >
                <div className="px-5 pt-5 pb-4 flex-shrink-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-[22px] font-bold leading-tight" style={{ color: 'var(--motor-text)' }}>
                        Complete KYC
                      </p>
                      <p className="text-[13px] mt-1.5 leading-snug" style={{ color: 'var(--motor-text-muted)' }}>
                        {kycStage === 'info'
                          ? 'HyperVerge, our reliable partner, will handle the KYC process for you with 100% security'
                          : tw.kycSubtitle}
                      </p>
                    </div>
                    <button
                      onClick={() => kycStage === 'verify' ? setKycStage('info') : setShowKycSheet(false)}
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
                      style={{ background: 'var(--motor-surface-2, var(--motor-surface))' }}
                    >
                      <svg className="w-4 h-4" style={{ color: 'var(--motor-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {kycStage === 'info' ? (
                  <>
                    <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-2">
                      {[
                        { step: '1', title: tw.kycStep1Title, desc: tw.kycStep1Desc },
                        { step: '2', title: tw.kycStep2Title, desc: tw.kycStep2Desc },
                        { step: '3', title: tw.kycStep3Title, desc: tw.kycStep3Desc },
                      ].map((item) => (
                        <div key={item.step} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl" style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-500/20 border border-purple-400/30">
                            <span className="text-[12px] font-bold text-purple-300">{item.step}</span>
                          </div>
                          <div>
                            <p className="text-[14px] font-medium" style={{ color: 'var(--motor-text)' }}>{item.title}</p>
                            <p className="text-[12px] mt-0.5" style={{ color: 'var(--motor-text-muted)' }}>{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-5 py-4 flex-shrink-0 space-y-2">
                      <button
                        onClick={() => { setKycStage('verify'); setKycIframeLoading(true); }}
                        className="w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                        style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
                      >
                        Start Verification
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setShowKycSheet(false)}
                        className="w-full py-2.5 text-[13px] transition-colors"
                        style={{ color: 'var(--motor-text-muted)' }}
                      >
                        I&apos;ll do this later
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1 relative overflow-hidden mx-4 rounded-2xl" style={{ border: '1px solid var(--motor-border)' }}>
                      {kycIframeLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: 'var(--motor-glass-bg)' }}>
                          <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--motor-border-strong)', borderTopColor: 'transparent' }} />
                          <p className="text-[12px]" style={{ color: 'var(--motor-text-muted)' }}>Loading…</p>
                        </div>
                      )}
                      <iframe
                        src="https://example.com"
                        className="w-full h-full border-0"
                        allow="camera; microphone; geolocation"
                        title="KYC Verification"
                        onLoad={() => setKycIframeLoading(false)}
                      />
                    </div>
                    <div className="px-5 py-4 flex-shrink-0">
                      <button
                        onClick={handleKycComplete}
                        className="w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.97]"
                        style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
                      >
                        I&apos;ve Completed Verification
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>,
        document.body
      )}
    </>
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
          <span className="text-white text-[8px] font-bold">IND</span>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={placeholder || 'MH 04 EQ 4392'}
          className="w-full pl-16 pr-4 py-4 rounded-xl text-[18px] font-semibold focus:outline-none focus:border-purple-400 transition-colors tracking-wider uppercase"
          style={{ background: 'var(--motor-input-bg)', border: '1px solid var(--motor-input-border)', color: 'var(--motor-input-text)' }}
          maxLength={16}
          autoComplete="off"
        />
      </div>
      {error && <p className="text-[12px] text-red-400 mt-1.5">{error}</p>}
      <button
        onClick={handleSubmit}
        className="mt-4 w-full py-3.5 rounded-xl text-[15px] font-semibold transition-colors active:scale-[0.97]"
        style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
      >
        Find my {useMotorStore.getState().vehicleType === 'bike' ? 'bike' : 'car'}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Generic Text / Number Input — DS base
   ═══════════════════════════════════════════════ */

const MOTOR_INPUT_THEME: InputTheme = {
  inputBg: 'var(--motor-input-bg)',
  inputBorder: 'var(--motor-input-border)',
  inputBorderFocus: 'rgb(168,85,247)',
  inputText: 'var(--motor-input-text)',
  buttonBg: 'var(--btn-primary-bg)',
  buttonText: 'var(--btn-primary-text)',
  buttonShadow: 'var(--btn-primary-shadow)',
};

export function MotorTextInput({
  placeholder,
  defaultValue,
  inputType = 'text',
  onSubmit,
  validate,
  maxLength,
}: {
  placeholder?: string;
  defaultValue?: string;
  inputType?: 'text' | 'number' | 'tel';
  onSubmit: (value: string) => void;
  validate?: (value: string) => string | null;
  maxLength?: number;
}) {
  return (
    <BaseTextInput
      placeholder={placeholder || 'Type here...'}
      defaultValue={defaultValue}
      inputType={inputType}
      onSubmit={onSubmit}
      validate={validate}
      maxLength={maxLength}
      theme={MOTOR_INPUT_THEME}
    />
  );
}

/* ═══════════════════════════════════════════════
   Progressive Loader — Finding your vehicle
   ═══════════════════════════════════════════════ */

export function ProgressiveLoader({ onComplete }: { onComplete: (result: 'success' | 'failed') => void }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [stagesComplete, setStagesComplete] = useState(false);
  const { vehicleType, registrationNumber } = useMotorStore();
  const tw = useT().motorWidgets;

  const LOADING_STAGES = [
    { message: tw.regSearchingVaahan, duration: 1500 },
    { message: tw.regFetching, duration: 1500 },
    { message: tw.regCheckingRC, duration: 1200 },
    { message: tw.regLoadingPolicy, duration: 1200 },
    { message: tw.regAlmostThere, duration: 800 },
  ];

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
      <div className="bg-white/8 border border-white/15 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <MotorIcon icon={vehicleType === 'bike' ? 'bike' : 'car'} className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <p className="text-[11px] text-white/40 uppercase tracking-wider">{tw.registration}</p>
            <p className="text-[16px] font-bold text-white tracking-wider">{registrationNumber || 'N/A'}</p>
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
                  className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full"
                />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-white/5 flex-shrink-0" />
            )}
            <span className={`text-[13px] ${i < currentStage ? 'text-white/70' : i === currentStage ? 'text-white' : 'text-white/30'}`}>
              {stage.message}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
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
  'Ather': '/car-images/Activa.png',
};

function getVehicleImage(make: string, vehicleType: string): string {
  const map = vehicleType === 'bike' ? BIKE_IMAGE_MAP : VEHICLE_IMAGE_MAP;
  return assetPath(map[make] || (vehicleType === 'bike' ? '/car-images/Splendor.png' : '/car-images/Swift.png'));
}

export function VehicleDetailsCard({ onConfirm, onRetry }: { onConfirm: () => void; onRetry: () => void }) {
  const state = useMotorStore.getState() as MotorJourneyState;
  const v = state.vehicleData;
  const p = state.previousPolicy;
  const [confirmed, setConfirmed] = useState(false);
  const vehicleImg = getVehicleImage(v.make, state.vehicleType || 'car');
  const isLight = state.theme === 'light';
  const tw = useT().motorWidgets;

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
          background: isLight ? '#FFFFFF' : 'var(--motor-surface)',
          border: `1px solid ${isLight ? 'rgba(4,2,34,0.08)' : 'var(--motor-border)'}`,
        }}
      >
        {/* Vehicle Header */}
        <div
          className="px-4 py-4"
          style={{ background: isLight ? '#EFE9FB' : 'rgba(168,85,247,0.16)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-[72px] h-[72px] rounded-xl flex items-center justify-center overflow-hidden p-1"
              style={{ background: '#FFFFFF' }}
            >
              {vehicleImg ? (
                <img src={vehicleImg} alt={`${v.make} ${v.model}`} className="w-full h-full object-contain" />
              ) : (
                <MotorIcon icon={state.vehicleType === 'bike' ? 'bike' : 'car'} className="w-6 h-6 text-purple-300" />
              )}
            </div>
            <div>
              <h3 className="text-[18px] font-semibold" style={{ color: isLight ? '#040222' : 'var(--motor-text)' }}>
                {v.make} {v.model}
              </h3>
              <p className="text-[12px] mt-1" style={{ color: isLight ? '#5B5675' : 'var(--motor-text-muted)' }}>
                {v.variant} • {String(v.fuelType || '').toUpperCase()} • {v.registrationYear}
              </p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="px-4 py-4 space-y-4">
          <div>
            <p className="text-[14px]" style={{ color: isLight ? '#5B5675' : 'var(--motor-text-muted)' }}>{tw.registration}</p>
            <p className="text-[14px] font-semibold mt-1 tracking-[0.01em]" style={{ color: isLight ? '#040222' : 'var(--motor-text)' }}>
              {formatRegistration(state.registrationNumber)}
            </p>
          </div>
          {p.insurer && (
            <div>
              <p className="text-[14px]" style={{ color: isLight ? '#5B5675' : 'var(--motor-text-muted)' }}>{tw.currentInsurance}</p>
              <p className="text-[14px] font-semibold mt-1" style={{ color: isLight ? '#040222' : 'var(--motor-text)' }}>{p.insurer}</p>
            </div>
          )}
          {p.expiryDate && (
            <div>
              <p className="text-[14px]" style={{ color: isLight ? '#5B5675' : 'var(--motor-text-muted)' }}>{tw.policyExpiry}</p>
              <p className="text-[14px] font-semibold mt-1" style={{ color: isLight ? '#040222' : 'var(--motor-text)' }}>{p.expiryDate}</p>
            </div>
          )}
          {p.ncbPercentage > 0 && (
            <div>
              <p className="text-[14px]" style={{ color: isLight ? '#5B5675' : 'var(--motor-text-muted)' }}>NCB (No Claim Bonus)</p>
              <p className="text-[14px] font-semibold mt-1" style={{ color: isLight ? '#040222' : 'var(--motor-text)' }}>{p.ncbPercentage}%</p>
            </div>
          )}

          <div className="pt-1">
            <button
              onClick={handleConfirm}
              disabled={confirmed}
              className="w-full h-12 rounded-lg text-[14px] font-semibold transition-colors active:scale-[0.97] disabled:opacity-60"
              style={{ background: isLight ? '#0A0A0F' : 'var(--btn-primary-bg)', color: '#FFFFFF', boxShadow: isLight ? undefined : 'var(--btn-primary-shadow)' }}
            >
              {confirmed ? tw.confirmed : tw.thisIsCorrect}
            </button>

            <button
              onClick={onRetry}
              className="mt-2 w-full h-10 text-[14px] font-medium transition-colors"
              style={{ color: isLight ? '#191919' : 'var(--motor-text-muted)' }}
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
  'Maruti Suzuki': '/logos/Suzuki.svg',
  'Hyundai': '/logos/Hyundai.svg',
  'Tata': '/logos/TATA.svg',
  'Kia': '/logos/Kia.svg',
  'Mahindra': '/logos/Mahindra.svg',
  'Toyota': '/logos/TATA.svg',
  'Honda': '/logos/Honda.svg',
  'MG': '/logos/MG.svg',
  'Volkswagen': '/logos/Volvo.svg',
  'Skoda': '/logos/Opel.svg',
  'Renault': '/logos/Renault.svg',
  'Nissan': '/logos/Mitsubishi.svg',
  'Jeep': '/logos/Jeep.svg',
  'Mercedes-Benz': '/logos/Mercedez.svg',
  'BMW': '/logos/BMW.svg',
  'Audi': '/logos/Audi.svg',
  'Hero': '/logos/Hero.svg',
  'Bajaj': '/logos/Bajaj.svg',
  'TVS': '/logos/TVS.svg',
  'Royal Enfield': '/logos/Royal Enfield.svg',
  'Yamaha': '/logos/Suzuki.svg',
  'Suzuki': '/logos/Suzuki.svg',
  'KTM': '/logos/BMW.svg',
  'Kawasaki': '/logos/Honda.svg',
  'Jawa': '/logos/Mahindra.svg',
  'Ola': '/logos/ola.svg',
  'Ather': '/logos/Ather.svg',
  'Revolt': '/logos/Revolt.svg',
  'Aprilia': '/logos/Ferrari.svg',
  'Benelli': '/logos/Ferrari.svg',
  'BMW Motorrad': '/logos/BMW.svg',
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
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--motor-text-subtle)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${vehicleType === 'bike' ? 'bike' : 'car'} brand`}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[14px] focus:outline-none focus:border-purple-400/50 transition-colors"
          style={{ background: 'var(--motor-input-bg)', border: '1px solid var(--motor-input-border)', color: 'var(--motor-input-text)' }}
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
            className="relative flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl transition-all duration-200 active:scale-[0.95]"
            style={selected === brand
              ? { background: 'var(--motor-selected-bg)', border: '1px solid var(--motor-selected-border, #A855F7)' }
              : { background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }
            }
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: 'var(--motor-surface-2)' }}>
              {BRAND_LOGO_MAP[brand] ? (
                <img src={assetPath(BRAND_LOGO_MAP[brand])} alt={brand} className="w-7 h-7 object-contain" />
              ) : (
                <span className="text-[11px] font-bold" style={{ color: 'var(--motor-text-muted)' }}>{brand.slice(0, 2)}</span>
              )}
            </div>
            <span className="text-[11px] font-medium text-center leading-tight" style={{ color: 'var(--motor-text)' }}>{brand}</span>
            {selected === brand && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
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
   Model Selector — Based on selected brand
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
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--motor-text-subtle)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${brand} model`}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[14px] focus:outline-none focus:border-purple-400/50 transition-colors"
          style={{ background: 'var(--motor-input-bg)', border: '1px solid var(--motor-input-border)', color: 'var(--motor-input-text)' }}
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
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 active:scale-[0.98]"
            style={selected === model
              ? { background: 'var(--motor-selected-bg)', border: '1px solid var(--motor-selected-border, #A855F7)' }
              : { border: '1px solid transparent' }
            }
          >
            <span className="text-[14px] font-medium" style={{ color: 'var(--motor-text)' }}>{model}</span>
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
              style={selected === model
                ? { borderColor: '#A855F7', background: '#A855F7' }
                : { borderColor: 'var(--motor-border-strong)' }
              }
            >
              {selected === model && (
                <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
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
   Variant Selector
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
  // fuelType is stored lowercase from scripts ('petrol'), tabs use Title Case ('Petrol')
  const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
  const existingFuel = vehicleData.fuelType ? capitalize(vehicleData.fuelType) : '';
  const existingVariant = vehicleData.variant;
  const [activeFuel, setActiveFuel] = useState<string>(existingFuel || 'Petrol');
  const isBike = vehicleType === 'bike';

  const fuelTypes = isBike ? ['Petrol', 'Electric'] : FUEL_TYPES;
  const variants = FUEL_VARIANTS[activeFuel] || FUEL_VARIANTS['Petrol'];

  // Pre-select the previously chosen variant if it exists in the current fuel list
  const [selected, setSelected] = useState<string | null>(
    existingVariant && variants.includes(existingVariant) ? existingVariant : null
  );

  const handleSelect = (variant: string) => {
    setSelected(variant);
    setTimeout(() => onSelect(variant), 300);
  };

  return (
    <div>
      <div className="flex gap-1.5 mb-3 p-1 rounded-xl" style={{ background: 'var(--motor-surface-2)' }}>
        {fuelTypes.map(fuel => (
          <button
            key={fuel}
            onClick={() => {
              setActiveFuel(fuel);
              // Re-apply pre-selection if the existing variant exists in the new fuel list
              const newVariants = FUEL_VARIANTS[fuel] || [];
              setSelected(existingVariant && newVariants.includes(existingVariant) ? existingVariant : null);
            }}
            className="flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all"
            style={activeFuel === fuel
              ? { background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }
              : { color: 'var(--motor-text-muted)' }
            }
          >
            {fuel}
          </button>
        ))}
      </div>
      {!selected && (
        <p className="text-[11px] mb-2 px-1" style={{ color: 'var(--motor-text-subtle)' }}>Select your {vehicleData.model || 'car'}&apos;s fuel type to see variants</p>
      )}
      <div className="space-y-1">
        {variants.map((variant, i) => (
          <motion.button
            key={variant}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.025 }}
            onClick={() => handleSelect(variant)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 active:scale-[0.98]"
            style={selected === variant
              ? { background: 'var(--motor-selected-bg)', border: '1px solid var(--motor-selected-border, #A855F7)' }
              : { border: '1px solid transparent' }
            }
          >
            <span className="text-[14px] font-medium" style={{ color: 'var(--motor-text)' }}>{variant}</span>
            <svg className="w-4 h-4" style={{ color: 'var(--motor-text-subtle)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Year Selector — Registration year
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
            className="w-full px-3 py-2.5 rounded-xl text-[14px] focus:outline-none cursor-pointer pr-8 appearance-none"
            style={{ background: 'var(--motor-input-bg)', border: '1px solid var(--motor-input-border)', color: 'var(--motor-input-text)' }}
          >
            <option value="" disabled>Year</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--motor-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
        <div className="relative flex-1">
          <select
            value={selectedMonth ?? ''}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-[14px] focus:outline-none cursor-pointer pr-8 appearance-none"
            style={{ background: 'var(--motor-input-bg)', border: '1px solid var(--motor-input-border)', color: 'var(--motor-input-text)' }}
          >
            <option value="" disabled>Month</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--motor-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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
            className="py-2.5 rounded-lg text-center transition-all duration-200 active:scale-[0.95]"
            style={selectedYear === year
              ? { background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)', fontWeight: 700 }
              : { background: 'var(--motor-surface)', border: '1px solid var(--motor-border)', color: 'var(--motor-text-muted)' }
            }
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
          className="mt-3 w-full py-3 rounded-xl text-[14px] font-semibold transition-colors active:scale-[0.97]"
          style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
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
          className="relative flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl transition-all duration-200 active:scale-[0.95]"
          style={selected === opt.value
            ? { background: 'var(--motor-selected-bg)', border: '1px solid var(--motor-selected-border, #A855F7)' }
            : { background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }
          }
        >
          {selected === opt.value && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center"
            >
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </motion.div>
          )}
          <span className="text-[20px] font-bold leading-none" style={{ color: selected === opt.value ? '#A855F7' : 'var(--motor-text)' }}>
            {opt.label}
          </span>
          <span className="text-[10px] text-center leading-tight" style={{ color: 'var(--motor-text-muted)' }}>{opt.description}</span>
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
  const tw = useT().motorWidgets;

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
        <h3 className="text-[18px] font-bold mb-1" style={{ color: 'var(--motor-text)' }}>{tw.ncbApplied}</h3>
        <p className="text-[14px] mb-3" style={{ color: 'var(--motor-text-muted)' }}>
          {state.newNcbPercentage}% discount on your Own Damage premium
        </p>
        <div className="rounded-xl p-3" style={{ background: 'var(--motor-surface-2)' }}>
          <p className="text-[12px]" style={{ color: 'var(--motor-text-subtle)' }}>{tw.ncbStayClaim}</p>
          <p className="text-[20px] font-bold text-green-400">{state.newNcbPercentage}% OFF</p>
        </div>
      </div>
      <button
        onClick={onContinue}
        className="mt-4 w-full py-3.5 rounded-xl text-[15px] font-semibold transition-colors active:scale-[0.97]"
        style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
      >
        {tw.continueBtn}
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   Insurer Selector
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
  const tw = useT().motorWidgets;

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
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--motor-text-subtle)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tw.searchInsurer}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[14px] focus:outline-none focus:border-purple-400/50 transition-colors"
          style={{ background: 'var(--motor-input-bg)', border: '1px solid var(--motor-input-border)', color: 'var(--motor-input-text)' }}
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
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 active:scale-[0.98]"
            style={selected === insurer
              ? { background: 'var(--motor-selected-bg)', border: '1px solid var(--motor-selected-border, #A855F7)' }
              : { border: '1px solid transparent' }
            }
          >
            <span className="text-[14px] font-medium" style={{ color: 'var(--motor-text)' }}>{insurer}</span>
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
              style={selected === insurer
                ? { borderColor: '#A855F7', background: '#A855F7' }
                : { borderColor: 'var(--motor-border-strong)' }
              }
            >
              {selected === insurer && (
                <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </motion.svg>
              )}
            </div>
          </motion.button>
        ))}
      </div>
      <button
        onClick={() => onSelect('skip')}
        className="mt-3 w-full py-2.5 text-[12px] transition-colors"
        style={{ color: 'var(--motor-text-subtle)' }}
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
  const isLight = state.theme === 'light';
  const editable = !!onEditField;
  const tw = useT().motorWidgets;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-sm"
    >
      <div
        className="rounded-xl overflow-hidden shadow-[0_4px_10px_-2px_rgba(54,53,76,0.08)] p-4 space-y-4"
        style={{
          background: isLight ? '#FFFFFF' : 'var(--motor-surface)',
          border: `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'var(--motor-border)'}`,
        }}
      >
        <h3 className="text-[16px] font-semibold leading-[22px]" style={{ color: isLight ? '#040222' : 'var(--motor-text)' }}>
          Vehicle Summary
        </h3>

        {v.make && <SummaryRow label={tw.labelMake} value={v.make} isLight={isLight} editable={editable} onEdit={() => onEditField?.('manual_entry.select_brand')} />}
        {v.model && <SummaryRow label={tw.labelModel} value={v.model} isLight={isLight} editable={editable} onEdit={() => onEditField?.('manual_entry.select_model')} />}
        {v.variant && <SummaryRow label={tw.labelVariant} value={v.variant} isLight={isLight} editable={editable} onEdit={() => onEditField?.('manual_entry.select_variant')} />}
        {v.fuelType && <SummaryRow label={tw.labelFuel} value={v.fuelType} isLight={isLight} editable={editable} onEdit={() => onEditField?.('manual_entry.select_fuel')} />}
        {!isBrandNew && state.registrationNumber && <SummaryRow label={tw.labelRegNumber} value={state.registrationNumber} isLight={isLight} editable={editable} onEdit={() => onEditField?.('reg_number')} />}
        {!isBrandNew && v.registrationYear && <SummaryRow label={tw.labelRegYear} value={String(v.registrationYear)} isLight={isLight} editable={editable} onEdit={() => onEditField?.('reg_year')} />}
        {!isBrandNew && state.previousPolicy.ncbPercentage > 0 && <SummaryRow label={tw.labelNcb} value={`${state.previousPolicy.ncbPercentage}%`} isLight={isLight} editable={editable} onEdit={() => onEditField?.('ncb')} />}
        {!isBrandNew && state.policyStatus && <SummaryRow label={tw.labelPolicyStatus} value={state.policyStatus === 'active' ? tw.statusActive : tw.statusExpired} isLight={isLight} />}

        <button
          onClick={onConfirm}
          className="w-full h-12 rounded-lg text-[16px] font-semibold transition-colors active:scale-[0.97]"
          style={{ background: isLight ? '#0A0A0F' : 'var(--btn-primary-bg)', color: '#FFFFFF', boxShadow: isLight ? undefined : 'var(--btn-primary-shadow)' }}
        >
          View Prices
        </button>
      </div>
    </motion.div>
  );
}

const PencilIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="#1B73E8" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
  </svg>
);

function SummaryRow({ label, value, isLight, highlight, editable, onEdit }: { label: string; value: string; isLight?: boolean; highlight?: boolean; editable?: boolean; onEdit?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <p className="text-[14px] leading-[20px]" style={{ color: isLight ? '#5B5675' : 'var(--motor-text-muted)' }}>{label}</p>
        <p className="text-[14px] font-medium leading-[20px] tracking-[-0.1px]" style={{ color: highlight ? '#22C55E' : (isLight ? '#040222' : 'var(--motor-text)') }}>{value}</p>
      </div>
      {editable && onEdit && (
        <button onClick={onEdit} className="p-1 transition-opacity hover:opacity-70">
          <PencilIcon />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Rejection Screen
   ═══════════════════════════════════════════════ */

export function RejectionScreen() {
  const tw = useT().motorWidgets;
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
        <h3 className="text-[16px] font-bold text-white mb-2">{tw.unableToInsure}</h3>
        <p className="text-[13px] text-white/50">
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
      
      setTimeout(async () => {
        try {
          const { getPlansForCombination, determinePlanCombination, calculateIDV } = await import('../../lib/motor/plans');
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
      <div className="bg-white/8 border border-white/15 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <MotorIcon icon={vehicleType === 'bike' ? 'bike' : 'car'} className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white">{vehicleData.make} {vehicleData.model}</p>
            <p className="text-[11px] text-white/40">{vehicleData.variant} · {vehicleData.fuelType}</p>
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
                  className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full"
                />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-white/5 flex-shrink-0" />
            )}
            <span className={`text-[13px] ${i < currentStage ? 'text-white/70' : i === currentStage ? 'text-white' : 'text-white/30'}`}>
              {stage.message}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: stagesComplete ? '100%' : `${(currentStage / CALC_STAGES.length) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   IDV Slider Sheet — bottom sheet to adjust IDV
   ═══════════════════════════════════════════════ */

function IDVSliderSheet({
  idvMin,
  idvMax,
  currentIdv,
  onApply,
  onClose,
}: {
  idvMin: number;
  idvMax: number;
  currentIdv: number;
  onApply: (value: number) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(currentIdv);
  const fillPct = idvMax > idvMin ? ((value - idvMin) / (idvMax - idvMin)) * 100 : 0;
  const fmt = (n: number) => `${(n / 100000).toFixed(2)}L`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl shadow-2xl px-5 pt-5 pb-10"
        style={{
          background: 'var(--motor-glass-bg)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid var(--motor-border-strong)',
        }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[17px] font-bold" style={{ color: 'var(--motor-text)' }}>
            Insured Declared Value
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ background: 'var(--motor-surface-2)', color: 'var(--motor-text-muted)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-[12px] mb-5" style={{ color: 'var(--motor-text-subtle)' }}>
          Amount ACKO pays if your car is stolen or completely damaged
        </p>

        {/* Slider card */}
        <div
          className="rounded-2xl px-4 py-4 mb-5"
          style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[15px] font-bold" style={{ color: 'var(--motor-text)' }}>{fmt(idvMin)}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--motor-text-subtle)' }}>High Risk</p>
            </div>
            <div className="text-center">
              <p className="text-[20px] font-black leading-tight" style={{ color: 'var(--motor-text)' }}>
                IDV ₹{fmt(value)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[15px] font-bold" style={{ color: 'var(--motor-text)' }}>{fmt(idvMax)}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--motor-text-subtle)' }}>Low Risk</p>
            </div>
          </div>

          <input
            type="range"
            min={idvMin}
            max={idvMax}
            step={1000}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="idv-slider w-full"
            style={{
              background: `linear-gradient(to right, #4ade80 ${fillPct}%, var(--motor-surface-2) ${fillPct}%)`,
            }}
          />
        </div>

        <button
          onClick={() => onApply(value)}
          className="w-full py-3.5 active:scale-[0.98] font-semibold rounded-2xl text-[15px] transition-all"
          style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
        >
          Confirm IDV ₹{fmt(value)}
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   Plan Selector — 3 main plan cards
   ═══════════════════════════════════════════════ */

export function PlanSelector({ onSelect }: { onSelect: (selection: any) => void }) {
  const availablePlans = useMotorStore((s) => s.availablePlans) || [];
  const idv = useMotorStore((s) => s.idv);
  const idvMin = useMotorStore((s) => s.idvMin);
  const idvMax = useMotorStore((s) => s.idvMax);
  const updateState = useMotorStore((s) => s.updateState);
  const vehicleEntryType = useMotorStore((s) => s.vehicleEntryType);
  const vehicleType = useMotorStore((s) => s.vehicleType);
  const isBrandNew = vehicleEntryType === 'brand_new';
  const vType = vehicleType === 'bike' ? 'bike' : 'car';
  const tw = useT().motorWidgets;
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showZdVsStandard, setShowZdVsStandard] = useState(false);
  const [showGarageTier, setShowGarageTier] = useState(false);
  const [showZdVariant, setShowZdVariant] = useState(false);
  const [showOdVariant, setShowOdVariant] = useState(false);
  const [showIDVSlider, setShowIDVSlider] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Group plans by type
  const comprehensivePlans = availablePlans.filter((p: any) => p.type === 'comprehensive');
  const zeroDepPlans = availablePlans.filter((p: any) => p.type === 'zero_dep');
  const thirdPartyPlan = availablePlans.find((p: any) => p.type === 'third_party');
  const odPlans = availablePlans.filter((p: any) => p.type === 'od' || p.type === 'od_zd');

  const comprehensiveLowest = comprehensivePlans.sort((a: any, b: any) => a.totalPrice - b.totalPrice)[0];
  const zeroDepLowest = zeroDepPlans.sort((a: any, b: any) => a.totalPrice - b.totalPrice)[0];
  const odLowest = odPlans.length > 0 ? odPlans.sort((a: any, b: any) => a.totalPrice - b.totalPrice)[0] : null;

  const formatPrice = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const handleIDVApply = async (newIdv: number) => {
    setShowIDVSlider(false);
    setRefreshing(true);
    updateState({ idv: newIdv } as any);
    // Simulate recalculation delay for realistic feel
    await new Promise((r) => setTimeout(r, 900));
    try {
      const { getMotorPlanDetails } = await import('../../lib/motor/plans');
      const state = useMotorStore.getState() as MotorJourneyState;
      const comprehensiveAll = getMotorPlanDetails(state, 'comprehensive', 'all', newIdv);
      const comprehensiveNetwork = getMotorPlanDetails(state, 'comprehensive', 'network', newIdv);
      const zeroDep = getMotorPlanDetails(state, 'zero_dep', undefined, newIdv);
      const thirdParty = getMotorPlanDetails(state, 'third_party', undefined, newIdv);
      updateState({ availablePlans: [comprehensiveAll, comprehensiveNetwork, zeroDep, thirdParty] } as any);
    } catch {
      // silently keep existing plans on error
    }
    setRefreshing(false);
  };

  const handlePlanClick = (plan: any) => {
    if (plan.type === 'comprehensive') {
      setSelectedPlan(plan);
      if (zeroDepPlans.length > 0) {
        setShowZdVsStandard(true);
      } else if (comprehensivePlans.length > 1) {
        setShowGarageTier(true);
      } else {
        onSelect({ planType: plan.type, garageTier: null, plan });
      }
    } else if ((plan.type === 'od' || plan.type === 'od_zd') && odPlans.length > 1) {
      setSelectedPlan(plan);
      setShowOdVariant(true);
    } else {
      onSelect({ planType: plan.type, garageTier: null, plan });
    }
  };

  const handleZdVsStandardChoice = (choice: 'zd' | 'standard') => {
    setShowZdVsStandard(false);
    if (choice === 'zd') {
      if (zeroDepPlans.length > 1) {
        setShowZdVariant(true);
      } else {
        onSelect({ planType: 'zero_dep', garageTier: null, plan: zeroDepPlans[0] });
      }
    } else {
      if (comprehensivePlans.length > 1) {
        setShowGarageTier(true);
      } else {
        onSelect({ planType: 'comprehensive', garageTier: null, plan: comprehensivePlans[0] });
      }
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
        <p className="text-[12px] text-white/50">Insured value (IDV)</p>
        <p className="text-[14px] font-semibold text-white">
          ₹{(idv / 100000).toFixed(1)} Lakh{' '}
          <button
            onClick={() => setShowIDVSlider(true)}
            className="text-purple-300 text-[12px] ml-1 underline-offset-2 hover:text-purple-200 transition-colors"
          >
            Edit
          </button>
        </p>
      </div>

      {/* IDV Slider Sheet */}
      <AnimatePresence>
        {showIDVSlider && (
          <IDVSliderSheet
            idvMin={idvMin || Math.round(idv * 0.9)}
            idvMax={idvMax || Math.round(idv * 1.1)}
            currentIdv={idv}
            onClose={() => setShowIDVSlider(false)}
            onApply={handleIDVApply}
          />
        )}
      </AnimatePresence>

      {/* Plan cards — skeleton while refreshing, real cards otherwise */}
      <AnimatePresence mode="wait">
        {refreshing ? (
          <motion.div
            key="skeletons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-purple-400/60 animate-pulse" />
              <p className="text-[12px] text-white/40 animate-pulse">Recalculating premiums…</p>
            </div>
            <PlanCardSkeleton />
            <PlanCardSkeleton />
            {!isBrandNew && <PlanCardSkeleton />}
          </motion.div>
        ) : (
          <motion.div
            key="plans"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Comprehensive Plan — ZD is a sub-type, shown in bottom sheet */}
            {comprehensiveLowest && (
              <PlanCard
                plan={comprehensiveLowest}
                title="Comprehensive"
                subtitle={zeroDepLowest ? 'Includes Zero Depreciation option' : undefined}
                badge={`Recommended for your ${vType}`}
                price={formatPrice(zeroDepLowest ? Math.min(comprehensiveLowest.totalPrice, zeroDepLowest.totalPrice) : comprehensiveLowest.totalPrice)}
                description={`Complete coverage for your ${vType} and third-party liabilities.`}
                bulletPoints={[
                  { text: 'Covers theft, damage from fire, accidents, and natural disasters', icon: 'check' },
                  { text: `Covers damage caused by your ${vType} to others and their property`, icon: 'check' },
                  { text: 'Cashless repairs at any GST registered garage', icon: 'check' },
                  { text: 'Real-time repair updates on the ACKO app', icon: 'check' },
                  { text: `Free pickup and drop of your ${vType} during a claim`, icon: 'check' },
                ]}
                onSelect={() => handlePlanClick(comprehensiveLowest)}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help me choose CTA */}
      <button
        onClick={() => onSelect('help_choose')}
        className="w-full py-3 rounded-xl text-[14px] font-medium transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2"
        style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)', color: 'var(--motor-text-muted)' }}
      >
        <svg className="w-4 h-4" style={{ color: '#A855F7' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
        </svg>
        I need help choosing
      </button>

      {/* ZD vs Standard Comprehensive Bottom Sheet — Step 2 per skill file */}
      <AnimatePresence>
        {showZdVsStandard && (() => {
          const zdStarting = zeroDepLowest ? formatPrice(zeroDepLowest.totalPrice) : '';
          const compStarting = comprehensiveLowest ? formatPrice(comprehensiveLowest.totalPrice) : '';
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setShowZdVsStandard(false)}
            >
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
                style={{ background: 'var(--motor-glass-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--motor-border-strong)' }}
              >
                <div className="p-5">
                  <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--motor-border-strong)' }} />
                  <h3 className="text-[18px] font-bold mb-1" style={{ color: 'var(--motor-text)' }}>Do you want Zero Depreciation cover?</h3>
                  <p className="text-[12px] mb-5" style={{ color: 'var(--motor-text-subtle)' }}>Zero Depreciation means no out-of-pocket cost on part replacements during claims.</p>

                  <div className="space-y-3">
                    {/* Zero Depreciation — recommended */}
                    {zeroDepLowest && (
                      <button
                        onClick={() => handleZdVsStandardChoice('zd')}
                        className="w-full p-4 rounded-xl text-left transition-all"
                        style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-[14px] font-semibold" style={{ color: 'var(--motor-text)' }}>Zero Depreciation</h4>
                            <div className="mt-1"><GradientBadge>Recommended</GradientBadge></div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="text-[14px] font-bold" style={{ color: 'var(--motor-text)' }}>Starting {zdStarting}</p>
                            <p className="text-[10px]" style={{ color: 'var(--motor-text-subtle)' }}>+ 18% GST</p>
                          </div>
                        </div>
                        <div className="space-y-1.5 mt-3">
                          <div className="flex items-start gap-2">
                            <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            <span className="text-[11px]" style={{ color: 'var(--motor-text-muted)' }}>Pays the full cost of parts replaced during a claim — no depreciation deducted</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            <span className="text-[11px]" style={{ color: 'var(--motor-text-muted)' }}>Minimises your out-of-pocket expenses during claims</span>
                          </div>
                        </div>
                      </button>
                    )}

                    {/* Standard Comprehensive */}
                    {comprehensiveLowest && (
                      <button
                        onClick={() => handleZdVsStandardChoice('standard')}
                        className="w-full p-4 rounded-xl text-left transition-all"
                        style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-[14px] font-semibold" style={{ color: 'var(--motor-text)' }}>Standard Comprehensive</h4>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="text-[14px] font-bold" style={{ color: 'var(--motor-text)' }}>Starting {compStarting}</p>
                            <p className="text-[10px]" style={{ color: 'var(--motor-text-subtle)' }}>+ 18% GST</p>
                          </div>
                        </div>
                        <div className="space-y-1.5 mt-2">
                          <div className="flex items-start gap-2">
                            <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            <span className="text-[11px]" style={{ color: 'var(--motor-text-muted)' }}>Pays the cost of replaced parts after deducting depreciation</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--motor-text-subtle)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 16v-4m0-4h.01" /></svg>
                            <span className="text-[11px]" style={{ color: 'var(--motor-text-subtle)' }}>Your out-of-pocket expenses typically amount to 20–30% of the total claim value</span>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Compare section */}
                  <div className="mt-4 p-4 rounded-xl" style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}>
                    <p className="text-[12px] font-semibold mb-3" style={{ color: 'var(--motor-text)' }}>See the difference with an example</p>
                    <p className="text-[11px] mb-2" style={{ color: 'var(--motor-text-subtle)' }}>A bumper gets damaged in an accident. Repair cost: ₹15,000</p>
                    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--motor-border)' }}>
                      <div className="grid grid-cols-3 text-[10px] font-medium py-2 px-3" style={{ background: 'var(--motor-surface-2)', color: 'var(--motor-text-subtle)' }}>
                        <span></span><span className="text-center">Zero Dep</span><span className="text-center">Standard</span>
                      </div>
                      {[['Part cost', '₹15,000', '₹15,000'], ['Depreciation', '₹0', '₹3,000–4,500'], ['You pay', '₹0', '₹3,000–4,500'], ['ACKO pays', '₹15,000', '₹10,500–12,000']].map(([label, zd, std], i) => (
                        <div key={i} className="grid grid-cols-3 text-[10px] py-1.5 px-3" style={{ borderTop: '1px solid var(--motor-border)', color: label === 'You pay' ? 'var(--motor-text)' : 'var(--motor-text-muted)' }}>
                          <span className="font-medium">{label}</span>
                          <span className="text-center" style={{ color: label === 'You pay' ? '#4ade80' : undefined }}>{zd}</span>
                          <span className="text-center" style={{ color: label === 'You pay' ? '#f87171' : undefined }}>{std}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'var(--motor-text-subtle)' }}>With Zero Depreciation, ACKO pays the full repair bill. With a Standard plan, you pay the depreciated portion out of pocket.</p>
                  </div>

                  <button onClick={() => setShowZdVsStandard(false)} className="w-full mt-4 py-3 text-[14px] transition-colors" style={{ color: 'var(--motor-text-subtle)' }}>
                    {tw.cancel}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

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
                className="w-full max-w-md max-h-[70vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
                style={{ background: 'var(--motor-glass-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--motor-border-strong)' }}
              >
                <div className="p-5">
                  <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--motor-border-strong)' }} />
                  <h3 className="text-[18px] font-bold mb-1" style={{ color: 'var(--motor-text)' }}>Choose the type of Comprehensive plan</h3>
                  <p className="text-[12px] mb-5" style={{ color: 'var(--motor-text-subtle)' }}>We have two types of plans for you to choose from</p>

                  <div className="space-y-3">
                    {/* Network Garage — preferred variant, shown first */}
                    <button
                      onClick={() => networkPlan && handleGarageTierSelect('network')}
                      className="w-full p-4 rounded-xl text-left transition-all group"
                      style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-[14px] font-semibold" style={{ color: 'var(--motor-text)' }}>Comprehensive · Network Garage</h4>
                          </div>
                          <GradientBadge>Recommended · Fully managed</GradientBadge>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="text-[16px] font-bold" style={{ color: 'var(--motor-text)' }}>{formatPrice(networkPlan?.totalPrice || 0)}</p>
                          <p className="text-[10px]" style={{ color: 'var(--motor-text-subtle)' }}>+ 18% GST</p>
                        </div>
                      </div>
                      <div className="space-y-1.5 mt-3 mb-3">
                        {[
                          'All Comprehensive plan benefits at a lower premium',
                          'Fully managed claims at ACKO Trusted Garages',
                          'Free pickup & drop, real-time updates, and a 1-year warranty on repairs',
                          'Just hand over the keys — we take care of everything',
                        ].map((text, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            <span className="text-[11px]" style={{ color: 'var(--motor-text-muted)' }}>{text}</span>
                          </div>
                        ))}
                      </div>
                      {/* Claim condition callout */}
                      <div className="p-2.5 rounded-lg mt-2" style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <div className="flex items-start gap-2">
                          <span className="text-[12px] flex-shrink-0">⚡</span>
                          <p className="text-[10px] leading-relaxed" style={{ color: 'var(--motor-text-muted)' }}>
                            Repairs outside ACKO Trusted Garages attract a ₹5,000 deductible. Not applicable if no trusted garage is available near you.
                          </p>
                        </div>
                      </div>
                      {savings > 0 && (
                        <span className="inline-flex mt-2 text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.25)' }}>
                          Save ₹{savings.toLocaleString('en-IN')} vs Standard
                        </span>
                      )}
                    </button>

                    {/* Standard — shown second, greyed out if unavailable */}
                    {allPlan ? (
                      <button
                        onClick={() => handleGarageTierSelect('all')}
                        className="w-full p-4 rounded-xl text-left transition-all group"
                        style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-[14px] font-semibold" style={{ color: 'var(--motor-text)' }}>Comprehensive · Standard</h4>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="text-[16px] font-bold" style={{ color: 'var(--motor-text)' }}>{formatPrice(allPlan.totalPrice)}</p>
                            <p className="text-[10px]" style={{ color: 'var(--motor-text-subtle)' }}>+ 18% GST</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 mt-2">
                          <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          <span className="text-[11px]" style={{ color: 'var(--motor-text-muted)' }}>Cashless repairs at any GST registered garage — repair wherever you want, no conditions</span>
                        </div>
                      </button>
                    ) : (
                      <div className="w-full p-4 rounded-xl opacity-50" style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}>
                        <h4 className="text-[14px] font-semibold mb-2" style={{ color: 'var(--motor-text-subtle)' }}>Comprehensive · Standard</h4>
                        <div className="flex items-start gap-2">
                          <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--motor-text-subtle)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 16v-4m0-4h.01" />
                          </svg>
                          <span className="text-[11px]" style={{ color: 'var(--motor-text-subtle)' }}>We&apos;re unable to offer this plan for your vehicle at this time.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setShowGarageTier(false)}
                    className="w-full mt-4 py-3 text-[14px] transition-colors"
                    style={{ color: 'var(--motor-text-subtle)' }}
                  >
                    {tw.cancel}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Zero Dep Variant Bottom Sheet (Safe Driver vs Standard) */}
      <AnimatePresence>
        {showZdVariant && selectedPlan && (() => {
          const safeDriverPlan = zeroDepPlans.find((p: any) => p.variant === 'safe_driver' || p.expandedType === 'zd_comprehensive_safe');
          const standardPlan = zeroDepPlans.find((p: any) => p.variant !== 'safe_driver' && p.expandedType !== 'zd_comprehensive_safe');
          const [showCompare, setShowCompare] = [false, () => {}]; // placeholder for expandable
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
                className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
                style={{ background: 'var(--motor-glass-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--motor-border-strong)' }}
              >
                <div className="p-5">
                  <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--motor-border-strong)' }} />
                  <h3 className="text-[18px] font-bold" style={{ color: 'var(--motor-text)' }}>Choose your Zero Dep plan</h3>
                  <p className="text-[12px] mt-1 mb-5" style={{ color: 'var(--motor-text-subtle)' }}>Both cover 100% of part replacement costs. Pick what suits you.</p>

                  <div className="space-y-3">
                    {/* Safe Driver — preferred variant, shown first */}
                    {safeDriverPlan && (
                      <button
                        onClick={() => handleVariantSelect(safeDriverPlan)}
                        className="w-full p-4 rounded-xl text-left transition-all group"
                        style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-[14px] font-semibold" style={{ color: 'var(--motor-text)' }}>Zero Dep · Safe Driver</h4>
                            <div className="mt-1"><GradientBadge>Recommended · Best value</GradientBadge></div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="text-[16px] font-bold" style={{ color: 'var(--motor-text)' }}>{formatPrice(safeDriverPlan.totalPrice)}</p>
                            <p className="text-[10px]" style={{ color: 'var(--motor-text-subtle)' }}>+ 18% GST</p>
                          </div>
                        </div>
                        <div className="space-y-1.5 mt-3 mb-3">
                          <div className="flex items-start gap-2">
                            <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            <span className="text-[11px]" style={{ color: 'var(--motor-text-muted)' }}>Built for responsible car owners who rarely need to claim</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            <span className="text-[11px]" style={{ color: 'var(--motor-text-muted)' }}>All Zero Depreciation benefits at a significantly lower premium</span>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                          <div className="flex items-start gap-2">
                            <span className="text-[12px] flex-shrink-0">⚡</span>
                            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--motor-text-muted)' }}>
                              You pay ₹5,000 when you make a claim. We cover everything else.
                            </p>
                          </div>
                        </div>
                      </button>
                    )}

                    {/* Standard — shown second, greyed out if unavailable */}
                    {standardPlan ? (
                      <button
                        onClick={() => handleVariantSelect(standardPlan)}
                        className="w-full p-4 rounded-xl text-left transition-all group"
                        style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-[14px] font-semibold" style={{ color: 'var(--motor-text)' }}>Zero Dep · Standard</h4>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="text-[16px] font-bold" style={{ color: 'var(--motor-text)' }}>{formatPrice(standardPlan.totalPrice)}</p>
                            <p className="text-[10px]" style={{ color: 'var(--motor-text-subtle)' }}>+ 18% GST</p>
                          </div>
                        </div>
                        <div className="space-y-1.5 mt-2">
                          <div className="flex items-start gap-2">
                            <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            <span className="text-[11px]" style={{ color: 'var(--motor-text-muted)' }}>All Zero Depreciation benefits</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            <span className="text-[11px]" style={{ color: 'var(--motor-text-muted)' }}>No deductions of any kind during claims</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            <span className="text-[11px]" style={{ color: 'var(--motor-text-muted)' }}>Higher premium, zero conditions</span>
                          </div>
                        </div>
                      </button>
                    ) : (
                      <div className="w-full p-4 rounded-xl opacity-50" style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}>
                        <h4 className="text-[14px] font-semibold mb-2" style={{ color: 'var(--motor-text-subtle)' }}>Zero Dep · Standard</h4>
                        <div className="flex items-start gap-2">
                          <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--motor-text-subtle)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 16v-4m0-4h.01" />
                          </svg>
                          <span className="text-[11px]" style={{ color: 'var(--motor-text-subtle)' }}>We&apos;re unable to offer this plan for your vehicle at this time.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Compare section */}
                  <div className="mt-4 p-4 rounded-xl" style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}>
                    <p className="text-[12px] font-semibold mb-3" style={{ color: 'var(--motor-text)' }}>See the difference with an example</p>
                    <p className="text-[11px] mb-2" style={{ color: 'var(--motor-text-subtle)' }}>A bumper gets damaged in an accident. Repair cost: ₹15,000</p>
                    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--motor-border)' }}>
                      <div className="grid grid-cols-3 text-[10px] font-medium py-2 px-3" style={{ background: 'var(--motor-surface-2)', color: 'var(--motor-text-subtle)' }}>
                        <span></span><span className="text-center">Zero Dep</span><span className="text-center">Standard</span>
                      </div>
                      {[
                        ['Part cost', '₹15,000', '₹15,000'],
                        ['Depreciation', '₹0', '₹3,000–4,500'],
                        ['You pay', '₹0', '₹3,000–4,500'],
                        ['ACKO pays', '₹15,000', '₹10,500–12,000'],
                      ].map(([label, zd, std], i) => (
                        <div key={i} className="grid grid-cols-3 text-[10px] py-1.5 px-3" style={{ borderTop: '1px solid var(--motor-border)', color: label === 'You pay' ? 'var(--motor-text)' : 'var(--motor-text-muted)' }}>
                          <span className="font-medium">{label}</span>
                          <span className="text-center" style={{ color: label === 'You pay' ? '#4ade80' : undefined }}>{zd}</span>
                          <span className="text-center" style={{ color: label === 'You pay' ? '#f87171' : undefined }}>{std}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'var(--motor-text-subtle)' }}>
                      With Zero Depreciation, ACKO pays the full repair bill. With a Standard plan, you pay the depreciated portion out of pocket.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowZdVariant(false)}
                    className="w-full mt-4 py-3 text-[14px] transition-colors"
                    style={{ color: 'var(--motor-text-subtle)' }}
                  >
                    {tw.cancel}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* OD Variant Bottom Sheet (for active TP policy with multiple OD options) */}
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
                className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
                style={{ background: 'var(--motor-glass-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--motor-border-strong)' }}
              >
                <div className="p-5">
                  <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--motor-border-strong)' }} />
                  <h3 className="text-[18px] font-bold" style={{ color: 'var(--motor-text)' }}>Choose your OD plan</h3>
                  <p className="text-[12px] mt-1 mb-5" style={{ color: 'var(--motor-text-subtle)' }}>Your third-party is already active. Pick the right own-damage cover.</p>

                  <div className="space-y-3">
                    {/* OD ZD Safe Driver — preferred */}
                    {zdSafe && (
                      <button
                        onClick={() => handleVariantSelect(zdSafe)}
                        className="w-full p-4 rounded-xl text-left transition-all"
                        style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-[14px] font-semibold" style={{ color: 'var(--motor-text)' }}>OD Zero Dep · Safe Driver</h4>
                            <div className="mt-1"><GradientBadge>Recommended · Best value</GradientBadge></div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="text-[16px] font-bold" style={{ color: 'var(--motor-text)' }}>{formatPrice(zdSafe.totalPrice)}</p>
                            <p className="text-[10px]" style={{ color: 'var(--motor-text-subtle)' }}>+ 18% GST</p>
                          </div>
                        </div>
                        <div className="space-y-1.5 mt-3 mb-3">
                          <div className="flex items-start gap-2">
                            <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            <span className="text-[11px]" style={{ color: 'var(--motor-text-muted)' }}>All Zero Depreciation benefits at a much lower premium</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            <span className="text-[11px]" style={{ color: 'var(--motor-text-muted)' }}>No depreciation charges on part replacements</span>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                          <div className="flex items-start gap-2">
                            <span className="text-[12px] flex-shrink-0">⚡</span>
                            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--motor-text-muted)' }}>
                              You pay ₹5,000 when you make a claim. We cover everything else.
                            </p>
                          </div>
                        </div>
                      </button>
                    )}

                    {/* OD ZD Standard — greyed out if unavailable */}
                    {zdStd ? (
                      <button
                        onClick={() => handleVariantSelect(zdStd)}
                        className="w-full p-4 rounded-xl text-left transition-all"
                        style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-[14px] font-semibold" style={{ color: 'var(--motor-text)' }}>OD Zero Dep · Standard</h4>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="text-[16px] font-bold" style={{ color: 'var(--motor-text)' }}>{formatPrice(zdStd.totalPrice)}</p>
                            <p className="text-[10px]" style={{ color: 'var(--motor-text-subtle)' }}>+ 18% GST</p>
                          </div>
                        </div>
                        <div className="space-y-1.5 mt-2">
                          <div className="flex items-start gap-2">
                            <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            <span className="text-[11px]" style={{ color: 'var(--motor-text-muted)' }}>All Zero Depreciation benefits, no deductions during claims</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            <span className="text-[11px]" style={{ color: 'var(--motor-text-muted)' }}>Higher premium, zero conditions</span>
                          </div>
                        </div>
                      </button>
                    ) : zdSafe && (
                      <div className="w-full p-4 rounded-xl opacity-50" style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}>
                        <h4 className="text-[14px] font-semibold mb-2" style={{ color: 'var(--motor-text-subtle)' }}>OD Zero Dep · Standard</h4>
                        <div className="flex items-start gap-2">
                          <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--motor-text-subtle)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 16v-4m0-4h.01" />
                          </svg>
                          <span className="text-[11px]" style={{ color: 'var(--motor-text-subtle)' }}>We&apos;re unable to offer this plan for your vehicle at this time.</span>
                        </div>
                      </div>
                    )}

                    {/* Plain OD (no ZD) — if available */}
                    {plainOd && (
                      <button
                        onClick={() => handleVariantSelect(plainOd)}
                        className="w-full p-4 rounded-xl text-left transition-all"
                        style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-[14px] font-semibold" style={{ color: 'var(--motor-text)' }}>Standard OD</h4>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="text-[16px] font-bold" style={{ color: 'var(--motor-text)' }}>{formatPrice(plainOd.totalPrice)}</p>
                            <p className="text-[10px]" style={{ color: 'var(--motor-text-subtle)' }}>+ 18% GST</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 mt-2">
                          <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          <span className="text-[11px]" style={{ color: 'var(--motor-text-muted)' }}>Standard OD cover — depreciation applies on part replacements</span>
                        </div>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setShowOdVariant(false)}
                    className="w-full mt-4 py-3 text-[14px] transition-colors"
                    style={{ color: 'var(--motor-text-subtle)' }}
                  >
                    {tw.cancel}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </motion.div>
  );
}

function PlanCardSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden p-4 animate-pulse"
      style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}
    >
      {/* Title + badge row */}
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2">
          <div className="h-3.5 w-36 bg-white/10 rounded-full" />
          <div className="h-2.5 w-20 bg-white/10 rounded-full" />
        </div>
        <div className="h-5 w-22 bg-white/10 rounded-full" />
      </div>
      {/* Price */}
      <div className="h-6 w-28 bg-white/15 rounded-full mb-3" />
      {/* Description lines */}
      <div className="space-y-1.5 mb-4">
        <div className="h-2.5 w-full bg-white/10 rounded-full" />
        <div className="h-2.5 w-4/5 bg-white/10 rounded-full" />
      </div>
      {/* Feature rows */}
      <div className="space-y-2 mb-4">
        {[80, 65, 72].map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-white/10 shrink-0" />
            <div className="h-2.5 bg-white/10 rounded-full" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
      {/* Button */}
      <div className="h-10 w-full bg-white/10 rounded-xl" />
    </div>
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
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--motor-text-subtle)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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
        className="rounded-2xl overflow-hidden transition-all duration-200"
        style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}
      >
        {/* Header */}
        <div className="p-4">
          <div className="mb-3">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="text-[15px] font-semibold" style={{ color: 'var(--motor-text)' }}>{title}</h3>
                {subtitle && <p className="text-[11px] mt-0.5" style={{ color: 'var(--motor-text-subtle)' }}>{subtitle}</p>}
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
                <p className="text-[14px] font-semibold line-through" style={{ color: 'var(--motor-text-subtle)' }}>{formatPrice(strikePrice)}</p>
              )}
              <p className="text-[18px] font-bold" style={{ color: 'var(--motor-text)' }}>{price}</p>
            </div>
            <p className="text-[12px] leading-relaxed mt-1" style={{ color: 'var(--motor-text-subtle)' }}>
              {description}{' '}
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-purple-300 underline hover:text-purple-200 transition-colors"
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
                        className="text-[12px] hover:text-purple-300 transition-colors text-left underline decoration-white/30 hover:decoration-purple-300"
                        style={{ color: 'var(--motor-text-muted)' }}
                      >
                        {text}
                      </button>
                    ) : (
                      <span className="text-[12px]" style={{ color: icon === 'cross' ? 'var(--motor-text-subtle)' : 'var(--motor-text-muted)' }}>{text}</span>
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
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--motor-text-muted)' }}>{claimCondition}</p>
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
              className="border-t border-white/10"
            >
              {/* Tabs */}
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setActiveTab('covered')}
                  className={`flex-1 py-3 text-[12px] font-medium transition-colors ${
                    activeTab === 'covered'
                      ? 'text-white border-b-2 border-purple-400'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  Covered
                </button>
                <button
                  onClick={() => setActiveTab('not_covered')}
                  className={`flex-1 py-3 text-[12px] font-medium transition-colors ${
                    activeTab === 'not_covered'
                      ? 'text-white border-b-2 border-purple-400'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  Not covered
                </button>
                <button
                  onClick={() => setActiveTab('upgrades')}
                  className={`flex-1 py-3 text-[12px] font-medium transition-colors ${
                    activeTab === 'upgrades'
                      ? 'text-white border-b-2 border-purple-400'
                      : 'text-white/40 hover:text-white/60'
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
                                  className="text-[12px] font-medium text-white/90 hover:text-purple-300 transition-colors underline decoration-white/30 hover:decoration-purple-300 text-left"
                                >
                                  {title}
                                </button>
                              ) : (
                                <p className="text-[12px] font-medium text-white/90">{title}</p>
                              )}
                              {desc && <p className="text-[11px] text-white/50 mt-0.5">{desc}</p>}
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
                              <p className="text-[12px] font-medium text-white/90">{title}</p>
                              {desc && <p className="text-[11px] text-white/50 mt-0.5">{desc}</p>}
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
                      <p className="text-[12px] text-white/50 mb-3">
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
                            <div key={i} className="py-2.5 px-3 bg-white/5 rounded-lg border border-white/8">
                              <div className="flex items-start gap-2">
                                <svg className="w-4 h-4 text-purple-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                <div>
                                  <p className="text-[12px] font-medium text-white/90">{addon?.name || addonId}</p>
                                  <p className="text-[11px] text-white/40 mt-0.5">{addon?.desc || ''}</p>
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
              <div className="px-4 pb-4 border-t border-white/10 pt-4">
                <button
                  onClick={onSelect}
                  className="w-full py-3 rounded-xl text-[14px] font-semibold transition-colors active:scale-[0.97]"
                  style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
                >
                  Select this plan
                </button>
                <button
                  onClick={() => setExpanded(false)}
                  className="w-full py-2 mt-2 text-[12px] text-white/50 hover:text-white/70 transition-colors"
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
  const tw = useT().motorWidgets;

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
        className="w-full max-w-2xl max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--motor-glass-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--motor-border-strong)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="text-[18px] font-bold text-white">{tw.cashlessNetworkGarages}</h2>
            <p className="text-[12px] text-white/50 mt-0.5">5,400+ garages across India</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="px-5 py-4 space-y-3 border-b border-white/10">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder={tw.searchGarage}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-4 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all ${
                  selectedCity === city
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/15'
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
                className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-[14px] font-semibold text-white">{garage.name}</h3>
                    <p className="text-[12px] text-white/50 mt-1">
                      {garage.area}, {garage.city}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-[12px] font-medium text-white">{garage.rating}</span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-12 text-center">
              <svg
                className="w-12 h-12 text-white/20 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <p className="text-[14px] text-white/50">{tw.noGaragesFound}</p>
              <p className="text-[12px] text-white/30 mt-1">{tw.noGaragesFoundSub}</p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-5 py-3 bg-white/5 border-t border-white/10">
          <p className="text-[11px] text-white/40 text-center">
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
  const tw = useT().motorWidgets;

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
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}>
        <div className="px-4 py-3" style={{ background: 'var(--motor-plan-rec-header-bg)' }}>
          <GradientBadge className="mb-1">{tw.planRecommended}</GradientBadge>
          <h3 className="text-[18px] font-bold" style={{ color: 'var(--motor-text)' }}>{planLabel} Plan</h3>
          {matchedPlan && (
            <p className="text-[22px] font-bold mt-1" style={{ color: 'var(--motor-text)' }}>
              {formatPrice(matchedPlan.totalPrice)}
              <span className="text-[12px] font-normal ml-1" style={{ color: 'var(--motor-text-muted)' }}>/ year</span>
            </p>
          )}
        </div>

        <div className="px-4 py-3 space-y-2">
          {matchedPlan?.features?.slice(0, 4).map((f: any, i: number) => (
            <div key={i} className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--motor-plan-rec-check)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span className="text-[13px]" style={{ color: 'var(--motor-text)' }}>{f.label || f}</span>
            </div>
          ))}
        </div>

        <div className="px-4 pb-4 space-y-2">
          <button
            onClick={handleSelect}
            className="w-full py-3 rounded-xl text-[14px] font-semibold transition-all active:scale-[0.97]"
            style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
          >
            Select {planLabel} Plan
          </button>
          <button
            onClick={() => onSelect('back_to_plans')}
            className="w-full py-2.5 rounded-xl text-[13px] font-medium transition-all"
            style={{ color: 'var(--motor-text-muted)' }}
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
  const tw = useT().motorWidgets;

  const state = useMotorStore.getState() as MotorJourneyState;
  const addons = getMotorAddOns('car', state).filter((a: any) => a.category === 'out_of_pocket');

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
          <h3 className="text-[16px] font-bold text-white mb-1">{tw.cutDownOOP}</h3>
          <p className="text-[12px] text-white/50">{tw.planRecommended}</p>
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
              animate={{
                opacity: 1,
                y: 0,
                scale: selected ? 1.02 : 1,
              }}
              transition={{
                opacity: { delay: index * 0.05, duration: 0.3 },
                y: { delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 },
                scale: { type: 'spring', stiffness: 400, damping: 30 },
              }}
              className={`p-4 rounded-xl border ${selected ? 'bg-white/10 border-purple-400/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
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
                        style={{ filter: 'brightness(0) invert(1)' }}
                      />
                    )}
                    <h4 className="text-[14px] font-semibold text-white">{addon.name}</h4>
                    {addon.recommended && <GradientBadge>{tw.recommended}</GradientBadge>}
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
                  <p className="text-[12px] text-white/60 leading-relaxed">{addon.description}</p>
                  {selected && variantName && <p className="text-[11px] text-purple-300 mt-1">Selected: {variantName}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                  <p className="text-[14px] font-bold text-white whitespace-nowrap">₹{displayPrice}</p>
                  <motion.button
                    onClick={() => selected ? removeAddon(addon.id) : toggleAddon(addon)}
                    whileTap={{ scale: 0.92 }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selected ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/20'}`}
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
          className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10"
        >
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between text-white/70"><span>{tw.basePremium}</span><span>₹{totals.basePremium.toLocaleString()}</span></div>
            {totals.addonTotal > 0 && (<><div className="flex justify-between text-white/70"><span>{tw.addOns}</span><span>₹{totals.addonTotal.toLocaleString()}</span></div><div className="flex justify-between text-white/70"><span>{tw.gst18}</span><span>₹{totals.gst.toLocaleString()}</span></div></>)}
            <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-white text-[15px]"><span>{tw.total}</span><span>₹{totals.total.toLocaleString()}</span></div>
          </div>
        </motion.div>

        <div className="flex gap-3 mt-4">
          <button onClick={handleSkip} className="flex-1 py-3 px-4 bg-white/10 border border-white/20 rounded-xl text-[14px] font-semibold text-white hover:bg-white/15 transition-colors">{tw.continueWithoutAddons}</button>
          <button onClick={handleContinue} className="flex-1 py-3 px-4 rounded-xl text-[14px] font-semibold transition-colors active:scale-[0.98]" style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}>{tw.continueBtn}</button>
        </div>
        <p className="text-[11px] text-white/40 text-center mt-2">Next: Additional covers to reduce medical expenses</p>
      </motion.div>

      <AnimatePresence>
        {showVariantModal.show && showVariantModal.addon && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowVariantModal({ addon: null, show: false })}>
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md max-h-[45vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl" style={{ background: 'var(--motor-glass-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--motor-border-strong)' }}>
              <div className="p-5">
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
                <h3 className="text-[18px] font-bold text-white mb-1">Select {showVariantModal.addon.name} variant</h3>
                <p className="text-[12px] text-white/50 mb-5">{showVariantModal.addon.description}</p>
                <div className="space-y-3">
                  {showVariantModal.addon.variants?.map((variant: any) => (
                    <button key={variant.id} onClick={() => selectVariant(showVariantModal.addon, variant)} className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 rounded-xl text-left transition-all group">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-white">{variant.name}</span>
                          {variant.recommended && <GradientBadge>{tw.recommended}</GradientBadge>}
                          {variant.badge && <GradientBadge>{variant.badge}</GradientBadge>}
                        </div>
                        <span className="text-[16px] font-bold text-white">₹{variant.price}</span>
                      </div>
                      <ul className="space-y-1">
                        {variant.features?.map((feature: string, i: number) => (
                          <li key={i} className="text-[11px] text-white/60 flex items-start gap-2"><span className="text-green-400 mt-0.5">•</span><span>{feature}</span></li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowVariantModal({ addon: null, show: false })} className="w-full mt-4 py-3 text-[14px] text-white/50 hover:text-white/70 transition-colors">{tw.cancel}</button>
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
  const tw = useT().motorWidgets;

  const currentState = useMotorStore.getState() as MotorJourneyState;
  const addons = getMotorAddOns(vType as 'car' | 'bike', currentState).filter((a: any) => a.category === 'protect_everyone');

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
        animate={{
          opacity: 1,
          y: 0,
          scale: selected ? 1.02 : 1,
        }}
        transition={{
          opacity: { delay: index * 0.05, duration: 0.3 },
          y: { delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 },
          scale: { type: 'spring', stiffness: 400, damping: 30 },
        }}
        className={`p-4 rounded-xl border ${selected ? 'bg-white/10 border-purple-400/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
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
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              )}
              <h4 className="text-[14px] font-semibold text-white">{addon.name}</h4>
              {addon.mandatory && <span className="text-[10px] text-orange-300 bg-orange-500/20 px-2 py-0.5 rounded-full">{tw.mandatoryByLaw}</span>}
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
            <p className="text-[12px] text-white/60 leading-relaxed">{addon.description}</p>
            {selected && variantName && <p className="text-[11px] text-purple-300 mt-1">Selected: {variantName}</p>}
          </div>
          <div className="flex flex-col items-end gap-2 ml-4">
            <p className="text-[14px] font-bold text-white whitespace-nowrap">{addon.hasVariants ? 'from ' : ''}₹{displayPrice}</p>
            <motion.button
              onClick={() => selected ? removeAddon(addon.id) : toggleAddon(addon)}
              whileTap={{ scale: 0.92 }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selected ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/20'}`}
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
          <h3 className="text-[16px] font-bold text-white mb-1">Protect everyone in your {vType}</h3>
        </div>

        <div className="mb-4 space-y-3">
          <p className="text-[13px] font-semibold text-white/70 mb-3">{tw.forYou}</p>
          {addons.filter((a: any) => a.id === 'personal_accident').map((a, i) => renderAddonCard(a, i))}
        </div>

        <div className="mb-4 space-y-3">
          <p className="text-[13px] font-semibold text-white/70 mb-3">{tw.forLovedOnes}</p>
          {addons.filter((a: any) => a.id === 'passenger_protection').map((a, i) => renderAddonCard(a, i))}
        </div>

        <div className="mb-4 space-y-3">
          <p className="text-[13px] font-semibold text-white/70 mb-3">{tw.forDriver}</p>
          {addons.filter((a: any) => a.id === 'paid_driver').map((a, i) => renderAddonCard(a, i))}
        </div>

        <motion.div
          key={`total-${totals.totalAddons}`}
          initial={{ scale: 0.98, opacity: 0.9 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10"
        >
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between text-white/70"><span>{tw.basePremium}</span><span>₹{totals.basePremium.toLocaleString()}</span></div>
            {totals.totalAddons > 0 && (<><div className="flex justify-between text-white/70"><span>{tw.addOns}</span><span>₹{totals.totalAddons.toLocaleString()}</span></div><div className="flex justify-between text-white/70"><span>{tw.gst18}</span><span>₹{totals.gst.toLocaleString()}</span></div></>)}
            <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-white text-[15px]"><span>{tw.total}</span><span>₹{totals.total.toLocaleString()}</span></div>
          </div>
        </motion.div>

        <div className="flex gap-3 mt-4">
          <button onClick={handleSkip} className="flex-1 py-3 px-4 bg-white/10 border border-white/20 rounded-xl text-[14px] font-semibold text-white hover:bg-white/15 transition-colors">{tw.continueWithoutAddons}</button>
          <button onClick={handleContinue} className="flex-1 py-3 px-4 rounded-xl text-[14px] font-semibold transition-colors active:scale-[0.98]" style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}>{tw.continueBtn}</button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showVariantModal.show && showVariantModal.addon && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowVariantModal({ addon: null, show: false })}>
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md max-h-[45vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl" style={{ background: 'var(--motor-glass-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--motor-border-strong)' }}>
              <div className="p-5">
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
                <h3 className="text-[18px] font-bold text-white mb-1">{tw.selectPATitle}</h3>
                <p className="text-[12px] text-white/50 mb-5">{tw.selectPADesc}</p>
                <div className="space-y-3">
                  {showVariantModal.addon.variants?.map((variant: any) => (
                    <button key={variant.id} onClick={() => selectVariant(showVariantModal.addon, variant)} className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 rounded-xl text-left transition-all group">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-white">{variant.name}</span>
                          {variant.recommended && <GradientBadge>{tw.recommended}</GradientBadge>}
                          {variant.badge && <GradientBadge>{variant.badge}</GradientBadge>}
                        </div>
                        <span className="text-[16px] font-bold text-white">₹{variant.price}</span>
                      </div>
                      <ul className="space-y-1">
                        {variant.features?.map((feature: string, i: number) => (
                          <li key={i} className="text-[11px] text-white/60 flex items-start gap-2"><span className="text-green-400 mt-0.5">•</span><span>{feature}</span></li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowVariantModal({ addon: null, show: false })} className="w-full mt-4 py-3 text-[14px] text-white/50 hover:text-white/70 transition-colors">{tw.cancel}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ═══════════════════════════════════════════════
   Document Upload Widget — Claims FNOL
   ═══════════════════════════════════════════════ */

type DocSource = 'camera' | 'gallery' | 'pdf' | 'digilocker';

interface DocUploadResult {
  rcUploaded: boolean;
  dlUploaded: boolean;
  prevPolicyUploaded: boolean;
}

const DOC_SOURCE_OPTIONS: { id: DocSource; label: string; iconFile: string; accept: string; capture?: 'environment' | 'user' }[] = [
  { id: 'camera', label: 'Click photos with camera', iconFile: 'doc-camera.svg', accept: 'image/*', capture: 'environment' },
  { id: 'gallery', label: 'Upload both sides from gallery', iconFile: 'doc-gallery.svg', accept: 'image/*' },
  { id: 'pdf', label: 'Upload PDF / Zip file', iconFile: 'doc-pdf.svg', accept: 'application/pdf,application/zip,.pdf,.zip' },
  { id: 'digilocker', label: 'Fetch from Digilocker', iconFile: 'doc-digilocker.svg', accept: '' },
];

export function DocumentUploadWidget({ onContinue }: { onContinue: (result: DocUploadResult) => void }) {
  const state = useMotorStore() as MotorJourneyState;
  const hasAutoRC = !!(state.registrationNumber && state.vehicleData?.make);
  const tw = useT().motorWidgets;

  const [rcUploaded, setRcUploaded] = useState(hasAutoRC);
  const [dlUploaded, setDlUploaded] = useState(false);
  const [prevPolicyUploaded, setPrevPolicyUploaded] = useState(false);
  const [sourceSheet, setSourceSheet] = useState<'rc' | 'dl' | 'prev' | null>(null);
  const [uploadingFor, setUploadingFor] = useState<'rc' | 'dl' | 'prev' | null>(null);

  // One hidden file input per source option (camera, gallery, pdf)
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const ownerName = state.ownerName || 'You';
  const regNo = state.registrationNumber || 'your vehicle';
  const chassisNo = state.chassisNumber || 'XXXXXXXXXXXX';

  const triggerUpload = (target: 'rc' | 'dl' | 'prev', source: DocSource) => {
    setSourceSheet(null);
    if (source === 'digilocker') {
      setUploadingFor(target);
      setTimeout(() => {
        if (target === 'rc') setRcUploaded(true);
        if (target === 'dl') setDlUploaded(true);
        if (target === 'prev') setPrevPolicyUploaded(true);
        setUploadingFor(null);
      }, 1200);
      return;
    }
    pendingSourceTarget.current = target;
    setTimeout(() => {
      if (source === 'camera') cameraInputRef.current?.click();
      else if (source === 'gallery') galleryInputRef.current?.click();
      else if (source === 'pdf') pdfInputRef.current?.click();
    }, 100);
  };

  // Track which doc card triggered the upload so file-input onChange can use it
  const pendingSourceTarget = useRef<'rc' | 'dl' | 'prev' | null>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) { pendingSourceTarget.current = null; return; }
    const uploadTarget = pendingSourceTarget.current;
    pendingSourceTarget.current = null;
    if (!uploadTarget) return;
    setUploadingFor(uploadTarget);
    e.target.value = '';
    setTimeout(() => {
      if (uploadTarget === 'rc') setRcUploaded(true);
      if (uploadTarget === 'dl') setDlUploaded(true);
      if (uploadTarget === 'prev') setPrevPolicyUploaded(true);
      setUploadingFor(null);
    }, 900);
  };

  const handleSourceSelect = (source: DocSource) => {
    triggerUpload(pendingSourceTarget.current!, source);
  };

  const openSourceSheet = (target: 'rc' | 'dl' | 'prev') => {
    pendingSourceTarget.current = target;
    setSourceSheet(target);
  };

  const canProceed = rcUploaded && dlUploaded;

  return (
    <>
      {/* Hidden file inputs — triggered programmatically per source type */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelected} />
      <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelected} />
      <input ref={pdfInputRef} type="file" accept="application/pdf,application/zip,.pdf,.zip" className="hidden" onChange={handleFileSelected} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3 w-full max-w-sm"
      >
        <p className="text-[13px] font-semibold text-white/50 uppercase tracking-wide px-1 mb-1">{tw.uploadDocTitle}</p>

        {/* RC Card */}
        <div className={`rounded-2xl border transition-all overflow-hidden ${rcUploaded ? 'border-green-500/40 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${rcUploaded ? 'bg-green-500/20' : 'bg-white/10'}`}>
                <svg className={`w-5 h-5 ${rcUploaded ? 'text-green-400' : 'text-white/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[14px] font-semibold text-white">Registration Certificate (RC)</p>
                  {hasAutoRC && rcUploaded && !uploadingFor && (
                    <span className="text-[10px] font-semibold text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full">Auto-fetched ✓</span>
                  )}
                  {!hasAutoRC && rcUploaded && (
                    <span className="text-[10px] font-semibold text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full">Uploaded ✓</span>
                  )}
                </div>
                <p className="text-[12px] text-white/50">
                  {hasAutoRC ? 'Fetched from Vahan portal' : `Upload RC for ${regNo}`}
                </p>
              </div>
            </div>

            {hasAutoRC && rcUploaded && (
              <div className="bg-white/5 rounded-xl px-3 py-2.5 mb-3 space-y-1.5">
                <div className="flex justify-between text-[12px]">
                  <span className="text-white/50">{tw.regHolder}</span>
                  <span className="text-white font-medium">{ownerName}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-white/50">{tw.vehicleNumber}</span>
                  <span className="text-white font-medium">{regNo}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-white/50">{tw.chassisNo}</span>
                  <span className="text-white font-medium">{chassisNo}</span>
                </div>
              </div>
            )}

            {uploadingFor === 'rc' ? (
              <div className="flex items-center gap-2 py-1">
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-[13px] text-white/60">{tw.uploading}</span>
              </div>
            ) : (
              <button
                onClick={() => openSourceSheet('rc')}
                className="text-[13px] text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                {rcUploaded ? 'Re-upload ↗' : 'Upload file ↑'}
              </button>
            )}
          </div>
        </div>

        {/* DL Card */}
        <div className={`rounded-2xl border transition-all overflow-hidden ${dlUploaded ? 'border-green-500/40 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${dlUploaded ? 'bg-green-500/20' : 'bg-white/10'}`}>
                <svg className={`w-5 h-5 ${dlUploaded ? 'text-green-400' : 'text-white/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-semibold text-white">Driving Licence (DL)</p>
                  {dlUploaded && (
                    <span className="text-[10px] font-semibold text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full">Uploaded ✓</span>
                  )}
                </div>
                <p className="text-[12px] text-white/50">Upload DL for {ownerName}</p>
              </div>
            </div>

            {uploadingFor === 'dl' ? (
              <div className="flex items-center gap-2 py-1">
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-[13px] text-white/60">Uploading...</span>
              </div>
            ) : (
              <button
                onClick={() => openSourceSheet('dl')}
                className="text-[13px] text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                {dlUploaded ? 'Re-upload ↗' : 'Upload file ↑'}
              </button>
            )}
          </div>
        </div>

        {/* Previous Year's Policy — optional */}
        <div className={`rounded-2xl border transition-all overflow-hidden ${prevPolicyUploaded ? 'border-green-500/40 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${prevPolicyUploaded ? 'bg-green-500/20' : 'bg-white/10'}`}>
                <svg className={`w-5 h-5 ${prevPolicyUploaded ? 'text-green-400' : 'text-white/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[14px] font-semibold text-white">Previous Year&apos;s Policy</p>
                  {prevPolicyUploaded && (
                    <span className="text-[10px] font-semibold text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full">Uploaded ✓</span>
                  )}
                  <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{tw.optional}</span>
                </div>
                <p className="text-[12px] text-white/50">{tw.optionalHelp}</p>
              </div>
            </div>

            {uploadingFor === 'prev' ? (
              <div className="flex items-center gap-2 mt-3">
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-[13px] text-white/60">Uploading...</span>
              </div>
            ) : (
              <button
                onClick={() => openSourceSheet('prev')}
                className="mt-3 text-[13px] text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                {prevPolicyUploaded ? 'Replace ↗' : '+ Add more'}
              </button>
            )}
          </div>
        </div>

        {/* Incorrect details link */}
        <p className="text-[12px] text-center text-white/40 py-1">
          Incorrect details?{' '}
          <button className="text-purple-400 underline underline-offset-2">{tw.updateHere}</button>
        </p>

        {/* Proceed CTA */}
        <button
          onClick={() => canProceed && onContinue({ rcUploaded, dlUploaded, prevPolicyUploaded })}
          disabled={!canProceed}
          className={`w-full py-4 rounded-xl text-[15px] font-bold transition-all ${
            canProceed
              ? 'active:scale-[0.97]'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
          style={canProceed ? { background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' } : {}}
        >
          {canProceed ? 'Proceed \u2192' : `Upload ${!rcUploaded ? 'RC' : 'DL'} to continue`}
        </button>

        <button className="w-full py-2 text-[13px] text-white/30 hover:text-white/50 transition-colors">
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
              className="w-full max-w-md max-h-[45vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
              style={{ background: 'var(--motor-glass-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--motor-border-strong)' }}
            >
              <div className="p-5">
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
                <p className="text-[16px] font-semibold text-white mb-1">{tw.selectSource}</p>
                <p className="text-[12px] text-white/50 mb-5">in PNG, JPEG, or PDF format (Max 10 MB)</p>
              <div className="space-y-2">
                {DOC_SOURCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSourceSelect(opt.id)}
                    className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 rounded-xl transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center flex-shrink-0">
                      <img
                        src={assetPath(`/icons/${opt.iconFile}`)}
                        alt={opt.label}
                        width={22}
                        height={22}
                        style={{ filter: 'brightness(0) invert(1)', opacity: 0.85 }}
                      />
                    </div>
                    <span className="text-[14px] font-medium text-white">{opt.label}</span>
                    <svg className="w-4 h-4 text-white/30 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                ))}
              </div>
              <button onClick={() => setSourceSheet(null)} className="w-full mt-4 py-3 text-[14px] text-white/50 hover:text-white/70 transition-colors">{tw.cancel}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ═══════════════════════════════════════════════
   Surveyor Details Card
   Shown when a surveyor is assigned during claims
   ═══════════════════════════════════════════════ */

const SURVEYOR = { name: 'Rajesh Nair', id: 'SRV-4821', eta: '~90 mins', phone: '98XX XXXX 34', rating: 4.8 };

export function SurveyorDetailsCard({ onContinue }: { onContinue: () => void }) {
  const tw = useT().motorWidgets;
  useEffect(() => {
    const timer = setTimeout(() => onContinue(), 2500);
    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
      <div
        className="rounded-2xl p-4"
        style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7C47E1] to-[#A855F7] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {SURVEYOR.name.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-bold" style={{ color: 'var(--motor-text)' }}>{SURVEYOR.name}</p>
            <p className="text-[12px]" style={{ color: 'var(--motor-text-muted)' }}>Assigned Surveyor · {SURVEYOR.id}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-yellow-400 text-[11px]">★</span>
              <span className="text-[11px] font-semibold" style={{ color: 'var(--motor-text)' }}>{SURVEYOR.rating}</span>
              <span className="text-[11px]" style={{ color: 'var(--motor-text-muted)' }}>· 200+ inspections</span>
            </div>
          </div>
          <div className="text-right">
            <div className="w-2 h-2 rounded-full bg-green-400 ml-auto mb-1 animate-pulse" />
            <p className="text-[10px] text-green-400 font-semibold uppercase tracking-wide">{tw.onDuty}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl p-3" style={{ background: 'var(--motor-surface-2, var(--motor-surface))' }}>
            <p className="text-[11px] mb-0.5" style={{ color: 'var(--motor-text-muted)' }}>{tw.expectedVisit}</p>
            <p className="text-[13px] font-bold" style={{ color: 'var(--motor-text)' }}>{SURVEYOR.eta}</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'var(--motor-surface-2, var(--motor-surface))' }}>
            <p className="text-[11px] mb-0.5" style={{ color: 'var(--motor-text-muted)' }}>{tw.contact}</p>
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-bold" style={{ color: 'var(--motor-text)' }}>{SURVEYOR.phone}</p>
              <svg className="w-3.5 h-3.5 text-[#A855F7] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="mt-3 p-3 rounded-xl bg-[#A855F7]/10 border border-[#A855F7]/20">
          <p className="text-[12px] text-[#C084FC] leading-relaxed">
            You will get an SMS once the surveyor is on the way. Please keep the vehicle accessible.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════
   PolicyCardsWidget — multi-policy dashboard entry
   ════════════════════════════════════════════════════ */

function daysLeft(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function PolicyCardsWidget({ onSelect }: { onSelect: (response: string) => void }) {
  const tw = useT().motorWidgets;
  const policies = useMotorStore((s) => s.dashboardPolicies);
  const vehicleType = useMotorStore((s) => s.vehicleType);
  const [selected, setSelected] = useState<string | null>(null);

  const selectedPolicy = policies.find((p) => p.id === selected) ?? null;

  function openSheet(id: string) { setSelected(id); }
  function closeSheet() { setSelected(null); }

  return (
    <>
      <div className="w-full space-y-3 max-w-sm">
        {policies.map((policy, idx) => {
          const days = daysLeft(policy.expiryDate);
          const isUrgent = days <= 30 && days > 0;
          const isExpired = days <= 0;

          return (
            <motion.button
              key={policy.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.3 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => openSheet(policy.id)}
              className="w-full text-left rounded-2xl overflow-hidden transition-all active:opacity-90"
              style={{
                background: 'var(--motor-surface)',
                border: `1.5px solid ${isUrgent ? 'rgba(234,88,12,0.45)' : 'var(--motor-border)'}`,
              }}
            >
              <div className="px-4 pt-4 pb-4">
                {/* Title row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold leading-tight" style={{ color: 'var(--motor-text)' }}>
                      {policy.make} {policy.model} {policy.variant}
                    </p>
                    <p className="text-[12px] font-mono mt-0.5" style={{ color: 'var(--motor-text-muted)' }}>
                      {policy.registrationNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isExpired ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                        {tw.statusExpired}
                      </span>
                    ) : isUrgent ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full animate-pulse"
                        style={{ background: 'rgba(234,88,12,0.15)', color: '#EA580C' }}>
                        {days}d left
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>
                        {tw.statusActive}
                      </span>
                    )}
                    <svg className="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </div>

                {/* Plan + premium */}
                <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--motor-text-muted)' }}>
                  <span>{policy.plan}</span>
                  <span>·</span>
                  <span>₹{policy.premium.toLocaleString('en-IN')}/yr</span>
                  <span>·</span>
                  <span>IDV ₹{(policy.idv / 100000).toFixed(1)}L</span>
                </div>

                {/* Expiry bar */}
                {!isExpired && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[11px]" style={{ color: 'var(--motor-text-muted)' }}>{tw.expires}</p>
                      <p className="text-[11px] font-semibold" style={{ color: isUrgent ? '#EA580C' : 'var(--motor-text-muted)' }}>
                        {new Date(policy.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--motor-border)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(2, Math.min(100, (days / 365) * 100))}%`,
                          background: isUrgent ? '#EA580C' : '#22C55E',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}

        {/* Persistent new-policy card — always visible, not policy-specific */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: policies.length * 0.1 + 0.1, duration: 0.28 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => onSelect('new_policy')}
          className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-all"
          style={{
            background: 'var(--motor-surface)',
            border: '1.5px dashed var(--motor-border)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[18px] font-light"
            style={{ background: 'rgba(168,85,247,0.12)', color: 'var(--motor-accent, #A78BFA)' }}
          >
            +
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold" style={{ color: 'var(--motor-accent, #A78BFA)' }}>
              Insure a new vehicle
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--motor-text-muted)' }}>
              {vehicleType === 'bike' ? 'Another bike or a brand new one' : 'Another car or a brand new one'}
            </p>
          </div>
          <svg className="w-4 h-4 shrink-0 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </motion.button>
      </div>

      {/* ── Context-aware bottom sheet ── */}
      <AnimatePresence>
        {selectedPolicy && (
          <motion.div
            key="policy-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            onClick={closeSheet}
          >
            <motion.div
              key="policy-sheet"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl overflow-hidden"
              style={{
                background: 'var(--motor-glass-bg, rgba(30,15,70,0.96))',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid var(--motor-border-strong)',
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: 'var(--motor-border-strong)' }} />
              </div>

              <div className="px-5 pb-8 pt-3">
                {/* Selected vehicle header */}
                <div className="mb-5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--motor-text-muted)' }}>
                    Selected policy
                  </p>
                  <p className="text-[17px] font-bold" style={{ color: 'var(--motor-text)' }}>
                    {selectedPolicy.make} {selectedPolicy.model} {selectedPolicy.variant}
                  </p>
                  <p className="text-[12px] font-mono mt-0.5" style={{ color: 'var(--motor-text-muted)' }}>
                    {selectedPolicy.registrationNumber} · {selectedPolicy.plan}
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {(() => {
                    const days = daysLeft(selectedPolicy.expiryDate);
                    const isUrgent = days <= 30 && days > 0;
                    const isExpired = days <= 0;

                    const actions: { id: string; label: string; sub: string; accent?: boolean; warning?: boolean }[] = [];

                    if (isUrgent || isExpired) {
                      actions.push({ id: 'renew', label: 'Renew now', sub: isExpired ? 'Policy has expired — renew immediately' : `${days} days left — don't let it lapse`, warning: true });
                    }

                    actions.push(
                      { id: 'manage', label: 'View & Manage', sub: 'Policy details, add-ons, nominee', accent: !isUrgent && !isExpired },
                      { id: 'claim', label: 'Raise a Claim', sub: 'Report accident, theft or damage' },
                      { id: 'download', label: 'Download Documents', sub: 'Policy certificate, tax invoice, RC card' },
                    );

                    return actions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => {
                          closeSheet();
                          onSelect(`${selectedPolicy.id}::${action.id}`);
                        }}
                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-all active:opacity-75"
                        style={{
                          background: action.warning
                            ? 'rgba(234,88,12,0.1)'
                            : action.accent
                              ? 'rgba(168,85,247,0.12)'
                              : 'var(--motor-surface)',
                          border: `1px solid ${action.warning ? 'rgba(234,88,12,0.3)' : action.accent ? 'rgba(168,85,247,0.3)' : 'var(--motor-border)'}`,
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold" style={{ color: action.warning ? '#EA580C' : action.accent ? 'var(--motor-accent, #A78BFA)' : 'var(--motor-text)' }}>
                            {action.label}
                          </p>
                          <p className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--motor-text-muted)' }}>
                            {action.sub}
                          </p>
                        </div>
                        <svg className="w-4 h-4 shrink-0 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    ));
                  })()}

                </div>

                {/* Cancel */}
                <button
                  onClick={closeSheet}
                  className="w-full mt-4 py-3 text-[13px] transition-colors"
                  style={{ color: 'var(--motor-text-muted)' }}
                >
                  {tw.cancel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
