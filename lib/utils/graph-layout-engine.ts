/**
 * Graph Layout Engine
 * Calculates positions for Git commit nodes and Claude context nodes
 * Uses DAG (Directed Acyclic Graph) layout optimized for Git branching
 */

import { GitCommit, GraphNode, ConnectionPath, GraphData } from '@/lib/types/git-graph';
import { GraphConfig } from '@/lib/config/graph-config';

interface LayoutNode {
  commit: GitCommit;
  x: number;
  y: number;
  lane: number;
  children: string[];
  parents: string[];
  depth: number;
}

interface LayoutState {
  nodes: Map<string, LayoutNode>;
  lanes: Map<number, boolean>; // Track occupied lanes
  maxLane: number;
  maxDepth: number;
}

export class GraphLayoutEngine {
  private config = GraphConfig.layout;
  private colors = GraphConfig.colors;

  /**
   * Calculate complete graph layout from commits
   */
  calculateLayout(commits: GitCommit[]): GraphData {
    if (commits.length === 0) {
      return {
        commits: [],
        gitNodes: [],
        claudeNodes: [],
        connections: [],
      };
    }

    // Build the layout state
    const layoutState = this.buildLayoutState(commits);

    // Generate nodes and connections
    const gitNodes = this.generateGitNodes(layoutState);
    const claudeNodes = this.generateClaudeNodes(layoutState);
    const connections = this.generateConnections(layoutState, gitNodes, claudeNodes);

    return {
      commits,
      gitNodes,
      claudeNodes,
      connections,
    };
  }

  /**
   * Build layout state with node positions
   */
  private buildLayoutState(commits: GitCommit[]): LayoutState {
    const nodes = new Map<string, LayoutNode>();
    const lanes = new Map<number, boolean>();
    let maxLane = 0;
    let maxDepth = 0;

    // First pass: Create nodes and establish relationships
    const commitMap = new Map<string, GitCommit>();
    commits.forEach(commit => {
      commitMap.set(commit.commit_sha, commit);
    });

    // Build parent-child relationships
    const childrenMap = new Map<string, string[]>();
    commits.forEach(commit => {
      if (commit.parent_sha) {
        const children = childrenMap.get(commit.parent_sha) || [];
        children.push(commit.commit_sha);
        childrenMap.set(commit.parent_sha, children);
      }
    });

    // Calculate depth for each node (distance from root)
    const depths = this.calculateDepths(commits);
    maxDepth = Math.max(...Array.from(depths.values()));

    // Second pass: Assign lanes using a smarter algorithm
    const sortedCommits = this.topologicalSort(commits);
    const laneAssignments = this.assignLanes(sortedCommits, childrenMap);

    // Third pass: Create layout nodes with positions
    sortedCommits.forEach((commit, index) => {
      const lane = laneAssignments.get(commit.commit_sha) || 0;
      const depth = depths.get(commit.commit_sha) || 0;

      const node: LayoutNode = {
        commit,
        x: this.config.origin.x + (lane * this.config.nodeSpacing.horizontal),
        y: this.config.origin.y + (depth * this.config.nodeSpacing.vertical),
        lane,
        children: childrenMap.get(commit.commit_sha) || [],
        parents: commit.parent_sha ? [commit.parent_sha] : [],
        depth,
      };

      nodes.set(commit.commit_sha, node);
      lanes.set(lane, true);
      maxLane = Math.max(maxLane, lane);
    });

    return { nodes, lanes, maxLane, maxDepth };
  }

  /**
   * Calculate depth (vertical position) for each commit
   */
  private calculateDepths(commits: GitCommit[]): Map<string, number> {
    const depths = new Map<string, number>();
    const visited = new Set<string>();

    // Build adjacency list
    const children = new Map<string, string[]>();
    commits.forEach(commit => {
      if (commit.parent_sha) {
        const childList = children.get(commit.parent_sha) || [];
        childList.push(commit.commit_sha);
        children.set(commit.parent_sha, childList);
      }
    });

    // Find root commits (no parents)
    const roots = commits.filter(c => !c.parent_sha);

    // BFS from roots to assign depths
    const queue: Array<{sha: string, depth: number}> = [];
    roots.forEach(root => {
      queue.push({ sha: root.commit_sha, depth: 0 });
    });

    while (queue.length > 0) {
      const { sha, depth } = queue.shift()!;

      if (visited.has(sha)) continue;
      visited.add(sha);
      depths.set(sha, depth);

      const childList = children.get(sha) || [];
      childList.forEach(child => {
        if (!visited.has(child)) {
          queue.push({ sha: child, depth: depth + 1 });
        }
      });
    }

    // Handle any remaining commits (in case of disconnected components)
    commits.forEach((commit, index) => {
      if (!depths.has(commit.commit_sha)) {
        depths.set(commit.commit_sha, index);
      }
    });

    return depths;
  }

  /**
   * Topological sort for proper rendering order
   */
  private topologicalSort(commits: GitCommit[]): GitCommit[] {
    const sorted: GitCommit[] = [];
    const visited = new Set<string>();
    const commitMap = new Map<string, GitCommit>();

    commits.forEach(c => commitMap.set(c.commit_sha, c));

    const visit = (sha: string) => {
      if (visited.has(sha)) return;
      visited.add(sha);

      const commit = commitMap.get(sha);
      if (commit) {
        if (commit.parent_sha && commitMap.has(commit.parent_sha)) {
          visit(commit.parent_sha);
        }
        sorted.push(commit);
      }
    };

    // Visit all commits
    commits.forEach(c => visit(c.commit_sha));

    return sorted;
  }

  /**
   * Assign lanes to minimize crossing
   */
  private assignLanes(
    sortedCommits: GitCommit[],
    childrenMap: Map<string, string[]>
  ): Map<string, number> {
    const assignments = new Map<string, number>();
    const activeLanes = new Map<string, number>(); // branch name to lane
    let nextLane = 0;

    sortedCommits.forEach(commit => {
      // Determine branch from commit
      const branch = this.extractPrimaryBranch(commit);

      if (commit.parent_sha && assignments.has(commit.parent_sha)) {
        // Inherit lane from parent by default
        const parentLane = assignments.get(commit.parent_sha)!;

        // Check if this is a branch point
        const siblings = childrenMap.get(commit.parent_sha) || [];
        if (siblings.length > 1) {
          // Multiple children - this is a branch point
          const siblingIndex = siblings.indexOf(commit.commit_sha);
          if (siblingIndex > 0) {
            // Not the first child - assign a new lane
            assignments.set(commit.commit_sha, nextLane++);
          } else {
            // First child continues in parent's lane
            assignments.set(commit.commit_sha, parentLane);
          }
        } else {
          // Single child - continue in same lane
          assignments.set(commit.commit_sha, parentLane);
        }
      } else {
        // No parent or parent not in assignments - assign based on branch
        if (branch && !activeLanes.has(branch)) {
          activeLanes.set(branch, nextLane);
          assignments.set(commit.commit_sha, nextLane);
          nextLane++;
        } else if (branch && activeLanes.has(branch)) {
          assignments.set(commit.commit_sha, activeLanes.get(branch)!);
        } else {
          // No branch info - assign new lane
          assignments.set(commit.commit_sha, nextLane++);
        }
      }
    });

    return assignments;
  }

  /**
   * Extract primary branch name from commit
   */
  private extractPrimaryBranch(commit: GitCommit): string | null {
    if (!commit.branches || commit.branches.length === 0) {
      return null;
    }

    // Clean up branch names and return the first one
    const branch = commit.branches[0]
      .replace('HEAD -> ', '')
      .replace('origin/', '');

    return branch;
  }

  /**
   * Generate Git node objects
   */
  private generateGitNodes(layoutState: LayoutState): GraphNode[] {
    const nodes: GraphNode[] = [];

    layoutState.nodes.forEach(layoutNode => {
      nodes.push({
        type: 'git',
        x: layoutNode.x,
        y: layoutNode.y,
        commit: layoutNode.commit,
      });
    });

    return nodes;
  }

  /**
   * Generate Claude context nodes
   */
  private generateClaudeNodes(layoutState: LayoutState): GraphNode[] {
    const nodes: GraphNode[] = [];
    const CLAUDE_OFFSET_X = 120; // Horizontal offset to the right
    const CLAUDE_OFFSET_Y = 20;  // Subtle vertical offset downward

    layoutState.nodes.forEach(layoutNode => {
      if (layoutNode.commit.claude_context) {
        nodes.push({
          type: 'claude',
          x: layoutNode.x + CLAUDE_OFFSET_X,
          y: layoutNode.y + CLAUDE_OFFSET_Y,
          commit: layoutNode.commit,
          context: layoutNode.commit.claude_context,
        });
      }
    });

    return nodes;
  }

  /**
   * Generate connection paths between nodes
   */
  private generateConnections(
    layoutState: LayoutState,
    gitNodes: GraphNode[],
    claudeNodes: GraphNode[]
  ): ConnectionPath[] {
    const connections: ConnectionPath[] = [];

    // Git-to-Git connections (child to parent - each node points to its parent)
    layoutState.nodes.forEach(layoutNode => {
      // Only create connection if this node has a parent
      if (layoutNode.commit.parent_sha) {
        const parentNode = layoutState.nodes.get(layoutNode.commit.parent_sha);
        if (parentNode) {
          const fromNode = gitNodes.find(n => n.commit?.commit_sha === layoutNode.commit.commit_sha);
          const toNode = gitNodes.find(n => n.commit?.commit_sha === layoutNode.commit.parent_sha);

          if (fromNode && toNode) {
            const path = this.generatePath(
              fromNode.x, fromNode.y,
              toNode.x, toNode.y,
              layoutNode.lane === parentNode.lane
            );

            connections.push({
              type: layoutNode.lane === parentNode.lane ? 'vertical' : 'branch',
              d: path,
              fromNode,
              toNode,
            });
          }
        }
      }
    });

    // Claude connections based on session flow
    for (let i = 0; i < claudeNodes.length; i++) {
      const claudeNode = claudeNodes[i];
      const gitNode = gitNodes.find(gn => gn.commit?.commit_sha === claudeNode.commit?.commit_sha);

      if (!gitNode || !claudeNode.context) continue;

      // Check if this is a new session (Git → Claude branch)
      if (claudeNode.context.new_session) {
        // Git → Claude: Branch connection when new session starts
        const path = this.generateCurvePath(
          gitNode.x, gitNode.y,
          claudeNode.x, claudeNode.y,
          'right-down'
        );
        connections.push({
          type: 'branch',
          d: path,
          fromNode: gitNode,
          toNode: claudeNode,
        });
      }

      // Check for Claude → Claude vertical connection
      // Find the Git node for this Claude node to check commit order
      const currentGitIndex = gitNodes.findIndex(gn => gn.commit?.commit_sha === claudeNode.commit?.commit_sha);

      if (currentGitIndex > 0) {
        // Look for the previous Git commit (parent)
        const currentCommit = gitNodes[currentGitIndex].commit;
        if (currentCommit?.parent_sha) {
          // Find Claude node for the parent commit
          const parentClaudeNode = claudeNodes.find(cn =>
            cn.commit?.commit_sha === currentCommit.parent_sha
          );

          // Only connect if: same context_id AND actually parent-child in Git
          if (!claudeNode.context.new_session && parentClaudeNode &&
              parentClaudeNode.context?.context_id === claudeNode.context.context_id) {
            // Claude → Claude: Vertical connection for continuing session
            connections.push({
              type: 'vertical',
              d: `M ${parentClaudeNode.x} ${parentClaudeNode.y} L ${claudeNode.x} ${claudeNode.y}`,
              fromNode: parentClaudeNode,
              toNode: claudeNode,
            });
          }
        }
      }

      // Check for Claude → Git merge connection
      // This happens when a session ends (next commit has new_session: true or no context)
      if (i < claudeNodes.length - 1 || i === claudeNodes.length - 1) {
        const nextCommitIndex = gitNodes.findIndex(gn => gn.commit?.commit_sha === claudeNode.commit?.commit_sha) + 1;

        if (nextCommitIndex < gitNodes.length) {
          const nextGitNode = gitNodes[nextCommitIndex];
          const nextClaudeNode = claudeNodes.find(cn => cn.commit?.commit_sha === nextGitNode.commit?.commit_sha);

          // Session ends if: next has no Claude context OR next starts a new session
          if (!nextClaudeNode || nextClaudeNode.context?.new_session) {
            // Claude → Git: Merge connection when session ends
            const path = this.generateCurvePath(
              claudeNode.x, claudeNode.y,
              nextGitNode.x, nextGitNode.y,
              'left-down'
            );
            connections.push({
              type: 'merge',
              d: path,
              fromNode: claudeNode,
              toNode: nextGitNode,
            });
          }
        }
      }
    }

    return connections;
  }

  /**
   * Generate SVG path between two points
   */
  private generatePath(
    x1: number, y1: number,
    x2: number, y2: number,
    straight: boolean
  ): string {
    if (straight) {
      // Straight vertical line
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    } else {
      // Bezier curve for branch connections
      const controlPointY = (y1 + y2) / 2;
      return `M ${x1} ${y1} C ${x1} ${controlPointY}, ${x2} ${controlPointY}, ${x2} ${y2}`;
    }
  }

  /**
   * Generate curved path for Claude connections
   */
  private generateCurvePath(
    x1: number, y1: number,
    x2: number, y2: number,
    direction: 'right-down' | 'left-down'
  ): string {
    if (direction === 'right-down') {
      // Git → Claude: Curve right and down
      const controlX = x1 + (x2 - x1) * 0.5;
      const controlY = y1;
      return `M ${x1} ${y1} Q ${controlX} ${controlY}, ${x2} ${y2}`;
    } else {
      // Claude → Git: Curve left and down
      const controlX = x1 - (x1 - x2) * 0.5;
      const controlY = y1;
      return `M ${x1} ${y1} Q ${controlX} ${controlY}, ${x2} ${y2}`;
    }
  }

  /**
   * Calculate viewport bounds for the graph
   */
  getViewportBounds(layoutState: LayoutState): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  } {
    const minX = this.config.origin.x - this.config.padding.left;
    const minY = this.config.origin.y - this.config.padding.top;
    const maxX = this.config.origin.x +
      (layoutState.maxLane * this.config.nodeSpacing.horizontal) +
      this.config.nodeSpacing.horizontal * 3 + // Space for Claude nodes
      this.config.padding.right;
    const maxY = this.config.origin.y +
      (layoutState.maxDepth * this.config.nodeSpacing.vertical) +
      this.config.padding.bottom;

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }
}

// Export singleton instance
export const graphLayoutEngine = new GraphLayoutEngine();