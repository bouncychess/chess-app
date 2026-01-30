// components/buttons/Button.tsx
import React from 'react';
import { theme } from '../../config/theme';

type ButtonProps = {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: 'button' | 'submit';
    variant?: 'primary' | 'secondary' | 'danger';
};

export const Button = ({
                           children,
                           onClick,
                           disabled,
                           type = 'button',
                           variant = 'primary',
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
    };

    const styles = variantStyles[variant];

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={{
                ...styles,
                opacity: disabled ? 0.5 : 1,
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontWeight: 600,
            }}
        >
            {children}
        </button>
    );
};