import { z } from 'zod';

/**
 * A research tab that opens with context about the conversation
 */
export const ResearchTabSchema = z.object({
  id: z.string(),
  term: z.string(), // The library/concept to research
  displayName: z.string(), // Human-readable name for the tab
  contextSummary: z.string(), // 50-word summary of the chat context
  url: z.string().optional(), // Optional external documentation URL
  createdAt: z.string(),
});
export type ResearchTab = z.infer<typeof ResearchTabSchema>;

/**
 * A clickable research link in Claude's response
 * Format: :::research{term="react-query" display="React Query" url="https://tanstack.com/query"}:::
 */
export const ResearchLinkSchema = z.object({
  term: z.string(),
  display: z.string(),
  url: z.string().optional(),
});
export type ResearchLink = z.infer<typeof ResearchLinkSchema>;

/**
 * Result of parsing research links from a message
 */
export interface ParsedResearchLinks {
  textSegments: string[];
  links: ResearchLink[];
}
