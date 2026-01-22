import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
    const { user } = useAuth();

    return (
        <aside style={{
            width: '200px',
            background: '#1f2937',
            color: 'white',
            padding: '1rem',
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
        }}>
            <h2 style={{ margin: '0 0 1rem 0' }}>Chess</h2>
            <nav style={{ flex: 1 }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li><Link to="/home" style={{ color: 'white' }}>Home</Link></li>
                    <li><Link to="/play" style={{ color: 'white' }}>Play</Link></li>
                </ul>
            </nav>
            <div style={{ borderTop: '1px solid #374151', paddingTop: '1rem' }}>
                {user && (
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#9ca3af' }}>
                        Hi, {user.username}
                    </p>
                )}
                <Link to="/logout" style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Logout</Link>
            </div>
        </aside>
    );
}
