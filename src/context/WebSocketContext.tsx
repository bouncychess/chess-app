import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { fetchAuthSession } from "aws-amplify/auth";
import { useAuth } from "./AuthContext";
import type { GameAction } from "../types/chess";

type WebSocketMessage = {
  action: GameAction;
  [key: string]: any;
};

type WebSocketContextType = {
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
  isConnected: boolean;
  username: string | null;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    let cancelled = false;

    const connectWebSocket = async () => {
      // Wait until auth state is determined
      if (isAuthenticated === null) {
        return;
      }

      // Prevent duplicate connections
      if (socketRef.current) {
        return;
      }

      try {
        // Try to get the Cognito ID token if authenticated
        let token: string | undefined;
        try {
          const session = await fetchAuthSession();
          token = session.tokens?.idToken?.toString();
        } catch {
          // Not authenticated, continue without token
        }

        // Check if cancelled during async operation (React Strict Mode cleanup)
        if (cancelled) return;

        // Connect with or without token
        console.log("Connecting to Websocket");
        const url = token ? `${WEBSOCKET_URL}?token=${token}` : WEBSOCKET_URL;
        const socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onopen = () => {
          if (cancelled) return;
          reconnectAttemptsRef.current = 0;
          setIsConnected(true);
          console.log("WebSocket connected");
          socket.send(JSON.stringify({ action: "connected" }));
        };

        socket.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            console.log("Received message:", parsed);
            if (parsed.action === "connected" && parsed.username) {
              setUsername(parsed.username);
            }
            flushSync(() => setLastMessage(parsed));
          } catch (e) {
            console.error("Invalid WS message:", event.data);
          }
        };

        socket.onclose = () => {
          socketRef.current = null;
          setIsConnected(false);
          console.warn("WebSocket closed");

          // Auto-reconnect with exponential backoff (max 30s)
          if (!cancelled) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
            reconnectAttemptsRef.current++;
            console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
            reconnectTimerRef.current = setTimeout(connectWebSocket, delay);
          }
        };

        socket.onerror = (e) => {
          console.error("WebSocket error", e);
        };
      } catch (error) {
        console.error("Failed to connect WebSocket:", error);
      }
    };

    connectWebSocket();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    console.log("Sending message:", message);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not open");
    }
  }, []);

  return (
    <WebSocketContext.Provider value={{ sendMessage, lastMessage, isConnected, username }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export function useWebSocket(): WebSocketContextType {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("useWebSocket must be used within a WebSocketProvider");
  return ctx;
}
