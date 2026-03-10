'use client';

import { motion } from 'framer-motion';
import { useState, ReactNode } from 'react';
import { useT } from '../../lib/translations';

export interface MultiSelectOption {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
}

export interface MultiSelectTheme {
  surface?: string;
  surfaceSelected?: string;
  border?: string;
  borderSelected?: string;
  text?: string;
  checkBg?: string;
  buttonBg?: string;
  buttonText?: string;
}

const DEFAULT_THEME: MultiSelectTheme = {
  surface: 'rgba(255,255,255,0.06)',
  surfaceSelected: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.10)',
  borderSelected: 'rgb(192,132,252)',
  text: 'rgba(255,255,255,0.9)',
  checkBg: 'rgb(168,85,247)',
  buttonBg: 'rgb(109,40,217)',
  buttonText: '#fff',
};

export interface MultiSelectProps {
  options: MultiSelectOption[];
  onSelect: (response: string) => void;
  renderIcon?: (icon: string, className?: string) => ReactNode;
  theme?: MultiSelectTheme;
  confirmLabel?: string;
  /** Columns for grid layout (default: auto-detects 2 or 3) */
  columns?: 2 | 3;
  /** Extra content rendered between grid and confirm button */
  children?: ReactNode;
  /** Controlled selection state (for advanced use cases like children picker) */
  selected?: string[];
  onToggle?: (id: string) => void;
  /** Disable confirm button externally */
  confirmDisabled?: boolean;
}

export default function MultiSelect({
  options,
  onSelect,
  renderIcon,
  theme: themeOverrides,
  confirmLabel,
  columns,
  children,
  selected: controlledSelected,
  onToggle: controlledToggle,
  confirmDisabled,
}: MultiSelectProps) {
  const tCommon = useT().common;
  const resolvedConfirmLabel = confirmLabel || tCommon.continue;
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const selected = controlledSelected ?? internalSelected;

  const toggle = controlledToggle ?? ((id: string) => {
    if (id === 'none') {
      setInternalSelected(prev => prev.includes('none') ? [] : ['none']);
      return;
    }
    setInternalSelected(prev => {
      const without = prev.filter(s => s !== 'none');
      return without.includes(id) ? without.filter(s => s !== id) : [...without, id];
    });
  });

  const t = { ...DEFAULT_THEME, ...themeOverrides };
  const cols = columns ?? (options.length > 6 ? 3 : 2);
  const gridClass = cols === 3 ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-2 gap-2.5';

  return (
    <div className="max-w-md">
      <div className={gridClass}>
        {options.map((opt, i) => {
          const isSelected = selected.includes(opt.id);
          return (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => toggle(opt.id)}
              className={`flex items-center justify-center text-center px-4 rounded-xl border transition-all duration-150 active:scale-[0.97] ${cols === 3 ? 'aspect-[4/3]' : 'py-3.5'}`}
              style={{
                background: isSelected ? t.surfaceSelected : t.surface,
                borderColor: isSelected ? t.borderSelected : t.border,
              }}
            >
              {opt.icon && renderIcon && (
                <div className="mr-2 flex-shrink-0">
                  {renderIcon(opt.icon, 'w-5 h-5')}
                </div>
              )}
              <span className="text-[14px] font-medium" style={{ color: t.text }}>{opt.label}</span>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-2 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: t.checkBg }}
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {children}

      <button
        onClick={() => selected.length > 0 && onSelect(selected.join(','))}
        disabled={selected.length === 0 || confirmDisabled}
        className="mt-4 w-full py-3 rounded-xl text-[15px] font-semibold disabled:opacity-40 transition-all active:scale-[0.97]"
        style={{ background: t.buttonBg, color: t.buttonText }}
      >
        {resolvedConfirmLabel}
      </button>
    </div>
  );
}
