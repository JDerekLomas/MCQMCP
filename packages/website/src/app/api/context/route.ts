import { NextRequest, NextResponse } from 'next/server';
import {
  UserContextSchema,
  createEmptyUserContext,
  type UserContext
} from '@/lib/storage/schemas';
import { getUserContext, saveUserContext } from '@/lib/db';

/**
 * GET /api/context?sessionId=xxx
 * Retrieves user context for a session
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const context = await getUserContext(sessionId);

    if (!context) {
      return NextResponse.json(createEmptyUserContext(sessionId));
    }

    const validated = UserContextSchema.safeParse(context);
    if (!validated.success) {
      console.warn('Invalid stored context, returning fresh:', validated.error);
      return NextResponse.json(createEmptyUserContext(sessionId));
    }

    return NextResponse.json(validated.data);
  } catch (error) {
    console.error('Get context error:', error);
    return NextResponse.json(
      { error: 'Failed to get context' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/context
 * Saves user context
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = UserContextSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid context data', details: validated.error.issues },
        { status: 400 }
      );
    }

    const context: UserContext = {
      ...validated.data,
      updatedAt: new Date().toISOString(),
    };

    await saveUserContext(context.sessionId, context);

    return NextResponse.json({ success: true, sessionId: context.sessionId });
  } catch (error) {
    console.error('Save context error:', error);
    return NextResponse.json(
      { error: 'Failed to save context' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/context
 * Partially updates user context (merges with existing)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, ...updates } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Load existing or create new
    const existingContext = await getUserContext(sessionId) || createEmptyUserContext(sessionId);

    // Merge updates
    const updatedContext: UserContext = {
      ...existingContext,
      ...updates,
      // Deep merge learnerProfile if provided
      learnerProfile: updates.learnerProfile
        ? { ...existingContext.learnerProfile, ...updates.learnerProfile }
        : existingContext.learnerProfile,
      updatedAt: new Date().toISOString(),
    };

    // Validate merged result
    const validated = UserContextSchema.safeParse(updatedContext);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid merged context', details: validated.error.issues },
        { status: 400 }
      );
    }

    await saveUserContext(sessionId, validated.data);

    return NextResponse.json({ success: true, context: validated.data });
  } catch (error) {
    console.error('Patch context error:', error);
    return NextResponse.json(
      { error: 'Failed to update context' },
      { status: 500 }
    );
  }
}
