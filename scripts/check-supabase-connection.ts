import { config } from "dotenv";
config({ path: ".env.local" });

import { createSupabaseServerClient } from "../lib/supabase/server";

async function main() {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.getSession();

  if (error) {
    console.error("Supabase connection failed:", error.message);
    process.exit(1);
  }

  console.log("Supabase connection OK.");
}

main();
