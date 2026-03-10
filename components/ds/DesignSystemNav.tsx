'use client';

import { useThemeStore } from '../../lib/themeStore';
import ThemeToggle from '../global/ThemeToggle';

export interface SubTabDef {
  id: string;
  label: string;
  count: number;
}

interface NavProps {
  activeLob: string;
  onLobChange: (id: string) => void;
  lobs: readonly { id: string; name: string; accent: string; accentLight: string }[];
  subTabs?: SubTabDef[];
  activeSubTab?: string;
  onSubTabChange?: (id: string) => void;
}

export default function DesignSystemNav({ activeLob, onLobChange, lobs, subTabs, activeSubTab, onSubTabChange }: NavProps) {
  const { theme } = useThemeStore();

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl border-b"
      style={{ background: 'var(--app-glass-bg, rgba(28,11,71,0.85))', borderColor: 'var(--app-border)' }}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold tracking-tight" style={{ color: 'var(--app-text)' }}>ACKO DS</h1>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider" style={{ background: 'rgba(124,58,237,0.2)', color: '#A78BFA' }}>
              {theme}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {lobs.map(l => (
              <button
                key={l.id}
                onClick={() => onLobChange(l.id)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all"
                style={activeLob === l.id
                  ? { background: l.accent, color: '#fff', boxShadow: `0 2px 8px ${l.accent}50` }
                  : { color: 'var(--app-text-muted)' }}
              >
                {l.name}
              </button>
            ))}
            <div className="w-px h-5 mx-1" style={{ background: 'var(--app-border)' }} />
            <ThemeToggle />
          </div>
        </div>

        {subTabs && subTabs.length > 0 && (
          <nav className="overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
            <div className="flex gap-1">
              {subTabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => onSubTabChange?.(t.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all"
                  style={activeSubTab === t.id
                    ? { background: 'rgba(255,255,255,0.1)', color: 'var(--app-text)' }
                    : { color: 'var(--app-text-muted)' }}
                >
                  {t.label}
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: activeSubTab === t.id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)', color: activeSubTab === t.id ? 'var(--app-text)' : 'var(--app-text-muted)' }}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
