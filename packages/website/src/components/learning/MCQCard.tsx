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

function getCurrentTime(): number {
  return performance.now();
}

function getCurrentISOString(): string {
  return new Date().toISOString();
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
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
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
        d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MCQCardInner({ item, onResponse }: MCQCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const renderTimeRef = useRef<number>(0);

  useEffect(() => {
    renderTimeRef.current = getCurrentTime();
  }, []);

  const handleOptionSelect = (optionId: string) => {
    if (showFeedback) return;

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

  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-learn-correct/10 text-learn-correct border-learn-correct/20';
      case 'medium':
        return 'bg-claude/10 text-claude border-claude/20';
      case 'hard':
        return 'bg-learn-incorrect/10 text-learn-incorrect border-learn-incorrect/20';
      default:
        return 'bg-surface-tertiary text-ink-secondary border-edge-light';
    }
  };

  return (
    <div
      className="
        w-full
        bg-surface-primary
        border border-edge-light
        rounded-claude
        overflow-hidden
        animate-fade-in
      "
    >
      {/* Header with difficulty badge */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-edge-light bg-surface-secondary">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink-primary">Assessment Question</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-tertiary">{item.topic}</span>
          <span
            className={`
              px-2 py-0.5
              text-xs font-medium
              rounded-full
              border
              ${getDifficultyStyles(item.difficulty)}
            `}
          >
            {item.difficulty}
          </span>
        </div>
      </div>

      {/* Question content */}
      <div className="px-5 py-4">
        {/* Stem */}
        <p className="text-[15px] font-medium text-ink-primary leading-relaxed mb-4">
          {item.stem}
        </p>

        {/* Code snippet */}
        {item.code && (
          <pre
            className="
              mb-5 p-4
              bg-surface-secondary
              border border-edge-light
              rounded-lg
              font-mono text-sm
              text-ink-primary
              overflow-x-auto
            "
          >
            <code>{item.code}</code>
          </pre>
        )}

        {/* Options */}
        <div className="space-y-2">
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
                  group
                  w-full flex items-center gap-3
                  px-4 py-3
                  text-left
                  border rounded-lg
                  transition-all duration-200
                  ${!showFeedback ? 'cursor-pointer hover:border-claude hover:bg-claude/5' : 'cursor-default'}
                  ${showAsCorrect ? 'border-learn-correct bg-learn-correct/10' : ''}
                  ${showAsIncorrect ? 'border-learn-incorrect bg-learn-incorrect/10' : ''}
                  ${!showAsCorrect && !showAsIncorrect && isSelected && !showFeedback ? 'border-claude bg-claude/5' : ''}
                  ${!showAsCorrect && !showAsIncorrect && !isSelected ? 'border-edge-light' : ''}
                `}
              >
                {/* Option indicator */}
                <span
                  className={`
                    shrink-0
                    flex items-center justify-center
                    w-6 h-6
                    rounded-full
                    text-xs font-semibold
                    transition-all duration-200
                    ${showAsCorrect ? 'bg-learn-correct text-white' : ''}
                    ${showAsIncorrect ? 'bg-learn-incorrect text-white' : ''}
                    ${!showAsCorrect && !showAsIncorrect && isSelected ? 'bg-claude text-white' : ''}
                    ${!showAsCorrect && !showAsIncorrect && !isSelected ? 'bg-surface-tertiary text-ink-secondary group-hover:bg-claude/20 group-hover:text-claude' : ''}
                  `}
                >
                  {showAsCorrect ? (
                    <CheckIcon />
                  ) : showAsIncorrect ? (
                    <XIcon />
                  ) : (
                    option.id
                  )}
                </span>

                {/* Option text */}
                <span
                  className={`
                    flex-1 text-sm
                    ${showAsCorrect ? 'text-learn-correct font-medium' : ''}
                    ${showAsIncorrect ? 'text-learn-incorrect' : ''}
                    ${!showAsCorrect && !showAsIncorrect ? 'text-ink-primary' : ''}
                  `}
                >
                  {option.text}
                </span>

                {/* Show correct marker on correct answer when wrong selection made */}
                {showFeedback && isCorrectOption && !isSelected && (
                  <span className="text-xs text-learn-correct font-medium">Correct answer</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback section */}
      {showFeedback && (
        <div
          className={`
            px-5 py-4
            border-t
            ${isCorrect ? 'bg-learn-correct/5 border-learn-correct/20' : 'bg-claude/5 border-claude/20'}
          `}
        >
          <div className="flex items-start gap-3">
            <div
              className={`
                shrink-0
                flex items-center justify-center
                w-6 h-6
                rounded-full
                ${isCorrect ? 'bg-learn-correct' : 'bg-claude'}
              `}
            >
              {isCorrect ? (
                <CheckIcon className="text-white" />
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="text-white"
                >
                  <path
                    d="M7 4V7M7 10H7.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
            <div>
              <p
                className={`
                  text-sm font-semibold mb-1
                  ${isCorrect ? 'text-learn-correct' : 'text-claude'}
                `}
              >
                {isCorrect ? item.feedback.correct : item.feedback.incorrect}
              </p>
              <p className="text-sm text-ink-secondary leading-relaxed">
                {item.feedback.explanation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MCQCard({ item, onResponse }: MCQCardProps) {
  return <MCQCardInner key={item.id} item={item} onResponse={onResponse} />;
}
