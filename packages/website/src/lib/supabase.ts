import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface MasteryRecord {
  user_id: string;
  objective: string;
  correct: number;
  total: number;
  updated_at: string;
}

export interface ResponseRecord {
  id: number;
  user_id: string;
  objective: string;
  item_id: string | null;
  session_id: string | null;
  selected_answer: string;
  correct_answer: string;
  is_correct: boolean;
  latency_ms: number | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  created_at: string;
}
