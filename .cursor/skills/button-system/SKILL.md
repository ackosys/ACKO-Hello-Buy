---
name: button-system
description: Complete button component system with dark/light theme support using the primitive → semantic token architecture. Covers all button variants, states, and theming patterns used across ACKO components.
---

# Button System — Dark & Light Theme Support

This skill documents the complete button system used across ACKO components, including all variants, states, and the layered token architecture for dark/light theme compatibility.

## Token Architecture

```
Layer 1 (Primitives)     →  Layer 2 (Semantics)           →  Component CSS
var(--purple-600)        →  var(--color-primary)           →  button { background: var(--color-primary) }
var(--purple-50)         →  var(--color-btn-secondary-bg)  →  .btn-secondary { background: var(--color-btn-secondary-bg) }
```

Components should prefer `--color-*` semantic tokens. Legacy `--btn-*` vars still work but reference primitives internally.

## Button Variants

### 1. Primary CTA Buttons
**Usage:** Main action buttons (Submit, Continue, Pay Now)

**Preferred (Semantic Tokens):**
```tsx
<button 
  className="w-full py-3.5 rounded-xl text-[14px] font-semibold active:scale-[0.97]" 
  style={{ 
    background: 'var(--color-primary)', 
    color: 'var(--color-on-primary)', 
    boxShadow: 'var(--shadow-btn-inner)' 
  }}
>
  Continue
</button>
```

**Legacy (still supported):**
```tsx
<button 
  style={{ 
    background: 'var(--btn-primary-bg)', 
    color: 'var(--btn-primary-text)', 
    boxShadow: 'var(--btn-primary-shadow)' 
  }}
>
  Submit
</button>
```

### 2. Secondary/Outline Buttons
**Usage:** Alternative actions, secondary CTAs
```tsx
<button 
  className="w-full py-3 rounded-xl text-[14px] font-semibold" 
  style={{ 
    background: 'var(--color-btn-secondary-bg)', 
    border: '1px solid var(--color-btn-secondary-border)', 
    color: 'var(--color-btn-secondary-text)' 
  }}
>
  Secondary Button
</button>
```

### 3. Ghost/Link Buttons
**Usage:** Subtle actions, navigation links
```tsx
<button 
  className="w-full py-2 text-[14px] font-medium" 
  style={{ color: 'var(--color-btn-ghost-color)' }}
>
  Ghost Button
</button>

<button 
  className="w-full py-2 text-[14px] font-medium" 
  style={{ color: 'var(--color-btn-link-color)' }}
>
  Link Button
</button>
```

### 4. Danger Buttons
**Usage:** Destructive actions (Cancel Policy, Delete)
```tsx
<button 
  className="w-full py-3 rounded-xl text-[14px] font-semibold" 
  style={{ 
    background: 'var(--color-btn-danger-bg)', 
    color: 'var(--color-btn-danger-text)' 
  }}
>
  Cancel Policy
</button>
```

### 5. Disabled Buttons
**Usage:** Inactive state for any button type
```tsx
<button 
  className="w-full py-3 rounded-xl text-[14px] font-semibold cursor-not-allowed" 
  style={{ 
    background: 'var(--color-btn-disabled-bg)', 
    color: 'var(--color-btn-disabled-text)' 
  }}
  disabled
>
  Disabled Button
</button>
```

### 6. Icon Buttons
**Usage:** Header actions, close buttons, navigation
```tsx
<button 
  className="w-9 h-9 rounded-full flex items-center justify-center" 
  style={{ 
    background: 'var(--color-surface-raised)', 
    border: '1px solid var(--color-border-subtle)', 
    color: 'var(--color-text-secondary)' 
  }}
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
</button>
```

## Semantic Token Reference

### Button-Specific Tokens (from `colors-semantic.mdc`)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-btn-secondary-bg` | `var(--purple-50)` | `var(--grey-650)` | Secondary button fill |
| `--color-btn-secondary-border` | `var(--purple-300)` | `var(--purple-600)` | Secondary button border |
| `--color-btn-secondary-text` | `var(--purple-700)` | `var(--grey-50)` | Secondary button text |
| `--color-btn-inverted-bg` | `var(--grey-100)` | `var(--grey-100)` | Inverted button fill |
| `--color-btn-inverted-text` | `var(--purple-700)` | `var(--purple-700)` | Inverted button text |
| `--color-btn-ghost-color` | `var(--purple-600)` | `var(--purple-500)` | Ghost button text |
| `--color-btn-ghost-hover-bg` | `var(--purple-50)` | `var(--grey-600)` | Ghost hover bg |
| `--color-btn-link-color` | `var(--blue-600)` | `var(--blue-500)` | Link button text |
| `--color-btn-danger-bg` | `var(--red-100)` | `var(--red-900)` | Danger button fill |
| `--color-btn-danger-text` | `var(--red-500)` | `var(--red-200)` | Danger button text |
| `--color-btn-disabled-bg` | `var(--grey-100)` | `var(--grey-600)` | Disabled button fill |
| `--color-btn-disabled-text` | `var(--grey-350)` | `var(--grey-450)` | Disabled button text |
| `--color-btn-primary-hover-bg` | — | `var(--purple-600)` | Primary hover (dark only) |

### Primary Button Tokens (shared semantic)

| Token | Usage |
|-------|-------|
| `--color-primary` | Primary button background |
| `--color-primary-hover` | Primary button hover |
| `--color-primary-active` | Primary button pressed |
| `--color-on-primary` | Text on primary buttons |
| `--shadow-btn-inner` | Inner shadow for depth |
| `--shadow-btn-hover` | Hover shadow elevation |
| `--shadow-focus-ring` | Focus ring using `--color-primary-ring` |

### Legacy `--btn-*` Vars (backward compat)

These still work but now reference primitives internally in `globals.css`:

| Token | Light Value | Dark Value |
|-------|-------------|------------|
| `--btn-primary-bg` | `var(--purple-600)` | `var(--purple-600)` |
| `--btn-primary-text` | `var(--grey-white)` | `var(--grey-white)` |
| `--btn-secondary-bg` | `var(--purple-50)` | `var(--grey-650)` |
| `--btn-secondary-border` | `var(--purple-300)` | `var(--purple-600)` |
| `--btn-secondary-text` | `var(--purple-700)` | `var(--grey-50)` |
| `--btn-ghost-text` | `var(--purple-600)` | `var(--purple-500)` |
| `--btn-link-text` | `var(--blue-600)` | `var(--blue-500)` |
| `--btn-disabled-bg` | `var(--grey-100)` | `var(--grey-600)` |
| `--btn-disabled-text` | `var(--grey-350)` | `var(--grey-450)` |
| `--btn-danger-bg` | `var(--red-100)` | `var(--red-900)` |
| `--btn-danger-text` | `var(--red-600)` | `var(--red-200)` |

## Interactive States

### Active/Pressed State
All buttons use `active:scale-[0.97]` for a subtle press animation:
```tsx
className="active:scale-[0.97] transition-transform"
```

### Hover Effects
```tsx
className="hover:opacity-90 transition-colors"
```

### Focus Ring
```tsx
style={{ boxShadow: 'var(--shadow-focus-ring)' }}
```

## Implementation Pattern

### ✅ Recommended (Semantic Tokens)
```tsx
<button 
  style={{ 
    background: 'var(--color-primary)', 
    color: 'var(--color-on-primary)' 
  }}
>
  Button Text
</button>
```

### ✅ Acceptable (Legacy Vars — reference primitives internally)
```tsx
<button 
  style={{ 
    background: 'var(--btn-primary-bg)', 
    color: 'var(--btn-primary-text)' 
  }}
>
  Button Text
</button>
```

### ❌ Avoid (Hardcoded Colors)
```tsx
<button className="bg-purple-600 text-white">
  Button Text
</button>

<button style={{ background: '#7C3AED', color: '#fff' }}>
  Button Text
</button>
```

### ❌ Avoid (Primitives Directly)
```tsx
<button style={{ background: 'var(--purple-600)', color: 'var(--grey-white)' }}>
  Button Text
</button>
```

## Component Integration

This button system is used across:
- **ChatWidgets** — Primary CTAs in conversational flow
- **MotorWidgets** — Form submissions, plan selections
- **ChatContainer** — Login gates, modal confirmations
- **Header/Navigation** — Icon buttons for themes, menus
- **PostPaymentJourney** — Danger buttons for cancellations

## Design System Reference

All button variants are showcased in the Design System at `/design-system` under **Global > Buttons**. This provides live examples of all button types with real theme switching.