// src/components/Sidebar.tsx
import { Link } from 'react-router-dom';

export default function Sidebar() {
    return (
        <aside style={{
            width: '200px',
            background: '#1f2937',
            color: 'white',
            padding: '1rem',
            height: '100vh',
        }}>
            <h2>Chess</h2>
            <nav>
                <ul style={{listStyle: 'none', padding: 0}}>
                    <li><Link to="/" style={{color: 'white'}}>Home</Link></li>
                    <li><Link to="/play" style={{color: 'white'}}>Play</Link></li>
                    <li><Link to="/logout" style={{color: 'white'}}>Logout</Link></li>
                </ul>
            </nav>
        </aside>
    );
}