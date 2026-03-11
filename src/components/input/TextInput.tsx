// components/input/TextInput.tsx
import { useTheme } from '../../context/ThemeContext';

type TextInputProps = {
    label?: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    type?: 'text' | 'password' | 'email';
    required?: boolean;
};

export const TextInput = ({ label, value, onChange, placeholder, type = 'text', required }: TextInputProps) => {
    const { theme } = useTheme();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {label && <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>{label}</label>}
            <input
                type={type}
                style={{
                    border: theme.input.border,
                    padding: theme.input.padding,
                    borderRadius: theme.input.borderRadius,
                    fontSize: theme.input.fontSize,
                    fontFamily: theme.input.fontFamily,
                    ...(theme.input.backgroundColor ? { backgroundColor: theme.input.backgroundColor } : {}),
                    ...(theme.input.color ? { color: theme.input.color } : {}),
                    ...(theme.input.boxShadow ? { boxShadow: theme.input.boxShadow } : {}),
                }}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                onInvalid={(e) => {
                    if (required && label) {
                        (e.target as HTMLInputElement).setCustomValidity(`${label} is required`);
                    }
                }}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
            />
        </div>
    );
};
