import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Default settings
const defaultSettings = {
  siteName: "MindCare Hub",
  siteDescription: "Comprehensive mental health support for Malaysia",
  maintenanceMode: false,
  userRegistration: true,
  emailNotifications: true,
  smsNotifications: false,
  dataRetention: "365",
  sessionTimeout: "30",
  maxFileSize: "10",
  allowedFileTypes: "pdf,doc,docx,jpg,png,mp4",
  backupFrequency: "daily",
  securityLevel: "high",
};

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return default settings (in a real app, these would be stored in database)
    return NextResponse.json(defaultSettings);
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await request.json();
    
    // In a real app, you would save these to database
    console.log('Settings updated:', settings);
    
    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reset to default settings
    return NextResponse.json(defaultSettings);
  } catch (error) {
    console.error('Settings POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}