import { archiveGame, loadGame } from "@/lib/game";
import { handle, json, requireHost, type Ctx } from "@/lib/api";

export const POST = handle(async (req: Request, { params }: Ctx) => {
  requireHost(req);
  await archiveGame(await loadGame((await params).code));
  return json({ ok: true });
});
