'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useLifeJourneyStore } from '../../lib/life/store';
import { useT } from '../../lib/translations';

/* Life Expert Panel — uses Life store */
export function LifeExpertPanel() {
  const t = useT();
  const { showExpertPanel, updateState } = useLifeJourneyStore();
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null);

  const lifeConcerns = [
    "I'm not sure if I need term insurance",
    "I want to understand what's covered",
    "I need help with the claim process",
    "Something else",
  ];

  return (
    <AnimatePresence>
      {showExpertPanel && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={() => { updateState({ showExpertPanel: false }); setSelectedConcern(null); }}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col shadow-2xl"
            style={{ background: 'var(--app-chat-gradient)' }}
          >
            <div className="bg-gradient-to-r from-purple-700/50 to-purple-900/50 px-6 pt-14 pb-6">
              <button
                onClick={() => { updateState({ showExpertPanel: false }); setSelectedConcern(null); }}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-heading-lg text-white mb-1">Talk to an expert</h2>
              <p className="text-body-sm text-purple-300">Real term life insurance experts who'll guide you through everything.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-label-md text-white font-semibold mb-3 uppercase">What's on your mind?</h3>
              <div className="space-y-2 mb-6">
                {lifeConcerns.map((concern, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedConcern(concern)}
                    className="w-full text-left px-4 py-3 border border-white/15 bg-white/5 rounded-xl text-body-sm text-white/80 hover:border-purple-400/30 hover:bg-white/10 transition-all"
                  >
                    {concern}
                  </button>
                ))}
              </div>

              {/* Expert Profiles Section */}
              <h3 className="text-label-md text-white font-semibold mb-3 uppercase">Our Life Insurance Experts</h3>
              <div className="space-y-3">
                {/* Expert 1 */}
                <div className="bg-white/5 border border-white/15 rounded-xl p-4 hover:bg-white/10 transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm">
                      RK
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold text-sm mb-0.5">Rajesh Kumar</h4>
                      <p className="text-purple-300 text-xs mb-2">Term Life Insurance Specialist</p>
                      <div className="flex items-center gap-3 text-[10px] text-white/50">
                        <span>3,800+ families helped</span>
                        <span>•</span>
                        <span>9+ years in life insurance</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed mb-3">
                    Expert in coverage calculation, income replacement planning, and helping families understand the right protection amount. Specializes in first-time term insurance buyers.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-1 bg-white/10 rounded-md text-[10px] text-white/80">Coverage Planning</span>
                    <span className="px-2 py-1 bg-white/10 rounded-md text-[10px] text-white/80">Income Replacement</span>
                    <span className="px-2 py-1 bg-white/10 rounded-md text-[10px] text-white/80">First-time Buyers</span>
                  </div>
                </div>

                {/* Expert 2 */}
                <div className="bg-white/5 border border-white/15 rounded-xl p-4 hover:bg-white/10 transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm">
                      PS
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold text-sm mb-0.5">Priya Sharma</h4>
                      <p className="text-purple-300 text-xs mb-2">Claims & Nominee Support Advisor</p>
                      <div className="flex items-center gap-3 text-[10px] text-white/50">
                        <span>2,500+ claims guided</span>
                        <span>•</span>
                        <span>7+ years in life claims</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed mb-3">
                    Specialist in claim process for nominees, documentation support, and settlement guidance. Helps families navigate the claim journey during difficult times with care and clarity.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-1 bg-white/10 rounded-md text-[10px] text-white/80">Claims Process</span>
                    <span className="px-2 py-1 bg-white/10 rounded-md text-[10px] text-white/80">Nominee Support</span>
                    <span className="px-2 py-1 bg-white/10 rounded-md text-[10px] text-white/80">Documentation</span>
                  </div>
                </div>

                {/* Expert 3 */}
                <div className="bg-white/5 border border-white/15 rounded-xl p-4 hover:bg-white/10 transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm">
                      AM
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold text-sm mb-0.5">Anil Mehta</h4>
                      <p className="text-purple-300 text-xs mb-2">Financial Planning & Tax Advisor</p>
                      <div className="flex items-center gap-3 text-[10px] text-white/50">
                        <span>4,200+ customers helped</span>
                        <span>•</span>
                        <span>11+ years in financial planning</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed mb-3">
                    Expert in premium affordability, tax benefits under Section 80C & 10(10D), and integrating term insurance with overall financial planning. Helps optimize coverage within your budget.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-1 bg-white/10 rounded-md text-[10px] text-white/80">Tax Benefits</span>
                    <span className="px-2 py-1 bg-white/10 rounded-md text-[10px] text-white/80">Premium Planning</span>
                    <span className="px-2 py-1 bg-white/10 rounded-md text-[10px] text-white/80">Budget Optimization</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* Life AI Chat Panel — uses Life store */
export function LifeAIChatPanel() {
  const t = useT();
  const { showAIChat, updateState } = useLifeJourneyStore();
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; content: string }[]>([]);
  const [input, setInput] = useState('');

  const lifeStarters = [
    'How much coverage do I need?',
    'What\'s the difference between term and other life insurance?',
    'Why should I buy term insurance if I don\'t get returns?',
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: 'Term insurance gives you maximum protection at minimum cost. It\'s designed to replace your income if something happens to you, so your family can maintain their lifestyle. Would you like to know more about coverage amounts or the claims process?',
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
            style={{ background: 'var(--app-chat-gradient)' }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                </div>
                <div>
                  <h3 className="text-heading-sm text-white">ACKO AI Assistant</h3>
                  <p className="text-caption text-white/50">Ask anything about term life insurance</p>
                </div>
              </div>
              <button onClick={() => updateState({ showAIChat: false })} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div>
                  <div className="mb-6">
                    <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
                      <p className="text-body-sm text-white/90">Hi! I'm your ACKO AI assistant. I can help you understand term life insurance, calculate the right coverage, and guide you through the buying process.</p>
                    </div>
                  </div>
                  <p className="text-body-sm text-white/50 mb-3">Based on where you are, you might want to ask:</p>
                  <div className="space-y-2">
                    {lifeStarters.map((s, i) => (
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
                      ? 'bg-purple-700 text-white rounded-br-md shadow-lg shadow-purple-900/10'
                      : 'bg-white/10 backdrop-blur-sm text-white/90 rounded-bl-md border border-white/10'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-white/10" style={{ background: 'var(--app-glass-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend(input)}
                  placeholder="Ask anything about term life insurance..."
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
