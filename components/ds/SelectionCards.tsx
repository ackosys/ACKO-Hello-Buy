'use client';

import { motion } from 'framer-motion';
import { useState, ReactNode } from 'react';

export interface SelectionOption {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  logoUrl?: string;
  badge?: string;
  disabled?: boolean;
}

export interface SelectionTheme {
  surface?: string;
  surfaceSelected?: string;
  surface2?: string;
  border?: string;
  borderSelected?: string;
  text?: string;
  textMuted?: string;
  badgeBg?: string;
  badgeText?: string;
}

const DEFAULT_THEME: SelectionTheme = {
  surface: 'rgba(255,255,255,0.06)',
  surfaceSelected: 'rgba(255,255,255,0.15)',
  surface2: 'rgba(255,255,255,0.10)',
  border: 'rgba(255,255,255,0.10)',
  borderSelected: 'rgb(192,132,252)',
  text: 'rgba(255,255,255,0.9)',
  textMuted: 'rgba(255,255,255,0.4)',
  badgeBg: 'rgb(236,72,153)',
  badgeText: '#fff',
};

export interface SelectionCardsProps {
  options: SelectionOption[];
  onSelect: (id: string) => void;
  renderIcon?: (icon: string, className?: string) => ReactNode;
  renderLogo?: (logoUrl: string, label: string, className?: string) => ReactNode;
  theme?: SelectionTheme;
  /** Force a specific layout instead of auto-detecting */
  layout?: 'grid' | 'list' | 'logo-grid';
  selectDelay?: number;
}

export default function SelectionCards({
  options,
  onSelect,
  renderIcon,
  renderLogo,
  theme: themeOverrides,
  layout,
  selectDelay = 250,
}: SelectionCardsProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const t = { ...DEFAULT_THEME, ...themeOverrides };

  const handleSelect = (id: string) => {
    setSelected(id);
    setTimeout(() => onSelect(id), selectDelay);
  };

  const resolvedLayout = layout
    ?? (options.filter(o => o.logoUrl).length >= 3
      ? 'logo-grid'
      : (options.length <= 4 && options.every(o => o.icon))
        ? 'grid'
        : 'list');

  if (resolvedLayout === 'grid') {
    return (
      <div className="grid grid-cols-2 gap-3 max-w-md">
        {options.map((opt, i) => {
          const isSelected = selected === opt.id;
          return (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => handleSelect(opt.id)}
              className="relative flex flex-col items-center text-center p-5 rounded-2xl border transition-all duration-200 active:scale-[0.96] min-h-[120px] justify-center"
              style={{
                background: isSelected ? t.surfaceSelected : t.surface,
                borderColor: isSelected ? t.borderSelected : t.border,
                boxShadow: isSelected ? '0 10px 15px -3px rgba(88,28,135,0.2)' : undefined,
              }}
            >
              {opt.badge && (
                <span
                  className="absolute -top-2 -right-2 text-[11px] px-2.5 py-0.5 rounded-full font-semibold shadow-sm"
                  style={{ background: t.badgeBg, color: t.badgeText }}
                >
                  {opt.badge}
                </span>
              )}
              <div
                className="mb-2 w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
                style={{ background: t.surface2 }}
              >
                {opt.logoUrl && renderLogo
                  ? renderLogo(opt.logoUrl, opt.label, 'w-7 h-7 object-contain')
                  : renderIcon
                    ? renderIcon(opt.icon!, 'w-6 h-6')
                    : opt.icon && <span className="text-2xl">{opt.icon}</span>}
              </div>
              <span className="text-[15px] font-medium" style={{ color: t.text }}>{opt.label}</span>
              {opt.description && (
                <p className="text-[12px] mt-1" style={{ color: t.textMuted }}>{opt.description}</p>
              )}
            </motion.button>
          );
        })}
      </div>
    );
  }

  if (resolvedLayout === 'logo-grid') {
    const logoOptions = options.filter(o => o.logoUrl);
    const otherOptions = options.filter(o => !o.logoUrl);
    return (
      <div>
        <div className="grid grid-cols-3 gap-2">
          {logoOptions.map((opt, i) => {
            const isSelected = selected === opt.id;
            return (
              <motion.button
                key={opt.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.025 }}
                onClick={() => handleSelect(opt.id)}
                className={`relative flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border transition-all duration-200 active:scale-[0.95] ${
                  isSelected ? 'ring-1 ring-purple-400/30' : ''
                }`}
                style={{
                  background: isSelected ? t.surfaceSelected : t.surface,
                  borderColor: isSelected ? t.borderSelected : t.border,
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden"
                  style={{ background: t.surface2 }}
                >
                  {renderLogo
                    ? renderLogo(opt.logoUrl!, opt.label, 'w-7 h-7 object-contain')
                    : <img src={opt.logoUrl!} alt={opt.label} className="w-7 h-7 object-contain" />}
                </div>
                <span className="text-[11px] font-medium text-center leading-tight" style={{ color: t.text }}>{opt.label}</span>
                {opt.description && (
                  <span className="text-[9px] text-center leading-tight" style={{ color: t.textMuted }}>{opt.description}</span>
                )}
                {isSelected && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
        {otherOptions.map((opt, i) => {
          const isSelected = selected === opt.id;
          return (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (logoOptions.length + i) * 0.025 }}
              onClick={() => handleSelect(opt.id)}
              className="w-full mt-2 text-left px-4 py-3 rounded-xl border transition-all duration-200 active:scale-[0.97]"
              style={{
                background: isSelected ? t.surfaceSelected : t.surface,
                borderColor: isSelected ? t.borderSelected : t.border,
              }}
            >
              <div className="flex items-center gap-3">
                {opt.icon && (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: t.surface2 }}
                  >
                    {renderIcon ? renderIcon(opt.icon, 'w-4 h-4') : <span>{opt.icon}</span>}
                  </div>
                )}
                <span className="text-[13px] font-medium" style={{ color: t.text }}>{opt.label}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  }

  // List layout (default)
  return (
    <div className="grid grid-cols-1 gap-2.5 max-w-md">
      {options.map((opt, i) => {
        const isSelected = selected === opt.id;
        return (
          <motion.button
            key={opt.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => handleSelect(opt.id)}
            disabled={opt.disabled}
            className={`text-left px-4 py-3.5 rounded-xl border transition-all duration-200 active:scale-[0.97] ${opt.disabled ? 'opacity-40' : ''}`}
            style={{
              background: isSelected ? t.surfaceSelected : t.surface,
              borderColor: isSelected ? t.borderSelected : t.border,
              boxShadow: isSelected ? '0 4px 6px -1px rgba(88,28,135,0.2)' : undefined,
            }}
          >
            <div className="flex items-center gap-3">
              {(opt.logoUrl || opt.icon) && (
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ background: t.surface2 }}
                >
                  {opt.logoUrl
                    ? (renderLogo
                      ? renderLogo(opt.logoUrl, opt.label, 'w-6 h-6 object-contain')
                      : <img src={opt.logoUrl} alt={opt.label} className="w-6 h-6 object-contain" />)
                    : (renderIcon
                      ? renderIcon(opt.icon!, 'w-4.5 h-4.5')
                      : <span>{opt.icon}</span>)}
                </div>
              )}
              <div className="flex-1">
                <span className="text-[15px] font-medium" style={{ color: t.text }}>{opt.label}</span>
                {opt.description && <p className="text-[12px] mt-0.5" style={{ color: t.textMuted }}>{opt.description}</p>}
              </div>
              {opt.badge && (
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full border border-purple-400/30"
                  style={{ background: 'rgba(147,51,234,0.5)', color: '#fff' }}
                >
                  {opt.badge}
                </span>
              )}
              {isSelected && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex-shrink-0">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </motion.div>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
