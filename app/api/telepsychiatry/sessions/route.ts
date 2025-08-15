import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/database'

// GET - Get telepsychiatry sessions for psychiatrist
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== 'psychiatrist') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Get today's appointments for telepsychiatry
    const sessionsQuery = `
      SELECT 
        a.appointment_id as id,
        p.full_name as patient_name,
        a.appointment_date,
        a.appointment_time,
        a.duration_minutes,
        a.type as appointment_type,
        a.status,
        p.user_id as patient_id,
        a.notes
      FROM appointments a
      JOIN users p ON a.patient_id = p.user_id
      WHERE a.provider_id = $1 
        AND a.appointment_date = $2
        AND a.type IN ('individual', 'family')
      ORDER BY a.appointment_time ASC
    `

    const sessions = await query(sessionsQuery, [user.id, date])

    // Get system status
    const statusQuery = `
      SELECT 
        COUNT(*) as total_today,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as waiting,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as active
      FROM appointments 
      WHERE provider_id = $1 
        AND appointment_date = $2
        AND type IN ('individual', 'family')
    `

    const statusResult = await query(statusQuery, [user.id, date])
    const status = statusResult[0] || { total_today: 0, waiting: 0, active: 0 }

    return NextResponse.json({
      sessions: sessions.map(session => ({
        id: session.id,
        patient_name: session.patient_name,
        appointment_time: `${session.appointment_date}T${session.appointment_time}`,
        duration: `${session.duration_minutes} min`,
        appointment_type: session.appointment_type,
        status: session.status === 'confirmed' ? 'waiting' : 
                session.status === 'scheduled' ? 'scheduled' : session.status,
        patient_id: session.patient_id,
        notes: session.notes
      })),
      systemStatus: {
        totalToday: parseInt(status.total_today),
        waiting: parseInt(status.waiting),
        active: parseInt(status.active)
      }
    })

  } catch (error) {
    console.error('Error fetching telepsychiatry sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

// POST - Start a telepsychiatry session
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== 'psychiatrist') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { sessionId, action } = await request.json()

    if (!sessionId || !action) {
      return NextResponse.json(
        { error: 'Session ID and action are required' },
        { status: 400 }
      )
    }

    let newStatus
    switch (action) {
      case 'start':
        newStatus = 'confirmed' // Use 'confirmed' to indicate active session
        break
      case 'end':
        newStatus = 'completed'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Update appointment status
    await query(
      `UPDATE appointments 
       SET status = $1, updated_at = NOW()
       WHERE appointment_id = $2 AND provider_id = $3`,
      [newStatus, sessionId, user.id]
    )

    // Log session action
    await query(
      `INSERT INTO clinical_notes (patient_id, provider_id, note_content, created_at)
       SELECT patient_id, $1, $2, NOW()
       FROM appointments 
       WHERE appointment_id = $3`,
      [
        user.id,
        `Telepsychiatry session ${action}ed at ${new Date().toLocaleString()}`,
        sessionId
      ]
    )

    return NextResponse.json({ 
      success: true, 
      message: `Session ${action}ed successfully`,
      newStatus 
    })

  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}