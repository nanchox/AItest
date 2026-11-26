"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Brand } from "@/components/ui/Brand";
import { stylesFor } from "@/components/answers";
import { api, ApiError, useDocumentLang, useGameState, useServerNow, useUiLang } from "@/lib/client";
import { makeT, ordinal, type Lang, type T } from "@/lib/i18n";
import type { PlayerState } from "@/lib/types";
import { JoinForm, type Session } from "./JoinForm";

const storageKey = (code: string) => `aiquiz:${code}`;

function loadSession(code: string): Session | null {
  try {
    const raw = localStorage.getItem(storageKey(code));
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function PlayerApp({ code }: { code: string }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = not read yet
  const [removed, setRemoved] = useState(false);
  const [uiLang] = useUiLang();

  useEffect(() => setSession(loadSession(code)), [code]);

  const url = session === undefined ? null : `/api/game/${code}/state${session ? `?playerId=${session.playerId}` : ""}`;
  const headers = useMemo(() => (session ? { "x-player-token": session.token } : undefined), [session]);
  const { state, error, refresh, offset } = useGameState<PlayerState>(code, {
    url, headers, interval: (_s, live) => (live ? 3000 : 1500),
  });

  // The host chooses the language; until we know the game, follow the browser.
  const lang: Lang = state?.lang ?? uiLang;
  const t = useMemo(() => makeT(lang), [lang]);
  useDocumentLang(lang);

  // Credentials no longer valid (kicked, or the host cleared the lobby).
  useEffect(() => {
    if (session && state && !state.me && !error) {
      localStorage.removeItem(storageKey(code));
      setSession(null);
      setRemoved(true);
    }
  }, [session, state, error, code]);

  // Keep the screen awake while playing.
  useEffect(() => {
    if (!session || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const acquire = () => navigator.wakeLock.request("screen").then((l) => (lock = l)).catch(() => {});
    acquire();
    const onVis = () => document.visibilityState === "visible" && acquire();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      lock?.release().catch(() => {});
    };
  }, [session]);

  if (session === undefined || (!state && !error)) return <Screen><Pulse>{t("loading")}</Pulse></Screen>;

  if (error?.status === 404) {
    return (
      <Screen>
        <div className="text-6xl">🤔</div>
        <h1 className="text-2xl font-black">{t("p.notFound")}</h1>
        <p className="text-brand-200">{t("p.notFoundHint")}</p>
        <Link href="/" className="rounded-xl bg-white px-6 py-3 font-extrabold text-brand-900">{t("p.back")}</Link>
      </Screen>
    );
  }

  if (!session || !state?.me) {
    if (state && !state.joinOpen) {
      return (
        <Screen>
          <div className="text-6xl">🚧</div>
          <h1 className="text-2xl font-black">{t("p.started")}</h1>
          <p className="text-brand-200">{t("p.startedHint")}</p>
        </Screen>
      );
    }
    return (
      <JoinForm
        code={code}
        lang={lang}
        notice={removed ? t("p.removed") : undefined}
        onJoined={(s) => {
          localStorage.setItem(storageKey(code), JSON.stringify(s));
          setRemoved(false);
          setSession(s);
        }}
      />
    );
  }

  return (
    <>
      {error && error.status !== 404 && (
        <div role="status" className="fixed inset-x-0 top-0 z-50 bg-amber-300 py-1 text-center text-sm font-bold text-brand-950">
          {t("p.reconnecting")}
        </div>
      )}
      <PlayerGame code={code} session={session} state={state} offset={offset} refresh={refresh} lang={lang} t={t} />
    </>
  );
}

/* ------------------------------------------------------------------ game screens */

function Screen({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 py-8 text-center">{children}</main>;
}
function Pulse({ children }: { children: React.ReactNode }) {
  return <p className="animate-tick text-xl font-bold text-brand-200">{children}</p>;
}

function Identity({ state }: { state: PlayerState }) {
  const me = state.me!;
  return (
    <div className="flex items-center justify-center gap-3">
      <Avatar avatar={me.avatar} size="sm" />
      <span className="text-lg font-extrabold">{me.name}</span>
    </div>
  );
}

interface GameProps {
  code: string; session: Session; state: PlayerState; offset: React.RefObject<number>; refresh: () => void; lang: Lang; t: T;
}

function PlayerGame({ code, session, state, offset, refresh, lang, t }: GameProps) {
  const me = state.me!;
  const levelLabel = state.question?.level === "Bonus" ? t("p.bonus") : state.question ? t(`level.${state.question.level}`) : "";
  switch (state.phase) {
    case "lobby":
      return (
        <Screen>
          <Avatar avatar={me.avatar} size="xl" className="animate-pop" />
          <h1 className="text-3xl font-black">{t("p.inLobby", { name: me.name })}</h1>
          <Pulse>{t("p.waitStart")}</Pulse>
          <p className="rounded-full bg-white/15 px-4 py-1 text-sm font-bold">{t("p.players", { n: state.playerCount })}</p>
        </Screen>
      );
    case "question":
      return (
        <Screen>
          <Identity state={state} />
          <p className="text-sm font-bold uppercase tracking-widest text-brand-200">{t("p.qOf", { n: state.qIndex + 1, total: state.total })}</p>
          <p className="rounded-full bg-white/15 px-4 py-1 text-sm font-bold">{levelLabel}</p>
          <h1 className="text-4xl font-black">{t("p.getReady")}</h1>
          <Pulse>{t("p.lookMain")}</Pulse>
        </Screen>
      );
    case "answering":
      return <Answering code={code} session={session} state={state} offset={offset} refresh={refresh} t={t} lang={lang} />;
    case "reveal":
      return <Reveal state={state} t={t} lang={lang} />;
    case "leaderboard":
      return (
        <Screen>
          <Identity state={state} />
          <p className="text-sm font-bold uppercase tracking-widest text-brand-200">{t("p.leaderboard")}</p>
          <div className="animate-pop text-7xl font-black">{me.rank ? ordinal(lang, me.rank) : "–"}</div>
          <p className="text-2xl font-extrabold">{t("p.pts", { n: (me.score ?? 0).toLocaleString(lang) })}</p>
          {state.gap && <p className="font-semibold text-brand-200">{t("p.behind", { n: state.gap.points.toLocaleString(lang), name: state.gap.name })}</p>}
          <Pulse>{t("p.watch")}</Pulse>
        </Screen>
      );
    case "podium":
      return <Final state={state} t={t} lang={lang} />;
  }
}

function Answering({ code, session, state, offset, refresh, t }: GameProps) {
  const q = state.question!;
  const now = useServerNow(offset, true, 100);
  const [local, setLocal] = useState<{ q: number; choice: number } | null>(null);
  const [problem, setProblem] = useState("");
  const choice = state.myChoice ?? (local?.q === state.qIndex ? local.choice : null);
  const remaining = Math.max(0, (state.endsAt ?? 0) - now);
  const over = remaining <= 0;
  const styles = stylesFor(q.type);

  const pick = useCallback(
    async (i: number) => {
      if (choice !== null || over) return;
      setLocal({ q: state.qIndex, choice: i });
      setProblem("");
      try {
        await api("/api/answer", {
          body: { code, playerId: session.playerId, questionIndex: state.qIndex, choice: i },
          headers: { "x-player-token": session.token },
        });
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) {
          refresh(); // too late or already answered: show the server's truth
        } else {
          setLocal(null);
          setProblem(t("p.sendFail"));
        }
      }
    },
    [choice, over, state.qIndex, code, session, refresh, t],
  );

  if (choice !== null) {
    const s = styles[choice];
    return (
      <Screen>
        <div className={`flex h-32 w-32 animate-pop items-center justify-center rounded-3xl text-7xl ${s.bg} ${s.text}`} aria-hidden>{s.shape}</div>
        <h1 className="text-3xl font-black">{t("p.locked")}</h1>
        <Pulse>{t("p.waitOthers")}</Pulse>
        <Countdown remaining={remaining} limit={state.timeLimitMs} t={t} />
      </Screen>
    );
  }
  if (over) {
    return (
      <Screen>
        <div className="text-6xl">⏰</div>
        <h1 className="text-3xl font-black">{t("p.timeUp")}</h1>
        <Pulse>{t("p.seeAnswer")}</Pulse>
      </Screen>
    );
  }
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-3 p-3">
      <Countdown remaining={remaining} limit={state.timeLimitMs} t={t} />
      <div className={`grid flex-1 gap-3 ${q.type === "truefalse" ? "grid-cols-1" : "grid-cols-2"}`}>
        {(q.options ?? []).map((text, i) => {
          const s = styles[i];
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              className={`flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl p-3 text-center font-extrabold shadow-[0_5px_0_rgba(0,0,0,0.3)] transition active:translate-y-1 active:shadow-none ${s.bg} ${s.text} ${q.type === "truefalse" ? "text-3xl" : "text-lg leading-tight"}`}
            >
              <span className="text-4xl" aria-hidden>{s.shape}</span>
              <span className="break-words">{text}</span>
            </button>
          );
        })}
      </div>
      {problem && <p role="alert" className="text-center font-bold text-amber-300">{problem}</p>}
    </main>
  );
}

function Countdown({ remaining, limit, t }: { remaining: number; limit: number; t: T }) {
  const pct = Math.max(0, Math.min(100, (remaining / limit) * 100));
  const secs = Math.ceil(remaining / 1000);
  return (
    <div className="w-full">
      <div className="mb-1 text-center text-3xl font-black tabular-nums" aria-label={t("p.secsLeft", { n: secs })}>{secs}</div>
      <div className="h-3 overflow-hidden rounded-full bg-white/20">
        <div className={`h-full rounded-full ${pct < 25 ? "bg-ans-red" : "bg-success"}`} style={{ width: `${pct}%`, transition: "width 120ms linear" }} />
      </div>
    </div>
  );
}

function Reveal({ state, t, lang }: { state: PlayerState; t: T; lang: Lang }) {
  const r = state.result;
  const me = state.me!;
  if (!r) return <Screen><Pulse>{t("p.loadResult")}</Pulse></Screen>;
  const answered = r.myChoice !== null;
  const styles = stylesFor(state.question!.type);
  const cs = styles[r.correctIndex];
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-5 py-8 text-center">
      <div className={`animate-pop rounded-3xl px-8 py-6 ${r.isCorrect ? "bg-success" : "bg-ans-red"}`}>
        <div className="text-6xl" aria-hidden>{r.isCorrect ? "✅" : answered ? "❌" : "⏰"}</div>
        <h1 className="text-3xl font-black">{r.isCorrect ? t("p.correct") : answered ? t("p.notQuite") : t("p.noAnswer")}</h1>
        {r.isCorrect && <p className="text-4xl font-black tabular-nums">+{r.points.toLocaleString(lang)}</p>}
      </div>
      {r.streak >= 2 && <p className="font-extrabold text-amber-300">{t("p.streak", { n: r.streak })}</p>}
      {!r.isCorrect && (
        <p className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold">
          {t("p.correctAnswer")}{" "}
          <span className={`ml-1 inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-extrabold ${cs.bg} ${cs.text}`}>
            <span aria-hidden>{cs.shape}</span> {r.options[r.correctIndex]}
          </span>
        </p>
      )}
      <p className="text-sm leading-relaxed text-brand-200">{r.explanation}</p>
      <div className="mt-2 flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-3">
        <Avatar avatar={me.avatar} size="sm" />
        <div className="text-left">
          <div className="font-extrabold">{me.rank ? t("p.youAre", { ord: ordinal(lang, me.rank) }) : me.name}</div>
          <div className="text-sm text-brand-200">
            {t("p.pts", { n: (me.score ?? 0).toLocaleString(lang) })}
            {state.gap ? ` · ${t("p.behindShort", { n: state.gap.points.toLocaleString(lang), name: state.gap.name })}` : ""}
          </div>
        </div>
      </div>
    </main>
  );
}

function Final({ state, t, lang }: { state: PlayerState; t: T; lang: Lang }) {
  const me = state.me!;
  const medal = me.rank === 1 ? "🥇" : me.rank === 2 ? "🥈" : me.rank === 3 ? "🥉" : "🎉";
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 py-8 text-center">
      <Brand small />
      <div className="animate-pop text-7xl" aria-hidden>{medal}</div>
      <h1 className="text-3xl font-black">{me.rank === 1 ? t("p.won") : t("p.great")}</h1>
      <Avatar avatar={me.avatar} size="md" />
      <p className="text-xl font-extrabold">{me.name}</p>
      <div className="grid w-full grid-cols-3 gap-3">
        <Stat label={t("p.place")} value={me.rank ? ordinal(lang, me.rank) : "–"} />
        <Stat label={t("p.points")} value={(me.score ?? 0).toLocaleString(lang)} />
        <Stat label={t("p.correctStat")} value={`${me.correct ?? 0}/${state.total}`} />
      </div>
      {state.top3 && (
        <ol className="w-full space-y-2 text-left">
          {state.top3.map((p, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-2">
              <span className="text-2xl" aria-hidden>{["🥇", "🥈", "🥉"][i]}</span>
              <Avatar avatar={p.avatar} size="sm" />
              <span className="flex-1 truncate font-bold">{p.name}</span>
              <span className="font-extrabold tabular-nums">{p.score.toLocaleString(lang)}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="text-sm text-brand-200">{t("p.thanks")}</p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-2 py-3">
      <div className="text-2xl font-black tabular-nums">{value}</div>
      <div className="text-xs font-bold uppercase tracking-wider text-brand-200">{label}</div>
    </div>
  );
}
