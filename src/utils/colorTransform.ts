// Named CSS colors that appear in the theme definitions
const NAMED_COLORS: Record<string, string> = {
    white: '#ffffff',
    black: '#000000',
    grey: '#808080',
    gray: '#808080',
    red: '#ff0000',
    blue: '#0000ff',
};

export function namedColorToHex(color: string): string | null {
    return NAMED_COLORS[color.toLowerCase()] ?? null;
}

export function hexToHsl(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) throw new Error(`Invalid hex color: ${hex}`);

    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    if (max === min) return [0, 0, l];

    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    let h: number;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;

    return [h, s, l];
}

export function hslToHex(h: number, s: number, l: number): string {
    if (s === 0) {
        const v = Math.round(l * 255);
        return `#${v.toString(16).padStart(2, '0')}${v.toString(16).padStart(2, '0')}${v.toString(16).padStart(2, '0')}`;
    }

    const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
    const g = Math.round(hue2rgb(p, q, h) * 255);
    const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Target lightness values for different roles at full dark (amount=1).
// Colors interpolate from their original lightness toward these targets.
const ROLE_TARGETS: Record<string, number> = {
    background: 0.07,     // very dark backgrounds
    text: 0.92,           // very light text for readability
    accent: 0.40,         // colored buttons/icons — visible on dark, not washed out
    link: 0.65,           // links stay visible on dark
    focus: 0.60,          // focus rings visible on dark
    border: 0.30,         // subtle borders on dark
    placeholder: 0.45,    // muted but readable
};

/**
 * Transform a color's lightness toward a target value by `amount` (0–1).
 *
 * Role-based targeting ensures backgrounds get truly dark and text stays
 * readable at all slider positions — avoiding the mid-range contrast collapse
 * that pure inversion causes.
 *
 * newL = L + (targetL - L) * amount
 */
export function transformColor(color: string, amount: number, role?: string): string {
    if (amount === 0) return color;

    // Pass through rgba/rgb strings unchanged
    if (color.startsWith('rgba(') || color.startsWith('rgb(')) return color;

    // Handle CSS named colors
    let hex = color;
    const namedHex = namedColorToHex(color);
    if (namedHex) {
        hex = namedHex;
    } else if (!color.startsWith('#')) {
        // Unknown format (e.g., CSS variable references) — pass through
        return color;
    }

    const [h, s, l] = hexToHsl(hex);

    // Determine target lightness
    const target = role && role in ROLE_TARGETS ? ROLE_TARGETS[role] : (1 - l);

    let newL = l + (target - l) * amount;
    newL = Math.max(0, Math.min(1, newL));

    return hslToHex(h, s, newL);
}

/**
 * Parse and transform hex colors within a CSS box-shadow string.
 * E.g. "inset -1px -1px 0 #000000, inset 1px 1px 0 #ffffff"
 */
export function transformBoxShadow(shadow: string | undefined, amount: number): string | undefined {
    if (!shadow || amount === 0) return shadow;
    return shadow.replace(/#[a-f\d]{6}/gi, (match) => transformColor(match, amount));
}
