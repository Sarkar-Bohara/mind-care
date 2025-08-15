-- Create messages table for patient-psychiatrist communication
CREATE TABLE IF NOT EXISTS messages (
    message_id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(100) NOT NULL, -- Format: 'patient_id-psychiatrist_id'
    sender_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create conversations table to track conversation metadata
CREATE TABLE IF NOT EXISTS conversations (
    conversation_id VARCHAR(100) PRIMARY KEY, -- Format: 'patient_id-psychiatrist_id'
    patient_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    psychiatrist_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    last_message_id INTEGER REFERENCES messages(message_id),
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_patient ON conversations(patient_id);
CREATE INDEX IF NOT EXISTS idx_conversations_psychiatrist ON conversations(psychiatrist_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- Insert some sample messages for testing
INSERT INTO conversations (conversation_id, patient_id, psychiatrist_id, last_message_at) VALUES
('6-4', 6, 4, CURRENT_TIMESTAMP - INTERVAL '1 hour'),
('7-4', 7, 4, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('8-4', 8, 4, CURRENT_TIMESTAMP - INTERVAL '1 day');

INSERT INTO messages (conversation_id, sender_id, receiver_id, content, is_read, created_at) VALUES
-- Conversation between patient 6 and psychiatrist 4
('6-4', 6, 4, 'Hello Dr. Sarah, I wanted to follow up on our last session.', true, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('6-4', 4, 6, 'Hi! Thank you for reaching out. How have you been feeling since our last session?', true, CURRENT_TIMESTAMP - INTERVAL '1 hour 45 minutes'),
('6-4', 6, 4, 'I have been practicing the breathing exercises you taught me. They seem to help with my anxiety.', false, CURRENT_TIMESTAMP - INTERVAL '1 hour'),

-- Conversation between patient 7 and psychiatrist 4
('7-4', 7, 4, 'Dr. Sarah, I have a question about my medication.', true, CURRENT_TIMESTAMP - INTERVAL '3 hours'),
('7-4', 4, 7, 'Of course! What would you like to know about your medication?', true, CURRENT_TIMESTAMP - INTERVAL '2 hours 30 minutes'),
('7-4', 7, 4, 'I have been experiencing some side effects. Should I be concerned?', false, CURRENT_TIMESTAMP - INTERVAL '2 hours'),

-- Conversation between patient 8 and psychiatrist 4
('8-4', 8, 4, 'Thank you for the session yesterday. I feel much better.', true, CURRENT_TIMESTAMP - INTERVAL '1 day'),
('8-4', 4, 8, 'I am so glad to hear that! Keep up the great work with your self-care routine.', false, CURRENT_TIMESTAMP - INTERVAL '23 hours');

-- Update last_message_id in conversations
UPDATE conversations SET last_message_id = (
    SELECT message_id FROM messages 
    WHERE conversation_id = conversations.conversation_id 
    ORDER BY created_at DESC 
    LIMIT 1
);