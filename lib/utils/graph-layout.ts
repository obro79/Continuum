import { GitCommit, GraphNode, ConnectionPath, GraphData } from '../types/git-graph';
import { designTokens } from '../design-tokens';

/**
 * Layout configuration for the graph visualization
 */
export const LAYOUT_CONFIG = {
  // Node positions
  START_X: 140, // Starting X position (increased for more left padding)
  LANE_WIDTH: 30, // Width between parallel branches
  START_Y: 50, // Y position for first commit
  COMMIT_SPACING: 40, // Vertical spacing between commits

  // Node styling
  NODE_RADIUS: 8,

  // Colors for different branches
  BRANCH_COLORS: {
    main: '#3b82f6', // Blue
    backend: '#10b981', // Green
    frontend: '#a855f7', // Purple
    frontendv2: '#f59e0b', // Amber
    default: '#6b7280', // Gray
  },
  GIT_COLOR: '#3b82f6',

  // Claude context
  CLAUDE_X_OFFSET: 200, // Claude nodes offset from Git nodes
  CLAUDE_Y_OFFSET: 0, // Claude nodes at same Y as Git nodes
  CLAUDE_COLOR: designTokens.colors.accent.orange,
};

interface CommitNode {
  commit: GitCommit;
  children: string[]; // SHA of child commits
  lane: number; // Which vertical lane this commit is in
  x: number;
  y: number;
}

/**
 * Build a map of parent-child relationships
 */
function buildCommitGraph(commits: GitCommit[]): Map<string, CommitNode> {
  const commitMap = new Map<string, CommitNode>();

  // First pass: Create all nodes (reverse order so oldest is at top)
  const reversedCommits = [...commits].reverse();
  reversedCommits.forEach((commit, index) => {
    commitMap.set(commit.commit_sha, {
      commit,
      children: [],
      lane: 0, // Will be assigned later
      x: 0,
      y: LAYOUT_CONFIG.START_Y + index * LAYOUT_CONFIG.COMMIT_SPACING,
    });
  });

  // Second pass: Build parent-child relationships
  commits.forEach(commit => {
    if (commit.parent_sha) {
      const parentNode = commitMap.get(commit.parent_sha);
      if (parentNode) {
        parentNode.children.push(commit.commit_sha);
      }
    }
  });

  return commitMap;
}

/**
 * Assign lanes to commits to minimize crossing
 */
function assignLanes(commitMap: Map<string, CommitNode>, commits: GitCommit[]): void {
  const usedLanes = new Set<number>();
  const activeBranches = new Map<string, number>(); // branch name to lane
  let nextLane = 0;

  // Process commits in chronological order (oldest first)
  const reversedCommits = [...commits].reverse();
  reversedCommits.forEach(commit => {
    const node = commitMap.get(commit.commit_sha)!;

    // Determine which lane to use
    if (commit.branches && commit.branches.length > 0) {
      // Use the first branch name for lane assignment
      const primaryBranch = commit.branches[0].replace('HEAD -> origin/', '').replace('origin/', '');

      if (!activeBranches.has(primaryBranch)) {
        // Assign a new lane for this branch
        activeBranches.set(primaryBranch, nextLane);
        nextLane++;
      }

      node.lane = activeBranches.get(primaryBranch)!;
    } else if (commit.parent_sha) {
      // Use parent's lane if no branch info
      const parentNode = commitMap.get(commit.parent_sha);
      if (parentNode) {
        node.lane = parentNode.lane;
      }
    }

    // Update X position based on lane
    node.x = LAYOUT_CONFIG.START_X + node.lane * LAYOUT_CONFIG.LANE_WIDTH;
  });
}

/**
 * Get color for a commit based on its branch
 */
function getCommitColor(commit: GitCommit): string {
  if (!commit.branches || commit.branches.length === 0) {
    return LAYOUT_CONFIG.BRANCH_COLORS.default;
  }

  const branch = commit.branches[0].toLowerCase();

  if (branch.includes('main')) return LAYOUT_CONFIG.BRANCH_COLORS.main;
  if (branch.includes('backend')) return LAYOUT_CONFIG.BRANCH_COLORS.backend;
  if (branch.includes('frontend') && !branch.includes('v2')) return LAYOUT_CONFIG.BRANCH_COLORS.frontend;
  if (branch.includes('test')) return LAYOUT_CONFIG.BRANCH_COLORS.frontendv2;

  return LAYOUT_CONFIG.BRANCH_COLORS.default;
}

/**
 * Calculate positions for all nodes and generate connection paths
 */
export function calculateGraphLayout(commits: GitCommit[]): GraphData {
  const gitNodes: GraphNode[] = [];
  const claudeNodes: GraphNode[] = [];
  const connections: ConnectionPath[] = [];

  if (commits.length === 0) {
    return { commits, gitNodes, claudeNodes, connections };
  }

  // Build the commit graph
  const commitMap = buildCommitGraph(commits);

  // Assign lanes to minimize crossings
  assignLanes(commitMap, commits);

  // Create Git nodes
  commits.forEach(commit => {
    const node = commitMap.get(commit.commit_sha)!;

    const gitNode: GraphNode = {
      type: 'git',
      x: node.x,
      y: node.y,
      commit: commit,
    };
    gitNodes.push(gitNode);

    // Create Claude node if context exists
    if (commit.claude_context) {
      const claudeNode: GraphNode = {
        type: 'claude',
        x: node.x + LAYOUT_CONFIG.CLAUDE_X_OFFSET,
        y: node.y + LAYOUT_CONFIG.CLAUDE_Y_OFFSET,
        commit: commit,
        context: commit.claude_context,
      };
      claudeNodes.push(claudeNode);

      // Add connection from Git to Claude
      connections.push({
        type: 'branch',
        d: `M ${node.x} ${node.y} L ${claudeNode.x} ${claudeNode.y}`,
        fromNode: gitNode,
        toNode: claudeNode,
      });
    }
  });

  // Create connections between commits
  commits.forEach(commit => {
    if (!commit.parent_sha) return;

    const childNode = commitMap.get(commit.commit_sha);
    const parentNode = commitMap.get(commit.parent_sha);

    if (childNode && parentNode) {
      const fromGitNode = gitNodes.find(n => n.commit?.commit_sha === commit.parent_sha);
      const toGitNode = gitNodes.find(n => n.commit?.commit_sha === commit.commit_sha);

      if (fromGitNode && toGitNode) {
        // Determine connection type
        const isSameLane = childNode.lane === parentNode.lane;
        const path = isSameLane
          ? `M ${parentNode.x} ${parentNode.y} L ${childNode.x} ${childNode.y}`
          : `M ${parentNode.x} ${parentNode.y} Q ${parentNode.x} ${(parentNode.y + childNode.y) / 2}, ${childNode.x} ${childNode.y}`;

        connections.push({
          type: isSameLane ? 'vertical' : 'branch',
          d: path,
          fromNode: fromGitNode,
          toNode: toGitNode,
        });
      }
    }
  });

  return {
    commits,
    gitNodes,
    claudeNodes,
    connections,
  };
}

/**
 * Calculate SVG viewBox dimensions based on the graph
 */
export function calculateViewBox(commits: GitCommit[]): string {
  if (commits.length === 0) {
    return '0 0 800 600';
  }

  // Build commit map to find max lane
  const commitMap = buildCommitGraph(commits);
  assignLanes(commitMap, commits);

  let maxLane = 0;
  commitMap.forEach(node => {
    maxLane = Math.max(maxLane, node.lane);
  });

  const width = LAYOUT_CONFIG.START_X + (maxLane + 1) * LAYOUT_CONFIG.LANE_WIDTH + LAYOUT_CONFIG.CLAUDE_X_OFFSET + 100;
  const height = LAYOUT_CONFIG.START_Y + commits.length * LAYOUT_CONFIG.COMMIT_SPACING + 50;

  return `0 0 ${width} ${height}`;
}

/**
 * Export the getCommitColor function for use in GitNode component
 */
export { getCommitColor };