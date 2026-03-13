'use client';

import BaseChatMessage, { TypingIndicator as BaseTypingIndicator, type ChatMessageData, type ChatBubbleTheme } from '../ds/ChatMessage';

interface LifeChatMessageProps {
  message: ChatMessageData;
  onEdit?: (stepId: string) => void;
  animate?: boolean;
}

export default function LifeChatMessage({ message, onEdit, animate = false }: LifeChatMessageProps) {
  return (
    <BaseChatMessage
      message={message}
      onEdit={onEdit}
      animate={animate}
    />
  );
}

export function LifeTypingIndicator() {
  return <BaseTypingIndicator />;
}
