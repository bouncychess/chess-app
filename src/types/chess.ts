export type PlayerColor = "white" | "black";

export type GameAction = "play" | "move" | "chat" | "startGame" | "players";

export interface Player {
  id: string;
  name: string;
  status: string;
}
