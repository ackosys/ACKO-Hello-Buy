'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';

/* ── Umbrella Avatar — Life Insurance identity ── */
function UmbrellaAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg shadow-purple-900/20 flex-shrink-0">
      <svg className="w-4.5 h-4.5" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 2C6.477 2 2 6.477 2 12h4a6 6 0 0 1 12 0h4c0-5.523-4.477-10-10-10Z"
          fill="#7C3AED"
        />
        <path
          d="M12 12v8c0 1.105-.895 2-2 2s-2-.895-2-2"
          stroke="#7C3AED"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line x1="12" y1="2" x2="12" y2="4" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

interface LifeChatMessageProps {
  message: {
    id: string;
    type: 'bot' | 'user' | 'system';
    content: string;
    timestamp: number;
    editable?: boolean;
    stepId?: string;
  };
  onEdit?: (stepId: string) => void;
  animate?: boolean;
}

export default function LifeChatMessage({ message, onEdit, animate = false }: LifeChatMessageProps) {
  const [showEdit, setShowEdit] = useState(false);

  if (message.type === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center my-4"
      >
        <span className="text-label-md text-purple-300/60 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
          {message.content}
        </span>
      </motion.div>
    );
  }

  if (message.type === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.215, 0.61, 0.355, 1] }}
        className="flex justify-end mb-4 group"
        onMouseEnter={() => message.editable && setShowEdit(true)}
        onMouseLeave={() => setShowEdit(false)}
      >
        <div className="relative max-w-[85%]">
          <div className="px-4 py-2.5 chat-bubble-user shadow-lg" style={{ background: 'var(--app-user-bubble-bg, var(--motor-user-bubble-bg, #FFFFFF))', color: 'var(--app-user-bubble-text, var(--motor-user-bubble-text, #1C0B47))' }}>
            <p className="text-body-md font-medium">{message.content}</p>
          </div>
          {message.editable && showEdit && onEdit && message.stepId && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => onEdit(message.stepId!)}
              className="absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/10 border border-white/20 rounded-full flex items-center justify-center shadow-md hover:bg-white/20 transition-colors"
              title="Edit this answer"
            >
              <svg className="w-3 h-3 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }

  // Bot message — glass card on dark with umbrella avatar, word-by-word typewriter
  const wordList = useMemo(() => {
    const result: { text: string; para: number }[] = [];
    message.content.split('\n\n').forEach((para, pi) => {
      para.split(' ').forEach(word => {
        if (word) result.push({ text: word, para: pi });
      });
    });
    return result;
  }, [message.content]);

  const [visibleCount, setVisibleCount] = useState(animate ? 0 : wordList.length);

  useEffect(() => {
    if (!animate || visibleCount >= wordList.length) return;
    const t = setTimeout(() => setVisibleCount(c => c + 1), 55);
    return () => clearTimeout(t);
  }, [animate, visibleCount, wordList.length]);

  useEffect(() => {
    if (!animate) setVisibleCount(wordList.length);
  }, [animate, wordList.length]);

  const paragraphCount = message.content.split('\n\n').length;
  const visibleByPara: string[][] = Array.from({ length: paragraphCount }, () => []);
  wordList.slice(0, visibleCount).forEach(w => visibleByPara[w.para].push(w.text));
  const visibleParagraphs = visibleByPara.filter(p => p.length > 0);
  const isTypingOut = animate && visibleCount < wordList.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.215, 0.61, 0.355, 1] }}
      className="flex mb-4"
    >
      <div className="max-w-[85%]">
        <div className="backdrop-blur-sm px-4 py-3 chat-bubble-bot" style={{ background: 'var(--app-surface, var(--motor-surface))', border: '1px solid var(--app-border, var(--motor-border))' }}>
          {visibleParagraphs.map((words, i) => (
            <p key={i} className={`text-body-md text-white/90 ${i > 0 ? 'mt-2' : ''}`} style={{ color: 'var(--app-bot-text, var(--motor-bot-text))' }}>
              {words.join(' ')}
              {isTypingOut && i === visibleParagraphs.length - 1 && (
                <span className="inline-block w-[2px] h-[1em] align-middle ml-[2px] rounded-full bg-purple-400 animate-pulse" />
              )}
            </p>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Typing Indicator with Umbrella ── */
export function LifeTypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex mb-4"
    >
      <div className="backdrop-blur-sm px-4 py-3 chat-bubble-bot flex items-center gap-1.5" style={{ background: 'var(--app-surface, var(--motor-surface))', border: '1px solid var(--app-border, var(--motor-border))' }}>
        <span className="w-2 h-2 bg-purple-400 rounded-full animate-typing" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-purple-400 rounded-full animate-typing" style={{ animationDelay: '200ms' }} />
        <span className="w-2 h-2 bg-purple-400 rounded-full animate-typing" style={{ animationDelay: '400ms' }} />
      </div>
    </motion.div>
  );
}
