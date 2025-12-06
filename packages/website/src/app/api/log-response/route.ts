import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  logResponse,
  logGeneratedItem,
  getResponseStats,
  getRecentResponses,
  getRecentGeneratedItems
} from '@/lib/db';

const ResponseSchema = z.object({
  item_id: z.string(),
  selected: z.string(),
  correct: z.string(),
  is_correct: z.boolean(),
  latency_ms: z.number(),
  timestamp: z.string(),
  session_id: z.string(),
});

const GeneratedItemSchema = z.object({
  type: z.literal('generated_item'),
  item: z.object({
    id: z.string(),
    topic: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    stem: z.string(),
    code: z.string().optional(),
    options: z.array(z.object({
      id: z.string(),
      text: z.string(),
    })),
    correct: z.string(),
    feedback: z.object({
      correct: z.string(),
      incorrect: z.string(),
      explanation: z.string(),
    }),
  }),
  timestamp: z.string(),
  session_id: z.string(),
});

const LogRequestSchema = z.union([ResponseSchema, GeneratedItemSchema]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = LogRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if ('type' in data && data.type === 'generated_item') {
      // Log generated item
      await logGeneratedItem({
        session_id: data.session_id,
        item_id: data.item.id,
        item_data: data.item,
      });

      return NextResponse.json({
        success: true,
        type: 'generated_item',
        item_id: data.item.id
      });
    } else {
      // Log response
      const responseData = data as z.infer<typeof ResponseSchema>;
      await logResponse({
        session_id: responseData.session_id,
        item_id: responseData.item_id,
        selected: responseData.selected,
        correct: responseData.correct,
        is_correct: responseData.is_correct,
        latency_ms: responseData.latency_ms,
      });

      return NextResponse.json({
        success: true,
        type: 'response',
        item_id: responseData.item_id,
        is_correct: responseData.is_correct
      });
    }
  } catch (error) {
    console.error('Log API error:', error);
    return NextResponse.json(
      { error: 'Failed to log data' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = await getResponseStats();
    const recentResponses = await getRecentResponses(10);
    const recentGenerated = await getRecentGeneratedItems(5);

    return NextResponse.json({
      stats,
      recent_responses: recentResponses,
      recent_generated: recentGenerated,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}
