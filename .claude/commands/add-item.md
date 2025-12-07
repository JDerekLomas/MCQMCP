# Add Item to Bank

Add a validated item to the MCQMCP item bank.

## Input
A JSON item object (from create-item or manual entry)

## Validation Checklist

Before adding, verify:

- [ ] `id` is unique (check existing items)
- [ ] `id` follows pattern: `{topic}-{number}`
- [ ] `topic` matches existing topics or is a new valid topic
- [ ] `difficulty` is one of: easy, medium, hard
- [ ] `stem` is clear and unambiguous
- [ ] `options` has exactly 4 choices (A, B, C, D)
- [ ] `correct` is one of A, B, C, D
- [ ] `feedback` has all three fields
- [ ] Code (if present) is syntactically valid

## Process

1. Parse the provided item JSON
2. Validate against schema
3. Check for duplicate IDs
4. Read current item bank
5. Append new item
6. Write updated item bank
7. Confirm addition

## Commands

```bash
# Read current bank
Read packages/server/src/item-bank.json

# After validation, edit to add item
Edit packages/server/src/item-bank.json
```

## After Adding

Remind user to:
1. Test locally: `npm run build -w packages/server`
2. Commit: `git add -A && git commit -m "Add item: {item_id}"`
3. Push to deploy: `git push`

The new item will be available after Render redeploys (~2 min).
