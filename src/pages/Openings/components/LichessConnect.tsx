import type { Theme } from "../../../config/theme";
import type { LichessAuth } from "../../../hooks/useLichessAuth";
import { Button } from "../../../components/buttons/Button";

interface LichessConnectProps {
    auth: LichessAuth;
    theme: Theme;
}

/**
 * Connection bar for the lichess account. Lichess requires an authenticated
 * token for the opening explorer, so this both explains that and drives the
 * OAuth login/logout.
 */
function LichessConnect({ auth, theme }: LichessConnectProps) {
    const { status, username, isAuthorized, error, login, logout } = auth;

    const card: React.CSSProperties = {
        ...theme.card,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 16px",
        fontSize: "0.85rem",
    };

    if (status === "loading") {
        return (
            <div style={card}>
                <span style={{ color: theme.colors.placeholder }}>Checking lichess connection…</span>
            </div>
        );
    }

    if (status === "connected" && username) {
        return (
            <div style={card}>
                <span style={{ color: theme.colors.cardText }}>
                    Connected as <strong>{username}</strong>
                </span>
                <Button size="sm" variant="secondary" onClick={() => void logout()}>
                    Disconnect
                </Button>
            </div>
        );
    }

    // Anonymous or error. If a dev env token is in use, the explorer still works
    // — surface that but allow connecting a real account too.
    return (
        <div style={{ ...card, flexDirection: "column", alignItems: "stretch" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: theme.colors.cardText }}>
                    {isAuthorized ? "Using local dev token" : "Connect a lichess account"}
                </span>
                <Button size="sm" variant="primary" onClick={login}>
                    Connect lichess
                </Button>
            </div>
            {!isAuthorized && (
                <div style={{ color: theme.colors.placeholder, marginTop: 8, lineHeight: 1.4 }}>
                    Lichess requires sign-in to use the opening explorer. Connecting authorizes
                    requests with your own account.
                </div>
            )}
            {error && (
                <div style={{ color: theme.colors.danger, marginTop: 8 }}>{error}</div>
            )}
        </div>
    );
}

export default LichessConnect;
