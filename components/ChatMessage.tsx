'use client';

import DSChatMessage, { TypingIndicator as DSTypingIndicator } from './ds/ChatMessage';
import type { BaseChatMessageProps, TypingIndicatorProps } from './ds/ChatMessage';

export default function ChatMessage(props: BaseChatMessageProps) {
  return <DSChatMessage {...props} />;
}

export function TypingIndicator(props: TypingIndicatorProps = {}) {
  return <DSTypingIndicator {...props} />;
}
