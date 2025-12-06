'use client';

import { useState, useEffect, useRef } from 'react';
import type { Item } from '@/lib/mcp/schemas/item';

export interface MCQResponse {
  item_id: string;
  selected: string;
  correct: string;
  is_correct: boolean;
  latency_ms: number;
  timestamp: string;
}

interface MCQCardProps {
  item: Item;
  onResponse?: (response: MCQResponse) => void;
}

// Helper to get current time - extracted to avoid lint issues with impure functions
function getCurrentTime(): number {
  return performance.now();
}

function getCurrentISOString(): string {
  return new Date().toISOString();
}

/**
 * Internal component that handles the actual MCQ rendering.
 * State is reset by changing the key prop on MCQCard.
 */
function MCQCardInner({ item, onResponse }: MCQCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const renderTimeRef = useRef<number>(0);

  // Set initial render time once on mount
  useEffect(() => {
    renderTimeRef.current = getCurrentTime();
  }, []);

  const handleOptionSelect = (optionId: string) => {
    if (showFeedback) return; // Already answered

    const latencyMs = Math.round(getCurrentTime() - renderTimeRef.current);
    const isCorrect = optionId === item.correct;

    setSelectedOption(optionId);
    setShowFeedback(true);

    const response: MCQResponse = {
      item_id: item.id,
      selected: optionId,
      correct: item.correct,
      is_correct: isCorrect,
      latency_ms: latencyMs,
      timestamp: getCurrentISOString(),
    };

    onResponse?.(response);
  };

  const isCorrect = selectedOption === item.correct;

  return (
    <div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Question stem */}
      <p className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
        {item.stem}
      </p>

      {/* Code snippet */}
      {item.code && (
        <pre className="mb-6 overflow-x-auto rounded-md bg-zinc-100 p-4 font-mono text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
          <code>{item.code}</code>
        </pre>
      )}

      {/* Options */}
      <div className="space-y-3">
        {item.options.map((option) => {
          const isSelected = selectedOption === option.id;
          const isCorrectOption = option.id === item.correct;
          const showAsCorrect = showFeedback && isCorrectOption;
          const showAsIncorrect = showFeedback && isSelected && !isCorrectOption;

          return (
            <button
              key={option.id}
              onClick={() => handleOptionSelect(option.id)}
              disabled={showFeedback}
              className={`
                flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-all
                ${!showFeedback && 'hover:border-blue-400 hover:bg-blue-50 dark:hover:border-blue-600 dark:hover:bg-blue-950'}
                ${!showFeedback && 'cursor-pointer'}
                ${showFeedback && 'cursor-default'}
                ${showAsCorrect && 'border-green-500 bg-green-50 dark:border-green-600 dark:bg-green-950'}
                ${showAsIncorrect && 'border-red-500 bg-red-50 dark:border-red-600 dark:bg-red-950'}
                ${!showAsCorrect && !showAsIncorrect && 'border-zinc-200 dark:border-zinc-700'}
                ${isSelected && !showFeedback && 'border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-950'}
              `}
            >
              <span
                className={`
                  flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm font-medium
                  ${showAsCorrect && 'border-green-500 bg-green-500 text-white'}
                  ${showAsIncorrect && 'border-red-500 bg-red-500 text-white'}
                  ${!showAsCorrect && !showAsIncorrect && 'border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-400'}
                `}
              >
                {option.id}
              </span>
              <span className="text-zinc-800 dark:text-zinc-200">{option.text}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div
          className={`
            mt-6 rounded-lg p-4
            ${isCorrect ? 'bg-green-50 dark:bg-green-950' : 'bg-amber-50 dark:bg-amber-950'}
          `}
        >
          <p
            className={`
              mb-2 font-semibold
              ${isCorrect ? 'text-green-800 dark:text-green-200' : 'text-amber-800 dark:text-amber-200'}
            `}
          >
            {isCorrect ? item.feedback.correct : item.feedback.incorrect}
          </p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {item.feedback.explanation}
          </p>
        </div>
      )}

      {/* Difficulty badge */}
      <div className="mt-4 flex items-center justify-between">
        <span
          className={`
            rounded-full px-2 py-1 text-xs font-medium
            ${item.difficulty === 'easy' && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'}
            ${item.difficulty === 'medium' && 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'}
            ${item.difficulty === 'hard' && 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}
          `}
        >
          {item.difficulty}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-500">
          {item.topic}
        </span>
      </div>
    </div>
  );
}

/**
 * MCQ Card wrapper that uses key-based state reset.
 * When the item.id changes, the inner component remounts with fresh state.
 */
export function MCQCard({ item, onResponse }: MCQCardProps) {
  return <MCQCardInner key={item.id} item={item} onResponse={onResponse} />;
}
