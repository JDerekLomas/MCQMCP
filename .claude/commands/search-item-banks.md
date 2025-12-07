# Search Open Item Banks

Search for MCQ items across open educational resources to find content for import.

## Searchable Repositories

### Programming/CS
| Repository | URL | API/Access |
|------------|-----|------------|
| FreeCodeCamp Quiz | github.com/freeCodeCamp/Developer_Quiz_Site | Raw GitHub files |
| Exercism | github.com/exercism | Exercise metadata |
| LeetCode (descriptions) | leetcode.com | Limited |
| HackerRank (sample) | hackerrank.com | API |

### Math (K-12)
| Repository | URL | Access |
|------------|-----|--------|
| OpenStax | openstax.org | API + downloads |
| CK-12 | ck12.org/search | Web search |
| Khan Academy | khanacademy.org | Content API |
| IXL (topics only) | ixl.com | Web |
| Illustrative Math | illustrativemathematics.org | CC content |

### Science (K-12)
| Repository | URL | Access |
|------------|-----|--------|
| OpenStax | openstax.org | API + downloads |
| CK-12 | ck12.org | Web search |
| PhET | phet.colorado.edu | Simulation data |
| HHMI BioInteractive | biointeractive.org | Resources |
| NGSS Hub | ngss.nsta.org | Standards-aligned |

### General/Multi-subject
| Repository | URL | Access |
|------------|-----|--------|
| Quizlet (public) | quizlet.com | Search |
| OER Commons | oercommons.org | Search API |
| MERLOT | merlot.org | Search |
| LibreTexts | libretexts.org | API |

## Search Workflow

### Step 1: Define Search
```
Subject: math
Grade level: high-school
Topic: quadratic equations
Difficulty: medium
Count: 10-20 items
License: CC-BY or CC-BY-SA
```

### Step 2: Search Multiple Sources
```
1. Search OpenStax Algebra textbook chapters
2. Search CK-12 for "quadratic equations"
3. Search Khan Academy exercise metadata
4. Search OER Commons with filters
```

### Step 3: Evaluate Results
For each potential source:
- [ ] License compatible? (CC-BY, CC-BY-SA, public domain)
- [ ] Format convertible? (MCQ with distractors)
- [ ] Quality acceptable? (clear stem, plausible distractors)
- [ ] Attribution available? (source URL, author)

### Step 4: Report Findings
```markdown
## Search Results: Quadratic Equations (HS)

### OpenStax Algebra 2
- Items found: 45 practice problems
- Format: Mixed (some MCQ, some open response)
- License: CC-BY-4.0 ✓
- Quality: High (textbook quality)
- URL: https://openstax.org/books/algebra-2/...

### CK-12 Algebra
- Items found: 32 practice questions
- Format: MCQ ✓
- License: CC-BY-NC ⚠️ (non-commercial)
- Quality: Medium
- URL: https://ck12.org/...

### Recommendation
Import from OpenStax (CC-BY compatible, high quality)
Use /import-items source:openstax chapter:quadratics
```

## Search Commands

### By Subject
```
/search-item-banks subject:math topic:algebra grade:9-10
/search-item-banks subject:physics topic:mechanics grade:11-12
/search-item-banks subject:programming topic:recursion
```

### By Standard
```
/search-item-banks standard:CCSS.MATH.CONTENT.HSA.REI
/search-item-banks standard:NGSS.HS-PS2
/search-item-banks standard:AP-CSA
```

### By Source
```
/search-item-banks source:openstax subject:chemistry
/search-item-banks source:ck12 topic:"cell biology"
/search-item-banks source:freecodecamp topic:react
```

## Taxonomy Reference

### Math Topics (HS)
```
math-algebra-1:
  - linear-equations
  - inequalities
  - systems-of-equations
  - polynomials
  - factoring

math-algebra-2:
  - quadratics
  - exponentials
  - logarithms
  - rational-functions
  - complex-numbers

math-geometry:
  - triangles
  - circles
  - proofs
  - transformations
  - trigonometry

math-precalc:
  - functions
  - trig-identities
  - sequences-series
  - limits-intro

math-calculus:
  - limits
  - derivatives
  - integrals
  - applications

math-stats:
  - probability
  - distributions
  - inference
  - regression
```

### Science Topics (HS)
```
science-biology:
  - cells
  - genetics
  - evolution
  - ecology
  - human-body

science-chemistry:
  - atomic-structure
  - bonding
  - reactions
  - stoichiometry
  - thermodynamics

science-physics:
  - mechanics
  - energy
  - waves
  - electricity
  - magnetism
```

## Output Format

After searching, provide:
1. **Summary table** of sources found
2. **License compatibility** status
3. **Quality assessment** (brief)
4. **Recommended import** command
5. **Total estimated items** available

---

After search, use `/import-items` to bring items into the bank.
