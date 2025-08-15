// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { sendCustomEmail } from "@/lib/emailService"

// POST - Send custom email to patient
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "counselor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { patientId, subject, message, appointmentId } = await request.json()

    if (!patientId || !subject || !message) {
      return NextResponse.json(
        { error: "Patient ID, subject, and message are required" },
        { status: 400 }
      )
    }

    // Get patient details
    const patientQuery = await pool.query(
      "SELECT email, full_name FROM users WHERE user_id = $1 AND role = 'patient' AND is_active = true",
      [patientId]
    )

    if (patientQuery.rows.length === 0) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      )
    }

    const patient = patientQuery.rows[0]

    // Get counselor details
    const counselorQuery = await pool.query(
      "SELECT full_name FROM users WHERE user_id = $1",
      [user.id]
    )

    const counselorName = counselorQuery.rows[0]?.full_name || "Your Counselor"

    // Send custom email
    await sendCustomEmail({
      patientEmail: patient.email,
      patientName: patient.full_name,
      counselorName: counselorName,
      subject: subject,
      message: message,
      appointmentId: appointmentId
    })

    // Log the email in database (optional)
    if (appointmentId) {
      await pool.query(`
        INSERT INTO email_logs (appointment_id, sender_id, recipient_email, subject, message, sent_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [appointmentId, user.id, patient.email, subject, message])
    }

    return NextResponse.json({
      success: true,
      message: "Email sent successfully"
    })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    )
  }
}

// GET - Get email history for a patient or appointment
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "counselor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const appointmentId = searchParams.get('appointmentId')

    let query = `
      SELECT 
        el.id,
        el.subject,
        el.message,
        el.sent_at,
        u.full_name as recipient_name,
        u.email as recipient_email
      FROM email_logs el
      JOIN users u ON el.recipient_email = u.email
      WHERE el.sender_id = $1
    `
    const params = [user.id]

    if (appointmentId) {
      query += ` AND el.appointment_id = $${params.length + 1}`
      params.push(appointmentId)
    } else if (patientId) {
      query += ` AND u.user_id = $${params.length + 1}`
      params.push(patientId)
    }

    query += ` ORDER BY el.sent_at DESC LIMIT 50`

    const result = await pool.query(query, params)

    return NextResponse.json({ emails: result.rows })
  } catch (error) {
    console.error("Error fetching email history:", error)
    return NextResponse.json(
      { error: "Failed to fetch email history" },
      { status: 500 }
    )
  }
}