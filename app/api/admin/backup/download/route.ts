import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // In a real app, you would read the actual backup file
    // For now, return a mock SQL backup content
    const mockBackupContent = `-- MindCare Hub Database Backup
-- Generated on: ${new Date().toISOString()}
-- Filename: ${filename}

-- Sample backup content
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

-- End of backup`;

    const blob = new Blob([mockBackupContent], { type: 'application/sql' });
    
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Backup download error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}