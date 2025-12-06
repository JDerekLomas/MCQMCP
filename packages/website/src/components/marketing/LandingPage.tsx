'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Database,
  BarChart3,
  Zap,
  Code,
  BookOpen,
  GitBranch,
  Play,
  CheckCircle,
  Users,
  Layers
} from 'lucide-react';
import { SequenceDiagram, ArchitectureDiagram, ValueLoopDiagram } from '@/components/diagrams/FlowDiagrams';
import { LogoMark } from '@/components/brand/Logo';

function HeroSection() {
  return (
    <section className="pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-claude/10 text-claude text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-claude animate-pulse" />
          Open Source MCP Server
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl font-bold text-ink-primary mb-4 leading-tight">
          Measure what humans <span className="text-claude">actually learn</span>
        </h1>

        {/* Subhead */}
        <p className="text-lg text-ink-secondary max-w-2xl mx-auto mb-6">
          MCQMCP is measurement infrastructure for AI-assisted learning.
          Validated assessments + full data capture for any Claude interface.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-6 py-3 bg-claude text-white font-medium rounded-full hover:bg-claude/90 transition-all shadow-lg shadow-claude/20 hover:shadow-xl hover:shadow-claude/30"
          >
            <Play size={16} />
            Try the Demo
          </Link>
          <a
            href="https://github.com/JDerekLomas/claude-mcq-assessment"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-ink-primary font-medium rounded-full border border-edge-default hover:border-ink-tertiary transition-all"
          >
            <GitBranch size={16} />
            View on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="py-12 px-6 bg-surface-secondary">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-ink-primary mb-2">
            The problem with AI-generated quizzes
          </h2>
          <p className="text-ink-secondary">
            When you ask an LLM to quiz you, you're flying blind.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 border border-edge-light">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">❌</span>
              <h3 className="font-semibold text-ink-primary">Wrong Answers</h3>
            </div>
            <p className="text-sm text-ink-secondary">
              AI-generated questions can have incorrect answers or ambiguous stems.
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-edge-light">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">📭</span>
              <h3 className="font-semibold text-ink-primary">No Progress</h3>
            </div>
            <p className="text-sm text-ink-secondary">
              Learning history disappears when sessions end. No mastery tracking.
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-edge-light">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">📊</span>
              <h3 className="font-semibold text-ink-primary">No Validation</h3>
            </div>
            <p className="text-sm text-ink-secondary">
              No psychometrics, no item analysis, no calibration data.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SolutionSection() {
  return (
    <section id="how-it-works" className="py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-ink-primary mb-2">
            How MCQMCP works
          </h2>
          <p className="text-ink-secondary max-w-2xl mx-auto">
            Content out, data back. Claude requests items via MCP, responses flow back for analytics.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
              <Database size={22} className="text-blue-600" />
            </div>
            <h3 className="font-semibold text-ink-primary mb-1">Item Discovery</h3>
            <p className="text-sm text-ink-secondary">
              Claude calls <code className="bg-surface-tertiary px-1 py-0.5 rounded text-xs">get_item</code> to fetch curated questions.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3">
              <Zap size={22} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-ink-primary mb-1">Response Logging</h3>
            <p className="text-sm text-ink-secondary">
              Every answer captured with latency and correctness.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
              <BarChart3 size={22} className="text-purple-600" />
            </div>
            <h3 className="font-semibold text-ink-primary mb-1">Learning Analytics</h3>
            <p className="text-sm text-ink-secondary">
              Item stats, mastery tracking, adaptive selection.
            </p>
          </div>
        </div>

        {/* Architecture Diagram */}
        <ArchitectureDiagram />

        {/* Sequence Diagram */}
        <div className="mt-8">
          <SequenceDiagram />
        </div>
      </div>
    </section>
  );
}

function DemoPreviewSection() {
  return (
    <section className="py-12 px-6 bg-surface-secondary">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-bold text-ink-primary mb-3">
              See the protocol in action
            </h2>
            <p className="text-ink-secondary mb-4">
              The demo shows MCP tool calls, item retrieval, and response logging.
            </p>

            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600 shrink-0" />
                <span className="text-sm text-ink-secondary">Watch tool calls with JSON payloads</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600 shrink-0" />
                <span className="text-sm text-ink-secondary">See item metadata and psychometrics</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600 shrink-0" />
                <span className="text-sm text-ink-secondary">Track responses with latency</span>
              </li>
            </ul>

            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-claude text-white font-medium rounded-full hover:bg-claude/90 transition-all"
            >
              Try the Demo
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-edge-light shadow-lg overflow-hidden">
            <div className="bg-surface-secondary px-3 py-2 border-b border-edge-light flex items-center gap-2">
              <span className="text-base">🔍</span>
              <span className="font-medium text-ink-primary text-sm">Protocol Inspector</span>
            </div>
            <div className="p-3 space-y-2">
              {/* Mock tool call */}
              <div className="border border-edge-light rounded-lg p-2.5 bg-blue-50/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center">
                    <Code size={10} className="text-blue-600" />
                  </div>
                  <code className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">get_item</code>
                </div>
                <pre className="text-xs text-ink-secondary bg-white rounded p-1.5 overflow-hidden">{`{ "topic": "js-closures" }`}</pre>
              </div>

              {/* Mock result */}
              <div className="border border-green-200 rounded-lg p-2.5 bg-green-50/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 rounded bg-green-100 flex items-center justify-center">
                    <CheckCircle size={10} className="text-green-600" />
                  </div>
                  <span className="text-xs font-medium">Result</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">js-closures</span>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">medium</span>
                </div>
              </div>

              {/* Mock stats */}
              <div className="bg-surface-secondary rounded-lg p-2.5">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-base font-bold text-ink-primary">3</div>
                    <div className="text-xs text-ink-tertiary">Responses</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-green-600">67%</div>
                    <div className="text-xs text-ink-tertiary">Accuracy</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-ink-primary">12s</div>
                    <div className="text-xs text-ink-tertiary">Avg</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ForDevelopersSection() {
  return (
    <section id="for-developers" className="py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
              <Code size={14} />
              For Clone Developers
            </div>
            <h2 className="text-3xl font-bold text-ink-primary mb-4">
              Add validated assessments to your Claude interface
            </h2>
            <p className="text-lg text-ink-secondary mb-6">
              Integrate MCQMCP to give users personalized learning with progress tracking—without
              building item banks or analytics yourself.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-blue-700 font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-ink-primary">Connect via MCP</h4>
                  <p className="text-sm text-ink-secondary">Point your Claude integration at the MCQMCP server endpoint.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-blue-700 font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-ink-primary">Parse MCQ blocks</h4>
                  <p className="text-sm text-ink-secondary">Detect <code className="bg-surface-tertiary px-1 rounded text-xs">:::mcq</code> delimiters in Claude's responses.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-blue-700 font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-ink-primary">Render interactive cards</h4>
                  <p className="text-sm text-ink-secondary">Build MCQ components that capture selection and latency.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-blue-700 font-bold text-sm">4</span>
                </div>
                <div>
                  <h4 className="font-medium text-ink-primary">Log responses</h4>
                  <p className="text-sm text-ink-secondary">Send answers back via <code className="bg-surface-tertiary px-1 rounded text-xs">assessment_log_response</code> for tracking.</p>
                </div>
              </div>
            </div>

            <a
              href="https://github.com/JDerekLomas/claude-mcq-assessment#integrating-with-your-clone"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-claude font-medium hover:underline"
            >
              Read the integration guide
              <ArrowRight size={16} />
            </a>
          </div>

          {/* Code example */}
          <div className="bg-ink-primary rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-white/60 text-xs ml-2">parse-mcq.ts</span>
            </div>
            <pre className="p-4 text-sm text-white/90 overflow-x-auto"><code>{`// Parse MCQ blocks from Claude's response
function parseMcqBlocks(content: string) {
  const regex = /:::mcq\\n([\\s\\S]*?)\\n:::/g;
  const items = [];
  let match;

  while ((match = regex.exec(content))) {
    items.push(JSON.parse(match[1]));
  }

  return items;
}

// Render and track responses
<MCQCard
  item={item}
  onResponse={(response) => {
    // response includes:
    // - selected, correct, is_correct
    // - latency_ms (auto-tracked)
    logResponse(response);
  }}
/>`}</code></pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function ForLearningEngineersSection() {
  return (
    <section id="for-learning-engineers" className="py-12 px-6 bg-surface-secondary">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Data visualization mock */}
          <div className="bg-white rounded-2xl border border-edge-light overflow-hidden order-2 md:order-1">
            <div className="px-4 py-3 border-b border-edge-light">
              <span className="font-medium text-ink-primary text-sm">Item Analytics</span>
            </div>
            <div className="p-6 space-y-6">
              {/* Item stats */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-ink-secondary">js-closures-042</span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">medium</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-ink-primary">0.63</div>
                    <div className="text-xs text-ink-tertiary">p-value (difficulty)</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-ink-primary">0.71</div>
                    <div className="text-xs text-ink-tertiary">discrimination</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-ink-primary">847</div>
                    <div className="text-xs text-ink-tertiary">responses</div>
                  </div>
                </div>
              </div>

              {/* Distractor analysis mock */}
              <div>
                <div className="text-sm text-ink-secondary mb-3">Distractor Analysis</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">B</span>
                    <div className="flex-1 bg-surface-tertiary rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '63%' }} />
                    </div>
                    <span className="text-xs text-ink-secondary w-10">63%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold">A</span>
                    <div className="flex-1 bg-surface-tertiary rounded-full h-2">
                      <div className="bg-red-400 h-2 rounded-full" style={{ width: '22%' }} />
                    </div>
                    <span className="text-xs text-ink-secondary w-10">22%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold">C</span>
                    <div className="flex-1 bg-surface-tertiary rounded-full h-2">
                      <div className="bg-red-400 h-2 rounded-full" style={{ width: '10%' }} />
                    </div>
                    <span className="text-xs text-ink-secondary w-10">10%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold">D</span>
                    <div className="flex-1 bg-surface-tertiary rounded-full h-2">
                      <div className="bg-red-400 h-2 rounded-full" style={{ width: '5%' }} />
                    </div>
                    <span className="text-xs text-ink-secondary w-10">5%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-4">
              <BarChart3 size={14} />
              For Learning Engineers
            </div>
            <h2 className="text-3xl font-bold text-ink-primary mb-4">
              Access the data you need to measure learning
            </h2>
            <p className="text-lg text-ink-secondary mb-6">
              MCQMCP captures response-level data for psychometric analysis.
              Validate items, measure outcomes, benchmark AI tutoring effectiveness.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-edge-light">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <Layers size={18} className="text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-ink-primary text-sm">Item Psychometrics</h4>
                  <p className="text-xs text-ink-secondary">p-value, discrimination index, distractor effectiveness</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-edge-light">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <Users size={18} className="text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-ink-primary text-sm">Learner Analytics</h4>
                  <p className="text-xs text-ink-secondary">Mastery tracking, learning curves, knowledge gaps</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-edge-light">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <BookOpen size={18} className="text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-ink-primary text-sm">Research Ready</h4>
                  <p className="text-xs text-ink-secondary">Export data, run calibration studies, validate synthetic items</p>
                </div>
              </div>
            </div>

            <a
              href="https://github.com/JDerekLomas/claude-mcq-assessment/blob/main/RESEARCH.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-purple-600 font-medium hover:underline"
            >
              Read the research agenda
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function VisionSection() {
  return (
    <section className="py-12 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-ink-primary mb-2">
          The bigger picture
        </h2>
        <p className="text-ink-secondary mb-6">
          LLMs are becoming primary learning tools. MCQMCP measures whether they actually work.
        </p>

        {/* Value Loop Diagram */}
        <div className="mb-8">
          <ValueLoopDiagram />
        </div>

        <div className="bg-surface-secondary rounded-xl p-6 text-left max-w-2xl mx-auto">
          <blockquote className="text-ink-primary italic mb-3">
            "MCQMCP is infrastructure that makes human learning measurable in the LLM era."
          </blockquote>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/JDerekLomas/claude-mcq-assessment/blob/main/VISION.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-claude font-medium hover:underline"
            >
              Full vision →
            </a>
            <a
              href="https://github.com/JDerekLomas/claude-mcq-assessment/blob/main/ROADMAP.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-ink-secondary hover:text-ink-primary"
            >
              Roadmap →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-12 px-6 bg-claude">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-white mb-3">
          Ready to see it in action?
        </h2>
        <p className="text-white/80 mb-6">
          Step through the full protocol flow in our interactive demo.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-claude font-medium rounded-full hover:bg-white/90 transition-all"
          >
            <Play size={16} />
            Try the Demo
          </Link>
          <a
            href="https://github.com/JDerekLomas/claude-mcq-assessment"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-transparent text-white font-medium rounded-full border border-white/30 hover:bg-white/10 transition-all"
          >
            <GitBranch size={16} />
            Star on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-edge-light">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <LogoMark size={24} />
          <span className="text-ink-secondary text-sm">
            MCQMCP — Measure what matters
          </span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://github.com/JDerekLomas/claude-mcq-assessment"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ink-secondary hover:text-ink-primary transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://github.com/JDerekLomas/claude-mcq-assessment/blob/main/VISION.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ink-secondary hover:text-ink-primary transition-colors"
          >
            Vision
          </a>
          <a
            href="https://github.com/JDerekLomas/claude-mcq-assessment/blob/main/ROADMAP.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ink-secondary hover:text-ink-primary transition-colors"
          >
            Roadmap
          </a>
          <a
            href="https://github.com/JDerekLomas/claude-mcq-assessment/blob/main/RESEARCH.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ink-secondary hover:text-ink-primary transition-colors"
          >
            Research
          </a>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <DemoPreviewSection />
      <ForDevelopersSection />
      <ForLearningEngineersSection />
      <VisionSection />
      <CTASection />
      <Footer />
    </div>
  );
}
