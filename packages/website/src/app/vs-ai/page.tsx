'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Difficulty } from '@/lib/mcp/schemas/item';

type Source = 'arc' | 'mmlu' | 'gsm8k';

interface ApiItem {
  id: string;
  source: string;
  topic: string;
  difficulty: string;
  stem: string;
  code: string | null;
  options: { A: string; B: string; C: string | null; D: string | null };
  correct: string;
  explanation: string | null;
}

interface GameState {
  currentQuestion: number;
  totalQuestions: number;
  userScore: number;
  aiScore: number;
  streak: number;
  bestStreak: number;
  phase: 'intro' | 'question' | 'reveal' | 'results';
}

// AI benchmark accuracy by source/difficulty (based on real benchmark data)
const AI_ACCURACY: Record<Source, Record<string, number>> = {
  arc: { easy: 0.95, medium: 0.85, hard: 0.75 },
  mmlu: { easy: 0.88, medium: 0.78, hard: 0.65 },
  gsm8k: { easy: 0.92, medium: 0.82, hard: 0.70 },
};

// Simulate AI answer based on accuracy
function simulateAIAnswer(correct: string, difficulty: string, source: Source): { answer: string; confidence: number } {
  const accuracy = AI_ACCURACY[source]?.[difficulty] || 0.75;
  const isCorrect = Math.random() < accuracy;
  const options = ['A', 'B', 'C', 'D'];

  if (isCorrect) {
    return { answer: correct, confidence: 0.7 + Math.random() * 0.25 };
  } else {
    const wrongOptions = options.filter(o => o !== correct);
    return {
      answer: wrongOptions[Math.floor(Math.random() * wrongOptions.length)],
      confidence: 0.3 + Math.random() * 0.4
    };
  }
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const progress = (current / total) * 100;
  return (
    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function ScoreCard({ label, score, total, color, icon }: { label: string; score: number; total: number; color: string; icon: string }) {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  return (
    <div className={`flex flex-col items-center p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800`}>
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className={`text-3xl font-bold ${color}`}>{score}/{total}</span>
      <span className="text-sm text-zinc-400">{percentage}%</span>
    </div>
  );
}

function OptionButton({
  id,
  text,
  selected,
  correct,
  aiSelected,
  revealed,
  disabled,
  onClick
}: {
  id: string;
  text: string;
  selected: boolean;
  correct: boolean;
  aiSelected: boolean;
  revealed: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  let bgClass = 'bg-zinc-900 border-zinc-700 hover:border-violet-500 hover:bg-zinc-800';
  let textClass = 'text-zinc-100';

  if (revealed) {
    if (correct) {
      bgClass = 'bg-emerald-500/20 border-emerald-500';
      textClass = 'text-emerald-400';
    } else if (selected && !correct) {
      bgClass = 'bg-red-500/20 border-red-500';
      textClass = 'text-red-400';
    } else {
      bgClass = 'bg-zinc-900/50 border-zinc-800';
      textClass = 'text-zinc-500';
    }
  } else if (selected) {
    bgClass = 'bg-violet-500/20 border-violet-500';
    textClass = 'text-violet-300';
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-full p-4 rounded-xl border-2 text-left transition-all duration-200
        ${bgClass} ${disabled && !revealed ? 'opacity-50 cursor-not-allowed' : ''}
        ${!disabled && !revealed ? 'cursor-pointer active:scale-[0.98]' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        <span className={`
          flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm
          ${revealed && correct ? 'bg-emerald-500 text-white' : ''}
          ${revealed && selected && !correct ? 'bg-red-500 text-white' : ''}
          ${!revealed && selected ? 'bg-violet-500 text-white' : ''}
          ${!revealed && !selected ? 'bg-zinc-800 text-zinc-400' : ''}
          ${revealed && !correct && !selected ? 'bg-zinc-800 text-zinc-600' : ''}
        `}>
          {id}
        </span>
        <span className={`flex-1 ${textClass}`}>{text}</span>
      </div>

      {/* AI indicator */}
      {revealed && aiSelected && (
        <div className={`
          absolute -right-2 -top-2 px-2 py-1 rounded-full text-xs font-medium
          ${correct ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}
        `}>
          AI
        </div>
      )}
    </button>
  );
}

function IntroScreen({ onStart, source, setSource }: { onStart: () => void; source: Source; setSource: (s: Source) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="text-6xl mb-4">🤖</div>
      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-4">
        Are You Smarter Than AI?
      </h1>
      <p className="text-zinc-400 text-lg mb-8 max-w-md">
        Challenge yourself against GPT-4 level AI on real benchmark questions.
        Can you outsmart the machine?
      </p>

      <div className="flex flex-col gap-4 w-full max-w-xs mb-8">
        <label className="text-sm text-zinc-500 text-left">Choose your challenge:</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'arc' as Source, label: 'Science', icon: '🔬', desc: 'ARC Dataset' },
            { id: 'mmlu' as Source, label: 'Math', icon: '📐', desc: 'MMLU Dataset' },
            { id: 'gsm8k' as Source, label: 'Word Problems', icon: '📝', desc: 'GSM8K Dataset' },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSource(opt.id)}
              className={`
                p-3 rounded-xl border-2 transition-all
                ${source === opt.id
                  ? 'border-violet-500 bg-violet-500/20'
                  : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'}
              `}
            >
              <div className="text-2xl mb-1">{opt.icon}</div>
              <div className="text-sm font-medium text-zinc-200">{opt.label}</div>
              <div className="text-xs text-zinc-500">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onStart}
        className="
          px-8 py-4 rounded-2xl font-bold text-lg
          bg-gradient-to-r from-violet-600 to-fuchsia-600
          hover:from-violet-500 hover:to-fuchsia-500
          text-white shadow-lg shadow-violet-500/25
          transition-all duration-200 active:scale-95
        "
      >
        Start Challenge →
      </button>

      <p className="text-xs text-zinc-600 mt-6">
        10 questions • Head-to-head scoring • Beat the AI to win
      </p>
    </div>
  );
}

function ResultsScreen({ game, onPlayAgain }: { game: GameState; onPlayAgain: () => void }) {
  const userWon = game.userScore > game.aiScore;
  const tied = game.userScore === game.aiScore;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="text-6xl mb-4">
        {userWon ? '🏆' : tied ? '🤝' : '🤖'}
      </div>
      <h1 className={`text-4xl font-bold mb-2 ${
        userWon ? 'text-emerald-400' : tied ? 'text-amber-400' : 'text-zinc-400'
      }`}>
        {userWon ? 'You Beat the AI!' : tied ? "It's a Tie!" : 'AI Wins This Round'}
      </h1>
      <p className="text-zinc-400 mb-8">
        {userWon
          ? 'Impressive! You outperformed artificial intelligence.'
          : tied
          ? 'Great minds think alike - even silicon ones.'
          : "Don't worry, even the best humans struggle against AI sometimes."}
      </p>

      <div className="grid grid-cols-2 gap-4 mb-8 w-full max-w-sm">
        <ScoreCard label="You" score={game.userScore} total={game.totalQuestions} color="text-violet-400" icon="👤" />
        <ScoreCard label="AI" score={game.aiScore} total={game.totalQuestions} color="text-fuchsia-400" icon="🤖" />
      </div>

      {game.bestStreak > 1 && (
        <div className="mb-8 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/50">
          <span className="text-amber-400">🔥 Best Streak: {game.bestStreak} in a row!</span>
        </div>
      )}

      <button
        onClick={onPlayAgain}
        className="
          px-8 py-4 rounded-2xl font-bold text-lg
          bg-gradient-to-r from-violet-600 to-fuchsia-600
          hover:from-violet-500 hover:to-fuchsia-500
          text-white shadow-lg shadow-violet-500/25
          transition-all duration-200 active:scale-95
        "
      >
        Play Again →
      </button>
    </div>
  );
}

export default function VsAIPage() {
  const [source, setSource] = useState<Source>('arc');
  const [item, setItem] = useState<ApiItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [aiAnswer, setAiAnswer] = useState<{ answer: string; confidence: number } | null>(null);
  const [game, setGame] = useState<GameState>({
    currentQuestion: 0,
    totalQuestions: 10,
    userScore: 0,
    aiScore: 0,
    streak: 0,
    bestStreak: 0,
    phase: 'intro',
  });

  const fetchItem = useCallback(async () => {
    setLoading(true);
    setSelectedAnswer(null);
    setAiAnswer(null);

    try {
      const res = await fetch(`/api/items?source=${source}`);
      const data = await res.json();

      if (data.items?.[0]) {
        const newItem = data.items[0];
        setItem(newItem);

        // Pre-calculate AI's answer
        const ai = simulateAIAnswer(
          newItem.correct,
          newItem.difficulty || 'medium',
          source
        );
        setAiAnswer(ai);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [source]);

  const handleStart = () => {
    setGame({
      currentQuestion: 1,
      totalQuestions: 10,
      userScore: 0,
      aiScore: 0,
      streak: 0,
      bestStreak: 0,
      phase: 'question',
    });
    fetchItem();
  };

  const handleAnswer = (answer: string) => {
    if (game.phase !== 'question' || !item) return;

    setSelectedAnswer(answer);
    setGame(prev => ({ ...prev, phase: 'reveal' }));

    // Calculate scores after a brief delay for dramatic effect
    setTimeout(() => {
      const userCorrect = answer === item.correct;
      const aiCorrect = aiAnswer?.answer === item.correct;

      setGame(prev => {
        const newStreak = userCorrect ? prev.streak + 1 : 0;
        return {
          ...prev,
          userScore: prev.userScore + (userCorrect ? 1 : 0),
          aiScore: prev.aiScore + (aiCorrect ? 1 : 0),
          streak: newStreak,
          bestStreak: Math.max(prev.bestStreak, newStreak),
        };
      });
    }, 500);
  };

  const handleNext = () => {
    if (game.currentQuestion >= game.totalQuestions) {
      setGame(prev => ({ ...prev, phase: 'results' }));
    } else {
      setGame(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        phase: 'question'
      }));
      fetchItem();
    }
  };

  const handlePlayAgain = () => {
    setGame({
      currentQuestion: 0,
      totalQuestions: 10,
      userScore: 0,
      aiScore: 0,
      streak: 0,
      bestStreak: 0,
      phase: 'intro',
    });
    setItem(null);
  };

  if (game.phase === 'intro') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <IntroScreen onStart={handleStart} source={source} setSource={setSource} />
      </div>
    );
  }

  if (game.phase === 'results') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <ResultsScreen game={game} onPlayAgain={handlePlayAgain} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <span className="font-semibold text-zinc-300">vs AI</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-violet-400 font-bold">{game.userScore}</span>
                <span className="text-zinc-600">-</span>
                <span className="text-fuchsia-400 font-bold">{game.aiScore}</span>
              </div>
              {game.streak > 1 && (
                <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                  🔥 {game.streak}
                </span>
              )}
            </div>
          </div>
          <ProgressBar current={game.currentQuestion} total={game.totalQuestions} />
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>Question {game.currentQuestion} of {game.totalQuestions}</span>
            <span className="capitalize">{item?.difficulty || 'medium'}</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : item ? (
          <div className="space-y-6">
            {/* Question */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <p className="text-lg md:text-xl text-zinc-100 leading-relaxed">
                {item.stem}
              </p>
              {item.code && (
                <pre className="mt-4 p-4 bg-zinc-950 rounded-xl text-sm text-zinc-300 overflow-x-auto font-mono">
                  {item.code}
                </pre>
              )}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map((id) => {
                const text = item.options[id as keyof typeof item.options];
                if (!text) return null;

                return (
                  <OptionButton
                    key={id}
                    id={id}
                    text={text}
                    selected={selectedAnswer === id}
                    correct={item.correct === id}
                    aiSelected={aiAnswer?.answer === id}
                    revealed={game.phase === 'reveal'}
                    disabled={game.phase === 'reveal'}
                    onClick={() => handleAnswer(id)}
                  />
                );
              })}
            </div>

            {/* Reveal section */}
            {game.phase === 'reveal' && (
              <div className="space-y-4 animate-fade-in">
                {/* Result cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`
                    p-4 rounded-xl border-2 text-center
                    ${selectedAnswer === item.correct
                      ? 'bg-emerald-500/20 border-emerald-500'
                      : 'bg-red-500/20 border-red-500'}
                  `}>
                    <div className="text-2xl mb-1">👤</div>
                    <div className={`font-bold ${selectedAnswer === item.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                      {selectedAnswer === item.correct ? 'Correct!' : 'Wrong'}
                    </div>
                    <div className="text-sm text-zinc-400">You said {selectedAnswer}</div>
                  </div>

                  <div className={`
                    p-4 rounded-xl border-2 text-center
                    ${aiAnswer?.answer === item.correct
                      ? 'bg-emerald-500/20 border-emerald-500'
                      : 'bg-red-500/20 border-red-500'}
                  `}>
                    <div className="text-2xl mb-1">🤖</div>
                    <div className={`font-bold ${aiAnswer?.answer === item.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                      {aiAnswer?.answer === item.correct ? 'Correct!' : 'Wrong'}
                    </div>
                    <div className="text-sm text-zinc-400">
                      AI said {aiAnswer?.answer} ({Math.round((aiAnswer?.confidence || 0) * 100)}% confident)
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                {item.explanation && (
                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div className="text-sm text-zinc-400 mb-1">Explanation</div>
                    <p className="text-zinc-300">{item.explanation}</p>
                  </div>
                )}

                {/* Next button */}
                <button
                  onClick={handleNext}
                  className="
                    w-full py-4 rounded-xl font-bold text-lg
                    bg-gradient-to-r from-violet-600 to-fuchsia-600
                    hover:from-violet-500 hover:to-fuchsia-500
                    text-white transition-all duration-200 active:scale-[0.98]
                  "
                >
                  {game.currentQuestion >= game.totalQuestions ? 'See Results' : 'Next Question'} →
                </button>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
