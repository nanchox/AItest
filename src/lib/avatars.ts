export const AVATARS = [
  { key: "fox", emoji: "🦊", label: "Fox" },
  { key: "panda", emoji: "🐼", label: "Panda" },
  { key: "lion", emoji: "🦁", label: "Lion" },
  { key: "tiger", emoji: "🐯", label: "Tiger" },
  { key: "koala", emoji: "🐨", label: "Koala" },
  { key: "frog", emoji: "🐸", label: "Frog" },
  { key: "monkey", emoji: "🐵", label: "Monkey" },
  { key: "owl", emoji: "🦉", label: "Owl" },
  { key: "penguin", emoji: "🐧", label: "Penguin" },
  { key: "octopus", emoji: "🐙", label: "Octopus" },
  { key: "unicorn", emoji: "🦄", label: "Unicorn" },
  { key: "turtle", emoji: "🐢", label: "Turtle" },
  { key: "dolphin", emoji: "🐬", label: "Dolphin" },
  { key: "giraffe", emoji: "🦒", label: "Giraffe" },
  { key: "bee", emoji: "🐝", label: "Bee" },
  { key: "trex", emoji: "🦖", label: "T-Rex" },
] as const;

export type AvatarKey = (typeof AVATARS)[number]["key"];

export const AVATAR_KEYS = AVATARS.map((a) => a.key) as string[];

export function avatarEmoji(key: string): string {
  return AVATARS.find((a) => a.key === key)?.emoji ?? "🙂";
}
