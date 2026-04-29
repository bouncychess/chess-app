import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { theme } from '../../config/theme';
import { ResizableCard } from '../../components/ResizableCard';
import { TIME_CONTROLS, tcKey } from '../../constants/timeControls';
import { fetchLeaderboard, type LeaderboardResponse } from '../../services/leaderboard';

const TOP_N = 10;

export default function Leaderboard() {
    const [data, setData] = useState<LeaderboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetchLeaderboard(TOP_N, controller.signal)
            .then(setData)
            .catch((err) => {
                if (err.name === 'AbortError') return;
                setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
            })
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, []);

    const cellStyle = {
        padding: '6px 10px',
        borderBottom: `1px solid ${theme.colors.border}`,
    } as const;

    return (
        <div style={{ padding: '16px 20px 20px', color: theme.colors.text }}>

            {loading && <p>Loading…</p>}
            {error && <p style={{ color: theme.colors.danger }}>{error}</p>}

            {data && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: 16,
                    }}
                >
                    {TIME_CONTROLS.map((tc) => {
                        const rows = data.leaderboards[tcKey(tc)] ?? [];
                        return (
                            <ResizableCard key={tc.label} style={{ padding: 12 }}>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>
                                    {tc.label}
                                </h3>
                                <table
                                    style={{
                                        width: '100%',
                                        tableLayout: 'fixed',
                                        borderCollapse: 'collapse',
                                        color: theme.colors.text,
                                    }}
                                >
                                    <colgroup>
                                        <col style={{ width: 36 }} />
                                        <col />
                                        <col style={{ width: 80 }} />
                                    </colgroup>
                                    <thead>
                                        <tr style={{ backgroundColor: theme.colors.background }}>
                                            <th
                                                style={{
                                                    ...cellStyle,
                                                    textAlign: 'right',
                                                    whiteSpace: 'nowrap',
                                                    color: theme.colors.placeholder,
                                                }}
                                            >
                                                #
                                            </th>
                                            <th style={{ ...cellStyle, textAlign: 'left' }}>
                                                Player
                                            </th>
                                            <th
                                                style={{
                                                    ...cellStyle,
                                                    textAlign: 'right',
                                                    whiteSpace: 'nowrap',
                                                    paddingRight: 14,
                                                }}
                                            >
                                                Rating
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={3}
                                                    style={{
                                                        ...cellStyle,
                                                        textAlign: 'center',
                                                        color: theme.colors.placeholder,
                                                    }}
                                                >
                                                    No ranked games yet
                                                </td>
                                            </tr>
                                        ) : (
                                            rows.map((row) => (
                                                <tr key={row.username}>
                                                    <td
                                                        style={{
                                                            ...cellStyle,
                                                            textAlign: 'right',
                                                            whiteSpace: 'nowrap',
                                                            color: theme.colors.placeholder,
                                                        }}
                                                    >
                                                        {row.rank}
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...cellStyle,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        <Link
                                                            to={`/user/${row.username}`}
                                                            style={{
                                                                color: theme.colors.link,
                                                                textDecoration: 'none',
                                                            }}
                                                        >
                                                            {row.username}
                                                        </Link>
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...cellStyle,
                                                            textAlign: 'right',
                                                            whiteSpace: 'nowrap',
                                                            fontWeight: 600,
                                                            paddingRight: 14,
                                                        }}
                                                    >
                                                        {row.rating}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </ResizableCard>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
