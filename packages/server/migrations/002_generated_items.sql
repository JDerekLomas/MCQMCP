-- Migration: Add generated_items table for caching AI-generated MCQs
-- Run this migration in Supabase SQL editor

-- Table for storing AI-generated MCQ items
CREATE TABLE IF NOT EXISTS generated_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The objective/topic this was generated for
  objective TEXT NOT NULL,
  objective_normalized TEXT NOT NULL,

  -- Optional mapped topic if we can infer one
  topic TEXT,

  -- Question content
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  stem TEXT NOT NULL,
  code TEXT,
  options JSONB NOT NULL, -- Array of {id, text} objects
  correct TEXT NOT NULL CHECK (correct IN ('A', 'B', 'C', 'D')),
  feedback JSONB NOT NULL, -- {correct, incorrect, explanation}

  -- Metadata
  source TEXT DEFAULT 'ai-generated', -- 'ai-generated', 'external', 'user-submitted'
  model TEXT, -- e.g., 'claude-sonnet-4-20250514'
  quality TEXT DEFAULT 'unreviewed' CHECK (quality IN ('unreviewed', 'validated', 'flagged', 'deprecated')),

  -- Usage tracking
  use_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0, -- How many times answered correctly
  total_attempts INTEGER DEFAULT 0, -- Total answer attempts

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for looking up by objective (most common query)
CREATE INDEX IF NOT EXISTS idx_generated_objective ON generated_items(objective_normalized);

-- Index for filtering by topic
CREATE INDEX IF NOT EXISTS idx_generated_topic ON generated_items(topic);

-- Index for quality filtering
CREATE INDEX IF NOT EXISTS idx_generated_quality ON generated_items(quality);

-- Index for finding popular items
CREATE INDEX IF NOT EXISTS idx_generated_use_count ON generated_items(use_count DESC);

-- Composite index for objective + difficulty lookup
CREATE INDEX IF NOT EXISTS idx_generated_obj_diff ON generated_items(objective_normalized, difficulty);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_generated_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS generated_items_updated_at ON generated_items;
CREATE TRIGGER generated_items_updated_at
  BEFORE UPDATE ON generated_items
  FOR EACH ROW
  EXECUTE FUNCTION update_generated_items_updated_at();

-- Grant permissions (adjust based on your Supabase setup)
-- ALTER TABLE generated_items ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all operations" ON generated_items FOR ALL USING (true);

COMMENT ON TABLE generated_items IS 'Cache of AI-generated MCQ items for objectives not in the curated item bank';
COMMENT ON COLUMN generated_items.objective IS 'Original objective text from the user request';
COMMENT ON COLUMN generated_items.objective_normalized IS 'Lowercase, trimmed version for matching';
COMMENT ON COLUMN generated_items.topic IS 'Canonical topic ID if we could infer one';
COMMENT ON COLUMN generated_items.quality IS 'Review status: unreviewed (new), validated (human reviewed), flagged (reported), deprecated (removed)';
COMMENT ON COLUMN generated_items.use_count IS 'Number of times this item has been served';
