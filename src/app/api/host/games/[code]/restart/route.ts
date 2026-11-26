import { HttpError, loadGame, restartGame } from "@/lib/game";
import { handle, json, readJson, requireHost, type Ctx } from "@/lib/api";

export const POST = handle(async (req: Request, { params }: Ctx) => {
  requireHost(req);
  const { mode } = await readJson(req);
  if (mode !== "same_players" && mode !== "fresh") throw new HttpError(400, "bad_mode");
  const game = await restartGame(await loadGame((await params).code), mode);
  return json({ ok: true, round: game.round });
});
