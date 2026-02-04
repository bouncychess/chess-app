import Sidebar from './Sidebar';
import type {ReactNode} from 'react';
import { theme } from '../../config/theme';
import { ConnectingOverlay } from '../ConnectingOverlay';
import { useWebSocket } from '../../context/WebSocketContext';

export default function Layout({ children }: { children: ReactNode }) {
    const { isConnected } = useWebSocket();

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <Sidebar />
            <main style={{ flex: 1, padding: '1rem', overflowY: 'auto', backgroundColor: theme.colors.background, color: theme.colors.text, position: 'relative' }}>
                <ConnectingOverlay isConnecting={!isConnected} />
                {children}
            </main>
        </div>
    );
}