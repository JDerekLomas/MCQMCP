'use client';

import { useState, useEffect } from 'react';
import { MCQCard, type MCQResponse } from '@/components/MCQCard';
import type { Item, Difficulty } from '@/lib/mcp/schemas/item';

type Source = 'arc' | 'mmlu' | 'gsm8k';

interface ApiItem {
  id: string;
  source: string;
  topic: string;
  difficulty: string;
  stem: string;
  code: string | null;
  options: {
    A: string;
    B: string;
    C: string | null;
    D: string | null;
    E: string | null;
  };
  correct: string;
  explanation: string | null;
  tags: string[] | null;
}

function transformToItem(apiItem: ApiItem): Item {
  const options = [
    { id: 'A', text: apiItem.options.A },
    { id: 'B', text: apiItem.options.B },
    { id: 'C', text: apiItem.options.C || 'N/A' },
    { id: 'D', text: apiItem.options.D || 'N/A' },
  ];

  return {
    id: apiItem.id,
    topic: apiItem.topic || apiItem.source,
    difficulty: (apiItem.difficulty as Difficulty) || 'medium',
    stem: apiItem.stem,
    code: apiItem.code || undefined,
    options,
    correct: apiItem.correct,
    feedback: {
      correct: 'Correct!',
      incorrect: `The correct answer is ${apiItem.correct}.`,
      explanation: apiItem.explanation || `The answer is ${apiItem.correct}.`,
    },
    tags: apiItem.tags || undefined,
  };
}

export default function PlayPage() {
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<Source>('arc');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const fetchItem = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ source });
      if (difficulty) params.append('difficulty', difficulty);

      const res = await fetch(`/api/items?${params}`);
      const data = await res.json();

      if (data.items && data.items.length > 0) {
        setItem(transformToItem(data.items[0]));
      } else {
        setError('No items found');
      }
    } catch (err) {
      setError('Failed to fetch item');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItem();
  }, []);

  const handleResponse = (response: MCQResponse) => {
    setStats((prev) => ({
      correct: prev.correct + (response.is_correct ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNext = () => {
    fetchItem();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              MCQMCP Item Player
            </h1>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Score: {stats.correct}/{stats.total}
              {stats.total > 0 && (
                <span className="ml-2">
                  ({Math.round((stats.correct / stats.total) * 100)}%)
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as Source)}
              className="px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="arc">ARC (Science)</option>
              <option value="mmlu">MMLU (Math)</option>
              <option value="gsm8k">GSM8K (Word Problems)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty | '')}
              className="px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Any</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="flex-1" />

          <button
            onClick={handleNext}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? 'Loading...' : 'Next Question'}
          </button>
        </div>
      </div>

      {/* Item display */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {loading && !item && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {item && <MCQCard item={item} onResponse={handleResponse} />}
      </main>

      {/* Footer stats */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-3">
        <div className="max-w-4xl mx-auto px-4 text-center text-xs text-gray-500 dark:text-gray-400">
          5,683 items available: ARC (3,160) | MMLU (1,204) | GSM8K (1,319)
        </div>
      </footer>
    </div>
  );
}
