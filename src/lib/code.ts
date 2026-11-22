import { randomBytes } from "node:crypto";

// No 0/O/1/I/L to avoid confusion when the code is read aloud or typed.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateCode(): string {
  const bytes = randomBytes(5);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
}

export function isValidCode(code: string): boolean {
  return /^[A-Z0-9]{5}$/.test(code);
}

export function generateToken(): string {
  return randomBytes(18).toString("base64url");
}
