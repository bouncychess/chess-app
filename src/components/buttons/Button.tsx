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
                padding: '4px 16px',
                borderRadius: 0,
                fontWeight: 400,
                fontFamily: '"MS Sans Serif", "Microsoft Sans Serif", Tahoma, Geneva, sans-serif',
                fontSize: '12px',
                border: 'none',
                boxShadow: 'inset -1px -1px 0 #000000, inset 1px 1px 0 #ffffff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf',
                cursor: disabled ? 'default' : 'pointer',
                minHeight: 23,
            }}
        >
            {children}
        </button>
    );
};