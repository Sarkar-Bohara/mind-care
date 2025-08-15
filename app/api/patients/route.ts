import { type NextRequest, NextResponse } from "next/server"
import { query } from '@/lib/database'
import { verifyToken } from "@/lib/auth"

// GET - Get all patients (for counselors/psychiatrists)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || (user.role !== "counselor" && user.role !== "psychiatrist" && user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const active = searchParams.get("active")

    let query = `
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
      WHERE role = 'patient'
    `
    const params: any[] = []

    if (active !== null) {
      query += ` AND is_active = $${params.length + 1}`
      params.push(active === 'true')
    }

    if (search) {
      query += ` AND (full_name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1} OR username ILIKE $${params.length + 1})`
      params.push(`%${search}%`)
    }

    query += ` ORDER BY full_name ASC`

    const result = await query(query, params)

    return NextResponse.json({ 
      patients: result,
      total: result.length
    })
  } catch (error) {
    console.error("Error fetching patients:", error)
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    )
  }
}

// POST - Create a new patient (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { username, email, password, fullName, phone, dateOfBirth } = await request.json()

    if (!username || !email || !password || !fullName) {
      return NextResponse.json(
        { error: "Username, email, password, and full name are required" },
        { status: 400 }
      )
    }

    // Check if username or email already exists
    const existingUser = await query(
      "SELECT user_id FROM users WHERE username = $1 OR email = $2",
      [username, email]
    )

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 }
      )
    }

    const result = await query(`
      INSERT INTO users (
        username, email, password_hash, full_name, phone, date_of_birth, role, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, 'patient', true)
      RETURNING user_id, username, email, full_name, phone, date_of_birth, is_active, created_at
    `, [username, email, password, fullName, phone, dateOfBirth])

    return NextResponse.json({
      success: true,
      message: "Patient created successfully",
      patient: result[0]
    })
  } catch (error) {
    console.error("Error creating patient:", error)
    return NextResponse.json(
      { error: "Failed to create patient" },
      { status: 500 }
    )
  }
}