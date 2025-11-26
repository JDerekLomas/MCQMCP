#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createServer } from "http";
import { z } from "zod";
import Database from "better-sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync } from "fs";

// Database setup
const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.MCQMCP_DATA_DIR || join(__dirname, "..", "data");

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const db = new Database(join(dataDir, "mcqmcp.db"));

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS mastery (
    user_id TEXT NOT NULL,
    objective TEXT NOT NULL,
    correct INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, objective)
  )
`);

// Prepared statements for performance
const getObjective = db.prepare(`
  SELECT correct, total FROM mastery WHERE user_id = ? AND objective = ?
`);

const getAllObjectives = db.prepare(`
  SELECT objective, correct, total FROM mastery WHERE user_id = ?
`);

const upsertMastery = db.prepare(`
  INSERT INTO mastery (user_id, objective, correct, total, updated_at)
  VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(user_id, objective) DO UPDATE SET
    correct = excluded.correct,
    total = excluded.total,
    updated_at = CURRENT_TIMESTAMP
`);

// Create MCP server
const server = new McpServer({
  name: "mcqmcp",
  version: "0.1.0",
});

// Tool 1: mcq_generate - Generate an MCQ for a learning objective
server.tool(
  "mcq_generate",
  "Generate a multiple choice question for a learning objective",
  {
    user_id: z.string().describe("The learner's user ID"),
    objective: z.string().describe("The learning objective to test"),
    difficulty: z.enum(["easy", "medium", "hard"]).describe("Question difficulty level"),
  },
  async ({ user_id, objective, difficulty }) => {
    // Placeholder question generation (will be replaced with LLM later)
    const questions: Record<string, { question: string; options: Record<string, string>; correct_answer: string; explanation: string }> = {
      easy: {
        question: `[Easy] What is a key concept related to: ${objective}?`,
        options: {
          A: "The correct fundamental concept",
          B: "A common misconception",
          C: "An unrelated concept",
          D: "A partially correct idea",
        },
        correct_answer: "A",
        explanation: `The correct answer demonstrates understanding of the basics of ${objective}.`,
      },
      medium: {
        question: `[Medium] How would you apply the concept of: ${objective}?`,
        options: {
          A: "Apply it incorrectly",
          B: "Apply it in an unrelated context",
          C: "Apply it correctly with proper reasoning",
          D: "Avoid applying it altogether",
        },
        correct_answer: "C",
        explanation: `Proper application of ${objective} requires understanding both the concept and its context.`,
      },
      hard: {
        question: `[Hard] Analyze the implications of: ${objective}`,
        options: {
          A: "Surface-level analysis only",
          B: "Misunderstanding the core principle",
          C: "Partial analysis missing key aspects",
          D: "Deep analysis considering multiple perspectives and edge cases",
        },
        correct_answer: "D",
        explanation: `Advanced understanding of ${objective} requires considering multiple perspectives and edge cases.`,
      },
    };

    const q = questions[difficulty];

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              user_id,
              objective,
              difficulty,
              question: q.question,
              options: q.options,
              correct_answer: q.correct_answer,
              explanation: q.explanation,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool 2: mcq_record - Record a learner's response
server.tool(
  "mcq_record",
  "Record a learner's MCQ response and update mastery model",
  {
    user_id: z.string().describe("The learner's user ID"),
    objective: z.string().describe("The learning objective tested"),
    selected_answer: z.string().describe("The answer selected by the learner (A, B, C, or D)"),
    correct_answer: z.string().describe("The correct answer (A, B, C, or D)"),
  },
  async ({ user_id, objective, selected_answer, correct_answer }) => {
    // Get current stats
    const row = getObjective.get(user_id, objective) as { correct: number; total: number } | undefined;
    let correctCount = row?.correct ?? 0;
    let totalCount = row?.total ?? 0;

    // Update stats
    const wasCorrect = selected_answer.toUpperCase() === correct_answer.toUpperCase();
    if (wasCorrect) {
      correctCount++;
    }
    totalCount++;

    // Save to database
    upsertMastery.run(user_id, objective, correctCount, totalCount);

    const masteryEstimate = Math.round((correctCount / totalCount) * 100);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              user_id,
              objective,
              selected_answer,
              correct_answer,
              was_correct: wasCorrect,
              current_score: `${correctCount}/${totalCount}`,
              mastery_estimate: `${masteryEstimate}%`,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool 3: mcq_get_status - Get mastery status for a user
server.tool(
  "mcq_get_status",
  "Get mastery status for a user, optionally filtered by objective",
  {
    user_id: z.string().describe("The learner's user ID"),
    objective: z.string().optional().describe("Specific objective to query (omit for all objectives)"),
  },
  async ({ user_id, objective }) => {
    if (objective) {
      // Return specific objective
      const row = getObjective.get(user_id, objective) as { correct: number; total: number } | undefined;
      if (!row) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  user_id,
                  objective,
                  status: "no_data",
                  message: "No mastery data found for this objective",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const masteryEstimate = Math.round((row.correct / row.total) * 100);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                user_id,
                objective,
                correct: row.correct,
                total: row.total,
                current_score: `${row.correct}/${row.total}`,
                mastery_estimate: `${masteryEstimate}%`,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Return all objectives
    const rows = getAllObjectives.all(user_id) as Array<{ objective: string; correct: number; total: number }>;

    const objectives = rows.map((row) => ({
      objective: row.objective,
      correct: row.correct,
      total: row.total,
      current_score: `${row.correct}/${row.total}`,
      mastery_estimate: `${Math.round((row.correct / row.total) * 100)}%`,
    }));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              user_id,
              objectives,
              message: objectives.length === 0 ? "No mastery data found for this user" : undefined,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Main function to start the server
async function main() {
  const useHttp = process.argv.includes("--http");
  const port = parseInt(process.env.PORT || "3000", 10);

  if (useHttp) {
    // HTTP/SSE transport
    let transport: SSEServerTransport | null = null;

    const httpServer = createServer(async (req, res) => {
      // CORS headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.url === "/sse" && req.method === "GET") {
        // SSE endpoint for server-to-client messages
        transport = new SSEServerTransport("/messages", res);
        await server.connect(transport);
      } else if (req.url === "/messages" && req.method === "POST") {
        // Messages endpoint for client-to-server messages
        if (transport) {
          let body = "";
          req.on("data", (chunk) => (body += chunk));
          req.on("end", async () => {
            try {
              await transport!.handlePostMessage(req, res, body);
            } catch (error) {
              res.writeHead(500);
              res.end(JSON.stringify({ error: "Internal server error" }));
            }
          });
        } else {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "No active SSE connection" }));
        }
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Not found" }));
      }
    });

    httpServer.listen(port, () => {
      console.error(`MCQMCP server running on http://localhost:${port}`);
      console.error(`SSE endpoint: http://localhost:${port}/sse`);
      console.error(`Messages endpoint: http://localhost:${port}/messages`);
      console.error(`Database: ${join(dataDir, "mcqmcp.db")}`);
    });
  } else {
    // Stdio transport (default)
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCQMCP server running on stdio");
    console.error(`Database: ${join(dataDir, "mcqmcp.db")}`);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
