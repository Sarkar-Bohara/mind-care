import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { query } from './database';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: 'patient' | 'psychiatrist' | 'counselor' | 'admin';
  fullName: string;
}

export function generateToken(user: AuthUser): string {
  const payload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '24h' });
}

export async function verifyToken(request: NextRequest): Promise<AuthUser | null> {
  try {
    let token: string | undefined;

    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = request.cookies.get('token')?.value;
    }

    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Verify user still exists and is active
    const user = await query(
      'SELECT user_id, username, email, full_name, role FROM users WHERE user_id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (!user.length) return null;

    return {
      id: user[0].user_id,
      username: user[0].username,
      email: user[0].email,
      role: user[0].role,
      fullName: user[0].full_name,
    };
  } catch (error) {
    return null;
  }
}

export async function authenticateUser(identifier: string, password: string): Promise<AuthUser | null> {
  const isEmail = identifier.includes('@');
  const field = isEmail ? 'email' : 'username';
  
  const users = await query(
    `SELECT user_id, username, email, password_hash, full_name, role 
     FROM users 
     WHERE ${field} = $1 AND is_active = true`,
    [identifier]
  );

  const user = users[0];
  if (!user || user.password_hash !== password) {
    return null;
  }

  return {
    id: user.user_id,
    username: user.username,
    email: user.email,
    role: user.role,
    fullName: user.full_name,
  };
}