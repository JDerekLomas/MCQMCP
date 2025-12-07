# Expand Topic Coverage

Generate a comprehensive set of assessment items for a topic, ensuring coverage across difficulty levels and key concepts.

## Input
- **Topic**: The subject area to expand
- **Count** (optional): Number of items to generate (default: 6 - 2 per difficulty)

## Process

1. **Analyze existing items** - Read the item bank to see what's already covered
2. **Identify gaps** - What concepts/difficulties are missing?
3. **Plan coverage** - Map out concepts × difficulties
4. **Generate items** - Create items filling the gaps
5. **Validate set** - Ensure no overlap, good distribution

## Coverage Matrix

For each topic, aim for:

| Difficulty | Count | Focus |
|------------|-------|-------|
| Easy | 2-3 | Core concepts, recognition |
| Medium | 2-3 | Application, common gotchas |
| Hard | 2-3 | Edge cases, synthesis |

## Steps

1. First, read the current item bank:
   ```
   Read packages/server/src/item-bank.json
   ```

2. List existing items for this topic

3. Identify missing concepts/difficulties

4. Generate new items using the create-item format

5. Output all new items as a JSON array ready to merge

## Output

```json
{
  "topic": "topic-name",
  "existing_count": N,
  "new_items": [
    { /* item 1 */ },
    { /* item 2 */ },
    ...
  ],
  "coverage_summary": {
    "easy": { "existing": N, "new": N },
    "medium": { "existing": N, "new": N },
    "hard": { "existing": N, "new": N }
  }
}
```

After generating, offer to:
1. Review and refine individual items
2. Add all items to the item bank
3. Generate more for specific gaps
