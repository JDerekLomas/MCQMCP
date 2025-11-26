# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

MCQMCP is an MCP (Model Context Protocol) server for MCQ generation and mastery tracking. It provides three tools that can be called by MCP clients:

- `mcq_generate` - Generate placeholder MCQs (to be replaced with LLM generation)
- `mcq_record` - Record learner responses and update mastery model
- `mcq_get_status` - Get mastery status for a user

## Commands

```bash
npm install      # Install dependencies
npm run build    # Compile TypeScript
npm start        # Run server (stdio transport)
npm run start:http  # Run server (HTTP/SSE transport)
```

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **MCP SDK:** @modelcontextprotocol/sdk
- **Database:** Supabase Postgres
- **Validation:** Zod
- **Transports:** Stdio (default), HTTP/SSE

## Architecture

```
src/
└── index.ts     # Main server with all three tools
```

The server uses:
- Supabase client for database operations
- MCP SDK's `McpServer` class with `server.tool()` registration
- SSEServerTransport for HTTP mode, StdioServerTransport for CLI mode

## Environment Variables

- `SUPABASE_URL` - Supabase project URL (required)
- `SUPABASE_KEY` - Supabase anon key (required)
- `PORT` - HTTP port (default: 3000, Render uses 8080)

## Deployment

Currently deployed on Render at `https://mcqmcp.onrender.com`

## Related Projects

- [Claude-mcq-assessment](https://github.com/JDerekLomas/Claude-mcq-assessment) - Next.js frontend that integrates with this MCP server
