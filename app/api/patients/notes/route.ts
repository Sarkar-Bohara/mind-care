import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || (user.role !== 'psychiatrist' && user.role !== 'counselor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { patientId, note } = await request.json()

    if (!patientId || !note) {
      return NextResponse.json({ error: 'Patient ID and note are required' }, { status: 400 })
    }

    // Insert the clinical note
    const result = await query(
      `INSERT INTO clinical_notes (patient_id, provider_id, note_content, created_at) 
       VALUES ($1, $2, $3, NOW()) RETURNING note_id`,
      [patientId, user.id, note]
    )

    return NextResponse.json({ 
      success: true, 
      noteId: result[0]?.note_id,
      message: 'Note saved successfully' 
    })

  } catch (error) {
    console.error('Error saving note:', error)
    return NextResponse.json(
      { error: 'Failed to save note' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || (user.role !== 'psychiatrist' && user.role !== 'counselor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
    }

    // Get clinical notes for the patient
    const notes = await query(
      `SELECT cn.*, u.full_name as provider_name
       FROM clinical_notes cn
       JOIN users u ON cn.provider_id = u.user_id
       WHERE cn.patient_id = $1
       ORDER BY cn.created_at DESC
       LIMIT 10`,
      [patientId]
    )

    return NextResponse.json({ notes })

  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}