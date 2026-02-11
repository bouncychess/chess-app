import Sidebar from './Sidebar';
import type {ReactNode} from 'react';
import { theme } from '../../config/theme';
import { ConnectingOverlay } from '../ConnectingOverlay';
import { useWebSocket } from '../../context/WebSocketContext';
import { PopupAd } from '../PopupAd';

export default function Layout({ children }: { children: ReactNode }) {
    const { isConnected } = useWebSocket();

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <Sidebar />
            <main style={{ flex: 1, padding: '1rem', overflowY: 'auto', backgroundColor: theme.colors.background, color: theme.colors.text, position: 'relative' }}>
                <ConnectingOverlay isConnecting={!isConnected} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <img src="/images/articles/windows.svg" alt="Windows" width={48} height={48} />
                    <span style={{ fontSize: '18px', color: theme.colors.placeholder }}>Powered by Windows</span>
                </div>
                {children}
                <PopupAd />
            </main>
        </div>
    );
}