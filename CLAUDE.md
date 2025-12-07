# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

MCQMCP is assessment infrastructure for AI tutoring - an MCP server for MCQ generation and mastery tracking that gives LLMs the ability to verify learning with structured assessment.

### MCP Tools
- `mcq_generate` - Generate MCQs from the item bank
- `mcq_record` - Record learner responses and update mastery
- `mcq_get_status` - Get mastery status for a user

## Commands

```bash
# Monorepo root
npm install          # Install all dependencies
npm run dev:website  # Run website locally
npm run dev:server   # Run server locally

# Server package
npm run build        # Compile TypeScript
npm start            # Run server (stdio transport)
npm run start:http   # Run server (HTTP/SSE transport)
```

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **MCP SDK:** @modelcontextprotocol/sdk
- **Database:** Supabase Postgres
- **Website:** Next.js 16 + React 19 + Tailwind CSS v4
- **Validation:** Zod
- **Transports:** Stdio (default), HTTP/SSE

## Repository Structure

```
MCQMCP-monorepo/
├── packages/
│   ├── server/              # MCP server (Render)
│   │   ├── src/
│   │   │   ├── index.ts     # Server with MCP tools
│   │   │   ├── item-bank.json    # Item bank (82+ items)
│   │   │   └── taxonomy.json     # Topic taxonomy
│   │   └── package.json
│   └── website/             # Marketing + demo (Vercel)
│       ├── src/
│       │   ├── app/         # Next.js pages
│       │   └── lib/mcp/
│       │       └── schemas/item.ts  # Zod schema v2.0
│       └── package.json
├── .claude/commands/        # Claude Code slash commands
│   ├── create-item.md       # Generate new MCQs
│   ├── import-items.md      # Import from external sources
│   └── search-item-banks.md # Search OER repositories
└── docs/                    # Vision, roadmap, research
```

## Item Schema v2.0

Hybrid schema: structured core + optional metadata + overflow for imports.

### Core Fields (required)
```typescript
id: string           // Unique identifier
topic: string        // Topic taxonomy ID
difficulty: "easy" | "medium" | "hard"
stem: string         // Question text
options: Option[4]   // Exactly 4 choices
correct: "A"|"B"|"C"|"D"
feedback: { correct, incorrect, explanation }
```

### Extended Metadata (optional objects)
```typescript
psychometrics?: {    // Item analysis data
  difficulty_index, discrimination, point_biserial,
  irt: { a, b, c }, n_responses
}
pedagogy?: {         // Learning design
  bloom_level, dok_level, prerequisites, misconceptions
}
provenance?: {       // Source tracking
  source, license, author, imported_at, original_format
}
quality?: {          // Review status
  status: "draft"|"imported"|"reviewed"|"validated"|"deprecated"
}
standards?: {        // Educational alignment
  ccss, ngss, ap, csta: string[]
}
_raw?: Record<string, unknown>  // Unmapped import data
```

### Topic Categories
- **Programming**: js-*, ts-*, react-*, node-*, git-*, testing-*, llm-*
- **Math** (K-12): arithmetic, algebra-1/2, geometry, calculus, statistics
- **Science** (K-12): biology, chemistry, physics, earth-science
- **Medicine**: immunology, anatomy, pathology
- **Social Studies**: history, civics, economics, geography
- **Language Arts**: reading, grammar, writing

## Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `SUPABASE_URL` | Server | Supabase project URL |
| `SUPABASE_KEY` | Server | Supabase anon key |
| `PORT` | Server | HTTP port (Render: 8080) |
| `ANTHROPIC_API_KEY` | Website | Claude API key |
| `POSTGRES_URL` | Website | Vercel Postgres URL |

## Deployment

| Service | URL | Platform |
|---------|-----|----------|
| MCP Server | mcqmcp.onrender.com | Render |
| Website | mcqmcp.vercel.app | Vercel |
| Dashboard | claude-mcq-assessment.vercel.app/dashboard | Vercel |

## Claude Commands

Use these slash commands for item bank management:

- `/create-item topic:js-closures difficulty:medium` - Generate new MCQ
- `/import-items source:freecodecamp topic:javascript` - Import from external source
- `/search-item-banks subject:math grade:high-school` - Search OER repositories
