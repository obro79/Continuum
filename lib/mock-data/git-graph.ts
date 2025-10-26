import { GitCommit } from '../types/git-graph';

/**
 * Mock data for Git + Claude Context Visualization
 * Pattern: 7 commits with 3 sessions
 *
 * Session 1: Commits 1→2→3 (10, 8, 5 messages)
 * Session 2: Commits 4→5 (6, 4 messages)
 * Session 3: Commit 6 (4 messages)
 * Commit 7: No context
 */

export const mockGitCommits: GitCommit[] = [
  {
    commit_sha: 'abc123def456789012345678901234567890abcd',
    commit_sha_short: 'abc123',
    commit_message: 'Add user authentication system',
    author_email: 'dev@example.com',
    timestamp: '2025-01-20T10:00:00Z',
    claude_context: {
      context_id: 'ctx-550e8400',
      total_messages: 10,
      new_session: true, // Session 1 starts - branch out
    },
  },
  {
    commit_sha: 'def456abc789012345678901234567890abcdef1',
    commit_sha_short: 'def456',
    commit_message: 'Refactor auth middleware',
    author_email: 'dev@example.com',
    timestamp: '2025-01-20T11:30:00Z',
    claude_context: {
      context_id: 'ctx-550e8400',
      total_messages: 8,
      new_session: false, // Session 1 continues - vertical connection
    },
  },
  {
    commit_sha: '789012def456abc123456789012345678901abcd',
    commit_sha_short: '789012',
    commit_message: 'Add password reset functionality',
    author_email: 'dev@example.com',
    timestamp: '2025-01-20T14:00:00Z',
    claude_context: {
      context_id: 'ctx-550e8400',
      total_messages: 5,
      new_session: false, // Session 1 continues - vertical connection
    },
  },
  {
    commit_sha: '012345abc789def456012345678901234567890ab',
    commit_sha_short: '012345',
    commit_message: 'Implement email notifications',
    author_email: 'dev@example.com',
    timestamp: '2025-01-20T16:00:00Z',
    claude_context: {
      context_id: 'ctx-660e8400',
      total_messages: 6,
      new_session: true, // Session 2 starts - merge session 1, branch out session 2
    },
  },
  {
    commit_sha: '345678def012abc456789012345678901234567ab',
    commit_sha_short: '345678',
    commit_message: 'Add notification preferences',
    author_email: 'dev@example.com',
    timestamp: '2025-01-20T17:30:00Z',
    claude_context: {
      context_id: 'ctx-660e8400',
      total_messages: 4,
      new_session: false, // Session 2 continues - vertical connection
    },
  },
  {
    commit_sha: '678901abc345def012789012345678901234567ab',
    commit_sha_short: '678901',
    commit_message: 'Fix notification timing bug',
    author_email: 'dev@example.com',
    timestamp: '2025-01-20T19:00:00Z',
    claude_context: {
      context_id: 'ctx-770e8400',
      total_messages: 4,
      new_session: true, // Session 3 starts - merge session 2, branch out session 3
    },
  },
  {
    commit_sha: '901234def678abc012345901234567890123456ab',
    commit_sha_short: '901234',
    commit_message: 'Update dependencies',
    author_email: 'dev@example.com',
    timestamp: '2025-01-20T20:00:00Z',
    claude_context: null, // No context - merge session 3, no branch out
  },
];
