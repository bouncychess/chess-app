import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { ResizableCard } from '../../components/ResizableCard';

export default function Settings() {
    const { mode, toggleMode } = useTheme();
    const { premovesEnabled, togglePremoves } = useSettings();
    const isWindows = mode === 'windows';

    return (
        <div style={{ maxWidth: 500 }}>
            <h2 style={{ marginTop: 0, marginBottom: 16 }}>Settings</h2>
            <ResizableCard>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Theme</div>
                <div
                    onClick={toggleMode}
                    style={{
                        display: 'inline-flex',
                        borderRadius: 6,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '1px solid rgba(128,128,128,0.3)',
                    }}
                >
                    <div style={{
                        padding: '6px 16px',
                        fontSize: '0.875rem',
                        fontWeight: !isWindows ? 600 : 400,
                        backgroundColor: !isWindows ? '#1f2937' : 'transparent',
                        color: !isWindows ? '#fff' : 'inherit',
                        transition: 'all 0.2s',
                    }}>
                        Normal
                    </div>
                    <div style={{
                        padding: '6px 16px',
                        fontSize: '0.875rem',
                        fontWeight: isWindows ? 600 : 400,
                        backgroundColor: isWindows ? '#000080' : 'transparent',
                        color: isWindows ? '#fff' : 'inherit',
                        transition: 'all 0.2s',
                    }}>
                        Windows
                    </div>
                </div>
            </ResizableCard>
            <div style={{ marginTop: 16 }}>
                <ResizableCard>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Gameplay</div>
                    <div
                        onClick={togglePremoves}
                        style={{
                            display: 'inline-flex',
                            borderRadius: 6,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: '1px solid rgba(128,128,128,0.3)',
                        }}
                    >
                        <div style={{
                            padding: '6px 16px',
                            fontSize: '0.875rem',
                            fontWeight: premovesEnabled ? 600 : 400,
                            backgroundColor: premovesEnabled ? '#1f2937' : 'transparent',
                            color: premovesEnabled ? '#fff' : 'inherit',
                            transition: 'all 0.2s',
                        }}>
                            Premoves On
                        </div>
                        <div style={{
                            padding: '6px 16px',
                            fontSize: '0.875rem',
                            fontWeight: !premovesEnabled ? 600 : 400,
                            backgroundColor: !premovesEnabled ? '#1f2937' : 'transparent',
                            color: !premovesEnabled ? '#fff' : 'inherit',
                            transition: 'all 0.2s',
                        }}>
                            Premoves Off
                        </div>
                    </div>
                </ResizableCard>
            </div>
        </div>
    );
}
