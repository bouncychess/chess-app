import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import { ResizableImage } from './extensions/ResizableImage';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/buttons/Button';
import EditorToolbar from './components/EditorToolbar';
import {
    getArticle,
    createArticle,
    updateArticle,
    deleteArticle,
    type ArticleStatus,
} from '../../services/articles';

function extractFirstImageUrl(html: string): string | null {
    const match = html.match(/<img[^>]+src="([^"]+)"/);
    return match ? match[1] : null;
}

export default function ArticleEditor() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { role, isAuthenticated } = useAuth();
    const { theme } = useTheme();
    const isEditing = !!id;

    const [title, setTitle] = useState('');
    const [status, setStatus] = useState<ArticleStatus>('draft');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(isEditing);
    const [articleId, setArticleId] = useState<string | undefined>(id);
    const [authorUsername, setAuthorUsername] = useState<string | null>(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            ResizableImage.configure({ inline: false, allowBase64: false }),
            Color,
            TextStyle,
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Link.configure({ openOnClick: false }),
        ],
        content: '',
        editorProps: {
            attributes: {
                style: `min-height: 400px; outline: none; padding: 16px; font-size: 1.05rem; line-height: 1.7; color: ${theme.colors.text};`,
            },
        },
    });

    // Redirect if not staff/admin
    useEffect(() => {
        if (isAuthenticated === false) {
            navigate('/news');
        } else if (isAuthenticated && role !== 'admin' && role !== 'staff') {
            navigate('/news');
        }
    }, [isAuthenticated, role, navigate]);

    // Load existing article for editing
    useEffect(() => {
        if (!isEditing || !id) return;
        let cancelled = false;
        (async () => {
            try {
                const article = await getArticle(id);
                if (cancelled) return;
                setTitle(article.title);
                setStatus(article.status);
                setArticleId(article.article_id);
                setAuthorUsername(article.author_username);
                editor?.commands.setContent(article.content);
            } catch {
                if (!cancelled) setError('Failed to load article');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id, isEditing, editor]);

    const handleSave = useCallback(async (publishStatus: ArticleStatus) => {
        if (!editor || !title.trim()) {
            setError('Title is required');
            return;
        }

        const html = editor.getHTML();
        const previewImageUrl = extractFirstImageUrl(html);

        setSaving(true);
        setError(null);

        try {
            if (isEditing && articleId) {
                await updateArticle(articleId, {
                    title: title.trim(),
                    content: html,
                    preview_image_url: previewImageUrl,
                    status: publishStatus,
                });
            } else {
                const result = await createArticle({
                    title: title.trim(),
                    content: html,
                    preview_image_url: previewImageUrl,
                    status: publishStatus,
                });
                setArticleId(result.article_id);
                // Update URL to edit mode so subsequent saves are updates
                navigate(`/articles/editor/${result.article_id}`, { replace: true });
            }
            setStatus(publishStatus);
            if (publishStatus === 'published') {
                navigate('/news');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save article');
        } finally {
            setSaving(false);
        }
    }, [editor, title, isEditing, articleId, navigate]);

    const handleDelete = useCallback(async () => {
        if (!articleId || !isEditing) return;
        if (!window.confirm('Are you sure you want to delete this article? This cannot be undone.')) return;

        setSaving(true);
        setError(null);
        try {
            await deleteArticle(articleId);
            navigate('/news');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete article');
        } finally {
            setSaving(false);
        }
    }, [articleId, isEditing, navigate]);

    if (isAuthenticated === null || loading) {
        return <div style={{ padding: 32, color: theme.colors.text }}>Loading...</div>;
    }

    if (!editor) return null;

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', marginTop: 24 }}>
            {error && (
                <div style={{
                    padding: '10px 16px',
                    marginBottom: 16,
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    borderRadius: 6,
                    fontSize: '0.9rem',
                }}>
                    {error}
                </div>
            )}

            {/* Title input */}
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Article title..."
                style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '1.5rem',
                    fontFamily: '"Playfair Display", "Georgia", "Times New Roman", serif',
                    fontWeight: 700,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: 8,
                    backgroundColor: theme.colors.cardBackground,
                    color: theme.colors.text,
                    marginBottom: 16,
                    boxSizing: 'border-box',
                    outline: 'none',
                }}
            />

            {/* Editor */}
            <div style={{
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 8,
                overflow: 'hidden',
                backgroundColor: theme.colors.cardBackground,
                marginBottom: 16,
            }}>
                <EditorToolbar
                    editor={editor}
                    articleId={articleId}
                />
                <EditorContent editor={editor} />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                    variant="secondary"
                    onClick={() => handleSave('draft')}
                    disabled={saving}
                >
                    {saving && status === 'draft' ? 'Saving...' : 'Save Draft'}
                </Button>
                {status === 'published' ? (
                    <Button
                        variant="secondary"
                        onClick={() => handleSave('draft')}
                        disabled={saving}
                    >
                        Unpublish
                    </Button>
                ) : (
                    <Button
                        variant="success"
                        onClick={() => handleSave('published')}
                        disabled={saving}
                    >
                        {saving ? 'Publishing...' : 'Publish'}
                    </Button>
                )}
                {isEditing && (
                    <Button
                        variant="danger"
                        onClick={handleDelete}
                        disabled={saving}
                    >
                        Delete
                    </Button>
                )}
                <Button
                    variant="secondary"
                    onClick={() => navigate('/news')}
                    disabled={saving}
                >
                    Cancel
                </Button>
                {status === 'draft' && (
                    <span style={{ fontSize: '0.85rem', color: theme.colors.placeholder, marginLeft: 8 }}>
                        Draft — not visible to readers
                    </span>
                )}
            </div>
        </div>
    );
}
