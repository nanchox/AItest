import type { Answer, Game, NewAnswer, Phase, Player } from "../types";

export type GamePatch = Partial<
  Pick<Game, "title" | "phase" | "status" | "round" | "current_q" | "question_started_at" | "question_ends_at" | "finished_at">
>;

export interface Store {
  /** Returns null when the code is already taken. */
  createGame(code: string, title: string | null): Promise<Game | null>;
  getGameByCode(code: string): Promise<Game | null>;
  listGames(): Promise<(Game & { player_count: number })[]>;
  /** When `expectPhase` is given the update only applies if the game is still in that phase. */
  updateGame(id: string, patch: GamePatch, expectPhase?: Phase): Promise<Game | null>;

  addPlayer(p: { game_id: string; name: string; avatar: string; token: string }): Promise<Player | "duplicate">;
  getPlayer(id: string): Promise<Player | null>;
  listPlayers(gameId: string): Promise<Player[]>;
  /** Removes the player and the answers they gave. */
  removePlayer(id: string): Promise<void>;
  /** Removes all players but keeps past answers (detached) so old rounds can still be exported. */
  removeAllPlayers(gameId: string): Promise<void>;

  /** Returns false when this player already answered this question in this round. */
  insertAnswer(a: NewAnswer): Promise<boolean>;
  listAnswers(gameId: string, round: number, filter?: { q?: number; playerId?: string }): Promise<Answer[]>;
}
