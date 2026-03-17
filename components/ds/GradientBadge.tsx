'use client';

import { ReactNode } from 'react';

interface GradientBadgeProps {
  children: ReactNode;
  className?: string;
}

export default function GradientBadge({ children, className = '' }: GradientBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full whitespace-nowrap ${className}`}
      style={{
        background: `linear-gradient(0deg, var(--color-badge-purple-gradient-from), var(--color-badge-purple-gradient-to))`,
        border: `1px solid var(--color-badge-purple-border)`,
      }}
    >
      <span
        className="text-[10px] font-medium leading-[12px]"
        style={{ color: 'var(--color-badge-purple-text)' }}
      >
        {children}
      </span>
    </span>
  );
}
