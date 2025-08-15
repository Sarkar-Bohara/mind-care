import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"

// GET - Test database connection and basic queries
export async function GET(request: NextRequest) {
  try {
    console.log("Testing database connection...")
    
    // Test basic connection
    const connectionTest = await pool.query('SELECT NOW() as current_time')
    console.log("Database connection successful:", connectionTest.rows[0])
    
    // Test users table
    const usersTest = await pool.query('SELECT COUNT(*) as user_count FROM users')
    console.log("Users count:", usersTest.rows[0])
    
    // Test appointments table
    const appointmentsTest = await pool.query('SELECT COUNT(*) as appointment_count FROM appointments')
    console.log("Appointments count:", appointmentsTest.rows[0])
    
    // Test counselor data
    const counselorTest = await pool.query(`
      SELECT u.user_id, u.full_name, COUNT(a.appointment_id) as appointment_count
      FROM users u
      LEFT JOIN appointments a ON u.user_id = a.provider_id
      WHERE u.role = 'counselor'
      GROUP BY u.user_id, u.full_name
    `)
    console.log("Counselor data:", counselorTest.rows)
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      data: {
        currentTime: connectionTest.rows[0],
        userCount: usersTest.rows[0],
        appointmentCount: appointmentsTest.rows[0],
        counselors: counselorTest.rows
      }
    })
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json(
      { 
        success: false,
        error: `Database test failed: ${error.message}`,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}