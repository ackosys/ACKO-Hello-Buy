'use client';

import { useState } from 'react';

interface ShowcaseProps {
  name: string;
  source: string;
  variant?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
  noPadding?: boolean;
}

export function Showcase({ name, source, variant, description, children, maxWidth = '430px', noPadding }: ShowcaseProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--app-surface)', borderColor: 'var(--app-border)' }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left"
        style={{ borderBottom: collapsed ? 'none' : '1px solid var(--app-border)' }}
      >
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--app-text)' }}>{name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] font-mono" style={{ color: 'var(--app-text-muted)' }}>{source}</span>
            {variant && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(124,58,237,0.15)', color: '#A78BFA' }}>
                {variant}
              </span>
            )}
          </div>
          {description && <p className="text-[11px] mt-1" style={{ color: 'var(--app-text-subtle)' }}>{description}</p>}
        </div>
        <svg className={`w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-180'}`} style={{ color: 'var(--app-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {!collapsed && (
        <div className={noPadding ? '' : 'p-5'} style={{ maxWidth }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function Section({ id, title, count, children, style }: { id: string; title: string; count?: number; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <section id={id} className="scroll-mt-20" style={style}>
      <div className="flex items-baseline gap-3 mb-5">
        <h2 className="text-xl font-bold" style={{ color: 'var(--app-text)' }}>{title}</h2>
        {count !== undefined && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(124,58,237,0.15)', color: '#A78BFA' }}>
            {count}
          </span>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
}

export function SizeRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-[10px] font-mono w-10 text-right flex-shrink-0" style={{ color: 'var(--app-text-muted)' }}>{label}</span>
      <div className="flex items-center gap-3 flex-wrap">
        {children}
      </div>
    </div>
  );
}
