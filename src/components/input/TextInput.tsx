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
                border: 'none',
                padding: '3px 4px',
                borderRadius: 0,
                fontSize: '12px',
                fontFamily: 'inherit',
                backgroundColor: '#ffffff',
                color: '#000000',
                boxShadow: 'inset 1px 1px 0 #000000, inset -1px -1px 0 #ffffff, inset 2px 2px 0 #808080, inset -2px -2px 0 #dfdfdf',
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