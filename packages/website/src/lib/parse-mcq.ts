import { ItemSchema, type Item } from './mcp/schemas/item';

/**
 * Result of parsing a message that may contain MCQ blocks.
 */
export interface ParsedMessage {
  /** Text segments between MCQ blocks */
  textSegments: string[];
  /** Parsed and validated MCQ items */
  items: Item[];
  /** Raw content that failed validation (for debugging) */
  invalidBlocks: string[];
}

/**
 * Regex to match :::mcq blocks.
 * Captures the JSON content between the delimiters.
 */
const MCQ_BLOCK_REGEX = /:::mcq\s*([\s\S]*?)\s*:::/g;

/**
 * Parses a message string and extracts any :::mcq blocks.
 *
 * Each MCQ block is validated against the Item schema.
 * Invalid blocks are collected separately for debugging.
 *
 * @param content - The raw message content from Claude
 * @returns Parsed message with text segments and validated items
 */
export function parseMcqBlocks(content: string): ParsedMessage {
  const items: Item[] = [];
  const invalidBlocks: string[] = [];
  const textSegments: string[] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex state
  MCQ_BLOCK_REGEX.lastIndex = 0;

  while ((match = MCQ_BLOCK_REGEX.exec(content)) !== null) {
    // Capture text before this MCQ block
    const textBefore = content.slice(lastIndex, match.index).trim();
    if (textBefore) {
      textSegments.push(textBefore);
    }

    const jsonContent = match[1].trim();

    try {
      const parsed = JSON.parse(jsonContent);
      const validated = ItemSchema.safeParse(parsed);

      if (validated.success) {
        items.push(validated.data);
      } else {
        console.warn('MCQ block failed validation:', validated.error.issues);
        invalidBlocks.push(jsonContent);
      }
    } catch (error) {
      console.warn('MCQ block contains invalid JSON:', error);
      invalidBlocks.push(jsonContent);
    }

    lastIndex = match.index + match[0].length;
  }

  // Capture any remaining text after the last MCQ block
  const textAfter = content.slice(lastIndex).trim();
  if (textAfter) {
    textSegments.push(textAfter);
  }

  return { textSegments, items, invalidBlocks };
}

/**
 * Checks if a message contains any MCQ blocks.
 *
 * @param content - The raw message content
 * @returns True if the message contains at least one :::mcq block
 */
export function hasMcqBlocks(content: string): boolean {
  MCQ_BLOCK_REGEX.lastIndex = 0;
  return MCQ_BLOCK_REGEX.test(content);
}
