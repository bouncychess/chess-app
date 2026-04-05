import { useCallback, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { useTheme } from '../../../context/ThemeContext';
import { getImageUploadUrl, uploadImageToS3 } from '../../../services/articles';

type EditorToolbarProps = {
    editor: Editor;
    articleId?: string;
    onImageUploaded?: (imageUrl: string) => void;
};

export default function EditorToolbar({ editor, articleId, onImageUploaded }: EditorToolbarProps) {
    const { theme } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const colorInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const { upload_url, image_url } = await getImageUploadUrl(
                file.name,
                file.type,
                articleId,
            );
            await uploadImageToS3(upload_url, file);
            editor.chain().focus().setImage({ src: image_url }).run();
            onImageUploaded?.(image_url);
        } catch (err) {
            console.error('Image upload failed:', err);
            alert('Failed to upload image. Please try again.');
        }

        // Reset input so same file can be re-selected
        e.target.value = '';
    }, [editor, articleId, onImageUploaded]);

    const btnStyle = (isActive: boolean): React.CSSProperties => ({
        padding: '4px 8px',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 4,
        backgroundColor: isActive ? theme.colors.text : theme.colors.cardBackground,
        color: isActive ? theme.colors.cardBackground : theme.colors.text,
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: 600,
        minWidth: 28,
        lineHeight: 1,
    });

    const sepStyle: React.CSSProperties = {
        width: 1,
        height: 20,
        backgroundColor: theme.colors.border,
        margin: '0 4px',
    };

    return (
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 4,
            padding: '8px 12px',
            borderBottom: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.cardBackground,
        }}>
            {/* Text formatting */}
            <button
                type="button"
                style={btnStyle(editor.isActive('bold'))}
                onClick={() => editor.chain().focus().toggleBold().run()}
                title="Bold"
            >
                B
            </button>
            <button
                type="button"
                style={{ ...btnStyle(editor.isActive('italic')), fontStyle: 'italic' }}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                title="Italic"
            >
                I
            </button>
            <button
                type="button"
                style={{ ...btnStyle(editor.isActive('underline')), textDecoration: 'underline' }}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                title="Underline"
            >
                U
            </button>
            <button
                type="button"
                style={btnStyle(editor.isActive('strike'))}
                onClick={() => editor.chain().focus().toggleStrike().run()}
                title="Strikethrough"
            >
                S&#x336;
            </button>

            <div style={sepStyle} />

            {/* Headings */}
            <button
                type="button"
                style={btnStyle(editor.isActive('heading', { level: 1 }))}
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                title="Heading 1"
            >
                H1
            </button>
            <button
                type="button"
                style={btnStyle(editor.isActive('heading', { level: 2 }))}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                title="Heading 2"
            >
                H2
            </button>
            <button
                type="button"
                style={btnStyle(editor.isActive('heading', { level: 3 }))}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                title="Heading 3"
            >
                H3
            </button>

            <div style={sepStyle} />

            {/* Lists */}
            <button
                type="button"
                style={btnStyle(editor.isActive('bulletList'))}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                title="Bullet List"
            >
                &#x2022; List
            </button>
            <button
                type="button"
                style={btnStyle(editor.isActive('orderedList'))}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                title="Ordered List"
            >
                1. List
            </button>

            <div style={sepStyle} />

            {/* Alignment */}
            <button
                type="button"
                style={btnStyle(editor.isActive({ textAlign: 'left' }))}
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                title="Align Left"
            >
                &#x2261;
            </button>
            <button
                type="button"
                style={btnStyle(editor.isActive({ textAlign: 'center' }))}
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                title="Align Center"
            >
                &#x2550;
            </button>
            <button
                type="button"
                style={btnStyle(editor.isActive({ textAlign: 'right' }))}
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                title="Align Right"
            >
                &#x2263;
            </button>

            <div style={sepStyle} />

            {/* Text color */}
            <div style={{ position: 'relative', display: 'inline-flex' }}>
                <button
                    type="button"
                    style={btnStyle(false)}
                    onClick={() => colorInputRef.current?.click()}
                    title="Text Color"
                >
                    A&#x332;
                </button>
                <input
                    ref={colorInputRef}
                    type="color"
                    value={editor.getAttributes('textStyle').color || '#000000'}
                    onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                />
            </div>
            <button
                type="button"
                style={btnStyle(false)}
                onClick={() => editor.chain().focus().unsetColor().run()}
                title="Remove Color"
            >
                A&#x20E0;
            </button>

            <div style={sepStyle} />

            {/* Link */}
            <button
                type="button"
                style={btnStyle(editor.isActive('link'))}
                onClick={() => {
                    if (editor.isActive('link')) {
                        editor.chain().focus().unsetLink().run();
                        return;
                    }
                    const url = window.prompt('Enter URL:');
                    if (url) {
                        editor.chain().focus().setLink({ href: url }).run();
                    }
                }}
                title="Link"
            >
                &#x1F517;
            </button>

            <div style={sepStyle} />

            {/* Image upload */}
            <button
                type="button"
                style={btnStyle(false)}
                onClick={() => fileInputRef.current?.click()}
                title="Insert Image"
            >
                &#x1F5BC; Image
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
            />

            <div style={sepStyle} />

            {/* Undo/Redo */}
            <button
                type="button"
                style={btnStyle(false)}
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                title="Undo"
            >
                &#x21A9;
            </button>
            <button
                type="button"
                style={btnStyle(false)}
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                title="Redo"
            >
                &#x21AA;
            </button>
        </div>
    );
}
