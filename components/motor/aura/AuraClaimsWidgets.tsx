'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMotorStore } from '../../../lib/motor/store';
import { MotorJourneyState } from '../../../lib/motor/types';

/* ═══════════════════════════════════════════════
   Safety Condition Picker
   Multi-select chips for specific vehicle safety issues
   ═══════════════════════════════════════════════ */

const SAFETY_CONDITIONS = [
  { id: 'flat_tyres', label: 'Flat / damaged tyres', icon: '🛞' },
  { id: 'airbags_deployed', label: 'Airbags deployed', icon: '🫧' },
  { id: 'engine_not_starting', label: 'Engine not starting', icon: '🔧' },
  { id: 'fluid_leakage', label: 'Fluid leakage', icon: '💧' },
  { id: 'flood_damage', label: 'Flood damage', icon: '🌊' },
  { id: 'structural_damage', label: 'Structural / frame damage', icon: '⚠️' },
  { id: 'other', label: 'Other safety concern', icon: '❗' },
];

export function SafetyConditionPicker({ onContinue }: { onContinue: (conditions: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
      <p className="text-[13px] font-semibold text-[var(--aura-text-muted)] uppercase tracking-wide mb-3">
        Select all that apply
      </p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {SAFETY_CONDITIONS.map((c, i) => {
          const active = selected.includes(c.id);
          return (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => toggle(c.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all active:scale-95 ${
                active
                  ? 'border-[#A855F7] bg-[#A855F7]/10'
                  : 'border-[var(--aura-border)] bg-[var(--aura-surface)] hover:border-[var(--aura-border-strong)]'
              }`}
            >
              <span className="text-base leading-none">{c.icon}</span>
              <span className={`text-[12px] font-medium leading-tight ${active ? 'text-[#C084FC]' : 'text-[var(--aura-text)]'}`}>
                {c.label}
              </span>
              {active && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto w-4 h-4 rounded-full bg-[#A855F7] flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
      <button
        onClick={() => onContinue(selected)}
        className="w-full py-3.5 rounded-xl font-semibold text-[15px] text-white transition-all active:scale-[0.97]"
        style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
      >
        {selected.length > 0 ? `Confirm ${selected.length} condition${selected.length > 1 ? 's' : ''}` : 'None of these apply'}
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   Damage Photo Capture
   Guided photo upload for damage documentation
   ═══════════════════════════════════════════════ */

const PHOTO_ANGLES = [
  { id: 'front', label: 'Front view', description: 'Full front of vehicle', icon: '⬆️' },
  { id: 'rear', label: 'Rear view', description: 'Full rear of vehicle', icon: '⬇️' },
  { id: 'damage_close', label: 'Damage close-up', description: 'Close-up of damage', icon: '🔍' },
  { id: 'left', label: 'Left side', description: 'Full left side', icon: '⬅️' },
  { id: 'right', label: 'Right side', description: 'Full right side', icon: '➡️' },
  { id: 'odometer', label: 'Odometer', description: 'Dashboard / odometer reading', icon: '📊' },
];

export function DamagePhotoCapture({ onContinue }: { onContinue: (result: { photosUploaded: boolean }) => void }) {
  const [uploaded, setUploaded] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState<string | null>(null);

  const handleUpload = (id: string) => {
    setUploading(id);
    setTimeout(() => {
      setUploaded(prev => new Set([...Array.from(prev), id]));
      setUploading(null);
    }, 900);
  };

  const canProceed = uploaded.size >= 1;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-semibold text-[var(--aura-text-muted)] uppercase tracking-wide">
          Upload damage photos
        </p>
        <span className="text-[12px] text-[#A855F7] font-medium">{uploaded.size}/{PHOTO_ANGLES.length}</span>
      </div>

      <div className="space-y-2 mb-4">
        {PHOTO_ANGLES.map((angle, i) => {
          const done = uploaded.has(angle.id);
          const loading = uploading === angle.id;
          return (
            <motion.div
              key={angle.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                done ? 'border-green-500/40 bg-green-500/5' : 'border-[var(--aura-border)] bg-[var(--aura-surface)]'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-lg ${done ? 'bg-green-500/15' : 'bg-[var(--aura-surface-2)]'}`}>
                {loading ? (
                  <div className="w-4 h-4 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin" />
                ) : done ? (
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <span>{angle.icon}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-semibold ${done ? 'text-green-400' : 'text-[var(--aura-text)]'}`}>{angle.label}</p>
                <p className="text-[11px] text-[var(--aura-text-subtle)]">{angle.description}</p>
              </div>
              {!done && !loading && (
                <button
                  onClick={() => handleUpload(angle.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#C084FC] transition-all active:scale-95"
                  style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.2)' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  Upload
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      <button
        onClick={() => onContinue({ photosUploaded: canProceed })}
        disabled={!canProceed}
        className="w-full py-3.5 rounded-xl font-semibold text-[15px] text-white transition-all active:scale-[0.97] disabled:opacity-40"
        style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
      >
        {canProceed ? `Continue with ${uploaded.size} photo${uploaded.size > 1 ? 's' : ''}` : 'Upload at least 1 photo'}
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   Self Inspection Widget
   Guided 360° capture + AI damage mapping
   ═══════════════════════════════════════════════ */

const INSPECTION_STEPS = [
  { id: 'front', label: 'Front', instruction: 'Stand 2m in front of the vehicle, capture the entire front', icon: '📷' },
  { id: 'rear', label: 'Rear', instruction: 'Stand 2m behind the vehicle, capture the entire rear', icon: '📷' },
  { id: 'left', label: 'Left side', instruction: 'Stand at the left corner, capture the full side profile', icon: '📷' },
  { id: 'right', label: 'Right side', instruction: 'Stand at the right corner, capture the full side profile', icon: '📷' },
  { id: 'damage', label: 'Damage area', instruction: 'Get close to the damaged area, capture clearly', icon: '🔍' },
  { id: 'interior', label: 'Interior', instruction: 'Open the door, capture dashboard and airbags', icon: '🚗' },
];

export function SelfInspectionWidget({ onComplete }: { onComplete: (result: any) => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [captured, setCaptured] = useState<Set<number>>(new Set());
  const [capturing, setCapturing] = useState(false);
  const [phase, setPhase] = useState<'capture' | 'analysis' | 'result'>('capture');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [admissibilityScore] = useState(87);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const DAMAGED_PANELS = ['Front bumper', 'Left door', 'Windshield'];

  const handleCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setCapturing(true);
    setTimeout(() => {
      setCaptured(prev => new Set([...Array.from(prev), currentStep]));
      setCapturing(false);
      if (currentStep < INSPECTION_STEPS.length - 1) {
        setTimeout(() => setCurrentStep(s => s + 1), 400);
      }
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }, 800);
  };

  const handleAnalyse = () => {
    setPhase('analysis');
    const interval = setInterval(() => {
      setAnalysisProgress(p => {
        if (p >= 100) { clearInterval(interval); setPhase('result'); return 100; }
        return p + 4;
      });
    }, 80);
  };

  const allCaptured = captured.size === INSPECTION_STEPS.length;
  const progress = (captured.size / INSPECTION_STEPS.length) * 100;

  if (phase === 'analysis') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm py-6 text-center">
        <div className="relative w-20 h-20 mx-auto mb-5">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--motor-border)" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke="#A855F7"
              strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - analysisProgress / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[18px] font-bold" style={{ color: 'var(--motor-text)' }}>{analysisProgress}%</span>
          </div>
        </div>
        <p className="text-[15px] font-semibold mb-1" style={{ color: 'var(--motor-text)' }}>Analysing damage</p>
        <p className="text-[13px]" style={{ color: 'var(--motor-text-muted)' }}>
          {analysisProgress < 40 ? 'Processing images...' : analysisProgress < 70 ? 'Mapping damage panels...' : analysisProgress < 90 ? 'Calculating admissibility...' : 'Almost done...'}
        </p>
      </motion.div>
    );
  }

  if (phase === 'result') {
    const scoreColor = admissibilityScore >= 80 ? '#22C55E' : admissibilityScore >= 60 ? '#F59E0B' : '#EF4444';
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-bold" style={{ color: 'var(--motor-text)' }}>Inspection Complete</p>
              <p className="text-[12px]" style={{ color: 'var(--motor-text-muted)' }}>{captured.size} photos analysed</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[22px] font-bold" style={{ color: scoreColor }}>{admissibilityScore}%</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: scoreColor }}>Admissible</p>
            </div>
          </div>

          <div className="mb-3">
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--motor-surface-2)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${admissibilityScore}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${scoreColor}90, ${scoreColor})` }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[12px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--motor-text-muted)' }}>Damaged panels detected</p>
            {DAMAGED_PANELS.map((panel) => (
              <div key={panel} className="flex items-center gap-2 text-[13px]">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                <span style={{ color: 'var(--motor-text)' }}>{panel}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => onComplete({ inspectionDone: true, admissibilityScore, damagedPanels: DAMAGED_PANELS })}
          className="w-full py-3.5 rounded-xl font-semibold text-[15px] text-white transition-all active:scale-[0.97]"
          style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
        >
          Proceed to settlement
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
      {/* Hidden camera input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelected}
      />
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: 'var(--motor-text-muted)' }}>
          360° Inspection
        </p>
        <span className="text-[12px] font-medium text-[#A855F7]">{captured.size}/{INSPECTION_STEPS.length} captured</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: 'var(--motor-surface-2)' }}>
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #7C47E1, #A855F7)' }}
        />
      </div>

      {/* Step indicator */}
      <div className="flex gap-1.5 mb-4">
        {INSPECTION_STEPS.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{
              background: captured.has(i) ? '#A855F7' : i === currentStep ? 'rgba(168,85,247,0.4)' : 'var(--motor-border)',
            }}
          />
        ))}
      </div>

      {/* Current step */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -15 }}
          className="rounded-2xl p-4 mb-4"
          style={{ background: 'var(--motor-surface)', border: '1px solid var(--motor-border)' }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: captured.has(currentStep) ? 'rgba(34,197,94,0.15)' : 'var(--motor-surface-2)' }}
            >
              {capturing ? (
                <div className="w-6 h-6 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin" />
              ) : captured.has(currentStep) ? (
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <span>{INSPECTION_STEPS[currentStep]?.icon}</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold mb-0.5" style={{ color: 'var(--motor-text)' }}>
                Step {currentStep + 1}: {INSPECTION_STEPS[currentStep]?.label}
              </p>
              <p className="text-[12px] leading-relaxed" style={{ color: 'var(--motor-text-muted)' }}>
                {INSPECTION_STEPS[currentStep]?.instruction}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Captured thumbnails */}
      {captured.size > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {Array.from(captured).map(idx => (
            <div key={idx} className="w-14 h-14 rounded-lg bg-[#A855F7]/15 border border-[#A855F7]/30 flex items-center justify-center flex-shrink-0 relative">
              <span className="text-xl">{INSPECTION_STEPS[idx]?.icon}</span>
              <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {!allCaptured ? (
        <button
          onClick={handleCapture}
          disabled={capturing || captured.has(currentStep)}
          className="w-full py-3.5 rounded-xl font-semibold text-[15px] text-white transition-all active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
          {capturing ? 'Capturing...' : captured.has(currentStep) ? 'Captured — move next' : `Capture ${INSPECTION_STEPS[currentStep]?.label}`}
        </button>
      ) : (
        <button
          onClick={handleAnalyse}
          className="w-full py-3.5 rounded-xl font-semibold text-[15px] text-white transition-all active:scale-[0.97] flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          Run AI damage analysis
        </button>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   Surveyor Assigned Screen
   ═══════════════════════════════════════════════ */

export function SurveyorAssigned({ onContinue }: { onContinue: () => void }) {
  const SURVEYOR = { name: 'Rajesh Nair', id: 'SRV-4821', eta: '~90 mins', phone: '98XX XXXX 34', rating: 4.8 };

  useEffect(() => {
    const timer = setTimeout(() => onContinue(), 2500);
    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
      <div className="rounded-2xl border border-[var(--aura-border)] bg-[var(--aura-surface)] p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7C47E1] to-[#A855F7] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {SURVEYOR.name.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-bold text-[var(--aura-text)]">{SURVEYOR.name}</p>
            <p className="text-[12px] text-[var(--aura-text-subtle)]">Assigned Surveyor · {SURVEYOR.id}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-yellow-400 text-[11px]">★</span>
              <span className="text-[11px] font-semibold text-[var(--aura-text)]">{SURVEYOR.rating}</span>
              <span className="text-[11px] text-[var(--aura-text-subtle)]">· 200+ inspections</span>
            </div>
          </div>
          <div className="text-right">
            <div className="w-2 h-2 rounded-full bg-green-400 ml-auto mb-1 animate-pulse" />
            <p className="text-[10px] text-green-400 font-semibold uppercase tracking-wide">On duty</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[var(--aura-surface-2)] rounded-xl p-3">
            <p className="text-[11px] text-[var(--aura-text-subtle)] mb-0.5">Expected visit</p>
            <p className="text-[13px] font-bold text-[var(--aura-text)]">{SURVEYOR.eta}</p>
          </div>
          <div className="bg-[var(--aura-surface-2)] rounded-xl p-3">
            <p className="text-[11px] text-[var(--aura-text-subtle)] mb-0.5">Contact</p>
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-bold text-[var(--aura-text)]">{SURVEYOR.phone}</p>
              <svg className="w-3.5 h-3.5 text-[#A855F7] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="mt-3 p-3 rounded-xl bg-[#A855F7]/10 border border-[#A855F7]/20">
          <p className="text-[12px] text-[#C084FC] leading-relaxed">
            You will get an SMS once the surveyor is on the way. Please keep the vehicle accessible.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   Claim Heartbeat
   Live animated status timeline
   ═══════════════════════════════════════════════ */

interface HeartbeatStep {
  id: string;
  label: string;
  sublabel: string;
  status: 'done' | 'active' | 'pending';
  time?: string;
}

export function ClaimHeartbeat({ onContinue, claimType }: { onContinue: () => void; claimType?: string }) {
  const isTheft = claimType === 'own_damage_theft';

  const STEPS: HeartbeatStep[] = isTheft ? [
    { id: 'registered', label: 'Claim Registered', sublabel: 'Claim ID generated, policy validated', status: 'done', time: 'Just now' },
    { id: 'police', label: 'Police Verification', sublabel: 'FIR verification in progress', status: 'active', time: 'Est. 2–4 hrs' },
    { id: 'investigation', label: 'Investigation', sublabel: 'Case review and site visit', status: 'pending', time: 'Est. 24–48 hrs' },
    { id: 'settlement', label: 'Settlement', sublabel: 'Payout processed to your account', status: 'pending', time: 'Est. 5–7 days' },
    { id: 'closed', label: 'Claim Closed', sublabel: 'Case fully resolved', status: 'pending' },
  ] : [
    { id: 'registered', label: 'Claim Registered', sublabel: 'Policy validated, Claim ID generated', status: 'done', time: 'Just now' },
    { id: 'inspection', label: 'Damage Inspection', sublabel: 'Surveyor assigned, photos reviewed', status: 'active', time: 'Est. 24 hrs' },
    { id: 'assessment', label: 'Assessment & Offer', sublabel: 'Repair cost estimated, offer prepared', status: 'pending', time: 'Est. 1–2 days' },
    { id: 'repair', label: 'Repair / Payout', sublabel: 'Garage repair or direct settlement', status: 'pending', time: 'Est. 3–5 days' },
    { id: 'closed', label: 'Claim Closed', sublabel: 'Case fully resolved', status: 'pending' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
      <div className="rounded-2xl border border-[var(--aura-border)] bg-[var(--aura-surface)] p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[14px] font-bold text-[var(--aura-text)]">Claim Status</p>
            <p className="text-[12px] text-[var(--aura-text-subtle)]">Live updates until resolution</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A855F7]/10 border border-[#A855F7]/20">
            <span className="w-2 h-2 rounded-full bg-[#A855F7] animate-pulse" />
            <span className="text-[11px] font-semibold text-[#C084FC]">Live</span>
          </div>
        </div>

        <div className="relative">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-3 mb-0"
            >
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  step.status === 'done' ? 'bg-green-500' :
                  step.status === 'active' ? 'bg-[#A855F7]' : 'bg-[var(--aura-surface-2)] border-2 border-[var(--aura-border)]'
                }`}>
                  {step.status === 'done' ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : step.status === 'active' ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-3 h-3 rounded-full bg-white"
                    />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--aura-border)]" />
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-0.5 flex-1 min-h-[2rem] my-0.5 rounded-full ${step.status === 'done' ? 'bg-green-500/40' : 'bg-[var(--aura-border)]'}`} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`text-[13px] font-semibold ${
                      step.status === 'done' ? 'text-green-400' :
                      step.status === 'active' ? 'text-[#C084FC]' : 'text-[var(--aura-text-subtle)]'
                    }`}>{step.label}</p>
                    <p className="text-[11px] text-[var(--aura-text-subtle)] mt-0.5 leading-relaxed">{step.sublabel}</p>
                  </div>
                  {step.time && (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                      step.status === 'done' ? 'bg-green-500/10 text-green-400' :
                      step.status === 'active' ? 'bg-[#A855F7]/10 text-[#C084FC]' : 'bg-[var(--aura-surface-2)] text-[var(--aura-text-subtle)]'
                    }`}>{step.time}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <button
        onClick={onContinue}
        className="w-full py-3.5 rounded-xl font-semibold text-[15px] transition-all active:scale-[0.97]"
        style={{ background: 'var(--btn-secondary-bg)', border: '1px solid var(--btn-secondary-border)', color: 'var(--btn-secondary-text)', boxShadow: 'var(--btn-secondary-shadow)' }}
      >
        Back to Dashboard
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   Settlement Offer Widget
   Instant settlement — offer card with accept/decline
   ═══════════════════════════════════════════════ */

export function SettlementOffer({ onAccept, onDecline }: { onAccept: (amount: number) => void; onDecline: () => void }) {
  const state = useMotorStore() as MotorJourneyState;
  const baseAmount = state.totalPremium ? Math.round(state.totalPremium * 0.6) : 18500;
  const deductible = state.selectedPlan?.type === 'zero_dep' ? 0 : 2500;
  const netAmount = baseAmount - deductible;
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    setAccepted(true);
    setTimeout(() => onAccept(netAmount), 600);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
      <div className="rounded-2xl overflow-hidden border border-[#A855F7]/30 mb-4">
        {/* Header */}
        <div className="px-5 py-4" style={{ background: 'linear-gradient(135deg, #4C1D95, #7C47E1)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <span className="text-[13px] font-semibold text-purple-200 uppercase tracking-wide">Instant Settlement</span>
          </div>
          <p className="text-[11px] text-purple-300 mb-1">Your approved settlement offer</p>
          <motion.p
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="text-[36px] font-black text-white"
          >
            ₹{netAmount.toLocaleString('en-IN')}
          </motion.p>
        </div>

        {/* Breakdown */}
        <div className="px-5 py-4 bg-[var(--aura-surface)] space-y-2.5">
          <div className="flex justify-between text-[13px]">
            <span className="text-[var(--aura-text-subtle)]">Approved repair cost</span>
            <span className="text-[var(--aura-text)] font-medium">₹{baseAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-[var(--aura-text-subtle)]">Compulsory deductible</span>
            <span className="text-red-400 font-medium">− ₹{deductible.toLocaleString('en-IN')}</span>
          </div>
          <div className="h-px bg-[var(--aura-border)]" />
          <div className="flex justify-between text-[14px] font-bold">
            <span className="text-[var(--aura-text)]">Net settlement</span>
            <span className="text-[#A855F7]">₹{netAmount.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-[11px] text-[var(--aura-text-subtle)]">Transfer to your linked bank account within 24 hours.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onDecline}
          className="flex-1 py-3 rounded-xl font-semibold text-[14px] transition-all active:scale-95"
          style={{ background: 'var(--btn-secondary-bg)', border: '1px solid var(--btn-secondary-border)', color: 'var(--btn-secondary-text)', boxShadow: 'var(--btn-secondary-shadow)' }}
        >
          Decline
        </button>
        <button
          onClick={handleAccept}
          disabled={accepted}
          className="flex-[2] py-3 rounded-xl font-semibold text-[14px] text-white transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
          style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
        >
          {accepted ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" d="M12 3v3m0 12v3M5.636 5.636l2.122 2.122m8.485 8.485l2.121 2.121M3 12h3m12 0h3M5.636 18.364l2.122-2.122m8.485-8.485l2.121-2.121" />
              </svg>
              Processing...
            </>
          ) : (
            'Accept Offer'
          )}
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   Garage Selector (Cashless Claim)
   ═══════════════════════════════════════════════ */

const CLAIM_GARAGES = [
  { id: 'gomechanic', name: 'GoMechanic', location: 'Sector 29, Gurgaon', distance: '2.3 km', deductible: 0, rating: 4.7, cashless: true },
  { id: 'carnation', name: 'Carnation Auto', location: 'Cyber City, Gurgaon', distance: '4.1 km', deductible: 0, rating: 4.8, cashless: true },
  { id: 'pitstop', name: 'Pit Stop', location: 'MG Road, Gurgaon', distance: '5.8 km', deductible: 0, rating: 4.5, cashless: true },
  { id: 'autobahn', name: 'Autobahn Motors', location: 'DLF Phase 3', distance: '3.7 km', deductible: 0, rating: 4.6, cashless: true },
  { id: 'outside_network', name: 'Any other garage', location: 'Outside ACKO network', distance: '', deductible: 5000, rating: 0, cashless: false },
];

export function GarageSelectorClaim({ onSelect }: { onSelect: (garageId: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelected(id);
    setTimeout(() => onSelect(id), 300);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
      <p className="text-[13px] font-semibold text-[var(--aura-text-muted)] uppercase tracking-wide mb-1">
        Select a garage
      </p>
      <p className="text-[12px] text-[var(--aura-text-subtle)] mb-3">
        ₹0 deductible at ACKO network garages · ₹5,000 outside
      </p>
      <div className="space-y-2">
        {CLAIM_GARAGES.map((garage, i) => {
          const isSelected = selected === garage.id;
          return (
            <motion.button
              key={garage.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleSelect(garage.id)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all active:scale-[0.97] ${
                isSelected
                  ? 'border-[#A855F7] bg-[#A855F7]/10'
                  : garage.cashless
                  ? 'border-[var(--aura-border)] bg-[var(--aura-surface)] hover:border-[var(--aura-border-strong)]'
                  : 'border-dashed border-[var(--aura-border)] bg-[var(--aura-surface)] hover:border-[var(--aura-border-strong)] opacity-80'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${garage.cashless ? 'bg-[#A855F7]/15' : 'bg-[var(--aura-surface-2)]'}`}>
                  <svg className={`w-4.5 h-4.5 ${garage.cashless ? 'text-[#C084FC]' : 'text-[var(--aura-text-muted)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-semibold text-[var(--aura-text)]">{garage.name}</p>
                    {garage.cashless && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                        Cashless
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--aura-text-subtle)]">{garage.location}{garage.distance ? ` · ${garage.distance}` : ''}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {garage.rating > 0 && (
                      <span className="text-[11px] text-[var(--aura-text-subtle)]">★ {garage.rating}</span>
                    )}
                    <span className={`text-[11px] font-semibold ${garage.deductible === 0 ? 'text-green-400' : 'text-orange-400'}`}>
                      {garage.deductible === 0 ? '₹0 deductible' : `₹${garage.deductible.toLocaleString('en-IN')} deductible`}
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   Reimbursement Upload
   Upload final invoice for reimbursement
   ═══════════════════════════════════════════════ */

export function ReimbursementUpload({ onContinue }: { onContinue: (result: { invoiceUploaded: boolean }) => void }) {
  const [invoiceUploaded, setInvoiceUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [amount, setAmount] = useState('');

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => { setInvoiceUploaded(true); setUploading(false); }, 1100);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
      <p className="text-[13px] font-semibold text-[var(--aura-text-muted)] uppercase tracking-wide mb-3">
        Upload repair invoice
      </p>

      <div className={`rounded-2xl border p-4 mb-3 transition-all ${invoiceUploaded ? 'border-green-500/40 bg-green-500/5' : 'border-dashed border-[var(--aura-border)] bg-[var(--aura-surface)]'}`}>
        {invoiceUploaded ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-green-400">Invoice uploaded</p>
              <p className="text-[11px] text-[var(--aura-text-subtle)]">Repair_Invoice.pdf · 234 KB</p>
            </div>
          </div>
        ) : (
          <button onClick={handleUpload} disabled={uploading} className="w-full flex flex-col items-center gap-2 py-4">
            {uploading ? (
              <div className="w-8 h-8 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[var(--aura-surface-2)] flex items-center justify-center mb-1">
                <svg className="w-6 h-6 text-[#C084FC]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
            )}
            <p className="text-[13px] font-semibold text-[var(--aura-text)]">{uploading ? 'Uploading...' : 'Tap to upload invoice'}</p>
            <p className="text-[11px] text-[var(--aura-text-subtle)]">PDF, JPG or PNG · Max 10 MB</p>
          </button>
        )}
      </div>

      <div className="mb-4">
        <label className="text-[12px] font-semibold text-[var(--aura-text-muted)] uppercase tracking-wide block mb-2">
          Final repair amount (₹)
        </label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Enter total invoice amount"
          className="w-full px-4 py-3 rounded-xl border bg-[var(--aura-surface)] text-[var(--aura-text)] text-[14px] outline-none transition-all"
          style={{ borderColor: amount ? '#A855F7' : 'var(--aura-border)' }}
        />
      </div>

      <button
        onClick={() => onContinue({ invoiceUploaded })}
        disabled={!invoiceUploaded || !amount}
        className="w-full py-3.5 rounded-xl font-semibold text-[15px] text-white transition-all active:scale-[0.97] disabled:opacity-40"
        style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
      >
        Submit for reimbursement
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   Claim Closure
   Final summary + settlement confirmed
   ═══════════════════════════════════════════════ */

export function ClaimClosure({ onContinue }: { onContinue: () => void }) {
  const state = useMotorStore() as MotorJourneyState;
  const settlementAmount = state.dashboardClaimSettlementAmount || 18500;
  const deductible = 2500;
  const ncbNote = state.previousPolicy?.ncbPercentage && state.previousPolicy.ncbPercentage > 0
    ? `Your NCB will reset to 0% at next renewal (was ${state.previousPolicy.ncbPercentage}%).`
    : null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
      {/* Celebration header */}
      <div className="text-center mb-5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className="w-16 h-16 rounded-full bg-green-500/15 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-3"
        >
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </motion.div>
        <p className="text-[18px] font-bold text-[var(--aura-text)]">Claim Settled</p>
        <p className="text-[13px] text-[var(--aura-text-subtle)]">Your claim has been fully resolved</p>
      </div>

      {/* Summary card */}
      <div className="rounded-2xl border border-[var(--aura-border)] bg-[var(--aura-surface)] p-4 mb-4 space-y-3">
        <div className="flex justify-between text-[13px]">
          <span className="text-[var(--aura-text-subtle)]">Settlement amount</span>
          <span className="text-[var(--aura-text)] font-bold text-[14px]">₹{settlementAmount.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-[13px]">
          <span className="text-[var(--aura-text-subtle)]">Deductible applied</span>
          <span className="text-[var(--aura-text)] font-medium">₹{deductible.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-[13px]">
          <span className="text-[var(--aura-text-subtle)]">Transfer to</span>
          <span className="text-[var(--aura-text)] font-medium">Bank a/c ····3845</span>
        </div>
        <div className="flex justify-between text-[13px]">
          <span className="text-[var(--aura-text-subtle)]">Status</span>
          <span className="text-green-400 font-semibold">Closed ✓</span>
        </div>

        {ncbNote && (
          <div className="mt-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <p className="text-[12px] text-orange-400 leading-relaxed">⚠️ {ncbNote}</p>
          </div>
        )}

        <div className="p-3 rounded-xl bg-[var(--aura-surface-2)]">
          <p className="text-[11px] text-[var(--aura-text-subtle)]">Ref: {`MCL-${Math.floor(100000 + Math.random() * 900000)}`} · Closed {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      </div>

      <button
        onClick={onContinue}
        className="w-full py-3.5 rounded-xl font-semibold text-[15px] text-white transition-all active:scale-[0.97]"
        style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}
      >
        Back to Dashboard
      </button>
    </motion.div>
  );
}
