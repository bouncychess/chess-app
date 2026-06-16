import { useCallback, useEffect, useState } from 'react';
import {
    completeLoginFromRedirect,
    fetchLichessUsername,
    initLichessAuth,
    isOAuthRedirect,
    loginWithLichess,
    logoutFromLichess,
} from '../services/lichessAuth';
import { hasLichessToken } from '../services/openingExplorer';

export type LichessAuthStatus = 'loading' | 'anonymous' | 'connected' | 'error';

export interface LichessAuth {
    status: LichessAuthStatus;
    username: string | null;
    token: string | null;
    error: string | null;
    /** Authorized to call the explorer — via OAuth login or a dev env token. */
    isAuthorized: boolean;
    login: () => void;
    logout: () => Promise<void>;
}

/**
 * Manages the lichess OAuth (PKCE) session: completes the redirect callback,
 * restores a persisted token, exposes the username, and wires the token into
 * the explorer client. A VITE_LICHESS_TOKEN dev token counts as authorized too.
 */
export function useLichessAuth(): LichessAuth {
    const [status, setStatus] = useState<LichessAuthStatus>('loading');
    const [username, setUsername] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                // Returning from lichess with an auth code?
                if (isOAuthRedirect()) {
                    const fresh = await completeLoginFromRedirect();
                    if (cancelled) return;
                    if (fresh) {
                        setToken(fresh);
                        setUsername(await fetchLichessUsername(fresh));
                        if (!cancelled) setStatus('connected');
                        return;
                    }
                }

                // Otherwise restore any persisted token.
                const stored = initLichessAuth();
                if (cancelled) return;
                if (stored) {
                    setToken(stored);
                    setUsername(await fetchLichessUsername(stored));
                    if (!cancelled) setStatus('connected');
                } else {
                    setStatus('anonymous');
                }
            } catch (e) {
                if (cancelled) return;
                setError(e instanceof Error ? e.message : 'Lichess login failed.');
                setStatus('error');
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const login = useCallback(() => {
        setError(null);
        void loginWithLichess();
    }, []);

    const logout = useCallback(async () => {
        await logoutFromLichess(token);
        setToken(null);
        setUsername(null);
        setStatus('anonymous');
    }, [token]);

    const isAuthorized = status === 'connected' || hasLichessToken();

    return { status, username, token, error, isAuthorized, login, logout };
}
