-- User contexts table (stores conversations, learner profile, settings)
CREATE TABLE IF NOT EXISTS user_contexts (
  session_id VARCHAR(255) PRIMARY KEY,
  context JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment responses table
CREATE TABLE IF NOT EXISTS assessment_responses (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  item_id VARCHAR(255) NOT NULL,
  selected VARCHAR(10) NOT NULL,
  correct VARCHAR(10) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  latency_ms INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated items table (for tracking AI-generated questions)
CREATE TABLE IF NOT EXISTS generated_items (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  item_id VARCHAR(255) NOT NULL,
  item_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_responses_session ON assessment_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_item ON assessment_responses(item_id);
CREATE INDEX IF NOT EXISTS idx_generated_session ON generated_items(session_id);
