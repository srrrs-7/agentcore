# Design Guide

UI/UX design principles based on Google Material Design and industry best practices.

## Core Principles

### 1. Material Design Foundation
- **Hierarchy**: Use elevation, color, and typography to establish visual hierarchy
- **Motion**: Provide meaningful transitions that guide user attention
- **Consistency**: Maintain consistent patterns across the application

### 2. User-Centered Design
- **Discoverability**: Make features findable without instruction
- **Feedback**: Every action should have visible feedback within 100ms
- **Forgiveness**: Allow undo/redo; confirm destructive actions
- **Efficiency**: Minimize steps to complete common tasks

## Visual Hierarchy

### Typography Scale
```
Display:  text-4xl (36px) - Page titles
Headline: text-2xl (24px) - Section headers
Title:    text-xl  (20px) - Card titles
Body:     text-base (16px) - Primary content
Caption:  text-sm  (14px) - Secondary info
```

### Spacing System (8px grid)
```
xs: 0.5rem (8px)   - Tight grouping
sm: 1rem   (16px)  - Related elements
md: 1.5rem (24px)  - Section spacing
lg: 2rem   (32px)  - Major sections
xl: 3rem   (48px)  - Page sections
```

### Color Usage
- **Primary**: Main actions, active states, links
- **Secondary**: Supporting actions, less emphasis
- **Error**: Destructive actions, validation errors
- **Surface**: Cards, dialogs, elevated surfaces
- **On-Surface**: Text and icons on surfaces

### Color Strategy (Best Practices)
- **Palette Roles**: Define roles (primary, secondary, success, warning, error, info, surface, outline) instead of hardcoding colors in components.
- **Token Hierarchy**: Use semantic tokens (`bg-primary`, `text-muted`) that map to raw values; avoid direct hex usage in UI code.
- **Contrast First**: Validate WCAG AA contrast for all text and icons (4.5:1 normal, 3:1 large). Provide dark text on light surfaces and vice versa.
- **State System**: Specify hover/active/disabled/focus states for each role; ensure focus rings are visible and consistent.
- **Status Colors**: Keep success/warning/error distinct and never rely on color alone—pair with icon or label.
- **Saturation Control**: Use muted tints for backgrounds and stronger hues for accents to reduce visual fatigue.
- **Limited Accents**: Restrict accent colors to 1–2 per screen to preserve hierarchy and reduce noise.
- **Theming Readiness**: Support light/dark or brand variants by swapping token values, not component styles.
- **Data Viz**: For charts, use color-blind safe palettes and limit categorical colors (max 6–8).
- **Documentation**: Maintain a single source of truth for tokens with usage examples and contrast notes.

## Responsive Design

### Breakpoints (Mobile-First)
```
default: 0-639px    - Mobile (single column)
sm:      640px+     - Large mobile
md:      768px+     - Tablet (2-column layouts)
lg:      1024px+    - Desktop (sidebar + content)
xl:      1280px+    - Wide desktop
2xl:     1536px+    - Ultra-wide
```

### Layout Patterns
- **Mobile**: Stack vertically, full-width cards
- **Tablet**: 2-column grid, collapsible sidebar
- **Desktop**: Fixed sidebar + scrollable content area

## Component Patterns

### Buttons
```
Primary:   Filled, high emphasis    → Main CTA
Secondary: Outlined, medium emphasis → Alternative actions
Tertiary:  Text only, low emphasis  → Cancel, dismiss
Icon:      Icon only with tooltip   → Toolbar actions
```

### Forms
- Label above input (not placeholder-only)
- Show validation on blur, not on every keystroke
- Group related fields with fieldsets
- Disable submit until form is valid

### Loading States
- Skeleton screens for initial load (not spinners)
- Inline spinners for button actions
- Progress bars for determinate operations
- Optimistic UI for instant feedback

### Empty States
- Illustrative icon or image
- Clear explanation of what's missing
- Primary action to resolve (e.g., "Create your first task")

## Accessibility (WCAG 2.1 AA)

### Requirements
- **Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Focus**: Visible focus ring (2px solid, offset)
- **Target Size**: Minimum 44x44px for touch targets
- **Motion**: Respect `prefers-reduced-motion`

### Keyboard Navigation
- Tab order follows visual order
- All interactive elements are focusable
- Escape closes modals/dropdowns
- Arrow keys navigate within components

### Screen Readers
- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Add `aria-label` for icon-only buttons
- Use `aria-live` for dynamic content updates
- Hide decorative elements with `aria-hidden`

## Animation Guidelines

### Duration
```
Micro:   100-150ms  - Hover, focus states
Small:   200-250ms  - Buttons, toggles
Medium:  300-400ms  - Cards, modals
Large:   400-500ms  - Page transitions
```

### Easing
- **Enter**: `ease-out` (decelerate)
- **Exit**: `ease-in` (accelerate)
- **Move**: `ease-in-out` (smooth)

### Principles
- Animate properties that don't trigger layout (transform, opacity)
- Use `will-change` sparingly for known animations
- Disable animations for `prefers-reduced-motion`

## Error Handling UX

### Validation Errors
- Show inline, near the field
- Use red color + icon
- Clear message: what's wrong + how to fix

### System Errors
- Toast/snackbar for recoverable errors
- Full-page error for fatal errors
- Always offer a recovery action

### Network Errors
- Retry button for failed requests
- Offline indicator when disconnected
- Queue actions for later sync
