'use client';

import { ReactNode } from 'react';

const GRADIENT_BG = 'linear-gradient(90deg, rgba(153,116,249,0.36) 0%, rgba(236,72,153,0.08) 89%)';

interface GradientBadgeProps {
  children: ReactNode;
  className?: string;
}

export default function GradientBadge({ children, className = '' }: GradientBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full whitespace-nowrap ${className}`}
      style={{ background: GRADIENT_BG }}
    >
      <span className="text-[10px] font-medium leading-[12px]" style={{ color: 'var(--app-text)' }}>
        {children}
      </span>
    </span>
  );
}
