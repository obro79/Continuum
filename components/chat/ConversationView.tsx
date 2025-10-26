"use client";

import { useEffect, useRef } from 'react';
import { Message } from '@/lib/types/chat';
import { ChatMessage } from './ChatMessage';

interface ConversationViewProps {
  messages: Message[];
  autoScroll?: boolean;
}

export function ConversationView({ messages, autoScroll = true }: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">No messages in this conversation</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-4 py-4 space-y-2"
    >
      {messages.map((message) => (
        <ChatMessage key={message.uuid} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
