'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUserProfileStore, type PolicyLob } from '../../lib/userProfileStore';
import { useThemeStore } from '../../lib/themeStore';
import { useT } from '../../lib/translations';

interface PolicyDashboardProps {
  lobId: PolicyLob;
  lobLabel: string;
}

const LOB_ICONS: Record<string, React.ReactNode> = {
  health: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  ),
  car: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
  bike: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <circle cx="5.5" cy="17.5" r="3.5" /><circle cx="18.5" cy="17.5" r="3.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-4 5h5l-2 6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 17.5L9 10l3-4" />
    </svg>
  ),
  life: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path d="M12 2C6.477 2 2 6.477 2 12h4a6 6 0 0 1 12 0h4c0-5.523-4.477-10-10-10Z" fill="currentColor" opacity="0.15" stroke="none" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.477 2 2 6.477 2 12h4a6 6 0 0 1 12 0h4c0-5.523-4.477-10-10-10Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v8c0 1.105-.895 2-2 2s-2-.895-2-2" />
    </svg>
  ),
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatPremium(amount: number, freq?: 'monthly' | 'yearly'): string {
  const formatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  return freq === 'monthly' ? `${formatted}/mo` : freq === 'yearly' ? `${formatted}/yr` : formatted;
}

const ICONS = {
  claim: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  answers: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
  ),
  docs: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
  edit: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
    </svg>
  ),
  person: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  ),
  nominee: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  ),
  coverage: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
};

type ActionItem = { id: string; label: string; sub: string; icon: React.ReactNode };

function getActionsForLob(lobId: PolicyLob, pd: ReturnType<typeof useT>['policyDashboard']): ActionItem[] {
  if (lobId === 'life') {
    return [
      { id: 'personal', label: pd.actionPersonal, sub: pd.actionPersonalSub, icon: ICONS.person },
      { id: 'nominee', label: pd.actionNominee, sub: pd.actionNomineeSub, icon: ICONS.nominee },
      { id: 'coverage', label: pd.actionCoverage, sub: pd.actionCoverageSub, icon: ICONS.coverage },
    ];
  }
  return [
    { id: 'claim', label: pd.actionClaim, sub: pd.actionClaimSub, icon: ICONS.claim },
    { id: 'answers', label: pd.actionAnswers, sub: pd.actionAnswersSub, icon: ICONS.answers },
    { id: 'docs', label: pd.actionDocs, sub: pd.actionDocsSub, icon: ICONS.docs },
    { id: 'edit', label: pd.actionEdit, sub: pd.actionEditSub, icon: ICONS.edit },
  ];
}

export default function PolicyDashboard({ lobId, lobLabel }: PolicyDashboardProps) {
  const pd = useT().policyDashboard;
  const router = useRouter();
  const theme = useThemeStore((s) => s.theme);
  const isLight = theme === 'light';
  const firstName = useUserProfileStore((s) => s.firstName);
  const policies = useUserProfileStore((s) => s.getActivePoliciesForLob(lobId));
  const policy = policies[0];
  const actions = getActionsForLob(lobId, pd);

  if (!policy) {
    router.back();
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
      style={{ background: 'var(--app-chat-gradient)' }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 flex items-center justify-between shrink-0"
        style={{ borderBottom: `1px solid ${isLight ? 'var(--app-border)' : 'rgba(255,255,255,0.1)'}` }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-sm" style={{ color: 'var(--app-text-muted)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="8" fill="#7C3AED" />
              <path d="M12 20c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span className="text-xs font-medium" style={{ color: 'var(--app-text-muted)' }}>{pd.dashboardLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: isLight ? 'var(--app-surface)' : 'rgba(255,255,255,0.1)', color: 'var(--app-text-muted)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
          </button>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: isLight ? 'var(--app-surface)' : 'rgba(255,255,255,0.1)', color: 'var(--app-text-muted)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </button>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center ml-1"
            style={{
              background: isLight ? 'var(--app-surface)' : 'rgba(255,255,255,0.1)',
              border: `1px solid ${isLight ? 'var(--app-border)' : 'rgba(255,255,255,0.15)'}`,
            }}
          >
            <span className="text-sm font-bold" style={{ color: 'var(--app-text)' }}>{(firstName || 'U')[0].toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Policy summary card */}
      <div className="p-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-5 mb-4"
          style={{
            background: isLight ? 'var(--app-surface)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${isLight ? 'var(--app-border)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: isLight ? '#EDE9FE' : 'rgba(124,58,237,0.2)',
                color: isLight ? '#7C3AED' : '#A78BFA',
              }}
            >
              {LOB_ICONS[lobId] || LOB_ICONS.health}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs mb-1" style={{ color: 'var(--app-text-muted)' }}>
                {pd.welcomeGlance(firstName || 'there')}
              </p>
              <p className="text-base font-semibold mb-1" style={{ color: 'var(--app-text)' }}>
                {pd.planLabel(policy.label)}
              </p>
              {policy.details && (
                <p className="text-sm mb-1" style={{ color: 'var(--app-text-muted)' }}>{policy.details}</p>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {policy.premium && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{
                    background: isLight ? '#EDE9FE' : 'rgba(124,58,237,0.2)',
                    color: isLight ? '#7C3AED' : '#A78BFA',
                  }}                  >
                    {pd.premiumLabel(formatPremium(policy.premium, policy.premiumFrequency))}
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                  background: isLight ? '#D1FAE5' : 'rgba(16,185,129,0.2)',
                  color: isLight ? '#065F46' : '#6EE7B7',
                }}>
                  {pd.activeStatus}
                </span>
              </div>
              <p className="text-[11px] mt-2" style={{ color: 'var(--app-text-subtle)' }}>
                {policy.policyNumber} &middot; {pd.policyStart(formatDate(policy.purchasedAt))}
              </p>
            </div>
          </div>
        </motion.div>

        {/* "What would you like to do?" */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-medium mb-4 pl-1"
          style={{ color: 'var(--app-text-muted)' }}
        >
          {lobId === 'life' ? pd.whatToDoLife : pd.whatToDo}
        </motion.p>

        {/* Action cards */}
        <div className="flex flex-col gap-3">
          {actions.map((action, i) => (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              className="rounded-xl p-4 text-left transition-colors flex items-center gap-4"
              style={{
                background: isLight ? 'var(--app-surface)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isLight ? 'var(--app-border)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: isLight ? '#EDE9FE' : 'rgba(255,255,255,0.06)',
                  color: isLight ? '#7C3AED' : 'rgba(255,255,255,0.6)',
                }}
              >
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--app-text)' }}>{action.label}</p>
                <p className="text-xs" style={{ color: 'var(--app-text-muted)' }}>{action.sub}</p>
              </div>
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ color: 'var(--app-text-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </motion.button>
          ))}
        </div>

        {lobId === 'life' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 flex items-start gap-2 px-1"
          >
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ color: 'var(--app-text-subtle)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <p className="text-xs" style={{ color: 'var(--app-text-subtle)' }}>
              Updates can be made only once a year. <span style={{ color: isLight ? '#7C3AED' : '#A78BFA' }}>Learn more →</span>
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
