import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useWebSocket } from "../../context/WebSocketContext";
import { useTheme } from "../../context/ThemeContext";
import Board from "../../components/game/Board";
import Chat from "./components/Chat";
import { GameClock } from "../../components/game/GameClock";
import { MoveNotation } from "../../components/game/MoveNotation";
import { GameControls } from "../../components/game/GameControls";
import { GameEndDisplay } from "../../components/game/GameEndDisplay";
import { StatusBadge } from "../../components/StatusBadge";
import { getFenAtMoveIndex, getMoveCount } from "../../utils/chess";
import type { PlayerColor, ChatMessage, GameResult, GameEndReason } from "../../types/chess";

interface GameState {
  playerColor: PlayerColor;
  currentTurn: PlayerColor;
  whiteTime: number;
  blackTime: number;
  whiteUsername: string | null;
  blackUsername: string | null;
  increment: number;
}

// Ratio of sidebar space for MoveNotation (0-1). Chat gets the remaining space.
// 0.5 = equal split, 0.6 = MoveNotation gets 60%, etc.
const MOVE_NOTATION_RATIO = 0.6;

function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const location = useLocation();
  const { sendMessage, lastMessage, isConnected, username } = useWebSocket();
  const { mode } = useTheme();
  const navigate = useNavigate();
  const [boardSize, setBoardSize] = useState(400);
  const [flipped, setFlipped] = useState(false);
  const panelOffset = mode === 'windows' ? 67 : 85;

  // Initialize from navigation state
  const initialState = location.state as (GameState & { spectatingUsername?: string }) | null;
  const [spectatingUsername] = useState<string | null>(initialState?.spectatingUsername ?? null);
  const [playerColor, setPlayerColor] = useState<PlayerColor>(initialState?.playerColor ?? "white");
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>(initialState?.currentTurn ?? "white");
  const [whiteTime, setWhiteTime] = useState<number>(initialState?.whiteTime ?? 180000);
  const [blackTime, setBlackTime] = useState<number>(initialState?.blackTime ?? 180000);
  const [whiteUsername, setWhiteUsername] = useState<string | null>(initialState?.whiteUsername ?? null);
  const [blackUsername, setBlackUsername] = useState<string | null>(initialState?.blackUsername ?? null);
  const [increment, setIncrement] = useState<number>(initialState?.increment ?? 0);
  const [pgn, setPgn] = useState<string | null>(null);
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<'online' | 'disconnected' | 'playing' | 'loading'>('loading');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [gameEndReason, setGameEndReason] = useState<GameEndReason | null>(null);
  const [viewedMoveIndex, setViewedMoveIndex] = useState<number | null>(null);
  const [pendingDrawOffer, setPendingDrawOffer] = useState<string | null>(null);
  const [hasOfferedDraw, setHasOfferedDraw] = useState(false);
  const [initialTime, setInitialTime] = useState<number | null>(null);
  const [rematchOfferedBy, setRematchOfferedBy] = useState<string | null>(null);
  const [isWaitingNewGame, setIsWaitingNewGame] = useState(false);
  const hasRequestedGameState = useRef(false);
  const hasReportedTimeout = useRef(false);

  // Derived values for rematch/new game
  const isPlayer = username !== null && (username === whiteUsername || username === blackUsername);
  const opponentUsername = username === whiteUsername ? blackUsername : whiteUsername;
  const hasOfferedRematch = rematchOfferedBy === username;
  const opponentOfferedRematch = rematchOfferedBy !== null && rematchOfferedBy !== username;

  // Derived values for move navigation
  const totalMoveCount = getMoveCount(pgn || "");
  // Viewing history means looking at a position other than the latest (including starting position -1)
  const isViewingHistory = viewedMoveIndex !== null &&
    (viewedMoveIndex === -1 || viewedMoveIndex < totalMoveCount - 1);
  const displayPosition = viewedMoveIndex !== null
    ? getFenAtMoveIndex(pgn || "", viewedMoveIndex)
    : null;

  // Always request fresh game state from server when connected
  useEffect(() => {
    if (isConnected && gameId && !hasRequestedGameState.current) {
      hasRequestedGameState.current = true;
      sendMessage({ action: "getGameState", gameId });
      // Re-register as spectator on connect/reconnect so the new connection ID is tracked
      if (spectatingUsername) {
        sendMessage({ action: "spectatePlayer", username: spectatingUsername });
      }
    }
  }, [isConnected, gameId, sendMessage, spectatingUsername]);

  // Resync when tab regains focus — moves are incremental so any missed
  // messages while backgrounded leave the board out of sync
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isConnected && gameId) {
        sendMessage({ action: "getGameState", gameId });
        if (spectatingUsername) {
          sendMessage({ action: "spectatePlayer", username: spectatingUsername });
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isConnected, gameId, sendMessage, spectatingUsername]);

  const handleTurnChange = useCallback((newTurn: PlayerColor) => {
    setCurrentTurn(newTurn);
    setGameStarted(true);
    if (newTurn === "black") {
      setWhiteTime(prev => prev + increment);
    } else {
      setBlackTime(prev => prev + increment);
    }
  }, [increment]);

  const handlePgnChange = (newPgn: string) => {
    setPgn(newPgn);
    // Select the latest move
    const newMoveCount = getMoveCount(newPgn);
    setViewedMoveIndex(newMoveCount > 0 ? newMoveCount - 1 : null);
  };

  const handleMoveClick = (moveIndex: number) => {
    setViewedMoveIndex(moveIndex);
  };

  const handleResign = useCallback(() => {
    if (gameId && gameResult === null) {
      sendMessage({ action: "resign", gameId });
    }
  }, [gameId, gameResult, sendMessage]);

  const handleOfferDraw = useCallback(() => {
    if (gameId && gameResult === null && !hasOfferedDraw) {
      sendMessage({ action: "offerDraw", gameId });
      setHasOfferedDraw(true);
    }
  }, [gameId, gameResult, hasOfferedDraw, sendMessage]);

  const handleAcceptDraw = useCallback(() => {
    if (gameId && pendingDrawOffer) {
      sendMessage({ action: "respondDraw", gameId, accept: true });
      setPendingDrawOffer(null);
    }
  }, [gameId, pendingDrawOffer, sendMessage]);

  const handleDeclineDraw = useCallback(() => {
    if (gameId && pendingDrawOffer) {
      sendMessage({ action: "respondDraw", gameId, accept: false });
      setPendingDrawOffer(null);
    }
  }, [gameId, pendingDrawOffer, sendMessage]);

  const handleRematch = useCallback(() => {
    if (!gameId) return;
    if (hasOfferedRematch) {
      // Cancel own rematch offer
      sendMessage({ action: "offerRematch", gameId });
      setRematchOfferedBy(null);
    } else {
      // Offer or accept rematch
      sendMessage({ action: "offerRematch", gameId });
      if (opponentOfferedRematch) {
        // Accepting — server will create new game, we'll navigate on startGame message
      } else {
        setRematchOfferedBy(username);
      }
    }
  }, [gameId, hasOfferedRematch, opponentOfferedRematch, username, sendMessage]);

  const handleNewGame = useCallback(() => {
    if (initialTime === null) return;
    if (isWaitingNewGame) {
      // Cancel queue
      sendMessage({ action: "play", cancel: true });
      setIsWaitingNewGame(false);
    } else {
      sendMessage({ action: "play", timeControl: { initialTime, increment } });
      setIsWaitingNewGame(true);
    }
  }, [initialTime, increment, isWaitingNewGame, sendMessage]);

  const handleNavigate = useCallback((direction: "prev" | "next") => {
    if (direction === "prev") {
      if (viewedMoveIndex === null) {
        // Going back from live position
        if (totalMoveCount > 0) {
          setViewedMoveIndex(totalMoveCount - 1);
        }
      } else if (viewedMoveIndex > 0) {
        setViewedMoveIndex(viewedMoveIndex - 1);
      } else if (viewedMoveIndex === 0) {
        setViewedMoveIndex(-1); // Starting position
      }
    } else {
      if (viewedMoveIndex === null) {
        return; // Already at live position
      }
      if (viewedMoveIndex >= totalMoveCount - 1) {
        return; // Stay at last move
      } else {
        setViewedMoveIndex(viewedMoveIndex + 1);
      }
    }
  }, [viewedMoveIndex, totalMoveCount]);

  useEffect(() => {
    if (!isConnected && status === "playing") {
      setStatus("disconnected");
      // Allow re-requesting game state on reconnect so the new connection ID
      // gets registered as a viewer and the board resyncs
      hasRequestedGameState.current = false;
    } else if (isConnected && status === "disconnected") {
      setStatus("playing");
    }
  }, [isConnected, status]);

  useEffect(() => {
    if (!lastMessage) return;

    // Handle startGame — either for this game or a new game (rematch/new game match)
    if (lastMessage.action === "startGame") {
      if (lastMessage.gameId === gameId) {
        setPlayerColor(spectatingUsername ? (spectatingUsername === lastMessage.blackUsername ? "black" : "white") : lastMessage.color);
        setCurrentTurn(lastMessage.turn || "white");
        setWhiteUsername(lastMessage.whiteUsername);
        setBlackUsername(lastMessage.blackUsername);
        setStatus("playing");
        if (lastMessage.whiteTime !== undefined) {
          setWhiteTime(lastMessage.whiteTime);
          setBlackTime(lastMessage.blackTime);
          setInitialTime(lastMessage.whiteTime);
        }
      } else if (lastMessage.gameId) {
        // New game started (rematch or new game match) — navigate to it
        navigate(`/game/${lastMessage.gameId}`, {
          state: {
            playerColor: lastMessage.color,
            currentTurn: lastMessage.turn || "white",
            whiteTime: lastMessage.whiteTime,
            blackTime: lastMessage.blackTime,
            whiteUsername: lastMessage.whiteUsername,
            blackUsername: lastMessage.blackUsername,
            increment: lastMessage.increment ?? 0,
            spectatingUsername,
          },
        });
      }
    }
    if (lastMessage.action === "gameEnd" && lastMessage.gameId === gameId) {
      setGameResult(lastMessage.result);
      setGameEndReason(lastMessage.reason);
    }
    if (lastMessage.action === "move") {
      if (lastMessage.turn) {
        handleTurnChange(lastMessage.turn);
      }
      if (lastMessage.whiteTime !== undefined) {
        setWhiteTime(lastMessage.whiteTime);
        setBlackTime(lastMessage.blackTime);
      }
      // Clear draw offer state when a move is made
      setHasOfferedDraw(false);
      setPendingDrawOffer(null);
    }

    if (lastMessage.action === "clockSync") {
      setWhiteTime(lastMessage.whiteTime);
      setBlackTime(lastMessage.blackTime);
    }

    // Handle rematch offer/cancel from opponent
    if (lastMessage.action === "rematchOffer" && lastMessage.gameId === gameId) {
      setRematchOfferedBy(opponentUsername);
    }
    if (lastMessage.action === "rematchCanceled" && lastMessage.gameId === gameId) {
      setRematchOfferedBy(null);
    }

    // Handle draw offer received from opponent
    if (lastMessage.action === "drawOffer" && lastMessage.gameId === gameId) {
      setPendingDrawOffer(lastMessage.offeredBy);
    }

    // Handle draw declined notification (received by the player who offered)
    if (lastMessage.action === "drawDeclined" && lastMessage.gameId === gameId) {
      setHasOfferedDraw(false);
    }

    // Handle gameState response when loading game directly
    if (lastMessage.action === "gameState" && lastMessage.gameId === gameId) {
      setPlayerColor(spectatingUsername ? (spectatingUsername === lastMessage.blackUsername ? "black" : "white") : lastMessage.playerColor);
      setCurrentTurn(lastMessage.currentTurn);
      setWhiteTime(lastMessage.whiteTime);
      setBlackTime(lastMessage.blackTime);
      setWhiteUsername(lastMessage.whiteUsername);
      setBlackUsername(lastMessage.blackUsername);
      setIncrement(lastMessage.increment ?? 0);
      setInitialTime(lastMessage.initialTime ?? null);
      setPgn(lastMessage.pgn ?? null);
      setChatLog(lastMessage.chat ?? []);
      setStatus("playing");
      // Handle finished game state
      if (lastMessage.result) {
        setGameResult(lastMessage.result);
        setGameEndReason(lastMessage.endReason ?? null);
      }
      // Select the latest move if there are any moves
      if (lastMessage.pgn) {
        const moveCount = getMoveCount(lastMessage.pgn);
        setViewedMoveIndex(moveCount > 0 ? moveCount - 1 : null);
        setGameStarted(true);
      } else if (lastMessage.currentTurn === "black") {
        setGameStarted(true);
      }
    }
  }, [lastMessage, gameId, handleTurnChange, navigate, opponentUsername, spectatingUsername]);

  // Client-side clock countdown using actual elapsed time
  // Only starts ticking after white makes their first move
  useEffect(() => {
    if (status !== "playing" || !gameStarted || gameResult !== null) return;

    let lastTick = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTick;
      lastTick = now;

      if (currentTurn === "white") {
        setWhiteTime(prev => Math.max(0, prev - elapsed));
      } else {
        setBlackTime(prev => Math.max(0, prev - elapsed));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [status, currentTurn, gameStarted, gameResult]);

  // Detect timeout and notify server
  useEffect(() => {
    if (gameResult !== null || !gameStarted || !gameId) return;
    if (hasReportedTimeout.current) return;

    const timeoutOccurred = (currentTurn === "white" && whiteTime <= 0) ||
                           (currentTurn === "black" && blackTime <= 0);

    if (timeoutOccurred) {
      hasReportedTimeout.current = true;
      sendMessage({ action: "timeout", gameId });
    }
  }, [whiteTime, blackTime, currentTurn, gameResult, gameStarted, gameId, sendMessage]);

  // Keyboard navigation for moves
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't capture if user is typing in an input
      if (event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handleNavigate("prev");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        handleNavigate("next");
      } else if (event.key === "f") {
        setFlipped(f => !f);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNavigate]);

  if (!gameId) {
    return <div style={{ padding: 20 }}>Invalid game ID</div>;
  }

  if (status === "loading") {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <StatusBadge status={status} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        <div style={{ position: "relative" }}>
          <GameClock
            whiteTime={whiteTime}
            blackTime={blackTime}
            whiteName={whiteUsername}
            blackName={blackUsername}
            activeColor={status === "playing" && gameStarted ? currentTurn : null}
            playerColor={playerColor}
            onFlip={() => setFlipped(f => !f)}
            flipped={flipped}
          >
            <Board
              gameId={gameId}
              playerColor={playerColor}
              initialTurn={currentTurn}
              initialPgn={pgn}
              onTurnChange={handleTurnChange}
              onPgnChange={handlePgnChange}
              onSizeChange={setBoardSize}
              overridePosition={displayPosition}
              isViewingHistory={isViewingHistory}
              gameResult={gameResult}
              flipped={flipped}
            />
          </GameClock>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 200, height: boardSize + panelOffset }}>
          <div style={{ flex: MOVE_NOTATION_RATIO, minHeight: 0}}>
            <MoveNotation
              pgn={pgn || ""}
              viewedMoveIndex={viewedMoveIndex}
              onMoveClick={handleMoveClick}
              boardSize={boardSize}
            />
            <div style={{ marginTop: 11 }}>
              {gameResult !== null && gameEndReason !== null ? (
                <GameEndDisplay
                  gameResult={gameResult}
                  gameEndReason={gameEndReason}
                  onRematch={handleRematch}
                  onNewGame={handleNewGame}
                  isPlayer={isPlayer}
                  hasOfferedRematch={hasOfferedRematch}
                  opponentOfferedRematch={opponentOfferedRematch}
                  isWaitingNewGame={isWaitingNewGame}
                />
              ) : isPlayer ? (
                <GameControls
                  onResign={handleResign}
                  onOfferDraw={handleOfferDraw}
                  onAcceptDraw={handleAcceptDraw}
                  onDeclineDraw={handleDeclineDraw}
                  isGameOver={gameResult !== null}
                  hasOfferedDraw={hasOfferedDraw}
                  hasPendingDrawOffer={pendingDrawOffer !== null}
                />
              ) : null}
            </div>
          </div>
          <div style={{ flex: 1 - MOVE_NOTATION_RATIO, minHeight: 0, width: 300, marginTop: 78}}>
            <Chat gameId={gameId} initialChat={chatLog} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Game;
