'use client';

import { motion } from 'framer-motion';
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

// Motor Celebration Widget
export function MotorCelebration({ onContinue }: { onContinue?: () => void }) {
  const [confetti, setConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-advance after celebration
  useEffect(() => {
    if (onContinue) {
      const advanceTimer = setTimeout(() => {
        onContinue();
      }, 3500); // Advance after confetti ends
      return () => clearTimeout(advanceTimer);
    }
  }, [onContinue]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative py-8">
      {confetti && (
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
      )}

      <div className="text-center">
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

        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-[22px] font-bold text-white mb-3">
          Payment Successful! 🎉
        </motion.h2>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-[14px] text-white/70 mb-6 leading-relaxed">
          Your motor insurance is now active.<br />Welcome to ACKO!
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-[12px] text-white/50 mb-2">Policy Number</p>
          <p className="text-[16px] font-bold text-white">ACKO/MOT/{Math.floor(Math.random() * 9000000 + 1000000)}</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

