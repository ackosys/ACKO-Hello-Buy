'use client';

import { useThemeStore } from '../../lib/themeStore';

const THEME_ICONS = {
  dark: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  ),
  light: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  ),
};

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, cycleTheme } = useThemeStore();
  const isLight = theme === 'light';

  return (
    <button
      onClick={cycleTheme}
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${className || ''}`}
      style={{
        background: 'var(--app-surface, rgba(255,255,255,0.1))',
        border: '1px solid var(--app-border, rgba(255,255,255,0.15))',
        color: isLight ? 'rgba(28,11,71,0.7)' : 'rgba(255,255,255,0.7)',
      }}
      title={`Theme: ${theme}`}
    >
      {THEME_ICONS[theme]}
    </button>
  );
}
