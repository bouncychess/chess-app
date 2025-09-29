// components/input/TextInput.tsx
type TextInputProps = {
    label?: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    type?: 'text' | 'password' | 'email';
};

export const TextInput = ({ label, value, onChange, placeholder, type = 'text' }: TextInputProps) => (
    <div className="flex flex-col space-y-1 mb-4">
        {label && <label className="text-sm font-medium">{label}</label>}
        <input
            type={type}
            className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-500"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
        />
    </div>
);