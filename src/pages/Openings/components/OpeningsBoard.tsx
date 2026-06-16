import { useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessground } from "@lichess-org/chessground";
import type { Api } from "@lichess-org/chessground/api";
import type { Key } from "@lichess-org/chessground/types";

export interface OpeningsBoardMove {
    uci: string;
    san: string;
    fen: string;
}

interface OpeningsBoardProps {
    fen: string;
    lastMove?: [string, string] | null;
    orientation: "white" | "black";
    size: number;
    onMove: (move: OpeningsBoardMove) => void;
}

// Legal destinations for chessground, including the extra king-target squares
// chessground expects for castling.
function getLegalDests(chess: Chess): Map<Key, Key[]> {
    const dests = new Map<Key, Key[]>();
    for (const move of chess.moves({ verbose: true })) {
        const from = move.from as Key;
        if (!dests.has(from)) dests.set(from, []);
        dests.get(from)!.push(move.to as Key);
    }
    const kingSquare = (chess.turn() === "w" ? "e1" : "e8") as Key;
    const kingDests = dests.get(kingSquare);
    if (kingDests) {
        const rank = chess.turn() === "w" ? "1" : "8";
        if (kingDests.includes(`g${rank}` as Key) && !kingDests.includes(`h${rank}` as Key)) {
            kingDests.push(`h${rank}` as Key);
        }
        if (kingDests.includes(`c${rank}` as Key) && !kingDests.includes(`a${rank}` as Key)) {
            kingDests.push(`a${rank}` as Key);
        }
    }
    return dests;
}

/**
 * A controlled chess board for the openings explorer. The parent owns the move
 * history and passes the current FEN; the board renders it, allows legal moves
 * for the side to move, and reports each move back via onMove. Promotions
 * auto-queen (rare in opening theory).
 */
function OpeningsBoard({ fen, lastMove, orientation, size, onMove }: OpeningsBoardProps) {
    const boardRef = useRef<HTMLDivElement>(null);
    const cgApiRef = useRef<Api | null>(null);
    const onMoveRef = useRef(onMove);
    const fenRef = useRef(fen);

    useEffect(() => { onMoveRef.current = onMove; }, [onMove]);
    useEffect(() => { fenRef.current = fen; }, [fen]);

    const handleMove = (orig: Key, dest: Key) => {
        const chess = new Chess(fenRef.current);
        const from = orig as string;
        let to = dest as string;

        // Translate chessground's king-onto-rook / 2-square castling into the
        // standard king destination chess.js understands.
        const piece = chess.get(from as Parameters<Chess["get"]>[0]);
        if (piece?.type === "k") {
            const rank = from[1];
            const destFile = to.charCodeAt(0) - 97;
            const origFile = from.charCodeAt(0) - 97;
            if (destFile - origFile >= 2) to = `g${rank}`;
            else if (origFile - destFile >= 2) to = `c${rank}`;
        }

        try {
            const result = chess.move({ from, to, promotion: "q" });
            if (!result) return;
            onMoveRef.current({ uci: `${result.from}${result.to}${result.promotion ?? ""}`, san: result.san, fen: chess.fen() });
        } catch {
            // Illegal move — chessground will be re-synced by the fen effect.
            cgApiRef.current?.set({ fen: fenRef.current });
        }
    };

    // Initialize chessground once.
    useEffect(() => {
        if (!boardRef.current) return;
        const chess = new Chess(fen);
        const turnColor = chess.turn() === "w" ? "white" : "black";
        const api = Chessground(boardRef.current, {
            fen,
            orientation,
            turnColor,
            coordinates: true,
            animation: { enabled: true, duration: 150 },
            movable: {
                free: false,
                color: turnColor,
                dests: getLegalDests(chess),
                showDests: true,
                events: { after: handleMove },
            },
            draggable: { enabled: true, showGhost: true },
            selectable: { enabled: true },
            highlight: { lastMove: true, check: true },
        });
        cgApiRef.current = api;
        return () => {
            api.destroy();
            cgApiRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync position, legal moves, and orientation whenever they change.
    useEffect(() => {
        const chess = new Chess(fen);
        const turnColor = chess.turn() === "w" ? "white" : "black";
        cgApiRef.current?.set({
            fen,
            orientation,
            turnColor,
            lastMove: lastMove ? [lastMove[0] as Key, lastMove[1] as Key] : undefined,
            check: chess.inCheck(),
            movable: {
                color: turnColor,
                dests: getLegalDests(chess),
            },
        });
    }, [fen, lastMove, orientation]);

    // Redraw when the board size changes.
    useEffect(() => {
        requestAnimationFrame(() => cgApiRef.current?.redrawAll());
    }, [size]);

    return (
        <div style={{ width: size, height: size, borderRadius: 8, overflow: "hidden" }}>
            <div ref={boardRef} style={{ width: "100%", height: "100%" }} />
        </div>
    );
}

export default OpeningsBoard;
