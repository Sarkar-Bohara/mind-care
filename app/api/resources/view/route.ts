import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import pool from "@/lib/db"

// POST /api/resources/view - Track resource views
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }
    
    const { resourceId } = await request.json()
    
    if (!resourceId) {
      return NextResponse.json(
        { success: false, error: 'Resource ID is required' },
        { status: 400 }
      )
    }
    
    // Update the view count in the database
    try {
      await pool.query(`
        UPDATE resources 
        SET views = views + 1 
        WHERE resource_id = $1
      `, [resourceId])
    } catch (dbError) {
      console.error('Error updating view count:', dbError)
      // Continue anyway - view tracking is not critical
    }
    
    return NextResponse.json({
      success: true,
      message: 'View tracked successfully'
    })
    
  } catch (error) {
    console.error('Error tracking view:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to track view' },
      { status: 500 }
    )
  }
}