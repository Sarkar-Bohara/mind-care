// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { sendAppointmentStatusEmail } from "@/lib/emailService"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const appointmentId = parseInt(id, 10)
    
    if (isNaN(appointmentId)) {
      return NextResponse.json({ error: "Invalid appointment ID" }, { status: 400 })
    }
    const { status, notes } = await request.json()

    // Verify appointment exists and user has permission
    let whereClause = ""
    const queryParams: any[] = [appointmentId]

    if (user.role === "patient") {
      whereClause = "AND patient_id = $2"
      queryParams.push(user.id)
    } else if (user.role === "psychiatrist" || user.role === "counselor") {
      whereClause = "AND provider_id = $2"
      queryParams.push(user.id)
    } else if (user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const checkQuery = `
      SELECT appointment_id FROM appointments 
      WHERE appointment_id = $1 ${whereClause}
    `
    const checkResult = await pool.query(checkQuery, queryParams)

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Update appointment
    const updateQuery = `
      UPDATE appointments 
      SET status = COALESCE($2, status), 
          notes = COALESCE($3, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE appointment_id = $1
      RETURNING *
    `
    const result = await pool.query(updateQuery, [appointmentId, status, notes])
    const updatedAppointment = result.rows[0]

    // Send status update email if status was changed to confirmed
    if (status === 'confirmed') {
      try {
        // Get patient and provider details for email
        const emailQuery = `
          SELECT 
            u.full_name as patient_name,
            u.email as patient_email,
            p.full_name as provider_name,
            a.appointment_date,
            a.appointment_time,
            a.type as session_type
          FROM appointments a
          JOIN users u ON a.patient_id = u.user_id
          JOIN users p ON a.provider_id = p.user_id
          WHERE a.appointment_id = $1
        `
        const emailResult = await pool.query(emailQuery, [appointmentId])
        
        if (emailResult.rows.length > 0) {
          const emailData = emailResult.rows[0]
          await sendAppointmentStatusEmail({
            patientName: emailData.patient_name,
            patientEmail: emailData.patient_email,
            providerName: emailData.provider_name,
            appointmentDate: emailData.appointment_date,
            appointmentTime: emailData.appointment_time,
            sessionType: emailData.session_type,
            status: 'confirmed',
            message: 'Your appointment has been confirmed by the provider.'
          })
          console.log('Appointment confirmation email sent successfully')
        }
      } catch (emailError) {
        console.error('Failed to send appointment confirmation email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(updatedAppointment)
  } catch (error) {
    console.error("Update appointment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
