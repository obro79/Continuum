'use client';

import { useMemo } from 'react';
import { GitCommit } from '@/lib/types/git-graph';
import { calculateGraphLayout, calculateViewBox } from '@/lib/utils/graph-layout';
import { GitNode } from './GitNode';
import { ClaudeNode } from './ClaudeNode';
import { GitTimeline } from './GitTimeline';
import { ConnectionLine } from './ConnectionLine';

interface GitGraphVisualizationProps {
  commits: GitCommit[];
  selectedCommitSha?: string | null;
  onClaudeNodeClick?: (commitSha: string) => void;
  onGitNodeClick?: (commitSha: string) => void;
}

export function GitGraphVisualization({
  commits,
  selectedCommitSha = null,
  onClaudeNodeClick,
  onGitNodeClick
}: GitGraphVisualizationProps) {
  const graphData = useMemo(() => calculateGraphLayout(commits), [commits]);
  const viewBox = useMemo(() => calculateViewBox(commits), [commits]);

  return (
    <svg
      viewBox={viewBox}
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Layer 1: Git timeline (back) */}
      <GitTimeline gitNodes={graphData.gitNodes} />

      {/* Layer 2: Connection lines (middle) */}
      {graphData.connections.map((connection, index) => (
        <ConnectionLine key={`connection-${index}`} connection={connection} />
      ))}

      {/* Layer 3: Nodes (front) */}
      {graphData.gitNodes.map((node, index) => (
        <GitNode
          key={`git-${index}`}
          node={node}
          isSelected={node.commit?.commit_sha === selectedCommitSha}
          onSelect={onGitNodeClick}
        />
      ))}
      {graphData.claudeNodes.map((node, index) => (
        <ClaudeNode
          key={`claude-${index}`}
          node={node}
          isSelected={node.commit?.commit_sha === selectedCommitSha}
          onSelect={onClaudeNodeClick}
        />
      ))}
    </svg>
  );
}
