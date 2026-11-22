const BLOCKED = [
  "fuck", "shit", "bitch", "asshole", "dick", "cunt", "nazi", "rape",
  "puta", "puto", "mierda", "verga", "pendejo", "pendeja", "cabron", "chinga", "culero", "coño", "joder",
];

/** Returns a clean name, or an error message. */
export function validateName(raw: unknown): { ok: true; name: string } | { ok: false; error: string } {
  if (typeof raw !== "string") return { ok: false, error: "Please enter your name." };
  const name = raw.replace(/\s+/g, " ").trim();
  if (name.length < 1) return { ok: false, error: "Please enter your name." };
  if (name.length > 16) return { ok: false, error: "Name can have at most 16 characters." };
  const flat = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
  if (BLOCKED.some((w) => flat.includes(w))) return { ok: false, error: "Please choose a different name." };
  return { ok: true, name };
}
