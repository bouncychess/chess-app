import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { theme } from '../../config/theme';
import { TextInput } from '../../components/input/TextInput';
import { Button } from '../../components/buttons/Button';
import { getUserGames, type GameHistoryItem } from '../../services/games';

const PAGE_SIZE = 10;

function getResultForPlayer(game: GameHistoryItem, username: string): string {
    if (!game.result) return '—';
    if (game.result === 'draw') return 'Draw';
    const playedWhite = game.white_username === username;
    const whiteWon = game.result === 'white';
    return (playedWhite && whiteWon) || (!playedWhite && !whiteWon) ? 'Win' : 'Loss';
}

function getResultColor(result: string): string {
    if (result === 'Win') return '#16a34a';
    if (result === 'Loss') return '#dc2626';
    return theme.colors.text;
}

function formatTimeControl(initialTime: number, increment: number): string {
    const minutes = Math.floor(initialTime / 60000);
    const seconds = increment / 1000;
    return `${minutes}+${seconds}`;
}

export default function GameHistory({ username }: { username: string }) {
    const [games, setGames] = useState<GameHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);

    useEffect(() => {
        async function fetchGames() {
            try {
                const data = await getUserGames(username);
                setGames(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load games');
            } finally {
                setLoading(false);
            }
        }

        fetchGames();
    }, [username]);

    const filtered = useMemo(() => {
        if (!search) return games;
        const lower = search.toLowerCase();
        return games.filter((game) => {
            const opponent = game.white_username === username ? game.black_username : game.white_username;
            return opponent.toLowerCase().includes(lower);
        });
    }, [games, search, username]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    // Reset to first page when search changes
    useEffect(() => {
        setPage(0);
    }, [search]);

    if (loading) return <p>Loading games...</p>;
    if (error) return <p style={{ color: theme.colors.danger }}>{error}</p>;
    if (games.length === 0) return <p style={{ color: theme.colors.placeholder }}>No games played yet</p>;

    const cellStyle = {
        padding: '8px 12px',
        borderBottom: `1px solid ${theme.colors.border}`,
        textAlign: 'left' as const,
    };

    return (
        <div style={{ marginTop: 40, maxWidth: 850 }}>
            <h3 style={{ color: theme.colors.text, marginTop: 0, marginBottom: 12 }}>Games</h3>
            <div style={{ marginBottom: 12, maxWidth: 250 }}>
                <TextInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Search opponent..."
                />
            </div>

            <div style={{ overflowX: 'auto', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ ...theme.card, padding: 0, overflow: 'hidden', height: PAGE_SIZE * 37 + 37, minWidth: 600, boxShadow: 'none', border: '1px solid rgba(0,0,0,0.15)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: theme.colors.text, tableLayout: 'fixed' }}>
                    <colgroup>
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '30%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '13%' }} />
                    </colgroup>
                    <thead>
                        <tr style={{ backgroundColor: theme.colors.background }}>
                            <th style={cellStyle}>Date</th>
                            <th style={cellStyle}>Opponent</th>
                            <th style={cellStyle}>Color</th>
                            <th style={cellStyle}>Result</th>
                            <th style={cellStyle}>Time</th>
                            <th style={cellStyle}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {paged.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ ...cellStyle, textAlign: 'center', color: theme.colors.placeholder }}>
                                    No games found
                                </td>
                            </tr>
                        ) : paged.map((game) => {
                            const playedWhite = game.white_username === username;
                            const opponent = playedWhite ? game.black_username : game.white_username;
                            const result = getResultForPlayer(game, username);
                            return (
                                <tr key={game.game_id}>
                                    <td style={{ ...cellStyle, fontSize: '0.875rem' }}>
                                        {game.last_move_timestamp
                                            ? new Date(game.last_move_timestamp).toLocaleDateString()
                                            : '—'}
                                    </td>
                                    <td style={cellStyle}>
                                        {!opponent.startsWith('Guest_') && !opponent.startsWith('guest_') && !opponent.endsWith('_bot') ? (
                                            <Link to={`/user/${opponent}`} style={{ color: theme.colors.link, textDecoration: 'none' }}>
                                                {opponent}
                                            </Link>
                                        ) : opponent}
                                    </td>
                                    <td style={cellStyle}>{playedWhite ? 'White' : 'Black'}</td>
                                    <td style={{ ...cellStyle, color: getResultColor(result), fontWeight: 600 }}>
                                        {result}
                                    </td>
                                    <td style={cellStyle}>{formatTimeControl(game.initial_time, game.increment)}</td>
                                    <td style={cellStyle}>
                                        <Link to={`/game/${game.game_id}`} style={{ color: theme.colors.link }}>
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                {totalPages > 1 && (
                    <>
                        <Button size="sm" variant="secondary" onClick={() => setPage(0)} disabled={page === 0}>
                            First
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                            Prev
                        </Button>
                        <span style={{ color: theme.colors.text, fontSize: '0.875rem', minWidth: 60, textAlign: 'center' }}>
                            {page + 1} / {totalPages}
                        </span>
                        <Button size="sm" variant="secondary" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
                            Next
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>
                            Last
                        </Button>
                    </>
                )}
                <span style={{ color: theme.colors.placeholder, fontSize: '0.875rem', marginLeft: totalPages > 1 ? 'auto' : 0 }}>
                    {games.length} games played
                </span>
            </div>
        </div>
    );
}
