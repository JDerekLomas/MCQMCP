# Import Items from External Sources

Import and convert MCQ items from external item banks into MCQMCP format.

## Supported Sources

### Open Source Item Banks

| Source ID | Name | Subjects | License |
|-----------|------|----------|---------|
| `freecodecamp` | FreeCodeCamp Developer Quiz | Programming, JS, React, Python | BSD-3-Clause |
| `webwork` | WeBWorK National Problem Library | Math (Algebra → Calculus) | GPL |
| `openstax` | OpenStax Textbooks | Math, Science, Social Studies | CC-BY |
| `libretexts` | LibreTexts/ADAPT | Math, Science | CC-BY-NC-SA |
| `ck12` | CK-12 Foundation | K-12 Math, Science | CC-BY-NC |
| `khan` | Khan Academy (exercises) | Math, Science | CC-BY-NC-SA |
| `phet` | PhET Simulations | Physics, Chemistry, Math | CC-BY |

### Academic Validated Instruments

| Source ID | Name | Subjects | Access |
|-----------|------|----------|--------|
| `scs1` | Second CS1 Assessment | Intro Programming | Request from authors |
| `fci` | Force Concept Inventory | Physics | Licensed |
| `bdsi` | Basic Data Structures Inventory | Data Structures | Academic |

## Import Workflow

### Step 1: Identify Source
```
User provides:
- Source URL or source ID
- Subject/topic filter
- Difficulty level (if applicable)
- Number of items to import
```

### Step 2: Fetch and Parse
```python
# For FreeCodeCamp (example)
# https://github.com/freeCodeCamp/Developer_Quiz_Site/blob/main/src/data/

# Their format:
{
  "Question": "What does DOM stand for?",
  "Answer": "Document Object Model",
  "Distractor1": "Dog Object Model",
  "Distractor2": "Document Orientation Model",
  "Distractor3": "Document Object Mode",
  "Explanation": "...",
  "Link": "https://..."
}
```

### Step 3: Convert to MCQMCP Format
```json
{
  "id": "{topic}-{source}-{number}",
  "topic": "{mapped-topic}",
  "difficulty": "{inferred-or-provided}",
  "stem": "{Question}",
  "options": [
    { "id": "A", "text": "{Answer}" },
    { "id": "B", "text": "{Distractor1}" },
    { "id": "C", "text": "{Distractor2}" },
    { "id": "D", "text": "{Distractor3}" }
  ],
  "correct": "A",
  "feedback": {
    "correct": "Correct!",
    "incorrect": "Review this concept.",
    "explanation": "{Explanation}"
  },
  "source": "{source-id}",
  "source_url": "{Link}",
  "tags": ["{subject}", "{topic}"]
}
```

### Step 4: Randomize Answer Position
```javascript
// Shuffle options so correct answer isn't always A
const shuffled = shuffleArray(options);
const correctIndex = shuffled.findIndex(o => o.isCorrect);
const correctLetter = ['A', 'B', 'C', 'D'][correctIndex];
```

### Step 5: Register Source
Add to item-bank.json metadata:
```json
"sources": {
  "freecodecamp": {
    "name": "FreeCodeCamp Developer Quiz",
    "license": "BSD-3-Clause",
    "url": "https://github.com/freeCodeCamp/Developer_Quiz_Site",
    "imported_at": "2024-12-07"
  }
}
```

### Step 6: Validate and Add
- Check for duplicate IDs
- Validate schema
- Add to item bank
- Update topic index

## Topic Mapping

Map external topics to MCQMCP taxonomy:

### Programming
```
javascript, js → js-fundamentals
react, reactjs → react-fundamentals
python → python-fundamentals
html, css → web-fundamentals
git, github → git-basics
```

### Math (HS)
```
algebra-1 → math-algebra-1
algebra-2 → math-algebra-2
geometry → math-geometry
precalculus → math-precalc
calculus → math-calculus
statistics → math-stats
```

### Science (HS)
```
biology → science-biology
chemistry → science-chemistry
physics → science-physics
earth-science → science-earth
environmental → science-environmental
```

## Usage Examples

### Import from FreeCodeCamp
```
/import-items source:freecodecamp topic:javascript count:20
```

### Import from URL
```
/import-items url:https://raw.githubusercontent.com/.../quiz.json format:freecodecamp
```

### Import with Custom Mapping
```
/import-items source:custom
  topic-map:{"algorithms":"cs-algorithms"}
  license:CC-BY-4.0
```

## Process for Claude

1. **Fetch the source data** (use WebFetch for URLs, read local files)
2. **Parse the format** (detect or use provided format)
3. **Map topics** using the taxonomy above
4. **Convert each item** to MCQMCP schema
5. **Randomize correct answer positions**
6. **Generate unique IDs** based on topic + source + hash
7. **Present items for review** before adding
8. **Update sources registry** in metadata
9. **Add validated items** to the bank

## Output

After import, display:
```
## Import Summary

Source: FreeCodeCamp Developer Quiz
Items imported: 20
Topics: js-fundamentals (12), react-fundamentals (8)
License: BSD-3-Clause

### Sample Items (first 3):
[Show JSON preview]

Ready to add to item bank? [Yes/No/Review more]
```
