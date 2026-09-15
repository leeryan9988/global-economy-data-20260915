import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Read-only public data access. Creating the app never triggers a database call. */
export function createReadOnlyDatabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("数据库尚未配置：需要 SUPABASE_URL 和 SUPABASE_PUBLISHABLE_KEY。");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
