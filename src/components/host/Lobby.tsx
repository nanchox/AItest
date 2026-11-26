"use client";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Avatar } from "@/components/ui/Avatar";
import { api } from "@/lib/client";
import type { T } from "@/lib/i18n";
import type { HostState } from "@/lib/types";

export function Lobby({ state, onChanged, t }: { state: HostState; onChanged: () => void; t: T }) {
  const [origin, setOrigin] = useState(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SITE_URL) setOrigin(window.location.origin);
  }, []);
  const base = origin.replace(/\/$/, "");
  const joinUrl = `${base}/?code=${state.code}`;

  async function kick(id: string) {
    await api(`/api/host/games/${state.code}/kick`, { body: { playerId: id } }).catch(() => {});
    onChanged();
  }

  return (
    <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(320px,32%)_1fr]">
      <section className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-white/10 p-6 ring-1 ring-white/20">
        <p className="text-center text-lg font-bold text-brand-200">{t("h.scan")}</p>
        <p className="break-all text-center text-xl font-extrabold">{base.replace(/^https?:\/\//, "") || "…"}</p>
        <div className="rounded-2xl bg-white p-4">
          {base && <QRCodeSVG value={joinUrl} size={260} fgColor="#500a78" bgColor="#ffffff" level="M" />}
        </div>
        <p className="text-lg font-bold text-brand-200">{t("h.gameCode")}</p>
        <p className="text-[clamp(3rem,7vw,6rem)] font-black leading-none tracking-[0.2em]" aria-label={`${t("h.gameCode")} ${state.code.split("").join(" ")}`}>
          {state.code}
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-3xl font-black">{t("h.players")}</h2>
          <span className="rounded-full bg-white/15 px-4 py-1 text-xl font-extrabold tabular-nums">{state.players.length}</span>
        </div>
        {state.players.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-3xl border-2 border-dashed border-white/30 p-10 text-center text-2xl font-bold text-brand-200">
            <span className="animate-tick">{t("h.waitingPlayers")}</span>
          </div>
        ) : (
          <ul className="flex flex-wrap content-start gap-3 overflow-y-auto">
            {state.players.map((p) => (
              <li key={p.id} className="group relative flex animate-pop items-center gap-3 rounded-full bg-white/15 py-1.5 pl-1.5 pr-5 ring-1 ring-white/20">
                <Avatar avatar={p.avatar} size="sm" />
                <span className="max-w-40 truncate text-lg font-extrabold">{p.name}</span>
                <button
                  onClick={() => kick(p.id)}
                  aria-label={t("h.remove", { name: p.name })}
                  className="absolute -right-1 -top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-ans-red text-sm font-black group-hover:flex focus-visible:flex"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
