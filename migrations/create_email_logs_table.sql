-- Create email_logs table to track email communications
CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER REFERENCES appointments(appointment_id) ON DELETE SET NULL,
  sender_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_logs_appointment_id ON email_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sender_id ON email_logs(sender_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);

-- Add comment to table
COMMENT ON TABLE email_logs IS 'Stores email communication history between counselors and patients';
COMMENT ON COLUMN email_logs.appointment_id IS 'Optional reference to related appointment';
COMMENT ON COLUMN email_logs.sender_id IS 'User ID of the email sender (typically counselor)';
COMMENT ON COLUMN email_logs.recipient_email IS 'Email address of the recipient';
COMMENT ON COLUMN email_logs.subject IS 'Email subject line';
COMMENT ON COLUMN email_logs.message IS 'Email message content';
COMMENT ON COLUMN email_logs.sent_at IS 'Timestamp when email was sent';