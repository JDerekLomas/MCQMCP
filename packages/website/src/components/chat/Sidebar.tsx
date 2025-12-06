'use client';

interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
  isActive?: boolean;
}

interface SidebarProps {
  conversations?: Conversation[];
  onNewChat?: () => void;
  onSelectConversation?: (id: string) => void;
  onOpenSettings?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

// Claude's starburst logo - more accurate version
function ClaudeLogo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L12 22M2 12L22 12M4.93 4.93L19.07 19.07M19.07 4.93L4.93 19.07"
        stroke="#DA7756"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Icons for the icon strip
function NewChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ChatsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ComponentsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {collapsed ? (
        <path d="M6 4L10 8L6 12" />
      ) : (
        <path d="M10 4L6 8L10 12" />
      )}
    </svg>
  );
}

export function Sidebar({
  conversations = [],
  onNewChat,
  onSelectConversation,
  onOpenSettings,
  isCollapsed = false,
  onToggleCollapse,
  className = '',
}: SidebarProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return 'Previous 7 Days';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Group conversations by time period
  const groupedConversations = conversations.reduce(
    (groups, conv) => {
      const label = formatDate(conv.timestamp);
      if (!groups[label]) groups[label] = [];
      groups[label].push(conv);
      return groups;
    },
    {} as Record<string, Conversation[]>
  );

  return (
    <div className={`flex h-screen ${className}`}>
      {/* Icon Strip - Always visible */}
      <div className="flex flex-col w-12 bg-[#F5F4F1] border-r border-[#E8E7E3]">
        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="flex items-center justify-center w-12 h-12 text-[#DA7756] hover:bg-[#E8E7E3] transition-colors"
          title="New chat"
        >
          <div className="w-8 h-8 rounded-lg bg-[#DA7756] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
        </button>

        {/* Navigation Icons */}
        <nav className="flex flex-col items-center py-2 space-y-1">
          <button
            className="flex items-center justify-center w-10 h-10 text-[#5D5D5D] hover:text-[#0D0D0D] hover:bg-[#E8E7E3] rounded-lg transition-colors"
            title="Chats"
          >
            <ChatsIcon />
          </button>
          <button
            className="flex items-center justify-center w-10 h-10 text-[#5D5D5D] hover:text-[#0D0D0D] hover:bg-[#E8E7E3] rounded-lg transition-colors"
            title="Projects"
          >
            <ProjectsIcon />
          </button>
          <button
            className="flex items-center justify-center w-10 h-10 text-[#5D5D5D] hover:text-[#0D0D0D] hover:bg-[#E8E7E3] rounded-lg transition-colors"
            title="Components"
          >
            <ComponentsIcon />
          </button>
          <button
            className="flex items-center justify-center w-10 h-10 text-[#5D5D5D] hover:text-[#0D0D0D] hover:bg-[#E8E7E3] rounded-lg transition-colors"
            title="Code"
          >
            <CodeIcon />
          </button>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Icons */}
        <div className="flex flex-col items-center py-2 space-y-1">
          <button
            onClick={onOpenSettings}
            className="flex items-center justify-center w-10 h-10 text-[#5D5D5D] hover:text-[#0D0D0D] hover:bg-[#E8E7E3] rounded-lg transition-colors"
            title="Settings"
          >
            <SettingsIcon />
          </button>
          {/* User Avatar */}
          <button
            className="flex items-center justify-center w-10 h-10"
            title="Account"
          >
            <div className="w-7 h-7 rounded-full bg-[#E8DDD4] flex items-center justify-center text-[11px] font-medium text-[#5D5D5D]">
              DL
            </div>
          </button>
        </div>
      </div>

      {/* Main Sidebar Panel - Collapsible */}
      {!isCollapsed && (
        <aside className="flex flex-col w-[220px] bg-[#FAFAF9] border-r border-[#E8E7E3]">
          {/* Header with title and collapse */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E7E3]">
            <span className="text-[14px] font-medium text-[#0D0D0D]">
              {conversations.find(c => c.isActive)?.title || 'New chat'}
            </span>
            <button
              onClick={onToggleCollapse}
              className="p-1 text-[#8E8E8E] hover:text-[#5D5D5D] hover:bg-[#E8E7E3] rounded transition-colors"
              title="Close sidebar"
            >
              <CollapseIcon collapsed={false} />
            </button>
          </div>

          {/* Conversation History */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {Object.entries(groupedConversations).map(([label, convs]) => (
              <div key={label} className="mb-3">
                <h3 className="px-2 py-1.5 text-[11px] font-medium text-[#8E8E8E] uppercase tracking-wide">
                  {label}
                </h3>
                <ul className="space-y-0.5">
                  {convs.map((conv) => (
                    <li key={conv.id}>
                      <button
                        onClick={() => onSelectConversation?.(conv.id)}
                        className={`
                          w-full px-3 py-2
                          text-left text-[13px]
                          rounded-lg
                          transition-colors duration-150
                          truncate
                          ${
                            conv.isActive
                              ? 'bg-[#E8E7E3] text-[#0D0D0D] font-medium'
                              : 'text-[#5D5D5D] hover:bg-[#EEEDE9] hover:text-[#0D0D0D]'
                          }
                        `}
                      >
                        {conv.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {conversations.length === 0 && (
              <div className="px-3 py-8 text-center">
                <p className="text-[13px] text-[#8E8E8E]">
                  No conversations yet
                </p>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Collapsed state - just show expand button */}
      {isCollapsed && (
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center w-6 bg-[#FAFAF9] border-r border-[#E8E7E3] text-[#8E8E8E] hover:text-[#5D5D5D] hover:bg-[#EEEDE9] transition-colors"
          title="Open sidebar"
        >
          <CollapseIcon collapsed={true} />
        </button>
      )}
    </div>
  );
}
