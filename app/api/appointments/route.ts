import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, transaction } from '@/lib/database';
import { appointmentSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let appointments;
    
    if (user.role === 'patient') {
      appointments = await query(`
        SELECT a.*, 
               pr.full_name as provider_name,
               pr.role as provider_role
        FROM appointments a
        JOIN users pr ON a.provider_id = pr.user_id
        WHERE a.patient_id = $1
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `, [user.id]);
    } else if (user.role === 'psychiatrist' || user.role === 'counselor') {
      appointments = await query(`
        SELECT a.*, 
               p.full_name as patient_name,
               p.email as patient_email
        FROM appointments a
        JOIN users p ON a.patient_id = p.user_id
        WHERE a.provider_id = $1
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `, [user.id]);
    } else {
      appointments = await query(`
        SELECT a.*, 
               p.full_name as patient_name,
               p.email as patient_email,
               pr.full_name as provider_name,
               pr.role as provider_role
        FROM appointments a
        JOIN users p ON a.patient_id = p.user_id
        JOIN users pr ON a.provider_id = pr.user_id
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `);
    }

    return NextResponse.json({ success: true, appointments });
  } catch (error) {
    console.error('Get appointments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { providerId, appointmentDate, appointmentTime, type, notes } = appointmentSchema.parse(body);

    const appointment = await transaction(async (client) => {
      // Check provider exists
      const provider = await client.query(
        'SELECT user_id, role, full_name FROM users WHERE user_id = $1 AND role IN ($2, $3) AND is_active = true',
        [providerId, 'psychiatrist', 'counselor']
      );

      if (!provider.rows.length) {
        throw new Error('Provider not found');
      }

      // Check for conflicts
      const conflict = await client.query(
        'SELECT 1 FROM appointments WHERE provider_id = $1 AND appointment_date = $2 AND appointment_time = $3 AND status != $4',
        [providerId, appointmentDate, appointmentTime, 'cancelled']
      );

      if (conflict.rows.length) {
        throw new Error('Time slot already booked');
      }

      // Create appointment
      const result = await client.query(
        `INSERT INTO appointments (patient_id, provider_id, appointment_date, appointment_time, type, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')
         RETURNING *`,
        [user.id, providerId, appointmentDate, appointmentTime, type, notes || null]
      );

      return result.rows[0];
    });

    return NextResponse.json({
      success: true,
      appointment,
      message: 'Appointment booked successfully'
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 400 }
    );
  }
}