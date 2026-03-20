import { useEffect, useRef, useState } from "react";
import type { ChatMessage, GameResult, GameEndReason } from "../../../types/chess";
import { useWebSocket } from "../../../context/WebSocketContext";
import { formatGameEndMessage } from "../../../components/game/GameEndDisplay";
import { theme } from "../../../config/theme";
import { ResizableCard } from "../../../components/ResizableCard";

interface ChatProps {
    gameId: string;
    initialChat?: ChatMessage[];
    collapsible?: boolean;
    gameEndReason?: GameEndReason | null;
    gameResult?: GameResult | null;
}

function Chat({ gameId, initialChat = [], collapsible = false, gameEndReason, gameResult }: ChatProps) {
    const { sendMessage, subscribe, username } = useWebSocket();
    const usernameRef = useRef(username);
    const [chatLog, setChatLog] = useState<ChatMessage[]>(initialChat);
    const [text, setText] = useState<string>('');
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [lastSeenLength, setLastSeenLength] = useState(initialChat.length);
    const [endReason, setEndReason] = useState(gameEndReason);
    const [endResult, setEndResult] = useState(gameResult);

    // Sync initial chat when it changes (e.g., gameState loaded)
    useEffect(() => {
        if (initialChat.length > 0) {
            setChatLog(initialChat);
            setLastSeenLength(initialChat.length);
        }
    }, [initialChat]);

    // Clear highlight after animation completes
    useEffect(() => {
        if (chatLog.length > lastSeenLength) {
            const timer = setTimeout(() => {
                setLastSeenLength(chatLog.length);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [chatLog.length, lastSeenLength]);

    useEffect(() => { usernameRef.current = username; }, [username]);

    useEffect(() => {
        return subscribe((msg) => {
            // Handle chat messages (skip our own - already added optimistically)
            if (msg.action === "chat" && msg.gameId === gameId && msg.chat && msg.chat.username !== usernameRef.current) {
                setChatLog((prevLog) => [...prevLog, msg.chat]);
            }

            // Handle chat that comes with move messages (e.g., from bots)
            if (msg.action === "move" && msg.gameId === gameId && msg.chat) {
                setChatLog((prevLog) => [...prevLog, msg.chat]);
            }

            // Handle game end — update result state for rendering
            if (msg.action === "gameEnd" && msg.gameId === gameId) {
                setEndReason(msg.reason);
                setEndResult(msg.result);
            }
        });
    }, [subscribe, gameId]);

    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }, [chatLog]);

    const sendChat = (message: ChatMessage) => {
        if (gameId) {
          setChatLog((prevLog) => [...prevLog, message]);
          sendMessage({
            action: "chat",
            gameId,
            message
          });
        }
      };

    const onChat = (message: ChatMessage) => {
        try {
          sendChat(message);
        } catch (e) {
          console.error("Failed to send chat", e);
        }
        return false;
      };

    return (
        <ResizableCard
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            collapsible={collapsible}
            collapsedLabel="Chat"
        >
            <style>{`
                @keyframes fadeHighlight {
                    from { background-color: #e8e8e8; }
                    to { background-color: transparent; }
                }
            `}</style>
            <div
                ref={messagesContainerRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    marginBottom: 12,
                }}
            >
                {chatLog.length === 0 && !endReason? (
                    <div style={{ color: theme.colors.placeholder, fontSize: '0.875rem' }}>
                        No messages yet
                    </div>
                ) : (
                    chatLog.map((msg, idx) => (
                        <div
                            key={idx}
                            style={{
                                fontSize: '0.875rem',
                                lineHeight: 1.4,
                                padding: '2px 4px',
                                borderRadius: 4,
                                wordBreak: 'break-word',
                                animation: idx >= lastSeenLength ? 'fadeHighlight 2s ease-out' : undefined,
                                fontStyle: msg.isSystem ? 'italic' : 'normal',
                            }}
                        >
                            {msg.isSystem ? (
                                <span style={{ color: theme.colors.placeholder }}>{msg.message}</span>
                            ) : (
                                <>
                                    <span style={{ fontWeight: 600, color: theme.colors.text }}>{msg.username}: </span>
                                    <span style={{ color: theme.colors.text }}>{msg.message}</span>
                                </>
                            )}
                        </div>
                    ))
                )}
                {endResult && endReason && (
                    <div style={{ fontSize: '0.875rem', padding: '2px 4px', fontStyle: 'italic' }}>
                        <span style={{ color: theme.colors.placeholder }}>
                            {formatGameEndMessage(endResult, endReason).title} — {formatGameEndMessage(endResult, endReason).subtitle}
                        </span>
                    </div>
                )}
            </div>
            <div>
                <input
                    type="text"
                    placeholder={username ? "Type a message..." : "Connecting..."}
                    value={text}
                    disabled={!username}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && text.trim() && username) {
                            onChat({ username, message: text.trim() });
                            setText('');
                        }
                    }}
                    style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: 4,
                        fontSize: '0.875rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: theme.colors.cardBackground,
                        color: theme.colors.text,
                    }}
                />
            </div>
        </ResizableCard>
    )

}

export default Chat;
