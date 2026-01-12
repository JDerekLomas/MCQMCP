# MCQMCP Data

Benchmark datasets for MCQ assessment items.

## Files

- `item-bank.json` - 34,349 MCQ items from various sources
- `skill-tree.json` - Skill taxonomy and prerequisites

## Item Sources

| Source | Count | Description |
|--------|-------|-------------|
| mmlu-hendrycks | 9,987 | Massive Multitask Language Understanding |
| gsm8k-openai | 8,792 | Grade School Math 8K |
| sciq-allenai | 5,000 | Science Questions |
| race-cmu | 4,801 | Reading Comprehension |
| arc-allenai | 2,609 | AI2 Reasoning Challenge |
| mathqa | 2,328 | Math Word Problems |
| aqua-deepmind | 399 | Algebra Question Answering |
| freecodecamp | 382 | Programming Quiz Items |
| mcqmcp-ai-generated | 51 | Original MCQMCP items |

## Import Scripts

Located in `/scripts/`:
- `import-gsm8k.js` - Grade school math
- `import-mmlu-full.js` - MMLU benchmark
- `import-arc.js` - ARC science reasoning
- `import-sciq.js` - Science questions
- `import-race.js` - Reading comprehension
- `import-mathqa.js` - Math word problems
- `import-aqua.js` - Algebra QA
- `import-fcc.js` - FreeCodeCamp

## Supabase

Schema defined in `/supabase/` but not yet deployed. To deploy:

```sql
-- Run supabase-schema.sql in Supabase SQL Editor
-- Then run import scripts with SUPABASE_URL and SUPABASE_KEY
```
