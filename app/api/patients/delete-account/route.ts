import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== "patient") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a patient
    const userResult = await pool.query(
      "SELECT user_id, role FROM users WHERE user_id = $1 AND role = 'patient'",
      [user.id]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Start transaction to delete all related data
    // Note: In a production environment, you might want to use database transactions
    
    try {
      // Delete patient's mood tracking entries
      await pool.query("DELETE FROM mood_tracking WHERE patient_id = $1", [user.id]);
      
      // Delete patient's messages
      await pool.query("DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1", [user.id]);
      
      // Delete patient's appointments
      await pool.query("DELETE FROM appointments WHERE patient_id = $1", [user.id]);
      
      // Delete patient's progress notes
      await pool.query("DELETE FROM patient_notes WHERE patient_id = $1", [user.id]);
      
      // Delete patient's treatment plans
      await pool.query("DELETE FROM treatment_plans WHERE patient_id = $1", [user.id]);
      
      // Delete community posts by the patient
      await pool.query("DELETE FROM community_posts WHERE author_id = $1", [user.id]);
      
      // Delete community comments by the patient
      await pool.query("DELETE FROM community_comments WHERE author_id = $1", [user.id]);
      
      // Delete community likes by the patient
      await pool.query("DELETE FROM community_likes WHERE user_id = $1", [user.id]);
      
      // Finally, delete the user account
      await pool.query("DELETE FROM users WHERE user_id = $1", [user.id]);
      
      return NextResponse.json({ 
        message: "Account and all associated data have been permanently deleted" 
      });
    } catch (deleteError) {
      console.error("Error during account deletion:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete account. Some data may remain." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error deleting patient account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}