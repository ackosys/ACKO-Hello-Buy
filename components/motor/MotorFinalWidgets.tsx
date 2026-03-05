'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
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
  const { selectedPlan, selectedAddOns = [], vehicleData, idv, newNcbPercentage } = useMotorStore();

  const addons = (selectedAddOns as any[]) || [];
  const isThirdParty = selectedPlan?.type === 'third_party';
  const isZeroDep = selectedPlan?.type === 'zero_dep';

  const tpPremium: number = selectedPlan?.tpPremium || 0;
  const odPremium: number = selectedPlan?.odPremium || 0;
  const ncbDiscount: number = selectedPlan?.ncbDiscount || 0;
  const addonTotal: number = addons.reduce((sum: number, a: any) => sum + (a.price || 0), 0);
  const netPremium: number = selectedPlan?.basePrice || 0;
  const gst: number = Math.round((netPremium + addonTotal) * 0.18);
  const totalPremium: number = netPremium + addonTotal + gst;

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const fmtIdv = (n: number) => n >= 100000 ? `${(n / 100000).toFixed(1)} Lakh` : fmt(n);

  const Divider = () => (
    <div className="my-4" style={{ height: '1px', background: 'var(--motor-border)' }} />
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header — purple tinted, rounded top */}
      <div
        className="relative rounded-t-2xl px-4 pt-4 pb-5 overflow-hidden"
        style={{ background: 'var(--motor-selected-bg)', border: '1px solid var(--motor-border)', borderBottom: 'none' }}
      >
        <div className="pr-24">
          <p className="text-[16px] font-semibold" style={{ color: 'var(--motor-text)' }}>
            {vehicleData.make} {vehicleData.model}
          </p>
          <p className="text-[12px] mt-1 leading-snug" style={{ color: 'var(--motor-text-muted)' }}>
            {selectedPlan?.name}
            {vehicleData.variant ? ` · ${vehicleData.variant}` : ''}
          </p>
          {idv > 0 && (
            <p className="text-[12px] mt-1.5" style={{ color: 'var(--motor-text-muted)' }}>
              IDV :{' '}
              <span className="text-[14px] font-semibold" style={{ color: 'var(--motor-text)' }}>
                {fmtIdv(idv)}
              </span>
            </p>
          )}
        </div>
        <div className="absolute right-3 top-3 w-[80px] h-[60px]">
          <Image
            src={assetPath(VEHICLE_IMAGES[vehicleData.make] || '/car-images/Swift.png')}
            alt={vehicleData.model}
            width={80}
            height={60}
            className="object-contain w-full h-full"
          />
        </div>
      </div>

      {/* Body — detailed breakdown, rounded bottom */}
      <div
        className="rounded-b-2xl px-4 pt-4 pb-4"
        style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)', borderTop: 'none', boxShadow: '0px 4px 10px -2px rgba(54,53,76,0.08)' }}
      >
        {/* Base policy premium */}
        <p className="text-[14px] font-semibold mb-3" style={{ color: 'var(--motor-text)' }}>Base policy premium</p>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[14px]">
            <span style={{ color: 'var(--motor-text-muted)' }}>Third-party (TP) premium</span>
            <span style={{ color: 'var(--motor-text-muted)' }}>{fmt(tpPremium)}</span>
          </div>
          {!isThirdParty && odPremium > 0 && (
            <div className="flex items-center justify-between text-[14px]">
              <span style={{ color: 'var(--motor-text-muted)' }}>
                {isZeroDep ? 'Zero Depreciation (ZD) premium' : 'Own Damage (OD) premium'}
              </span>
              <span style={{ color: 'var(--motor-text-muted)' }}>{fmt(odPremium)}</span>
            </div>
          )}
        </div>

        {/* Add-on premium */}
        {addons.length > 0 && (
          <>
            <Divider />
            <p className="text-[14px] font-semibold mb-3" style={{ color: 'var(--motor-text)' }}>Add-on premium</p>
            <div className="space-y-2.5">
              {addons.map((addon: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-[14px]">
                  <span style={{ color: 'var(--motor-text-muted)' }}>
                    {addon.id.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </span>
                  <span style={{ color: 'var(--motor-text-muted)' }}>{fmt(addon.price)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Discounts */}
        {ncbDiscount > 0 && (
          <>
            <Divider />
            <p className="text-[14px] font-semibold mb-3" style={{ color: 'var(--motor-text)' }}>Discounts</p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[14px]">
                <span style={{ color: 'var(--motor-text-muted)' }}>
                  NCB discount{newNcbPercentage ? ` (${newNcbPercentage}% of OD)` : ''}
                </span>
                <span className="font-medium" style={{ color: '#0FA457' }}>-{fmt(ncbDiscount)}</span>
              </div>
            </div>
          </>
        )}

        <Divider />

        {/* Net, GST, Total */}
        <div className="space-y-2.5 mb-4">
          <div className="flex items-center justify-between text-[14px]">
            <span style={{ color: 'var(--motor-text-muted)' }}>Net Premium</span>
            <span style={{ color: 'var(--motor-text-muted)' }}>{fmt(netPremium)}</span>
          </div>
          <div className="flex items-center justify-between text-[14px]">
            <span style={{ color: 'var(--motor-text-muted)' }}>18% GST</span>
            <span style={{ color: 'var(--motor-text-muted)' }}>{fmt(gst)}</span>
          </div>
        </div>

        <Divider />

        <div className="flex items-center justify-between mb-4">
          <p className="text-[14px] font-semibold" style={{ color: 'var(--motor-text)' }}>
            Total{' '}
            <span className="text-[12px] font-normal" style={{ color: 'var(--motor-text-muted)' }}>(Including GST)</span>
          </p>
          <p className="text-[14px] font-semibold" style={{ color: 'var(--motor-text)' }}>{fmt(totalPremium)}</p>
        </div>

        <button
          onClick={onContinue}
          className="w-full py-3 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.97]"
          style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
        >
          Proceed to Payment
        </button>
      </div>
    </motion.div>
  );
}

// Mock Razorpay Payment Gateway
export function PaymentGateway({ onComplete }: { onComplete: () => void }) {
  const { vehicleData, selectedPlan, selectedAddOns } = useMotorStore();
  const [stage, setStage] = useState<'methods' | 'processing' | 'success'>('methods');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const basePremium = selectedPlan?.totalPrice || 0;
  const addonPremium = (selectedAddOns as any[])?.reduce((sum: number, a: any) => sum + (a.price || 0) * 1.18, 0) || 0;
  const grandTotal = Math.round(basePremium + addonPremium);

  const handlePay = () => {
    setStage('processing');
    setTimeout(() => {
      setStage('success');
      setTimeout(onComplete, 1500);
    }, 2500);
  };

  const methods = [
    { id: 'upi', label: 'UPI', desc: 'Google Pay, PhonePe, Paytm', icon: '⚡' },
    { id: 'card', label: 'Card', desc: 'Visa, Mastercard, RuPay', icon: '💳' },
    { id: 'netbanking', label: 'Net Banking', desc: 'All major banks', icon: '🏦' },
    { id: 'wallet', label: 'Wallet', desc: 'Paytm, Amazon Pay', icon: '👝' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl overflow-hidden border border-white/10" style={{ background: '#1a1f36' }}>
      {/* Razorpay-style header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #2b3a67 0%, #1a1f36 100%)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#528FF0]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.076 2L4 12.239l3.076 0L11.153 2zM11.669 2L8.593 12.239l3.076 0L15.746 2zM20 2l-7.077 10.239L16 22l4-9.761L16.923 2z" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white">ACKO Insurance</p>
            <p className="text-[11px] text-white/40">{`${vehicleData.make} ${vehicleData.model}`.trim()} — Motor Insurance</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-white/40">Amount</p>
          <p className="text-[18px] font-bold text-white">₹{grandTotal.toLocaleString()}</p>
        </div>
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          {stage === 'methods' && (
            <motion.div key="methods" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}>
              <p className="text-[12px] font-semibold text-white/50 uppercase tracking-wider mb-3">Payment Method</p>
              <div className="space-y-2.5">
                {methods.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className="w-full flex items-center gap-3.5 p-3.5 rounded-xl transition-all text-left"
                    style={{
                      background: selectedMethod === m.id ? 'rgba(82, 143, 240, 0.12)' : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${selectedMethod === m.id ? 'rgba(82, 143, 240, 0.5)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    <span className="text-[20px]">{m.icon}</span>
                    <div className="flex-1">
                      <p className="text-[14px] font-semibold text-white">{m.label}</p>
                      <p className="text-[11px] text-white/40">{m.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedMethod === m.id ? 'border-[#528FF0] bg-[#528FF0]' : 'border-white/20'}`}>
                      {selectedMethod === m.id && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handlePay}
                disabled={!selectedMethod}
                className="w-full mt-5 py-3.5 rounded-xl text-[15px] font-semibold text-white transition-all disabled:opacity-30"
                style={{ background: selectedMethod ? 'linear-gradient(135deg, #528FF0 0%, #3b6fd4 100%)' : '#528FF0' }}
              >
                Pay ₹{grandTotal.toLocaleString()}
              </button>

              <div className="flex items-center justify-center gap-2 mt-4">
                <svg className="w-3.5 h-3.5 text-white/25" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4 8H8v-1c0-1.33 2.67-2 4-2s4 .67 4 2v1z"/></svg>
                <p className="text-[10px] text-white/25">Secured by Razorpay | PCI DSS Compliant</p>
              </div>
            </motion.div>
          )}

          {stage === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-8">
              <div className="w-14 h-14 rounded-full border-[3px] border-white/10 border-t-[#528FF0] animate-spin mb-5" />
              <p className="text-[15px] font-semibold text-white mb-1">Processing Payment</p>
              <p className="text-[12px] text-white/40">Please do not close this screen...</p>
            </motion.div>
          )}

          {stage === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mb-4"
              >
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <p className="text-[16px] font-bold text-green-400 mb-1">Payment Successful!</p>
              <p className="text-[12px] text-white/40">₹{grandTotal.toLocaleString()} paid via {methods.find(m => m.id === selectedMethod)?.label}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Motor Celebration Widget — confetti inside card then reveals details
const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#F472B6'];

export function MotorCelebration({ onContinue }: { onContinue?: () => void }) {
  const [showDetails, setShowDetails] = useState(false);
  const { vehicleData, policyNumber } = useMotorStore();
  const vehicleName = `${vehicleData.make} ${vehicleData.model}`.trim();
  const vehicleImage = VEHICLE_IMAGES[vehicleData.make] || '/car-images/Swift.png';

  const confetti = useMemo(() =>
    Array.from({ length: 30 }).map(() => ({
      xPct: Math.random() * 100,
      rotation: Math.random() * 720,
      duration: 2 + Math.random() * 2,
      delay: Math.random() * 0.5,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    }))
  , []);

  useEffect(() => {
    const timer = setTimeout(() => setShowDetails(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
      <div className="bg-white/10 border border-white/15 rounded-2xl overflow-hidden relative">
        {/* Confetti layer inside the card */}
        <AnimatePresence>
          {!showDetails && (
            <motion.div exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-none overflow-hidden z-10">
              {confetti.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -10, opacity: 1 }}
                  animate={{ y: 400, opacity: 0, rotate: p.rotation }}
                  transition={{ duration: p.duration, delay: p.delay, ease: 'linear' }}
                  className="absolute w-2 h-2 rounded-full"
                  style={{ left: `${p.xPct}%`, backgroundColor: p.color }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card header */}
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 p-6 text-center relative">
          <AnimatePresence mode="wait">
            {!showDetails ? (
              <motion.div key="success" exit={{ opacity: 0, scale: 0.9 }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.2 }}
                  className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-green-500/30"
                >
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </motion.div>
                <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-[20px] font-bold text-white">
                  Payment Successful!
                </motion.h2>
              </motion.div>
            ) : (
              <motion.div key="thankyou" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="w-16 h-16 mx-auto mb-3 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center">
                  <Image src={assetPath(vehicleImage)} alt={vehicleName} width={56} height={56} className="object-contain" />
                </div>
                <h3 className="text-[18px] font-bold text-green-400 mb-1">Thank you for choosing ACKO!</h3>
                <p className="text-[13px] text-white/60">{vehicleName} is now insured</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Details section */}
        <AnimatePresence>
          {showDetails && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} transition={{ duration: 0.4, ease: 'easeOut' }} className="overflow-hidden">
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showDetails && onContinue && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <button onClick={onContinue} className="w-full py-3.5 rounded-xl text-[14px] font-semibold transition-colors active:scale-[0.97]" style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}>
            Continue
          </button>
        </motion.div>
      )}
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
    <button onClick={onContinue} className="w-full py-3.5 rounded-xl text-[14px] font-semibold transition-colors active:scale-[0.97]" style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}>
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
          <button onClick={handleSubmit} className="w-full py-3 rounded-xl text-[14px] font-semibold transition-colors active:scale-[0.97]" style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}>
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

      <button onClick={onComplete} className="w-full py-3.5 rounded-xl text-[14px] font-semibold transition-colors active:scale-[0.97]" style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}>
        Done
      </button>
    </motion.div>
  );
}

