import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database.types";
import { getSupabaseEnv } from "./config";

export function createClient() {
  const env = getSupabaseEnv();
  return createBrowserClient<Database>(env.url, env.key);
}
