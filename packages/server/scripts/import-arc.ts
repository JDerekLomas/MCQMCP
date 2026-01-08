/**
 * Import AI2 ARC items to Supabase via HuggingFace
 *
 * Usage: SUPABASE_URL=xxx SUPABASE_KEY=xxx npx tsx scripts/import-arc.ts
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

async function fetchFromHuggingFace(config: string, split: string, offset: number = 0, length: number = 100): Promise<any> {
  const url = `${HF_API}?dataset=allenai/ai2_arc&config=${config}&split=${split}&offset=${offset}&length=${length}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed: ${response.statusText}`);
  }
  return response.json();
}

async function importDataset(config: string, difficulty: 'easy' | 'hard'): Promise<number> {
  console.log(`\nImporting ARC ${config}...`);

  let totalImported = 0;

  for (const split of ['train', 'test', 'validation']) {
    try {
      let offset = 0;
      let hasMore = true;
      let splitTotal = 0;

      while (hasMore) {
        const data = await fetchFromHuggingFace(config, split, offset, 100);

        if (!data.rows || data.rows.length === 0) {
          hasMore = false;
          break;
        }

        const items = data.rows.map((row: any, idx: number) => {
          const r = row.row;
          const choices = r.choices;

          // Get choice by label
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

        await new Promise(r => setTimeout(r, 100));
      }

      if (splitTotal > 0) {
        console.log(`  ${split}: ${splitTotal} items`);
      }
    } catch (err) {
      console.log(`  ${split}: skipped`);
    }
  }

  return totalImported;
}

async function main() {
  console.log('ARC Import to Supabase (via HuggingFace)');
  console.log('========================================\n');

  let total = 0;
  total += await importDataset('ARC-Easy', 'easy');
  total += await importDataset('ARC-Challenge', 'hard');

  console.log(`\n========================================`);
  console.log(`Total imported: ${total} items`);

  const { error } = await supabase
    .from('sources')
    .update({ item_count: total, imported_at: new Date().toISOString() })
    .eq('id', 'arc');

  if (error) {
    console.error('Failed to update source count:', error.message);
  }
}

main().catch(console.error);
