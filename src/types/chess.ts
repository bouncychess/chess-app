export type PlayerColor = "white" | "black";

export type GameAction = "play" | "gameEnded" | "move" | "chat" | "connected" | "startGame" | "players" | "getPlayers" | "clockSync" | "timeout" | "getGameState" | "gameState";

export interface Player {
  id: string;
  username: string;
  status: string;
}

export interface TimeControl {
  initialTime: number;  // milliseconds
  increment: number;    // milliseconds per move
  label: string;        // e.g., "10 min", "3 | 2"
}

export interface ChatMessage {
  username: string;
  message: string;
}