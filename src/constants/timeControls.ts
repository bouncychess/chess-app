import type { TimeControl } from "../types/chess";

export const TIME_CONTROLS: TimeControl[] = [
  { initialTime: 60000, increment: 0, label: "1+0" },
  { initialTime: 180000, increment: 0, label: "3+0" },
  { initialTime: 180000, increment: 2000, label: "3+2" },
  { initialTime: 300000, increment: 0, label: "5+0" },
  { initialTime: 600000, increment: 0, label: "10+0" },
  { initialTime: 900000, increment: 10000, label: "10+5" },
];

export const DEFAULT_TIME_CONTROL: TimeControl = TIME_CONTROLS[1];
