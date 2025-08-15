import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/database'

// GET - Get conversations and messages for a user
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (conversationId) {
      // Get messages for a specific conversation
      const messagesQuery = `
        SELECT 
          m.message_id as "id",
          m.sender_id as "senderId",
          m.receiver_id as "receiverId",
          u.full_name as "senderName",
          u.role as "senderType",
          m.content,
          m.is_read as "read",
          m.created_at as "timestamp"
        FROM messages m
        JOIN users u ON m.sender_id = u.user_id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at ASC
      `
      
      const messagesResult = await query(messagesQuery, [conversationId])
      
      // Mark messages as read if the current user is the receiver
      const markReadQuery = `
        UPDATE messages 
        SET is_read = true 
        WHERE conversation_id = $1 AND receiver_id = $2 AND is_read = false
      `
      await query(markReadQuery, [conversationId, user.id])
      
      return NextResponse.json({ messages: messagesResult })
    } else {
      // Get all conversations for the user
      let conversationsQuery
      let queryParams
      
      if (user.role === 'psychiatrist') {
        conversationsQuery = `
          SELECT 
            c.conversation_id as "id",
            c.patient_id as "patientId",
            p.full_name as "patientName",
            COALESCE(lm.content, 'No messages yet') as "lastMessage",
            COALESCE(c.last_message_at, c.created_at) as "lastMessageTime",
            COALESCE(unread.count, 0) as "unreadCount"
          FROM conversations c
          JOIN users p ON c.patient_id = p.user_id
          LEFT JOIN messages lm ON c.last_message_id = lm.message_id
          LEFT JOIN (
            SELECT conversation_id, COUNT(*) as count
            FROM messages 
            WHERE receiver_id = $1 AND is_read = false
            GROUP BY conversation_id
          ) unread ON c.conversation_id = unread.conversation_id
          WHERE c.psychiatrist_id = $1
          ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
        `
        queryParams = [user.id]
      } else {
        conversationsQuery = `
          SELECT 
            c.conversation_id as "id",
            c.psychiatrist_id as "psychiatristId",
            ps.full_name as "psychiatristName",
            COALESCE(lm.content, 'No messages yet') as "lastMessage",
            COALESCE(c.last_message_at, c.created_at) as "lastMessageTime",
            COALESCE(unread.count, 0) as "unreadCount"
          FROM conversations c
          JOIN users ps ON c.psychiatrist_id = ps.user_id
          LEFT JOIN messages lm ON c.last_message_id = lm.message_id
          LEFT JOIN (
            SELECT conversation_id, COUNT(*) as count
            FROM messages 
            WHERE receiver_id = $1 AND is_read = false
            GROUP BY conversation_id
          ) unread ON c.conversation_id = unread.conversation_id
          WHERE c.patient_id = $1
          ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
        `
        queryParams = [user.id]
      }
      
      const conversationsResult = await query(conversationsQuery, queryParams)
      
      return NextResponse.json({ conversations: conversationsResult })
    }
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { receiverId, content, conversationId } = await request.json()

    if (!receiverId || !content) {
      return NextResponse.json(
        { error: 'Receiver ID and content are required' },
        { status: 400 }
      )
    }

    // Verify receiver exists and has appropriate role
    const receiverQuery = 'SELECT user_id, role FROM users WHERE user_id = $1 AND is_active = true'
    const receiverResult = await query(receiverQuery, [receiverId])
    
    if (receiverResult.length === 0) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      )
    }

    const receiver = receiverResult[0]
    
    // Determine conversation ID
    let finalConversationId = conversationId
    if (!finalConversationId) {
      if (user.role === 'patient' && receiver.role === 'psychiatrist') {
        finalConversationId = `${user.id}-${receiverId}`
      } else if (user.role === 'psychiatrist' && receiver.role === 'patient') {
        finalConversationId = `${receiverId}-${user.id}`
      } else {
        return NextResponse.json(
          { error: 'Invalid conversation participants' },
          { status: 400 }
        )
      }
    }

    // Create conversation if it doesn't exist
    const conversationCheckQuery = 'SELECT conversation_id FROM conversations WHERE conversation_id = $1'
    const conversationExists = await query(conversationCheckQuery, [finalConversationId])
    
    if (conversationExists.length === 0) {
      const patientId = user.role === 'patient' ? user.id : receiverId
      const psychiatristId = user.role === 'psychiatrist' ? user.id : receiverId
      
      const createConversationQuery = `
        INSERT INTO conversations (conversation_id, patient_id, psychiatrist_id, created_at, updated_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
      await query(createConversationQuery, [finalConversationId, patientId, psychiatristId])
    }

    // Insert the message
    const insertMessageQuery = `
      INSERT INTO messages (conversation_id, sender_id, receiver_id, content, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING message_id, created_at
    `
    const messageResult = await query(insertMessageQuery, [
      finalConversationId,
      user.id,
      receiverId,
      content
    ])

    const newMessage = messageResult[0]

    // Update conversation's last message
    const updateConversationQuery = `
      UPDATE conversations 
      SET last_message_id = $1, last_message_at = $2, updated_at = $2
      WHERE conversation_id = $3
    `
    await query(updateConversationQuery, [
      newMessage.message_id,
      newMessage.created_at,
      finalConversationId
    ])

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.message_id,
        senderId: user.id,
        receiverId: receiverId,
        senderName: user.full_name,
        senderType: user.role,
        content: content,
        read: false,
        timestamp: newMessage.created_at
      }
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}