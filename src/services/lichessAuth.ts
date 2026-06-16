// Lichess OAuth2 with PKCE (Authorization Code flow for public clients — no
// client secret). Used so each user authenticates with their own lichess
// account; the resulting token authorizes opening-explorer requests.
// Docs: https://lichess.org/api#tag/OAuth
import { setLichessToken } from './openingExplorer';

const LICHESS_HOST = 'https://lichess.org';
const AUTHORIZE_URL = `${LICHESS_HOST}/oauth`;
const TOKEN_URL = `${LICHESS_HOST}/api/token`;
const ACCOUNT_URL = `${LICHESS_HOST}/api/account`;

// Public-client id (arbitrary, but should identify the app). Override via env.
const CLIENT_ID =
    (import.meta.env.VITE_LICHESS_CLIENT_ID as string | undefined) ||
    `${window.location.origin}/`;

// The opening explorer needs no special scopes — an authenticated token is
// enough — so we request none.
const SCOPES = '';

const STORAGE_KEY = 'lichess_auth';
const VERIFIER_KEY = 'lichess_pkce_verifier';
const STATE_KEY = 'lichess_oauth_state';

// We come back to the same page that started the flow.
function redirectUri(): string {
    return `${window.location.origin}${window.location.pathname}`;
}

interface StoredAuth {
    accessToken: string;
    expiresAt: number | null; // epoch ms, or null if unknown
}

// ---- PKCE helpers -------------------------------------------------------

function base64url(bytes: ArrayBuffer): string {
    let str = '';
    const arr = new Uint8Array(bytes);
    for (let i = 0; i < arr.length; i++) str += String.fromCharCode(arr[i]);
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomString(): string {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return base64url(arr.buffer);
}

async function sha256Challenge(verifier: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    return base64url(digest);
}

// ---- Token storage ------------------------------------------------------

export function getStoredToken(): string | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const auth = JSON.parse(raw) as StoredAuth;
        if (auth.expiresAt && Date.now() >= auth.expiresAt) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
        return auth.accessToken || null;
    } catch {
        return null;
    }
}

function storeToken(accessToken: string, expiresInSeconds?: number): void {
    const auth: StoredAuth = {
        accessToken,
        expiresAt: expiresInSeconds ? Date.now() + expiresInSeconds * 1000 : null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

function clearStoredToken(): void {
    localStorage.removeItem(STORAGE_KEY);
}

// ---- Flow ---------------------------------------------------------------

/** Begin the login: build a PKCE challenge and redirect to lichess. */
export async function loginWithLichess(): Promise<void> {
    const verifier = randomString();
    const state = randomString();
    sessionStorage.setItem(VERIFIER_KEY, verifier);
    sessionStorage.setItem(STATE_KEY, state);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        redirect_uri: redirectUri(),
        code_challenge_method: 'S256',
        code_challenge: await sha256Challenge(verifier),
        state,
    });
    if (SCOPES) params.set('scope', SCOPES);

    window.location.href = `${AUTHORIZE_URL}?${params.toString()}`;
}

/** True if the current URL looks like an OAuth redirect back from lichess. */
export function isOAuthRedirect(): boolean {
    const p = new URLSearchParams(window.location.search);
    return p.has('code') || (p.has('error') && p.has('state'));
}

/**
 * Complete the login when returning from lichess. Exchanges the auth code for a
 * token, stores it, and strips the OAuth params from the URL. Returns the
 * access token, or null if this isn't a redirect. Throws on failure.
 */
export async function completeLoginFromRedirect(): Promise<string | null> {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const returnedState = url.searchParams.get('state');
    const oauthError = url.searchParams.get('error');

    if (!code && !oauthError) return null;

    const expectedState = sessionStorage.getItem(STATE_KEY);
    const verifier = sessionStorage.getItem(VERIFIER_KEY);
    sessionStorage.removeItem(STATE_KEY);
    sessionStorage.removeItem(VERIFIER_KEY);

    // Always clean the URL so a refresh doesn't replay the code.
    const cleanUrl = `${url.origin}${url.pathname}`;
    window.history.replaceState({}, document.title, cleanUrl);

    if (oauthError) {
        throw new Error(`Lichess authorization was denied (${oauthError}).`);
    }
    if (!returnedState || returnedState !== expectedState) {
        throw new Error('OAuth state mismatch — please try connecting again.');
    }
    if (!verifier) {
        throw new Error('Missing PKCE verifier — please try connecting again.');
    }

    const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code!,
            code_verifier: verifier,
            redirect_uri: redirectUri(),
            client_id: CLIENT_ID,
        }),
    });

    if (!response.ok) {
        throw new Error(`Token exchange failed (${response.status}).`);
    }
    const data = (await response.json()) as { access_token: string; expires_in?: number };
    storeToken(data.access_token, data.expires_in);
    setLichessToken(data.access_token);
    return data.access_token;
}

/** Load any persisted token into the explorer client. Call once on startup. */
export function initLichessAuth(): string | null {
    const token = getStoredToken();
    setLichessToken(token);
    return token;
}

/** Fetch the authenticated user's lichess username. */
export async function fetchLichessUsername(token: string): Promise<string | null> {
    const response = await fetch(ACCOUNT_URL, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { username?: string };
    return data.username ?? null;
}

/** Revoke the token at lichess and clear local state. */
export async function logoutFromLichess(token: string | null): Promise<void> {
    if (token) {
        try {
            await fetch(TOKEN_URL, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch {
            // Best effort — clear locally regardless.
        }
    }
    clearStoredToken();
    setLichessToken(null);
}
