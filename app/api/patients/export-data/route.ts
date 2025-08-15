import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== "patient") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a patient
    const users = await query(
      "SELECT user_id, username, email, full_name, phone, date_of_birth, role, created_at FROM users WHERE user_id = $1 AND role = 'patient'",
      [user.id]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const patient = users[0];

    // Get patient's appointments
    const appointments = await query(
      "SELECT appointment_id, provider_id, appointment_date, appointment_time, duration_minutes, type, status, notes, meeting_link, created_at FROM appointments WHERE patient_id = $1",
      [user.id]
    );

    // Get patient's mood entries
    const moodEntries = await query(
      "SELECT entry_id, mood_score, anxiety_level, stress_level, sleep_hours, notes, entry_date, created_at FROM mood_entries WHERE user_id = $1",
      [user.id]
    );

    // Get patient's messages
    const messages = await query(
      "SELECT message_id, conversation_id, sender_id, content, is_read, created_at FROM messages WHERE sender_id = $1",
      [user.id]
    );

    // Get patient's progress notes (if table exists)
    let progressNotes = [];
    try {
      progressNotes = await query(
        "SELECT note_id, provider_id, note_content, created_at FROM clinical_notes WHERE patient_id = $1",
        [user.id]
      );
    } catch (e) {
      // Table might not exist
    }

    // Get patient's treatment plans (if table exists)
    let treatmentPlans = [];
    try {
      treatmentPlans = await query(
        "SELECT plan_id, treatment_goal, session_frequency, created_by, updated_by, created_at, updated_at FROM treatment_plans WHERE patient_id = $1",
        [user.id]
      );
    } catch (e) {
      // Table might not exist
    }

    // Compile all data
    const patientData = {
      exportDate: new Date().toISOString(),
      personalInfo: {
        id: patient.user_id,
        username: patient.username,
        email: patient.email,
        fullName: patient.full_name,
        phone: patient.phone,
        dateOfBirth: patient.date_of_birth,
        registrationDate: patient.created_at
      },
      appointments: appointments,
      moodEntries: moodEntries,
      messages: messages,
      progressNotes: progressNotes,
      treatmentPlans: treatmentPlans,
      summary: {
        totalAppointments: appointments.length,
        totalMoodEntries: moodEntries.length,
        totalMessages: messages.length,
        totalProgressNotes: progressNotes.length,
        totalTreatmentPlans: treatmentPlans.length
      }
    };

    // Return JSON data instead of PDF
    return NextResponse.json(patientData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="patient-data-export-${patient.user_id}-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting patient data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}