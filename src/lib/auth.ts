import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export const HOST_COOKIE = "quiz_host";
const MAX_AGE_S = 60 * 60 * 12;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV !== "production") return "dev-secret-change-me";
  throw new Error("SESSION_SECRET is not set.");
}
function adminPassword(): string {
  const p = process.env.ADMIN_PASSWORD;
  if (p) return p;
  if (process.env.NODE_ENV !== "production") return "admin";
  throw new Error("ADMIN_PASSWORD is not set.");
}
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("base64url");

function safeEqual(a: string, b: string): boolean {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkPassword(input: unknown): boolean {
  return typeof input === "string" && safeEqual(input, adminPassword());
}

export function makeSessionCookie(): { name: string; value: string; maxAge: number } {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_S;
  const payload = String(exp);
  return { name: HOST_COOKIE, value: `${payload}.${sign(payload)}`, maxAge: MAX_AGE_S };
}

export function isHostRequest(req: Request): boolean {
  const raw = req.headers.get("cookie") ?? "";
  const m = raw.split(/;\s*/).find((c) => c.startsWith(HOST_COOKIE + "="));
  if (!m) return false;
  const value = decodeURIComponent(m.slice(HOST_COOKIE.length + 1));
  const [payload, sig] = value.split(".");
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return false;
  return Number(payload) > Date.now() / 1000;
}
