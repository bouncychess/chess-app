import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getAuthenticatedUser, type AuthUser } from '../services/auth';

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean | null;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    const refreshUser = useCallback(async () => {
        try {
            const authUser = await getAuthenticatedUser();
            setUser(authUser);
            setIsAuthenticated(!!authUser);
        } catch {
            setUser(null);
            setIsAuthenticated(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
