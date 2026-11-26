import type { Lang } from "./i18n";

export type Phase = "lobby" | "question" | "answering" | "reveal" | "leaderboard" | "podium";

export interface Game {
  id: string;
  code: string;
  title: string | null;
  lang: Lang;
  phase: Phase;
  status: "active" | "archived";
  round: number;
  current_q: number;
  question_started_at: number | null; // epoch ms
  question_ends_at: number | null; // epoch ms
  finished_at: number | null;
  created_at: number;
}

export interface Player {
  id: string;
  game_id: string;
  name: string;
  avatar: string;
  token: string;
  joined_at: number;
}

export interface Answer {
  id: string;
  game_id: string;
  player_id: string | null;
  player_name: string;
  player_avatar: string;
  round: number;
  question_index: number;
  choice: number;
  is_correct: boolean;
  elapsed_ms: number;
  points: number;
}

export type NewAnswer = Omit<Answer, "id">;

export interface Standing {
  playerId: string;
  name: string;
  avatar: string;
  score: number;
  correct: number;
  totalTimeMs: number;
  rank: number;
  /** Positive = moved up since the previous leaderboard. */
  change?: number;
}

/* ---------- Views sent to clients (never contain the correct answer early) ---------- */

export interface PublicQuestion {
  index: number;
  total: number;
  level: string;
  topic: string;
  type: "multiple" | "truefalse";
  text: string;
  options: string[];
}

export interface BaseState {
  serverNow: number;
  code: string;
  title: string | null;
  lang: Lang;
  phase: Phase;
  round: number;
  qIndex: number;
  total: number;
  startedAt: number | null;
  endsAt: number | null;
  timeLimitMs: number;
  playerCount: number;
}

export interface SnapshotRow {
  label: string;
  pct: number;
}

export interface Snapshot {
  overallPct: number;
  profile: "AI Curious" | "AI Practitioner" | "AI Builder";
  profileHint: string;
  byLevel: SnapshotRow[];
  byTopic: SnapshotRow[];
  hardest: { id: number; text: string; pct: number; avgSec: number } | null;
  easiest: { id: number; text: string; pct: number; avgSec: number } | null;
  perQuestion: { id: number; level: string; topic: string; text: string; pct: number; avgSec: number }[];
}

export interface HostState extends BaseState {
  players: { id: string; name: string; avatar: string }[];
  question: PublicQuestion | null;
  answered: number;
  // reveal
  correctIndex?: number;
  explanation?: string;
  distribution?: number[];
  // leaderboard / podium
  leaderboard?: Standing[];
  standings?: Standing[];
  snapshot?: Snapshot;
}

export interface PlayerMe {
  id: string;
  name: string;
  avatar: string;
  score?: number;
  rank?: number;
  correct?: number;
}

export interface PlayerResult {
  myChoice: number | null;
  isCorrect: boolean;
  points: number;
  streak: number;
  correctIndex: number;
  explanation: string;
  options: string[];
}

export interface PlayerState extends BaseState {
  me: PlayerMe | null;
  /** question meta, available from the "question" phase on */
  question: { index: number; total: number; level: string; type: "multiple" | "truefalse"; options?: string[] } | null;
  myChoice: number | null;
  result?: PlayerResult;
  gap?: { name: string; points: number } | null;
  top3?: { name: string; avatar: string; score: number }[];
  joinOpen: boolean;
}
