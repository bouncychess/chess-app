import type { Theme } from '../config/theme';
import { transformColor, transformBoxShadow } from './colorTransform';

// Color keys to skip — already dark/light paired or overlays
const SKIP_COLOR_KEYS = new Set(['sidebarBackground', 'sidebarText', 'squareHighlight', 'moveHighlight']);

// Map color key names to roles for targeted lightness
const COLOR_ROLES: Record<string, string> = {
    // Backgrounds → target very dark
    background: 'background',
    cardBackground: 'background',

    // Accents — used as both button backgrounds AND icon fills, must stay visible
    primary: 'accent',
    secondary: 'accent',
    danger: 'accent',
    botIcon: 'accent',

    // Text → target very light for contrast
    text: 'text',
    cardText: 'text',
    primaryText: 'text',
    secondaryText: 'text',
    dangerText: 'text',
    buttonHoverBorder: 'text',

    // Links & focus
    link: 'link',
    borderFocus: 'focus',

    // Borders
    border: 'border',

    // Placeholder
    placeholder: 'placeholder',
};

/**
 * Generate a dark-shifted theme by applying graduated HSL lightness targeting.
 * `amount` ranges from 0 (original) to 1 (fully dark).
 */
export function generateDarkTheme(theme: Theme, amount: number): Theme {
    if (amount === 0) return theme;

    // Transform theme.colors
    const colors = { ...theme.colors } as Record<string, string>;
    for (const key of Object.keys(colors)) {
        if (SKIP_COLOR_KEYS.has(key)) continue;
        colors[key] = transformColor(colors[key], amount, COLOR_ROLES[key]);
    }

    return {
        ...theme,
        colors: colors as Theme['colors'],
        card: {
            ...theme.card,
            backgroundColor: transformColor(theme.card.backgroundColor, amount, 'background'),
            boxShadow: transformBoxShadow(theme.card.boxShadow, amount) ?? theme.card.boxShadow,
        },
        cardHeader: {
            ...theme.cardHeader,
            color: transformColor(theme.cardHeader.color, amount, 'text'),
        },
        button: {
            ...theme.button,
            boxShadow: transformBoxShadow(theme.button.boxShadow, amount),
        },
        input: {
            ...theme.input,
            backgroundColor: theme.input.backgroundColor
                ? transformColor(theme.input.backgroundColor, amount, 'background')
                : undefined,
            color: theme.input.color
                ? transformColor(theme.input.color, amount, 'text')
                : undefined,
            boxShadow: transformBoxShadow(theme.input.boxShadow, amount),
        },
        css: {
            ...theme.css,
            colorText: transformColor(theme.css.colorText, amount, 'text'),
            colorBackground: transformColor(theme.css.colorBackground, amount, 'background'),
            btnBgColor: transformColor(theme.css.btnBgColor, amount, 'background'),
            btnBoxShadow: transformBoxShadow(theme.css.btnBoxShadow, amount) ?? theme.css.btnBoxShadow,
            btnActiveBoxShadow: transformBoxShadow(theme.css.btnActiveBoxShadow, amount) ?? theme.css.btnActiveBoxShadow,
        },
    };
}
