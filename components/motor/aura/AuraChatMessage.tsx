'use client';

import BaseChatMessage, { TypingIndicator as BaseTypingIndicator, type ChatMessageData, type ChatBubbleTheme } from '../../ds/ChatMessage';

const AURA_CHAT_THEME: ChatBubbleTheme = {
  systemBg: 'var(--aura-surface)',
  systemBorder: 'var(--aura-border)',
  systemText: 'var(--aura-text-muted)',
  userBubbleBg: 'linear-gradient(0deg, #5920C5 0%, #7C47E1 100%)',
  userBubbleText: '#fff',
  userBubbleStyle: { borderRadius: '20px 4px 20px 20px', boxShadow: '0 4px 12px rgba(168,85,247,0.3)' },
  userBubbleClass: '',
  botBubbleBg: 'var(--aura-surface)',
  botBubbleBorder: 'var(--aura-border)',
  botText: 'var(--aura-bot-text)',
  botBubbleStyle: { borderRadius: '4px 20px 20px 20px', boxShadow: '0 4px 12px var(--aura-shadow)' },
  botBubbleClass: '',
  editBtnBg: 'var(--aura-surface-2)',
  editBtnBorder: 'var(--aura-border-strong)',
  editIconColor: 'text-[#C084FC]',
  cursorColor: 'bg-[#A855F7]',
  typingDotColor: 'bg-[#A855F7]',
};

interface AuraChatMessageProps {
  message: ChatMessageData;
  onEdit?: (stepId: string) => void;
  animate?: boolean;
}

export default function AuraChatMessage({ message, onEdit, animate = false }: AuraChatMessageProps) {
  return (
    <BaseChatMessage
      message={message}
      onEdit={onEdit}
      animate={animate}
      theme={AURA_CHAT_THEME}
    />
  );
}

export function AuraTypingIndicator() {
  return <BaseTypingIndicator theme={AURA_CHAT_THEME} />;
}
