import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Answer, Game, Player } from "../types";
import type { GamePatch, Store } from "./types";

let client: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

const ms = (v: string | null | undefined) => (v ? new Date(v).getTime() : null);
const iso = (v: number | null | undefined) => (v === null || v === undefined ? null : new Date(v).toISOString());

/* eslint-disable @typescript-eslint/no-explicit-any */
function toGame(r: any): Game {
  return {
    id: r.id, code: r.code, title: r.title, phase: r.phase, status: r.status, round: r.round, current_q: r.current_q,
    question_started_at: ms(r.question_started_at), question_ends_at: ms(r.question_ends_at),
    finished_at: ms(r.finished_at), created_at: ms(r.created_at)!,
  };
}
function toPlayer(r: any): Player {
  return { id: r.id, game_id: r.game_id, name: r.name, avatar: r.avatar, token: r.token, joined_at: ms(r.joined_at)! };
}
function toAnswer(r: any): Answer {
  return {
    id: r.id, game_id: r.game_id, player_id: r.player_id, player_name: r.player_name, player_avatar: r.player_avatar,
    round: r.round, question_index: r.question_index, choice: r.choice, is_correct: r.is_correct,
    elapsed_ms: r.elapsed_ms, points: r.points,
  };
}
function fail(error: { message: string } | null, what: string): asserts error is null {
  if (error) throw new Error(`Supabase ${what}: ${error.message}`);
}

export const supabaseStore: Store = {
  async createGame(code, title) {
    const { data, error } = await sb().from("games").insert({ code, title }).select().single();
    if (error?.code === "23505") return null;
    fail(error, "createGame");
    return toGame(data);
  },
  async getGameByCode(code) {
    const { data, error } = await sb().from("games").select("*").eq("code", code).maybeSingle();
    fail(error, "getGameByCode");
    return data ? toGame(data) : null;
  },
  async listGames() {
    const { data, error } = await sb()
      .from("games").select("*, players(count)").eq("status", "active")
      .order("created_at", { ascending: false }).limit(50);
    fail(error, "listGames");
    return (data ?? []).map((r: any) => ({ ...toGame(r), player_count: r.players?.[0]?.count ?? 0 }));
  },
  async updateGame(id, patch: GamePatch, expectPhase) {
    const row: Record<string, unknown> = { ...patch };
    for (const k of ["question_started_at", "question_ends_at", "finished_at"] as const) {
      if (k in patch) row[k] = iso(patch[k]);
    }
    let q = sb().from("games").update(row).eq("id", id);
    if (expectPhase) q = q.eq("phase", expectPhase);
    const { data, error } = await q.select().maybeSingle();
    fail(error, "updateGame");
    return data ? toGame(data) : null;
  },

  async addPlayer(p) {
    const { data, error } = await sb().from("players").insert(p).select().single();
    if (error?.code === "23505") return "duplicate";
    fail(error, "addPlayer");
    return toPlayer(data);
  },
  async getPlayer(id) {
    const { data, error } = await sb().from("players").select("*").eq("id", id).maybeSingle();
    fail(error, "getPlayer");
    return data ? toPlayer(data) : null;
  },
  async listPlayers(gameId) {
    const { data, error } = await sb().from("players").select("*").eq("game_id", gameId).order("joined_at");
    fail(error, "listPlayers");
    return (data ?? []).map(toPlayer);
  },
  async removePlayer(id) {
    const a = await sb().from("answers").delete().eq("player_id", id);
    fail(a.error, "removePlayer/answers");
    const { error } = await sb().from("players").delete().eq("id", id);
    fail(error, "removePlayer");
  },
  async removeAllPlayers(gameId) {
    // answers.player_id is "on delete set null": old answers stay for exports.
    const { error } = await sb().from("players").delete().eq("game_id", gameId);
    fail(error, "removeAllPlayers");
  },

  async insertAnswer(a) {
    const { error } = await sb().from("answers").insert(a);
    if (error?.code === "23505") return false;
    fail(error, "insertAnswer");
    return true;
  },
  async listAnswers(gameId, round, filter) {
    let q = sb().from("answers").select("*").eq("game_id", gameId).eq("round", round).limit(5000);
    if (filter?.q !== undefined) q = q.eq("question_index", filter.q);
    if (filter?.playerId) q = q.eq("player_id", filter.playerId);
    const { data, error } = await q;
    fail(error, "listAnswers");
    return (data ?? []).map(toAnswer);
  },
};
