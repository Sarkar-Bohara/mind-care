import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

// GET /api/test-db - Test database connection and check resources
export async function GET(request: NextRequest) {
  try {
    // Test basic connection
    const connectionTest = await pool.query('SELECT NOW()')
    
    // Check if counselor_resources table exists and has data
    const tableCheck = await pool.query(`
      SELECT COUNT(*) as count FROM counselor_resources
    `)
    
    // Get sample resources
    const sampleResources = await pool.query(`
      SELECT 
        resource_id,
        title,
        type,
        status,
        created_at
      FROM counselor_resources 
      LIMIT 5
    `)
    
    return NextResponse.json({
      success: true,
      connection: 'OK',
      timestamp: connectionTest.rows[0].now,
      totalResources: parseInt(tableCheck.rows[0].count),
      sampleResources: sampleResources.rows
    })
    
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      details: 'Database connection failed'
    }, { status: 500 })
  }
}