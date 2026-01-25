import { useEffect, useState } from "react";
import { useWebSocket } from "../../../context/WebSocketContext";

interface ChatProps {
    gameId: string;
}

function Chat(props: ChatProps) {
    const { sendMessage, lastMessage} = useWebSocket();
    const [chatLog, setChatLog] = useState<string[]>([]);
    const [text, setText] = useState<string>('');
    const gameId = props.gameId;

    useEffect(() => {
        if (!lastMessage) return;

        if (lastMessage.action === "chat") {
            const chatText = `Rat: ${lastMessage.message}`;
            setChatLog((prevLog) => [...prevLog, chatText]);
        }
    }, [lastMessage]);

    const sendChat = (message: string) => {
        if (gameId) {
          const chatText = `Player: ${message}`;
          setChatLog((prevLog) => [...prevLog, chatText]);
          sendMessage({
            action: "chat",
            gameId,
            message
          });
        }
      };

    const onChat = (message: string) => {
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
                if (e.key === 'Enter') {
                onChat(text);
                setText('');
                }
            }}
            />
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #ccc', padding: 8 }}>
            {chatLog.map((line, idx) => (
                <div key={idx}>{line}</div>
            ))}
            </div>
        </div>
    )

}

export default Chat;