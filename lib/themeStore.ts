import { create } from 'zustand';

export type AppTheme = 'dark' | 'light';

const STORAGE_KEY = 'acko_app_theme';

function loadPersistedTheme(): AppTheme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch { /* noop */ }
  return 'dark';
}

interface ThemeStore {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  cycleTheme: () => void;
}

const THEMES: AppTheme[] = ['dark', 'light'];

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'dark',
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
