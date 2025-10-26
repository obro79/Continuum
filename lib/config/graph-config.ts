/**
 * Git Graph Configuration
 * All configuration values in one place with semantic naming.
 * No magic numbers - every value has a clear purpose.
 */

import { designTokens } from '@/lib/design-tokens';

export const GraphConfig = {
  // Layout configuration
  layout: {
    // Node spacing - based on design tokens for consistency
    nodeSpacing: {
      vertical: parseInt(designTokens.spacing[20]) * 2, // 160px - comfortable vertical spacing
      horizontal: parseInt(designTokens.spacing[16]), // 64px - lane separation
    },

    // Node sizes
    nodeSizes: {
      default: parseInt(designTokens.spacing[5]), // 20px radius
      selected: parseInt(designTokens.spacing[6]), // 24px radius when selected
      hover: parseInt(designTokens.spacing[5]) * 1.1, // 22px on hover
    },

    // Graph padding
    padding: {
      top: parseInt(designTokens.spacing[12]), // 48px
      bottom: parseInt(designTokens.spacing[20]), // 80px
      left: parseInt(designTokens.spacing[10]), // 40px
      right: parseInt(designTokens.spacing[10]), // 40px
    },

    // Starting position for first node
    origin: {
      x: 200, // Start nodes away from left edge
      y: 100, // Start with some top padding
    },

    // Lane management
    lanes: {
      maxWidth: 8, // Maximum number of parallel branches
      defaultLane: 0, // Main branch lane
    },
  },

  // Visual configuration
  colors: {
    // Node colors - preserving the blue and orange as requested
    nodes: {
      git: '#3b82f6', // Blue for Git commits
      claude: designTokens.colors.accent.orange, // Orange for Claude contexts
      gitStroke: '#ffffff', // White stroke for contrast
      claudeStroke: '#ffffff',
    },

    // Connection lines
    connections: {
      default: '#3b82f6', // Blue for git connections
      claude: designTokens.colors.accent.orange, // Orange tint for Claude connections
      merge: '#6366f1', // Slightly different blue for merges
      strokeWidth: 3,
    },

    // Interactive states
    states: {
      hover: 'rgba(59, 130, 246, 0.1)', // Blue glow on hover
      selected: 'rgba(59, 130, 246, 0.2)', // Stronger glow when selected
      claudeHover: 'rgba(217, 119, 87, 0.1)', // Orange glow for Claude nodes
      claudeSelected: 'rgba(217, 119, 87, 0.2)',
    },

    // Background
    background: 'transparent',
    grid: 'rgba(0, 0, 0, 0.03)', // Subtle grid pattern
  },

  // Animation configuration
  animation: {
    // Transition durations (in ms)
    duration: {
      zoom: 200,
      pan: 100,
      hover: 150,
      nodeTransition: 200,
    },

    // Easing functions
    easing: {
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  // Zoom/Pan configuration
  interaction: {
    zoom: {
      min: 0.25, // 25% minimum zoom
      max: 4, // 400% maximum zoom
      step: 0.1, // Zoom increment
      wheelSensitivity: 0.002,
      pinchSensitivity: 0.01,
      default: 1, // Start at 100%
    },

    pan: {
      smoothing: true,
      velocity: 1.2,
      friction: 0.92,
      boundaries: false, // Allow unlimited panning
    },

    // Keyboard shortcuts
    keyboard: {
      enabled: true,
      panSpeed: 50, // pixels per key press
      zoomSpeed: 0.1, // zoom increment per key press
    },
  },

  // Performance configuration
  performance: {
    // Viewport culling
    culling: {
      enabled: true,
      margin: 100, // Render nodes 100px outside viewport
    },

    // Throttling/debouncing
    throttle: {
      zoom: 16, // ~60fps
      pan: 16,
      resize: 200,
    },

    // Maximum nodes to render with full detail
    maxDetailedNodes: 500,
    maxTotalNodes: 2000,
  },

  // Text configuration
  text: {
    commitSha: {
      fontSize: parseInt(designTokens.typography.fontSize.sm), // 14px
      fontFamily: designTokens.typography.fontFamily.mono,
      maxLength: 7, // Show 7 characters of SHA
    },

    commitMessage: {
      fontSize: parseInt(designTokens.typography.fontSize.sm),
      fontFamily: designTokens.typography.fontFamily.sans,
      maxLength: 50, // Truncate long messages
    },

    labels: {
      fontSize: parseInt(designTokens.typography.fontSize.xs), // 12px
      padding: parseInt(designTokens.spacing[2]), // 8px
    },
  },

  // Controls configuration
  controls: {
    position: 'top-right' as const,
    margin: parseInt(designTokens.spacing[4]), // 16px from edges
    buttonSize: parseInt(designTokens.spacing[10]), // 40px buttons
    opacity: 0.9,
    showMinimap: true,
    showZoomControls: true,
    showResetButton: true,
  },
} as const;

// Type exports for TypeScript
export type GraphConfigType = typeof GraphConfig;
export type LayoutConfig = typeof GraphConfig.layout;
export type ColorConfig = typeof GraphConfig.colors;
export type InteractionConfig = typeof GraphConfig.interaction;