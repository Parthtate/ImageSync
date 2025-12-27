-- Database schema for Image Import System
-- This is a backup file - run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  google_drive_id VARCHAR(255) UNIQUE NOT NULL,
  size BIGINT NOT NULL DEFAULT 0,
  mime_type VARCHAR(100) NOT NULL,
  storage_path TEXT NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'google_drive',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_google_drive_id ON images(google_drive_id);
CREATE INDEX IF NOT EXISTS idx_source ON images(source);
CREATE INDEX IF NOT EXISTS idx_created_at ON images(created_at DESC);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_images_updated_at 
  BEFORE UPDATE ON images 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
