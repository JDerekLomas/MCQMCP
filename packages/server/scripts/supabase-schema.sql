-- MCQMCP Supabase Schema for Item Bank
-- Run this in Supabase SQL Editor to create the items table

-- Items table for MCQ assessment items
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,                    -- 'mmlu', 'gsm8k', 'mathqa', 'arc', 'mcqmcp', etc.
  topic TEXT,                              -- e.g., 'math-algebra', 'science-physics'
  difficulty TEXT,                         -- 'easy', 'medium', 'hard'
  stem TEXT NOT NULL,                      -- Question text
  code TEXT,                               -- Optional code snippet
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT,                           -- Some datasets only have 2-3 options
  option_d TEXT,
  option_e TEXT,                           -- Some have 5 options
  correct TEXT NOT NULL,                   -- 'A', 'B', 'C', 'D', or 'E'
  explanation TEXT,                        -- Answer explanation
  tags TEXT[],                             -- Array of tags
  metadata JSONB,                          -- Additional source-specific data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_items_source ON items(source);
CREATE INDEX IF NOT EXISTS idx_items_topic ON items(topic);
CREATE INDEX IF NOT EXISTS idx_items_difficulty ON items(difficulty);
CREATE INDEX IF NOT EXISTS idx_items_tags ON items USING GIN(tags);

-- Row-level security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Public read access" ON items
  FOR SELECT USING (true);

-- Policy: Only service role can insert/update/delete
CREATE POLICY "Service role full access" ON items
  FOR ALL USING (auth.role() = 'service_role');

-- Sources table to track dataset metadata
CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  license TEXT,
  url TEXT,
  item_count INTEGER DEFAULT 0,
  imported_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default sources
INSERT INTO sources (id, name, description, license, url) VALUES
  ('mmlu', 'MMLU', 'Massive Multitask Language Understanding benchmark', 'MIT', 'https://github.com/hendrycks/test'),
  ('gsm8k', 'GSM8K', 'Grade School Math 8K dataset', 'MIT', 'https://github.com/openai/grade-school-math'),
  ('mathqa', 'MathQA', 'Math Word Problem dataset', 'Apache-2.0', 'https://math-qa.github.io/'),
  ('arc', 'AI2 ARC', 'AI2 Reasoning Challenge', 'CC-BY-SA', 'https://allenai.org/data/arc'),
  ('sciq', 'SciQ', 'Science Questions dataset', 'CC-BY-NC', 'https://allenai.org/data/sciq'),
  ('mcqmcp', 'MCQMCP Original', 'Original MCQMCP items', 'CC-BY-4.0', 'https://github.com/JDerekLomas/MCQMCP')
ON CONFLICT (id) DO NOTHING;

-- Function to update item counts
CREATE OR REPLACE FUNCTION update_source_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sources SET item_count = (
    SELECT COUNT(*) FROM items WHERE source = NEW.source
  ) WHERE id = NEW.source;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update counts on insert
DROP TRIGGER IF EXISTS update_source_counts_trigger ON items;
CREATE TRIGGER update_source_counts_trigger
  AFTER INSERT ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_source_counts();
