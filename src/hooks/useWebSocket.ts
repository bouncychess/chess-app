import { useEffect, useRef } from "react";

type MessageHandler = (data: any) => void;

export function useWebSocket(onMessage: MessageHandler) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("wss://fawbaixsvh.execute-api.us-east-1.amazonaws.com/dev/");

    ws.onopen = () => {
      console.log("WebSocket connected");
      ws.send(JSON.stringify({ action: "play" }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    ws.onerror = (err) => console.error("WebSocket error:", err);
    ws.onclose = () => console.log("WebSocket disconnected");

    socketRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  const send = (message: any) => {
    socketRef.current?.send(JSON.stringify(message));
  };

  return { send };
}