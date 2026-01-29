import { useEffect, useState } from "react";
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

    // Sync initial chat when it changes (e.g., gameState loaded)
    useEffect(() => {
        if (initialChat.length > 0) {
            setChatLog(initialChat);
        }
    }, [initialChat]);

    useEffect(() => {
        if (!lastMessage) return;

        if (lastMessage.action === "chat" && lastMessage.chat) {
            setChatLog((prevLog) => [...prevLog, lastMessage.chat]);
        }
    }, [lastMessage]);

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
        <div>
            <input
            type="text"
            placeholder="Type message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && text.trim() && username) {
                    onChat({ username, message: text.trim() });
                    setText('');
                }
            }}
            />
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #ccc', padding: 8 }}>
            {chatLog.map((msg, idx) => (
                <div key={idx}><strong>{msg.username}:</strong> {msg.message}</div>
            ))}
            </div>
        </div>
    )

}

export default Chat;