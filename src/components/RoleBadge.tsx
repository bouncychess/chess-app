import type { UserRole } from '../services/profile';
import { theme } from '../config/theme';

export function RoleBadge({ role }: { role: UserRole | null }) {
    if (!role) return null;

    const style = role === 'admin'
        ? { background: theme.colors.danger, color: theme.colors.dangerText }
        : { background: '#16a34a', color: '#ffffff' };

    return (
        <span style={{
            display: 'inline-block',
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 4,
            backgroundColor: style.background,
            color: style.color,
            textTransform: 'capitalize',
        }}>
            {role}
        </span>
    );
}
