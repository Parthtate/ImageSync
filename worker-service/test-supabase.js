// Simple script to verify Supabase client (storage buckets list)
import "dotenv/config";
import { supabase } from "./config/supabase.js";

async function run() {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error("Supabase storage error:", error.message || error);
      process.exit(1);
    }
    console.log("Buckets:", data);
    process.exit(0);
  } catch (err) {
    console.error("Unexpected error:", err.message || err);
    process.exit(2);
  }
}

run();
