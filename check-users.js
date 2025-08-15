const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'mindcare_hub_test',
  password: 'admin123',
  port: 5432,
});

async function checkUsers() {
  try {
    console.log('Checking existing users...');
    
    // Get all users
    const allUsers = await pool.query('SELECT user_id, role, full_name FROM users ORDER BY user_id');
    console.log('All users:');
    console.table(allUsers.rows);
    
    // Get psychiatrists and counselors
    const providers = await pool.query("SELECT user_id, role, full_name FROM users WHERE role IN ('psychiatrist', 'counselor')");
    console.log('\nProviders (psychiatrists and counselors):');
    console.table(providers.rows);
    
    // Get patients
    const patients = await pool.query("SELECT user_id, role, full_name FROM users WHERE role = 'patient'");
    console.log('\nPatients:');
    console.table(patients.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkUsers();