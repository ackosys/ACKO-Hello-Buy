'use client';

import { useState } from 'react';
import { useThemeStore } from '../../lib/themeStore';
import ThemeToggle from '../global/ThemeToggle';

const SECTIONS = [
  { id: 'buttons', label: 'Buttons' },
  { id: 'tags-badges', label: 'Tags & Badges' },
  { id: 'progress', label: 'Progress' },
  { id: 'avatars', label: 'Avatars' },
  { id: 'selections', label: 'Selections & Inputs' },
  { id: 'cards', label: 'Cards' },
  { id: 'grids', label: 'Grid Layouts' },
  { id: 'tabs-accordions', label: 'Tabs & Accordions' },
  { id: 'skeletons-dividers', label: 'Skeletons & Dividers' },
  { id: 'chat', label: 'Chat' },
  { id: 'inline-icons', label: 'Inline SVG Icons' },
  { id: 'file-icons', label: 'File Icons' },
  { id: 'brand-logos', label: 'Brand Logos' },
  { id: 'vehicle-images', label: 'Vehicle Images' },
  { id: 'hospital-logos', label: 'Hospital Logos' },
  { id: 'acko-brand', label: 'ACKO Brand' },
  { id: 'offering-images', label: 'Product Images' },
  { id: 'character-images', label: 'Characters' },
  { id: 'footer-icons', label: 'Footer Icons' },
  { id: 'animated-bg', label: 'Animated BG' },
];

export default function DesignSystemNav() {
  const { theme } = useThemeStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-50 backdrop-blur-xl border-b"
        style={{ background: 'var(--app-glass-bg, rgba(28,11,71,0.85))', borderColor: 'var(--app-border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-bold tracking-tight" style={{ color: 'var(--app-text)' }}>ACKO Design System</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider" style={{ background: 'rgba(124,58,237,0.2)', color: '#A78BFA' }}>
                {theme}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="sm:hidden w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
              >
                <svg className="w-4 h-4" style={{ color: 'var(--app-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            </div>
          </div>

          <nav className="hidden sm:block overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
            <div className="flex gap-1">
              {SECTIONS.map(s => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors hover:bg-white/10"
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </nav>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <nav
            className="absolute top-14 left-0 right-0 max-h-[70vh] overflow-y-auto p-3 border-b"
            style={{ background: 'var(--app-surface)', borderColor: 'var(--app-border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="grid grid-cols-2 gap-1">
              {SECTIONS.map(s => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-xs font-medium transition-colors hover:bg-white/10"
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
