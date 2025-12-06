'use client';

import type { ResearchTab } from '@/lib/tabs/schemas';

interface TabBarProps {
  tabs: ResearchTab[];
  activeTabId: string | null;
  onSelectTab: (tabId: string | null) => void;
  onCloseTab: (tabId: string) => void;
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M9 3L3 9M3 3L9 9" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 7c0 2.5-2.2 4.5-5 4.5-.9 0-1.7-.2-2.4-.5L2 12l.5-2.1C1.6 9 1 8.1 1 7c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5z" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 2.5h4a2 2 0 0 1 2 2v8a1.5 1.5 0 0 0-1.5-1.5H1zM13 2.5H9a2 2 0 0 0-2 2v8a1.5 1.5 0 0 1 1.5-1.5H13z" />
    </svg>
  );
}

export function TabBar({ tabs, activeTabId, onSelectTab, onCloseTab }: TabBarProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-[#F5F4F1] border-b border-[#E8E7E3] overflow-x-auto">
      {/* Main chat tab - always present */}
      <button
        onClick={() => onSelectTab(null)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium
          transition-colors whitespace-nowrap
          ${activeTabId === null
            ? 'bg-white text-[#0D0D0D] shadow-sm'
            : 'text-[#5D5D5D] hover:text-[#0D0D0D] hover:bg-white/50'
          }
        `}
      >
        <ChatIcon />
        <span>Chat</span>
      </button>

      {/* Research tabs */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`
            flex items-center gap-1 pl-3 pr-1 py-1 rounded-lg text-[13px] font-medium
            transition-colors whitespace-nowrap group
            ${activeTabId === tab.id
              ? 'bg-white text-[#0D0D0D] shadow-sm'
              : 'text-[#5D5D5D] hover:text-[#0D0D0D] hover:bg-white/50'
            }
          `}
        >
          <button
            onClick={() => onSelectTab(tab.id)}
            className="flex items-center gap-2"
          >
            <BookIcon />
            <span className="max-w-[120px] truncate">{tab.displayName}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCloseTab(tab.id);
            }}
            className="p-1 rounded hover:bg-[#E8E7E3] opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <CloseIcon className="text-[#8E8E8E] hover:text-[#5D5D5D]" />
          </button>
        </div>
      ))}
    </div>
  );
}
