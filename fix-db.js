const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'mindcare_hub_test',
  password: 'admin123',
  port: 5432,
});

async function runSQLScript() {
  try {
    // Read the SQL script
    const sqlScript = fs.readFileSync(path.join(__dirname, 'scripts', '06-create-clinical-tables.sql'), 'utf8');
    
    // Split the script into individual statements
    const statements = sqlScript.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log('Executing SQL migration script...');
    
    for (const statement of statements) {
      const trimmedStatement = statement.trim();
      if (trimmedStatement) {
        try {
          const result = await pool.query(trimmedStatement);
          if (result.rows && result.rows.length > 0) {
            console.log('Result:', result.rows);
          }
        } catch (error) {
          console.error('Error executing statement:', trimmedStatement);
          console.error('Error:', error.message);
        }
      }
    }
    
    console.log('Migration script completed!');
  } catch (error) {
    console.error('Error reading or executing SQL script:', error);
  } finally {
    await pool.end();
  }
}

runSQLScript();