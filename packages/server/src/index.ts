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

// Import hybrid generation modules
import { matchTopic, shouldUseItemBank, MATCH_THRESHOLD, type MatchResult } from "./topic-matcher.js";
import { generateItem, isGenerationEnabled, type GeneratedItem } from "./generate-item.js";

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
// Note: Using 'as any' to avoid TypeScript deep type inference issues with MCP SDK generics
const server = new McpServer({
  name: "mcqmcp",
  version: "0.3.0", // Bumped version for hybrid generation
}) as any;

// Helper to find matching items from item bank
function findItemsFromBank(topic: string, difficulty: "easy" | "medium" | "hard"): Item[] {
  const topicLower = topic.toLowerCase();
  if (itemsByTopic[topicLower]) {
    const candidates = itemsByTopic[topicLower].filter(i => i.difficulty === difficulty);
    if (candidates.length > 0) return candidates;
    // Fall back to any difficulty for this topic
    return itemsByTopic[topicLower];
  }
  return [];
}

// Helper to check for cached generated items in Supabase
async function findCachedGeneratedItem(
  objective: string,
  difficulty: "easy" | "medium" | "hard"
): Promise<GeneratedItem | null> {
  const normalized = objective.toLowerCase().trim().replace(/\s+/g, ' ');

  const { data, error } = await supabase
    .from("generated_items")
    .select("*")
    .eq("objective_normalized", normalized)
    .eq("difficulty", difficulty)
    .eq("quality", "unreviewed") // Could also include 'validated'
    .order("use_count", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  const item = data[0];

  // Increment use count
  await supabase
    .from("generated_items")
    .update({ use_count: item.use_count + 1, last_used_at: new Date().toISOString() })
    .eq("id", item.id);

  return {
    id: item.id,
    objective: item.objective,
    objective_normalized: item.objective_normalized,
    topic: item.topic,
    difficulty: item.difficulty,
    stem: item.stem,
    code: item.code,
    options: item.options,
    correct: item.correct,
    feedback: item.feedback,
    source: "ai-generated",
    model: item.model,
    quality: item.quality,
  };
}

// Helper to store a generated item in Supabase
async function storeGeneratedItem(item: GeneratedItem): Promise<void> {
  const { error } = await supabase.from("generated_items").insert({
    id: item.id,
    objective: item.objective,
    objective_normalized: item.objective_normalized,
    topic: item.topic,
    difficulty: item.difficulty,
    stem: item.stem,
    code: item.code,
    options: item.options,
    correct: item.correct,
    feedback: item.feedback,
    source: item.source,
    model: item.model,
    quality: item.quality,
    use_count: 1,
    last_used_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error storing generated item:", error);
  }
}

// Tool 0: mcq_list_topics - List available topics
server.tool(
  "mcq_list_topics",
  "List all available assessment topics in the item bank",
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
          text: JSON.stringify({
            topics,
            total_items: itemBank.items.length,
            generation_enabled: isGenerationEnabled(),
          }, null, 2),
        },
      ],
    };
  }
);

// Tool 1: mcq_generate - Hybrid: item bank + AI generation
server.tool(
  "mcq_generate",
  "Get a multiple choice question. First tries to match from item bank, then generates with AI if no match found.",
  {
    user_id: z.string(),
    objective: z.string(),
    difficulty: z.enum(["easy", "medium", "hard"]),
  },
  async ({ user_id, objective, difficulty }: { user_id: string; objective: string; difficulty: "easy" | "medium" | "hard" }) => {
    const availableTopics = Array.from(allTopics);

    // Step 1: Try to match objective to existing topic
    const match = matchTopic(objective, availableTopics);

    // Step 2: If good match, return from item bank
    if (shouldUseItemBank(match) && match.topic) {
      const candidates = findItemsFromBank(match.topic, difficulty);

      if (candidates.length > 0) {
        const item = candidates[Math.floor(Math.random() * candidates.length)];
        const options: Record<string, string> = {};
        item.options.forEach(opt => { options[opt.id] = opt.text; });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                user_id,
                item_id: item.id,
                topic: item.topic,
                difficulty: item.difficulty,
                question: item.stem,
                code: item.code || null,
                options,
                correct_answer: item.correct,
                explanation: item.feedback.explanation,
                source: "curated",
                match_confidence: match.confidence,
                match_type: match.matchType,
              }, null, 2),
            },
          ],
        };
      }
    }

    // Step 3: Check for cached generated item
    const cached = await findCachedGeneratedItem(objective, difficulty);
    if (cached) {
      const options: Record<string, string> = {};
      cached.options.forEach(opt => { options[opt.id] = opt.text; });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              user_id,
              item_id: cached.id,
              topic: cached.topic || objective,
              difficulty: cached.difficulty,
              question: cached.stem,
              code: cached.code || null,
              options,
              correct_answer: cached.correct,
              explanation: cached.feedback.explanation,
              source: "ai-generated-cached",
              quality: cached.quality,
              generated_for: cached.objective,
            }, null, 2),
          },
        ],
      };
    }

    // Step 4: Generate new item with Claude (if enabled)
    if (!isGenerationEnabled()) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: "no_match_generation_disabled",
              message: `No items found for "${objective}" and AI generation is not configured`,
              objective,
              closest_topic: match.topic,
              confidence: match.confidence,
              available_topics: availableTopics.slice(0, 20),
              needs_generation: true,
              suggested_prompt: `Generate a ${difficulty} multiple choice question about: ${objective}`,
            }, null, 2),
          },
        ],
      };
    }

    try {
      const generated = await generateItem(objective, difficulty, match.topic);

      // Store for future use
      await storeGeneratedItem(generated);

      const options: Record<string, string> = {};
      generated.options.forEach(opt => { options[opt.id] = opt.text; });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              user_id,
              item_id: generated.id,
              topic: generated.topic || objective,
              difficulty: generated.difficulty,
              question: generated.stem,
              code: generated.code || null,
              options,
              correct_answer: generated.correct,
              explanation: generated.feedback.explanation,
              source: "ai-generated",
              quality: generated.quality,
              generated_for: generated.objective,
              model: generated.model,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: "generation_failed",
              message: error instanceof Error ? error.message : "Failed to generate question",
              objective,
              closest_topic: match.topic,
              confidence: match.confidence,
            }, null, 2),
          },
        ],
      };
    }
  }
);

// Tool 2: mcq_match_topic - Check topic matching without generating
server.tool(
  "mcq_match_topic",
  "Check if an objective matches an existing topic in the item bank (preflight check)",
  {
    objective: z.string(),
  },
  async ({ objective }: { objective: string }) => {
    const match = matchTopic(objective, Array.from(allTopics));
    const hasItems = match.topic ? (itemsByTopic[match.topic]?.length ?? 0) > 0 : false;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            objective,
            matched_topic: match.topic,
            confidence: match.confidence,
            match_type: match.matchType,
            has_items: hasItems,
            item_count: match.topic ? (itemsByTopic[match.topic]?.length ?? 0) : 0,
            will_use_item_bank: shouldUseItemBank(match) && hasItems,
            alternatives: match.alternatives,
            threshold: MATCH_THRESHOLD,
          }, null, 2),
        },
      ],
    };
  }
);

// Tool 3: mcq_add_item - Submit external items
server.tool(
  "mcq_add_item",
  "Submit a generated MCQ item to be stored for future use",
  {
    objective: z.string(),
    topic: z.string().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    stem: z.string(),
    code: z.string().optional(),
    options: z.any(), // Array of {id, text} objects - simplified to avoid deep type recursion
    correct: z.enum(["A", "B", "C", "D"]),
    feedback: z.any(), // {correct, incorrect, explanation} - simplified
    source: z.string().optional(),
  },
  async ({ objective, topic, difficulty, stem, code, options, correct, feedback, source }: {
    objective: string;
    topic?: string;
    difficulty: "easy" | "medium" | "hard";
    stem: string;
    code?: string;
    options: { id: string; text: string }[];
    correct: string;
    feedback: { correct: string; incorrect: string; explanation: string };
    source?: string;
  }) => {
    const id = "ext-" + Math.random().toString(36).substring(2, 15);
    const normalized = objective.toLowerCase().trim().replace(/\s+/g, ' ');

    const { error } = await supabase.from("generated_items").insert({
      id,
      objective,
      objective_normalized: normalized,
      topic: topic || null,
      difficulty,
      stem,
      code: code || null,
      options,
      correct,
      feedback,
      source,
      model: null,
      quality: "unreviewed",
      use_count: 0,
    });

    if (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              error: "storage_failed",
              message: error.message,
            }, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            item_id: id,
            objective,
            topic: topic || null,
            difficulty,
            source,
            message: "Item stored successfully",
          }, null, 2),
        },
      ],
    };
  }
);

// Tool 4: mcq_record - Record a learner's response
server.tool(
  "mcq_record",
  "Record a learner's MCQ response and update mastery model",
  {
    user_id: z.string(),
    objective: z.string(),
    selected_answer: z.string(),
    correct_answer: z.string(),
    item_id: z.string().optional(),
    session_id: z.string().optional(),
    latency_ms: z.number().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  },
  async ({ user_id, objective, selected_answer, correct_answer, item_id, session_id, latency_ms, difficulty }: {
    user_id: string;
    objective: string;
    selected_answer: string;
    correct_answer: string;
    item_id?: string;
    session_id?: string;
    latency_ms?: number;
    difficulty?: "easy" | "medium" | "hard";
  }) => {
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

    // 2. Update generated_items stats if it's a generated item
    if (item_id && (item_id.startsWith("gen-") || item_id.startsWith("ext-"))) {
      await supabase
        .from("generated_items")
        .update({
          total_attempts: supabase.rpc("increment_counter", { row_id: item_id, column_name: "total_attempts" }),
          correct_count: wasCorrect
            ? supabase.rpc("increment_counter", { row_id: item_id, column_name: "correct_count" })
            : undefined,
        })
        .eq("id", item_id);
    }

    // 3. Update aggregate mastery stats
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

// Tool 5: mcq_get_status - Get mastery status for a user
server.tool(
  "mcq_get_status",
  "Get mastery status for a user, optionally filtered by objective",
  {
    user_id: z.string(),
    objective: z.string().optional(),
  },
  async ({ user_id, objective }: { user_id: string; objective?: string }) => {
    if (objective) {
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
              text: JSON.stringify({
                user_id,
                objective,
                status: "no_data",
                message: "No mastery data found for this objective",
              }, null, 2),
            },
          ],
        };
      }

      const masteryEstimate = Math.round((row.correct / row.total) * 100);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              user_id,
              objective,
              correct: row.correct,
              total: row.total,
              current_score: `${row.correct}/${row.total}`,
              mastery_estimate: `${masteryEstimate}%`,
            }, null, 2),
          },
        ],
      };
    }

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
          text: JSON.stringify({
            user_id,
            objectives,
            message: objectives.length === 0 ? "No mastery data found for this user" : undefined,
          }, null, 2),
        },
      ],
    };
  }
);

// Tool handlers for REST API
type ToolName = "mcq_list_topics" | "mcq_generate" | "mcq_match_topic" | "mcq_add_item" | "mcq_record" | "mcq_get_status";

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
      return { topics, total_items: itemBank.items.length, generation_enabled: isGenerationEnabled() };
    }

    case "mcq_generate": {
      const { user_id, objective, difficulty } = args as { user_id: string; objective: string; difficulty: "easy" | "medium" | "hard" };
      const availableTopics = Array.from(allTopics);
      const match = matchTopic(objective, availableTopics);

      // Try item bank first
      if (shouldUseItemBank(match) && match.topic) {
        const candidates = findItemsFromBank(match.topic, difficulty);
        if (candidates.length > 0) {
          const item = candidates[Math.floor(Math.random() * candidates.length)];
          const options: Record<string, string> = {};
          item.options.forEach(opt => { options[opt.id] = opt.text; });
          return { user_id, item_id: item.id, topic: item.topic, difficulty: item.difficulty, question: item.stem, code: item.code || null, options, correct_answer: item.correct, explanation: item.feedback.explanation, source: "curated", match_confidence: match.confidence };
        }
      }

      // Try cached generated item
      const cached = await findCachedGeneratedItem(objective, difficulty);
      if (cached) {
        const options: Record<string, string> = {};
        cached.options.forEach(opt => { options[opt.id] = opt.text; });
        return { user_id, item_id: cached.id, topic: cached.topic || objective, difficulty: cached.difficulty, question: cached.stem, code: cached.code || null, options, correct_answer: cached.correct, explanation: cached.feedback.explanation, source: "ai-generated-cached", quality: cached.quality };
      }

      // Generate new item
      if (!isGenerationEnabled()) {
        return { error: "no_match_generation_disabled", message: `No items found for "${objective}"`, objective, closest_topic: match.topic, needs_generation: true };
      }

      try {
        const generated = await generateItem(objective, difficulty, match.topic);
        await storeGeneratedItem(generated);
        const options: Record<string, string> = {};
        generated.options.forEach(opt => { options[opt.id] = opt.text; });
        return { user_id, item_id: generated.id, topic: generated.topic || objective, difficulty: generated.difficulty, question: generated.stem, code: generated.code || null, options, correct_answer: generated.correct, explanation: generated.feedback.explanation, source: "ai-generated", quality: generated.quality, model: generated.model };
      } catch (error) {
        return { error: "generation_failed", message: error instanceof Error ? error.message : "Failed to generate", objective };
      }
    }

    case "mcq_match_topic": {
      const { objective } = args as { objective: string };
      const match = matchTopic(objective, Array.from(allTopics));
      const hasItems = match.topic ? (itemsByTopic[match.topic]?.length ?? 0) > 0 : false;
      return { objective, matched_topic: match.topic, confidence: match.confidence, match_type: match.matchType, has_items: hasItems, will_use_item_bank: shouldUseItemBank(match) && hasItems, threshold: MATCH_THRESHOLD };
    }

    case "mcq_add_item": {
      const { objective, topic, difficulty, stem, code, options, correct, feedback, source } = args as {
        objective: string; topic?: string; difficulty: "easy" | "medium" | "hard";
        stem: string; code?: string; options: { id: string; text: string }[];
        correct: string; feedback: { correct: string; incorrect: string; explanation: string };
        source?: string;
      };
      const id = "ext-" + Math.random().toString(36).substring(2, 15);
      const normalized = objective.toLowerCase().trim().replace(/\s+/g, ' ');
      const { error } = await supabase.from("generated_items").insert({ id, objective, objective_normalized: normalized, topic: topic || null, difficulty, stem, code: code || null, options, correct, feedback, source: source || "external", quality: "unreviewed", use_count: 0 });
      if (error) return { success: false, error: error.message };
      return { success: true, item_id: id, objective, topic: topic || null };
    }

    case "mcq_record": {
      const { user_id, objective, selected_answer, correct_answer, item_id, session_id, latency_ms, difficulty } = args as {
        user_id: string; objective: string; selected_answer: string; correct_answer: string;
        item_id?: string; session_id?: string; latency_ms?: number; difficulty?: "easy" | "medium" | "hard";
      };
      const wasCorrect = selected_answer.toUpperCase() === correct_answer.toUpperCase();
      const timestamp = new Date().toISOString();

      const responseRecord = { user_id, objective, item_id: item_id || null, session_id: session_id || null, selected_answer: selected_answer.toUpperCase(), correct_answer: correct_answer.toUpperCase(), is_correct: wasCorrect, latency_ms: latency_ms || null, difficulty: difficulty || null, created_at: timestamp };
      const { error: responseError } = await supabase.from("responses").insert(responseRecord);
      if (responseError) console.error("Error logging response:", responseError);

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
    let transport: SSEServerTransport | null = null;

    const httpServer = createServer(async (req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      // Health check
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
          version: "0.3.0",
          status: "ok",
          database: dbStatus,
          generation_enabled: isGenerationEnabled(),
          endpoints: { health: "/", sse: "/sse", messages: "/messages", api: "/api/tools/call" },
          tools: ["mcq_list_topics", "mcq_generate", "mcq_match_topic", "mcq_add_item", "mcq_record", "mcq_get_status"],
          docs: "https://github.com/JDerekLomas/MCQMCP"
        }));
        return;
      }

      // REST API endpoint
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
        transport = new SSEServerTransport("/messages", res);
        await server.connect(transport);
      } else if (req.url === "/messages" && req.method === "POST") {
        if (transport) {
          let body = "";
          req.on("data", (chunk) => (body += chunk));
          req.on("end", async () => {
            try {
              await transport!.handlePostMessage(req, res, body);
            } catch {
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
      console.error(`MCQMCP server v0.3.0 running on http://localhost:${port}`);
      console.error(`Generation enabled: ${isGenerationEnabled()}`);
      console.error(`Item bank: ${itemBank.items.length} items across ${allTopics.size} topics`);
      console.error(`REST API: http://localhost:${port}/api/tools/call`);
      console.error(`Supabase: ${supabaseUrl}`);
    });
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCQMCP server v0.3.0 running on stdio");
    console.error(`Generation enabled: ${isGenerationEnabled()}`);
    console.error(`Item bank: ${itemBank.items.length} items`);
    console.error(`Supabase: ${supabaseUrl}`);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
