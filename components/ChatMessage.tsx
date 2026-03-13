'use client';

import DSChatMessage, { TypingIndicator as DSTypingIndicator } from './ds/ChatMessage';
import type { BaseChatMessageProps, TypingIndicatorProps } from './ds/ChatMessage';

/* ── Health Avatar — shield + cross icon ── */
function HealthAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg shadow-purple-900/20 flex-shrink-0">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21C12 21 3 15.5 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-9 12-9 12Z" fill="#7C3AED" />
        <path d="M9.5 9.5h5M12 7v5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  );
}

const HEALTH_AVATAR = <HealthAvatar />;

/* ── Health-branded ChatMessage — injects avatar into DS base ── */
export default function ChatMessage(props: BaseChatMessageProps) {
  return <DSChatMessage {...props} avatar={props.avatar ?? HEALTH_AVATAR} />;
}

/* ── Health-branded TypingIndicator — injects avatar into DS base ── */
export function TypingIndicator(props: TypingIndicatorProps = {}) {
  return <DSTypingIndicator {...props} avatar={props.avatar ?? HEALTH_AVATAR} />;
}
