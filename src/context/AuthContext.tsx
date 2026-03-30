import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getAuthenticatedUser, type AuthUser } from '../services/auth';
import { getUserProfile, type UserRole } from '../services/profile';

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean | null;
    role: UserRole | null;
    isAdmin: boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);

    const refreshUser = useCallback(async () => {
        try {
            const authUser = await getAuthenticatedUser();
            setUser(authUser);
            setIsAuthenticated(!!authUser);
            if (authUser) {
                try {
                    const profile = await getUserProfile(authUser.username);
                    setRole(profile.role);
                } catch {
                    setRole(null);
                }
            } else {
                setRole(null);
            }
        } catch {
            setUser(null);
            setIsAuthenticated(false);
            setRole(null);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, role, isAdmin: role === 'admin', refreshUser }}>
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
