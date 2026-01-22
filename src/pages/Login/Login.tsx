import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {Button} from "../../components/buttons/Button.tsx";
import {TextInput} from "../../components/input/TextInput.tsx";

type LoginPageProps = {
    onLoginSuccess?: (user: { username: string }) => void;
};

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const navigate = useNavigate();
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
            // Accept any login/register
            localStorage.setItem('currentUser', JSON.stringify({ username, email: isRegister ? email : undefined }));
            console.log(isRegister ? 'Registration successful' : 'Login successful');
            onLoginSuccess?.({ username });
            navigate('/play');
        } catch (err) {
            console.error(isRegister ? 'Registration failed' : 'Login failed', err);
            setError(err instanceof Error ? err.message : 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: 20
        }}>
            <div style={{
                width: '100%',
                maxWidth: 400,
                padding: 32,
                border: '1px solid #ccc',
                borderRadius: 8,
                backgroundColor: 'grey'
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