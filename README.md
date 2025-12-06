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

## MCP Server Tools

| Tool | Description | Inputs |
|------|-------------|--------|
| `mcq_generate` | Generate an MCQ for a learning objective | `user_id`, `objective`, `difficulty` |
| `mcq_record` | Record a learner's response and update mastery | `user_id`, `objective`, `selected_answer`, `correct_answer` |
| `mcq_get_status` | Get mastery status | `user_id`, `objective` (optional) |

## Data Logging & Storage

### MCP Server (Production)
- **Database:** Supabase Postgres
- **Table:** `mastery` (user_id, objective, correct, total, updated_at)
- **Access:** Via `mcq_record` (write) and `mcq_get_status` (read)

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

### Website Demo (Separate System)
- **Database:** Vercel Postgres
- **Tables:** `assessment_responses`, `generated_items`, `user_contexts`
- **Access:** Via REST API at `/api/log-response`

```bash
# Get stats and recent logs
GET /api/log-response

# Log a response
POST /api/log-response
{
  "item_id": "js-closures-001",
  "selected": "B",
  "correct": "B",
  "is_correct": true,
  "latency_ms": 12500,
  "timestamp": "2025-12-06T15:30:00Z",
  "session_id": "uuid-here"
}
```

**View logged data:** Settings Modal in the website UI, or query the API directly.

> **Note:** The website demo uses its own local tools and database for the interactive demo. The MCP server is the production system for external clients.

## Quick Start

### Connect to MCP Server

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const transport = new SSEClientTransport(
  new URL("https://mcqmcp.onrender.com/sse")
);
const client = new Client({ name: "my-app", version: "1.0.0" });
await client.connect(transport);

// Generate a question
const result = await client.callTool({
  name: "mcq_generate",
  arguments: {
    user_id: "user123",
    objective: "Understanding React hooks",
    difficulty: "medium"
  }
});

// Record a response
await client.callTool({
  name: "mcq_record",
  arguments: {
    user_id: "user123",
    objective: "Understanding React hooks",
    selected_answer: "C",
    correct_answer: "C"
  }
});

// Check mastery status
const status = await client.callTool({
  name: "mcq_get_status",
  arguments: {
    user_id: "user123"
  }
});
```

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
- Requires `ANTHROPIC_API_KEY` env var

### Server (Render)
- Connected to this repo
- Builds from `packages/server`
- URL: `mcqmcp.onrender.com`
- Requires `SUPABASE_URL` and `SUPABASE_KEY` env vars

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
