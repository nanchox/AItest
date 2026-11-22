import { avatarEmoji } from "@/lib/avatars";

const SIZES = {
  sm: "h-10 w-10 text-2xl",
  md: "h-14 w-14 text-3xl",
  lg: "h-24 w-24 text-6xl",
  xl: "h-32 w-32 text-7xl",
} as const;

export function Avatar({ avatar, size = "md", className = "" }: { avatar: string; size?: keyof typeof SIZES; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-200 to-white/90 shadow-lg shadow-black/20 ring-2 ring-white/40 ${SIZES[size]} ${className}`}
    >
      {avatarEmoji(avatar)}
    </span>
  );
}
