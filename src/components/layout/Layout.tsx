import { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import type {ReactNode} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ConnectingOverlay } from '../ConnectingOverlay';
import { useWebSocket } from '../../context/WebSocketContext';
import { useTheme } from '../../context/ThemeContext';
import ChallengeNotification from '../../pages/Play/components/ChallengeNotification';

const MOBILE_BREAKPOINT = 768;

export default function Layout({ children }: { children: ReactNode }) {
    const { isConnected, subscribe, sendMessage } = useWebSocket();
    const { mode, theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const locationRef = useRef(location);
    useEffect(() => { locationRef.current = location; }, [location]);

    const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);
    const [pendingChallenges, setPendingChallenges] = useState<{ username: string; timeControl: string }[]>([]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        return subscribe((msg) => {
            if (msg.action === 'challenge') {
                setPendingChallenges((prev) => {
                    if (prev.some((c) => c.username === msg.challengerUsername)) return prev;
                    return [...prev, { username: msg.challengerUsername, timeControl: msg.timeControl }];
                });
            }

            if (msg.action === 'challengeCanceled') {
                setPendingChallenges((prev) => prev.filter((c) => c.username !== msg.challengerUsername));
            }

            if (msg.action === 'startGame' && !locationRef.current.pathname.startsWith('/game/')) {
                setPendingChallenges([]);
                navigate(`/game/${msg.gameId}`, {
                    state: {
                        playerColor: msg.color,
                        currentTurn: msg.turn || 'white',
                        whiteTime: msg.whiteTime,
                        blackTime: msg.blackTime,
                        whiteUsername: msg.whiteUsername,
                        blackUsername: msg.blackUsername,
                        increment: msg.increment,
                    },
                });
            }
        });
    }, [subscribe, navigate]);

    const onAcceptChallenge = (challengerUsername: string) => {
        sendMessage({ action: 'respondChallenge', challengerUsername, accept: true });
        setPendingChallenges((prev) => prev.filter((c) => c.username !== challengerUsername));
    };

    const onDeclineChallenge = (challengerUsername: string) => {
        sendMessage({ action: 'respondChallenge', challengerUsername, accept: false });
        setPendingChallenges((prev) => prev.filter((c) => c.username !== challengerUsername));
    };

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <Sidebar />
            <main style={{ flex: 1, padding: isMobile ? '4px' : '1rem', paddingTop: isMobile ? '48px' : '1rem', overflowY: 'auto', backgroundColor: theme.colors.background, color: theme.colors.text, position: 'relative' }}>
                <ConnectingOverlay isConnecting={!isConnected} />
                {mode === 'windows' && (
                    isMobile ? (
                        <div style={{ position: 'fixed', top: 8, left: 52, zIndex: 1000, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <img src="/images/articles/windows.svg" alt="Windows" width={32} height={32} />
                            <span style={{ fontSize: '14px', color: theme.colors.placeholder }}>Powered by Windows</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <img src="/images/articles/windows.svg" alt="Windows" width={48} height={48} />
                            <span style={{ fontSize: '18px', color: theme.colors.placeholder }}>Powered by Windows</span>
                        </div>
                    )
                )}
                {children}
            </main>
            {pendingChallenges.length > 0 && (
                <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 1000 }}>
                    {pendingChallenges.map((c) => (
                        <ChallengeNotification
                            key={c.username}
                            challengerUsername={c.username}
                            timeControl={c.timeControl}
                            onAccept={() => onAcceptChallenge(c.username)}
                            onDecline={() => onDeclineChallenge(c.username)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
