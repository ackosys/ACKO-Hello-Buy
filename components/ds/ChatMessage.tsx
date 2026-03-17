'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useMemo, ReactNode, CSSProperties } from 'react';

export interface ChatMessageData {
  id: string;
  type: 'bot' | 'user' | 'system';
  content: string;
  timestamp: number;
  editable?: boolean;
  stepId?: string;
}

export interface ChatBubbleTheme {
  systemBg?: string;
  systemBorder?: string;
  systemText?: string;
  userBubbleBg?: string;
  userBubbleText?: string;
  userBubbleStyle?: CSSProperties;
  userBubbleClass?: string;
  botBubbleBg?: string;
  botBubbleBorder?: string;
  botText?: string;
  botBubbleStyle?: CSSProperties;
  botBubbleClass?: string;
  editBtnBg?: string;
  editBtnBorder?: string;
  editIconColor?: string;
  cursorColor?: string;
  typingDotColor?: string;
}

const DEFAULT_THEME: ChatBubbleTheme = {
  systemBg: 'var(--motor-surface)',
  systemBorder: 'var(--motor-border)',
  systemText: 'var(--motor-text-muted)',
  userBubbleBg: 'var(--app-user-bubble-bg, var(--motor-user-bubble-bg, #FFFFFF))',
  userBubbleText: 'var(--app-user-bubble-text, var(--motor-user-bubble-text, #1C0B47))',
  userBubbleClass: 'chat-bubble-user shadow-lg',
  botBubbleBg: 'var(--app-surface, var(--motor-surface))',
  botBubbleBorder: 'var(--app-border, var(--motor-border))',
  botText: 'var(--app-bot-text, var(--motor-bot-text))',
  botBubbleClass: 'chat-bubble-bot',
  editBtnBg: 'var(--app-surface, var(--motor-surface))',
  editBtnBorder: 'var(--app-border-strong, var(--motor-border-strong))',
  editIconColor: 'var(--color-primary-active, #BDB8FA)',
  cursorColor: 'var(--color-primary, #7A62F0)',
  typingDotColor: 'var(--color-primary, #7A62F0)',
};

export interface BaseChatMessageProps {
  message: ChatMessageData;
  onEdit?: (stepId: string) => void;
  onPlanInfo?: (stepId: string) => void;
  animate?: boolean;
  theme?: ChatBubbleTheme;
  avatar?: ReactNode;
}

export default function ChatMessage({ message, onEdit, onPlanInfo, animate = false, theme: themeOverrides, avatar }: BaseChatMessageProps) {
  const [showEdit, setShowEdit] = useState(false);
  const t = { ...DEFAULT_THEME, ...themeOverrides };

  const isPlanStep = message.stepId === 'quote.plan_selection' || message.stepId === 'help.recommendation';

  if (message.type === 'system') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center my-4">
        <span className="text-[12px] font-medium px-4 py-1.5 rounded-full" style={{ color: t.systemText, background: t.systemBg, border: `1px solid ${t.systemBorder}` }}>
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
          <div
            className={`px-4 py-2.5 ${t.userBubbleClass || ''}`}
            style={{ background: t.userBubbleBg, color: t.userBubbleText, ...t.userBubbleStyle }}
          >
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-medium flex-1">{message.content}</p>
              {isPlanStep && onPlanInfo && message.stepId && (
                <button
                  onClick={(e) => { e.stopPropagation(); onPlanInfo(message.stepId!); }}
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-opacity opacity-60 hover:opacity-100"
                  title="View plan details"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <path strokeLinecap="round" d="M12 16v-4m0-4h.01" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {message.editable && showEdit && onEdit && message.stepId && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => onEdit(message.stepId!)}
              className="absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-colors"
              style={{ background: t.editBtnBg, border: `1px solid ${t.editBtnBorder}` }}
              title="Edit this answer"
            >
              <svg className="w-3 h-3" style={{ color: t.editIconColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }

  if (!message.content || !message.content.trim()) return null;

  return <BotMessage message={message} animate={animate} theme={t} avatar={avatar} />;
}

function BotMessage({ message, animate, theme: t, avatar }: { message: ChatMessageData; animate: boolean; theme: ChatBubbleTheme; avatar?: ReactNode }) {
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
    const timer = setTimeout(() => setVisibleCount(c => c + 1), 55);
    return () => clearTimeout(timer);
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
      {avatar && <div className="mr-2 flex-shrink-0 mt-1">{avatar}</div>}
      <div className="max-w-[85%]">
        <div
          className={`backdrop-blur-sm px-4 py-3 ${t.botBubbleClass || ''}`}
          style={{ background: t.botBubbleBg, border: `1px solid ${t.botBubbleBorder}`, ...t.botBubbleStyle }}
        >
          {visibleParagraphs.map((words, i) => (
            <p key={i} className={`text-[15px] leading-relaxed ${i > 0 ? 'mt-2' : ''}`} style={{ color: t.botText }}>
              {words.join(' ')}
              {isTypingOut && i === visibleParagraphs.length - 1 && (
                <span className="inline-block w-[2px] h-[1em] align-middle ml-[2px] rounded-full animate-pulse" style={{ backgroundColor: t.cursorColor }} />
              )}
            </p>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export interface TypingIndicatorProps {
  theme?: ChatBubbleTheme;
  avatar?: ReactNode;
}

export function TypingIndicator({ theme: themeOverrides, avatar }: TypingIndicatorProps) {
  const t = { ...DEFAULT_THEME, ...themeOverrides };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex mb-4"
    >
      {avatar && <div className="mr-2 flex-shrink-0 mt-1">{avatar}</div>}
      <div
        className={`flex items-center gap-1.5 ${t.botBubbleClass || ''}`}
        style={{ background: t.botBubbleBg, border: `1px solid ${t.botBubbleBorder}`, padding: '12px 16px', ...t.botBubbleStyle }}
      >
        <span className="w-2 h-2 rounded-full animate-typing" style={{ backgroundColor: t.typingDotColor, animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full animate-typing" style={{ backgroundColor: t.typingDotColor, animationDelay: '200ms' }} />
        <span className="w-2 h-2 rounded-full animate-typing" style={{ backgroundColor: t.typingDotColor, animationDelay: '400ms' }} />
      </div>
    </motion.div>
  );
}
