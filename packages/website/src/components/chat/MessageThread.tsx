'use client';

import { useRef, useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MessageThreadProps {
  children: ReactNode;
  className?: string;
  autoScroll?: boolean;
}

export function MessageThread({
  children,
  className = '',
  autoScroll = true,
}: MessageThreadProps) {
  const threadRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [children, autoScroll]);

  return (
    <div
      ref={threadRef}
      className={cn("flex-1 overflow-y-auto bg-surface-primary", className)}
    >
      {/* Messages container with max width constraint */}
      <div className="min-h-full flex flex-col">
        {/* Spacer to push content down when few messages */}
        <div className="flex-1" />

        {/* Messages */}
        <div className="py-4">
          {children}
        </div>

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// Loading indicator for streaming responses
export function MessageLoading() {
  return (
    <div className="flex gap-4 max-w-message w-full mx-auto px-4 py-4">
      {/* Claude avatar placeholder */}
      <div className="shrink-0 pt-1">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-claude">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L4 6V12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12V6L12 2Z"
              fill="white"
              fillOpacity="0.9"
            />
          </svg>
        </div>
      </div>

      {/* Loading animation */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-ink-primary">Claude</span>
        </div>
        <div className="flex items-center gap-1.5 py-2">
          <span className="w-2 h-2 rounded-full bg-ink-tertiary animate-pulse-subtle" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-ink-tertiary animate-pulse-subtle" style={{ animationDelay: '200ms' }} />
          <span className="w-2 h-2 rounded-full bg-ink-tertiary animate-pulse-subtle" style={{ animationDelay: '400ms' }} />
        </div>
      </div>
    </div>
  );
}

// Book/Learn icon for Learning Mode
function BookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

// Static greeting - avoids hydration mismatch from server/client time differences
function getGreeting(): string {
  return 'Hello';
}

// Topic icons
function JavaScriptIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function ReactIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <ellipse cx="12" cy="12" rx="10" ry="4" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
    </svg>
  );
}

function CSSIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 7h10M7 12h6M7 17h8" />
    </svg>
  );
}

function TypeScriptIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 8v8M8 8h8" />
    </svg>
  );
}

// Available learning topics
const learningTopics = [
  { id: 'javascript', name: 'JavaScript', icon: JavaScriptIcon, description: 'Core language concepts, async, closures' },
  { id: 'react', name: 'React', icon: ReactIcon, description: 'Components, hooks, state management' },
  { id: 'html-css', name: 'HTML & CSS', icon: CSSIcon, description: 'Layout, flexbox, grid, accessibility' },
  { id: 'typescript', name: 'TypeScript', icon: TypeScriptIcon, description: 'Types, interfaces, generics' },
];

interface EmptyThreadProps {
  learningModeEnabled?: boolean;
  onLearningModeChange?: (enabled: boolean) => void;
  onSelectTopic?: (topicId: string) => void;
}

// Empty state when no messages - simple greeting with Learning Mode toggle
export function EmptyThread({ learningModeEnabled = false, onLearningModeChange, onSelectTopic }: EmptyThreadProps) {
  const greeting = getGreeting();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
      {/* Greeting with Claude logo */}
      <div className="flex items-center gap-3 mb-8">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L12 22M2 12L22 12M4.93 4.93L19.07 19.07M19.07 4.93L4.93 19.07"
            stroke="#DA7756"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <h1 className="text-[32px] font-normal text-[#0D0D0D]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
          {greeting}!
        </h1>
      </div>

      {!learningModeEnabled ? (
        // Learning Mode Toggle when OFF
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => onLearningModeChange?.(true)}
            className="flex items-center gap-3 px-6 py-3 text-[15px] font-medium rounded-full transition-all duration-200 shadow-sm bg-white text-[#5D5D5D] border-2 border-[#E8E7E3] hover:border-[#DA7756] hover:text-[#DA7756]"
          >
            <BookIcon />
            <span>Start Learning</span>
          </button>

          <p className="text-[13px] text-[#8E8E8E] text-center max-w-sm">
            Get personalized assessments and track your progress across frontend topics.
          </p>
        </div>
      ) : (
        // Topic selection when Learning Mode is ON
        <div className="flex flex-col items-center gap-6 w-full max-w-lg">
          <p className="text-[15px] text-[#5D5D5D] text-center">
            What would you like to learn about?
          </p>

          <div className="grid grid-cols-2 gap-3 w-full">
            {learningTopics.map(({ id, name, icon: Icon, description }) => (
              <button
                key={id}
                onClick={() => onSelectTopic?.(id)}
                className="flex flex-col items-start gap-2 p-4 bg-white border-2 border-[#E8E7E3] rounded-xl hover:border-[#DA7756] hover:bg-[#FDF8F6] transition-all duration-150 text-left group"
              >
                <div className="flex items-center gap-2 text-[#5D5D5D] group-hover:text-[#DA7756]">
                  <Icon />
                  <span className="text-[15px] font-medium">{name}</span>
                </div>
                <p className="text-[12px] text-[#8E8E8E] group-hover:text-[#5D5D5D]">
                  {description}
                </p>
              </button>
            ))}
          </div>

          <button
            onClick={() => onSelectTopic?.('explore')}
            className="text-[14px] text-[#DA7756] hover:underline mt-2"
          >
            Or tell me what you want to learn...
          </button>
        </div>
      )}
    </div>
  );
}
