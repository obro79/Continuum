'use client';

import { useState } from 'react';

export function ClaudeChat() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setError(null);
    setResponse('');

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2048,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResponse(data.data.response);
      } else {
        setError(data.error || 'Failed to get response from Claude');
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Chat with Claude</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
            Your message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full h-32 p-3 border border-border rounded-lg bg-background text-foreground resize-none"
            placeholder="Ask Claude anything..."
          />
        </div>

        <button
          onClick={sendMessage}
          disabled={loading || !message.trim()}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Thinking...' : 'Send Message'}
        </button>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-destructive font-medium">Error:</p>
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {response && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium text-muted-foreground mb-2">Claude's response:</p>
            <p className="text-foreground whitespace-pre-wrap">{response}</p>
          </div>
        )}
      </div>
    </div>
  );
}
