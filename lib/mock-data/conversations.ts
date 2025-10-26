import { Conversation, Message } from '../types/chat';

/**
 * Mock conversation data for Claude context visualization
 * Matches context_ids from git-graph mock data:
 * - ctx-550e8400 (Session 1: commits 1→2→3)
 * - ctx-660e8400 (Session 2: commits 4→5)
 * - ctx-770e8400 (Session 3: commit 6)
 */

// Session 1: User authentication implementation (10, 8, 5 messages across 3 commits)
const session1Messages: Message[] = [
  {
    type: 'user',
    content: 'I need to implement a user authentication system for my web app. Can you help me set this up?',
    timestamp: '2025-01-20T10:00:00Z',
    uuid: 'a1',
    parentUuid: null,
  },
  {
    type: 'assistant',
    content: "I'll help you implement a user authentication system. Let's start with the core components: user registration, login, and session management. What framework are you using?",
    timestamp: '2025-01-20T10:00:05Z',
    uuid: 'a2',
    parentUuid: 'a1',
  },
  {
    type: 'user',
    content: "We're using Next.js with Supabase for the backend.",
    timestamp: '2025-01-20T10:00:30Z',
    uuid: 'a3',
    parentUuid: 'a2',
  },
  {
    type: 'assistant',
    content: 'Perfect! Supabase has excellent auth support. Let me create the authentication setup with email/password login. I\'ll set up:\n1. Supabase client configuration\n2. Login/signup forms\n3. Protected routes with middleware\n4. Session management',
    timestamp: '2025-01-20T10:00:45Z',
    uuid: 'a4',
    parentUuid: 'a3',
  },
  {
    type: 'user',
    content: 'That sounds great. Can you also add password validation?',
    timestamp: '2025-01-20T10:05:00Z',
    uuid: 'a5',
    parentUuid: 'a4',
  },
  {
    type: 'assistant',
    content: "Absolutely. I'll add password validation with these requirements:\n- Minimum 8 characters\n- At least one uppercase letter\n- At least one number\n- At least one special character\n\nI'll also add real-time validation feedback in the UI.",
    timestamp: '2025-01-20T10:05:15Z',
    uuid: 'a6',
    parentUuid: 'a5',
  },
  {
    type: 'user',
    content: 'The auth middleware seems to be running on every request. Can we optimize that?',
    timestamp: '2025-01-20T11:30:00Z',
    uuid: 'a7',
    parentUuid: 'a6',
  },
  {
    type: 'assistant',
    content: "Good catch! Let's refactor the middleware to only run on protected routes. I'll update the matcher config to exclude public paths like /login, /signup, and static assets.",
    timestamp: '2025-01-20T11:30:20Z',
    uuid: 'a8',
    parentUuid: 'a7',
  },
  {
    type: 'user',
    content: 'Perfect. Can you also add session refresh logic?',
    timestamp: '2025-01-20T11:35:00Z',
    uuid: 'a9',
    parentUuid: 'a8',
  },
  {
    type: 'assistant',
    content: "I'll add automatic session refresh. Supabase handles token refresh automatically, but I'll add a manual refresh utility and set up proper error handling for expired sessions.",
    timestamp: '2025-01-20T11:35:30Z',
    uuid: 'a10',
    parentUuid: 'a9',
  },
  {
    type: 'user',
    content: 'Now I need password reset functionality. Users should be able to reset via email.',
    timestamp: '2025-01-20T14:00:00Z',
    uuid: 'a11',
    parentUuid: 'a10',
  },
  {
    type: 'assistant',
    content: "I'll implement password reset with these steps:\n1. Forgot password page with email input\n2. Supabase sends reset email with magic link\n3. Reset password page to set new password\n4. Confirmation and redirect to login\n\nLet me create the necessary pages and API routes.",
    timestamp: '2025-01-20T14:00:25Z',
    uuid: 'a12',
    parentUuid: 'a11',
  },
  {
    type: 'user',
    content: 'Great! Can you also add some error handling for invalid reset tokens?',
    timestamp: '2025-01-20T14:10:00Z',
    uuid: 'a13',
    parentUuid: 'a12',
  },
  {
    type: 'assistant',
    content: "Absolutely. I'll add comprehensive error handling:\n- Expired token detection\n- Invalid token validation\n- Clear error messages to users\n- Automatic redirect with helpful guidance\n\nI'll also add loading states during the reset process.",
    timestamp: '2025-01-20T14:10:30Z',
    uuid: 'a14',
    parentUuid: 'a13',
  },
];

// Session 2: Email notifications (6, 4 messages across 2 commits)
const session2Messages: Message[] = [
  {
    type: 'system',
    content: '--- USER STARTED NEW SESSION (session-2) ---',
    timestamp: '2025-01-20T16:00:00Z',
    uuid: 'b0',
    parentUuid: null,
  },
  {
    type: 'user',
    content: 'I want to add email notifications when users sign up. How should I implement this?',
    timestamp: '2025-01-20T16:00:10Z',
    uuid: 'b1',
    parentUuid: 'b0',
  },
  {
    type: 'assistant',
    content: "Let's implement email notifications using Supabase Edge Functions and a transactional email service like Resend. I'll create:\n1. Welcome email template\n2. Edge function trigger on user signup\n3. Email service integration\n4. Error handling and retry logic",
    timestamp: '2025-01-20T16:00:35Z',
    uuid: 'b2',
    parentUuid: 'b1',
  },
  {
    type: 'user',
    content: 'Sounds good. Can we also send confirmation emails when password is reset?',
    timestamp: '2025-01-20T16:15:00Z',
    uuid: 'b3',
    parentUuid: 'b2',
  },
  {
    type: 'assistant',
    content: "Definitely! I'll add password reset confirmation emails. This improves security by notifying users of account changes. I'll use the same email service and create a separate template for reset confirmations.",
    timestamp: '2025-01-20T16:15:25Z',
    uuid: 'b4',
    parentUuid: 'b3',
  },
  {
    type: 'user',
    content: 'Users should be able to opt out of non-critical emails. Can we add notification preferences?',
    timestamp: '2025-01-20T17:30:00Z',
    uuid: 'b5',
    parentUuid: 'b4',
  },
  {
    type: 'assistant',
    content: "Great idea! I'll implement notification preferences:\n1. Add preferences table in Supabase\n2. Create settings page with toggles\n3. Check preferences before sending emails\n4. Keep security emails mandatory (password resets, etc.)\n\nLet me set this up.",
    timestamp: '2025-01-20T17:30:40Z',
    uuid: 'b6',
    parentUuid: 'b5',
  },
  {
    type: 'user',
    content: 'Perfect. Make sure the preferences are saved per user.',
    timestamp: '2025-01-20T17:45:00Z',
    uuid: 'b7',
    parentUuid: 'b6',
  },
  {
    type: 'assistant',
    content: "Absolutely. I'll link preferences to user.id in Supabase with proper RLS policies. Each user will have their own preference settings that persist across sessions.",
    timestamp: '2025-01-20T17:45:20Z',
    uuid: 'b8',
    parentUuid: 'b7',
  },
];

// Session 3: Bug fix (4 messages for 1 commit)
const session3Messages: Message[] = [
  {
    type: 'system',
    content: '--- USER STARTED NEW SESSION (session-3) ---',
    timestamp: '2025-01-20T19:00:00Z',
    uuid: 'c0',
    parentUuid: null,
  },
  {
    type: 'user',
    content: "I found a bug - notifications are being sent at the wrong time. They're going out immediately instead of being scheduled.",
    timestamp: '2025-01-20T19:00:15Z',
    uuid: 'c1',
    parentUuid: 'c0',
  },
  {
    type: 'assistant',
    content: "Let me investigate the notification timing issue. I'll check:\n1. The Edge Function trigger configuration\n2. Any scheduling logic we implemented\n3. Timestamp handling in the email queue\n\nCan you share more details about when they should be sent?",
    timestamp: '2025-01-20T19:00:35Z',
    uuid: 'c2',
    parentUuid: 'c1',
  },
  {
    type: 'user',
    content: "Welcome emails should be sent immediately, but marketing emails should respect the user's timezone and send at 9 AM their local time.",
    timestamp: '2025-01-20T19:05:00Z',
    uuid: 'c3',
    parentUuid: 'c2',
  },
  {
    type: 'assistant',
    content: "I see the issue - we weren't storing or using timezone data. I'll fix this by:\n1. Capturing user timezone on signup\n2. Adding a scheduling service for delayed emails\n3. Converting scheduled times to UTC properly\n4. Keeping immediate emails (welcome, security) as-is\n\nLet me update the notification system.",
    timestamp: '2025-01-20T19:05:30Z',
    uuid: 'c4',
    parentUuid: 'c3',
  },
];

// Export conversations mapped by context_id
export const mockConversations: Record<string, Conversation> = {
  'ctx-550e8400': {
    context_id: 'ctx-550e8400',
    messages: session1Messages,
  },
  'ctx-660e8400': {
    context_id: 'ctx-660e8400',
    messages: session2Messages,
  },
  'ctx-770e8400': {
    context_id: 'ctx-770e8400',
    messages: session3Messages,
  },
};

// Helper function to get conversation by context_id
export function getConversation(contextId: string): Conversation | undefined {
  return mockConversations[contextId];
}
