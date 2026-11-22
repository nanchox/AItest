import { loadGame, playerState } from "@/lib/game";
import { handle, json, type Ctx } from "@/lib/api";
import { normalizeCode } from "@/lib/code";

export const GET = handle(async (req: Request, { params }: Ctx) => {
  const game = await loadGame(normalizeCode((await params).code));
  const url = new URL(req.url);
  return json(await playerState(game, url.searchParams.get("playerId"), req.headers.get("x-player-token")));
});
