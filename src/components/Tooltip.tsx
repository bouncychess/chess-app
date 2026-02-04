import { useState, type ReactNode, type CSSProperties } from 'react';
import { theme } from '../config/theme';

interface TooltipProps {
    children: ReactNode;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    style?: CSSProperties;
}

export function Tooltip({ children, content, position = 'right', style }: TooltipProps) {
    const [visible, setVisible] = useState(false);

    const getPositionStyles = (): CSSProperties => {
        const offset = 8;
        switch (position) {
            case 'top':
                return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: offset };
            case 'bottom':
                return { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: offset };
            case 'left':
                return { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: offset };
            case 'right':
                return { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: offset };
        }
    };

    return (
        <div
            style={{ position: 'relative', display: 'inline-block', ...style }}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
        >
            {children}
            {visible && (
                <div
                    style={{
                        position: 'absolute',
                        ...getPositionStyles(),
                        backgroundColor: theme.colors.cardBackground,
                        color: theme.colors.text,
                        padding: '8px 12px',
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap',
                        zIndex: 1000,
                        pointerEvents: 'none',
                    }}
                >
                    {content}
                </div>
            )}
        </div>
    );
}
