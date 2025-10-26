# Design Tokens - Claude Code UI

This directory contains design tokens extracted from the Claude Code interface. These tokens provide a consistent design language across your application.

## Files

- **`design-tokens.ts`** - Core design token definitions
- **`use-design-tokens.ts`** - Utility functions and helpers for using tokens in React

## Usage

### 1. Using CSS Variables (Recommended for Tailwind)

The design tokens are also available as CSS variables in `app/globals.css`:

```tsx
// Using Tailwind with CSS variables
<div className="bg-[var(--claude-code-bg-primary)]">
  <button className="text-[var(--claude-code-accent-coral)]">
    Click me
  </button>
</div>
```

### 2. Using Design Token Utilities

```tsx
import { getColor, getSpacing, getBorderRadius } from '@/lib/use-design-tokens';

function MyComponent() {
  return (
    <div style={{
      backgroundColor: getColor('background.primary'),
      padding: getSpacing('lg'),
      borderRadius: getBorderRadius('xl'),
    }}>
      Content
    </div>
  );
}
```

### 3. Using Token Helpers

```tsx
import { createStyles, withTokenStyles } from '@/lib/use-design-tokens';

// Create styles object
const styles = createStyles({
  color: 'colors.text.primary',
  padding: 'spacing.padding.lg',
  borderRadius: 'borderRadius.lg'
});

// Or use with className
const props = withTokenStyles('flex items-center', {
  color: 'colors.accent.coral',
  gap: 'spacing.gap.md'
});

<div {...props}>Content</div>
```

### 4. Direct Token Access

```tsx
import { designTokens } from '@/lib/design-tokens';

const coral = designTokens.colors.accent.coral; // '#E8A598'
const largePadding = designTokens.spacing.padding.lg; // '16px'
```

## Design Token Categories

### Colors

#### Backgrounds
- `background.primary` - `#F5F3F0` - Main cream/beige background
- `background.secondary` - `#E8E5E0` - Container backgrounds
- `background.tertiary` - `#FFFFFF` - Inputs and cards

#### Text
- `text.primary` - `#1A1A1A` - Main text
- `text.secondary` - `#6B6B6B` - Secondary text
- `text.tertiary` - `#999999` - Placeholder text

#### Accents
- `accent.coral` - `#E8A598` - Primary actions (buttons, links)
- `accent.coralHover` - `#E09486` - Hover state
- `accent.coralActive` - `#D88374` - Active state
- `accent.orange` - `#D97757` - Icons and decorative elements

#### Borders
- `border.default` - `#D9D6D1` - Standard borders
- `border.subtle` - `#E8E5E0` - Subtle dividers

### Typography

#### Font Families
- `fontFamily.brand` - Serif for branding (Georgia)
- `fontFamily.sans` - System sans-serif stack
- `fontFamily.mono` - Monospace for code

#### Font Sizes
- `fontSize.xs` - `12px` - Small labels
- `fontSize.sm` - `14px` - Body text
- `fontSize.base` - `16px` - Regular content
- `fontSize.lg` - `18px` - Subheadings
- `fontSize.2xl` - `24px` - Page titles

#### Font Weights
- `fontWeight.normal` - `400`
- `fontWeight.medium` - `500`
- `fontWeight.semibold` - `600`
- `fontWeight.bold` - `700`

### Spacing

#### Padding
- `padding.xs` - `4px`
- `padding.sm` - `8px`
- `padding.md` - `12px`
- `padding.lg` - `16px`
- `padding.xl` - `24px`

#### Margin & Gap
Same values as padding, accessible via `margin.*` and `gap.*`

### Border Radius

- `borderRadius.sm` - `4px`
- `borderRadius.md` - `6px`
- `borderRadius.lg` - `8px`
- `borderRadius.xl` - `12px`
- `borderRadius.full` - `9999px` (fully rounded)

#### Semantic Border Radius
- `borderRadius.button` - `8px`
- `borderRadius.input` - `12px`
- `borderRadius.card` - `12px`
- `borderRadius.badge` - `6px`

### Shadows

- `shadows.xs` - Subtle shadow for buttons
- `shadows.sm` - Input field shadows
- `shadows.md` - Dropdown menus
- `shadows.lg` - Modal overlays

#### Semantic Shadows
- `shadows.input` - For form inputs
- `shadows.dropdown` - For dropdown menus
- `shadows.modal` - For modal dialogs
- `shadows.button` - For buttons

### Icons

Icon sizes available:
- `icons.size.xs` - `12px`
- `icons.size.sm` - `16px`
- `icons.size.md` - `20px`
- `icons.size.lg` - `24px`
- `icons.size.xl` - `32px`
- `icons.size.decorative` - `80px` (for large decorative icons)

## CSS Variables Reference

Available in `app/globals.css`:

```css
/* Claude Code UI Colors */
--claude-code-bg-primary: #F5F3F0
--claude-code-bg-secondary: #E8E5E0
--claude-code-accent-coral: #E8A598
--claude-code-accent-coral-hover: #E09486
--claude-code-accent-coral-active: #D88374
--claude-code-accent-orange: #D97757
--claude-code-accent-orange-dark: #8B4513
--claude-code-text-secondary: #6B6B6B
--claude-code-text-placeholder: #999999
--claude-code-border: #D9D6D1
```

## Examples

### Creating a Claude Code-style Button

```tsx
import { getColor, getBorderRadius, getShadow } from '@/lib/use-design-tokens';

function CoralButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      style={{
        backgroundColor: getColor('accent.coral'),
        color: '#FFFFFF',
        borderRadius: getBorderRadius('lg'),
        padding: '12px 16px',
        border: 'none',
        boxShadow: getShadow('button'),
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = getColor('accent.coralHover');
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = getColor('accent.coral');
      }}
    >
      {children}
    </button>
  );
}
```

### Creating a Claude Code-style Input

```tsx
function CoralInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full"
      style={{
        backgroundColor: getColor('background.tertiary'),
        border: `1px solid ${getColor('border.default')}`,
        borderRadius: getBorderRadius('input'),
        padding: '12px 16px',
        fontSize: designTokens.typography.fontSize.base,
        color: getColor('text.primary'),
        boxShadow: getShadow('input'),
      }}
      placeholder="Ask Claude to write code..."
    />
  );
}
```

### Creating a Sidebar

```tsx
function Sidebar() {
  return (
    <aside
      style={{
        width: designTokens.layout.sidebar.width,
        backgroundColor: getColor('background.secondary'),
        padding: getSpacing('lg'),
        borderRight: `1px solid ${getColor('border.default')}`,
      }}
    >
      {/* Sidebar content */}
    </aside>
  );
}
```

## Best Practices

1. **Prefer CSS Variables for Tailwind**: Use the CSS variables with Tailwind for better integration
2. **Use Semantic Names**: Use semantic border radius names like `borderRadius.button` instead of raw values
3. **Consistent Spacing**: Use the spacing scale consistently throughout your app
4. **Color Accessibility**: Ensure proper contrast ratios when using text colors
5. **Responsive Design**: Use the breakpoint values for consistent responsive behavior

## Color Contrast Guidelines

- Primary text (`text.primary`) on light backgrounds: ✓ WCAG AAA
- Secondary text (`text.secondary`) on light backgrounds: ✓ WCAG AA
- Coral accent (`accent.coral`) for interactive elements: ✓ Good visibility
- Always test color combinations for accessibility

## Migration Guide

If you're updating existing components to use these tokens:

1. Find hardcoded colors and replace with token references
2. Replace hardcoded spacing with spacing tokens
3. Use semantic border radius values
4. Apply consistent shadows using shadow tokens
5. Update font families to use the token system

## TypeScript Support

All tokens are fully typed for IntelliSense support:

```tsx
import { designTokens, ColorPath, TypographyPath } from '@/lib/use-design-tokens';

// TypeScript will provide autocomplete for token paths
const color: ColorPath = 'accent.coral';
const fontSize: TypographyPath = 'fontSize.lg';
```
