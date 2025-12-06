import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';

/**
 * POST /api/db/init
 * Initialize database tables
 * Call this once after creating the Vercel Postgres database
 */
export async function POST() {
  try {
    await initDatabase();
    return NextResponse.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Database init error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database', details: String(error) },
      { status: 500 }
    );
  }
}
