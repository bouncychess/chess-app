import { useState } from 'react';
import { Button } from './buttons/Button';
import { TextInput } from './input/TextInput';
import { login, register, confirmRegistration, forgotPassword, forgotPasswordSubmit } from '../services/auth';
import { theme } from '../config/theme';

type LoginModalProps = {
    onLoginSuccess: () => void;
};

type Mode = 'login' | 'register' | 'confirm' | 'forgotPassword' | 'resetPassword';

export default function LoginModal({ onLoginSuccess }: LoginModalProps) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmationCode, setConfirmationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<Mode>('login');

    const handleLogin = async () => {
        await login(username, password);
        onLoginSuccess();
    };

    const handleRegister = async () => {
        const result = await register(username, email, password);
        if (result.needsConfirmation) {
            setMode('confirm');
            setError(null);
        } else {
            // Auto sign in after registration if no confirmation needed
            await handleLogin();
        }
    };

    const handleConfirm = async () => {
        await confirmRegistration(username, confirmationCode);
        // After confirmation, sign in automatically
        await login(username, password);
        onLoginSuccess();
    };

    const handleForgotPassword = async () => {
        await forgotPassword(username);
        setMode('resetPassword');
        setError(null);
    };

    const handleResetPassword = async () => {
        await forgotPasswordSubmit(username, confirmationCode, newPassword);
        // After reset, go back to login
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
            case 'login': return 'Login';
            case 'register': return 'Register';
            case 'confirm': return 'Confirm Email';
            case 'forgotPassword': return 'Forgot Password';
            case 'resetPassword': return 'Reset Password';
        }
    };

    const getButtonText = () => {
        if (loading) {
            switch (mode) {
                case 'login': return 'Logging in...';
                case 'register': return 'Registering...';
                case 'confirm': return 'Confirming...';
                case 'forgotPassword': return 'Sending code...';
                case 'resetPassword': return 'Resetting...';
            }
        }
        switch (mode) {
            case 'login': return 'Log In';
            case 'register': return 'Register';
            case 'confirm': return 'Confirm';
            case 'forgotPassword': return 'Send Reset Code';
            case 'resetPassword': return 'Reset Password';
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
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 8,
                backgroundColor: theme.colors.cardBackground,
                color: theme.colors.cardText,
            }}>
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
                            {mode === 'register' ? 'Log In' : 'Register'}
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
                            Back to Login
                        </button>
                    </p>
                )}
            </div>
        </div>
    );
}
