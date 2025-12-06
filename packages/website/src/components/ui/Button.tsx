'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-claude text-white
    hover:bg-claude-hover
    active:bg-claude-hover
  `,
  secondary: `
    bg-surface-secondary text-ink-primary
    hover:bg-surface-tertiary
    active:bg-surface-tertiary
  `,
  ghost: `
    bg-transparent text-ink-primary
    hover:bg-surface-tertiary
    active:bg-surface-tertiary
  `,
  outline: `
    bg-transparent text-ink-primary
    border border-edge
    hover:bg-surface-secondary
    active:bg-surface-tertiary
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm rounded-md',
  md: 'h-10 px-4 text-sm rounded-claude',
  lg: 'h-12 px-6 text-base rounded-claude',
  icon: 'h-10 w-10 rounded-claude flex items-center justify-center',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center gap-2
          font-medium
          transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-claude focus-visible:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
