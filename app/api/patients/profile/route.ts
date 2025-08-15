import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"

// GET - Get current patient's profile
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "patient") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const query = `
      SELECT 
        user_id,
        username,
        email,
        full_name,
        phone,
        date_of_birth,
        is_active,
        created_at
      FROM users 
      WHERE user_id = $1 AND role = 'patient'
    `

    const result = await pool.query(query, [user.id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    const patient = result.rows[0]
    return NextResponse.json({ 
      patient: {
        id: patient.user_id,
        username: patient.username,
        email: patient.email,
        name: patient.full_name,
        phone: patient.phone,
        dateOfBirth: patient.date_of_birth,
        isActive: patient.is_active,
        registrationDate: patient.created_at
      }
    })
  } catch (error) {
    console.error("Error fetching patient profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch patient profile" },
      { status: 500 }
    )
  }
}

// PUT - Update current patient's profile
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "patient") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email, phone, dateOfBirth } = await request.json()

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      )
    }

    // Check if email is already used by another user
    const existingUser = await pool.query(
      "SELECT user_id FROM users WHERE email = $1 AND user_id != $2",
      [email, user.id]
    )

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      )
    }

    const result = await pool.query(`
      UPDATE users 
      SET 
        full_name = $1,
        email = $2,
        phone = $3,
        date_of_birth = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $5 AND role = 'patient'
      RETURNING user_id, username, email, full_name, phone, date_of_birth, is_active, created_at
    `, [name, email, phone, dateOfBirth, user.id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    const patient = result.rows[0]
    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      patient: {
        id: patient.user_id,
        username: patient.username,
        email: patient.email,
        name: patient.full_name,
        phone: patient.phone,
        dateOfBirth: patient.date_of_birth,
        isActive: patient.is_active,
        registrationDate: patient.created_at
      }
    })
  } catch (error) {
    console.error("Error updating patient profile:", error)
    return NextResponse.json(
      { error: "Failed to update patient profile" },
      { status: 500 }
    )
  }
}