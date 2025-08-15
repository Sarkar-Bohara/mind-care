const { Pool } = require('pg');

// Use the same configuration as the app
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DATABASE || 'mindcare_hub_test',
  password: process.env.POSTGRES_PASSWORD || 'admin123',
  port: Number(process.env.POSTGRES_PORT) || 5432,
});

async function createTables() {
  try {
    console.log('Creating conversations table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        conversation_id VARCHAR(100) PRIMARY KEY,
        patient_id INTEGER NOT NULL,
        psychiatrist_id INTEGER NOT NULL,
        last_message_id INTEGER,
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Creating messages table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        message_id SERIAL PRIMARY KEY,
        conversation_id VARCHAR(100) NOT NULL,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Creating indexes...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_conversations_patient ON conversations(patient_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_conversations_psychiatrist ON conversations(psychiatrist_id)');
    
    console.log('Tables created successfully!');
    
    // Verify tables exist
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('conversations', 'messages')
    `);
    
    console.log('Existing tables:', result.rows);
    
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await pool.end();
  }
}

createTables();