import { useEffect } from 'react';
import { logout } from '../../services/auth';

export default function Logout() {
    useEffect(() => {
        const performLogout = async () => {
            await logout();
            // Force a full page reload to clear all state and re-check auth
            window.location.href = '/';
        };
        performLogout();
    }, []);

    return null;
}
