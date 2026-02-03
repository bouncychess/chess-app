# Claude Code Instructions

## Styling Guidelines

### Theme Usage
All components should use the theme from `src/config/theme.ts` for consistent styling.

### Card/Panel Components
When creating new card or panel components, use `theme.card` for consistent styling:

```tsx
import { theme } from "../../config/theme";

// Spread theme.card and add component-specific styles
<div style={{
  ...theme.card,
  // additional styles
  width: 200,
  display: 'flex',
}}>
```

The `theme.card` object provides:
- `backgroundColor`: Card background color
- `borderRadius`: 8px rounded corners
- `padding`: 16px padding
- `boxShadow`: Subtle shadow for depth

### Colors
Use `theme.colors` for all color values:
- `theme.colors.text` - Primary text color
- `theme.colors.placeholder` - Placeholder/secondary text
- `theme.colors.border` - Border color for inputs
- `theme.colors.cardBackground` - Background for cards (also in theme.card)

### Font Sizes
Use rem-based font sizes for consistency:
- `0.875rem` - Small text (14px equivalent)
- `1rem` - Normal text (16px equivalent)

### Tooltips
Use the `Tooltip` component from `src/components/Tooltip.tsx` for hover tooltips instead of the native HTML `title` attribute:

```tsx
import { Tooltip } from "../../components/Tooltip";

<Tooltip content="Tooltip message here" position="right">
  <button>Hover me</button>
</Tooltip>
```

Props:
- `content`: The tooltip text to display
- `position`: Where to show the tooltip - `'top'`, `'bottom'`, `'left'`, or `'right'` (default: `'right'`)
- `style`: Optional CSS styles for the wrapper

## Meta

### Updating This File
If you notice patterns, conventions, or guidelines that would be helpful to document, suggest adding them to this file. This helps maintain consistency across the codebase and ensures future sessions have the context they need.
