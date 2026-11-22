import { hostState, loadGame } from "@/lib/game";
import { handle, json, requireHost, type Ctx } from "@/lib/api";

export const GET = handle(async (req: Request, { params }: Ctx) => {
  requireHost(req);
  const game = await loadGame((await params).code);
  return json(await hostState(game));
});
