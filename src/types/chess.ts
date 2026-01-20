export type PlayerColor = "white" | "black";

export type GameAction = "play" | "move" | "chat" | "startGame" | "players" | "connected";

export interface Player {
  id: string;
  name: string;
  status: string;
}
