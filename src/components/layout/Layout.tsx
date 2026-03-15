import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import type {ReactNode} from 'react';
import { ConnectingOverlay } from '../ConnectingOverlay';
import { useWebSocket } from '../../context/WebSocketContext';
import { useTheme } from '../../context/ThemeContext';

const MOBILE_BREAKPOINT = 768;

export default function Layout({ children }: { children: ReactNode }) {
    const { isConnected } = useWebSocket();
    const { mode, theme } = useTheme();
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <Sidebar />
            <main style={{ flex: 1, padding: isMobile ? '4px' : '1rem', overflowY: 'auto', backgroundColor: theme.colors.background, color: theme.colors.text, position: 'relative' }}>
                <ConnectingOverlay isConnecting={!isConnected} />
                {mode === 'windows' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <img src="/images/articles/windows.svg" alt="Windows" width={isMobile ? 40 : 48} height={isMobile ? 40 : 48} />
                        <span style={{ fontSize: isMobile ? '16px' : '18px', color: theme.colors.placeholder }}>Powered by Windows</span>
                    </div>
                )}
                {children}

            </main>
        </div>
    );
}
