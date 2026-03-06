import { theme } from '../../config/theme';

const spinKeyframes = `
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
`;

export default function Clive() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 24 }}>
      <style>{spinKeyframes}</style>

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
          color: '#ff0000',
          fontFamily: 'monospace',
        }}>
          34 buck
        </div>
      </div>
    </div>
  );
}
