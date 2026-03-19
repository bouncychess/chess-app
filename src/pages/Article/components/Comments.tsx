import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { theme } from '../../../config/theme';
import { Button } from '../../../components/buttons/Button';
import { getComments, addComment, deleteComment, type Comment } from '../../../services/comments';

function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

interface CommentsProps {
    articleId: string;
}

export default function Comments({ articleId }: CommentsProps) {
    const { user, isAuthenticated } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newText, setNewText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        getComments(articleId)
            .then(setComments)
            .catch(() => setComments([]))
            .finally(() => setIsLoading(false));
    }, [articleId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = newText.trim();
        if (!text || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const comment = await addComment(articleId, text);
            setComments(prev => [...prev, comment]);
            setNewText('');
        } catch (err) {
            console.error('Failed to add comment:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        const prev = comments;
        setComments(c => c.filter(x => x.comment_id !== commentId));
        try {
            await deleteComment(articleId, commentId);
        } catch {
            setComments(prev);
        }
    };

    return (
        <div style={{ marginTop: 40 }}>
            <h3 style={{
                fontFamily: '"Playfair Display", "Georgia", "Times New Roman", serif',
                marginBottom: 16,
            }}>
                Comments {!isLoading && `(${comments.length})`}
            </h3>

            {isLoading ? (
                <p style={{ color: theme.colors.placeholder, fontSize: '0.875rem' }}>Loading comments...</p>
            ) : comments.length === 0 ? (
                <p style={{ color: theme.colors.placeholder, fontSize: '0.875rem' }}>No comments yet. Be the first to comment!</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {comments.map(comment => (
                        <div
                            key={comment.comment_id}
                            style={{
                                ...theme.card,
                                padding: 12,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                        {comment.username}
                                    </span>
                                    <span style={{ color: theme.colors.placeholder, fontSize: '0.75rem' }}>
                                        {timeAgo(comment.created_at)}
                                    </span>
                                </div>
                                {user?.username === comment.username && (
                                    <button
                                        onClick={() => handleDelete(comment.comment_id)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: theme.colors.placeholder,
                                            fontSize: '0.875rem',
                                            padding: '2px 6px',
                                        }}
                                        title="Delete comment"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5 }}>
                                {comment.text}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {isAuthenticated && (
                <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                    <input
                        value={newText}
                        onChange={e => setNewText(e.target.value)}
                        placeholder="Write a comment..."
                        maxLength={500}
                        style={{
                            ...theme.input,
                            flex: 1,
                        }}
                    />
                    <Button
                        variant="primary"
                        size="sm"
                        type="submit"
                        disabled={!newText.trim() || isSubmitting}
                    >
                        {isSubmitting ? '...' : 'Post'}
                    </Button>
                </form>
            )}
        </div>
    );
}
