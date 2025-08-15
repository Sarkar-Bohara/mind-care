const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'mindcare_hub_test',
  password: 'Mindcare1234',
  port: 5432,
});

async function verifySetup() {
  try {
    // Test the exact query from login
    const userQuery = `
      SELECT user_id, username, email, password_hash, full_name, role
      FROM users 
      WHERE username = $1 AND is_active = true
    `;
    
    const result = await pool.query(userQuery, ['arun.bohara']);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ User found:', {
        username: user.username,
        email: user.email,
        role: user.role,
        password: user.password_hash
      });
      console.log('✅ Login should work now!');
    } else {
      console.log('❌ User arun.bohara not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifySetup();