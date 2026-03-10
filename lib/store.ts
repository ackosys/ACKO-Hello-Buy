'use client';

import { create } from 'zustand';
import { JourneyState, ChatMessage, INITIAL_STATE, Module, Language } from './types';
import { resolvePersona } from './personas';
import { useLanguageStore } from './languageStore';

interface JourneyActions {
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateState: (partial: Partial<JourneyState>) => void;
  setExistingAckoUser: (value: boolean) => void;
  setLanguage: (lang: Language) => void;
  resolveAndSetPersona: () => void;
  resetJourney: () => void;
  /* Edit support */
  updateUserMessage: (stepId: string, newContent: string) => void;
  /* Trim all messages after a given step's user message, then update that message */
  trimAndUpdateFromStep: (stepId: string, newContent: string) => void;
}

type JourneyStore = JourneyState & JourneyActions;

let messageCounter = 0;

export const useJourneyStore = create<JourneyStore>()((set, get) => ({
  ...INITIAL_STATE,

  addMessage: (msg) => {
    const fullMsg: ChatMessage = {
      ...msg,
      id: `${msg.type}-${++messageCounter}`,
      timestamp: Date.now(),
    };
    set(state => ({
      conversationHistory: [...state.conversationHistory, fullMsg],
    }));
  },

  updateState: (partial) => {
    set(state => ({ ...state, ...partial }));
    const relevantKeys = ['intent', 'hasSenior', 'buyingForParents', 'coverageStatus', 'members'];
    if (Object.keys(partial).some(k => relevantKeys.includes(k))) {
      get().resolveAndSetPersona();
    }
  },

  setExistingAckoUser: (value) => set({ isExistingAckoUser: value }),
  setLanguage: (lang) => set({ language: lang }),

  resolveAndSetPersona: () => {
    const state = get();
    const persona = resolvePersona(state);
    set({ resolvedPersona: persona });
  },

  updateUserMessage: (stepId: string, newContent: string) => {
    // Update the user message for a specific step in-place (no history trimming)
    const history = get().conversationHistory;
    set({
      conversationHistory: history.map(m =>
        m.stepId === stepId && m.type === 'user'
          ? { ...m, content: newContent }
          : m
      ),
    });
  },

  trimAndUpdateFromStep: (stepId: string, newContent: string) => {
    // Find the user message for this step, update its content, remove everything after it
    const history = get().conversationHistory;
    const userMsgIndex = history.findIndex(m => m.stepId === stepId && m.type === 'user');
    if (userMsgIndex === -1) return;
    const trimmed = history.slice(0, userMsgIndex);
    // Add the updated user message back
    const updatedMsg = { ...history[userMsgIndex], content: newContent };
    set({ conversationHistory: [...trimmed, updatedMsg] });
  },

  resetJourney: () => {
    messageCounter = 0;
    const lang = useLanguageStore.getState().language;
    set({ ...INITIAL_STATE, language: lang });
  },
}));
