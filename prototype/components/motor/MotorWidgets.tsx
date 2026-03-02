'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Option } from '../../lib/core/types';
import { useMotorStore } from '../../lib/motor/store';
import { MotorJourneyState, NcbPercentage } from '../../lib/motor/types';
import { getMotorAddOns } from '../../lib/motor/plans';

/* ═══════════════════════════════════════════════
   SVG Icons for Motor
   ═══════════════════════════════════════════════ */

const MOTOR_ICONS: Record<string, string> = {
  car: 'M8 17h.01M16 17h.01M3 11l1.5-5A2 2 0 016.4 4.5h11.2a2 2 0 011.9 1.5L21 11m-18 0h18v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z',
  bike: 'M5.5 17a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm13 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM7.5 14.5L10 9l3 3h4l1.5-3',
  shield: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  document: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  check: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  clock: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  star: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
  user: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  building: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21',
  forward: 'M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688z',
  help: 'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827m0 0v.75m0-3.75h.008v.008H12v-.008z',
  shield_search: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  fuel: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
  electric: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
};

function MotorIcon({ icon, className = 'w-6 h-6' }: { icon: string; className?: string }) {
  const path = MOTOR_ICONS[icon];
  if (!path) return <span className="text-2xl">{icon}</span>;
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   Selection Cards (Motor version)
   ═══════════════════════════════════════════════ */

export function MotorSelectionCards({ options, onSelect }: { options: Option[]; onSelect: (id: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const useGrid = options.length <= 4 && options.every(o => o.icon);

  const handleSelect = (id: string) => {
    setSelected(id);
    setTimeout(() => onSelect(id), 250);
  };

  if (useGrid) {
    return (
      <div className="grid grid-cols-2 gap-3 max-w-md">
        {options.map((opt, i) => (
          <motion.button
            key={opt.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => handleSelect(opt.id)}
            className={`
              relative flex flex-col items-center text-center p-5 rounded-2xl border transition-all duration-200 active:scale-[0.96] min-h-[120px] justify-center
              ${selected === opt.id
                ? 'border-purple-400 bg-white/15 shadow-lg shadow-purple-900/20'
                : 'border-white/10 bg-white/6 hover:bg-white/12 hover:border-white/20'
              }
            `}
          >
            {opt.badge && (
              <span className="absolute -top-2 -right-2 text-[11px] bg-pink-500 text-white px-2.5 py-0.5 rounded-full font-semibold shadow-sm">
                {opt.badge}
              </span>
            )}
            <div className="mb-2 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <MotorIcon icon={opt.icon!} className="w-6 h-6 text-purple-300" />
            </div>
            <span className="text-[15px] font-medium text-white/90">{opt.label}</span>
            {opt.description && (
              <p className="text-[12px] text-white/40 mt-1">{opt.description}</p>
            )}
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2.5 max-w-md">
      {options.map((opt, i) => (
        <motion.button
          key={opt.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          onClick={() => handleSelect(opt.id)}
          className={`
            text-left px-4 py-3.5 rounded-xl border transition-all duration-200 active:scale-[0.97]
            ${selected === opt.id
              ? 'border-purple-400 bg-white/15 shadow-md shadow-purple-900/20'
              : 'border-white/10 bg-white/6 hover:bg-white/12 hover:border-white/20'
            }
          `}
        >
          <div className="flex items-center gap-3">
            {opt.icon && (
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <MotorIcon icon={opt.icon} className="w-4.5 h-4.5 text-purple-300" />
              </div>
            )}
            <div className="flex-1">
              <span className="text-[15px] font-medium text-white/90">{opt.label}</span>
              {opt.description && <p className="text-[12px] text-white/40 mt-0.5">{opt.description}</p>}
            </div>
          </div>
        </motion.button>
      ))}
    </div>
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
          className="w-full pl-16 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-[18px] font-semibold text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400 focus:bg-white/15 transition-colors tracking-wider uppercase"
          maxLength={16}
          autoComplete="off"
        />
      </div>
      {error && <p className="text-[12px] text-red-400 mt-1.5">{error}</p>}
      <button
        onClick={handleSubmit}
        className="mt-4 w-full py-3.5 bg-white text-[#1C0B47] rounded-xl text-[15px] font-semibold hover:bg-white/90 transition-colors active:scale-[0.97]"
      >
        Find my {useMotorStore.getState().vehicleType === 'bike' ? 'bike' : 'car'}
      </button>
    </div>
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
      <div className="bg-white/8 border border-white/15 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <MotorIcon icon={vehicleType === 'bike' ? 'bike' : 'car'} className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <p className="text-[11px] text-white/40 uppercase tracking-wider">Registration</p>
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

export function VehicleDetailsCard({ onConfirm }: { onConfirm: () => void }) {
  const state = useMotorStore.getState() as MotorJourneyState;
  const v = state.vehicleData;
  const p = state.previousPolicy;
  const [confirmed, setConfirmed] = useState(false);

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
      <div className="bg-white/8 border border-white/15 rounded-2xl overflow-hidden">
        {/* Vehicle Header */}
        <div className="bg-gradient-to-r from-purple-500/20 to-purple-400/10 px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
              <MotorIcon icon={state.vehicleType === 'bike' ? 'bike' : 'car'} className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-white">{v.make} {v.model}</h3>
              <p className="text-[12px] text-white/50">{v.variant} · {v.fuelType} · {v.registrationYear}</p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[12px] text-white/40">Registration</span>
            <span className="text-[13px] font-semibold text-white tracking-wider">{state.registrationNumber}</span>
          </div>
          {p.insurer && (
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-white/40">Current Insurer</span>
              <span className="text-[13px] font-medium text-white/80">{p.insurer}</span>
            </div>
          )}
          {p.expiryDate && (
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-white/40">Policy Expiry</span>
              <span className="text-[13px] font-medium text-white/80">{p.expiryDate}</span>
            </div>
          )}
          {p.ncbPercentage > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-white/40">NCB</span>
              <span className="text-[13px] font-medium text-green-400">{p.ncbPercentage}%</span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleConfirm}
        disabled={confirmed}
        className="mt-4 w-full py-3.5 bg-white text-[#1C0B47] rounded-xl text-[15px] font-semibold hover:bg-white/90 transition-colors active:scale-[0.97] disabled:opacity-60"
      >
        {confirmed ? 'Confirmed' : 'Yes, this is correct'}
      </button>

      <button
        className="mt-2 w-full py-2.5 text-[13px] text-white/50 hover:text-white/70 transition-colors"
      >
        This is not my vehicle
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   Brand Selector — Searchable brand list
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
    setTimeout(() => onSelect(brand), 250);
  };

  return (
    <div className="max-w-sm">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`Search ${vehicleType === 'bike' ? 'bike' : 'car'} brand`}
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400 transition-colors mb-3"
        autoFocus
      />
      <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto scrollbar-hide">
        {filtered.map((brand, i) => (
          <motion.button
            key={brand}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => handleSelect(brand)}
            className={`
              text-left px-3 py-3 rounded-xl border transition-all duration-200 active:scale-[0.97]
              ${selected === brand
                ? 'border-purple-400 bg-white/15'
                : 'border-white/10 bg-white/6 hover:bg-white/12'
              }
            `}
          >
            <span className="text-[14px] font-medium text-white/90">{brand}</span>
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
    setTimeout(() => onSelect(model), 250);
  };

  return (
    <div className="max-w-sm">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`Search ${brand} model`}
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400 transition-colors mb-3"
        autoFocus
      />
      <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto scrollbar-hide">
        {filtered.map((model, i) => (
          <motion.button
            key={model}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => handleSelect(model)}
            className={`
              text-left px-3 py-3 rounded-xl border transition-all duration-200 active:scale-[0.97]
              ${selected === model
                ? 'border-purple-400 bg-white/15'
                : 'border-white/10 bg-white/6 hover:bg-white/12'
              }
            `}
          >
            <span className="text-[14px] font-medium text-white/90">{model}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Variant Selector
   ═══════════════════════════════════════════════ */

const COMMON_VARIANTS = ['LXI', 'VXI', 'ZXI', 'ZXI+', 'LDI', 'VDI', 'ZDI', 'ZDI+', 'Base', 'Mid', 'Top', 'HTE', 'HTK', 'HTK+', 'HTX', 'HTX+'];

export function VariantSelector({ onSelect }: { onSelect: (variant: string) => void }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = search
    ? COMMON_VARIANTS.filter(v => v.toLowerCase().includes(search.toLowerCase()))
    : COMMON_VARIANTS;

  const handleSelect = (variant: string) => {
    setSelected(variant);
    setTimeout(() => onSelect(variant), 250);
  };

  return (
    <div className="max-w-sm">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search or type variant"
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400 transition-colors mb-3"
        autoFocus
      />
      <div className="grid grid-cols-3 gap-2 max-h-[250px] overflow-y-auto scrollbar-hide">
        {filtered.map((variant, i) => (
          <motion.button
            key={variant}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => handleSelect(variant)}
            className={`
              px-3 py-2.5 rounded-lg border text-center transition-all duration-200 active:scale-[0.97]
              ${selected === variant
                ? 'border-purple-400 bg-white/15'
                : 'border-white/10 bg-white/6 hover:bg-white/12'
              }
            `}
          >
            <span className="text-[13px] font-medium text-white/90">{variant}</span>
          </motion.button>
        ))}
      </div>
      {search && !filtered.length && (
        <button
          onClick={() => handleSelect(search)}
          className="mt-2 w-full py-3 bg-purple-500/20 border border-purple-400/30 rounded-xl text-[14px] text-purple-300 font-medium"
        >
          Use "{search}"
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Year Selector — Registration year
   ═══════════════════════════════════════════════ */

export function YearSelector({ onSelect }: { onSelect: (year: string) => void }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (year: number) => {
    setSelected(year);
    setTimeout(() => onSelect(String(year)), 250);
  };

  return (
    <div className="max-w-sm">
      <div className="grid grid-cols-4 gap-2 max-h-[250px] overflow-y-auto scrollbar-hide">
        {years.map((year, i) => (
          <motion.button
            key={year}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.015 }}
            onClick={() => handleSelect(year)}
            className={`
              px-3 py-3 rounded-lg border text-center transition-all duration-200 active:scale-[0.97]
              ${selected === year
                ? 'border-purple-400 bg-white/15'
                : 'border-white/10 bg-white/6 hover:bg-white/12'
              }
            `}
          >
            <span className="text-[14px] font-medium text-white/90">{year}</span>
          </motion.button>
        ))}
      </div>
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
    setTimeout(() => onSelect(String(ncb)), 250);
  };

  return (
    <div className="max-w-sm">
      <div className="space-y-2">
        {NCB_OPTIONS.map((opt, i) => (
          <motion.button
            key={opt.value}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => handleSelect(opt.value)}
            className={`
              w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-200 active:scale-[0.97]
              ${selected === opt.value
                ? 'border-purple-400 bg-white/15'
                : 'border-white/10 bg-white/6 hover:bg-white/12'
              }
            `}
          >
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center font-bold text-[16px]
              ${selected === opt.value ? 'bg-purple-500/30 text-purple-300' : 'bg-white/10 text-white/70'}
            `}>
              {opt.label}
            </div>
            <div className="text-left flex-1">
              <span className="text-[14px] font-semibold text-white/90">{opt.label} NCB</span>
              <p className="text-[12px] text-white/40">{opt.description}</p>
            </div>
            {selected === opt.value && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
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
        <h3 className="text-[18px] font-bold text-white mb-1">NCB Reward Applied!</h3>
        <p className="text-[14px] text-white/60 mb-3">
          {state.newNcbPercentage}% discount on your Own Damage premium
        </p>
        <div className="bg-white/10 rounded-xl p-3">
          <p className="text-[12px] text-white/40">For staying claim-free</p>
          <p className="text-[20px] font-bold text-green-400">{state.newNcbPercentage}% OFF</p>
        </div>
      </div>
      <button
        onClick={onContinue}
        className="mt-4 w-full py-3.5 bg-white text-[#1C0B47] rounded-xl text-[15px] font-semibold hover:bg-white/90 transition-colors active:scale-[0.97]"
      >
        Continue
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

  const filtered = search
    ? INSURERS.filter(i => i.toLowerCase().includes(search.toLowerCase()))
    : INSURERS;

  const handleSelect = (insurer: string) => {
    setSelected(insurer);
    setTimeout(() => onSelect(insurer), 250);
  };

  return (
    <div className="max-w-sm">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search insurer"
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400 transition-colors mb-3"
        autoFocus
      />
      <div className="space-y-2 max-h-[250px] overflow-y-auto scrollbar-hide">
        {filtered.map((insurer, i) => (
          <motion.button
            key={insurer}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => handleSelect(insurer)}
            className={`
              w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 active:scale-[0.97]
              ${selected === insurer
                ? 'border-purple-400 bg-white/15'
                : 'border-white/10 bg-white/6 hover:bg-white/12'
              }
            `}
          >
            <span className="text-[14px] font-medium text-white/90">{insurer}</span>
          </motion.button>
        ))}
      </div>
      <button
        onClick={() => onSelect('skip')}
        className="mt-3 w-full py-2.5 text-[13px] text-white/50 hover:text-white/70 transition-colors"
      >
        Skip this step
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Editable Summary — Pre-quote review
   ═══════════════════════════════════════════════ */

export function EditableSummary({ onConfirm }: { onConfirm: () => void }) {
  const state = useMotorStore.getState() as MotorJourneyState;
  const v = state.vehicleData;
  const vType = state.vehicleType === 'bike' ? 'Bike' : 'Car';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-sm"
    >
      <div className="bg-white/8 border border-white/15 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500/20 to-purple-400/10 px-5 py-3 border-b border-white/10">
          <h3 className="text-[14px] font-semibold text-white/80">Vehicle Summary</h3>
        </div>
        <div className="px-5 py-4 space-y-3">
          <SummaryRow label="Vehicle Type" value={vType} />
          {v.make && <SummaryRow label="Brand" value={v.make} />}
          {v.model && <SummaryRow label="Model" value={v.model} />}
          {v.variant && <SummaryRow label="Variant" value={v.variant} />}
          {v.fuelType && <SummaryRow label="Fuel" value={v.fuelType} />}
          {v.registrationYear && <SummaryRow label="Reg. Year" value={String(v.registrationYear)} />}
          {state.registrationNumber && <SummaryRow label="Reg. Number" value={state.registrationNumber} />}
          {state.policyStatus && <SummaryRow label="Policy Status" value={state.policyStatus === 'active' ? 'Active' : 'Expired'} />}
          {state.previousPolicy.ncbPercentage > 0 && <SummaryRow label="NCB" value={`${state.previousPolicy.ncbPercentage}%`} highlight />}
        </div>
      </div>

      <button
        onClick={onConfirm}
        className="mt-4 w-full py-3.5 bg-white text-[#1C0B47] rounded-xl text-[15px] font-semibold hover:bg-white/90 transition-colors active:scale-[0.97]"
      >
        View prices
      </button>
    </motion.div>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[12px] text-white/40">{label}</span>
      <span className={`text-[13px] font-medium ${highlight ? 'text-green-400' : 'text-white/80'}`}>{value}</span>
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
        <h3 className="text-[16px] font-bold text-white mb-2">Unable to insure</h3>
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
      
      // Generate plans (import inline to avoid issues)
      setTimeout(async () => {
        try {
          const { getMotorPlanDetails, calculateIDV } = await import('../../lib/motor/plans');
          const state = useMotorStore.getState() as MotorJourneyState;
          
          // Calculate IDV
          const makePrice = 800000; // Mock: ₹8L
          const vehicleAge = vehicleData.registrationYear 
            ? new Date().getFullYear() - vehicleData.registrationYear 
            : 3;
          const idvData = calculateIDV(makePrice, vehicleAge);
          
          // Generate all plan variations
          // Note: Only Comprehensive has garage tier options
          const comprehensiveAll = getMotorPlanDetails(state, 'comprehensive', 'all');
          const comprehensiveNetwork = getMotorPlanDetails(state, 'comprehensive', 'network');
          const zeroDep = getMotorPlanDetails(state, 'zero_dep');
          const thirdParty = getMotorPlanDetails(state, 'third_party');
          
          onComplete({
            plans: [comprehensiveAll, comprehensiveNetwork, zeroDep, thirdParty],
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
   Plan Selector — 3 main plan cards
   ═══════════════════════════════════════════════ */

export function PlanSelector({ onSelect }: { onSelect: (selection: any) => void }) {
  const availablePlans = useMotorStore((s) => s.availablePlans) || [];
  const idv = useMotorStore((s) => s.idv);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showGarageTier, setShowGarageTier] = useState(false);

  // Group plans by type
  const comprehensivePlans = availablePlans.filter((p: any) => p.type === 'comprehensive');
  const zeroDepPlans = availablePlans.filter((p: any) => p.type === 'zero_dep');
  const thirdPartyPlan = availablePlans.find((p: any) => p.type === 'third_party');

  const comprehensiveLowest = comprehensivePlans.sort((a: any, b: any) => a.totalPrice - b.totalPrice)[0];
  const zeroDepLowest = zeroDepPlans.sort((a: any, b: any) => a.totalPrice - b.totalPrice)[0];

  const formatPrice = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const handlePlanClick = (plan: any) => {
    if (plan.type === 'comprehensive') {
      setSelectedPlan(plan);
      setShowGarageTier(true);
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
          ₹{(idv / 100000).toFixed(1)} Lakh <button className="text-purple-300 text-[12px] ml-1">Edit</button>
        </p>
      </div>

      {/* Comprehensive Plan */}
      {comprehensiveLowest && (
        <PlanCard
          plan={comprehensiveLowest}
          title="Comprehensive Plans"
          subtitle="2 options starting from"
          badge="Recommended for your car"
          price={formatPrice(comprehensiveLowest.totalPrice)}
          strikePrice={comprehensiveLowest.totalPrice + 1000}
          description="This plan includes fire, theft, accident, and third party liability cover."
          onSelect={() => handlePlanClick(comprehensiveLowest)}
        />
      )}

      {/* Zero Depreciation Plan */}
      {zeroDepLowest && (
        <PlanCard
          plan={zeroDepLowest}
          title="Zero Depreciation Plans"
          subtitle="2 options starting from"
          badge="Best value"
          price={formatPrice(zeroDepLowest.totalPrice)}
          description="This plan includes fire, theft, accident, and third party liability cover and covers 100% cost of replaced parts during repairs."
          onSelect={() => handlePlanClick(zeroDepLowest)}
          recommended
        />
      )}

      {/* Third Party Plan */}
      {thirdPartyPlan && (
        <PlanCard
          plan={thirdPartyPlan}
          title="Third-party Plan"
          subtitle="Minimum coverage required by law"
          price={`${formatPrice(thirdPartyPlan.totalPrice)} (Same across all insurers)`}
          description="It covers damage caused by your car to others and their property, but does not cover any damage caused to your car."
          onSelect={() => handlePlanClick(thirdPartyPlan)}
        />
      )}

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
                className="w-full max-w-md bg-gradient-to-br from-[#2D1B69] to-[#1C0B47] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-5">
                  <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
                  <h3 className="text-[18px] font-bold text-white mb-1">Choose your garage network</h3>
                  <p className="text-[12px] text-white/50 mb-5">Comprehensive plan lets you pick where your car gets repaired</p>

                  <div className="space-y-3">
                    {/* Network Garages */}
                    <button
                      onClick={() => handleGarageTierSelect('network')}
                      className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 rounded-xl text-left transition-all group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-[14px] font-semibold text-white group-hover:text-purple-200 transition-colors">Network Garages</h4>
                            <p className="text-[11px] text-white/50">Cashless repairs at 5,400+ ACKO partner garages</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="text-[16px] font-bold text-white">{formatPrice(networkPlan?.totalPrice || 0)}</p>
                          <p className="text-[10px] text-white/40">+ 18% GST</p>
                        </div>
                      </div>
                      {savings > 0 && (
                        <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full border border-green-400/20">
                          Save ₹{savings.toLocaleString('en-IN')}
                        </span>
                      )}
                    </button>

                    {/* All Garages */}
                    <button
                      onClick={() => handleGarageTierSelect('all')}
                      className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 rounded-xl text-left transition-all group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 3.168 1.03-5.995L2.073 7.533l6.02-.874L11.42 1.5l3.326 5.159 6.02.874-4.993 4.81 1.03 5.995z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-[14px] font-semibold text-white group-hover:text-purple-200 transition-colors">All Garages</h4>
                            <p className="text-[11px] text-white/50">Get repairs at any garage of your choice</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="text-[16px] font-bold text-white">{formatPrice(allPlan?.totalPrice || 0)}</p>
                          <p className="text-[10px] text-white/40">+ 18% GST</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-400/20">
                        Recommended
                      </span>
                    </button>
                  </div>

                  <button
                    onClick={() => setShowGarageTier(false)}
                    className="w-full mt-4 py-3 text-[14px] text-white/50 hover:text-white/70 transition-colors"
                  >
                    Cancel
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

function PlanCard({
  plan,
  title,
  subtitle,
  badge,
  price,
  strikePrice,
  description,
  onSelect,
  recommended,
}: {
  plan: any;
  title: string;
  subtitle?: string;
  badge?: string;
  price: string;
  strikePrice?: number;
  description: string;
  onSelect: () => void;
  recommended?: boolean;
}) {
  const isComprehensive = plan?.type === 'comprehensive';
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'covered' | 'not_covered' | 'upgrades'>('covered');
  const [showGarageExplorer, setShowGarageExplorer] = useState(false);

  const formatPrice = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  // Extract quick features (first 3, only the title part before —)
  const quickFeatures = plan.features.slice(0, 3).map((f: string) => f.split(' — ')[0]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          bg-white/8 border rounded-2xl overflow-hidden transition-all duration-200
          ${recommended ? 'border-purple-400/40 bg-white/10' : 'border-white/10'}
        `}
      >
        {/* Header */}
        <div className="p-4">
          <div className="mb-3">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="text-[15px] font-semibold text-white">{title}</h3>
                {subtitle && <p className="text-[11px] text-white/40 mt-0.5">{subtitle}</p>}
              </div>
              {badge && (
                <span className="text-[10px] bg-purple-500/30 text-violet-700 px-2 py-0.5 rounded-full border border-purple-400/30 whitespace-nowrap">
                  {badge}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {strikePrice && (
                <p className="text-[14px] font-semibold text-white/40 line-through">{formatPrice(strikePrice)}</p>
              )}
              <p className="text-[18px] font-bold text-white">{price}</p>
            </div>
            <p className="text-[12px] text-white/50 leading-relaxed mt-1">
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
              {quickFeatures.map((feature: string, i: number) => {
                const isGarageFeature = feature.includes('Cashless claims');
                return (
                  <div key={i} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {isGarageFeature ? (
                      <button
                        onClick={() => setShowGarageExplorer(true)}
                        className="text-[12px] text-white/70 hover:text-purple-300 transition-colors text-left underline decoration-white/30 hover:decoration-purple-300"
                      >
                        {feature}
                      </button>
                    ) : (
                      <span className="text-[12px] text-white/70">{feature}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA - when collapsed */}
          {!expanded && (
            <button
              onClick={onSelect}
              className="w-full py-2.5 bg-white/10 border border-white/20 rounded-xl text-[13px] font-semibold text-white hover:bg-white/15 transition-colors"
            >
              {isComprehensive ? 'Explore plan' : 'Select this plan'}
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
                        Opt for additional covers in the next steps to enhance your {plan.type === 'third_party' ? 'coverage' : 'car protection'}
                      </p>
                      <div className="space-y-2">
                        {plan.addOnsAvailable.map((addonId: string, i: number) => {
                          const addonInfo: Record<string, { name: string; desc: string }> = {
                            engine_protection: {
                              name: 'Engine Protection',
                              desc: 'It covers engine damage caused by oil leaks and water penetration. Standard plans only cover engine damage caused in an accident.',
                            },
                            extra_car_protection: {
                              name: 'Extra Car Protection',
                              desc: 'It offers 24x7 roadside assistance, key repair/replacement, and reimbursement for outstation repairs.',
                            },
                            consumables_cover: {
                              name: 'Consumables Cover',
                              desc: 'It pays for the cost of nuts and bolts, brake oil, engine oil etc. used during car repairs. Standard plans don\'t cover this.',
                            },
                            personal_accident: {
                              name: 'Personal Accident Cover',
                              desc: 'It\'s mandatory to add this cover if you don\'t have it. It provides coverage of up to ₹15 lakh for accidental death or injury of the car owner.',
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
                  className="w-full py-3 bg-white text-[#1C0B47] rounded-xl text-[14px] font-semibold hover:bg-white/90 transition-colors active:scale-[0.97]"
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

  // Mock garage data
  const garages = [
    { id: 1, name: 'Elite Auto Service', city: 'Mumbai', area: 'Andheri West', rating: 4.5 },
    { id: 2, name: 'City Motors Garage', city: 'Mumbai', area: 'Bandra East', rating: 4.7 },
    { id: 3, name: 'Premium Car Care', city: 'Delhi', area: 'Connaught Place', rating: 4.6 },
    { id: 4, name: 'Royal Auto Works', city: 'Bangalore', area: 'Koramangala', rating: 4.8 },
    { id: 5, name: 'Swift Service Center', city: 'Mumbai', area: 'Powai', rating: 4.4 },
    { id: 6, name: 'Highway Garage', city: 'Delhi', area: 'Dwarka', rating: 4.3 },
    { id: 7, name: 'Metro Car Service', city: 'Bangalore', area: 'Whitefield', rating: 4.6 },
    { id: 8, name: 'Grand Auto Care', city: 'Pune', area: 'Hinjewadi', rating: 4.5 },
    { id: 9, name: 'Rapid Repairs', city: 'Mumbai', area: 'Goregaon', rating: 4.2 },
    { id: 10, name: 'Speed Zone Garage', city: 'Delhi', area: 'Rohini', rating: 4.7 },
    { id: 11, name: 'Precision Motors', city: 'Bangalore', area: 'Indiranagar', rating: 4.9 },
    { id: 12, name: 'Central Car Clinic', city: 'Mumbai', area: 'Kurla', rating: 4.3 },
    { id: 13, name: 'Pro Auto Solutions', city: 'Delhi', area: 'Saket', rating: 4.6 },
    { id: 14, name: 'Prime Service Hub', city: 'Pune', area: 'Viman Nagar', rating: 4.4 },
    { id: 15, name: 'Express Auto Repair', city: 'Bangalore', area: 'BTM Layout', rating: 4.5 },
    { id: 16, name: 'Star Motors Workshop', city: 'Mumbai', area: 'Malad', rating: 4.8 },
    { id: 17, name: 'Capital Garage Services', city: 'Delhi', area: 'Janakpuri', rating: 4.2 },
    { id: 18, name: 'Tech Auto Care', city: 'Bangalore', area: 'Electronic City', rating: 4.7 },
    { id: 19, name: 'Ace Automobile Center', city: 'Pune', area: 'Kharadi', rating: 4.6 },
    { id: 20, name: 'Skyline Car Service', city: 'Mumbai', area: 'Thane', rating: 4.5 },
    { id: 21, name: 'Max Auto Works', city: 'Delhi', area: 'Vasant Kunj', rating: 4.4 },
    { id: 22, name: 'Urban Motors', city: 'Bangalore', area: 'Marathahalli', rating: 4.9 },
    { id: 23, name: 'Crystal Auto Care', city: 'Pune', area: 'Baner', rating: 4.3 },
    { id: 24, name: 'Victory Garage', city: 'Mumbai', area: 'Borivali', rating: 4.7 },
    { id: 25, name: 'Elite Service Station', city: 'Delhi', area: 'Lajpat Nagar', rating: 4.5 },
    { id: 26, name: 'Smart Auto Solutions', city: 'Bangalore', area: 'Yelahanka', rating: 4.6 },
    { id: 27, name: 'Prestige Car Clinic', city: 'Pune', area: 'Wakad', rating: 4.8 },
    { id: 28, name: 'Infinity Motors', city: 'Mumbai', area: 'Kandivali', rating: 4.4 },
    { id: 29, name: 'Supreme Auto Hub', city: 'Delhi', area: 'Pitampura', rating: 4.2 },
    { id: 30, name: 'Phoenix Car Care', city: 'Bangalore', area: 'Jayanagar', rating: 4.7 },
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
        className="w-full max-w-2xl max-h-[85vh] bg-gradient-to-br from-[#2D1B69] to-[#1C0B47] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="text-[18px] font-bold text-white">Cashless Network Garages</h2>
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
              placeholder="Search by garage name or area..."
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
              <p className="text-[14px] text-white/50">No garages found</p>
              <p className="text-[12px] text-white/30 mt-1">Try adjusting your search or filters</p>
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

// Out of Pocket Addons Widget
export function OutOfPocketAddons({ onContinue }: { onContinue: (addons: any[]) => void }) {
  const { updateState, selectedAddOns = [], selectedPlan } = useMotorStore();
  const [selectedItems, setSelectedItems] = useState<Map<string, { id: string; variantId?: string; price: number }>>(new Map());
  const [showVariantModal, setShowVariantModal] = useState<{ addon: any; show: boolean }>({ addon: null, show: false });

  const addons = getMotorAddOns().filter((a: any) => a.category === 'out_of_pocket');

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
          <h3 className="text-[16px] font-bold text-white mb-1">Cut down your out-of-pocket expenses</h3>
          <p className="text-[12px] text-white/50">Recommended for you</p>
        </div>

        {addons.map((addon: any) => {
          const selected = isSelected(addon.id);
          const selectedItem = selectedItems.get(addon.id);
          const displayPrice = selectedItem?.price || addon.price;
          const variantName = selectedItem?.variantId ? addon.variants?.find((v: any) => v.id === selectedItem.variantId)?.name : null;

          return (
            <div key={addon.id} className={`p-4 rounded-xl border transition-all ${selected ? 'bg-white/10 border-purple-400/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-[14px] font-semibold text-white">{addon.name}</h4>
                    {addon.hasVariants && <span className="text-[10px] text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">2 options</span>}
                    {addon.recommended && <span className="text-[10px] text-green-300 bg-green-500/20 px-2 py-0.5 rounded-full">Recommended</span>}
                  </div>
                  <p className="text-[12px] text-white/60 leading-relaxed">{addon.description}</p>
                  {selected && variantName && <p className="text-[11px] text-purple-300 mt-1">Selected: {variantName}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                  <p className="text-[14px] font-bold text-white whitespace-nowrap">₹{displayPrice}</p>
                  <button onClick={() => selected ? removeAddon(addon.id) : toggleAddon(addon)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${selected ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/20'}`}>
                    {selected ? '−' : '+'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between text-white/70"><span>Base Premium</span><span>₹{totals.basePremium.toLocaleString()}</span></div>
            {totals.addonTotal > 0 && (<><div className="flex justify-between text-white/70"><span>Add-ons</span><span>₹{totals.addonTotal.toLocaleString()}</span></div><div className="flex justify-between text-white/70"><span>GST (18%)</span><span>₹{totals.gst.toLocaleString()}</span></div></>)}
            <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-white text-[15px]"><span>Total</span><span>₹{totals.total.toLocaleString()}</span></div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={handleSkip} className="flex-1 py-3 px-4 bg-white/10 border border-white/20 rounded-xl text-[14px] font-semibold text-white hover:bg-white/15 transition-colors">Continue without add-ons</button>
          <button onClick={handleContinue} className="flex-1 py-3 px-4 bg-white text-[#1C0B47] rounded-xl text-[14px] font-semibold hover:bg-white/90 transition-colors active:scale-[0.98]">Continue</button>
        </div>
        <p className="text-[11px] text-white/40 text-center mt-2">Next: Additional covers to reduce medical expenses</p>
      </motion.div>

      <AnimatePresence>
        {showVariantModal.show && showVariantModal.addon && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowVariantModal({ addon: null, show: false })}>
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-gradient-to-br from-[#2D1B69] to-[#1C0B47] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-5">
                <h3 className="text-[18px] font-bold text-white mb-1">Select {showVariantModal.addon.name} variant</h3>
                <p className="text-[12px] text-white/50 mb-4">{showVariantModal.addon.description}</p>
                <div className="space-y-3">
                  {showVariantModal.addon.variants?.map((variant: any) => (
                    <button key={variant.id} onClick={() => selectVariant(showVariantModal.addon, variant)} className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 rounded-xl text-left transition-all group">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-white">{variant.name}</span>
                          {variant.recommended && <span className="text-[10px] text-purple-300 bg-purple-500/30 px-2 py-0.5 rounded-full">Recommended</span>}
                          {variant.badge && <span className="text-[10px] text-green-300 bg-green-500/30 px-2 py-0.5 rounded-full">{variant.badge}</span>}
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
                <button onClick={() => setShowVariantModal({ addon: null, show: false })} className="w-full mt-4 py-3 text-[14px] text-white/50 hover:text-white/70 transition-colors">Cancel</button>
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
  const { updateState, selectedAddOns = [], selectedPlan } = useMotorStore();
  const [selectedItems, setSelectedItems] = useState<Map<string, { id: string; variantId?: string; price: number }>>(new Map());
  const [showVariantModal, setShowVariantModal] = useState<{ addon: any; show: boolean }>({ addon: null, show: false });

  const addons = getMotorAddOns().filter((a: any) => a.category === 'protect_everyone');

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

  const renderAddonCard = (addon: any) => {
    const selected = isSelected(addon.id);
    const selectedItem = selectedItems.get(addon.id);
    const displayPrice = selectedItem?.price || addon.price;
    const variantName = selectedItem?.variantId ? addon.variants?.find((v: any) => v.id === selectedItem.variantId)?.name : null;

    return (
      <div key={addon.id} className={`p-4 rounded-xl border transition-all ${selected ? 'bg-white/10 border-purple-400/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-[14px] font-semibold text-white">{addon.name}</h4>
              {addon.hasVariants && <span className="text-[10px] text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">2 options</span>}
              {addon.mandatory && <span className="text-[10px] text-orange-300 bg-orange-500/20 px-2 py-0.5 rounded-full">Mandatory by law</span>}
            </div>
            <p className="text-[12px] text-white/60 leading-relaxed">{addon.description}</p>
            {selected && variantName && <p className="text-[11px] text-purple-300 mt-1">Selected: {variantName}</p>}
          </div>
          <div className="flex flex-col items-end gap-2 ml-4">
            <p className="text-[14px] font-bold text-white whitespace-nowrap">{addon.hasVariants ? 'from ' : ''}₹{displayPrice}</p>
            <button onClick={() => selected ? removeAddon(addon.id) : toggleAddon(addon)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${selected ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/20'}`}>
              {selected ? '−' : '+'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="mb-4">
          <h3 className="text-[16px] font-bold text-white mb-1">Protect everyone in your car</h3>
        </div>

        <div className="mb-4">
          <p className="text-[13px] font-semibold text-white/70 mb-3">For you</p>
          {addons.filter((a: any) => a.id === 'personal_accident').map(renderAddonCard)}
        </div>

        <div className="mb-4">
          <p className="text-[13px] font-semibold text-white/70 mb-3">For your loved ones</p>
          {addons.filter((a: any) => a.id === 'passenger_protection').map(renderAddonCard)}
        </div>

        <div className="mb-4">
          <p className="text-[13px] font-semibold text-white/70 mb-3">For your driver</p>
          {addons.filter((a: any) => a.id === 'paid_driver').map(renderAddonCard)}
        </div>

        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between text-white/70"><span>Base Premium</span><span>₹{totals.basePremium.toLocaleString()}</span></div>
            {totals.totalAddons > 0 && (<><div className="flex justify-between text-white/70"><span>Add-ons</span><span>₹{totals.totalAddons.toLocaleString()}</span></div><div className="flex justify-between text-white/70"><span>GST (18%)</span><span>₹{totals.gst.toLocaleString()}</span></div></>)}
            <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-white text-[15px]"><span>Total</span><span>₹{totals.total.toLocaleString()}</span></div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={handleSkip} className="flex-1 py-3 px-4 bg-white/10 border border-white/20 rounded-xl text-[14px] font-semibold text-white hover:bg-white/15 transition-colors">Continue without add-ons</button>
          <button onClick={handleContinue} className="flex-1 py-3 px-4 bg-white text-[#1C0B47] rounded-xl text-[14px] font-semibold hover:bg-white/90 transition-colors active:scale-[0.98]">Continue</button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showVariantModal.show && showVariantModal.addon && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowVariantModal({ addon: null, show: false })}>
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-gradient-to-br from-[#2D1B69] to-[#1C0B47] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-5">
                <h3 className="text-[18px] font-bold text-white mb-1">Select Personal Accident coverage amount</h3>
                <p className="text-[12px] text-white/50 mb-4">Accidents can result in death or permanent disability. A Personal Accident Cover protects the owner-driver in such situations.</p>
                <div className="space-y-3">
                  {showVariantModal.addon.variants?.map((variant: any) => (
                    <button key={variant.id} onClick={() => selectVariant(showVariantModal.addon, variant)} className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 rounded-xl text-left transition-all group">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-white">{variant.name}</span>
                          {variant.recommended && <span className="text-[10px] text-purple-300 bg-purple-500/30 px-2 py-0.5 rounded-full">Recommended</span>}
                          {variant.badge && <span className="text-[10px] text-green-300 bg-green-500/30 px-2 py-0.5 rounded-full">{variant.badge}</span>}
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
                <button onClick={() => setShowVariantModal({ addon: null, show: false })} className="w-full mt-4 py-3 text-[14px] text-white/50 hover:text-white/70 transition-colors">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
