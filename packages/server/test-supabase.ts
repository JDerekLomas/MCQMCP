import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://cxzwclvkkjvkromubzmp.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4endjbHZra2p2a3JvbXViem1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNTIxMzgsImV4cCI6MjA3OTcyODEzOH0.LzN3-4MjeCVFLzkZzhVLdkWBJR6Nq-_oxbdi4qOBZC8"
);

async function test() {
  console.log("Testing Supabase connection...");

  // Try to select from mastery table
  const { data, error } = await supabase.from("mastery").select("*").limit(1);

  if (error) {
    console.error("Error:", error.message);
    console.error("Code:", error.code);
    console.error("Details:", error.details);
  } else {
    console.log("Success! Data:", data);
  }

  // Try to insert a test record
  console.log("\nTrying to insert test record...");
  const { data: insertData, error: insertError } = await supabase
    .from("mastery")
    .upsert({
      user_id: "test_user",
      objective: "test_objective",
      correct: 1,
      total: 2
    }, { onConflict: "user_id,objective" })
    .select();

  if (insertError) {
    console.error("Insert Error:", insertError.message);
  } else {
    console.log("Insert Success:", insertData);
  }
}

test();
