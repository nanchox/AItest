"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { api, ApiError, useGameState, useServerNow } from "@/lib/client";
import { LEADERBOARD_EVERY } from "@/lib/scoring";
import type { HostState } from "@/lib/types";
import { Leaderboard } from "./Leaderboard";
import { Lobby } from "./Lobby";
import { FullRanking, Podium, PodiumActions, TeamSnapshot } from "./Podium";
import { QuestionStage } from "./QuestionStage";
import { RestartDialog } from "./RestartDialog";

type Action = "start" | "open" | "reveal" | "next";

/** Wait this long past the timer before auto-revealing, to let late answers land. */
const REVEAL_DELAY_MS = 800;

function primaryFor(s: HostState): { action: Action; label: string; disabled?: boolean } | null {
  switch (s.phase) {
    case "lobby": return { action: "start", label: "Start game ▶", disabled: s.players.length === 0 };
    case "question": return { action: "open", label: "Open answers ▶" };
    case "answering": return { action: "reveal", label: "Skip timer ⏭" };
    case "reveal":
      if (s.qIndex >= s.total - 1) return { action: "next", label: "Show podium 🏆" };
      if ((s.qIndex + 1) % LEADERBOARD_EVERY === 0) return { action: "next", label: "Show leaderboard 📊" };
      return { action: "next", label: "Next question ▶" };
    case "leaderboard": return { action: "next", label: "Next question ▶" };
    default: return null;
  }
}

export function HostApp({ code }: { code: string }) {
  const router = useRouter();
  const { state, error, refresh, offset, setState } = useGameState<HostState>(code, {
    url: `/api/host/games/${code}/state`,
    interval: (s, live) => (s?.phase === "answering" ? 1000 : live ? 3000 : 1500),
  });
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [restart, setRestart] = useState(false);
  const [view, setView] = useState<"podium" | "ranking" | "snapshot">("podium");
  const busyRef = useRef(false);
  const autoFired = useRef("");

  const answering = state?.phase === "answering";
  const now = useServerNow(offset, Boolean(answering), 100);
  const remaining = answering && state?.endsAt ? Math.max(0, state.endsAt - now) : 0;

  useEffect(() => {
    if (error?.status === 401) router.replace("/host");
  }, [error, router]);

  // Leaving the podium (restart) should reset the sub-view.
  useEffect(() => {
    if (state?.phase !== "podium") setView("podium");
  }, [state?.phase]);

  const act = useCallback(
    async (action: Action) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setActionError("");
      try {
        setState(await api<HostState>(`/api/host/games/${code}/advance`, { body: { action } }));
      } catch (e) {
        setActionError(e instanceof ApiError ? e.message : "Connection problem.");
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [code, setState],
  );

  // Reveal automatically when the time is up or everyone has answered.
  useEffect(() => {
    if (!state || state.phase !== "answering" || !state.endsAt) return;
    const key = `${state.round}-${state.qIndex}`;
    if (autoFired.current === key) return;
    const everyoneAnswered = state.playerCount > 0 && state.answered >= state.playerCount;
    const timeUp = now >= state.endsAt + REVEAL_DELAY_MS;
    if (everyoneAnswered || timeUp) {
      autoFired.current = key;
      act("reveal");
    }
  }, [state, now, act]);

  const primary = state ? primaryFor(state) : null;
  const primaryRef = useRef(primary);
  primaryRef.current = primary;

  // Keyboard: Space = next step, F = fullscreen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if (e.code === "Space") {
        e.preventDefault();
        const p = primaryRef.current;
        if (p && !p.disabled) act(p.action);
      } else if (e.key.toLowerCase() === "f") {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen?.().catch(() => {});
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [act]);

  const title = useMemo(() => state?.title ?? "", [state?.title]);

  if (error?.status === 404) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-3xl font-black">Game not found</h1>
        <a href="/host" className="rounded-xl bg-white px-6 py-3 font-extrabold text-brand-900">Back to sessions</a>
      </main>
    );
  }
  if (!state) return <main className="flex min-h-dvh items-center justify-center text-2xl font-bold text-brand-200">Loading…</main>;

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1600px] flex-col gap-5 p-5 lg:p-8">
      <header className="flex items-center gap-4">
        <a href="/host" aria-label="All sessions" className="text-left"><Brand small /></a>
        <div className="flex-1 text-center text-lg font-bold text-brand-200">{title}{title && state.round > 1 ? ` · Round ${state.round}` : state.round > 1 ? `Round ${state.round}` : ""}</div>
        {state.phase !== "lobby" && <span className="rounded-full bg-white/15 px-4 py-1 font-bold">{state.playerCount} players</span>}
        <span className="rounded-xl bg-white px-4 py-1 text-2xl font-black tracking-[0.2em] text-brand-900" aria-label={`Game code ${state.code.split("").join(" ")}`}>
          {state.code}
        </span>
      </header>

      {error && error.status !== 401 && (
        <div role="status" className="rounded-xl bg-amber-300 px-4 py-2 text-center font-bold text-brand-950">Connection problem. Retrying…</div>
      )}

      <main className="flex flex-1 flex-col">
        {state.phase === "lobby" && <Lobby state={state} onChanged={refresh} />}
        {(state.phase === "question" || state.phase === "answering" || state.phase === "reveal") && state.question && (
          <QuestionStage state={state} remainingMs={remaining} />
        )}
        {state.phase === "leaderboard" && (
          <Leaderboard rows={state.leaderboard ?? []} afterQuestion={state.qIndex} total={state.total} />
        )}
        {state.phase === "podium" && (
          <div className="flex flex-1 flex-col gap-5">
            {view === "podium" && <Podium standings={state.standings ?? []} />}
            {view === "ranking" && <FullRanking standings={state.standings ?? []} />}
            {view === "snapshot" && state.snapshot && <TeamSnapshot snap={state.snapshot} />}
          </div>
        )}
      </main>

      <footer className="flex flex-wrap items-center justify-center gap-4">
        {actionError && <p role="alert" className="font-bold text-amber-300">{actionError}</p>}
        {primary && (
          <Button size="lg" onClick={(e) => { e.currentTarget.blur(); act(primary.action); }} disabled={busy || primary.disabled}>
            {primary.label}
          </Button>
        )}
        {primary && <span className="hidden text-sm text-brand-200 lg:inline">Press <kbd className="rounded bg-white/20 px-2 py-0.5 font-bold">Space</kbd></span>}
        {state.phase === "podium" && (
          <PodiumActions state={state} view={view} setView={setView} onRestart={() => setRestart(true)} />
        )}
        {state.phase !== "podium" && state.phase !== "lobby" && (
          <Button variant="secondary" size="sm" onClick={() => setRestart(true)}>Restart</Button>
        )}
        <Button variant="secondary" size="sm" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())}>
          Fullscreen (F)
        </Button>
      </footer>

      {restart && (
        <RestartDialog
          code={code}
          onClose={() => setRestart(false)}
          onDone={() => { setRestart(false); autoFired.current = ""; refresh(); }}
        />
      )}
    </div>
  );
}
