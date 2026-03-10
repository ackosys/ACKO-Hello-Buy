'use client';

import { useEffect } from 'react';
import { useThemeStore, initTheme } from '../../lib/themeStore';
import { initLanguage } from '../../lib/languageStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    initTheme();
    initLanguage();
  }, []);

  return (
    <div className={`app-${theme}`}>
      {children}
    </div>
  );
}
