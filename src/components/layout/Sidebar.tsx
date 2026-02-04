import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../config/theme';
import { Tooltip } from '../Tooltip';

// Simple SVG icons
const NewsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
        <path d="M18 14h-8" />
        <path d="M15 18h-5" />
        <path d="M10 6h8v4h-8V6z" />
    </svg>
);

const PlayIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
);

const ProfileIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const SignInIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
);

const LogoutIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

const ChevronLeftIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

const MOBILE_BREAKPOINT = 768;

export default function Sidebar() {
    const { user } = useAuth();
    const [collapsed, setCollapsed] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < MOBILE_BREAKPOINT) {
                setCollapsed(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const linkStyle = {
        color: theme.colors.sidebarText,
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: '12px',
        padding: '8px 0',
        width: '100%',
    };

    return (
        <aside style={{
            width: collapsed ? '60px' : '175px',
            background: theme.colors.sidebarBackground,
            color: theme.colors.sidebarText,
            padding: '1rem',
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            transition: 'width 0.2s ease',
        }}>
            {!collapsed && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <Link to="/play" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h2 style={{ margin: 0, cursor: 'pointer' }}>Chess</h2>
                    </Link>
                    <button
                        onClick={() => setCollapsed(true)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: theme.colors.sidebarText,
                            cursor: 'pointer',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                        }}
                        aria-label="Collapse sidebar"
                    >
                        <ChevronLeftIcon />
                    </button>
                </div>
            )}

            {collapsed && (
                <button
                    onClick={() => setCollapsed(false)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: theme.colors.sidebarText,
                        cursor: 'pointer',
                        padding: '8px 0',
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '0.5rem',
                    }}
                    aria-label="Expand sidebar"
                >
                    <ChevronRightIcon />
                </button>
            )}

            <nav style={{ flex: 1 }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li>
                        <Link to="/news" style={linkStyle} title="News">
                            <NewsIcon />
                            {!collapsed && <span>News</span>}
                        </Link>
                    </li>
                    <li>
                        <Link to="/play" style={linkStyle} title="Play">
                            <PlayIcon />
                            {!collapsed && <span>Play</span>}
                        </Link>
                    </li>
                    <li>
                        {user ? (
                            <Link to={`/user/${user.username}`} style={linkStyle} title="Profile">
                                <ProfileIcon />
                                {!collapsed && <span>Profile</span>}
                            </Link>
                        ) : (
                            <Tooltip content="Sign in to create profile" position="right" style={{ display: 'block', width: '100%' }}>
                                <span style={{ ...linkStyle, opacity: 0.5, cursor: 'default' }}>
                                    <ProfileIcon />
                                    {!collapsed && <span>Profile</span>}
                                </span>
                            </Tooltip>
                        )}
                    </li>
                </ul>
            </nav>

            <div style={{ borderTop: '1px solid #374151', paddingTop: '1rem' }}>
                {user ? (
                    <>
                        {!collapsed && (
                            <Link
                                to={`/user/${user.username}`}
                                style={{
                                    margin: '0 0 0.5rem 0',
                                    fontSize: '0.875rem',
                                    color: '#9ca3af',
                                    textDecoration: 'none',
                                    display: 'block',
                                    cursor: 'pointer'
                                }}
                                title="View Profile"
                            >
                                {user.username}
                            </Link>
                        )}
                        <Link to="/logout" style={{ ...linkStyle, color: '#9ca3af', fontSize: '0.875rem' }} title="Logout">
                            <LogoutIcon />
                            {!collapsed && <span>Logout</span>}
                        </Link>
                    </>
                ) : (
                    <Link to="/signin" style={{ ...linkStyle, color: '#9ca3af', fontSize: '0.875rem' }} title="Sign In">
                        <SignInIcon />
                        {!collapsed && <span>Sign In</span>}
                    </Link>
                )}
            </div>
        </aside>
    );
}
