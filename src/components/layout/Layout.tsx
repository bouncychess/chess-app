import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import type {ReactNode} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ConnectingOverlay } from '../ConnectingOverlay';
import { useWebSocket } from '../../context/WebSocketContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../buttons/Button';
import ChallengeNotification from '../../pages/Play/components/ChallengeNotification';

const MOBILE_BREAKPOINT = 768;

export default function Layout({ children }: { children: ReactNode }) {
    const { isConnected, lastMessage, sendMessage } = useWebSocket();
    const { mode, theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);
    const [pendingChallenges, setPendingChallenges] = useState<{ username: string; timeControl: string }[]>([]);
    const [activeGameId, setActiveGameId] = useState<string | null>(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!lastMessage) return;

        if (lastMessage.action === 'connected' && lastMessage.gameId) {
            setActiveGameId(lastMessage.gameId);
        }

        if (lastMessage.action === 'challenge') {
            setPendingChallenges((prev) => {
                if (prev.some((c) => c.username === lastMessage.challengerUsername)) return prev;
                return [...prev, { username: lastMessage.challengerUsername, timeControl: lastMessage.timeControl }];
            });
        }

        if (lastMessage.action === 'challengeCanceled') {
            setPendingChallenges((prev) => prev.filter((c) => c.username !== lastMessage.challengerUsername));
        }

        if (lastMessage.action === 'startGame') {
            setActiveGameId(lastMessage.gameId);
            if (!location.pathname.startsWith('/game/')) {
                setPendingChallenges([]);
                navigate(`/game/${lastMessage.gameId}`, {
                    state: {
                        playerColor: lastMessage.color,
                        currentTurn: lastMessage.turn || 'white',
                        whiteTime: lastMessage.whiteTime,
                        blackTime: lastMessage.blackTime,
                        whiteUsername: lastMessage.whiteUsername,
                        blackUsername: lastMessage.blackUsername,
                        increment: lastMessage.increment,
                    },
                });
            }
        }

        if (lastMessage.action === 'gameEnd') {
            setActiveGameId(null);
        }

        if (lastMessage.action === 'gameStatus' && !lastMessage.active) {
            setActiveGameId(null);
        }
    }, [lastMessage, navigate, location.pathname]);

    // Poll to check if active game has ended (when not on the game page)
    useEffect(() => {
        if (!activeGameId || !isConnected || location.pathname.startsWith('/game/')) return;
        const interval = setInterval(() => {
            sendMessage({ action: 'checkGame', gameId: activeGameId });
        }, 10_000);
        return () => clearInterval(interval);
    }, [activeGameId, isConnected, location.pathname, sendMessage]);

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
                {activeGameId && !location.pathname.startsWith('/game/') && (
                    <div style={{ position: 'absolute', top: isMobile ? 48 : 8, right: isMobile ? 4 : 16, zIndex: 10, padding: '8px 12px', backgroundColor: '#991b1b', color: '#ffffff', borderRadius: mode === 'windows' ? 0 : 8, display: 'flex', alignItems: 'center', gap: 12, ...(mode === 'windows' ? { boxShadow: theme.card.boxShadow } : { boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }) }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>You have an active game</span>
                        <Button variant="secondary" size="sm" onClick={() => navigate(`/game/${activeGameId}`)}>
                            Return to game
                        </Button>
                    </div>
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
