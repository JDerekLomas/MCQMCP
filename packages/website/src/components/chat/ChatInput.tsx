'use client';

import { useState, useRef, useEffect, forwardRef, type FormEvent, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSubmit?: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  learningModeEnabled?: boolean;
  className?: string;
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SlidersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 16V4M10 4L5 9M10 4L15 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  function ChatInput({
    onSubmit,
    disabled = false,
    placeholder = 'How can I help you today?',
    learningModeEnabled = false,
    className = '',
  }, ref) {
    const [message, setMessage] = useState('');
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    // Auto-resize textarea
    useEffect(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
      }
    }, [message, textareaRef]);

    const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      if (message.trim() && !disabled) {
        onSubmit?.(message.trim());
        setMessage('');
      }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    };

    const canSubmit = message.trim().length > 0 && !disabled;

    return (
      <div
        className={cn("bg-white px-4 py-4", className)}
      >
        <form
          onSubmit={handleSubmit}
          className="max-w-[48rem] mx-auto"
        >
          {/* Input container - matches Claude.ai style */}
          <div
            className={cn(
              "flex items-end bg-[#F5F4F1] border border-[#E8E7E3] rounded-2xl px-4 py-2 focus-within:border-[#D9D8D4] focus-within:shadow-sm transition-all duration-150",
              learningModeEnabled && "border-[#DA7756]/30 ring-1 ring-[#DA7756]/10"
            )}
          >
            {/* Left icons */}
            <div className="flex items-center gap-0.5 pb-1.5">
              <button
                type="button"
                className="p-2 text-[#8E8E8E] hover:text-[#5D5D5D] rounded-lg hover:bg-[#E8E7E3] transition-colors"
                aria-label="Add content"
              >
                <PlusIcon />
              </button>
              <button
                type="button"
                className="p-2 text-[#8E8E8E] hover:text-[#5D5D5D] rounded-lg hover:bg-[#E8E7E3] transition-colors"
                aria-label="Settings"
              >
                <SlidersIcon />
              </button>
              <button
                type="button"
                className="p-2 text-[#DA7756] hover:bg-[#DA7756]/10 rounded-lg transition-colors"
                aria-label="History"
              >
                <ClockIcon />
              </button>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="flex-1 bg-transparent text-[#0D0D0D] text-[15px] placeholder:text-[#A3A3A3] resize-none outline-none max-h-[200px] leading-relaxed py-2 px-3"
            />

            {/* Right side - model selector and send */}
            <div className="flex items-center gap-2 pb-1.5">
              {/* Model selector */}
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-[#5D5D5D] hover:bg-[#E8E7E3] rounded-full transition-colors border border-transparent hover:border-[#E8E7E3]"
              >
                Opus 4.5
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Send/Stop button - circular */}
              <button
                type="submit"
                disabled={!canSubmit}
                className={cn(
                  "w-9 h-9 flex items-center justify-center rounded-full transition-all duration-150 border",
                  canSubmit
                    ? "bg-[#0D0D0D] hover:bg-[#2D2D2D] text-white border-[#0D0D0D]"
                    : "bg-white text-[#A3A3A3] border-[#E8E7E3] cursor-not-allowed"
                )}
                aria-label="Send message"
              >
                {/* Stop icon when can submit, record icon when empty */}
                {canSubmit ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="6" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Footer text */}
          <p className="mt-2 text-center text-[11px] text-[#8E8E8E]">
            Claude can make mistakes. Please double-check responses.
          </p>
        </form>
      </div>
    );
  }
);
