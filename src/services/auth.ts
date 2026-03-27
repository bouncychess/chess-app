import { signIn, signUp, signOut, getCurrentUser, confirmSignUp, confirmSignIn } from 'aws-amplify/auth';

export type AuthUser = {
    username: string;
    userId: string;
};

export type SignInResult = {
    needsCode: boolean;
};

/**
 * Start passwordless sign-in with email OTP.
 * Cognito sends a code to the user's email.
 */
export async function requestSignInCode(email: string): Promise<SignInResult> {
    const result = await signIn({
        username: email,
        options: {
            authFlowType: 'USER_AUTH',
            preferredChallenge: 'EMAIL_OTP',
        },
    });

    if (result.nextStep.signInStep === 'DONE') {
        return { needsCode: false };
    }

    return { needsCode: true };
}

/**
 * Confirm sign-in with the OTP code sent to email.
 */
export async function confirmSignInCode(code: string): Promise<AuthUser> {
    const result = await confirmSignIn({ challengeResponse: code });

    if (result.nextStep.signInStep === 'DONE') {
        const user = await getCurrentUser();
        return {
            username: user.username,
            userId: user.userId,
        };
    }

    throw new Error(`Unexpected sign in step: ${result.nextStep.signInStep}`);
}

/**
 * Register a new user. Generates a random password since auth is passwordless.
 */
export async function register(username: string, email: string): Promise<{ needsConfirmation: boolean }> {
    const randomPassword = crypto.randomUUID() + 'Aa1!';
    const result = await signUp({
        username,
        password: randomPassword,
        options: {
            userAttributes: {
                email,
            },
        },
    });

    return {
        needsConfirmation: !result.isSignUpComplete,
    };
}

export async function confirmRegistration(username: string, code: string): Promise<void> {
    await confirmSignUp({ username, confirmationCode: code });
}

export async function logout(): Promise<void> {
    await signOut();
}

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
    try {
        const user = await getCurrentUser();
        return {
            username: user.username,
            userId: user.userId,
        };
    } catch {
        return null;
    }
}
