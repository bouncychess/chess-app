import { Link } from 'react-router-dom';
import { theme } from '../../config/theme';

export default function Sidebar() {
    return (
        <aside style={{
            width: '200px',
            background: theme.colors.sidebarBackground,
            color: theme.colors.sidebarText,
            padding: '1rem',
            height: '100vh',
        }}>
            <h2>Chess</h2>
            <nav>
                <ul style={{listStyle: 'none', padding: 0}}>
                    <li><Link to="/" style={{color: theme.colors.sidebarText}}>Home</Link></li>
                    <li><Link to="/play" style={{color: theme.colors.sidebarText}}>Play</Link></li>
                </ul>
            </nav>
        </aside>
    );
}