'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { useJourneyStore } from '../lib/store';
import { Module } from '../lib/types';
import { useT, type TranslationSet } from '../lib/translations';

/* ═══════════════════════════════════════════════════════
   Expert Panel — Dynamic questions based on journey position
   ═══════════════════════════════════════════════════════ */

interface Expert {
  name: string;
  role: string;
  experience: string;
  helped: string;
  description: string;
  speciality: string[];
  initials: string;
  color: string;
  img: string;
}

function getExperts(t: TranslationSet): Expert[] {
  const p = t.panels;
  return [
    {
      name: 'Sanjana Saha',
      role: p.expertRole1,
      experience: p.expertExp1,
      helped: p.expertHelped1,
      description: p.expertDesc1,
      speciality: [p.expertSpec1a, p.expertSpec1b, p.expertSpec1c],
      initials: 'SS',
      color: 'bg-purple-500',
      img: 'https://i.pravatar.cc/120?img=47',
    },
    {
      name: 'Priya Saxena',
      role: p.expertRole2,
      experience: p.expertExp2,
      helped: p.expertHelped2,
      description: p.expertDesc2,
      speciality: [p.expertSpec2a, p.expertSpec2b, p.expertSpec2c],
      initials: 'PS',
      color: 'bg-blue-500',
      img: 'https://i.pravatar.cc/120?img=45',
    },
    {
      name: 'Yash Kumar',
      role: p.expertRole3,
      experience: p.expertExp3,
      helped: p.expertHelped3,
      description: p.expertDesc3,
      speciality: [p.expertSpec3a, p.expertSpec3b, p.expertSpec3c],
      initials: 'YK',
      color: 'bg-teal-500',
      img: 'https://i.pravatar.cc/120?img=68',
    },
    {
      name: 'Rohit Mehta',
      role: p.expertRole4,
      experience: p.expertExp4,
      helped: p.expertHelped4,
      description: p.expertDesc4,
      speciality: [p.expertSpec4a, p.expertSpec4b, p.expertSpec4c],
      initials: 'RM',
      color: 'bg-orange-500',
      img: 'https://i.pravatar.cc/120?img=53',
    },
    {
      name: 'Ananya Patel',
      role: p.expertRole5,
      experience: p.expertExp5,
      helped: p.expertHelped5,
      description: p.expertDesc5,
      speciality: [p.expertSpec5a, p.expertSpec5b, p.expertSpec5c],
      initials: 'AP',
      color: 'bg-pink-500',
      img: 'https://i.pravatar.cc/120?img=44',
    },
  ];
}

/* Dynamic concerns based on current module */
function getConcernsForModule(module: Module, t: TranslationSet): string[] {
  const p = t.panels;
  switch (module) {
    case 'entry':
    case 'intent':
      return [p.concernNotSure, p.concernWhatCovers, p.concernHowDifferent, p.concernQuickOverview];
    case 'family':
      return [p.concernAddLater, p.concernCoverParentsSep, p.concernSpouseEmployer, p.concernAgePremium];
    case 'gap_analysis':
      return [p.concernEmployerEnough, p.concernRoomRentCapping, p.concernAckoCovers, p.concernConsumables];
    case 'coverage':
      return [p.concernGmcNotEnough, p.concernCorporateGaps, p.concernTopUpOrFresh, p.concernSwitchBenefits];
    case 'health':
      return [p.concernPreExistingPremium, p.concernWaitingPeriod, p.concernFamilyOnePlan, p.concernNewCondition];
    case 'customization':
      return [p.concernHowMuchCoverage, p.concernIs10LEnough, p.concernSumInsuredMeaning, p.concernDecideBetween];
    case 'recommendation':
      return [p.concernPlatinumDiff, p.concernGmcWhichPlan, p.concernUpgradeLater, p.concernRestoreMeaning];
    case 'review':
    case 'payment':
      return [p.concernPaymentSecure, p.concernRefund, p.concernCoverageStart, p.concernAfterPay];
    case 'health_eval':
      return [p.concernHealthEval, p.concernTestHurt, p.concernTestAtHome, p.concernHowLongActive];
    case 'post_payment':
      return [p.concernEvalTime, p.concernDoctorCall, p.concernReschedule, p.concernMemberRejected];
    case 'dashboard':
      return [p.concernHowRaiseClaim, p.concernWhatCovered, p.concernAddNewMember, p.concernCoverageWhen];
    case 'claims':
      return [p.concernClaimDocs, p.concernClaimTime, p.concernCashlessVsReimb, p.concernOutpatient];
    case 'edit_policy':
      return [p.concernChangeSIMidTerm, p.concernRemoveMember, p.concernChangeWaiting, p.concernPremiumImpact];
    default:
      return [p.concernNotSureWhichPlan, p.concernUnderstandCovered, p.concernClaimProcess, p.concernSomethingElse];
  }
}

export function ExpertPanel() {
  const t = useT();
  const { showExpertPanel, updateState, resolvedPersona, currentModule } = useJourneyStore();
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);

  const experts = useMemo(() => getExperts(t), [t]);
  const getRelevantExperts = () => {
    switch (resolvedPersona) {
      case 'anxious_senior': return [experts[2], experts[0], experts[1]];
      case 'caring_child': return [experts[2], experts[1], experts[0]];
      case 'gap_filler': return [experts[3], experts[0], experts[1]];
      case 'switcher': return [experts[4], experts[3], experts[0]];
      default: return [experts[0], experts[1], experts[2]];
    }
  };

  const relevantExperts = getRelevantExperts();
  const dynamicConcerns = useMemo(() => getConcernsForModule(currentModule, t), [currentModule, t]);

  return (
    <AnimatePresence>
      {showExpertPanel && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={() => { updateState({ showExpertPanel: false }); setSelectedExpert(null); setShowBooking(false); }}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col shadow-2xl"
            style={{ background: 'linear-gradient(180deg, #1C0B47 0%, #2A1463 50%, #1C0B47 100%)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-700/50 to-purple-900/50 px-6 pt-14 pb-6">
              <button
                onClick={() => { updateState({ showExpertPanel: false }); setSelectedExpert(null); setShowBooking(false); }}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-heading-lg text-white mb-1">{t.panels.talkToExpert}</h2>
              <p className="text-body-sm text-purple-300">{t.panels.expertIntro}</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!selectedExpert && !showBooking && (
                <div className="p-6">
                  {/* Dynamic concerns based on journey position */}
                  <h3 className="text-label-md text-white font-semibold mb-3">{t.panels.whatsOnMind}</h3>
                  <div className="space-y-2 mb-8">
                    {dynamicConcerns.map((concern, i) => (
                      <button
                        key={i}
                        onClick={() => { setSelectedConcern(concern); setShowBooking(true); }}
                        className="w-full text-left px-4 py-3 border border-white/15 bg-white/5 rounded-xl text-body-sm text-white/80 hover:border-purple-400/30 hover:bg-white/10 transition-all"
                      >
                        {concern}
                      </button>
                    ))}
                  </div>

                  {/* Expert profiles */}
                  <h3 className="text-label-md text-white font-semibold mb-3">{t.panels.ourExperts}</h3>
                  <div className="space-y-3">
                    {relevantExperts.map((expert, i) => (
                      <motion.div
                        key={expert.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="border border-white/10 bg-white/5 rounded-xl p-4 hover:border-purple-400/30 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => { setSelectedExpert(expert); setShowBooking(true); }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <img src={expert.img} alt={expert.name} className="w-10 h-10 rounded-full object-cover border-2 border-white/15" />
                          <div>
                            <p className="text-body-sm text-white font-medium">{expert.name}</p>
                            <p className="text-caption text-white/50">{expert.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2 text-caption text-white/40">
                          <span>{expert.helped}</span>
                          <span className="w-1 h-1 bg-white/30 rounded-full" />
                          <span>{expert.experience}</span>
                        </div>
                        <p className="text-body-sm text-white/60">{expert.description}</p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {expert.speciality.map((s, j) => (
                            <span key={j} className="text-caption bg-white/10 text-white/50 px-2 py-0.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Promise */}
                  <div className="mt-8 space-y-3">
                    <h3 className="text-label-md text-white font-semibold">{t.panels.everyStep}</h3>
                    {[
                      { icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z', title: t.panels.needPlanGuidance, desc: t.panels.needPlanGuidanceDesc },
                      { icon: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z', title: t.panels.needToClaim, desc: t.panels.needToClaimDesc },
                      { icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z', title: t.panels.haveQuestion, desc: t.panels.haveQuestionDesc },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                        <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                        </svg>
                        <div>
                          <p className="text-body-sm text-white font-medium">{item.title}</p>
                          <p className="text-caption text-white/50">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Booking flow */}
              {showBooking && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6"
                >
                  <button
                    onClick={() => { setShowBooking(false); setSelectedExpert(null); }}
                    className="flex items-center gap-1 text-body-sm text-purple-300 mb-6"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {t.panels.backToExperts}
                  </button>

                  {selectedExpert && (
                    <div className="flex items-center gap-3 mb-5 p-4 bg-purple-500/10 rounded-xl border border-purple-400/20">
                      <img src={selectedExpert.img} alt={selectedExpert.name} className="w-12 h-12 rounded-full object-cover border-2 border-white/15" />
                      <div>
                        <p className="text-body-md text-white font-medium">{selectedExpert.name}</p>
                        <p className="text-body-sm text-white/50">{selectedExpert.role}</p>
                      </div>
                    </div>
                  )}

                  <h3 className="text-heading-sm text-white mb-4">{t.panels.bookCall}</h3>
                  <p className="text-body-sm text-white/60 mb-6">
                    {selectedConcern ? `${t.panels.yourQuestion} "${selectedConcern}"` : 'An expert will call you at your preferred time.'}
                  </p>

                  <div className="space-y-4">
                    <input
                      type="tel"
                      placeholder={t.panels.yourPhone}
                      className="w-full px-4 py-3 border border-white/15 bg-white/5 rounded-xl text-body-md text-white placeholder:text-white/30 focus:border-purple-400 focus:outline-none"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      {[t.panels.in15Min, t.panels.in1Hour, t.panels.tomorrow].map((time, i) => (
                        <button
                          key={i}
                          className="px-3 py-2.5 border border-white/15 bg-white/5 rounded-xl text-label-md text-white/80 hover:border-purple-400/30 hover:bg-white/10 transition-all text-center"
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                    <button className="w-full py-3.5 bg-purple-600 text-white rounded-xl text-label-lg font-semibold hover:bg-purple-500 transition-colors">
                      {t.panels.requestCallback}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════
   AI Chat Panel — Dynamic starters based on journey position
   ═══════════════════════════════════════════════════════ */

function getAIStartersForModule(module: Module, t: TranslationSet): string[] {
  const p = t.panels;
  switch (module) {
    case 'entry':
    case 'intent':
      return [p.aiWhatCovers, p.aiHowDifferent, p.aiNeedIfYoung, p.aiMinCoverage];
    case 'family':
      return [p.aiFamilyFloater, p.aiAddLater, p.aiAgeAffect, p.aiCoverParentsSep];
    case 'gap_analysis':
      return [p.aiCommonGaps, p.aiReadPolicy, p.aiSwitchComplicated, p.aiEffectiveCover];
    case 'coverage':
      return [p.aiDentalCovered, p.aiPreExistingCov, p.aiMaternityCov, p.aiWaitingPeriodCov];
    case 'health':
      return [p.aiPreExistingCovered, p.aiWaitingPeriod, p.aiDiabetesPremium, p.aiNonDisclosure];
    case 'customization':
    case 'recommendation':
      return [p.aiPlanDifference, p.aiRestoreMeaning, p.aiWhyPlatinumExpensive, p.aiSuperTopupBetter];
    case 'review':
    case 'payment':
      return [p.aiPaymentSecure, p.aiCoverageStart, p.aiCanCancel, p.aiRefundPolicy];
    case 'health_eval':
      return [p.aiHealthEvalWhat, p.aiTestAtHome, p.aiTestReveals, p.aiHowLongActive];
    case 'post_payment':
      return [p.aiAfterPayment, p.aiWhyDoctorCall, p.aiHowLongIssued, p.aiPreExistingWhat];
    case 'doctor_call':
      return [p.aiDoctorQuestions, p.aiRescheduleCall, p.aiCallConfidential, p.aiDoctorFinds];
    case 'medical_tests':
      return [p.aiWhatTestsDone, p.aiTestAtHomeMed, p.aiHowLongResults, p.aiAbnormalResults];
    case 'dashboard':
      return [p.aiDashRaiseClaim, p.aiDashWhatCovered, p.aiDashAddMember, p.aiDashWherePolicy];
    case 'claims':
      return [p.aiClaimDocs, p.aiClaimTime, p.aiCashlessVsReimb, p.aiClaimAnyHospital];
    case 'edit_policy':
      return [p.aiChangeSI, p.aiAddNewMember, p.aiPremiumChange, p.aiRemoveMember];
    default:
      return [p.aiDefaultSumInsured, p.aiDefaultPreExisting, p.aiDefaultCashless, p.aiDefaultPlanDiff];
  }
}

export function AIChatPanel() {
  const t = useT();
  const { showAIChat, updateState, currentModule } = useJourneyStore();
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; content: string }[]>([]);
  const [input, setInput] = useState('');

  const starters = useMemo(() => getAIStartersForModule(currentModule, t), [currentModule, t]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: getAIResponse(text),
      }]);
    }, 1200);
  };

  return (
    <AnimatePresence>
      {showAIChat && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={() => updateState({ showAIChat: false })}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col shadow-2xl"
            style={{ background: 'linear-gradient(180deg, #1C0B47 0%, #2A1463 50%, #1C0B47 100%)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>
                </div>
                <div>
                  <h3 className="text-heading-sm text-white">{t.panels.aiAssistant}</h3>
                  <p className="text-caption text-white/50">{t.panels.askAnything}</p>
                </div>
              </div>
              <button onClick={() => updateState({ showAIChat: false })} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div>
                  {/* AI greeting */}
                  <div className="mb-6">
                    <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
                      <p className="text-body-sm text-white/90">{t.panels.aiIntro}</p>
                    </div>
                  </div>

                  <p className="text-body-sm text-white/50 mb-3 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                    {t.panels.basedOnWhere}
                  </p>
                  <div className="space-y-2">
                    {starters.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(s)}
                        className="w-full text-left px-4 py-3 border border-white/15 bg-white/5 hover:bg-white/10 rounded-xl text-body-sm text-white/80 hover:text-white transition-all backdrop-blur-sm"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-body-sm ${
                    msg.role === 'user'
                      ? 'bg-white text-[#1C0B47] rounded-br-md shadow-lg shadow-purple-900/10'
                      : 'bg-white/10 backdrop-blur-sm text-white/90 rounded-bl-md border border-white/10'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Brand ambassador nudge */}
            <div className="px-6 pb-2">
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <img src="/brand-ambassador.png" alt="ACKO" className="w-7 h-7 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <p className="text-[11px] text-white/50 flex-1">{t.panels.needHumanHelp}</p>
                <button onClick={() => { updateState({ showAIChat: false, showExpertPanel: true }); }} className="text-[11px] text-purple-300 font-semibold hover:text-white transition-colors">{t.panels.connect}</button>
              </div>
            </div>

            {/* Input */}
            <div className="px-6 py-4 border-t border-white/10" style={{ background: 'rgba(30, 15, 70, 0.85)', backdropFilter: 'blur(24px)' }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend(input)}
                  placeholder={t.panels.askPlaceholder}
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/15 rounded-xl text-body-sm text-white placeholder:text-white/30 focus:border-purple-400 focus:outline-none"
                />
                <button
                  onClick={() => handleSend(input)}
                  className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Knowledge-based AI responses ── */
function getAIResponse(question: string): string {
  const q = question.toLowerCase();

  // Sum Insured
  if (q.includes('sum insured') || q.includes('coverage amount') || q.includes('how much coverage')) {
    return 'Sum Insured is the maximum amount your insurer pays for treatment in a policy year. Here\'s a quick guide:\n\n• Single person under 35: ₹5-10 lakhs is usually sufficient\n• Couple/small family under 45: ₹10-25 lakhs recommended\n• Family with seniors (45+): ₹25-50 lakhs ideal\n\nWhy? A cardiac bypass in Mumbai costs ₹8-12 lakhs. Cancer treatment can run ₹15-30 lakhs. With ACKO\'s Restore benefit, your full SI is refilled after a claim — so a ₹10L plan effectively gives you ₹20L protection in a year.';
  }

  // Pre-existing conditions
  if (q.includes('pre-existing') || q.includes('existing condition') || q.includes('diabetes') || q.includes('bp') || q.includes('blood pressure') || q.includes('thyroid')) {
    return 'Pre-existing conditions like diabetes, hypertension, and thyroid are absolutely covered — after a waiting period:\n\n• Standard policies: 3-4 years waiting\n• ACKO Platinum: 3 years, but zero waiting for specific illnesses from day 1\n• ACKO Platinum Lite: 3 years standard\n\nImportant: Over 40% of ACKO policyholders have pre-existing conditions. It does NOT increase your premium — pricing is age-based. But always declare conditions honestly — non-disclosure can lead to claim rejection.\n\nPro tip: Buy early. If you buy at 30, the 3-year waiting ends at 33 — well before most conditions worsen.';
  }

  // Cashless claims
  if (q.includes('cashless') || q.includes('claim process') || q.includes('how do claims work')) {
    return 'Here\'s how cashless claims work at ACKO:\n\n1. Visit any of our 14,000+ network hospitals\n2. Show your ACKO digital health card at admission\n3. The hospital sends a pre-auth request to us\n4. We approve it (95% are approved within 1 hour)\n5. Get treated — we settle the bill directly with the hospital\n6. You walk out without paying anything\n\nFor emergencies: You can go to any hospital. If it\'s not in-network, submit reimbursement — we process it within 3-5 working days.\n\nReal stat: Our average cashless approval time is under 60 minutes, and 95% of claims are approved within a day.';
  }

  // Plan differences
  if ((q.includes('difference') && q.includes('plan')) || q.includes('platinum vs') || q.includes('which plan') || q.includes('compare plan')) {
    return 'Here\'s the honest comparison:\n\n**Platinum (Best overall)**\n• Zero waiting on specific illnesses\n• No room rent limit, consumables covered\n• Restore SI (100%), inflation protect (10% annual increase)\n• Best for: Families wanting complete protection\n\n**Platinum Lite (Best value)**\n• Standard 3-year waiting for pre-existing\n• No room rent limit, consumables covered\n• Restore SI (100%)\n• Best for: Healthy families who want solid coverage at lower cost\n\n**Super Top-up (Best for GMC holders)**\n• Kicks in after your base cover (deductible) is exhausted\n• Much cheaper than standalone plans\n• Best for: People with employer insurance who want to fill gaps\n\nIf you have a GMC, Super Top-up is often the smartest buy — you avoid paying for duplicate base coverage.';
  }

  // GMC / Employer insurance
  if (q.includes('gmc') || q.includes('employer') || q.includes('corporate') || q.includes('company insurance') || q.includes('job')) {
    return 'Employer insurance (GMC) is valuable but has real limitations:\n\n**What GMC typically covers:**\n• Hospitalisation expenses up to sum insured (usually ₹3-5L)\n• Basic pre/post hospitalisation\n\n**Where it falls short:**\n• Room rent capped at ₹5,000-8,000/day (private rooms cost ₹15-25K)\n• Consumables excluded (₹15,000-50,000 per surgery from your pocket)\n• Stops the day you resign, are laid off, or retire\n• No portability — you can\'t carry it to a new employer\n• Sub-limits on ICU, specific treatments\n\n**What to do:** Keep your GMC as base cover + add ACKO Super Top-up or Platinum Lite. This way, GMC handles smaller claims, and ACKO covers the expensive ones your GMC can\'t.';
  }

  // Age & premium
  if (q.includes('age') && (q.includes('premium') || q.includes('affect') || q.includes('cost'))) {
    return 'Age is the #1 factor in health insurance pricing. Here\'s why:\n\n**Typical premium ranges (individual, ₹10L SI):**\n• 18-25 years: ₹5,000-8,000/year\n• 26-35 years: ₹8,000-12,000/year\n• 36-45 years: ₹12,000-20,000/year\n• 46-55 years: ₹20,000-35,000/year\n• 55+ years: ₹35,000-60,000/year\n\nPremiums jump significantly at 45 and 55 because hospitalisation probability doubles every decade after 40.\n\n**Smart move:** Buy when you\'re young. A 28-year-old buying today locks in lower base premiums AND the 3-year pre-existing waiting period ends by 31 — well before most conditions develop.';
  }

  // Restore benefit
  if (q.includes('restore') || q.includes('refill')) {
    return 'Restore Sum Insured is one of ACKO\'s strongest features. Here\'s how it works:\n\n**Example:**\nYou have ₹10L coverage. Your father gets hospitalised for ₹7L. After this claim, only ₹3L remains.\n\nWith Restore: The full ₹10L is immediately restored. So if your spouse needs surgery next month, the full ₹10L is available again.\n\nWithout Restore (most policies): Only ₹3L remains for the rest of the year.\n\n**Why it matters for families:** With a family floater, one major claim can exhaust coverage for everyone. Restore ensures every family member has full protection all year.\n\nACKO offers 100% restore on both Platinum and Platinum Lite plans.';
  }

  // Cancellation & refund
  if (q.includes('cancel') || q.includes('refund') || q.includes('money back')) {
    return 'ACKO has a transparent cancellation policy:\n\n**Within 30 days (Free Look Period):**\n• Full refund, no questions asked\n• Only deduction: stamp duty (₹50-100) and proportionate risk charges for days covered\n\n**After 30 days:**\n• Pro-rated refund based on remaining policy period\n• Standard industry terms apply\n\n**After health evaluation:**\n• If our medical evaluation reveals something unexpected and you\'re not happy with the terms, you get a complete refund\n\nThe 30-day free look period is mandated by IRDAI, so there\'s zero risk in trying. You can explore the policy, check the claim process, even visit a network hospital — and still cancel for free.';
  }

  // Health evaluation / medical test
  if (q.includes('health evaluation') || q.includes('medical test') || q.includes('health check')) {
    return 'Health evaluation depends on your profile:\n\n**Online questionnaire only (most common):**\n• For ages 18-45 with no pre-existing conditions\n• Takes 5 minutes, done instantly\n• Available on Platinum Lite\n\n**Tele-medical (phone + home test):**\n• For ages 45+ or Platinum plan holders\n• 30-min doctor call + basic blood test at home\n• Free — ACKO covers all costs\n• Reports within 24-48 hours\n\n**Lab visit required:**\n• For heart conditions, cancer history, or severe conditions\n• ECG, blood tests, specific diagnostics\n• We partner with labs like Metropolis, SRL, Thyrocare\n• You choose date, time, and preferred lab\n\nAll evaluation costs are covered by ACKO. If the results affect your coverage terms and you\'re not happy, you get a full refund.';
  }

  // Waiting period
  if (q.includes('waiting period') || q.includes('when does coverage start') || q.includes('when am i covered')) {
    return 'There are different types of waiting periods:\n\n**Day 1 coverage:**\n• Accidents — covered from the very first day\n• ACKO Platinum: Specific illnesses have zero waiting period\n\n**30-day waiting:**\n• General illnesses (fever, infections, etc.) — standard across industry\n\n**2-year waiting:**\n• Specific diseases listed in the policy (hernia, cataract, etc.)\n• ACKO Platinum reduces or eliminates many of these\n\n**3-year waiting (ACKO) / 4-year (most others):**\n• Pre-existing conditions (diabetes, hypertension, etc.)\n• If you switch from another insurer, your already-served waiting period carries over\n\n**Pro tip:** When switching to ACKO, bring your previous policy\'s portability certificate — your waiting period credits transfer automatically.';
  }

  // Switching insurer
  if (q.includes('switch') || q.includes('port') || q.includes('change insurer') || q.includes('move to acko')) {
    return 'Switching to ACKO is straightforward and you don\'t lose what you\'ve already earned:\n\n**What carries over:**\n• Waiting period already served (e.g., if you\'ve completed 2 of 4 years, only 1 year left with ACKO)\n• No-claim bonus percentage\n• Continuous coverage status\n\n**How to switch:**\n1. Apply through ACKO at least 45 days before your current policy renewal\n2. We handle the portability paperwork\n3. Your new ACKO policy starts from your current policy\'s expiry date\n4. No gap in coverage\n\n**What you might gain:**\n• Better features (no room rent limit, consumables covered)\n• Lower premiums (ACKO is direct, no agent commission)\n• Faster claims (digital-first process)\n\nThe only thing to ensure: apply before your current policy expires. We can\'t port an already-expired policy.';
  }

  // Consumables
  if (q.includes('consumable') || q.includes('syringe') || q.includes('ppe') || q.includes('glove')) {
    return 'Consumables are the hidden cost that catches most people off guard.\n\n**What are consumables?**\nSingle-use medical items: syringes, gloves, PPE kits, surgical meshes, catheters, bandages, gauze, implants, etc.\n\n**Why they matter:**\n• A typical surgery uses ₹15,000-50,000 worth of consumables\n• Major surgeries can go up to ₹1-2 lakhs in consumables alone\n• Most traditional policies EXCLUDE these — you pay from your pocket\n\n**ACKO difference:**\n• Both Platinum and Platinum Lite cover 100% of consumables\n• This alone can save you ₹50,000+ per hospitalisation\n\nThis is one of the biggest reasons claims get "deductions" — the insurance pays the hospital, but consumables come out of your pocket. With ACKO, that doesn\'t happen.';
  }

  // Room rent
  if (q.includes('room rent') || q.includes('room limit') || q.includes('hospital room')) {
    return 'Room rent limits are one of the sneakiest clauses in health insurance:\n\n**How it works:**\nIf your policy caps room rent at ₹5,000/day but you stay in a ₹15,000/day room, the insurer doesn\'t just deduct the room difference — they proportionally reduce the ENTIRE bill.\n\n**Example on a ₹10L surgery bill:**\n• Room rent cap: ₹5,000/day, actual: ₹15,000/day (3x)\n• Insurer reduces entire bill proportionally: pays only 33%\n• You pay: ₹6.7L out of ₹10L\n\n**ACKO\'s approach:**\n• Zero room rent limit on all plans (Platinum, Platinum Lite, Super Top-up)\n• You can choose any room — single, deluxe, suite — with no impact on your claim\n\nThis single feature can save you lakhs. Always check if your current policy has this clause — most do.';
  }

  // Inflation protect
  if (q.includes('inflation') || q.includes('10%') || q.includes('increase')) {
    return 'ACKO\'s Inflation Protect automatically increases your sum insured by 10% every year — without increasing your premium.\n\n**How it works:**\n• Year 1: ₹10L coverage\n• Year 2: ₹11L coverage (automatic)\n• Year 3: ₹12.1L coverage\n• Year 5: ₹14.6L coverage\n• Year 10: ₹23.6L coverage\n\n**Why it matters:**\nHealthcare costs in India rise 10-15% annually. A ₹10L policy today might feel adequate, but in 10 years, the same surgery could cost ₹25L. Inflation protect ensures your coverage keeps pace.\n\nThis feature is available on ACKO Platinum. Whether you make a claim or not, your SI grows automatically.';
  }

  // Family floater
  if (q.includes('family floater') || q.includes('individual plan') || q.includes('separate plan') || q.includes('family plan')) {
    return 'Here\'s the decision framework:\n\n**Family Floater (shared pool):**\n• One sum insured shared by all members\n• Cheaper than individual plans combined\n• Best for: Young families (all under 45) with 2-4 members\n• Risk: One big claim can exhaust cover for everyone (mitigated by ACKO\'s Restore benefit)\n\n**Individual Plans (separate pools):**\n• Each member has their own sum insured\n• More expensive but more protection\n• Best for: If one member is high-risk (senior parent, chronic condition)\n\n**ACKO recommendation:**\n• Self + Spouse + Kids → Family floater with Restore benefit\n• Parents (45+) → Separate plan for parents\n• Mix: Keep young family on floater, parents on their own plan\n\nThe key insight: ACKO\'s 100% Restore benefit makes family floaters much safer — even if one claim exhausts the SI, it refills for the next person.';
  }

  // General / default
  if (q.includes('need health insurance') || q.includes('why') || q.includes('really need') || q.includes('young and healthy')) {
    return 'Here\'s the honest answer on why health insurance matters — even if you\'re young and healthy:\n\n**The math:**\n• 70% of healthcare in India is paid out of pocket\n• Average hospitalisation cost in a metro city: ₹2-5 lakhs\n• A major surgery: ₹10-20 lakhs\n• Cancer treatment: ₹15-40 lakhs\n\n**The timing argument:**\n• Buy at 28: Premium ~₹8K/year, waiting period ends at 31\n• Buy at 40 (when you "need" it): Premium ~₹18K/year, waiting period ends at 43-44\n• Buy after a diagnosis: Rejected or loaded premium + 4-year waiting\n\n**ACKO\'s value:**\n• Plans from ₹436/month — less than a Netflix subscription\n• 99.9% claims settled\n• 14,000+ cashless hospitals\n\nThe best time to buy health insurance was yesterday. The second best time is today — before age or a condition makes it expensive or complicated.';
  }

  // Secure payment
  if (q.includes('secure') || q.includes('safe') || q.includes('payment')) {
    return 'Your payment with ACKO is completely secure:\n\n• PCI-DSS compliant payment gateway\n• 256-bit SSL encryption\n• RBI-regulated payment partners (Razorpay, Paytm, etc.)\n• We don\'t store your card details\n\nPayment options: UPI, credit/debit card, net banking, wallets. Monthly EMI options available on all plans.\n\nACKO is licensed by IRDAI (Insurance Regulatory and Development Authority of India) — registration number 157. We\'re backed by investors including Amazon, Accel Partners, and Multiples PE.';
  }

  return 'Great question! Here\'s what you should know: ACKO is a fully digital health insurer licensed by IRDAI (Reg. No. 157). We cover everything from minor day-care procedures to major surgeries across 14,000+ hospitals. Our plans start from ₹436/month with features like zero room rent limit, 100% consumables coverage, and restore benefit.\n\nThe right plan depends on your family size, ages, existing coverage, and health profile. Would you like me to explain any specific feature in detail?';
}

