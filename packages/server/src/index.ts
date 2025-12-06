#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createServer } from "http";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load item bank
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const itemBankPath = join(__dirname, "item-bank.json");
const itemBank = JSON.parse(readFileSync(itemBankPath, "utf-8"));

// Index items by topic and difficulty
interface Item {
  id: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  stem: string;
  code?: string;
  options: { id: string; text: string }[];
  correct: string;
  feedback: { correct: string; incorrect: string; explanation: string };
}

const itemsByTopic: Record<string, Item[]> = {};
const itemsByDifficulty: Record<string, Item[]> = { easy: [], medium: [], hard: [] };
const allTopics = new Set<string>();

for (const item of itemBank.items as Item[]) {
  allTopics.add(item.topic);
  if (!itemsByTopic[item.topic]) {
    itemsByTopic[item.topic] = [];
  }
  itemsByTopic[item.topic].push(item);
  itemsByDifficulty[item.difficulty].push(item);
}

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create MCP server
const server = new McpServer({
  name: "mcqmcp",
  version: "0.2.0",
});

// Helper to find matching items
function findItems(topic: string | undefined, difficulty: "easy" | "medium" | "hard"): Item[] {
  let candidates: Item[] = [];

  if (topic) {
    // Try exact topic match first
    const topicLower = topic.toLowerCase().replace(/\s+/g, "-");
    if (itemsByTopic[topicLower]) {
      candidates = itemsByTopic[topicLower].filter(i => i.difficulty === difficulty);
    }
    // Try partial match
    if (candidates.length === 0) {
      for (const [t, items] of Object.entries(itemsByTopic)) {
        if (t.includes(topicLower) || topicLower.includes(t.replace("js-", "").replace("react-", ""))) {
          candidates.push(...items.filter(i => i.difficulty === difficulty));
        }
      }
    }
  }

  // Fall back to any item with matching difficulty
  if (candidates.length === 0) {
    candidates = itemsByDifficulty[difficulty];
  }

  return candidates;
}

// Tool 0: mcq_list_topics - List available topics
server.tool(
  "mcq_list_topics",
  "List all available assessment topics",
  {},
  async () => {
    const topics = Array.from(allTopics).map(topic => {
      const items = itemsByTopic[topic] || [];
      return {
        topic,
        item_count: items.length,
        difficulties: [...new Set(items.map(i => i.difficulty))],
      };
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ topics, total_items: itemBank.items.length }, null, 2),
        },
      ],
    };
  }
);

// Tool 1: mcq_generate - Get a real MCQ from the item bank
server.tool(
  "mcq_generate",
  "Get a multiple choice question from the item bank for a topic",
  {
    user_id: z.string().describe("The learner's user ID"),
    topic: z.string().optional().describe("Topic to quiz on (e.g., 'js-closures', 'react-hooks'). Omit for random."),
    difficulty: z.enum(["easy", "medium", "hard"]).describe("Question difficulty level"),
  },
  async ({ user_id, topic, difficulty }) => {
    const candidates = findItems(topic, difficulty);

    if (candidates.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: "no_items_found",
              message: `No items found for topic "${topic}" at difficulty "${difficulty}"`,
              available_topics: Array.from(allTopics),
            }, null, 2),
          },
        ],
      };
    }

    // Pick a random item
    const item = candidates[Math.floor(Math.random() * candidates.length)];

    // Format options as A, B, C, D
    const options: Record<string, string> = {};
    item.options.forEach(opt => {
      options[opt.id] = opt.text;
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              user_id,
              item_id: item.id,
              topic: item.topic,
              difficulty: item.difficulty,
              question: item.stem,
              code: item.code || null,
              options,
              correct_answer: item.correct,
              explanation: item.feedback.explanation,
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
    item_id: z.string().optional().describe("Optional item identifier for tracking specific questions"),
    session_id: z.string().optional().describe("Optional session identifier for grouping responses"),
    latency_ms: z.number().optional().describe("Optional response time in milliseconds"),
    difficulty: z.enum(["easy", "medium", "hard"]).optional().describe("Optional difficulty level of the item"),
  },
  async ({ user_id, objective, selected_answer, correct_answer, item_id, session_id, latency_ms, difficulty }) => {
    const wasCorrect = selected_answer.toUpperCase() === correct_answer.toUpperCase();
    const timestamp = new Date().toISOString();

    // 1. Log individual response to responses table
    const responseRecord = {
      user_id,
      objective,
      item_id: item_id || null,
      session_id: session_id || null,
      selected_answer: selected_answer.toUpperCase(),
      correct_answer: correct_answer.toUpperCase(),
      is_correct: wasCorrect,
      latency_ms: latency_ms || null,
      difficulty: difficulty || null,
      created_at: timestamp,
    };

    const { error: responseError } = await supabase.from("responses").insert(responseRecord);
    if (responseError) {
      console.error("Error logging response:", responseError);
    }

    // 2. Update aggregate mastery stats
    const { data: existing } = await supabase
      .from("mastery")
      .select("correct, total")
      .eq("user_id", user_id)
      .eq("objective", objective)
      .single();

    let correctCount = existing?.correct ?? 0;
    let totalCount = existing?.total ?? 0;

    if (wasCorrect) {
      correctCount++;
    }
    totalCount++;

    const { error: masteryError } = await supabase.from("mastery").upsert(
      {
        user_id,
        objective,
        correct: correctCount,
        total: totalCount,
        updated_at: timestamp,
      },
      { onConflict: "user_id,objective" }
    );

    if (masteryError) {
      console.error("Error updating mastery:", masteryError);
    }

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
              response_logged: !responseError,
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
      const { data: row } = await supabase
        .from("mastery")
        .select("correct, total")
        .eq("user_id", user_id)
        .eq("objective", objective)
        .single();

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
    const { data: rows } = await supabase
      .from("mastery")
      .select("objective, correct, total")
      .eq("user_id", user_id);

    const objectives = (rows || []).map((row) => ({
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

// Tool handlers for REST API
type ToolName = "mcq_list_topics" | "mcq_generate" | "mcq_record" | "mcq_get_status";

interface ToolRequest {
  name: ToolName;
  arguments: Record<string, unknown>;
}

async function handleToolCall(name: ToolName, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "mcq_list_topics": {
      const topics = Array.from(allTopics).map(topic => {
        const items = itemsByTopic[topic] || [];
        return { topic, item_count: items.length, difficulties: [...new Set(items.map(i => i.difficulty))] };
      });
      return { topics, total_items: itemBank.items.length };
    }

    case "mcq_generate": {
      const { user_id, topic, difficulty } = args as { user_id: string; topic?: string; difficulty: "easy" | "medium" | "hard" };
      const candidates = findItems(topic, difficulty);

      if (candidates.length === 0) {
        return { error: "no_items_found", message: `No items found for topic "${topic}" at difficulty "${difficulty}"`, available_topics: Array.from(allTopics) };
      }

      const item = candidates[Math.floor(Math.random() * candidates.length)];
      const options: Record<string, string> = {};
      item.options.forEach(opt => { options[opt.id] = opt.text; });

      return { user_id, item_id: item.id, topic: item.topic, difficulty: item.difficulty, question: item.stem, code: item.code || null, options, correct_answer: item.correct, explanation: item.feedback.explanation };
    }

    case "mcq_record": {
      const { user_id, objective, selected_answer, correct_answer, item_id, session_id, latency_ms, difficulty } = args as {
        user_id: string; objective: string; selected_answer: string; correct_answer: string;
        item_id?: string; session_id?: string; latency_ms?: number; difficulty?: "easy" | "medium" | "hard";
      };
      const wasCorrect = selected_answer.toUpperCase() === correct_answer.toUpperCase();
      const timestamp = new Date().toISOString();

      // 1. Log individual response
      const responseRecord = {
        user_id,
        objective,
        item_id: item_id || null,
        session_id: session_id || null,
        selected_answer: selected_answer.toUpperCase(),
        correct_answer: correct_answer.toUpperCase(),
        is_correct: wasCorrect,
        latency_ms: latency_ms || null,
        difficulty: difficulty || null,
        created_at: timestamp,
      };
      const { error: responseError } = await supabase.from("responses").insert(responseRecord);
      if (responseError) console.error("Error logging response:", responseError);

      // 2. Update aggregate mastery
      const { data: existing } = await supabase.from("mastery").select("correct, total").eq("user_id", user_id).eq("objective", objective).single();
      let correctCount = existing?.correct ?? 0;
      let totalCount = existing?.total ?? 0;
      if (wasCorrect) correctCount++;
      totalCount++;
      const { error: masteryError } = await supabase.from("mastery").upsert({ user_id, objective, correct: correctCount, total: totalCount, updated_at: timestamp }, { onConflict: "user_id,objective" });
      if (masteryError) console.error("Error updating mastery:", masteryError);

      return { user_id, objective, was_correct: wasCorrect, correct: correctCount, total: totalCount, mastery: totalCount > 0 ? correctCount / totalCount : 0, response_logged: !responseError };
    }

    case "mcq_get_status": {
      const { user_id, objective } = args as { user_id: string; objective?: string };
      if (objective) {
        const { data: row } = await supabase.from("mastery").select("correct, total").eq("user_id", user_id).eq("objective", objective).single();
        if (!row) return { user_id, objective, status: "no_data" };
        return { user_id, objective, correct: row.correct, total: row.total, mastery: row.total > 0 ? row.correct / row.total : 0 };
      }
      const { data: rows } = await supabase.from("mastery").select("objective, correct, total").eq("user_id", user_id);
      return { user_id, objectives: (rows || []).map((r) => ({ objective: r.objective, correct: r.correct, total: r.total, mastery: r.total > 0 ? r.correct / r.total : 0 })) };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

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

      // Health check with DB status
      if (req.url === "/" && req.method === "GET") {
        let dbStatus = "unknown";
        try {
          const { error } = await supabase.from("mastery").select("user_id").limit(1);
          dbStatus = error ? "error" : "connected";
        } catch {
          dbStatus = "error";
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          name: "MCQMCP",
          version: "0.1.0",
          status: "ok",
          database: dbStatus,
          endpoints: {
            health: "/",
            sse: "/sse",
            messages: "/messages",
            api: "/api/tools/call"
          },
          tools: ["mcq_list_topics", "mcq_generate", "mcq_record", "mcq_get_status"],
          docs: "https://github.com/JDerekLomas/MCQMCP"
        }));
        return;
      }

      // REST API endpoint for tool calls (stateless, no SSE required)
      if (req.url === "/api/tools/call" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", async () => {
          try {
            const request = JSON.parse(body) as ToolRequest;
            if (!request.name || !request.arguments) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Missing 'name' or 'arguments' in request body" }));
              return;
            }
            const result = await handleToolCall(request.name, request.arguments);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, result }));
          } catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }));
          }
        });
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
      console.error(`Health check: http://localhost:${port}/`);
      console.error(`REST API: http://localhost:${port}/api/tools/call`);
      console.error(`SSE endpoint: http://localhost:${port}/sse`);
      console.error(`Messages endpoint: http://localhost:${port}/messages`);
      console.error(`Supabase: ${supabaseUrl}`);
    });
  } else {
    // Stdio transport (default)
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCQMCP server running on stdio");
    console.error(`Supabase: ${supabaseUrl}`);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
