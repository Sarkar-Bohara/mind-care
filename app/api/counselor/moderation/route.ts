import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"

// GET - Get pending posts for moderation
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "counselor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get posts that need moderation (status = 'pending')
    const result = await pool.query(`
      SELECT 
        p.*,
        u.full_name as author_name,
        u.username as author_username
      FROM community_posts p
      LEFT JOIN users u ON p.user_id = u.user_id
      WHERE p.status = 'pending'
      ORDER BY p.created_at DESC
    `)

    return NextResponse.json({ posts: result.rows })
  } catch (error) {
    console.error("Error fetching pending posts:", error)
    return NextResponse.json(
      { error: "Failed to fetch pending posts" },
      { status: 500 }
    )
  }
}

// POST - Approve or reject a post
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "counselor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { postId, action, reason } = await request.json()

    if (!postId || !action) {
      return NextResponse.json(
        { error: "Post ID and action are required" },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'approve' or 'reject'" },
        { status: 400 }
      )
    }

    const status = action === 'approve' ? 'approved' : 'rejected'
    
    const result = await pool.query(`
      UPDATE community_posts 
      SET 
        status = $1,
        moderated_by = $2,
        moderated_at = NOW()
      WHERE post_id = $3 AND status = 'pending'
      RETURNING *
    `, [status, user.id, postId])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Post not found or already moderated" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Post ${action}d successfully`,
      post: result.rows[0]
    })
  } catch (error) {
    console.error("Error moderating post:", error)
    return NextResponse.json(
      { error: "Failed to moderate post" },
      { status: 500 }
    )
  }
}

// PUT - Edit a post content
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "counselor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { postId, title, content } = await request.json()

    if (!postId || !title || !content) {
      return NextResponse.json(
        { error: "Post ID, title, and content are required" },
        { status: 400 }
      )
    }

    const result = await pool.query(`
      UPDATE community_posts 
      SET 
        title = $1,
        content = $2,
        updated_at = NOW()
      WHERE post_id = $3
      RETURNING *
    `, [title, content, postId])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Post updated successfully",
      post: result.rows[0]
    })
  } catch (error) {
    console.error("Error updating post:", error)
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a post
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "counselor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get("postId")

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      )
    }

    const result = await pool.query(`
      DELETE FROM community_posts 
      WHERE post_id = $1
      RETURNING *
    `, [postId])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting post:", error)
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    )
  }
}