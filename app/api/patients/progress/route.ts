import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"

// GET - Get patient progress data for psychiatrists
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || (user.role !== "psychiatrist" && user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")
    const search = searchParams.get("search")

    if (patientId) {
      // Get specific patient progress data
      return await getPatientProgressData(parseInt(patientId))
    } else {
      // Get all patients with progress summary
      return await getAllPatientsProgress(search)
    }
  } catch (error) {
    console.error("Error fetching patient progress:", error)
    return NextResponse.json(
      { error: "Failed to fetch patient progress" },
      { status: 500 }
    )
  }
}

async function getAllPatientsProgress(search?: string | null) {
  let query = `
    SELECT 
      u.user_id,
      u.full_name,
      u.email,
      u.phone,
      u.created_at as start_date,
      -- Get latest appointment
      (
        SELECT appointment_date 
        FROM appointments a 
        WHERE a.patient_id = u.user_id 
          AND a.status = 'completed'
        ORDER BY appointment_date DESC 
        LIMIT 1
      ) as last_session,
      -- Get next appointment
      (
        SELECT appointment_date 
        FROM appointments a 
        WHERE a.patient_id = u.user_id 
          AND a.status IN ('scheduled', 'confirmed')
          AND a.appointment_date > CURRENT_DATE
        ORDER BY appointment_date ASC 
        LIMIT 1
      ) as next_appointment,
      -- Calculate mood progress (average of last 7 entries vs first 7 entries)
      (
        SELECT COALESCE(AVG(mood_score), 0)
        FROM (
          SELECT mood_score 
          FROM mood_entries me 
          WHERE me.user_id = u.user_id 
          ORDER BY entry_date DESC 
          LIMIT 7
        ) recent_moods
      ) as recent_avg_mood,
      (
        SELECT COALESCE(AVG(mood_score), 0)
        FROM (
          SELECT mood_score 
          FROM mood_entries me 
          WHERE me.user_id = u.user_id 
          ORDER BY entry_date ASC 
          LIMIT 7
        ) initial_moods
      ) as initial_avg_mood,
      -- Get total completed sessions
      (
        SELECT COUNT(*) 
        FROM appointments a 
        WHERE a.patient_id = u.user_id 
          AND a.status = 'completed'
      ) as total_sessions,
      -- Get primary diagnosis from latest appointment notes
      (
        SELECT notes 
        FROM appointments a 
        WHERE a.patient_id = u.user_id 
          AND a.notes IS NOT NULL 
          AND a.notes != ''
        ORDER BY appointment_date DESC 
        LIMIT 1
      ) as latest_notes
    FROM users u
    WHERE u.role = 'patient' 
      AND u.is_active = true
  `

  const params: any[] = []

  if (search) {
    query += ` AND (u.full_name ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1})`
    params.push(`%${search}%`)
  }

  query += ` ORDER BY u.full_name ASC`

  const result = await pool.query(query, params)

  // Process the results to calculate progress and trends
  const patients = result.rows.map(row => {
    const initialMood = parseFloat(row.initial_avg_mood) || 5
    const recentMood = parseFloat(row.recent_avg_mood) || 5
    const moodImprovement = recentMood - initialMood
    
    // Calculate progress percentage (0-100)
    let progress = 50 // Default neutral progress
    if (initialMood > 0) {
      progress = Math.min(100, Math.max(0, ((recentMood / 10) * 100)))
    }
    
    // Determine trend
    let trend = 'stable'
    if (moodImprovement > 0.5) {
      trend = 'improving'
    } else if (moodImprovement < -0.5) {
      trend = 'declining'
    }

    // Extract condition from notes (simplified)
    let condition = 'General Mental Health'
    if (row.latest_notes) {
      const notes = row.latest_notes.toLowerCase()
      if (notes.includes('depression')) condition = 'Major Depression'
      else if (notes.includes('anxiety')) condition = 'Generalized Anxiety Disorder'
      else if (notes.includes('ptsd')) condition = 'PTSD'
      else if (notes.includes('bipolar')) condition = 'Bipolar Disorder'
      else if (notes.includes('social')) condition = 'Social Anxiety'
    }

    return {
      id: row.user_id,
      name: row.full_name || 'Unknown Patient',
      condition,
      startDate: row.start_date?.toISOString().split('T')[0] || null,
      lastSession: row.last_session?.toISOString().split('T')[0] || null,
      nextAppointment: row.next_appointment?.toISOString().split('T')[0] || null,
      progress: Math.round(progress),
      trend,
      totalSessions: parseInt(row.total_sessions) || 0,
      recentAvgMood: parseFloat(row.recent_avg_mood) || 0,
      initialAvgMood: parseFloat(row.initial_avg_mood) || 0
    }
  })

  return NextResponse.json({ patients })
}

async function getPatientProgressData(patientId: number) {
  // Get patient basic info
  const patientQuery = `
    SELECT 
      user_id,
      full_name,
      email,
      phone,
      created_at as start_date
    FROM users 
    WHERE user_id = $1 AND role = 'patient'
  `
  const patientResult = await pool.query(patientQuery, [patientId])
  
  if (patientResult.rows.length === 0) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 })
  }

  const patient = patientResult.rows[0]

  // Get mood entries for the last 7 weeks
  const moodQuery = `
    SELECT 
      mood_score,
      anxiety_level,
      stress_level,
      sleep_hours,
      notes,
      entry_date
    FROM mood_entries 
    WHERE user_id = $1 
      AND entry_date >= CURRENT_DATE - INTERVAL '7 weeks'
    ORDER BY entry_date ASC
  `
  const moodResult = await pool.query(moodQuery, [patientId])

  // Get appointments
  const appointmentsQuery = `
    SELECT 
      a.appointment_date,
      a.status,
      a.notes,
      u.full_name as provider_name
    FROM appointments a
    JOIN users u ON a.provider_id = u.user_id
    WHERE a.patient_id = $1
    ORDER BY a.appointment_date DESC
    LIMIT 10
  `
  const appointmentsResult = await pool.query(appointmentsQuery, [patientId])

  // Get clinical notes
  const clinicalNotesQuery = `
    SELECT 
      cn.note_content,
      cn.created_at,
      u.full_name as provider_name
    FROM clinical_notes cn
    JOIN users u ON cn.provider_id = u.user_id
    WHERE cn.patient_id = $1
    ORDER BY cn.created_at DESC
    LIMIT 20
  `
  const clinicalNotesResult = await pool.query(clinicalNotesQuery, [patientId])

  // Process mood data into weekly averages
  const weeklyMoodScores = []
  const moodEntries = moodResult.rows
  
  // Group mood entries by week and calculate averages
  for (let week = 0; week < 7; week++) {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - (7 * (7 - week)))
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    
    const weekEntries = moodEntries.filter(entry => {
      const entryDate = new Date(entry.entry_date)
      return entryDate >= weekStart && entryDate <= weekEnd
    })
    
    const avgMood = weekEntries.length > 0 
      ? weekEntries.reduce((sum, entry) => sum + entry.mood_score, 0) / weekEntries.length
      : 5 // Default neutral mood if no entries
    
    weeklyMoodScores.push(Math.round(avgMood))
  }

  // Calculate progress metrics
  const completedSessions = appointmentsResult.rows.filter(apt => apt.status === 'completed').length
  const lastSession = appointmentsResult.rows.find(apt => apt.status === 'completed')
  const nextAppointment = appointmentsResult.rows.find(apt => 
    apt.status === 'scheduled' || apt.status === 'confirmed'
  )

  // Calculate overall progress based on mood improvement
  const initialMood = weeklyMoodScores[0] || 5
  const recentMood = weeklyMoodScores[weeklyMoodScores.length - 1] || 5
  const progress = Math.min(100, Math.max(0, ((recentMood / 10) * 100)))
  
  // Determine trend
  const moodImprovement = recentMood - initialMood
  let trend = 'stable'
  if (moodImprovement > 0.5) {
    trend = 'improving'
  } else if (moodImprovement < -0.5) {
    trend = 'declining'
  }

  // Extract condition and medications from latest notes
  let condition = 'General Mental Health'
  let medications: string[] = []
  
  if (lastSession?.notes) {
    const notes = lastSession.notes.toLowerCase()
    if (notes.includes('depression')) condition = 'Major Depression'
    else if (notes.includes('anxiety')) condition = 'Generalized Anxiety Disorder'
    else if (notes.includes('ptsd')) condition = 'PTSD'
    else if (notes.includes('bipolar')) condition = 'Bipolar Disorder'
    else if (notes.includes('social')) condition = 'Social Anxiety'
    
    // Extract medications (simplified pattern matching)
    const medPatterns = [
      'sertraline', 'escitalopram', 'fluoxetine', 'paroxetine',
      'lorazepam', 'alprazolam', 'clonazepam',
      'lithium', 'quetiapine', 'aripiprazole', 'prazosin'
    ]
    
    medPatterns.forEach(med => {
      if (notes.includes(med)) {
        const dosageMatch = notes.match(new RegExp(`${med}\s+(\d+(?:\.\d+)?\s*mg)`, 'i'))
        if (dosageMatch) {
          medications.push(`${med.charAt(0).toUpperCase() + med.slice(1)} ${dosageMatch[1]}`)
        } else {
          medications.push(med.charAt(0).toUpperCase() + med.slice(1))
        }
      }
    })
  }

  const progressData = {
    id: patient.user_id,
    name: patient.full_name || 'Unknown Patient',
    condition,
    startDate: patient.start_date?.toISOString().split('T')[0] || null,
    lastSession: lastSession?.appointment_date?.toISOString().split('T')[0] || null,
    nextAppointment: nextAppointment?.appointment_date?.toISOString().split('T')[0] || null,
    progress: Math.round(progress),
    trend,
    moodScores: weeklyMoodScores,
    medications,
    notes: lastSession?.notes || 'No recent notes available.',
    totalSessions: completedSessions,
    clinicalNotes: clinicalNotesResult.rows.map(note => ({
      note_content: note.note_content,
      created_at: note.created_at,
      provider_name: note.provider_name
    })),
    recentMoodEntries: moodEntries.slice(-7).map(entry => ({
      date: entry.entry_date?.toISOString().split('T')[0],
      mood: entry.mood_score,
      anxiety: entry.anxiety_level,
      stress: entry.stress_level,
      sleep: entry.sleep_hours,
      notes: entry.notes
    }))
  }

  return NextResponse.json({ patient: progressData })
}