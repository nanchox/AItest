"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RestartDialog } from "@/components/host/RestartDialog";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { LangToggle } from "@/components/ui/LangToggle";
import { api, ApiError, errMsg, useDocumentLang, useUiLang } from "@/lib/client";
import { makeT, type Lang, type T } from "@/lib/i18n";

interface Row {
  code: string;
  title: string | null;
  lang: Lang;
  phase: string;
  round: number;
  players: number;
  createdAt: number;
}

const PHASE_KEY: Record<string, string> = {
  lobby: "hl.phase.lobby", question: "hl.phase.running", answering: "hl.phase.running", reveal: "hl.phase.running",
  leaderboard: "hl.phase.running", podium: "hl.phase.done",
};

export default function HostHome() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [lang, setLang] = useUiLang();
  const t = useMemo(() => makeT(lang), [lang]);
  useDocumentLang(lang);

  useEffect(() => {
    api<{ host: boolean }>("/api/host/me").then((r) => setAuthed(r.host)).catch(() => setAuthed(false));
  }, []);

  if (authed === null) return <main className="flex min-h-dvh items-center justify-center text-xl font-bold text-brand-200">{t("loading")}</main>;
  if (!authed) return <Login t={t} lang={lang} setLang={setLang} onDone={() => setAuthed(true)} />;
  return <Sessions t={t} lang={lang} setLang={setLang} onOpen={(c) => router.push(`/host/${c}`)} onLogout={() => setAuthed(false)} />;
}

interface Props { t: T; lang: Lang; setLang: (l: Lang) => void }

function Login({ t, lang, setLang, onDone }: Props & { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/host/login", { body: { password } });
      onDone();
    } catch (err) {
      setError(errMsg(t, err));
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-6 px-6">
      <LangToggle lang={lang} onChange={setLang} className="absolute right-4 top-4" />
      <Brand />
      <form onSubmit={submit} className="w-full space-y-4">
        <label htmlFor="pw" className="block text-center text-lg font-bold text-brand-200">{t("hl.password")}</label>
        <input
          id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus autoComplete="current-password"
          className="w-full rounded-2xl bg-white px-4 py-4 text-xl font-bold text-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-200"
        />
        {error && <p role="alert" className="text-center font-semibold text-amber-300">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy || !password}>{t("hl.enter")}</Button>
      </form>
    </main>
  );
}

function Sessions({ t, lang, setLang, onOpen, onLogout }: Props & { onOpen: (code: string) => void; onLogout: () => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [title, setTitle] = useState("");
  const [gameLang, setGameLang] = useState<Lang | null>(null); // null = follow the panel language
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [restartCode, setRestartCode] = useState<string | null>(null);
  const newGameLang = gameLang ?? lang;

  const load = useCallback(async () => {
    try {
      setRows((await api<{ games: Row[] }>("/api/host/games")).games);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) onLogout();
      else setError(t("hl.loadFail"));
    }
  }, [onLogout, t]);
  useEffect(() => { load(); }, [load]);

  async function create() {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ code: string }>("/api/host/games", { body: { title, lang: newGameLang } });
      onOpen(r.code);
    } catch (e) {
      setError(errMsg(t, e) || t("hl.createFail"));
      setBusy(false);
    }
  }
  async function archive(code: string) {
    if (!window.confirm(t("hl.archiveConfirm", { code }))) return;
    await api(`/api/host/games/${code}/archive`, { body: {} }).catch(() => {});
    load();
  }
  async function logout() {
    await api("/api/host/logout", { body: {} }).catch(() => {});
    onLogout();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-8 px-5 py-8">
      <header className="flex items-center justify-between gap-3">
        <Brand small />
        <div className="flex items-center gap-4">
          <LangToggle lang={lang} onChange={setLang} />
          <button onClick={logout} className="text-sm font-bold text-brand-200 underline">{t("hl.logout")}</button>
        </div>
      </header>

      <section className="rounded-3xl bg-white/10 p-6 ring-1 ring-white/20">
        <h1 className="mb-3 text-2xl font-black">{t("hl.newSession")}</h1>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} placeholder={t("hl.labelPh")}
            aria-label={t("hl.labelAria")}
            className="flex-1 rounded-xl bg-white px-4 py-3 text-lg font-semibold text-brand-900 placeholder:text-brand-600/60 focus:outline-none focus:ring-4 focus:ring-brand-200"
          />
          <Button size="lg" onClick={create} disabled={busy}>{busy ? t("hl.creating") : t("hl.create")}</Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-bold text-brand-200">{t("hl.quick")}</span>
          {["hl.group1", "hl.group2"].map((k) => (
            <button key={k} type="button" onClick={() => setTitle(t(k))} className="rounded-full bg-white/15 px-3 py-1 font-bold ring-1 ring-white/30 hover:bg-white/25">
              {t(k)}
            </button>
          ))}
          <span className="text-brand-200">{t("hl.groupHint")}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="font-bold text-brand-200">{t("hl.gameLang")}</span>
          <LangToggle lang={newGameLang} onChange={setGameLang} />
          <span className="text-brand-200">{t("hl.langHint")}</span>
        </div>
        {error && <p role="alert" className="mt-3 font-semibold text-amber-300">{error}</p>}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-black">{t("hl.sessions")}</h2>
        {rows === null ? <p className="text-brand-200">{t("loading")}</p> : rows.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-white/25 p-8 text-center font-semibold text-brand-200">{t("hl.none")}</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.code} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/20">
                <span className="rounded-lg bg-white px-3 py-1 text-xl font-black tracking-[0.2em] text-brand-900">{r.code}</span>
                <div className="min-w-40 flex-1">
                  <div className="font-extrabold">
                    {r.title || t("hl.untitled")} <span className="ml-1 rounded bg-white/20 px-1.5 py-0.5 text-xs font-black">{r.lang.toUpperCase()}</span>
                  </div>
                  <div className="text-sm text-brand-200">
                    {t("hl.meta", {
                      phase: t(PHASE_KEY[r.phase] ?? "hl.phase.running"), round: r.round,
                      players: t("h.playersCount", { n: r.players }), date: new Date(r.createdAt).toLocaleString(lang),
                    })}
                  </div>
                </div>
                <Button size="sm" onClick={() => onOpen(r.code)}>{t("hl.open")}</Button>
                <a href={`/api/host/games/${r.code}/export?round=${r.round}`} className="rounded-xl bg-white/15 px-3 py-1.5 text-sm font-extrabold ring-1 ring-white/30 hover:bg-white/25">{t("pod.exportCsv")}</a>
                <Button size="sm" variant="secondary" onClick={() => setRestartCode(r.code)}>{t("h.restart")}</Button>
                <Button size="sm" variant="secondary" onClick={() => archive(r.code)}>{t("hl.archive")}</Button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Link href="/" className="text-center text-sm text-brand-200 underline">{t("hl.joinPage")}</Link>

      {restartCode && (
        <RestartDialog t={t} code={restartCode} onClose={() => setRestartCode(null)} onDone={() => { setRestartCode(null); load(); }} />
      )}
    </main>
  );
}
