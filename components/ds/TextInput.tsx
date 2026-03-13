'use client';

import { motion } from 'framer-motion';
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

export interface TextInputProps {
  placeholder: string;
  defaultValue?: string;
  inputType?: 'text' | 'number' | 'tel';
  maxLength?: number;
  onSubmit: (value: string) => void;
  validate?: (value: string) => string | null;
  theme?: InputTheme;
  buttonLabel?: string;
}

export default function TextInput({
  placeholder,
  defaultValue = '',
  inputType = 'text',
  maxLength,
  onSubmit,
  validate,
  theme: themeOverrides,
  buttonLabel,
}: TextInputProps) {
  const tr = useT();
  const resolvedButtonLabel = buttonLabel || tr.common.continue;
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const t = { ...DEFAULT_THEME, ...themeOverrides };

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handleSubmit = () => {
    if (!value.trim()) { setError(tr.widgets.enterValue); return; }
    if (validate) {
      const err = validate(value.trim());
      if (err) { setError(err); return; }
    } else if (inputType === 'tel' && value.length !== 10) {
      setError(tr.widgets.valid10Digit);
      return;
    }
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
        className="w-full px-4 py-3.5 rounded-xl text-[16px] font-medium focus:outline-none transition-colors"
        style={{
          background: t.inputBg,
          border: `1px solid ${t.inputBorder}`,
          color: t.inputText,
        }}
        autoComplete="off"
        autoFocus
      />
      {error && (
        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] mt-1.5" style={{ color: t.errorColor }}>
          {error}
        </motion.p>
      )}
      <button
        onClick={handleSubmit}
        className="mt-3 w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.97]"
        style={{ background: t.buttonBg, color: t.buttonText, boxShadow: t.buttonShadow }}
      >
        {resolvedButtonLabel}
      </button>
    </div>
  );
}
