import "server-only";
import { NextResponse } from "next/server";
import { isHostRequest } from "./auth";
import { HttpError } from "./game";

export const noStore = { "Cache-Control": "no-store" };

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: noStore });
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? (b as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Wraps a handler: converts HttpError to JSON and hides unexpected errors. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message, code: e.code }, e.status);
      console.error(e);
      return json({ error: "Something went wrong. Please try again.", code: "server" }, 500);
    }
  };
}

export function requireHost(req: Request) {
  if (!isHostRequest(req)) throw new HttpError(401, "host_required");
}

export type Ctx = { params: Promise<{ code: string }> };
