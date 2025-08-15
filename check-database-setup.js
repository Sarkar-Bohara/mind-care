const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'mindcare_hub_test',
  password: 'Mindcare1234',
  port: 5432,
});

async function checkDatabase() {
  try {
    console.log('Checking database setup...');
    
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ Users table does not exist!');
      console.log('You need to run the SQL scripts in this order:');
      console.log('1. 01-create-tables.sql');
      console.log('2. 03-fix-appointments-constraints.sql');
      console.log('3. 04-check-and-fix-appointment-types.sql');
      console.log('4. 06-create-clinical-tables.sql');
      console.log('5. 02-seed-data.sql');
      console.log('6. 07-update-passwords-plaintext.sql');
    } else {
      console.log('✅ Users table exists');
      
      // Check user count
      const userCount = await pool.query('SELECT COUNT(*) FROM users');
      console.log(`✅ Users in database: ${userCount.rows[0].count}`);
      
      // List all tables
      const allTables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      console.log('✅ All tables in database:');
      allTables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();