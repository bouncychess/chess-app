import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { ResizableCard } from '../../components/ResizableCard';
import { ToggleSwitch } from '../../components/ToggleSwitch';
import { theme } from '../../config/theme';

export default function Settings() {
    const { mode, toggleMode, isDark, toggleDark } = useTheme();
    const { premovesEnabled, togglePremoves, lowTimeWarning, setLowTimeWarning } = useSettings();

    return (
        <div style={{ maxWidth: 500 }}>
            <h2 style={{ marginTop: 0, marginBottom: 16 }}>Settings</h2>
            <ResizableCard>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Theme</div>
                <ToggleSwitch
                    options={[
                        { label: 'Normal', value: 'normal' },
                        { label: 'Windows', value: 'windows' },
                    ]}
                    selected={mode}
                    onToggle={toggleMode}
                />
            </ResizableCard>
            <div style={{ marginTop: 16 }}>
                <ResizableCard>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Brightness</div>
                    <ToggleSwitch
                        options={[
                            { label: 'Light', value: 'light' },
                            { label: 'Dark', value: 'dark' },
                        ]}
                        selected={isDark ? 'dark' : 'light'}
                        onToggle={toggleDark}
                    />
                </ResizableCard>
            </div>
            <div style={{ marginTop: 16 }}>
                <ResizableCard>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Gameplay</div>
                    <ToggleSwitch
                        options={[
                            { label: 'Premoves On', value: 'on' },
                            { label: 'Premoves Off', value: 'off' },
                        ]}
                        selected={premovesEnabled ? 'on' : 'off'}
                        onToggle={togglePremoves}
                    />
                </ResizableCard>
            </div>
            <div style={{ marginTop: 16 }}>
                <ResizableCard>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Low Time Warning</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input
                            type="range"
                            min={5}
                            max={60}
                            step={5}
                            value={lowTimeWarning}
                            onChange={(e) => setLowTimeWarning(Number(e.target.value))}
                            style={{ flex: 1 }}
                        />
                        <span style={{ fontSize: '0.875rem', minWidth: 30, textAlign: 'right', color: theme.colors.text }}>
                            {lowTimeWarning}s
                        </span>
                    </div>
                </ResizableCard>
            </div>
        </div>
    );
}
