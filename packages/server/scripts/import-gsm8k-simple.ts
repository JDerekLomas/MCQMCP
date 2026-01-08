/**
 * Simple GSM8K import - run with: npx tsx scripts/import-gsm8k-simple.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cxzwclvkkjvkromubzmp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4endjbHZra2p2a3JvbXViem1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE1MjEzOCwiZXhwIjoyMDc5NzI4MTM4fQ.eQNjAwY_6jIft6olbpnlysuSukZWmXlTQmKDCxHonJQ'
);

const HF_API = 'https://datasets-server.huggingface.co/rows';

async function fetchHF(split: string, offset: number): Promise<any> {
  const url = `${HF_API}?dataset=openai/gsm8k&config=main&split=${split}&offset=${offset}&length=100`;

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
  console.log('GSM8K Import to mcq_items');
  console.log('=========================\n');

  let total = 0;

  for (const split of ['train', 'test']) {
    console.log(`\nImporting ${split}...`);
    let offset = 0;
    let splitCount = 0;

    while (true) {
      try {
        const data = await fetchHF(split, offset);
        if (!data.rows?.length) break;

        const items = data.rows.map((row: any, idx: number) => {
          const r = row.row;
          // GSM8K answers are after "####" marker
          const answer = r.answer?.split('####')?.pop()?.trim() || '';

          // Generate plausible wrong answers
          const numAnswer = parseFloat(answer.replace(/[,$]/g, ''));
          let wrongA: string, wrongB: string, wrongC: string;

          if (!isNaN(numAnswer)) {
            // Generate wrong answers that are close but different
            wrongA = String(Math.round(numAnswer * 1.1));
            wrongB = String(Math.round(numAnswer * 0.9));
            wrongC = String(Math.round(numAnswer + 5));
          } else {
            wrongA = 'Cannot be determined';
            wrongB = 'None of the above';
            wrongC = 'Not enough information';
          }

          return {
            id: `gsm8k-${split}-${offset + idx}`,
            source: 'gsm8k',
            topic: 'math-word-problems',
            difficulty: 'medium',
            stem: r.question,
            option_a: answer,
            option_b: wrongA,
            option_c: wrongB,
            option_d: wrongC,
            correct: 'A',
            explanation: r.answer,
            tags: ['math', 'word-problems', 'gsm8k'],
            metadata: { split, original_answer: answer }
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

  console.log(`\n=========================`);
  console.log(`Total GSM8K items: ${total}`);
}

main().catch(console.error);
