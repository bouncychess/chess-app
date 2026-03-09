import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface SettingsContextType {
    premovesEnabled: boolean;
    togglePremoves: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const PREMOVES_KEY = 'premoves_enabled';

function getInitialPremoves(): boolean {
    const stored = localStorage.getItem(PREMOVES_KEY);
    if (stored === 'false') return false;
    return true; // default enabled
}

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [premovesEnabled, setPremovesEnabled] = useState(getInitialPremoves);

    const togglePremoves = useCallback(() => {
        setPremovesEnabled(prev => {
            const next = !prev;
            localStorage.setItem(PREMOVES_KEY, String(next));
            return next;
        });
    }, []);

    return (
        <SettingsContext.Provider value={{ premovesEnabled, togglePremoves }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings(): SettingsContextType {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
    return ctx;
}
