import { kickPlayer, loadGame } from "@/lib/game";
import { handle, json, readJson, requireHost, type Ctx } from "@/lib/api";

export const POST = handle(async (req: Request, { params }: Ctx) => {
  requireHost(req);
  const { playerId } = await readJson(req);
  if (typeof playerId === "string") await kickPlayer(await loadGame((await params).code), playerId);
  return json({ ok: true });
});
