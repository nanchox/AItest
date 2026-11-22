import type { ButtonHTMLAttributes } from "react";

const VARIANTS = {
  primary: "bg-success text-white shadow-[0_4px_0_#0f7a31] hover:brightness-110 active:translate-y-[3px] active:shadow-[0_1px_0_#0f7a31]",
  secondary: "bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25",
  light: "bg-white text-brand-900 shadow-[0_4px_0_#c8a5ff] hover:brightness-95 active:translate-y-[3px] active:shadow-[0_1px_0_#c8a5ff]",
  danger: "bg-ans-red text-white hover:brightness-110",
} as const;

export function Button({
  variant = "primary", size = "md", className = "", ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANTS; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-5 py-3 text-base", lg: "px-8 py-4 text-xl" };
  return (
    <button
      {...props}
      className={`rounded-xl font-extrabold transition disabled:opacity-50 disabled:brightness-75 ${VARIANTS[variant]} ${sizes[size]} ${className}`}
    />
  );
}
