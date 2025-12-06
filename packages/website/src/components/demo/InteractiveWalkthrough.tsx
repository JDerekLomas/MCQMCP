'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, RotateCcw } from 'lucide-react';

// Step data for the walkthrough
const steps = [
  {
    id: 1,
    title: 'User asks for a quiz',
    description: 'The learner asks Claude for help with JavaScript closures. This could be in any Claude interface—yours or someone else\'s.',
    chat: {
      messages: [
        { role: 'user', content: 'Quiz me on JavaScript closures' }
      ],
      typing: false
    },
    inspector: {
      events: [],
      stats: { responses: 0, accuracy: '-', avgTime: '-' }
    }
  },
  {
    id: 2,
    title: 'Claude calls the MCP tool',
    description: 'Instead of making up a question, Claude calls assessment_get_item to fetch a validated question from the item bank.',
    chat: {
      messages: [
        { role: 'user', content: 'Quiz me on JavaScript closures' }
      ],
      typing: true
    },
    inspector: {
      events: [
        {
          type: 'tool_call',
          name: 'assessment_get_item',
          data: { topic: 'js-closures', difficulty: 'medium' }
        }
      ],
      stats: { responses: 0, accuracy: '-', avgTime: '-' }
    }
  },
  {
    id: 3,
    title: 'Item returned with metadata',
    description: 'MCQMCP returns a curated question with psychometric metadata—difficulty, discrimination index, and response count from previous learners.',
    chat: {
      messages: [
        { role: 'user', content: 'Quiz me on JavaScript closures' }
      ],
      typing: true
    },
    inspector: {
      events: [
        {
          type: 'tool_call',
          name: 'assessment_get_item',
          data: { topic: 'js-closures', difficulty: 'medium' }
        },
        {
          type: 'tool_result',
          name: 'assessment_get_item',
          success: true,
          data: {
            id: 'js-closures-042',
            difficulty: 0.63,
            discrimination: 0.71,
            n_responses: 847
          }
        }
      ],
      stats: { responses: 0, accuracy: '-', avgTime: '-' }
    }
  },
  {
    id: 4,
    title: 'Question rendered to learner',
    description: 'The question appears as an interactive MCQ card. The timer starts—we\'re measuring response latency.',
    chat: {
      messages: [
        { role: 'user', content: 'Quiz me on JavaScript closures' },
        { role: 'assistant', content: 'Here\'s a question to test your understanding:' }
      ],
      typing: false,
      mcq: {
        stem: 'What will be logged to the console?',
        code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}`,
        options: [
          { id: 'A', text: '0, 1, 2' },
          { id: 'B', text: '3, 3, 3' },
          { id: 'C', text: 'undefined, undefined, undefined' },
          { id: 'D', text: 'ReferenceError' }
        ],
        selected: null,
        correct: 'B'
      }
    },
    inspector: {
      events: [
        {
          type: 'tool_call',
          name: 'assessment_get_item',
          data: { topic: 'js-closures', difficulty: 'medium' }
        },
        {
          type: 'tool_result',
          name: 'assessment_get_item',
          success: true,
          data: {
            id: 'js-closures-042',
            difficulty: 0.63,
            discrimination: 0.71,
            n_responses: 847
          }
        }
      ],
      stats: { responses: 0, accuracy: '-', avgTime: '-' },
      timer: '0.0s'
    }
  },
  {
    id: 5,
    title: 'Learner selects an answer',
    description: 'The learner clicks option B. Correct! The response is logged with latency (8.4 seconds) and correctness.',
    chat: {
      messages: [
        { role: 'user', content: 'Quiz me on JavaScript closures' },
        { role: 'assistant', content: 'Here\'s a question to test your understanding:' }
      ],
      typing: false,
      mcq: {
        stem: 'What will be logged to the console?',
        code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}`,
        options: [
          { id: 'A', text: '0, 1, 2' },
          { id: 'B', text: '3, 3, 3' },
          { id: 'C', text: 'undefined, undefined, undefined' },
          { id: 'D', text: 'ReferenceError' }
        ],
        selected: 'B',
        correct: 'B',
        feedback: 'Correct! The var keyword has function scope, so all callbacks share the same i, which is 3 after the loop completes.'
      }
    },
    inspector: {
      events: [
        {
          type: 'tool_call',
          name: 'assessment_get_item',
          data: { topic: 'js-closures', difficulty: 'medium' }
        },
        {
          type: 'tool_result',
          name: 'assessment_get_item',
          success: true,
          data: {
            id: 'js-closures-042',
            difficulty: 0.63,
            discrimination: 0.71,
            n_responses: 847
          }
        },
        {
          type: 'response_logged',
          data: {
            item_id: 'js-closures-042',
            selected: 'B',
            correct: true,
            latency_ms: 8432
          }
        }
      ],
      stats: { responses: 1, accuracy: '100%', avgTime: '8.4s' }
    }
  },
  {
    id: 6,
    title: 'Data flows back for analytics',
    description: 'The response joins 847 others. Item statistics update. Mastery tracking improves. This is the measurement layer that makes AI tutoring accountable.',
    chat: {
      messages: [
        { role: 'user', content: 'Quiz me on JavaScript closures' },
        { role: 'assistant', content: 'Here\'s a question to test your understanding:' },
        { role: 'assistant', content: 'Great job! You\'re showing solid understanding of closures and variable scoping. Ready for the next question?' }
      ],
      typing: false,
      mcq: {
        stem: 'What will be logged to the console?',
        code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}`,
        options: [
          { id: 'A', text: '0, 1, 2' },
          { id: 'B', text: '3, 3, 3' },
          { id: 'C', text: 'undefined, undefined, undefined' },
          { id: 'D', text: 'ReferenceError' }
        ],
        selected: 'B',
        correct: 'B',
        answered: true
      }
    },
    inspector: {
      events: [
        {
          type: 'tool_call',
          name: 'assessment_get_item',
          data: { topic: 'js-closures', difficulty: 'medium' }
        },
        {
          type: 'tool_result',
          name: 'assessment_get_item',
          success: true,
          data: {
            id: 'js-closures-042',
            difficulty: 0.63,
            discrimination: 0.71,
            n_responses: 848 // Incremented!
          }
        },
        {
          type: 'response_logged',
          data: {
            item_id: 'js-closures-042',
            selected: 'B',
            correct: true,
            latency_ms: 8432
          }
        }
      ],
      stats: { responses: 1, accuracy: '100%', avgTime: '8.4s' },
      highlight: 'analytics'
    }
  }
];

function MockChat({ data }: { data: typeof steps[0]['chat'] }) {
  return (
    <div className="bg-white rounded-xl border border-edge-light overflow-hidden h-full flex flex-col">
      <div className="px-4 py-3 border-b border-edge-light bg-surface-secondary">
        <span className="font-medium text-sm text-ink-primary">Chat</span>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {data.messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? '' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-surface-tertiary' : 'bg-claude'
            }`}>
              {msg.role === 'user' ? (
                <span className="text-xs font-medium text-ink-secondary">U</span>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L12 22M2 12L22 12M4.93 4.93L19.07 19.07M19.07 4.93L4.93 19.07" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs text-ink-tertiary mb-1">{msg.role === 'user' ? 'You' : 'Claude'}</div>
              <div className="text-sm text-ink-primary">{msg.content}</div>
            </div>
          </div>
        ))}

        {data.typing && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-claude flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L12 22M2 12L22 12M4.93 4.93L19.07 19.07M19.07 4.93L4.93 19.07" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-xs text-ink-tertiary mb-1">Claude</div>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-ink-tertiary animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-ink-tertiary animate-pulse" style={{ animationDelay: '0.2s' }} />
                <span className="w-2 h-2 rounded-full bg-ink-tertiary animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}

        {data.mcq && (
          <div className="border border-edge-light rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-surface-secondary border-b border-edge-light">
              <span className="text-xs font-medium text-ink-secondary">Assessment Question</span>
            </div>
            <div className="p-4">
              <p className="text-sm text-ink-primary mb-3">{data.mcq.stem}</p>
              {data.mcq.code && (
                <pre className="text-xs bg-ink-primary text-white p-3 rounded mb-4 overflow-x-auto">
                  <code>{data.mcq.code}</code>
                </pre>
              )}
              <div className="space-y-2">
                {data.mcq.options.map((opt) => {
                  const isSelected = data.mcq?.selected === opt.id;
                  const isCorrect = data.mcq?.correct === opt.id;
                  const showResult = data.mcq?.selected !== null;

                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        showResult && isSelected && isCorrect
                          ? 'border-green-500 bg-green-50'
                          : showResult && isSelected && !isCorrect
                          ? 'border-red-500 bg-red-50'
                          : 'border-edge-light hover:border-edge-default'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        showResult && isSelected && isCorrect
                          ? 'bg-green-500 text-white'
                          : showResult && isSelected && !isCorrect
                          ? 'bg-red-500 text-white'
                          : 'bg-surface-tertiary text-ink-secondary'
                      }`}>
                        {showResult && isSelected ? (isCorrect ? '✓' : '✗') : opt.id}
                      </span>
                      <span className="text-sm text-ink-primary">{opt.text}</span>
                    </div>
                  );
                })}
              </div>
              {data.mcq.feedback && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">{data.mcq.feedback}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MockInspector({ data }: { data: typeof steps[0]['inspector'] }) {
  return (
    <div className={`bg-white rounded-xl border overflow-hidden h-full flex flex-col ${
      data.highlight === 'analytics' ? 'border-purple-300 ring-2 ring-purple-200' : 'border-edge-light'
    }`}>
      <div className="px-4 py-3 border-b border-edge-light bg-surface-secondary flex items-center gap-2">
        <span className="text-lg">🔍</span>
        <span className="font-medium text-sm text-ink-primary">Protocol Inspector</span>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-edge-light">
        <div className={`rounded-lg p-3 ${data.highlight === 'analytics' ? 'bg-purple-50' : 'bg-surface-secondary'}`}>
          <div className="text-xs text-ink-tertiary mb-2">Session Stats</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-ink-primary">{data.stats.responses}</div>
              <div className="text-xs text-ink-tertiary">Responses</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${data.stats.accuracy !== '-' ? 'text-green-600' : 'text-ink-primary'}`}>
                {data.stats.accuracy}
              </div>
              <div className="text-xs text-ink-tertiary">Accuracy</div>
            </div>
            <div>
              <div className="text-lg font-bold text-ink-primary">{data.stats.avgTime}</div>
              <div className="text-xs text-ink-tertiary">Avg Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Events */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="text-xs text-ink-tertiary mb-3">Event Log</div>
        {data.events.length === 0 ? (
          <div className="text-center py-8 text-ink-tertiary text-sm">
            <div className="text-2xl mb-2">📡</div>
            <p>Waiting for events...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.events.map((event, i) => (
              <div
                key={i}
                className={`border rounded-lg p-3 text-xs ${
                  event.type === 'tool_call'
                    ? 'border-blue-200 bg-blue-50'
                    : event.type === 'tool_result'
                    ? 'border-green-200 bg-green-50'
                    : 'border-purple-200 bg-purple-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-5 h-5 rounded flex items-center justify-center ${
                    event.type === 'tool_call'
                      ? 'bg-blue-200'
                      : event.type === 'tool_result'
                      ? 'bg-green-200'
                      : 'bg-purple-200'
                  }`}>
                    {event.type === 'tool_call' ? '→' : event.type === 'tool_result' ? '✓' : '📊'}
                  </span>
                  <span className="font-medium">
                    {event.type === 'tool_call' && 'MCP Tool Call'}
                    {event.type === 'tool_result' && 'Tool Result'}
                    {event.type === 'response_logged' && 'Response Logged'}
                  </span>
                  {event.name && (
                    <code className="bg-white/50 px-1.5 py-0.5 rounded">{event.name}</code>
                  )}
                </div>
                <pre className="bg-white/50 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}

        {data.timer && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <div className="text-xs text-yellow-700">Response Timer</div>
            <div className="text-2xl font-mono font-bold text-yellow-800">{data.timer}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Export step count for external use
export const TOTAL_STEPS = steps.length;

interface InteractiveWalkthroughProps {
  currentStep: number;
  onStepChange: (step: number) => void;
}

export function InteractiveWalkthrough({ currentStep, onStepChange }: InteractiveWalkthroughProps) {
  const step = steps[currentStep];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-ink-primary">
            Step {step.id} of {steps.length}: {step.title}
          </span>
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => onStepChange(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === currentStep ? 'bg-claude' : 'bg-edge-default hover:bg-ink-tertiary'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
          <div
            className="h-full bg-claude transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="grid md:grid-cols-2 gap-6 mb-6" style={{ height: '500px' }}>
        <MockChat data={step.chat} />
        <MockInspector data={step.inspector} />
      </div>

      {/* Description */}
      <div className="bg-surface-secondary rounded-xl p-4">
        <p className="text-ink-primary">{step.description}</p>
      </div>
    </div>
  );
}
