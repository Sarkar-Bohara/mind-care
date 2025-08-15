// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { sendAppointmentStatusEmail } from "@/lib/emailService"

// GET - Get counselor's sessions
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "counselor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const date = searchParams.get("date")

    let query = `
      SELECT 
        a.appointment_id as id,
        p.full_name as client,
        a.type,
        a.appointment_date as date,
        a.appointment_time as time,
        a.duration_minutes,
        a.status,
        a.notes,
        p.email as patient_email,
        CASE 
          WHEN a.type = 'counseling' THEN 'Individual Counseling'
          WHEN a.type = 'psychiatry' THEN 'Psychiatry Session'
          WHEN a.type = 'telepsychiatry' THEN 'Telepsychiatry'
          ELSE a.type
        END as session_type
      FROM appointments a
      JOIN users p ON a.patient_id = p.user_id
      WHERE a.provider_id = $1
    `
    const params = [user.id]

    if (status) {
      query += ` AND a.status = $${params.length + 1}`
      params.push(status)
    }

    if (date) {
      query += ` AND DATE(a.appointment_date) = $${params.length + 1}`
      params.push(date)
    }

    query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`

    const result = await pool.query(query, params)
    
    // Transform the data to match frontend expectations
    const transformedSessions = result.rows.map(row => ({
      id: row.id,
      client: row.client,
      type: row.session_type,
      date: row.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      time: row.time.slice(0, 5), // Format as HH:MM
      duration: `${row.duration_minutes} min`,
      status: row.status,
      notes: row.notes || '',
      topic: row.notes ? row.notes.split('.')[0] : 'General Session' // Extract topic from notes or default
    }))

    return NextResponse.json({ sessions: transformedSessions })
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    )
  }
}

// POST - Create a new session
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "counselor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { patientId, appointmentDate, appointmentTime, type, notes } = await request.json()

    if (!patientId || !appointmentDate || !appointmentTime || !type) {
      return NextResponse.json(
        { error: "Patient ID, date, time, and type are required" },
        { status: 400 }
      )
    }

    // Check if patient exists
    const patientCheck = await pool.query(
      "SELECT user_id FROM users WHERE user_id = $1 AND role = 'patient' AND is_active = true",
      [patientId]
    )

    if (patientCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      )
    }

    // Check for scheduling conflicts
    const conflictCheck = await pool.query(`
      SELECT appointment_id FROM appointments 
      WHERE provider_id = $1 
        AND appointment_date = $2 
        AND appointment_time = $3 
        AND status NOT IN ('cancelled', 'completed')
    `, [user.id, appointmentDate, appointmentTime])

    if (conflictCheck.rows.length > 0) {
      return NextResponse.json(
        { error: "Time slot already booked" },
        { status: 409 }
      )
    }

    const result = await pool.query(`
      INSERT INTO appointments (
        patient_id, provider_id, appointment_date, appointment_time, 
        type, notes, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', NOW())
      RETURNING *
    `, [patientId, user.id, appointmentDate, appointmentTime, type, notes || null])

    return NextResponse.json({
      success: true,
      message: "Session created successfully",
      session: result.rows[0]
    })
  } catch (error) {
    console.error("Error creating session:", error)
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    )
  }
}

// PUT - Update session notes or status
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "counselor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sessionId, notes, status } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      )
    }

    // Verify session belongs to this counselor
    const sessionCheck = await pool.query(
      "SELECT appointment_id FROM appointments WHERE appointment_id = $1 AND provider_id = $2",
      [sessionId, user.id]
    )

    if (sessionCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Session not found or unauthorized" },
        { status: 404 }
      )
    }

    let updateQuery = "UPDATE appointments SET updated_at = NOW()"
    const params = []
    let paramCount = 0

    if (notes !== undefined) {
      paramCount++
      updateQuery += `, notes = $${paramCount}`
      params.push(notes)
    }

    if (status !== undefined) {
      paramCount++
      updateQuery += `, status = $${paramCount}`
      params.push(status)
    }

    if (paramCount === 0) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 }
      )
    }

    paramCount++
    updateQuery += ` WHERE appointment_id = $${paramCount} RETURNING *`
    params.push(sessionId)

    const result = await pool.query(updateQuery, params)

    // Send email notification if status was updated
    if (status !== undefined) {
      try {
        // Get patient and appointment details for email
        const emailQuery = await pool.query(`
          SELECT 
            u.email as patient_email,
            u.full_name as patient_name,
            a.appointment_date,
            a.appointment_time,
            a.type,
            p.full_name as provider_name
          FROM appointments a
          JOIN users u ON a.patient_id = u.user_id
          JOIN users p ON a.provider_id = p.user_id
          WHERE a.appointment_id = $1
        `, [sessionId])

        if (emailQuery.rows.length > 0) {
          const emailData = emailQuery.rows[0]
          await sendAppointmentStatusEmail({
            patientEmail: emailData.patient_email,
            patientName: emailData.patient_name,
            providerName: emailData.provider_name,
            appointmentDate: emailData.appointment_date.toISOString().split('T')[0],
            appointmentTime: emailData.appointment_time.slice(0, 5),
            sessionType: emailData.type,
            status: status
          })
        }
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Session updated successfully",
      session: result.rows[0]
    })
  } catch (error) {
    console.error("Error updating session:", error)
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    )
  }
}