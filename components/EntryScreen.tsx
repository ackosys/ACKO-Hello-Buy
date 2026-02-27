'use client';

import { motion } from 'framer-motion';
import AckoLogo from './AckoLogo';
import { useT } from '../lib/translations';
import Link from 'next/link';

interface EntryScreenProps {
  onSelect: (isExistingUser: boolean) => void;
  onJumpToPostPayment?: () => void;
  onJumpToCall?: () => void;
  onJumpToPostCallScenarios?: () => void;
}

export default function EntryScreen({ onSelect, onJumpToPostPayment, onJumpToCall, onJumpToPostCallScenarios }: EntryScreenProps) {
  const t = useT();
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
          <AckoLogo variant="full-white" className="h-8" />
        </Link>
        <span className="text-[10px] bg-white/10 text-purple-200 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-white/10">{t.entry.prototype}</span>
      </div>

      <div className="max-w-lg mx-auto w-full relative z-10 flex-1 flex flex-col">

        {/* ─── Section 1: Buy Journey ─── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-8">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-full bg-white/15 text-white text-xs font-bold flex items-center justify-center border border-white/20">1</div>
            <h2 className="text-white text-lg font-semibold">{t.entry.buyHealth}</h2>
          </div>
          <p className="text-purple-300/80 text-sm mb-4 ml-10">{t.entry.buyHealthSub}</p>
          <div className="ml-10">
            <button onClick={() => onSelect(false)} className="w-full group bg-white/8 hover:bg-white/15 backdrop-blur-sm border border-white/15 hover:border-white/30 rounded-xl p-4 flex items-center gap-3 transition-all active:scale-[0.97] text-left">
              <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-sm font-semibold">Buy health policy</h3>
                <p className="text-purple-300/60 text-xs">Get covered in under 5 minutes</p>
              </div>
              <svg className="w-4 h-4 text-purple-400/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
          </div>
        </motion.div>

        {/* ─── Section 2: Phone Call with Dr. Riya ─── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-8">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-full bg-white/15 text-white text-xs font-bold flex items-center justify-center border border-white/20">2</div>
            <h2 className="text-white text-lg font-semibold">{t.entry.phoneCall}</h2>
          </div>
          <p className="text-purple-300/80 text-sm mb-3 ml-10">{t.entry.phoneCallSub}</p>
          <div className="ml-10 space-y-2">
            {onJumpToPostPayment && (
              <button onClick={onJumpToPostPayment} className="w-full bg-white/6 hover:bg-white/12 border border-white/10 hover:border-white/25 rounded-xl p-3 flex items-center gap-3 transition-all active:scale-[0.98] text-left">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium">{t.entry.fullFlow}</p>
                </div>
                <svg className="w-3.5 h-3.5 text-purple-400/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              </button>
            )}
            {onJumpToCall && (
              <button onClick={onJumpToCall} className="w-full bg-white/6 hover:bg-white/12 border border-white/10 hover:border-white/25 rounded-xl p-3 flex items-center gap-3 transition-all active:scale-[0.98] text-left">
                <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium">{t.entry.jumpToCall}</p>
                </div>
                <svg className="w-3.5 h-3.5 text-purple-400/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              </button>
            )}
          </div>
        </motion.div>

        {/* ─── Section 3: Post-Call Scenarios ─── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mb-8">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-full bg-white/15 text-white text-xs font-bold flex items-center justify-center border border-white/20">3</div>
            <h2 className="text-white text-lg font-semibold">{t.entry.postCallScenarios}</h2>
          </div>
          <p className="text-purple-300/80 text-sm mb-3 ml-10">{t.entry.postCallSub}</p>
          {onJumpToPostCallScenarios && (
            <div className="ml-10">
              <button onClick={onJumpToPostCallScenarios} className="w-full bg-white/6 hover:bg-white/12 border border-white/10 hover:border-white/25 rounded-xl p-3 flex items-center gap-3 transition-all active:scale-[0.98] text-left">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium">{t.entry.postCallOptions}</p>
                </div>
                <svg className="w-3.5 h-3.5 text-purple-400/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              </button>
            </div>
          )}
        </motion.div>

        {/* Trust badges at bottom */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-auto flex items-center justify-center gap-5 text-purple-400/70 text-xs pt-4">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {t.entry.trustCustomers}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
            {t.entry.trustIRDAI}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M3.75 21V6.75A2.25 2.25 0 016 4.5h3a2.25 2.25 0 012.25 2.25V21" /></svg>
            {t.entry.trustHospitals}
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}
