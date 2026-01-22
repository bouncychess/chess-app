import { useState } from 'react';
import { Button } from './buttons/Button';
import { TextInput } from './input/TextInput';

type LoginModalProps = {
    onLoginSuccess: () => void;
};

export default function LoginModal({ onLoginSuccess }: LoginModalProps) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isRegister, setIsRegister] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            localStorage.setItem('currentUser', JSON.stringify({ username, email: isRegister ? email : undefined }));
            console.log(isRegister ? 'Registration successful' : 'Login successful');
            onLoginSuccess();
        } catch (err) {
            console.error(isRegister ? 'Registration failed' : 'Login failed', err);
            setError(err instanceof Error ? err.message : 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
        }}>
            <div style={{
                width: '100%',
                maxWidth: 400,
                padding: 32,
                border: '1px solid #ccc',
                borderRadius: 8,
                backgroundColor: '#2a2a2a',
            }}>
                <h2 style={{ textAlign: 'center', marginBottom: 24 }}>
                    {isRegister ? 'Register' : 'Login'}
                </h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {isRegister && (
                        <TextInput
                            label="Email"
                            type="email"
                            value={email}
                            onChange={setEmail}
                            placeholder="Enter your email"
                            required
                        />
                    )}

                    <TextInput
                        label="Username"
                        type="text"
                        value={username}
                        onChange={setUsername}
                        placeholder="Enter your username"
                        required
                    />

                    <TextInput
                        label="Password"
                        type="password"
                        value={password}
                        onChange={setPassword}
                        placeholder="Enter your password"
                        required
                    />

                    <Button type="submit" disabled={loading}>
                        {loading ? (isRegister ? 'Registering...' : 'Logging in...') : (isRegister ? 'Register' : 'Log In')}
                    </Button>
                    {error && <p style={{ color: 'red', margin: 0, textAlign: 'center' }}>{error}</p>}
                </form>
                <p style={{ marginTop: 20, textAlign: 'center' }}>
                    {isRegister ? 'Already have an account? ' : "Don't have an account? "}
                    <button
                        type="button"
                        onClick={() => setIsRegister(!isRegister)}
                        style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        {isRegister ? 'Log In' : 'Register'}
                    </button>
                </p>
            </div>
        </div>
    );
}
