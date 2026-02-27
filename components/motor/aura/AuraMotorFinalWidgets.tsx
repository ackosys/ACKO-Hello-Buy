'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useMotorStore } from '../../../lib/motor/store';
import { useUserProfileStore } from '../../../lib/userProfileStore';

// Premium Breakdown Widget
export function PremiumBreakdown({ onContinue }: { onContinue: () => void }) {
  const { selectedPlan, selectedAddOns = [], vehicleData } = useMotorStore();

  const basePremium = selectedPlan?.basePrice || 0;
  const gstOnBase = selectedPlan?.gst || 0;

  const addons = (selectedAddOns as any[]) || [];
  const addonTotal = addons.reduce((sum, addon) => sum + (addon.price || 0), 0);
  const gstOnAddons = Math.round(addonTotal * 0.18);

  const grandTotal = basePremium + gstOnBase + addonTotal + gstOnAddons;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-[18px] font-bold text-[var(--aura-text)] mb-2">Your Final Premium</h3>
        <p className="text-[13px] text-[var(--aura-text-muted)]">Complete breakdown of your {selectedPlan?.name || 'insurance plan'}</p>
      </div>

      <div className="bg-[var(--aura-surface)] border border-[#A855F7]/20 rounded-2xl p-5">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[var(--aura-border)]">
          <div className="w-12 h-12 bg-[var(--aura-surface-2)] rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-[var(--aura-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-9M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-[var(--aura-text)]">{vehicleData.make} {vehicleData.model}</p>
            <p className="text-[12px] text-[var(--aura-text-muted)]">{vehicleData.variant} • {vehicleData.registrationYear}</p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-[var(--aura-text)]">{selectedPlan?.name}</p>
              <p className="text-[11px] text-[var(--aura-text-muted)] mt-0.5">{selectedPlan?.description}</p>
            </div>
            <p className="text-[14px] font-bold text-[var(--aura-text)] ml-4">₹{basePremium.toLocaleString()}</p>
          </div>
          <div className="flex justify-between text-[12px] text-[var(--aura-text-muted)]">
            <span>GST (18%)</span>
            <span>₹{gstOnBase.toLocaleString()}</span>
          </div>
        </div>

        {addons.length > 0 && (
          <div className="border-t border-[var(--aura-border)] pt-4 mb-4">
            <p className="text-[13px] font-semibold text-[var(--aura-text-muted)] mb-3">Selected Add-ons ({addons.length})</p>
            {addons.map((addon: any, i: number) => (
              <div key={i} className="flex justify-between text-[12px] text-[var(--aura-text-muted)] mb-2">
                <span>{addon.id.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                <span>₹{addon.price.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between text-[12px] text-[var(--aura-text-muted)] mt-2">
              <span>GST on add-ons (18%)</span>
              <span>₹{gstOnAddons.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="border-t-2 border-[#A855F7]/20 pt-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-[15px] font-bold text-[var(--aura-text)]">Total Premium</span>
            <span className="text-[24px] font-bold text-[var(--aura-text)]">₹{grandTotal.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-[var(--aura-text-subtle)] mt-1">For 1 year policy term</p>
        </div>
      </div>

      <div className="bg-[var(--aura-surface)] rounded-xl p-4 border border-[var(--aura-border)]">
        <p className="text-[12px] font-semibold text-[var(--aura-text-muted)] mb-3">What's included:</p>
        <div className="space-y-2">
          {selectedPlan?.features.slice(0, 4).map((feature: string, i: number) => {
            const [title] = feature.split(' — ');
            return (
              <div key={i} className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-[11px] text-[var(--aura-text-muted)]">{title}</span>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={onContinue}
        className="w-full py-4 rounded-xl text-[15px] font-bold hover:opacity-90 transition-opacity active:scale-[0.98] shadow-lg shadow-black/30"
        style={{ background: 'var(--motor-cta-bg)', color: 'var(--motor-cta-text)' }}
      >
        Proceed to Payment
      </button>
    </motion.div>
  );
}

// Motor Celebration Widget — confetti then morphs into thank-you card
export function MotorCelebration({ onContinue }: { onContinue?: () => void }) {
  const [phase, setPhase] = useState<'confetti' | 'thank_you'>('confetti');
  const { vehicleData, policyNumber } = useMotorStore();
  const vehicleName = `${vehicleData.make} ${vehicleData.model}`.trim();

  useEffect(() => {
    const motorState = useMotorStore.getState();
    const profileStore = useUserProfileStore.getState();
    const lob = motorState.vehicleType === 'bike' ? 'bike' as const : 'car' as const;
    const hasPolicy = profileStore.policies.some((p) => p.lob === lob && p.active);
    if (!hasPolicy) {
      const name = motorState.ownerName || (motorState as any).userName;
      if (name) {
        profileStore.setProfile({ firstName: name, isLoggedIn: true });
      }
      const vn = `${motorState.vehicleData?.make || ''} ${motorState.vehicleData?.model || ''}`.trim();
      const planLabel = motorState.selectedPlanType === 'zero_dep' ? 'Zero Dep' : motorState.selectedPlanType === 'third_party' ? 'Third Party' : 'Comprehensive';
      profileStore.addPolicy({
        id: `${lob}_${Date.now()}`,
        lob,
        policyNumber: motorState.policyNumber || `ACKO-M-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
        label: `${planLabel} ${lob === 'bike' ? 'Bike' : 'Car'} Insurance`,
        active: true,
        purchasedAt: new Date().toISOString(),
        premium: motorState.totalPremium || 0,
        premiumFrequency: 'yearly',
        details: `${vn}${motorState.registrationNumber ? ' · ' + motorState.registrationNumber.toUpperCase() : ''}`,
      });
    }
  }, []);

  useEffect(() => {
    const morphTimer = setTimeout(() => setPhase('thank_you'), 3000);
    return () => clearTimeout(morphTimer);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative py-6">
      <AnimatePresence mode="wait">
        {phase === 'confetti' && (
          <motion.div key="confetti" exit={{ opacity: 0, scale: 0.9 }} className="relative">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 30 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -20, x: Math.random() * 300, opacity: 1 }}
                  animate={{ y: 600, opacity: 0, rotate: Math.random() * 720 }}
                  transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.5, ease: 'linear' }}
                  className="absolute w-2 h-2 rounded-full"
                  style={{ backgroundColor: ['#A855F7', '#C084FC', '#22C55E', '#3B82F6', '#EC4899'][Math.floor(Math.random() * 5)] }}
                />
              ))}
            </div>
            <div className="text-center py-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', boxShadow: '0 8px 24px rgba(34,197,94,0.3)' }}
              >
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </motion.div>
              <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-[22px] font-bold" style={{ color: 'var(--aura-text)' }}>
                Payment Successful!
              </motion.h2>
            </div>
          </motion.div>
        )}

        {phase === 'thank_you' && (
          <motion.div key="thankyou" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-4">
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--aura-surface)', border: '1px solid var(--aura-border)' }}>
              <div className="p-6 text-center" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,163,74,0.08))' }}>
                <div className="w-16 h-16 mx-auto mb-3 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: 'var(--aura-surface-2)' }}>
                  <svg className="w-8 h-8" style={{ color: 'var(--aura-text)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-9M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                </div>
                <h3 className="text-[18px] font-bold text-green-400 mb-1">Thank you for choosing ACKO!</h3>
                <p className="text-[13px]" style={{ color: 'var(--aura-text-muted)' }}>{vehicleName} is now insured</p>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[12px]" style={{ color: 'var(--aura-text-muted)' }}>Policy Number</span>
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--aura-text)' }}>{policyNumber || 'Generating...'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px]" style={{ color: 'var(--aura-text-muted)' }}>Status</span>
                  <span className="text-[12px] font-semibold text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Active
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px]" style={{ color: 'var(--aura-text-muted)' }}>Valid Until</span>
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--aura-text)' }}>{new Date(Date.now() + 365 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
            {onContinue && (
              <button onClick={onContinue} className="w-full py-3.5 rounded-xl text-[14px] font-semibold transition-colors active:scale-[0.97]" style={{ background: 'var(--motor-cta-bg)', color: 'var(--motor-cta-text)' }}>
                Continue
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Policy Tracker — large inline card with status stepper
export function PolicyTracker({ onContinue }: { onContinue: () => void }) {
  const { vehicleData, policyNumber } = useMotorStore();
  const vehicleName = `${vehicleData.make} ${vehicleData.model}`.trim();

  const steps = [
    { label: 'Payment received', status: 'done' as const, detail: 'Just now' },
    { label: 'Vehicle inspection', status: 'done' as const, detail: 'Not required for new policy' },
    { label: 'KYC verification', status: 'pending' as const, detail: 'Complete within 4 days' },
    { label: 'Policy issued', status: 'pending' as const, detail: 'After KYC verification' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--aura-surface)', border: '1px solid var(--aura-border)' }}>
      <div className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid var(--aura-border)' }}>
        <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center" style={{ background: 'var(--aura-surface-2)' }}>
          <svg className="w-5 h-5" style={{ color: 'var(--aura-text)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-9M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold" style={{ color: 'var(--aura-text)' }}>{vehicleName}</p>
          <p className="text-[11px]" style={{ color: 'var(--aura-text-muted)' }}>{policyNumber}</p>
        </div>
        <span className="text-[10px] font-semibold text-green-400 bg-green-400/15 px-2 py-0.5 rounded-full">Active</span>
      </div>

      <div className="p-4 space-y-0">
        {steps.map((s, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${s.status === 'done' ? 'bg-green-500' : ''}`} style={s.status !== 'done' ? { background: 'var(--aura-surface-2)', border: '1px solid var(--aura-border)' } : undefined}>
                {s.status === 'done' ? (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--aura-text-muted)' }} />
                )}
              </div>
              {i < steps.length - 1 && <div className="w-0.5 h-8" style={{ background: s.status === 'done' ? 'rgba(34,197,94,0.4)' : 'var(--aura-border)' }} />}
            </div>
            <div className="pb-4">
              <p className={`text-[13px] font-medium`} style={{ color: s.status === 'done' ? 'var(--aura-text)' : 'var(--aura-text-muted)' }}>{s.label}</p>
              <p className="text-[11px]" style={{ color: 'var(--aura-text-subtle, var(--aura-text-muted))' }}>{s.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-4 mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5">
        <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <div>
          <p className="text-[12px] font-semibold text-amber-400">KYC required within 4 days</p>
          <p className="text-[10px]" style={{ color: 'var(--aura-text-muted)' }}>Complete your KYC to ensure uninterrupted coverage</p>
        </div>
      </div>
    </div>
    <button onClick={onContinue} className="w-full py-3.5 rounded-xl text-[14px] font-semibold transition-colors active:scale-[0.97]" style={{ background: 'var(--motor-cta-bg)', color: 'var(--motor-cta-text)' }}>
      Got it, continue
    </button>
    </motion.div>
  );
}

// NPS Feedback — emoji-based rating
export function NpsFeedback({ onSubmit }: { onSubmit: (data: { score: number; feedback: string }) => void }) {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const emojis = [
    { value: 1, emoji: '😞', label: 'Poor' },
    { value: 2, emoji: '😕', label: 'Fair' },
    { value: 3, emoji: '😐', label: 'Okay' },
    { value: 4, emoji: '😊', label: 'Good' },
    { value: 5, emoji: '🤩', label: 'Loved it!' },
  ];

  const handleSubmit = () => {
    if (score === null) return;
    setSubmitted(true);
    setTimeout(() => onSubmit({ score, feedback }), 800);
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }} className="text-[40px] mb-3">
          {emojis.find(e => e.value === score)?.emoji}
        </motion.div>
        <p className="text-[14px] font-semibold" style={{ color: 'var(--aura-text)' }}>Thanks for your feedback!</p>
        <p className="text-[12px] mt-1" style={{ color: 'var(--aura-text-muted)' }}>This helps us improve the experience</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex justify-center gap-3">
        {emojis.map((e) => (
          <button
            key={e.value}
            onClick={() => setScore(e.value)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${score === e.value ? 'scale-110' : ''}`}
            style={{
              background: score === e.value ? 'var(--aura-surface-2)' : 'var(--aura-surface)',
              border: score === e.value ? '1px solid #A855F7' : '1px solid transparent',
            }}
          >
            <span className="text-[28px]">{e.emoji}</span>
            <span className={`text-[10px] font-medium`} style={{ color: score === e.value ? 'var(--aura-text)' : 'var(--aura-text-muted)' }}>{e.label}</span>
          </button>
        ))}
      </div>

      {score !== null && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Any suggestions? (optional)"
            className="w-full rounded-xl p-3 text-[13px] resize-none h-20 focus:outline-none"
            style={{ background: 'var(--aura-surface)', border: '1px solid var(--aura-border)', color: 'var(--aura-text)' }}
          />
          <button onClick={handleSubmit} className="w-full py-3 rounded-xl text-[14px] font-semibold transition-colors active:scale-[0.97]" style={{ background: 'var(--motor-cta-bg)', color: 'var(--motor-cta-text)' }}>
            Submit Feedback
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

// App Download CTA — compact card with accident info
export function AppDownloadCta({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="rounded-2xl p-5" style={{ background: 'var(--aura-surface)', border: '1px solid var(--aura-border)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-semibold" style={{ color: 'var(--aura-text)' }}>ACKO App</p>
            <p className="text-[11px]" style={{ color: 'var(--aura-text-muted)' }}>Manage everything on the go</p>
          </div>
        </div>

        <div className="space-y-2.5 mb-5">
          {['Instant claim filing with photos', 'Roadside assistance in 30 min', '24/7 policy management', 'Complete KYC in 2 minutes'].map((feat, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span className="text-[12px]" style={{ color: 'var(--aura-text-muted)' }}>{feat}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button className="flex-1 py-3 rounded-xl text-[13px] font-semibold transition-colors flex items-center justify-center gap-2" style={{ background: 'var(--aura-surface-2)', border: '1px solid var(--aura-border)', color: 'var(--aura-text)' }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg>
            App Store
          </button>
          <button className="flex-1 py-3 rounded-xl text-[13px] font-semibold transition-colors flex items-center justify-center gap-2" style={{ background: 'var(--aura-surface-2)', border: '1px solid var(--aura-border)', color: 'var(--aura-text)' }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5V3.5c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35zm13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27zm.91-1.01L20.16 12 17.72 10.89l-2.52 2.52 2.52 1.7zM6.05 2.66l10.76 6.22-2.27 2.27-8.49-8.49z" /></svg>
            Play Store
          </button>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/15 rounded-xl p-4">
        <div className="flex items-start gap-2.5">
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-[12px] font-semibold text-amber-400 mb-1">In case of an accident</p>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--aura-text-muted)' }}>Open the ACKO app and tap &quot;File a Claim&quot;. Our team will guide you through the process within minutes.</p>
          </div>
        </div>
      </div>

      <button onClick={onComplete} className="w-full py-3.5 rounded-xl text-[14px] font-semibold transition-colors active:scale-[0.97]" style={{ background: 'var(--motor-cta-bg)', color: 'var(--motor-cta-text)' }}>
        Done
      </button>
    </motion.div>
  );
}

// Dashboard CTA Widget
export function DashboardCTA({ onSelect }: { onSelect: (choice: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <button onClick={() => onSelect('dashboard')} className="w-full p-4 bg-[var(--aura-surface-2)] hover:bg-[var(--aura-surface-2)] border border-[var(--aura-border-strong)] hover:border-[#A855F7]/30 rounded-xl text-left transition-all group">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#A855F7]/15 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-[#C084FC]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-[var(--aura-text)] mb-0.5">Go to Dashboard</p>
            <p className="text-[11px] text-[var(--aura-text-muted)]">View policy details & manage claims</p>
          </div>
          <svg className="w-5 h-5 text-[var(--aura-text-subtle)] group-hover:text-[var(--aura-text-muted)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </button>

      <button onClick={() => onSelect('download')} className="w-full p-4 bg-[var(--aura-surface-2)] hover:bg-[var(--aura-surface-2)] border border-[var(--aura-border-strong)] hover:border-[#A855F7]/30 rounded-xl text-left transition-all group">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-[var(--aura-text)] mb-0.5">Download Policy</p>
            <p className="text-[11px] text-[var(--aura-text-muted)]">Get your policy document as PDF</p>
          </div>
          <svg className="w-5 h-5 text-[var(--aura-text-subtle)] group-hover:text-[var(--aura-text-muted)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </button>
    </motion.div>
  );
}
