/**
 * Design Tokens extracted from Claude Code UI
 * Based on the official Claude Code interface design
 */

export const designTokens = {
  colors: {
    // Primary backgrounds
    background: {
      primary: '#F5F3F0',      // Main cream/beige background
      secondary: '#E8E5E0',    // Slightly darker beige for containers
      tertiary: '#FFFFFF',     // Pure white for inputs/cards
    },

    // Text colors
    text: {
      primary: '#1A1A1A',      // Near black for main text
      secondary: '#6B6B6B',    // Medium gray for secondary text
      tertiary: '#999999',     // Light gray for placeholder text
      muted: '#767676',        // Muted text
    },

    // Accent colors - Claude Code specific
    accent: {
      coral: '#E8A598',        // Coral/salmon pink for primary actions
      coralHover: '#E09486',   // Hover state
      coralActive: '#D88374',  // Active state
      orange: '#D97757',       // Orange for icons/decorative
      orangeDark: '#8B4513',   // Dark orange for emphasis
    },

    // Border colors
    border: {
      default: '#D9D6D1',      // Light gray borders
      subtle: '#E8E5E0',       // Very subtle borders
      input: '#D9D6D1',        // Input field borders
    },

    // State colors
    state: {
      hover: 'rgba(0, 0, 0, 0.04)',
      active: 'rgba(0, 0, 0, 0.08)',
      focus: 'rgba(232, 165, 152, 0.2)',
      disabled: 'rgba(107, 107, 107, 0.5)',
    },
  },

  typography: {
    // Font families
    fontFamily: {
      brand: 'Georgia, "Times New Roman", serif',
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
      mono: '"SF Mono", "Monaco", "Cascadia Code", "Courier New", monospace',
    },

    // Font sizes
    fontSize: {
      xs: '12px',              // Small labels, badges
      sm: '14px',              // Body text, empty states
      base: '16px',            // Input text, regular content
      lg: '18px',              // Subheadings
      xl: '20px',              // Headings
      '2xl': '24px',           // Logo, page titles
      '3xl': '30px',           // Large headings
      '4xl': '36px',           // Hero text
    },

    // Line heights
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
      loose: '2',
    },

    // Font weights
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },

    // Letter spacing
    letterSpacing: {
      tight: '-0.01em',
      normal: '0',
      wide: '0.01em',
      wider: '0.02em',
    },
  },

  spacing: {
    // Spacing scale
    0: '0',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',

    // Semantic spacing
    padding: {
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
      '2xl': '32px',
    },
    margin: {
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
      '2xl': '32px',
    },
    gap: {
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
    },
  },

  borderRadius: {
    none: '0',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    full: '9999px',

    // Semantic border radius
    button: '8px',
    input: '12px',
    card: '12px',
    badge: '6px',
    avatar: '50%',
  },

  shadows: {
    none: 'none',
    xs: '0 1px 2px rgba(0, 0, 0, 0.04)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.06)',
    md: '0 2px 8px rgba(0, 0, 0, 0.08)',
    lg: '0 4px 16px rgba(0, 0, 0, 0.10)',
    xl: '0 8px 32px rgba(0, 0, 0, 0.12)',

    // Semantic shadows
    input: '0 1px 3px rgba(0, 0, 0, 0.06)',
    dropdown: '0 2px 8px rgba(0, 0, 0, 0.08)',
    modal: '0 8px 32px rgba(0, 0, 0, 0.12)',
    button: '0 1px 2px rgba(0, 0, 0, 0.04)',
  },

  layout: {
    // Sidebar
    sidebar: {
      width: '370px',
      minWidth: '280px',
      maxWidth: '480px',
    },

    // Content
    content: {
      maxWidth: '1200px',
      padding: '24px',
    },

    // Breakpoints
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },

  icons: {
    size: {
      xs: '12px',
      sm: '16px',
      md: '20px',
      lg: '24px',
      xl: '32px',
      '2xl': '48px',
      decorative: '80px',
    },
  },

  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    overlay: 30,
    modal: 40,
    popover: 50,
    tooltip: 60,
  },

  transitions: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
    },
    timing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  opacity: {
    disabled: '0.5',
    hover: '0.9',
    muted: '0.7',
  },
} as const;

// Type exports for better TypeScript support
export type DesignTokens = typeof designTokens;
export type ColorTokens = typeof designTokens.colors;
export type TypographyTokens = typeof designTokens.typography;
export type SpacingTokens = typeof designTokens.spacing;