-- Migration: Add responses table for response-level logging
-- Run this in Supabase SQL Editor

-- Create responses table for individual answer logging
CREATE TABLE IF NOT EXISTS responses (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  objective TEXT NOT NULL,
  item_id TEXT,
  session_id TEXT,
  selected_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  latency_ms INTEGER,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_responses_user_id ON responses(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_objective ON responses(objective);
CREATE INDEX IF NOT EXISTS idx_responses_item_id ON responses(item_id) WHERE item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_responses_session_id ON responses(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at);

-- Composite index for user+objective queries (matches mastery table pattern)
CREATE INDEX IF NOT EXISTS idx_responses_user_objective ON responses(user_id, objective);

-- Enable Row Level Security (optional, adjust policies as needed)
-- ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE responses IS 'Individual MCQ response records for psychometric analysis';
COMMENT ON COLUMN responses.item_id IS 'Optional identifier for specific question items';
COMMENT ON COLUMN responses.session_id IS 'Optional identifier for grouping responses within a session';
COMMENT ON COLUMN responses.latency_ms IS 'Time taken to answer in milliseconds';
COMMENT ON COLUMN responses.difficulty IS 'Difficulty level of the item (easy/medium/hard)';
