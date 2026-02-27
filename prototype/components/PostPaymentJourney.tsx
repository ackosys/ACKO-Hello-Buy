'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '../lib/store';
import { formatCurrency } from '../lib/plans';
import { ConversationStep, StepScript, JourneyState, PostPaymentScenario, Language } from '../lib/types';
import { getPostPaymentStep, getScenarioMembers, SCENARIOS } from '../lib/postPaymentScripts';
import { getT, getLocaleTag, useT } from '../lib/translations';
import ConversationalFlow from './ConversationalFlow';
import AckoLogo from './AckoLogo';

/* ═══════════════════════════════════════════════════════
   Post-Payment Journey — Conversational P2I Experience
   Uses ConversationalFlow + custom widgets
   ═══════════════════════════════════════════════════════ */

/* ── TTS Helper ── */
function useTTS(lang: Language) {
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const localeTag = getLocaleTag(lang);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    synthRef.current = window.speechSynthesis;
    const pickVoice = () => {
      const voices = synthRef.current!.getVoices();
      if (!voices.length) return;
      const localePrefix = localeTag.split('-')[0];
      let ranked: string[];
      if (lang === 'en') {
        ranked = ['Lekha', 'Rishi', 'Aditi', 'Veena'];
      } else if (lang === 'hi' || lang === 'hinglish') {
        ranked = ['Google Hindi', 'Microsoft Swara', 'Lekha', 'Rishi'];
      } else if (lang === 'kn') {
        ranked = ['Google Kannada', 'Lekha', 'Rishi'];
      } else {
        ranked = ['Lekha', 'Rishi', 'Aditi', 'Veena'];
      }
      let best: SpeechSynthesisVoice | undefined;
      for (const name of ranked) {
        best = voices.find(v => v.name.includes(name) && v.lang.startsWith(localePrefix));
        if (best) break;
      }
      if (!best) best = voices.find(v => v.lang === localeTag);
      if (!best) best = voices.find(v => v.lang.startsWith(localePrefix));
      voiceRef.current = best || null;
    };
    pickVoice();
    synthRef.current.addEventListener('voiceschanged', pickVoice);
    return () => synthRef.current?.removeEventListener('voiceschanged', pickVoice);
  }, [lang, localeTag]);

  const speak = (text: string, onEnd?: () => void) => {
    if (!synthRef.current) { onEnd?.(); return; }
    synthRef.current.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.25; u.pitch = 1.15; u.lang = localeTag;
    if (voiceRef.current) u.voice = voiceRef.current;
    if (onEnd) u.onend = () => onEnd();
    u.onerror = () => onEnd?.();
    synthRef.current.speak(u);
  };
  const stop = () => { synthRef.current?.cancel(); };
  return { speak, stop };
}

/* ── STT Helper ── */
function useSTT(lang: Language) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onResultRef = useRef<((text: string) => void) | null>(null);
  const localeTag = getLocaleTag(lang);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = localeTag; recognition.interimResults = true; recognition.continuous = false;
    recognitionRef.current = recognition;
    return () => { try { recognition.abort(); } catch {} };
  }, [lang, localeTag]);

  const clearPause = () => { if (pauseTimerRef.current) { clearTimeout(pauseTimerRef.current); pauseTimerRef.current = null; } };

  const startListening = (onResult: (text: string) => void) => {
    onResultRef.current = onResult;
    setTranscript(''); setIsListening(true);
    if (!recognitionRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognitionRef.current.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript;
      setTranscript(text);
      clearPause();
      pauseTimerRef.current = setTimeout(() => { setIsListening(false); onResultRef.current?.(text); }, result.isFinal ? 1000 : 1500);
    };
    recognitionRef.current.onerror = () => { clearPause(); setIsListening(false); };
    recognitionRef.current.onend = () => { clearPause(); setIsListening(false); };
    try { recognitionRef.current.start(); } catch { setIsListening(false); }
  };
  const stopListening = () => { clearPause(); try { recognitionRef.current?.stop(); } catch {} setIsListening(false); };
  return { startListening, stopListening, isListening, transcript };
}

/* ── Riya's Question Protocol ── */
interface RiyaQuestion { id: string; text: string; type: 'choice' | 'auto' | 'yes_no'; options?: string[]; phase: string; deepDive?: RiyaQuestion[]; }
function getRiyaQuestions(language: Language): RiyaQuestion[] {
  const t = getT(language);
  return [
    { id: 'intro', type: 'choice', phase: 'Setup', text: t.riyaQuestions.intro, options: [t.postPayment.english, t.postPayment.hindi, t.postPayment.hinglish, t.postPayment.kannada] },
    { id: 'identity', type: 'choice', phase: 'Identity', text: t.riyaQuestions.identity, options: [t.riyaQuestions.identityYes, t.riyaQuestions.identityNo] },
    { id: 'members_confirm', type: 'choice', phase: 'Identity', text: t.riyaQuestions.membersConfirm, options: [t.riyaQuestions.membersYes, t.riyaQuestions.membersNo] },
    { id: 'vitals', type: 'yes_no', phase: 'Vitals', text: t.riyaQuestions.vitals },
    { id: 'bmi_followup', type: 'auto', phase: 'Vitals', text: t.riyaQuestions.bmiFollowup },
    { id: 'tobacco', type: 'yes_no', phase: 'Lifestyle', text: t.riyaQuestions.tobacco },
    { id: 'alcohol', type: 'yes_no', phase: 'Lifestyle', text: t.riyaQuestions.alcohol, deepDive: [
      { id: 'dd_alc_freq', text: t.riyaQuestions.alcFreq, type: 'choice', options: t.riyaQuestions.alcOptions, phase: 'Lifestyle' },
    ] },
    { id: 'diabetes', type: 'yes_no', phase: 'Medical History', text: t.riyaQuestions.diabetesQ, deepDive: [
      { id: 'dd_diab_type', text: t.riyaQuestions.diabType, type: 'choice', options: t.riyaQuestions.diabOptions, phase: 'Deep Dive' },
    ] },
    { id: 'hypertension', type: 'yes_no', phase: 'Medical History', text: t.riyaQuestions.hypertensionQ },
    { id: 'cardiac', type: 'yes_no', phase: 'System Review', text: t.riyaQuestions.cardiac },
    { id: 'hospitalization', type: 'yes_no', phase: 'System Review', text: t.riyaQuestions.hospitalization },
    { id: 'family_history', type: 'yes_no', phase: 'Family History', text: t.riyaQuestions.familyHistory },
    { id: 'current_meds', type: 'yes_no', phase: 'Current Status', text: t.riyaQuestions.currentMeds },
    { id: 'closing', type: 'auto', phase: 'Closing', text: t.riyaQuestions.closing },
  ];
}

/* ── Breathing Orb ── */
function BreathingOrb({ isSpeaking, size = 60 }: { isSpeaking: boolean; size?: number }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <motion.div animate={{ scale: isSpeaking ? [1, 1.3, 1] : [1, 1.08, 1], opacity: isSpeaking ? [0.3, 0.6, 0.3] : [0.15, 0.25, 0.15] }} transition={{ duration: isSpeaking ? 0.6 : 3, repeat: Infinity, ease: 'easeInOut' }} className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,77,234,0.4) 0%, rgba(99,77,234,0) 70%)' }} />
      <motion.div animate={{ scale: isSpeaking ? [1, 1.15, 1] : [1, 1.04, 1] }} transition={{ duration: isSpeaking ? 0.5 : 2.5, repeat: Infinity, ease: 'easeInOut' }} className="absolute rounded-full" style={{ width: size * 0.7, height: size * 0.7, background: 'linear-gradient(135deg, #6C4DE8 0%, #4E29BB 50%, #2E1773 100%)', boxShadow: isSpeaking ? '0 0 40px rgba(99,77,234,0.6)' : '0 0 20px rgba(99,77,234,0.3)' }} />
      <motion.div animate={{ scale: isSpeaking ? [1, 1.1, 1] : [1, 1.02, 1] }} transition={{ duration: isSpeaking ? 0.4 : 2, repeat: Infinity, ease: 'easeInOut' }} className="absolute rounded-full bg-white/20" style={{ width: size * 0.3, height: size * 0.3 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Voice Call Screen (Full Overlay) — preserved from original
   ═══════════════════════════════════════════════════════ */
function VoiceCallScreen({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) {
  type VoicePhase = 'idle' | 'ringing' | 'connected' | 'ended';
  const language = useJourneyStore(s => s.language);
  const t = useT();
  const riyaQuestions = getRiyaQuestions(language);
  const [voicePhase, setVoicePhase] = useState<VoicePhase>('ringing');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [deepDiveActive, setDeepDiveActive] = useState(false);
  const [deepDiveIndex, setDeepDiveIndex] = useState(0);
  const [chatLog, setChatLog] = useState<{ role: 'riya' | 'user'; text: string }[]>([]);
  const [autoSelectPick, setAutoSelectPick] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const simulateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSelectAnimRef = useRef<NodeJS.Timeout | null>(null);
  const { speak: ttsSpeak, stop: ttsStop } = useTTS(language);
  const { startListening, stopListening, isListening, transcript } = useSTT(language);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatLog, showOptions]);

  useEffect(() => {
    if (voicePhase === 'ringing') {
      const timer = setTimeout(() => { setVoicePhase('connected'); setTimeout(() => speakQuestion(0), 600); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [voicePhase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (voicePhase === 'connected') {
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [voicePhase]);

  useEffect(() => () => { ttsStop(); if (simulateTimerRef.current) clearTimeout(simulateTimerRef.current); if (autoSelectAnimRef.current) clearTimeout(autoSelectAnimRef.current); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentQRef = useRef(deepDiveActive ? riyaQuestions[questionIndex]?.deepDive?.[deepDiveIndex] : riyaQuestions[questionIndex]);
  const showOptionsRef = useRef(showOptions);
  const deepDiveActiveRef = useRef(deepDiveActive);
  currentQRef.current = deepDiveActive ? riyaQuestions[questionIndex]?.deepDive?.[deepDiveIndex] : riyaQuestions[questionIndex];
  showOptionsRef.current = showOptions;
  deepDiveActiveRef.current = deepDiveActive;

  useEffect(() => {
    if (!showOptions || isSpeaking) return;
    if (simulateTimerRef.current) clearTimeout(simulateTimerRef.current);
    const q = currentQRef.current;
    if (!q) return;
    let pick: string;
    if (q.type === 'yes_no') pick = Math.random() > 0.3 ? t.common.no : t.common.yes;
    else if (q.options) pick = q.options[Math.floor(Math.random() * q.options.length)];
    else pick = t.common.no;
    autoSelectAnimRef.current = setTimeout(() => setAutoSelectPick(pick), 1000);
    simulateTimerRef.current = setTimeout(() => {
      if (!showOptionsRef.current) return;
      setAutoSelectPick(null);
      stopListening();
      if (deepDiveActiveRef.current) handleDeepDiveAnswer(pick);
      else handleAnswer(pick);
    }, 4000);
    return () => { if (simulateTimerRef.current) clearTimeout(simulateTimerRef.current); if (autoSelectAnimRef.current) clearTimeout(autoSelectAnimRef.current); setAutoSelectPick(null); };
  }, [showOptions, isSpeaking, questionIndex, deepDiveIndex, deepDiveActive, t.common.yes, t.common.no]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const speakQuestion = (qIdx?: number) => {
    const idx = qIdx !== undefined ? qIdx : questionIndex;
    const q = riyaQuestions[idx]; if (!q) return;
    setIsSpeaking(true); setShowOptions(false);
    setChatLog(prev => [...prev, { role: 'riya', text: q.text }]);
    ttsSpeak(q.text, () => {
      setIsSpeaking(false);
      if (q.type === 'auto' && q.id === 'closing') {
        setTimeout(() => { setVoicePhase('ended'); if (timerRef.current) clearInterval(timerRef.current); setTimeout(onComplete, 2000); }, 1500);
      } else if (q.type === 'auto') { setTimeout(() => advanceToNext(idx), 1200); }
      else { setShowOptions(true); }
    });
  };

  const speakDeepDiveQ = (qIdx: number, ddIdx: number) => {
    const ddQ = riyaQuestions[qIdx]?.deepDive?.[ddIdx]; if (!ddQ) return;
    setIsSpeaking(true); setShowOptions(false);
    setChatLog(prev => [...prev, { role: 'riya', text: ddQ.text }]);
    ttsSpeak(ddQ.text, () => { setIsSpeaking(false); setShowOptions(true); });
  };

  const advanceToNext = (fromIdx: number) => {
    const next = fromIdx + 1;
    if (next < riyaQuestions.length) { setQuestionIndex(next); setDeepDiveActive(false); setDeepDiveIndex(0); speakQuestion(next); }
  };

  const handleAnswer = (answer: string) => {
    const q = riyaQuestions[questionIndex];
    setResponses(prev => ({ ...prev, [q.id]: answer }));
    setShowOptions(false);
    setChatLog(prev => [...prev, { role: 'user', text: answer }]);
    if (q.deepDive && answer === t.common.yes && !deepDiveActive) { setDeepDiveActive(true); setDeepDiveIndex(0); setTimeout(() => speakDeepDiveQ(questionIndex, 0), 800); return; }
    setTimeout(() => advanceToNext(questionIndex), 600);
  };

  const handleDeepDiveAnswer = (answer: string) => {
    const q = riyaQuestions[questionIndex];
    const ddQ = q.deepDive![deepDiveIndex];
    setResponses(prev => ({ ...prev, [ddQ.id]: answer }));
    setShowOptions(false);
    setChatLog(prev => [...prev, { role: 'user', text: answer }]);
    const nextDD = deepDiveIndex + 1;
    if (nextDD < q.deepDive!.length) { setDeepDiveIndex(nextDD); setTimeout(() => speakDeepDiveQ(questionIndex, nextDD), 800); }
    else { setTimeout(() => advanceToNext(questionIndex), 600); }
  };

  const endCall = () => {
    ttsStop(); stopListening();
    if (simulateTimerRef.current) clearTimeout(simulateTimerRef.current);
    if (autoSelectAnimRef.current) clearTimeout(autoSelectAnimRef.current);
    setAutoSelectPick(null); setVoicePhase('ended');
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(onComplete, 1000);
  };

  const currentQ = deepDiveActive ? riyaQuestions[questionIndex]?.deepDive?.[deepDiveIndex] : riyaQuestions[questionIndex];

  // Ringing
  if (voicePhase === 'ringing') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-gradient-to-b from-[#1a1040] to-[#0c0620] flex flex-col items-center justify-center">
        <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="relative mb-8">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-purple-400/30 shadow-[0_0_60px_rgba(99,77,234,0.4)]">
            <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face" alt={t.postPayment.drRiya} className="w-full h-full object-cover" />
          </div>
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0 rounded-full border-2 border-purple-400" />
        </motion.div>
        <h2 className="text-white text-xl font-semibold mb-1">{t.postPayment.drRiya}</h2>
        <p className="text-purple-300 text-sm mb-8">{t.postPayment.riyaTitle}</p>
        <motion.p animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-purple-200 text-sm">{t.postPayment.calling}</motion.p>
        <div className="flex items-center gap-6 mt-12">
          <button onClick={endCall} className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </motion.div>
    );
  }

  // Ended
  if (voicePhase === 'ended') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-gradient-to-b from-[#1a1040] to-[#0c0620] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
        </div>
        <h2 className="text-white text-xl font-semibold mb-2">{t.postPayment.callComplete}</h2>
        <p className="text-purple-300 text-sm">{t.postPayment.duration(formatDuration(callDuration))}</p>
        <p className="text-purple-400 text-xs mt-2">{t.postPayment.responsesRecorded(Object.keys(responses).length)}</p>
      </motion.div>
    );
  }

  // Connected — chat UI
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-gradient-to-b from-[#1a1040] via-[#120930] to-[#0c0620] flex flex-col">
      <div className="flex items-center justify-between px-5 pt-12 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-400/40">
            <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=80&h=80&fit=crop&crop=face" alt={t.postPayment.drRiya} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">{t.postPayment.drRiya}</p>
            <p className="text-purple-300 text-xs">{formatDuration(callDuration)} · {isSpeaking ? t.postPayment.speaking : t.postPayment.listening}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-purple-300 text-xs bg-purple-500/20 px-2 py-1 rounded-full">{currentQ?.phase || 'Setup'}</span>
          <span className="text-purple-400 text-xs">{questionIndex + 1}/{riyaQuestions.length}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex justify-center mb-4"><BreathingOrb isSpeaking={isSpeaking} size={60} /></div>
        <div className="space-y-3 max-w-md mx-auto">
          {chatLog.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-md' : 'bg-white/10 text-white/90 rounded-bl-md'}`}>{msg.text}</div>
            </motion.div>
          ))}
          {isSpeaking && (
            <div className="flex justify-start">
              <div className="bg-white/10 px-4 py-2.5 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-typing" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-typing" style={{ animationDelay: '200ms' }} />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-typing" style={{ animationDelay: '400ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>
      <AnimatePresence>
        {showOptions && currentQ && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="px-5 pb-2">
            <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
              {(currentQ.type === 'yes_no' ? [t.common.yes, t.common.no] : currentQ.options || []).map(opt => (
                <button key={opt} onClick={() => {
                  setAutoSelectPick(null);
                  if (simulateTimerRef.current) clearTimeout(simulateTimerRef.current);
                  if (autoSelectAnimRef.current) clearTimeout(autoSelectAnimRef.current);
                  deepDiveActive ? handleDeepDiveAnswer(opt) : handleAnswer(opt);
                }} className={`relative px-5 py-2.5 border text-white rounded-full text-sm font-medium overflow-hidden transition-all ${autoSelectPick === opt ? 'border-green-400/60 bg-green-500/20' : 'border-white/20 bg-white/10 hover:bg-white/20'}`}>
                  {autoSelectPick === opt && <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 3, ease: 'linear' }} className="absolute inset-0 bg-green-400/30 origin-left rounded-full" />}
                  <span className="relative z-10">{opt}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {isListening && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-5 pb-2">
          <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 max-w-md mx-auto flex items-center gap-3">
            <div className="flex gap-0.5 items-center">
              {[0, 0.1, 0.2, 0.15].map((d, i) => <motion.div key={i} animate={{ scaleY: [1, 1.8 + i * 0.3, 1] }} transition={{ duration: 0.4, repeat: Infinity, delay: d }} className="w-1 h-3 bg-red-400 rounded-full" />)}
            </div>
            <p className="text-white/80 text-sm flex-1">{transcript || t.postPayment.listeningEllipsis}</p>
          </div>
        </motion.div>
      )}
      <div className="flex items-center justify-center gap-3 py-4 border-t border-white/10">
        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => { if (isListening) stopListening(); else { if (simulateTimerRef.current) clearTimeout(simulateTimerRef.current); if (autoSelectAnimRef.current) clearTimeout(autoSelectAnimRef.current); setAutoSelectPick(null); startListening((t) => { if (simulateTimerRef.current) clearTimeout(simulateTimerRef.current); if (autoSelectAnimRef.current) clearTimeout(autoSelectAnimRef.current); setAutoSelectPick(null); /* match voice */ deepDiveActive ? handleDeepDiveAnswer(t) : handleAnswer(t); }); } }}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isListening ? 'bg-red-500 shadow-red-500/40 animate-pulse' : 'bg-green-500 shadow-green-500/30'}`}>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
        </motion.button>
        <button onClick={endCall} className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <button onClick={() => { ttsStop(); stopListening(); if (simulateTimerRef.current) clearTimeout(simulateTimerRef.current); onSkip(); }} className="px-3 py-2 bg-white/10 border border-white/20 text-white rounded-full text-xs font-medium hover:bg-white/20 transition-all">{t.common.skip}</button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Schedule Picker Widget (inline in chat)
   ═══════════════════════════════════════════════════════ */
const LANG_OPTIONS: Language[] = ['en', 'hi', 'hinglish', 'kn'];
const LANG_LABEL_KEYS: Record<Language, 'english' | 'hindi' | 'hinglish' | 'kannada'> = { en: 'english', hi: 'hindi', hinglish: 'hinglish', kn: 'kannada' };

function SchedulePickerWidget({ onSubmit, showLang = true }: { onSubmit: (data: any) => void; showLang?: boolean }) {
  const t = useT();
  const [lang, setLang] = useState<Language>('en');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const updateState = useJourneyStore(s => s.updateState);

  const dates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1);
    return { value: d.toISOString().split('T')[0], label: d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }) };
  });
  const timeSlots = [
    { id: 'morning', label: '9:00 AM' },
    { id: 'mid_morning', label: '11:00 AM' },
    { id: 'afternoon', label: '2:00 PM' },
    { id: 'evening', label: '4:00 PM' },
    { id: 'late_evening', label: '6:00 PM' },
  ];

  return (
    <div className="space-y-4">
      {showLang && (
        <div>
          <p className="text-label-sm text-white/70 font-semibold mb-2">{t.postPayment.langPreference}</p>
          <div className="flex gap-2 flex-wrap">{LANG_OPTIONS.map((id) => (
            <button key={id} onClick={() => setLang(id)} className={`flex-1 min-w-[70px] py-2.5 rounded-xl border text-label-md font-medium transition-all ${lang === id ? 'border-purple-400 bg-white/15 text-white' : 'border-white/10 bg-white/5 text-white/60'}`}>
              {t.postPayment[LANG_LABEL_KEYS[id]]}
            </button>
          ))}</div>
        </div>
      )}
      <div>
        <p className="text-label-sm text-white/70 font-semibold mb-2">Pick a date</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">{dates.map(d => (
          <button key={d.value} onClick={() => setDate(d.value)} className={`flex-shrink-0 px-4 py-3 rounded-xl border text-center transition-all min-w-[90px] ${date === d.value ? 'border-purple-400 bg-white/15 text-white' : 'border-white/10 bg-white/5 text-white/60'}`}>
            <p className="text-label-md font-medium">{d.label.split(',')[0]}</p>
            <p className="text-body-xs text-white/30">{d.label.split(',')[1]}</p>
          </button>
        ))}</div>
      </div>
      <div>
        <p className="text-label-sm text-white/70 font-semibold mb-2">Pick a time</p>
        <div className="grid grid-cols-3 gap-2">{timeSlots.map(s => (
          <button key={s.id} onClick={() => setTime(s.id)} className={`p-3 rounded-xl border text-center transition-all ${time === s.id ? 'border-purple-400 bg-white/15' : 'border-white/10 bg-white/5'}`}>
            <p className="text-label-md text-white/90 font-medium">{s.label}</p>
          </button>
        ))}</div>
      </div>
      <button onClick={() => {
        updateState({ callScheduledDate: date, callScheduledTime: time, callScheduledLang: lang });
        const dateLabel = dates.find(d => d.value === date)?.label || date;
        const timeLabel = timeSlots.find(s => s.id === time)?.label || time;
        onSubmit(`Scheduled: ${dateLabel} at ${timeLabel}`);
      }} disabled={!date || !time} className="w-full py-3.5 bg-white text-[#1C0B47] rounded-xl text-label-lg font-semibold disabled:opacity-40 hover:bg-white/90 transition-all">
        {t.postPayment.confirmSchedule}
      </button>
    </div>
  );
}

/* ── Test Schedule Widget ── */
function TestScheduleWidget({ onSubmit }: { onSubmit: (data: any) => void }) {
  const t = useT();
  const scenario = useJourneyStore(s => s.postPaymentScenario);
  const updateState = useJourneyStore(s => s.updateState);
  const isLab = !['home_test_only', 'all_clear', 'no_test'].includes(scenario);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [lab, setLab] = useState('');

  const dates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1);
    return { value: d.toISOString().split('T')[0], label: d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }) };
  });
  const times = [
    { id: 'early', label: '7-10 AM', note: 'Best for fasting' },
    { id: 'morning', label: '10 AM-1 PM', note: '' },
    { id: 'afternoon', label: '2-5 PM', note: '' },
  ];
  const labs = [
    { id: 'thyrocare', name: 'Thyrocare Diagnostics', distance: '1.2 km' },
    { id: 'metropolis', name: 'Metropolis Healthcare', distance: '2.4 km' },
    { id: 'srl', name: 'SRL Diagnostics', distance: '3.1 km' },
    { id: 'lalpath', name: 'Dr Lal PathLabs', distance: '3.8 km' },
  ];

  return (
    <div className="space-y-4">
      <div className={`rounded-xl p-3 ${isLab ? 'bg-purple-500/10 border border-purple-400/20' : 'bg-teal-500/10 border border-teal-400/20'}`}>
        <p className={`text-label-sm font-semibold ${isLab ? 'text-purple-300' : 'text-teal-300'}`}>{isLab ? t.postPayment.labVisitRequired : t.postPayment.homeSampleCollection}</p>
        <p className={`text-body-xs ${isLab ? 'text-purple-300/70' : 'text-teal-300/70'}`}>{isLab ? t.postPayment.ecgTests : t.postPayment.bloodUrineTests}</p>
      </div>
      <div>
        <p className="text-label-sm text-white/70 font-semibold mb-2">Pick a date</p>
        <div className="flex gap-2 overflow-x-auto pb-1">{dates.map(d => (
          <button key={d.value} onClick={() => setDate(d.value)} className={`flex-shrink-0 px-4 py-3 rounded-xl border text-center transition-all min-w-[90px] ${date === d.value ? 'border-purple-400 bg-white/15 text-white' : 'border-white/10 bg-white/5 text-white/60'}`}>
            <p className="text-label-md font-medium">{d.label.split(',')[0]}</p>
          </button>
        ))}</div>
      </div>
      <div>
        <p className="text-label-sm text-white/70 font-semibold mb-2">Preferred time</p>
        <div className="grid grid-cols-3 gap-2">{times.map(s => (
          <button key={s.id} onClick={() => setTime(s.id)} className={`p-3 rounded-xl border text-center transition-all ${time === s.id ? 'border-purple-400 bg-white/15' : 'border-white/10 bg-white/5'}`}>
            <p className="text-label-md text-white font-medium">{s.label}</p>
            {s.note && <p className="text-caption text-green-400">{s.note}</p>}
          </button>
        ))}</div>
      </div>
      {isLab && (
        <div>
          <p className="text-label-sm text-white/70 font-semibold mb-2">Choose a lab</p>
          <div className="space-y-2">{labs.map(l => (
            <button key={l.id} onClick={() => setLab(l.id)} className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${lab === l.id ? 'border-purple-400 bg-white/15' : 'border-white/10 bg-white/5'}`}>
              <div><p className="text-body-sm font-medium text-white">{l.name}</p><p className="text-caption text-white/60">{l.distance}</p></div>
            </button>
          ))}</div>
        </div>
      )}
      <button onClick={() => {
        updateState({ testScheduledDate: date, testScheduledTime: time, testScheduledLab: lab });
        onSubmit(t.postPayment.testsScheduled);
      }} disabled={!date || !time || (isLab && !lab)} className="w-full py-3.5 bg-purple-600 text-white rounded-xl text-label-lg font-semibold disabled:opacity-40 hover:bg-purple-700 transition-all">
        {t.widgets.confirmBooking}
      </button>
    </div>
  );
}

/* ── Health Summary Card Widget ── */
function HealthSummaryCard({ onResponse }: { onResponse: (r: any) => void }) {
  const t = useT();
  const state = useJourneyStore.getState() as JourneyState;
  const scenarioMembers = getScenarioMembers(state);
  const scenario = state.postPaymentScenario;

  return (
    <div className="space-y-3">
      {scenarioMembers.map((m, i) => {
        const isRejected = scenario === 'member_rejected' && m.relation === 'father';
        const hasWaiting = scenario === 'waiting_period' && i === 0;
        return (
          <div key={i} className={`border rounded-xl p-4 ${isRejected ? 'bg-red-500/15 border-red-400/30' : hasWaiting ? 'bg-amber-500/15 border-amber-400/30' : 'bg-white/6 border-white/10'}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isRejected ? 'bg-red-500/30' : hasWaiting ? 'bg-amber-500/30' : 'bg-purple-500/30'}`}><span className="text-xs font-bold text-white">{m.name[0]}</span></div>
                <span className="text-label-sm text-white font-semibold">{m.name} ({m.age} yrs)</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${isRejected ? 'bg-red-500/20 text-red-300' : hasWaiting ? 'bg-amber-500/20 text-amber-300' : 'bg-green-500/20 text-green-300'}`}>
                {isRejected ? t.postPayment.notEligible : hasWaiting ? t.postPayment.twoYrWaiting : t.postPayment.allClear}
              </span>
            </div>
            {isRejected && <p className="text-body-xs text-red-300 mt-1">{t.postPayment.seriousCardiac}</p>}
            {hasWaiting && <p className="text-body-xs text-amber-300 mt-1">{t.postPayment.diabetesWaiting}</p>}
            {!isRejected && !hasWaiting && (
              <div className="flex gap-2 text-body-xs mt-1">
                <span className="flex items-center gap-0.5 text-green-400"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>{t.postPayment.bloodNormal}</span>
                <span className="flex items-center gap-0.5 text-green-400"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>{t.postPayment.vitalsNormal}</span>
              </div>
            )}
          </div>
        );
      })}
      <button onClick={() => onResponse('acknowledged')} className="w-full py-3 bg-purple-600 text-white rounded-xl text-label-md font-semibold hover:bg-purple-700 transition-all mt-2">
        {t.common.continue}
      </button>
    </div>
  );
}

/* ── Premium Update Card Widget ── */
function PremiumUpdateCard({ onResponse }: { onResponse: (r: any) => void }) {
  const t = useT();
  const state = useJourneyStore.getState() as JourneyState;
  const scenario = state.postPaymentScenario;
  const original = state.selectedPlan ? (state.paymentFrequency === 'monthly' ? state.selectedPlan.monthlyPremium : state.selectedPlan.yearlyPremium) : 12999;
  let change = 0;
  if (scenario === 'all_clear' || scenario === 'home_test_only') change = -Math.round(original * 0.05);
  else if (scenario === 'member_rejected') change = -Math.round(original * 0.30);
  else if (scenario === 'extra_payment') change = Math.round(original * 0.15);
  const newPremium = original + change;
  const freq = state.paymentFrequency === 'monthly' ? 'mo' : 'yr';
  const isRefund = change < 0;
  const noChange = change === 0;

  return (
    <div className="bg-white/6 border border-white/10 rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-center pb-3 border-b border-white/10">
        <span className="text-body-sm text-white/70">{t.postPayment.originalPremium}</span>
        <span className="text-body-sm text-white/80">{formatCurrency(original)}/{freq}</span>
      </div>
      {!noChange && (
        <div className="flex justify-between items-center pb-3 border-b border-white/10">
          <span className="text-body-sm text-white/70">{t.postPayment.adjustment}</span>
          <span className={`text-body-sm font-medium ${isRefund ? 'text-green-400' : 'text-amber-400'}`}>{isRefund ? '-' : '+'}{formatCurrency(Math.abs(change))}</span>
        </div>
      )}
      <div className="flex justify-between items-center">
        <span className="text-label-md text-white font-semibold">{t.postPayment.newPremium}</span>
        <span className="text-label-lg text-purple-300 font-bold">{formatCurrency(newPremium)}<span className="text-body-xs text-white/70 font-normal">/{freq}</span></span>
      </div>
      <button onClick={() => onResponse('accepted')} className="w-full py-3 bg-purple-600 text-white rounded-xl text-label-md font-semibold hover:bg-purple-700 transition-all">
        {isRefund ? t.postPayment.acceptProceed : change > 0 ? t.postPayment.payAndProceed(formatCurrency(change)) : t.common.continue}
      </button>
    </div>
  );
}

/* ── Confetti Particle ── */
function ConfettiParticle({ index }: { index: number }) {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#F472B6', '#60A5FA', '#34D399', '#FBBF24', '#F87171', '#818CF8'];
  const color = colors[index % colors.length];
  const left = 5 + Math.random() * 90;
  const size = 4 + Math.random() * 6;
  const delay = Math.random() * 2;
  const duration = 2.5 + Math.random() * 2;
  const rotation = Math.random() * 720 - 360;
  const isCircle = Math.random() > 0.5;
  return (
    <motion.div
      initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
      animate={{ y: [0, 400 + Math.random() * 200], x: [0, (Math.random() - 0.5) * 120], opacity: [1, 1, 0], rotate: rotation }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeIn' }}
      className="absolute pointer-events-none"
      style={{ left: `${left}%`, top: -10, width: isCircle ? size : size * 0.4, height: isCircle ? size : size * 1.6, background: color, borderRadius: isCircle ? '50%' : '2px' }}
    />
  );
}

/* ── Policy Celebration Widget ── */
function PolicyCelebrationWidget({ onResponse }: { onResponse: (r: any) => void }) {
  const t = useT();
  const state = useJourneyStore.getState() as JourneyState;
  const scenarioMembers = getScenarioMembers(state);
  const coveredMembers = scenarioMembers.filter(m => !(state.postPaymentScenario === 'member_rejected' && m.relation === 'father'));
  const freq = state.paymentFrequency === 'monthly' ? 'mo' : 'yr';
  const premium = state.selectedPlan ? (state.paymentFrequency === 'monthly' ? state.selectedPlan.monthlyPremium : state.selectedPlan.yearlyPremium) : 12999;
  const policyNo = `ACKO-HI-${Math.floor(1000000 + Math.random() * 9000000)}`;
  const startDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const endDate = new Date(Date.now() + 365 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="relative text-center space-y-4 overflow-hidden">
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {Array.from({ length: 40 }).map((_, i) => <ConfettiParticle key={i} index={i} />)}
      </div>

      {/* Shield + glow */}
      <div className="relative z-10 flex justify-center mb-3">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }} className="relative">
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.4) 0%, rgba(34,197,94,0) 70%)', transform: 'scale(1.8)' }} />
          <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(34,197,94,0.5)]" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)' }}>
            <motion.svg initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.5 }} className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></motion.svg>
          </div>
        </motion.div>
      </div>

      {/* Title */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="relative z-10">
        <h3 className="text-xl font-bold text-white mb-1">{t.postPayment.policyIssued}</h3>
        <p className="text-sm text-green-300 font-medium">{t.postPayment.familyProtected}</p>
      </motion.div>

      {/* Policy Card */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="relative z-10 rounded-2xl p-[1px] overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.5), rgba(99,77,234,0.5), rgba(34,197,94,0.3))' }}>
        <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(20,10,50,0.95) 0%, rgba(30,15,70,0.95) 100%)' }}>
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-sm">{state.selectedPlan?.name || 'ACKO Platinum'}</p>
                <p className="text-white/40 text-[10px]">{policyNo}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-green-500/20 border border-green-400/30 rounded-full text-[10px] font-bold text-green-400 uppercase tracking-wider">{t.postPayment.active}</span>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 text-left mb-4">
            <div className="bg-white/5 rounded-lg px-3 py-2">
              <p className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">Sum Insured</p>
              <p className="text-white font-bold text-sm">{state.selectedPlan?.sumInsuredLabel || '₹25L'}</p>
            </div>
            <div className="bg-white/5 rounded-lg px-3 py-2">
              <p className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">Premium</p>
              <p className="text-white font-bold text-sm">{formatCurrency(premium)}<span className="text-white/40 text-[10px] font-normal">/{freq}</span></p>
            </div>
            <div className="bg-white/5 rounded-lg px-3 py-2">
              <p className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">Start Date</p>
              <p className="text-white font-medium text-xs">{startDate}</p>
            </div>
            <div className="bg-white/5 rounded-lg px-3 py-2">
              <p className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">End Date</p>
              <p className="text-white font-medium text-xs">{endDate}</p>
            </div>
          </div>

          {/* Members */}
          <div className="border-t border-white/10 pt-3">
            <p className="text-[9px] text-white/30 uppercase tracking-wider mb-2">Covered Members ({coveredMembers.length})</p>
            <div className="flex flex-wrap gap-2">
              {coveredMembers.map((m, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: ['#7c3aed', '#ec4899', '#06b6d4', '#f59e0b', '#10b981'][i % 5] }}>
                    {m.name[0]}
                  </div>
                  <span className="text-white/80 text-xs font-medium">{m.name}</span>
                  <span className="text-white/30 text-[10px]">{m.age}y</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key features */}
          <div className="border-t border-white/10 pt-3 mt-3">
            <div className="flex justify-between text-[10px]">
              <span className="flex items-center gap-1 text-green-400"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>No room rent cap</span>
              <span className="flex items-center gap-1 text-green-400"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>Day-1 coverage</span>
              <span className="flex items-center gap-1 text-green-400"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>14K+ hospitals</span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} onClick={() => onResponse('continue')} className="relative z-10 w-full py-3.5 rounded-xl text-label-md font-semibold text-white shadow-lg shadow-purple-900/40" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' }}>
        {t.common.continue}
      </motion.button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main PostPaymentJourney Component
   ═══════════════════════════════════════════════════════ */

export default function PostPaymentJourney({ onDashboard, initialPhase, onTalkToExpert }: { onDashboard: () => void; initialPhase?: string; onTalkToExpert?: () => void }) {
  const t = useT();
  const updateState = useJourneyStore(s => s.updateState);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [voiceCallResolve, setVoiceCallResolve] = useState<((v: any) => void) | null>(null);

  // Determine initial step based on initialPhase
  const getInitialStep = () => {
    if (initialPhase === 'voice_call') return 'pp.voice_call';
    if (initialPhase === 'scenario_select') return 'pp.call_complete';
    return 'pp.welcome';
  };

  // Custom widget renderer for post-payment specific widgets
  const renderCustomWidget = (
    widgetType: string,
    step: ConversationStep,
    script: StepScript,
    onResponse: (response: any) => void,
    state: JourneyState,
  ): React.ReactNode | null => {
    switch (widgetType) {
      case 'voice_call':
        return (
          <div className="space-y-3">
            <div className="bg-white/8 border border-white/15 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-400/30">
                  <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face" alt={t.postPayment.drRiya} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-label-md text-white font-semibold">{t.postPayment.drRiyaFull}</p>
                  <p className="text-body-sm text-purple-300">{t.postPayment.approx20Min}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setShowVoiceCall(true);
                setVoiceCallResolve(() => onResponse);
              }}
              className="w-full py-3.5 bg-white text-[#1C0B47] rounded-xl text-label-lg font-semibold hover:bg-white/90 transition-all"
            >
              {t.postPayment.startCallDrRiya}
            </button>
          </div>
        );

      case 'call_schedule_picker':
        return <SchedulePickerWidget onSubmit={onResponse} />;

      case 'test_schedule_picker':
        return <TestScheduleWidget onSubmit={onResponse} />;

      case 'health_summary_card':
        return <HealthSummaryCard onResponse={onResponse} />;

      case 'premium_update_card':
        return <PremiumUpdateCard onResponse={onResponse} />;

      case 'policy_celebration':
        return <PolicyCelebrationWidget onResponse={onResponse} />;

      default:
        return null;
    }
  };

  // Intercept step responses for navigation
  const handleStepResponse = (stepId: string, response: any): boolean => {
    if (stepId === 'pp.cancelled' && response === 'home') {
      onDashboard();
      return true;
    }
    return false;
  };

  // Handle voice call completion
  const handleVoiceCallComplete = () => {
    setShowVoiceCall(false);
    if (voiceCallResolve) {
      voiceCallResolve('call_complete');
      setVoiceCallResolve(null);
    }
  };

  // Header for the conversational flow
  const header = (
    <div className="border-b border-white/10 px-5 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <AckoLogo variant="white" className="h-5" />
        <span className="text-label-sm text-white/60">{t.postPayment.healthEvaluation}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onTalkToExpert?.()} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="Talk to expert">
          <svg className="w-3.5 h-3.5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
        </button>
        <button onClick={() => updateState({ showAIChat: true })} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="AI help">
          <svg className="w-3.5 h-3.5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'linear-gradient(180deg, #1C0B47 0%, #2A1463 40%, #1C0B47 100%)' }}>
      <ConversationalFlow
        getStep={getPostPaymentStep}
        initialStepId={getInitialStep()}
        renderCustomWidget={renderCustomWidget}
        header={header}
        onStepResponse={handleStepResponse}
      />

      {/* Voice Call Overlay */}
      <AnimatePresence>
        {showVoiceCall && (
          <VoiceCallScreen onComplete={handleVoiceCallComplete} onSkip={handleVoiceCallComplete} />
        )}
      </AnimatePresence>
    </div>
  );
}
