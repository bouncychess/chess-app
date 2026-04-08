import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/buttons/Button';
import { TextInput } from '../../components/input/TextInput';
import { requestSignInCode, confirmSignInCode, register, confirmRegistration, resendConfirmationCode } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../config/theme';

type Mode = 'signIn' | 'signInCode' | 'register' | 'confirmEmail';

export default function SignIn() {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<Mode>('signIn');

    const handleLoginSuccess = async () => {
        await refreshUser();
        navigate('/play');
    };

    const handleRequestCode = async () => {
        await requestSignInCode(email);
        setMode('signInCode');
        setCode('');
        setError(null);
    };

    const handleConfirmCode = async () => {
        await confirmSignInCode(code);
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
        const result = await register(username, email);
        if (result.needsConfirmation) {
            setMode('confirmEmail');
            setCode('');
            setError(null);
        }
    };

    const handleConfirmEmail = async () => {
        await confirmRegistration(username, code);
        // After confirming, sign them in via OTP
        await requestSignInCode(email);
        setMode('signInCode');
        setCode('');
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            if (mode === 'signIn') {
                await handleRequestCode();
            } else if (mode === 'signInCode') {
                await handleConfirmCode();
            } else if (mode === 'register') {
                await handleRegister();
            } else if (mode === 'confirmEmail') {
                await handleConfirmEmail();
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
            case 'signIn': return 'Sign In';
            case 'signInCode': return 'Enter Code';
            case 'register': return 'Register';
            case 'confirmEmail': return 'Confirm Email';
        }
    };

    const getButtonText = () => {
        if (loading) {
            switch (mode) {
                case 'signIn': return 'Sending code...';
                case 'signInCode': return 'Signing in...';
                case 'register': return 'Registering...';
                case 'confirmEmail': return 'Confirming...';
            }
        }
        switch (mode) {
            case 'signIn': return 'Send Code';
            case 'signInCode': return 'Sign In';
            case 'register': return 'Register';
            case 'confirmEmail': return 'Confirm';
        }
    };

    return (
        <div style={{ padding: 20, maxWidth: 400, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: 24 }}>
                {getTitle()}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {mode === 'signIn' && (
                    <TextInput
                        label="Email"
                        type="email"
                        value={email}
                        onChange={setEmail}
                        placeholder="Enter your email"
                        required
                    />
                )}

                {mode === 'signInCode' && (
                    <>
                        <p style={{ margin: 0, textAlign: 'center', color: theme.colors.placeholder }}>
                            We sent a code to {email}
                        </p>
                        <TextInput
                            label="Code"
                            type="text"
                            value={code}
                            onChange={setCode}
                            placeholder="Enter the code"
                            required
                        />
                    </>
                )}

                {mode === 'register' && (
                    <>
                        <TextInput
                            label="Email"
                            type="email"
                            value={email}
                            onChange={setEmail}
                            placeholder="Enter your email"
                            required
                        />
                        <TextInput
                            label="Username"
                            type="text"
                            value={username}
                            onChange={setUsername}
                            placeholder="Choose a username"
                            required
                        />
                    </>
                )}

                {mode === 'confirmEmail' && (
                    <>
                        <p style={{ margin: 0, textAlign: 'center', color: theme.colors.placeholder }}>
                            We sent a confirmation code to {email}
                        </p>
                        <TextInput
                            label="Code"
                            type="text"
                            value={code}
                            onChange={setCode}
                            placeholder="Enter the code"
                            required
                        />
                    </>
                )}

                <Button type="submit" disabled={loading}>
                    {getButtonText()}
                </Button>
                {error && <p style={{ color: '#ff6b6b', margin: 0, textAlign: 'center' }}>{error}</p>}
            </form>

            {(mode === 'signIn' || mode === 'register') && (
                <p style={{ marginTop: 20, textAlign: 'center' }}>
                    {mode === 'register' ? 'Already have an account? ' : "Don't have an account? "}
                    <button
                        type="button"
                        onClick={() => {
                            setMode(mode === 'signIn' ? 'register' : 'signIn');
                            setError(null);
                        }}
                        style={{ background: 'none', border: 'none', color: theme.colors.link, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        {mode === 'register' ? 'Sign In' : 'Register'}
                    </button>
                </p>
            )}

            {mode === 'signInCode' && (
                <p style={{ marginTop: 20, textAlign: 'center' }}>
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                await requestSignInCode(email);
                                setCode('');
                                setError(null);
                            } catch (err) {
                                setError(err instanceof Error ? err.message : 'Failed to resend code');
                            }
                        }}
                        style={{ background: 'none', border: 'none', color: theme.colors.link, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Resend code
                    </button>
                    {' | '}
                    <button
                        type="button"
                        onClick={() => {
                            setMode('signIn');
                            setCode('');
                            setError(null);
                        }}
                        style={{ background: 'none', border: 'none', color: theme.colors.link, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Back to Sign In
                    </button>
                </p>
            )}

            {mode === 'confirmEmail' && (
                <p style={{ marginTop: 20, textAlign: 'center' }}>
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                await resendConfirmationCode(username);
                                setError(null);
                            } catch (err) {
                                setError(err instanceof Error ? err.message : 'Failed to resend code');
                            }
                        }}
                        style={{ background: 'none', border: 'none', color: theme.colors.link, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Resend code
                    </button>
                    {' | '}
                    <button
                        type="button"
                        onClick={() => {
                            setMode('register');
                            setCode('');
                            setError(null);
                        }}
                        style={{ background: 'none', border: 'none', color: theme.colors.link, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Back to Register
                    </button>
                </p>
            )}
        </div>
    );
}
