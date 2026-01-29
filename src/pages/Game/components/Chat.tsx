import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../../../types/chess";
import { useWebSocket } from "../../../context/WebSocketContext";

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

        if (lastMessage.action === "chat" && lastMessage.chat) {
            setChatLog((prevLog) => [...prevLog, lastMessage.chat]);
        }
    }, [lastMessage]);

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
            width: 480,
            maxWidth: '100%',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: '#fff',
            marginTop: 16,
        }}>
            <style>{`
                @keyframes fadeHighlight {
                    from { background-color: #e8e8e8; }
                    to { background-color: transparent; }
                }
            `}</style>
            <div style={{
                height: 150,
                overflowY: 'auto',
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
            }}>
                {chatLog.length === 0 ? (
                    <div style={{ color: '#999', fontSize: 13, fontStyle: 'italic' }}>
                        No messages yet
                    </div>
                ) : (
                    chatLog.map((msg, idx) => (
                        <div
                            key={idx}
                            style={{
                                fontSize: 14,
                                lineHeight: 1.4,
                                padding: '2px 4px',
                                borderRadius: 4,
                                animation: idx >= lastSeenLength ? 'fadeHighlight 2s ease-out' : undefined,
                            }}
                        >
                            <span style={{ fontWeight: 600, color: '#333' }}>{msg.username}: </span>
                            <span style={{ color: '#555' }}>{msg.message}</span>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            <div style={{
                padding: 8,
                borderTop: '1px solid #e0e0e0',
                backgroundColor: '#fafafa',
            }}>
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
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box',
                    }}
                />
            </div>
        </div>
    )

}

export default Chat;