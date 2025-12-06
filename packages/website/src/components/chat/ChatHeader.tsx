'use client';

import { useState, useRef, useEffect } from 'react';
import { Toggle } from '@/components/ui/Toggle';
import { cn } from '@/lib/utils';

type ModelId = 'claude-4-opus' | 'claude-4-sonnet' | 'claude-3.5-sonnet';

interface Model {
  id: ModelId;
  name: string;
  description: string;
}

const models: Model[] = [
  {
    id: 'claude-4-opus',
    name: 'Claude 4 Opus',
    description: 'Most capable model for complex tasks',
  },
  {
    id: 'claude-4-sonnet',
    name: 'Claude 4 Sonnet',
    description: 'Best balance of speed and capability',
  },
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Fast and efficient for everyday tasks',
  },
];

interface ChatHeaderProps {
  selectedModel?: ModelId;
  onModelChange?: (model: ModelId) => void;
  learningModeEnabled?: boolean;
  onLearningModeChange?: (enabled: boolean) => void;
  showLearningModeToggle?: boolean;
  className?: string;
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 4.5L6 7.5L9 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.5 3.5L5.5 10L2.5 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 13V4M8 4C8 4 6.5 2 3.5 2C2.5 2 2 2.5 2 3.5V11.5C2 12.5 2.5 13 3.5 13C6.5 13 8 11 8 11M8 4C8 4 9.5 2 12.5 2C13.5 2 14 2.5 14 3.5V11.5C14 12.5 13.5 13 12.5 13C9.5 13 8 11 8 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChatHeader({
  selectedModel = 'claude-4-sonnet',
  onModelChange,
  learningModeEnabled = false,
  onLearningModeChange,
  showLearningModeToggle = true,
  className = '',
}: ChatHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel = models.find((m) => m.id === selectedModel) || models[1];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={cn(
        "flex items-center justify-between px-4 py-3 border-b border-edge-light bg-surface-primary",
        className
      )}
    >
      {/* Model selector */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-ink-primary hover:bg-surface-secondary transition-colors duration-150"
        >
          {currentModel.name}
          <ChevronDownIcon className={`text-ink-tertiary transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown menu */}
        {dropdownOpen && (
          <div
            className="absolute top-full left-0 mt-1 w-72 bg-surface-primary border border-edge-light rounded-claude shadow-lg overflow-hidden z-50 animate-fade-in"
          >
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onModelChange?.(model.id);
                  setDropdownOpen(false);
                }}
                className={cn(
                  "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-surface-secondary transition-colors duration-150",
                  model.id === selectedModel && "bg-surface-secondary"
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink-primary">
                      {model.name}
                    </span>
                    {model.id === selectedModel && (
                      <CheckIcon className="text-claude" />
                    )}
                  </div>
                  <p className="text-xs text-ink-tertiary mt-0.5">
                    {model.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Learning Mode toggle - only shown when there's a conversation */}
      {showLearningModeToggle && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-ink-secondary">
            <BookOpenIcon className={learningModeEnabled ? 'text-claude' : ''} />
            <span className="text-sm font-medium">Learning Mode</span>
          </div>
          <Toggle
            checked={learningModeEnabled}
            onChange={onLearningModeChange}
            size="sm"
          />
        </div>
      )}
    </header>
  );
}
