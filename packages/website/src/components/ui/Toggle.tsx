'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';

interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  size?: 'sm' | 'md';
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked = false, onChange, label, size = 'md', className = '', disabled, ...props }, ref) => {
    const trackWidth = size === 'sm' ? 'w-9' : 'w-11';
    const trackHeight = size === 'sm' ? 'h-5' : 'h-6';
    const thumbSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    const thumbTranslate = size === 'sm' ? 'translate-x-4' : 'translate-x-5';

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`
          group flex items-center gap-3
          focus:outline-none
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        <span
          className={`
            relative inline-flex shrink-0 cursor-pointer items-center
            ${trackWidth} ${trackHeight}
            rounded-full
            transition-colors duration-200 ease-in-out
            focus-visible:ring-2 focus-visible:ring-claude focus-visible:ring-offset-2
            ${checked ? 'bg-claude' : 'bg-edge'}
            ${disabled ? 'cursor-not-allowed' : ''}
          `}
        >
          <span
            className={`
              ${thumbSize}
              pointer-events-none inline-block
              rounded-full bg-white
              shadow-sm
              ring-0
              transition-transform duration-200 ease-in-out
              ${checked ? thumbTranslate : 'translate-x-0.5'}
            `}
          />
        </span>
        {label && (
          <span className="text-sm text-ink-primary font-medium">
            {label}
          </span>
        )}
      </button>
    );
  }
);

Toggle.displayName = 'Toggle';
