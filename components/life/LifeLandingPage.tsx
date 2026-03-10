'use client';

import { motion } from 'framer-motion';
import AckoLogo from '../AckoLogo';
import GradientBadge from '../ds/GradientBadge';
import Link from 'next/link';

interface LifeLandingPageProps {
  onGetStarted: () => void;
}

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.45, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LifeLandingPage({ onGetStarted }: LifeLandingPageProps) {
  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--app-home-gradient)' }}>
      {/* Sticky top bar */}
      <div className="sticky top-0 z-50" style={{ background: 'var(--app-glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <AckoLogo variant="full-white" className="h-5" />
          </Link>
          <span className="text-xs text-purple-200/60 font-medium">Life Insurance</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto">

        {/* HERO */}
        <div className="px-6 pt-10 pb-6 text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-purple-200 text-[11px] font-medium px-3 py-1.5 rounded-full mb-5 border border-white/15">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.477 2 2 6.477 2 12h4a6 6 0 0 1 12 0h4c0-5.523-4.477-10-10-10Z" fill="currentColor" opacity="0.6" />
                <path d="M12 12v8c0 1.105-.895 2-2 2s-2-.895-2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              ₹25 Lakh — ₹100 Crore coverage
            </div>

            <h1 className="text-[24px] font-bold text-white leading-[1.3] mb-3">
              Nothing mixed in.<br />Get 100% pure protection<br />with <span className="text-purple-200">ACKO Life Term Plan</span>
            </h1>

            <p className="text-sm text-purple-200/70 mb-6 max-w-xs mx-auto leading-relaxed">
              Pure term insurance — no investment mixing,<br />no hidden charges, just protection.
            </p>
          </motion.div>
        </div>

        {/* Key Benefits Row */}
        <FadeIn className="px-6 pb-8">
          <div className="flex items-stretch gap-2.5">
            {[
              { icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: '0% GST\non premium' },
              { icon: 'M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75', label: 'Adjust your\ncoverage' },
              { icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z', label: 'Create your\nwill FREE' },
            ].map((item, i) => (
              <div key={i} className="flex-1 bg-white/10 border border-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
                  <svg className="w-4 h-4 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <p className="text-[11px] text-white/80 font-medium leading-tight whitespace-pre-line">{item.label}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Trust Signals */}
        <FadeIn className="px-6 pb-8">
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { value: 'Best Direct', sub: 'Insurer 2025', icon: '🏆' },
              { value: '8 Cr+', sub: 'Indians trust us', icon: '👥' },
              { value: '4.6+', sub: 'Google ratings', icon: '⭐' },
              { value: '10M+', sub: 'Claims settled', icon: '✓' },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 backdrop-blur-sm flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{item.value}</p>
                  <p className="text-[11px] text-purple-200/50">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Returns Comparison */}
        <FadeIn className="px-6 pb-8">
          <div className="bg-white/10 border border-white/15 rounded-2xl p-5 backdrop-blur-sm">
            <p className="text-[11px] text-purple-200 font-semibold uppercase tracking-wider mb-1">Returns Comparison</p>
            <h2 className="text-[18px] font-bold text-white leading-tight mb-1.5">
              Get more returns when you<br />choose a pure term plan
            </h2>
            <p className="text-[12px] text-purple-200/50 mb-5">35-year-old, ₹1 Crore cover</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Return of Premium plan */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Return-of-Premium</p>
                <p className="text-lg font-bold text-white/50 leading-none">₹34K</p>
                <p className="text-[11px] text-white/30 mt-0.5">/year</p>
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-[11px] text-white/30">Total paid: ₹12L</p>
                  <p className="text-sm font-bold text-red-400 mt-0.5">0% returns</p>
                </div>
              </div>
              {/* ACKO Pure Term */}
              <div className="p-3.5 rounded-xl bg-white/15 border border-purple-400/30">
                <GradientBadge className="mb-2">RECOMMENDED</GradientBadge>
                <p className="text-lg font-bold text-white leading-none">₹15K</p>
                <p className="text-[11px] text-purple-200/60 mt-0.5">/year</p>
                <div className="mt-3 pt-3 border-t border-white/15">
                  <p className="text-[11px] text-purple-200/60">Total paid: ₹6L</p>
                  <p className="text-sm font-bold text-green-300 mt-0.5">₹80L returns*</p>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-purple-200/40 text-center">*Assuming 12% year-on-year growth if invested separately</p>
          </div>
        </FadeIn>

        {/* Additional Benefits */}
        <FadeIn className="px-6 pb-8">
          <h2 className="text-[18px] font-bold text-white leading-tight mb-4">
            More reasons to choose ACKO
          </h2>
          <div className="bg-white/10 border border-white/15 rounded-2xl p-5 backdrop-blur-sm space-y-0">
            {[
              {
                icon: 'M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75',
                title: 'Adjust your coverage',
                desc: 'Increase or decrease without buying new policies.',
              },
              {
                icon: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                title: 'Zero commission on premium',
                desc: 'Buy directly — no hidden charges or middlemen.',
              },
              {
                icon: 'M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z',
                title: 'Tax savings up to ₹54,600',
                desc: 'Under Section 80C and 80D.',
              },
              {
                icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
                title: 'Create your will for FREE',
                desc: 'Digital will with unlimited edits, worth ₹50,000.',
              },
            ].map((item, i, arr) => (
              <div key={i} className={`flex items-start gap-3 py-4 ${i < arr.length - 1 ? 'border-b border-white/15' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-white font-semibold">{item.title}</p>
                  <p className="text-sm text-purple-200/60 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* FAQ */}
        <FadeIn className="px-6 pb-10">
          <h2 className="text-[18px] font-bold text-white leading-tight mb-1.5 text-center">
            Have questions?
          </h2>
          <p className="text-sm text-purple-200/60 text-center mb-5">Get honest answers.</p>

          <div className="space-y-2.5">
            {[
              { q: 'If I survive the term, my money is wasted?', a: 'Insurance is like a seatbelt. You don\'t regret not crashing — you\'re grateful you were protected during your earning years.' },
              { q: 'Why not buy a plan that gives returns?', a: 'When you mix insurance + investment, part goes to mortality charges, part to commissions, part to fund management. You get lower cover AND lower returns. Separate them for better results.' },
              { q: 'What if my needs change over time?', a: 'ACKO Flexi lets you increase or decrease coverage every year or anytime after 5 years. You don\'t have to get it perfect today.' },
              { q: 'Will ACKO be around in 30 years?', a: 'ACKO is backed by Munich Re, one of the world\'s largest reinsurers. Your policy is also protected by IRDAI regulations. Even if something changes, your coverage is guaranteed.' },
            ].map((item, i) => (
              <motion.details
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="group bg-white/10 border border-white/15 rounded-xl overflow-hidden backdrop-blur-sm"
              >
                <summary className="flex items-center justify-between px-4 py-3.5 cursor-pointer list-none">
                  <span className="text-sm font-medium text-white/90 pr-3">{item.q}</span>
                  <svg className="w-4 h-4 text-white/40 flex-shrink-0 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <div className="px-4 pb-3.5 -mt-1">
                  <p className="text-sm text-purple-200/60 leading-relaxed">{item.a}</p>
                </div>
              </motion.details>
            ))}
          </div>
        </FadeIn>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="h-8" style={{ background: 'linear-gradient(to bottom, transparent, var(--app-glass-bg))' }} />
        <div className="px-6 pb-6 pt-2 pointer-events-auto" style={{ background: 'var(--app-glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <div className="max-w-lg mx-auto">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onClick={onGetStarted}
              className="w-full py-4 bg-purple-700 text-white hover:bg-purple-600 rounded-2xl text-base font-bold transition-all active:scale-[0.97]"
            >
              Get a quote
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
