'use client';

import { create } from 'zustand';
import { BaseJourneyState, BaseJourneyActions, ChatMessage, Language } from './types';
import { useLanguageStore } from '../languageStore';

let messageCounter = 0;

/**
 * Store factory — creates a Zustand store for any LOB journey.
 * Each LOB calls this with its own initial state, persona resolver, and trigger keys.
 */
export function createJourneyStore<TState extends BaseJourneyState>(
  initialState: TState,
  resolvePersona?: (state: TState) => string,
  personaTriggerKeys?: string[],
) {
  type Store = TState & BaseJourneyActions<TState>;

  return create<Store>()((set, get) => ({
    ...initialState,

    addMessage: (msg) => {
      const fullMsg: ChatMessage = {
        ...msg,
        id: `${msg.type}-${++messageCounter}`,
        timestamp: Date.now(),
      };
      set((state) => ({
        ...state,
        conversationHistory: [...state.conversationHistory, fullMsg],
      }));
    },

    updateState: (partial) => {
      set((state) => ({ ...state, ...partial }));
      if (resolvePersona && personaTriggerKeys) {
        if (Object.keys(partial).some((k) => personaTriggerKeys.includes(k))) {
          const persona = resolvePersona(get());
          set((state) => ({ ...state, resolvedPersona: persona }));
        }
      }
    },

    setLanguage: (lang: Language) => set((state) => ({ ...state, language: lang })),

    updateUserMessage: (stepId: string, newContent: string) => {
      const history = get().conversationHistory;
      set((state) => ({
        ...state,
        conversationHistory: history.map((m) =>
          m.stepId === stepId && m.type === 'user'
            ? { ...m, content: newContent }
            : m
        ),
      }));
    },

    trimAndUpdateFromStep: (stepId: string, newContent: string) => {
      const history = get().conversationHistory;
      const userMsgIndex = history.findIndex((m) => m.stepId === stepId && m.type === 'user');
      if (userMsgIndex === -1) return;
      const trimmed = history.slice(0, userMsgIndex);
      const updatedMsg = { ...history[userMsgIndex], content: newContent };
      set((state) => ({ ...state, conversationHistory: [...trimmed, updatedMsg] }));
    },

    resetJourney: () => {
      messageCounter = 0;
      const lang = useLanguageStore.getState().language;
      set(() => ({ ...initialState, language: lang } as Store));
    },
  }));
}
