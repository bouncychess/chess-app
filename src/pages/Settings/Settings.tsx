import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { ResizableCard } from '../../components/ResizableCard';
import { ToggleSwitch } from '../../components/ToggleSwitch';

export default function Settings() {
    const { mode, toggleMode } = useTheme();
    const { premovesEnabled, togglePremoves } = useSettings();

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
        </div>
    );
}
