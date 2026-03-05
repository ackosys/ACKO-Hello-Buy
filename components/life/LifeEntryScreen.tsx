'use client';

import { motion } from 'framer-motion';
import AckoLogo from '../AckoLogo';
import Link from 'next/link';
import { useThemeStore } from '../../lib/themeStore';
import { useT } from '../../lib/translations';

interface LifeEntryScreenProps {
  onBuyJourney: () => void;
  onJumpToEkyc: () => void;
  onJumpToFinancial: () => void;
  onJumpToMedical: () => void;
  onJumpToUnderwriting: () => void;
  onJumpToDashboard?: () => void;
}

function StepCard({ onClick, icon, title, subtitle, iconBg }: {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  iconBg: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white/6 hover:bg-white/12 border border-white/10 hover:border-white/25 rounded-xl p-3 flex items-center gap-3 transition-all active:scale-[0.98] text-left"
    >
      <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-medium">{title}</p>
        {subtitle && <p className="text-purple-300/60 text-[11px] mt-0.5">{subtitle}</p>}
      </div>
      <svg className="w-3.5 h-3.5 text-purple-400/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </button>
  );
}

export default function LifeEntryScreen({
  onBuyJourney,
  onJumpToEkyc,
  onJumpToFinancial,
  onJumpToMedical,
  onJumpToUnderwriting,
  onJumpToDashboard,
}: LifeEntryScreenProps) {
  const { theme } = useThemeStore();
  const t = useT();
  const steps = [
    {
      number: 1,
      title: t.lifeScripts.lifeWelcome,
      desc: t.lifeScripts.introPassive,
      cards: [
        {
          onClick: onBuyJourney,
          iconBg: 'bg-purple-500/20',
          icon: (
            <svg className="w-4 h-4 text-purple-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M12 2C6.477 2 2 6.477 2 12h4a6 6 0 0 1 12 0h4c0-5.523-4.477-10-10-10Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 12v8c0 1.105-.895 2-2 2s-2-.895-2-2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="2" x2="12" y2="4" strokeLinecap="round" />
            </svg>
          ),
          title: 'Buy pure term life insurance',
          subtitle: 'Get covered in under 5 minutes',
        },
      ],
    },
    {
      number: 2,
      title: 'e-KYC Verification',
      desc: 'Verify identity with Aadhaar OTP — takes under 2 minutes',
      cards: [
        {
          onClick: onJumpToEkyc,
          iconBg: 'bg-blue-500/20',
          icon: (
            <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
            </svg>
          ),
          title: 'Aadhaar-based e-KYC',
          subtitle: 'OTP verification via UIDAI',
        },
      ],
    },
    {
      number: 3,
      title: 'Income & Medical Verification',
      desc: 'Income proof, video call with doctor, home tests if needed',
      cards: [
        {
          onClick: onJumpToFinancial,
          iconBg: 'bg-amber-500/20',
          icon: (
            <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          ),
          title: 'Financial verification',
          subtitle: 'EPFO, Account Aggregator, or salary slips',
        },
        {
          onClick: onJumpToMedical,
          iconBg: 'bg-pink-500/20',
          icon: (
            <svg className="w-4 h-4 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          ),
          title: 'Medical evaluation (VMER)',
          subtitle: '15–20 min video call with a doctor',
        },
      ],
    },
    {
      number: 4,
      title: 'Underwriting Decision',
      desc: 'Approval, modification, or full refund after review',
      cards: [
        {
          onClick: onJumpToUnderwriting,
          iconBg: 'bg-green-500/20',
          icon: (
            <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          ),
          title: 'Check underwriting status',
          subtitle: 'Approval · Info needed · Policy issuance',
        },
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen gradient-purple flex flex-col px-6 pt-10 pb-8 relative overflow-hidden"
    >
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-purple-400/10 blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-10 relative z-10">
        <Link href="/">
          <AckoLogo variant={theme === 'light' ? 'color' : theme === 'dark' ? 'white' : 'full-white'} className="h-8" />
        </Link>
        <span className="text-[10px] bg-white/10 text-purple-200 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-white/10">
          Life Insurance
        </span>
      </div>

      <div className="max-w-lg mx-auto w-full relative z-10 flex-1 flex flex-col">
        {steps.map((step, i) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.1 }}
            className="mb-8"
          >
            {/* Step header */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-full bg-white/15 text-white text-xs font-bold flex items-center justify-center border border-white/20">
                {step.number}
              </div>
              <h2 className="text-white text-lg font-semibold">{step.title}</h2>
            </div>

            {/* Description */}
            <p className="text-purple-300/80 text-sm mb-3 ml-10">{step.desc}</p>

            {/* Action cards */}
            <div className="ml-10 space-y-2">
              {step.cards.map((card, ci) => (
                <StepCard key={ci} {...card} />
              ))}
            </div>
          </motion.div>
        ))}

        {/* Trust badges at bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-auto flex items-center justify-center gap-5 text-purple-400/70 text-xs pt-4"
        >
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            IRDAI Licensed
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
            ₹100 Cr Max Coverage
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            100% Digital
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}
