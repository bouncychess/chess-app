import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { themes, setActiveTheme, type Theme, type ThemeMode } from '../config/theme';

interface ThemeContextType {
    mode: ThemeMode;
    theme: Theme;
    toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'theme_mode';

function applyCssVariables(mode: ThemeMode) {
    const t = themes[mode];
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

// Initialize on load so the first render has the right theme
const initialMode = getInitialMode();
setActiveTheme(initialMode);
applyCssVariables(initialMode);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>(initialMode);

    useEffect(() => {
        setActiveTheme(mode);
        applyCssVariables(mode);
        localStorage.setItem(STORAGE_KEY, mode);
    }, [mode]);

    const toggleMode = useCallback(() => {
        setMode(prev => prev === 'normal' ? 'windows' : 'normal');
    }, []);

    // Key the children on mode so all components remount with the updated
    // static `theme` import after setActiveTheme has run.
    return (
        <ThemeContext.Provider value={{ mode, theme: themes[mode], toggleMode }}>
            <div key={mode} style={{ display: 'contents' }}>
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
