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

### Common Components
Reusable components live in `src/components/`. Always prefer these over inline HTML elements:

#### Button (`src/components/buttons/Button.tsx`)
Use instead of raw `<button>` elements:

```tsx
import { Button } from "../../components/buttons/Button";

<Button variant="danger" size="sm" onClick={handleClick} disabled={false} title="Tooltip">
  Click me
</Button>
```

Props:
- `variant`: `'primary'` | `'secondary'` | `'danger'` | `'success'` (default: `'primary'`)
- `size`: `'sm'` | `'md'` (default: `'md'`)
- `onClick`, `disabled`, `type`, `title`

#### ResizableCard (`src/components/ResizableCard.tsx`)
Use for card/panel containers instead of manually spreading `theme.card`:

```tsx
import { ResizableCard } from "../../components/ResizableCard";

<ResizableCard style={{ height: "100%", display: "flex" }}>
  {children}
</ResizableCard>
```

#### TextInput (`src/components/input/TextInput.tsx`)
Use for text inputs in forms:

```tsx
import { TextInput } from "../../components/input/TextInput";

<TextInput label="Username" value={val} onChange={setVal} placeholder="Enter name" required />
```

Props:
- `label`, `value`, `onChange`, `placeholder`, `type` (`'text'` | `'password'` | `'email'`), `required`

#### Tooltip (`src/components/Tooltip.tsx`)
Use for hover tooltips instead of the native HTML `title` attribute:

```tsx
import { Tooltip } from "../../components/Tooltip";

<Tooltip content="Tooltip message here" position="right">
  <button>Hover me</button>
</Tooltip>
```

Props:
- `content`: The tooltip text to display
- `position`: `'top'` | `'bottom'` | `'left'` | `'right'` (default: `'right'`)
- `style`: Optional CSS styles for the wrapper

## Meta

### Updating This File
If you notice patterns, conventions, or guidelines that would be helpful to document, suggest adding them to this file. This helps maintain consistency across the codebase and ensures future sessions have the context they need.
