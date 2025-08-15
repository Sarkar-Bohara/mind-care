-- Run this ONLY in mindcare_hub_test database
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'psychiatrist', 'counselor', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert test user
INSERT INTO users (username, email, password_hash, full_name, phone, role, is_active) VALUES
('arun.bohara', 'arunbohara57@gmail.com', 'admin123', 'Arun Bohara', '+60123456789', 'admin', true);

-- Verify it worked
SELECT username, role FROM users;