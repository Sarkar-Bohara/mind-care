import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';
import { communityPostSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const posts = await query(`
      SELECT p.*, 
             CASE WHEN p.is_anonymous THEN 'Anonymous' ELSE u.full_name END as author_name,
             u.role as author_role
      FROM community_posts p
      LEFT JOIN users u ON p.user_id = u.user_id
      WHERE p.status = 'approved'
      ORDER BY p.created_at DESC
      LIMIT 50
    `);

    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error('Get community posts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, category, isAnonymous } = communityPostSchema.parse(body);

    const post = await query(`
      INSERT INTO community_posts (user_id, title, content, category, is_anonymous, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *
    `, [user.id, title, content, category, isAnonymous]);

    return NextResponse.json({ 
      success: true, 
      post: post[0],
      message: 'Post submitted for moderation'
    });
  } catch (error) {
    console.error('Create community post error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}