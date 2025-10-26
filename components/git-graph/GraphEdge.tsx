'use client';

import { memo } from 'react';
import { ConnectionPath } from '@/lib/types/git-graph';
import { GraphConfig } from '@/lib/config/graph-config';

interface GraphEdgeProps {
  connection: ConnectionPath;
  scale?: number;
}

export const GraphEdge = memo(function GraphEdge({
  connection,
  scale = 1,
}: GraphEdgeProps) {
  const config = GraphConfig;

  // Determine edge color based on connection type
  const strokeColor = connection.toNode.type === 'claude'
    ? config.colors.connections.claude
    : connection.type === 'merge'
    ? config.colors.connections.merge
    : config.colors.connections.default;

  // Adjust stroke width for zoom level
  const strokeWidth = config.colors.connections.strokeWidth / Math.sqrt(scale);

  // Add arrow marker for directional flow (optional)
  const markerId = `arrow-${connection.type}-${strokeColor.replace('#', '')}`;

  return (
    <>
      {/* Define arrow markers for directional flow */}
      <defs>
        <marker
          id={markerId}
          markerWidth={10 / Math.sqrt(scale)}
          markerHeight={10 / Math.sqrt(scale)}
          refX={8}
          refY={3}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon
            points="0,0 0,6 9,3"
            fill={strokeColor}
            opacity={0.6}
          />
        </marker>
      </defs>

      {/* Main connection path */}
      <path
        d={connection.d}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
        style={{
          transition: `all ${config.animation.duration.nodeTransition}ms ${config.animation.easing.smooth}`,
        }}
        className={`graph-edge edge-${connection.type}`}
        markerMid={connection.type === 'branch' ? `url(#${markerId})` : undefined}
      />

      {/* Animated flow indicator for active branches */}
      {connection.type === 'vertical' && (
        <path
          d={connection.d}
          stroke={strokeColor}
          strokeWidth={strokeWidth * 2}
          fill="none"
          opacity={0.2}
          strokeDasharray={`${5 / Math.sqrt(scale)} ${10 / Math.sqrt(scale)}`}
          strokeLinecap="round"
          className="flow-animation"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to={15 / Math.sqrt(scale)}
            dur="2s"
            repeatCount="indefinite"
          />
        </path>
      )}
    </>
  );
});