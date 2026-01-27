import React, { createContext, useContext, useEffect, useRef, useState } from "react";
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
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Prevent duplicate connections (React Strict Mode runs effects twice)
    if (socketRef.current) {
      return;
    }

    const connectWebSocket = async () => {
      try {
        // Try to get the Cognito ID token if authenticated
        let token: string | undefined;
        try {
          const session = await fetchAuthSession();
          token = session.tokens?.idToken?.toString();
        } catch {
          // Not authenticated, continue without token
        }

        // Connect with or without token
        const url = token ? `${WEBSOCKET_URL}?token=${token}` : WEBSOCKET_URL;
        const socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onopen = () => {
          setIsConnected(true);
          console.log("WebSocket connected");
          socket.send(JSON.stringify({ action: "connected" }));
        };

        socket.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            setLastMessage(parsed);
          } catch (e) {
            console.error("Invalid WS message:", event.data);
          }
        };

        socket.onclose = () => {
          setIsConnected(false);
          console.warn("WebSocket closed");
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
      socketRef.current?.close();
    };
  }, [isAuthenticated]);

  const sendMessage = (message: WebSocketMessage) => {
    console.log("Sending message:", message);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not open");
    }
  };

  return (
    <WebSocketContext.Provider value={{ sendMessage, lastMessage, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export function useWebSocket(): WebSocketContextType {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("useWebSocket must be used within a WebSocketProvider");
  return ctx;
}
