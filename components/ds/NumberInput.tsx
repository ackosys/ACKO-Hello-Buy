'use client';

import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useT } from '../../lib/translations';

export interface InputTheme {
  inputBg?: string;
  inputBorder?: string;
  inputBorderFocus?: string;
  inputText?: string;
  inputPlaceholder?: string;
  errorColor?: string;
  subTextColor?: string;
  buttonBg?: string;
  buttonText?: string;
  buttonShadow?: string;
}

const DEFAULT_THEME: InputTheme = {
  inputBg: 'rgba(255,255,255,0.10)',
  inputBorder: 'rgba(255,255,255,0.20)',
  inputBorderFocus: 'rgb(192,132,252)',
  inputText: '#fff',
  inputPlaceholder: 'rgba(255,255,255,0.30)',
  errorColor: 'rgb(248,113,113)',
  subTextColor: 'rgba(255,255,255,0.40)',
  buttonBg: 'rgb(109,40,217)',
  buttonText: '#fff',
};

export interface NumberInputProps {
  placeholder: string;
  subText?: string;
  inputType?: 'text' | 'number' | 'tel';
  min?: number;
  max?: number;
  onSubmit: (value: string) => void;
  theme?: InputTheme;
  buttonLabel?: string;
  formatDisplay?: (value: string) => string;
}

export default function NumberInput({
  placeholder,
  subText,
  inputType = 'number',
  min,
  max,
  onSubmit,
  theme: themeOverrides,
  buttonLabel,
  formatDisplay,
}: NumberInputProps) {
  const tr = useT();
  const resolvedButtonLabel = buttonLabel || tr.common.continue;
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const t = { ...DEFAULT_THEME, ...themeOverrides };

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handleSubmit = () => {
    if (!value.trim()) { setError(tr.widgets.enterValue); return; }
    if (inputType === 'number' || inputType === 'tel') {
      const num = parseFloat(value);
      if (isNaN(num)) { setError(tr.widgets.validNumber); return; }
      if (min !== undefined && num < min) { setError(tr.widgets.minValue(min)); return; }
      if (max !== undefined && num > max) { setError(tr.widgets.maxValue(max)); return; }
    }
    onSubmit(value.trim());
  };

  return (
    <div className="max-w-sm">
      <div className="relative">
        <input
          ref={inputRef}
          type={inputType === 'tel' ? 'tel' : inputType === 'number' ? 'tel' : 'text'}
          inputMode={inputType === 'number' || inputType === 'tel' ? 'numeric' : 'text'}
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={placeholder}
          className="w-full px-4 py-3.5 rounded-xl text-[16px] font-medium focus:outline-none transition-colors"
          style={{
            background: t.inputBg,
            border: `1px solid ${t.inputBorder}`,
            color: t.inputText,
          }}
          autoFocus
        />
        {value && formatDisplay && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: 'rgba(192,132,252,0.7)' }}>
            {formatDisplay(value)}
          </div>
        )}
      </div>
      {subText && <p className="text-[12px] mt-1.5" style={{ color: t.subTextColor }}>{subText}</p>}
      {error && (
        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] mt-1" style={{ color: t.errorColor }}>
          {error}
        </motion.p>
      )}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        onClick={handleSubmit}
        className="mt-3 w-full py-3 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.97]"
        style={{ background: t.buttonBg, color: t.buttonText, boxShadow: t.buttonShadow }}
      >
        {resolvedButtonLabel}
      </motion.button>
    </div>
  );
}
