import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resources = await query(`
      SELECT r.*, u.full_name as author_name
      FROM resources r
      LEFT JOIN users u ON r.author_id = u.user_id
      WHERE r.is_published = true
      ORDER BY r.is_featured DESC, r.created_at DESC
    `);

    return NextResponse.json({ success: true, resources });
  } catch (error) {
    console.error('Get resources error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || !['psychiatrist', 'counselor', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, content, category, type } = body;

    const resource = await query(`
      INSERT INTO resources (title, description, content, category, type, author_id, is_published)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING *
    `, [title, description, content, category, type, user.id]);

    return NextResponse.json({ success: true, resource: resource[0] });
  } catch (error) {
    console.error('Create resource error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}