import { GetItemInputSchema, ItemSchema, type Item } from '../schemas/item';
import itemBankData from '../item-bank.json';

/**
 * Retrieves a random assessment item matching the specified criteria.
 *
 * @param input - The query parameters (topic, optional difficulty, optional exclude_ids)
 * @returns A validated Item or null if no matching item found
 */
export function getItem(input: unknown): Item | null {
  // Validate input
  const parsed = GetItemInputSchema.safeParse(input);
  if (!parsed.success) {
    console.error('Invalid get-item input:', parsed.error);
    return null;
  }

  const { topic, difficulty, exclude_ids = [] } = parsed.data;

  // Filter items by topic
  let candidates = itemBankData.items.filter(item => item.topic === topic);

  // Optionally filter by difficulty
  if (difficulty) {
    candidates = candidates.filter(item => item.difficulty === difficulty);
  }

  // Exclude already-seen items
  if (exclude_ids.length > 0) {
    candidates = candidates.filter(item => !exclude_ids.includes(item.id));
  }

  // Return null if no candidates
  if (candidates.length === 0) {
    return null;
  }

  // Select a random item
  const randomIndex = Math.floor(Math.random() * candidates.length);
  const selected = candidates[randomIndex];

  // Validate the selected item against schema
  const validated = ItemSchema.safeParse(selected);
  if (!validated.success) {
    console.error('Item bank contains invalid item:', selected.id, validated.error);
    return null;
  }

  return validated.data;
}

/**
 * Tool definition for Claude's tool use.
 */
export const getItemToolDefinition = {
  name: 'assessment_get_item',
  description: 'Retrieves a validated assessment question from the item bank. Returns a single MCQ item with stem, code snippet (if applicable), options, and feedback. Use this to present questions to users during an assessment session.',
  input_schema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        enum: ['js-this', 'js-closures', 'js-async', 'js-prototypes', 'js-timers', 'js-patterns', 'html-events'],
        description: 'The topic area for the question',
      },
      difficulty: {
        type: 'string',
        enum: ['easy', 'medium', 'hard'],
        description: 'Optional difficulty level. If not specified, returns any difficulty.',
      },
      exclude_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Item IDs to exclude (e.g., questions already asked in this session)',
      },
    },
    required: ['topic'],
  },
} as const;
