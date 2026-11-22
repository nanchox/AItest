import { joinGame } from "@/lib/game";
import { handle, json, readJson } from "@/lib/api";
import { normalizeCode } from "@/lib/code";

export const POST = handle(async (req: Request) => {
  const body = await readJson(req);
  const code = normalizeCode(typeof body.code === "string" ? body.code : "");
  return json(await joinGame(code, body.name, body.avatar));
});
