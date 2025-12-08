import { matchTopic, shouldUseItemBank, MATCH_THRESHOLD } from '../topic-matcher';
import itemBankData from '../item-bank.json';

// Get unique topics from item bank
const allTopics = [...new Set(itemBankData.items.map(item => item.topic))];

// Index items by topic
const itemsByTopic: Record<string, typeof itemBankData.items> = {};
for (const item of itemBankData.items) {
  if (!itemsByTopic[item.topic]) {
    itemsByTopic[item.topic] = [];
  }
  itemsByTopic[item.topic].push(item);
}

export interface MatchTopicInput {
  objective: string;
}

export interface MatchTopicResult {
  objective: string;
  matched_topic: string | null;
  confidence: number;
  match_type: 'exact' | 'alias' | 'fuzzy' | 'keyword' | 'none';
  has_items: boolean;
  item_count: number;
  will_use_item_bank: boolean;
  alternatives?: Array<{ topic: string; confidence: number }>;
  threshold: number;
}

/**
 * Match an objective to an existing topic in the item bank.
 * This is a preflight check to see if we have content for an objective.
 */
export function matchTopicTool(input: MatchTopicInput): MatchTopicResult {
  const { objective } = input;
  const match = matchTopic(objective, allTopics);
  const hasItems = match.topic ? (itemsByTopic[match.topic]?.length ?? 0) > 0 : false;

  return {
    objective,
    matched_topic: match.topic,
    confidence: match.confidence,
    match_type: match.matchType,
    has_items: hasItems,
    item_count: match.topic ? (itemsByTopic[match.topic]?.length ?? 0) : 0,
    will_use_item_bank: shouldUseItemBank(match) && hasItems,
    alternatives: match.alternatives,
    threshold: MATCH_THRESHOLD,
  };
}

/**
 * Tool definition for Claude's tool use.
 */
export const matchTopicToolDefinition = {
  name: 'assessment_match_topic',
  description: 'Check if a learning objective matches an existing topic in the item bank. Use this as a preflight check before requesting questions to see if content exists.',
  input_schema: {
    type: 'object',
    properties: {
      objective: {
        type: 'string',
        description: 'The learning objective or topic to match (e.g., "JavaScript closures", "React hooks", "calculus")',
      },
    },
    required: ['objective'],
  },
} as const;
