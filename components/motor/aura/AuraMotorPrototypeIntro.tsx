'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import AckoLogo from '../../AckoLogo';

/* ═══════════════════════════════════════════════════════
   Motor Prototype Intro — Two-screen onboarding
   Slide 1: Vision (why conversational motor insurance)
   Slide 2: What's inside (interactive feature cards with entry points)
   ═══════════════════════════════════════════════════════ */

interface MotorIntroProps {
  onDone: () => void;
  onJumpTo?: (stepId: string, vehicleType: 'car' | 'bike') => void;
}

const MOTOR_FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
    title: 'End-to-end conversational',
    desc: 'From vehicle selection to claims — one continuous chat, not hundreds of fragmented screens.',
    entryStepId: 'vehicle_type.select',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    title: 'Smart vehicle detection',
    desc: 'Enter your registration number — we auto-fetch make, model, variant, and policy history in seconds.',
    entryStepId: 'registration.enter_number',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    title: 'Brand new vehicle flow',
    desc: 'Just bought a new vehicle? Popular model suggestions, delivery date, owner details — all in one smooth flow.',
    entryStepId: 'manual_entry.congratulations',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Personalised plan selection',
    desc: 'Comprehensive, Zero Dep, or Third-party — each plan explained clearly, with garage tier choices and real pricing.',
    entryStepId: 'quote.plan_selection',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
    title: 'Smart add-on selection',
    desc: 'Out-of-pocket covers, family protection, variant selection — multi-select add-ons with real-time premium updates.',
    entryStepId: 'addons.out_of_pocket',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
    title: 'Premium breakdown & payment',
    desc: 'Transparent cost breakdown — base premium, add-ons, GST, NCB discount — all before you pay.',
    entryStepId: 'review.premium_breakdown',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    title: 'FNOL claims experience',
    desc: '7-question claims flow — what happened, injuries, driver details, towing — streamlined for speed and clarity.',
    entryStepId: 'db.claim_intro',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
    title: 'Post-policy dashboard',
    desc: 'Policy overview, raise claims, track requests, download documents, edit policy — all from one dashboard.',
    entryStepId: 'db.welcome',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: 'Dramatically reduces build effort',
    desc: 'Conversation-driven UI replaces hundreds of bespoke screens. One flexible framework powers every LOB.',
  },
];

export default function AuraMotorPrototypeIntro({ onDone, onJumpTo }: MotorIntroProps) {
  const [slide, setSlide] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState<'car' | 'bike'>('car');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, var(--aura-bg) 0%, var(--aura-bg) 35%, var(--aura-surface) 65%, var(--aura-bg) 100%)' }}
    >
      <AnimatePresence mode="wait">
        {/* ═══════ SLIDE 1: The Vision ═══════ */}
        {slide === 0 && (
          <motion.div
            key="slide-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.4 }}
            className="h-full flex flex-col"
          >
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-[15%] left-[10%] w-72 h-72 rounded-full blur-[100px]" style={{ backgroundColor: 'rgba(168,85,247,0.05)' }} />
              <div className="absolute bottom-[20%] right-[5%] w-96 h-96 rounded-full blur-[120px]" style={{ backgroundColor: 'rgba(168,85,247,0.03)' }} />
              <div className="absolute top-[60%] left-[50%] w-48 h-48 rounded-full blur-[80px]" style={{ backgroundColor: 'rgba(236,72,153,0.03)' }} />
            </div>

            <div className="flex-1 flex flex-col justify-center px-7 relative z-10 max-w-lg mx-auto w-full">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-10"
              >
                <AckoLogo variant="full-white" className="h-7" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-5"
              >
                <span
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-medium tracking-wide uppercase"
                  style={{ backgroundColor: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.15)', color: '#C084FC' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  A Revolutionised Motor Insurance Flow
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-[32px] sm:text-[38px] font-bold leading-[1.15] mb-5 tracking-tight"
                style={{ color: 'var(--aura-text)' }}
              >
                Insuring your ride{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#C084FC] via-[#F472B6] to-[#FB923C]">
                  through conversation
                </span>{' '}
                not forms.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="text-[15px] leading-relaxed mb-8 max-w-md"
                style={{ color: 'var(--aura-text-muted)' }}
              >
                Motor insurance was always sold through agents who understood your vehicle, your driving habits, your budget. We&apos;re bringing that back, powered by AI.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                className="rounded-2xl p-5 mb-6"
                style={{ backgroundColor: 'var(--aura-surface)', border: '1px solid var(--aura-border)' }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold mb-1 text-white/80">Today&apos;s reality</p>
                    <p className="text-[13px] leading-relaxed" style={{ color: 'var(--aura-text-subtle)' }}>
                      Hundreds of screens. Quote comparison, plan selection, add-ons, payment, claims — all disconnected. Users drop off because the experience feels like paperwork.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold mb-1 text-white/80">This prototype</p>
                    <p className="text-[13px] leading-relaxed" style={{ color: 'var(--aura-text-subtle)' }}>
                      One unified conversation — from &ldquo;what would you like to insure?&rdquo; to your policy dashboard and claims. Car and Bike, new and existing.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center gap-2.5 mb-8"
              >
                <div className="w-px h-8 bg-gradient-to-b from-transparent via-[#A855F7]/30 to-transparent" />
                <p className="text-[12px] italic leading-relaxed" style={{ color: 'var(--aura-text-subtle)' }}>
                  &ldquo;The best insurance experience is a conversation, not a comparison table.&rdquo;
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="px-7 pb-10 relative z-10 max-w-lg mx-auto w-full"
            >
              <button
                onClick={() => setSlide(1)}
                className="w-full py-4 rounded-2xl font-semibold text-[15px] text-white transition-all shadow-lg shadow-black/30 active:scale-[0.98] hover:opacity-90"
                style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
              >
                See what&apos;s inside
              </button>
              <button
                onClick={onDone}
                className="w-full mt-3 py-2.5 text-[13px] transition-colors"
                style={{ color: 'var(--aura-text-subtle)' }}
              >
                Skip intro
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* ═══════ SLIDE 2: What's Inside ═══════ */}
        {slide === 1 && (
          <motion.div
            key="slide-1"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full flex flex-col"
          >
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-[10%] right-[10%] w-64 h-64 rounded-full blur-[100px]" style={{ backgroundColor: 'rgba(168,85,247,0.05)' }} />
              <div className="absolute bottom-[15%] left-[5%] w-80 h-80 rounded-full blur-[110px]" style={{ backgroundColor: 'rgba(168,85,247,0.03)' }} />
            </div>

            <div className="flex-1 overflow-y-auto relative z-10">
              <div className="px-7 pt-14 pb-6 max-w-lg mx-auto w-full">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => setSlide(0)}
                  className="flex items-center gap-1.5 text-[13px] text-[var(--aura-text-muted)] hover:text-[#C084FC] transition-colors mb-6"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </motion.button>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mb-2"
                >
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide uppercase"
                    style={{ backgroundColor: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.15)', color: '#C084FC' }}
                  >
                    What&apos;s inside
                  </span>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-[26px] font-bold leading-tight mb-2 tracking-tight"
                  style={{ color: 'var(--aura-text)' }}
                >
                  Everything in one flow
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-[13px] mb-5 leading-relaxed"
                  style={{ color: 'var(--aura-text-subtle)' }}
                >
                  Tap any section to jump directly into that part of the journey.
                </motion.p>

                {/* Car / Bike Toggle */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 }}
                  className="flex items-center gap-2 mb-6"
                >
                  <span className="text-[12px] mr-1" style={{ color: 'var(--aura-text-subtle)' }}>Experience as</span>
                  <button
                    onClick={() => setSelectedVehicle('car')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all"
                    style={
                      selectedVehicle === 'car'
                        ? { background: 'rgba(168,85,247,0.15)', color: '#C084FC', border: '1px solid rgba(168,85,247,0.2)' }
                        : { backgroundColor: 'var(--aura-surface)', color: 'var(--aura-text-subtle)', border: '1px solid var(--aura-border)' }
                    }
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                    Car
                  </button>
                  <button
                    onClick={() => setSelectedVehicle('bike')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all"
                    style={
                      selectedVehicle === 'bike'
                        ? { background: 'rgba(168,85,247,0.15)', color: '#C084FC', border: '1px solid rgba(168,85,247,0.2)' }
                        : { backgroundColor: 'var(--aura-surface)', color: 'var(--aura-text-subtle)', border: '1px solid var(--aura-border)' }
                    }
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <circle cx="5.5" cy="17" r="2.5" />
                      <circle cx="18.5" cy="17" r="2.5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.5L10 9l3 3h4l1.5-3" />
                    </svg>
                    Bike
                  </button>
                </motion.div>

                <div className="space-y-2.5">
                  {MOTOR_FEATURES.map((f, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      onClick={() => {
                        if (f.entryStepId && onJumpTo) {
                          onJumpTo(f.entryStepId, selectedVehicle);
                        }
                      }}
                      className={`
                        w-full flex items-start gap-3.5 p-4 rounded-xl transition-all text-left
                        ${f.entryStepId ? 'hover:border-[#A855F7]/20 active:scale-[0.98] cursor-pointer' : 'cursor-default'}
                      `}
                      style={{
                        backgroundColor: 'var(--aura-surface)',
                        border: '1px solid var(--aura-border)',
                      }}
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.1)', color: '#C084FC' }}>
                        {f.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-semibold text-white/85 mb-0.5">{f.title}</p>
                          {f.entryStepId && (
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="#A855F7" strokeOpacity={0.4} viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          )}
                        </div>
                        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--aura-text-subtle)' }}>{f.desc}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-6 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-500/[0.05] border border-amber-400/10"
                >
                  <span className="text-amber-400 text-lg flex-shrink-0">*</span>
                  <p className="text-[11px] text-amber-300/50 leading-relaxed">
                    This is a functional prototype — not a production build. Designed to demonstrate the vision and flow.
                  </p>
                </motion.div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="px-7 pb-10 pt-4 relative z-10 max-w-lg mx-auto w-full"
              style={{ background: 'linear-gradient(to top, var(--aura-bg) 60%, transparent)' }}
            >
              <button
                onClick={onDone}
                className="w-full py-4 rounded-2xl font-semibold text-[15px] text-white transition-all shadow-lg shadow-black/30 active:scale-[0.98] hover:opacity-90"
                style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
              >
                Start the journey
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {[0, 1].map((i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              slide === i ? 'w-6 bg-white/40' : 'w-1.5 bg-white/10 hover:bg-white/25'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}
