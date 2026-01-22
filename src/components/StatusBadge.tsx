import { theme } from '../config/theme';

type StatusBadgeProps = {
    status: 'online' | 'disconnected' | 'waiting' | 'playing';
};

const statusConfig = {
    online: {
        label: 'Online',
        backgroundColor: '#22c55e',
        color: '#ffffff',
    },
    disconnected: {
        label: 'Disconnected',
        backgroundColor: '#ef4444',
        color: '#ffffff',
    },
    waiting: {
        label: 'Waiting for game...',
        backgroundColor: '#f59e0b',
        color: '#ffffff',
    },
    playing: {
        label: 'Playing',
        backgroundColor: '#3b82f6',
        color: '#ffffff',
    },
};

export function StatusBadge({ status }: StatusBadgeProps) {
    const config = statusConfig[status];

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 16,
            fontSize: '0.875rem',
            fontWeight: 500,
            backgroundColor: config.backgroundColor,
            color: config.color,
        }}>
            <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: config.color,
                opacity: 0.8,
            }} />
            {config.label}
        </span>
    );
}
