import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'

// POST - Mark messages as read
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId } = await request.json()

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    // Mark messages as read for the current user
    const markReadQuery = `
      UPDATE messages 
      SET is_read = true 
      WHERE conversation_id = $1 AND receiver_id = $2 AND is_read = false
    `
    
    const result = await pool.query(markReadQuery, [conversationId, user.user_id])
    
    return NextResponse.json({
      success: true,
      messagesMarked: result.rowCount
    })
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    )
  }
}