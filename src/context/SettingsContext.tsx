import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface SettingsContextType {
    premovesEnabled: boolean;
    togglePremoves: () => void;
    lowTimeWarning: number;
    setLowTimeWarning: (seconds: number) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const PREMOVES_KEY = 'premoves_enabled';
const LOW_TIME_KEY = 'low_time_warning';

function getInitialPremoves(): boolean {
    const stored = localStorage.getItem(PREMOVES_KEY);
    if (stored === 'false') return false;
    return true; // default enabled
}

function getInitialLowTime(): number {
    const stored = localStorage.getItem(LOW_TIME_KEY);
    if (stored) {
        const n = Number(stored);
        if (!isNaN(n) && n >= 5 && n <= 60) return n;
    }
    return 15; // default 15 seconds
}

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [premovesEnabled, setPremovesEnabled] = useState(getInitialPremoves);
    const [lowTimeWarning, setLowTimeWarningState] = useState(getInitialLowTime);

    const togglePremoves = useCallback(() => {
        setPremovesEnabled(prev => {
            const next = !prev;
            localStorage.setItem(PREMOVES_KEY, String(next));
            return next;
        });
    }, []);

    const setLowTimeWarning = useCallback((seconds: number) => {
        const clamped = Math.max(5, Math.min(60, seconds));
        setLowTimeWarningState(clamped);
        localStorage.setItem(LOW_TIME_KEY, String(clamped));
    }, []);

    return (
        <SettingsContext.Provider value={{ premovesEnabled, togglePremoves, lowTimeWarning, setLowTimeWarning }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings(): SettingsContextType {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
    return ctx;
}
