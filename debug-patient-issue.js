const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'mindcare_hub_test',
  password: 'admin123',
  port: 5432,
});

async function debugPatientIssue() {
  try {
    console.log('=== Debugging Patient Not Found Issue ===');
    
    // Check total user count
    const userCount = await pool.query('SELECT COUNT(*) as total FROM users');
    console.log('Total users:', userCount.rows[0].total);
    
    // Check patient count
    const patientCount = await pool.query("SELECT COUNT(*) as total FROM users WHERE role = 'patient'");
    console.log('Total patients:', patientCount.rows[0].total);
    
    // List patient IDs and names
    const patients = await pool.query("SELECT user_id, username, full_name, is_active FROM users WHERE role = 'patient'");
    console.log('\nPatient details:');
    patients.rows.forEach(patient => {
      console.log(`- ID: ${patient.user_id}, Username: ${patient.username}, Name: ${patient.full_name}, Active: ${patient.is_active}`);
    });
    
    // Check if there are any appointments and their patient IDs
    const appointments = await pool.query('SELECT DISTINCT patient_id FROM appointments');
    console.log('\nPatient IDs in appointments:');
    appointments.rows.forEach(apt => {
      console.log(`- Patient ID: ${apt.patient_id}`);
    });
    
    // Check for orphaned appointments (appointments with non-existent patients)
    const orphaned = await pool.query(`
      SELECT a.appointment_id, a.patient_id 
      FROM appointments a 
      LEFT JOIN users u ON a.patient_id = u.user_id 
      WHERE u.user_id IS NULL
    `);
    console.log('\nOrphaned appointments (patient not found):');
    if (orphaned.rows.length === 0) {
      console.log('- None found');
    } else {
      orphaned.rows.forEach(apt => {
        console.log(`- Appointment ID: ${apt.appointment_id}, Patient ID: ${apt.patient_id}`);
      });
    }
    
  } catch (error) {
    console.error('Error during debugging:', error.message);
  } finally {
    await pool.end();
  }
}

debugPatientIssue();