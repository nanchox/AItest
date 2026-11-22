"use client";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { AVATARS } from "@/lib/avatars";
import { api, ApiError } from "@/lib/client";

export interface Session {
  playerId: string;
  token: string;
}

export function JoinForm({ code, notice, onJoined }: { code: string; notice?: string; onJoined: (s: Session) => void }) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api<{ playerId: string; token: string }>("/api/join", { body: { code, name, avatar } });
      onJoined({ playerId: r.playerId, token: r.token });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Connection problem. Try again.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 px-5 py-6">
      <Brand small />
      <p className="text-center text-sm font-bold uppercase tracking-widest text-brand-200">
        Game <span className="rounded-md bg-white/15 px-2 py-1 text-white">{code}</span>
      </p>
      {notice && <p role="status" className="rounded-xl bg-amber-300/20 px-4 py-3 text-center text-sm font-semibold text-amber-200">{notice}</p>}
      <form onSubmit={submit} className="space-y-6">
        <div>
          <label htmlFor="name" className="mb-2 block text-lg font-bold">Your name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
            autoComplete="off"
            placeholder="e.g. Ana"
            className="w-full rounded-2xl bg-white px-4 py-4 text-2xl font-bold text-brand-900 placeholder:text-brand-200 focus:outline-none focus:ring-4 focus:ring-brand-200"
          />
        </div>
        <fieldset>
          <legend className="mb-2 text-lg font-bold">Pick your animal</legend>
          <div className="grid grid-cols-4 gap-3">
            {AVATARS.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => setAvatar(a.key)}
                aria-label={a.label}
                aria-pressed={avatar === a.key}
                className={`flex items-center justify-center rounded-2xl p-1 transition ${avatar === a.key ? "scale-110 bg-white ring-4 ring-success" : "bg-white/10 hover:bg-white/20"}`}
              >
                <Avatar avatar={a.key} size="sm" className="!shadow-none" />
              </button>
            ))}
          </div>
        </fieldset>
        {error && <p role="alert" className="text-center font-semibold text-amber-300">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy || !name.trim() || !avatar}>
          {busy ? "Joining…" : "Let's go!"}
        </Button>
      </form>
    </main>
  );
}
