const BLOCKED = [
  "fuck", "shit", "bitch", "asshole", "dick", "cunt", "nazi", "rape",
  "puta", "puto", "mierda", "verga", "pendejo", "pendeja", "cabron", "chinga", "culero", "coño", "joder",
];

/** Returns a clean name, or an error code (see the "err.*" keys in i18n). */
export function validateName(raw: unknown): { ok: true; name: string } | { ok: false; code: string } {
  if (typeof raw !== "string") return { ok: false, code: "name_required" };
  const name = raw.replace(/\s+/g, " ").trim();
  if (name.length < 1) return { ok: false, code: "name_required" };
  if (name.length > 16) return { ok: false, code: "name_long" };
  const flat = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
  if (BLOCKED.some((w) => flat.includes(w))) return { ok: false, code: "name_blocked" };
  return { ok: true, name };
}
