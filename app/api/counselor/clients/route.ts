import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"

// GET - Get clients for the counselor
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "counselor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all clients who have appointments with this counselor
    const result = await pool.query(`
      SELECT DISTINCT
        u.user_id,
        u.full_name,
        u.email,
        COUNT(a.appointment_id) as total_appointments,
        MAX(a.appointment_date) as last_appointment,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_sessions
      FROM users u
      JOIN appointments a ON u.user_id = a.patient_id
      WHERE a.provider_id = $1 
        AND u.role = 'patient'
      GROUP BY u.user_id, u.full_name, u.email
      ORDER BY MAX(a.appointment_date) DESC
    `, [user.id])

    const clients = result.rows.map(row => ({
      id: row.user_id.toString(),
      name: row.full_name,
      email: row.email,
      totalAppointments: parseInt(row.total_appointments),
      lastAppointment: row.last_appointment,
      completedSessions: parseInt(row.completed_sessions)
    }))

    // Add "All Clients" option
    const clientOptions = [
      { id: "all", name: "All Clients" },
      ...clients
    ]

    return NextResponse.json({ clients: clientOptions })
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    )
  }
}