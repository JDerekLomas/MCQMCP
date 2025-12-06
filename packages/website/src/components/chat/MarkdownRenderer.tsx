'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

const components: Components = {
  // Headers
  h1: ({ children }) => (
    <h1 className="text-2xl font-semibold text-ink-primary mt-6 mb-4 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-semibold text-ink-primary mt-5 mb-3 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold text-ink-primary mt-4 mb-2 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base font-semibold text-ink-primary mt-4 mb-2 first:mt-0">
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5 className="text-sm font-semibold text-ink-primary mt-3 mb-2 first:mt-0">
      {children}
    </h5>
  ),
  h6: ({ children }) => (
    <h6 className="text-sm font-semibold text-ink-secondary mt-3 mb-2 first:mt-0">
      {children}
    </h6>
  ),

  // Paragraphs
  p: ({ children }) => (
    <p className="text-[15px] leading-relaxed text-ink-primary mb-4 last:mb-0">
      {children}
    </p>
  ),

  // Lists
  ul: ({ children }) => (
    <ul className="list-disc pl-6 mb-4 space-y-1 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 mb-4 space-y-1 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-[15px] leading-relaxed text-ink-primary">{children}</li>
  ),

  // Inline code
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const isInline = !match && !className;

    if (isInline) {
      return (
        <code
          className="px-1.5 py-0.5 bg-surface-tertiary text-ink-primary text-[13px] font-mono rounded"
          {...props}
        >
          {children}
        </code>
      );
    }

    // Code block
    return (
      <code className={`${className} text-[13px] font-mono`} {...props}>
        {children}
      </code>
    );
  },

  // Code blocks
  pre: ({ children }) => (
    <pre className="bg-[#1e1e1e] text-[#d4d4d4] p-4 rounded-lg overflow-x-auto mb-4 last:mb-0 text-[13px] leading-relaxed">
      {children}
    </pre>
  ),

  // Blockquotes
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-edge-default pl-4 py-1 my-4 text-ink-secondary italic">
      {children}
    </blockquote>
  ),

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-claude hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),

  // Strong/Bold
  strong: ({ children }) => (
    <strong className="font-semibold text-ink-primary">{children}</strong>
  ),

  // Emphasis/Italic
  em: ({ children }) => <em className="italic">{children}</em>,

  // Horizontal rule
  hr: () => <hr className="border-edge-light my-6" />,

  // Tables
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full border-collapse border border-edge-light">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-surface-secondary">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-edge-light">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2 text-left text-sm font-semibold text-ink-primary border border-edge-light">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2 text-sm text-ink-primary border border-edge-light">
      {children}
    </td>
  ),
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
