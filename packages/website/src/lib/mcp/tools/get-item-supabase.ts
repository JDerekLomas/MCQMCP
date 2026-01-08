import { createClient } from '@supabase/supabase-js';
import { DifficultySchema, type Item, type Difficulty } from '../schemas/item';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cxzwclvkkjvkromubzmp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

interface McqItem {
  id: string;
  source: string;
  topic: string | null;
  difficulty: string | null;
  stem: string;
  code: string | null;
  option_a: string;
  option_b: string;
  option_c: string | null;
  option_d: string | null;
  option_e: string | null;
  correct: string;
  explanation: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
}

/**
 * Transform a Supabase mcq_items row to the app's Item schema
 */
function transformToItem(row: McqItem): Item {
  const options = [
    { id: 'A', text: row.option_a },
    { id: 'B', text: row.option_b },
    { id: 'C', text: row.option_c || 'N/A' },
    { id: 'D', text: row.option_d || 'N/A' },
  ];

  // Validate difficulty or default to 'medium'
  const difficultyResult = DifficultySchema.safeParse(row.difficulty);
  const difficulty: Difficulty = difficultyResult.success ? difficultyResult.data : 'medium';

  return {
    id: row.id,
    topic: row.topic || row.source || 'general',
    difficulty,
    stem: row.stem,
    code: row.code || undefined,
    options,
    correct: row.correct,
    feedback: {
      correct: 'Correct!',
      incorrect: `The correct answer is ${row.correct}.`,
      explanation: row.explanation || `The answer is ${row.correct}.`,
    },
    tags: row.tags || undefined,
    provenance: {
      source: row.source,
    },
    _raw: row.metadata || undefined,
  };
}

export interface GetItemFromSupabaseInput {
  source?: string;       // 'arc', 'mmlu', 'gsm8k'
  topic?: string;        // Topic filter
  difficulty?: Difficulty;
  exclude_ids?: string[];
  limit?: number;
}

/**
 * Fetch a random item from Supabase mcq_items table
 */
export async function getItemFromSupabase(input: GetItemFromSupabaseInput): Promise<Item | null> {
  let query = supabase.from('mcq_items').select('*');

  // Apply filters
  if (input.source) {
    query = query.eq('source', input.source);
  }
  if (input.topic) {
    query = query.eq('topic', input.topic);
  }
  if (input.difficulty) {
    query = query.eq('difficulty', input.difficulty);
  }
  if (input.exclude_ids && input.exclude_ids.length > 0) {
    query = query.not('id', 'in', `(${input.exclude_ids.join(',')})`);
  }

  // Get count first
  const { count } = await supabase
    .from('mcq_items')
    .select('*', { count: 'exact', head: true });

  if (!count || count === 0) {
    return null;
  }

  // Get a random offset
  const randomOffset = Math.floor(Math.random() * Math.min(count, 1000));

  const { data, error } = await query
    .range(randomOffset, randomOffset)
    .limit(1);

  if (error) {
    console.error('Supabase fetch error:', error.message);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return transformToItem(data[0] as McqItem);
}

/**
 * Fetch multiple items from Supabase
 */
export async function getItemsFromSupabase(input: GetItemFromSupabaseInput & { limit: number }): Promise<Item[]> {
  let query = supabase.from('mcq_items').select('*');

  if (input.source) {
    query = query.eq('source', input.source);
  }
  if (input.topic) {
    query = query.eq('topic', input.topic);
  }
  if (input.difficulty) {
    query = query.eq('difficulty', input.difficulty);
  }

  const { data, error } = await query.limit(input.limit);

  if (error) {
    console.error('Supabase fetch error:', error.message);
    return [];
  }

  return (data || []).map((row) => transformToItem(row as McqItem));
}

/**
 * Get available sources and their counts
 */
export async function getSourceStats(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('sources')
    .select('id, item_count');

  if (error) {
    console.error('Supabase sources error:', error.message);
    return {};
  }

  const stats: Record<string, number> = {};
  for (const row of data || []) {
    stats[row.id] = row.item_count || 0;
  }
  return stats;
}

/**
 * Tool definition for Supabase-based item fetching
 */
export const getItemSupabaseToolDefinition = {
  name: 'assessment_get_item_supabase',
  description: 'Retrieves an assessment question from the Supabase item bank. Returns a single MCQ item from ARC (science), MMLU (math), or GSM8K (word problems) datasets.',
  input_schema: {
    type: 'object',
    properties: {
      source: {
        type: 'string',
        enum: ['arc', 'mmlu', 'gsm8k'],
        description: 'The source dataset: arc (science), mmlu (math), gsm8k (word problems)',
      },
      difficulty: {
        type: 'string',
        enum: ['easy', 'medium', 'hard'],
        description: 'Optional difficulty level',
      },
      exclude_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Item IDs to exclude (already asked)',
      },
    },
    required: [],
  },
} as const;
