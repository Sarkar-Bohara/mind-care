import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

// GET /api/fix-database - Add missing columns to resources table
export async function GET(request: NextRequest) {
  try {
    // Add missing columns to resources table
    const alterQuery = `
      ALTER TABLE resources 
      ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS downloads INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
    `
    
    await pool.query(alterQuery)
    
    // Verify the columns were added
    const verifyQuery = `
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'resources' 
      AND column_name IN ('views', 'downloads', 'likes')
      ORDER BY column_name;
    `
    
    const result = await pool.query(verifyQuery)
    
    return NextResponse.json({
      success: true,
      message: 'Database columns added successfully',
      columns: result.rows
    })
    
  } catch (error) {
    console.error('Database fix error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}