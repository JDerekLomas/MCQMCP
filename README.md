# MCQMCP

Assessment infrastructure for AI tutoring. MCQMCP provides validated assessments that AI tutors can use to verify learning.

> **Why this exists:** LLMs tutor millions but can't verify learning happened. MCQMCP gives LLMs the ability to check understanding with structured assessment.

**[Full Vision](docs/VISION.md)** | **[Roadmap](docs/ROADMAP.md)** | **[Research](docs/RESEARCH.md)** | **[Server Spec](SPEC.md)**

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

### `mcq_generate`
Generate an MCQ for a learning objective.

**Request:**
```json
{
  "name": "mcq_generate",
  "arguments": {
    "user_id": "user123",
    "objective": "Understanding React hooks",
    "difficulty": "medium"
  }
}
```

**Response:**
```json
{
  "user_id": "user123",
  "objective": "Understanding React hooks",
  "difficulty": "medium",
  "question": "[Medium] How would you apply the concept of: Understanding React hooks?",
  "options": {
    "A": "Apply it incorrectly",
    "B": "Apply it in an unrelated context",
    "C": "Apply it correctly with proper reasoning",
    "D": "Avoid applying it altogether"
  },
  "correct_answer": "C",
  "explanation": "Proper application requires understanding both the concept and its context."
}
```

### `mcq_record`
Record a learner's response and update mastery.

**Request:**
```json
{
  "name": "mcq_record",
  "arguments": {
    "user_id": "user123",
    "objective": "Understanding React hooks",
    "selected_answer": "C",
    "correct_answer": "C"
  }
}
```

**Response:**
```json
{
  "user_id": "user123",
  "objective": "Understanding React hooks",
  "was_correct": true,
  "correct": 3,
  "total": 4,
  "mastery": 0.75
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

The MCP server stores **aggregate mastery data** in Supabase Postgres.

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

**What's captured:**
- User ID + learning objective (composite key)
- Running totals: correct answers / total attempts
- Mastery percentage (correct/total)
- Last activity timestamp

**What's NOT captured (yet):**
- Individual response records
- Response latency
- Item-level metadata
- Session context

**Access:** Via `mcq_get_status` tool or Supabase dashboard

### Website Demo → Vercel Postgres (Separate)

The website demo has **richer response-level logging** for development/research.

| Table | Purpose |
|-------|---------|
| `assessment_responses` | Individual answers with latency, correctness |
| `generated_items` | Questions created during sessions |
| `user_contexts` | Session and user metadata |

**Access:** Via `/api/log-response` endpoint or Vercel dashboard

### Data Gap

| Aspect | MCP Server | Website Demo |
|--------|------------|--------------|
| **Storage** | Supabase | Vercel Postgres |
| **Granularity** | Aggregate only | Response-level |
| **Latency tracking** | No | Yes |
| **Item metadata** | No | Yes |
| **Psychometrics-ready** | No | Yes |

> **Roadmap:** The MCP server needs response-level logging to enable psychometric analysis (item difficulty, discrimination, etc.). This is planned for Phase 2.

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
| `PORT` | Server port (set by Render) |

### Website
| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key for chat |
| `POSTGRES_URL` | Vercel Postgres connection string |
