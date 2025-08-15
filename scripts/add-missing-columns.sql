-- Add missing columns to resources table
ALTER TABLE resources ADD COLUMN IF NOT EXISTS downloads INTEGER DEFAULT 0;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS url VARCHAR(500);
ALTER TABLE resources ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);

-- Add missing columns to community_posts table
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS moderated_by INTEGER REFERENCES users(user_id);
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP;

-- Update existing resources to have downloads column
UPDATE resources SET downloads = 0 WHERE downloads IS NULL;

-- Insert some sample pending posts for moderation
INSERT INTO community_posts (user_id, title, content, category, status) VALUES
(4, 'Need help with panic attacks', 'I have been experiencing panic attacks lately and need advice on coping strategies.', 'anxiety', 'pending'),
(5, 'Feeling overwhelmed', 'Work stress is affecting my mental health. Any suggestions?', 'stress', 'pending')
ON CONFLICT DO NOTHING;

SELECT 'Missing columns added successfully!' as result;