'use client';

import { useState } from 'react';
import { ChevronRight, Database, Zap, BarChart3, Code, ArrowRight } from 'lucide-react';

interface DemoLandingProps {
  onStartDemo: () => void;
  inspectorOpen: boolean;
  onToggleInspector: () => void;
}

export function DemoLanding({ onStartDemo, inspectorOpen, onToggleInspector }: DemoLandingProps) {
  const [showArchitecture, setShowArchitecture] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-surface-primary to-surface-secondary">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-claude/10 text-claude text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-claude animate-pulse" />
            Live Demo
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-ink-primary mb-4">
            MCQMCP
          </h1>

          <p className="text-xl text-ink-secondary max-w-2xl mx-auto mb-2">
            Measurement infrastructure for AI-assisted learning
          </p>

          <p className="text-base text-ink-tertiary max-w-xl mx-auto">
            An MCP server that brings validated assessments to AI chat interfaces,
            with full data capture for learning analytics.
          </p>
        </div>

        {/* Key Value Props */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-xl border border-edge-light p-6">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
              <Database size={20} className="text-blue-600" />
            </div>
            <h3 className="font-semibold text-ink-primary mb-2">Item Discovery</h3>
            <p className="text-sm text-ink-secondary">
              Claude calls MCP tools to find relevant items from curated banks with metadata—not generating potentially inaccurate questions.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-edge-light p-6">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-4">
              <Zap size={20} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-ink-primary mb-2">Response Logging</h3>
            <p className="text-sm text-ink-secondary">
              Every answer captured with latency, correctness, and session context. Data flows back for psychometrics and learning analytics.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-edge-light p-6">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
              <BarChart3 size={20} className="text-purple-600" />
            </div>
            <h3 className="font-semibold text-ink-primary mb-2">Learning Measurement</h3>
            <p className="text-sm text-ink-secondary">
              Track mastery over time, compute item statistics, enable adaptive selection. Measure what humans actually learn.
            </p>
          </div>
        </div>

        {/* Architecture Toggle */}
        <div className="mb-12">
          <button
            onClick={() => setShowArchitecture(!showArchitecture)}
            className="flex items-center gap-2 text-sm font-medium text-ink-secondary hover:text-ink-primary transition-colors mx-auto"
          >
            <ChevronRight size={16} className={`transition-transform ${showArchitecture ? 'rotate-90' : ''}`} />
            {showArchitecture ? 'Hide' : 'Show'} Architecture
          </button>

          {showArchitecture && (
            <div className="mt-6 bg-ink-primary rounded-xl p-6 text-white font-mono text-sm overflow-x-auto">
              <pre>{`
┌─────────────────────────────────────────────────────────────────┐
│                         Your Clone / App                         │
│                    (Claude Chat Interface)                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ MCP Protocol
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                          MCQMCP Server                           │
│                                                                  │
│  Tools:                        Storage:                         │
│  • assessment_get_item         • Item banks (curated + custom)  │
│  • assessment_list_topics      • Response logs                  │
│  • assessment_log_response     • User progress                  │
│                                                                  │
│  Analytics:                                                      │
│  • Difficulty (p-value)        • Discrimination index           │
│  • Response latency            • Mastery tracking               │
└─────────────────────────────────────────────────────────────────┘
              `}</pre>
            </div>
          )}
        </div>

        {/* Demo Instructions */}
        <div className="bg-white rounded-xl border border-edge-light p-8 mb-12">
          <h2 className="text-lg font-semibold text-ink-primary mb-6 flex items-center gap-2">
            <Code size={20} />
            Try the Demo
          </h2>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-claude text-white flex items-center justify-center font-semibold text-sm shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-ink-primary">Open the Protocol Inspector</p>
                <p className="text-sm text-ink-secondary mt-1">
                  Click the toggle button in the bottom-right corner to see MCP events in real-time.
                  {!inspectorOpen && (
                    <button
                      onClick={onToggleInspector}
                      className="ml-2 text-claude hover:underline"
                    >
                      Open it now →
                    </button>
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-claude text-white flex items-center justify-center font-semibold text-sm shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-ink-primary">Start a learning session</p>
                <p className="text-sm text-ink-secondary mt-1">
                  Ask Claude to quiz you on JavaScript, React, or any frontend topic.
                  Watch the inspector as <code className="bg-surface-tertiary px-1 rounded">assessment_get_item</code> is called.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-claude text-white flex items-center justify-center font-semibold text-sm shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-ink-primary">Answer questions and observe logging</p>
                <p className="text-sm text-ink-secondary mt-1">
                  Click an answer option. The inspector shows your response being logged with latency and correctness.
                  Session stats update in real-time.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-surface-tertiary text-ink-secondary flex items-center justify-center font-semibold text-sm shrink-0">
                4
              </div>
              <div>
                <p className="font-medium text-ink-primary">Explore the data flow</p>
                <p className="text-sm text-ink-secondary mt-1">
                  Expand JSON payloads to see item metadata (topic, difficulty) and response data.
                  This is what enables psychometric analysis.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={onStartDemo}
            className="inline-flex items-center gap-2 px-8 py-4 bg-claude text-white font-medium rounded-full hover:bg-claude/90 transition-colors shadow-lg shadow-claude/25"
          >
            Start Demo
            <ArrowRight size={18} />
          </button>

          <p className="text-sm text-ink-tertiary mt-4">
            Or just start typing in the chat below
          </p>
        </div>

        {/* Links */}
        <div className="flex justify-center gap-6 mt-12 pt-8 border-t border-edge-light">
          <a
            href="https://github.com/JDerekLomas/claude-mcq-assessment"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ink-secondary hover:text-ink-primary transition-colors"
          >
            GitHub →
          </a>
          <a
            href="https://github.com/JDerekLomas/claude-mcq-assessment/blob/main/VISION.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ink-secondary hover:text-ink-primary transition-colors"
          >
            Vision →
          </a>
          <a
            href="https://github.com/JDerekLomas/claude-mcq-assessment/blob/main/ROADMAP.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ink-secondary hover:text-ink-primary transition-colors"
          >
            Roadmap →
          </a>
        </div>

        {/* For Developers / Learning Engineers */}
        <div className="mt-16 grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200 p-6">
            <h3 className="font-semibold text-blue-900 mb-2">For Clone Developers</h3>
            <p className="text-sm text-blue-700 mb-4">
              Integrate MCQMCP into your Claude interface to add validated assessments with built-in progress tracking.
            </p>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Connect via MCP tools</li>
              <li>• Parse <code className="bg-blue-100 px-1 rounded">:::mcq</code> blocks</li>
              <li>• Render interactive cards</li>
              <li>• Log responses for analytics</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200 p-6">
            <h3 className="font-semibold text-purple-900 mb-2">For Learning Engineers</h3>
            <p className="text-sm text-purple-700 mb-4">
              Access response data to measure learning outcomes and validate item quality across AI tutoring systems.
            </p>
            <ul className="text-sm text-purple-600 space-y-1">
              <li>• Response-level analytics</li>
              <li>• Item psychometrics (p-value, discrimination)</li>
              <li>• Learner mastery tracking</li>
              <li>• Cross-provider benchmarking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
