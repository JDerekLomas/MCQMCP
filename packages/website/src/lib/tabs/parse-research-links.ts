import { ResearchLinkSchema, type ResearchLink, type ParsedResearchLinks } from './schemas';

/**
 * Regex to match :::research{...}::: inline links
 * Format: :::research{term="react-query" display="React Query" url="https://..."}:::
 */
const RESEARCH_LINK_REGEX = /:::research\{([^}]+)\}:::/g;

/**
 * Parse attributes from the link string
 */
function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /(\w+)="([^"]*)"/g;
  let match: RegExpExecArray | null;

  while ((match = attrRegex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }

  return attrs;
}

/**
 * Parses a message and extracts research links that can open as tabs
 */
export function parseResearchLinks(content: string): ParsedResearchLinks {
  const links: ResearchLink[] = [];
  const textSegments: string[] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  RESEARCH_LINK_REGEX.lastIndex = 0;

  while ((match = RESEARCH_LINK_REGEX.exec(content)) !== null) {
    // Capture text before this link
    const textBefore = content.slice(lastIndex, match.index);
    if (textBefore) {
      textSegments.push(textBefore);
    }

    const attrString = match[1];
    const attrs = parseAttributes(attrString);

    const linkData = {
      term: attrs.term || '',
      display: attrs.display || attrs.term || '',
      url: attrs.url,
    };

    const validated = ResearchLinkSchema.safeParse(linkData);
    if (validated.success) {
      links.push(validated.data);
      // Add a placeholder that will be replaced with a clickable element
      textSegments.push(`[[RESEARCH_LINK:${links.length - 1}]]`);
    }

    lastIndex = match.index + match[0].length;
  }

  // Capture remaining text
  const textAfter = content.slice(lastIndex);
  if (textAfter) {
    textSegments.push(textAfter);
  }

  return { textSegments, links };
}

/**
 * Check if content has research links
 */
export function hasResearchLinks(content: string): boolean {
  RESEARCH_LINK_REGEX.lastIndex = 0;
  return RESEARCH_LINK_REGEX.test(content);
}
