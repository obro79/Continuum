import { GraphNode } from '@/lib/types/git-graph';
import { LAYOUT_CONFIG } from '@/lib/utils/graph-layout';

interface ClaudeNodeProps {
  node: GraphNode;
  isSelected?: boolean;
  onSelect?: (commitSha: string) => void;
}

export function ClaudeNode({ node, isSelected = false, onSelect }: ClaudeNodeProps) {
  if (!node.context || !node.commit) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSelect && node.commit) {
      onSelect(node.commit.commit_sha);
    }
  };

  const radius = isSelected ? LAYOUT_CONFIG.NODE_RADIUS * 1.2 : LAYOUT_CONFIG.NODE_RADIUS;
  const strokeWidth = isSelected ? 4 : 2;

  return (
    <g
      className="claude-node cursor-pointer transition-all duration-200 hover:opacity-80"
      onClick={handleClick}
    >
      {/* Orange circle */}
      <circle
        cx={node.x}
        cy={node.y}
        r={radius}
        fill={LAYOUT_CONFIG.CLAUDE_COLOR}
        stroke="white"
        strokeWidth={strokeWidth}
        style={{
          transition: 'all 0.2s ease-in-out',
        }}
      />
      {isSelected && (
        /* Outer glow ring for selected state */
        <circle
          cx={node.x}
          cy={node.y}
          r={radius + 4}
          fill="none"
          stroke={LAYOUT_CONFIG.CLAUDE_COLOR}
          strokeWidth={2}
          opacity={0.5}
        />
      )}
    </g>
  );
}
