import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
@keyframes crabHop {
  0% { top: 25%; left: -25%; transform: scaleX(1) rotate(-30deg); }
  5% { top: 25%; left: -5%; transform: scaleX(1) rotate(10deg); }
  10% { top: 25%; left: -5%; transform: scaleX(1) rotate(10deg); }
  15% { top: 25%; left: -25%; transform: scaleX(1) rotate(-30deg); }

  25% { top: 25%; right: auto; left: 85%; transform: scaleX(-1) rotate(-30deg); }
  30% { top: 25%; left: 65%; transform: scaleX(-1) rotate(10deg); }
  35% { top: 25%; left: 65%; transform: scaleX(-1) rotate(10deg); }
  40% { top: 25%; left: 85%; transform: scaleX(-1) rotate(-30deg); }

  50% { top: 85%; left: -25%; transform: scaleX(1) rotate(-70deg); }
  55% { top: 65%; left: -5%; transform: scaleX(1) rotate(-40deg); }
  60% { top: 65%; left: -5%; transform: scaleX(1) rotate(-40deg); }
  65% { top: 85%; left: -25%; transform: scaleX(1) rotate(-70deg); }

  75% { top: -10%; left: 20%; transform: scaleX(1) rotate(60deg); }
  80% { top: 5%; left: 20%; transform: scaleX(1) rotate(100deg); }
  85% { top: 5%; left: 20%; transform: scaleX(1) rotate(100deg); }
  90% { top: -10%; left: 20%; transform: scaleX(1) rotate(60deg); }
  100% { top: 25%; left: -25%; transform: scaleX(1) rotate(-30deg); }
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
  const [paying, setPaying] = useState(false);
  const [payProgress, setPayProgress] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [payAttempts, setPayAttempts] = useState(0);

  const [payPhase, setPayPhase] = useState<'forward1' | 'slowing' | 'backward' | 'forward2'>('forward1');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!paying || showWarning || showForm) return;
    if (payProgress >= 100) {
      setShowForm(true);
      return;
    }

    let delay: number;
    let change: number;

    if (payPhase === 'forward1') {
      // 0-70%: normal jittery progress (~10s)
      delay = 50 + Math.random() * 300;
      change = Math.random() * 2.5 + 0.1;
      if (payProgress >= 70) {
        setPayPhase('slowing');
        return;
      }
    } else if (payPhase === 'slowing') {
      // 70-75%: slow crawl to a stop (~3s)
      delay = 200 + Math.random() * 400;
      change = Math.random() * 0.3 + 0.05;
      if (payProgress >= 75) {
        setPayPhase('backward');
        return;
      }
    } else if (payPhase === 'backward') {
      // 75% -> ~60%: go backwards (~3s)
      delay = 100 + Math.random() * 200;
      change = -(Math.random() * 1.5 + 0.5);
      if (payProgress <= 60) {
        setPayPhase('forward2');
        return;
      }
    } else if (payProgress >= 99.9) {
      // Pause at 99.9% for 5 seconds then jump to 100
      delay = 5000;
      change = 0.1;
    } else if (payProgress >= 98) {
      // 98-99.9%: crawl
      delay = 300 + Math.random() * 500;
      change = Math.random() * 0.1 + 0.02;
    } else {
      // 60-98%: slow grind back up
      delay = 100 + Math.random() * 300;
      change = Math.random() * 1.5 + 0.3;
    }

    const timer = setTimeout(() => setPayProgress(p => Math.min(100, p + change)), delay);
    return () => clearTimeout(timer);
  }, [paying, payProgress, showWarning, showForm, payPhase]);

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

  const principal = stats ? stats.ratWins - stats.cliveWins : 0;

  // 15% annual interest, continuously compounding, backdated 3 months before cutoff
  const INTEREST_START = CUTOFF_EPOCH - (90 * 24 * 3600); // 3 months before cutoff
  const [accruedInterest, setAccruedInterest] = useState(0);

  useEffect(() => {
    if (!stats) return;
    const RATE = 0.15;
    const SECONDS_PER_YEAR = 365.25 * 24 * 3600;

    const tick = () => {
      const now = Date.now() / 1000;
      const elapsed = now - INTEREST_START;
      const factor = Math.exp(RATE * elapsed / SECONDS_PER_YEAR);
      setAccruedInterest(principal * factor - principal);
      rafRef.current = requestAnimationFrame(tick);
    };

    const rafRef = { current: requestAnimationFrame(tick) };
    return () => cancelAnimationFrame(rafRef.current);
  }, [principal, stats]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 16, position: 'relative' }}>
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
          left: '-25%',
          animation: 'crabHop 8s ease-in-out infinite',
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
          <a href="https://www.chess.com/member/eric_clive" target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.placeholder }}>eric_clive</a> vs <a href="https://www.chess.com/member/dominantrat" target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.placeholder }}>dominantrat</a> &middot; 1 buck a pop
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
              {(principal + accruedInterest).toFixed(6)} Buck
            </div>
            <div style={{
              fontSize: '1rem',
              color: theme.colors.placeholder,
              marginTop: 8,
              fontFamily: 'monospace',
            }}>
              Principal: ${principal.toFixed(2)} &middot; Interest: ${accruedInterest.toFixed(6)}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: theme.colors.placeholder,
              marginTop: 4,
            }}>
              15% APR &middot; continuously compounding
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: theme.colors.placeholder,
              marginTop: 12,
            }}>
              W {stats.cliveWins} &ndash; L {stats.ratWins} &ndash; D {stats.draws}
            </div>
            {!paying ? (
              <button
                onClick={() => {
                  setPaying(true);
                  setPayProgress(0);
                  setPayPhase('forward1');
                  setShowForm(false);
                  setShowWarning(false);
                  setPayAttempts(a => a + 1);
                }}
                style={{
                  marginTop: 16,
                  padding: '10px 32px',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  backgroundColor: '#cc0000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                PAY NOW
              </button>
            ) : !showForm && !showWarning ? (
              <div style={{ marginTop: 16, width: 280, margin: '16px auto 0' }}>
                <div style={{
                  fontSize: '0.8rem',
                  color: theme.colors.placeholder,
                  marginBottom: 4,
                  textAlign: 'center',
                }}>
                  {payPhase === 'forward2' || payPhase === 'backward' ? 'Scanning' : payProgress < 33 ? 'Preparing for payment' : payProgress < 66 ? 'Connecting to payment system' : 'Scanning'}... {payProgress.toFixed(1)}%
                </div>
                <div style={{
                  width: '100%',
                  height: 20,
                  backgroundColor: '#000',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${payProgress}%`,
                    height: '100%',
                    backgroundColor: '#cc0000',
                    transition: 'width 0.05s linear',
                  }} />
                </div>
              </div>
            ) : showForm && !showWarning ? (
              <>{createPortal(
                <div style={{
                  position: 'fixed',
                  inset: 0,
                  paddingLeft: 175,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                }}>
                  <div style={{
                    backgroundColor: '#fff',
                    border: '2px solid #ccc',
                    borderRadius: 8,
                    width: 400,
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    padding: 24,
                  }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#333', marginBottom: 4 }}>
                      Payment Information
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: 16 }}>
                      All fields required for verification
                    </div>
                    {[
                      'Full Legal Name',
                      'Date of Birth',
                      'Social Security Number',
                      'Mother\'s Maiden Name',
                      'Street Address',
                      'City',
                      'State',
                      'ZIP Code',
                      'Phone Number',
                      'Email Address',
                      'Bank Name',
                      'Routing Number',
                      'Account Number',
                      'Credit Card Number',
                      'Expiration Date',
                      'CVV',
                      'Driver\'s License Number',
                      'Passport Number',
                    ].map(field => (
                      <div key={field} style={{ marginBottom: 10 }}>
                        <label style={{ fontSize: '0.75rem', color: '#555', display: 'block', marginBottom: 2 }}>
                          {field} *
                        </label>
                        <input
                          type="text"
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            fontSize: '0.85rem',
                            border: '1px solid #ccc',
                            borderRadius: 4,
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setShowWarning(true);
                      }}
                      style={{
                        marginTop: 12,
                        width: '100%',
                        padding: '10px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        backgroundColor: '#cc0000',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      Submit Payment
                    </button>
                  </div>
                </div>,
                document.body
              )}</>
            ) : (
              <>{createPortal(
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  paddingLeft: 175,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                }}>
                  <div style={{
                    backgroundColor: '#fff',
                    border: '4px solid #cc0000',
                    borderRadius: 0,
                    width: 420,
                    overflow: 'hidden',
                    boxShadow: '0 0 40px rgba(255,0,0,0.5)',
                  }}>
                    {/* Warning stripes header */}
                    <div style={{
                      background: 'repeating-linear-gradient(45deg, #ffcc00, #ffcc00 10px, #000 10px, #000 20px)',
                      height: 20,
                    }} />
                    <div style={{
                      background: '#cc0000',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
                        {payAttempts >= 2 ? 'SECURITY ALERT' : 'SECURITY ALERT'}
                      </span>
                      <span style={{ color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
                        onClick={() => { setShowWarning(false); setPaying(false); }}>
                        X
                      </span>
                    </div>
                    <div style={{ padding: 24, textAlign: 'center' }}>
                      <div style={{ fontSize: '4rem', marginBottom: 12 }}>
                        {payAttempts >= 2 ? '\u{1F6A8}' : '\u26A0\uFE0F'}
                      </div>
                      <div style={{
                        fontSize: payAttempts >= 2 ? '2.5rem' : '2rem',
                        fontWeight: 900,
                        color: '#cc0000',
                        marginBottom: 8,
                        textTransform: 'uppercase',
                      }}>
                        {payAttempts >= 2 ? 'FUCK YOU! WE KNOW YOU ARE NOT CLIVE!' : 'YOU ARE NOT CLIVE!'}
                      </div>
                      <div style={{
                        fontSize: '0.9rem',
                        color: '#333',
                        marginBottom: 16,
                      }}>
                        {payAttempts >= 2
                          ? 'Unauthorized payment attempt detected.'
                          : 'Unauthorized payment attempt detected.'}
                      </div>
                      <button
                        onClick={() => { setShowWarning(false); setPaying(false); }}
                        style={{
                          padding: '8px 24px',
                          fontSize: '1rem',
                          fontWeight: 700,
                          backgroundColor: '#cc0000',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        {payAttempts >= 2 ? 'I apologize' : 'I apologize'}
                      </button>
                    </div>
                    {/* Warning stripes footer */}
                    <div style={{
                      background: 'repeating-linear-gradient(45deg, #ffcc00, #ffcc00 10px, #000 10px, #000 20px)',
                      height: 20,
                    }} />
                  </div>
                </div>,
                document.body
              )}</>
            )}
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
