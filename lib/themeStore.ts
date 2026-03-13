import { create } from 'zustand';

export type AppTheme = 'dark' | 'light' | 'midnight';

const STORAGE_KEY = 'acko_app_theme';

function loadPersistedTheme(): AppTheme {
  if (typeof window === 'undefined') return 'midnight';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'midnight') return saved;
  } catch { /* noop */ }
  return 'midnight';
}

interface ThemeStore {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  cycleTheme: () => void;
}

const THEMES: AppTheme[] = ['midnight', 'dark', 'light'];

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'midnight',
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, theme);
    }
  },
  cycleTheme: () => {
    const current = get().theme;
    const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
    get().setTheme(next);
  },
}));

export function initTheme() {
  const persisted = loadPersistedTheme();
  useThemeStore.getState().setTheme(persisted);
}
