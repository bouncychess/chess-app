export type PlayerColor = "white" | "black";

export type GameResult = "white" | "black" | "draw";

export type GameEndReason =
  | "checkmate"
  | "resignation"
  | "timeout"
  | "stalemate"
  | "insufficient_material"
  | "fifty_move_rule"
  | "threefold_repetition"
  | "agreement";

export type GameAction = 
  | "play" 
  | "gameEnd" 
  | "move" 
  | "chat" 
  | "connected" 
  | "startGame" 
  | "players" 
  | "getPlayers" 
  | "clockSync" 
  | "timeout" 
  | "getGameState" 
  | "gameState" 
  | "playBot";

export interface Player {
  id: string;
  username: string;
  status: string;
  gameId?: string;
  isBot?: boolean;
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