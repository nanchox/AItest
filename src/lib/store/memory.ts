import { randomUUID } from "node:crypto";
import type { Answer, Game, NewAnswer, Player } from "../types";
import type { GamePatch, Store } from "./types";

interface Db {
  games: Game[];
  players: Player[];
  answers: Answer[];
}

// Survives hot reloads in `next dev`. Local development / tests only.
const g = globalThis as unknown as { __quizMemoryDb?: Db };
const db: Db = (g.__quizMemoryDb ??= { games: [], players: [], answers: [] });

export const memoryStore: Store = {
  async createGame(code, title) {
    if (db.games.some((x) => x.code === code)) return null;
    const game: Game = {
      id: randomUUID(), code, title, phase: "lobby", status: "active", round: 1, current_q: -1,
      question_started_at: null, question_ends_at: null, finished_at: null, created_at: Date.now(),
    };
    db.games.push(game);
    return { ...game };
  },
  async getGameByCode(code) {
    const x = db.games.find((y) => y.code === code);
    return x ? { ...x } : null;
  },
  async listGames() {
    return db.games
      .filter((x) => x.status === "active")
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 50)
      .map((x) => ({ ...x, player_count: db.players.filter((p) => p.game_id === x.id).length }));
  },
  async updateGame(id, patch: GamePatch, expectPhase) {
    const x = db.games.find((y) => y.id === id);
    if (!x) return null;
    if (expectPhase && x.phase !== expectPhase) return null;
    Object.assign(x, patch);
    return { ...x };
  },

  async addPlayer(p) {
    if (db.players.some((x) => x.game_id === p.game_id && x.name.toLowerCase() === p.name.toLowerCase())) return "duplicate";
    const player: Player = { id: randomUUID(), ...p, joined_at: Date.now() };
    db.players.push(player);
    return { ...player };
  },
  async getPlayer(id) {
    const x = db.players.find((y) => y.id === id);
    return x ? { ...x } : null;
  },
  async listPlayers(gameId) {
    return db.players.filter((x) => x.game_id === gameId).sort((a, b) => a.joined_at - b.joined_at).map((x) => ({ ...x }));
  },
  async removePlayer(id) {
    db.answers = db.answers.filter((a) => a.player_id !== id);
    db.players = db.players.filter((p) => p.id !== id);
  },
  async removeAllPlayers(gameId) {
    const ids = new Set(db.players.filter((p) => p.game_id === gameId).map((p) => p.id));
    for (const a of db.answers) if (a.player_id && ids.has(a.player_id)) a.player_id = null;
    db.players = db.players.filter((p) => p.game_id !== gameId);
  },

  async insertAnswer(a: NewAnswer) {
    if (db.answers.some((x) => x.player_id === a.player_id && x.round === a.round && x.question_index === a.question_index)) return false;
    db.answers.push({ id: randomUUID(), ...a });
    return true;
  },
  async listAnswers(gameId, round, filter) {
    return db.answers
      .filter((a) => a.game_id === gameId && a.round === round)
      .filter((a) => (filter?.q === undefined ? true : a.question_index === filter.q))
      .filter((a) => (filter?.playerId ? a.player_id === filter.playerId : true))
      .map((a) => ({ ...a }));
  },
};
