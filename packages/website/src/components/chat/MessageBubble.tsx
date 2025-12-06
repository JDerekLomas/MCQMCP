'use client';

import { type ReactNode } from 'react';

type MessageRole = 'user' | 'assistant';

interface MessageBubbleProps {
  role: MessageRole;
  children: ReactNode;
  timestamp?: Date;
  className?: string;
}

// Claude's starburst/asterisk logo
function ClaudeLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"
        stroke="#C15F3C"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserAvatar({ className }: { className?: string }) {
  return (
    <div
      className={`
        flex items-center justify-center
        w-7 h-7
        rounded-full
        bg-[#E8DDD4]
        text-[11px] font-semibold text-ink-secondary
        ${className}
      `}
    >
      DL
    </div>
  );
}

export function MessageBubble({
  role,
  children,
  timestamp,
  className = '',
}: MessageBubbleProps) {
  const isAssistant = role === 'assistant';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div
      className={`
        max-w-[48rem] w-full mx-auto
        px-4 py-3
        animate-fade-in
        ${className}
      `}
    >
      {/* Header with avatar and role */}
      <div className="flex items-center gap-2 mb-2">
        {isAssistant ? (
          <ClaudeLogo className="w-6 h-6" />
        ) : (
          <UserAvatar />
        )}
        <span className="text-[13px] font-medium text-ink-primary">
          {isAssistant ? 'Claude' : 'You'}
        </span>
        {timestamp && (
          <span className="text-[11px] text-ink-tertiary">
            {formatTime(timestamp)}
          </span>
        )}
      </div>

      {/* Message body */}
      <div className="pl-8">
        {children}
      </div>
    </div>
  );
}
