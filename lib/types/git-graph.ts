/**
 * Type definitions for Git + Claude Context Visualization
 */

export interface ClaudeContext {
  context_id: string;
  total_messages: number;
  new_session: boolean; // true = branch out, false = vertical continuation
}

export interface GitCommit {
  commit_sha: string; // Full SHA
  commit_sha_short: string; // 6-character display version
  commit_message: string;
  author_email: string;
  timestamp: string;
  claude_context: ClaudeContext | null; // null if no context (e.g., commit 7)
}

export interface GraphNode {
  type: 'git' | 'claude';
  x: number;
  y: number;
  commit?: GitCommit;
  context?: ClaudeContext;
}

export interface ConnectionPath {
  type: 'branch' | 'vertical' | 'merge';
  d: string; // SVG path data
  fromNode: GraphNode;
  toNode: GraphNode;
}

export interface GraphData {
  commits: GitCommit[];
  gitNodes: GraphNode[];
  claudeNodes: GraphNode[];
  connections: ConnectionPath[];
}
