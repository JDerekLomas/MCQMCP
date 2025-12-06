import { sql } from '@vercel/postgres';
import type { UserContext } from '@/lib/storage/schemas';

/**
 * Initialize database tables
 * Call this once on first deployment
 */
export async function initDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS user_contexts (
      session_id VARCHAR(255) PRIMARY KEY,
      context JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS assessment_responses (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      item_id VARCHAR(255) NOT NULL,
      selected VARCHAR(10) NOT NULL,
      correct VARCHAR(10) NOT NULL,
      is_correct BOOLEAN NOT NULL,
      latency_ms INTEGER NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS generated_items (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      item_id VARCHAR(255) NOT NULL,
      item_data JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_responses_session ON assessment_responses(session_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_responses_item ON assessment_responses(item_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_generated_session ON generated_items(session_id)`;
}

/**
 * Get user context by session ID
 */
export async function getUserContext(sessionId: string): Promise<UserContext | null> {
  const result = await sql`
    SELECT context FROM user_contexts WHERE session_id = ${sessionId}
  `;

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].context as UserContext;
}

/**
 * Save or update user context
 */
export async function saveUserContext(sessionId: string, context: UserContext): Promise<void> {
  await sql`
    INSERT INTO user_contexts (session_id, context, updated_at)
    VALUES (${sessionId}, ${JSON.stringify(context)}, NOW())
    ON CONFLICT (session_id)
    DO UPDATE SET context = ${JSON.stringify(context)}, updated_at = NOW()
  `;
}

/**
 * Log an assessment response
 */
export async function logResponse(data: {
  session_id: string;
  item_id: string;
  selected: string;
  correct: string;
  is_correct: boolean;
  latency_ms: number;
}): Promise<void> {
  await sql`
    INSERT INTO assessment_responses (session_id, item_id, selected, correct, is_correct, latency_ms)
    VALUES (${data.session_id}, ${data.item_id}, ${data.selected}, ${data.correct}, ${data.is_correct}, ${data.latency_ms})
  `;
}

/**
 * Log a generated item
 */
export async function logGeneratedItem(data: {
  session_id: string;
  item_id: string;
  item_data: Record<string, unknown>;
}): Promise<void> {
  await sql`
    INSERT INTO generated_items (session_id, item_id, item_data)
    VALUES (${data.session_id}, ${data.item_id}, ${JSON.stringify(data.item_data)})
  `;
}

/**
 * Get response statistics
 */
export async function getResponseStats() {
  const totalResult = await sql`SELECT COUNT(*) as count FROM assessment_responses`;
  const correctResult = await sql`SELECT COUNT(*) as count FROM assessment_responses WHERE is_correct = true`;
  const generatedResult = await sql`SELECT COUNT(*) as count FROM generated_items`;

  const total = parseInt(totalResult.rows[0].count);
  const correct = parseInt(correctResult.rows[0].count);

  return {
    total_responses: total,
    correct_responses: correct,
    accuracy_percent: total > 0 ? ((correct / total) * 100).toFixed(1) : '0',
    generated_items_count: parseInt(generatedResult.rows[0].count),
  };
}

/**
 * Get recent responses
 */
export async function getRecentResponses(limit = 10) {
  const result = await sql`
    SELECT session_id, item_id, selected, correct, is_correct, latency_ms, created_at
    FROM assessment_responses
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return result.rows;
}

/**
 * Get recent generated items
 */
export async function getRecentGeneratedItems(limit = 5) {
  const result = await sql`
    SELECT session_id, item_id, item_data, created_at
    FROM generated_items
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return result.rows;
}
