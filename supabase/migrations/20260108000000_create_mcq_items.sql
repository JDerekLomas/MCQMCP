-- Create mcq_items table for MCQMCP assessment items
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/cxzwclvkkjvkromubzmp/sql/new

CREATE TABLE IF NOT EXISTS mcq_items (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  topic TEXT,
  difficulty TEXT,
  stem TEXT NOT NULL,
  code TEXT,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT,
  option_d TEXT,
  option_e TEXT,
  correct TEXT NOT NULL,
  explanation TEXT,
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_mcq_items_source ON mcq_items(source);
CREATE INDEX IF NOT EXISTS idx_mcq_items_topic ON mcq_items(topic);
CREATE INDEX IF NOT EXISTS idx_mcq_items_difficulty ON mcq_items(difficulty);
CREATE INDEX IF NOT EXISTS idx_mcq_items_tags ON mcq_items USING GIN(tags);

-- Row-level security
ALTER TABLE mcq_items ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
DROP POLICY IF EXISTS "Public read access" ON mcq_items;
CREATE POLICY "Public read access" ON mcq_items
  FOR SELECT USING (true);

-- Policy: Only service role can insert/update/delete
DROP POLICY IF EXISTS "Service role full access" ON mcq_items;
CREATE POLICY "Service role full access" ON mcq_items
  FOR ALL USING (auth.role() = 'service_role');
