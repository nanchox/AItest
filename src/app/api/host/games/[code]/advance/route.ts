import { advance, hostState, HttpError, loadGame, type Action } from "@/lib/game";
import { handle, json, readJson, requireHost, type Ctx } from "@/lib/api";

const ACTIONS: Action[] = ["start", "open", "reveal", "next"];

export const POST = handle(async (req: Request, { params }: Ctx) => {
  requireHost(req);
  const { action } = await readJson(req);
  if (typeof action !== "string" || !ACTIONS.includes(action as Action)) throw new HttpError(400, "bad_action");
  const game = await advance(await loadGame((await params).code), action as Action);
  return json(await hostState(game));
});
