'use client';

/**
 * MotorHelloEntry — Conversational entry point for the Motor LOB.
 *
 * Renders one of three contextual opening scripts:
 *   A. renewal_pending  — e.g. Kiran's Swift expiring in 24 days
 *   B. has_history      — user has looked at vehicles before
 *   C. fresh            — brand-new session
 *
 * Intent chips flow into the main MotorChatContainer journey.
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useT } from '../../lib/translations';
import {
  getRecentVehicles,
  detectEntryState,
  EntryState,
  RecentVehicle,
} from '../../lib/motorRecentVehicles';
import { MotorIntent } from '../../lib/motor/types';

interface MotorHelloEntryProps {
  userName?: string;
  vehicleType?: 'car' | 'bike';
  onIntentSelected: (intent: MotorIntent, vehicle?: RecentVehicle) => void;
}

// ── Bot message bubble ────────────────────────────────────────────────────────

function BotBubble({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.3, ease: 'easeOut' }}
      className="flex items-start gap-3 max-w-[86%]"
    >
      {/* ACKO avatar dot */}
      <div
        className="w-7 h-7 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-[10px] font-black"
        style={{ background: 'var(--app-accent, #7C3AED)', color: '#fff' }}
      >
        A
      </div>
      <div
        className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed"
        style={{
          background: 'var(--app-surface, rgba(255,255,255,0.08))',
          color: 'var(--app-text)',
          border: '1px solid var(--app-border, rgba(255,255,255,0.1))',
        }}
      >
        {text}
      </div>
    </motion.div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="flex items-center gap-3"
    >
      <div
        className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black"
        style={{ background: 'var(--app-accent, #7C3AED)', color: '#fff' }}
      >
        A
      </div>
      <div
        className="px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5"
        style={{
          background: 'var(--app-surface, rgba(255,255,255,0.08))',
          border: '1px solid var(--app-border, rgba(255,255,255,0.1))',
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--app-text-muted)' }}
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── Intent option chip ────────────────────────────────────────────────────────

function IntentChip({
  label,
  sub,
  icon,
  accent,
  delay,
  onClick,
}: {
  label: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: boolean;
  delay?: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay ?? 0, duration: 0.28, ease: 'easeOut' }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
      style={{
        background: accent
          ? 'var(--btn-primary-bg)'
          : 'var(--app-surface, rgba(255,255,255,0.06))',
        border: `1.5px solid ${accent ? 'transparent' : 'var(--app-border, rgba(255,255,255,0.12))'}`,
        color: accent ? 'var(--btn-primary-text)' : 'var(--app-text)',
        boxShadow: accent ? 'var(--btn-primary-shadow)' : undefined,
      }}
    >
      <span className="text-xl shrink-0">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold leading-tight">{label}</span>
        {sub && (
          <span
            className="block text-xs mt-0.5"
            style={{ color: accent ? 'rgba(255,255,255,0.75)' : 'var(--app-text-muted)' }}
          >
            {sub}
          </span>
        )}
      </span>
      <svg
        className="w-4 h-4 shrink-0 opacity-60"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </motion.button>
  );
}

// ── Vehicle card (recent history / renewal) ───────────────────────────────────

function VehicleCard({
  vehicle,
  daysLeft,
  onRenew,
  onHistory,
  delay,
}: {
  vehicle: RecentVehicle;
  daysLeft?: number;
  onRenew?: () => void;
  onHistory?: () => void;
  delay?: number;
}) {
  const t = useT();
  const isUrgent = typeof daysLeft === 'number' && daysLeft <= 14;
  const hasExpiry = typeof daysLeft === 'number';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay ?? 0, duration: 0.3 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--app-surface, rgba(255,255,255,0.06))',
        border: `1.5px solid ${isUrgent ? 'rgba(234,88,12,0.5)' : 'var(--app-border, rgba(255,255,255,0.12))'}`,
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Brand logo */}
        <div
          className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          {vehicle.brandLogoUrl ? (
            <Image
              src={vehicle.brandLogoUrl}
              alt={vehicle.make}
              width={32}
              height={32}
              className="object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <span className="text-xs font-bold" style={{ color: 'var(--app-text-muted)' }}>
              {vehicle.make.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        {/* Vehicle info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--app-text)' }}>
            {vehicle.make} {vehicle.model}
            {vehicle.variant ? ` ${vehicle.variant}` : ''}
          </p>
          {vehicle.registrationNumber && (
            <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--app-text-muted)' }}>
              {t.motorEntry.regLabel} {vehicle.registrationNumber}
            </p>
          )}
        </div>

        {/* Expiry badge */}
        {hasExpiry && (
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0"
            style={{
              background: isUrgent ? 'rgba(234,88,12,0.15)' : 'rgba(234,179,8,0.15)',
              color: isUrgent ? '#EA580C' : '#CA8A04',
            }}
          >
            {t.motorEntry.expiringSoon(daysLeft!)}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div
        className="flex border-t"
        style={{ borderColor: 'var(--app-border, rgba(255,255,255,0.08))' }}
      >
        {onRenew && (
          <button
            onClick={onRenew}
            className="flex-1 py-3 text-sm font-semibold text-center transition-all active:opacity-70"
            style={{ color: isUrgent ? '#EA580C' : 'var(--app-accent, #7C3AED)' }}
          >
            {t.motorEntry.renewalCta}
          </button>
        )}
        {onRenew && onHistory && (
          <div className="w-px" style={{ background: 'var(--app-border, rgba(255,255,255,0.08))' }} />
        )}
        {onHistory && (
          <button
            onClick={onHistory}
            className="flex-1 py-3 text-sm text-center transition-all active:opacity-70"
            style={{ color: 'var(--app-text-muted)' }}
          >
            {t.motorEntry.renewalSwitch}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MotorHelloEntry({ userName, vehicleType = 'car', onIntentSelected }: MotorHelloEntryProps) {
  const t = useT();
  const [entryState, setEntryState] = useState<EntryState | null>(null);
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [showTyping, setShowTyping] = useState(false);

  // Detect which opening script to use
  useEffect(() => {
    const vehicles = getRecentVehicles();
    setEntryState(detectEntryState(vehicles));
  }, []);

  // Cascade bot messages in
  useEffect(() => {
    if (!entryState) return;
    const scripts = getScripts(entryState, userName ?? '', t);
    let step = 0;

    const advance = () => {
      if (step < scripts.messages.length) {
        setShowTyping(true);
        const delay = step === 0 ? 400 : 600;
        setTimeout(() => {
          setShowTyping(false);
          setVisibleMessages(step + 1);
          step++;
          setTimeout(advance, step < scripts.messages.length ? 200 : 500);
        }, delay);
      } else {
        setShowOptions(true);
      }
    };

    const kick = setTimeout(advance, 300);
    return () => clearTimeout(kick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryState]);

  const handleRenew = useCallback((vehicle?: RecentVehicle) => {
    onIntentSelected('renew', vehicle);
  }, [onIntentSelected]);

  const handleNewCar = useCallback(() => {
    onIntentSelected('new_car');
  }, [onIntentSelected]);

  const handleAckoDrive = useCallback(() => {
    onIntentSelected('acko_drive');
  }, [onIntentSelected]);

  const handleManage = useCallback(() => {
    onIntentSelected('manage');
  }, [onIntentSelected]);

  if (!entryState) return null;

  const scripts = getScripts(entryState, userName ?? '', t);

  return (
    <div className="flex flex-col h-full px-5 pt-6 pb-8 gap-4 overflow-y-auto">
      {/* Bot messages */}
      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {scripts.messages.slice(0, visibleMessages).map((msg, i) => (
            <BotBubble key={i} text={msg} delay={0} />
          ))}
          {showTyping && <TypingBubble key="typing" />}
        </AnimatePresence>
      </div>

      {/* Script-specific rich content */}
      {showOptions && (
        <AnimatePresence>
          {entryState.type === 'renewal_pending' && (
            <motion.div
              key="renewal-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <VehicleCard
                vehicle={entryState.vehicle}
                daysLeft={entryState.daysLeft}
                onRenew={() => handleRenew(entryState.vehicle)}
                onHistory={() => handleRenew(entryState.vehicle)}
                delay={0.05}
              />
              <IntentChip
                label={t.motorEntry.renewalSeeOptions}
                icon="🔍"
                delay={0.15}
                onClick={() => handleRenew()}
              />
            </motion.div>
          )}

          {entryState.type === 'has_history' && (
            <motion.div
              key="history-chips"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              {entryState.vehicles.map((v, i) => (
                <IntentChip
                  key={i}
                  label={t.motorEntry.historyContinueCard(v.make, v.model)}
                  sub={v.registrationNumber ? `${t.motorEntry.regLabel} ${v.registrationNumber}` : t.motorEntry.lastChecked}
                  icon={
                    v.brandLogoUrl ? (
                      <Image
                        src={v.brandLogoUrl}
                        alt={v.make}
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                    ) : '🚗'
                  }
                  delay={i * 0.08}
                  onClick={() => handleRenew(v)}
                />
              ))}
              <div className="pt-1 space-y-2">
                <IntentChip label={t.motorEntry.historyNewSearch} icon="🔍" delay={0.24} onClick={() => handleRenew()} />
                <IntentChip label={t.motorEntry.historyNewCar} icon="✨" delay={0.32} onClick={handleNewCar} />
                <IntentChip label={t.motorEntry.historyAckoDrive} icon="🚀" delay={0.4} onClick={handleAckoDrive} />
              </div>
            </motion.div>
          )}

          {entryState.type === 'fresh' && (
            <motion.div
              key="fresh-chips"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              <IntentChip
                label={t.motorEntry.freshRenew}
                sub={t.motorEntry.freshRenewSub(vehicleType)}
                icon="🔄"
                accent
                delay={0.05}
                onClick={() => handleRenew()}
              />
              <IntentChip
                label={t.motorEntry.freshNewVehicle(vehicleType)}
                sub={t.motorEntry.freshNewVehicleSub}
                icon="✨"
                delay={0.13}
                onClick={handleNewCar}
              />
              <IntentChip
                label={t.motorEntry.freshDrive(vehicleType)}
                sub={t.motorEntry.freshDriveSub}
                icon="🚗"
                delay={0.21}
                onClick={handleAckoDrive}
              />
              <IntentChip
                label={t.motorEntry.freshManage}
                sub={t.motorEntry.freshManageSub}
                icon="📋"
                delay={0.29}
                onClick={handleManage}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

// ── Script builder ────────────────────────────────────────────────────────────

function getScripts(
  state: EntryState,
  name: string,
  t: ReturnType<typeof useT>
): { messages: string[] } {
  const me = t.motorEntry;

  if (state.type === 'renewal_pending') {
    return {
      messages: [
        me.renewalHi(name),
        me.renewalFound(state.vehicle.make, state.vehicle.model),
        me.renewalUrgent(state.daysLeft),
      ],
    };
  }

  if (state.type === 'has_history') {
    return {
      messages: [
        me.historyHi(name),
        me.historyRecent,
      ],
    };
  }

  // fresh
  return {
    messages: [
      me.freshHi(name),
      me.freshQuestion,
    ],
  };
}
