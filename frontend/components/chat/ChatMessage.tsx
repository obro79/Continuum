import { Message } from '@/lib/types/chat';
import { designTokens } from '@/lib/design-tokens';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { type, content, timestamp } = message;

  // Format timestamp to readable format
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // System messages are centered with muted styling
  if (type === 'system') {
    return (
      <div className="flex justify-center my-4">
        <div className="px-4 py-2 rounded-full bg-muted text-muted-foreground text-xs font-medium">
          {content}
        </div>
      </div>
    );
  }

  // Assistant messages: orange, left-aligned
  if (type === 'assistant') {
    return (
      <div className="flex justify-start mb-4">
        <div className="max-w-[75%]">
          <div
            className="rounded-2xl rounded-tl-sm px-4 py-3 text-white"
            style={{ backgroundColor: designTokens.colors.accent.orange }}
          >
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1 ml-2">
            Claude · {formatTime(timestamp)}
          </p>
        </div>
      </div>
    );
  }

  // User messages: blue, right-aligned
  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[75%]">
        <div
          className="rounded-2xl rounded-tr-sm px-4 py-3 text-white"
          style={{ backgroundColor: '#3b82f6' }}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1 mr-2 text-right">
          You · {formatTime(timestamp)}
        </p>
      </div>
    </div>
  );
}
