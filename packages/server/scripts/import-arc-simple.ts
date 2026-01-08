/**
 * Simple ARC import - run with: npx tsx scripts/import-arc-simple.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cxzwclvkkjvkromubzmp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4endjbHZra2p2a3JvbXViem1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE1MjEzOCwiZXhwIjoyMDc5NzI4MTM4fQ.eQNjAwY_6jIft6olbpnlysuSukZWmXlTQmKDCxHonJQ'
);

const HF_API = 'https://datasets-server.huggingface.co/rows';

async function fetchHF(config: string, split: string, offset: number): Promise<any> {
  const url = `${HF_API}?dataset=allenai/ai2_arc&config=${config}&split=${split}&offset=${offset}&length=100`;

  for (let retry = 0; retry < 3; retry++) {
    const res = await fetch(url);
    if (res.status === 429) {
      console.log(`  Rate limited, waiting...`);
      await new Promise(r => setTimeout(r, 5000));
      continue;
    }
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }
  throw new Error('Rate limit exceeded');
}

async function main() {
  console.log('ARC Import to mcq_items');
  console.log('========================\n');

  // Verify table access first
  console.log('Verifying table access...');
  const { error: testError } = await supabase.from('mcq_items').select('id').limit(1);
  if (testError) {
    console.error('Table error:', testError.message);
    return;
  }
  console.log('Table accessible!\n');

  let total = 0;

  for (const [config, difficulty] of [['ARC-Easy', 'easy'], ['ARC-Challenge', 'hard']]) {
    console.log(`\nImporting ${config}...`);

    for (const split of ['train', 'test', 'validation']) {
      let offset = 0;
      let splitCount = 0;

      while (true) {
        try {
          const data = await fetchHF(config, split, offset);
          if (!data.rows?.length) break;

          const items = data.rows.map((row: any, idx: number) => {
            const r = row.row;
            const choices = r.choices || { label: [], text: [] };

            const getChoice = (label: string) => {
              const i = choices.label?.indexOf(label) ?? -1;
              return i >= 0 ? choices.text?.[i] || '' : '';
            };

            return {
              id: `arc-${difficulty}-${r.id || `${split}-${offset + idx}`}`,
              source: 'arc',
              topic: 'science-general',
              difficulty,
              stem: r.question,
              option_a: getChoice('A') || getChoice('1') || choices.text?.[0] || '',
              option_b: getChoice('B') || getChoice('2') || choices.text?.[1] || '',
              option_c: getChoice('C') || getChoice('3') || choices.text?.[2] || '',
              option_d: getChoice('D') || getChoice('4') || choices.text?.[3] || '',
              correct: r.answerKey?.replace(/1/g,'A').replace(/2/g,'B').replace(/3/g,'C').replace(/4/g,'D') || 'A',
              tags: ['science', config === 'ARC-Easy' ? 'arc-easy' : 'arc-challenge'],
              metadata: { config, split, arc_id: r.id }
            };
          }).filter((i: any) => i.stem && i.option_a);

          if (items.length > 0) {
            const { error } = await supabase.from('mcq_items').upsert(items, { onConflict: 'id' });
            if (error) {
              console.error(`  Upsert error: ${error.message}`);
            } else {
              splitCount += items.length;
              total += items.length;
              process.stdout.write(`\r  ${split}: ${splitCount} items...`);
            }
          }

          offset += data.rows.length;
          if (data.rows.length < 100) break;

          await new Promise(r => setTimeout(r, 300));
        } catch (err: any) {
          console.log(`\n  ${split}: stopped at ${splitCount} - ${err.message}`);
          break;
        }
      }

      if (splitCount > 0) console.log(`\r  ${split}: ${splitCount} items    `);
    }
  }

  console.log(`\n========================`);
  console.log(`Total ARC items: ${total}`);
}

main().catch(console.error);
