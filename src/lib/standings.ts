import type { Answer, Standing } from "./types";

interface P {
  id: string;
  name: string;
  avatar: string;
}

/** Score = sum of points. Ties: more correct answers, then less total time, then name. */
export function computeStandings(players: P[], answers: Answer[], upToQuestion = Infinity): Standing[] {
  const byPlayer = new Map<string, { score: number; correct: number; time: number }>();
  for (const a of answers) {
    if (!a.player_id || a.question_index > upToQuestion) continue;
    const s = byPlayer.get(a.player_id) ?? { score: 0, correct: 0, time: 0 };
    s.score += a.points;
    s.correct += a.is_correct ? 1 : 0;
    s.time += a.elapsed_ms;
    byPlayer.set(a.player_id, s);
  }
  const rows = players.map((p) => {
    const s = byPlayer.get(p.id) ?? { score: 0, correct: 0, time: 0 };
    return { playerId: p.id, name: p.name, avatar: p.avatar, score: s.score, correct: s.correct, totalTimeMs: s.time, rank: 0 };
  });
  rows.sort((a, b) => b.score - a.score || b.correct - a.correct || a.totalTimeMs - b.totalTimeMs || a.name.localeCompare(b.name));
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

/** Adds `change` (positive = climbed) comparing against standings before `prevUpTo`. */
export function withChanges(current: Standing[], players: P[], answers: Answer[], prevUpTo: number): Standing[] {
  if (prevUpTo < 0) return current;
  const prev = new Map(computeStandings(players, answers, prevUpTo).map((s) => [s.playerId, s.rank]));
  return current.map((s) => ({ ...s, change: (prev.get(s.playerId) ?? s.rank) - s.rank }));
}
