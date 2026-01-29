import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../../../types/chess";
import { useWebSocket } from "../../../context/WebSocketContext";
import { theme } from "../../../config/theme";

interface ChatProps {
    gameId: string;
    initialChat?: ChatMessage[];
}

function Chat({ gameId, initialChat = [] }: ChatProps) {
    const { sendMessage, lastMessage, username } = useWebSocket();
    const [chatLog, setChatLog] = useState<ChatMessage[]>(initialChat);
    const [text, setText] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [lastSeenLength, setLastSeenLength] = useState(initialChat.length);

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

    useEffect(() => {
        if (!lastMessage) return;

        // Skip if this is our own message (already added optimistically)
        if (lastMessage.action === "chat" && lastMessage.chat && lastMessage.chat.username !== username) {
            setChatLog((prevLog) => [...prevLog, lastMessage.chat]);
        }
    }, [lastMessage, username]);

    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        <div style={{
            ...theme.card,
            minWidth: 200,
            maxWidth: 350,
            width: '100%',
            height: 160,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <style>{`
                @keyframes fadeHighlight {
                    from { background-color: #e8e8e8; }
                    to { background-color: transparent; }
                }
            `}</style>
            <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                marginBottom: 12,
            }}>
                {chatLog.length === 0 ? (
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
                                animation: idx >= lastSeenLength ? 'fadeHighlight 2s ease-out' : undefined,
                            }}
                        >
                            <span style={{ fontWeight: 600, color: theme.colors.text }}>{msg.username}: </span>
                            <span style={{ color: theme.colors.text }}>{msg.message}</span>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
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
        </div>
    )

}

export default Chat;