# Build MCQMCP

## Why This Exists

LLMs tutor millions of people but can't verify if learning happened. They explain, the learner says "got it," and the LLM moves on—with no evidence anything landed. Real tutors check understanding. They ask questions that reveal what was actually grasped. They adjust based on evidence, not assumption.

MCQMCP gives LLMs that capability. After explaining something, the LLM can ask a question and see whether to continue or revisit. That's the difference between talking at someone and teaching them.

For learners, assessment is learning. Active recall strengthens memory. Testing reveals gaps you couldn't see yourself. Progress becomes visible. Time isn't wasted on what you already know.

## What It Is

An MCP server that gives LLMs tools, resources, and prompts for structured assessment. The LLM handles pedagogy. MCQMCP handles mechanics: items, responses, XP, progress.

## Architecture

Three components work together:

The **web client** orchestrates. It shows a chat interface, sends messages to Claude, executes tool calls against the MCQMCP server, renders widgets, and listens for learner interactions. When a widget posts a message (learner clicked an option), the client translates that into a `record_response` call.

**Claude** handles pedagogy. It decides when to assess, what to target, how to respond to results. It sees MCQMCP tools and calls them when appropriate. Tool calls flow through the web client.

The **MCQMCP server** provides tools, resources, and prompts. It stores items, logs responses, tracks XP. It exposes an HTTP API.

## Two Modes of Use

**Single question, inline.** The LLM explains a concept, then checks understanding with one item. If correct, continues. If wrong, addresses the specific misconception revealed by which distractor was chosen. Feels conversational.

**Assessment sequence.** Five to ten items on a skill. The learner is explicitly in assessment mode. Progress is visible. Summary at the end. Earns XP and badges. Feels purposeful.

The LLM chooses the mode based on context. The same tools support both.

## MCP Primitives

### Resources

Resources provide read-only context the LLM can access without making action calls.

**`mcqmcp://skills`** — The full skill tree. Names, descriptions, hierarchy, XP thresholds.

**`mcqmcp://skills/{id}`** — Single skill with children, item count, badge info.

**`mcqmcp://users/{id}/progress`** — User's XP per skill, badges earned, recent activity.

**`mcqmcp://items/stats`** — Item bank statistics: counts by skill, by source, flagged items.

The LLM reads these to understand what's available and where the learner stands.

### Prompts

Prompts are templates that prime the LLM for specific interaction patterns. Users or the client can select them.

**`tutor-mode`** — "You are tutoring a learner. Explain concepts conversationally. After explaining something substantive, use get_items to check understanding with a single question. If they answer correctly, acknowledge and continue. If wrong, address the specific misconception revealed by their choice. Award XP. Celebrate badges when earned."

**`assessment-session`** — "Run a focused assessment on {skill}. Present 5-10 items sequentially. Show progress (e.g., 'Question 3 of 8'). After each response, give brief feedback. At the end, summarize: items correct, XP earned, badges unlocked, areas to review."

**`assessment-first`** — "Before teaching, check what the learner already knows. Use get_items to probe understanding. Only explain concepts they got wrong. This respects existing knowledge and focuses instruction on actual gaps."

### Tools

Tools are actions the LLM invokes. Descriptions tell the LLM *when* to use each tool.

**`list_skills`**
Browse available skills. Use this to see what can be assessed, understand the skill hierarchy, or find appropriate next steps for a learner.

```
Input: {
  parent_id?: string,      // Filter to children of this skill
  user_id?: string         // Include user's XP and badge status
}
Output: {
  skills: [{
    id, name, description, parent_id,
    xp_for_bronze, xp_for_silver, xp_for_gold,
    item_count,
    user_xp?, user_badges?
  }]
}
```

**`get_skill`**
Get details for one skill. Use this when you need full context about a skill before assessing it.

```
Input: {
  skill_id: string,
  user_id?: string
}
Output: {
  id, name, description,
  parent: { id, name } | null,
  children: [{ id, name }],
  xp_thresholds: { bronze, silver, gold },
  item_count,
  user_progress?: { xp, badges, items_seen }
}
```

**`get_items`**
Retrieve assessment items for a skill. Use this when you want to check understanding—after explaining a concept, or before teaching to probe existing knowledge. Returns items with correct answers visible (you need this for feedback). The display widget hides the answer from learners.

```
Input: {
  skill_id: string,
  count?: number,           // Default 1, max 10
  difficulty?: number,      // Target difficulty 1-5
  exclude_item_ids?: string[] // Skip items user saw recently
}
Output: {
  items: [{
    id,
    stem,
    options: [{ key, text, is_correct, misconception, feedback }],
    difficulty,
    description,            // What this item tests (LLM-generated)
    short_description,      // One-liner
    skill_ids
  }]
}
```

**`generate_item`**
Create a new assessment item. Use this when the bank is thin or you want variety. The item is stored for future use.

```
Input: {
  skill_id: string,
  difficulty: number,       // 1-5
  context?: string          // Additional guidance for generation
}
Output: same as get_items (single item)
```

**`get_item_html`**
Render an item as an interactive widget. Use this to present a question to the learner. Options are shuffled. The correct answer is not in the HTML—scoring happens server-side.

```
Input: {
  item_id: string,
  session_id: string,
  show_progress?: {         // For assessment sequences
    current: number,
    total: number
  }
}
Output: {
  type: "resource",
  resource: {
    uri: string,
    mimeType: "text/html",
    text: string            // Self-contained HTML widget
  }
}
```

**`record_response`**
Log a learner's answer after they click an option. Returns correctness, the right answer, corrective feedback, XP earned, and any new badges. Use the feedback to guide your next response.

```
Input: {
  user_id: string,
  item_id: string,
  selected_key: string,     // "A", "B", "C", or "D"
  response_time_ms?: number
}
Output: {
  correct: boolean,
  correct_key: string,
  correct_text: string,
  selected_misconception?: string,  // If wrong, what their choice revealed
  feedback: string,                 // Corrective feedback for wrong answers
  xp_earned: number,
  new_badges: [{ skill_id, skill_name, tier }],
  skill_progress: [{
    skill_id,
    skill_name,
    xp,
    next_badge: { tier, xp_needed }
  }]
}
```

**`get_user_progress`**
Overview of a user's progress. Use this to understand where they are, suggest next steps, or celebrate achievements.

```
Input: {
  user_id: string
}
Output: {
  total_xp: number,
  badges: [{ skill_id, skill_name, tier, earned_at }],
  skills_in_progress: [{ skill_id, skill_name, xp, next_badge }],
  suggested_next: [{ skill_id, skill_name, reason }]
}
```

## Data Model

**users** — Just an ID. Created on first interaction.

**skills** — Learning objectives. Hierarchical: a skill can have a parent.

```
id
name
description
parent_id (nullable)
xp_for_bronze (default 50)
xp_for_silver (default 150)
xp_for_gold (default 300)
```

**items** — Assessment content. An item can assess multiple skills.

```
id
stem
options (json array)
skill_ids (array)
difficulty (1-5)
description (what this item tests, LLM-generated or authored)
short_description (one-liner)
source (authored | generated | imported)
status (active | flagged | retired)
created_at
```

Each option in the options array:

```
key (A, B, C, D)
text
is_correct (boolean)
misconception (what choosing this reveals, null for correct answer)
feedback (corrective explanation, null for correct answer)
```

**responses** — Every answer recorded.

```
id
user_id
item_id
selected_key
correct (boolean)
response_time_ms
created_at
```

**user_skill_xp** — Progress per user per skill.

```
user_id
skill_id
xp
items_seen (count of unique items attempted)
```

**badges** — Earned credentials.

```
id
user_id
skill_id
tier (bronze | silver | gold)
earned_at
```

## XP Rules

When a user answers correctly:
- New item (never seen before): +5 XP to each skill the item assesses
- Repeat item: +1 XP to each skill
- Wrong answers: 0 XP

XP propagates up the skill hierarchy. Earning XP on "Closures" also adds to parent skill "JavaScript Functions."

Badges unlock at thresholds. Check after each response. Include new badges in the response so the LLM can celebrate.

## Item Quality

Items need to be good. A bad item wastes everyone's time and produces misleading data.

**Stems** should be clear and unambiguous. One right answer. No tricks.

**Distractors** should reflect real misconceptions—things someone with partial understanding might believe. Each distractor needs a misconception tag (what choosing it reveals) and feedback (how to correct that thinking).

**Feedback** teaches. Don't just say "wrong." Explain why the selected answer is wrong and why the correct answer is right. This is where learning happens.

**Descriptions** help the LLM understand what an item tests without presenting it. The short_description is a one-liner. The description is a sentence or two explaining the concept and common errors it targets.

## The Widget

Self-contained HTML. Display stem and four clickable option buttons.

**Shuffle option order** at render time. Don't always show A, B, C, D in stored order. This prevents pattern memorization.

**Progress indicator** when in assessment mode: "Question 3 of 8"

On click: disable all buttons, mark selection visually, post message to parent with item_id, selected_key, response_time_ms.

Clean styling. Touch-friendly. Works on mobile.

Never include the correct answer in the HTML source.

## Item Generation

When generating items, prompt Claude with:

- Skill name and description
- Parent skill context if relevant
- Target difficulty (1-5 scale: 1 = basic recall, 5 = synthesis/evaluation)
- Any additional context

Request:
- Clear stem with one right answer
- Four options, one correct
- For each wrong option: misconception tag and corrective feedback
- Description of what the item tests
- Short one-line description

Store the complete item. Return it with the same structure as retrieved items.

## Structured Content

Tools should return both human-readable text and structured JSON:

```typescript
return {
  content: [{
    type: 'text',
    text: 'Correct! You earned 5 XP. 3 more to your bronze badge in Closures.'
  }],
  structuredContent: {
    correct: true,
    xp_earned: 5,
    skill_progress: [{ skill_id: 'closures', xp: 47, next_badge: { tier: 'bronze', xp_needed: 3 } }],
    new_badges: []
  }
}
```

The text is for conversation. The structured content is for programmatic use by the client.

## Quality of Experience

**For learners:**
- Clean, responsive widgets
- Feedback that teaches, not just "wrong"
- Visible progress (XP, badges approaching)
- Appropriate difficulty—challenging but not frustrating
- Variety—don't see the same items repeatedly
- Respect for time—no tedious grinding

**For developers:**
- Clear, simple data model
- Easy to add skills and items
- Items can be authored, generated, or imported
- Good error messages
- Logs for debugging
- Simple deployment

## Flow Examples

**Single question, inline:**

Learner asks about closures. Claude explains. Claude calls `get_items` for closures skill, count=1. Gets one item. Calls `get_item_html`. Widget renders. Learner clicks B. Widget posts message. Client calls `record_response`. Response: correct, +5 XP. Claude says "Exactly right—the inner function retains access to the outer scope. You're at 47 XP in Closures, 3 away from your bronze badge. Want to keep going?"

**Assessment sequence:**

Learner says "quiz me on JavaScript functions." Claude calls `get_items` for js-functions, count=8. Gets 8 items. For each: calls `get_item_html` with progress (1/8, 2/8...), waits for response, calls `record_response`, gives brief feedback. After all 8: summarizes. "You got 6 of 8. Earned 25 XP. You now have your silver badge in JavaScript Functions! The two you missed were about hoisting—want me to explain that?"

## Deployment

**MCQMCP server:** Deploy with HTTPS. SQLite for storage initially; Postgres for scale. Expose the HTTP API for the web client.

**Web client:** Separate application. Handles:
- Chat UI
- Claude API calls with tool definitions
- Tool execution against MCQMCP
- Widget rendering (inline HTML)
- Listening for widget postMessage events
- Translating clicks into record_response calls
- User session management

Start with a few authored items per skill. Generate more as needed. The bank grows and improves through use.
