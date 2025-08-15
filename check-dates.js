const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'mindcare_hub_test',
  password: 'admin123',
  port: 5432,
});

async function checkDates() {
  try {
    console.log('Current system date:', new Date().toISOString().split('T')[0]);
    console.log('Current system time:', new Date().toISOString());
    
    const result = await pool.query(`
      SELECT 
        appointment_id,
        appointment_date,
        appointment_time,
        status,
        provider_id,
        patient_id,
        type
      FROM appointments 
      ORDER BY appointment_date DESC, appointment_time DESC
      LIMIT 10
    `);
    
    console.log('\nRecent appointments in database:');
    result.rows.forEach(row => {
      console.log(`ID: ${row.appointment_id}, Date: ${row.appointment_date.toISOString().split('T')[0]}, Time: ${row.appointment_time}, Status: ${row.status}, Provider: ${row.provider_id}`);
    });
    
    // Check today's appointments specifically
    const today = new Date().toISOString().split('T')[0];
    const todayResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM appointments 
      WHERE DATE(appointment_date) = $1
    `, [today]);
    
    console.log(`\nAppointments for today (${today}): ${todayResult.rows[0].count}`);
    
    // Check yesterday's appointments
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const yesterdayResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM appointments 
      WHERE DATE(appointment_date) = $1
    `, [yesterday]);
    
    console.log(`Appointments for yesterday (${yesterday}): ${yesterdayResult.rows[0].count}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkDates();