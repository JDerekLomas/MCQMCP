/**
 * Import MMLU Math items to Supabase via HuggingFace datasets API
 *
 * Usage: SUPABASE_URL=xxx SUPABASE_KEY=xxx npx tsx scripts/import-mmlu-math.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// HuggingFace datasets API for MMLU
const HF_API = 'https://datasets-server.huggingface.co/rows';

const MATH_SUBJECTS = [
  'abstract_algebra',
  'college_mathematics',
  'elementary_mathematics',
  'high_school_mathematics',
  'high_school_statistics',
];

function difficultyFromSubject(subject: string): string {
  if (subject.includes('elementary')) return 'easy';
  if (subject.includes('high_school')) return 'medium';
  return 'hard';
}

async function fetchFromHuggingFace(subject: string, split: string, offset: number = 0, length: number = 100): Promise<any> {
  const url = `${HF_API}?dataset=cais/mmlu&config=${subject}&split=${split}&offset=${offset}&length=${length}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed: ${response.statusText}`);
  }
  return response.json();
}

async function importSubject(subject: string): Promise<number> {
  console.log(`\nImporting ${subject}...`);

  let totalImported = 0;

  for (const split of ['test', 'validation', 'dev']) {
    try {
      let offset = 0;
      let hasMore = true;
      let splitTotal = 0;

      while (hasMore) {
        const data = await fetchFromHuggingFace(subject, split, offset, 100);

        if (!data.rows || data.rows.length === 0) {
          hasMore = false;
          break;
        }

        const items = data.rows.map((row: any, idx: number) => {
          const r = row.row;
          return {
            id: `mmlu-${subject}-${split}-${String(offset + idx).padStart(5, '0')}`,
            source: 'mmlu',
            topic: `math-${subject.replace(/_/g, '-')}`,
            difficulty: difficultyFromSubject(subject),
            stem: r.question,
            option_a: r.choices?.[0] || '',
            option_b: r.choices?.[1] || '',
            option_c: r.choices?.[2] || '',
            option_d: r.choices?.[3] || '',
            correct: ['A', 'B', 'C', 'D'][r.answer] || 'A',
            metadata: { mmlu_subject: subject, mmlu_split: split },
            tags: ['math', subject.replace(/_/g, '-')],
          };
        }).filter((item: any) => item.stem);

        if (items.length > 0) {
          const { error } = await supabase
            .from('items')
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

        // Rate limit
        await new Promise(r => setTimeout(r, 100));
      }

      if (splitTotal > 0) {
        console.log(`  ${split}: ${splitTotal} items`);
      }
    } catch (err) {
      // Split might not exist
    }
  }

  return totalImported;
}

async function main() {
  console.log('MMLU Math Import to Supabase (via HuggingFace)');
  console.log('==============================================\n');

  let grandTotal = 0;

  for (const subject of MATH_SUBJECTS) {
    const count = await importSubject(subject);
    grandTotal += count;
  }

  console.log(`\n==============================================`);
  console.log(`Total imported: ${grandTotal} items`);

  // Update source count
  const { error } = await supabase
    .from('sources')
    .update({ item_count: grandTotal, imported_at: new Date().toISOString() })
    .eq('id', 'mmlu');

  if (error) {
    console.error('Failed to update source count:', error.message);
  }
}

main().catch(console.error);
