'use client';

import { useState } from 'react';
import { Navigation } from '@/components/marketing/Navigation';
import { InteractiveWalkthrough, TOTAL_STEPS } from '@/components/demo/InteractiveWalkthrough';
import { SequenceDiagram } from '@/components/diagrams/FlowDiagrams';
import { ChevronLeft, ChevronRight, RotateCcw, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(0);

  const goNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const reset = () => {
    setCurrentStep(0);
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-white pt-20">
        {/* Header with navigation */}
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-ink-primary">
                How MCQMCP Works
              </h1>
              <p className="text-ink-secondary">
                Step through a complete assessment interaction
              </p>
            </div>

            {/* Navigation controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={reset}
                className="text-sm text-ink-tertiary hover:text-ink-primary flex items-center gap-1 px-3 py-2"
              >
                <RotateCcw size={14} />
                Restart
              </button>

              <button
                onClick={goPrev}
                disabled={currentStep === 0}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                  currentStep === 0
                    ? 'text-ink-tertiary cursor-not-allowed'
                    : 'text-ink-primary hover:bg-surface-secondary border border-edge-default'
                }`}
              >
                <ChevronLeft size={18} />
                Previous
              </button>

              <button
                onClick={goNext}
                disabled={currentStep === TOTAL_STEPS - 1}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                  currentStep === TOTAL_STEPS - 1
                    ? 'bg-surface-tertiary text-ink-tertiary cursor-not-allowed'
                    : 'bg-claude text-white hover:bg-claude/90 shadow-md shadow-claude/20'
                }`}
              >
                {currentStep === TOTAL_STEPS - 1 ? 'Complete' : 'Next Step'}
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Walkthrough */}
        <div className="max-w-6xl mx-auto px-6 pb-12">
          <InteractiveWalkthrough
            currentStep={currentStep}
            onStepChange={setCurrentStep}
          />
        </div>

        {/* Sequence Diagram */}
        <div className="bg-surface-secondary py-12 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-bold text-ink-primary text-center mb-6">
              Full Data Flow
            </h2>
            <SequenceDiagram />

            {/* Legend */}
            <div className="max-w-3xl mx-auto mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-ink-primary shrink-0" />
                <span className="text-ink-secondary">Learner ↔ Claude</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-claude shrink-0" />
                <span className="text-ink-secondary">MCP Tool Calls</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-600 shrink-0" />
                <span className="text-ink-secondary">MCQMCP Server</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-600 shrink-0" />
                <span className="text-ink-secondary">Analytics</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key takeaways */}
        <div className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-ink-primary text-center mb-6">
              Key Takeaways
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-surface-secondary rounded-xl p-5 border border-edge-light">
                <div className="text-2xl mb-2">📤</div>
                <h3 className="font-semibold text-ink-primary mb-1">Content Out</h3>
                <p className="text-sm text-ink-secondary">
                  Validated questions with metadata flow from item banks to learners.
                </p>
              </div>
              <div className="bg-surface-secondary rounded-xl p-5 border border-edge-light">
                <div className="text-2xl mb-2">📥</div>
                <h3 className="font-semibold text-ink-primary mb-1">Data Back</h3>
                <p className="text-sm text-ink-secondary">
                  Every response captured—selection, correctness, latency.
                </p>
              </div>
              <div className="bg-surface-secondary rounded-xl p-5 border border-edge-light">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-semibold text-ink-primary mb-1">Analytics Ready</h3>
                <p className="text-sm text-ink-secondary">
                  Compute item stats, track mastery, validate effectiveness.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="py-10 px-6 bg-claude">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-xl font-bold text-white mb-2">
              Ready to integrate?
            </h2>
            <p className="text-white/80 mb-5 text-sm">
              MCQMCP is open source. Start measuring learning outcomes today.
            </p>
            <div className="flex items-center justify-center gap-3">
              <a
                href="https://github.com/JDerekLomas/claude-mcq-assessment"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-claude font-medium rounded-full hover:bg-white/90 transition-all"
              >
                View on GitHub
                <ArrowRight size={16} />
              </a>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-full border border-white/30 hover:bg-white/10 transition-all"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
