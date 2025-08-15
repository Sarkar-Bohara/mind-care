import { Pool } from 'pg';

// Database connection singleton
let pool: Pool | null = null;

export function getDatabase() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }



    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });
  }

  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const db = getDatabase();
  const result = await db.query(text, params);
  return result.rows;
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const db = getDatabase();
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}