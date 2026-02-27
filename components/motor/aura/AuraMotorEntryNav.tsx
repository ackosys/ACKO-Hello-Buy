'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import AckoLogo from '../../AckoLogo';
import ThemeToggle from '../../global/ThemeToggle';
import Link from 'next/link';
import { VehicleType } from '../../../lib/motor/types';
import { useThemeStore } from '../../../lib/themeStore';
import { useT } from '../../../lib/translations';

interface AuraMotorEntryNavProps {
  initialVehicle?: VehicleType;
  onStartJourney: (vehicleType: VehicleType) => void;
  onJumpTo: (stepId: string, vehicleType: VehicleType) => void;
}

export default function AuraMotorEntryNav({ initialVehicle = 'car', onStartJourney, onJumpTo }: AuraMotorEntryNavProps) {
  const [vehicle, setVehicle] = useState<VehicleType>(initialVehicle);
  const theme = useThemeStore((s) => s.theme);
  const t = useT();

  const jump = (stepId: string) => onJumpTo(stepId, vehicle);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'var(--motor-chat-gradient)' }}
    >
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-purple-400/10 blur-3xl" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 pt-10 pb-28">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <Link href="/">
          <AckoLogo variant={theme === 'light' ? 'color' : theme === 'dark' ? 'white' : 'full-white'} className="h-8" />
        </Link>
        <ThemeToggle />
      </div>

      <div className="max-w-lg mx-auto w-full relative z-10 flex-1 flex flex-col">

        {/* Vehicle type toggle */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <p className="text-purple-300/60 text-xs mb-2.5 font-medium">Experience as</p>
          <div className="flex gap-2">
            {(['car', 'bike'] as VehicleType[]).map((v) => (
              <button
                key={v}
                onClick={() => setVehicle(v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  vehicle === v
                    ? 'bg-white/15 text-white border border-white/25'
                    : 'bg-white/5 text-purple-300/60 border border-white/8 hover:bg-white/10'
                }`}
              >
                {v === 'car' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <circle cx="5.5" cy="17" r="3" />
                    <circle cx="18.5" cy="17" r="3" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 6h2l3 8M5.5 17L10 9l3 3h4" />
                  </svg>
                )}
                {v === 'car' ? t.motorScripts.optionCar : t.motorScripts.optionBike}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ─── Section 1: Buy Insurance ─── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-8">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-full bg-white/15 text-white text-xs font-bold flex items-center justify-center border border-white/20">1</div>
            <h2 className="text-white text-lg font-semibold">{vehicle === 'car' ? t.motorScripts.newOption('Car') : t.motorScripts.newOption('Bike')} Insurance</h2>
          </div>
          <p className="text-purple-300/80 text-sm mb-4 ml-10">{t.motorScripts.popularSubText}</p>
          <div className="flex gap-3 ml-10">
            <button
              onClick={() => jump('registration.enter_number')}
              className="flex-1 group bg-white/8 hover:bg-white/15 backdrop-blur-sm border border-white/15 hover:border-white/30 rounded-xl p-4 text-left transition-all active:scale-[0.97]"
            >
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center mb-2.5">
                <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644V14.652" />
                </svg>
              </div>
              <h3 className="text-white text-sm font-semibold mb-0.5">{t.motorScripts.renewOption}</h3>
              <p className="text-purple-300/60 text-xs">{t.motorScripts.renewOptionDesc(vehicle)}</p>
            </button>
            <button
              onClick={() => jump('manual_entry.congratulations')}
              className="flex-1 group bg-white/8 hover:bg-white/15 backdrop-blur-sm border border-white/15 hover:border-white/30 rounded-xl p-4 text-left transition-all active:scale-[0.97]"
            >
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center mb-2.5">
                <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
                </svg>
              </div>
              <h3 className="text-white text-sm font-semibold mb-0.5">{t.motorScripts.brandNewExcited(vehicle)}</h3>
              <p className="text-purple-300/60 text-xs">{t.motorScripts.newOptionDesc(vehicle)}</p>
            </button>
          </div>
        </motion.div>

        {/* ─── Section 2: Explore Scenarios ─── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-8">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-full bg-white/15 text-white text-xs font-bold flex items-center justify-center border border-white/20">2</div>
            <h2 className="text-white text-lg font-semibold">Explore Key Scenarios</h2>
          </div>
          <p className="text-purple-300/80 text-sm mb-3 ml-10">Jump to any section of the buy journey</p>
          <div className="ml-10 space-y-2">
            <NavButton
              color="amber"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>}
              label="Smart vehicle detection"
              sublabel="Enter reg number → auto-fetch make, model, policy"
              onClick={() => jump('registration.has_number')}
            />
            <NavButton
              color="cyan"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>}
              label="Plan selection & pricing"
              sublabel="Comprehensive, Zero Dep, Third Party — real pricing"
              onClick={() => jump('quote.plan_selection')}
            />
            <NavButton
              color="pink"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>}
              label="Add-on selection"
              sublabel="Out-of-pocket covers, family protection, variants"
              onClick={() => jump('addons.out_of_pocket')}
            />
            <NavButton
              color="emerald"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>}
              label="Premium breakdown & payment"
              sublabel="Transparent cost breakdown — base, add-ons, GST, NCB"
              onClick={() => jump('review.premium_breakdown')}
            />
          </div>
        </motion.div>

        {/* Trust badges */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-auto flex items-center justify-center gap-5 text-purple-400/70 text-xs pt-4">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            1 Cr+ vehicles insured
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
            IRDAI licensed
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
            5,400+ garages
          </span>
        </motion.div>
      </div>
      </div>

      {/* Sticky bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-20"
        style={{
          background: theme === 'light'
            ? 'linear-gradient(to top, var(--motor-bg, #F8F7FC) 60%, transparent)'
            : 'linear-gradient(to top, #0D0521 60%, transparent)',
        }}
      >
        <div className="max-w-lg mx-auto px-6 pb-6 pt-8">
          <button
            onClick={() => onStartJourney(vehicle)}
            className="w-full py-3.5 rounded-2xl text-white font-semibold text-[15px] transition-all active:scale-[0.98]"
            style={{
              background: 'var(--motor-cta-bg)',
              color: 'var(--motor-cta-text)',
              boxShadow: theme === 'light'
                ? '0 4px 16px rgba(124,58,237,0.25)'
                : '0 8px 32px rgba(168,85,247,0.4)',
            }}
          >
            Start the journey
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Reusable nav button ── */
const COLOR_MAP: Record<string, string> = {
  amber: 'bg-amber-500/20 text-amber-300',
  cyan: 'bg-cyan-500/20 text-cyan-300',
  pink: 'bg-pink-500/20 text-pink-300',
  emerald: 'bg-emerald-500/20 text-emerald-300',
  red: 'bg-red-500/20 text-red-300',
  orange: 'bg-orange-500/20 text-orange-300',
  violet: 'bg-violet-500/20 text-violet-300',
  green: 'bg-green-500/20 text-green-300',
};

function NavButton({ color, icon, label, sublabel, onClick }: {
  color: string;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white/6 hover:bg-white/12 border border-white/10 hover:border-white/25 rounded-xl p-3 flex items-center gap-3 transition-all active:scale-[0.98] text-left"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${COLOR_MAP[color] || COLOR_MAP.amber}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-medium">{label}</p>
        <p className="text-purple-300/50 text-[11px] mt-0.5">{sublabel}</p>
      </div>
      <svg className="w-3.5 h-3.5 text-purple-400/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </button>
  );
}
