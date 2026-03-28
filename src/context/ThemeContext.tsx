import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { themes, setActiveTheme, type Theme, type ThemeMode } from '../config/theme';
import { generateDarkTheme } from '../utils/darkThemeGenerator';

interface ThemeContextType {
    mode: ThemeMode;
    theme: Theme;
    toggleMode: () => void;
    isDark: boolean;
    toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'theme_mode';
const DARK_STORAGE_KEY = 'dark_mode';

function computeEffectiveTheme(mode: ThemeMode, isDark: boolean): Theme {
    const base = themes[mode];
    return isDark ? generateDarkTheme(base, 1) : base;
}

function applyCssVariables(t: Theme) {
    const root = document.documentElement;
    root.style.setProperty('font-family', t.css.fontFamily);
    if (t.css.fontSize) {
        root.style.setProperty('font-size', t.css.fontSize);
    } else {
        root.style.removeProperty('font-size');
    }
    root.style.setProperty('line-height', t.css.lineHeight);
    root.style.setProperty('-webkit-font-smoothing', t.css.fontSmoothingWebkit);
    root.style.setProperty('-moz-osx-font-smoothing', t.css.fontSmoothingMoz);
    root.style.setProperty('color', t.css.colorText);
    root.style.setProperty('background-color', t.css.colorBackground);

    // Button CSS variables
    root.style.setProperty('--btn-border-radius', t.css.btnBorderRadius);
    root.style.setProperty('--btn-border', t.css.btnBorder);
    root.style.setProperty('--btn-padding', t.css.btnPadding);
    root.style.setProperty('--btn-font-size', t.css.btnFontSize);
    root.style.setProperty('--btn-font-weight', t.css.btnFontWeight);
    root.style.setProperty('--btn-bg-color', t.css.btnBgColor);
    root.style.setProperty('--btn-box-shadow', t.css.btnBoxShadow);
    root.style.setProperty('--btn-active-box-shadow', t.css.btnActiveBoxShadow);
    root.style.setProperty('--btn-focus-outline', t.css.btnFocusOutline);
    root.style.setProperty('--btn-focus-outline-offset', t.css.btnFocusOutlineOffset);
}

function getInitialMode(): ThemeMode {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'normal' || stored === 'windows') return stored;
    return 'normal';
}

function getInitialDark(): boolean {
    const stored = localStorage.getItem(DARK_STORAGE_KEY);
    if (stored !== null) return stored === 'true';
    return true;
}

// Initialize on load so the first render has the right theme
const initialMode = getInitialMode();
const initialDark = getInitialDark();
const initialTheme = computeEffectiveTheme(initialMode, initialDark);
setActiveTheme(initialTheme);
applyCssVariables(initialTheme);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>(initialMode);
    const [isDark, setIsDark] = useState<boolean>(initialDark);

    useEffect(() => {
        const effective = computeEffectiveTheme(mode, isDark);
        setActiveTheme(effective);
        applyCssVariables(effective);
        localStorage.setItem(STORAGE_KEY, mode);
        localStorage.setItem(DARK_STORAGE_KEY, String(isDark));
    }, [mode, isDark]);

    const toggleMode = useCallback(() => {
        setMode(prev => prev === 'normal' ? 'windows' : 'normal');
    }, []);

    const toggleDark = useCallback(() => {
        setIsDark(prev => !prev);
    }, []);

    const effective = computeEffectiveTheme(mode, isDark);

    // Key on mode+isDark so all components remount with the updated
    // static `theme` import after setActiveTheme has run.
    return (
        <ThemeContext.Provider value={{ mode, theme: effective, toggleMode, isDark, toggleDark }}>
            <div key={`${mode}-${isDark}`} style={{ display: 'contents' }}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextType {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
    return ctx;
}
