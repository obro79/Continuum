/**
 * Type definitions for Claude conversation messages
 * Based on JSONL format from contexts.jsonl_data
 */

export interface Message {
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string; // ISO 8601 format
  uuid: string;
  parentUuid: string | null;
}

export interface Conversation {
  context_id: string;
  messages: Message[];
}

/**
 * UI-friendly chat message interface
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO 8601 format
}
