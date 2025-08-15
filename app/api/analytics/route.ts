import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get basic counts with error handling
    const userStats = await query(`SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN role = 'patient' THEN 1 END) as patients,
      COUNT(CASE WHEN role = 'psychiatrist' THEN 1 END) as psychiatrists,
      COUNT(CASE WHEN role = 'counselor' THEN 1 END) as counselors,
      COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins
      FROM users WHERE is_active = true`).catch(() => [{ total_users: 0, patients: 0, psychiatrists: 0, counselors: 0, admins: 0 }]);

    const appointmentStats = await query(`SELECT 
      COUNT(*) as total_appointments,
      COUNT(CASE WHEN type = 'individual' THEN 1 END) as individual,
      COUNT(CASE WHEN type = 'group' THEN 1 END) as group_therapy,
      COUNT(CASE WHEN type = 'family' THEN 1 END) as family,
      COUNT(CASE WHEN type = 'consultation' THEN 1 END) as consultation
      FROM appointments`).catch(() => [{ total_appointments: 0, individual: 0, group_therapy: 0, family: 0, consultation: 0 }]);

    const resourceStats = await query(`SELECT COUNT(*) as total_resources FROM resources WHERE is_published = true`).catch(() => [{ total_resources: 0 }]);
    
    const postStats = await query(`SELECT COUNT(*) as total_posts FROM community_posts WHERE status = 'approved'`).catch(() => [{ total_posts: 0 }]);
    
    const moodStats = await query(`SELECT COUNT(*) as total_mood_entries FROM mood_entries`).catch(() => [{ total_mood_entries: 0 }]);
    
    const messageStats = await query(`SELECT COUNT(*) as total_messages FROM messages`).catch(() => [{ total_messages: 0 }]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: parseInt(userStats[0]?.total_users || 0),
        totalAppointments: parseInt(appointmentStats[0]?.total_appointments || 0),
        totalResources: parseInt(resourceStats[0]?.total_resources || 0),
        totalPosts: parseInt(postStats[0]?.total_posts || 0),
        totalMoodEntries: parseInt(moodStats[0]?.total_mood_entries || 0),
        totalMessages: parseInt(messageStats[0]?.total_messages || 0),
        usersByRole: {
          patients: parseInt(userStats[0]?.patients || 0),
          psychiatrists: parseInt(userStats[0]?.psychiatrists || 0),
          counselors: parseInt(userStats[0]?.counselors || 0),
          admins: parseInt(userStats[0]?.admins || 0)
        },
        sessionsByType: {
          individual: parseInt(appointmentStats[0]?.individual || 0),
          group_therapy: parseInt(appointmentStats[0]?.group_therapy || 0),
          family: parseInt(appointmentStats[0]?.family || 0),
          consultation: parseInt(appointmentStats[0]?.consultation || 0)
        }
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}