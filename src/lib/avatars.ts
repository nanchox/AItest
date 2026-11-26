export const AVATARS = [
  { key: "fox", emoji: "🦊", label: "Fox", labelEs: "Zorro" },
  { key: "panda", emoji: "🐼", label: "Panda", labelEs: "Panda" },
  { key: "lion", emoji: "🦁", label: "Lion", labelEs: "León" },
  { key: "tiger", emoji: "🐯", label: "Tiger", labelEs: "Tigre" },
  { key: "koala", emoji: "🐨", label: "Koala", labelEs: "Koala" },
  { key: "frog", emoji: "🐸", label: "Frog", labelEs: "Rana" },
  { key: "monkey", emoji: "🐵", label: "Monkey", labelEs: "Mono" },
  { key: "owl", emoji: "🦉", label: "Owl", labelEs: "Búho" },
  { key: "penguin", emoji: "🐧", label: "Penguin", labelEs: "Pingüino" },
  { key: "octopus", emoji: "🐙", label: "Octopus", labelEs: "Pulpo" },
  { key: "unicorn", emoji: "🦄", label: "Unicorn", labelEs: "Unicornio" },
  { key: "turtle", emoji: "🐢", label: "Turtle", labelEs: "Tortuga" },
  { key: "dolphin", emoji: "🐬", label: "Dolphin", labelEs: "Delfín" },
  { key: "giraffe", emoji: "🦒", label: "Giraffe", labelEs: "Jirafa" },
  { key: "bee", emoji: "🐝", label: "Bee", labelEs: "Abeja" },
  { key: "trex", emoji: "🦖", label: "T-Rex", labelEs: "T-Rex" },
] as const;

export type AvatarKey = (typeof AVATARS)[number]["key"];

export const AVATAR_KEYS = AVATARS.map((a) => a.key) as string[];

export function avatarEmoji(key: string): string {
  return AVATARS.find((a) => a.key === key)?.emoji ?? "🙂";
}
