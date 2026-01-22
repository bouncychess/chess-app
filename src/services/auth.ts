import { signIn, signUp, signOut, getCurrentUser, confirmSignUp } from 'aws-amplify/auth';

export type AuthUser = {
    username: string;
    userId: string;
};

export async function login(username: string, password: string): Promise<AuthUser> {
    const result = await signIn({ username, password });

    if (result.nextStep.signInStep === 'DONE') {
        const user = await getCurrentUser();
        return {
            username: user.username,
            userId: user.userId,
        };
    }

    throw new Error(`Unexpected sign in step: ${result.nextStep.signInStep}`);
}

export async function register(username: string, email: string, password: string): Promise<{ needsConfirmation: boolean }> {
    const result = await signUp({
        username,
        password,
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
