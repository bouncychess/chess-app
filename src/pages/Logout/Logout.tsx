import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';

export default function Logout() {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();

    useEffect(() => {
        const performLogout = async () => {
            await logout();
            await refreshUser();
            navigate('/play', { replace: true });
        };
        performLogout();
    }, [navigate, refreshUser]);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
        }}>
            Logging out...
        </div>
    );
}
