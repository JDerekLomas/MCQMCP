# MCQMCP

Assessment infrastructure for AI tutoring. MCQMCP provides validated assessments that AI tutors can use to verify learning.

> **Why this exists:** LLMs tutor millions but can't verify learning happened. MCQMCP gives LLMs the ability to check understanding with structured assessment.

**[Full Vision](docs/VISION.md)** | **[Roadmap](docs/ROADMAP.md)** | **[Research](docs/RESEARCH.md)** | **[Server Spec](SPEC.md)**

## What's New (v0.3.0)

- **Hybrid Generation**: Fuzzy topic matching + AI generation for any learning objective
- **8,500+ curated items** from FreeCodeCamp, OpenStax, SciQ, MathQA, RACE, and more
- **Claude Sonnet fallback**: Generates quality MCQs for topics not in the item bank
- **Smart caching**: AI-generated items stored in Supabase for reuse

## Live

| Service | URL | Source |
|---------|-----|--------|
| **Website** | [mcqmcp.vercel.app](https://mcqmcp.vercel.app) | `packages/website` |
| **MCP Server** | [mcqmcp.onrender.com](https://mcqmcp.onrender.com) | `packages/server` |
| **Demo Client** | [claudetabs.vercel.app](https://claudetabs.vercel.app) | [claudetabs repo](https://github.com/JDerekLomas/claudetabs) |

## Repository Structure

```
MCQMCP/
├── packages/
│   ├── server/          # MCP server (deployed to Render)
│   │   ├── src/         # Server source code
│   │   ├── Dockerfile   # Container config
│   │   └── package.json
│   └── website/         # Marketing site + demo (deployed to Vercel)
│       ├── src/app/     # Next.js pages
│       └── package.json
├── docs/                # Vision, roadmap, research
├── SPEC.md              # Server specification
└── package.json         # Workspace root
```

## Architecture

MCQMCP exposes **two interfaces** to the same underlying tools:

### MCP Protocol (SSE)
For AI clients like Claude Desktop that implement the Model Context Protocol.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sse` | GET | SSE stream for server→client messages |
| `/messages` | POST | Client→server requests |

```typescript
// MCP SDK usage
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const transport = new SSEClientTransport(new URL("https://mcqmcp.onrender.com/sse"));
const client = new Client({ name: "my-app", version: "1.0.0" });
await client.connect(transport);

const result = await client.callTool({
  name: "mcq_generate",
  arguments: { user_id: "user123", objective: "React hooks", difficulty: "medium" }
});
```

**Best for:** Claude Desktop, MCP-compatible AI agents, stateful connections

### REST API
For web apps and serverless functions that can't maintain SSE connections.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check with DB status |
| `/api/tools/call` | POST | Stateless tool calls |

```bash
curl -X POST https://mcqmcp.onrender.com/api/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "mcq_generate", "arguments": {"user_id": "user123", "objective": "React hooks", "difficulty": "medium"}}'
```

**Best for:** Web apps, Vercel Edge functions, any HTTP client

### Comparison

| | MCP (SSE) | REST API |
|---|---|---|
| **Protocol** | SSE + POST | Simple POST |
| **State** | Stateful session | Stateless |
| **SDK Required** | Yes (@modelcontextprotocol/sdk) | No (standard fetch) |
| **Use case** | AI agents | Web apps |

## MCP Server Tools

### `mcq_list_topics`
List all available topics in the item bank.

### `mcq_generate`
Generate an MCQ for a learning objective. Uses hybrid matching:
1. **Alias matching** - Common variations (e.g., "useEffect" → "react-hooks")
2. **Fuzzy matching** - Levenshtein distance for approximate matches
3. **AI generation** - Claude Sonnet for unmatched topics (cached for reuse)

**Request:**
```json
{
  "name": "mcq_generate",
  "arguments": {
    "user_id": "user123",
    "objective": "React hooks",
    "difficulty": "medium"
  }
}
```

**Response (from item bank):**
```json
{
  "user_id": "user123",
  "item_id": "react-hooks-042",
  "topic": "react-hooks",
  "difficulty": "medium",
  "question": "What happens when you call useState inside a condition?",
  "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "correct_answer": "B",
  "explanation": "React relies on hook call order...",
  "source": "curated",
  "match_confidence": 0.95
}
```

**Response (AI generated):**
```json
{
  "user_id": "user123",
  "item_id": "gen-abc123",
  "topic": "quantum-computing",
  "difficulty": "medium",
  "question": "What allows quantum computers to process multiple states simultaneously?",
  "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "correct_answer": "B",
  "explanation": "Quantum superposition allows...",
  "source": "ai-generated",
  "quality": "unreviewed",
  "model": "claude-sonnet-4-20250514"
}
```

### `mcq_match_topic`
Check if an objective matches an existing topic (preflight check).

**Request:**
```json
{
  "name": "mcq_match_topic",
  "arguments": {
    "objective": "JavaScript closures"
  }
}
```

**Response:**
```json
{
  "objective": "JavaScript closures",
  "matched_topic": "js-closures",
  "confidence": 1.0,
  "match_type": "fuzzy",
  "has_items": true,
  "item_count": 45,
  "will_use_item_bank": true,
  "threshold": 0.6
}
```

### `mcq_add_item`
Submit an external MCQ item to the cache for future use.

### `mcq_record`
Record a learner's response, log it for analytics, and update mastery.

**Request:**
```json
{
  "name": "mcq_record",
  "arguments": {
    "user_id": "user123",
    "objective": "Understanding React hooks",
    "selected_answer": "C",
    "correct_answer": "C",
    "item_id": "react-hooks-001",
    "session_id": "session-abc123",
    "latency_ms": 4500,
    "difficulty": "medium"
  }
}
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `user_id` | Yes | Learner identifier |
| `objective` | Yes | Learning objective tested |
| `selected_answer` | Yes | Answer chosen (A, B, C, or D) |
| `correct_answer` | Yes | Correct answer (A, B, C, or D) |
| `item_id` | No | Specific question identifier |
| `session_id` | No | Session grouping identifier |
| `latency_ms` | No | Response time in milliseconds |
| `difficulty` | No | Item difficulty (easy/medium/hard) |

**Response:**
```json
{
  "user_id": "user123",
  "objective": "Understanding React hooks",
  "was_correct": true,
  "correct": 3,
  "total": 4,
  "mastery": 0.75,
  "response_logged": true
}
```

### `mcq_get_status`
Get mastery status for a user.

**Request:**
```json
{
  "name": "mcq_get_status",
  "arguments": {
    "user_id": "user123",
    "objective": "Understanding React hooks"
  }
}
```

**Response:**
```json
{
  "user_id": "user123",
  "objective": "Understanding React hooks",
  "correct": 3,
  "total": 4,
  "mastery": 0.75
}
```

## Quick Start

```bash
# Health check
curl https://mcqmcp.onrender.com/

# Generate a question
curl -X POST https://mcqmcp.onrender.com/api/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "mcq_generate", "arguments": {"user_id": "user123", "objective": "JavaScript closures", "difficulty": "medium"}}'

# Record a response
curl -X POST https://mcqmcp.onrender.com/api/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "mcq_record", "arguments": {"user_id": "user123", "objective": "JavaScript closures", "selected_answer": "C", "correct_answer": "C"}}'

# Check mastery
curl -X POST https://mcqmcp.onrender.com/api/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "mcq_get_status", "arguments": {"user_id": "user123"}}'
```

See [Architecture](#architecture) for MCP SDK usage.

## Data Architecture

MCQMCP currently has **two separate data systems**:

### MCP Server → Supabase (Production)

The MCP server stores data in two Supabase tables:

#### `mastery` - Aggregate progress
```sql
CREATE TABLE mastery (
  user_id TEXT NOT NULL,
  objective TEXT NOT NULL,
  correct INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, objective)
);
```

#### `responses` - Individual answers (for psychometrics)
```sql
CREATE TABLE responses (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  objective TEXT NOT NULL,
  item_id TEXT,
  session_id TEXT,
  selected_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  latency_ms INTEGER,
  difficulty TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `generated_items` - AI-generated MCQ cache
```sql
CREATE TABLE generated_items (
  id UUID PRIMARY KEY,
  objective TEXT NOT NULL,
  objective_normalized TEXT NOT NULL,
  topic TEXT,
  difficulty TEXT,
  stem TEXT NOT NULL,
  options JSONB NOT NULL,
  correct TEXT NOT NULL,
  feedback JSONB NOT NULL,
  source TEXT DEFAULT 'ai-generated',
  model TEXT,
  quality TEXT DEFAULT 'unreviewed',
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**What's captured:**
- Every individual response with timestamp
- Response latency (if provided)
- Item and session identifiers (if provided)
- Difficulty level (if provided)
- Aggregate mastery per user/objective

**Access:** Via `mcq_record` / `mcq_get_status` tools or Supabase dashboard

### Website Demo → Vercel Postgres (Separate)

The website demo has **richer response-level logging** for development/research.

| Table | Purpose |
|-------|---------|
| `assessment_responses` | Individual answers with latency, correctness |
| `generated_items` | Questions created during sessions |
| `user_contexts` | Session and user metadata |

**Access:** Via `/api/log-response` endpoint or Vercel dashboard

### Comparison

| Aspect | MCP Server | Website Demo |
|--------|------------|--------------|
| **Storage** | Supabase | Vercel Postgres |
| **Granularity** | Response-level | Response-level |
| **Latency tracking** | Yes | Yes |
| **Item metadata** | Yes (item_id, difficulty) | Yes |
| **Psychometrics-ready** | Yes | Yes |

> **Note:** The MCP server now supports full response-level logging. The website demo remains a separate system for development/testing.

## Local Development

```bash
# Install all dependencies
npm install

# Run website locally
npm run dev:website

# Run server locally (requires SUPABASE_URL and SUPABASE_KEY)
npm run dev:server
```

## Deployment

### Website (Vercel)
- Connected to this repo
- Builds from `packages/website`
- Domain: `mcqmcp.vercel.app`

### Server (Render)
- Connected to this repo
- Builds from `packages/server`
- URL: `mcqmcp.onrender.com`

## Environment Variables

### MCP Server
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase anon/service key |
| `ANTHROPIC_API_KEY` | Claude API key for AI generation (optional) |
| `PORT` | Server port (set by Render) |

### Website
| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key for chat |
| `POSTGRES_URL` | Vercel Postgres connection string |

## Item Schema v2.0

MCQMCP uses a hybrid schema designed for importing from diverse sources while maintaining queryability.

### Core Fields (required)

```json
{
  "id": "js-closures-001",
  "topic": "js-closures",
  "difficulty": "medium",
  "stem": "What will be logged to the console?",
  "code": "for (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}",
  "options": [
    { "id": "A", "text": "0, 1, 2" },
    { "id": "B", "text": "3, 3, 3" },
    { "id": "C", "text": "undefined" },
    { "id": "D", "text": "ReferenceError" }
  ],
  "correct": "B",
  "feedback": {
    "correct": "Correct! With var, all callbacks share the same i.",
    "incorrect": "Think about how var scoping works in loops.",
    "explanation": "var is function-scoped, not block-scoped..."
  }
}
```

### Extended Metadata (optional)

| Object | Purpose | Key Fields |
|--------|---------|------------|
| `psychometrics` | Item analysis | difficulty_index, discrimination, IRT params, n_responses |
| `pedagogy` | Learning design | bloom_level, dok_level, prerequisites, misconceptions |
| `provenance` | Source tracking | source, license, author, imported_at |
| `quality` | Review status | status (draft/imported/reviewed/validated), flags |
| `standards` | Alignment | ccss, ngss, ap, csta arrays |
| `_raw` | Import overflow | Unmapped fields from source |

### Example with Full Metadata

```json
{
  "id": "js-fcc-042",
  "topic": "js-fundamentals",
  "difficulty": "medium",
  "stem": "What does DOM stand for?",
  "options": [...],
  "correct": "A",
  "feedback": {...},

  "psychometrics": {
    "difficulty_index": 0.72,
    "discrimination": 0.45,
    "n_responses": 1250
  },

  "pedagogy": {
    "bloom_level": "remember",
    "misconceptions": ["confuses-dom-with-virtual-dom"]
  },

  "provenance": {
    "source": "freecodecamp",
    "license": "BSD-3-Clause",
    "imported_at": "2024-12-07"
  },

  "quality": {
    "status": "imported"
  }
}
```

See `packages/website/src/lib/mcp/schemas/item.ts` for the full Zod schema.

## Item Sources

| Source | License | Topics |
|--------|---------|--------|
| `mcqmcp-original` | CC-BY-4.0 | Programming, AI/LLMs |
| `freecodecamp` | BSD-3-Clause | JavaScript, React, Python |
| `openstax` | CC-BY-4.0 | Math, Science |
| `ck12` | CC-BY-NC | K-12 STEM |
| `webwork` | GPL | Math (Algebra → Calculus) |

## Topic Taxonomy

Items are organized by category → topic → subtopic:

- **Programming**: js-fundamentals, ts-basics, react-hooks, node-api, git-basics, testing-basics, llm-prompting
- **Math** (K-12): arithmetic, pre-algebra, algebra-1/2, geometry, precalculus, calculus, statistics
- **Science** (K-12): biology, chemistry, physics, earth-science, environmental
- **Medicine**: immunology, anatomy, pathology
- **Social Studies**: US/world history, civics, economics, geography
- **Language Arts**: reading, grammar, writing

See `packages/server/src/taxonomy.json` for the complete taxonomy with standards alignment (CCSS, NGSS, AP).
