import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { registerSchema } from '@/lib/validation';

async function generateUniqueUsername(name: string): Promise<string> {
  let username = name
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '')
    .substring(0, 20);

  // Check if username exists
  const existing = await query('SELECT 1 FROM users WHERE username = $1', [username]);
  
  if (!existing.length) {
    return username;
  }

  // Add random suffix if username exists
  for (let i = 0; i < 5; i++) {
    const suffix = Math.floor(100 + Math.random() * 900);
    const newUsername = `${username}${suffix}`;
    const check = await query('SELECT 1 FROM users WHERE username = $1', [newUsername]);
    
    if (!check.length) {
      return newUsername;
    }
  }

  return `user${Date.now()}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, dateOfBirth } = registerSchema.parse(body);

    // Check if email exists
    const existingUser = await query('SELECT 1 FROM users WHERE email = $1', [email]);
    
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const username = await generateUniqueUsername(name);

    const newUser = await query(
      `INSERT INTO users (username, email, password_hash, full_name, phone, date_of_birth, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, 'patient', true)
       RETURNING user_id, username, email, full_name, role`,
      [username, email, password, name, phone, dateOfBirth]
    );

    return NextResponse.json(
      { user: newUser[0], message: 'Registration successful' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}