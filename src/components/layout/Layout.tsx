import Sidebar from './Sidebar';
import type {ReactNode} from 'react';
import { theme } from '../../config/theme';

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <Sidebar />
            <main style={{ flex: 1, padding: '1rem', overflowY: 'auto', backgroundColor: theme.colors.background, color: theme.colors.text }}>
                {children}
            </main>
        </div>
    );
}