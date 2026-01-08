/**
 * Restore MCQMCP items to a separate mcq_items table
 *
 * Usage: npx tsx scripts/restore-mcq-items.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cxzwclvkkjvkromubzmp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4endjbHZra2p2a3JvbXViem1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE1MjEzOCwiZXhwIjoyMDc5NzI4MTM4fQ.eQNjAwY_6jIft6olbpnlysuSukZWmXlTQmKDCxHonJQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const HF_API = 'https://datasets-server.huggingface.co/rows';

// ============ CREATE TABLE ============

async function createTable(): Promise<boolean> {
  console.log('Creating mcq_items table...');

  const { error } = await supabase.rpc('exec_sql', {
    sql: `
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

      CREATE INDEX IF NOT EXISTS idx_mcq_items_source ON mcq_items(source);
      CREATE INDEX IF NOT EXISTS idx_mcq_items_topic ON mcq_items(topic);
      CREATE INDEX IF NOT EXISTS idx_mcq_items_difficulty ON mcq_items(difficulty);
      CREATE INDEX IF NOT EXISTS idx_mcq_items_tags ON mcq_items USING GIN(tags);

      ALTER TABLE mcq_items ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Public read access" ON mcq_items;
      CREATE POLICY "Public read access" ON mcq_items FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Service role full access" ON mcq_items;
      CREATE POLICY "Service role full access" ON mcq_items FOR ALL USING (auth.role() = 'service_role');
    `
  });

  if (error) {
    // RPC might not exist, try raw SQL approach
    console.log('RPC not available, will create table via insert test...');

    // Try to insert a test record to see if table exists
    const { error: testError } = await supabase
      .from('mcq_items')
      .select('id')
      .limit(1);

    if (testError && testError.message.includes('does not exist')) {
      console.log('Table does not exist. Please run this SQL in Supabase dashboard:');
      console.log(`
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

CREATE INDEX IF NOT EXISTS idx_mcq_items_source ON mcq_items(source);
CREATE INDEX IF NOT EXISTS idx_mcq_items_topic ON mcq_items(topic);
CREATE INDEX IF NOT EXISTS idx_mcq_items_difficulty ON mcq_items(difficulty);

ALTER TABLE mcq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON mcq_items FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON mcq_items FOR ALL USING (auth.role() = 'service_role');
      `);
      return false;
    }

    console.log('Table exists or was created.');
    return true;
  }

  console.log('Table created successfully.');
  return true;
}

// ============ IMPORT ARC ============

async function fetchFromHuggingFace(dataset: string, config: string, split: string, offset: number = 0, length: number = 100, retries: number = 3): Promise<any> {
  const url = `${HF_API}?dataset=${dataset}&config=${config}&split=${split}&offset=${offset}&length=${length}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch(url);

    if (response.status === 429) {
      // Rate limited - wait and retry
      const waitTime = Math.pow(2, attempt + 1) * 1000; // Exponential backoff: 2s, 4s, 8s
      console.log(`    Rate limited, waiting ${waitTime/1000}s...`);
      await new Promise(r => setTimeout(r, waitTime));
      continue;
    }

    if (!response.ok) {
      throw new Error(`Failed: ${response.statusText}`);
    }

    return response.json();
  }

  throw new Error('Max retries exceeded due to rate limiting');
}

async function importARC(): Promise<number> {
  console.log('\n========== Importing ARC ==========');
  let totalImported = 0;

  for (const [config, difficulty] of [['ARC-Easy', 'easy'], ['ARC-Challenge', 'hard']] as const) {
    console.log(`\nImporting ${config}...`);

    for (const split of ['train', 'test', 'validation']) {
      try {
        let offset = 0;
        let hasMore = true;
        let splitTotal = 0;

        while (hasMore) {
          const data = await fetchFromHuggingFace('allenai/ai2_arc', config, split, offset, 100);

          if (!data.rows || data.rows.length === 0) {
            hasMore = false;
            break;
          }

          const items = data.rows.map((row: any, idx: number) => {
            const r = row.row;
            const choices = r.choices;

            const getChoice = (label: string) => {
              const idx = choices.label?.indexOf(label);
              return idx >= 0 ? choices.text?.[idx] || '' : '';
            };

            return {
              id: `arc-${difficulty}-${r.id || `${split}-${offset + idx}`}`,
              source: 'arc',
              topic: 'science-general',
              difficulty: difficulty,
              stem: r.question,
              option_a: getChoice('A') || getChoice('1') || choices.text?.[0] || '',
              option_b: getChoice('B') || getChoice('2') || choices.text?.[1] || '',
              option_c: getChoice('C') || getChoice('3') || choices.text?.[2] || '',
              option_d: getChoice('D') || getChoice('4') || choices.text?.[3] || '',
              correct: r.answerKey?.replace('1', 'A').replace('2', 'B').replace('3', 'C').replace('4', 'D') || 'A',
              metadata: { arc_config: config, arc_split: split, arc_id: r.id },
              tags: ['science', config === 'ARC-Easy' ? 'arc-easy' : 'arc-challenge'],
            };
          }).filter((item: any) => item.stem && item.option_a);

          if (items.length > 0) {
            const { error } = await supabase
              .from('mcq_items')
              .upsert(items, { onConflict: 'id' });

            if (error) {
              console.error(`  Error: ${error.message}`);
            } else {
              splitTotal += items.length;
              totalImported += items.length;
            }
          }

          offset += data.rows.length;
          hasMore = data.rows.length === 100;
          await new Promise(r => setTimeout(r, 200));
        }

        if (splitTotal > 0) {
          console.log(`  ${split}: ${splitTotal} items`);
        }
      } catch (err) {
        console.log(`  ${split}: skipped`);
      }
    }
  }

  console.log(`ARC total: ${totalImported} items`);
  return totalImported;
}

// ============ IMPORT MMLU ============

async function importMMLU(): Promise<number> {
  console.log('\n========== Importing MMLU (Math) ==========');
  let totalImported = 0;

  const mathSubjects = [
    'abstract_algebra',
    'college_mathematics',
    'elementary_mathematics',
    'high_school_mathematics',
    'high_school_statistics'
  ];

  for (const subject of mathSubjects) {
    console.log(`\nImporting ${subject}...`);

    for (const split of ['test', 'validation', 'dev']) {
      try {
        let offset = 0;
        let hasMore = true;
        let splitTotal = 0;

        while (hasMore) {
          const data = await fetchFromHuggingFace('cais/mmlu', subject, split, offset, 100);

          if (!data.rows || data.rows.length === 0) {
            hasMore = false;
            break;
          }

          const items = data.rows.map((row: any, idx: number) => {
            const r = row.row;
            const choices = r.choices || [];
            const answerIdx = r.answer;
            const letters = ['A', 'B', 'C', 'D'];

            return {
              id: `mmlu-${subject}-${split}-${offset + idx}`,
              source: 'mmlu',
              topic: `math-${subject.replace(/_/g, '-')}`,
              difficulty: subject.includes('college') || subject.includes('abstract') ? 'hard' :
                         subject.includes('elementary') ? 'easy' : 'medium',
              stem: r.question,
              option_a: choices[0] || '',
              option_b: choices[1] || '',
              option_c: choices[2] || '',
              option_d: choices[3] || '',
              correct: letters[answerIdx] || 'A',
              metadata: { mmlu_subject: subject, mmlu_split: split },
              tags: ['math', 'mmlu', subject.replace(/_/g, '-')],
            };
          }).filter((item: any) => item.stem && item.option_a);

          if (items.length > 0) {
            const { error } = await supabase
              .from('mcq_items')
              .upsert(items, { onConflict: 'id' });

            if (error) {
              console.error(`  Error: ${error.message}`);
            } else {
              splitTotal += items.length;
              totalImported += items.length;
            }
          }

          offset += data.rows.length;
          hasMore = data.rows.length === 100;
          await new Promise(r => setTimeout(r, 200));
        }

        if (splitTotal > 0) {
          console.log(`  ${split}: ${splitTotal} items`);
        }
      } catch (err) {
        console.log(`  ${split}: skipped`);
      }
    }
  }

  console.log(`MMLU total: ${totalImported} items`);
  return totalImported;
}

// ============ IMPORT GSM8K ============

async function importGSM8K(): Promise<number> {
  console.log('\n========== Importing GSM8K ==========');
  let totalImported = 0;

  for (const split of ['train', 'test']) {
    try {
      let offset = 0;
      let hasMore = true;
      let splitTotal = 0;

      while (hasMore) {
        const data = await fetchFromHuggingFace('openai/gsm8k', 'main', split, offset, 100);

        if (!data.rows || data.rows.length === 0) {
          hasMore = false;
          break;
        }

        const items = data.rows.map((row: any, idx: number) => {
          const r = row.row;
          // GSM8K has open-ended answers, we'll convert to MCQ format
          const answer = r.answer?.split('####')?.pop()?.trim() || '';

          // Generate plausible wrong answers
          const numAnswer = parseFloat(answer.replace(/[,$]/g, ''));
          const wrongAnswers = isNaN(numAnswer) ? ['N/A', 'N/A', 'N/A'] : [
            String(numAnswer + Math.floor(Math.random() * 10) + 1),
            String(numAnswer - Math.floor(Math.random() * 10) - 1),
            String(numAnswer * 2),
          ];

          return {
            id: `gsm8k-${split}-${offset + idx}`,
            source: 'gsm8k',
            topic: 'math-word-problems',
            difficulty: 'medium',
            stem: r.question,
            option_a: answer,
            option_b: wrongAnswers[0],
            option_c: wrongAnswers[1],
            option_d: wrongAnswers[2],
            correct: 'A',
            explanation: r.answer,
            metadata: { gsm8k_split: split, original_answer: answer },
            tags: ['math', 'word-problems', 'gsm8k'],
          };
        }).filter((item: any) => item.stem && item.option_a);

        if (items.length > 0) {
          const { error } = await supabase
            .from('mcq_items')
            .upsert(items, { onConflict: 'id' });

          if (error) {
            console.error(`  Error: ${error.message}`);
          } else {
            splitTotal += items.length;
            totalImported += items.length;
          }
        }

        offset += data.rows.length;
        hasMore = data.rows.length === 100;
        await new Promise(r => setTimeout(r, 50));
      }

      console.log(`  ${split}: ${splitTotal} items`);
    } catch (err) {
      console.log(`  ${split}: skipped - ${err}`);
    }
  }

  console.log(`GSM8K total: ${totalImported} items`);
  return totalImported;
}

// ============ UPDATE SOURCES ============

async function updateSources(arcCount: number, mmluCount: number, gsm8kCount: number) {
  console.log('\n========== Updating Sources ==========');

  const updates = [
    { id: 'arc', count: arcCount },
    { id: 'mmlu', count: mmluCount },
    { id: 'gsm8k', count: gsm8kCount },
  ];

  for (const { id, count } of updates) {
    const { error } = await supabase
      .from('sources')
      .update({ item_count: count, imported_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.log(`  ${id}: failed - ${error.message}`);
    } else {
      console.log(`  ${id}: ${count} items`);
    }
  }
}

// ============ MAIN ============

async function main() {
  console.log('===========================================');
  console.log('  MCQMCP Items Restoration');
  console.log('  Target: mcq_items table');
  console.log('===========================================\n');

  // Check if table exists
  const { error: checkError } = await supabase
    .from('mcq_items')
    .select('id')
    .limit(1);

  if (checkError && checkError.message.includes('does not exist')) {
    console.log('ERROR: mcq_items table does not exist.');
    console.log('\nPlease run this SQL in Supabase SQL Editor first:\n');
    console.log(`
CREATE TABLE mcq_items (
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

CREATE INDEX idx_mcq_items_source ON mcq_items(source);
CREATE INDEX idx_mcq_items_topic ON mcq_items(topic);
CREATE INDEX idx_mcq_items_difficulty ON mcq_items(difficulty);

ALTER TABLE mcq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON mcq_items FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON mcq_items FOR ALL USING (auth.role() = 'service_role');
    `);
    return;
  }

  console.log('mcq_items table exists, proceeding with import...\n');

  const arcCount = await importARC();
  const mmluCount = await importMMLU();
  const gsm8kCount = await importGSM8K();

  await updateSources(arcCount, mmluCount, gsm8kCount);

  const total = arcCount + mmluCount + gsm8kCount;
  console.log('\n===========================================');
  console.log(`  COMPLETE: ${total} items imported`);
  console.log('===========================================');
}

main().catch(console.error);
