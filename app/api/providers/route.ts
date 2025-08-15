import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providers = await query(`
      SELECT user_id, username, full_name, role, email, phone
      FROM users 
      WHERE role IN ('psychiatrist', 'counselor') AND is_active = true
      ORDER BY role, full_name
    `);

    return NextResponse.json({ success: true, providers });
  } catch (error) {
    console.error('Get providers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}