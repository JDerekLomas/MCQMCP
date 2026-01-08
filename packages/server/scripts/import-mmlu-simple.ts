/**
 * Simple MMLU Math import - run with: npx tsx scripts/import-mmlu-simple.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cxzwclvkkjvkromubzmp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4endjbHZra2p2a3JvbXViem1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE1MjEzOCwiZXhwIjoyMDc5NzI4MTM4fQ.eQNjAwY_6jIft6olbpnlysuSukZWmXlTQmKDCxHonJQ'
);

const HF_API = 'https://datasets-server.huggingface.co/rows';

async function fetchHF(subject: string, split: string, offset: number): Promise<any> {
  const url = `${HF_API}?dataset=cais/mmlu&config=${subject}&split=${split}&offset=${offset}&length=100`;

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
  console.log('MMLU Math Import to mcq_items');
  console.log('==============================\n');

  const subjects = [
    'abstract_algebra',
    'college_mathematics',
    'elementary_mathematics',
    'high_school_mathematics',
    'high_school_statistics'
  ];

  let total = 0;

  for (const subject of subjects) {
    console.log(`\nImporting ${subject}...`);

    for (const split of ['test', 'validation', 'dev']) {
      let offset = 0;
      let splitCount = 0;

      while (true) {
        try {
          const data = await fetchHF(subject, split, offset);
          if (!data.rows?.length) break;

          const items = data.rows.map((row: any, idx: number) => {
            const r = row.row;
            const choices = r.choices || [];
            const letters = ['A', 'B', 'C', 'D'];

            const difficulty = subject.includes('college') || subject.includes('abstract') ? 'hard' :
                             subject.includes('elementary') ? 'easy' : 'medium';

            return {
              id: `mmlu-${subject}-${split}-${offset + idx}`,
              source: 'mmlu',
              topic: `math-${subject.replace(/_/g, '-')}`,
              difficulty,
              stem: r.question,
              option_a: choices[0] || '',
              option_b: choices[1] || '',
              option_c: choices[2] || '',
              option_d: choices[3] || '',
              correct: letters[r.answer] || 'A',
              tags: ['math', 'mmlu', subject.replace(/_/g, '-')],
              metadata: { subject, split }
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

  console.log(`\n==============================`);
  console.log(`Total MMLU items: ${total}`);
}

main().catch(console.error);
