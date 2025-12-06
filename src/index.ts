#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createServer } from "http";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

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
    session_id: z.string().optional().describe("Optional session ID to group responses"),
    response_time_ms: z.number().optional().describe("Time taken to respond in milliseconds"),
  },
  async ({ user_id, objective, selected_answer, correct_answer, session_id, response_time_ms }) => {
    const wasCorrect = selected_answer.toUpperCase() === correct_answer.toUpperCase();

    // 1. Log individual response to responses table
    const { error: responseError } = await supabase.from("responses").insert({
      session_id: session_id || null,
      user_id,
      objective,
      selected_answer: selected_answer.toUpperCase(),
      correct_answer: correct_answer.toUpperCase(),
      is_correct: wasCorrect,
      response_time_ms: response_time_ms || null,
    });

    if (responseError) {
      console.error("Supabase response logging error:", responseError);
    }

    // 2. Update aggregate mastery table for real-time feedback
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
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,objective" }
    );

    if (masteryError) {
      console.error("Supabase mastery error:", masteryError);
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
              logged: !responseError,
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

// Tool 4: mcq_start_session - Start a new learning session
server.tool(
  "mcq_start_session",
  "Start a new learning/assessment session for tracking",
  {
    user_id: z.string().describe("The learner's user ID"),
    metadata: z.record(z.any()).optional().describe("Optional metadata (skill, mode, context)"),
  },
  async ({ user_id, metadata }) => {
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        user_id,
        metadata: metadata || {},
      })
      .select("id, started_at")
      .single();

    if (error) {
      console.error("Supabase session error:", error);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: "Failed to create session" }, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              session_id: data.id,
              user_id,
              started_at: data.started_at,
              message: "Session started. Use this session_id when recording responses.",
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool 5: mcq_end_session - End a learning session
server.tool(
  "mcq_end_session",
  "End a learning session and get summary",
  {
    session_id: z.string().describe("The session ID to end"),
  },
  async ({ session_id }) => {
    // Update session end time
    const { error: updateError } = await supabase
      .from("sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", session_id);

    if (updateError) {
      console.error("Supabase session update error:", updateError);
    }

    // Get session summary
    const { data: responses } = await supabase
      .from("responses")
      .select("objective, is_correct, response_time_ms")
      .eq("session_id", session_id);

    const total = responses?.length || 0;
    const correct = responses?.filter((r) => r.is_correct).length || 0;
    const avgTime = responses?.length
      ? Math.round(
          responses.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / responses.length
        )
      : null;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              session_id,
              ended_at: new Date().toISOString(),
              summary: {
                total_responses: total,
                correct,
                incorrect: total - correct,
                accuracy: total > 0 ? `${Math.round((correct / total) * 100)}%` : "N/A",
                avg_response_time_ms: avgTime,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool 6: mcq_get_history - Get response history for a user
server.tool(
  "mcq_get_history",
  "Get detailed response history for a user",
  {
    user_id: z.string().describe("The learner's user ID"),
    limit: z.number().optional().describe("Maximum number of responses to return (default 50)"),
    objective: z.string().optional().describe("Filter by specific objective"),
  },
  async ({ user_id, limit, objective }) => {
    let query = supabase
      .from("responses")
      .select("id, session_id, objective, selected_answer, correct_answer, is_correct, response_time_ms, created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(limit || 50);

    if (objective) {
      query = query.eq("objective", objective);
    }

    const { data: responses, error } = await query;

    if (error) {
      console.error("Supabase history error:", error);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: "Failed to fetch history" }, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              user_id,
              response_count: responses?.length || 0,
              responses: responses || [],
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
