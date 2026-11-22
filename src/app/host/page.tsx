"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RestartDialog } from "@/components/host/RestartDialog";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/client";

interface Row {
  code: string;
  title: string | null;
  phase: string;
  round: number;
  players: number;
  createdAt: number;
}

const PHASE_LABEL: Record<string, string> = {
  lobby: "Lobby", question: "In progress", answering: "In progress", reveal: "In progress", leaderboard: "In progress", podium: "Finished",
};

export default function HostHome() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    api<{ host: boolean }>("/api/host/me").then((r) => setAuthed(r.host)).catch(() => setAuthed(false));
  }, []);

  if (authed === null) return <main className="flex min-h-dvh items-center justify-center text-xl font-bold text-brand-200">Loading…</main>;
  if (!authed) return <Login onDone={() => setAuthed(true)} />;
  return <Sessions onOpen={(c) => router.push(`/host/${c}`)} onLogout={() => setAuthed(false)} />;
}

function Login({ onDone }: { onDone: () => void }) {
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
      setError(err instanceof ApiError ? err.message : "Connection problem.");
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-6 px-6">
      <Brand />
      <form onSubmit={submit} className="w-full space-y-4">
        <label htmlFor="pw" className="block text-center text-lg font-bold text-brand-200">Host password</label>
        <input
          id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus autoComplete="current-password"
          className="w-full rounded-2xl bg-white px-4 py-4 text-xl font-bold text-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-200"
        />
        {error && <p role="alert" className="text-center font-semibold text-amber-300">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy || !password}>Enter</Button>
      </form>
    </main>
  );
}

function Sessions({ onOpen, onLogout }: { onOpen: (code: string) => void; onLogout: () => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [restartCode, setRestartCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows((await api<{ games: Row[] }>("/api/host/games")).games);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) onLogout();
      else setError("Could not load sessions.");
    }
  }, [onLogout]);
  useEffect(() => { load(); }, [load]);

  async function create() {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ code: string }>("/api/host/games", { body: { title } });
      onOpen(r.code);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not create the game.");
      setBusy(false);
    }
  }
  async function archive(code: string) {
    if (!window.confirm(`Archive session ${code}? It will disappear from this list.`)) return;
    await api(`/api/host/games/${code}/archive`, { body: {} }).catch(() => {});
    load();
  }
  async function logout() {
    await api("/api/host/logout", { body: {} }).catch(() => {});
    onLogout();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-8 px-5 py-8">
      <header className="flex items-center justify-between">
        <Brand small />
        <button onClick={logout} className="text-sm font-bold text-brand-200 underline">Log out</button>
      </header>

      <section className="rounded-3xl bg-white/10 p-6 ring-1 ring-white/20">
        <h1 className="mb-3 text-2xl font-black">New session</h1>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} placeholder="Optional label, e.g. Group A – Morning"
            aria-label="Session label"
            className="flex-1 rounded-xl bg-white px-4 py-3 text-lg font-semibold text-brand-900 placeholder:text-brand-600/60 focus:outline-none focus:ring-4 focus:ring-brand-200"
          />
          <Button size="lg" onClick={create} disabled={busy}>{busy ? "Creating…" : "Create game"}</Button>
        </div>
        {error && <p role="alert" className="mt-3 font-semibold text-amber-300">{error}</p>}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-black">Sessions</h2>
        {rows === null ? <p className="text-brand-200">Loading…</p> : rows.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-white/25 p-8 text-center font-semibold text-brand-200">No sessions yet. Create your first game above.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.code} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/20">
                <span className="rounded-lg bg-white px-3 py-1 text-xl font-black tracking-[0.2em] text-brand-900">{r.code}</span>
                <div className="min-w-40 flex-1">
                  <div className="font-extrabold">{r.title || "Untitled session"}</div>
                  <div className="text-sm text-brand-200">
                    {PHASE_LABEL[r.phase]} · Round {r.round} · {r.players} player{r.players === 1 ? "" : "s"} · {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
                <Button size="sm" onClick={() => onOpen(r.code)}>Open</Button>
                <a href={`/api/host/games/${r.code}/export?round=${r.round}`} className="rounded-xl bg-white/15 px-3 py-1.5 text-sm font-extrabold ring-1 ring-white/30 hover:bg-white/25">Export CSV</a>
                <Button size="sm" variant="secondary" onClick={() => setRestartCode(r.code)}>Restart</Button>
                <Button size="sm" variant="secondary" onClick={() => archive(r.code)}>Archive</Button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Link href="/" className="text-center text-sm text-brand-200 underline">Player join page</Link>

      {restartCode && (
        <RestartDialog code={restartCode} onClose={() => setRestartCode(null)} onDone={() => { setRestartCode(null); load(); }} />
      )}
    </main>
  );
}
