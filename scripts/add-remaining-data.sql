-- Add more users
INSERT INTO users (username, email, password_hash, full_name, phone, role, is_active) VALUES
('khusi.ray', 'khusburay160@gmail.com', 'doctor123', 'Khusbu Ray', '+60123456790', 'psychiatrist', true),
('denish.thapa', 'denishkumarthapa@gmail.com', 'counselor123', 'Denish Thapa', '+60123456792', 'counselor', true),
('Unisha.Shrestha', 'unishacharming2020@gmail.com', 'password123', 'Unisha Shrestha', '+977-9852145626', 'patient', true),
('patient.siti', 'siti@gmail.com', 'password123', 'Siti Nurhaliza', '+60123456795', 'patient', true);

-- Create appointments table
CREATE TABLE appointments (
    appointment_id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES users(user_id),
    provider_id INTEGER REFERENCES users(user_id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    type VARCHAR(50) NOT NULL CHECK (type IN ('individual', 'group', 'family', 'consultation')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'confirmed', 'completed', 'cancelled', 'no-show')),
    notes TEXT,
    meeting_link VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SELECT 'Setup completed! You can now login as admin, psychiatrist, counselor, or patient.' as result;