import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function testPersistence() {
  console.log("=== Testing Persistence ===\n");

  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/index.js"],
  });

  const client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(transport);

  // Check if previous data persisted
  console.log("Checking for persisted data from previous run...");
  const statusResult = await client.callTool({
    name: "mcq_get_status",
    arguments: { user_id: "user123" },
  });
  console.log(statusResult.content[0].text);

  // Add more data
  console.log("\nAdding one more response...");
  const recordResult = await client.callTool({
    name: "mcq_record",
    arguments: {
      user_id: "user123",
      objective: "Understanding TypeScript generics",
      selected_answer: "C",
      correct_answer: "C",
    },
  });
  console.log(recordResult.content[0].text);

  await client.close();
  console.log("\n=== Persistence test complete ===");
}

testPersistence().catch(console.error);
