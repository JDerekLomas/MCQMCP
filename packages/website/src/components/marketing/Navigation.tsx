'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Github, ArrowRight } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';

export function Navigation() {
  const pathname = usePathname();
  const isDemo = pathname === '/demo';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-edge-light">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <LogoMark size={28} />
          <span className="text-lg font-semibold text-ink-primary group-hover:text-claude transition-colors">
            MCQMCP
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/#how-it-works"
            className="text-sm text-ink-secondary hover:text-ink-primary transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="/#for-developers"
            className="text-sm text-ink-secondary hover:text-ink-primary transition-colors"
          >
            For Developers
          </Link>
          <Link
            href="/#for-learning-engineers"
            className="text-sm text-ink-secondary hover:text-ink-primary transition-colors"
          >
            For Learning Engineers
          </Link>
          <a
            href="https://github.com/JDerekLomas/claude-mcq-assessment"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ink-secondary hover:text-ink-primary transition-colors flex items-center gap-1.5"
          >
            <Github size={16} />
            GitHub
          </a>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          {isDemo ? (
            <Link
              href="/"
              className="text-sm text-ink-secondary hover:text-ink-primary transition-colors"
            >
              ← Back to Home
            </Link>
          ) : (
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-4 py-2 bg-claude text-white text-sm font-medium rounded-full hover:bg-claude/90 transition-colors"
            >
              Try Demo
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
