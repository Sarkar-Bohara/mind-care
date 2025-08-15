const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testAnalytics() {
  try {
    console.log('Testing database connection...');
    
    // Test users table
    const users = await pool.query('SELECT COUNT(*) as count, role FROM users WHERE is_active = true GROUP BY role');
    console.log('Users by role:', users.rows);
    
    // Test appointments table
    const appointments = await pool.query('SELECT COUNT(*) as count FROM appointments');
    console.log('Total appointments:', appointments.rows[0]?.count || 0);
    
    // Test resources table
    const resources = await pool.query('SELECT COUNT(*) as count FROM resources WHERE is_published = true');
    console.log('Total resources:', resources.rows[0]?.count || 0);
    
    // Test community posts
    const posts = await pool.query('SELECT COUNT(*) as count FROM community_posts WHERE status = \'approved\'');
    console.log('Total posts:', posts.rows[0]?.count || 0);
    
    // Test mood entries
    const moods = await pool.query('SELECT COUNT(*) as count FROM mood_entries');
    console.log('Total mood entries:', moods.rows[0]?.count || 0);
    
    // Test messages
    const messages = await pool.query('SELECT COUNT(*) as count FROM messages');
    console.log('Total messages:', messages.rows[0]?.count || 0);
    
  } catch (error) {
    console.error('Database test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testAnalytics();