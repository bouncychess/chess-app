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

export default function Clive() {
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
          fontSize: '3rem',
          fontWeight: 700,
          fontFamily: 'monospace',
          animation: 'pulseText 3s ease-in-out infinite, rainbow 2s linear infinite',
          display: 'inline-block',
        }}>
          34 buck
        </div>
      </div>
    </div>
  );
}
