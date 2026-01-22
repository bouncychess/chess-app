// components/input/TextInput.tsx
type TextInputProps = {
    label?: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    type?: 'text' | 'password' | 'email';
    required?: boolean;
};

export const TextInput = ({ label, value, onChange, placeholder, type = 'text', required }: TextInputProps) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {label && <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>{label}</label>}
        <input
            type={type}
            style={{
                border: '1px solid #ccc',
                padding: '8px 12px',
                borderRadius: 4,
                fontSize: '1rem',
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