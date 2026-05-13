// Thin wrapper around a Stockfish Web Worker. The engine files are copied
// from node_modules/stockfish/src into public/stockfish by the `copy-stockfish`
// npm script (run automatically as a `postinstall` hook).

export type Score =
  | { type: "cp"; value: number }
  | { type: "mate"; value: number };

export interface EngineInfo {
  depth: number;
  multipv: number;
  score: Score;
  // UCI moves (e.g. "e2e4")
  pv: string[];
}

export type InfoListener = (info: EngineInfo) => void;

const WORKER_URL = "/stockfish/stockfish-nnue-16-single.js";

export class StockfishEngine {
  private worker: Worker;
  private listeners = new Set<InfoListener>();
  private readyPromise: Promise<void>;

  constructor() {
    this.worker = new Worker(WORKER_URL);
    this.worker.addEventListener("message", this.handleMessage);
    this.readyPromise = this.initEngine();
  }

  private initEngine(): Promise<void> {
    return new Promise((resolve) => {
      const onMessage = (e: MessageEvent) => {
        const line = typeof e.data === "string" ? e.data : "";
        if (line === "uciok") {
          this.worker.postMessage("isready");
        } else if (line === "readyok") {
          this.worker.removeEventListener("message", onMessage);
          resolve();
        }
      };
      this.worker.addEventListener("message", onMessage);
      this.worker.postMessage("uci");
    });
  }

  private handleMessage = (e: MessageEvent) => {
    const line = typeof e.data === "string" ? e.data : "";
    if (!line.startsWith("info ")) return;
    const info = parseInfoLine(line);
    if (!info) return;
    for (const listener of this.listeners) listener(info);
  };

  onInfo(listener: InfoListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async analyze(fen: string, multipv: number): Promise<void> {
    await this.readyPromise;
    // `stop` is harmless when nothing is searching; sending it before starting
    // the next search keeps successive analyze() calls from overlapping.
    this.worker.postMessage("stop");
    this.worker.postMessage(`setoption name MultiPV value ${multipv}`);
    this.worker.postMessage(`position fen ${fen}`);
    this.worker.postMessage("go infinite");
  }

  stop(): void {
    this.worker.postMessage("stop");
  }

  destroy(): void {
    this.worker.postMessage("stop");
    this.worker.postMessage("quit");
    this.worker.removeEventListener("message", this.handleMessage);
    this.worker.terminate();
    this.listeners.clear();
  }
}

function parseInfoLine(line: string): EngineInfo | null {
  // Tokens may appear in any order. Walk through them, peeling off known keys.
  const tokens = line.split(/\s+/);
  let depth = 0;
  let multipv = 1;
  let score: Score | null = null;
  let pv: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "depth") {
      depth = parseInt(tokens[++i], 10);
    } else if (t === "multipv") {
      multipv = parseInt(tokens[++i], 10);
    } else if (t === "score") {
      const kind = tokens[++i];
      const value = parseInt(tokens[++i], 10);
      if (kind === "cp" || kind === "mate") {
        score = { type: kind, value };
      }
    } else if (t === "pv") {
      pv = tokens.slice(i + 1);
      break;
    }
  }

  if (!score) return null;
  return { depth, multipv, score, pv };
}
