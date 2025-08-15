import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';
import { moodEntrySchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entries = await query(`
      SELECT * FROM mood_entries 
      WHERE user_id = $1 
      ORDER BY entry_date DESC, created_at DESC
      LIMIT 30
    `, [user.id]);

    return NextResponse.json({ success: true, entries });
  } catch (error) {
    console.error('Get mood entries error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { moodScore, anxietyLevel, stressLevel, sleepHours, notes, entryDate } = moodEntrySchema.parse(body);

    const entry = await query(`
      INSERT INTO mood_entries (user_id, mood_score, anxiety_level, stress_level, sleep_hours, notes, entry_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [user.id, moodScore, anxietyLevel, stressLevel, sleepHours, notes, entryDate]);

    return NextResponse.json({ success: true, entry: entry[0] });
  } catch (error) {
    console.error('Create mood entry error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}