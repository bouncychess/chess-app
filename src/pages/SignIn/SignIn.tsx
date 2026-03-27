import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/buttons/Button';
import { TextInput } from '../../components/input/TextInput';
import { login, register, confirmRegistration, forgotPassword, forgotPasswordSubmit } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../config/theme';

type Mode = 'login' | 'register' | 'confirm' | 'forgotPassword' | 'resetPassword';

export default function SignIn() {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmationCode, setConfirmationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<Mode>('login');

    const handleLoginSuccess = async () => {
        await refreshUser();
        navigate('/play');
    };

    const handleLogin = async () => {
        await login(username, password);
        await handleLoginSuccess();
    };

    const handleRegister = async () => {
        const usernameLower = username.toLowerCase();
        if (usernameLower.startsWith('guest_')) {
            throw new Error('Username cannot start with "guest_"');
        }
        if (usernameLower.endsWith('_bot')) {
            throw new Error('Username cannot end with "_bot"');
        }
        const result = await register(username, email, password);
        if (result.needsConfirmation) {
            setMode('confirm');
            setError(null);
        } else {
            await handleLogin();
        }
    };

    const handleConfirm = async () => {
        await confirmRegistration(username, confirmationCode);
        await login(username, password);
        await handleLoginSuccess();
    };

    const handleForgotPassword = async () => {
        await forgotPassword(username);
        setMode('resetPassword');
        setError(null);
    };

    const handleResetPassword = async () => {
        await forgotPasswordSubmit(username, confirmationCode, newPassword);
        setMode('login');
        setPassword('');
        setNewPassword('');
        setConfirmationCode('');
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            if (mode === 'login') {
                await handleLogin();
            } else if (mode === 'register') {
                await handleRegister();
            } else if (mode === 'confirm') {
                await handleConfirm();
            } else if (mode === 'forgotPassword') {
                await handleForgotPassword();
            } else if (mode === 'resetPassword') {
                await handleResetPassword();
            }
        } catch (err) {
            console.error('Auth error:', err);
            setError(err instanceof Error ? err.message : 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        switch (mode) {
            case 'login': return 'Sign In';
            case 'register': return 'Register';
            case 'confirm': return 'Confirm Email';
            case 'forgotPassword': return 'Forgot Password';
            case 'resetPassword': return 'Reset Password';
        }
    };

    const getButtonText = () => {
        if (loading) {
            switch (mode) {
                case 'login': return 'Signing in...';
                case 'register': return 'Registering...';
                case 'confirm': return 'Confirming...';
                case 'forgotPassword': return 'Sending code...';
                case 'resetPassword': return 'Resetting...';
            }
        }
        switch (mode) {
            case 'login': return 'Sign In';
            case 'register': return 'Register';
            case 'confirm': return 'Confirm';
            case 'forgotPassword': return 'Send Reset Code';
            case 'resetPassword': return 'Reset Password';
        }
    };

    return (
        <div style={{ padding: 20, maxWidth: 400, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: 24 }}>
                {getTitle()}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {mode === 'confirm' ? (
                    <>
                        <p style={{ margin: 0, textAlign: 'center', color: theme.colors.placeholder }}>
                            We sent a confirmation code to your email.
                        </p>
                        <TextInput
                            label="Confirmation Code"
                            type="text"
                            value={confirmationCode}
                            onChange={setConfirmationCode}
                            placeholder="Enter the code"
                            required
                        />
                    </>
                ) : mode === 'forgotPassword' ? (
                    <>
                        <p style={{ margin: 0, textAlign: 'center', color: theme.colors.placeholder }}>
                            Enter your username and we'll send you a code to reset your password.
                        </p>
                        <TextInput
                            label="Username"
                            type="text"
                            value={username}
                            onChange={setUsername}
                            placeholder="Enter your username"
                            required
                        />
                    </>
                ) : mode === 'resetPassword' ? (
                    <>
                        <p style={{ margin: 0, textAlign: 'center', color: theme.colors.placeholder }}>
                            Enter the code we sent to your email and your new password.
                        </p>
                        <TextInput
                            label="Confirmation Code"
                            type="text"
                            value={confirmationCode}
                            onChange={setConfirmationCode}
                            placeholder="Enter the code"
                            required
                        />
                        <TextInput
                            label="New Password"
                            type="password"
                            value={newPassword}
                            onChange={setNewPassword}
                            placeholder="Enter your new password"
                            required
                        />
                    </>
                ) : (
                    <>
                        {mode === 'register' && (
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
                    </>
                )}

                <Button type="submit" disabled={loading}>
                    {getButtonText()}
                </Button>
                {error && <p style={{ color: '#ff6b6b', margin: 0, textAlign: 'center' }}>{error}</p>}
            </form>

            {(mode === 'login' || mode === 'register') && (
                <p style={{ marginTop: 20, textAlign: 'center' }}>
                    {mode === 'register' ? 'Already have an account? ' : "Don't have an account? "}
                    <button
                        type="button"
                        onClick={() => {
                            setMode(mode === 'login' ? 'register' : 'login');
                            setError(null);
                        }}
                        style={{ background: 'none', border: 'none', color: theme.colors.link, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        {mode === 'register' ? 'Sign In' : 'Register'}
                    </button>
                </p>
            )}

            {mode === 'login' && (
                <p style={{ marginTop: 8, textAlign: 'center' }}>
                    <button
                        type="button"
                        onClick={() => {
                            setMode('forgotPassword');
                            setError(null);
                        }}
                        style={{ background: 'none', border: 'none', color: theme.colors.link, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Forgot Password?
                    </button>
                </p>
            )}

            {mode === 'confirm' && (
                <p style={{ marginTop: 20, textAlign: 'center' }}>
                    <button
                        type="button"
                        onClick={() => {
                            setMode('register');
                            setError(null);
                        }}
                        style={{ background: 'none', border: 'none', color: theme.colors.link, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Back to Register
                    </button>
                </p>
            )}

            {(mode === 'forgotPassword' || mode === 'resetPassword') && (
                <p style={{ marginTop: 20, textAlign: 'center' }}>
                    <button
                        type="button"
                        onClick={() => {
                            setMode('login');
                            setConfirmationCode('');
                            setNewPassword('');
                            setError(null);
                        }}
                        style={{ background: 'none', border: 'none', color: theme.colors.link, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Back to Sign In
                    </button>
                </p>
            )}
        </div>
    );
}
