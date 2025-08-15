import { query, transaction } from '@/lib/database';
import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["Patient", "Psychiatrist", "Counselor", "Admin"]),
  status: z.enum(["Active", "Inactive", "Suspended", "Pending"]),
  tempPassword: z.string().min(6, "Password must be at least 6 characters long"),
});

async function generateUniqueUsername(name: string, email: string): Promise<string> {
  let username = name
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.]/g, "");
  
  if (username.length > 20) {
    username = username.substring(0, 20);
  }

  // If username is empty, use email prefix
  if (!username) {
    username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9.]/g, "");
  }

  if (await isUsernameUnique(username)) {
    return username;
  }

  // If the base username is taken, append a random number
  for (let i = 0; i < 10; i++) {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newUsername = `${username}${randomSuffix}`;
    if (await isUsernameUnique(newUsername)) {
      return newUsername;
    }
  }

  // Fallback: use timestamp
  return `${username}${Date.now()}`;
}

async function isUsernameUnique(username: string): Promise<boolean> {
  const result = await query("SELECT 1 FROM users WHERE username = $1", [
    username,
  ]);
  return result.length === 0;
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, role, status, tempPassword } = validation.data;

    const newUser = await transaction(async (client) => {
      // Check if email already exists
      const emailCheck = await client.query(
        "SELECT 1 FROM users WHERE email = $1",
        [email]
      );

      if (emailCheck.rows.length > 0) {
        throw new Error("Email already exists");
      }

      // Generate unique username
      const username = await generateUniqueUsername(name, email);

      // Insert the new user with plain text password
      const insertResult = await client.query(
        `INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING user_id, username, email, full_name, role, is_active, created_at`,
        [username, email, tempPassword, name, role.toLowerCase(), status === "Active"]
      );

      return insertResult.rows[0];
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: newUser.user_id,
          username: newUser.username,
          email: newUser.email,
          name: newUser.full_name,
          role: newUser.role.charAt(0).toUpperCase() + newUser.role.slice(1),
          status: newUser.is_active ? "Active" : "Inactive",
          joinDate: newUser.created_at.toISOString().split('T')[0],
        },
        credentials: {
          username: newUser.username,
          email: newUser.email,
          tempPassword: tempPassword,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message === "Email already exists" ? 409 : 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, email, role, status } = body;

    if (!id || !name || !email || !role || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const updatedUser = await transaction(async (client) => {
      // Check if email already exists for other users
      const emailCheck = await client.query(
        "SELECT 1 FROM users WHERE email = $1 AND user_id != $2",
        [email, id]
      );

      if (emailCheck.rows.length > 0) {
        throw new Error("Email already exists");
      }

      // Update the user
      const updateResult = await client.query(
        `UPDATE users 
         SET full_name = $1, email = $2, role = $3, is_active = $4, updated_at = NOW()
         WHERE user_id = $5
         RETURNING user_id, username, email, full_name, role, is_active, created_at`,
        [name, email, role.toLowerCase(), status === "Active", id]
      );

      if (updateResult.rows.length === 0) {
        throw new Error("User not found");
      }

      return updateResult.rows[0];
    });

    return NextResponse.json(
      {
        message: "User updated successfully",
        user: {
          id: updatedUser.user_id,
          username: updatedUser.username,
          email: updatedUser.email,
          name: updatedUser.full_name,
          role: updatedUser.role.charAt(0).toUpperCase() + updatedUser.role.slice(1),
          status: updatedUser.is_active ? "Active" : "Inactive",
          joinDate: updatedUser.created_at.toISOString().split('T')[0],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    const status = error.message === "Email already exists" ? 409 : error.message === "User not found" ? 404 : 500;
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await verifyToken(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await query(
      `SELECT user_id, username, email, full_name, role, is_active, created_at
       FROM users 
       ORDER BY created_at DESC`
    );

    const users = result.map(row => ({
      id: row.user_id,
      username: row.username,
      email: row.email,
      name: row.full_name,
      role: row.role.charAt(0).toUpperCase() + row.role.slice(1),
      status: row.is_active ? "Active" : "Inactive",
      joinDate: row.created_at.toISOString().split('T')[0],
      lastLogin: 'Never', // Default since last_login column doesn't exist yet
      sessionsCount: 0, // You can implement session counting later
      verified: row.is_active,
    }));

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}