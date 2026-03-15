import { useTheme } from '../context/ThemeContext';

interface ToggleOption {
    label: string;
    value: string;
}

interface ToggleSwitchProps {
    options: [ToggleOption, ToggleOption];
    selected: string;
    onToggle: () => void;
}

export function ToggleSwitch({ options, selected, onToggle }: ToggleSwitchProps) {
    const { mode } = useTheme();
    const activeColor = mode === 'windows' ? '#000080' : '#1f2937';

    return (
        <div
            onClick={onToggle}
            style={{
                display: 'inline-flex',
                borderRadius: 6,
                overflow: 'hidden',
                cursor: 'pointer',
                border: '1px solid rgba(128,128,128,0.3)',
            }}
        >
            {options.map((option) => {
                const isActive = option.value === selected;
                return (
                    <div
                        key={option.value}
                        style={{
                            padding: '6px 16px',
                            fontSize: '0.875rem',
                            fontWeight: isActive ? 600 : 400,
                            backgroundColor: isActive ? activeColor : 'transparent',
                            color: isActive ? '#fff' : 'inherit',
                            transition: 'all 0.2s',
                        }}
                    >
                        {option.label}
                    </div>
                );
            })}
        </div>
    );
}
