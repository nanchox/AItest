"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/client";

export function RestartDialog({ code, onClose, onDone }: { code: string; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function restart(mode: "same_players" | "fresh") {
    setBusy(true);
    setError("");
    try {
      await api(`/api/host/games/${code}/restart`, { body: { mode } });
      onDone();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not restart.");
      setBusy(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="restart-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg space-y-4 rounded-3xl bg-brand-800 p-6 ring-1 ring-white/20">
        <h2 id="restart-title" className="text-2xl font-black">Restart game {code}</h2>
        <p className="text-brand-200">Results of the previous round stay available for export.</p>
        <button
          disabled={busy}
          onClick={() => restart("same_players")}
          className="w-full rounded-2xl bg-white/10 p-4 text-left ring-1 ring-white/20 transition hover:bg-white/20 disabled:opacity-50"
        >
          <div className="text-lg font-extrabold">🔁 Same players</div>
          <div className="text-sm text-brand-200">Keep everyone in the lobby. Scores go back to 0.</div>
        </button>
        <button
          disabled={busy}
          onClick={() => restart("fresh")}
          className="w-full rounded-2xl bg-white/10 p-4 text-left ring-1 ring-white/20 transition hover:bg-white/20 disabled:opacity-50"
        >
          <div className="text-lg font-extrabold">🧹 Empty lobby</div>
          <div className="text-sm text-brand-200">Same code, but everyone has to join again.</div>
        </button>
        {error && <p role="alert" className="font-semibold text-amber-300">{error}</p>}
        <div className="text-right"><Button variant="secondary" onClick={onClose}>Cancel</Button></div>
      </div>
    </div>
  );
}
