import "server-only";

/**
 * Tells every client in a game "something changed, refetch". Uses Supabase
 * Broadcast over HTTP, so no table access is exposed to the browser. Failures are
 * harmless: clients also poll as a fallback.
 */
export async function notifyGame(code: string): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 1500);
  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ topic: `game:${code}`, event: "changed", payload: {}, private: false }] }),
      signal: ctrl.signal,
    });
  } catch {
    /* polling fallback covers it */
  } finally {
    clearTimeout(timer);
  }
}
