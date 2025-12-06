import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

export async function GET() {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Fetch mastery data
    const { data: mastery, error: masteryError } = await supabase
      .from('mastery')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (masteryError) throw masteryError;

    // Fetch recent responses
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (responsesError) throw responsesError;

    // Calculate stats
    const totalResponses = responses?.length || 0;
    const uniqueUsers = new Set(responses?.map((r) => r.user_id) || []).size;
    const correctResponses = responses?.filter((r) => r.is_correct).length || 0;
    const overallAccuracy = totalResponses > 0 ? Math.round((correctResponses / totalResponses) * 100) : 0;

    const latencies = responses?.filter((r) => r.latency_ms).map((r) => r.latency_ms as number) || [];
    const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

    // Calculate topic stats
    const topicMap = new Map<string, { correct: number; total: number }>();
    responses?.forEach((r) => {
      const current = topicMap.get(r.objective) || { correct: 0, total: 0 };
      current.total++;
      if (r.is_correct) current.correct++;
      topicMap.set(r.objective, current);
    });

    const topicStats = Array.from(topicMap.entries())
      .map(([topic, stats]) => ({
        topic,
        correct: stats.correct,
        total: stats.total,
        accuracy: Math.round((stats.correct / stats.total) * 100),
      }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      mastery: mastery || [],
      responses: responses || [],
      stats: {
        totalResponses,
        totalUsers: uniqueUsers,
        overallAccuracy,
        avgLatency,
      },
      topicStats,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
