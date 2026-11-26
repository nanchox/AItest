"use client";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import type { Lang, T } from "@/lib/i18n";
import type { HostState, Snapshot, Standing } from "@/lib/types";

const COLORS = ["#500a78", "#8c41de", "#c8a5ff", "#1db44c"];

function Column({ s, place, shown, t, lang }: { s?: Standing; place: 1 | 2 | 3; shown: boolean; t: T; lang: Lang }) {
  const height = { 1: "h-72", 2: "h-52", 3: "h-40" }[place];
  const medal = { 1: "🥇", 2: "🥈", 3: "🥉" }[place];
  const tone = { 1: "from-yellow-300 to-yellow-500", 2: "from-slate-200 to-slate-400", 3: "from-orange-300 to-orange-600" }[place];
  if (!s) return <div className="w-[30%]" />;
  return (
    <div className="flex w-[30%] flex-col items-center justify-end gap-2">
      <div className={`flex flex-col items-center gap-1 text-center transition-all duration-700 ${shown ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
        <span className="text-5xl" aria-hidden>{medal}</span>
        <Avatar avatar={s.avatar} size={place === 1 ? "xl" : "lg"} />
        <span className="max-w-full truncate text-[clamp(1.2rem,2.2vw,2.2rem)] font-black">{s.name}</span>
        <span className="text-xl font-extrabold tabular-nums text-brand-200">{t("p.pts", { n: s.score.toLocaleString(lang) })}</span>
      </div>
      <div className={`flex w-full items-start justify-center rounded-t-2xl bg-gradient-to-b ${tone} pt-3 text-6xl font-black text-brand-900 transition-all duration-700 ${shown ? height : "h-0 overflow-hidden"}`}>
        {place}
      </div>
    </div>
  );
}

export function Podium({ standings, t, lang }: { standings: Standing[]; t: T; lang: Lang }) {
  const [step, setStep] = useState(0); // 0 nothing, 1 third, 2 second, 3 winner
  useEffect(() => {
    const t = [setTimeout(() => setStep(1), 700), setTimeout(() => setStep(2), 2600), setTimeout(() => setStep(3), 4800)];
    return () => t.forEach(clearTimeout);
  }, []);
  useEffect(() => {
    if (step !== 3) return;
    let stop = false;
    import("canvas-confetti").then(({ default: confetti }) => {
      const end = Date.now() + 3500;
      const frame = () => {
        if (stop) return;
        confetti({ particleCount: 5, angle: 60, spread: 65, origin: { x: 0, y: 0.7 }, colors: COLORS });
        confetti({ particleCount: 5, angle: 120, spread: 65, origin: { x: 1, y: 0.7 }, colors: COLORS });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    });
    return () => { stop = true; };
  }, [step]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <h1 className="text-[clamp(2.2rem,5vw,5rem)] font-black">{t("pod.title")}</h1>
      <div className="flex w-full max-w-4xl items-end justify-center gap-4">
        <Column s={standings[1]} place={2} shown={step >= 2} t={t} lang={lang} />
        <Column s={standings[0]} place={1} shown={step >= 3} t={t} lang={lang} />
        <Column s={standings[2]} place={3} shown={step >= 1} t={t} lang={lang} />
      </div>
    </div>
  );
}

export function FullRanking({ standings, t, lang }: { standings: Standing[]; t: T; lang: Lang }) {
  return (
    <div className="max-h-[60vh] overflow-y-auto rounded-2xl bg-white/10 p-4 ring-1 ring-white/20">
      <table className="w-full text-left text-lg">
        <thead className="text-sm uppercase tracking-wider text-brand-200">
          <tr><th className="px-2 py-1">#</th><th className="px-2">{t("pod.player")}</th><th className="px-2 text-right">{t("pod.correct")}</th><th className="px-2 text-right">{t("pod.points")}</th></tr>
        </thead>
        <tbody>
          {standings.map((s) => (
            <tr key={s.playerId} className="border-t border-white/10">
              <td className="px-2 py-2 font-black">{s.rank}</td>
              <td className="px-2"><span className="mr-2 inline-block align-middle"><Avatar avatar={s.avatar} size="sm" /></span><span className="font-bold">{s.name}</span></td>
              <td className="px-2 text-right tabular-nums">{s.correct}</td>
              <td className="px-2 text-right font-extrabold tabular-nums">{s.score.toLocaleString(lang)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Bars({ rows, t, kind }: { rows: { label: string; pct: number }[]; t: T; kind: "level" | "topic" }) {
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-0.5 flex justify-between text-sm font-bold"><span>{t(`${kind}.${r.label}`)}</span><span className="tabular-nums">{r.pct}%</span></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/15" role="img" aria-label={t("snap.pctAria", { label: t(`${kind}.${r.label}`), n: r.pct })}>
            <div className={`h-full rounded-full ${r.pct >= 70 ? "bg-success" : r.pct >= 40 ? "bg-brand-200" : "bg-ans-amber"}`} style={{ width: `${r.pct}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TeamSnapshot({ snap, t }: { snap: Snapshot; t: T }) {
  return (
    <div className="grid max-h-[calc(100dvh-14rem)] gap-5 overflow-y-auto rounded-2xl bg-white/10 p-5 ring-1 ring-white/20 lg:grid-cols-3">
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-brand-200">{t("snap.title")}</p>
        <p className="text-7xl font-black tabular-nums">{snap.overallPct}%</p>
        <p className="rounded-full bg-success px-5 py-1.5 text-xl font-black">{t(`profile.${snap.profile}`)}</p>
        <p className="text-base font-semibold text-brand-200">{t(`profile.${snap.profile}.hint`)}</p>
      </div>
      <div className="space-y-4">
        <div><h3 className="mb-1.5 text-lg font-black">{t("snap.byLevel")}</h3><Bars rows={snap.byLevel} t={t} kind="level" /></div>
        <div><h3 className="mb-2 text-lg font-black">{t("snap.byTopic")}</h3><Bars rows={snap.byTopic} t={t} kind="topic" /></div>
      </div>
      <div className="space-y-4 text-base">
        {snap.hardest && (
          <div className="rounded-xl bg-ans-amber/20 p-3"><p className="font-black">{t("snap.hardest", { n: snap.hardest.pct })}</p><p className="font-semibold">{snap.hardest.text}</p></div>
        )}
        {snap.easiest && (
          <div className="rounded-xl bg-success/25 p-3"><p className="font-black">{t("snap.easiest", { n: snap.easiest.pct })}</p><p className="font-semibold">{snap.easiest.text}</p></div>
        )}
        <p className="text-sm text-brand-200">{t("snap.groupOnly")}</p>
      </div>
    </div>
  );
}

export function PodiumActions(props: {
  state: HostState; view: "podium" | "ranking" | "snapshot"; setView: (v: "podium" | "ranking" | "snapshot") => void;
  onRestart: () => void; t: T;
}) {
  const { state, view, setView, onRestart, t } = props;
  const toggle = (v: "ranking" | "snapshot") => setView(view === v ? "podium" : v);
  const base = `/api/host/games/${state.code}/export?round=${state.round}`;
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button variant={view === "ranking" ? "light" : "secondary"} onClick={() => toggle("ranking")}>{t("pod.fullRanking")}</Button>
      <Button variant={view === "snapshot" ? "light" : "secondary"} onClick={() => toggle("snapshot")}>{t("pod.snapshot")}</Button>
      <a href={base} className="rounded-xl bg-white/15 px-5 py-3 font-extrabold ring-1 ring-white/30 hover:bg-white/25">{t("pod.exportCsv")}</a>
      <a href={`${base}&kind=summary`} className="rounded-xl bg-white/15 px-5 py-3 font-extrabold ring-1 ring-white/30 hover:bg-white/25">{t("pod.exportSummary")}</a>
      <Button variant="secondary" onClick={onRestart}>{t("h.restart")}</Button>
      <a href="/host" className="rounded-xl bg-success px-5 py-3 font-extrabold hover:brightness-110">{t("pod.newSession")}</a>
    </div>
  );
}
