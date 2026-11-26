import { createGame } from "@/lib/game";
import { isLang } from "@/lib/i18n";
import { handle, json, readJson, requireHost } from "@/lib/api";
import { getStore } from "@/lib/store";

export const GET = handle(async (req: Request) => {
  requireHost(req);
  const games = await getStore().listGames();
  return json({
    games: games.map((g) => ({
      code: g.code, title: g.title, lang: g.lang, phase: g.phase, round: g.round, players: g.player_count, createdAt: g.created_at,
    })),
  });
});

export const POST = handle(async (req: Request) => {
  requireHost(req);
  const body = await readJson(req);
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 60) || null : null;
  const game = await createGame(title, isLang(body.lang) ? body.lang : "en");
  return json({ code: game.code });
});
