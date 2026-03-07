import { useState, useEffect, useRef } from 'react';
import { theme } from '../../config/theme';

const keyframes = `
@keyframes swing {
  0% { transform: rotate(0deg); }
  14% { transform: rotate(0deg); }
  18% { transform: rotate(35deg) scale(0.9); }
  25% { transform: rotate(-25deg); }
  32% { transform: rotate(18deg); }
  40% { transform: rotate(-12deg); }
  50% { transform: rotate(6deg); }
  60% { transform: rotate(-3deg); }
  70% { transform: rotate(0deg); }
  100% { transform: rotate(0deg); }
}
@keyframes hit {
  0% { transform: rotate(-40deg) translateX(-80px); }
  15% { transform: rotate(10deg) translateX(20px); }
  22% { transform: rotate(10deg) translateX(20px); }
  40% { transform: rotate(-40deg) translateX(-80px); }
  100% { transform: rotate(-40deg) translateX(-80px); }
}
@keyframes dollarFly0 {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
  15% { opacity: 0; }
  20% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
  100% { transform: translate(100px, -180px) rotate(45deg); opacity: 0; }
}
@keyframes dollarFly1 {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
  15% { opacity: 0; }
  20% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
  100% { transform: translate(-90px, -190px) rotate(-30deg); opacity: 0; }
}
@keyframes dollarFly2 {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
  15% { opacity: 0; }
  22% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
  100% { transform: translate(130px, -130px) rotate(60deg); opacity: 0; }
}
@keyframes dollarFly3 {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
  15% { opacity: 0; }
  22% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
  100% { transform: translate(-120px, -160px) rotate(-50deg); opacity: 0; }
}
@keyframes dollarFly4 {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
  18% { opacity: 0; }
  24% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
  100% { transform: translate(50px, -200px) rotate(20deg); opacity: 0; }
}
@keyframes dollarFly5 {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
  18% { opacity: 0; }
  24% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
  100% { transform: translate(-80px, -120px) rotate(-70deg); opacity: 0; }
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

const dollars = [
  { animation: 'dollarFly0 2s ease-out infinite', top: '40%', left: '60%' },
  { animation: 'dollarFly1 2s ease-out infinite', top: '35%', left: '40%' },
  { animation: 'dollarFly2 2s ease-out infinite', top: '50%', left: '65%' },
  { animation: 'dollarFly3 2s ease-out infinite', top: '45%', left: '30%' },
  { animation: 'dollarFly4 2s ease-out infinite', top: '30%', left: '50%' },
  { animation: 'dollarFly5 2s ease-out infinite', top: '55%', left: '45%' },
];

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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio('/sounds/mexican_music.mp3');
    audio.loop = true;
    audioRef.current = audio;

    const startMusic = () => {
      audio.play().then(() => setMusicPlaying(true)).catch(() => {});
      document.removeEventListener('click', startMusic);
    };
    document.addEventListener('click', startMusic);

    return () => {
      document.removeEventListener('click', startMusic);
      audio.pause();
      audio.src = '';
    };
  }, []);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicPlaying) {
      audio.pause();
      setMusicPlaying(false);
    } else {
      audio.play().then(() => setMusicPlaying(true)).catch(() => {});
    }
  };

  useEffect(() => {
    const poll = () => {
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
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  const debt = stats ? stats.ratWins - stats.cliveWins : 0;
  const debtDisplay = debt > 0
    ? `${debt} buck`
    : debt < 0
      ? `dominantrat owes ${Math.abs(debt)} buck`
      : '0 buck (even)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 24, position: 'relative' }}>
      <style>{keyframes}</style>
      <button
        onClick={toggleMusic}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'none',
          border: 'none',
          fontSize: '3rem',
          cursor: 'pointer',
          opacity: 0.7,
        }}
        title={musicPlaying ? 'Mute' : 'Play music'}
      >
        {musicPlaying ? '\u{1F50A}' : '\u{1F507}'}
      </button>

      {/* Pinata area */}
      <div style={{ position: 'relative', width: 420, height: 450 }}>
        {/* Pinata body with image */}
        <div style={{
          position: 'absolute',
          top: 30,
          left: '50%',
          marginLeft: -160,
          width: 320,
          height: 360,
          transformOrigin: 'top center',
          animation: 'swing 2s ease-in-out infinite',
        }}>
          <img
            src="/images/articles/pinata.svg"
            alt="Pinata"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
          {/* Face in center of pinata */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 100,
            height: 100,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '4px solid #cc9900',
          }}>
            <img
              src="/images/articles/bloated_mess.png"
              alt="Clive"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
        {/* Crab with cattle prod */}
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '-5%',
          animation: 'hit 2s ease-in-out infinite',
          transformOrigin: 'right center',
          display: 'flex',
          alignItems: 'center',
        }}>
          <img
            src="/images/articles/crab.jpeg"
            alt="Crab"
            style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: '50%', zIndex: 1 }}
          />
          <svg width="140" height="80" viewBox="0 0 140 80" style={{ marginLeft: -20 }}>
            {/* Handle */}
            <rect x="0" y="34" width="40" height="12" rx="5" fill="#222" />
            {/* Grip rings */}
            <rect x="6" y="32" width="4" height="16" rx="1" fill="#555" />
            <rect x="16" y="32" width="4" height="16" rx="1" fill="#555" />
            {/* Shaft */}
            <rect x="40" y="36" width="70" height="8" rx="3" fill="#888" />
            {/* Prongs */}
            <line x1="110" y1="30" x2="135" y2="20" stroke="#aaa" strokeWidth="3" strokeLinecap="round" />
            <line x1="110" y1="40" x2="135" y2="40" stroke="#aaa" strokeWidth="3" strokeLinecap="round" />
            <line x1="110" y1="50" x2="135" y2="60" stroke="#aaa" strokeWidth="3" strokeLinecap="round" />
            {/* Electric spark */}
            <circle cx="135" cy="20" r="4" fill="#ffff00" opacity="0.9" />
            <circle cx="135" cy="40" r="4" fill="#ffff00" opacity="0.9" />
            <circle cx="135" cy="60" r="4" fill="#ffff00" opacity="0.9" />
          </svg>
        </div>
        {/* Flying dollars */}
        {dollars.map((d, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: d.top,
              left: d.left,
              fontSize: '2.5rem',
              animation: d.animation,
              pointerEvents: 'none',
            }}
          >
            💵
          </div>
        ))}
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
          eric_clive vs dominantrat &middot; 1 buck a pop
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
