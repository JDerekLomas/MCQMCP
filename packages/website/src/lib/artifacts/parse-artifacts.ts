import { ArtifactSchema, type Artifact, type ParsedArtifacts } from './schemas';

/**
 * Regex to match :::artifact blocks with metadata
 * Format:
 * :::artifact{id="unique-id" type="react" title="My Component" language="tsx"}
 * content here
 * :::
 */
const ARTIFACT_BLOCK_REGEX = /:::artifact\{([^}]+)\}\s*([\s\S]*?)\s*:::/g;

/**
 * Parse artifact metadata from the attribute string
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
 * Parses a message string and extracts any :::artifact blocks.
 *
 * Each artifact block is validated against the Artifact schema.
 * Invalid blocks are collected separately for debugging.
 *
 * @param content - The raw message content from Claude
 * @returns Parsed message with text segments and validated artifacts
 */
export function parseArtifactBlocks(content: string): ParsedArtifacts {
  const artifacts: Artifact[] = [];
  const invalidBlocks: string[] = [];
  const textSegments: string[] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex state
  ARTIFACT_BLOCK_REGEX.lastIndex = 0;

  while ((match = ARTIFACT_BLOCK_REGEX.exec(content)) !== null) {
    // Capture text before this artifact block
    const textBefore = content.slice(lastIndex, match.index).trim();
    if (textBefore) {
      textSegments.push(textBefore);
    }

    const attrString = match[1];
    const artifactContent = match[2].trim();

    try {
      const attrs = parseAttributes(attrString);

      const artifactData = {
        id: attrs.id || `artifact-${Date.now()}`,
        type: attrs.type || 'code',
        title: attrs.title || 'Untitled',
        language: attrs.language,
        content: artifactContent,
      };

      const validated = ArtifactSchema.safeParse(artifactData);

      if (validated.success) {
        artifacts.push(validated.data);
      } else {
        console.warn('Artifact block failed validation:', validated.error.issues);
        invalidBlocks.push(artifactContent);
      }
    } catch (error) {
      console.warn('Artifact block parsing error:', error);
      invalidBlocks.push(artifactContent);
    }

    lastIndex = match.index + match[0].length;
  }

  // Capture any remaining text after the last artifact block
  const textAfter = content.slice(lastIndex).trim();
  if (textAfter) {
    textSegments.push(textAfter);
  }

  return { textSegments, artifacts, invalidBlocks };
}

/**
 * Checks if a message contains any artifact blocks.
 *
 * @param content - The raw message content
 * @returns True if the message contains at least one :::artifact block
 */
export function hasArtifactBlocks(content: string): boolean {
  ARTIFACT_BLOCK_REGEX.lastIndex = 0;
  return ARTIFACT_BLOCK_REGEX.test(content);
}
