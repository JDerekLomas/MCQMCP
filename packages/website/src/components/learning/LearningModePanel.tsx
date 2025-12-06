'use client';

import { useState } from 'react';

type Difficulty = 'casual' | 'moderate' | 'rigorous';

interface LearningStats {
  questionsAnswered: number;
  correctAnswers: number;
  streak: number;
}

interface LearningModePanelProps {
  difficulty?: Difficulty;
  onDifficultyChange?: (difficulty: Difficulty) => void;
  stats?: LearningStats;
  className?: string;
}

function TrophyIcon({ className }: { className?: string }) {
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
        d="M4 2H12V5C12 7.20914 10.2091 9 8 9C5.79086 9 4 7.20914 4 5V2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 3H2.5C2.22386 3 2 3.22386 2 3.5V4.5C2 5.60457 2.89543 6.5 4 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 3H13.5C13.7761 3 14 3.22386 14 3.5V4.5C14 5.60457 13.1046 6.5 12 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 9V11M6 14H10M6 14V11H10V14M6 14H10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}

function FireIcon({ className }: { className?: string }) {
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
        d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 10 2 8 2C8 4 6 6 4 6C2 6 2 8 2 8C2 11.3137 4.68629 14 8 14Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 14C9.65685 14 11 12.6569 11 11C11 9.34315 9 8 8 8C8 9 7 10 6 10C5 10 5 11 5 11C5 12.6569 6.34315 14 8 14Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const difficultyLabels: Record<Difficulty, { label: string; description: string }> = {
  casual: {
    label: 'Casual',
    description: 'Easy questions to build confidence',
  },
  moderate: {
    label: 'Moderate',
    description: 'Balanced mix of difficulties',
  },
  rigorous: {
    label: 'Rigorous',
    description: 'Challenging questions for mastery',
  },
};

export function LearningModePanel({
  difficulty = 'moderate',
  onDifficultyChange,
  stats = { questionsAnswered: 0, correctAnswers: 0, streak: 0 },
  className = '',
}: LearningModePanelProps) {
  const [hoveredDifficulty, setHoveredDifficulty] = useState<Difficulty | null>(null);

  const accuracy =
    stats.questionsAnswered > 0
      ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100)
      : 0;

  const difficulties: Difficulty[] = ['casual', 'moderate', 'rigorous'];
  const difficultyIndex = difficulties.indexOf(difficulty);

  return (
    <div
      className={`
        bg-surface-secondary
        border border-edge-light
        rounded-claude
        overflow-hidden
        ${className}
      `}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-edge-light">
        <h3 className="text-sm font-semibold text-ink-primary">Learning Mode</h3>
      </div>

      {/* Stats */}
      <div className="px-4 py-4 border-b border-edge-light">
        <div className="grid grid-cols-3 gap-4">
          {/* Questions answered */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-ink-tertiary mb-1">
              <TrophyIcon />
            </div>
            <span className="text-xl font-semibold text-ink-primary">{stats.questionsAnswered}</span>
            <span className="text-xs text-ink-tertiary">Answered</span>
          </div>

          {/* Accuracy */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-ink-tertiary mb-1">
              <TargetIcon />
            </div>
            <span className="text-xl font-semibold text-ink-primary">{accuracy}%</span>
            <span className="text-xs text-ink-tertiary">Accuracy</span>
          </div>

          {/* Streak */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-ink-tertiary mb-1">
              <FireIcon className={stats.streak > 0 ? 'text-claude' : ''} />
            </div>
            <span className={`text-xl font-semibold ${stats.streak > 0 ? 'text-claude' : 'text-ink-primary'}`}>
              {stats.streak}
            </span>
            <span className="text-xs text-ink-tertiary">Streak</span>
          </div>
        </div>
      </div>

      {/* Difficulty slider */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-ink-primary">Difficulty</span>
          <span className="text-xs text-ink-tertiary">
            {difficultyLabels[hoveredDifficulty || difficulty].label}
          </span>
        </div>

        {/* Slider track */}
        <div className="relative">
          {/* Track background */}
          <div className="h-2 bg-surface-tertiary rounded-full" />

          {/* Filled track */}
          <div
            className="absolute top-0 left-0 h-2 bg-claude rounded-full transition-all duration-200"
            style={{ width: `${((difficultyIndex + 1) / difficulties.length) * 100}%` }}
          />

          {/* Clickable stops */}
          <div className="absolute top-0 left-0 right-0 flex justify-between">
            {difficulties.map((d, index) => (
              <button
                key={d}
                onClick={() => onDifficultyChange?.(d)}
                onMouseEnter={() => setHoveredDifficulty(d)}
                onMouseLeave={() => setHoveredDifficulty(null)}
                className={`
                  relative
                  w-4 h-4
                  -mt-1
                  rounded-full
                  border-2
                  transition-all duration-200
                  ${index <= difficultyIndex ? 'bg-claude border-claude' : 'bg-surface-primary border-edge'}
                  ${d === difficulty ? 'ring-2 ring-claude/30 ring-offset-1' : ''}
                  hover:scale-110
                `}
                aria-label={difficultyLabels[d].label}
              />
            ))}
          </div>
        </div>

        {/* Labels */}
        <div className="flex justify-between mt-3">
          <span className="text-xs text-ink-tertiary">Casual</span>
          <span className="text-xs text-ink-tertiary">Rigorous</span>
        </div>

        {/* Description */}
        <p className="mt-3 text-xs text-ink-secondary text-center">
          {difficultyLabels[hoveredDifficulty || difficulty].description}
        </p>
      </div>
    </div>
  );
}
