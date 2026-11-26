"use client";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import type { Lang, T } from "@/lib/i18n";
import type { Standing } from "@/lib/types";

export function Leaderboard({ rows, afterQuestion, total, t, lang }: { rows: Standing[]; afterQuestion: number; total: number; t: T; lang: Lang }) {
  const max = Math.max(1, ...rows.map((r) => r.score));
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-6">
      <div className="text-center">
        <h1 className="text-[clamp(2rem,4vw,4rem)] font-black">{t("lb.title")}</h1>
        <p className="text-xl font-bold text-brand-200">{t("lb.after", { n: afterQuestion + 1, total })}</p>
      </div>
      <ol className="space-y-3">
        {rows.map((r, i) => (
          <motion.li
            key={r.playerId}
            layout
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 260, damping: 26 }}
            className="relative flex items-center gap-4 overflow-hidden rounded-2xl bg-white/15 px-5 py-3 ring-1 ring-white/25"
          >
            <motion.div
              className="absolute inset-y-0 left-0 bg-brand-600/60"
              initial={{ width: 0 }}
              animate={{ width: `${(r.score / max) * 100}%` }}
              transition={{ duration: 0.9, delay: 0.2 + i * 0.1 }}
            />
            <span className="relative w-10 text-center text-3xl font-black">{r.rank}</span>
            <Avatar avatar={r.avatar} size="md" className="relative" />
            <span className="relative flex-1 truncate text-[clamp(1.3rem,2.4vw,2.4rem)] font-extrabold">{r.name}</span>
            {r.change !== undefined && r.change !== 0 && (
              <span className={`relative text-xl font-black ${r.change > 0 ? "text-success" : "text-amber-300"}`} aria-label={r.change > 0 ? t("lb.up", { n: r.change }) : t("lb.down", { n: -r.change })}>
                {r.change > 0 ? "▲" : "▼"} {Math.abs(r.change)}
              </span>
            )}
            <span className="relative text-[clamp(1.4rem,2.6vw,2.6rem)] font-black tabular-nums">{r.score.toLocaleString(lang)}</span>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
