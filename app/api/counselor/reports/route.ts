import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"

// GET - Generate reports based on type and parameters
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "counselor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("type")
    const fromDate = searchParams.get("from")
    const toDate = searchParams.get("to")
    const clientId = searchParams.get("clientId")

    if (!reportType) {
      return NextResponse.json(
        { error: "Report type is required" },
        { status: 400 }
      )
    }

    // Set default date range if not provided (last 30 days)
    const endDate = toDate ? new Date(toDate) : new Date()
    const startDate = fromDate ? new Date(fromDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    let reportData

    // Generate different mock data based on report type
    // TODO: Replace with actual database queries once DB issues are resolved
    switch (reportType) {
      case "session-summary":
        reportData = {
          title: "Session Summary Report",
          period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          totalSessions: 24,
          completedSessions: 20,
          cancelledSessions: 3,
          noShowSessions: 1,
          averageDuration: "55 minutes",
          clientsSeen: 12,
          details: [
            { metric: "Individual Therapy", value: 15, percentage: 75 },
            { metric: "Group Sessions", value: 5, percentage: 25 }
          ]
        }
        break
      case "client-progress":
        reportData = {
          title: "Client Progress Report",
          period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          totalClients: 18,
          activeClients: 15,
          improvedClients: 12,
          stableClients: 4,
          deterioratedClients: 2,
          averageProgressScore: 7.2,
          completedGoals: 34,
          inProgressGoals: 28,
          details: [
            { metric: "Anxiety Disorders", value: 8, percentage: 44 },
            { metric: "Depression", value: 6, percentage: 33 },
            { metric: "PTSD", value: 4, percentage: 23 }
          ]
        }
        break
      case "monthly-overview":
        reportData = {
          title: "Monthly Overview Report",
          period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          totalRevenue: "$4,850",
          totalHours: 42,
          newClients: 7,
          retentionRate: "92%",
          averageSessionsPerClient: 2.8,
          totalAppointments: 56,
          utilizationRate: "87%",
          details: [
            { metric: "Week 1", value: 14, percentage: 25 },
            { metric: "Week 2", value: 16, percentage: 29 },
            { metric: "Week 3", value: 13, percentage: 23 },
            { metric: "Week 4", value: 13, percentage: 23 }
          ]
        }
        break
      case "attendance-report":
        reportData = {
          title: "Attendance Report",
          period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          totalScheduled: 32,
          totalAttended: 28,
          totalCancelled: 3,
          totalNoShows: 1,
          attendanceRate: "87.5%",
          cancellationRate: "9.4%",
          noShowRate: "3.1%",
          details: [
            { metric: "Morning (9-12)", value: 12, percentage: 43 },
            { metric: "Afternoon (12-17)", value: 11, percentage: 39 },
            { metric: "Evening (17-20)", value: 5, percentage: 18 }
          ]
        }
        break
      case "treatment-outcomes":
        reportData = {
          title: "Treatment Outcomes Report",
          period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          completedTreatment: 8,
          ongoingTreatment: 15,
          discontinuedTreatment: 3,
          successRate: "84%",
          averageTreatmentDuration: "16 weeks",
          clientSatisfactionScore: 4.6,
          details: [
            { metric: "Fully Recovered", value: 5, percentage: 31 },
            { metric: "Significantly Improved", value: 8, percentage: 50 },
            { metric: "Moderately Improved", value: 3, percentage: 19 }
          ]
        }
        break
      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        )
    }

    return NextResponse.json({ reportData })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    )
  }
}

// Session Summary Report
async function generateSessionSummaryReport(counselorId: number, startDate: Date, endDate: Date, clientId?: string) {
  const clientFilter = clientId && clientId !== "all" ? "AND a.patient_id = $4" : ""
  const params = clientId && clientId !== "all" ? [counselorId, startDate, endDate, clientId] : [counselorId, startDate, endDate]

  // Get session statistics
  const sessionStats = await pool.query(`
    SELECT 
      COUNT(*) as total_sessions,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_sessions,
      COUNT(CASE WHEN status = 'no-show' THEN 1 END) as no_show_sessions,
      AVG(duration_minutes) as avg_duration,
      COUNT(DISTINCT patient_id) as clients_seen
    FROM appointments a
    WHERE provider_id = $1 
      AND appointment_date BETWEEN $2 AND $3
      ${clientFilter}
  `, params)

  // Get session type breakdown
  const typeBreakdown = await pool.query(`
    SELECT 
      type,
      COUNT(*) as count
    FROM appointments a
    WHERE provider_id = $1 
      AND appointment_date BETWEEN $2 AND $3
      AND status = 'completed'
      ${clientFilter}
    GROUP BY type
  `, params)

  const stats = sessionStats.rows[0]
  const totalCompleted = parseInt(stats.completed_sessions) || 0
  
  const details = typeBreakdown.rows.map(row => ({
    metric: row.type.charAt(0).toUpperCase() + row.type.slice(1),
    value: parseInt(row.count),
    percentage: totalCompleted > 0 ? Math.round((parseInt(row.count) / totalCompleted) * 100) : 0
  }))

  return {
    title: "Session Summary Report",
    period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    totalSessions: parseInt(stats.total_sessions) || 0,
    completedSessions: parseInt(stats.completed_sessions) || 0,
    cancelledSessions: parseInt(stats.cancelled_sessions) || 0,
    noShowSessions: parseInt(stats.no_show_sessions) || 0,
    averageDuration: `${Math.round(parseFloat(stats.avg_duration) || 0)} minutes`,
    clientsSeen: parseInt(stats.clients_seen) || 0,
    details
  }
}

// Client Progress Report
async function generateClientProgressReport(counselorId: number, startDate: Date, endDate: Date, clientId?: string) {
  const clientFilter = clientId && clientId !== "all" ? "AND u.user_id = $4" : ""
  const params = clientId && clientId !== "all" ? [counselorId, startDate, endDate, clientId] : [counselorId, startDate, endDate]

  // Get client statistics
  const clientStats = await pool.query(`
    SELECT 
      COUNT(DISTINCT u.user_id) as total_clients,
      COUNT(DISTINCT CASE WHEN a.appointment_date >= $2 THEN u.user_id END) as active_clients
    FROM users u
    JOIN appointments a ON u.user_id = a.patient_id
    WHERE a.provider_id = $1
      AND u.role = 'patient'
      ${clientFilter}
  `, params)

  // Get mood improvement data
  const moodProgress = await pool.query(`
    SELECT 
      u.user_id,
      u.full_name,
      AVG(CASE WHEN m.entry_date < $2 + INTERVAL '7 days' THEN m.mood_score END) as early_mood,
      AVG(CASE WHEN m.entry_date > $3 - INTERVAL '7 days' THEN m.mood_score END) as recent_mood
    FROM users u
    JOIN appointments a ON u.user_id = a.patient_id
    LEFT JOIN mood_entries m ON u.user_id = m.user_id
    WHERE a.provider_id = $1
      AND u.role = 'patient'
      AND m.entry_date BETWEEN $2 - INTERVAL '7 days' AND $3 + INTERVAL '7 days'
      ${clientFilter}
    GROUP BY u.user_id, u.full_name
    HAVING COUNT(m.entry_id) >= 2
  `, params)

  const stats = clientStats.rows[0]
  let improvedClients = 0
  let stableClients = 0
  let needsSupportClients = 0

  const progressCategories = {
    "Significant Improvement": 0,
    "Moderate Improvement": 0,
    "Stable/Maintained": 0,
    "Needs Additional Support": 0
  }

  moodProgress.rows.forEach(client => {
    const earlyMood = parseFloat(client.early_mood) || 0
    const recentMood = parseFloat(client.recent_mood) || 0
    const improvement = recentMood - earlyMood

    if (improvement >= 2) {
      progressCategories["Significant Improvement"]++
      improvedClients++
    } else if (improvement >= 1) {
      progressCategories["Moderate Improvement"]++
      improvedClients++
    } else if (improvement >= -0.5) {
      progressCategories["Stable/Maintained"]++
      stableClients++
    } else {
      progressCategories["Needs Additional Support"]++
      needsSupportClients++
    }
  })

  const totalWithData = Object.values(progressCategories).reduce((a, b) => a + b, 0)
  const details = Object.entries(progressCategories).map(([metric, value]) => ({
    metric,
    value,
    percentage: totalWithData > 0 ? Math.round((value / totalWithData) * 100) : 0
  }))

  return {
    title: "Client Progress Report",
    period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    totalClients: parseInt(stats.total_clients) || 0,
    activeClients: parseInt(stats.active_clients) || 0,
    improvedClients,
    stableClients,
    details
  }
}

// Monthly Overview Report
async function generateMonthlyOverviewReport(counselorId: number, startDate: Date, endDate: Date) {
  // Get session and revenue data
  const overviewStats = await pool.query(`
    SELECT 
      COUNT(*) as total_sessions,
      SUM(duration_minutes) as total_minutes,
      COUNT(DISTINCT patient_id) as total_clients,
      COUNT(DISTINCT CASE WHEN appointment_date >= $2 THEN patient_id END) as new_clients
    FROM appointments
    WHERE provider_id = $1 
      AND appointment_date BETWEEN $2 AND $3
      AND status = 'completed'
  `, [counselorId, startDate, endDate])

  // Get weekly breakdown
  const weeklyStats = await pool.query(`
    SELECT 
      EXTRACT(WEEK FROM appointment_date) as week_num,
      COUNT(*) as sessions
    FROM appointments
    WHERE provider_id = $1 
      AND appointment_date BETWEEN $2 AND $3
      AND status = 'completed'
    GROUP BY EXTRACT(WEEK FROM appointment_date)
    ORDER BY week_num
  `, [counselorId, startDate, endDate])

  const stats = overviewStats.rows[0]
  const totalHours = Math.round((parseInt(stats.total_minutes) || 0) / 60)
  const totalRevenue = (parseInt(stats.total_sessions) || 0) * 150 // Assuming $150 per session
  
  const totalWeeklySessions = weeklyStats.rows.reduce((sum, week) => sum + parseInt(week.sessions), 0)
  const details = weeklyStats.rows.map((week, index) => ({
    metric: `Week ${index + 1}`,
    value: parseInt(week.sessions),
    percentage: totalWeeklySessions > 0 ? Math.round((parseInt(week.sessions) / totalWeeklySessions) * 100) : 0
  }))

  return {
    title: "Monthly Overview Report",
    period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    totalRevenue: `$${totalRevenue.toLocaleString()}`,
    totalHours,
    newClients: parseInt(stats.new_clients) || 0,
    retentionRate: "89%", // This would need more complex calculation
    details
  }
}

// Attendance Report
async function generateAttendanceReport(counselorId: number, startDate: Date, endDate: Date, clientId?: string) {
  const clientFilter = clientId && clientId !== "all" ? "AND patient_id = $4" : ""
  const params = clientId && clientId !== "all" ? [counselorId, startDate, endDate, clientId] : [counselorId, startDate, endDate]

  const attendanceStats = await pool.query(`
    SELECT 
      COUNT(*) as total_scheduled,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as total_attended,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as total_cancelled,
      COUNT(CASE WHEN status = 'no-show' THEN 1 END) as total_no_shows
    FROM appointments
    WHERE provider_id = $1 
      AND appointment_date BETWEEN $2 AND $3
      ${clientFilter}
  `, params)

  const stats = attendanceStats.rows[0]
  const totalScheduled = parseInt(stats.total_scheduled) || 0
  const totalAttended = parseInt(stats.total_attended) || 0
  const attendanceRate = totalScheduled > 0 ? ((totalAttended / totalScheduled) * 100).toFixed(1) : "0.0"

  const details = [
    {
      metric: "Attended Sessions",
      value: totalAttended,
      percentage: totalScheduled > 0 ? Math.round((totalAttended / totalScheduled) * 100) : 0
    },
    {
      metric: "Cancelled by Client",
      value: parseInt(stats.total_cancelled) || 0,
      percentage: totalScheduled > 0 ? Math.round(((parseInt(stats.total_cancelled) || 0) / totalScheduled) * 100) : 0
    },
    {
      metric: "No Shows",
      value: parseInt(stats.total_no_shows) || 0,
      percentage: totalScheduled > 0 ? Math.round(((parseInt(stats.total_no_shows) || 0) / totalScheduled) * 100) : 0
    }
  ]

  return {
    title: "Attendance Report",
    period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    totalScheduled,
    totalAttended,
    totalCancelled: parseInt(stats.total_cancelled) || 0,
    totalNoShows: parseInt(stats.total_no_shows) || 0,
    attendanceRate: `${attendanceRate}%`,
    details
  }
}

// Treatment Outcomes Report
async function generateTreatmentOutcomesReport(counselorId: number, startDate: Date, endDate: Date, clientId?: string) {
  const clientFilter = clientId && clientId !== "all" ? "AND u.user_id = $4" : ""
  const params = clientId && clientId !== "all" ? [counselorId, startDate, endDate, clientId] : [counselorId, startDate, endDate]

  // Get treatment statistics
  const treatmentStats = await pool.query(`
    SELECT 
      COUNT(DISTINCT u.user_id) as total_clients,
      AVG(session_count.sessions) as avg_sessions_per_client
    FROM users u
    JOIN (
      SELECT 
        patient_id,
        COUNT(*) as sessions
      FROM appointments
      WHERE provider_id = $1 
        AND appointment_date BETWEEN $2 AND $3
        AND status = 'completed'
      GROUP BY patient_id
    ) session_count ON u.user_id = session_count.patient_id
    WHERE u.role = 'patient'
      ${clientFilter}
  `, params)

  // Get mood improvement outcomes
  const outcomeStats = await pool.query(`
    SELECT 
      u.user_id,
      AVG(CASE WHEN m.entry_date < $2 + INTERVAL '7 days' THEN m.mood_score END) as early_mood,
      AVG(CASE WHEN m.entry_date > $3 - INTERVAL '7 days' THEN m.mood_score END) as recent_mood
    FROM users u
    JOIN appointments a ON u.user_id = a.patient_id
    LEFT JOIN mood_entries m ON u.user_id = m.user_id
    WHERE a.provider_id = $1
      AND u.role = 'patient'
      AND m.entry_date BETWEEN $2 - INTERVAL '7 days' AND $3 + INTERVAL '7 days'
      ${clientFilter}
    GROUP BY u.user_id
    HAVING COUNT(m.entry_id) >= 2
  `, params)

  const stats = treatmentStats.rows[0]
  const outcomes = {
    "Fully Recovered": 0,
    "Significantly Improved": 0,
    "Moderately Improved": 0,
    "Minimal Improvement": 0
  }

  let completedTreatment = 0
  let successfulOutcomes = 0

  outcomeStats.rows.forEach(client => {
    const earlyMood = parseFloat(client.early_mood) || 0
    const recentMood = parseFloat(client.recent_mood) || 0
    const improvement = recentMood - earlyMood

    if (recentMood >= 8 && improvement >= 3) {
      outcomes["Fully Recovered"]++
      completedTreatment++
      successfulOutcomes++
    } else if (improvement >= 2) {
      outcomes["Significantly Improved"]++
      successfulOutcomes++
    } else if (improvement >= 1) {
      outcomes["Moderately Improved"]++
      successfulOutcomes++
    } else {
      outcomes["Minimal Improvement"]++
    }
  })

  const totalWithData = Object.values(outcomes).reduce((a, b) => a + b, 0)
  const successRate = totalWithData > 0 ? Math.round((successfulOutcomes / totalWithData) * 100) : 0
  
  const details = Object.entries(outcomes).map(([metric, value]) => ({
    metric,
    value,
    percentage: totalWithData > 0 ? Math.round((value / totalWithData) * 100) : 0
  }))

  return {
    title: "Treatment Outcomes Report",
    period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    totalClients: parseInt(stats.total_clients) || 0,
    completedTreatment,
    ongoingTreatment: (parseInt(stats.total_clients) || 0) - completedTreatment,
    averageSessionsPerClient: Math.round(parseFloat(stats.avg_sessions_per_client) || 0),
    successRate: `${successRate}%`,
    details
  }
}