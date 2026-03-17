---
name: colors-semantic
description: Semantic color tokens — role-based aliases that components reference. Never use primitives directly.
globs: "**/*.css"
---

# Semantic Color Tokens

Components reference ONLY these tokens. Never use primitives (`--purple-600`, `--grey-200`) in component CSS.

```
primitives → semantics → component CSS
--purple-600 → --color-primary → .acko-btn-primary { background-color: var(--color-primary) }
```

## Brand / Primary

| Token | Role | Light | Dark |
|-------|------|-------|------|
| `--color-primary` | Main CTA fill | `purple-600` | `purple-500` |
| `--color-primary-hover` | Hover state | `purple-700` | `purple-400` |
| `--color-primary-active` | Pressed state | `purple-800` | `purple-300` |
| `--color-primary-muted` | Soft border hints | `purple-400` | `purple-600` |
| `--color-primary-subtle` | Tinted backgrounds | `purple-100` | `purple-900` |
| `--color-primary-ring` | Focus ring | `purple-200` | `purple-800` |
| `--color-on-primary` | Text on primary bg | `#FFFFFF` | `grey-white` |

## Surfaces

| Token | Role | Light | Dark |
|-------|------|-------|------|
| `--color-surface` | Page background | `grey-100` | `grey-750` |
| `--color-surface-raised` | Elevated surfaces | `grey-100` | `grey-700` |
| `--color-surface-raised-hover` | Hovered raised | `grey-200` | `grey-650` |
| `--color-surface-raised-active` | Pressed raised | `grey-300` | `grey-600` |
| `--color-surface-overlay` | Backdrop | `rgba(10,10,10,0.5)` | `rgba(0,0,0,0.7)` |
| `--color-surface-ghost-hover` | Ghost interaction bg | `rgba(0,0,0,0.04)` | `rgba(255,255,255,0.05)` |

## Text

| Token | Typography prop | Light | Dark | Role |
|-------|----------------|-------|------|------|
| `--color-text-primary` | `primary` (default) | `grey-800` | `grey-50` | Headings, values, main content |
| `--color-text-default` | — | `grey-700` | `grey-100` | Labels, body text |
| `--color-text-supporting` | — | `grey-550` | `grey-200` | Supporting text (readonly, chevrons) |
| `--color-text-secondary` | `secondary` | `grey-450` | `grey-350` | Subtext, placeholders, helpers |
| `--color-text-disabled` | — | `grey-300` | `grey-450` | Disabled text |
| `--color-text-invert` | `invert` | `#FFFFFF` | `grey-white` | Text on dark/filled surfaces regardless of theme |
| `--color-text-brand` | `brand` | `purple-600` | `purple-500` | Brand-colored text — links, emphasis |
| `--color-text-error` | `error` | `red-700` | `red-400` | Error messages |
| `--color-text-success` | `success` | `green-700` | `green-400` | Success messages |
| `--color-text-static` | `static` | `grey-white` | `grey-white` | Fixed color across themes — does not change |

## Borders

| Token | Role | Light | Dark |
|-------|------|-------|------|
| `--color-border` | Default border | `grey-300` | `grey-600` |
| `--color-border-strong` | Hover/filled | `grey-450` | `grey-550` |
| `--color-border-subtle` | Faint dividers | `grey-200` | `grey-650` |

## Disabled

| Token | Light | Dark |
|-------|-------|------|
| `--color-disabled-bg` | `grey-150` | `grey-600` |
| `--color-disabled-text` | `grey-350` | `grey-450` |
| `--color-disabled-border` | `grey-200` | `grey-600` |

## Feedback States

### Error
| Token | Light | Dark |
|-------|-------|------|
| `--color-error` | `red-600` | `red-600` |
| `--color-error-text` | `red-700` | `red-400` |
| `--color-error-subtle` | `red-100` | `red-950` |
| `--color-error-border` | `red-200` | `red-800` |
| `--color-error-badge-bg` | `red-100` | `red-900` |
| `--color-error-gradient-from` | `red-200` | `red-800` | Input error border gradient start |
| `--color-error-gradient-to` | `grey-150` | `grey-600` | Input error border gradient end |

### Success
| Token | Light | Dark |
|-------|-------|------|
| `--color-success` | `green-600` | `green-500` |
| `--color-success-text` | `green-700` | `green-400` |
| `--color-success-subtle` | `green-100` | `green-950` |
| `--color-success-border` | `green-200` | `green-800` |
| `--color-success-badge-bg` | `green-200` | `green-900` |

### Warning
| Token | Light | Dark |
|-------|-------|------|
| `--color-warning` | `orange-600` | `orange-500` |
| `--color-warning-text` | `orange-700` | `orange-400` |
| `--color-warning-subtle` | `orange-50` | `orange-950` |
| `--color-warning-border` | `orange-100` | `orange-800` |
| `--color-warning-badge-bg` | `orange-200` | `orange-900` |

### Info (uses brand purple — NOT blue)
| Token | Light | Dark |
|-------|-------|------|
| `--color-info` | `purple-600` | `purple-500` |
| `--color-info-text` | `purple-700` | `purple-400` |
| `--color-info-subtle` | `purple-100` | `purple-950` |
| `--color-info-border` | `purple-200` | `purple-800` |
| `--color-info-badge-bg` | `purple-200` | `purple-900` |

## Cards

| Token | Light | Dark |
|-------|-------|------|
| `--color-card-bg` | `grey-50` | `grey-650` |
| `--color-card-border` | `grey-white` | `grey-650` |
| `--color-card-elevated-bg` | `grey-white` | `grey-650` |
| `--color-card-demoted-bg` | `grey-150` | `grey-750` |
| `--color-card-demoted-border` | `grey-200` | `grey-600` |
| `--color-card-outline-border` | `grey-200` | `grey-600` |

## Component-Specific Tokens

### Tooltip
| Token | Light | Dark |
|-------|-------|------|
| `--color-tooltip-bg` | `grey-700` | `grey-200` |
| `--color-tooltip-text` | `grey-white` | `grey-750` |

### Tabs Pill
| Token | Light | Dark |
|-------|-------|------|
| `--color-tab-pill-bg` | `grey-150` | `grey-650` |
| `--color-tab-pill-active-bg` | `grey-white` | `grey-550` |

### Toggle
| Token | Light | Dark |
|-------|-------|------|
| `--color-toggle-bg` | `grey-150` | `grey-650` |
| `--color-toggle-bg-hover` | `grey-200` | `grey-600` |
| `--color-toggle-active-bg` | `purple-100` | `purple-900` |
| `--color-toggle-active-text` | `purple-700` | `purple-300` |
| `--color-toggle-text` | `grey-450` | `grey-350` |

### Accordion
| Token | Light | Dark |
|-------|-------|------|
| `--color-accordion-border` | `grey-200` | `grey-600` |
| `--color-accordion-header-hover` | `grey-50` | `grey-650` |
| `--color-accordion-icon` | `grey-400` | `grey-400` |

### Breadcrumb
| Token | Light | Dark |
|-------|-------|------|
| `--color-breadcrumb-text` | `grey-400` | `grey-400` |
| `--color-breadcrumb-link` | `grey-500` | `grey-350` |
| `--color-breadcrumb-link-hover` | `purple-600` | `purple-400` |
| `--color-breadcrumb-current` | `grey-700` | `grey-100` |
| `--color-breadcrumb-separator` | `grey-300` | `grey-550` |

### Table
| Token | Light | Dark |
|-------|-------|------|
| `--color-table-header-bg` | `grey-100` | `grey-700` |
| `--color-table-header-text` | `grey-500` | `grey-350` |
| `--color-table-border` | `grey-200` | `grey-600` |
| `--color-table-row-hover` | `grey-50` | `grey-650` |
| `--color-table-stripe` | `grey-50` | `rgba(255,255,255,0.02)` |

### Button
| Token | Light | Dark |
|-------|-------|------|
| `--color-btn-secondary-bg` | `purple-50` | `grey-650` |
| `--color-btn-secondary-border` | `purple-300` | `purple-600` |
| `--color-btn-secondary-text` | `purple-700` | `grey-50` |
| `--color-btn-inverted-bg` | `grey-100` | `grey-100` |
| `--color-btn-inverted-text` | `purple-700` | `purple-700` |
| `--color-btn-ghost-color` | `purple-600` | `purple-500` |
| `--color-btn-ghost-hover-bg` | `purple-50` | `grey-600` |
| `--color-btn-link-color` | `blue-600` | `blue-500` |
| `--color-btn-danger-bg` | `red-100` | `red-900` |
| `--color-btn-danger-text` | `red-500` | `red-200` |
| `--color-btn-disabled-bg` | `grey-100` | `grey-600` |
| `--color-btn-disabled-text` | `grey-350` | `grey-450` |
| `--color-btn-primary-hover-bg` | — | `purple-600` |

### Input (shared by TextInput, Dropdown, Textarea, InputGroup, OtpInput)
| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--color-input-bg` | `grey-white` | `grey-750` | Default fill |
| `--color-input-border` | `grey-150` | `grey-600` | Default border |
| `--color-input-hover-border` | `grey-300` | `grey-550` | Hover border |
| `--color-input-filled-border` | `grey-200` | `grey-550` | Filled (has value) border |
| `--color-input-focus-border` | `grey-200` | `grey-550` | Focus/selected border (error excluded) |
| `--color-input-disabled-bg` | — | `grey-650` | Disabled fill (dark only) |
| `--color-input-disabled-border` | — | `grey-600` | Disabled border (dark only) |
| `--color-input-option-hover` | `purple-50` | `grey-650` | Dropdown option hover |
| `--color-input-option-selected-bg` | `purple-100` | `purple-900` | Selected option bg |
| `--color-input-option-selected-text` | `purple-700` | `purple-300` | Selected option text |

### Slider / Progress
| Token | Light | Dark |
|-------|-------|------|
| `--color-track-inactive` | `grey-200` | `grey-600` | Unfinished track area |

### Switch
| Token | Light | Dark |
|-------|-------|------|
| `--color-switch-thumb` | `grey-white` | `grey-white` |

### Form Controls
| Token | Light | Dark |
|-------|-------|------|
| `--color-control-border-selector` | `grey-200` | `grey-500` |

### Radio Card
| Token | Light | Dark |
|-------|-------|------|
| `--color-radio-card-hover-border` | `purple-200` | `purple-700` |
| `--color-radio-card-hover-bg` | `purple-50` | `purple-950` |
| `--color-radio-card-active-border` | `purple-300` | `purple-600` |
| `--color-radio-card-active-bg` | `purple-100` | `purple-900` |

### Calendar
| Token | Light | Dark |
|-------|-------|------|
| `--color-cal-selected-bg` | `purple-600` | `purple-500` |
| `--color-cal-selected-text` | `grey-white` | `grey-white` |
| `--color-cal-range-bg` | `purple-50` | `purple-950` |
| `--color-cal-range-text` | `purple-700` | `purple-300` |
| `--color-cal-hover-bg` | `purple-50` | `purple-950` |
| `--color-cal-today-text` | `purple-600` | `purple-400` |
| `--color-cal-cell-hover-bg` | `grey-100` | `grey-650` |

### Badge — Solid (gradient fill + border)

Pattern: `--color-badge-{color}-{gradient-from|gradient-to|border|text}`

Background is `linear-gradient(0deg, gradient-from, gradient-to)` with a `1px solid border`.

| Color | `gradient-from` Light | `gradient-to` Light | `border` Light | `text` Light |
|-------|----------------------|--------------------|--------------:|-------------|
| purple | `purple-200` | `purple-100` | `purple-200` | `purple-800` |
| green (lime) | `lime-200` | `lime-100` | `lime-200` | `green-800` |
| blue | `blue-200` | `blue-100` | `blue-200` | `blue-800` |
| orange | `orange-200` | `orange-100` | `orange-200` | `orange-800` |
| pink | `red-200` | `red-100` | `red-200` | `red-800` |
| gray | `grey-200` | `grey-100` | `grey-200` | `grey-600` |

| Color | `gradient-from` Dark | `gradient-to` Dark | `border` Dark | `text` Dark |
|-------|---------------------|-------------------|-------------:|------------|
| purple | `purple-900` | `purple-800` | `purple-700` | `purple-200` |
| green (lime) | `lime-900` | `lime-800` | `lime-700` | `green-200` |
| blue | `blue-900` | `blue-800` | `blue-700` | `blue-200` |
| orange | `orange-900` | `orange-800` | `orange-700` | `orange-200` |
| pink | `red-900` | `red-800` | `red-700` | `red-200` |
| gray | `grey-650` | `grey-600` | `grey-500` | `grey-200` |

### Badge — Outline

Pattern: `--color-badge-{color}-outline-color`

| Color | Light | Dark |
|-------|-------|------|
| purple | `purple-600` | `purple-400` |
| green (lime) | `lime-600` | `lime-600` |
| blue | `blue-600` | `blue-600` |
| orange | `orange-600` | `orange-600` |
| pink | `red-600` | `red-600` |
| gray | `grey-600` | `grey-500` |

### Counter Badge (gradient fill + border)

Pattern: `--color-counter-{color}-{gradient-from|gradient-to|border}`

Background is `linear-gradient(0deg, gradient-from, gradient-to)` with a `1px solid border`. Text is always `--color-on-primary` (white).

| Color | `gradient-from` Light | `gradient-to` Light | `border` Light |
|-------|----------------------|--------------------|---------------|
| pink | `red-500` | `red-400` | `red-500` |
| purple | `purple-500` | `purple-400` | `purple-500` |
| blue | `blue-500` | `blue-400` | `blue-500` |

| Color | `gradient-from` Dark | `gradient-to` Dark | `border` Dark |
|-------|---------------------|-------------------|--------------|
| pink | `red-600` | `red-700` | `red-600` |
| purple | `purple-600` | `purple-700` | `purple-600` |
| blue | `blue-600` | `blue-700` | `blue-600` |

### Wizard

| Token | Light | Dark |
|-------|-------|------|
| `--color-wizard-active-bg` | `purple-500` | `purple-600` |
| `--color-wizard-active-text` | `grey-50` | `grey-white` |
| `--color-wizard-active-shadow-top` | `purple-400` | `purple-500` |
| `--color-wizard-active-shadow-bottom` | `purple-700` | `purple-800` |
| `--color-wizard-done-bg` | `purple-200` | `purple-700` |
| `--color-wizard-done-text` | `purple-600` | `purple-300` |
| `--color-wizard-upcoming-border` | `grey-250` | `grey-500` |
| `--color-wizard-upcoming-text` | `grey-350` | `grey-450` |
| `--color-wizard-connector-done` | `purple-200` | `purple-700` |
| `--color-wizard-connector-upcoming` | `grey-250` | `grey-500` |

## Shadows (Semantic)

| Token | Light | Dark |
|-------|-------|------|
| `--shadow-card` | `var(--shadow-md)` | `var(--shadow-md)` |
| `--shadow-dropdown` | `var(--shadow-lg)` | `var(--shadow-lg)` |
| `--shadow-modal` | `var(--shadow-xl)` | `var(--shadow-xl)` |
| `--shadow-subtle` | `var(--shadow-sm)` | `var(--shadow-sm)` |
| `--shadow-btn-inner` | `inset 0 1px 2px rgba(255,255,255,0.28)` | `inset 0 1px 2px rgba(255,255,255,0.15)` |
| `--shadow-btn-hover` | `0 4px 8px rgba(0,0,0,0.08)` | `0 4px 8px rgba(0,0,0,0.3)` |
| `--shadow-focus-ring` | `0 0 0 3px var(--color-primary-ring)` | same |
| `--shadow-btn-secondary-hover` | `inset 0 2px 4px rgba(255,255,255,0.48)` | `inset 0 2px 4px rgba(0,0,0,0.2)` |

## Usage Examples

### ✅ Correct (Semantic Tokens)
```tsx
// Use semantic tokens in component CSS
<button style={{ 
  background: 'var(--color-primary)', 
  color: 'var(--color-on-primary)' 
}}>
  Primary Button
</button>

<div style={{ 
  color: 'var(--color-text-error)',
  background: 'var(--color-error-subtle)' 
}}>
  Error message
</div>
```

### ❌ Incorrect (Primitive Tokens)
```tsx
// Never use primitives directly
<button style={{ 
  background: 'var(--purple-600)', 
  color: 'var(--grey-white)' 
}}>
  Button
</button>

// Never use hardcoded Tailwind classes
<button className="bg-purple-600 text-white">
  Button
</button>
```

## Implementation in `globals.css`

All semantic tokens are implemented in `/app/globals.css` under theme-specific CSS classes:

```css
.app-light {
  --color-primary: var(--purple-600);
  --color-text-primary: var(--grey-800);
  /* ... all light theme mappings */
}

.app-dark {
  --color-primary: var(--purple-500);
  --color-text-primary: var(--grey-50);
  /* ... all dark theme mappings */
}
```

This system ensures consistent theming across all components while maintaining the flexibility to adjust colors globally from a single source.