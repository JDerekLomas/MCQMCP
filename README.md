# MCQMCP

MCP server for MCQ (Multiple Choice Question) generation and mastery tracking.

## Live Server

**URL:** `https://mcqmcp.onrender.com/sse`

## Tools

| Tool | Description | Inputs |
|------|-------------|--------|
| `mcq_generate` | Generate an MCQ for a learning objective | `user_id`, `objective`, `difficulty` (easy/medium/hard) |
| `mcq_record` | Record a learner's response | `user_id`, `objective`, `selected_answer`, `correct_answer` |
| `mcq_get_status` | Get mastery status | `user_id`, `objective` (optional) |

## Usage

### Connect from MCP Client

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
```

### Response Examples

**mcq_generate:**
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

**mcq_record:**
```json
{
  "user_id": "user123",
  "objective": "Understanding React hooks",
  "was_correct": true,
  "current_score": "3/4",
  "mastery_estimate": "75%"
}
```

**mcq_get_status:**
```json
{
  "user_id": "user123",
  "objectives": [
    {
      "objective": "Understanding React hooks",
      "correct": 3,
      "total": 4,
      "mastery_estimate": "75%"
    }
  ]
}
```

## Local Development

```bash
# Install dependencies
npm install

# Set environment variables
export SUPABASE_URL="your-supabase-url"
export SUPABASE_KEY="your-supabase-anon-key"

# Build
npm run build

# Run (stdio)
npm start

# Run (HTTP)
npm run start:http
```

## Database

Uses Supabase Postgres with this schema:

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

## Deployment

Deployed on Render. Environment variables required:
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `PORT` (set by Render)

## Integration

See [Claude-mcq-assessment](https://github.com/JDerekLomas/Claude-mcq-assessment) for a Next.js frontend integration example.
