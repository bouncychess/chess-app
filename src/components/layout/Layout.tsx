import Sidebar from './Sidebar';
import type {ReactNode} from 'react';

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <Sidebar />
            <main style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                {children}
            </main>
        </div>
    );
}