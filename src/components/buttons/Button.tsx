// components/buttons/Button.tsx
import React from 'react';
import { theme } from '../../config/theme';

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

    const sizeStyles = {
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
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                border: 'none',
                whiteSpace: 'nowrap',
            }}
        >
            {children}
        </button>
    );
};