import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import pool from "@/lib/db"

// POST /api/resources/like - Handle resource likes/unlikes
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { resourceId } = await request.json()
    
    if (!resourceId) {
      return NextResponse.json(
        { success: false, error: 'Resource ID is required' },
        { status: 400 }
      )
    }

    // Check if resource exists
    const resourceResult = await pool.query(
      'SELECT resource_id FROM resources WHERE resource_id = $1 AND is_published = true',
      [resourceId]
    )

    if (resourceResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Create resource_likes table if it doesn't exist
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS resource_likes (
          like_id SERIAL PRIMARY KEY,
          resource_id INTEGER REFERENCES resources(resource_id),
          user_id INTEGER REFERENCES users(user_id),
          liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(resource_id, user_id)
        )
      `)
    } catch (error) {
      // Table might already exist, continue
    }

    // Check if user already liked this resource
    const existingLike = await pool.query(
      'SELECT like_id FROM resource_likes WHERE resource_id = $1 AND user_id = $2',
      [resourceId, user.id]
    )

    let isLiked = false
    let totalLikes = 0

    if (existingLike.rows.length > 0) {
      // Unlike the resource
      await pool.query(
        'DELETE FROM resource_likes WHERE resource_id = $1 AND user_id = $2',
        [resourceId, user.id]
      )
      isLiked = false
    } else {
      // Like the resource
      await pool.query(
        'INSERT INTO resource_likes (resource_id, user_id) VALUES ($1, $2)',
        [resourceId, user.id]
      )
      isLiked = true
    }

    // Get total likes for this resource
    const likesResult = await pool.query(
      'SELECT COUNT(*) as count FROM resource_likes WHERE resource_id = $1',
      [resourceId]
    )
    totalLikes = parseInt(likesResult.rows[0].count)

    return NextResponse.json({
      success: true,
      isLiked,
      totalLikes,
      message: isLiked ? 'Resource liked' : 'Resource unliked'
    })

  } catch (error) {
    console.error('Like operation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/resources/like - Get like status for a resource
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const resourceId = searchParams.get('resourceId')
    
    if (!resourceId) {
      return NextResponse.json(
        { success: false, error: 'Resource ID is required' },
        { status: 400 }
      )
    }

    // Check if user liked this resource
    const likeResult = await pool.query(
      'SELECT like_id FROM resource_likes WHERE resource_id = $1 AND user_id = $2',
      [resourceId, user.id]
    )

    // Get total likes for this resource
    const likesResult = await pool.query(
      'SELECT COUNT(*) as count FROM resource_likes WHERE resource_id = $1',
      [resourceId]
    )

    return NextResponse.json({
      success: true,
      isLiked: likeResult.rows.length > 0,
      totalLikes: parseInt(likesResult.rows[0].count)
    })

  } catch (error) {
    console.error('Get like status error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}