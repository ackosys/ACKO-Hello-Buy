import { create } from 'zustand';

export type PolicyLob = 'health' | 'car' | 'bike' | 'life';

export interface UserPolicy {
  id: string;
  lob: PolicyLob;
  policyNumber: string;
  label: string;
  active: boolean;
  purchasedAt: string; // ISO
  premium?: number;
  premiumFrequency?: 'monthly' | 'yearly';
  details?: string;
  urgent?: boolean; // true = show red dot (renewal due, open claim, etc.)
}

export interface UserProfile {
  firstName: string;
  phone: string;
  isLoggedIn: boolean;
  policies: UserPolicy[];
}

interface UserProfileStore extends UserProfile {
  setProfile: (profile: Partial<UserProfile>) => void;
  addPolicy: (policy: UserPolicy) => void;
  removePolicy: (id: string) => void;
  getActivePolicies: () => UserPolicy[];
  getActivePoliciesForLob: (lob: PolicyLob) => UserPolicy[];
  hasActivePolicyInLob: (lob: PolicyLob) => boolean;
  getOtherActiveLobs: (currentLob: PolicyLob) => PolicyLob[];
  getCrossLobGreeting: (currentLob: PolicyLob) => string | null;
}

const STORAGE_KEY = 'acko_user_profile';

function loadPersistedProfile(): Partial<UserProfile> {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* noop */ }
  return {};
}

function persistProfile(profile: UserProfile) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch { /* noop */ }
}

const LOB_LABELS: Record<PolicyLob, string> = {
  health: 'Health',
  car: 'Car',
  bike: 'Bike',
  life: 'Life',
};

const NEW_LOB_LABELS: Record<PolicyLob, string> = {
  health: 'Health',
  car: 'Car',
  bike: 'Bike',
  life: 'Life',
};

const INITIAL_PROFILE: UserProfile = {
  firstName: '',
  phone: '',
  isLoggedIn: false,
  policies: [],
};

export const useUserProfileStore = create<UserProfileStore>((set, get) => {
  const persisted = loadPersistedProfile();
  const initial = { ...INITIAL_PROFILE, ...persisted };

  return {
    ...initial,

    setProfile: (partial) => {
      set(partial);
      const state = get();
      persistProfile({ firstName: state.firstName, phone: state.phone, isLoggedIn: state.isLoggedIn, policies: state.policies });
    },

    addPolicy: (policy) => {
      set((s) => ({ policies: [...s.policies, policy] }));
      const state = get();
      persistProfile({ firstName: state.firstName, phone: state.phone, isLoggedIn: state.isLoggedIn, policies: state.policies });
    },

    removePolicy: (id) => {
      set((s) => ({ policies: s.policies.filter((p) => p.id !== id) }));
      const state = get();
      persistProfile({ firstName: state.firstName, phone: state.phone, isLoggedIn: state.isLoggedIn, policies: state.policies });
    },

    getActivePolicies: () => get().policies.filter((p) => p.active),

    getActivePoliciesForLob: (lob) => get().policies.filter((p) => p.active && p.lob === lob),

    hasActivePolicyInLob: (lob) => get().policies.some((p) => p.active && p.lob === lob),

    getOtherActiveLobs: (currentLob) => {
      const lobs = new Set<PolicyLob>();
      for (const p of get().policies) {
        if (p.active && p.lob !== currentLob) lobs.add(p.lob);
      }
      return Array.from(lobs);
    },

    getCrossLobGreeting: (currentLob) => {
      const state = get();
      if (!state.isLoggedIn) return null;

      const otherLobs = get().getOtherActiveLobs(currentLob);
      if (otherLobs.length === 0) return null;

      const name = (state.firstName || 'there').split(' ')[0];
      const currentLabel = NEW_LOB_LABELS[currentLob];

      if (otherLobs.length === 1) {
        const existingLabel = LOB_LABELS[otherLobs[0]];
        return `Hi ${name} 👋\nSince you already have a ${existingLabel} policy with us, you're a valued customer. Let's help you find the right ${currentLabel} plan.`;
      }

      const lobNames = otherLobs.map((l) => LOB_LABELS[l]);
      const lastLob = lobNames.pop()!;
      const lobList = lobNames.join(', ') + ' and ' + lastLob;
      return `Hi ${name} 👋\nThanks for trusting us with your ${lobList} policies. Let's now find the right ${currentLabel} cover for you.`;
    },
  };
});
