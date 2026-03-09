'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Option, LifeRider, LifeJourneyState } from '../../lib/life/types';
import { useLifeJourneyStore } from '../../lib/life/store';
import { calculateBasePremium } from '../../lib/life/scripts';
import { useUserProfileStore } from '../../lib/userProfileStore';
import { useT } from '../../lib/translations';

/* ═══════════════════════════════════════════════════════
   SVG Icon System — Life-specific icons
   ═══════════════════════════════════════════════════════ */

const LIFE_ICON_PATHS: Record<string, string> = {
  male: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  shield: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  heart: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
  user: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  currency: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  check: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  clock: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  chart: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  document: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  family: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
  flexi: 'M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75',
  help: 'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z',
  download: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3',
};

function LifeIcon({ icon, className = 'w-6 h-6' }: { icon: string; className?: string }) {
  if (icon === 'female') {
    return (
      <svg className={`${className} text-purple-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <circle cx="12" cy="7" r="3.75" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7c-.5 1.5-1.25 3.5-1.25 5.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7c.5 1.5 1.25 3.5 1.25 5.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    );
  }
  const path = LIFE_ICON_PATHS[icon];
  if (!path) return <span className="text-2xl">{icon}</span>;
  return (
    <svg className={`${className} text-purple-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   Selection Cards — Reusable grid/list selection
   ═══════════════════════════════════════════════════════ */

export function LifeSelectionCards({ options, onSelect }: { options: Option[]; onSelect: (id: string) => void }) {
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
            {opt.icon && (
              <div className="mb-2">
                {typeof opt.icon === 'string' && LIFE_ICON_PATHS[opt.icon]
                  ? <LifeIcon icon={opt.icon} className="w-8 h-8" />
                  : <span className="text-3xl">{opt.icon}</span>}
              </div>
            )}
            <span className={`text-label-md font-medium ${selected === opt.id ? 'text-white' : 'text-white/90'}`}>
              {opt.label}
            </span>
            {opt.description && (
              <span className="text-caption text-white/50 mt-1">{opt.description}</span>
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          onClick={() => handleSelect(opt.id)}
          className={`
            flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all duration-200 active:scale-[0.97]
            ${selected === opt.id
              ? 'border-purple-400 bg-white/15 shadow-lg shadow-purple-900/20'
              : 'border-white/10 bg-white/6 hover:bg-white/12 hover:border-white/20'
            }
          `}
        >
          {opt.icon && (
            <div className="flex-shrink-0">
              {typeof opt.icon === 'string' && LIFE_ICON_PATHS[opt.icon]
                ? <LifeIcon icon={opt.icon} className="w-6 h-6" />
                : <span className="text-xl">{opt.icon}</span>}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className={`text-label-md font-medium block ${selected === opt.id ? 'text-white' : 'text-white/90'}`}>
              {opt.label}
            </span>
            {opt.description && (
              <span className="text-caption text-white/40 block mt-0.5">{opt.description}</span>
            )}
          </div>
          {selected === opt.id && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex-shrink-0">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Multi Select — Grid with multi-selection and confirm
   ═══════════════════════════════════════════════════════ */

export function LifeMultiSelect({ options, onSelect }: { options: Option[]; onSelect: (response: string) => void }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    if (id === 'none') {
      setSelected(prev => prev.includes('none') ? [] : ['none']);
      return;
    }
    setSelected(prev => {
      const without = prev.filter(s => s !== 'none');
      return without.includes(id) ? without.filter(s => s !== id) : [...without, id];
    });
  };

  return (
    <div className="max-w-md">
      <div className="grid grid-cols-2 gap-2.5">
        {options.map((opt, i) => {
          const isSelected = selected.includes(opt.id);
          return (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => toggle(opt.id)}
              className={`
                flex items-center justify-center text-center px-4 py-3.5 rounded-xl border transition-all duration-150 active:scale-[0.97]
                ${isSelected
                  ? 'border-purple-400 bg-white/15'
                  : 'border-white/10 bg-white/6 hover:bg-white/12 hover:border-white/20'
                }
              `}
            >
              <span className="text-label-md text-white/90 font-medium">{opt.label}</span>
              {isSelected && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
      <button
        onClick={() => selected.length > 0 && onSelect(selected.join(','))}
        disabled={selected.length === 0}
        className="mt-4 w-full py-3 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-label-lg font-semibold disabled:opacity-40 transition-all active:scale-[0.97]"
      >
        Continue
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Number Input — For age, income, coverage amounts
   ═══════════════════════════════════════════════════════ */

export function LifeNumberInput({ 
  placeholder, 
  subText, 
  inputType,
  min, 
  max, 
  onSubmit 
}: { 
  placeholder: string; 
  subText?: string;
  inputType?: string;
  min?: number; 
  max?: number; 
  onSubmit: (val: string) => void 
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handleSubmit = () => {
    const num = parseFloat(value);
    if (!value.trim()) { setError('Please enter a value'); return; }
    if (min !== undefined && num < min) { setError(`Minimum value is ${min.toLocaleString('en-IN')}`); return; }
    if (max !== undefined && num > max) { setError(`Maximum value is ${max.toLocaleString('en-IN')}`); return; }
    setError('');
    onSubmit(value);
  };

  const formatDisplay = (v: string) => {
    const num = parseInt(v);
    if (isNaN(num)) return '';
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)} L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)} K`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <div className="max-w-sm">
      <div className="relative">
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={placeholder}
          className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30 text-label-lg font-medium transition-colors"
        />
        {value && inputType !== 'tel' && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-body-sm text-purple-300/70">
            {formatDisplay(value)}
          </div>
        )}
      </div>
      {error && (
        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-caption mt-1.5">
          {error}
        </motion.p>
      )}
      {subText && <p className="text-white/40 text-caption mt-1.5">{subText}</p>}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        onClick={handleSubmit}
        className="w-full mt-3 py-3 rounded-xl bg-purple-700 text-white hover:bg-purple-600 text-label-lg font-semibold active:scale-[0.97] transition-transform"
      >
        Continue
      </motion.button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Text Input — For name, phone, pincode
   ═══════════════════════════════════════════════════════ */

export function LifeTextInput({
  placeholder,
  inputType = 'text',
  maxLength,
  onSubmit,
}: {
  placeholder: string;
  inputType?: string;
  maxLength?: number;
  onSubmit: (val: string) => void;
}) {
  const lw = useT().lifeWidgets;
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handleSubmit = () => {
    if (!value.trim()) { setError(lw.textErrorEmpty); return; }
    if (inputType === 'tel' && value.length !== 10) { setError('Please enter a valid 10-digit number'); return; }
    setError('');
    onSubmit(value.trim());
  };

  return (
    <div className="max-w-sm">
      <input
        ref={inputRef}
        type={inputType}
        value={value}
        onChange={(e) => { setValue(e.target.value); setError(''); }}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30 text-label-lg font-medium transition-colors"
        autoFocus
      />
      {error && (
        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-caption mt-1.5">
          {error}
        </motion.p>
      )}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        onClick={handleSubmit}
        className="w-full mt-3 py-3 rounded-xl bg-purple-700 text-white hover:bg-purple-600 text-label-lg font-semibold active:scale-[0.97] transition-transform"
      >
        Continue
      </motion.button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Date Picker — For date of birth
   ═══════════════════════════════════════════════════════ */

export function LifeDatePicker({
  placeholder = 'Select date of birth',
  onSubmit,
}: {
  placeholder?: string;
  onSubmit: (val: string) => void;
}) {
  const lw = useT().lifeWidgets;
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => dayRef.current?.focus(), 300);
  }, []);

  const handleSubmit = () => {
    const d = parseInt(day);
    const m = parseInt(month);
    const y = parseInt(year);
    if (!d || !m || !y) { setError(lw.dobErrorIncomplete); return; }
    if (d < 1 || d > 31) { setError(lw.dobErrorDay); return; }
    if (m < 1 || m > 12) { setError(lw.dobErrorMonth); return; }
    if (y < 1940 || y > 2010) { setError('Year should be between 1940 and 2010'); return; }
    
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    setError('');
    onSubmit(dateStr);
  };

  return (
    <div className="w-full">
      <p className="text-body-sm text-white/60 mb-3">{placeholder}</p>
      <div className="flex gap-3">
        <input
          ref={dayRef}
          type="number"
          inputMode="numeric"
          placeholder={lw.dobDayPlaceholder}
          value={day}
          onChange={(e) => {
            setDay(e.target.value);
            if (e.target.value.length >= 2) monthRef.current?.focus();
          }}
          maxLength={2}
          className="flex-1 min-w-0 px-2 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 text-center text-sm font-medium transition-colors"
        />
        <input
          ref={monthRef}
          type="number"
          inputMode="numeric"
          placeholder={lw.dobMonthPlaceholder}
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            if (e.target.value.length >= 2) yearRef.current?.focus();
          }}
          maxLength={2}
          className="flex-1 min-w-0 px-2 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 text-center text-sm font-medium transition-colors"
        />
        <input
          ref={yearRef}
          type="number"
          inputMode="numeric"
          placeholder={lw.dobYearPlaceholder}
          value={year}
          onChange={(e) => setYear(e.target.value)}
          maxLength={4}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="flex-[1.3] min-w-0 px-2 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 text-center text-sm font-medium transition-colors"
        />
      </div>
      {error && (
        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-caption mt-1.5">
          {error}
        </motion.p>
      )}
      {day && month && year && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-purple-300/60 text-caption mt-1.5">
          {parseInt(day)}/{parseInt(month)}/{parseInt(year)}
        </motion.p>
      )}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        onClick={handleSubmit}
        className="w-full mt-3 py-2.5 rounded-xl bg-purple-700 text-white hover:bg-purple-600 text-sm font-semibold active:scale-[0.97] transition-transform"
      >
        Continue
      </motion.button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Rider Toggle — For add-on riders with premium impact
   ═══════════════════════════════════════════════════════ */

export function LifeRiderToggle({ 
  options, 
  onSelect 
}: { 
  options: Option[]; 
  onSelect: (id: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelected(id);
    setTimeout(() => onSelect(id), 300);
  };

  return (
    <div className="max-w-md space-y-3">
      {options.map((opt, i) => (
        <motion.button
          key={opt.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          onClick={() => handleSelect(opt.id)}
          className={`
            w-full flex items-center gap-3 px-4 py-4 rounded-xl border text-left transition-all duration-200 active:scale-[0.97]
            ${selected === opt.id
              ? opt.id === 'yes'
                ? 'border-purple-400 bg-purple-500/15 shadow-lg shadow-purple-900/20'
                : 'border-white/25 bg-white/10'
              : 'border-white/10 bg-white/6 hover:bg-white/10 hover:border-white/20'
            }
          `}
        >
          <div className={`
            w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
            ${selected === opt.id
              ? opt.id === 'yes'
                ? 'border-purple-400 bg-purple-500'
                : 'border-white/40 bg-white/20'
              : 'border-white/30 bg-transparent'
            }
          `}>
            {selected === opt.id && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                {opt.id === 'yes' ? (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </motion.div>
            )}
          </div>
          <span className={`text-label-md font-medium ${selected === opt.id ? 'text-white' : 'text-white/80'}`}>
            {opt.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Coverage Card — Clean visual summary of recommended coverage
   ═══════════════════════════════════════════════════════ */

export function LifeCoverageCard({ coverageAmount, policyTerm, coversTillAge, breakdownItems, onContinue }: {
  coverageAmount: string;
  policyTerm: string;
  coversTillAge: number;
  breakdownItems?: { label: string; value: string }[];
  onContinue: () => void;
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-sm mx-auto"
    >
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-purple-600/40 to-indigo-700/40 border border-white/10 backdrop-blur-sm">
        <div className="px-5 pt-5 pb-4">
          <p className="text-white/50 text-caption uppercase tracking-wider mb-1">Recommended Cover</p>
          <p className="text-3xl font-bold text-white">{coverageAmount}</p>
        </div>

        <div className="h-px bg-white/10" />

        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-caption uppercase tracking-wider mb-0.5">Policy Term</p>
            <p className="text-lg font-semibold text-white">{policyTerm}</p>
          </div>
          <div className="text-right">
            <p className="text-white/50 text-caption uppercase tracking-wider mb-0.5">Covers till age</p>
            <p className="text-lg font-semibold text-white">{coversTillAge}</p>
          </div>
        </div>

        {breakdownItems && breakdownItems.length > 0 && (
          <>
            <div className="h-px bg-white/10" />
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full px-5 py-3 flex items-center justify-between text-white/60 hover:text-white/80 transition-colors"
            >
              <span className="text-caption font-medium">Why this is recommended</span>
              <motion.svg
                animate={{ rotate: showBreakdown ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </motion.svg>
            </button>
            <AnimatePresence>
              {showBreakdown && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 space-y-2">
                    {breakdownItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-caption text-white/50">{item.label}</span>
                        <span className="text-caption text-white/80 font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      <button
        onClick={onContinue}
        className="mt-4 w-full py-3 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-label-lg font-semibold transition-all active:scale-[0.97]"
      >
        Customise my plan
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Premium Summary — Interactive quote with coverage & tenure sliders
   ═══════════════════════════════════════════════════════ */

export function LifePremiumSummary({ onContinue }: { onContinue: () => void }) {
  const lw = useT().lifeWidgets;
  const state = useLifeJourneyStore.getState() as LifeJourneyState;
  const { age, recommendedCoverage, annualIncome } = state;

  const minCoverage = 2500000;
  // Max coverage: 40x income, capped at 100Cr, min 25L, intervals of 25L
  const incomeMax = Math.max(minCoverage, (annualIncome || 0) * 40);
  const maxCoverage = Math.min(1000000000, Math.floor(incomeMax / 2500000) * 2500000);
  const coverageStep = 2500000;

  const defaultCoverage = recommendedCoverage || 10000000;
  const defaultTerm = state.selectedTerm || (60 - age);

  const [coverage, setCoverage] = useState(() => Math.min(maxCoverage, Math.max(minCoverage, defaultCoverage)));
  const [term, setTerm] = useState(defaultTerm);

  const minTerm = 10;
  const maxTerm = Math.min(60 - age, 40);
  const [showFlexiDetails, setShowFlexiDetails] = useState(false);

  const premium = calculateBasePremium({ ...state, recommendedCoverage: coverage, selectedTerm: term });
  const monthly = Math.round(premium.totalPremium / 12);
  const daily = Math.round(premium.totalPremium / 365);

  const formatCoverage = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(0)}L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  const getProgress = (value: number, min: number, max: number) => {
    return ((value - min) / (max - min)) * 100;
  };

  const handleContinue = () => {
    useLifeJourneyStore.setState({
      selectedCoverage: coverage,
      selectedTerm: term,
      quote: {
        sumAssured: coverage,
        policyTerm: term,
        premiumFrequency: 'yearly' as const,
        basePremium: premium.basePremium,
        riders: [],
        totalPremium: premium.totalPremium,
        monthlyPremium: monthly,
        yearlyPremium: premium.totalPremium,
      },
    });
    onContinue();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md"
    >
      <div className="rounded-2xl overflow-hidden border border-white/10 backdrop-blur-sm bg-gradient-to-br from-white/10 to-white/5">
        {/* Header with premium */}
        <div className="bg-gradient-to-r from-purple-600/80 to-indigo-700/80 px-5 py-5">
          <p className="text-white/60 text-caption uppercase tracking-wider">Annual Premium</p>
          <p className="text-white text-3xl font-bold mt-1">₹{premium.totalPremium.toLocaleString('en-IN')}<span className="text-lg font-normal text-white/60">/yr</span></p>
          <p className="text-white/50 text-caption mt-1">₹{monthly.toLocaleString('en-IN')}/mo &middot; ₹{daily}/day</p>
        </div>

        <div className="px-5 py-5 space-y-6">
          {/* Coverage slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-body-sm text-white/60">Coverage</span>
              <span className="text-label-md font-bold text-white">{formatCoverage(coverage)}</span>
            </div>
            <div className="relative h-6 flex items-center">
              <input
                type="range"
                min={minCoverage}
                max={maxCoverage}
                step={coverageStep}
                value={coverage}
                onChange={(e) => setCoverage(Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #a78bfa ${getProgress(coverage, minCoverage, maxCoverage)}%, rgba(255,255,255,0.15) ${getProgress(coverage, minCoverage, maxCoverage)}%)`
                }}
                className="absolute w-full h-1.5 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/30
                  [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white/30 [&::-moz-range-thumb]:cursor-pointer"
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-white/40">{formatCoverage(minCoverage)}</span>
              <span className="text-[10px] text-white/40">{formatCoverage(maxCoverage)}</span>
            </div>
          </div>

          {/* Tenure slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-body-sm text-white/60">Policy Term</span>
              <span className="text-label-md font-bold text-white">{term} years <span className="font-normal text-white/40">(till age {age + term})</span></span>
            </div>
            <div className="relative h-6 flex items-center">
              <input
                type="range"
                min={minTerm}
                max={maxTerm}
                step={1}
                value={term}
                onChange={(e) => setTerm(Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #a78bfa ${getProgress(term, minTerm, maxTerm)}%, rgba(255,255,255,0.15) ${getProgress(term, minTerm, maxTerm)}%)`
                }}
                className="absolute w-full h-1.5 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/30
                  [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white/30 [&::-moz-range-thumb]:cursor-pointer"
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-white/40">{minTerm} yrs</span>
              <span className="text-[10px] text-white/40">{maxTerm} yrs</span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-2">
          <div className="bg-white/8 rounded-xl overflow-hidden border border-white/10 transition-all duration-300">
            <button 
              onClick={() => setShowFlexiDetails(!showFlexiDetails)}
              className="w-full text-left p-3.5 flex gap-3"
            >
              <div className="mt-0.5 flex-shrink-0">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={LIFE_ICON_PATHS.flexi} />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-label-sm font-bold text-white">ACKO Flexi Benefit included</p>
                  <svg 
                    className={`w-4 h-4 text-purple-400 transition-transform duration-200 ${showFlexiDetails ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <p className="text-caption text-white/50 mt-0.5 leading-snug">
                  You can increase or decrease your coverage anytime later.
                </p>
              </div>
            </button>
            
            <AnimatePresence>
              {showFlexiDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-3.5 pb-3.5 pt-0"
                >
                  <div className="h-px bg-white/10 mb-3" />
                  <p className="text-caption font-semibold text-white/80 mb-2">Why Flexi matters:</p>
                  <ul className="space-y-1.5">
                    {[
                      lw.incomeGrowsOverTime,
                      lw.loansChange,
                      'Your family size changes'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-caption text-white/60">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-purple-400 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* CTA */}
        <div className="px-5 pb-5">
          <button
            onClick={handleContinue}
            className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform shadow-lg shadow-purple-600/30 hover:bg-purple-500"
          >
            Continue with this plan
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Review Summary — Final plan review before payment
   ═══════════════════════════════════════════════════════ */

export function LifeReviewSummary({ onConfirm, onEdit }: { onConfirm: () => void; onEdit?: (stepId: string) => void }) {
  const lw = useT().lifeWidgets;
  const state = useLifeJourneyStore.getState() as LifeJourneyState;
  const { name, age, gender, phone, pinCode, smokingStatus, annualIncome, occupation, recommendedCoverage, selectedRiders, quote } = state;

  const rows = [
    { label: lw.summaryNameLabel, value: name, stepId: 'life_basic_name' },
    { label: lw.summaryAgeLabel, value: lw.summaryAge(age), stepId: 'life_basic_dob' },
    { label: lw.summaryGenderLabel, value: gender === 'male' ? lw.summaryGenderMale : lw.summaryGenderFemale, stepId: 'life_basic_gender' },
    { label: lw.summaryPhoneLabel, value: phone, stepId: 'life_basic_phone' },
    { label: lw.summaryPinLabel, value: pinCode, stepId: 'life_basic_pincode' },
    { label: lw.summarySmokerLabel, value: smokingStatus === 'current' ? lw.summaryGenderMale : lw.summaryGenderFemale, stepId: 'life_basic_habits' },
    { label: lw.summaryIncomeLabel, value: `₹${(annualIncome / 100000).toFixed(1)}L`, stepId: 'life_basic_income' },
    { label: 'Occupation', value: occupation, stepId: 'life_lifestyle_occupation' },
    { label: lw.summaryCoverageLabel, value: `₹${((recommendedCoverage || 10000000) / 10000000).toFixed(1)} Cr`, stepId: 'life_quote_display' },
    { label: lw.summaryRidersLabel, value: selectedRiders.length > 0 ? selectedRiders.map(r => r.name).join(', ') : lw.summaryRidersNone, stepId: 'life_addons_accidental_death' },
    { label: lw.summaryPremiumLabel, value: `₹${(quote?.yearlyPremium || 0).toLocaleString('en-IN')}/year`, stepId: 'life_quote_display' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md"
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-xl shadow-purple-900/20">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-heading-sm font-bold text-gray-900">Plan Summary</h3>
          <p className="text-caption text-gray-400">Review your details before proceeding</p>
        </div>

        <div className="px-5 py-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-caption text-gray-400">{row.label}</p>
                <p className="text-body-sm text-gray-900 font-medium">{row.value}</p>
              </div>
              {onEdit && (
                <button
                  onClick={() => onEdit(row.stepId)}
                  className="text-purple-500 hover:text-purple-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onConfirm}
            className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform shadow-lg shadow-purple-600/30"
          >
            Proceed to Payment
          </button>
          <p className="text-[11px] text-gray-400 text-center mt-2">
            By proceeding, you agree to ACKO&apos;s terms & conditions
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Post-Payment Timeline — Transparent process explanation
   ═══════════════════════════════════════════════════════ */

export function LifePostPaymentTimeline({ onContinue }: { onContinue: () => void }) {
  const lw = useT().lifeWidgets;
  const steps = [
    { icon: '📞', title: lw.teleMedTitle, desc: lw.teleMedDesc, time: lw.teleMedTime },
    { icon: '🏥', title: 'Medical Tests (if needed)', desc: 'Basic health tests for coverage above ₹1 Cr', time: '2-3 days' },
    { icon: '📄', title: lw.incomeVerifyTitle, desc: lw.incomeVerifyDesc, time: lw.incomeVerifyTime },
    { icon: '🔍', title: lw.uwReviewTitle, desc: lw.uwReviewDesc, time: lw.uwReviewTime },
    { icon: '✅', title: lw.finalApprovalTitle, desc: lw.finalApprovalDesc, time: lw.finalApprovalTime },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md"
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-xl shadow-purple-900/20">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-heading-sm font-bold text-gray-900">What happens next?</h3>
          <p className="text-caption text-gray-400">Complete transparency — no surprises</p>
        </div>

        <div className="px-5 py-4">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.1 }}
              className="flex gap-3 mb-4 last:mb-0"
            >
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-lg flex-shrink-0">
                  {step.icon}
                </div>
                {i < steps.length - 1 && <div className="w-px h-full bg-purple-100 mt-1" />}
              </div>
              <div className="pb-4">
                <p className="text-label-md font-semibold text-gray-900">{step.title}</p>
                <p className="text-body-sm text-gray-500">{step.desc}</p>
                <p className="text-caption text-purple-500 mt-0.5">{step.time}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="px-5 py-4 bg-amber-50 border-t border-amber-100">
          <p className="text-body-sm text-amber-700 leading-relaxed">
            <span className="font-semibold">Full disclosure helps you.</span> We&apos;d rather insure you correctly than reject later.
            If you&apos;re not approved, we refund 100% — no questions asked.
          </p>
        </div>

        <div className="px-5 pb-5 pt-3">
          <button
            onClick={onContinue}
            className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform"
          >
            Got it, continue
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Celebration — Journey complete animation
   ═══════════════════════════════════════════════════════ */

export function LifeCelebration({ onDashboard, onContinue }: { onDashboard?: () => void; onContinue?: () => void }) {
  useEffect(() => {
    const store = useUserProfileStore.getState();
    const hasLifePolicy = store.policies.some((p) => p.lob === 'life' && p.active);
    if (!hasLifePolicy) {
      const lifeState = useLifeJourneyStore.getState() as LifeJourneyState;
      if ((lifeState as any).name) {
        store.setProfile({ firstName: (lifeState as any).name, isLoggedIn: true });
      }
      store.addPolicy({
        id: `life_${Date.now()}`,
        lob: 'life',
        policyNumber: `ACKO-L-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
        label: 'Term Life Plan',
        active: true,
        purchasedAt: new Date().toISOString(),
        premium: (lifeState as any).monthlyPremium || (lifeState as any).annualPremium || 0,
        premiumFrequency: (lifeState as any).monthlyPremium ? 'monthly' : 'yearly',
        details: `₹${((lifeState as any).selectedCoverage ? ((lifeState as any).selectedCoverage / 100000).toFixed(0) + 'L' : '1Cr')} cover`,
      });
    }
  }, []);

  useEffect(() => {
    const cb = onContinue || onDashboard;
    if (!cb) return;
    const timer = setTimeout(cb, 3000);
    return () => clearTimeout(timer);
  }, [onContinue, onDashboard]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className="text-center py-8 max-w-md mx-auto"
    >
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-600/30"
      >
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={LIFE_ICON_PATHS.shield} />
        </svg>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-heading-lg font-bold text-white mb-2"
      >
        You&apos;re protected!
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-body-md text-white/60 mb-6"
      >
        Your application is being processed. We&apos;ll keep you updated every step of the way.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/6 border border-white/10 rounded-2xl p-5 text-left"
      >
        <p className="text-label-sm font-semibold text-white/80 mb-3">What to expect:</p>
        <div className="space-y-2">
          {['Tele-medical call within 24 hours', 'Document upload link via SMS', 'Approval notification in 3-5 days'].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span className="text-body-sm text-white/70">{item}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Coverage Input — Direct-quote path: user picks coverage + term
   ═══════════════════════════════════════════════════════ */

export function LifeCoverageInput({ onContinue }: { onContinue: () => void }) {
  const state = useLifeJourneyStore.getState() as LifeJourneyState;
  const { age, annualIncome } = state;

  const minCoverage = 2500000; // 25L
  // Max coverage: 40x income, capped at 100Cr, min 25L, intervals of 25L
  const incomeMax = Math.max(minCoverage, (annualIncome || 0) * 40);
  const maxCoverage = Math.min(1000000000, Math.floor(incomeMax / 2500000) * 2500000);
  const coverageStep = 2500000;

  const minTerm = 10;
  const maxTerm = Math.min(60 - age, 40);

  const [coverage, setCoverage] = useState(() => Math.min(maxCoverage, Math.max(minCoverage, 10000000)));
  const [term, setTerm] = useState(Math.min(60 - age, 30));
  const [showFlexiDetails, setShowFlexiDetails] = useState(false);

  const formatCoverage = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(0)}L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  const getProgress = (value: number, min: number, max: number) => {
    return ((value - min) / (max - min)) * 100;
  };

  const handleContinue = () => {
    useLifeJourneyStore.setState({
      selectedCoverage: coverage,
      selectedTerm: term,
      recommendedCoverage: coverage,
    });
    onContinue();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md"
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-xl shadow-purple-900/20">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-4">
          <p className="text-white/80 text-caption uppercase tracking-wider">Select your plan</p>
          <p className="text-white text-lg font-bold mt-1">Choose coverage & term</p>
        </div>

        <div className="px-5 py-5 space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-body-sm text-gray-500">Coverage Amount</span>
              <span className="text-label-md font-bold text-gray-900">{formatCoverage(coverage)}</span>
            </div>
            <div className="relative h-6 flex items-center">
              <input
                type="range"
                min={minCoverage}
                max={maxCoverage}
                step={coverageStep}
                value={coverage}
                onChange={(e) => setCoverage(Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #9333ea ${getProgress(coverage, minCoverage, maxCoverage)}%, #e5e7eb ${getProgress(coverage, minCoverage, maxCoverage)}%)`
                }}
                className="absolute w-full h-1.5 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
                  [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-pointer"
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">{formatCoverage(minCoverage)}</span>
              <span className="text-[10px] text-gray-400">{formatCoverage(maxCoverage)}</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-body-sm text-gray-500">Policy Term</span>
              <span className="text-label-md font-bold text-gray-900">{term} years <span className="font-normal text-gray-400">(till age {age + term})</span></span>
            </div>
            <div className="relative h-6 flex items-center">
              <input
                type="range"
                min={minTerm}
                max={maxTerm}
                step={1}
                value={term}
                onChange={(e) => setTerm(Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #9333ea ${getProgress(term, minTerm, maxTerm)}%, #e5e7eb ${getProgress(term, minTerm, maxTerm)}%)`
                }}
                className="absolute w-full h-1.5 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
                  [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-pointer"
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">{minTerm} yrs</span>
              <span className="text-[10px] text-gray-400">{maxTerm} yrs</span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-2">
          <div className="bg-purple-50 rounded-xl overflow-hidden border border-purple-100 transition-all duration-300">
            <button 
              onClick={() => setShowFlexiDetails(!showFlexiDetails)}
              className="w-full text-left p-3.5 flex gap-3"
            >
              <div className="mt-0.5 flex-shrink-0">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={LIFE_ICON_PATHS.flexi} />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-label-sm font-bold text-purple-900">ACKO Flexi Benefit included</p>
                  <svg 
                    className={`w-4 h-4 text-purple-500 transition-transform duration-200 ${showFlexiDetails ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <p className="text-caption text-purple-700 mt-0.5 leading-snug">
                  You can increase or decrease your coverage anytime later.
                </p>
              </div>
            </button>
            
            <AnimatePresence>
              {showFlexiDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-3.5 pb-3.5 pt-0"
                >
                  <div className="h-px bg-purple-200/50 mb-3" />
                  <p className="text-caption font-semibold text-purple-900 mb-2">Why Flexi matters:</p>
                  <ul className="space-y-1.5">
                    {[
                      'Your income grows over time',
                      'Your loans change',
                      'Your family size changes'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-caption text-purple-800">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-purple-500 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={handleContinue}
            className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform shadow-lg shadow-purple-600/30"
          >
            Get my quote
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Payment Screen — Plan summary + Pay CTA
   ═══════════════════════════════════════════════════════ */

export function LifePaymentScreen({ onContinue }: { onContinue: () => void }) {
  const state = useLifeJourneyStore.getState() as LifeJourneyState;
  const [stage, setStage] = useState<'ready' | 'processing' | 'success'>('ready');

  const formatAmt = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  const yearlyPremium = state.quote?.yearlyPremium || 0;
  const monthlyPremium = state.quote?.monthlyPremium || 0;

  const handlePay = () => {
    setStage('processing');
    setTimeout(() => {
      setStage('success');
      setTimeout(() => onContinue(), 2200);
    }, 2000);
  };

  if (stage === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="max-w-md"
      >
        <div className="rounded-2xl overflow-hidden border border-white/10 backdrop-blur-sm bg-gradient-to-br from-white/10 to-white/5 py-10 px-6">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.15 }}
              className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-400/40 flex items-center justify-center mb-5"
            >
              <motion.svg
                className="w-10 h-10 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />
              </motion.svg>
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl font-bold text-white mb-1"
            >
              Payment Successful!
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="text-white/50 text-sm"
            >
              {formatAmt(state.selectedCoverage)} coverage secured
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-5 flex items-center gap-2 text-white/40 text-xs"
            >
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
              </svg>
              Setting up your next steps...
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md"
    >
      <div className="rounded-2xl overflow-hidden border border-white/10 backdrop-blur-sm bg-gradient-to-br from-white/10 to-white/5">
        <div className="bg-gradient-to-r from-purple-600/80 to-indigo-700/80 px-5 py-5">
          <p className="text-white/60 text-caption uppercase tracking-wider">Your Coverage</p>
          <p className="text-white text-2xl font-bold mt-1">{formatAmt(state.selectedCoverage)}</p>
          <p className="text-white/50 text-caption mt-1">{state.selectedTerm} years &middot; till age {state.age + state.selectedTerm}</p>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-white/8">
            <span className="text-body-sm text-white/50">Annual Premium</span>
            <span className="text-label-md font-bold text-white">₹{yearlyPremium.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/8">
            <span className="text-body-sm text-white/50">Monthly</span>
            <span className="text-label-md text-white/80">₹{monthlyPremium.toLocaleString('en-IN')}/mo</span>
          </div>
          {state.selectedRiders.length > 0 && (
            <div className="flex justify-between items-center py-2">
              <span className="text-body-sm text-white/50">Riders</span>
              <span className="text-body-sm text-white/70">{state.selectedRiders.map(r => r.name).join(', ')}</span>
            </div>
          )}
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={handlePay}
            disabled={stage === 'processing'}
            className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform shadow-lg shadow-purple-600/30 hover:bg-purple-500 disabled:opacity-70"
          >
            {stage === 'processing' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" /></svg>
                Processing...
              </span>
            ) : (
              `Pay ₹${yearlyPremium.toLocaleString('en-IN')}`
            )}
          </button>
          <p className="text-[11px] text-white/30 text-center mt-2">
            Secure payment &middot; 100% refund if not approved
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   e-KYC — HyperVerge Redirection Flow
   Steps: start → loading → completed
   ═══════════════════════════════════════════════════════ */

export function LifeEkycRedirection({ onComplete, onSkip }: { onComplete: () => void; onSkip?: () => void }) {
  const lw = useT().lifeWidgets;
  const [stage, setStage] = useState<'start' | 'loading' | 'completed'>('start');

  const handleStart = () => {
    setStage('loading');
  };

  const handleCompleted = () => {
    setStage('completed');
    setTimeout(() => onComplete(), 1200);
  };

  if (stage === 'completed') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md"
      >
        <div className="rounded-2xl overflow-hidden border border-white/10 backdrop-blur-sm bg-gradient-to-br from-white/10 to-white/5 py-10 px-6">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.15 }}
              className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-400/40 flex items-center justify-center mb-5"
            >
              <motion.svg
                className="w-10 h-10 text-green-400"
                fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}
              >
                <motion.path
                  strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />
              </motion.svg>
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl font-bold text-white mb-1"
            >
              KYC Verified!
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="text-white/50 text-sm"
            >
              Proceeding to next step...
            </motion.p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md"
    >
      <div className="rounded-2xl overflow-hidden border border-white/10 backdrop-blur-sm bg-gradient-to-br from-white/10 to-white/5">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Complete KYC</h3>
            <p className="text-xs text-white/50 mt-1 leading-relaxed max-w-[260px]">
              HyperVerge, our reliable partner, will handle the KYC process for you with 100% security
            </p>
          </div>
          {onSkip && stage === 'start' && (
            <button
              onClick={onSkip}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 hover:bg-white/20 transition-colors"
            >
              <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 pb-5">
          <AnimatePresence mode="wait">
            {stage === 'start' && (
              <motion.div
                key="steps"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3 mb-5"
              >
                {[
                  { title: lw.kycStep1Title, sub: lw.kycStep1Sub },
                  { title: lw.kycStep2Title, sub: lw.kycStep2Sub },
                  { title: lw.kycStep3Title, sub: lw.kycStep3Sub },
                ].map((step, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl border border-white/10 bg-white/5"
                  >
                    <div className="w-7 h-7 rounded-full bg-purple-500/30 flex items-center justify-center shrink-0 text-xs font-bold text-purple-300">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{step.title}</p>
                      <p className="text-xs text-white/40 mt-0.5">{step.sub}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {stage === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-5"
              >
                <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-white/10 bg-white/5">
                  <svg className="w-8 h-8 text-purple-400 animate-spin mb-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                  </svg>
                  <p className="text-sm text-white/50">Loading KYC verification...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {stage === 'start' && (
            <p className="text-center text-xs text-white/30 mb-4">Powered by HyperVerge</p>
          )}

          <button
            onClick={stage === 'start' ? handleStart : handleCompleted}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white active:scale-[0.97] transition-transform shadow-lg shadow-purple-600/30"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' }}
          >
            {stage === 'start' ? lw.startKyc : lw.completedKyc}
          </button>

          {stage === 'start' && onSkip && (
            <button
              onClick={onSkip}
              className="w-full py-2.5 mt-2 text-sm font-medium text-purple-300 hover:text-purple-200 transition-colors"
            >
              I&apos;ll do this later
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   VMER Call — Video Medical Exam Redirection Flow
   join instantly or schedule, then redirect to video call
   ═══════════════════════════════════════════════════════ */

type VmerStage = 'start' | 'connecting' | 'schedule' | 'scheduled' | 'completed';

const VMER_LANGUAGES = ['English', 'Hindi', 'Hinglish', 'Kannada', 'Tamil', 'Malayalam'];

function getUpcomingDates(count: number) {
  const dates: { day: string; date: number; month: string; full: string }[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const today = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      day: dayNames[d.getDay()],
      date: d.getDate(),
      month: monthNames[d.getMonth()],
      full: `${d.getDate()} ${monthNames[d.getMonth()]}`,
    });
  }
  return dates;
}

const VMER_TIME_SLOTS = ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM', '6:00 PM'];

export function LifeVmerRedirection({ onComplete }: { onComplete: () => void }) {
  const lw = useT().lifeWidgets;
  const [stage, setStage] = useState<VmerStage>('start');
  const [selectedLang, setSelectedLang] = useState('English');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const upcomingDates = getUpcomingDates(5);

  const handleJoinCall = () => {
    setStage('connecting');
  };

  const handleSchedule = () => {
    setStage('schedule');
  };

  const handleConfirmSchedule = () => {
    if (!selectedDate || !selectedTime) return;
    setStage('scheduled');
  };

  const handleReschedule = () => {
    setStage('schedule');
  };

  const handleCompleted = () => {
    setStage('completed');
    setTimeout(() => onComplete(), 1200);
  };

  if (stage === 'completed') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md"
      >
        <div className="rounded-2xl overflow-hidden border border-white/10 backdrop-blur-sm bg-gradient-to-br from-white/10 to-white/5 py-10 px-6">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.15 }}
              className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-400/40 flex items-center justify-center mb-5"
            >
              <motion.svg
                className="w-10 h-10 text-green-400"
                fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}
              >
                <motion.path
                  strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />
              </motion.svg>
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl font-bold text-white mb-1"
            >
              VMER Completed!
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="text-white/50 text-sm"
            >
              Proceeding to next step...
            </motion.p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (stage === 'scheduled') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md"
      >
        <div className="rounded-2xl overflow-hidden border border-white/10 backdrop-blur-sm bg-gradient-to-br from-white/10 to-white/5">
          <div className="px-6 pt-8 pb-2 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/20 border-2 border-green-400/40 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Call Scheduled</h3>
            <p className="text-sm text-white/50">{selectedDate} at {selectedTime}</p>
          </div>

          <div className="px-6 pb-5">
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/10 bg-white/5 mt-4 mb-5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Language: {selectedLang}</p>
                <p className="text-xs text-white/40 mt-0.5">You&apos;ll receive a reminder before the call</p>
              </div>
            </div>

            <button
              onClick={handleJoinCall}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white active:scale-[0.97] transition-transform shadow-lg shadow-purple-600/30"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' }}
            >
              Join Call
            </button>

            <button
              onClick={handleReschedule}
              className="w-full py-2.5 mt-2 text-sm font-medium text-purple-300 hover:text-purple-200 transition-colors"
            >
              Reschedule
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (stage === 'schedule') {
    const canConfirm = selectedDate && selectedTime;
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md"
      >
        <div className="rounded-2xl overflow-hidden border border-white/10 backdrop-blur-sm bg-gradient-to-br from-white/10 to-white/5">
          <div className="px-6 pt-6 pb-4">
            <h3 className="text-lg font-bold text-white">Schedule VMER Call</h3>
            <p className="text-xs text-white/50 mt-1">Pick a language, date, and time</p>
          </div>

          <div className="px-6 pb-5 space-y-5">
            {/* Language */}
            <div>
              <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2.5">Language Preference</p>
              <div className="flex flex-wrap gap-2">
                {VMER_LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLang(lang)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedLang === lang
                        ? 'bg-purple-500 text-white border border-purple-400'
                        : 'bg-white/5 border border-white/15 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2.5">Pick a Date</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {upcomingDates.map(d => (
                  <button
                    key={d.full}
                    onClick={() => setSelectedDate(d.full)}
                    className={`flex flex-col items-center px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all shrink-0 min-w-[60px] ${
                      selectedDate === d.full
                        ? 'bg-purple-500 text-white border border-purple-400'
                        : 'bg-white/5 border border-white/15 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-[10px] opacity-60">{d.day}</span>
                    <span className="text-sm font-bold mt-0.5">{d.date} {d.month}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time */}
            <div>
              <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2.5">Pick a Time</p>
              <div className="flex flex-wrap gap-2">
                {VMER_TIME_SLOTS.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      selectedTime === time
                        ? 'bg-purple-500 text-white border border-purple-400'
                        : 'bg-white/5 border border-white/15 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={!canConfirm}
              onClick={handleConfirmSchedule}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white active:scale-[0.97] transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: canConfirm ? 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' : 'rgba(124,58,237,0.3)' }}
            >
              Confirm schedule
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md"
    >
      <div className="rounded-2xl overflow-hidden border border-white/10 backdrop-blur-sm bg-gradient-to-br from-white/10 to-white/5">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h3 className="text-lg font-bold text-white">Video Medical Exam</h3>
          <p className="text-xs text-white/50 mt-1 leading-relaxed max-w-[280px]">
            Connect with a doctor for your medical examination via video call
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pb-5">
          <AnimatePresence mode="wait">
            {stage === 'start' && (
              <motion.div
                key="options"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3 mb-5"
              >
                {[
                  {
                    icon: (
                      <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    ),
                    title: lw.vmerInstantTitle,
                    sub: lw.vmerInstantSub,
                  },
                  {
                    icon: (
                      <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                    ),
                    title: lw.vmerScheduleOptionTitle,
                    sub: lw.vmerScheduleOptionSub,
                  },
                ].map((opt, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl border border-white/10 bg-white/5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                      {opt.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{opt.title}</p>
                      <p className="text-xs text-white/40 mt-0.5">{opt.sub}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {stage === 'connecting' && (
              <motion.div
                key="connecting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-5"
              >
                <p className="text-xs text-white/50 mb-3">Connecting you with a doctor</p>
                <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-white/10 bg-white/5">
                  <svg className="w-8 h-8 text-purple-400 animate-spin mb-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                  </svg>
                  <p className="text-sm text-white/50">Connecting to video call...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {stage === 'start' && (
            <p className="text-center text-xs text-white/30 mb-4">Powered by Video Platform</p>
          )}

          {stage === 'start' && (
            <>
              <button
                onClick={handleJoinCall}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-white active:scale-[0.97] transition-transform shadow-lg shadow-purple-600/30"
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' }}
              >
                Join Call
              </button>
              <button
                onClick={handleSchedule}
                className="w-full py-2.5 mt-2 text-sm font-medium text-purple-300 hover:text-purple-200 transition-colors"
              >
                Schedule for later
              </button>
            </>
          )}

          {stage === 'connecting' && (
            <button
              onClick={handleCompleted}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white active:scale-[0.97] transition-transform shadow-lg shadow-purple-600/30"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' }}
            >
              I&apos;ve Completed
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   e-KYC Screen — Full Aadhaar OTP verification flow
   (Legacy — kept for standalone /ekyc route)
   ═══════════════════════════════════════════════════════ */

type EkycStage =
  | 'start'
  | 'aadhaar'
  | 'sending'
  | 'otp'
  | 'verifying'
  | 'success'
  | 'error_wrong_otp'
  | 'error_expired'
  | 'error_locked'
  | 'error_not_linked'
  | 'error_service_down'
  | 'alt_digilocker'
  | 'alt_video_kyc'
  | 'alt_upload';

const MAX_OTP_ATTEMPTS = 3;
const MAX_RESENDS = 2;
const OTP_TIMER_SECONDS = 60;
// In prototype mode, OTP "123456" succeeds. Any other 6-digit OTP simulates failure.
const DEMO_OTP = '123456';

function EkycOtpBoxes({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  hasError: boolean;
}) {
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  useEffect(() => {
    refs[0].current?.focus();
  }, []);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      refs[i - 1].current?.focus();
    }
  };

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const arr = value.split('').concat(Array(6).fill('')).slice(0, 6);
    arr[i] = digit;
    const next = arr.join('');
    onChange(next);
    if (digit && i < 5) {
      refs[i + 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    const focusIdx = Math.min(pasted.length, 5);
    refs[focusIdx].current?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          className={`w-10 h-12 rounded-xl border text-center text-lg font-bold text-gray-900 focus:outline-none transition-colors
            ${hasError
              ? 'border-red-400 bg-red-50 text-red-700'
              : value[i]
                ? 'border-purple-400 bg-purple-50'
                : 'border-gray-200 bg-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30'
            }`}
        />
      ))}
    </div>
  );
}

function EkycTimer({
  seconds,
  onExpire,
}: {
  seconds: number;
  onExpire: () => void;
}) {
  const lw = useT().lifeWidgets;
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onExpire();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onExpire]);

  const pct = (remaining / seconds) * 100;

  return (
    <div className="flex items-center gap-2 justify-center">
      <div className="relative w-8 h-8">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="13" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle
            cx="16" cy="16" r="13" fill="none"
            stroke={remaining <= 10 ? '#ef4444' : '#9333ea'}
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 13}`}
            strokeDashoffset={`${2 * Math.PI * 13 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${remaining <= 10 ? 'text-red-500' : 'text-gray-700'}`}>
          {remaining}
        </span>
      </div>
      <span className="text-caption text-gray-500">
        {remaining > 0 ? lw.otpExpires(remaining) : lw.otpExpired}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Inline e-KYC Widgets (conversational, dark/glass theme)
   ═══════════════════════════════════════════════════════ */

export function EkycAadhaarInput({ onSubmit }: { onSubmit: (aadhaar: string) => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const formatAadhaar = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const validateAadhaar = (val: string): string => {
    const digits = val.replace(/\s/g, '');
    if (digits.length < 12) return 'Please enter a valid 12-digit Aadhaar number';
    if (/^0/.test(digits)) return 'Aadhaar number cannot start with 0';
    if (/^1/.test(digits)) return 'Aadhaar number cannot start with 1';
    return '';
  };

  const handleSubmit = () => {
    const err = validateAadhaar(value);
    if (err) {
      setError(err);
      return;
    }
    onSubmit(value.replace(/\s/g, ''));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm space-y-3">
      <input
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const formatted = formatAadhaar(e.target.value);
          setValue(formatted);
          setError('');
        }}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="1234 5678 9012"
        className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-body-md text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400 focus:bg-white/15 transition-colors backdrop-blur-sm"
        autoFocus
      />
      <div className="flex items-start gap-2 bg-white/5 rounded-xl px-3 py-2.5 border border-white/10">
        <svg className="w-4 h-4 text-purple-300 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <p className="text-caption text-white/60 leading-relaxed">
          Your Aadhaar details are encrypted and securely verified via UIDAI. We never store your Aadhaar number.
        </p>
      </div>
      {error && <p className="text-caption text-red-400">{error}</p>}
      <button
        onClick={handleSubmit}
        className="w-full py-3 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-label-lg font-semibold transition-all active:scale-[0.97]"
      >
        Send OTP
      </button>
    </motion.div>
  );
}

export function EkycOtpInput({ maskedMobile, onSubmit, onResend }: { maskedMobile: string; onSubmit: (otp: string) => void; onResend: () => void }) {
  const lw = useT().lifeWidgets;
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  useEffect(() => {
    refs[0].current?.focus();
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      refs[i - 1].current?.focus();
    }
  };

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const arr = otp.split('').concat(Array(6).fill('')).slice(0, 6);
    arr[i] = digit;
    const next = arr.join('');
    setOtp(next);
    setError('');
    if (digit && i < 5) {
      refs[i + 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setOtp(pasted.padEnd(6, '').slice(0, 6));
    const focusIdx = Math.min(pasted.length, 5);
    refs[focusIdx].current?.focus();
  };

  const handleSubmit = () => {
    if (otp.length < 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    onSubmit(otp);
  };

  const handleResendClick = () => {
    setOtp('');
    setError('');
    setTimer(60);
    refs[0].current?.focus();
    onResend();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm space-y-4">
      <div className="flex gap-2 justify-center">
        {Array.from({ length: 6 }).map((_, i) => (
          <input
            key={i}
            ref={refs[i]}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={otp[i] || ''}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            onPaste={handlePaste}
            className={`w-10 h-12 rounded-xl border text-center text-lg font-bold transition-colors backdrop-blur-sm
              ${error
                ? 'border-red-400 bg-red-500/20 text-red-300'
                : otp[i]
                  ? 'border-purple-400 bg-purple-500/20 text-white'
                  : 'border-white/20 bg-white/10 text-white focus:border-purple-400 focus:bg-white/15 focus:outline-none'
              }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 text-caption text-white/60">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{lw.otpSentTo(maskedMobile)}</span>
        {timer > 0 && <span className="text-purple-300">· {timer}s</span>}
      </div>

      {error && <p className="text-caption text-red-400 text-center">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={otp.length < 6}
        className="w-full py-3 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-label-lg font-semibold transition-all active:scale-[0.97] disabled:opacity-40"
      >
        Verify OTP
      </button>

      {timer === 0 && (
        <button
          onClick={handleResendClick}
          className="w-full py-2.5 bg-white/10 border border-white/20 text-white rounded-xl text-label-sm font-medium hover:bg-white/15 transition-all active:scale-[0.97]"
        >
          Resend OTP
        </button>
      )}
    </motion.div>
  );
}

export function EkycAlternativeOptions({ onSelect }: { onSelect: (method: string) => void }) {
  const lw = useT().lifeWidgets;
  const options = [
    {
      id: 'digilocker',
      icon: '🔐',
      label: lw.digilockerLabel,
      desc: lw.digilockerDesc,
    },
    {
      id: 'video_kyc',
      icon: '📹',
      label: lw.videoKycLabel,
      desc: '5-min video call with our team',
    },
    {
      id: 'upload',
      icon: '📄',
      label: lw.uploadDocsLabel,
      desc: 'PAN + Aadhaar + selfie',
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md space-y-2.5">
      {options.map((opt, i) => (
        <motion.button
          key={opt.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelect(opt.id)}
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-white/6 border border-white/10 hover:bg-white/12 hover:border-white/20 rounded-xl transition-all active:scale-[0.97] text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">
            {opt.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body-md font-semibold text-white">{opt.label}</p>
            <p className="text-caption text-white/60">{opt.desc}</p>
          </div>
          <svg className="w-4 h-4 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </motion.button>
      ))}
    </motion.div>
  );
}

// Legacy full-screen component (deprecated - use inline widgets above)
export function LifeEkycScreen({ onContinue }: { onContinue: () => void }) {
  const [stage, setStage] = useState<EkycStage>('start');
  const [aadhaar, setAadhaar] = useState('');
  const [aadhaarError, setAadhaarError] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [resends, setResends] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const [otpExpired, setOtpExpired] = useState(false);

  const maskedAadhaar = aadhaar.length >= 8
    ? `XXXX XXXX ${aadhaar.slice(8, 12)}`
    : '——';

  const formatAadhaar = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const validateAadhaar = (val: string): string => {
    const digits = val.replace(/\s/g, '');
    if (digits.length < 12) return 'Please enter a valid 12-digit Aadhaar number';
    if (/^0/.test(digits)) return 'Aadhaar number cannot start with 0';
    if (/^1/.test(digits)) return 'Aadhaar number cannot start with 1';
    return '';
  };

  const handleSendOtp = () => {
    const err = validateAadhaar(aadhaar);
    if (err) { setAadhaarError(err); return; }
    setAadhaarError('');
    setStage('sending');
    setTimeout(() => {
      setOtp('');
      setOtpError('');
      setOtpExpired(false);
      setTimerKey((k) => k + 1);
      setStage('otp');
    }, 1800);
  };

  const handleVerifyOtp = () => {
    if (otp.replace(/\s/g, '').length < 6) {
      setOtpError('Please enter the complete 6-digit OTP');
      return;
    }
    setStage('verifying');
    setTimeout(() => {
      if (otp === DEMO_OTP) {
        setStage('success');
        setTimeout(() => onContinue(), 1800);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= MAX_OTP_ATTEMPTS) {
          setStage('error_locked');
        } else {
          setOtp('');
          setOtpError(`Incorrect OTP. ${MAX_OTP_ATTEMPTS - newAttempts} attempt${MAX_OTP_ATTEMPTS - newAttempts > 1 ? 's' : ''} remaining.`);
          setStage('otp');
        }
      }
    }, 2000);
  };

  const handleResend = () => {
    if (resends >= MAX_RESENDS) {
      setStage('error_not_linked');
      return;
    }
    setResends((r) => r + 1);
    setOtp('');
    setOtpError('');
    setOtpExpired(false);
    setStage('sending');
    setTimeout(() => {
      setTimerKey((k) => k + 1);
      setStage('otp');
    }, 1500);
  };

  const handleOtpExpired = useCallback(() => {
    setOtpExpired(true);
  }, []);

  const altOptions = [
    {
      id: 'alt_digilocker',
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
        </svg>
      ),
      label: 'Verify via DigiLocker',
      desc: 'Instant verification using your DigiLocker Aadhaar',
    },
    {
      id: 'alt_video_kyc',
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
        </svg>
      ),
      label: 'Video KYC with an agent',
      desc: '5-min video call with our KYC team',
    },
    {
      id: 'alt_upload',
      icon: (
        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      ),
      label: 'Upload documents',
      desc: 'PAN card + selfie — reviewed in 2 hours',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md"
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-xl shadow-purple-900/20">

        {/* ── Header ── */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-label-md font-bold text-gray-900">e-KYC Verification</h3>
              <p className="text-caption text-gray-400 truncate">
                {stage === 'start' && 'Aadhaar-based identity verification'}
                {stage === 'aadhaar' && 'Step 1 of 2 — Enter Aadhaar'}
                {stage === 'sending' && 'Sending OTP…'}
                {stage === 'otp' && `Step 2 of 2 — Verify OTP${resends > 0 ? ` (resent ${resends}×)` : ''}`}
                {stage === 'verifying' && 'Verifying with UIDAI…'}
                {stage === 'success' && 'Identity verified ✓'}
                {(stage === 'error_wrong_otp' || stage === 'error_expired' || stage === 'error_locked' || stage === 'error_not_linked' || stage === 'error_service_down') && 'Verification issue'}
                {(stage === 'alt_digilocker' || stage === 'alt_video_kyc' || stage === 'alt_upload') && 'Alternative KYC'}
              </p>
            </div>

            {/* Step progress pills */}
            {(stage === 'aadhaar' || stage === 'otp' || stage === 'verifying') && (
              <div className="ml-auto flex gap-1 flex-shrink-0">
                {[1, 2].map((s) => {
                  const active = s === 1 ? stage === 'aadhaar' : stage === 'otp' || stage === 'verifying';
                  const done = s === 1 && (stage === 'otp' || stage === 'verifying');
                  return (
                    <div
                      key={s}
                      className={`h-1.5 w-6 rounded-full transition-colors ${done ? 'bg-emerald-400' : active ? 'bg-purple-600' : 'bg-gray-200'}`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="px-5 py-5"
          >

            {/* START */}
            {stage === 'start' && (
              <div className="space-y-5">
                <div className="space-y-3">
                  {[
                    { n: 1, text: 'Enter your 12-digit Aadhaar number' },
                    { n: 2, text: 'OTP sent to your Aadhaar-linked mobile' },
                    { n: 3, text: 'Verified instantly — takes under 2 minutes' },
                  ].map(({ n, text }) => (
                    <div key={n} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0">{n}</div>
                      <span className="text-body-sm text-gray-700">{text}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-start gap-2 bg-gray-50 rounded-xl px-3.5 py-3 border border-gray-100">
                  <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Your Aadhaar data is encrypted and transmitted securely to UIDAI. ACKO does not store your Aadhaar number.
                  </p>
                </div>

                <button
                  onClick={() => setStage('aadhaar')}
                  className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform shadow-lg shadow-purple-600/20"
                >
                  Start e-KYC
                </button>
              </div>
            )}

            {/* AADHAAR INPUT */}
            {stage === 'aadhaar' && (
              <div className="space-y-4">
                <div>
                  <label className="text-caption font-semibold text-gray-500 uppercase tracking-wide block mb-2">Aadhaar Number</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={aadhaar}
                    onChange={(e) => {
                      setAadhaar(formatAadhaar(e.target.value));
                      setAadhaarError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                    placeholder="XXXX XXXX XXXX"
                    maxLength={14}
                    autoFocus
                    className={`w-full px-4 py-3.5 rounded-xl border text-lg font-semibold tracking-[0.25em] text-gray-900 focus:outline-none transition-colors
                      ${aadhaarError ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30'}`}
                  />
                  <AnimatePresence>
                    {aadhaarError && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-500 text-caption mt-1.5 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        {aadhaarError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <p className="text-[11px] text-gray-400 mt-2">Make sure your mobile number is linked to this Aadhaar</p>
                </div>

                <button
                  onClick={handleSendOtp}
                  className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform disabled:opacity-40"
                  disabled={aadhaar.replace(/\s/g, '').length < 12}
                >
                  Send OTP
                </button>

                <button onClick={() => setStage('start')} className="w-full text-center text-caption text-gray-400 hover:text-gray-600 transition-colors py-1">
                  ← Back
                </button>
              </div>
            )}

            {/* SENDING OTP */}
            {stage === 'sending' && (
              <div className="flex flex-col items-center py-6 gap-3">
                <svg className="w-8 h-8 text-purple-500 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                </svg>
                <p className="text-body-sm text-gray-600">Sending OTP to Aadhaar-linked mobile…</p>
                <p className="text-caption text-gray-400">Powered by UIDAI</p>
              </div>
            )}

            {/* OTP ENTRY */}
            {stage === 'otp' && (
              <div className="space-y-5">
                <div className="text-center">
                  <p className="text-body-sm text-gray-700 mb-0.5">OTP sent to your mobile linked with</p>
                  <p className="text-label-md font-bold text-gray-900">{maskedAadhaar}</p>
                </div>

                <EkycOtpBoxes value={otp} onChange={setOtp} hasError={!!otpError} />

                <AnimatePresence>
                  {otpError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5"
                    >
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      <p className="text-caption text-red-700">{otpError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!otpExpired ? (
                  <EkycTimer key={timerKey} seconds={OTP_TIMER_SECONDS} onExpire={handleOtpExpired} />
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-2">
                    <p className="text-caption text-red-500 font-medium">OTP has expired</p>
                    <button
                      onClick={handleResend}
                      className="text-purple-600 text-body-sm font-semibold hover:text-purple-800 transition-colors"
                    >
                      {resends >= MAX_RESENDS ? 'Mobile not linked? Try alternatives' : `Resend OTP (${MAX_RESENDS - resends} left)`}
                    </button>
                  </motion.div>
                )}

                <button
                  onClick={handleVerifyOtp}
                  disabled={otp.replace(/\s/g, '').length < 6 || otpExpired}
                  className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform disabled:opacity-40"
                >
                  Verify OTP
                </button>

                <div className="flex items-center justify-between text-caption">
                  {!otpExpired && (
                    <button
                      onClick={handleResend}
                      disabled={resends >= MAX_RESENDS}
                      className="text-purple-500 hover:text-purple-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {resends >= MAX_RESENDS ? `Max resends reached` : `Resend OTP`}
                    </button>
                  )}
                  <button
                    onClick={() => { setStage('aadhaar'); setOtp(''); setOtpError(''); }}
                    className="text-gray-400 hover:text-gray-600 transition-colors ml-auto"
                  >
                    Wrong Aadhaar?
                  </button>
                </div>

                <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5">
                  <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                  <p className="text-[11px] text-amber-700">Demo: Enter <span className="font-bold">123456</span> to simulate successful verification</p>
                </div>
              </div>
            )}

            {/* VERIFYING */}
            {stage === 'verifying' && (
              <div className="flex flex-col items-center py-8 gap-4">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 text-purple-200 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="40 22" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-label-md font-semibold text-gray-900">Verifying identity</p>
                  <p className="text-caption text-gray-400 mt-1">Contacting UIDAI servers…</p>
                </div>
              </div>
            )}

            {/* SUCCESS */}
            {stage === 'success' && (
              <div className="flex flex-col items-center py-6 gap-3">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center shadow-lg shadow-emerald-200">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center">
                  <p className="text-label-lg font-bold text-gray-900">Identity Verified</p>
                  <p className="text-caption text-gray-400 mt-1">e-KYC completed successfully</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <svg className="w-8 h-8 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                  </svg>
                  <div>
                    <p className="text-label-sm font-bold text-emerald-800">Aadhaar KYC Complete</p>
                    <p className="text-caption text-emerald-600">Linked to {maskedAadhaar}</p>
                  </div>
                </motion.div>
                <p className="text-caption text-gray-400">Proceeding to next step…</p>
              </div>
            )}

            {/* ERROR: LOCKED (max attempts) */}
            {stage === 'error_locked' && (
              <div className="space-y-4">
                <div className="flex flex-col items-center py-2 gap-3">
                  <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-label-md font-bold text-gray-900">OTP verification locked</p>
                    <p className="text-caption text-gray-500 mt-1">Too many incorrect attempts. Try an alternative method below.</p>
                  </div>
                </div>
                <p className="text-caption text-gray-500 font-semibold uppercase tracking-wide">Alternative KYC options</p>
                {altOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setStage(opt.id as EkycStage)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">{opt.icon}</div>
                    <div>
                      <p className="text-label-sm font-semibold text-gray-900">{opt.label}</p>
                      <p className="text-caption text-gray-400">{opt.desc}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                  </button>
                ))}
                <button onClick={() => { setAttempts(0); setStage('aadhaar'); setOtp(''); setOtpError(''); }} className="w-full text-center text-caption text-gray-400 hover:text-gray-600 py-1">
                  Try a different Aadhaar number
                </button>
              </div>
            )}

            {/* ERROR: MOBILE NOT LINKED */}
            {stage === 'error_not_linked' && (
              <div className="space-y-4">
                <div className="flex flex-col items-center py-2 gap-3">
                  <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-label-md font-bold text-gray-900">Mobile not linked to Aadhaar?</p>
                    <p className="text-caption text-gray-500 mt-1 leading-relaxed">
                      OTP can only be sent to the mobile registered with Aadhaar. Choose an alternative to complete KYC.
                    </p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <p className="text-caption text-blue-700 leading-relaxed">
                    <span className="font-semibold">Link your mobile with Aadhaar:</span> Visit your nearest Aadhaar Seva Kendra or update online at <span className="font-medium">uidai.gov.in</span>
                  </p>
                </div>
                <p className="text-caption text-gray-500 font-semibold uppercase tracking-wide">Complete KYC now via</p>
                {altOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setStage(opt.id as EkycStage)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">{opt.icon}</div>
                    <div>
                      <p className="text-label-sm font-semibold text-gray-900">{opt.label}</p>
                      <p className="text-caption text-gray-400">{opt.desc}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                  </button>
                ))}
              </div>
            )}

            {/* ERROR: SERVICE DOWN */}
            {stage === 'error_service_down' && (
              <div className="space-y-4">
                <div className="flex flex-col items-center py-2 gap-3">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-label-md font-bold text-gray-900">UIDAI service is unavailable</p>
                    <p className="text-caption text-gray-500 mt-1">The Aadhaar verification service is temporarily down. Please try again in a few minutes.</p>
                  </div>
                </div>
                <button
                  onClick={() => { setOtp(''); setOtpError(''); setStage('aadhaar'); }}
                  className="w-full py-3 rounded-xl bg-purple-600 text-white text-label-md font-semibold active:scale-[0.97] transition-transform"
                >
                  Try again
                </button>
                <button
                  onClick={() => setStage('alt_upload')}
                  className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 text-label-md font-medium active:scale-[0.97] transition-transform"
                >
                  Use document upload instead
                </button>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3.5 py-3 border border-gray-100">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                  <p className="text-caption text-gray-500">We'll notify you by SMS when the service is restored.</p>
                </div>
              </div>
            )}

            {/* ALTERNATIVE: DIGILOCKER */}
            {stage === 'alt_digilocker' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3.5">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
                  </svg>
                  <div>
                    <p className="text-label-sm font-bold text-blue-900">DigiLocker KYC</p>
                    <p className="text-caption text-blue-700 mt-0.5">You'll be redirected to DigiLocker to securely share your Aadhaar details. No OTP needed.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {['Log in to your DigiLocker account', 'Authorise ACKO to access your Aadhaar', 'Verified instantly — no documents to upload'].map((s, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                      <span className="text-body-sm text-gray-600">{s}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { setStage('success'); setTimeout(() => onContinue(), 1800); }}
                  className="w-full py-3.5 rounded-xl bg-blue-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform"
                >
                  Open DigiLocker →
                </button>
                <button onClick={() => setStage('error_locked')} className="w-full text-center text-caption text-gray-400 hover:text-gray-600 py-1">← Back to options</button>
              </div>
            )}

            {/* ALTERNATIVE: VIDEO KYC */}
            {stage === 'alt_video_kyc' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3.5">
                  <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <div>
                    <p className="text-label-sm font-bold text-emerald-900">Video KYC</p>
                    <p className="text-caption text-emerald-700 mt-0.5">A 5-minute video call with our KYC agent. Keep your PAN card and Aadhaar card ready.</p>
                  </div>
                </div>
                <div className="space-y-2 text-body-sm text-gray-600">
                  {['Available Mon–Sat, 9 AM to 6 PM', 'Camera and microphone required', 'Keep original PAN and Aadhaar handy'].map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" /></svg>
                      {s}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { setStage('success'); setTimeout(() => onContinue(), 1800); }}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform"
                >
                  Schedule Video KYC
                </button>
                <button onClick={() => setStage('error_locked')} className="w-full text-center text-caption text-gray-400 hover:text-gray-600 py-1">← Back to options</button>
              </div>
            )}

            {/* ALTERNATIVE: DOCUMENT UPLOAD */}
            {stage === 'alt_upload' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3.5">
                  <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <div>
                    <p className="text-label-sm font-bold text-orange-900">Document Upload KYC</p>
                    <p className="text-caption text-orange-700 mt-0.5">Upload clear photos of your PAN card and a selfie. Our team reviews in 2 hours.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'PAN Card', desc: 'Front side, clear photo', icon: '🪪' },
                    { label: 'Selfie', desc: 'Face clearly visible, bright light', icon: '🤳' },
                  ].map((doc) => (
                    <div key={doc.label} className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-dashed border-gray-300 bg-gray-50">
                      <span className="text-xl">{doc.icon}</span>
                      <div className="flex-1">
                        <p className="text-label-sm font-semibold text-gray-800">{doc.label}</p>
                        <p className="text-caption text-gray-400">{doc.desc}</p>
                      </div>
                      <span className="text-caption text-purple-600 font-medium">Upload</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { setStage('success'); setTimeout(() => onContinue(), 1800); }}
                  className="w-full py-3.5 rounded-xl bg-orange-500 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform"
                >
                  Upload & Submit
                </button>
                <button onClick={() => setStage('error_locked')} className="w-full text-center text-caption text-gray-400 hover:text-gray-600 py-1">← Back</button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* ── Footer support bar ── */}
        {!['verifying', 'sending', 'success'].includes(stage) && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <button className="flex items-center gap-1.5 text-caption text-gray-400 hover:text-purple-600 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
              KYC Help
            </button>
            <button className="flex items-center gap-1.5 text-caption text-gray-400 hover:text-purple-600 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              1800 266 5433
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Medical Screen — Tele-medical & health tests scheduling
   ═══════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════
   Medical Screen — Full VMER flow per p2i_flow.md
   Stages: intro → availability → slot_picker → scheduled →
           call_active → post_call_review → under_review →
           ppmc_intro → ppmc_address → ppmc_slot → ppmc_confirmed →
           docs_required → docs_submitted → complete
   Edge cases: slot_conflict, ppmc_offline, partial doc upload
   ═══════════════════════════════════════════════════════ */

type MedStage =
  | 'intro'
  | 'availability_now'
  | 'availability_none'
  | 'slot_picker'
  | 'slot_conflict'
  | 'scheduled'
  | 'call_active'
  | 'post_call_review'
  | 'review_submitting'
  | 'under_review'
  | 'ppmc_intro'
  | 'ppmc_address'
  | 'ppmc_address_new'
  | 'ppmc_slot'
  | 'ppmc_confirmed'
  | 'ppmc_offline'
  | 'docs_required'
  | 'docs_confirm'
  | 'docs_submitted'
  | 'complete';

interface SlotSelection { dateLabel: string; dateIndex: number; time: string; }
interface AddressEntry { id: string; label: string; address: string; }

const SLOT_DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i);
  return {
    idx: i,
    day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
    date: d.getDate(),
    month: d.toLocaleDateString('en-IN', { month: 'short' }),
    full: d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
  };
});

const SLOT_TIMES = {
  Morning: ['9:00 AM', '10:00 AM', '11:00 AM'],
  Afternoon: ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
  Evening: ['5:00 PM', '6:00 PM', '7:00 PM'],
};

// Simulate unavailable slots
const UNAVAILABLE: Record<number, string[]> = { 0: ['9:00 AM', '10:00 AM', '12:00 PM'], 1: ['9:00 AM', '1:00 PM'], 2: ['11:00 AM'] };

// Slot conflict trigger: picking 9 AM on day 2 or later simulates conflict
const isConflictSlot = (dayIdx: number, time: string) => dayIdx >= 2 && time === '9:00 AM';

const SAVED_ADDRESSES: AddressEntry[] = [
  { id: 'home', label: 'Home', address: 'Flat 4B, Prestige Lakeside Habitat, Whitefield, Bangalore 560066' },
  { id: 'work', label: 'Work', address: 'ACKO Tower, 3rd Floor, Koramangala 5th Block, Bangalore 560095' },
];

const MEDICAL_CONDITIONS = ['Diabetes', 'Hypertension', 'Heart Disease', 'Asthma / COPD', 'Cancer (any type)', 'Kidney Disease', 'Liver Disease', 'Thyroid Disorder', 'None of the above'];

const CONDITION_DOCS: Record<string, string[]> = {
  Diabetes: ['Latest HbA1c report (within 3 months)', 'Recent blood sugar report', 'Prescription/treatment summary'],
  Hypertension: ['Latest BP readings log or report', 'ECG report (within 6 months)', 'Prescription/treatment summary'],
  'Heart Disease': ['Latest ECG & 2D Echo report', 'Cardiologist consultation notes', 'Angiography/stent reports (if any)'],
  'Asthma / COPD': ['Spirometry/PFT report', 'Prescription/treatment summary'],
  'Cancer (any type)': ['Histopathology/biopsy report', 'Oncologist consultation notes', 'Latest treatment status letter'],
  'Kidney Disease': ['Latest kidney function test (KFT)', 'Urine analysis report', 'Nephrologist consultation notes'],
  'Liver Disease': ['Latest LFT report', 'USG Abdomen report', 'Hepatologist consultation notes'],
  'Thyroid Disorder': ['Latest TSH/T3/T4 report', 'Prescription/treatment summary'],
};

function MedSlotPicker({
  title,
  onSelect,
  onBack,
}: {
  title: string;
  onSelect: (slot: SlotSelection) => void;
  onBack?: () => void;
}) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-4">
      <p className="text-body-sm font-semibold text-gray-700">{title}</p>

      {/* Day picker — horizontal scroll */}
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {SLOT_DAYS.map((d) => (
          <button
            key={d.idx}
            onClick={() => { setSelectedDay(d.idx); setSelectedTime(null); }}
            className={`flex-shrink-0 flex flex-col items-center px-3.5 py-2.5 rounded-xl border transition-all min-w-[52px]
              ${selectedDay === d.idx ? 'border-purple-500 bg-purple-600 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'}`}
          >
            <span className={`text-[10px] font-semibold uppercase tracking-wide ${selectedDay === d.idx ? 'text-purple-100' : 'text-gray-400'}`}>{d.day}</span>
            <span className="text-lg font-bold leading-tight">{d.date}</span>
            <span className={`text-[10px] ${selectedDay === d.idx ? 'text-purple-200' : 'text-gray-400'}`}>{d.month}</span>
          </button>
        ))}
      </div>

      {/* Time slots grouped by period */}
      <div className="space-y-3">
        {(Object.entries(SLOT_TIMES) as [string, string[]][]).map(([period, times]) => (
          <div key={period}>
            <p className="text-caption font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{period}</p>
            <div className="flex flex-wrap gap-2">
              {times.map((t) => {
                const unavailable = (UNAVAILABLE[selectedDay] || []).includes(t);
                const selected = selectedTime === t;
                return (
                  <button
                    key={t}
                    disabled={unavailable}
                    onClick={() => setSelectedTime(t)}
                    className={`px-3 py-2 rounded-xl border text-label-sm font-medium transition-all
                      ${unavailable ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                        : selected ? 'border-purple-500 bg-purple-600 text-white shadow-md shadow-purple-200'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50'}`}
                  >
                    {t}
                    {unavailable && <span className="ml-1 text-[9px] text-gray-300">Full</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        disabled={!selectedTime}
        onClick={() => {
          if (!selectedTime) return;
          onSelect({ dateLabel: SLOT_DAYS[selectedDay].full, dateIndex: selectedDay, time: selectedTime });
        }}
        className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold disabled:opacity-40 active:scale-[0.97] transition-transform"
      >
        Confirm Slot
      </button>
      {onBack && (
        <button onClick={onBack} className="w-full text-center text-caption text-gray-400 hover:text-gray-600 py-1">← Back</button>
      )}
    </div>
  );
}

function MedYesNo({ question, onAnswer }: { question: string; onAnswer: (yes: boolean) => void }) {
  const [val, setVal] = useState<boolean | null>(null);
  return (
    <div className="space-y-1.5">
      <p className="text-body-sm text-gray-800">{question}</p>
      <div className="flex gap-2">
        {[true, false].map((opt) => (
          <button
            key={String(opt)}
            onClick={() => { setVal(opt); setTimeout(() => onAnswer(opt), 150); }}
            className={`flex-1 py-2.5 rounded-xl border text-label-sm font-semibold transition-all active:scale-[0.97]
              ${val === opt ? opt ? 'border-purple-500 bg-purple-600 text-white' : 'border-gray-400 bg-gray-700 text-white' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
          >
            {opt ? 'Yes' : 'No'}
          </button>
        ))}
      </div>
    </div>
  );
}

export function LifeMedicalScreen({ onContinue }: { onContinue: () => void }) {
  const lw = useT().lifeWidgets;
  const [stage, setStage] = useState<MedStage>('intro');
  const [joinCountdown, setJoinCountdown] = useState(300); // 5 mins in seconds
  const [bookedSlot, setBookedSlot] = useState<SlotSelection | null>(null);
  const [ppBookedSlot, setPpBookedSlot] = useState<SlotSelection | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('home');
  const [newAddress, setNewAddress] = useState({ flat: '', area: '', pincode: '', city: '', state: '', saveAs: 'Other' });
  const [ppmc, setPpmc] = useState(false); // whether additional tests needed
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});
  const [confirmPartial, setConfirmPartial] = useState(false);
  const [bookingId] = useState(() => `ACKO-MED-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
  const [ppBookingId] = useState(() => `ACKO-HOME-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);

  // Health review form state
  const [tobacco, setTobacco] = useState<boolean | null>(null);
  const [alcohol, setAlcohol] = useState<boolean | null>(null);
  const [alcoholFreq, setAlcoholFreq] = useState('');
  const [alcoholUnits, setAlcoholUnits] = useState('');
  const [doctorAdvised, setDoctorAdvised] = useState<boolean | null>(null);
  const [doctorComment, setDoctorComment] = useState('');
  const [familyHistory, setFamilyHistory] = useState<boolean | null>(null);
  const [conditions, setConditions] = useState<string[]>([]);
  const [stdHiv, setStdHiv] = useState<boolean | null>(null);
  const [adventureSports, setAdventureSports] = useState<boolean | null>(null);
  const [adventureDetails, setAdventureDetails] = useState('');
  const [intlTravel, setIntlTravel] = useState<boolean | null>(null);
  const [intlDetails, setIntlDetails] = useState('');
  const [legalIssues, setLegalIssues] = useState<boolean | null>(null);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [reviewSection, setReviewSection] = useState<'health' | 'lifestyle' | 'misc'>('health');

  // Countdown for "doctor available now"
  useEffect(() => {
    if (stage !== 'availability_now') return;
    const t = setInterval(() => setJoinCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [stage]);

  const fmtCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleSlotSelect = (slot: SlotSelection, isForPpmc = false) => {
    if (!isForPpmc && isConflictSlot(slot.dateIndex, slot.time)) {
      setBookedSlot(slot);
      setStage('slot_conflict');
      return;
    }
    if (isForPpmc) { setPpBookedSlot(slot); setStage('ppmc_confirmed'); }
    else { setBookedSlot(slot); setStage('scheduled'); }
  };

  const isReviewComplete = () =>
    tobacco !== null && alcohol !== null && familyHistory !== null &&
    conditions.length > 0 && stdHiv !== null && adventureSports !== null &&
    intlTravel !== null && legalIssues !== null && reviewConfirmed;

  const flaggedConditions = conditions.filter(c => c !== 'None of the above' && CONDITION_DOCS[c]);
  const allDocsUploaded = flaggedConditions.length === 0 || flaggedConditions.every(c => uploadedDocs[c]);

  const HEADER_LABELS: Record<MedStage, { title: string; sub: string }> = {
    intro: { title: lw.vmerHeaderIntro, sub: lw.vmerHeaderIntroSub },
    availability_now: { title: lw.vmerHeaderAvailable, sub: lw.vmerHeaderAvailableSub },
    availability_none: { title: lw.vmerHeaderNone, sub: lw.vmerHeaderNoneSub },
    slot_picker: { title: lw.vmerHeaderSlotPicker, sub: lw.vmerHeaderSlotPickerSub },
    slot_conflict: { title: lw.vmerHeaderSlotConflict, sub: lw.vmerHeaderSlotConflictSub },
    scheduled: { title: 'Call Scheduled', sub: bookedSlot ? `${bookedSlot.dateLabel}, ${bookedSlot.time}` : '' },
    call_active: { title: lw.vmerHeaderCallActive, sub: lw.vmerHeaderCallActiveSub },
    post_call_review: { title: 'Review Your Answers', sub: `${reviewSection === 'health' ? 'Health' : reviewSection === 'lifestyle' ? 'Lifestyle' : 'Miscellaneous'} information` },
    review_submitting: { title: lw.vmerHeaderSubmitting, sub: lw.vmerHeaderSubmittingSub },
    under_review: { title: lw.vmerHeaderUnderReview, sub: lw.vmerHeaderUnderReviewSub },
    ppmc_intro: { title: lw.vmerHeaderPpmcIntro, sub: lw.vmerHeaderPpmcIntroSub },
    ppmc_address: { title: lw.vmerHeaderPpmcAddress, sub: lw.vmerHeaderPpmcAddressSub },
    ppmc_address_new: { title: lw.vmerHeaderPpmcAddressNew, sub: lw.vmerHeaderPpmcAddressNewSub },
    ppmc_slot: { title: lw.vmerHeaderPpmcSlot, sub: lw.vmerHeaderPpmcSlotSub },
    ppmc_confirmed: { title: 'Test Booked', sub: ppBookedSlot ? `${ppBookedSlot.dateLabel}, ${ppBookedSlot.time}` : '' },
    ppmc_offline: { title: lw.vmerHeaderPpmcOffline, sub: lw.vmerHeaderPpmcOfflineSub },
    docs_required: { title: lw.vmerHeaderDocsRequired, sub: `${flaggedConditions.length} condition${flaggedConditions.length !== 1 ? 's' : ''} flagged` },
    docs_confirm: { title: lw.vmerHeaderDocsConfirm, sub: lw.vmerHeaderDocsConfirmSub },
    docs_submitted: { title: lw.vmerHeaderDocsSubmitted, sub: lw.vmerHeaderDocsSubmittedSub },
    complete: { title: lw.vmerHeaderComplete, sub: lw.vmerHeaderCompleteSub },
  };

  const { title: hTitle, sub: hSub } = HEADER_LABELS[stage] || { title: 'Medical', sub: '' };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-md">
      <div className="bg-white rounded-2xl overflow-hidden shadow-xl shadow-purple-900/20">

        {/* ── Header ── */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-label-md font-bold text-gray-900">{hTitle}</h3>
              <p className="text-caption text-gray-400 truncate">{hSub}</p>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="px-5 py-5"
          >

            {/* INTRO */}
            {stage === 'intro' && (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3.5 space-y-1">
                  <p className="text-label-sm font-bold text-purple-900">What is VMER?</p>
                  <p className="text-caption text-purple-700 leading-relaxed">
                    A 15–20 minute <span className="font-semibold">video call with a licensed doctor</span> to assess your health. Required for all term life policies.
                  </p>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: '📹', t: 'Video call with a doctor', d: '15–20 mins, camera & mic required' },
                    { icon: '🔇', t: 'Quiet location needed', d: 'Find a private space before joining' },
                    { icon: '📋', t: 'Topics covered', d: 'Health history, lifestyle, medications' },
                    { icon: '✅', t: 'Post-call review', d: 'You\'ll confirm the answers discussed' },
                  ].map(({ icon, t, d }) => (
                    <div key={t} className="flex gap-3 items-start">
                      <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
                      <div>
                        <p className="text-label-sm font-semibold text-gray-900">{t}</p>
                        <p className="text-caption text-gray-400">{d}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setStage('availability_now')}
                  className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform"
                >
                  Check Doctor Availability
                </button>
              </div>
            )}

            {/* DOCTOR AVAILABLE NOW */}
            {stage === 'availability_now' && (
              <div className="space-y-5">
                <div className="flex flex-col items-center py-3 gap-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <p className="text-label-lg font-bold text-gray-900">Dr. Meera Krishnan is available</p>
                  <p className="text-caption text-gray-500">MBBS, MD — Available now</p>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center justify-between">
                  <p className="text-body-sm text-emerald-800 font-medium">Call starts in</p>
                  <span className="text-2xl font-bold text-emerald-700 tabular-nums">{fmtCountdown(joinCountdown)}</span>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 space-y-1.5">
                  <p className="text-label-sm font-semibold text-amber-800">Before you join</p>
                  {['Ensure camera & microphone are working', 'Move to a quiet, private location', 'Keep your Aadhaar / PAN card nearby'].map(s => (
                    <div key={s} className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      <span className="text-caption text-amber-700">{s}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setStage('call_active')}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform shadow-lg shadow-emerald-600/20"
                >
                  Join Call Now
                </button>
                <button
                  onClick={() => setStage('slot_picker')}
                  className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-label-sm font-medium active:scale-[0.97] transition-transform"
                >
                  Schedule for later instead
                </button>
              </div>
            )}

            {/* DOCTOR NOT AVAILABLE */}
            {stage === 'availability_none' && (
              <div className="space-y-4">
                <div className="flex flex-col items-center py-3 gap-2 text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-label-md font-bold text-gray-900">No doctor available right now</p>
                  <p className="text-caption text-gray-500">Next available slot: <span className="font-semibold text-purple-600">Today, 4:00 PM</span></p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                  <p className="text-caption text-gray-500">You'll receive an SMS & WhatsApp link 1 hour before your scheduled slot.</p>
                </div>
                <button
                  onClick={() => setStage('slot_picker')}
                  className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform"
                >
                  Schedule a call
                </button>
              </div>
            )}

            {/* SLOT PICKER */}
            {stage === 'slot_picker' && (
              <MedSlotPicker
                title="Choose a date and time for your VMER call"
                onSelect={(s) => handleSlotSelect(s, false)}
                onBack={() => setStage('availability_now')}
              />
            )}

            {/* SLOT CONFLICT */}
            {stage === 'slot_conflict' && (
              <div className="space-y-4">
                <div className="flex flex-col items-center py-3 gap-3 text-center">
                  <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-label-md font-bold text-gray-900">Slot just got booked</p>
                    <p className="text-caption text-gray-500 mt-1">
                      {bookedSlot?.time} on {bookedSlot?.dateLabel} was taken by another user while you were selecting. Please choose a different time.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStage('slot_picker')}
                  className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform"
                >
                  Pick another slot
                </button>
              </div>
            )}

            {/* SCHEDULED */}
            {stage === 'scheduled' && bookedSlot && (
              <div className="space-y-4">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                  className="flex flex-col items-center py-2 gap-2 text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-label-lg font-bold text-gray-900">Call Scheduled!</p>
                    <p className="text-body-sm font-semibold text-purple-700 mt-0.5">{bookedSlot.dateLabel}</p>
                    <p className="text-caption text-gray-500">{bookedSlot.time}</p>
                  </div>
                </motion.div>

                <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 space-y-2">
                  <p className="text-label-sm font-bold text-purple-900">Pre-call checklist</p>
                  {['Camera & microphone working', 'Quiet, private location', 'Aadhaar / PAN card nearby', 'List of current medications (if any)', 'Comfortable clothing for brief physical check if asked'].map(s => (
                    <div key={s} className="flex items-start gap-2">
                      <svg className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      <span className="text-caption text-purple-700">{s}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                  <p className="text-caption text-gray-500">
                    You'll receive a <span className="font-semibold">WhatsApp & SMS reminder</span> 1 hour before the call with your join link.
                  </p>
                </div>

                <button
                  onClick={() => setStage('call_active')}
                  className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform"
                >
                  Join Call (Demo)
                </button>
                <button
                  onClick={() => setStage('slot_picker')}
                  className="w-full text-center text-caption text-gray-400 hover:text-gray-600 py-1"
                >
                  Reschedule
                </button>
              </div>
            )}

            {/* CALL ACTIVE */}
            {stage === 'call_active' && (
              <div className="space-y-4">
                <div className="flex flex-col items-center py-4 gap-3">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-xl">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-label-md font-bold text-gray-900">Dr. Meera Krishnan</p>
                    <p className="text-caption text-emerald-600 font-medium">● Connected</p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 space-y-1">
                  <p className="text-label-sm font-semibold text-gray-700">Topics during this call</p>
                  {['Current medications & supplements', 'Past surgeries or hospitalizations', 'Family medical history', 'Lifestyle: smoking, alcohol, exercise', 'Occupation & travel history'].map(s => (
                    <div key={s} className="flex items-center gap-2 text-caption text-gray-500">
                      <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                      {s}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setStage('post_call_review')}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform"
                >
                  End Call & Review Answers
                </button>
              </div>
            )}

            {/* POST-CALL REVIEW */}
            {stage === 'post_call_review' && (
              <div className="space-y-5">
                {/* Section tabs */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                  {(['health', 'lifestyle', 'misc'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setReviewSection(s)}
                      className={`flex-1 py-1.5 rounded-lg text-caption font-semibold transition-all capitalize
                        ${reviewSection === s ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'}`}
                    >
                      {s === 'misc' ? 'Misc' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>

                {/* HEALTH SECTION */}
                {reviewSection === 'health' && (
                  <div className="space-y-5">
                    <MedYesNo question="Have you used tobacco or smoked in the last year?" onAnswer={setTobacco} />
                    <MedYesNo question="Do you consume alcohol?" onAnswer={setAlcohol} />
                    {alcohol === true && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="pl-4 border-l-2 border-purple-100 space-y-3">
                        <div>
                          <label className="text-caption font-semibold text-gray-500 block mb-1.5">Frequency</label>
                          <div className="flex flex-wrap gap-2">
                            {['Daily', '4–6 times/week', '2–3 times/week', 'Occasionally'].map(f => (
                              <button key={f} onClick={() => setAlcoholFreq(f)}
                                className={`px-3 py-1.5 rounded-lg border text-caption font-medium transition-all ${alcoholFreq === f ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600'}`}>
                                {f}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-caption font-semibold text-gray-500 block mb-1.5">Units per week</label>
                          <input
                            type="number" inputMode="numeric" value={alcoholUnits}
                            onChange={e => setAlcoholUnits(e.target.value)}
                            placeholder="e.g. 7"
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-body-sm text-gray-900 focus:outline-none focus:border-purple-400"
                          />
                        </div>
                        <MedYesNo question="Has a doctor advised you to reduce or stop alcohol?" onAnswer={setDoctorAdvised} />
                        {doctorAdvised === true && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <textarea value={doctorComment} onChange={e => setDoctorComment(e.target.value)}
                              placeholder="Additional comments (optional)"
                              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-body-sm text-gray-600 focus:outline-none focus:border-purple-400 resize-none" rows={2} />
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                    <MedYesNo question="Have any family members passed away before age 60 due to a serious health condition?" onAnswer={setFamilyHistory} />
                    <div>
                      <p className="text-body-sm text-gray-800 mb-2">Have you ever received medical attention for any of the following?</p>
                      <div className="flex flex-wrap gap-2">
                        {MEDICAL_CONDITIONS.map(c => {
                          const sel = conditions.includes(c);
                          return (
                            <button key={c} onClick={() => {
                              if (c === 'None of the above') { setConditions(sel ? [] : ['None of the above']); return; }
                              setConditions(prev => sel ? prev.filter(x => x !== c) : [...prev.filter(x => x !== 'None of the above'), c]);
                            }}
                              className={`px-3 py-1.5 rounded-lg border text-caption font-medium transition-all ${sel ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                              {c}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <MedYesNo question="Do you or your spouse have any history of STD or HIV?" onAnswer={setStdHiv} />
                    <button onClick={() => setReviewSection('lifestyle')}
                      className="w-full py-3 rounded-xl bg-purple-600 text-white text-label-md font-semibold active:scale-[0.97] transition-transform">
                      Next: Lifestyle →
                    </button>
                  </div>
                )}

                {/* LIFESTYLE SECTION */}
                {reviewSection === 'lifestyle' && (
                  <div className="space-y-5">
                    <MedYesNo question="Have you participated in adventure sports in the last 5 years?" onAnswer={setAdventureSports} />
                    {adventureSports === true && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="pl-4 border-l-2 border-purple-100">
                        <textarea value={adventureDetails} onChange={e => setAdventureDetails(e.target.value)}
                          placeholder="Activity, type, frequency — e.g. Skydiving, solo, twice a year"
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-body-sm text-gray-600 focus:outline-none focus:border-purple-400 resize-none" rows={2} />
                      </motion.div>
                    )}
                    <MedYesNo question="Have you travelled internationally in the last 6 months, or planning to?" onAnswer={setIntlTravel} />
                    {intlTravel === true && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="pl-4 border-l-2 border-purple-100">
                        <textarea value={intlDetails} onChange={e => setIntlDetails(e.target.value)}
                          placeholder="Countries, purpose, duration, accommodation type"
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-body-sm text-gray-600 focus:outline-none focus:border-purple-400 resize-none" rows={2} />
                      </motion.div>
                    )}
                    <button onClick={() => setReviewSection('misc')}
                      className="w-full py-3 rounded-xl bg-purple-600 text-white text-label-md font-semibold active:scale-[0.97] transition-transform">
                      Next: Miscellaneous →
                    </button>
                    <button onClick={() => setReviewSection('health')} className="w-full text-center text-caption text-gray-400 hover:text-gray-600 py-1">← Back to Health</button>
                  </div>
                )}

                {/* MISC SECTION */}
                {reviewSection === 'misc' && (
                  <div className="space-y-5">
                    <MedYesNo question="Do you have any pending legal cases or criminal proceedings in India or abroad?" onAnswer={setLegalIssues} />

                    <div className="h-px bg-gray-100" />

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={reviewConfirmed} onChange={e => setReviewConfirmed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-purple-600 rounded flex-shrink-0" />
                      <span className="text-caption text-gray-600 leading-relaxed">
                        I confirm that all the information provided is <span className="font-semibold">true and accurate</span> to the best of my knowledge. I understand that incorrect disclosure may affect my policy.
                      </span>
                    </label>

                    <button
                      disabled={!isReviewComplete()}
                      onClick={() => {
                        setStage('review_submitting');
                        setTimeout(() => {
                          setPpmc(flaggedConditions.length > 0);
                          setStage('under_review');
                        }, 2000);
                      }}
                      className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold disabled:opacity-40 active:scale-[0.97] transition-transform"
                    >
                      Submit & Confirm
                    </button>
                    <button
                      className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-label-sm font-medium"
                      onClick={() => {/* Talk to us */ }}
                    >
                      Want to make changes? Talk to us
                    </button>
                    <button onClick={() => setReviewSection('lifestyle')} className="w-full text-center text-caption text-gray-400 hover:text-gray-600 py-1">← Back to Lifestyle</button>
                  </div>
                )}
              </div>
            )}

            {/* REVIEW SUBMITTING */}
            {stage === 'review_submitting' && (
              <div className="flex flex-col items-center py-8 gap-4">
                <svg className="w-10 h-10 text-purple-400 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="40 22" strokeLinecap="round" />
                </svg>
                <p className="text-body-sm text-gray-600">Saving your responses…</p>
              </div>
            )}

            {/* UNDER REVIEW */}
            {stage === 'under_review' && (
              <div className="space-y-4">
                <div className="flex flex-col items-center py-2 gap-2 text-center">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                  </div>
                  <p className="text-label-md font-bold text-gray-900">Responses submitted</p>
                  <p className="text-caption text-gray-500">Your medical information is under review</p>
                </div>

                {ppmc ? (
                  <div className="space-y-3">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                      <p className="text-label-sm font-bold text-amber-900">Additional tests required</p>
                      <p className="text-caption text-amber-700 mt-0.5">Based on your responses, we need a few health tests to complete your evaluation.</p>
                    </div>
                    <button onClick={() => setStage('ppmc_intro')}
                      className="w-full py-3.5 rounded-xl bg-amber-500 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform">
                      Schedule Home Tests →
                    </button>
                    {flaggedConditions.length > 0 && (
                      <button onClick={() => setStage('docs_required')}
                        className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 text-label-sm font-medium">
                        Upload condition documents ({flaggedConditions.length})
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                      <p className="text-label-sm font-bold text-emerald-900">No additional tests needed</p>
                      <p className="text-caption text-emerald-700 mt-0.5">Your responses look good. Medical evaluation is complete!</p>
                    </div>
                    <button onClick={() => { setStage('complete'); setTimeout(() => onContinue(), 1800); }}
                      className="w-full py-3.5 rounded-xl bg-emerald-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform">
                      Continue
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* PPMC INTRO */}
            {stage === 'ppmc_intro' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3.5">
                  <p className="text-label-sm font-bold text-amber-900">Additional health tests required</p>
                  <p className="text-caption text-amber-700 mt-1 leading-relaxed">We need a few basic tests to better understand your health before issuing your policy. A technician will visit your home.</p>
                </div>
                <div className="space-y-2">
                  {[
                    { icon: '📅', t: 'Schedule test', s: 'pending' as const },
                    { icon: '🏠', t: 'Sample collection at home', s: 'upcoming' as const },
                    { icon: '🔬', t: 'Reports under evaluation', s: 'upcoming' as const },
                    { icon: '✅', t: 'Tests complete', s: 'upcoming' as const },
                  ].map(({ icon, t, s }, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${s === 'pending' ? 'bg-purple-100' : 'bg-gray-100'}`}>{icon}</div>
                      <span className={`text-body-sm font-medium ${s === 'pending' ? 'text-gray-900' : 'text-gray-400'}`}>{t}</span>
                      {s === 'pending' && <span className="ml-auto text-caption text-purple-600 font-semibold">Now</span>}
                    </div>
                  ))}
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2">
                  <span className="text-lg">⏰</span>
                  <p className="text-caption text-red-700 font-medium">Fasting for 12 hours is mandatory before the test</p>
                </div>
                <button onClick={() => setStage('ppmc_address')}
                  className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform">
                  Schedule Home Test
                </button>
                <button onClick={() => setStage('ppmc_offline')}
                  className="w-full py-2 text-center text-caption text-gray-400 hover:text-gray-600">
                  Can't schedule online? We'll call you
                </button>
              </div>
            )}

            {/* PPMC ADDRESS PICKER */}
            {stage === 'ppmc_address' && (
              <div className="space-y-4">
                <p className="text-body-sm font-semibold text-gray-700">Where should the technician come?</p>
                {SAVED_ADDRESSES.map(addr => (
                  <button key={addr.id} onClick={() => setSelectedAddress(addr.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-xl border text-left transition-all
                      ${selectedAddress === addr.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${selectedAddress === addr.id ? 'bg-purple-100' : 'bg-gray-100'}`}>
                      <span className="text-sm">{addr.id === 'home' ? '🏠' : '🏢'}</span>
                    </div>
                    <div>
                      <p className={`text-label-sm font-bold ${selectedAddress === addr.id ? 'text-purple-800' : 'text-gray-800'}`}>{addr.label}</p>
                      <p className="text-caption text-gray-500 leading-snug">{addr.address}</p>
                    </div>
                    {selectedAddress === addr.id && (
                      <svg className="w-5 h-5 text-purple-500 ml-auto flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    )}
                  </button>
                ))}
                <button onClick={() => setStage('ppmc_address_new')}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-dashed border-gray-300 text-left hover:border-purple-300 hover:bg-purple-50 transition-all">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  </div>
                  <span className="text-label-sm font-medium text-gray-600">Add new address</span>
                </button>
                <button onClick={() => setStage('ppmc_slot')} disabled={!selectedAddress}
                  className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold disabled:opacity-40 active:scale-[0.97] transition-transform">
                  Continue with this address
                </button>
              </div>
            )}

            {/* PPMC NEW ADDRESS */}
            {stage === 'ppmc_address_new' && (
              <div className="space-y-3">
                {[
                  { key: 'flat', label: 'Flat / House No.', placeholder: 'e.g. 4B' },
                  { key: 'area', label: 'Street / Area / Road', placeholder: 'e.g. MG Road, Koramangala' },
                  { key: 'pincode', label: 'Pincode', placeholder: '560001' },
                  { key: 'city', label: 'City', placeholder: 'Bangalore' },
                  { key: 'state', label: 'State', placeholder: 'Karnataka' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-caption font-semibold text-gray-500 block mb-1">{label}</label>
                    <input
                      value={newAddress[key as keyof typeof newAddress]}
                      onChange={e => setNewAddress(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-body-sm text-gray-900 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-caption font-semibold text-gray-500 block mb-1.5">Save as</label>
                  <div className="flex gap-2">
                    {['Home', 'Work', 'Other'].map(tag => (
                      <button key={tag} onClick={() => setNewAddress(p => ({ ...p, saveAs: tag }))}
                        className={`px-4 py-2 rounded-xl border text-label-sm font-medium transition-all ${newAddress.saveAs === tag ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600'}`}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedAddress('new'); setStage('ppmc_slot'); }}
                  disabled={!newAddress.flat || !newAddress.pincode || !newAddress.city}
                  className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold disabled:opacity-40 active:scale-[0.97] transition-transform mt-1"
                >
                  Save & Continue
                </button>
                <button onClick={() => setStage('ppmc_address')} className="w-full text-center text-caption text-gray-400 py-1">← Back</button>
              </div>
            )}

            {/* PPMC SLOT PICKER */}
            {stage === 'ppmc_slot' && (
              <MedSlotPicker
                title="When should the technician visit?"
                onSelect={(s) => handleSlotSelect(s, true)}
                onBack={() => setStage('ppmc_address')}
              />
            )}

            {/* PPMC CONFIRMED */}
            {stage === 'ppmc_confirmed' && ppBookedSlot && (
              <div className="space-y-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                  className="flex flex-col items-center py-2 gap-2 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <p className="text-label-lg font-bold text-gray-900">Home Test Booked!</p>
                </motion.div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl divide-y divide-gray-100">
                  {[
                    { l: 'Booking ID', v: ppBookingId },
                    { l: 'Date', v: ppBookedSlot.dateLabel },
                    { l: 'Time', v: ppBookedSlot.time },
                    { l: 'Address', v: selectedAddress === 'home' ? SAVED_ADDRESSES[0].address : selectedAddress === 'work' ? SAVED_ADDRESSES[1].address : `${newAddress.flat}, ${newAddress.area}, ${newAddress.city}` },
                    { l: 'Technician', v: 'Assigned 2 hours before visit' },
                  ].map(({ l, v }) => (
                    <div key={l} className="px-4 py-2.5 flex justify-between gap-3">
                      <span className="text-caption text-gray-400 flex-shrink-0">{l}</span>
                      <span className="text-caption text-gray-800 font-medium text-right">{v}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2">
                  <span className="text-base">⏰</span>
                  <p className="text-caption text-red-700 font-semibold">Fast for 12 hours before the test</p>
                </div>

                {flaggedConditions.length > 0 && (
                  <button onClick={() => setStage('docs_required')}
                    className="w-full py-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-label-sm font-semibold active:scale-[0.97] transition-transform">
                    Also upload condition documents ({flaggedConditions.length} required)
                  </button>
                )}

                <button onClick={() => { setStage('complete'); setTimeout(() => onContinue(), 1800); }}
                  className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform">
                  Done
                </button>
              </div>
            )}

            {/* PPMC OFFLINE FALLBACK */}
            {stage === 'ppmc_offline' && (
              <div className="space-y-4">
                <div className="flex flex-col items-center py-3 gap-3 text-center">
                  <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-label-md font-bold text-gray-900">We'll reach out to you</p>
                    <p className="text-caption text-gray-500 mt-1 leading-relaxed">Our team will contact you within 24 hours to schedule your home test at a convenient time.</p>
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 space-y-1">
                  <p className="text-caption text-gray-500">You'll be contacted on: <span className="font-semibold text-gray-800">your registered mobile</span></p>
                  <p className="text-caption text-gray-400">Or reach us at <span className="font-medium text-purple-600">1800 266 5433</span></p>
                </div>
                <button onClick={() => { setStage('complete'); setTimeout(() => onContinue(), 1800); }}
                  className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform">
                  Got it
                </button>
              </div>
            )}

            {/* DOCS REQUIRED */}
            {stage === 'docs_required' && (
              <div className="space-y-4">
                <p className="text-body-sm text-gray-700">Based on your health history, please upload the following documents for each condition.</p>
                {flaggedConditions.map(cond => (
                  <div key={cond} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <p className="text-label-sm font-bold text-gray-800">{cond}</p>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                      {CONDITION_DOCS[cond]?.map((doc, i) => (
                        <div key={i} className="flex items-center gap-2 text-caption text-gray-600">
                          <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                          {doc}
                        </div>
                      ))}
                      <button onClick={() => setUploadedDocs(p => ({ ...p, [cond]: true }))}
                        className={`mt-2 w-full py-2.5 rounded-xl border text-label-sm font-semibold transition-all active:scale-[0.97]
                          ${uploadedDocs[cond] ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-dashed border-purple-300 text-purple-600 hover:bg-purple-50'}`}>
                        {uploadedDocs[cond] ? '✓ Uploaded' : 'Upload documents (PDF, PNG, JPEG, ZIP · Max 100MB)'}
                      </button>
                    </div>
                  </div>
                ))}

                <div className="border border-dashed border-gray-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-caption text-gray-400 mb-1.5">Miscellaneous documents</p>
                  <button className="text-caption text-purple-500 font-medium">+ Add other documents</button>
                </div>

                <button onClick={() => setStage('docs_confirm')}
                  className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform">
                  Submit Documents
                </button>
                <div className="flex gap-2">
                  <button className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-label-sm font-medium">
                    I don't have these
                  </button>
                  <button className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-label-sm font-medium">
                    Talk to us
                  </button>
                </div>
              </div>
            )}

            {/* DOCS CONFIRM */}
            {stage === 'docs_confirm' && (
              <div className="space-y-4">
                <div className="flex flex-col items-center py-2 gap-2 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                  </div>
                  <p className="text-label-md font-bold text-gray-900">Have you uploaded all required documents?</p>
                </div>

                {!allDocsUploaded && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    <p className="text-caption text-amber-700">
                      Some documents are missing: <span className="font-semibold">{flaggedConditions.filter(c => !uploadedDocs[c]).join(', ')}</span>. Partial uploads are accepted — a health check may be scheduled later.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStage('docs_required')}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 text-label-sm font-semibold">
                    No, go back
                  </button>
                  <button onClick={() => { setStage('docs_submitted'); }}
                    className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-label-sm font-semibold active:scale-[0.97] transition-transform">
                    Yes, submit
                  </button>
                </div>
              </div>
            )}

            {/* DOCS SUBMITTED */}
            {stage === 'docs_submitted' && (
              <div className="space-y-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                  className="flex flex-col items-center py-2 gap-2 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <p className="text-label-lg font-bold text-gray-900">Documents Uploaded</p>
                  <p className="text-caption text-gray-500">We'll review your documents in 24–48 hours and notify you</p>
                </motion.div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 space-y-1">
                  <p className="text-caption text-gray-500">Need help? Reach us at</p>
                  <p className="text-caption font-semibold text-purple-600">1800 266 5433 · support.life@acko.com</p>
                </div>
                <button onClick={() => { setStage('complete'); setTimeout(() => onContinue(), 1800); }}
                  className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform">
                  Done
                </button>
              </div>
            )}

            {/* COMPLETE */}
            {stage === 'complete' && (
              <div className="flex flex-col items-center py-6 gap-4">
                <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 15 }}>
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center shadow-lg shadow-emerald-100">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center">
                  <p className="text-label-lg font-bold text-gray-900">Medical Evaluation Complete</p>
                  <p className="text-caption text-gray-400 mt-1">Your application moves to underwriting review</p>
                </motion.div>
                <p className="text-caption text-gray-400">Proceeding…</p>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* ── Footer support bar ── */}
        {!['review_submitting', 'complete', 'call_active'].includes(stage) && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <button className="flex items-center gap-1.5 text-caption text-gray-400 hover:text-purple-600 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
              FAQs
            </button>
            <button className="flex items-center gap-1.5 text-caption text-gray-400 hover:text-purple-600 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              1800 266 5433
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Underwriting Status — Timeline & review progress
   ═══════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════
   Underwriting Status — Full post-submission flow
   Stages: in_review → checking → approved / info_needed / not_approved
   Also handles: tasks_pending (mixed hub state)
   ═══════════════════════════════════════════════════════ */

type UWStage =
  | 'in_review'
  | 'tasks_pending'
  | 'checking'
  | 'approved'
  | 'info_needed'
  | 'not_approved';

type TaskStatus = 'completed' | 'under_review' | 'pending';

interface UWTask { id: string; label: string; status: TaskStatus; eta?: string; }

const UW_TIMELINE = [
  { label: 'Application received',  done: true },
  { label: 'Payment confirmed',     done: true },
  { label: 'e-KYC verified',        done: true },
  { label: 'Financial verification', done: true },
  { label: 'Medical evaluation',    done: true },
  { label: 'Underwriting review',   done: false, active: true },
  { label: 'Policy issuance',       done: false, active: false },
];

function UWTimelineRow({ label, done, active, last }: { label: string; done: boolean; active?: boolean; last?: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        {done ? (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0"
          >
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </motion.div>
        ) : active ? (
          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-gray-300" />
          </div>
        )}
        {!last && <div className={`w-px flex-1 min-h-[20px] mt-0.5 ${done ? 'bg-emerald-200' : 'bg-gray-100'}`} />}
      </div>
      <div className="pb-4">
        <p className={`text-label-sm font-medium leading-tight ${done ? 'text-gray-900' : active ? 'text-purple-700' : 'text-gray-400'}`}>
          {label}
        </p>
        {active && <p className="text-[11px] text-purple-500 mt-0.5 font-medium">In progress · 3–5 business days</p>}
        {done && <p className="text-[11px] text-emerald-500 mt-0.5">Completed</p>}
      </div>
    </div>
  );
}

function TaskPill({ status }: { status: TaskStatus }) {
  if (status === 'completed') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wide">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
      Done
    </span>
  );
  if (status === 'under_review') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wide">
      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
      Review
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wide">
      Pending
    </span>
  );
}

export function LifeUnderwritingStatus({ onContinue }: { onContinue: () => void }) {
  const state = useLifeJourneyStore.getState() as LifeJourneyState;
  const [stage, setStage] = useState<UWStage>('in_review');
  const [checking, setChecking] = useState(false);
  const [uploadedInfo, setUploadedInfo] = useState(false);
  const [policyNo] = useState(() => `ACKO-LIFE-${Date.now().toString().slice(-8)}`);

  // Demo: simulate which outcome the user gets by cycling through options
  const [demoOutcome, setDemoOutcome] = useState<'approved' | 'info_needed' | 'not_approved'>('approved');

  const tasks: UWTask[] = [
    { id: 'kyc',       label: 'e-KYC Verification',       status: 'completed',    eta: 'Completed' },
    { id: 'financial', label: 'Financial Verification',    status: 'under_review', eta: 'Est. 1–2 business days' },
    { id: 'medical',   label: 'Medical Evaluation',        status: 'completed',    eta: 'Completed' },
  ];

  const allComplete = tasks.every(t => t.status === 'completed');

  const handleCheckStatus = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setStage(demoOutcome);
    }, 2200);
  };

  const formatCoverage = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(0)}L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  const coverage = formatCoverage(state.selectedCoverage || 10000000);
  const premium = `₹${(state.quote?.yearlyPremium || 0).toLocaleString('en-IN')}/yr`;
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-md">
      <div className="bg-white rounded-2xl overflow-hidden shadow-xl shadow-purple-900/20">

        {/* ── Header ── */}
        <div className={`px-5 py-4 border-b border-gray-100 ${stage === 'approved' ? 'bg-gradient-to-r from-emerald-600 to-emerald-700' : stage === 'not_approved' ? 'bg-gradient-to-r from-gray-700 to-gray-800' : 'bg-white'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${stage === 'approved' ? 'bg-white/20' : stage === 'not_approved' ? 'bg-white/10' : 'bg-purple-50'}`}>
              {stage === 'approved' ? (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              ) : stage === 'not_approved' ? (
                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              )}
            </div>
            <div>
              <h3 className={`text-label-md font-bold ${stage === 'approved' || stage === 'not_approved' ? 'text-white' : 'text-gray-900'}`}>
                {stage === 'in_review' && 'Application Status'}
                {stage === 'tasks_pending' && 'Pending Tasks'}
                {stage === 'checking' && 'Checking Status…'}
                {stage === 'approved' && 'Policy Approved!'}
                {stage === 'info_needed' && 'Information Required'}
                {stage === 'not_approved' && 'Application Not Approved'}
              </h3>
              <p className={`text-caption ${stage === 'approved' || stage === 'not_approved' ? 'text-white/60' : 'text-gray-400'}`}>
                {stage === 'in_review' && 'Underwriting review in progress'}
                {stage === 'tasks_pending' && 'Complete these to proceed'}
                {stage === 'checking' && 'Contacting underwriting team…'}
                {stage === 'approved' && `Policy No. ${policyNo}`}
                {stage === 'info_needed' && 'Action needed from you'}
                {stage === 'not_approved' && '100% refund initiated'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.22 }}
          >

            {/* IN REVIEW */}
            {stage === 'in_review' && (
              <div className="px-5 py-5 space-y-5">
                {/* Timeline */}
                <div>
                  {UW_TIMELINE.map((step, i) => (
                    <motion.div
                      key={step.label}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                    >
                      <UWTimelineRow
                        label={step.label}
                        done={step.done}
                        active={(step as any).active}
                        last={i === UW_TIMELINE.length - 1}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* ETA bar */}
                <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-label-sm font-bold text-purple-900">Estimated decision</p>
                    <p className="text-label-sm font-bold text-purple-700">3–5 business days</p>
                  </div>
                  <div className="w-full bg-purple-100 rounded-full h-1.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '60%' }}
                      transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
                      className="bg-purple-600 h-1.5 rounded-full"
                    />
                  </div>
                  <p className="text-caption text-purple-600">Your application is with our underwriting team</p>
                </div>

                {/* What happens next */}
                <div className="space-y-2">
                  <p className="text-caption font-semibold text-gray-500 uppercase tracking-wide">What happens next</p>
                  {[
                    { icon: '🔍', t: 'Risk assessment', d: 'Medical, financial & lifestyle data reviewed' },
                    { icon: '📩', t: 'Decision notification', d: 'Email + WhatsApp when decision is made' },
                    { icon: '📄', t: 'Policy issuance', d: 'Policy document sent digitally on approval' },
                  ].map(({ icon, t, d }) => (
                    <div key={t} className="flex gap-3 items-start">
                      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                      <div>
                        <p className="text-label-sm font-semibold text-gray-800">{t}</p>
                        <p className="text-caption text-gray-400">{d}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Demo outcome selector */}
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 space-y-2">
                  <p className="text-caption font-semibold text-amber-800">Demo: simulate outcome</p>
                  <div className="flex gap-2">
                    {(['approved', 'info_needed', 'not_approved'] as const).map(o => (
                      <button key={o} onClick={() => setDemoOutcome(o)}
                        className={`flex-1 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all
                          ${demoOutcome === o ? 'border-amber-500 bg-amber-100 text-amber-800' : 'border-amber-200 text-amber-600'}`}>
                        {o === 'approved' ? '✅ Approved' : o === 'info_needed' ? '⚠️ Info' : '❌ Declined'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCheckStatus}
                  className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform"
                >
                  Check Status
                </button>
                <button
                  onClick={() => setStage('tasks_pending')}
                  className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-label-sm font-medium"
                >
                  View task breakdown
                </button>
              </div>
            )}

            {/* TASKS PENDING HUB */}
            {stage === 'tasks_pending' && (
              <div className="px-5 py-5 space-y-4">
                <p className="text-body-sm text-gray-600">All three tasks must be completed before policy issuance. You can work on them simultaneously.</p>

                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all
                      ${task.status === 'completed' ? 'border-emerald-200 bg-emerald-50' : task.status === 'under_review' ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
                          ${task.status === 'completed' ? 'bg-emerald-100' : task.status === 'under_review' ? 'bg-amber-100' : 'bg-gray-100'}`}>
                          {task.id === 'kyc' && (
                            <svg className={`w-4 h-4 ${task.status === 'completed' ? 'text-emerald-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                            </svg>
                          )}
                          {task.id === 'financial' && (
                            <svg className={`w-4 h-4 ${task.status === 'under_review' ? 'text-amber-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                            </svg>
                          )}
                          {task.id === 'medical' && (
                            <svg className={`w-4 h-4 ${task.status === 'completed' ? 'text-emerald-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-label-sm font-semibold text-gray-900">{task.label}</p>
                          <p className="text-caption text-gray-400">{task.eta}</p>
                        </div>
                      </div>
                      <TaskPill status={task.status} />
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                  <p className="text-caption text-gray-500 leading-relaxed">
                    You can complete tasks independently — no need to wait for one to finish before starting another.
                  </p>
                </div>

                <button onClick={() => setStage('in_review')}
                  className="w-full py-3 rounded-xl bg-purple-600 text-white text-label-md font-semibold active:scale-[0.97] transition-transform">
                  Back to status
                </button>
              </div>
            )}

            {/* CHECKING */}
            {stage === 'checking' && (
              <div className="px-5 py-10 flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 text-purple-100 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="40 22" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-label-md font-semibold text-gray-900">Checking with underwriting team</p>
                  <p className="text-caption text-gray-400">This takes a moment…</p>
                </div>
              </div>
            )}

            {/* APPROVED */}
            {stage === 'approved' && (
              <div className="space-y-5">
                {/* Celebration banner */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 px-5 pt-5 pb-4 space-y-3">
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 15 }}
                    className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto shadow-lg shadow-emerald-100"
                  >
                    <svg className="w-9 h-9 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="text-center">
                    <p className="text-label-lg font-bold text-emerald-900">Your policy is active!</p>
                    <p className="text-caption text-emerald-600 mt-0.5">Coverage starts from today</p>
                  </motion.div>
                </div>

                {/* Policy card */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                  className="mx-5 rounded-2xl overflow-hidden border border-gray-100 shadow-md shadow-gray-100">
                  <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-4">
                    <p className="text-white/60 text-caption uppercase tracking-widest">ACKO Flexi Life Plan</p>
                    <p className="text-white text-xl font-bold mt-0.5">{coverage}</p>
                    <p className="text-white/50 text-caption mt-0.5">{state.selectedTerm || 30} year term · {premium}</p>
                  </div>
                  <div className="bg-white px-5 py-4 divide-y divide-gray-50">
                    {[
                      { l: 'Policy Number', v: policyNo },
                      { l: 'Policyholder', v: state.name || 'Policyholder' },
                      { l: 'Start Date', v: today },
                      { l: 'Status', v: '● Active', green: true },
                    ].map(({ l, v, green }) => (
                      <div key={l} className="flex justify-between items-center py-2">
                        <span className="text-caption text-gray-400">{l}</span>
                        <span className={`text-caption font-semibold ${green ? 'text-emerald-600' : 'text-gray-900'}`}>{v}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Actions */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="px-5 pb-5 space-y-3">
                  <button className="w-full py-3.5 rounded-xl bg-emerald-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                    Download Policy Document
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="py-2.5 rounded-xl border border-gray-200 text-gray-600 text-label-sm font-medium">
                      View coverage details
                    </button>
                    <button className="py-2.5 rounded-xl border border-gray-200 text-gray-600 text-label-sm font-medium">
                      Add nominee
                    </button>
                  </div>
                  <button
                    onClick={onContinue}
                    className="w-full py-3 rounded-xl bg-purple-600 text-white text-label-md font-semibold active:scale-[0.97] transition-transform"
                  >
                    Done
                  </button>
                </motion.div>
              </div>
            )}

            {/* INFO NEEDED */}
            {stage === 'info_needed' && (
              <div className="px-5 py-5 space-y-4">
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3.5">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <div>
                    <p className="text-label-sm font-bold text-amber-900">Our underwriter needs more information</p>
                    <p className="text-caption text-amber-700 mt-0.5 leading-relaxed">Your application is on hold. Please provide the requested details to proceed.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-caption font-semibold text-gray-500 uppercase tracking-wide">Items required</p>
                  {[
                    {
                      tag: 'Document',
                      title: 'Clarification on medical history',
                      desc: 'Please upload a recent consultation note from your doctor regarding your declared hypertension.',
                      cta: 'Upload document',
                      color: 'orange',
                    },
                    {
                      tag: 'Call',
                      title: 'Income verification call',
                      desc: 'A 10-minute call to verify your business income details.',
                      cta: 'Schedule call',
                      color: 'blue',
                    },
                  ].map(({ tag, title, desc, cta, color }) => (
                    <div key={title} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 flex items-start gap-3">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${color === 'orange' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                          {tag}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-label-sm font-semibold text-gray-900">{title}</p>
                          <p className="text-caption text-gray-500 mt-0.5 leading-snug">{desc}</p>
                        </div>
                      </div>
                      <div className="border-t border-gray-100 px-4 py-2.5">
                        <button
                          onClick={() => setUploadedInfo(true)}
                          className={`text-label-sm font-semibold ${uploadedInfo ? 'text-emerald-600' : color === 'orange' ? 'text-orange-600' : 'text-blue-600'}`}>
                          {uploadedInfo ? '✓ Submitted' : cta} →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                  <p className="text-caption text-gray-500 leading-relaxed">
                    Once submitted, our team will review within <span className="font-semibold text-gray-700">1–2 business days</span> and update you by Email & WhatsApp.
                  </p>
                </div>

                <button
                  onClick={() => { setChecking(true); setTimeout(() => { setChecking(false); setStage('approved'); }, 2000); }}
                  disabled={!uploadedInfo}
                  className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold disabled:opacity-40 active:scale-[0.97] transition-transform"
                >
                  Submit & Continue
                </button>
                <button
                  className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-label-sm font-medium"
                  onClick={() => {}}
                >
                  Talk to us · 1800 266 5433
                </button>
              </div>
            )}

            {/* NOT APPROVED */}
            {stage === 'not_approved' && (
              <div className="px-5 py-5 space-y-4">
                <div className="flex flex-col items-center py-2 gap-3 text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-label-md font-bold text-gray-900">We're unable to approve this application</p>
                    <p className="text-caption text-gray-500 mt-1 leading-relaxed max-w-xs mx-auto">
                      After careful review of your health and financial profile, we're unable to offer coverage at this time.
                    </p>
                  </div>
                </div>

                {/* Refund card */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3.5 flex items-center gap-3"
                >
                  <svg className="w-8 h-8 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
                  </svg>
                  <div>
                    <p className="text-label-sm font-bold text-emerald-900">100% Premium Refund</p>
                    <p className="text-caption text-emerald-700 mt-0.5">₹{(state.quote?.yearlyPremium || 0).toLocaleString('en-IN')} will be refunded to your original payment method within 7–10 business days.</p>
                  </div>
                </motion.div>

                {/* Alternatives */}
                <div className="space-y-2">
                  <p className="text-caption font-semibold text-gray-500 uppercase tracking-wide">What you can do</p>
                  {[
                    { icon: '🔄', t: 'Re-apply after 6 months', d: 'Your health profile may improve over time' },
                    { icon: '💬', t: 'Talk to an advisor', d: 'Explore what coverage options are available for you' },
                    { icon: '🏥', t: 'Consider a health insurance plan', d: 'We have excellent health covers starting ₹800/month' },
                  ].map(({ icon, t, d }) => (
                    <div key={t} className="flex gap-3 px-3 py-3 rounded-xl border border-gray-100 items-start">
                      <span className="text-lg flex-shrink-0">{icon}</span>
                      <div>
                        <p className="text-label-sm font-semibold text-gray-800">{t}</p>
                        <p className="text-caption text-gray-400">{d}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-lg font-semibold active:scale-[0.97] transition-transform">
                  Talk to us · 1800 266 5433
                </button>
                <button onClick={onContinue} className="w-full text-center text-caption text-gray-400 hover:text-gray-600 py-1">
                  Close
                </button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* ── Footer ── */}
        {!['checking', 'approved'].includes(stage) && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <button className="flex items-center gap-1.5 text-caption text-gray-400 hover:text-purple-600 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
              Help
            </button>
            <span className="text-caption text-gray-300">·</span>
            <button className="flex items-center gap-1.5 text-caption text-gray-400 hover:text-purple-600 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              support.life@acko.com
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   FINANCIAL VERIFICATION SCREEN
   Paths: Salaried (EPFO / AA / Upload) · Business (GST / Upload) · Self-employed (Upload)
   ═══════════════════════════════════════════════════════ */

export function LifeFinancialScreen({ onContinue }: { onContinue: () => void }) {
  type FinancialStage =
    | 'intro'
    | 'salaried_methods'
    | 'epfo_mobile' | 'epfo_otp' | 'epfo_verifying' | 'epfo_success' | 'epfo_failure' | 'epfo_timeout'
    | 'aa_consent' | 'aa_bank' | 'aa_verifying' | 'aa_success' | 'aa_failure'
    | 'doc_salaried'
    | 'business_methods' | 'gst_entry' | 'gst_verifying' | 'gst_success' | 'gst_failure' | 'doc_business'
    | 'doc_self'
    | 'verified';

  const [history, setHistory] = useState<FinancialStage[]>(['intro']);
  const stage = history[history.length - 1];
  const goTo = (s: FinancialStage) => setHistory(h => [...h, s]);
  const goBack = () => setHistory(h => h.length > 1 ? h.slice(0, -1) : h);

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(30);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [gstNumber, setGstNumber] = useState('');
  const [ownershipPct, setOwnershipPct] = useState('100');
  const [selectedBank, setSelectedBank] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpValue = otp.join('');

  useEffect(() => {
    if (stage !== 'epfo_otp' || otpTimer <= 0) return;
    const t = setTimeout(() => setOtpTimer(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, otpTimer]);

  useEffect(() => {
    if (stage === 'epfo_verifying') {
      const t = setTimeout(() => {
        if (otpValue === '000000') goTo('epfo_failure');
        else if (mobile === '9999999999') goTo('epfo_timeout');
        else goTo('epfo_success');
      }, 2500);
      return () => clearTimeout(t);
    }
    if (stage === 'aa_verifying') {
      const t = setTimeout(() => goTo('aa_success'), 3000);
      return () => clearTimeout(t);
    }
    if (stage === 'gst_verifying') {
      const t = setTimeout(() => {
        if (gstNumber.length < 15) goTo('gst_failure');
        else goTo('gst_success');
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [stage]);

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) digitRefs.current[idx + 1]?.focus();
    if (!val && idx > 0) digitRefs.current[idx - 1]?.focus();
  };

  const toggleDoc = (key: string) => setUploadedDocs(p => ({ ...p, [key]: !p[key] }));

  const getTitle = (): string => {
    if (stage === 'intro') return 'Financial Verification';
    if (stage === 'salaried_methods') return 'Choose verification method';
    if (['epfo_mobile', 'epfo_otp', 'epfo_verifying', 'epfo_success', 'epfo_failure', 'epfo_timeout'].includes(stage)) return 'EPFO Verification';
    if (['aa_consent', 'aa_bank', 'aa_verifying', 'aa_success', 'aa_failure'].includes(stage)) return 'Account Aggregator';
    if (stage === 'doc_salaried') return 'Upload Salary Slips';
    if (stage === 'business_methods') return 'Choose verification method';
    if (['gst_entry', 'gst_verifying', 'gst_success', 'gst_failure'].includes(stage)) return 'GST Verification';
    if (['doc_business', 'doc_self'].includes(stage)) return 'Upload Financial Documents';
    if (stage === 'verified') return 'Income Verified ✅';
    return 'Financial Verification';
  };

  const canGoBack = history.length > 1 && !['epfo_verifying', 'aa_verifying', 'gst_verifying', 'verified'].includes(stage);
  const isSuccess = ['epfo_success', 'aa_success', 'gst_success', 'verified'].includes(stage);

  const renderContent = () => {
    switch (stage) {

      /* ── INTRO: Occupation path ── */
      case 'intro':
        return (
          <div className="p-5 space-y-3">
            <div className="text-center pb-1">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <p className="text-label-sm font-semibold text-gray-800">How are you currently employed?</p>
              <p className="text-caption text-gray-400 mt-0.5">We'll show you the right verification method</p>
            </div>
            {[
              { id: 'salaried', icon: '🏢', label: 'Salaried', desc: 'Working for a company or organisation', next: () => goTo('salaried_methods') },
              { id: 'business', icon: '🏪', label: 'Business owner', desc: 'Running your own business (GST registered)', next: () => goTo('business_methods') },
              { id: 'self', icon: '💼', label: 'Self-employed / Freelancer', desc: 'Professional, consultant, or independent worker', next: () => goTo('doc_self') },
            ].map(({ id, icon, label, desc, next }) => (
              <button key={id} onClick={next} className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all active:scale-[0.98] text-left">
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-label-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-caption text-gray-400 mt-0.5">{desc}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            ))}
          </div>
        );

      /* ── SALARIED: Method selection ── */
      case 'salaried_methods':
        return (
          <div className="p-5 space-y-3">
            <p className="text-caption text-gray-400 pb-1">3 ways to verify — pick whichever works best</p>
            {[
              { id: 'epfo', badge: 'Instant · Recommended', badgeColor: 'bg-emerald-50 text-emerald-600', icon: '📊', title: 'EPFO / Provident Fund', desc: 'OTP sent to your EPFO-registered mobile', onTap: () => goTo('epfo_mobile') },
              { id: 'aa', badge: 'Instant · Consent-based', badgeColor: 'bg-blue-50 text-blue-600', icon: '🏦', title: 'Account Aggregator', desc: 'Securely share bank statements via RBI framework', onTap: () => goTo('aa_consent') },
              { id: 'upload', badge: '24–48 hrs review', badgeColor: 'bg-orange-50 text-orange-600', icon: '📄', title: 'Upload salary slips', desc: 'Last 3 months salary slips (PDF, PNG, JPEG)', onTap: () => goTo('doc_salaried') },
            ].map(({ id, badge, badgeColor, icon, title, desc, onTap }) => (
              <button key={id} onClick={onTap} className="w-full flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all active:scale-[0.98] text-left">
                <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-label-sm font-semibold text-gray-800">{title}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                  </div>
                  <p className="text-caption text-gray-400">{desc}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            ))}
          </div>
        );

      /* ── EPFO: Mobile entry ── */
      case 'epfo_mobile':
        return (
          <div className="p-5">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-6 4.5h9" />
              </svg>
            </div>
            <p className="text-label-md font-semibold text-gray-800 mb-1">EPFO-registered mobile</p>
            <p className="text-caption text-gray-500 mb-4">Enter the mobile number linked to your PF account. An OTP will be sent.</p>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all mb-1.5">
              <span className="px-3 py-3 text-label-sm text-gray-500 border-r border-gray-100 bg-gray-50">+91</span>
              <input type="tel" inputMode="numeric" maxLength={10} value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit number"
                className="flex-1 px-3 py-3 text-label-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-300" />
            </div>
            <p className="text-[10px] text-gray-400 mb-4">💡 Demo: any number works. Use 9999999999 to simulate timeout.</p>
            <button disabled={mobile.length < 10}
              onClick={() => { setOtpTimer(30); setOtp(['', '', '', '', '', '']); goTo('epfo_otp'); }}
              className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-all">
              Send OTP
            </button>
          </div>
        );

      /* ── EPFO: OTP entry ── */
      case 'epfo_otp':
        return (
          <div className="p-5">
            <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <p className="text-label-md font-semibold text-gray-800 mb-1">Enter OTP</p>
            <p className="text-caption text-gray-500 mb-4">Sent to +91 {mobile.slice(0, 5)}xxxxx via EPFO</p>
            <div className="flex gap-2.5 justify-center mb-4">
              {otp.map((d, i) => (
                <input key={i} ref={el => { digitRefs.current[i] = el; }} type="tel" inputMode="numeric" maxLength={1} value={d}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Backspace' && !d && i > 0) digitRefs.current[i - 1]?.focus(); }}
                  className="w-11 h-12 text-center text-lg font-bold text-gray-800 border border-gray-200 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-gray-50" />
              ))}
            </div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-caption text-gray-400">
                {otpTimer > 0 ? `Resend in ${otpTimer}s` : (
                  <button onClick={() => { setOtpTimer(30); setOtp(['', '', '', '', '', '']); }} className="text-purple-600 font-medium">Resend OTP</button>
                )}
              </p>
              <p className="text-caption text-gray-400">Attempts: {otpAttempts}/3</p>
            </div>
            <p className="text-[10px] text-gray-400 text-center mb-3">💡 Demo: 000000 = failure · anything else = success</p>
            <button disabled={otpValue.length < 6}
              onClick={() => { setOtpAttempts(p => p + 1); goTo('epfo_verifying'); }}
              className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-all">
              Verify OTP
            </button>
          </div>
        );

      /* ── EPFO: Verifying ── */
      case 'epfo_verifying':
        return (
          <div className="p-8 flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full border-4 border-purple-100 border-t-purple-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75" />
                </svg>
              </div>
            </div>
            <p className="text-label-md font-semibold text-gray-800 mb-1">Checking EPFO records…</p>
            <p className="text-caption text-gray-400">Contacting EPFO portal — takes a few seconds</p>
          </div>
        );

      /* ── EPFO: Success ── */
      case 'epfo_success':
        return (
          <div className="p-5">
            <div className="flex flex-col items-center py-3">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-label-lg font-bold text-gray-800">PF Income Verified</p>
              <p className="text-caption text-gray-500 text-center mt-1">Successfully verified via EPFO</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-5 space-y-2">
              {[{ label: 'UAN', value: '10012345678' }, { label: 'Employer', value: 'Verified ✓' }, { label: 'Member status', value: 'Active' }].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-caption text-gray-400">{label}</span>
                  <span className="text-caption font-medium text-gray-700">{value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => goTo('verified')} className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-sm font-semibold active:scale-[0.97] transition-all">
              Continue
            </button>
          </div>
        );

      /* ── EPFO: Failure ── */
      case 'epfo_failure':
        return (
          <div className="p-5">
            <div className="flex flex-col items-center py-3">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-label-md font-semibold text-gray-800">Verification failed</p>
              <p className="text-caption text-gray-500 text-center mt-1">
                {otpAttempts >= 3 ? 'Too many attempts. Please use another method.' : 'Incorrect OTP. Try again or use another method.'}
              </p>
            </div>
            <div className="space-y-2.5 mt-2">
              {otpAttempts < 3 && (
                <button onClick={() => { setOtp(['', '', '', '', '', '']); setOtpTimer(30); goTo('epfo_otp'); }}
                  className="w-full py-3 rounded-xl bg-purple-600 text-white text-label-sm font-semibold active:scale-[0.97]">
                  Try again
                </button>
              )}
              <button onClick={() => goTo('salaried_methods')} className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 text-label-sm font-medium hover:bg-gray-50">
                Use another method
              </button>
            </div>
          </div>
        );

      /* ── EPFO: Timeout ── */
      case 'epfo_timeout':
        return (
          <div className="p-5">
            <div className="flex flex-col items-center py-3">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-label-md font-semibold text-gray-800">Taking a bit longer…</p>
              <p className="text-caption text-gray-500 text-center mt-1">EPFO verification is in progress. We'll notify you via Email & WhatsApp once done.</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 mb-5">
              <p className="text-caption text-amber-700">You can continue and check the status anytime from the Pending Tasks hub.</p>
            </div>
            <div className="space-y-2">
              <button onClick={onContinue} className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-sm font-semibold active:scale-[0.97] transition-all">
                Back to Pending Tasks
              </button>
              <button onClick={() => goTo('salaried_methods')} className="w-full py-2 text-caption text-gray-400 hover:text-purple-600 transition-colors">
                Try another method
              </button>
            </div>
          </div>
        );

      /* ── AA: Consent ── */
      case 'aa_consent':
        return (
          <div className="p-5">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <p className="text-label-md font-semibold text-gray-800 mb-1">Account Aggregator Consent</p>
            <p className="text-caption text-gray-500 mb-4">Governed by RBI's AA framework. You control what's shared.</p>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2.5">
              <p className="text-caption font-semibold text-gray-600 mb-1">What will be accessed:</p>
              {[{ icon: '💳', text: 'Bank account statements (last 6 months)' }, { icon: '📊', text: 'Salary credits and recurring transactions' }, { icon: '🔒', text: 'Read-only — no payment access' }].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <span className="text-base">{icon}</span>
                  <p className="text-caption text-gray-600">{text}</p>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <p className="text-[10px] text-blue-700">Your consent is valid for this transaction only. Data is not retained post-issuance.</p>
            </div>
            <button onClick={() => goTo('aa_bank')} className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-sm font-semibold active:scale-[0.97] transition-all">
              I consent — proceed
            </button>
          </div>
        );

      /* ── AA: Bank selection ── */
      case 'aa_bank':
        return (
          <div className="p-5">
            <p className="text-label-sm font-semibold text-gray-800 mb-1">Select your bank</p>
            <p className="text-caption text-gray-500 mb-4">You'll authenticate through your bank's AA portal</p>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {[{ id: 'sbi', name: 'State Bank of India', abbr: 'SBI' }, { id: 'hdfc', name: 'HDFC Bank', abbr: 'HDFC' }, { id: 'icici', name: 'ICICI Bank', abbr: 'ICICI' }, { id: 'axis', name: 'Axis Bank', abbr: 'Axis' }, { id: 'kotak', name: 'Kotak Mahindra', abbr: 'Kotak' }, { id: 'other', name: 'Other bank', abbr: '+ More' }].map(({ id, name, abbr }) => (
                <button key={id} onClick={() => setSelectedBank(id)}
                  className={`p-3 rounded-xl border text-left transition-all active:scale-[0.97] ${selectedBank === id ? 'border-purple-400 bg-purple-50' : 'border-gray-100 hover:border-purple-200 bg-gray-50'}`}>
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mb-1.5 shadow-sm">
                    <span className="text-[9px] font-bold text-gray-600">{abbr}</span>
                  </div>
                  <p className="text-[11px] font-medium text-gray-700 leading-tight">{name}</p>
                </button>
              ))}
            </div>
            <button disabled={!selectedBank} onClick={() => goTo('aa_verifying')}
              className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-sm font-semibold disabled:opacity-40 active:scale-[0.97] transition-all">
              Proceed to bank
            </button>
          </div>
        );

      /* ── AA: Verifying ── */
      case 'aa_verifying':
        return (
          <div className="p-8 flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" />
                </svg>
              </div>
            </div>
            <p className="text-label-md font-semibold text-gray-800 mb-1">Connecting to your bank…</p>
            <p className="text-caption text-gray-400 text-center">Securely fetching statement data via AA framework</p>
            <div className="mt-4 space-y-1.5 w-full max-w-xs">
              {['Authenticating…', 'Fetching statements…', 'Analysing income…'].map((t, i) => (
                <motion.div key={t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.9 }} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <p className="text-caption text-gray-400">{t}</p>
                </motion.div>
              ))}
            </div>
          </div>
        );

      /* ── AA: Success ── */
      case 'aa_success':
        return (
          <div className="p-5">
            <div className="flex flex-col items-center py-3">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-label-lg font-bold text-gray-800">Income Verified</p>
              <p className="text-caption text-gray-500 text-center mt-1">Verified via Account Aggregator</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-5 space-y-2">
              {[{ label: 'Method', value: 'Account Aggregator' }, { label: 'Data source', value: 'Bank statements (6 months)' }, { label: 'Status', value: 'Verified ✓' }].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-caption text-gray-400">{label}</span>
                  <span className="text-caption font-medium text-gray-700">{value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => goTo('verified')} className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-sm font-semibold active:scale-[0.97] transition-all">
              Continue
            </button>
          </div>
        );

      /* ── AA: Failure ── */
      case 'aa_failure':
        return (
          <div className="p-5">
            <div className="flex flex-col items-center py-3">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-label-md font-semibold text-gray-800">Couldn't connect to bank</p>
              <p className="text-caption text-gray-500 text-center mt-1">The Account Aggregator connection failed. Please try again or use another method.</p>
            </div>
            <div className="space-y-2.5 mt-2">
              <button onClick={() => goTo('aa_bank')} className="w-full py-3 rounded-xl bg-purple-600 text-white text-label-sm font-semibold active:scale-[0.97]">Try again</button>
              <button onClick={() => goTo('salaried_methods')} className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 text-label-sm font-medium hover:bg-gray-50">Use another method</button>
            </div>
          </div>
        );

      /* ── DOC UPLOAD: Salary slips ── */
      case 'doc_salaried': {
        const months = ['Month 1 (most recent)', 'Month 2', 'Month 3'];
        const allUploaded = months.every((_, i) => uploadedDocs[`sal_${i}`]);
        return (
          <div className="p-5">
            <p className="text-label-sm font-semibold text-gray-800 mb-1">Upload salary slips</p>
            <p className="text-caption text-gray-500 mb-4">Last 3 months. PDF, PNG, or JPEG. Max 10 MB each.</p>
            <div className="space-y-2.5 mb-5">
              {months.map((month, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${uploadedDocs[`sal_${i}`] ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-gray-50'}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${uploadedDocs[`sal_${i}`] ? 'bg-emerald-100' : 'bg-white shadow-sm'}`}>
                    {uploadedDocs[`sal_${i}`]
                      ? <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      : <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-caption font-medium text-gray-700">{month}</p>
                    <p className="text-[10px] text-gray-400">{uploadedDocs[`sal_${i}`] ? 'Uploaded ✓' : 'Not uploaded'}</p>
                  </div>
                  <button onClick={() => toggleDoc(`sal_${i}`)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all active:scale-[0.97] ${uploadedDocs[`sal_${i}`] ? 'bg-red-50 text-red-400 hover:bg-red-100' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
                    {uploadedDocs[`sal_${i}`] ? 'Remove' : 'Upload'}
                  </button>
                </div>
              ))}
            </div>
            <button disabled={!allUploaded} onClick={() => goTo('verified')}
              className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-all">
              Submit for review
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-2">Review typically takes 24–48 hours</p>
          </div>
        );
      }

      /* ── BUSINESS: Method selection ── */
      case 'business_methods':
        return (
          <div className="p-5 space-y-3">
            <p className="text-caption text-gray-400 pb-1">Choose your preferred verification method</p>
            {[
              { id: 'gst', badge: 'Instant', badgeColor: 'bg-emerald-50 text-emerald-600', icon: '🧾', title: 'GST Verification', desc: 'Auto-verify via your GSTIN — takes seconds', onTap: () => goTo('gst_entry') },
              { id: 'upload', badge: '24–48 hrs review', badgeColor: 'bg-orange-50 text-orange-600', icon: '📂', title: 'Upload financial documents', desc: 'ITR last 3 years, Form 16A, or audited P&L', onTap: () => goTo('doc_business') },
            ].map(({ id, badge, badgeColor, icon, title, desc, onTap }) => (
              <button key={id} onClick={onTap} className="w-full flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all active:scale-[0.98] text-left">
                <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-label-sm font-semibold text-gray-800">{title}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                  </div>
                  <p className="text-caption text-gray-400">{desc}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            ))}
          </div>
        );

      /* ── GST: Entry ── */
      case 'gst_entry':
        return (
          <div className="p-5">
            <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-label-sm font-semibold text-gray-800 mb-4">Enter your GST details</p>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-caption text-gray-500 mb-1.5 block">GSTIN (15-digit)</label>
                <input type="text" maxLength={15} value={gstNumber} onChange={e => setGstNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  className="w-full px-3.5 py-3 text-label-sm text-gray-800 border border-gray-200 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all placeholder:text-gray-300 uppercase font-mono tracking-wider" />
                <p className="text-[10px] text-gray-400 mt-1">💡 Demo: enter exactly 15 characters to verify successfully</p>
              </div>
              <div>
                <label className="text-caption text-gray-500 mb-1.5 block">Your ownership percentage</label>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
                  <input type="number" min="1" max="100" value={ownershipPct} onChange={e => setOwnershipPct(e.target.value)}
                    className="flex-1 px-3.5 py-3 text-label-sm text-gray-800 bg-transparent outline-none" />
                  <span className="px-3 py-3 text-label-sm text-gray-500 border-l border-gray-100 bg-gray-50">%</span>
                </div>
              </div>
            </div>
            <button disabled={gstNumber.length < 5} onClick={() => goTo('gst_verifying')}
              className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-all">
              Verify GST
            </button>
          </div>
        );

      /* ── GST: Verifying ── */
      case 'gst_verifying':
        return (
          <div className="p-8 flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full border-4 border-orange-100 border-t-orange-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">🧾</div>
            </div>
            <p className="text-label-md font-semibold text-gray-800 mb-1">Verifying GSTIN…</p>
            <p className="text-caption text-gray-400">Cross-checking with GST portal</p>
          </div>
        );

      /* ── GST: Success ── */
      case 'gst_success':
        return (
          <div className="p-5">
            <div className="flex flex-col items-center py-3">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-label-lg font-bold text-gray-800">GST Verified</p>
              <p className="text-caption text-gray-500 text-center mt-1">Business income verified via GSTIN</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-5 space-y-2">
              {[{ label: 'GSTIN', value: gstNumber }, { label: 'Ownership', value: `${ownershipPct}%` }, { label: 'Status', value: 'Active · Verified ✓' }].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-caption text-gray-400">{label}</span>
                  <span className="text-caption font-medium text-gray-700">{value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => goTo('verified')} className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-sm font-semibold active:scale-[0.97] transition-all">
              Continue
            </button>
          </div>
        );

      /* ── GST: Failure ── */
      case 'gst_failure':
        return (
          <div className="p-5">
            <div className="flex flex-col items-center py-3">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-label-md font-semibold text-gray-800">GSTIN not verified</p>
              <p className="text-caption text-gray-500 text-center mt-1">We couldn't verify this GST number. Check it and retry, or upload documents instead.</p>
            </div>
            <div className="space-y-2.5 mt-2">
              <button onClick={() => goTo('gst_entry')} className="w-full py-3 rounded-xl bg-purple-600 text-white text-label-sm font-semibold active:scale-[0.97]">Try again</button>
              <button onClick={() => goTo('doc_business')} className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 text-label-sm font-medium hover:bg-gray-50">Upload documents instead</button>
            </div>
          </div>
        );

      /* ── DOC UPLOAD: Business / Self-employed ── */
      case 'doc_business':
      case 'doc_self': {
        const docOptions = [
          { key: 'itr', label: 'Income Tax Returns', sublabel: 'Last 3 years (ITR-3 or ITR-4)' },
          { key: 'form16', label: 'Form 16A', sublabel: 'Last 3 years' },
          { key: 'pnl', label: 'Audited P&L Account', sublabel: 'Last 3 years, CA-certified' },
        ];
        const anyUploaded = docOptions.some(d => uploadedDocs[d.key]);
        return (
          <div className="p-5">
            <p className="text-label-sm font-semibold text-gray-800 mb-1">Upload financial documents</p>
            <p className="text-caption text-gray-500 mb-2">Upload any one of the following. PDF or ZIP. Max 20 MB.</p>
            <div className="bg-amber-50 rounded-lg px-3 py-2 mb-4">
              <p className="text-[10px] text-amber-700">Only one document type required — upload whichever is most accessible.</p>
            </div>
            <div className="space-y-2.5 mb-5">
              {docOptions.map(({ key, label, sublabel }) => (
                <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${uploadedDocs[key] ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-gray-50'}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${uploadedDocs[key] ? 'bg-emerald-100' : 'bg-white shadow-sm'}`}>
                    {uploadedDocs[key]
                      ? <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      : <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-caption font-medium text-gray-700">{label}</p>
                    <p className="text-[10px] text-gray-400">{sublabel}</p>
                  </div>
                  <button onClick={() => toggleDoc(key)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all active:scale-[0.97] ${uploadedDocs[key] ? 'bg-red-50 text-red-400 hover:bg-red-100' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
                    {uploadedDocs[key] ? 'Remove' : 'Upload'}
                  </button>
                </div>
              ))}
            </div>
            <button disabled={!anyUploaded} onClick={() => goTo('verified')}
              className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-all">
              Submit for review
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-2">Review typically takes 24–48 hours</p>
          </div>
        );
      }

      /* ── ALL VERIFIED ── */
      case 'verified':
        return (
          <div className="p-5">
            <div className="flex flex-col items-center py-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </motion.div>
              <h3 className="text-heading-sm font-bold text-gray-800 mb-1">Income verified!</h3>
              <p className="text-caption text-gray-500 text-center">Financial details captured. Next up: medical evaluation.</p>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-5">
              <p className="text-caption font-semibold text-purple-700 mb-2.5">What's next</p>
              <div className="space-y-2">
                {[{ icon: '📹', text: '15–20 min video call with a doctor (VMER)' }, { icon: '📋', text: 'Review and confirm your health responses' }, { icon: '🏠', text: 'Home tests may be requested if applicable' }].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5">
                    <span className="text-base">{icon}</span>
                    <p className="text-caption text-purple-700">{text}</p>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={onContinue} className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-label-sm font-semibold active:scale-[0.97] transition-all">
              Start medical evaluation →
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="w-full max-w-sm mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

        {/* Header */}
        <div className={`px-5 py-3.5 flex items-center gap-3 border-b border-gray-100 ${isSuccess ? 'bg-emerald-50' : 'bg-purple-50'}`}>
          {canGoBack && (
            <button onClick={goBack} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
          <p className={`text-label-sm font-semibold flex-1 truncate ${isSuccess ? 'text-emerald-700' : 'text-purple-700'}`}>{getTitle()}</p>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSuccess ? 'bg-emerald-400' : 'bg-purple-400'}`} />
        </div>

        {/* Content — slides per stage */}
        <AnimatePresence mode="wait">
          <motion.div key={stage} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        {!['epfo_verifying', 'aa_verifying', 'gst_verifying', 'verified'].includes(stage) && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <button className="flex items-center gap-1.5 text-caption text-gray-400 hover:text-purple-600 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
              Help
            </button>
            <span className="text-caption text-gray-300">·</span>
            <button className="flex items-center gap-1.5 text-caption text-gray-400 hover:text-purple-600 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              support.life@acko.com
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Pre-Payment Summary — Collapsed, non-editable summary
   shown after payment replaces all pre-payment chat messages
   ═══════════════════════════════════════════════════════ */

const MARITAL_LABELS: Record<string, string> = {
  married: 'Married',
  single: 'Single',
  separated_divorced: 'Separated / Divorced',
  widowed: 'Widowed',
};

const DEPENDENT_LABELS: Record<string, string> = {
  spouse: 'Spouse',
  kids: 'Kids',
  parents: 'Parents',
  parents_in_law: 'Parents-in-law',
  extended_family: 'Extended family',
  none: 'None',
};

export function LifePrePaymentSummary({ defaultCollapsed = true }: { defaultCollapsed?: boolean }) {
  const lw = useT().lifeWidgets;
  const state = useLifeJourneyStore.getState() as LifeJourneyState;
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const formatAmt = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  const rows: { label: string; value: string }[] = [];
  if (state.name) rows.push({ label: lw.summaryNameLabel, value: state.name });
  if (state.gender) rows.push({ label: lw.summaryGenderLabel, value: state.gender === 'male' ? lw.summaryGenderMale : lw.summaryGenderFemale });
  if (state.dateOfBirth) rows.push({ label: 'Date of Birth', value: state.dateOfBirth });
  if (state.age) rows.push({ label: lw.summaryAgeLabel, value: lw.summaryAge(state.age) });
  if (state.maritalStatus) rows.push({ label: 'Marital Status', value: MARITAL_LABELS[state.maritalStatus] || state.maritalStatus });
  if (state.dependentTypes?.length > 0) {
    rows.push({ label: lw.dependentsLabel, value: state.dependentTypes.map(d => DEPENDENT_LABELS[d] || d).join(', ') });
  }
  if (state.annualIncome) rows.push({ label: lw.summaryIncomeLabel, value: formatAmt(state.annualIncome) });
  if (state.selectedCoverage) rows.push({ label: lw.summaryCoverageLabel, value: formatAmt(state.selectedCoverage) });
  if (state.selectedTerm) rows.push({ label: 'Term', value: `${state.selectedTerm} years (till age ${state.age + state.selectedTerm})` });
  if (state.quote?.yearlyPremium) rows.push({ label: lw.summaryPremiumLabel, value: `₹${state.quote.yearlyPremium.toLocaleString('en-IN')}/year` });
  if (state.selectedRiders?.length > 0) {
    rows.push({ label: lw.summaryRidersLabel, value: state.selectedRiders.map(r => r.name).join(', ') });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6"
    >
      <div
        className="rounded-2xl overflow-hidden border border-white/10 backdrop-blur-sm"
        style={{ background: 'var(--app-surface, var(--motor-surface))' }}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Application Summary</p>
              <p className="text-xs text-white/40 mt-0.5">Payment completed &middot; {formatAmt(state.selectedCoverage)} coverage</p>
            </div>
          </div>
          <motion.svg
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ duration: 0.2 }}
            className="w-5 h-5 text-white/40 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </motion.svg>
        </button>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 border-t border-white/8">
                <div className="mt-4 space-y-0">
                  {rows.map((row, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-start py-2.5"
                      style={{ borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                    >
                      <span className="text-xs text-white/40 flex-shrink-0">{row.label}</span>
                      <span className="text-xs font-medium text-white/80 text-right ml-4">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
