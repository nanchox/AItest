"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BaseState } from "./types";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T = unknown>(url: string, opts: { method?: string; body?: unknown; headers?: Record<string, string> } = {}): Promise<T> {
  const res = await fetch(url, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers: { ...(opts.body ? { "Content-Type": "application/json" } : {}), ...opts.headers },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? "Request failed.");
  return data as T;
}

let browserClient: SupabaseClient | null | undefined;
function realtimeClient(): SupabaseClient | null {
  if (browserClient !== undefined) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  browserClient = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return browserClient;
}

interface Options<T> {
  url: string | null;
  headers?: Record<string, string>;
  /** Polling interval in ms. `live` = the realtime channel is connected. */
  interval: (s: T | null, live: boolean) => number;
}

/**
 * Keeps a game view fresh: refetches when the server broadcasts a change (Supabase
 * Realtime) and polls as a safety net, so the game still works if WebSockets are blocked.
 */
export function useGameState<T extends BaseState>(code: string, { url, headers, interval }: Options<T>) {
  // Results are tagged with the URL they came from, so a change of URL (e.g. after joining)
  // never exposes the previous URL's data for a render.
  const [stored, setStored] = useState<{ url: string | null; state: T | null; error: ApiError | null }>({ url, state: null, error: null });
  const state = stored.url === url ? stored.state : null;
  const error = stored.url === url ? stored.error : null;
  const setState = useCallback((s: T | null) => setStored({ url, state: s, error: null }), [url]);
  const offset = useRef(0); // serverNow - clientNow
  const live = useRef(false);
  const busy = useRef(false);
  const stateRef = useRef<T | null>(null);
  const headersRef = useRef(headers);
  const intervalRef = useRef(interval);
  headersRef.current = headers;
  intervalRef.current = interval;

  const refresh = useCallback(async () => {
    if (!url || busy.current) return;
    busy.current = true;
    try {
      const s = await api<T>(url, { headers: headersRef.current });
      offset.current = s.serverNow - Date.now();
      stateRef.current = s;
      setStored({ url, state: s, error: null });
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError(0, "Connection problem. Retrying…");
      setStored((prev) => ({ url, state: prev.url === url ? prev.state : null, error: err }));
    } finally {
      busy.current = false;
    }
  }, [url]);

  useEffect(() => {
    stateRef.current = null;
    if (!url) return;
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const loop = async () => {
      await refresh();
      if (!stop) timer = setTimeout(loop, intervalRef.current(stateRef.current, live.current));
    };
    loop();
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", refresh);
    return () => {
      stop = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", refresh);
    };
  }, [url, refresh]);

  useEffect(() => {
    const sb = realtimeClient();
    if (!sb || !url) return;
    const channel = sb
      .channel(`game:${code}`)
      .on("broadcast", { event: "changed" }, () => refresh())
      .subscribe((status) => {
        live.current = status === "SUBSCRIBED";
        if (status === "SUBSCRIBED") refresh();
      });
    return () => {
      live.current = false;
      sb.removeChannel(channel);
    };
  }, [code, url, refresh]);

  return { state, error, refresh, offset, setState };
}

/** Server-synchronised clock that ticks while `active`. */
export function useServerNow(offset: React.RefObject<number>, active: boolean, everyMs = 100) {
  const [now, setNow] = useState(() => Date.now() + (offset.current ?? 0));
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now() + (offset.current ?? 0)), everyMs);
    setNow(Date.now() + (offset.current ?? 0));
    return () => clearInterval(t);
  }, [active, offset, everyMs]);
  return now;
}
