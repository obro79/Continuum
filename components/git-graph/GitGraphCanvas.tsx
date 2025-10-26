'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch';
import { GitCommit } from '@/lib/types/git-graph';
import { graphLayoutEngine } from '@/lib/utils/graph-layout-engine';
import { GraphNode } from './GraphNode';
import { GraphEdge } from './GraphEdge';
import { GraphConfig } from '@/lib/config/graph-config';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  Move,
} from 'lucide-react';

interface GitGraphCanvasProps {
  commits: GitCommit[];
  selectedCommitSha?: string | null;
  onClaudeNodeClick?: (commitSha: string) => void;
  onGitNodeClick?: (commitSha: string) => void;
}

export function GitGraphCanvas({
  commits,
  selectedCommitSha = null,
  onClaudeNodeClick,
  onGitNodeClick,
}: GitGraphCanvasProps) {
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentScale, setCurrentScale] = useState(1);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  const config = GraphConfig;

  // Calculate graph layout
  const graphData = useMemo(
    () => graphLayoutEngine.calculateLayout(commits),
    [commits]
  );

  // Get viewport bounds
  const viewportBounds = useMemo(() => {
    if (commits.length === 0) {
      return { minX: 0, minY: 0, width: 800, height: 600 };
    }

    // Build layout state for bounds calculation
    const layoutState = {
      nodes: new Map(),
      lanes: new Map(),
      maxLane: 0,
      maxDepth: commits.length - 1,
    };

    // Simple approximation for viewport bounds
    const maxLanes = Math.min(8, new Set(commits.map(c => c.branches?.[0] || 'main')).size);
    return {
      minX: 0,
      minY: 0,
      width: config.layout.origin.x + (maxLanes * config.layout.nodeSpacing.horizontal) + 400,
      height: config.layout.origin.y + (commits.length * config.layout.nodeSpacing.vertical) + 200,
    };
  }, [commits, config]);

  // Handle container resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Handle node selection
  const handleNodeClick = useCallback((commitSha: string) => {
    const node = graphData.gitNodes.find(n => n.commit?.commit_sha === commitSha)
      || graphData.claudeNodes.find(n => n.commit?.commit_sha === commitSha);

    if (node) {
      if (node.type === 'claude' && onClaudeNodeClick) {
        onClaudeNodeClick(commitSha);
      } else if (node.type === 'git' && onGitNodeClick) {
        onGitNodeClick(commitSha);
      }
    }
  }, [graphData, onClaudeNodeClick, onGitNodeClick]);

  // Control functions
  const handleZoomIn = () => transformRef.current?.zoomIn();
  const handleZoomOut = () => transformRef.current?.zoomOut();
  const handleReset = () => transformRef.current?.resetTransform();

  const handleFitToView = () => {
    if (transformRef.current && containerRef.current) {
      const padding = 50;
      const scaleX = (containerSize.width - padding * 2) / viewportBounds.width;
      const scaleY = (containerSize.height - padding * 2) / viewportBounds.height;
      const scale = Math.min(scaleX, scaleY, 1);

      transformRef.current.setTransform(
        containerSize.width / 2 - (viewportBounds.width * scale) / 2,
        containerSize.height / 2 - (viewportBounds.height * scale) / 2,
        scale
      );
    }
  };

  // Viewport culling for performance
  const visibleNodes = useMemo(() => {
    if (!config.performance.culling.enabled || graphData.gitNodes.length < 100) {
      return { gitNodes: graphData.gitNodes, claudeNodes: graphData.claudeNodes };
    }

    // TODO: Implement actual viewport culling based on transform state
    // For now, return all nodes
    return { gitNodes: graphData.gitNodes, claudeNodes: graphData.claudeNodes };
  }, [graphData, config]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-background overflow-hidden">
      {/* Controls overlay */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {config.controls.showZoomControls && (
          <>
            <button
              onClick={handleZoomIn}
              className="p-2 bg-card border border-border rounded-lg shadow-sm hover:bg-accent transition-colors"
              aria-label="Zoom in"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 bg-card border border-border rounded-lg shadow-sm hover:bg-accent transition-colors"
              aria-label="Zoom out"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleFitToView}
              className="p-2 bg-card border border-border rounded-lg shadow-sm hover:bg-accent transition-colors"
              aria-label="Fit to view"
              title="Fit to view"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </>
        )}
        {config.controls.showResetButton && (
          <button
            onClick={handleReset}
            className="p-2 bg-card border border-border rounded-lg shadow-sm hover:bg-accent transition-colors"
            aria-label="Reset view"
            title="Reset view"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 text-xs text-muted-foreground bg-card/80 backdrop-blur px-3 py-2 rounded-lg">
        <Move className="w-3 h-3" />
        <span>Drag to pan • Scroll to zoom • Click nodes to select</span>
      </div>

      {/* Main graph canvas */}
      <TransformWrapper
        ref={transformRef}
        initialScale={config.interaction.zoom.default}
        minScale={config.interaction.zoom.min}
        maxScale={config.interaction.zoom.max}
        limitToBounds={false}
        centerOnInit={true}
        onTransformed={(_, state) => setCurrentScale(state.scale)}
        wheel={{
          step: config.interaction.zoom.step,
          smoothStep: config.interaction.zoom.wheelSensitivity,
          wheelDisabled: false,
          touchPadDisabled: false,
        }}
        pinch={{
          step: config.interaction.zoom.pinchSensitivity,
        }}
        panning={{
          disabled: false,
          velocityDisabled: !config.interaction.pan.smoothing,
        }}
        doubleClick={{
          mode: 'zoomIn',
          step: 0.5,
        }}
      >
        <TransformComponent
          wrapperStyle={{
            width: '100%',
            height: '100%',
          }}
          contentStyle={{
            width: '100%',
            height: '100%',
          }}
        >
          <svg
            width={viewportBounds.width}
            height={viewportBounds.height}
            className="select-none"
            style={{
              minWidth: viewportBounds.width,
              minHeight: viewportBounds.height,
            }}
          >
            {/* Background pattern */}
            <defs>
              <pattern
                id="grid-pattern"
                width={config.layout.nodeSpacing.horizontal}
                height={config.layout.nodeSpacing.vertical}
                patternUnits="userSpaceOnUse"
              >
                <circle
                  cx={config.layout.nodeSpacing.horizontal / 2}
                  cy={config.layout.nodeSpacing.vertical / 2}
                  r="1"
                  fill={config.colors.grid}
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" opacity={0.5} />

            {/* Render edges first (behind nodes) */}
            <g className="graph-edges">
              {graphData.connections.map((connection, index) => (
                <GraphEdge
                  key={`edge-${index}`}
                  connection={connection}
                  scale={currentScale}
                />
              ))}
            </g>

            {/* Render nodes on top */}
            <g className="graph-nodes">
              {visibleNodes.gitNodes.map((node, index) => (
                <GraphNode
                  key={`git-${node.commit?.commit_sha || index}`}
                  node={node}
                  isSelected={node.commit?.commit_sha === selectedCommitSha}
                  onSelect={handleNodeClick}
                  scale={currentScale}
                />
              ))}
              {visibleNodes.claudeNodes.map((node, index) => (
                <GraphNode
                  key={`claude-${node.commit?.commit_sha || index}`}
                  node={node}
                  isSelected={node.commit?.commit_sha === selectedCommitSha}
                  onSelect={handleNodeClick}
                  scale={currentScale}
                />
              ))}
            </g>
          </svg>
        </TransformComponent>
      </TransformWrapper>

      {/* Loading state */}
      {commits.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground">No commits to display</p>
        </div>
      )}
    </div>
  );
}