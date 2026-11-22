"use client";
import { stylesFor } from "@/components/answers";
import type { HostState } from "@/lib/types";

export function QuestionStage({ state, remainingMs }: { state: HostState; remainingMs: number }) {
  const q = state.question!;
  const styles = stylesFor(q.type);
  const answering = state.phase === "answering";
  const reveal = state.phase === "reveal";
  const total = (state.distribution ?? []).reduce((a, b) => a + b, 0);
  const secs = Math.ceil(remainingMs / 1000);
  const pct = Math.max(0, Math.min(100, (remainingMs / state.timeLimitMs) * 100));

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex items-center gap-4">
        <span className="rounded-full bg-white/15 px-4 py-1 text-lg font-extrabold">Question {q.index + 1} of {q.total}</span>
        <span className="rounded-full bg-brand-200 px-4 py-1 text-lg font-extrabold text-brand-900">{q.level}</span>
        <span className="text-lg font-bold text-brand-200">{q.topic}</span>
        <div className="flex-1" />
        {answering && (
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-brand-200">{state.answered}/{state.playerCount} answered</span>
            <span
              className={`flex h-20 w-20 items-center justify-center rounded-full text-5xl font-black tabular-nums ring-4 ${secs <= 5 ? "animate-tick bg-ans-red ring-white" : "bg-white text-brand-900 ring-brand-200"}`}
              role="timer"
              aria-label={`${secs} seconds left`}
            >
              {secs}
            </span>
          </div>
        )}
      </div>

      {answering && (
        <div className="h-3 overflow-hidden rounded-full bg-white/20">
          <div className={`h-full rounded-full ${pct < 25 ? "bg-ans-red" : "bg-success"}`} style={{ width: `${pct}%`, transition: "width 120ms linear" }} />
        </div>
      )}

      <h1 className="rounded-3xl bg-white px-8 py-6 text-center text-[clamp(1.6rem,3vw,3.2rem)] font-black leading-tight text-brand-900 shadow-xl">
        {q.text}
      </h1>

      <div className={`grid flex-1 gap-4 ${q.type === "truefalse" ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2"}`}>
        {q.options.map((text, i) => {
          const s = styles[i];
          const isCorrect = reveal && state.correctIndex === i;
          const dim = reveal && !isCorrect;
          const count = state.distribution?.[i] ?? 0;
          const share = total ? Math.round((count / total) * 100) : 0;
          return (
            <div
              key={i}
              className={`relative flex min-h-24 items-center gap-5 overflow-hidden rounded-2xl px-6 py-4 shadow-[0_6px_0_rgba(0,0,0,0.3)] transition ${s.bg} ${s.text} ${dim ? "opacity-35" : ""} ${isCorrect ? "ring-8 ring-success" : ""}`}
            >
              <span className="text-5xl" aria-hidden>{s.shape}</span>
              <span className="flex-1 text-[clamp(1.2rem,2.2vw,2.4rem)] font-extrabold leading-tight">{text}</span>
              {isCorrect && <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success text-3xl text-white" aria-label="Correct answer">✓</span>}
              {reveal && (
                <span className="text-right">
                  <span className="block text-4xl font-black tabular-nums">{count}</span>
                  <span className="block text-base font-bold opacity-90">{share}%</span>
                </span>
              )}
              {reveal && <span className="absolute inset-x-0 bottom-0 h-2 bg-black/25"><span className="block h-full bg-white/80" style={{ width: `${share}%` }} /></span>}
            </div>
          );
        })}
      </div>

      {reveal && state.explanation && (
        <p className="animate-rise rounded-2xl bg-white/15 px-6 py-4 text-[clamp(1rem,1.7vw,1.7rem)] font-semibold leading-snug ring-1 ring-white/25">
          <span className="mr-2 font-black text-brand-200">Why?</span>
          {state.explanation}
        </p>
      )}
    </div>
  );
}
