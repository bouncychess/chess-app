// src/LoginPage.jsx
import { useState } from 'react';
import {Button} from "../../components/buttons/Button.tsx";
import {TextInput} from "../../components/input/TextInput.tsx";

type LoginPageProps = {
    onLoginSuccess?: (user: { email: string }) => void;
};

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            console.log('Login successful');
            onLoginSuccess?.({ email });
        } catch (err) {
            console.error('Login failed', err);
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-form">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <TextInput
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="Enter your email"
                />

                <TextInput
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    placeholder="Enter your password"
                />

                <br />
                <Button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Log In'}
                </Button>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>
        </div>
    );
}