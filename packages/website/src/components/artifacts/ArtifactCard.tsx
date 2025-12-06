'use client';

import { useState, useMemo } from 'react';
import type { Artifact } from '@/lib/artifacts/schemas';

interface ArtifactCardProps {
  artifact: Artifact;
  className?: string;
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 5 1 8 4 11" />
      <polyline points="12 5 15 8 12 11" />
      <line x1="10" y1="3" x2="6" y2="13" />
    </svg>
  );
}

function PreviewIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="12" height="10" rx="1" />
      <line x1="2" y1="6" x2="14" y2="6" />
      <circle cx="4" cy="4.5" r="0.5" fill="currentColor" />
      <circle cx="6" cy="4.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="8" height="8" rx="1" />
      <path d="M2 10V3a1 1 0 0 1 1-1h7" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="11 4 5.5 10 3 7.5" />
    </svg>
  );
}

function ExpandIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1h4v4M5 13H1V9M14 1L8.5 6.5M0 13l5.5-5.5" />
    </svg>
  );
}

// Simple syntax highlighting for common patterns
function highlightCode(code: string, language?: string): string {
  if (!language) return escapeHtml(code);

  let highlighted = escapeHtml(code);

  // Keywords
  const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'default', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof'];
  keywords.forEach(kw => {
    highlighted = highlighted.replace(new RegExp(`\\b(${kw})\\b`, 'g'), '<span class="text-[#CF222E]">$1</span>');
  });

  // Strings (single and double quotes)
  highlighted = highlighted.replace(/(&quot;[^&]*&quot;|&#39;[^&]*&#39;|`[^`]*`)/g, '<span class="text-[#0A3069]">$1</span>');

  // Comments
  highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="text-[#6E7781]">$1</span>');

  // Numbers
  highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="text-[#0550AE]">$1</span>');

  // JSX/HTML tags
  if (['jsx', 'tsx', 'html'].includes(language || '')) {
    highlighted = highlighted.replace(/(&lt;\/?[\w-]+)/g, '<span class="text-[#116329]">$1</span>');
    highlighted = highlighted.replace(/(\/&gt;|&gt;)/g, '<span class="text-[#116329]">$1</span>');
  }

  return highlighted;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function ArtifactCard({ artifact, className = '' }: ArtifactCardProps) {
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>(
    ['html', 'react', 'svg'].includes(artifact.type) ? 'preview' : 'code'
  );
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const canPreview = ['html', 'react', 'svg'].includes(artifact.type);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const highlightedCode = useMemo(
    () => highlightCode(artifact.content, artifact.language),
    [artifact.content, artifact.language]
  );

  return (
    <>
      <div className={`bg-white border border-[#E8E7E3] rounded-xl overflow-hidden shadow-sm ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#F5F4F1] border-b border-[#E8E7E3]">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-[#0D0D0D]">{artifact.title}</span>
            {artifact.language && (
              <span className="px-2 py-0.5 text-[11px] font-medium text-[#5D5D5D] bg-white rounded-md border border-[#E8E7E3]">
                {artifact.language}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Tab buttons */}
            {canPreview && (
              <div className="flex items-center mr-2 bg-white rounded-lg border border-[#E8E7E3] p-0.5">
                <button
                  onClick={() => setActiveTab('code')}
                  className={`flex items-center gap-1.5 px-2 py-1 text-[12px] font-medium rounded-md transition-colors ${
                    activeTab === 'code'
                      ? 'bg-[#F5F4F1] text-[#0D0D0D]'
                      : 'text-[#5D5D5D] hover:text-[#0D0D0D]'
                  }`}
                >
                  <CodeIcon className="w-3.5 h-3.5" />
                  Code
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-1.5 px-2 py-1 text-[12px] font-medium rounded-md transition-colors ${
                    activeTab === 'preview'
                      ? 'bg-[#F5F4F1] text-[#0D0D0D]'
                      : 'text-[#5D5D5D] hover:text-[#0D0D0D]'
                  }`}
                >
                  <PreviewIcon className="w-3.5 h-3.5" />
                  Preview
                </button>
              </div>
            )}

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="p-1.5 text-[#5D5D5D] hover:text-[#0D0D0D] hover:bg-white rounded-md transition-colors"
              title="Copy code"
            >
              {copied ? <CheckIcon className="text-[#16A34A]" /> : <CopyIcon />}
            </button>

            {/* Expand button */}
            <button
              onClick={() => setIsExpanded(true)}
              className="p-1.5 text-[#5D5D5D] hover:text-[#0D0D0D] hover:bg-white rounded-md transition-colors"
              title="Expand"
            >
              <ExpandIcon />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[400px] overflow-auto">
          {activeTab === 'code' ? (
            <pre className="p-4 text-[13px] font-mono leading-relaxed overflow-x-auto bg-[#FAFAFA]">
              <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
            </pre>
          ) : (
            <ArtifactPreview artifact={artifact} />
          )}
        </div>
      </div>

      {/* Expanded modal */}
      {isExpanded && (
        <ArtifactModal
          artifact={artifact}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={() => setIsExpanded(false)}
          highlightedCode={highlightedCode}
          canPreview={canPreview}
        />
      )}
    </>
  );
}

interface ArtifactPreviewProps {
  artifact: Artifact;
  className?: string;
}

function ArtifactPreview({ artifact, className = '' }: ArtifactPreviewProps) {
  // Generate preview HTML based on artifact type
  const previewHtml = useMemo(() => {
    switch (artifact.type) {
      case 'html':
        return artifact.content;

      case 'svg':
        return artifact.content;

      case 'react':
        // For React, we wrap it in a basic HTML template with React/ReactDOM from CDN
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${artifact.content}

    // Try to find and render the default export or named component
    const componentNames = Object.keys(window).filter(k => /^[A-Z]/.test(k) && typeof window[k] === 'function');
    const App = typeof Component !== 'undefined' ? Component :
                typeof App !== 'undefined' ? App :
                eval(Object.keys({${artifact.content.match(/(?:function|const|let|var)\s+([A-Z][a-zA-Z0-9]*)/g)?.map(m => m.split(/\s+/)[1]).join(',') || 'App'}}).find(n => typeof eval(n) === 'function') || 'App');

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
  </script>
</body>
</html>`;

      default:
        return `<pre style="margin:0;padding:16px;font-family:monospace;white-space:pre-wrap;">${escapeHtml(artifact.content)}</pre>`;
    }
  }, [artifact]);

  return (
    <div className={`bg-white ${className}`}>
      <iframe
        srcDoc={previewHtml}
        sandbox="allow-scripts"
        className="w-full h-[300px] border-0"
        title={`Preview: ${artifact.title}`}
      />
    </div>
  );
}

interface ArtifactModalProps {
  artifact: Artifact;
  activeTab: 'code' | 'preview';
  onTabChange: (tab: 'code' | 'preview') => void;
  onClose: () => void;
  highlightedCode: string;
  canPreview: boolean;
}

function ArtifactModal({ artifact, activeTab, onTabChange, onClose, highlightedCode, canPreview }: ArtifactModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F5F4F1] border-b border-[#E8E7E3]">
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-semibold text-[#0D0D0D]">{artifact.title}</span>
            {artifact.language && (
              <span className="px-2 py-0.5 text-[11px] font-medium text-[#5D5D5D] bg-white rounded-md border border-[#E8E7E3]">
                {artifact.language}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Tab buttons */}
            {canPreview && (
              <div className="flex items-center mr-2 bg-white rounded-lg border border-[#E8E7E3] p-0.5">
                <button
                  onClick={() => onTabChange('code')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                    activeTab === 'code'
                      ? 'bg-[#F5F4F1] text-[#0D0D0D]'
                      : 'text-[#5D5D5D] hover:text-[#0D0D0D]'
                  }`}
                >
                  <CodeIcon />
                  Code
                </button>
                <button
                  onClick={() => onTabChange('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                    activeTab === 'preview'
                      ? 'bg-[#F5F4F1] text-[#0D0D0D]'
                      : 'text-[#5D5D5D] hover:text-[#0D0D0D]'
                  }`}
                >
                  <PreviewIcon />
                  Preview
                </button>
              </div>
            )}

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[#5D5D5D] hover:text-[#0D0D0D] hover:bg-white rounded-lg transition-colors"
            >
              {copied ? <CheckIcon className="text-[#16A34A]" /> : <CopyIcon />}
              {copied ? 'Copied!' : 'Copy'}
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 text-[#5D5D5D] hover:text-[#0D0D0D] hover:bg-white rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M15 5L5 15M5 5L15 15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'code' ? (
            <pre className="p-6 text-[13px] font-mono leading-relaxed overflow-x-auto bg-[#FAFAFA] min-h-full">
              <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
            </pre>
          ) : (
            <div className="h-full min-h-[500px]">
              <iframe
                srcDoc={generatePreviewHtml(artifact)}
                sandbox="allow-scripts"
                className="w-full h-full min-h-[500px] border-0"
                title={`Preview: ${artifact.title}`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function generatePreviewHtml(artifact: Artifact): string {
  switch (artifact.type) {
    case 'html':
      return artifact.content;

    case 'svg':
      return `<!DOCTYPE html><html><body style="margin:0;padding:16px;display:flex;justify-content:center;align-items:center;min-height:100vh;">${artifact.content}</body></html>`;

    case 'react':
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${artifact.content}

    // Auto-detect and render the component
    try {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      // Try common export patterns
      if (typeof App !== 'undefined') {
        root.render(React.createElement(App));
      } else if (typeof Component !== 'undefined') {
        root.render(React.createElement(Component));
      } else if (typeof Main !== 'undefined') {
        root.render(React.createElement(Main));
      } else {
        // Try to find any capitalized function
        const code = \`${artifact.content.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
        const match = code.match(/(?:function|const|let|var)\\s+([A-Z][a-zA-Z0-9]*)\\s*[=(]/);
        if (match) {
          root.render(React.createElement(eval(match[1])));
        }
      }
    } catch (e) {
      document.getElementById('root').innerHTML = '<pre style="color:red;">' + e.message + '</pre>';
    }
  </script>
</body>
</html>`;

    default:
      return `<pre style="margin:0;padding:16px;font-family:monospace;white-space:pre-wrap;">${escapeHtml(artifact.content)}</pre>`;
  }
}
