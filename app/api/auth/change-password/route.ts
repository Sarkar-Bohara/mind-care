import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { verifyToken } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Get current user
    const users = await query(
      "SELECT user_id, password_hash FROM users WHERE user_id = $1",
      [user.id]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentUser = users[0];

    // Verify current password (simple comparison for demo)
    if (currentPassword !== currentUser.password_hash) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Update password (store as plain text for demo)
    await query(
      "UPDATE users SET password_hash = $1 WHERE user_id = $2",
      [newPassword, user.id]
    );

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}