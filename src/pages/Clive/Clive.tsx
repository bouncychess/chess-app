import { useState, useEffect } from 'react';
import { theme } from '../../config/theme';

const keyframes = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes hueShift {
  0% { filter: hue-rotate(0deg) drop-shadow(0 0 12px #ff0000); }
  25% { filter: hue-rotate(90deg) drop-shadow(0 0 12px #00ff00); }
  50% { filter: hue-rotate(180deg) drop-shadow(0 0 12px #0000ff); }
  75% { filter: hue-rotate(270deg) drop-shadow(0 0 12px #ff00ff); }
  100% { filter: hue-rotate(360deg) drop-shadow(0 0 12px #ff0000); }
}
@keyframes pulseText {
  0% { transform: scale(1); }
  50% { transform: scale(1.4); }
  100% { transform: scale(1); }
}
@keyframes rainbow {
  0% { color: #ff0000; }
  16% { color: #ff8800; }
  33% { color: #ffff00; }
  50% { color: #00ff00; }
  66% { color: #0088ff; }
  83% { color: #8800ff; }
  100% { color: #ff0000; }
}
`;

const PLAYER = 'eric_clive';
const OPPONENT = 'dominantrat';

// Baseline as of March 4, 2026
const BASELINE = { cliveWins: 66, ratWins: 369, draws: 4 };
const CUTOFF_EPOCH = 1772838706; // March 4, 2026 ~7:31pm ET

interface ChessComGame {
  white: { username: string; result: string };
  black: { username: string; result: string };
  end_time: number;
}

async function fetchNewGames(): Promise<{ cliveWins: number; ratWins: number; draws: number }> {
  const archivesRes = await fetch(`https://api.chess.com/pub/player/${PLAYER}/games/archives`);
  const { archives } = await archivesRes.json() as { archives: string[] };

  // Only need to check recent archives (last 2 months max)
  const recentArchives = archives.slice(-2);

  let cliveWins = 0;
  let ratWins = 0;
  let draws = 0;

  for (const archiveUrl of recentArchives) {
    const res = await fetch(archiveUrl);
    const { games } = await res.json() as { games: ChessComGame[] };

    const headToHead = games.filter(g => {
      if (g.end_time <= CUTOFF_EPOCH) return false;
      const whiteLC = g.white.username.toLowerCase();
      const blackLC = g.black.username.toLowerCase();
      return (whiteLC === PLAYER && blackLC === OPPONENT) ||
             (whiteLC === OPPONENT && blackLC === PLAYER);
    });

    for (const game of headToHead) {
      const cliveIsWhite = game.white.username.toLowerCase() === PLAYER;
      const cliveResult = cliveIsWhite ? game.white.result : game.black.result;

      if (cliveResult === 'win') {
        cliveWins++;
      } else if (['checkmated', 'timeout', 'resigned', 'lose', 'abandoned'].includes(cliveResult)) {
        ratWins++;
      } else {
        draws++;
      }
    }
  }

  return { cliveWins, ratWins, draws };
}

export default function Clive() {
  const [stats, setStats] = useState<{ cliveWins: number; ratWins: number; draws: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNewGames()
      .then(newGames => {
        setStats({
          cliveWins: BASELINE.cliveWins + newGames.cliveWins,
          ratWins: BASELINE.ratWins + newGames.ratWins,
          draws: BASELINE.draws + newGames.draws,
        });
      })
      .catch(err => console.error('Failed to fetch chess.com data:', err))
      .finally(() => setLoading(false));
  }, []);

  const debt = stats ? stats.ratWins - stats.cliveWins : 0;
  const debtDisplay = debt > 0
    ? `${debt} buck`
    : debt < 0
      ? `dominantrat owes ${Math.abs(debt)} buck`
      : '0 buck (even)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 24 }}>
      <style>{keyframes}</style>

      <div style={{
        animation: 'spin 4s linear infinite, hueShift 3s linear infinite',
        borderRadius: '50%',
        overflow: 'hidden',
        width: 200,
        height: 200,
      }}>
        <img
          src="/images/articles/bloated_mess.png"
          alt="Clive"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: theme.colors.text,
          marginBottom: 8,
        }}>
          Live Debt Tracker
        </div>
        <div style={{
          fontSize: '0.875rem',
          color: theme.colors.placeholder,
          marginBottom: 12,
        }}>
          eric_clive vs dominantrat &middot; $1/game
        </div>
        {loading ? (
          <div style={{ fontSize: '1.5rem', color: theme.colors.placeholder }}>
            Loading from chess.com...
          </div>
        ) : stats ? (
          <>
            <div style={{
              fontSize: '3rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              animation: 'pulseText 3s ease-in-out infinite, rainbow 2s linear infinite',
              display: 'inline-block',
            }}>
              {debtDisplay}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: theme.colors.placeholder,
              marginTop: 12,
            }}>
              W {stats.cliveWins} &ndash; L {stats.ratWins} &ndash; D {stats.draws}
            </div>
          </>
        ) : (
          <div style={{ fontSize: '1.5rem', color: '#ff0000' }}>
            Failed to load data
          </div>
        )}
      </div>
    </div>
  );
}
