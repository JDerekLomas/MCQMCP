'use client';

import type { ResearchLink } from '@/lib/tabs/schemas';

interface ResearchLinkButtonProps {
  link: ResearchLink;
  onClick: (link: ResearchLink) => void;
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 2h3.5a1.5 1.5 0 0 1 1.5 1.5v6.5a1 1 0 0 0-1-1H1zM11 2H7.5A1.5 1.5 0 0 0 6 3.5v6.5a1 1 0 0 1 1-1H11z" />
    </svg>
  );
}

export function ResearchLinkButton({ link, onClick }: ResearchLinkButtonProps) {
  return (
    <button
      onClick={() => onClick(link)}
      className="
        inline-flex items-center gap-1 px-2 py-0.5 mx-0.5
        text-[13px] font-medium
        text-[#DA7756] bg-[#DA7756]/10
        border border-[#DA7756]/20
        rounded-md
        hover:bg-[#DA7756]/20 hover:border-[#DA7756]/30
        transition-colors
        cursor-pointer
      "
      title={`Open research tab for ${link.display}`}
    >
      <BookIcon />
      <span>{link.display}</span>
    </button>
  );
}
