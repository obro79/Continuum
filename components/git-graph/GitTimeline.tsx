import { GraphNode } from '@/lib/types/git-graph';
import { LAYOUT_CONFIG } from '@/lib/utils/graph-layout';

interface GitTimelineProps {
  gitNodes: GraphNode[];
}

export function GitTimeline({ gitNodes }: GitTimelineProps) {
  if (gitNodes.length === 0) return null;

  const firstNode = gitNodes[0];
  const lastNode = gitNodes[gitNodes.length - 1];

  return (
    <line
      x1={LAYOUT_CONFIG.GIT_X}
      y1={firstNode.y}
      x2={LAYOUT_CONFIG.GIT_X}
      y2={lastNode.y}
      stroke={LAYOUT_CONFIG.GIT_COLOR}
      strokeWidth={2}
      className="git-timeline"
    />
  );
}
