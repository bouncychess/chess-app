import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Player } from "../../../types/chess";
import { theme } from "../../../config/theme";
import { ResizableCard } from "../../../components/ResizableCard";
import { Button } from "../../../components/buttons/Button";

interface GameGroup {
  gameId: string;
  players: Player[];
  spectators: Player[];
  isBotGame: boolean;
  sortKey: string;
}

interface PlayersProps {
  players: Player[];
  currentUsername?: string;
  onPlayBot?: (botUsername: string) => void;
}

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: theme.colors.placeholder,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginTop: 8,
  marginBottom: 4,
  cursor: "pointer",
  userSelect: "none",
  display: "flex",
  alignItems: "center",
  gap: 4,
};

const rowStyle: React.CSSProperties = {
  padding: "4px 8px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderRadius: 4,
  fontSize: "0.875rem",
  color: theme.colors.text,
};

function CollapsibleSection({ title, children, defaultExpanded = true }: {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <div>
      <div style={sectionHeaderStyle} onClick={() => setExpanded(!expanded)}>
        <span>{expanded ? "▾" : "▸"}</span>
        <span>{title}</span>
      </div>
      {expanded && children}
    </div>
  );
}

function Players({ players, currentUsername, onPlayBot }: PlayersProps) {
  const { activeGames, waitingPlayers, onlinePlayers, idleBots } = useMemo(() => {
    const gamesMap = new Map<string, { players: Player[]; spectators: Player[] }>();
    const waiting: Player[] = [];
    const online: Player[] = [];
    const bots: Player[] = [];

    for (const player of players) {
      if ((player.status === "playing" || player.status === "spectating") && player.gameId) {
        const game = gamesMap.get(player.gameId) || { players: [], spectators: [] };
        if (player.status === "playing") game.players.push(player);
        else game.spectators.push(player);
        gamesMap.set(player.gameId, game);
      } else if (player.status === "waiting") {
        waiting.push(player);
      } else if (player.isBot) {
        bots.push(player);
      } else {
        online.push(player);
      }
    }

    // Build sorted game groups, filtering out orphaned PvP games (1 player left, not bot)
    const games: GameGroup[] = [];
    for (const [gameId, group] of gamesMap) {
      const isBotGame = group.players.length === 1 && !!group.players[0].opponentIsBot;
      // Skip orphaned PvP games where one player has left
      if (!isBotGame && group.players.length < 2) continue;

      const names = isBotGame
        ? [group.players[0].username, group.players[0].opponentUsername || "Bot"].sort()
        : group.players.map(p => p.username).sort();
      games.push({
        gameId,
        players: group.players,
        spectators: group.spectators,
        isBotGame,
        sortKey: names.join(":"),
      });
    }

    // PvP first, bot games last; within each, sort by player-pair key
    games.sort((a, b) => {
      if (a.isBotGame !== b.isBotGame) return a.isBotGame ? 1 : -1;
      return a.sortKey.localeCompare(b.sortKey);
    });

    return { activeGames: games, waitingPlayers: waiting, onlinePlayers: online, idleBots: bots };
  }, [players]);

  const highlightBg = (username: string) =>
    username === currentUsername ? "rgba(34, 197, 94, 0.3)" : "transparent";

  const renderSpectators = (game: GameGroup, leftUsername: string, rightUsername: string) => {
    if (game.spectators.length === 0) return null;

    // Split spectators into two columns based on who they're spectating
    const leftSpectators = game.spectators.filter(s => s.spectatingUsername === leftUsername);
    const rightSpectators = game.spectators.filter(s => s.spectatingUsername === rightUsername);
    // Unassigned spectators default to the left column
    const unassigned = game.spectators.filter(s =>
      s.spectatingUsername !== leftUsername && s.spectatingUsername !== rightUsername
    );
    const leftAll = [...leftSpectators, ...unassigned];

    const maxRows = Math.max(leftAll.length, rightSpectators.length);
    if (maxRows === 0) return null;

    return Array.from({ length: maxRows }, (_, i) => (
      <div key={`spec-${i}`} style={{ ...rowStyle, justifyContent: "space-between" }}>
        <span style={{
          flex: 1,
          backgroundColor: leftAll[i] ? highlightBg(leftAll[i].username) : "transparent",
          borderRadius: 4,
          padding: "0 4px",
        }}>
          {leftAll[i]?.username || ""}
        </span>
        <span style={{ width: 24 }} />
        <span style={{
          flex: 1,
          textAlign: "right",
          backgroundColor: rightSpectators[i] ? highlightBg(rightSpectators[i].username) : "transparent",
          borderRadius: 4,
          padding: "0 4px",
        }}>
          {rightSpectators[i]?.username || ""}
        </span>
      </div>
    ));
  };

  const renderGameRow = (game: GameGroup) => {
    if (game.isBotGame && game.players.length === 1) {
      const player = game.players[0];
      const botName = player.opponentUsername || "Bot";
      const isWhite = player.color === "white";
      const leftName = isWhite ? player.username : botName;
      const rightName = isWhite ? botName : player.username;
      const leftIsPlayer = isWhite;

      return (
        <div key={game.gameId}>
          <div style={{ ...rowStyle, backgroundColor: highlightBg(player.username) }}>
            {leftIsPlayer ? (
              <Link to={`/game/${game.gameId}`} state={{ spectatingUsername: player.username }} style={{ color: theme.colors.link, textDecoration: "none" }}>
                {leftName}
              </Link>
            ) : (
              <span>{leftName}</span>
            )}
            <span style={{ color: theme.colors.placeholder, margin: "0 4px" }}>vs</span>
            {!leftIsPlayer ? (
              <Link to={`/game/${game.gameId}`} state={{ spectatingUsername: player.username }} style={{ color: theme.colors.link, textDecoration: "none" }}>
                {rightName}
              </Link>
            ) : (
              <span>{rightName}</span>
            )}
          </div>
          {renderSpectators(game, leftName, rightName)}
        </div>
      );
    }

    // PvP game
    const white = game.players.find(p => p.color === "white");
    const black = game.players.find(p => p.color === "black");
    const left = white || game.players[0];
    const right = black || game.players[1];

    return (
      <div key={game.gameId}>
        <div style={{ ...rowStyle, backgroundColor: left && right ? (highlightBg(left.username) !== "transparent" ? highlightBg(left.username) : highlightBg(right?.username || "")) : "transparent" }}>
          {left && (
            <Link to={`/game/${game.gameId}`} state={{ spectatingUsername: left.username }} style={{ color: theme.colors.link, textDecoration: "none" }}>
              {left.username}
            </Link>
          )}
          <span style={{ color: theme.colors.placeholder, margin: "0 4px" }}>vs</span>
          {right && (
            <Link to={`/game/${game.gameId}`} state={{ spectatingUsername: right.username }} style={{ color: theme.colors.link, textDecoration: "none" }}>
              {right.username}
            </Link>
          )}
        </div>
        {renderSpectators(game, left?.username || "", right?.username || "")}
      </div>
    );
  };

  return (
    <ResizableCard style={{ height: "100%", display: "flex", flexDirection: "column", width: 250 }}>
      <h3 style={{ ...theme.cardHeader, flexShrink: 0 }}>Players</h3>
      {players.length === 0 ? (
        <p style={{ color: theme.colors.placeholder, fontSize: "0.875rem", margin: 0 }}>No players online</p>
      ) : (
        <div style={{ flex: 1, overflowY: "auto" }}>
          {activeGames.length > 0 && (
            <CollapsibleSection title="Active Games">
              {activeGames.map(renderGameRow)}
            </CollapsibleSection>
          )}
          {waitingPlayers.length > 0 && (
            <CollapsibleSection title="Waiting">
              {waitingPlayers.map(player => (
                <div key={player.username} style={{ ...rowStyle, backgroundColor: highlightBg(player.username) }}>
                  <span>{player.username}</span>
                  {player.timeControl && (
                    <span style={{ color: theme.colors.placeholder }}>{player.timeControl}</span>
                  )}
                </div>
              ))}
            </CollapsibleSection>
          )}
          {onlinePlayers.length > 0 && (
            <CollapsibleSection title="Online">
              {onlinePlayers.map(player => (
                <div key={player.username} style={{ ...rowStyle, backgroundColor: highlightBg(player.username) }}>
                  <span>{player.username}</span>
                </div>
              ))}
            </CollapsibleSection>
          )}
          {idleBots.length > 0 && (
            <CollapsibleSection title="Bots">
              {idleBots.map(player => (
                <div key={player.username} style={{ ...rowStyle, backgroundColor: highlightBg(player.username) }}>
                  <span>{player.username}</span>
                  {onPlayBot && (
                    <Button variant="danger" size="sm" onClick={() => onPlayBot(player.username)}>
                      Play
                    </Button>
                  )}
                </div>
              ))}
            </CollapsibleSection>
          )}
        </div>
      )}
    </ResizableCard>
  );
}

export default Players;
