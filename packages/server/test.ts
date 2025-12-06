import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function test() {
  console.log("Starting MCP client test...\n");

  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/index.js"],
  });

  const client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(transport);

  // List available tools
  console.log("=== Available Tools ===");
  const tools = await client.listTools();
  tools.tools.forEach((t) => console.log(`- ${t.name}: ${t.description}`));
  console.log();

  // Test 1: Generate an MCQ
  console.log("=== Test 1: mcq_generate ===");
  const genResult = await client.callTool({
    name: "mcq_generate",
    arguments: {
      user_id: "user123",
      objective: "Understanding TypeScript generics",
      difficulty: "medium",
    },
  });
  console.log(genResult.content[0].text);
  console.log();

  // Test 2: Record a correct answer
  console.log("=== Test 2: mcq_record (correct answer) ===");
  const recordResult1 = await client.callTool({
    name: "mcq_record",
    arguments: {
      user_id: "user123",
      objective: "Understanding TypeScript generics",
      selected_answer: "C",
      correct_answer: "C",
    },
  });
  console.log(recordResult1.content[0].text);
  console.log();

  // Test 3: Record an incorrect answer
  console.log("=== Test 3: mcq_record (incorrect answer) ===");
  const recordResult2 = await client.callTool({
    name: "mcq_record",
    arguments: {
      user_id: "user123",
      objective: "Understanding TypeScript generics",
      selected_answer: "A",
      correct_answer: "C",
    },
  });
  console.log(recordResult2.content[0].text);
  console.log();

  // Test 4: Record another objective
  console.log("=== Test 4: mcq_record (different objective) ===");
  const recordResult3 = await client.callTool({
    name: "mcq_record",
    arguments: {
      user_id: "user123",
      objective: "React hooks basics",
      selected_answer: "B",
      correct_answer: "B",
    },
  });
  console.log(recordResult3.content[0].text);
  console.log();

  // Test 5: Get status for specific objective
  console.log("=== Test 5: mcq_get_status (specific objective) ===");
  const statusResult1 = await client.callTool({
    name: "mcq_get_status",
    arguments: {
      user_id: "user123",
      objective: "Understanding TypeScript generics",
    },
  });
  console.log(statusResult1.content[0].text);
  console.log();

  // Test 6: Get status for all objectives
  console.log("=== Test 6: mcq_get_status (all objectives) ===");
  const statusResult2 = await client.callTool({
    name: "mcq_get_status",
    arguments: {
      user_id: "user123",
    },
  });
  console.log(statusResult2.content[0].text);
  console.log();

  // Test 7: Get status for user with no data
  console.log("=== Test 7: mcq_get_status (new user) ===");
  const statusResult3 = await client.callTool({
    name: "mcq_get_status",
    arguments: {
      user_id: "newuser",
    },
  });
  console.log(statusResult3.content[0].text);

  await client.close();
  console.log("\n=== All tests completed! ===");
}

test().catch(console.error);
