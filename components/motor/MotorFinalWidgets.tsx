'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useMotorStore } from '../../lib/motor/store';
import { assetPath } from '../../lib/assetPath';

const VEHICLE_IMAGES: Record<string, string> = {
  'Maruti Suzuki': '/car-images/Swift.png',
  'Hyundai': '/car-images/Venue.png',
  'Tata': '/car-images/Nexon.png',
  'Kia': '/car-images/Verna.png',
  'Mahindra': '/car-images/XUV700.png',
  'Toyota': '/car-images/Toyota.png',
  'Honda': '/car-images/Citroen.png',
  'MG': '/car-images/MG comet.png',
  'Volkswagen': '/car-images/Citroen.png',
  'Renault': '/car-images/Citroen.png',
  'BMW': '/car-images/harrier.png',
  'Hero': '/car-images/Splendor.png',
  'Bajaj': '/car-images/Pulsar.png',
  'TVS': '/car-images/CT 100.png',
  'Royal Enfield': '/car-images/KTM.png',
  'Yamaha': '/car-images/Pulsar.png',
};

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
      <div className="bg-white/10 border border-purple-400/40 rounded-2xl p-5" style={{ boxShadow: '0 4px 24px rgba(168, 85, 247, 0.12), 0 1px 4px rgba(0,0,0,0.2)' }}>
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/10">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center overflow-hidden">
            <Image
              src={assetPath(VEHICLE_IMAGES[vehicleData.make] || '/car-images/Swift.png')}
              alt={`${vehicleData.make} ${vehicleData.model}`}
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-white">{vehicleData.make} {vehicleData.model}</p>
            <p className="text-[12px] text-white/50">{vehicleData.variant} • {vehicleData.registrationYear}</p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-white">{selectedPlan?.name}</p>
              <p className="text-[11px] text-white/50 mt-0.5">{selectedPlan?.description}</p>
            </div>
            <p className="text-[14px] font-bold text-white ml-4">₹{basePremium.toLocaleString()}</p>
          </div>
          <div className="flex justify-between text-[12px] text-white/60">
            <span>GST (18%)</span>
            <span>₹{gstOnBase.toLocaleString()}</span>
          </div>
        </div>

        {addons.length > 0 && (
          <div className="border-t border-white/10 pt-4 mb-4">
            <p className="text-[13px] font-semibold text-white/70 mb-3">Selected Add-ons ({addons.length})</p>
            {addons.map((addon: any, i: number) => (
              <div key={i} className="flex justify-between text-[12px] text-white/70 mb-2">
                <span>{addon.id.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                <span>₹{addon.price.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between text-[12px] text-white/60 mt-2">
              <span>GST on add-ons (18%)</span>
              <span>₹{gstOnAddons.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="border-t-2 border-purple-400/30 pt-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-[15px] font-bold text-white">Total Premium</span>
            <span className="text-[24px] font-bold text-white">₹{grandTotal.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-white/40 mt-1">For 1 year policy term</p>
        </div>
      </div>

      <button onClick={onContinue} className="w-full py-4 rounded-xl text-[15px] font-semibold transition-colors active:scale-[0.97]" style={{ background: 'var(--motor-cta-bg)', color: 'var(--motor-cta-text)' }}>
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
  const vehicleImage = VEHICLE_IMAGES[vehicleData.make] || '/car-images/Swift.png';

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
                  style={{ backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#F472B6'][Math.floor(Math.random() * 5)] }}
                />
              ))}
            </div>
            <div className="text-center py-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-green-500/30"
              >
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </motion.div>
              <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-[22px] font-bold text-white">
                Payment Successful!
              </motion.h2>
            </div>
          </motion.div>
        )}

        {phase === 'thank_you' && (
          <motion.div key="thankyou" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-4">
            <div className="bg-white/10 border border-white/15 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center">
                  <Image src={assetPath(vehicleImage)} alt={vehicleName} width={56} height={56} className="object-contain" />
                </div>
                <h3 className="text-[18px] font-bold text-green-400 mb-1">Thank you for choosing ACKO!</h3>
                <p className="text-[13px] text-white/60">{vehicleName} is now insured</p>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-white/50">Policy Number</span>
                  <span className="text-[13px] font-semibold text-white">{policyNumber || 'Generating...'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-white/50">Status</span>
                  <span className="text-[12px] font-semibold text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Active
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-white/50">Valid Until</span>
                  <span className="text-[13px] font-semibold text-white">{new Date(Date.now() + 365 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
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
  const vehicleImage = VEHICLE_IMAGES[vehicleData.make] || '/car-images/Swift.png';

  const steps = [
    { label: 'Payment received', status: 'done' as const, detail: 'Just now' },
    { label: 'Vehicle inspection', status: 'done' as const, detail: 'Not required for new policy' },
    { label: 'KYC verification', status: 'pending' as const, detail: 'Complete within 4 days' },
    { label: 'Policy issued', status: 'pending' as const, detail: 'After KYC verification' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
    <div className="bg-white/10 border border-white/15 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
          <Image src={assetPath(vehicleImage)} alt={vehicleName} width={40} height={40} className="object-contain" />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-white">{vehicleName}</p>
          <p className="text-[11px] text-white/50">{policyNumber}</p>
        </div>
        <span className="text-[10px] font-semibold text-green-400 bg-green-400/15 px-2 py-0.5 rounded-full">Active</span>
      </div>

      <div className="p-4 space-y-0">
        {steps.map((s, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${s.status === 'done' ? 'bg-green-500' : 'bg-white/15 border border-white/30'}`}>
                {s.status === 'done' ? (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                )}
              </div>
              {i < steps.length - 1 && <div className={`w-0.5 h-8 ${s.status === 'done' ? 'bg-green-500/50' : 'bg-white/10'}`} />}
            </div>
            <div className="pb-4">
              <p className={`text-[13px] font-medium ${s.status === 'done' ? 'text-white' : 'text-white/50'}`}>{s.label}</p>
              <p className="text-[11px] text-white/40">{s.detail}</p>
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
          <p className="text-[10px] text-white/40 mt-0.5">Complete your KYC to ensure uninterrupted coverage</p>
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
        <p className="text-[14px] font-semibold text-white">Thanks for your feedback!</p>
        <p className="text-[12px] text-white/50 mt-1">This helps us improve the experience</p>
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
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${score === e.value ? 'bg-white/15 scale-110 border border-purple-400/40' : 'bg-white/5 border border-transparent hover:bg-white/10'}`}
          >
            <span className="text-[28px]">{e.emoji}</span>
            <span className={`text-[10px] font-medium ${score === e.value ? 'text-white' : 'text-white/40'}`}>{e.label}</span>
          </button>
        ))}
      </div>

      {score !== null && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Any suggestions? (optional)"
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[13px] text-white placeholder:text-white/30 resize-none h-20 focus:outline-none focus:border-purple-400/40"
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
      <div className="bg-white/10 border border-white/15 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-white">ACKO App</p>
            <p className="text-[11px] text-white/50">Manage everything on the go</p>
          </div>
        </div>

        <div className="space-y-2.5 mb-5">
          {['Instant claim filing with photos', 'Roadside assistance in 30 min', '24/7 policy management', 'Complete KYC in 2 minutes'].map((feat, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span className="text-[12px] text-white/70">{feat}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-white bg-white/10 border border-white/15 hover:bg-white/15 transition-colors flex items-center justify-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg>
            App Store
          </button>
          <button className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-white bg-white/10 border border-white/15 hover:bg-white/15 transition-colors flex items-center justify-center gap-2">
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
            <p className="text-[11px] text-white/50 leading-relaxed">Open the ACKO app and tap &quot;File a Claim&quot;. Our team will guide you through the process within minutes.</p>
          </div>
        </div>
      </div>

      <button onClick={onComplete} className="w-full py-3.5 rounded-xl text-[14px] font-semibold transition-colors active:scale-[0.97]" style={{ background: 'var(--motor-cta-bg)', color: 'var(--motor-cta-text)' }}>
        Done
      </button>
    </motion.div>
  );
}

