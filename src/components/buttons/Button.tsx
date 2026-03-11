// components/buttons/Button.tsx
import React from 'react';
import { useTheme } from '../../context/ThemeContext';

type ButtonProps = {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: 'button' | 'submit';
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    size?: 'sm' | 'md';
    title?: string;
};

export const Button = ({
                           children,
                           onClick,
                           disabled,
                           type = 'button',
                           variant = 'primary',
                           size = 'md',
                           title,
                       }: ButtonProps) => {
    const { theme, mode } = useTheme();

    const variantStyles = {
        primary: {
            backgroundColor: theme.colors.primary,
            color: theme.colors.primaryText,
        },
        secondary: {
            backgroundColor: theme.colors.secondary,
            color: theme.colors.secondaryText,
        },
        danger: {
            backgroundColor: theme.colors.danger,
            color: theme.colors.dangerText,
        },
        success: {
            backgroundColor: '#22c55e',
            color: '#ffffff',
        },
    };

    const sizeStyles = mode === 'windows'
        ? { sm: {}, md: {} }
        : {
            sm: { padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem' },
            md: { padding: '0.5rem 1rem', borderRadius: '6px', fontSize: undefined as string | undefined },
        };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            title={title}
            style={{
                ...variantStyles[variant],
                ...sizeStyles[size],
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? (mode === 'windows' ? 'default' : 'not-allowed') : 'pointer',
                border: 'none',
                whiteSpace: 'nowrap',
                ...(theme.button.fontFamily ? { fontFamily: theme.button.fontFamily } : {}),
                ...(theme.button.fontWeight ? { fontWeight: theme.button.fontWeight } : {}),
                ...(theme.button.fontSize ? { fontSize: theme.button.fontSize } : {}),
                ...(theme.button.padding ? { padding: theme.button.padding } : {}),
                ...(theme.button.borderRadius ? { borderRadius: theme.button.borderRadius } : {}),
                ...(theme.button.boxShadow ? { boxShadow: theme.button.boxShadow } : {}),
                ...(theme.button.minHeight ? { minHeight: theme.button.minHeight } : {}),
            }}
        >
            {children}
        </button>
    );
};
