import { useEffect, useState } from 'react';
import { theme } from '../config/theme';

interface ConnectingOverlayProps {
    isConnecting: boolean;
}

export function ConnectingOverlay({ isConnecting }: ConnectingOverlayProps) {
    const [showOverlay, setShowOverlay] = useState(false);

    // Delay showing the overlay to avoid flashing during brief reconnections
    useEffect(() => {
        if (isConnecting) {
            const timer = setTimeout(() => setShowOverlay(true), 500);
            return () => clearTimeout(timer);
        } else {
            setShowOverlay(false);
        }
    }, [isConnecting]);

    if (!showOverlay) return null;

    return (
        <>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                    animation: 'fadeIn 0.3s ease-out',
                }}
            >
                <div
                    style={{
                        ...theme.card,
                        textAlign: 'center',
                        maxWidth: 300,
                        animation: 'pulse 2s ease-in-out infinite',
                    }}
                >
                    <img
                        src="/rook.svg"
                        alt="Loading"
                        width="50"
                        height="50"
                        style={{
                            margin: '0 auto 12px',
                            display: 'block',
                            animation: 'spin 2s ease-in-out infinite',
                        }}
                    />
                    <h3 style={{ margin: 0, color: theme.colors.text }}>
                        Connecting
                    </h3>
                </div>
            </div>
        </>
    );
}
