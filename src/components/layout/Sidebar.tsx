import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../config/theme';
import { Tooltip } from '../Tooltip';

const SettingsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

// Simple SVG icons

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

const HamburgerIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
);

const MOBILE_BREAKPOINT = 768;
const COLLAPSE_BREAKPOINT = 1100;

function SidebarContent({ collapsed }: { collapsed: boolean }) {
    const { user } = useAuth();

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
        <>
            <nav style={{ flex: 1 }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
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

            <div style={{ paddingBottom: '0.75rem' }}>
                <Link to="/settings" style={linkStyle} title="Settings">
                    <SettingsIcon />
                    {!collapsed && <span>Settings</span>}
                </Link>
            </div>

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

        </>
    );
}

export default function Sidebar() {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const mobile = width < MOBILE_BREAKPOINT;
            setIsMobile(mobile);
            setCollapsed(width < COLLAPSE_BREAKPOINT);
            if (!mobile) setMenuOpen(false);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close menu on navigation
    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    if (isMobile) {
        return (
            <>
                <button
                    onClick={() => setMenuOpen(true)}
                    style={{
                        position: 'fixed',
                        top: 4,
                        left: 4,
                        zIndex: 1000,
                        background: theme.colors.background,
                        border: 'none',
                        borderRadius: 4,
                        color: theme.colors.text,
                        cursor: 'pointer',
                        padding: 8,
                        display: menuOpen ? 'none' : 'flex',
                        alignItems: 'center',
                    }}
                    aria-label="Open menu"
                >
                    <HamburgerIcon />
                </button>

                {menuOpen && (
                    <div
                        onClick={() => setMenuOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.4)',
                            zIndex: 1001,
                        }}
                    />
                )}

                <aside style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '175px',
                    height: '100%',
                    background: theme.colors.sidebarBackground,
                    color: theme.colors.sidebarText,
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box',
                    zIndex: 1002,
                    transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.2s ease',
                }}>
                    <SidebarContent collapsed={false} />
                </aside>
            </>
        );
    }

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
            <SidebarContent collapsed={collapsed} />
        </aside>
    );
}
