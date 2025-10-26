'use client';

import { memo, useState } from 'react';
import { GraphNode as GraphNodeType } from '@/lib/types/git-graph';
import { GraphConfig } from '@/lib/config/graph-config';

interface GraphNodeProps {
  node: GraphNodeType;
  isSelected?: boolean;
  onSelect?: (commitSha: string) => void;
  scale?: number;
}

export const GraphNode = memo(function GraphNode({
  node,
  isSelected = false,
  onSelect,
  scale = 1,
}: GraphNodeProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!node.commit) return null;

  const config = GraphConfig;
  const isClaudeNode = node.type === 'claude';

  // Determine colors based on node type
  const fillColor = isClaudeNode
    ? config.colors.nodes.claude
    : config.colors.nodes.git;

  const strokeColor = isClaudeNode
    ? config.colors.nodes.claudeStroke
    : config.colors.nodes.gitStroke;

  const glowColor = isClaudeNode
    ? (isSelected ? config.colors.states.claudeSelected : config.colors.states.claudeHover)
    : (isSelected ? config.colors.states.selected : config.colors.states.hover);

  // Calculate dynamic radius based on state
  let radius = config.layout.nodeSizes.default;
  if (isSelected) radius = config.layout.nodeSizes.selected;
  else if (isHovered) radius = config.layout.nodeSizes.hover;

  // Adjust for zoom level to maintain consistent visual size
  const visualRadius = radius / Math.sqrt(scale);
  const strokeWidth = (isSelected ? 4 : 3) / Math.sqrt(scale);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSelect && node.commit) {
      onSelect(node.commit.commit_sha);
    }
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  return (
    <g
      className="graph-node"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        cursor: 'pointer',
        transition: `all ${config.animation.duration.nodeTransition}ms ${config.animation.easing.smooth}`,
      }}
    >
      {/* Glow effect for hover/selected state */}
      {(isHovered || isSelected) && (
        <circle
          cx={node.x}
          cy={node.y}
          r={visualRadius + 8 / Math.sqrt(scale)}
          fill={glowColor}
          opacity={0.3}
          style={{
            transition: `all ${config.animation.duration.hover}ms ${config.animation.easing.smooth}`,
          }}
        />
      )}

      {/* Main node circle */}
      <circle
        cx={node.x}
        cy={node.y}
        r={visualRadius}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        style={{
          transition: `all ${config.animation.duration.nodeTransition}ms ${config.animation.easing.smooth}`,
          filter: isSelected ? 'drop-shadow(0 0 8px rgba(0, 0, 0, 0.2))' : undefined,
        }}
      />

      {/* Inner highlight for depth */}
      <circle
        cx={node.x}
        cy={node.y - visualRadius * 0.3}
        r={visualRadius * 0.4}
        fill="white"
        opacity={0.3}
        pointerEvents="none"
      />

      {/* Commit SHA label for Git nodes */}
      {!isClaudeNode && (
        <text
          x={node.x}
          y={node.y - visualRadius - 8 / Math.sqrt(scale)}
          textAnchor="middle"
          dominantBaseline="text-after-edge"
          fill={fillColor}
          fontSize={config.text.commitSha.fontSize / Math.sqrt(scale)}
          fontFamily={config.text.commitSha.fontFamily}
          fontWeight="600"
          style={{
            transition: `all ${config.animation.duration.hover}ms ${config.animation.easing.smooth}`,
            opacity: isHovered || isSelected ? 1 : 0.8,
          }}
        >
          {node.commit.commit_sha_short}
        </text>
      )}

      {/* Context indicator for Claude nodes */}
      {isClaudeNode && node.context && (
        <>
          <text
            x={node.x}
            y={node.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={14 / Math.sqrt(scale)}
            fontWeight="bold"
            pointerEvents="none"
          >
            AI
          </text>
          {(isHovered || isSelected) && (
            <text
              x={node.x}
              y={node.y + visualRadius + 12 / Math.sqrt(scale)}
              textAnchor="middle"
              dominantBaseline="text-before-edge"
              fill={fillColor}
              fontSize={config.text.labels.fontSize / Math.sqrt(scale)}
              fontFamily={config.text.commitSha.fontFamily}
              opacity={0.9}
            >
              {node.context.total_messages} messages
            </text>
          )}
        </>
      )}

      {/* Commit message tooltip on hover */}
      {isHovered && !isClaudeNode && (
        <foreignObject
          x={node.x - 100}
          y={node.y + visualRadius + 15 / Math.sqrt(scale)}
          width={200}
          height={50}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              padding: '6px 10px',
              borderRadius: '4px',
              fontSize: `${12 / Math.sqrt(scale)}px`,
              textAlign: 'center',
              wordBreak: 'break-word',
              maxHeight: '50px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {node.commit.commit_message.substring(0, config.text.commitMessage.maxLength)}
            {node.commit.commit_message.length > config.text.commitMessage.maxLength && '...'}
          </div>
        </foreignObject>
      )}
    </g>
  );
});