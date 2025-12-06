// Test script for remote MCP server
// Run: npx tsx test-remote.ts

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const MCP_URL = "https://mcqmcp.onrender.com/sse";

async function test() {
  console.log("Connecting to:", MCP_URL);

  const transport = new SSEClientTransport(new URL(MCP_URL));
  const client = new Client({ name: "test-client", version: "1.0.0" });

  await client.connect(transport);
  console.log("✓ Connected!\n");

  // List tools
  console.log("=== Available Tools ===");
  const tools = await client.listTools();
  tools.tools.forEach((t) => console.log(`- ${t.name}`));
  console.log();

  // Test 1: Generate MCQ
  console.log("=== Test: mcq_generate ===");
  const genResult = await client.callTool({
    name: "mcq_generate",
    arguments: {
      user_id: "test_user_123",
      objective: "Understanding async/await in JavaScript",
      difficulty: "medium",
    },
  });
  console.log(genResult.content[0].text);
  console.log();

  // Test 2: Record answer
  console.log("=== Test: mcq_record ===");
  const recordResult = await client.callTool({
    name: "mcq_record",
    arguments: {
      user_id: "test_user_123",
      objective: "Understanding async/await in JavaScript",
      selected_answer: "C",
      correct_answer: "C",
    },
  });
  console.log(recordResult.content[0].text);
  console.log();

  // Test 3: Get status
  console.log("=== Test: mcq_get_status ===");
  const statusResult = await client.callTool({
    name: "mcq_get_status",
    arguments: {
      user_id: "test_user_123",
    },
  });
  console.log(statusResult.content[0].text);

  await client.close();
  console.log("\n✓ All tests passed!");
}

test().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
