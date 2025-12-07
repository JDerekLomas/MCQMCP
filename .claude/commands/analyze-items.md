# Analyze Item Performance

Use response data from the dashboard to identify items that need improvement.

## Data Sources

1. **Dashboard API**: `https://claude-mcq-assessment.vercel.app/api/dashboard`
2. **Item Bank**: `packages/server/src/item-bank.json`

## Analysis Criteria

### Items Needing Review

| Signal | Meaning | Action |
|--------|---------|--------|
| Accuracy < 30% | Too hard or confusing | Simplify or fix ambiguity |
| Accuracy > 90% | Too easy or obvious | Increase difficulty |
| High latency + wrong | Confusing question | Rewrite stem |
| Low latency + wrong | Guessing/trap | Check distractors |

### Distractor Analysis

Good distractors should:
- Each attract some responses (not all choosing same wrong answer)
- Represent real misconceptions
- Not be "trick" answers

## Process

1. Fetch dashboard data
2. Cross-reference with item bank
3. Identify problematic items
4. Suggest specific improvements
5. Generate revised versions

## Output

For each flagged item:

```markdown
## Item: {item_id}

**Current Performance**
- Accuracy: X%
- Responses: N
- Avg Latency: Xs

**Issue**: [Too hard | Too easy | Confusing | Bad distractors]

**Analysis**: Why this item is underperforming

**Recommendation**: Specific changes to make

**Revised Item** (if applicable):
{JSON of improved item}
```

## Psychometric Flags

- **Discrimination**: Does this item distinguish strong from weak learners?
- **Difficulty**: Is it calibrated correctly for its label?
- **Reliability**: Consistent results across attempts?

After analysis, offer to:
1. Apply suggested revisions
2. Flag for expert review
3. Retire problematic items
