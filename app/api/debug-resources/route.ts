import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

// GET /api/debug-resources - Debug resources table
export async function GET(request: NextRequest) {
  try {
    // First, ensure the views, downloads, and likes columns exist
    try {
      await pool.query(`
        ALTER TABLE resources 
        ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS downloads INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
      `)
    } catch (alterError) {
      console.log('Columns may already exist:', alterError.message)
    }
    
    // Check total resources in database
    const totalCount = await pool.query('SELECT COUNT(*) as count FROM resources')
    
    // Get all resources with details including views, downloads, likes
    const allResources = await pool.query(`
      SELECT 
        r.resource_id,
        r.title,
        r.type,
        r.category,
        r.author_id,
        r.is_published,
        r.views,
        r.downloads,
        r.likes,
        r.created_at,
        u.full_name as author_name,
        u.role as author_role
      FROM resources r
      LEFT JOIN users u ON r.author_id = u.user_id
      ORDER BY r.created_at DESC
    `)
    
    // Get published resources count
    const publishedCount = await pool.query('SELECT COUNT(*) as count FROM resources WHERE is_published = true')
    
    // Get resources by author role
    const resourcesByRole = await pool.query(`
      SELECT 
        u.role,
        COUNT(r.resource_id) as resource_count
      FROM resources r
      LEFT JOIN users u ON r.author_id = u.user_id
      GROUP BY u.role
    `)
    
    return NextResponse.json({
      success: true,
      totalResources: parseInt(totalCount.rows[0].count),
      publishedResources: parseInt(publishedCount.rows[0].count),
      resourcesByRole: resourcesByRole.rows,
      allResources: allResources.rows
    })
    
  } catch (error) {
    console.error('Debug resources error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}