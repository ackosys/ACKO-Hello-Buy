'use client';

import { motion } from 'framer-motion';
import { useUserProfileStore, type PolicyLob, type UserPolicy } from '../../lib/userProfileStore';
import { useThemeStore } from '../../lib/themeStore';
import { useT } from '../../lib/translations';

export interface PolicyStatusInfo {
  badge: string;
  message: string;
  urgency: 'high' | 'medium' | 'low';
}

export interface DropOffInfo {
  badge: string;
  title: string;
  subtitle: string;
  urgency: 'high' | 'medium' | 'low';
  route: string;
}

interface PolicyActionScreenProps {
  lobId: string;
  lobLabel: string;
  onBuyNew: () => void;
  onManagePolicy: (policy: UserPolicy) => void;
  onBack: () => void;
  statusInfo?: PolicyStatusInfo | null;
  dropOffInfo?: DropOffInfo | null;
  onContinueJourney?: () => void;
}

const LOB_ICONS: Record<string, React.ReactNode> = {
  health: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  ),
  car: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
  bike: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <circle cx="5.5" cy="17" r="3" /><circle cx="18.5" cy="17" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 6h2l3 8M5.5 17L10 9l3 3h4" />
    </svg>
  ),
  life: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path d="M12 2C6.477 2 2 6.477 2 12h4a6 6 0 0112 0h4c0-5.523-4.477-10-10-10Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12v8c0 1.105-.895 2-2 2s-2-.895-2-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_COLORS: Record<string, { bg: string; bgLight: string; text: string; textLight: string }> = {
  high: { bg: 'rgba(248,113,113,0.12)', bgLight: '#FEE2E2', text: '#f87171', textLight: '#DC2626' },
  medium: { bg: 'rgba(251,191,36,0.12)', bgLight: '#FEF3C7', text: '#fbbf24', textLight: '#D97706' },
  low: { bg: 'rgba(52,211,153,0.12)', bgLight: '#D1FAE5', text: '#34d399', textLight: '#065F46' },
};

export default function PolicyActionScreen({ lobId, lobLabel, onBuyNew, onManagePolicy, onBack, statusInfo, dropOffInfo, onContinueJourney }: PolicyActionScreenProps) {
  const pa = useT().policyAction;
  const theme = useThemeStore((s) => s.theme);
  const isLight = theme === 'light';
  const existingPolicies = useUserProfileStore((s) => s.getActivePoliciesForLob(lobId as PolicyLob));
  const firstName = useUserProfileStore((s) => s.firstName);
  const hasInProgressJourney = !!dropOffInfo && dropOffInfo.urgency !== 'low';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
      style={{ background: 'var(--app-home-gradient)' }}
    >
      <div className="relative z-10 max-w-lg mx-auto px-6 py-8">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-2 mb-8 group"
          style={{ color: 'var(--app-text-muted)' }}
        >
          <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: isLight ? 'var(--app-surface-2)' : 'rgba(255,255,255,0.1)',
              color: isLight ? '#7C3AED' : '#C4B5FD',
            }}
          >
            {LOB_ICONS[lobId] || LOB_ICONS.health}
          </div>

          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--app-text)' }}
          >
            {pa.alreadyHave(firstName, lobLabel)}
          </h1>
          <p
            className="text-sm"
            style={{ color: 'var(--app-text-muted)' }}
          >
            {pa.whatToDo}
          </p>
        </motion.div>

        {/* All cards */}
        <div className="space-y-3">
          {existingPolicies.map((policy, i) => (
            <motion.button
              key={policy.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              onClick={() => onManagePolicy(policy)}
              className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.98]"
              style={{
                background: 'var(--app-surface)',
                border: '1px solid var(--app-border)',
                boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.04)' : 'none',
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: isLight ? '#EDE9FE' : 'rgba(168,85,247,0.15)',
                    color: isLight ? '#7C3AED' : '#A78BFA',
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold" style={{ color: 'var(--app-text)' }}>
                      {policy.label}
                    </p>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: isLight ? '#D1FAE5' : 'rgba(52,211,153,0.15)',
                        color: isLight ? '#065F46' : '#34D399',
                      }}
                    >
                      {pa.activeStatus}
                    </span>
                  </div>
                  {policy.details && (
                    <p className="text-xs mb-1" style={{ color: 'var(--app-text-muted)' }}>
                      {policy.details}
                    </p>
                  )}
                  <p className="text-[11px]" style={{ color: 'var(--app-text-subtle)' }}>
                    {policy.policyNumber} · {pa.since(formatDate(policy.purchasedAt))}
                  </p>
                </div>
                <svg className="w-5 h-5 shrink-0 mt-2" style={{ color: 'var(--app-text-subtle)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              {statusInfo && (
                <div
                  className="mt-3 pt-3 flex items-center gap-2"
                  style={{ borderTop: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}` }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: isLight ? STATUS_COLORS[statusInfo.urgency].textLight : STATUS_COLORS[statusInfo.urgency].text }}
                  />
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                    style={{
                      background: isLight ? STATUS_COLORS[statusInfo.urgency].bgLight : STATUS_COLORS[statusInfo.urgency].bg,
                      color: isLight ? STATUS_COLORS[statusInfo.urgency].textLight : STATUS_COLORS[statusInfo.urgency].text,
                    }}
                  >
                    {statusInfo.badge}
                  </span>
                  <p className="text-[11px]" style={{ color: 'var(--app-text-muted)' }}>
                    {statusInfo.message}
                  </p>
                </div>
              )}
            </motion.button>
          ))}

          {/* In-progress journey card */}
          {hasInProgressJourney && (
          <motion.button
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + existingPolicies.length * 0.06 }}
            onClick={onContinueJourney || onBuyNew}
            className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.98]"
            style={{
              background: 'var(--app-surface)',
              border: `1px solid ${isLight ? 'rgba(251,191,36,0.3)' : 'rgba(251,191,36,0.25)'}`,
              boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.04)' : 'none',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background: isLight ? '#FEF3C7' : 'rgba(251,191,36,0.15)',
                  color: isLight ? '#D97706' : '#FBBF24',
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--app-text)' }}>
                  {dropOffInfo!.title || `New ${lobLabel} purchase`}
                </p>
                <p className="text-xs" style={{ color: 'var(--app-text-muted)' }}>
                  {dropOffInfo!.subtitle || pa.continueWhereLeft}
                </p>
              </div>
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap self-center"
                style={{
                  background: isLight ? '#FEF3C7' : 'rgba(251,191,36,0.15)',
                  color: isLight ? '#D97706' : '#FBBF24',
                }}
              >
                {dropOffInfo!.badge}
              </span>
              <svg className="w-5 h-5 shrink-0 mt-2" style={{ color: 'var(--app-text-subtle)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.button>
          )}

          {/* Buy new policy */}
          <motion.button
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + existingPolicies.length * 0.06 + (hasInProgressJourney ? 0.06 : 0) }}
            onClick={onBuyNew}
            className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.98]"
            style={{
              background: isLight
                ? 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)'
                : 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(168,85,247,0.15) 100%)',
              border: `1px solid ${isLight ? 'transparent' : 'rgba(168,85,247,0.3)'}`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: isLight ? 'rgba(255,255,255,0.2)' : 'rgba(168,85,247,0.2)',
                  color: isLight ? '#FFFFFF' : '#C4B5FD',
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: isLight ? '#FFFFFF' : 'var(--app-text)' }}>
                  {pa.buyAnother(lobLabel)}
                </p>
                <p className="text-xs mt-0.5" style={{ color: isLight ? 'rgba(255,255,255,0.7)' : 'var(--app-text-muted)' }}>
                  {pa.startNewPurchase}
                </p>
              </div>
              <svg className="w-5 h-5 shrink-0" style={{ color: isLight ? 'rgba(255,255,255,0.6)' : 'var(--app-text-subtle)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
