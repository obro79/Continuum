import { GitCommit, GraphNode, ConnectionPath, GraphData } from '../types/git-graph';
import { designTokens } from '../design-tokens';

/**
 * Layout configuration for the graph visualization
 * All values scaled by 1.25x for 125% zoom
 */
export const LAYOUT_CONFIG = {
  // Node positions
  GIT_X: 187.5, // X position for Git nodes
  CLAUDE_X: 562.5, // X position for Claude nodes
  START_Y: 100, // Y position for first commit
  COMMIT_SPACING: 125, // Vertical spacing between commits
  CLAUDE_OFFSET_Y: 18.75, // Claude nodes sit 18.75px below Git nodes

  // Node styling
  NODE_RADIUS: 10,

  // Colors from design tokens
  GIT_COLOR: '#3b82f6', // Blue
  CLAUDE_COLOR: designTokens.colors.accent.orange, // Orange from design tokens

  // Connection curves
  CURVE_CONTROL_OFFSET: 125, // How far the bezier control points extend
};

/**
 * Generate SVG path for a bezier curve
 */
function generateBezierPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curveDown: boolean = true
): string {
  const midX = (x1 + x2) / 2;
  const controlOffset = LAYOUT_CONFIG.CURVE_CONTROL_OFFSET;

  // Control points for the curve
  const cp1x = x1 + controlOffset;
  const cp1y = y1 + (curveDown ? controlOffset / 2 : -controlOffset / 2);
  const cp2x = x2 - controlOffset;
  const cp2y = y2 + (curveDown ? controlOffset / 2 : -controlOffset / 2);

  return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
}

/**
 * Calculate positions for all nodes and generate connection paths
 */
export function calculateGraphLayout(commits: GitCommit[]): GraphData {
  const gitNodes: GraphNode[] = [];
  const claudeNodes: GraphNode[] = [];
  const connections: ConnectionPath[] = [];

  // Create nodes for each commit
  commits.forEach((commit, index) => {
    const y = LAYOUT_CONFIG.START_Y + index * LAYOUT_CONFIG.COMMIT_SPACING;

    // Create Git node
    const gitNode: GraphNode = {
      type: 'git',
      x: LAYOUT_CONFIG.GIT_X,
      y: y,
      commit: commit,
    };
    gitNodes.push(gitNode);

    // Create Claude node if context exists
    if (commit.claude_context) {
      const claudeNode: GraphNode = {
        type: 'claude',
        x: LAYOUT_CONFIG.CLAUDE_X,
        y: y + LAYOUT_CONFIG.CLAUDE_OFFSET_Y,
        commit: commit,
        context: commit.claude_context,
      };
      claudeNodes.push(claudeNode);
    }
  });

  // Generate connection paths
  commits.forEach((commit, index) => {
    const gitNode = gitNodes[index];
    const claudeNode = claudeNodes.find(cn => cn.commit === commit);

    if (!commit.claude_context) {
      // If no context, we might need to merge the previous session
      if (index > 0) {
        const prevCommit = commits[index - 1];
        const prevClaudeNode = claudeNodes.find(cn => cn.commit === prevCommit);
        const prevGitNode = gitNodes[index - 1];

        if (prevClaudeNode && prevGitNode) {
          // Merge line from previous Claude back to previous Git
          connections.push({
            type: 'merge',
            d: generateBezierPath(
              prevClaudeNode.x,
              prevClaudeNode.y,
              prevGitNode.x,
              prevGitNode.y,
              false // curve up for merge
            ),
            fromNode: prevClaudeNode,
            toNode: prevGitNode,
          });
        }
      }
      return;
    }

    // Current commit has context
    if (commit.claude_context.new_session) {
      // New session - need to:
      // 1. Merge previous session (if exists)
      // 2. Branch out to new session

      if (index > 0) {
        const prevCommit = commits[index - 1];
        const prevClaudeNode = claudeNodes.find(cn => cn.commit === prevCommit);
        const prevGitNode = gitNodes[index - 1];

        if (prevClaudeNode && prevGitNode) {
          // Merge line from previous Claude back to previous Git
          connections.push({
            type: 'merge',
            d: generateBezierPath(
              prevClaudeNode.x,
              prevClaudeNode.y,
              prevGitNode.x,
              prevGitNode.y,
              false // curve up for merge
            ),
            fromNode: prevClaudeNode,
            toNode: prevGitNode,
          });

          // Branch out from PREVIOUS Git to current Claude (new session)
          if (claudeNode) {
            connections.push({
              type: 'branch',
              d: generateBezierPath(
                prevGitNode.x,
                prevGitNode.y,
                claudeNode.x,
                claudeNode.y,
                true // curve down for branch
              ),
              fromNode: prevGitNode,
              toNode: claudeNode,
            });
          }
        }
      } else {
        // First commit with new_session: true, branch from current Git
        if (claudeNode) {
          connections.push({
            type: 'branch',
            d: generateBezierPath(
              gitNode.x,
              gitNode.y,
              claudeNode.x,
              claudeNode.y,
              true // curve down for branch
            ),
            fromNode: gitNode,
            toNode: claudeNode,
          });
        }
      }
    } else {
      // Continuing session - vertical connection from previous Claude to current Claude
      if (index > 0) {
        const prevCommit = commits[index - 1];
        const prevClaudeNode = claudeNodes.find(cn => cn.commit === prevCommit);

        if (prevClaudeNode && claudeNode) {
          // Straight vertical line
          connections.push({
            type: 'vertical',
            d: `M ${prevClaudeNode.x} ${prevClaudeNode.y} L ${claudeNode.x} ${claudeNode.y}`,
            fromNode: prevClaudeNode,
            toNode: claudeNode,
          });
        }
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
 * Calculate SVG viewBox dimensions
 */
export function calculateViewBox(commits: GitCommit[]): string {
  const width = 750; // Scaled from 600 by 1.25x
  const height = LAYOUT_CONFIG.START_Y + commits.length * LAYOUT_CONFIG.COMMIT_SPACING + 62.5; // 50 * 1.25
  return `0 0 ${width} ${height}`;
}
