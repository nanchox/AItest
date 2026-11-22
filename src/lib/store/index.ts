import "server-only";
import { memoryStore } from "./memory";
import { supabaseStore } from "./supabase";
import type { Store } from "./types";

const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const allowMemory = process.env.NODE_ENV !== "production" || process.env.USE_MEMORY_STORE === "1";

export function getStore(): Store {
  if (hasSupabase) return supabaseStore;
  if (allowMemory) return memoryStore;
  throw new Error("Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
}
