import type { Theme } from "../../../config/theme";
import type { ExplorerResponse, ExplorerMove } from "../../../services/openingExplorer";
import WdlBar from "./WdlBar";

interface ExplorerPanelProps {
    data: ExplorerResponse | null;
    loading: boolean;
    error: string | null;
    theme: Theme;
    onPlayMove: (move: ExplorerMove) => void;
    // In play mode the move frequencies and results are concealed so the user
    // can't see the answer while it's their turn.
    hidden?: boolean;
}

function formatCount(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 10_000) return `${Math.round(n / 1000)}k`;
    if (n >= 1_000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
}

function moveTotal(m: ExplorerMove): number {
    return m.white + m.draws + m.black;
}

function ExplorerPanel({ data, loading, error, theme, onPlayMove, hidden = false }: ExplorerPanelProps) {
    const positionTotal = data ? data.white + data.draws + data.black : 0;

    if (hidden) {
        return (
            <div style={{ ...theme.card, display: "flex", flexDirection: "column", gap: 8, padding: "18px 16px", textAlign: "center" }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: theme.colors.cardText }}>
                    {data?.opening ? data.opening.name : "Play mode"}
                </div>
                <div style={{ fontSize: "0.82rem", color: theme.colors.placeholder }}>
                    Moves and results are hidden. Make your move — the opponent will reply from the
                    book.
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                ...theme.card,
                width: 360,
                maxWidth: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: 0,
            }}
        >
            {/* Header: opening name + total games */}
            <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${theme.colors.border}` }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: theme.colors.cardText, minHeight: "1.2em" }}>
                    {data?.opening ? (
                        <>
                            <span style={{ color: theme.colors.placeholder, fontWeight: 600, marginRight: 6 }}>
                                {data.opening.eco}
                            </span>
                            {data.opening.name}
                        </>
                    ) : (
                        <span style={{ color: theme.colors.placeholder }}>Starting position</span>
                    )}
                </div>
                <div style={{ fontSize: "0.78rem", color: theme.colors.placeholder, marginTop: 4 }}>
                    {loading
                        ? "Loading…"
                        : data
                          ? `${formatCount(positionTotal)} games`
                          : ""}
                </div>
            </div>

            {error && (
                <div style={{ padding: "0 16px 12px", color: theme.colors.danger, fontSize: "0.82rem" }}>
                    {error}
                </div>
            )}

            {/* Moves table — ~5 rows visible, the rest scrolls */}
            <div style={{ maxHeight: 210, overflowY: "auto" }}>
                {data && data.moves.length > 0 ? (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                        <thead>
                            <tr style={{ color: theme.colors.placeholder, fontSize: "0.72rem", textAlign: "left" }}>
                                <th style={{ padding: "4px 16px", fontWeight: 600, position: "sticky", top: 0, background: theme.colors.cardBackground, zIndex: 1 }}>Move</th>
                                <th style={{ padding: "4px 8px", fontWeight: 600, textAlign: "right", position: "sticky", top: 0, background: theme.colors.cardBackground, zIndex: 1 }}>Games</th>
                                <th style={{ padding: "4px 16px 4px 12px", fontWeight: 600, position: "sticky", top: 0, background: theme.colors.cardBackground, zIndex: 1 }}>White / Draw / Black</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.moves.map((m) => {
                                const mTotal = moveTotal(m);
                                const share = positionTotal > 0 ? Math.round((mTotal / positionTotal) * 100) : 0;
                                return (
                                    <tr
                                        key={m.uci}
                                        onClick={() => onPlayMove(m)}
                                        style={{
                                            cursor: "pointer",
                                            borderTop: `1px solid ${theme.colors.border}`,
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = theme.colors.moveHighlight)}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    >
                                        <td style={{ padding: "8px 16px", fontWeight: 700, color: theme.colors.cardText, whiteSpace: "nowrap" }}>
                                            {m.san}
                                        </td>
                                        <td style={{ padding: "8px 8px", textAlign: "right", color: theme.colors.cardText, whiteSpace: "nowrap" }}>
                                            {formatCount(mTotal)}
                                            <span style={{ color: theme.colors.placeholder, fontSize: "0.72rem", marginLeft: 4 }}>
                                                {share}%
                                            </span>
                                        </td>
                                        <td style={{ padding: "8px 16px 8px 12px", width: 150 }}>
                                            <WdlBar white={m.white} draws={m.draws} black={m.black} height={18} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    !loading && (
                        <div style={{ padding: "0 16px 16px", color: theme.colors.placeholder, fontSize: "0.82rem" }}>
                            {data ? "No games found for this position with the current filters." : ""}
                        </div>
                    )
                )}
            </div>

            {/* Top games */}
            {data && data.topGames.length > 0 && (
                <div style={{ padding: "10px 16px 16px", borderTop: `1px solid ${theme.colors.border}` }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: theme.colors.placeholder, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>
                        Top games
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {data.topGames.map((g) => (
                            <a
                                key={g.id}
                                href={`https://lichess.org/${g.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 8,
                                    fontSize: "0.78rem",
                                    color: theme.colors.cardText,
                                    textDecoration: "none",
                                }}
                            >
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {g.white.name} ({g.white.rating}) – {g.black.name} ({g.black.rating})
                                </span>
                                <span style={{ color: theme.colors.placeholder, whiteSpace: "nowrap" }}>
                                    {g.winner === "white" ? "1-0" : g.winner === "black" ? "0-1" : "½-½"}
                                    {g.year ? ` · ${g.year}` : ""}
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ExplorerPanel;
