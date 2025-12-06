'use client';

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const baseStyles = `
  w-full
  bg-surface-primary
  text-ink-primary
  placeholder:text-ink-tertiary
  border border-edge-light
  rounded-claude
  transition-all duration-200
  focus:outline-none focus:border-claude focus:ring-1 focus:ring-claude/20
  disabled:opacity-50 disabled:cursor-not-allowed
`;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          ${baseStyles}
          h-10 px-4 text-sm
          ${error ? 'border-learn-incorrect focus:border-learn-incorrect focus:ring-learn-incorrect/20' : ''}
          ${className}
        `}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`
          ${baseStyles}
          px-4 py-3 text-sm
          resize-none
          ${error ? 'border-learn-incorrect focus:border-learn-incorrect focus:ring-learn-incorrect/20' : ''}
          ${className}
        `}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
