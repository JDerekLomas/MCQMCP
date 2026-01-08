import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cxzwclvkkjvkromubzmp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4endjbHZra2p2a3JvbXViem1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNTIxMzgsImV4cCI6MjA3OTcyODEzOH0.LzN3-4MjeCVFLzkZzhVLdkWBJR6Nq-_oxbdi4qOBZC8';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/items
 *
 * Query params:
 * - source: 'arc' | 'mmlu' | 'gsm8k'
 * - difficulty: 'easy' | 'medium' | 'hard'
 * - topic: string
 * - limit: number (default 1, max 100)
 * - random: boolean (default true)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const source = searchParams.get('source');
  const difficulty = searchParams.get('difficulty');
  const topic = searchParams.get('topic');
  const limit = Math.min(parseInt(searchParams.get('limit') || '1'), 100);
  const random = searchParams.get('random') !== 'false';

  let query = supabase.from('mcq_items').select('*');

  // Apply filters
  if (source) {
    query = query.eq('source', source);
  }
  if (difficulty) {
    query = query.eq('difficulty', difficulty);
  }
  if (topic) {
    query = query.eq('topic', topic);
  }

  // For random selection, get count and use random offset
  if (random && limit === 1) {
    // Get count for this query
    let countQuery = supabase.from('mcq_items').select('*', { count: 'exact', head: true });
    if (source) countQuery = countQuery.eq('source', source);
    if (difficulty) countQuery = countQuery.eq('difficulty', difficulty);
    if (topic) countQuery = countQuery.eq('topic', topic);

    const { count } = await countQuery;

    if (count && count > 0) {
      const randomOffset = Math.floor(Math.random() * count);
      query = query.range(randomOffset, randomOffset);
    }
  }

  const { data, error } = await query.limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform to cleaner format
  const items = (data || []).map(row => ({
    id: row.id,
    source: row.source,
    topic: row.topic,
    difficulty: row.difficulty,
    stem: row.stem,
    code: row.code,
    options: {
      A: row.option_a,
      B: row.option_b,
      C: row.option_c,
      D: row.option_d,
      E: row.option_e,
    },
    correct: row.correct,
    explanation: row.explanation,
    tags: row.tags,
  }));

  return NextResponse.json({
    count: items.length,
    items,
  });
}

/**
 * GET /api/items/stats
 * Returns counts by source
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  if (body.action === 'stats') {
    const stats: Record<string, number> = {};

    for (const source of ['arc', 'mmlu', 'gsm8k']) {
      const { count } = await supabase
        .from('mcq_items')
        .select('*', { count: 'exact', head: true })
        .eq('source', source);
      stats[source] = count || 0;
    }

    const { count: total } = await supabase
      .from('mcq_items')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      total: total || 0,
      by_source: stats,
    });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
