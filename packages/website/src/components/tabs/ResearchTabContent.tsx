'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ResearchTab, ResearchLink } from '@/lib/tabs/schemas';
import { parseResearchLinks } from '@/lib/tabs/parse-research-links';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import { ResearchLinkButton } from './ResearchLinkButton';

interface ResearchTabContentProps {
  tab: ResearchTab;
  onOpenResearchTab: (link: ResearchLink) => void;
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 8v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3M8 2h4v4M6 8L12 2" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-[#DA7756] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Render content with clickable research links
function ResearchContent({
  content,
  researchLinks,
  onOpenResearchTab
}: {
  content: string;
  researchLinks: ResearchLink[];
  onOpenResearchTab: (link: ResearchLink) => void;
}) {
  if (researchLinks.length === 0) {
    return <MarkdownRenderer content={content} />;
  }

  // Split content by research link placeholders and render with buttons
  const parts = content.split(/\[\[RESEARCH_LINK:(\d+)\]\]/);

  return (
    <span>
      {parts.map((part, index) => {
        if (index % 2 === 0) {
          return <MarkdownRenderer key={index} content={part} />;
        } else {
          const linkIndex = parseInt(part, 10);
          const link = researchLinks[linkIndex];
          if (link) {
            return (
              <ResearchLinkButton
                key={index}
                link={link}
                onClick={onOpenResearchTab}
              />
            );
          }
          return null;
        }
      })}
    </span>
  );
}

export function ResearchTabContent({ tab, onOpenResearchTab }: ResearchTabContentProps) {
  const [researchContent, setResearchContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch research content from Claude
  const fetchResearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `[Research Tab Request]

Context from the main conversation:
${tab.contextSummary}

Please provide a focused research summary about: **${tab.term}**

Include:
1. What it is (1-2 sentences)
2. Key features/benefits (bullet points)
3. Basic usage example (code if applicable)
4. When to use it vs alternatives
5. Related technologies they might want to explore (use :::research{term="name" display="Name" url="https://..."}::: format for these)

Keep it concise and practical. Make related technologies clickable so they can explore further.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch research');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'text') {
                  fullContent += data.content;
                  setResearchContent(fullContent);
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load research');
    } finally {
      setIsLoading(false);
    }
  }, [tab.contextSummary, tab.term]);

  useEffect(() => {
    fetchResearch();
  }, [fetchResearch]);

  // Parse research links from the content
  const { processedContent, researchLinks } = useMemo(() => {
    if (!researchContent) {
      return { processedContent: '', researchLinks: [] };
    }
    const { textSegments, links } = parseResearchLinks(researchContent);
    return {
      processedContent: textSegments.join(''),
      researchLinks: links,
    };
  }, [researchContent]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E7E3] bg-[#F5F4F1]">
        <div>
          <h2 className="text-[16px] font-semibold text-[#0D0D0D]">{tab.displayName}</h2>
          <p className="text-[12px] text-[#8E8E8E] mt-0.5">Research for your current project</p>
        </div>
        {tab.url && (
          <a
            href={tab.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[#5D5D5D] hover:text-[#0D0D0D] hover:bg-white rounded-lg transition-colors"
          >
            <ExternalLinkIcon />
            Docs
          </a>
        )}
      </div>

      {/* Context summary */}
      <div className="px-6 py-3 bg-[#FDF8F6] border-b border-[#E8E7E3]">
        <p className="text-[12px] text-[#5D5D5D]">
          <span className="font-medium text-[#DA7756]">Context:</span> {tab.contextSummary}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isLoading && !researchContent && <LoadingSpinner />}
        {error && (
          <div className="text-center py-8">
            <p className="text-[#DC2626] text-[14px] mb-4">{error}</p>
            <button
              onClick={fetchResearch}
              className="px-4 py-2 text-[14px] text-[#DA7756] hover:bg-[#DA7756]/10 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}
        {researchContent && (
          <div className="prose prose-sm max-w-none">
            <ResearchContent
              content={processedContent}
              researchLinks={researchLinks}
              onOpenResearchTab={onOpenResearchTab}
            />
            {isLoading && (
              <span className="inline-block w-2 h-4 bg-[#DA7756] animate-pulse ml-1" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
