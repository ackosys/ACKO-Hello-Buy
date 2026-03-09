/**
 * Global Language Store — persists selected language across all LOB journeys.
 * All three stores (health, motor, life) and all useT() hooks read from here
 * so switching language on ANY page propagates everywhere.
 */
import { create } from 'zustand';
import { Language } from './types';

const STORAGE_KEY = 'acko_language';

function loadPersistedLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved && ['en', 'hi', 'hinglish', 'kn', 'ta', 'ml', 'te'].includes(saved)) return saved;
  } catch { /* noop */ }
  return 'en';
}

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageStore>((set) => ({
  language: 'en',
  setLanguage: (lang) => {
    set({ language: lang });
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  },
}));

/** Call once on app boot to hydrate from localStorage */
export function initLanguage() {
  const persisted = loadPersistedLanguage();
  useLanguageStore.getState().setLanguage(persisted);
}
