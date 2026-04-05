import Image from '@tiptap/extension-image';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { EditorView, NodeView } from '@tiptap/pm/view';


class ResizableImageView implements NodeView {
    dom: HTMLDivElement;
    img: HTMLImageElement;
    private handle: HTMLDivElement;
    private node: ProseMirrorNode;
    private view: EditorView;
    private getPos: () => number;

    constructor(node: ProseMirrorNode, view: EditorView, getPos: () => number) {
        this.node = node;
        this.view = view;
        this.getPos = getPos;

        // Wrapper
        this.dom = document.createElement('div');
        this.dom.style.cssText = 'position: relative; display: inline-block; max-width: 100%; line-height: 0; margin: 8px 0;';

        // Image
        this.img = document.createElement('img');
        this.img.src = node.attrs.src;
        if (node.attrs.alt) this.img.alt = node.attrs.alt;
        if (node.attrs.title) this.img.title = node.attrs.title;
        this.img.style.cssText = 'display: block; max-width: 100%; height: auto; border-radius: 8px; cursor: pointer;';
        if (node.attrs.width) {
            this.img.style.width = node.attrs.width;
        }
        this.img.draggable = false;

        // Invisible resize handle (bottom-right corner, cursor only)
        this.handle = document.createElement('div');
        this.handle.style.cssText = `
            position: absolute; bottom: 0; right: 0;
            width: 32px; height: 32px;
            cursor: nwse-resize;
        `;

        this.dom.appendChild(this.img);
        this.dom.appendChild(this.handle);

        this.handle.addEventListener('mousedown', this.onResizeStart);
    }

    private _resizing = false;
    private _startX = 0;
    private _startWidth = 0;

    private onResizeStart = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        this._resizing = true;
        this._startX = e.clientX;
        this._startWidth = this.img.getBoundingClientRect().width;
        this.img.style.outline = '2px solid #3b82f6';

        document.addEventListener('mousemove', this.onResizeMove);
        document.addEventListener('mouseup', this.onResizeEnd);
    };

    private onResizeMove = (e: MouseEvent) => {
        if (!this._resizing) return;
        const newWidth = Math.max(50, this._startWidth + (e.clientX - this._startX));
        this.img.style.width = `${newWidth}px`;
    };

    private onResizeEnd = () => {
        if (!this._resizing) return;
        this._resizing = false;
        this.img.style.outline = '';

        document.removeEventListener('mousemove', this.onResizeMove);
        document.removeEventListener('mouseup', this.onResizeEnd);

        // Persist the new width to the node attrs
        const width = this.img.style.width;
        const pos = this.getPos();
        const tr = this.view.state.tr.setNodeMarkup(pos, undefined, {
            ...this.node.attrs,
            width,
        });
        this.view.dispatch(tr);
    };

    update(node: ProseMirrorNode): boolean {
        if (node.type.name !== 'image') return false;
        this.node = node;
        this.img.src = node.attrs.src;
        if (node.attrs.alt) this.img.alt = node.attrs.alt;
        if (node.attrs.width) {
            this.img.style.width = node.attrs.width;
        } else {
            this.img.style.width = '';
        }
        return true;
    }

    ignoreMutation() { return true; }

    destroy() {
        document.removeEventListener('mousemove', this.onResizeMove);
        document.removeEventListener('mouseup', this.onResizeEnd);
    }
}

export const ResizableImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: null,
                parseHTML: (element: HTMLElement) => element.getAttribute('width') || element.style.width || null,
                renderHTML: (attributes: Record<string, string>) => {
                    if (!attributes.width) return {};
                    return { style: `width: ${attributes.width}; height: auto;` };
                },
            },
        };
    },

    addNodeView() {
        return ({ node, view, getPos }) => {
            return new ResizableImageView(node, view, getPos as () => number);
        };
    },
});
