import type { TimeControl } from "../types/chess";

export const TIME_CONTROLS: TimeControl[] = [
  { initialTime: 60000, increment: 0, label: "1+0" },
  { initialTime: 180000, increment: 0, label: "3+0" },
  { initialTime: 180000, increment: 2000, label: "3+2" },
  { initialTime: 300000, increment: 0, label: "5+0" },
  { initialTime: 600000, increment: 0, label: "10+0" },
  { initialTime: 600000, increment: 5000, label: "10+5" },
];

export const DEFAULT_TIME_CONTROL: TimeControl = TIME_CONTROLS[1];

// tcKey produces the canonical "<initialMs>+<incrementMs>" string used as the
// map key in user.ratings, in chess-play's PlayerInfo.timeControl, and in the
// ratingUpdate WebSocket message. Must mirror chess-play/time_controls.go and
// chess-service/app/services/time_controls.py.
export const tcKey = (tc: { initialTime: number; increment: number }): string =>
    `${tc.initialTime}+${tc.increment}`;

// The TC whose rating is shown next to a player who is just online (not
// waiting/playing). Mirrors chess-play's defaultPlayerListTCKey.
export const DEFAULT_PLAYER_LIST_TC_KEY = tcKey({ initialTime: 180000, increment: 0 });
