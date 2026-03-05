'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Option, JourneyState, PlanTier } from '../lib/types';
import { formatCurrency, getPlanDetails, NEARBY_LABS, FEATURE_EXPLANATIONS } from '../lib/plans';
import { useJourneyStore } from '../lib/store';
import { useT } from '../lib/translations';
import { assetPath } from '../lib/assetPath';

/* ═══════════════════════════════════════════════════════
   SVG Icon System — replaces emojis with clean icons
   ═══════════════════════════════════════════════════════ */

const ICON_PATHS: Record<string, string> = {
  search: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
  compare: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
  check: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  check_circle: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  user: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  heart: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
  child: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  father: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  mother: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  building: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
  document: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  plus: 'M12 4.5v15m7.5-7.5h-15',
  forward: 'M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z',
  star: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
  sunrise: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
  sun: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
  sunset: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
  shield: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  shield_search: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  switch: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
  chat_bubble: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z',
  info: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
  clock: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  help: 'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827m0 0v.75m0-3.75h.008v.008H12v-.008z',
  pill: 'M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m4.5 7.795L12 12m0 0L7.5 4.205',
  refresh: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.66v4.993',
  hospital: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z',
  upload: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5',
};

function OptionIcon({ icon, className = 'w-6 h-6' }: { icon: string; className?: string }) {
  const path = ICON_PATHS[icon];
  if (!path) {
    // Fallback: if it's an emoji string (single char or short), render as text
    return <span className="text-2xl">{icon}</span>;
  }
  return (
    <svg className={`${className} text-purple-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   Disease Icons — SVG icons for pre-existing conditions
   ═══════════════════════════════════════════════════════ */

const DISEASE_ICONS: Record<string, JSX.Element> = {
  diabetes: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
  hypertension: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>,
  thyroid: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>,
  asthma: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  heart_condition: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3.5 12h3l2-3 3 6 2-3h3" /></svg>,
  none: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

function getDiseaseIcon(optionId: string): JSX.Element | null {
  const id = optionId.toLowerCase();
  if (id.includes('diabet')) return DISEASE_ICONS.diabetes;
  if (id.includes('hyper') || id.includes('bp') || id.includes('blood_pressure')) return DISEASE_ICONS.hypertension;
  if (id.includes('thyroid')) return DISEASE_ICONS.thyroid;
  if (id.includes('asthma') || id.includes('respiratory')) return DISEASE_ICONS.asthma;
  if (id.includes('heart') || id.includes('cardiac')) return DISEASE_ICONS.heart_condition;
  if (id.includes('none') || id.includes('no_')) return DISEASE_ICONS.none;
  return null;
}

/* ═══════════════════════════════════════════════════════
   Selection Cards — Dark-themed visual cards on purple bg
   Grid layout with SVG icons & frosted glass
   ═══════════════════════════════════════════════════════ */

export function SelectionCards({ options, onSelect }: { options: Option[]; onSelect: (id: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const useGrid = options.length <= 4 && options.every(o => o.icon);

  const handleSelect = (id: string) => {
    setSelected(id);
    setTimeout(() => onSelect(id), 250);
  };

  if (useGrid) {
    return (
      <div className="grid grid-cols-2 gap-3 max-w-md">
        {options.map((opt, i) => {
          const diseaseIcon = getDiseaseIcon(opt.id);
          return (
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
                <span className="absolute -top-2 -right-2 text-label-sm bg-pink-500 text-white px-2.5 py-0.5 rounded-full font-semibold shadow-sm">
                  {opt.badge}
                </span>
              )}
              <div className="mb-2 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                {diseaseIcon ? <div className="text-purple-300">{diseaseIcon}</div> : <OptionIcon icon={opt.icon!} className="w-6 h-6 !text-purple-300" />}
              </div>
              <span className="text-body-md font-medium text-white/90">{opt.label}</span>
              {opt.description && (
                <p className="text-caption text-white/40 mt-1">{opt.description}</p>
              )}
            </motion.button>
          );
        })}
      </div>
    );
  }

  // List layout for more options — dark glass style
  return (
    <div className="grid grid-cols-1 gap-2.5 max-w-md">
      {options.map((opt, i) => {
        const diseaseIcon = getDiseaseIcon(opt.id);
        return (
          <motion.button
            key={opt.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => handleSelect(opt.id)}
            disabled={opt.disabled}
            className={`
              text-left px-4 py-3.5 rounded-xl border transition-all duration-200 active:scale-[0.97]
              ${selected === opt.id
                ? 'border-purple-400 bg-white/15 shadow-md shadow-purple-900/20'
                : 'border-white/10 bg-white/6 hover:bg-white/12 hover:border-white/20'
              }
              ${opt.disabled ? 'opacity-40' : ''}
            `}
          >
            <div className="flex items-center gap-3">
              {diseaseIcon ? (
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-purple-300">{diseaseIcon}</div>
              ) : opt.icon ? (
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <OptionIcon icon={opt.icon} className="w-4.5 h-4.5 !text-purple-300" />
                </div>
              ) : null}
              <div className="flex-1">
                <span className="text-body-md font-medium text-white/90">{opt.label}</span>
                {opt.description && <p className="text-caption text-white/40 mt-0.5">{opt.description}</p>}
              </div>
              {opt.badge && (
                <span className="text-label-sm bg-purple-500/50 text-white px-2 py-0.5 rounded-full border border-purple-400/30">{opt.badge}</span>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Multi Select — Visual grid for few items, list for many
   ═══════════════════════════════════════════════════════ */

export function MultiSelect({ options, onSelect }: { options: Option[]; onSelect: (ids: string[]) => void }) {
  const t = useT();
  const [selected, setSelected] = useState<string[]>([]);
  const [showChildrenPicker, setShowChildrenPicker] = useState(false);
  const [numChildren, setNumChildren] = useState<number | null>(null);
  // ≤6 options with icons → 2-col icon grid (family member style)
  // >6 options → 3-col compact grid (motor car-selection style)
  const useGrid = options.length <= 6 && options.every(o => o.icon);
  const use3ColGrid = options.length > 6;
  const hasChildrenOption = options.some(o => o.id === 'children');

  const toggle = (id: string) => {
    if (id === 'none') { setSelected(['none']); return; }
    if (id === 'children' && hasChildrenOption) {
      const isCurrentlySelected = selected.some(s => s.startsWith('children'));
      if (isCurrentlySelected) {
        // Deselect: remove children entry and collapse picker
        setSelected(prev => prev.filter(s => !s.startsWith('children')));
        setNumChildren(null);
        setShowChildrenPicker(false);
      } else {
        // Select: mark as selected (pending count) and expand picker
        setSelected(prev => [...prev.filter(s => s !== 'none' && !s.startsWith('children')), 'children']);
        setShowChildrenPicker(true);
      }
      return;
    }
    setSelected(prev => {
      const without = prev.filter(s => s !== 'none');
      return without.includes(id) ? without.filter(s => s !== id) : [...without, id];
    });
  };

  const confirmChildren = (count: number) => {
    setNumChildren(count);
    setShowChildrenPicker(false);
    // Replace placeholder 'children' with encoded 'children:N'
    setSelected(prev => [...prev.filter(s => !s.startsWith('children')), `children:${count}`]);
  };

  // True whether we have a placeholder 'children' (picker open) or a confirmed 'children:N'
  const isChildrenSelected = selected.some(s => s === 'children' || s.startsWith('children:'));

  return (
    <div className="max-w-md">
      <div className={use3ColGrid ? 'grid grid-cols-3 gap-2' : useGrid ? 'grid grid-cols-2 gap-2.5' : 'grid grid-cols-2 gap-2'}>
        {options.map((opt, i) => {
          const diseaseIcon = getDiseaseIcon(opt.id);
          const isSelected = opt.id === 'children' ? isChildrenSelected : selected.includes(opt.id);

          if (use3ColGrid) {
            return (
              <motion.button
                key={opt.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.025 }}
                onClick={() => toggle(opt.id)}
                className={`
                  relative flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border transition-all duration-150 active:scale-[0.95]
                  ${isSelected ? 'border-purple-400' : 'border-white/10'}
                `}
                style={{ background: isSelected ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)' }}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isSelected ? 'bg-purple-500/30' : 'bg-white/8'}`}>
                  {diseaseIcon
                    ? <div className="text-purple-300">{diseaseIcon}</div>
                    : opt.icon
                      ? <OptionIcon icon={opt.icon} className="w-5 h-5 !text-purple-300" />
                      : <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                  }
                </div>
                <span className="text-[11px] font-medium text-center leading-tight text-white/90">{opt.label}</span>
                {isSelected && (
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
              </motion.button>
            );
          }

          return (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => toggle(opt.id)}
              className={`
                ${useGrid ? 'flex flex-col items-center text-center p-4 rounded-xl' : 'flex items-center gap-2.5 p-3 rounded-xl text-left'}
                border transition-all duration-150 active:scale-[0.97]
                ${isSelected
                  ? 'border-purple-400 bg-white/15'
                  : 'border-white/10 bg-white/6 hover:bg-white/10'
                }
              `}
            >
              {useGrid && (
                <div className={`mb-1.5 w-9 h-9 rounded-lg flex items-center justify-center ${isSelected ? 'bg-purple-500/30' : 'bg-white/10'}`}>
                  {diseaseIcon ? <div className="text-purple-300">{diseaseIcon}</div> : opt.icon ? <OptionIcon icon={opt.icon} className="w-5 h-5 !text-purple-300" /> : null}
                </div>
              )}
              {!useGrid && (
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-purple-500/30' : 'bg-white/10'}`}>
                  {diseaseIcon ? <div className="text-purple-300">{diseaseIcon}</div> : opt.icon ? <OptionIcon icon={opt.icon} className="w-4 h-4 !text-purple-300" /> : null}
                </div>
              )}
              <span className="text-body-sm text-white/90 font-medium">{opt.label}</span>
              {opt.id === 'children' && isChildrenSelected && numChildren ? (
                <span className="text-[11px] text-purple-300 mt-0.5">{numChildren} {numChildren === 1 ? 'child' : 'children'}</span>
              ) : null}
              {isSelected && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Inline children count picker — slides in below the grid, no overlay */}
      <AnimatePresence>
        {showChildrenPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="overflow-hidden"
          >
            <div className="pt-4 pb-1">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[14px] font-semibold text-white">How many children?</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--app-text-muted, rgba(255,255,255,0.45))' }}>Each one will be covered</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {[1, 2, 3, 4].map(count => (
                  <motion.button
                    key={count}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: count * 0.04 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => confirmChildren(count)}
                    className="py-3.5 rounded-xl text-[20px] font-bold transition-all border border-white/10 bg-white/6 hover:bg-white/12 text-white"
                  >
                    {count}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => selected.length > 0 && onSelect(selected)}
        disabled={selected.length === 0 || showChildrenPicker}
        className="mt-4 w-full py-3 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-label-lg font-semibold disabled:opacity-40 transition-all active:scale-[0.97]"
      >
        {t.common.continue}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Number / Text Input
   ═══════════════════════════════════════════════════════ */

export function NumberInput({ placeholder, subText, inputType = 'number', min, max, onSubmit }: {
  placeholder: string; subText?: string; inputType?: 'text' | 'number' | 'tel'; min?: number; max?: number; onSubmit: (value: string) => void;
}) {
  const t = useT();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (inputType === 'number' || inputType === 'tel') {
      const num = parseInt(value);
      if (isNaN(num)) { setError(t.widgets.validNumber); return; }
      if (min !== undefined && num < min) { setError(t.widgets.minValue(min)); return; }
      if (max !== undefined && num > max) { setError(t.widgets.maxValue(max)); return; }
    }
    if (!value.trim()) { setError(t.widgets.required); return; }
    onSubmit(value.trim());
  };

  return (
    <div className="max-w-sm">
      <input
        type={inputType === 'tel' ? 'tel' : inputType === 'number' ? 'tel' : 'text'}
        inputMode={inputType === 'number' || inputType === 'tel' ? 'numeric' : 'text'}
        value={value}
        onChange={(e) => { setValue(e.target.value); setError(''); }}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder={placeholder}
        className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-body-md text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400 focus:bg-white/15 transition-colors backdrop-blur-sm"
        autoFocus
      />
      {subText && <p className="text-caption text-white/40 mt-1.5">{subText}</p>}
      {error && <p className="text-caption text-red-400 mt-1">{error}</p>}
      <button onClick={handleSubmit} className="mt-3 w-full py-3 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-label-lg font-semibold transition-colors active:scale-[0.97]">
        {t.common.continue}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Pincode Input
   ═══════════════════════════════════════════════════════ */

export function PincodeInput({ placeholder, onSubmit }: { placeholder: string; onSubmit: (value: string) => void }) {
  const t = useT();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!/^\d{6}$/.test(value)) { setError('Please enter a valid 6-digit pincode'); return; }
    onSubmit(value);
  };

  return (
    <div className="max-w-sm">
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        <input
          type="tel" inputMode="numeric" maxLength={6} value={value}
          onChange={(e) => { setValue(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={placeholder}
          className="w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-body-md text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400 focus:bg-white/15 transition-colors backdrop-blur-sm"
          autoFocus
        />
      </div>
      {error && <p className="text-caption text-red-400 mt-1.5">{error}</p>}
      <button onClick={handleSubmit} disabled={value.length !== 6}
        className="mt-3 w-full py-3 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-label-lg font-semibold disabled:opacity-40 transition-all active:scale-[0.97]">
        {t.widgets.findHospitals}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PDF Upload — for gap analysis policy upload
   Simulates extracting data from the PDF and auto-populates state
   ═══════════════════════════════════════════════════════ */

export function PdfUpload({ onUpload }: { onUpload: () => void }) {
  const t = useT();
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'extracting' | 'done'>('idle');
  const [fileName, setFileName] = useState('');
  const updateState = useJourneyStore(s => s.updateState);
  const existingName = useJourneyStore(s => s.userName);

  const handleFile = (file: File | null) => {
    if (!file) return;
    setFileName(file.name);
    setPhase('extracting');

    // Simulate PDF extraction with realistic delay
    setTimeout(() => {
      // Simulate extracted data from the policy document
      const extractedData: Partial<JourneyState> = {
        // Only update name if user hasn't provided one yet
        ...((!existingName || existingName === 'there') ? { userName: 'Aayush' } : {}),
        existingInsurer: 'care_health',
        totalExistingCover: 500000,
        gmcAmount: 500000,
        coverageStatus: 'individual_policy',
        // Add extracted policy details for display
        pdfExtractedData: {
          holderName: existingName || 'Aayush',
          insurer: 'Care Health Insurance',
          planName: 'Care Advantage',
          sumInsured: '₹5,00,000',
          policyNumber: 'CH-2024-7839201',
          members: ['Self (32 yrs)', 'Spouse (30 yrs)'],
          renewalDate: '15 Aug 2026',
          roomRentLimit: '₹5,000/day',
          waitingPeriod: '3 years for pre-existing',
          copay: '10% for age 50+',
          consumablesCovered: false,
          restoreBenefit: false,
          noClaimBonus: '10% per year',
        },
      };
      updateState(extractedData as any);
      setPhase('done');
      setTimeout(() => onUpload(), 800);
    }, 2500);
  };

  return (
    <div className="w-full">
      {phase === 'idle' && (
        <div
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
            dragging
              ? 'border-purple-500 bg-purple-50'
              : 'border-onyx-300 bg-white hover:border-purple-400 hover:bg-purple-50/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0] || null);
          }}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pdf';
            input.onchange = (e) => handleFile((e.target as HTMLInputElement).files?.[0] || null);
            input.click();
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
              <OptionIcon icon="upload" className="w-7 h-7" />
            </div>
            <div>
              <p className="text-label-md text-onyx-800 font-semibold">
                {t.widgets.dropPdf}
              </p>
              <p className="text-body-sm text-onyx-500 mt-1">
                {t.widgets.orBrowse}
              </p>
            </div>
            <p className="text-caption text-onyx-400">
              {t.widgets.pdfFormat}
            </p>
          </div>
        </div>
      )}

      {phase === 'extracting' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-purple-50 border border-purple-200 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-label-md text-purple-800 font-semibold">{t.widgets.analysingPolicy}</p>
              <p className="text-body-sm text-purple-600 truncate">{fileName}</p>
            </div>
          </div>
          <div className="space-y-2">
            {[t.widgets.readingDetails, t.widgets.extractingCoverage, t.widgets.identifyingGaps].map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.8 }}
                className="flex items-center gap-2 text-body-sm text-purple-700"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.8 + 0.4 }}
                >
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </motion.div>
                {step}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {phase === 'done' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-green-200 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-label-md text-green-800 font-semibold">{t.widgets.policyAnalysed}</p>
            <p className="text-body-sm text-green-600 truncate">{fileName}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Gap Results — Rich visual gap analysis UI
   ═══════════════════════════════════════════════════════ */

interface GapItem {
  label: string;
  yourPlan: string;
  acko: string;
  status: 'gap' | 'ok' | 'warning';
  explanation: string;
}

const GAP_ANALYSIS_ITEMS: GapItem[] = [
  {
    label: 'Room rent',
    yourPlan: 'Capped at ₹5,000/day',
    acko: 'No limit',
    status: 'gap',
    explanation: 'Private rooms in good hospitals cost ₹15,000-25,000/day. With a cap, you pay the difference from your pocket.',
  },
  {
    label: 'Consumables',
    yourPlan: 'Not covered',
    acko: '100% covered',
    status: 'gap',
    explanation: 'Gloves, PPE kits, syringes, implants add ₹15,000-50,000 per surgery. Most policies exclude these.',
  },
  {
    label: 'Inflation Protect',
    yourPlan: 'Not available',
    acko: '+10% SI/year',
    status: 'gap',
    explanation: 'Medical inflation is 14% annually. ACKO increases your sum insured by 10% every year automatically at no extra cost, so your cover keeps pace with rising costs.',
  },
  {
    label: 'Co-payment',
    yourPlan: '10% for 50+ age',
    acko: 'Zero co-pay',
    status: 'warning',
    explanation: 'Co-payment means you share a percentage of every claim bill. On a ₹10L bill, 10% means ₹1L from your pocket.',
  },
  {
    label: 'Pre-existing waiting',
    yourPlan: '3 years',
    acko: '3 years (credits transfer)',
    status: 'warning',
    explanation: 'Time already served with your current insurer carries over when you switch to ACKO.',
  },
  {
    label: 'Cashless hospitals',
    yourPlan: '5,200+ hospitals',
    acko: '14,000+ hospitals',
    status: 'ok',
    explanation: 'More cashless hospitals means more choices for treatment without upfront payment.',
  },
  {
    label: 'No-claim bonus',
    yourPlan: '10% per year',
    acko: 'Up to 100% (carries over)',
    status: 'ok',
    explanation: 'Your existing no-claim bonus transfers to ACKO, so you don\'t lose what you\'ve earned.',
  },
];

export function GapResultsWidget({ onContinue }: { onContinue: () => void }) {
  const t = useT();
  const [expanded, setExpanded] = useState<number | null>(null);
  const pdfData = useJourneyStore(s => (s as any).pdfExtractedData);
  const existingInsurer = useJourneyStore(s => s.existingInsurer);
  const totalCover = useJourneyStore(s => s.totalExistingCover);
  const userName = useJourneyStore(s => s.userName);

  const insurerLabel = pdfData?.insurer || existingInsurer?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Your insurer';
  const siLabel = pdfData?.sumInsured || (totalCover ? `₹${(totalCover / 100000).toFixed(0)} Lakhs` : '—');
  const gapCount = GAP_ANALYSIS_ITEMS.filter(g => g.status === 'gap').length;

  return (
    <div className="w-full space-y-4">
      {/* Extracted Policy Summary Card */}
      {pdfData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-onyx-200 rounded-2xl overflow-hidden shadow-sm"
        >
          <div className="bg-onyx-100 px-5 py-3 border-b border-onyx-200 flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <OptionIcon icon="document" className="w-4 h-4" />
            </div>
            <div>
              <p className="text-label-sm text-onyx-500">{t.widgets.extractedFromPolicy}</p>
              <p className="text-label-md text-onyx-800 font-semibold">{insurerLabel} — {pdfData.planName}</p>
            </div>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {[
              [t.widgets.policyHolder, pdfData.holderName || userName],
              [t.widgets.sumInsured, siLabel],
              [t.widgets.members, pdfData.members?.join(', ') || '—'],
              [t.widgets.renewalDate, pdfData.renewalDate || '—'],
              [t.widgets.policyNo, pdfData.policyNumber || '—'],
              [t.widgets.ncb, pdfData.noClaimBonus || '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-caption text-onyx-400">{label}</p>
                <p className="text-label-sm text-onyx-800 font-medium">{value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Gap Score */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-2xl p-5"
      >
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#fecaca" strokeWidth="3" />
              <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray={`${(gapCount / GAP_ANALYSIS_ITEMS.length) * 100}, 100`} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-heading-sm text-red-700 font-bold">{gapCount}</span>
            </div>
          </div>
          <div>
            <p className="text-label-lg text-red-800 font-bold">
              {t.widgets.coverageGapsFound(gapCount)}
            </p>
            <p className="text-body-sm text-red-600 mt-0.5">
              {t.widgets.gapCostWarning}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white border border-onyx-200 rounded-2xl overflow-hidden shadow-sm"
      >
        {/* Header */}
        <div className="grid grid-cols-[1fr_1fr_1fr] bg-onyx-100 border-b border-onyx-200 px-4 py-3">
          <p className="text-label-sm text-onyx-500 font-medium">{t.widgets.feature}</p>
          <p className="text-label-sm text-onyx-500 font-medium text-center">{t.widgets.yourPlan}</p>
          <p className="text-label-sm text-purple-600 font-semibold text-center">{t.widgets.acko}</p>
        </div>

        {/* Rows */}
        {GAP_ANALYSIS_ITEMS.map((item, i) => (
          <div key={i}>
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full grid grid-cols-[1fr_1fr_1fr] px-4 py-3.5 border-b border-onyx-100 hover:bg-onyx-50 transition-colors items-center text-left"
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  item.status === 'gap' ? 'bg-red-500' : item.status === 'warning' ? 'bg-amber-500' : 'bg-green-500'
                }`} />
                <span className="text-label-sm text-onyx-800 font-medium">{item.label}</span>
              </div>
              <p className={`text-label-sm text-center ${
                item.status === 'gap' ? 'text-red-600' : item.status === 'warning' ? 'text-amber-600' : 'text-onyx-600'
              }`}>
                {item.yourPlan}
              </p>
              <p className="text-label-sm text-purple-700 font-medium text-center">{item.acko}</p>
            </button>

            <AnimatePresence>
              {expanded === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className={`px-4 py-3 text-body-sm border-b ${
                    item.status === 'gap' ? 'bg-red-50 text-red-700 border-red-100' :
                    item.status === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-green-50 text-green-700 border-green-100'
                  }`}>
                    {item.explanation}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </motion.div>

      {/* Real-world impact */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-purple-50 border border-purple-200 rounded-2xl p-5"
      >
        <p className="text-label-md text-purple-800 font-semibold mb-2">{t.widgets.realWorldImpact}</p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <OptionIcon icon="hospital" className="w-4 h-4" />
            </div>
            <div>
              <p className="text-label-sm text-purple-800 font-medium">{t.widgets.cardiacSurgery}</p>
              <p className="text-body-sm text-purple-600">{t.widgets.totalBill}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3 border border-red-200">
              <p className="text-caption text-onyx-500">{t.widgets.withCurrentPlan}</p>
              <p className="text-heading-sm text-red-600 font-bold">₹4-7L</p>
              <p className="text-caption text-red-500">{t.widgets.outOfPocket}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-green-200">
              <p className="text-caption text-onyx-500">{t.widgets.withAckoPlatinum}</p>
              <p className="text-heading-sm text-green-600 font-bold">₹0</p>
              <p className="text-caption text-green-500">{t.widgets.fullyCovered}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        onClick={onContinue}
        className="w-full py-3.5 bg-purple-600 text-white rounded-xl text-label-lg font-semibold hover:bg-purple-700 transition-all active:scale-[0.97]"
      >
        {t.widgets.findRightPlan}
      </motion.button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Confirm Details — pre-filled data from PDF for user to confirm/edit
   ═══════════════════════════════════════════════════════ */

const FAMILY_OPTIONS = [
  { id: 'self', labelKey: 'myself' as const },
  { id: 'spouse', labelKey: 'spouse' as const },
  { id: 'children', labelKey: 'children' as const },
  { id: 'father', labelKey: 'father' as const },
  { id: 'mother', labelKey: 'mother' as const },
];

export function ConfirmDetailsWidget({ onConfirm }: { onConfirm: () => void }) {
  const t = useT();
  const members = useJourneyStore(s => s.members);
  const pincode = useJourneyStore(s => s.pincode);
  const coverageFor = useJourneyStore(s => s.coverageFor);
  const updateState = useJourneyStore(s => s.updateState);
  const userName = useJourneyStore(s => s.userName);

  const [selectedFamily, setSelectedFamily] = useState<string[]>(coverageFor.length ? coverageFor : ['self', 'spouse']);
  const [selfAge, setSelfAge] = useState(String(members.find(m => m.relation === 'self')?.age || 32));
  const [elderAge, setElderAge] = useState(String(members.find(m => m.relation !== 'self')?.age || 30));
  const [pin, setPin] = useState(pincode || '560001');

  const toggleFamily = (id: string) => {
    setSelectedFamily(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const selfMember = { id: 'self', relation: 'self' as const, name: 'You', age: parseInt(selfAge) || 32, conditions: [] };
    const others = selectedFamily.filter(f => f !== 'self');
    const otherMembers = others.map((rel, i) => ({
      id: rel,
      relation: rel as any,
      name: rel.charAt(0).toUpperCase() + rel.slice(1),
      age: i === 0 ? (parseInt(elderAge) || 30) : Math.max(1, (parseInt(elderAge) || 30) - 5 * i),
      conditions: [],
    }));
    const { getHospitalCount } = require('../lib/plans');

    updateState({
      coverageFor: selectedFamily,
      members: [selfMember, ...otherMembers],
      hasSenior: parseInt(selfAge) >= 45 || parseInt(elderAge) >= 45,
      pincode: pin,
      nearbyHospitals: getHospitalCount(pin),
    });
    onConfirm();
  };

  const hasOthers = selectedFamily.some(f => f !== 'self');

  return (
    <div className="w-full space-y-4">
      <div className="bg-white border border-onyx-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-purple-50 px-5 py-3 border-b border-purple-100">
          <p className="text-label-md text-purple-800 font-semibold">{t.widgets.detailsFromPolicy}</p>
          <p className="text-caption text-purple-600">{t.widgets.tapToEdit}</p>
        </div>

        {/* Name */}
        <div className="px-5 py-4 border-b border-onyx-100">
          <p className="text-caption text-onyx-400 mb-1">{t.widgets.name}</p>
          <p className="text-label-md text-onyx-800 font-medium">{userName || 'Aayush'}</p>
        </div>

        {/* Family members — toggle chips */}
        <div className="px-5 py-4 border-b border-onyx-100">
          <p className="text-caption text-onyx-400 mb-2">{t.widgets.whoToCover}</p>
          <div className="flex flex-wrap gap-2">
            {FAMILY_OPTIONS.map(opt => {
              const isSelected = selectedFamily.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleFamily(opt.id)}
                  className={`px-3.5 py-2 rounded-xl text-label-sm font-medium transition-all border ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-onyx-600 border-onyx-300 hover:border-purple-300'
                  }`}
                >
                  {t.widgets[opt.labelKey]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ages */}
        <div className="px-5 py-4 border-b border-onyx-100 grid grid-cols-2 gap-4">
          <div>
            <p className="text-caption text-onyx-400 mb-1.5">Your age</p>
            <input
              type="number"
              value={selfAge}
              onChange={e => setSelfAge(e.target.value)}
              className="w-full px-3 py-2.5 border border-onyx-300 rounded-xl text-label-md text-onyx-800 focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>
          {hasOthers && (
            <div>
              <p className="text-caption text-onyx-400 mb-1.5">{t.widgets.eldestAge}</p>
              <input
                type="number"
                value={elderAge}
                onChange={e => setElderAge(e.target.value)}
                className="w-full px-3 py-2.5 border border-onyx-300 rounded-xl text-label-md text-onyx-800 focus:border-purple-500 focus:outline-none transition-colors"
              />
            </div>
          )}
        </div>

        {/* Pincode */}
        <div className="px-5 py-4">
          <p className="text-caption text-onyx-400 mb-1.5">{t.widgets.pincode}</p>
          <input
            type="tel"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full px-3 py-2.5 border border-onyx-300 rounded-xl text-label-md text-onyx-800 focus:border-purple-500 focus:outline-none transition-colors"
            placeholder={t.widgets.enterPincode}
          />
        </div>
      </div>

      <button
        onClick={handleConfirm}
        disabled={selectedFamily.length === 0 || pin.length !== 6}
        className="w-full py-3.5 bg-purple-600 text-white rounded-xl text-label-lg font-semibold hover:bg-purple-700 disabled:opacity-40 transition-all active:scale-[0.97]"
      >
        {t.widgets.confirmAndContinue}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Hospital List — visual cards with names
   ═══════════════════════════════════════════════════════ */

const HOSPITALS_NEARBY = [
  { name: 'Apollo Hospital', type: 'Multi-speciality', image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=120&h=80&fit=crop', distance: '2.1 km' },
  { name: 'Fortis Healthcare', type: 'Super-speciality', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=120&h=80&fit=crop', distance: '3.5 km' },
  { name: 'Max Healthcare', type: 'Multi-speciality', image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=120&h=80&fit=crop', distance: '4.2 km' },
  { name: 'Manipal Hospital', type: 'Multi-speciality', image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=120&h=80&fit=crop', distance: '5.8 km' },
  { name: 'AIIMS', type: 'Government', image: 'https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?w=120&h=80&fit=crop', distance: '7.1 km' },
];

export function HospitalList({ onContinue }: { onContinue: () => void }) {
  const t = useT();
  const nearbyHospitals = useJourneyStore(s => s.nearbyHospitals);
  const [showAll, setShowAll] = useState(false);

  return (
    <div className="max-w-md">
      {/* Visual hospital banner */}
      <div className="relative rounded-2xl overflow-hidden mb-3">
        <img src="https://images.unsplash.com/photo-1551190822-a9ce113ac100?w=600&h=160&fit=crop" alt="Hospitals" className="w-full h-28 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <p className="text-white font-semibold text-sm">{t.widgets.cashlessHospitalsNear(nearbyHospitals || 0)}</p>
          <p className="text-white/60 text-xs">{t.widgets.walkInGetTreated}</p>
        </div>
      </div>

      <div className="bg-white/8 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
        <div className="divide-y divide-white/5">
          {(showAll ? HOSPITALS_NEARBY : HOSPITALS_NEARBY.slice(0, 3)).map((h, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                <img src={h.image} alt={h.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-white/90">{h.name}</p>
                <p className="text-caption text-white/40">{h.type}</p>
              </div>
              <span className="text-caption text-purple-300 flex-shrink-0">{h.distance}</span>
            </motion.div>
          ))}
        </div>
        {!showAll && (
          <button onClick={() => setShowAll(true)} className="w-full py-2.5 text-label-md text-purple-300 font-medium hover:bg-white/5 transition-colors border-t border-white/5">
             {t.widgets.viewAllHospitals(nearbyHospitals || 0)}
          </button>
        )}
      </div>
      <button onClick={onContinue} className="mt-3 w-full py-3 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-label-lg font-semibold transition-colors active:scale-[0.97]">
        {t.common.continue}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Calculation Theater
   ═══════════════════════════════════════════════════════ */

export function CalculationTheater({ onComplete }: { onComplete: () => void }) {
  const t = useT();
  const [phase, setPhase] = useState(0);
  const phases = [t.widgets.analyzingFamily, t.widgets.checkingNetwork, t.widgets.comparingPlans, t.widgets.calculatingPremium];

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase(prev => {
        if (prev >= phases.length - 1) { clearInterval(timer); setTimeout(onComplete, 600); return prev; }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-md py-4">
      {/* Animated orb */}
      <div className="flex justify-center mb-5">
        <motion.div
          animate={{ scale: [1, 1.15, 1], boxShadow: ['0 0 20px rgba(139,92,246,0.3)', '0 0 40px rgba(139,92,246,0.6)', '0 0 20px rgba(139,92,246,0.3)'] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center"
        >
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </motion.div>
      </div>
      <div className="flex flex-col gap-2.5">
        {phases.map((p, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: phase >= i ? 1 : 0.3, x: 0 }} transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
              phase > i ? 'bg-green-500' : phase === i ? 'bg-purple-500' : 'bg-white/10'
            }`}>
              {phase > i ? (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              ) : phase === i ? <div className="w-2 h-2 rounded-full bg-white animate-pulse" /> : null}
            </div>
            <span className={`text-body-sm ${phase >= i ? 'text-white/80' : 'text-white/30'}`}>{p}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Plan Switcher — collapsible features
   ═══════════════════════════════════════════════════════ */

function FeatureAccordionItem({ feature }: { feature: string }) {
  const [open, setOpen] = useState(false);
  const explanation = FEATURE_EXPLANATIONS[feature];

  return (
    <div className="border-b border-onyx-100 last:border-b-0">
      <button
        onClick={() => explanation && setOpen(!open)}
        className={`w-full flex items-start gap-2 py-2 text-left ${explanation ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
        <span className="flex-1 text-body-sm text-onyx-700">{feature}</span>
        {explanation && (
          <svg className={`w-4 h-4 text-onyx-400 mt-0.5 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      <AnimatePresence>
        {open && explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-caption text-onyx-500 pl-6 pb-2.5 leading-relaxed">{explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PlanSwitcher({ onSelect }: { onSelect: (tier: string) => void }) {
  const t = useT();
  // Subscribe reactively so premium recalculates when members/SI change
  const sumInsured = useJourneyStore(s => s.sumInsured);
  const members = useJourneyStore(s => s.members);
  const hasConditions = useJourneyStore(s => s.hasConditions);
  const updateState = useJourneyStore(s => s.updateState);
  const [activeTier, setActiveTier] = useState<PlanTier>('platinum');
  const [expanded, setExpanded] = useState(false);

  const tiers: PlanTier[] = ['platinum', 'platinum_lite', 'super_topup'];
  const tierLabels: Record<PlanTier, string> = { platinum: 'Platinum', platinum_lite: 'Lite', super_topup: 'Top-up' };
  const language = useJourneyStore(s => s.language);
  const plan = getPlanDetails(activeTier, sumInsured, members, hasConditions, language);

  const handleSelect = () => {
    updateState({ selectedPlan: plan });
    onSelect(activeTier);
  };

  return (
    <div className="max-w-md">
      {/* Tier tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: 'var(--app-tab-bg, rgba(255,255,255,0.06))' }}>
        {tiers.map(tier => {
          const isActive = activeTier === tier;
          return (
            <button
              key={tier}
              onClick={() => { setActiveTier(tier); setExpanded(false); }}
              className="flex-1 py-2.5 px-2 rounded-lg text-[13px] font-semibold transition-all duration-200"
              style={isActive ? {
                background: 'var(--app-accent, #7C3AED)',
                color: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(124,58,237,0.35)',
              } : {
                background: 'transparent',
                color: 'var(--app-tab-inactive, rgba(255,255,255,0.45))',
              }}
            >
              {tierLabels[tier]}
            </button>
          );
        })}
      </div>

      {/* Plan card */}
      <motion.div
        key={activeTier}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--app-plan-card-bg, rgba(255,255,255,0.08))',
          border: '1px solid var(--app-plan-card-border, rgba(168,85,247,0.35))',
          boxShadow: 'var(--app-plan-card-shadow, 0 4px 24px rgba(168,85,247,0.12))',
        }}
      >
        {/* Header */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-[15px] font-semibold" style={{ color: 'var(--app-text, #FFFFFF)' }}>{plan.name}</h3>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--app-text-muted, rgba(255,255,255,0.45))' }}>{plan.tagline}</p>
            </div>
            {plan.badge && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap"
                style={{
                  background: 'var(--app-badge-bg, rgba(124,58,237,0.25))',
                  color: 'var(--app-badge-text, #C4B5FD)',
                  borderColor: 'var(--app-badge-border, rgba(168,85,247,0.35))',
                }}
              >
                {plan.badge}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5 mb-0.5">
            <span className="text-[22px] font-bold" style={{ color: 'var(--app-text, #FFFFFF)' }}>{formatCurrency(plan.monthlyPremium)}</span>
            <span className="text-[13px]" style={{ color: 'var(--app-text-muted, rgba(255,255,255,0.45))' }}>/month</span>
          </div>
          <p className="text-[11px]" style={{ color: 'var(--app-text-subtle, rgba(255,255,255,0.35))' }}>
            or {formatCurrency(plan.yearlyPremium)}/year (save 8%)
          </p>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--app-divider, rgba(255,255,255,0.08))' }} />

        {/* Features */}
        <div className="px-4 py-3">
          <div className="space-y-2 mb-3">
            {plan.features.slice(0, expanded ? plan.features.length : 3).map((f: string, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--app-feature-check, #4ADE80)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-[12px]" style={{ color: 'var(--app-text-muted, rgba(255,255,255,0.7))' }}>
                  {f.length > 45 ? f.slice(0, 45) + '…' : f}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[12px] font-medium transition-colors"
            style={{ color: 'var(--app-link, #C4B5FD)' }}
          >
            {expanded ? t.widgets.showLess : t.widgets.seeAllBenefits}
            <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-3">
              <div style={{ borderTop: '1px solid var(--app-divider, rgba(255,255,255,0.08))', paddingTop: '12px' }}>
                <h4 className="text-[12px] font-semibold mb-2" style={{ color: 'var(--app-text-muted, rgba(255,255,255,0.6))' }}>{t.widgets.waitingPeriod}</h4>
                <p className="text-[12px]" style={{ color: 'var(--app-text-subtle, rgba(255,255,255,0.5))' }}>{plan.waitingPeriod}</p>
              </div>
              <div style={{ borderTop: '1px solid var(--app-divider, rgba(255,255,255,0.08))', paddingTop: '12px' }}>
                <h4 className="text-[12px] font-semibold mb-2" style={{ color: 'var(--app-text-muted, rgba(255,255,255,0.6))' }}>{t.widgets.healthEvaluation}</h4>
                <p className="text-[12px]" style={{ color: 'var(--app-text-subtle, rgba(255,255,255,0.5))' }}>{plan.healthEval}</p>
              </div>
              <div style={{ borderTop: '1px solid var(--app-divider, rgba(255,255,255,0.08))', paddingTop: '12px' }}>
                <h4 className="text-[12px] font-semibold mb-2" style={{ color: 'var(--app-text-muted, rgba(255,255,255,0.6))' }}>{t.widgets.notCovered}</h4>
                <ul className="space-y-1.5">
                  {plan.exclusions.map((e: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: 'var(--app-text-subtle, rgba(255,255,255,0.4))' }}>
                      <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--app-text-subtle, rgba(255,255,255,0.3))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      <button
        onClick={handleSelect}
        className="mt-4 w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.97]"
        style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
      >
        {t.widgets.continueWith(plan.name)}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   USP Cards — Visual ACKO differentiators
   ═══════════════════════════════════════════════════════ */

const USP_ITEMS = [
  {
    icon: (
      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: '100% hospital bills covered',
    desc: 'Including consumables, implants, and all hospital charges',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
      </svg>
    ),
    title: 'No room rent limit',
    desc: 'Choose any room — your claim amount stays the same',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    title: 'Inflation Protect',
    desc: 'Sum insured grows 10% every year automatically, no extra cost',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'No agents, no commission',
    desc: 'Savings passed directly to you as better coverage',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.746 3.746 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
    title: '99.9% claims settled',
    desc: '95% approved within a day — no unnecessary delays',
  },
];

export function UspCards({ onContinue }: { onContinue: () => void }) {
  const t = useT();
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
      {/* Brand ambassador banner */}
      <div className="relative rounded-2xl overflow-hidden mb-4">
        <img src={assetPath('/brand-ambassador.png')} alt="ACKO Brand Ambassador" className="w-full h-36 object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <p className="text-white font-semibold text-sm">{t.widgets.whyFamiliesChoose}</p>
        </div>
      </div>

      <div className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden mb-4">
        {USP_ITEMS.map((usp, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.25 }}
            className={`flex items-start gap-3 px-4 py-3.5 ${i < USP_ITEMS.length - 1 ? 'border-b border-white/5' : ''}`}
          >
            <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">{usp.icon}</div>
            <div className="min-w-0">
              <p className="text-body-sm font-semibold text-white/90">{usp.title}</p>
              <p className="text-body-xs text-white/40 mt-0.5">{usp.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onClick={onContinue}
        className="w-full py-3.5 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-label-lg font-semibold transition-colors active:scale-[0.97] flex items-center justify-center gap-2"
      >
        {t.widgets.letsFindPlan}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </motion.button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Frequency Select
   ═══════════════════════════════════════════════════════ */

export function FrequencySelect({ onSelect }: { onSelect: (freq: string) => void }) {
  const t = useT();
  // Subscribe reactively so prices update when plan/members/SI change
  const selectedPlan = useJourneyStore(s => s.selectedPlan);
  const sumInsured = useJourneyStore(s => s.sumInsured);
  const members = useJourneyStore(s => s.members);
  const hasConditions = useJourneyStore(s => s.hasConditions);
  const [selected, setSelected] = useState<string | null>(null);

  // Recompute from live state if selectedPlan exists
  const language = useJourneyStore(s => s.language);
  const plan = selectedPlan
    ? getPlanDetails(selectedPlan.tier, sumInsured, members, hasConditions, language)
    : null;
  const monthlyTotal = plan ? plan.monthlyPremium * 12 : 0;
  const yearlyTotal = plan ? plan.yearlyPremium : 0;
  const savings = monthlyTotal - yearlyTotal;

  const handleSelect = (f: string) => { setSelected(f); setTimeout(() => onSelect(f), 250); };

  return (
    <div className="max-w-md grid grid-cols-2 gap-3">
      <button onClick={() => handleSelect('monthly')}
        className={`flex flex-col items-center p-5 rounded-2xl border transition-all min-h-[130px] justify-center ${
          selected === 'monthly' ? 'border-purple-400 bg-white/15' : 'border-white/10 bg-white/6 hover:bg-white/10'
        }`}>
        <svg className="w-7 h-7 text-purple-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
        <span className="text-body-md font-medium text-white/90">{t.common.monthly}</span>
        <span className="text-heading-sm text-white mt-1">{formatCurrency(plan?.monthlyPremium || 0)}</span>
        <span className="text-caption text-white/40">{t.common.perMonth}</span>
      </button>

      <button onClick={() => handleSelect('yearly')}
        className={`relative flex flex-col items-center p-5 rounded-2xl border transition-all min-h-[130px] justify-center ${
          selected === 'yearly' ? 'border-purple-400 bg-white/15' : 'border-purple-400/30 bg-white/6 hover:bg-white/10'
        }`}>
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-label-sm bg-green-500 text-white px-3 py-0.5 rounded-full font-semibold whitespace-nowrap shadow-sm">
          {t.widgets.save(formatCurrency(savings))}
        </span>
        <svg className="w-7 h-7 text-purple-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" /></svg>
        <span className="text-body-md font-medium text-white/90">{t.common.yearly}</span>
        <span className="text-heading-sm text-white mt-1">{formatCurrency(plan?.yearlyPremium || 0)}</span>
        <span className="text-caption text-white/40">{t.common.perYear}</span>
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Review Summary
   ═══════════════════════════════════════════════════════ */

export function ReviewSummary({ onConfirm, onEditField }: { onConfirm: () => void; onEditField?: (stepId: string) => void }) {
  const t = useT();
  // Subscribe reactively for live premium updates
  const selectedPlan = useJourneyStore(s => s.selectedPlan);
  const sumInsured = useJourneyStore(s => s.sumInsured);
  const members = useJourneyStore(s => s.members);
  const hasConditions = useJourneyStore(s => s.hasConditions);
  const paymentFrequency = useJourneyStore(s => s.paymentFrequency);
  const userName = useJourneyStore(s => s.userName);
  const pincode = useJourneyStore(s => s.pincode);

  // Recompute premium from live state
  const language = useJourneyStore(s => s.language);
  const plan = selectedPlan
    ? getPlanDetails(selectedPlan.tier, sumInsured, members, hasConditions, language)
    : null;
  if (!plan) return null;
  const premium = paymentFrequency === 'monthly' ? plan.monthlyPremium : plan.yearlyPremium;
  const freq = paymentFrequency === 'monthly' ? '/mo' : '/yr';

  const editIcon = (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );

  const rows: { label: string; value: string; stepId?: string }[] = [
    { label: t.widgets.plan, value: plan.name, stepId: 'recommendation.result' },
    { label: t.widgets.sumInsured, value: plan.sumInsuredLabel, stepId: 'customization.si_selection' },
    { label: t.widgets.members, value: members.map(m => m.name).join(', '), stepId: 'family.who_to_cover' },
    { label: t.widgets.pincode, value: pincode || '—', stepId: 'family.pincode' },
    { label: t.widgets.payment, value: paymentFrequency.charAt(0).toUpperCase() + paymentFrequency.slice(1), stepId: 'customization.frequency' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md">
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--app-plan-card-bg, rgba(255,255,255,0.08))',
          border: '1px solid var(--app-plan-card-border, rgba(168,85,247,0.35))',
          boxShadow: 'var(--app-plan-card-shadow, 0 4px 24px rgba(168,85,247,0.12))',
        }}
      >
        {/* Header strip */}
        <div
          className="px-5 py-3 flex items-center gap-2"
          style={{
            background: 'var(--app-surface-2, rgba(255,255,255,0.1))',
            borderBottom: '1px solid var(--app-divider, rgba(255,255,255,0.08))',
          }}
        >
          <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--app-accent, #7C3AED)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" />
          </svg>
          <h4 className="text-[14px] font-semibold" style={{ color: 'var(--app-text, #FFFFFF)' }}>
            {t.widgets.yourPlanSummary}
          </h4>
        </div>

        {/* Rows */}
        <div className="px-5 py-2">
          {rows.map((row, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3"
              style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--app-divider, rgba(255,255,255,0.08))' : 'none' }}
            >
              <span className="text-[12px]" style={{ color: 'var(--app-text-subtle, rgba(255,255,255,0.45))' }}>{row.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium" style={{ color: 'var(--app-text, #FFFFFF)' }}>{row.value}</span>
                {onEditField && row.stepId && (
                  <button
                    onClick={() => onEditField(row.stepId!)}
                    className="p-1 rounded-md transition-colors"
                    style={{ color: 'var(--app-link, #C4B5FD)' }}
                    title={t.widgets.editLabel(row.label)}
                  >
                    {editIcon}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Premium row */}
        <div
          className="px-5 py-3 flex justify-between items-baseline"
          style={{ borderTop: '1px solid var(--app-divider, rgba(255,255,255,0.08))', background: 'var(--app-surface-2, rgba(255,255,255,0.06))' }}
        >
          <span className="text-[13px] font-semibold" style={{ color: 'var(--app-text-muted, rgba(255,255,255,0.6))' }}>Premium</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[20px] font-bold" style={{ color: 'var(--app-accent, #7C3AED)' }}>{formatCurrency(premium)}</span>
            <span className="text-[12px]" style={{ color: 'var(--app-text-subtle, rgba(255,255,255,0.4))' }}>{freq}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onConfirm}
        className="mt-4 w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.97]"
        style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
      >
        {t.widgets.looksGood}
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Consent
   ═══════════════════════════════════════════════════════ */

export function ConsentWidget({ onConfirm }: { onConfirm: () => void }) {
  const t = useT();
  const [agreed, setAgreed] = useState(false);
  return (
    <div className="max-w-md">
      <label className="flex items-start gap-3 cursor-pointer bg-white/5 rounded-xl p-4 border border-white/10">
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1 w-5 h-5 accent-purple-500" />
        <span className="text-body-sm text-white/70">
          {t.widgets.confirmInfo}
        </span>
      </label>
      <button onClick={onConfirm} disabled={!agreed}
        className="mt-4 w-full py-3 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-label-lg font-semibold disabled:opacity-40 transition-all active:scale-[0.97]">
        {t.widgets.confirmAndProceed}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DOB Collection
   ═══════════════════════════════════════════════════════ */

const RELATION_LABEL_KEYS: Record<string, string> = {
  self: 'you',
  spouse: 'spouse',
  child: 'child',
  children: 'children',
  father: 'father',
  mother: 'mother',
  father_in_law: 'fatherInLaw',
  mother_in_law: 'motherInLaw',
};

export function DobCollectionWidget({ onConfirm }: { onConfirm: (response: string) => void }) {
  const t = useT();
  const members = useJourneyStore(s => s.members);
  const journeyUserName = useJourneyStore(s => s.userName);
  const updateState = useJourneyStore(s => s.updateState);

  // Accumulated data keyed by member id
  const [collected, setCollected] = useState<Record<string, { name: string; day: string; month: string; year: string }>>(() => {
    const init: Record<string, { name: string; day: string; month: string; year: string }> = {};
    members.forEach(m => {
      const estimatedYear = m.age ? String(new Date().getFullYear() - m.age) : '';
      const prefillName = m.name && m.name !== 'You' ? m.name : (m.relation === 'self' && journeyUserName ? journeyUserName : '');
      init[m.id] = { name: prefillName, day: '01', month: '01', year: estimatedYear };
    });
    return init;
  });

  const [step, setStep] = useState(0); // which member index we're on
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  const member = members[step];
  const total = members.length;
  const isLast = step === total - 1;

  const relationLabel = (rel: string) => {
    const key = RELATION_LABEL_KEYS[rel];
    if (!key) return rel;
    const val = (t.widgets as Record<string, unknown>)[key];
    return typeof val === 'string' ? val : rel;
  };

  const label = member ? relationLabel(member.relation) : '';
  const data = member ? (collected[member.id] ?? { name: '', day: '', month: '', year: '' }) : { name: '', day: '', month: '', year: '' };

  const setField = (field: 'name' | 'day' | 'month' | 'year', val: string) => {
    if (!member) return;
    setCollected(prev => ({ ...prev, [member.id]: { ...prev[member.id], [field]: val } }));
  };

  const currentValid =
    (data.name || '').trim().length > 0 &&
    data.day.length > 0 && data.day.length <= 2 &&
    data.month.length > 0 && data.month.length <= 2 &&
    data.year.length === 4;

  const handleNext = () => {
    if (!currentValid) return;
    if (isLast) {
      // All done — compute ages and save
      const updatedMembers = members.map(m => {
        const d = collected[m.id];
        const dobStr = `${d.day.padStart(2, '0')}/${d.month.padStart(2, '0')}/${d.year}`;
        const birthDate = new Date(parseInt(d.year), parseInt(d.month) - 1, parseInt(d.day));
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const diff = today.getMonth() - birthDate.getMonth();
        if (diff < 0 || (diff === 0 && today.getDate() < birthDate.getDate())) age--;
        return { ...m, name: d.name.trim() || m.name, dob: dobStr, age };
      });
      updateState({ members: updatedMembers });
      onConfirm('dob_submitted');
    } else {
      setDirection(1);
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (step === 0) return;
    setDirection(-1);
    setStep(s => s - 1);
  };

  const conversationalHeader = () => {
    if (step === 0) return member?.relation === 'self' ? "Let's start with you" : `First, tell me about your ${label.toLowerCase()}`;
    if (isLast) return `Last one — your ${label.toLowerCase()}`;
    return `Now your ${label.toLowerCase()}`;
  };

  return (
    <div className="max-w-md w-full">
      {/* Progress stepper */}
      {total > 1 && (
        <div className="flex items-center gap-1.5 mb-4">
          {members.map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full flex-1 transition-all duration-300"
              style={{ background: i < step ? 'var(--app-accent, #7C3AED)' : i === step ? 'var(--app-accent, #7C3AED)' : 'rgba(255,255,255,0.12)' }}
            />
          ))}
          <span className="text-[11px] ml-1 flex-shrink-0" style={{ color: 'var(--app-text-muted, rgba(255,255,255,0.4))' }}>
            {step + 1}/{total}
          </span>
        </div>
      )}

      <AnimatePresence mode="wait" custom={direction}>
        {member && (
          <motion.div
            key={member.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -32 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="space-y-3"
          >
            {/* Conversational header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold" style={{ color: 'var(--app-text, #FFFFFF)' }}>
                  {conversationalHeader()}
                </p>
                {member.age > 0 && (
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--app-text-muted, rgba(255,255,255,0.45))' }}>
                    Estimated age ~{member.age} yrs
                  </p>
                )}
              </div>
              {step > 0 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-lg transition-all"
                  style={{ color: 'var(--app-text-muted, rgba(255,255,255,0.45))', background: 'rgba(255,255,255,0.06)' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                  Back
                </button>
              )}
            </div>

            {/* Name input */}
            <div>
              <label className="text-[11px] font-medium mb-1 block" style={{ color: 'var(--app-text-muted, rgba(255,255,255,0.5))' }}>
                {member.relation === 'self' ? 'Your full name' : `${label}'s full name`}
              </label>
              <input
                type="text"
                placeholder={member.relation === 'self' ? 'Enter your name' : `Enter ${label.toLowerCase()}'s name`}
                value={data.name}
                onChange={e => setField('name', e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl text-[14px] outline-none transition-all"
                style={{
                  background: 'var(--app-input-bg, rgba(255,255,255,0.08))',
                  border: '1.5px solid var(--app-input-border, rgba(255,255,255,0.12))',
                  color: 'var(--app-text, #FFFFFF)',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--app-accent, #7C3AED)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--app-input-border, rgba(255,255,255,0.12))'; }}
              />
            </div>

            {/* DOB row */}
            <div>
              <label className="text-[11px] font-medium mb-1 block" style={{ color: 'var(--app-text-muted, rgba(255,255,255,0.5))' }}>
                Date of birth
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    placeholder="DD"
                    value={data.day}
                    onChange={e => setField('day', e.target.value.replace(/\D/g, '').slice(0, 2))}
                    className="w-full px-3 py-3 rounded-xl text-[14px] text-center outline-none transition-all"
                    style={{
                      background: 'var(--app-input-bg, rgba(255,255,255,0.08))',
                      border: '1.5px solid var(--app-input-border, rgba(255,255,255,0.12))',
                      color: 'var(--app-text, #FFFFFF)',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--app-accent, #7C3AED)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--app-input-border, rgba(255,255,255,0.12))'; }}
                  />
                  <p className="text-[10px] text-center mt-1" style={{ color: 'var(--app-text-muted, rgba(255,255,255,0.35))' }}>Day</p>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    placeholder="MM"
                    value={data.month}
                    onChange={e => setField('month', e.target.value.replace(/\D/g, '').slice(0, 2))}
                    className="w-full px-3 py-3 rounded-xl text-[14px] text-center outline-none transition-all"
                    style={{
                      background: 'var(--app-input-bg, rgba(255,255,255,0.08))',
                      border: '1.5px solid var(--app-input-border, rgba(255,255,255,0.12))',
                      color: 'var(--app-text, #FFFFFF)',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--app-accent, #7C3AED)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--app-input-border, rgba(255,255,255,0.12))'; }}
                  />
                  <p className="text-[10px] text-center mt-1" style={{ color: 'var(--app-text-muted, rgba(255,255,255,0.35))' }}>Month</p>
                </div>
                <div className="flex-[1.5]">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="YYYY"
                    value={data.year}
                    onChange={e => setField('year', e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full px-3 py-3 rounded-xl text-[14px] text-center outline-none transition-all"
                    style={{
                      background: 'var(--app-input-bg, rgba(255,255,255,0.08))',
                      border: '1.5px solid var(--app-input-border, rgba(255,255,255,0.12))',
                      color: 'var(--app-text, #FFFFFF)',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--app-accent, #7C3AED)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--app-input-border, rgba(255,255,255,0.12))'; }}
                  />
                  <p className="text-[10px] text-center mt-1" style={{ color: 'var(--app-text-muted, rgba(255,255,255,0.35))' }}>Year</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <button
        onClick={handleNext}
        disabled={!currentValid}
        className="mt-4 w-full py-3 rounded-xl text-[15px] font-semibold disabled:opacity-40 transition-all active:scale-[0.97]"
        style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
      >
        {isLast ? t.widgets.calculatePremium : t.common.continue}
      </button>

      {/* IRDAI note */}
      <p className="text-[11px] text-center mt-3" style={{ color: 'var(--app-text-muted, rgba(255,255,255,0.3))' }}>
        {t.widgets.dobHelp}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Payment
   ═══════════════════════════════════════════════════════ */

export function PaymentWidget({ onSuccess }: { onSuccess: () => void }) {
  const t = useT();
  const selectedPlan = useJourneyStore(s => s.selectedPlan);
  const sumInsured = useJourneyStore(s => s.sumInsured);
  const members = useJourneyStore(s => s.members);
  const hasConditions = useJourneyStore(s => s.hasConditions);
  const paymentFrequency = useJourneyStore(s => s.paymentFrequency);
  const [processing, setProcessing] = useState(false);
  const [complete, setComplete] = useState(false);
  const language = useJourneyStore(s => s.language);
  const plan = selectedPlan ? getPlanDetails(selectedPlan.tier, sumInsured, members, hasConditions, language) : null;
  const premium = plan ? (paymentFrequency === 'monthly' ? plan.monthlyPremium : plan.yearlyPremium) : 0;

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setComplete(true); setTimeout(onSuccess, 800); }, 2500);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md">
      <div className="bg-white border-2 border-onyx-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-baseline justify-between mb-5 pb-4 border-b border-onyx-100">
          <span className="text-body-md text-onyx-500">{t.widgets.amount}</span>
          <span className="text-heading-md text-purple-700">{formatCurrency(premium)}<span className="text-body-sm text-onyx-500 ml-1">{paymentFrequency === 'monthly' ? '/mo' : '/yr'}</span></span>
        </div>
        {complete ? (
          <div className="text-center py-4">
            <svg className="w-10 h-10 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-heading-sm text-green-600 mt-2">{t.widgets.paymentSuccessful}</p>
          </div>
        ) : (
          <button onClick={handlePay} disabled={processing}
            className="w-full py-3.5 bg-purple-600 text-white rounded-xl text-label-lg font-semibold hover:bg-purple-700 disabled:opacity-60 transition-all active:scale-[0.97]">
            {processing ? t.common.processing : t.widgets.pay(formatCurrency(premium))}
          </button>
        )}
      </div>
      <p className="text-caption text-onyx-400 text-center mt-2 flex items-center justify-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
        {t.common.securedBy}
      </p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Lab Schedule
   ═══════════════════════════════════════════════════════ */

const LAB_IMAGES: Record<string, string> = {
  metropolis: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=120&h=80&fit=crop',
  srl: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=120&h=80&fit=crop',
  thyrocare: 'https://images.unsplash.com/photo-1581093458791-9f3c3250a8b0?w=120&h=80&fit=crop',
};

export function LabScheduleWidget({ onComplete }: { onComplete: () => void }) {
  const t = useT();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedLab, setSelectedLab] = useState('');

  const dates = [];
  const today = new Date();
  for (let i = 2; i <= 8; i++) {
    const d = new Date(today); d.setDate(d.getDate() + i);
    dates.push({ value: d.toISOString().split('T')[0], label: d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }) });
  }

  const timeSlots = [
    { id: 'morning', label: 'Morning', time: '7-10 AM', icon: '🌅', note: 'Best for fasting' },
    { id: 'midday', label: 'Midday', time: '10 AM-1 PM', icon: '☀️' },
    { id: 'afternoon', label: 'Afternoon', time: '2-5 PM', icon: '🌤️' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md space-y-5">
      {/* Visual banner */}
      <div className="relative rounded-2xl overflow-hidden">
        <img src="https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&h=140&fit=crop" alt="Lab test" className="w-full h-24 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 to-purple-600/60 flex items-center px-4">
          <div>
            <p className="text-white font-semibold text-sm">{t.widgets.scheduleTest}</p>
            <p className="text-white/70 text-xs">{t.widgets.allCostsCovered}</p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-label-md text-white/80 font-semibold mb-2">{t.widgets.pickDate}</h4>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {dates.map(d => (
            <button key={d.value} onClick={() => setSelectedDate(d.value)}
              className={`flex-shrink-0 px-3 py-2.5 rounded-xl border text-label-md transition-all ${
                selectedDate === d.value ? 'border-purple-400 bg-white/15 text-white' : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
              }`}>{d.label}</button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-label-md text-white/80 font-semibold mb-2">{t.widgets.timeSlot}</h4>
        <div className="grid grid-cols-3 gap-2">
          {timeSlots.map(s => (
            <button key={s.id} onClick={() => setSelectedTime(s.id)}
              className={`p-3 rounded-xl border text-center transition-all ${
                selectedTime === s.id ? 'border-purple-400 bg-white/15' : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}>
              <p className="text-lg mb-0.5">{s.icon}</p>
              <p className="text-body-sm font-medium text-white/90">{s.label}</p>
              <p className="text-caption text-white/40">{s.time}</p>
              {s.note && <p className="text-[10px] text-green-400 mt-0.5">{s.note}</p>}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-label-md text-white/80 font-semibold mb-2">{t.widgets.chooseLab}</h4>
        <div className="space-y-2">
          {NEARBY_LABS.map(lab => (
            <button key={lab.id} onClick={() => setSelectedLab(lab.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                selectedLab === lab.id ? 'border-purple-400 bg-white/15' : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}>
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                <img src={LAB_IMAGES[lab.id] || 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=120&h=80&fit=crop'} alt={lab.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-white/90">{lab.name}</p>
                <p className="text-caption text-white/40">{lab.distance}</p>
              </div>
              <span className="text-caption text-amber-300 flex items-center gap-0.5 flex-shrink-0"><svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>{lab.rating}</span>
            </button>
          ))}
        </div>
      </div>
      <button onClick={onComplete} disabled={!selectedDate || !selectedTime || !selectedLab}
        className="w-full py-3.5 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-label-lg font-semibold disabled:opacity-40 transition-all active:scale-[0.97]">
        {t.widgets.confirmBooking}
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Celebration
   ═══════════════════════════════════════════════════════ */

export function Celebration() {
  const t = useT();
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className="max-w-md text-center py-6">
      {/* Animated success orb */}
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="mb-5"
      >
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-900/30">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      </motion.div>
      <h2 className="text-heading-lg text-white mb-2">{t.widgets.youreAllSet}</h2>
      <p className="text-body-md text-white/60 mb-6">{t.widgets.healthJourneyInMotion}</p>
      <div className="flex gap-3">
        <button className="flex-1 py-3 border border-white/20 text-white/90 rounded-xl text-label-md font-medium hover:bg-white/10 transition-colors">{t.widgets.viewDashboard}</button>
        <button className="flex-1 py-3 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-label-md font-medium transition-colors">{t.widgets.downloadApp}</button>
      </div>
    </motion.div>
  );
}
