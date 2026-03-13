'use client';

import { useState, useRef, useEffect } from 'react';
import type { InputTheme } from './NumberInput';
import { useT } from '../../lib/translations';

const DEFAULT_THEME: InputTheme = {
  inputBg: 'rgba(255,255,255,0.10)',
  inputBorder: 'rgba(255,255,255,0.20)',
  inputBorderFocus: 'rgb(192,132,252)',
  inputText: '#fff',
  inputPlaceholder: 'rgba(255,255,255,0.30)',
  errorColor: 'rgb(248,113,113)',
  buttonBg: 'rgb(109,40,217)',
  buttonText: '#fff',
};

export interface PincodeInputProps {
  placeholder: string;
  onSubmit: (value: string) => void;
  theme?: InputTheme;
  buttonLabel?: string;
}

export default function PincodeInput({
  placeholder,
  onSubmit,
  theme: themeOverrides,
  buttonLabel,
}: PincodeInputProps) {
  const tWidgets = useT().widgets;
  const resolvedButtonLabel = buttonLabel || tWidgets.findHospitals;
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const t = { ...DEFAULT_THEME, ...themeOverrides };

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handleSubmit = () => {
    if (!/^\d{6}$/.test(value)) { setError('Please enter a valid 6-digit pincode'); return; }
    onSubmit(value);
  };

  return (
    <div className="max-w-sm">
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'rgb(192,132,252)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          maxLength={6}
          value={value}
          onChange={(e) => { setValue(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={placeholder}
          className="w-full pl-11 pr-4 py-3.5 rounded-xl text-[15px] focus:outline-none transition-colors backdrop-blur-sm"
          style={{
            background: t.inputBg,
            border: `1px solid ${t.inputBorder}`,
            color: t.inputText,
          }}
          autoFocus
        />
      </div>
      {error && <p className="text-[12px] mt-1.5" style={{ color: t.errorColor }}>{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={value.length !== 6}
        className="mt-3 w-full py-3 rounded-xl text-[15px] font-semibold disabled:opacity-40 transition-all active:scale-[0.97]"
        style={{ background: t.buttonBg, color: t.buttonText }}
      >
        {resolvedButtonLabel}
      </button>
    </div>
  );
}
