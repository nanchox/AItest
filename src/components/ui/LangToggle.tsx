"use client";
import type { Lang } from "@/lib/i18n";

const OPTIONS: { lang: Lang; label: string; full: string }[] = [
  { lang: "en", label: "EN", full: "English" },
  { lang: "es", label: "ES", full: "Español" },
];

export function LangToggle({ lang, onChange, className = "" }: { lang: Lang; onChange: (l: Lang) => void; className?: string }) {
  return (
    <div role="group" aria-label="Language / Idioma" className={`inline-flex overflow-hidden rounded-full bg-white/15 ring-1 ring-white/30 ${className}`}>
      {OPTIONS.map((o) => (
        <button
          key={o.lang}
          type="button"
          onClick={() => onChange(o.lang)}
          aria-pressed={lang === o.lang}
          title={o.full}
          className={`px-3 py-1 text-sm font-extrabold transition ${lang === o.lang ? "bg-white text-brand-900" : "text-white hover:bg-white/20"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
