export const MAX_POINTS = 1000;
export const STREAK_STEP = 100;
export const STREAK_MAX = 500;
/** Extra time (ms) tolerated after the timer ends to absorb network latency. */
export const GRACE_MS = 600;
/** Show the leaderboard after every N questions. */
export const LEADERBOARD_EVERY = 2;

/** Kahoot-style: 1000 points for an instant answer, down to 500 at the buzzer. */
export function pointsFor(elapsedMs: number, limitMs: number): number {
  const t = Math.min(Math.max(elapsedMs, 0), limitMs) / limitMs;
  return Math.round(MAX_POINTS * (1 - t / 2));
}

/** Bonus for answering correctly after `previousStreak` correct answers in a row. */
export function streakBonus(previousStreak: number): number {
  return Math.min(STREAK_MAX, STREAK_STEP * Math.max(previousStreak, 0));
}

/** Number of consecutive correct answers ending at question `upTo` (inclusive). */
export function streakAt(correctByQuestion: Map<number, boolean>, upTo: number): number {
  let s = 0;
  for (let q = upTo; q >= 0; q--) {
    if (correctByQuestion.get(q)) s++;
    else break;
  }
  return s;
}
