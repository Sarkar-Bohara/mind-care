import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/database'

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || (user.role !== 'psychiatrist' && user.role !== 'counselor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { patientId, treatmentGoal, sessionFrequency } = await request.json()

    if (!patientId || !treatmentGoal || !sessionFrequency) {
      return NextResponse.json({ error: 'Patient ID, treatment goal, and session frequency are required' }, { status: 400 })
    }

    // Check if treatment plan exists
    const existingPlan = await query(
      'SELECT * FROM treatment_plans WHERE patient_id = $1',
      [patientId]
    )

    if (existingPlan.length > 0) {
      // Update existing treatment plan
      await query(
        `UPDATE treatment_plans 
         SET treatment_goal = $1, session_frequency = $2, updated_by = $3, updated_at = NOW()
         WHERE patient_id = $4`,
        [treatmentGoal, sessionFrequency, user.id, patientId]
      )
    } else {
      // Create new treatment plan
      await query(
        `INSERT INTO treatment_plans (patient_id, treatment_goal, session_frequency, created_by, updated_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [patientId, treatmentGoal, sessionFrequency, user.id, user.id]
      )
    }

    // Log the treatment plan update
    await query(
      `INSERT INTO clinical_notes (patient_id, provider_id, note_content, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [
        patientId, 
        user.id, 
        `Treatment plan updated: Goal - ${treatmentGoal}, Frequency - ${sessionFrequency}`
      ]
    )

    return NextResponse.json({ 
      success: true,
      message: 'Treatment plan updated successfully' 
    })

  } catch (error) {
    console.error('Error updating treatment plan:', error)
    return NextResponse.json(
      { error: 'Failed to update treatment plan' },
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

    // Get treatment plan for the patient
    const treatmentPlan = await query(
      `SELECT tp.*, u.full_name as updated_by_name
       FROM treatment_plans tp
       LEFT JOIN users u ON tp.updated_by = u.user_id
       WHERE tp.patient_id = $1`,
      [patientId]
    )

    return NextResponse.json({ 
      treatmentPlan: treatmentPlan.length > 0 ? treatmentPlan[0] : null 
    })

  } catch (error) {
    console.error('Error fetching treatment plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch treatment plan' },
      { status: 500 }
    )
  }
}