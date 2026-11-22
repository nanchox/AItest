import "server-only";
import { QUESTIONS, type Question } from "@/data/questions";
import { generateCode, generateToken, isValidCode } from "./code";
import { AVATAR_KEYS } from "./avatars";
import { validateName } from "./names";
import { GRACE_MS, LEADERBOARD_EVERY, pointsFor, streakAt, streakBonus } from "./scoring";
import { computeStandings, withChanges } from "./standings";
import { getStore } from "./store";
import { notifyGame } from "./realtime";
import type {
  Answer, BaseState, Game, HostState, Phase, Player, PlayerState, PublicQuestion, Snapshot, SnapshotRow, Standing,
} from "./types";

export const TOTAL = QUESTIONS.length;

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const questionAt = (i: number): Question | null => QUESTIONS[i] ?? null;

function publicQuestion(i: number): PublicQuestion | null {
  const q = questionAt(i);
  if (!q) return null;
  return { index: i, total: TOTAL, level: q.level, topic: q.topic, type: q.type, text: q.text, options: q.options };
}

export async function loadGame(code: string): Promise<Game> {
  if (!isValidCode(code)) throw new HttpError(404, "Game not found.");
  const game = await getStore().getGameByCode(code);
  if (!game) throw new HttpError(404, "Game not found.");
  return game;
}

function base(game: Game, playerCount: number): BaseState {
  const q = questionAt(game.current_q);
  return {
    serverNow: Date.now(), code: game.code, title: game.title, phase: game.phase, round: game.round,
    qIndex: game.current_q, total: TOTAL, startedAt: game.question_started_at, endsAt: game.question_ends_at,
    timeLimitMs: (q?.timeLimitSec ?? 20) * 1000, playerCount,
  };
}

/* ------------------------------------------------------------------ host actions */

export async function createGame(title: string | null): Promise<Game> {
  const store = getStore();
  for (let i = 0; i < 10; i++) {
    const game = await store.createGame(generateCode(), title);
    if (game) return game;
  }
  throw new Error("Could not generate a unique game code.");
}

export type Action = "start" | "open" | "reveal" | "next";

/** Moves the game forward. Idempotent: an action that does not match the current phase is a no-op. */
export async function advance(game: Game, action: Action): Promise<Game> {
  const store = getStore();
  const now = Date.now();
  let patch: Parameters<typeof store.updateGame>[1] | null = null;
  let from: Phase | null = null;

  if (action === "start" && game.phase === "lobby") {
    const players = await store.listPlayers(game.id);
    if (players.length === 0) throw new HttpError(409, "Wait for at least one player to join.");
    from = "lobby";
    patch = { phase: "question", current_q: 0, question_started_at: null, question_ends_at: null, finished_at: null };
  } else if (action === "open" && game.phase === "question") {
    const q = questionAt(game.current_q);
    if (!q) throw new HttpError(409, "No such question.");
    from = "question";
    patch = { phase: "answering", question_started_at: now, question_ends_at: now + q.timeLimitSec * 1000 };
  } else if (action === "reveal" && game.phase === "answering") {
    from = "answering";
    patch = { phase: "reveal" };
  } else if (action === "next" && game.phase === "reveal") {
    from = "reveal";
    if (game.current_q >= TOTAL - 1) patch = { phase: "podium", finished_at: now };
    else if ((game.current_q + 1) % LEADERBOARD_EVERY === 0) patch = { phase: "leaderboard" };
    else patch = { phase: "question", current_q: game.current_q + 1, question_started_at: null, question_ends_at: null };
  } else if (action === "next" && game.phase === "leaderboard") {
    from = "leaderboard";
    patch = { phase: "question", current_q: game.current_q + 1, question_started_at: null, question_ends_at: null };
  }

  if (!patch || !from) return game; // no-op
  const updated = await store.updateGame(game.id, patch, from);
  if (updated) await notifyGame(game.code);
  return updated ?? (await loadGame(game.code));
}

export async function restartGame(game: Game, mode: "same_players" | "fresh"): Promise<Game> {
  const store = getStore();
  if (mode === "fresh") await store.removeAllPlayers(game.id);
  const updated = await store.updateGame(game.id, {
    phase: "lobby", round: game.round + 1, current_q: -1,
    question_started_at: null, question_ends_at: null, finished_at: null,
  });
  await notifyGame(game.code);
  return updated ?? game;
}

export async function kickPlayer(game: Game, playerId: string): Promise<void> {
  const store = getStore();
  const p = await store.getPlayer(playerId);
  if (!p || p.game_id !== game.id) return;
  await store.removePlayer(playerId);
  await notifyGame(game.code);
}

export async function archiveGame(game: Game): Promise<void> {
  await getStore().updateGame(game.id, { status: "archived" });
}

/* ------------------------------------------------------------------ player actions */

export async function joinGame(code: string, rawName: unknown, avatar: unknown) {
  const game = await loadGame(code);
  const v = validateName(rawName);
  if (!v.ok) throw new HttpError(400, v.error);
  if (typeof avatar !== "string" || !AVATAR_KEYS.includes(avatar)) throw new HttpError(400, "Pick an animal avatar.");
  if (!(game.phase === "lobby" || (game.current_q === 0 && game.phase !== "podium"))) {
    throw new HttpError(409, "This game is already in progress.");
  }
  const token = generateToken();
  const res = await getStore().addPlayer({ game_id: game.id, name: v.name, avatar, token });
  if (res === "duplicate") throw new HttpError(409, "That name is already taken. Try another one.");
  await notifyGame(game.code);
  return { playerId: res.id, token, name: res.name, avatar: res.avatar };
}

async function authPlayer(game: Game, playerId: unknown, token: unknown): Promise<Player | null> {
  if (typeof playerId !== "string" || typeof token !== "string" || playerId.length > 64) return null;
  const p = await getStore().getPlayer(playerId).catch(() => null);
  if (!p || p.game_id !== game.id || p.token !== token) return null;
  return p;
}

export async function submitAnswer(code: string, playerId: unknown, token: unknown, questionIndex: unknown, choice: unknown) {
  const store = getStore();
  const game = await loadGame(code);
  const player = await authPlayer(game, playerId, token);
  if (!player) throw new HttpError(401, "Please rejoin the game.");
  const q = questionAt(game.current_q);
  const now = Date.now();
  if (
    !q || game.phase !== "answering" || questionIndex !== game.current_q ||
    game.question_started_at === null || game.question_ends_at === null ||
    now > game.question_ends_at + GRACE_MS
  ) {
    throw new HttpError(409, "Time is up for this question.");
  }
  if (typeof choice !== "number" || !Number.isInteger(choice) || choice < 0 || choice >= q.options.length) {
    throw new HttpError(400, "Invalid choice.");
  }
  const limitMs = q.timeLimitSec * 1000;
  const elapsed = Math.min(Math.max(now - game.question_started_at, 0), limitMs);
  const isCorrect = choice === q.correct;

  let points = 0;
  if (isCorrect) {
    const mine = await store.listAnswers(game.id, game.round, { playerId: player.id });
    const map = new Map(mine.map((a) => [a.question_index, a.is_correct]));
    points = pointsFor(elapsed, limitMs) + streakBonus(streakAt(map, game.current_q - 1));
  }
  const inserted = await store.insertAnswer({
    game_id: game.id, player_id: player.id, player_name: player.name, player_avatar: player.avatar,
    round: game.round, question_index: game.current_q, choice, is_correct: isCorrect, elapsed_ms: elapsed, points,
  });
  if (!inserted) throw new HttpError(409, "You already answered this question.");
  return { locked: true };
}

/* ------------------------------------------------------------------ state views */

export async function hostState(game: Game): Promise<HostState> {
  const store = getStore();
  const players = await store.listPlayers(game.id);
  const s: HostState = {
    ...base(game, players.length),
    players: players.map((p) => ({ id: p.id, name: p.name, avatar: p.avatar })),
    question: game.phase === "question" || game.phase === "answering" || game.phase === "reveal" ? publicQuestion(game.current_q) : null,
    answered: 0,
  };
  const needsQuestionAnswers = game.phase === "answering" || game.phase === "reveal";
  const needsAll = game.phase === "reveal" || game.phase === "leaderboard" || game.phase === "podium";
  const answers = needsAll
    ? await store.listAnswers(game.id, game.round)
    : needsQuestionAnswers ? await store.listAnswers(game.id, game.round, { q: game.current_q }) : [];

  if (needsQuestionAnswers) s.answered = answers.filter((a) => a.question_index === game.current_q).length;

  if (game.phase === "reveal") {
    const q = questionAt(game.current_q)!;
    s.correctIndex = q.correct;
    s.explanation = q.explanation;
    const dist = q.options.map(() => 0);
    for (const a of answers) if (a.question_index === game.current_q && a.choice < dist.length) dist[a.choice]++;
    s.distribution = dist;
  }
  if (game.phase === "leaderboard" || game.phase === "podium") {
    const standings = computeStandings(players, answers);
    s.standings = game.phase === "leaderboard"
      ? withChanges(standings, players, answers, game.current_q - LEADERBOARD_EVERY)
      : standings;
    s.leaderboard = s.standings.slice(0, 5);
  }
  if (game.phase === "podium") s.snapshot = buildSnapshot(players.length, answers);
  return s;
}

export async function playerState(game: Game, playerId: unknown, token: unknown): Promise<PlayerState> {
  const store = getStore();
  const player = await authPlayer(game, playerId, token);
  const joinOpen = game.phase === "lobby" || (game.current_q === 0 && game.phase !== "podium");
  const q = questionAt(game.current_q);
  const playerCount = (await store.listPlayers(game.id)).length;
  const s: PlayerState = {
    ...base(game, playerCount),
    me: player ? { id: player.id, name: player.name, avatar: player.avatar } : null,
    question: null, myChoice: null, joinOpen,
  };
  if (!player || game.phase === "lobby" || !q) return s;

  s.question = { index: game.current_q, total: TOTAL, level: q.level, type: q.type };
  if (game.phase === "answering") {
    s.question.options = q.options; // texts only, never the correct index
    const mine = await store.listAnswers(game.id, game.round, { playerId: player.id, q: game.current_q });
    s.myChoice = mine[0]?.choice ?? null;
    return s;
  }
  if (game.phase === "question") return s;

  // reveal / leaderboard / podium need standings
  const [players, answers] = await Promise.all([store.listPlayers(game.id), store.listAnswers(game.id, game.round)]);
  const standings = computeStandings(players, answers);
  const mineRow = standings.find((r) => r.playerId === player.id);
  if (mineRow) s.me = { ...s.me!, score: mineRow.score, rank: mineRow.rank, correct: mineRow.correct };
  const ahead = mineRow && mineRow.rank > 1 ? standings[mineRow.rank - 2] : null;
  s.gap = ahead && mineRow ? { name: ahead.name, points: ahead.score - mineRow.score } : null;

  if (game.phase === "reveal") {
    const myAns = answers.find((a) => a.player_id === player.id && a.question_index === game.current_q);
    const map = new Map(answers.filter((a) => a.player_id === player.id).map((a) => [a.question_index, a.is_correct]));
    s.myChoice = myAns?.choice ?? null;
    s.result = {
      myChoice: myAns?.choice ?? null, isCorrect: myAns?.is_correct ?? false, points: myAns?.points ?? 0,
      streak: streakAt(map, game.current_q), correctIndex: q.correct, explanation: q.explanation, options: q.options,
    };
  }
  if (game.phase === "podium") {
    s.top3 = standings.slice(0, 3).map((r) => ({ name: r.name, avatar: r.avatar, score: r.score }));
  }
  return s;
}

/* ------------------------------------------------------------------ Team snapshot */

const pct = (num: number, den: number) => (den === 0 ? 0 : Math.round((num / den) * 100));

export function buildSnapshot(playerCount: number, answers: Answer[]): Snapshot {
  const per = QUESTIONS.map((q, i) => {
    const qa = answers.filter((a) => a.question_index === i);
    const correct = qa.filter((a) => a.is_correct).length;
    const avgSec = qa.length ? Math.round((qa.reduce((t, a) => t + a.elapsed_ms, 0) / qa.length / 1000) * 10) / 10 : 0;
    return { id: q.id, level: q.level, topic: q.topic, text: q.text, correct, pct: pct(correct, playerCount), avgSec };
  });
  const group = (key: "level" | "topic"): SnapshotRow[] => {
    const m = new Map<string, { c: number; n: number }>();
    for (const p of per) {
      const e = m.get(p[key]) ?? { c: 0, n: 0 };
      e.c += p.correct;
      e.n += playerCount;
      m.set(p[key], e);
    }
    return [...m.entries()].map(([label, e]) => ({ label, pct: pct(e.c, e.n) }));
  };
  const levelOrder = ["Basic", "Intermediate", "Advanced"];
  const byLevel = group("level").sort((a, b) => levelOrder.indexOf(a.label) - levelOrder.indexOf(b.label));
  const byTopic = group("topic").sort((a, b) => b.pct - a.pct);
  const overallPct = pct(per.reduce((t, p) => t + p.correct, 0), playerCount * QUESTIONS.length);
  const sorted = [...per].sort((a, b) => a.pct - b.pct || b.avgSec - a.avgSec);
  const row = (p: (typeof per)[number] | undefined) => (p ? { id: p.id, text: p.text, pct: p.pct, avgSec: p.avgSec } : null);
  const profile = overallPct < 40 ? "AI Curious" : overallPct <= 70 ? "AI Practitioner" : "AI Builder";
  const hints = {
    "AI Curious": "Strengthen the fundamentals: what AI can and cannot do, and how to write good prompts.",
    "AI Practitioner": "Solid everyday use. Next step: advanced prompting, working with your own documents and data safety.",
    "AI Builder": "Ready for the next level: agents, automation and building AI into your workflows.",
  } as const;
  return {
    overallPct, profile, profileHint: hints[profile], byLevel, byTopic,
    hardest: row(sorted[0]), easiest: row(sorted[sorted.length - 1]),
    perQuestion: per.map(({ id, level, topic, text, pct, avgSec }) => ({ id, level, topic, text, pct, avgSec })),
  };
}

/* ------------------------------------------------------------------ CSV export */

const csvCell = (v: string | number | boolean) => {
  const s = String(v);
  return /[",\n\r]/.test(s) || /^[=+\-@]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (rows: (string | number | boolean)[][]) => "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
const letter = (i: number) => "ABCD"[i] ?? "?";

export async function exportCsv(game: Game, round: number, kind: "results" | "summary") {
  const store = getStore();
  const answers = await store.listAnswers(game.id, round);
  const current = round === game.round;
  const players = current ? await store.listPlayers(game.id) : [];

  // Players are keyed by name inside a round (names are unique per game).
  const roster = new Map<string, { name: string; avatar: string; id: string }>();
  for (const p of players) roster.set(p.name.toLowerCase(), { name: p.name, avatar: p.avatar, id: p.id });
  if (!current) for (const a of answers) if (!roster.has(a.player_name.toLowerCase())) roster.set(a.player_name.toLowerCase(), { name: a.player_name, avatar: a.player_avatar, id: a.player_name.toLowerCase() });

  const norm = answers.map((a) => ({ ...a, player_id: roster.get(a.player_name.toLowerCase())?.id ?? null }));
  const list = [...roster.values()];
  const standings = computeStandings(list, norm);
  const file = `ai-quiz_${game.code}_round${round}_${new Date().toISOString().slice(0, 10)}`;

  if (kind === "summary") {
    const snap = buildSnapshot(list.length, norm);
    const rows: (string | number)[][] = [
      ["section", "label", "correct_pct", "avg_time_s", "detail"],
      ["overall", snap.profile, snap.overallPct, "", snap.profileHint],
      ...snap.byLevel.map((r) => ["level", r.label, r.pct, "", ""]),
      ...snap.byTopic.map((r) => ["topic", r.label, r.pct, "", ""]),
      ...snap.perQuestion.map((p) => ["question", `Q${p.id} (${p.level} / ${p.topic})`, p.pct, p.avgSec, p.text]),
    ];
    return { filename: `${file}_summary.csv`, body: csv(rows) };
  }

  const header: (string | number)[] = ["rank", "name", "avatar", "score", "correct", "total_time_s"];
  for (let i = 1; i <= TOTAL; i++) header.push(`q${i}_choice`, `q${i}_correct`, `q${i}_points`);
  const rows: (string | number | boolean)[][] = [header];
  for (const s of standings) {
    const mine = norm.filter((a) => a.player_id === s.playerId);
    const row: (string | number | boolean)[] = [s.rank, s.name, s.avatar, s.score, s.correct, Math.round(s.totalTimeMs / 100) / 10];
    for (let i = 0; i < TOTAL; i++) {
      const a = mine.find((x) => x.question_index === i);
      row.push(a ? letter(a.choice) : "", a ? (a.is_correct ? "TRUE" : "FALSE") : "", a ? a.points : "");
    }
    rows.push(row);
  }
  return { filename: `${file}.csv`, body: csv(rows) };
}

export type { Standing };
