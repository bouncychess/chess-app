export type PlayerColor = "white" | "black";

export type GameAction = "play" | "move" | "chat" | "startGame" | "players" | "connected" | "clockSync" | "timeout";

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
