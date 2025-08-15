import { NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET() {
  try {
    // Test database connection
    const result = await query('SELECT NOW() as timestamp, COUNT(*) as user_count FROM users');
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        timestamp: result[0].timestamp,
        userCount: result[0].user_count,
      },
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 500 }
    );
  }
}