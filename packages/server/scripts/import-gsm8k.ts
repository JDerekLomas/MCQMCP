/**
 * Import GSM8K (Grade School Math) items to Supabase via HuggingFace
 *
 * Usage: SUPABASE_URL=xxx SUPABASE_KEY=xxx npx tsx scripts/import-gsm8k.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const HF_API = 'https://datasets-server.huggingface.co/rows';

function parseAnswer(answer: string): string {
  const match = answer.match(/####\s*([\d,.-]+)/);
  return match ? match[1].replace(/,/g, '') : answer;
}

function generateDistractors(correct: number): number[] {
  const distractors = new Set<number>();
  const strategies = [
    () => correct + Math.floor(Math.random() * 10) + 1,
    () => Math.abs(correct - Math.floor(Math.random() * 10) - 1),
    () => correct * 2,
    () => Math.floor(correct / 2) || 1,
    () => correct + 10,
    () => Math.abs(correct - 10) || 5,
    () => correct + 5,
    () => Math.abs(correct - 5) || 3,
  ];

  for (const strategy of strategies) {
    if (distractors.size >= 3) break;
    const val = Math.round(strategy());
    if (val !== correct && val >= 0) {
      distractors.add(val);
    }
  }

  // Fallback: add nearby numbers
  for (let i = 1; distractors.size < 3 && i < 20; i++) {
    if (correct + i !== correct) distractors.add(correct + i);
    if (distractors.size < 3 && correct - i >= 0 && correct - i !== correct) {
      distractors.add(correct - i);
    }
  }

  return Array.from(distractors).slice(0, 3);
}

async function fetchFromHuggingFace(split: string, offset: number = 0, length: number = 100): Promise<any> {
  const url = `${HF_API}?dataset=openai/gsm8k&config=main&split=${split}&offset=${offset}&length=${length}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed: ${response.statusText}`);
  }
  return response.json();
}

async function importSplit(split: string): Promise<number> {
  console.log(`\nImporting GSM8K ${split}...`);

  let offset = 0;
  let hasMore = true;
  let totalImported = 0;
  let skipped = 0;

  while (hasMore) {
    try {
      const data = await fetchFromHuggingFace(split, offset, 100);

      if (!data.rows || data.rows.length === 0) {
        hasMore = false;
        break;
      }

      const items = data.rows.map((row: any, idx: number) => {
        const r = row.row;
        const correctAnswer = parseAnswer(r.answer);
        const correctNum = parseFloat(correctAnswer);

        if (isNaN(correctNum)) {
          skipped++;
          return null;
        }

        const distractors = generateDistractors(correctNum);
        if (distractors.length < 3) {
          skipped++;
          return null;
        }

        const allOptions = [correctNum, ...distractors].sort(() => Math.random() - 0.5);
        const correctIdx = allOptions.indexOf(correctNum);
        const correctLetter = ['A', 'B', 'C', 'D'][correctIdx];

        return {
          id: `gsm8k-${split}-${String(offset + idx).padStart(5, '0')}`,
          source: 'gsm8k',
          topic: 'math-word-problems',
          difficulty: 'medium',
          stem: r.question,
          option_a: String(allOptions[0]),
          option_b: String(allOptions[1]),
          option_c: String(allOptions[2]),
          option_d: String(allOptions[3]),
          correct: correctLetter,
          explanation: r.answer,
          metadata: { gsm8k_split: split, original_answer: correctAnswer },
          tags: ['math', 'word-problems', 'grade-school'],
        };
      }).filter(Boolean);

      if (items.length > 0) {
        const { error } = await supabase
          .from('items')
          .upsert(items, { onConflict: 'id' });

        if (error) {
          console.error(`  Error: ${error.message}`);
        } else {
          totalImported += items.length;
        }
      }

      offset += data.rows.length;
      hasMore = data.rows.length === 100;

      // Progress update
      if (offset % 500 === 0) {
        console.log(`  Progress: ${offset} processed, ${totalImported} imported`);
      }

      await new Promise(r => setTimeout(r, 100));
    } catch (err) {
      console.error(`  Error at offset ${offset}:`, err);
      hasMore = false;
    }
  }

  console.log(`  Total: ${totalImported} items (${skipped} skipped)`);
  return totalImported;
}

async function main() {
  console.log('GSM8K Import to Supabase (via HuggingFace)');
  console.log('==========================================\n');

  let total = 0;
  for (const split of ['train', 'test']) {
    total += await importSplit(split);
  }

  console.log(`\n==========================================`);
  console.log(`Total imported: ${total} items`);

  const { error } = await supabase
    .from('sources')
    .update({ item_count: total, imported_at: new Date().toISOString() })
    .eq('id', 'gsm8k');

  if (error) {
    console.error('Failed to update source count:', error.message);
  }
}

main().catch(console.error);
