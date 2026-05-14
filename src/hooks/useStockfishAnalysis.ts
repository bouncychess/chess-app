import { useEffect, useRef, useState } from "react";
import { StockfishEngine, type EngineInfo } from "../services/StockfishEngine";

export interface AnalysisState {
  // Indexed by multipv-1 (slot 0 = best line). Sparse until the engine fills it.
  lines: (EngineInfo | undefined)[];
}

const EMPTY_STATE: AnalysisState = { lines: [] };

export function useStockfishAnalysis(
  fen: string,
  enabled: boolean,
  multipv: number,
): AnalysisState {
  const engineRef = useRef<StockfishEngine | null>(null);
  const [state, setState] = useState<AnalysisState>(EMPTY_STATE);

  // Create / destroy the engine based on `enabled`. The engine is heavy
  // (multi-MB worker + 38MB NNUE), so we avoid spawning it until the user
  // actually turns analysis on.
  useEffect(() => {
    if (!enabled) return;
    const engine = new StockfishEngine();
    engineRef.current = engine;
    const unsubscribe = engine.onInfo((info) => {
      setState((prev) => {
        const lines = prev.lines.slice();
        lines[info.multipv - 1] = info;
        return { lines };
      });
    });
    return () => {
      unsubscribe();
      engine.destroy();
      engineRef.current = null;
      setState(EMPTY_STATE);
    };
  }, [enabled]);

  // Restart analysis whenever the position or multipv changes.
  useEffect(() => {
    if (!enabled) return;
    const engine = engineRef.current;
    if (!engine) return;
    // Clear stale lines so the UI doesn't show evaluations from the previous
    // position while the engine spins up on the new one.
    setState(EMPTY_STATE);
    engine.analyze(fen, multipv);
  }, [fen, multipv, enabled]);

  return enabled ? state : EMPTY_STATE;
}
