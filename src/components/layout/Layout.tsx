import Sidebar from './Sidebar';
import type {ReactNode} from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ConnectingOverlay } from '../ConnectingOverlay';
import { useWebSocket } from '../../context/WebSocketContext';
import { useTheme } from '../../context/ThemeContext';
import ChallengeNotification from '../../pages/Play/components/ChallengeNotification';


export default function Layout({ children }: { children: ReactNode }) {
    const { isConnected, lastMessage, sendMessage } = useWebSocket();
    const { mode, theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const [pendingChallenges, setPendingChallenges] = useState<{ username: string; timeControl: string }[]>([]);

    useEffect(() => {
        if (!lastMessage) return;

        if (lastMessage.action === 'challenge') {
            setPendingChallenges((prev) => {
                if (prev.some((c) => c.username === lastMessage.challengerUsername)) return prev;
                return [...prev, { username: lastMessage.challengerUsername, timeControl: lastMessage.timeControl }];
            });
        }

        if (lastMessage.action === 'challengeCanceled') {
            setPendingChallenges((prev) => prev.filter((c) => c.username !== lastMessage.challengerUsername));
        }

        if (lastMessage.action === 'startGame' && !location.pathname.startsWith('/game/')) {
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
    }, [lastMessage, navigate, location.pathname]);

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
            <main style={{ flex: 1, padding: '1rem', overflowY: 'auto', backgroundColor: theme.colors.background, color: theme.colors.text, position: 'relative' }}>
                <ConnectingOverlay isConnecting={!isConnected} />
                {mode === 'windows' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <img src="/images/articles/windows.svg" alt="Windows" width={48} height={48} />
                        <span style={{ fontSize: '18px', color: theme.colors.placeholder }}>Powered by Windows</span>
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
