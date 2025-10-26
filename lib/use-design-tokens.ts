/**
 * Utilities and hooks for using design tokens in React components
 */

import { designTokens } from './design-tokens';

/**
 * Get a design token value by path
 * @example
 * getToken('colors.accent.coral') // returns '#E8A598'
 * getToken('spacing.padding.lg') // returns '16px'
 */
export function getToken(path: string): string {
  const keys = path.split('.');
  let value: any = designTokens;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      console.warn(`Design token path not found: ${path}`);
      return '';
    }
  }

  return typeof value === 'string' ? value : '';
}

/**
 * Create inline styles from design tokens
 * @example
 * const styles = createStyles({
 *   color: 'colors.text.primary',
 *   padding: 'spacing.padding.lg',
 *   borderRadius: 'borderRadius.lg'
 * });
 */
export function createStyles(
  tokenMap: Record<string, string>
): React.CSSProperties {
  const styles: Record<string, string> = {};

  for (const [cssProperty, tokenPath] of Object.entries(tokenMap)) {
    const value = getToken(tokenPath);
    if (value) {
      styles[cssProperty] = value;
    }
  }

  return styles as React.CSSProperties;
}

/**
 * Get responsive spacing value
 * @example
 * getSpacing('lg') // returns '16px'
 * getSpacing(4) // returns '16px'
 */
export function getSpacing(size: keyof typeof designTokens.spacing | number): string {
  if (typeof size === 'number') {
    return designTokens.spacing[size as keyof typeof designTokens.spacing] || '0';
  }
  return designTokens.spacing[size] || '0';
}

/**
 * Get color value from design tokens
 * @example
 * getColor('accent.coral') // returns '#E8A598'
 * getColor('text.primary') // returns '#1A1A1A'
 */
export function getColor(path: string): string {
  return getToken(`colors.${path}`);
}

/**
 * Get typography value
 * @example
 * getTypography('fontSize.lg') // returns '18px'
 * getTypography('fontWeight.bold') // returns '700'
 */
export function getTypography(path: string): string {
  return getToken(`typography.${path}`);
}

/**
 * Get shadow value
 * @example
 * getShadow('input') // returns '0 1px 3px rgba(0, 0, 0, 0.06)'
 */
export function getShadow(name: keyof typeof designTokens.shadows): string {
  return designTokens.shadows[name] || designTokens.shadows.none;
}

/**
 * Get border radius value
 * @example
 * getBorderRadius('lg') // returns '8px'
 */
export function getBorderRadius(size: keyof typeof designTokens.borderRadius): string {
  return designTokens.borderRadius[size] || designTokens.borderRadius.none;
}

/**
 * Helper to create CSS variable references
 * @example
 * cssVar('claude-code-accent-coral') // returns 'var(--claude-code-accent-coral)'
 */
export function cssVar(name: string): string {
  return `var(--${name})`;
}

/**
 * Create a className string with design token-based inline styles
 * Useful for dynamic styling with Tailwind
 */
export function withTokenStyles(
  className: string,
  tokenStyles?: Record<string, string>
): { className: string; style?: React.CSSProperties } {
  if (!tokenStyles) {
    return { className };
  }

  return {
    className,
    style: createStyles(tokenStyles),
  };
}

// Export design tokens for direct access
export { designTokens };

// Type exports
export type ColorPath =
  | `accent.${keyof typeof designTokens.colors.accent}`
  | `text.${keyof typeof designTokens.colors.text}`
  | `background.${keyof typeof designTokens.colors.background}`
  | `border.${keyof typeof designTokens.colors.border}`;

export type TypographyPath =
  | `fontSize.${keyof typeof designTokens.typography.fontSize}`
  | `fontWeight.${keyof typeof designTokens.typography.fontWeight}`
  | `fontFamily.${keyof typeof designTokens.typography.fontFamily}`;